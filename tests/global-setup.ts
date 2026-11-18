import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

function resolveIsolatedUploadsDir(): string {
  return process.env['UPLOADS_DIR']?.trim()
    ? path.resolve(process.env['UPLOADS_DIR'])
    : path.join(os.tmpdir(), 'mosque_signage_vitest_uploads');
}

export function setup(): void {
  const dir = resolveIsolatedUploadsDir();
  fs.mkdirSync(dir, { recursive: true });
}

export function teardown(): void {
  const dir = resolveIsolatedUploadsDir();
  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch {
    // Best-effort cleanup for Windows file handle release timing
  }
}

