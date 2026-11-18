import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { prayerOverridesTable, settingsTable } from '@/lib/db/schema';
import { seedDefaults } from '@/lib/db/seed';
import { buildDefaultPostersRows } from '@/lib/db/seed-records';
import { hashPin, verifyPin, isLegacySha256Hash } from '@/lib/auth/crypto';
import { resetAllRateLimits } from '@/lib/auth/rate-limit';
import * as authActions from '@/lib/actions/auth';
import { uploadPoster, duplicatePoster, deletePoster } from '@/lib/actions/posters';
import { upsertPrayerOverride } from '@/lib/actions/prayers';
import { bulkSetIqamahRange } from '@/lib/actions/prayer-schedules';
import { triggerPrayerSilenceAudioMute } from '@/lib/actions/hardware';
import {
  assertValidPosterId,
  getUploadDir,
  safeUnlinkUploadRelative,
} from '@/lib/posters/media-storage';
import {
  storeCustomFrameFile,
  removeCustomFrameFile,
  readCustomFramesMeta,
} from '@/lib/posters/custom-frames-store';
import { parseTimeToDate } from '@/lib/prayer/prayer-time-parser';
import { formatHijriDate } from '@/lib/prayer/hijri';
import { calculateDailySchedule, resolveNextPrayer } from '@/lib/prayer/prayer-engine';
import { normalizeTimeTo24h } from '@/lib/prayer/csv-parser';
import { parseCsvRowDate } from '@/lib/utils/time';
import { buildInitialStateFromPoster } from '@/lib/posters/studio-init';
import { deleteLayerKeysFromScene } from '@/lib/posters/studio-layers';
import { groupSelectionIntoFolderState, ungroupFolderFromScene } from '@/lib/posters/studio-folders';
import { mergeSelectionIntoCompoundState, unmergeCompoundState } from '@/lib/posters/studio-compound';
import { evaluatePrayerSilenceTransition, type SilenceMonitorState } from '@/lib/hardware/prayer-silence-monitor';
import { clearFailSafeWatchdog, getWatchdogStatus } from '@/lib/hardware/audio-coordinator';

// Minimal valid 1x1 WebP image binary (RIFF....WEBP VP8 ...) via sharp or raw valid PNG
const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);

describe('Adversarial Security, DST & Studio Regression Suite', () => {
  beforeAll(async () => {
    await seedDefaults();
  });

  beforeEach(() => {
    resetAllRateLimits();
    clearFailSafeWatchdog();
  });

  describe('Auth Hardening & PIN Hash Migration', () => {
    it('hashes PINs with SHA-512 (128 hex chars) and preserves backwards-compatible SHA-256 verification', () => {
      const modern = hashPin('2468');
      expect(modern.hash).toHaveLength(128);
      expect(isLegacySha256Hash(modern.hash)).toBe(false);
      expect(verifyPin('2468', modern.salt, modern.hash)).toBe(true);
      expect(verifyPin('0000', modern.salt, modern.hash)).toBe(false);

      const legacySalt = 'legacy-salt-hex-00112233';
      const legacyHash = crypto
        .pbkdf2Sync('1234', legacySalt, 100_000, 32, 'sha256')
        .toString('hex');
      expect(legacyHash).toHaveLength(64);
      expect(isLegacySha256Hash(legacyHash)).toBe(true);
      expect(verifyPin('1234', legacySalt, legacyHash)).toBe(true);
      expect(verifyPin('9999', legacySalt, legacyHash)).toBe(false);
    });

    it('never exports resetPinRateLimit as a public Server Action RPC', () => {
      expect('resetPinRateLimit' in authActions).toBe(false);
    });

    it('enforces global rate limiting inside changeAdminPin after wrong current PIN guesses', async () => {
      await db.update(settingsTable).set({
        admin_pin_hash: hashPin('1234').hash,
        admin_pin_salt: hashPin('1234').salt,
      }).where(eq(settingsTable.id, 'global')).catch(() => undefined);

      for (let i = 0; i < 5; i++) {
        const res = await authActions.changeAdminPin('9999', '5678');
        expect(res.success).toBe(false);
      }
      const locked = await authActions.changeAdminPin('9999', '5678');
      expect(locked.success).toBe(false);
      expect(locked.error).toMatch(/Action locked for \d+ seconds?/);
      resetAllRateLimits();
    });

    it('rejects unauthenticated triggerPrayerSilenceAudioMute calls when production auth is enforced', async () => {
      const prevVitest = process.env['VITEST'];
      const prevNodeEnv = process.env['NODE_ENV'];
      try {
        process.env['VITEST'] = 'false';
        (process.env as Record<string, string | undefined>)['NODE_ENV'] = 'production';
        await expect(triggerPrayerSilenceAudioMute('MUTE', 'Fajr')).rejects.toThrow(/Unauthorized/i);
      } finally {
        process.env['VITEST'] = prevVitest;
        (process.env as Record<string, string | undefined>)['NODE_ENV'] = prevNodeEnv;
      }
    });
  });

  describe('Custom Frame Validation, XSS Blocking & Shared Media Lifecycle', () => {
    it('blocks non-PNG binary spoofing and malicious SVG event/script payloads', async () => {
      await expect(
        storeCustomFrameFile({
          fileBuffer: Buffer.from('NOT-A-REAL-PNG-BINARY'),
          fileName: 'fake-frame.png',
          mimeType: 'image/png',
        })
      ).rejects.toThrow(/PNG magic bytes/i);

      await expect(
        storeCustomFrameFile({
          fileBuffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'),
          fileName: 'xss.svg',
          mimeType: 'image/svg+xml',
        })
      ).rejects.toThrow(/forbidden|active scripts/i);

      await expect(
        storeCustomFrameFile({
          fileBuffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" onload="fetch(1)"></svg>'),
          fileName: 'onload.svg',
          mimeType: 'image/svg+xml',
        })
      ).rejects.toThrow(/active scripts|event handlers/i);

      const safeSvg = await storeCustomFrameFile({
        fileBuffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="2" y="2" width="96" height="96" fill="none" stroke="gold"/></svg>'),
        fileName: 'clean-frame.svg',
        mimeType: 'image/svg+xml',
      });
      const meta = await readCustomFramesMeta();
      expect(meta.some((m) => m.id === safeSvg.id)).toBe(true);
      await expect(removeCustomFrameFile('../etc/passwd')).rejects.toThrow(/Invalid poster identifier/i);
      await removeCustomFrameFile(safeSvg.id);
    });

    it('preserves shared media file across duplicatePoster + deletePoster and protects default seed WebPs', async () => {
      const dummySeedPath = path.join(getUploadDir(), 'Mosque_Signage_Welcome.webp');
      const createdDummy = !fs.existsSync(dummySeedPath);
      if (createdDummy) fs.writeFileSync(dummySeedPath, TINY_PNG);

      safeUnlinkUploadRelative('/uploads/Mosque_Signage_Welcome.webp');
      expect(fs.existsSync(dummySeedPath)).toBe(true);
      if (createdDummy) fs.unlinkSync(dummySeedPath);

      const original = await uploadPoster({
        title: 'Shared Asset Original',
        fileBuffer: TINY_PNG,
        fileName: 'tiny.png',
        mimeType: 'image/png',
        start_at: '2026-01-01T00:00:00.000Z',
        duration_seconds: 15,
      });

      const uploadedDiskPath = path.join(getUploadDir(), path.basename(original.image_path));
      expect(fs.existsSync(uploadedDiskPath)).toBe(true);

      const copy = await duplicatePoster(original.id);
      expect(copy.image_path).toBe(original.image_path);

      // Deleting the copy must NOT delete the underlying shared WebP still used by original
      await deletePoster(copy.id);
      expect(fs.existsSync(uploadedDiskPath)).toBe(true);

      // Deleting the last poster referencing that asset MUST remove it cleanly
      await deletePoster(original.id);
      expect(fs.existsSync(uploadedDiskPath)).toBe(false);
    });

    it('rejects path traversal IDs in assertValidPosterId and sets indefinite end_at on default seeds', () => {
      expect(() => assertValidPosterId('../bad')).toThrow();
      expect(() => assertValidPosterId('a/b')).toThrow();
      const seeds = buildDefaultPostersRows('2026-01-01T00:00:00.000Z');
      expect(seeds[0]?.end_at).toBeNull();
      expect(seeds[1]?.end_at).toBeNull();
    });
  });

  describe('2-Pass DST Convergence, Timezone Hijri, Overrides & CSV Validation', () => {
    it('resolves exact local Fajr wall-clock instants across Spring Forward & Fall Back transitions', () => {
      // 2026-03-08 Spring Forward in America/Toronto: 02:00 EST -> 03:00 EDT
      const springDay = new Date('2026-03-08T12:00:00.000Z');
      const springFajr = parseTimeToDate('05:30', springDay, 'America/Toronto');
      expect(springFajr.toISOString()).toBe('2026-03-08T09:30:00.000Z'); // 05:30 EDT (UTC-4)

      // 2026-11-01 Fall Back in America/Toronto: 02:00 EDT -> 01:00 EST
      const fallDay = new Date('2026-11-01T12:00:00.000Z');
      const fallFajr = parseTimeToDate('05:30', fallDay, 'America/Toronto');
      expect(fallFajr.toISOString()).toBe('2026-11-01T10:30:00.000Z'); // 05:30 EST (UTC-5)

      // Malformed string degrades safely without producing NaN Invalid Date
      const malformed = parseTimeToDate('not-a-time', fallDay, 'America/Toronto');
      expect(Number.isNaN(malformed.getTime())).toBe(false);
    });

    it('anchors Hijri calendar conversion deterministically to the injected IANA timezone', () => {
      // 2026-04-01 02:00 UTC is still March 31 22:00 EDT in Toronto
      const instant = new Date('2026-04-01T02:00:00.000Z');
      const hijriUtc = formatHijriDate(instant, 0, { timezone: 'UTC' });
      const hijriToronto = formatHijriDate(instant, 0, { timezone: 'America/Toronto' });
      expect(hijriUtc).not.toBe(hijriToronto);
    });

    it('ignores overrides belonging to other calendar dates and preserves per-date overrides on upsert', async () => {
      const targetDay = new Date('2026-10-17T12:00:00.000Z');
      const staleSchedule = calculateDailySchedule(
        { latitude: 43.589, longitude: -79.6441 },
        targetDay,
        [{ id: 'old', date: '2026-10-16', prayer: 'fajr', iqamah_time: '04:01' }],
        { timezone: 'America/Toronto' }
      );
      expect(staleSchedule.fajr.iqamah_time).not.toBe('04:01');

      await upsertPrayerOverride({ date: '2026-12-01', prayer: 'fajr', iqamah_time: '06:10' });
      await upsertPrayerOverride({ date: '2026-12-02', prayer: 'fajr', iqamah_time: '06:20' });
      const saved = await db.select().from(prayerOverridesTable);
      const dec1 = saved.find((r) => r.date === '2026-12-01' && r.prayer === 'fajr');
      const dec2 = saved.find((r) => r.date === '2026-12-02' && r.prayer === 'fajr');
      expect(dec1?.iqamah_time).toBe('06:10');
      expect(dec2?.iqamah_time).toBe('06:20');

      if (dec1?.id) await db.delete(prayerOverridesTable).where(eq(prayerOverridesTable.id, dec1.id));
      if (dec2?.id) await db.delete(prayerOverridesTable).where(eq(prayerOverridesTable.id, dec2.id));
    });

    it('rejects impossible calendar dates, bad 12h clock times, and sunrise Iqamah bulk updates', async () => {
      expect(parseCsvRowDate('2026-02-30', undefined, 2026)).toBeNull();
      expect(parseCsvRowDate('2026-04-31', undefined, 2026)).toBeNull();
      expect(parseCsvRowDate('2026-02-29', undefined, 2026)).toBeNull();
      expect(parseCsvRowDate('13/45/2030', undefined, 2026)).toBeNull();
      expect(parseCsvRowDate('2024-02-29', undefined, 2024)?.dateStr).toBe('2024-02-29');

      expect(normalizeTimeTo24h('13:30 PM')).toBeNull();
      expect(normalizeTimeTo24h('00:15 AM')).toBeNull();
      expect(normalizeTimeTo24h('25:99')).toBeNull();
      expect(normalizeTimeTo24h('1:05 PM')).toBe('13:05');

      await expect(
        bulkSetIqamahRange({
          startDate: '2026-06-01',
          endDate: '2026-06-02',
          prayer: 'sunrise',
          mode: 'FIXED',
          iqamahTime: '06:00',
        })
      ).rejects.toThrow(/Sunrise/i);
    });

    it('computes tomorrow Fajr cleanly across late-night venue boundaries', () => {
      const late = new Date('2026-10-18T03:00:00.000Z'); // 23:00 EDT on Oct 17 in Toronto
      const sched = calculateDailySchedule({ latitude: 43.589, longitude: -79.6441 }, late, [], {
        timezone: 'America/Toronto',
      });
      const res = resolveNextPrayer(sched, late, { timezone: 'America/Toronto' });
      expect(res.prayer_name).toBe('Fajr');
      expect(res.target_date.toISOString().startsWith('2026-10-18')).toBe(true);
    });
  });

  describe('Server Audio Silence Monitor & Pure Studio State Operations', () => {
    it('arms fail-safe watchdog on MUTE transition and dispatches clear/unmute on exit', async () => {
      const state: SilenceMonitorState = { wasMutedForPrayer: false };
      const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 200 }));

      try {
        const snapshot = {
          config: {
            audio_mute_during_prayer: true,
            audio_receiver_host: 'http://127.0.0.1:65432/mute',
            audio_receiver_port: 80,
            audio_receiver_protocol: 'http_webhook' as const,
          },
          isStartingNow: true,
          prayerName: 'Asr',
          durationMinutes: 10,
        };

        await evaluatePrayerSilenceTransition(snapshot, state);
        expect(state.wasMutedForPrayer).toBe(true);
        expect(getWatchdogStatus().isActive).toBe(true);

        await evaluatePrayerSilenceTransition({ ...snapshot, isStartingNow: false }, state);
        expect(state.wasMutedForPrayer).toBe(false);
        expect(getWatchdogStatus().isActive).toBe(false);
        expect(spy).toHaveBeenCalledTimes(2);
      } finally {
        spy.mockRestore();
      }
    });

    it('handles corrupt composite layout_config gracefully in buildInitialStateFromPoster', () => {
      const corruptPoster = {
        id: 'corrupt-1',
        title: 'Bad Slide',
        image_path: '/uploads/x.webp',
        layout_config: '{"archetype":"invalid-arch","slots":"not-array"}',
        start_at: '2026-01-01T00:00:00Z',
        end_at: null,
        duration_seconds: 15,
        created_at: '2026-01-01T00:00:00Z',
      };
      expect(buildInitialStateFromPoster(corruptPoster)).toBeNull();
    });

    it('groups, ungroups, merges, unmerges, and deletes layers cleanly across rootOrder and folders', () => {
      const scene = {
        slots: [
          { id: 's1', type: 'image' as const, asset_path: '/1.webp', original_filename: '1.webp', fit_mode: 'contain' as const, frame_style: 'none' as const, pos_x: 25, pos_y: 50, width_percent: 40, height_percent: 40 },
          { id: 's2', type: 'image' as const, asset_path: '/2.webp', original_filename: '2.webp', fit_mode: 'contain' as const, frame_style: 'none' as const, pos_x: 75, pos_y: 50, width_percent: 40, height_percent: 40 },
        ],
        stickers: [{ id: 'k1', type: 'fanous' as const, pos_x: 50, pos_y: 20, width_percent: 16, height_percent: 25, z_index: 30 }],
        textOverlays: [],
        compoundLayers: [],
        folders: [],
        rootOrder: ['slot:s1', 'slot:s2', 'sticker:k1'],
      };

      const grouped = groupSelectionIntoFolderState(scene, ['slot:s2', 'sticker:k1']);
      expect(grouped?.folders).toHaveLength(1);
      const folderId = grouped!.folders[0]!.id;
      const ungrouped = ungroupFolderFromScene(grouped!, folderId);
      expect(ungrouped.folders).toHaveLength(0);

      const merged = mergeSelectionIntoCompoundState(scene, ['slot:s1', 'sticker:k1']);
      expect(merged).not.toBeNull();
      expect(merged!.nextScene.compoundLayers).toHaveLength(1);
      const unmerged = unmergeCompoundState(merged!.nextScene, merged!.newCompoundId);
      expect(unmerged?.compoundLayers).toHaveLength(0);
      expect(unmerged?.slots).toHaveLength(2);
      expect(unmerged?.stickers).toHaveLength(1);

      const afterDelete = deleteLayerKeysFromScene(scene, ['sticker:k1']);
      expect(afterDelete.stickers).toHaveLength(0);
      expect(afterDelete.rootOrder).not.toContain('sticker:k1');
    });
  });
});
