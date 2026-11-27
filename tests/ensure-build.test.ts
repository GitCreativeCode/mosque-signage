import { describe, it, expect } from 'vitest';
import { checkNeedsBuild } from '../scripts/ensure-build.mjs';

describe('checkNeedsBuild (Pre-Start Build & Version Staleness Guard)', () => {
  const currentVersion = '0.2.0';
  const validRoutesManifest = JSON.stringify({ dataRoutes: [] });
  const validBuildInfo = JSON.stringify({ version: '0.2.0', buildId: 'abc-123' });

  it('triggers build when routes-manifest.json or BUILD_ID does not exist', () => {
    const result1 = checkNeedsBuild({
      routesManifestExists: false,
      buildIdExists: true,
      routesManifestContent: null,
      buildInfoContent: validBuildInfo,
      currentVersion,
    });
    expect(result1.needsBuild).toBe(true);
    expect(result1.reason).toContain('Production build output missing');

    const result2 = checkNeedsBuild({
      routesManifestExists: true,
      buildIdExists: false,
      routesManifestContent: validRoutesManifest,
      buildInfoContent: validBuildInfo,
      currentVersion,
    });
    expect(result2.needsBuild).toBe(true);
    expect(result2.reason).toContain('Production build output missing');
  });

  it('triggers build when routes manifest was overwritten by next dev (missing dataRoutes)', () => {
    const devRoutesManifest = JSON.stringify({});
    const result = checkNeedsBuild({
      routesManifestExists: true,
      buildIdExists: true,
      routesManifestContent: devRoutesManifest,
      buildInfoContent: validBuildInfo,
      currentVersion,
    });
    expect(result.needsBuild).toBe(true);
    expect(result.reason).toContain('overwritten by development server');
  });

  it('triggers build when app-build-info.json is missing (e.g. legacy build prior to version tracking)', () => {
    const result = checkNeedsBuild({
      routesManifestExists: true,
      buildIdExists: true,
      routesManifestContent: validRoutesManifest,
      buildInfoContent: null,
      currentVersion,
    });
    expect(result.needsBuild).toBe(true);
    expect(result.reason).toContain('Build version metadata missing');
  });

  it('triggers build when production build version is outdated (e.g. built at v0.1.3 but codebase is v0.2.0)', () => {
    const outdatedBuildInfo = JSON.stringify({ version: '0.1.3', buildId: 'old-build' });
    const result = checkNeedsBuild({
      routesManifestExists: true,
      buildIdExists: true,
      routesManifestContent: validRoutesManifest,
      buildInfoContent: outdatedBuildInfo,
      currentVersion,
    });
    expect(result.needsBuild).toBe(true);
    expect(result.reason).toContain('Production build version (v0.1.3) is outdated (codebase is v0.2.0)');
  });

  it('bypasses build when routes manifest, BUILD_ID, and app-build-info version strictly match current version', () => {
    const result = checkNeedsBuild({
      routesManifestExists: true,
      buildIdExists: true,
      routesManifestContent: validRoutesManifest,
      buildInfoContent: validBuildInfo,
      currentVersion,
    });
    expect(result.needsBuild).toBe(false);
    expect(result.reason).toBe('');
  });
});

