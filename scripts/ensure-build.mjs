import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

export const routesManifestPath = path.join(process.cwd(), '.next', 'routes-manifest.json');
export const buildIdPath = path.join(process.cwd(), '.next', 'BUILD_ID');
export const buildInfoPath = path.join(process.cwd(), '.next', 'app-build-info.json');
export const pkgPath = path.join(process.cwd(), 'package.json');

export function getAppVersion() {
  try {
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      if (pkg.version) return pkg.version;
    }
  } catch {
    // Safe fallback
  }
  return 'unknown';
}

export function checkNeedsBuild({
  routesManifestExists,
  buildIdExists,
  routesManifestContent,
  buildInfoContent,
  currentVersion,
}) {
  if (!routesManifestExists || !buildIdExists) {
    return { needsBuild: true, reason: 'Production build output missing' };
  }

  try {
    const parsed =
      typeof routesManifestContent === 'string'
        ? JSON.parse(routesManifestContent)
        : routesManifestContent;
    if (!parsed || !Array.isArray(parsed.dataRoutes)) {
      return {
        needsBuild: true,
        reason: 'Production build was overwritten by development server (next dev)',
      };
    }
  } catch {
    return { needsBuild: true, reason: 'Corrupted build manifest in .next' };
  }

  if (!buildInfoContent) {
    return {
      needsBuild: true,
      reason: `Build version metadata missing (codebase is v${currentVersion})`,
    };
  }

  try {
    const buildInfo =
      typeof buildInfoContent === 'string'
        ? JSON.parse(buildInfoContent)
        : buildInfoContent;
    if (buildInfo.version !== currentVersion) {
      return {
        needsBuild: true,
        reason: `Production build version (v${buildInfo.version}) is outdated (codebase is v${currentVersion})`,
      };
    }
  } catch {
    return { needsBuild: true, reason: 'Invalid build version metadata' };
  }

  return { needsBuild: false, reason: '' };
}

export function writeBuildInfo(version = getAppVersion()) {
  try {
    const buildId = fs.existsSync(buildIdPath)
      ? fs.readFileSync(buildIdPath, 'utf8').trim()
      : '';
    fs.writeFileSync(
      buildInfoPath,
      JSON.stringify(
        {
          version,
          buildId,
          builtAt: new Date().toISOString(),
        },
        null,
        2
      )
    );
  } catch {
    // Non-fatal if writing build info fails
  }
}

export function runEnsureBuild() {
  const currentVersion = getAppVersion();
  const routesManifestExists = fs.existsSync(routesManifestPath);
  const buildIdExists = fs.existsSync(buildIdPath);
  const routesManifestContent = routesManifestExists
    ? fs.readFileSync(routesManifestPath, 'utf8')
    : null;
  const buildInfoContent = fs.existsSync(buildInfoPath)
    ? fs.readFileSync(buildInfoPath, 'utf8')
    : null;

  const { needsBuild, reason } = checkNeedsBuild({
    routesManifestExists,
    buildIdExists,
    routesManifestContent,
    buildInfoContent,
    currentVersion,
  });

  if (needsBuild) {
    console.log(`[mosque-signage] ${reason}. Running "next build --webpack"...`);
    execSync('next build --webpack', { stdio: 'inherit' });
    writeBuildInfo(currentVersion);
  }
}

const isDirectEntry =
  Boolean(process.argv[1]) &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectEntry) {
  runEnsureBuild();
}
