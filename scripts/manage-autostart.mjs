import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import readline from 'node:readline';

const isWindows = process.platform === 'win32';
const cwd = process.cwd();

function getWindowsShortcuts() {
  if (!isWindows) return [];
  const dir = path.join(process.env.APPDATA || '', 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup');
  return [path.join(dir, 'MosqueSignage.lnk'), path.join(dir, 'MosqueSignage-Kiosk.lnk')];
}

function runPowerShell(script) {
  const b64 = Buffer.from(script, 'utf16le').toString('base64');
  return execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-EncodedCommand', b64], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
    windowsHide: true,
  });
}

function formatStatusLabel(status) {
  if (!status.enabled) return 'Disabled';
  if (status.mode === 'display') return 'Enabled (TV Display Mode)';
  if (status.mode === 'server') return 'Enabled (Server-Only Mode)';
  return 'Enabled (Custom)';
}

function checkWindowsStatus() {
  if (!isWindows) return { enabled: false, mode: null, path: null };
  const [primary, legacy] = getWindowsShortcuts();
  const target = fs.existsSync(primary) ? primary : fs.existsSync(legacy) ? legacy : null;
  if (!target) return { enabled: false, mode: null, path: null };

  try {
    const script = `$w=New-Object -ComObject WScript.Shell; $s=$w.CreateShortcut('${target.replace(/'/g, "''")}'); Write-Output $s.Arguments`;
    const args = runPowerShell(script).trim();
    const mode = args.includes('OPEN_BROWSER=display') ? 'display' : 'server';
    return { enabled: true, mode, path: target };
  } catch {
    return { enabled: true, mode: 'unknown', path: target };
  }
}

function removeWindowsAutostart() {
  if (!isWindows) return false;
  let removed = false;
  for (const shortcut of getWindowsShortcuts()) {
    if (fs.existsSync(shortcut)) {
      try { fs.unlinkSync(shortcut); removed = true; }
      catch (err) { console.error(`[ERROR] Failed to delete shortcut ${shortcut}:`, err); }
    }
  }
  return removed;
}

function setWindowsAutostart(mode = 'display') {
  if (!isWindows) return false;
  removeWindowsAutostart();
  const [primary] = getWindowsShortcuts();
  const envVar = mode === 'display' ? 'set OPEN_BROWSER=display&& ' : '';
  const args = `/c cd /d "${cwd}" && ${envVar}npm start`;
  const esc = (v) => String(v).replace(/'/g, "''");

  runPowerShell([
    '$w = New-Object -ComObject WScript.Shell',
    `$s = $w.CreateShortcut('${esc(primary)}')`,
    "$s.TargetPath = 'cmd.exe'",
    `$s.Arguments = '${esc(args)}'`,
    `$s.WorkingDirectory = '${esc(cwd)}'`,
    '$s.WindowStyle = 7',
    "$s.Description = 'MosqueSignage Appliance Autostart'",
    '$s.Save()',
  ].join('\n'));
  return true;
}

function printNonWindowsHelp() {
  console.log(`\n=== MosqueSignage Autostart Guide (${process.platform === 'darwin' ? 'macOS' : 'Linux'}) ===\n`);
  if (process.platform === 'darwin') {
    console.log(`Server autostart: Create ~/Library/LaunchAgents/com.mosquesignage.appliance.plist (cwd: ${cwd}, cmd: npm start)`);
    console.log('Separate TV device: Open http://<YOUR-SERVER-IP>:3000/display in Chrome/Edge -> Install App -> enable Auto-start.\n');
  } else {
    console.log(`1) Local Server (systemd): ~/.config/systemd/user/mosque-signage.service (WorkingDirectory=${cwd}, ExecStart=/usr/bin/npm start)`);
    console.log('   Enable: systemctl --user enable --now mosque-signage.service\n');
    console.log('2) Raspberry Pi TV Display: Create ~/.config/autostart/mosque-signage-display.desktop with:');
    console.log('   Exec=chromium-browser --kiosk --noerrdialogs --disable-infobars http://<YOUR-SERVER-IP>:3000/display\n');
  }
}

async function promptMenu(currentStatus) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = (q) => new Promise((resolve) => rl.question(q, resolve));

  console.log('\n==========================================================');
  console.log('   MosqueSignage Host Autostart Configuration');
  console.log('==========================================================');
  console.log(`Current Status: ${formatStatusLabel(currentStatus)}\n`);
  console.log('  [1] TV Display Mode   — This PC is plugged into the TV (server + fullscreen kiosk)');
  console.log('  [2] Server-Only Mode  — Background server only (other devices connect over Wi-Fi)');
  console.log('  [3] Disable / Remove Autostart');
  console.log('  [4] Exit without changes\n');

  const answer = (await ask('Select an option [1-4]: ')).trim();
  rl.close();

  if (answer === '1') {
    setWindowsAutostart('display');
    console.log('\n[SUCCESS] Configured for TV Display Mode (starts server + fullscreen TV kiosk).\n');
  } else if (answer === '2') {
    setWindowsAutostart('server');
    console.log('\n[SUCCESS] Configured for Server-Only Mode (starts server minimized in background).');
    console.log('Tip: On a separate TV computer, open http://<YOUR-SERVER-IP>:3000/display in Edge/Chrome,');
    console.log('     click Install App, and enable "Auto-start on device login" in edge://apps or chrome://apps.\n');
  } else if (answer === '3') {
    removeWindowsAutostart();
    console.log('\n[SUCCESS] Autostart shortcut removed. Autostart is now disabled.\n');
  } else {
    console.log('\nNo changes made.\n');
  }
}

async function main() {
  if (!isWindows) { printNonWindowsHelp(); return; }
  const args = process.argv.slice(2);
  const current = checkWindowsStatus();

  if (args.includes('--remove') || args.includes('-r') || args.includes('--disable')) {
    removeWindowsAutostart();
    console.log('[SUCCESS] MosqueSignage autostart disabled and removed from Startup.');
  } else if (args.includes('--display') || args.includes('-d') || args.includes('--kiosk')) {
    setWindowsAutostart('display');
    console.log('[SUCCESS] MosqueSignage autostart enabled in TV Display Mode.');
  } else if (args.includes('--server') || args.includes('-s') || args.includes('--headless')) {
    setWindowsAutostart('server');
    console.log('[SUCCESS] MosqueSignage autostart enabled in Server-Only Mode.');
  } else if (args.includes('--status')) {
    console.log(`MosqueSignage Autostart Status: ${formatStatusLabel(current)}`);
    if (current.path) console.log(`Shortcut: ${current.path}`);
  } else {
    await promptMenu(current);
  }
}

const isDirectEntry = Boolean(process.argv[1]) && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirectEntry) {
  main().catch((err) => { console.error('[ERROR]', err.message || err); process.exit(1); });
}
