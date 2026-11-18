/**
 * MosqueSignage Version & Appliance Update Engine
 * MosqueSignage (TV)
 */

export { OFFICIAL_RELEASE_HISTORY, type ReleaseLogItem, type ReleaseSection } from './release-history';

export const APP_VERSION = '0.1.1';
export const DEFAULT_GITHUB_REPO = 'GitCreativeCode/mosque-signage';

export interface ReleaseInfo {
  readonly version: string;
  readonly title: string;
  readonly publishedAt: string;
  readonly body: string;
  readonly htmlUrl: string;
  readonly downloadUrl: string;
}

export interface VersionCheckResult {
  readonly hasUpdate: boolean;
  readonly latestVersion: string;
  readonly currentVersion: string;
  readonly release: ReleaseInfo | null;
  readonly error?: string | undefined;
}

interface GitHubLatestReleaseJson {
  readonly tag_name?: string;
  readonly name?: string;
  readonly published_at?: string;
  readonly body?: string;
  readonly html_url?: string;
  readonly zipball_url?: string;
}

interface CacheEntry {
  readonly result: VersionCheckResult;
  readonly timestamp: number;
}

let cachedCheck: CacheEntry | null = null;
const CACHE_TTL_MS = 60 * 60 * 1000;

export function cleanVersion(ver: string): string {
  return ver.trim().replace(/^v/i, '');
}

export function compareSemVer(v1: string, v2: string): number {
  const parts1 = cleanVersion(v1).split('.').map((p) => {
    const num = parseInt(p, 10);
    return Number.isNaN(num) ? 0 : num;
  });
  const parts2 = cleanVersion(v2).split('.').map((p) => {
    const num = parseInt(p, 10);
    return Number.isNaN(num) ? 0 : num;
  });

  const maxLength = Math.max(parts1.length, parts2.length);
  for (let i = 0; i < maxLength; i++) {
    const p1 = parts1[i] ?? 0;
    const p2 = parts2[i] ?? 0;
    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }
  return 0;
}

export function isNewerVersion(currentVersion: string, candidateVersion: string): boolean {
  return compareSemVer(candidateVersion, currentVersion) > 0;
}

function buildReleaseResult(repoSlug: string, data: GitHubLatestReleaseJson): VersionCheckResult {
  const tagName = data.tag_name || APP_VERSION;
  const latestVersion = cleanVersion(tagName);
  return {
    hasUpdate: isNewerVersion(APP_VERSION, latestVersion),
    latestVersion,
    currentVersion: APP_VERSION,
    release: {
      version: latestVersion,
      title: data.name || `Release ${tagName}`,
      publishedAt: data.published_at || new Date().toISOString(),
      body: data.body || 'No release notes provided.',
      htmlUrl: data.html_url || `https://github.com/${repoSlug}/releases`,
      downloadUrl: data.zipball_url || `https://github.com/${repoSlug}/archive/refs/tags/${tagName}.zip`,
    },
  };
}

export async function checkLatestRelease(
  repoSlug: string = process.env['GITHUB_REPO'] || DEFAULT_GITHUB_REPO,
  forceRefresh = false
): Promise<VersionCheckResult> {
  const now = Date.now();
  if (!forceRefresh && cachedCheck && now - cachedCheck.timestamp < CACHE_TTL_MS) {
    return cachedCheck.result;
  }

  try {
    const response = await fetch(`https://api.github.com/repos/${repoSlug}/releases/latest`, {
      headers: { Accept: 'application/vnd.github.v3+json', 'User-Agent': 'MosqueSignage-Appliance' },
      next: { revalidate: 3600 },
    });

    let data: GitHubLatestReleaseJson | null = null;
    if (response.ok) {
      data = (await response.json()) as GitHubLatestReleaseJson;
    } else if (response.status === 404) {
      // Fallback: If releases/latest returned 404 (e.g. releases are tagged as pre-releases),
      // query /releases?per_page=1 so pre-releases are still detected cleanly.
      const listRes = await fetch(`https://api.github.com/repos/${repoSlug}/releases?per_page=1`, {
        headers: { Accept: 'application/vnd.github.v3+json', 'User-Agent': 'MosqueSignage-Appliance' },
        next: { revalidate: 3600 },
      });
      if (listRes.ok) {
        const list = (await listRes.json()) as GitHubLatestReleaseJson[];
        if (Array.isArray(list) && list.length > 0) {
          data = list[0] ?? null;
        }
      }
    } else {
      throw new Error(`GitHub API returned status ${response.status}`);
    }

    if (!data) {
      const empty: VersionCheckResult = { hasUpdate: false, latestVersion: APP_VERSION, currentVersion: APP_VERSION, release: null };
      cachedCheck = { result: empty, timestamp: now };
      return empty;
    }

    const result = buildReleaseResult(repoSlug, data);
    cachedCheck = { result, timestamp: now };
    return result;
  } catch (err: unknown) {
    return {
      hasUpdate: false,
      latestVersion: APP_VERSION,
      currentVersion: APP_VERSION,
      release: null,
      error: err instanceof Error ? err.message : 'Failed to query GitHub releases',
    };
  }
}
