import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execSync } from 'node:child_process';

describe('Data Migration Script (migrate-data.mjs)', () => {
  let tmpRoot: string;
  let sourceAppDir: string;
  let targetAppDir: string;

  beforeEach(() => {
    tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'migrate-test-'));
    sourceAppDir = path.join(tmpRoot, 'source-app');
    targetAppDir = path.join(tmpRoot, 'target-app');

    fs.mkdirSync(path.join(sourceAppDir, 'data'), { recursive: true });
    fs.mkdirSync(path.join(sourceAppDir, 'public', 'uploads', 'frames'), { recursive: true });

    fs.mkdirSync(path.join(targetAppDir, 'data'), { recursive: true });
    fs.mkdirSync(path.join(targetAppDir, 'public', 'uploads'), { recursive: true });
  });

  afterEach(() => {
    try {
      fs.rmSync(tmpRoot, { recursive: true, force: true });
    } catch {}
  });

  it('migrates primary mosque_signage.db and uploaded files successfully', () => {
    // Populate source data
    const dbContent = 'TEST_SQLITE_HEADER_CONTENT';
    fs.writeFileSync(path.join(sourceAppDir, 'data', 'mosque_signage.db'), dbContent);
    fs.writeFileSync(path.join(sourceAppDir, 'data', '.session_secret'), 'secret123456789012345678901234567890');
    fs.writeFileSync(path.join(sourceAppDir, 'public', 'uploads', 'test-poster.webp'), 'WEBP_BYTES');

    const migrateScriptPath = path.resolve(process.cwd(), 'scripts/migrate-data.mjs');
    execSync(`node "${migrateScriptPath}" "${sourceAppDir}"`, {
      cwd: targetAppDir,
      encoding: 'utf-8',
    });

    // Verify target received mosque_signage.db
    const targetDb = path.join(targetAppDir, 'data', 'mosque_signage.db');
    expect(fs.existsSync(targetDb)).toBe(true);
    expect(fs.readFileSync(targetDb, 'utf-8')).toBe(dbContent);

    // Verify uploaded file was transferred
    const targetFile = path.join(targetAppDir, 'public', 'uploads', 'test-poster.webp');
    expect(fs.existsSync(targetFile)).toBe(true);
    expect(fs.readFileSync(targetFile, 'utf-8')).toBe('WEBP_BYTES');
  });

  it('migrates legacy signage.db and copies it as mosque_signage.db in target', () => {
    // Populate source with legacy signage.db
    const legacyContent = 'LEGACY_SQLITE_CONTENT';
    fs.writeFileSync(path.join(sourceAppDir, 'data', 'signage.db'), legacyContent);

    const migrateScriptPath = path.resolve(process.cwd(), 'scripts/migrate-data.mjs');
    execSync(`node "${migrateScriptPath}" "${sourceAppDir}"`, {
      cwd: targetAppDir,
      encoding: 'utf-8',
    });

    const targetDb = path.join(targetAppDir, 'data', 'mosque_signage.db');
    expect(fs.existsSync(targetDb)).toBe(true);
    expect(fs.readFileSync(targetDb, 'utf-8')).toBe(legacyContent);
  });

  it('detects database inside nested unzipped subdirectories', () => {
    // Create nested directory: wrapper-folder/unzipped-release/data/mosque_signage.db
    const wrapperDir = path.join(tmpRoot, 'wrapper-folder');
    const nestedDir = path.join(wrapperDir, 'mosque-signage-0.1.0');
    fs.mkdirSync(path.join(nestedDir, 'data'), { recursive: true });
    fs.mkdirSync(path.join(nestedDir, 'public', 'uploads'), { recursive: true });

    fs.writeFileSync(path.join(nestedDir, 'data', 'mosque_signage.db'), 'NESTED_DB_DATA');

    const migrateScriptPath = path.resolve(process.cwd(), 'scripts/migrate-data.mjs');
    execSync(`node "${migrateScriptPath}" "${wrapperDir}"`, {
      cwd: targetAppDir,
      encoding: 'utf-8',
    });

    const targetDb = path.join(targetAppDir, 'data', 'mosque_signage.db');
    expect(fs.existsSync(targetDb)).toBe(true);
    expect(fs.readFileSync(targetDb, 'utf-8')).toBe('NESTED_DB_DATA');
  });
});

