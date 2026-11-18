import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';

const targetRoot = process.cwd();

function log(msg, color = '\x1b[0m') {
  console.log(`${color}${msg}\x1b[0m`);
}

function resolveOldPath(inputPath) {
  if (!inputPath) return null;
  const cleanPath = inputPath.trim().replace(/^['"]|['"]$/g, '');
  return path.resolve(cleanPath);
}

function copyDirectoryRecursive(src, dest) {
  if (!fs.existsSync(src)) return 0;
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  let count = 0;
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      count += copyDirectoryRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
      count++;
    }
  }
  return count;
}

function mergeFramesRegistry(srcFile, destFile) {
  if (!fs.existsSync(srcFile)) return;
  try {
    const oldFrames = JSON.parse(fs.readFileSync(srcFile, 'utf8'));
    if (!Array.isArray(oldFrames)) return;

    let targetFrames = [];
    if (fs.existsSync(destFile)) {
      try {
        const parsed = JSON.parse(fs.readFileSync(destFile, 'utf8'));
        if (Array.isArray(parsed)) targetFrames = parsed;
      } catch {
        targetFrames = [];
      }
    }

    const seenIds = new Set(targetFrames.map((f) => f.id));
    let addedCount = 0;
    for (const frame of oldFrames) {
      if (frame && frame.id && !seenIds.has(frame.id)) {
        targetFrames.push(frame);
        seenIds.add(frame.id);
        addedCount++;
      }
    }

    fs.mkdirSync(path.dirname(destFile), { recursive: true });
    fs.writeFileSync(destFile, JSON.stringify(targetFrames, null, 2), 'utf8');
    if (addedCount > 0) {
      log(`  ✓ Merged ${addedCount} custom frame(s) into registry`, '\x1b[32m');
    }
  } catch (err) {
    log(`  ! Warning: Could not merge custom frames: ${err.message}`, '\x1b[33m');
  }
}

async function getSourcePath() {
  const argPath = process.argv[2];
  if (argPath) return resolveOldPath(argPath);

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const question = (q) => new Promise((resolve) => rl.question(q, resolve));

  log('==========================================================', '\x1b[36m');
  log('   MosqueSignage Appliance Data Migration Tool', '\x1b[32m');
  log('==========================================================', '\x1b[36m');
  log('This utility migrates your database, uploaded posters, videos,');
  log('and settings from an older MosqueSignage installation into this folder.\n');

  const answer = await question('Enter the path to your previous MosqueSignage folder: ');
  rl.close();
  return resolveOldPath(answer);
}

async function runMigration() {
  const sourceRoot = await getSourcePath();

  if (!sourceRoot || !fs.existsSync(sourceRoot)) {
    log(`\n[ERROR] Source directory does not exist: "${sourceRoot}"`, '\x1b[31m');
    process.exit(1);
  }

  if (path.resolve(sourceRoot) === path.resolve(targetRoot)) {
    log('\n[ERROR] Source directory is the same as the current target directory!', '\x1b[31m');
    process.exit(1);
  }

  const oldDataDir = path.join(sourceRoot, 'data');
  const oldDbFile = path.join(oldDataDir, 'signage.db');

  if (!fs.existsSync(oldDbFile)) {
    log(`\n[ERROR] Could not find SQLite database at: "${oldDbFile}"`, '\x1b[31m');
    log('Please ensure you selected the root folder of your previous MosqueSignage installation.', '\x1b[33m');
    process.exit(1);
  }

  log(`\nMigrating user data:`, '\x1b[36m');
  log(`  Source: ${sourceRoot}`);
  log(`  Target: ${targetRoot}\n`);

  const targetDataDir = path.join(targetRoot, 'data');
  fs.mkdirSync(targetDataDir, { recursive: true });

  const targetDbFile = path.join(targetDataDir, 'signage.db');
  if (fs.existsSync(targetDbFile)) {
    const backupDbFile = path.join(targetDataDir, `signage.db.backup-${Date.now()}`);
    fs.copyFileSync(targetDbFile, backupDbFile);
    log(`  ✓ Backed up existing target database to: ${path.basename(backupDbFile)}`, '\x1b[33m');
  }

  fs.copyFileSync(oldDbFile, targetDbFile);
  log(`  ✓ Migrated database: signage.db`, '\x1b[32m');

  for (const ext of ['-wal', '-shm']) {
    const oldWal = `${oldDbFile}${ext}`;
    const targetWal = `${targetDbFile}${ext}`;
    if (fs.existsSync(oldWal)) {
      fs.copyFileSync(oldWal, targetWal);
      log(`  ✓ Migrated SQLite journal: signage.db${ext}`, '\x1b[32m');
    } else if (fs.existsSync(targetWal)) {
      try {
        fs.unlinkSync(targetWal);
      } catch {}
    }
  }

  const oldSecret = path.join(oldDataDir, '.session_secret');
  const targetSecret = path.join(targetDataDir, '.session_secret');
  if (fs.existsSync(oldSecret)) {
    fs.copyFileSync(oldSecret, targetSecret);
    log(`  ✓ Migrated session cryptography secret`, '\x1b[32m');
  }

  const oldUploadsDir = path.join(sourceRoot, 'public', 'uploads');
  const targetUploadsDir = path.join(targetRoot, 'public', 'uploads');
  const uploadedFilesCount = copyDirectoryRecursive(oldUploadsDir, targetUploadsDir);
  log(`  ✓ Migrated ${uploadedFilesCount} uploaded poster/media file(s)`, '\x1b[32m');

  const oldFramesFile = path.join(oldUploadsDir, 'frames', 'frames.json');
  const targetFramesFile = path.join(targetUploadsDir, 'frames', 'frames.json');
  mergeFramesRegistry(oldFramesFile, targetFramesFile);

  log('\n==========================================================', '\x1b[32m');
  log('   MIGRATION COMPLETED SUCCESSFULLY!', '\x1b[32m');
  log('==========================================================', '\x1b[32m');
  log('All database records, prayer configurations, and media files have been moved.');
  log('You can now start MosqueSignage by running:');
  log('  npm start\n', '\x1b[36m');
}

runMigration().catch((err) => {
  log(`\n[FATAL ERROR] Migration failed: ${err.message}`, '\x1b[31m');
  process.exit(1);
});

