import fs from 'node:fs';
import path from 'node:path';

const buildInfoPath = path.join(process.cwd(), '.next', 'app-build-info.json');
const buildIdPath = path.join(process.cwd(), '.next', 'BUILD_ID');
const pkgPath = path.join(process.cwd(), 'package.json');

export function recordBuildInfo() {
  try {
    if (!fs.existsSync(pkgPath)) return;
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    const version = pkg.version;
    if (!version) return;

    const buildId = fs.existsSync(buildIdPath)
      ? fs.readFileSync(buildIdPath, 'utf8').trim()
      : '';
    const nextDir = path.join(process.cwd(), '.next');
    if (fs.existsSync(nextDir)) {
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
    }
  } catch {
    // Non-fatal if writing build info fails
  }
}

recordBuildInfo();

