import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const routesManifestPath = path.join(process.cwd(), '.next', 'routes-manifest.json');
const buildIdPath = path.join(process.cwd(), '.next', 'BUILD_ID');

let needsBuild = false;

if (!fs.existsSync(routesManifestPath) || !fs.existsSync(buildIdPath)) {
  needsBuild = true;
} else {
  try {
    const raw = fs.readFileSync(routesManifestPath, 'utf8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.dataRoutes)) {
      needsBuild = true;
    }
  } catch {
    needsBuild = true;
  }
}

if (needsBuild) {
  console.log('[mosque-signage] Production build missing or overwritten by dev server. Running "next build"...');
  execSync('next build', { stdio: 'inherit' });
}

