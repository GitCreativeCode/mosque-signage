'use server';

import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { settingsTable } from '@/lib/db/schema';
import { seedDefaults } from '@/lib/db/seed';
import {
  ADHAN_OFFSET_KEYS,
  buildSettingsUpdatePatch,
  mapSettingsRowToDomain,
  validateSettingsBoundaries,
} from '@/lib/db/settings-mapper';
import { executeFactoryResetCore } from '@/lib/db/reset';
import { verifyAdminPinOnly } from '@/lib/auth/pin';
import { loadOrSeedAdminAuthSettings, evaluateAdminCredentials } from '@/lib/auth/credentials';
import { createSessionToken, getSessionSecret } from '@/lib/auth/crypto';
import { writeSessionCookieToken } from '@/lib/auth/session-cookie';
import { eventBus } from '@/lib/events/event-bus';
import type { PublicDisplaySettings, Settings, UpdateVenueSettingsInput } from '@/types/index';
import { requireAdminAuth } from './auth';

export async function updateVenueSettings(input: UpdateVenueSettingsInput): Promise<void> {
  await requireAdminAuth();
  validateSettingsBoundaries(input);

  const existing = await db.select().from(settingsTable).where(eq(settingsTable.id, 'global'));
  if (existing.length === 0) {
    await seedDefaults();
  }

  const nowIso = new Date().toISOString();
  const patch = buildSettingsUpdatePatch(input, nowIso);
  await db.update(settingsTable).set(patch).where(eq(settingsTable.id, 'global'));

  eventBus.emitEvent('SETTINGS_UPDATED', {
    timestamp: nowIso,
    venueName: input.mosque_name,
    hijriOffset: input.hijri_offset_days,
  });

  const hasPrayerUpdate =
    ADHAN_OFFSET_KEYS.some((k) => input[k] !== undefined) ||
    Boolean(input.calculation_method || input.madhab || input.high_latitude_rule) ||
    input.latitude !== undefined ||
    input.longitude !== undefined ||
    input.ramadan_mode_enabled !== undefined ||
    input.ramadan_display_start_date !== undefined ||
    input.ramadan_suhoor_buffer_minutes !== undefined ||
    input.ramadan_silence_during_taraweeh !== undefined ||
    input.ramadan_taraweeh_sessions !== undefined ||
    input.ramadan_taraweeh_time !== undefined ||
    input.ramadan_taraweeh_rakats !== undefined ||
    input.active_eid_type !== undefined ||
    input.active_eid_date !== undefined ||
    input.eid_auto_hide_minutes !== undefined ||
    input.eid_friday_note !== undefined;

  if (hasPrayerUpdate) {
    eventBus.emitEvent('PRAYERS_UPDATED', { timestamp: nowIso });
  }
}

export async function updateTicker(tickerText: string): Promise<void> {
  await requireAdminAuth();
  const existing = await db.select().from(settingsTable).where(eq(settingsTable.id, 'global'));
  if (existing.length === 0) {
    await seedDefaults();
  }

  const nowIso = new Date().toISOString();
  const cleanTicker = tickerText.trim();
  await db
    .update(settingsTable)
    .set({ ticker_text: cleanTicker, updated_at: nowIso })
    .where(eq(settingsTable.id, 'global'));

  eventBus.emitEvent('SETTINGS_UPDATED', { timestamp: nowIso, tickerText: cleanTicker });
}

export async function getVenueSettingsCore(): Promise<Settings> {
  let rows = await db.select().from(settingsTable).where(eq(settingsTable.id, 'global'));
  if (rows.length === 0) {
    await seedDefaults();
    rows = await db.select().from(settingsTable).where(eq(settingsTable.id, 'global'));
  }
  return mapSettingsRowToDomain(rows[0]);
}

export async function getPublicDisplaySettings(): Promise<PublicDisplaySettings> {
  const settings = await getVenueSettingsCore();
  const {
    audio_receiver_host,
    audio_receiver_port,
    audio_receiver_protocol,
    audio_mute_during_prayer,
    audio_mute_delay_seconds,
    tv_control_protocol,
    has_admin_pin,
    initial_setup_completed,
    terms_accepted,
    terms_accepted_at,
    poster_view_mode,
    ...publicSettings
  } = settings;
  return publicSettings;
}

export async function getVenueSettings(): Promise<Settings> {
  await requireAdminAuth();
  return getVenueSettingsCore();
}

export async function resetAllToDefaults(
  input: string | FormData
): Promise<{ success: boolean; error?: string }> {
  await requireAdminAuth();
  try {
    const authSettings = await loadOrSeedAdminAuthSettings(db);
    let isValid = false;

    const secret =
      typeof input === 'string'
        ? input.trim()
        : input instanceof FormData
          ? (
              input.get('secret')?.toString() ||
              input.get('pin')?.toString() ||
              input.get('password')?.toString() ||
              ''
            ).trim()
          : '';

    if (authSettings.auth_mode === 'password') {
      const evalRes = evaluateAdminCredentials(
        authSettings,
        { username: authSettings.admin_username, password: secret },
        false
      );
      isValid = evalRes.valid;
    } else {
      isValid = await verifyAdminPinOnly(secret);
    }

    if (!isValid) {
      return {
        success: false,
        error:
          authSettings.auth_mode === 'password'
            ? 'Incorrect Admin Password. System reset aborted.'
            : 'Incorrect Admin PIN. System reset aborted.',
      };
    }

    const resetResult = await executeFactoryResetCore();
    await writeSessionCookieToken(
      createSessionToken(getSessionSecret(), undefined, resetResult.sessionVersion)
    );
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to execute factory reset.',
    };
  }
}
