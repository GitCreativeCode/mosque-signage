import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  cleanVersion,
  compareSemVer,
  isNewerVersion,
  checkLatestRelease,
  APP_VERSION,
  OFFICIAL_RELEASE_HISTORY,
} from '@/lib/system/version';

describe('Version & SemVer Logic', () => {
  it('cleanVersion strips leading v, V, and whitespace', () => {
    expect(cleanVersion('v1.2.3')).toBe('1.2.3');
    expect(cleanVersion('V2.0.0')).toBe('2.0.0');
    expect(cleanVersion('  v0.1.0  ')).toBe('0.1.0');
    expect(cleanVersion('3.4.5')).toBe('3.4.5');
  });

  it('compareSemVer correctly orders versions', () => {
    expect(compareSemVer('0.2.0', '0.1.0')).toBe(1);
    expect(compareSemVer('0.1.0', '0.2.0')).toBe(-1);
    expect(compareSemVer('0.1.0', '0.1.0')).toBe(0);
    expect(compareSemVer('1.0.0', '0.9.9')).toBe(1);
    expect(compareSemVer('0.1.1', '0.1.0')).toBe(1);
    expect(compareSemVer('0.1.0', '0.1.1')).toBe(-1);
    expect(compareSemVer('1.2.3', '1.2.3.4')).toBe(-1);
  });

  it('isNewerVersion returns true strictly when candidate is newer', () => {
    expect(isNewerVersion('0.1.0', '0.2.0')).toBe(true);
    expect(isNewerVersion('0.1.0', '0.1.1')).toBe(true);
    expect(isNewerVersion('0.1.0', '0.1.0')).toBe(false);
    expect(isNewerVersion('0.2.0', '0.1.0')).toBe(false);
    expect(isNewerVersion('1.0.0', '0.9.9')).toBe(false);
  });

  it('OFFICIAL_RELEASE_HISTORY contains valid metadata and current APP_VERSION', () => {
    expect(OFFICIAL_RELEASE_HISTORY.length).toBeGreaterThan(0);
    const current = OFFICIAL_RELEASE_HISTORY.find((item) => item.version === APP_VERSION);
    expect(current).toBeDefined();
    expect(current?.isCurrent).toBe(true);
    expect(current?.highlights.length).toBeGreaterThan(0);
    expect(current?.sections).toBeDefined();
    expect(current?.sections?.length).toBeGreaterThanOrEqual(4);
  });
});

describe('checkLatestRelease Remote Queries', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('handles 404 status (no GitHub releases published yet) gracefully', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    } as unknown as Response);

    const result = await checkLatestRelease('GitCreativeCode/mosque-signage', true);
    expect(result.hasUpdate).toBe(false);
    expect(result.latestVersion).toBe(APP_VERSION);
    expect(result.currentVersion).toBe(APP_VERSION);
    expect(result.release).toBeNull();
  });

  it('falls back to /releases list when /releases/latest returns 404 (e.g. pre-releases)', async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 404 } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [
          {
            tag_name: 'v0.1.1',
            name: 'MosqueSignage v0.1.1 Pre-Release',
            published_at: '2026-11-20T12:00:00Z',
            body: 'Pre-release patch.',
            html_url: 'https://github.com/GitCreativeCode/mosque-signage/releases/tag/v0.1.1',
            zipball_url: 'https://github.com/GitCreativeCode/mosque-signage/archive/refs/tags/v0.1.1.zip',
          },
        ],
      } as unknown as Response);

    const result = await checkLatestRelease('GitCreativeCode/mosque-signage', true);
    expect(result.hasUpdate).toBe(true);
    expect(result.latestVersion).toBe('0.1.1');
    expect(result.release?.title).toBe('MosqueSignage v0.1.1 Pre-Release');
  });

  it('detects a newer version from GitHub release payload', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        tag_name: 'v0.2.0',
        name: 'MosqueSignage v0.2.0 - Big Update',
        published_at: '2026-11-04T12:00:00Z',
        body: 'Exciting new features for prayer halls.',
        html_url: 'https://github.com/GitCreativeCode/mosque-signage/releases/tag/v0.2.0',
        zipball_url: 'https://github.com/GitCreativeCode/mosque-signage/archive/refs/tags/v0.2.0.zip',
      }),
    } as unknown as Response);

    const result = await checkLatestRelease('GitCreativeCode/mosque-signage', true);
    expect(result.hasUpdate).toBe(true);
    expect(result.latestVersion).toBe('0.2.0');
    expect(result.release?.title).toBe('MosqueSignage v0.2.0 - Big Update');
    expect(result.release?.body).toBe('Exciting new features for prayer halls.');
  });

  it('handles network failure safely without throwing uncaught errors', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network offline'));

    const result = await checkLatestRelease('GitCreativeCode/mosque-signage', true);
    expect(result.hasUpdate).toBe(false);
    expect(result.error).toBe('Network offline');
  });
});

