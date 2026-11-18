import { describe, it, expect } from 'vitest';
import { calculatePosterStatus } from '@/lib/engine/index';
import {
  uploadPoster,
  updatePoster,
  deletePoster,
  getPostersWithStatus,
} from '@/lib/actions/posters';
import { createAnnouncementSlide } from '@/lib/actions/announcements';
import { updateVenueSettings, getVenueSettings } from '@/lib/actions/settings';
import type { Poster } from '@/types/index';

describe('Admin Mutation Layer & Status Evaluation', () => {
  describe('calculatePosterStatus', () => {
    const poster: Poster = {
      id: 'test-p1',
      title: 'Youth Camp',
      image_path: '/uploads/camp.webp',
      start_at: '2026-10-15T00:00:00.000Z',
      end_at: '2026-10-20T23:59:59.000Z',
      duration_seconds: 15,
      created_at: '2026-10-01T00:00:00.000Z',
    };

    it('identifies UPCOMING when now is prior to start_at', () => {
      const before = new Date('2026-10-14T23:59:59.000Z');
      expect(calculatePosterStatus(poster, before)).toBe('UPCOMING');
    });

    it('identifies ACTIVE when now is between start_at and end_at', () => {
      const during = new Date('2026-10-17T12:00:00.000Z');
      expect(calculatePosterStatus(poster, during)).toBe('ACTIVE');
    });

    it('identifies EXPIRED when now is after end_at', () => {
      const after = new Date('2026-10-21T00:00:00.000Z');
      expect(calculatePosterStatus(poster, after)).toBe('EXPIRED');
    });

    it('identifies ACTIVE for indefinite poster (end_at: null) indefinitely after start_at', () => {
      const indefinite: Poster = {
        ...poster,
        end_at: null,
      };
      const farFuture = new Date('2036-10-21T00:00:00.000Z');
      expect(calculatePosterStatus(indefinite, farFuture)).toBe('ACTIVE');
    });
  });

  describe('Poster CRUD Operations & Local Storage', () => {
    let createdPosterId = '';
    const VALID_1X1_WEBP = Buffer.from(
      '524946461a000000574542505650384c0e0000002f00000010071011118888fe0700',
      'hex'
    );
    const VALID_MP4_HEADER = Buffer.from([
      0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x6d, 0x70, 0x34, 0x32, 0x00, 0x00, 0x00, 0x00,
    ]);

    it('uploads and creates a new poster with valid file buffer', async () => {
      const startAt = new Date().toISOString();
      const endAt = new Date(Date.now() + 86400000).toISOString();

      const created = await uploadPoster({
        title: 'Vitest Automated Poster',
        fileBuffer: VALID_1X1_WEBP,
        fileName: 'sample.webp',
        mimeType: 'image/webp',
        start_at: startAt,
        end_at: endAt,
        duration_seconds: 20,
        qr_url: 'https://icco.org/test',
        qr_label: 'Test Link',
      });

      expect(created.id).toBeDefined();
      expect(created.title).toBe('Vitest Automated Poster');
      expect(created.image_path).toMatch(/^\/uploads\/.*\.webp$/);
      createdPosterId = created.id;

      // Verify presence in getPostersWithStatus
      const all = await getPostersWithStatus();
      const found = all.find((p) => p.id === createdPosterId);
      expect(found).toBeDefined();
      expect(found?.status).toBe('ACTIVE');
    });

    it('updates poster metadata, schedule, and duration', async () => {
      const newEndAt = new Date(Date.now() + 172800000).toISOString();
      await updatePoster({
        id: createdPosterId,
        title: 'Updated Poster Title',
        start_at: new Date().toISOString(),
        end_at: newEndAt,
        duration_seconds: 25,
        qr_url: 'https://icco.org/updated',
        qr_label: 'Updated QR',
      });

      const all = await getPostersWithStatus();
      const updated = all.find((p) => p.id === createdPosterId);
      expect(updated?.title).toBe('Updated Poster Title');
      expect(updated?.duration_seconds).toBe(25);
      expect(updated?.qr_url).toBe('https://icco.org/updated');
    });

    it('deletes the poster and ensures DB record removal', async () => {
      await deletePoster(createdPosterId);

      const all = await getPostersWithStatus();
      const found = all.find((p) => p.id === createdPosterId);
      expect(found).toBeUndefined();
    });

    it('successfully updates default onboarding poster identifiers like poster-1 and poster-2', async () => {
      const all = await getPostersWithStatus();
      const defaultPoster = all.find((p) => p.id === 'poster-1' || p.id === 'poster-2');

      if (defaultPoster) {
        await expect(
          updatePoster({
            id: defaultPoster.id,
            title: 'Modified Community Welcome',
            start_at: defaultPoster.start_at,
            duration_seconds: 18,
          })
        ).resolves.not.toThrow();

        const refetched = await getPostersWithStatus();
        const updated = refetched.find((p) => p.id === defaultPoster.id);
        expect(updated?.title).toBe('Modified Community Welcome');
        expect(updated?.duration_seconds).toBe(18);
      }
    });

    it('rejects poster identifiers containing path traversal sequences', async () => {
      const nowIso = new Date().toISOString();
      await expect(
        updatePoster({
          id: '../poster-1',
          title: 'Traversal Attempt',
          start_at: nowIso,
          duration_seconds: 15,
        })
      ).rejects.toThrow('Invalid poster identifier format.');

      await expect(
        updatePoster({
          id: 'poster/1',
          title: 'Slash Attempt',
          start_at: nowIso,
          duration_seconds: 15,
        })
      ).rejects.toThrow('Invalid poster identifier format.');

      await expect(deletePoster('..\\poster-2')).rejects.toThrow('Invalid poster identifier format.');
    });

    it('uploads a video poster with looping count, dwell calculation, and thumbnail', async () => {
      const startAt = new Date().toISOString();

      const created = await uploadPoster({
        title: 'Youth Halaqa Video Promo',
        fileBuffer: VALID_MP4_HEADER,
        fileName: 'halaqa.mp4',
        mimeType: 'video/mp4',
        start_at: startAt,
        video_duration_seconds: 12,
        video_loop_count: 2,
        thumbnailBuffer: VALID_1X1_WEBP,
        allow_audio: false,
        qr_url: 'https://icco.org/youth',
        qr_label: 'Scan to Register',
      });

      expect(created.id).toBeDefined();
      expect(created.media_type).toBe('video');
      expect(created.video_loop_count).toBe(2);
      expect(created.video_duration_seconds).toBe(12);
      expect(created.duration_seconds).toBe(24);
      expect(created.thumbnail_path).toMatch(/^\/uploads\/.*-thumb\.webp$/);
      expect(created.image_path).toMatch(/^\/uploads\/.*\.mp4$/);

      const all = await getPostersWithStatus();
      const found = all.find((p) => p.id === created.id);
      expect(found).toBeDefined();
      expect(found?.media_type).toBe('video');
      expect(found?.video_loop_count).toBe(2);
      expect(found?.duration_seconds).toBe(24);

      // Clean up
      await deletePoster(created.id);
    });

    it('rejects upload with corrupted or non-media binary buffer', async () => {
      const fakeCorruptBuffer = Buffer.from('NOT_A_VALID_MEDIA_FILE');
      await expect(
        uploadPoster({
          title: 'Malicious Payload Test',
          fileBuffer: fakeCorruptBuffer,
          fileName: 'payload.png',
          mimeType: 'image/png',
          start_at: new Date().toISOString(),
        })
      ).rejects.toThrow(/Magic bytes do not match/);
    });

    it('rejects oversized image payloads (> 15MB)', async () => {
      // 16MB buffer
      const oversizedImage = Buffer.alloc(16 * 1024 * 1024);
      oversizedImage[0] = 0x89;
      oversizedImage[1] = 0x50;
      oversizedImage[2] = 0x4e;
      oversizedImage[3] = 0x47;
      oversizedImage[4] = 0x0d;
      oversizedImage[5] = 0x0a;
      oversizedImage[6] = 0x1a;
      oversizedImage[7] = 0x0a;

      await expect(
        uploadPoster({
          title: 'Oversized Image Test',
          fileBuffer: oversizedImage,
          fileName: 'large.png',
          mimeType: 'image/png',
          start_at: new Date().toISOString(),
        })
      ).rejects.toThrow(/File size exceeds/);
    });

    it('rejects path traversal attempts in updatePoster and deletePoster', async () => {
      await expect(
        updatePoster({
          id: '../../etc/passwd',
          title: 'Traversal Test',
          start_at: new Date().toISOString(),
          duration_seconds: 15,
        })
      ).rejects.toThrow(/Invalid poster identifier/);

      await expect(deletePoster('../../etc/shadow')).rejects.toThrow(/Invalid poster identifier/);
    });

    it('rejects video poster exceeding 60-second digital signage maximum ceiling', async () => {
      await expect(
        uploadPoster({
          title: 'Too Long Lecture Clip',
          fileBuffer: VALID_MP4_HEADER,
          fileName: 'lecture.mp4',
          mimeType: 'video/mp4',
          start_at: new Date().toISOString(),
          video_duration_seconds: 75,
        })
      ).rejects.toThrow('Video duration exceeds the 60-second digital signage maximum');
    });

    it('rejects invalid file MIME types', async () => {
      const dummyBuffer = Buffer.from('EXE_PAYLOAD');
      await expect(
        uploadPoster({
          title: 'Malicious File',
          fileBuffer: dummyBuffer,
          fileName: 'malicious.exe',
          mimeType: 'application/octet-stream',
          start_at: new Date().toISOString(),
          end_at: new Date().toISOString(),
        })
      ).rejects.toThrow(/Invalid file type/);
    });

    it('programmatically generates an SVG notice slide', async () => {
      const startAt = new Date().toISOString();
      const endAt = new Date(Date.now() + 86400000).toISOString();

      const notice = await createAnnouncementSlide({
        headline: 'Emergency Weather Notice',
        description: 'Evening halaqas are moved online due to inclement weather.',
        qr_url: 'https://icco.org/weather',
        qr_label: 'Join Online',
        start_at: startAt,
        end_at: endAt,
      });

      expect(notice.id).toBeDefined();
      expect(notice.image_path).toMatch(/^\/uploads\/announcement-.*\.svg$/);

      // Clean up test slide
      await deletePoster(notice.id);
    });
  });

  describe('Venue Settings & Hijri Offset Boundaries', () => {
    it('updates venue settings within valid range (-2 to +2)', async () => {
      await updateVenueSettings({
        mosque_name: 'ICCO Main Hall',
        hijri_offset_days: 1,
        drawer_interval_minutes: 4,
        show_adhan_times: false,
      });

      const settings = await getVenueSettings();
      expect(settings.mosque_name).toBe('ICCO Main Hall');
      expect(settings.hijri_offset_days).toBe(1);
      expect(settings.drawer_interval_minutes).toBe(4);
      expect(settings.show_adhan_times).toBe(false);

      // Restore show_adhan_times
      await updateVenueSettings({ show_adhan_times: true });
    });

    it('persists and retrieves new display configuration options (date format, poster transition, canvas fit)', async () => {
      await updateVenueSettings({
        date_format: 'hijri',
        poster_transition: 'zoom',
        poster_fit: 'cover',
      });

      const settings = await getVenueSettings();
      expect(settings.date_format).toBe('hijri');
      expect(settings.poster_transition).toBe('zoom');
      expect(settings.poster_fit).toBe('cover');

      // Reset to defaults
      await updateVenueSettings({
        date_format: 'both',
        poster_transition: 'fade',
        poster_fit: 'cover',
      });
    });

    it('rejects Hijri offset values outside -2 to +2', async () => {
      await expect(
        updateVenueSettings({
          hijri_offset_days: 3,
        })
      ).rejects.toThrow(/Hijri offset must be between -2 and \+2 days/);

      await expect(
        updateVenueSettings({
          hijri_offset_days: -3,
        })
      ).rejects.toThrow(/Hijri offset must be between -2 and \+2 days/);
    });
  });

  describe('Friday Jummah Shifts & Optional Salah Times', () => {
    it('creates a Jummah shift without Salah time, edits it, and deletes it', async () => {
      const {
        createJummahShift,
        updateJummahShift,
        getJummahShifts,
        deleteJummahShift,
      } = await import('@/lib/actions/jummah');

      // 1. Create with optional iqamah omitted
      const shift = await createJummahShift({
        shift_number: 99,
        khateeb_name: 'Sheikh Ahmad',
        adhan_time: '12:15',
      });

      expect(shift.id).toBeDefined();
      expect(shift.khateeb_name).toBe('Sheikh Ahmad');
      expect(shift.adhan_time).toBe('12:15');
      expect(shift.iqamah_time).toBeNull();

      // 2. Edit shift
      const updated = await updateJummahShift({
        id: shift.id,
        shift_number: 99,
        khateeb_name: 'Dr. Tariq',
        adhan_time: '12:20',
        iqamah_time: '12:45',
      });

      expect(updated.khateeb_name).toBe('Dr. Tariq');
      expect(updated.adhan_time).toBe('12:20');
      expect(updated.iqamah_time).toBe('12:45');

      // 3. Edit shift to remove iqamah_time again
      const updatedNoIqamah = await updateJummahShift({
        id: shift.id,
        shift_number: 99,
        khateeb_name: 'Dr. Tariq',
        adhan_time: '12:20',
        iqamah_time: undefined,
      });
      expect(updatedNoIqamah.iqamah_time).toBeNull();

      // 4. Clean up
      await deleteJummahShift(shift.id);
      const allShifts = await getJummahShifts();
      expect(allShifts.find((s) => s.id === shift.id)).toBeUndefined();
    });

    it('creates Jummah shift with optional khateeb omitted and auto-assigned shift_number', async () => {
      const { createJummahShift, deleteJummahShift, getJummahShifts } = await import(
        '@/lib/actions/jummah'
      );

      const s1 = await createJummahShift({
        adhan_time: '12:00',
      });

      expect(s1.id).toBeDefined();
      expect(s1.khateeb_name).toBe('');
      expect(s1.adhan_time).toBe('12:00');
      expect(s1.shift_number).toBeGreaterThan(0);

      await deleteJummahShift(s1.id);
      const remaining = await getJummahShifts();
      expect(remaining.find((s) => s.id === s1.id)).toBeUndefined();
    });

    it('reorders Friday Jummah shifts and re-numbers them sequentially 1, 2, 3...', async () => {
      const { createJummahShift, reorderJummahShifts, deleteJummahShift, getJummahShifts } =
        await import('@/lib/actions/jummah');

      const s1 = await createJummahShift({
        adhan_time: '12:15',
        khateeb_name: 'Speaker A',
      });
      const s2 = await createJummahShift({
        adhan_time: '13:15',
        khateeb_name: 'Speaker B',
      });

      // Reorder s2 before s1
      const reordered = await reorderJummahShifts([s2.id, s1.id]);
      const foundS2 = reordered.find((s) => s.id === s2.id);
      const foundS1 = reordered.find((s) => s.id === s1.id);

      expect(foundS2?.shift_number).toBe(1);
      expect(foundS1?.shift_number).toBe(2);

      // Clean up
      await deleteJummahShift(s1.id);
      await deleteJummahShift(s2.id);
    });
  });

  describe('Dynamic Prayer Rules & CSV Timetable Import', () => {
    it('saves and retrieves dynamic prayer offset rules', async () => {
      const { savePrayerRule, getPrayerRules } = await import('@/lib/actions/prayers');

      await savePrayerRule({
        prayer: 'fajr',
        rule_type: 'OFFSET',
        offset_minutes: 30,
      });

      await savePrayerRule({
        prayer: 'dhuhr',
        rule_type: 'FIXED',
        fixed_time: '13:45',
      });

      const rules = await getPrayerRules();
      const fajrRule = rules.find((r) => r.prayer === 'fajr');
      const dhuhrRule = rules.find((r) => r.prayer === 'dhuhr');

      expect(fajrRule?.rule_type).toBe('OFFSET');
      expect(fajrRule?.offset_minutes).toBe(30);
      expect(dhuhrRule?.rule_type).toBe('FIXED');
      expect(dhuhrRule?.fixed_time).toBe('13:45');
    });

    it('imports annual timetable CSV and persists records', async () => {
      const { getAnnualScheduleForDate } = await import('@/lib/actions/prayers');
      const { importAnnualScheduleCsv } = await import('@/lib/actions/prayer-schedules');

      const sampleCsv = `date,fajr,dhuhr,asr,maghrib,isha
2026-05-15,05:15,13:30,17:45,20:15,22:00
2026-05-16,05:14,13:30,17:45,20:16,22:00`;

      const result = await importAnnualScheduleCsv(sampleCsv);
      expect(result.importedCount).toBe(2);

      const record = await getAnnualScheduleForDate('2026-05-15');
      expect(record).toBeDefined();
      expect(record?.fajr_iqamah).toBe('05:15');
      expect(record?.dhuhr_iqamah).toBe('13:30');
      expect(record?.maghrib_iqamah).toBe('20:15');
    });
  });

  describe('Dimension 4: Reordering, Madhab & Action Center', () => {
    it('reorders posters sequentially and returns them in display_order', async () => {
      const { reorderPosters, getPostersWithStatus, deletePoster } =
        await import('@/lib/actions/posters');
      const { createAnnouncementSlide } = await import('@/lib/actions/announcements');

      const p1 = await createAnnouncementSlide({
        headline: 'Slide Alpha',
        description: 'First slide in test',
        start_at: '2026-01-01T00:00:00Z',
      });

      const p2 = await createAnnouncementSlide({
        headline: 'Slide Beta',
        description: 'Second slide in test',
        start_at: '2026-01-01T00:00:00Z',
      });

      // Swap their order: p2 first, then p1
      await reorderPosters([p2.id, p1.id]);

      const all = await getPostersWithStatus();
      const p2Found = all.find((p) => p.id === p2.id);
      const p1Found = all.find((p) => p.id === p1.id);

      expect(p2Found?.display_order).toBe(0);
      expect(p1Found?.display_order).toBe(1);

      // Clean up
      await deletePoster(p1.id);
      await deletePoster(p2.id);
    });

    it('updates venue calculation method, madhab, and coordinates', async () => {
      const { updateVenueSettings, getVenueSettings } = await import('@/lib/actions/settings');

      await updateVenueSettings({
        calculation_method: 'Karachi',
        madhab: 'hanafi',
        latitude: 24.8607,
        longitude: 67.0011,
      });

      const updated = await getVenueSettings();
      expect(updated.calculation_method).toBe('Karachi');
      expect(updated.madhab).toBe('hanafi');
      expect(updated.latitude).toBe(24.8607);
      expect(updated.longitude).toBe(67.0011);

      // Reset back to ICCO defaults
      await updateVenueSettings({
        calculation_method: 'NorthAmerica',
        madhab: 'shafi',
        latitude: 43.589,
        longitude: -79.6441,
      });
    });

    it('updates and persists display_resolution setting (e.g. 1600x900, 1080p, 4k)', async () => {
      const { updateVenueSettings, getVenueSettings } = await import('@/lib/actions/settings');

      await updateVenueSettings({
        display_resolution: '1600x900',
      });

      let settings = await getVenueSettings();
      expect(settings.display_resolution).toBe('1600x900');

      await updateVenueSettings({
        display_resolution: '1080p',
      });

      settings = await getVenueSettings();
      expect(settings.display_resolution).toBe('1080p');
    });

    it('updates and persists show_qr_during_drawer setting without reverting on reload', async () => {
      const { updateVenueSettings, getVenueSettings } = await import('@/lib/actions/settings');

      await updateVenueSettings({ show_qr_during_drawer: true });
      let settings = await getVenueSettings();
      expect(settings.show_qr_during_drawer).toBe(true);

      await updateVenueSettings({ show_qr_during_drawer: false });
      settings = await getVenueSettings();
      expect(settings.show_qr_during_drawer).toBe(false);
    });

    it('updates and persists show_progress_bar setting without reverting on reload', async () => {
      const { updateVenueSettings, getVenueSettings } = await import('@/lib/actions/settings');

      await updateVenueSettings({ show_progress_bar: false });
      let settings = await getVenueSettings();
      expect(settings.show_progress_bar).toBe(false);

      await updateVenueSettings({ show_progress_bar: true });
      settings = await getVenueSettings();
      expect(settings.show_progress_bar).toBe(true);
    });

    it('updates and persists sidebar_position setting (left vs right)', async () => {
      const { updateVenueSettings, getVenueSettings } = await import('@/lib/actions/settings');

      await updateVenueSettings({ sidebar_position: 'left' });
      let settings = await getVenueSettings();
      expect(settings.sidebar_position).toBe('left');

      await updateVenueSettings({ sidebar_position: 'right' });
      settings = await getVenueSettings();
      expect(settings.sidebar_position).toBe('right');
    });

    it('broadcasts kiosk remote commands successfully', async () => {
      const { triggerKioskReload, triggerKioskTestDrawer } = await import('@/lib/actions/hardware');

      await expect(triggerKioskReload()).resolves.not.toThrow();
      await expect(triggerKioskTestDrawer(15)).resolves.not.toThrow();
    });
  });
});
