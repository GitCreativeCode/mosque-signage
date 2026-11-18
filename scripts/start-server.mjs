import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { spawn } from 'node:child_process';
import { pathToFileURL } from 'node:url';

function isPrivateLanIpv4(addr) {
  return (
    addr.startsWith('192.168.') ||
    addr.startsWith('10.') ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(addr)
  );
}

/** Detects the host computer's real Wi-Fi/Ethernet LAN IPv4 (skipping loopback and 169.254.* link-local adapters). */
export function detectPrimaryLanIp(interfaces = os.networkInterfaces()) {
  const candidates = [];
  for (const entries of Object.values(interfaces)) {
    if (!entries) continue;
    for (const info of entries) {
      const isIpv4 = info.family === 'IPv4' || info.family === 4;
      if (!isIpv4 || info.internal || !info.address) continue;
      if (info.address.startsWith('169.254.')) continue;
      candidates.push(info.address);
    }
  }
  return candidates.find(isPrivateLanIpv4) ?? candidates[0] ?? null;
}

function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close(() => resolve(true));
    });
    server.listen(port);
  });
}

async function resolvePort(preferredPort = 3000, maxAttempts = 20) {
  const start = Number(process.env.PORT) || preferredPort;
  for (let port = start; port < start + maxAttempts; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  return start;
}

async function startAppliance() {
  const chosenPort = await resolvePort(3000);
  const lanIp = detectPrimaryLanIp();

  if (chosenPort !== 3000 && !process.env.PORT) {
    console.log(`\n[NOTICE] Port 3000 is currently occupied.`);
    console.log(`Appliance automatically assigned to next available port: ${chosenPort}`);
  }

  console.log('\n==========================================================');
  console.log('   MosqueSignage Digital Signage Appliance');
  console.log('==========================================================');
  console.log('   Local Access (This Computer):');
  console.log(`     • TV Display:   http://localhost:${chosenPort}/display`);
  console.log(`     • Admin Portal: http://localhost:${chosenPort}/admin  (PIN: 1234)`);
  if (lanIp) {
    console.log('\n   Remote Screens & Mobile (Same Wi-Fi / LAN):');
    console.log(`     • Connect TV:   http://${lanIp}:${chosenPort}/display`);
    console.log(`     • Mobile Admin: http://${lanIp}:${chosenPort}/admin`);
  }
  console.log('==========================================================\n');

  const nextCliPath = path.join(process.cwd(), 'node_modules', 'next', 'dist', 'bin', 'next');
  const hasLocalCli = fs.existsSync(nextCliPath);
  const cmd = hasLocalCli ? process.execPath : (process.platform === 'win32' ? 'next.cmd' : 'next');
  const args = hasLocalCli ? [nextCliPath, 'start', '-p', String(chosenPort)] : ['start', '-p', String(chosenPort)];

  const nextProcess = spawn(cmd, args, {
    stdio: 'inherit',
    env: { ...process.env, PORT: String(chosenPort) },
  });

  if (process.env.OPEN_BROWSER) {
    setTimeout(() => {
      const isDisplay = ['display', 'app', 'kiosk'].includes(process.env.OPEN_BROWSER);
      const targetPath = isDisplay ? '/display' : '/admin';
      const url = `http://localhost:${chosenPort}${targetPath}`;
      try {
        if (process.platform === 'win32') {
          if (isDisplay) {
            const edgeDirs = [process.env['ProgramFiles(x86)'], process.env['ProgramFiles']].filter(Boolean);
            const edgeExe = edgeDirs.map((d) => path.join(d, 'Microsoft', 'Edge', 'Application', 'msedge.exe')).find(fs.existsSync);
            const chromeDirs = [process.env['ProgramFiles'], process.env['ProgramFiles(x86)'], process.env['LocalAppData']].filter(Boolean);
            const chromeExe = chromeDirs.map((d) => path.join(d, 'Google', 'Chrome', 'Application', 'chrome.exe')).find(fs.existsSync);
            const browserExe = edgeExe || chromeExe;
            if (browserExe) {
              spawn(browserExe, ['--kiosk', url, '--no-first-run', '--disable-pinch'], { stdio: 'ignore', detached: true }).unref();
              return;
            }
          }
          spawn('cmd', ['/c', 'start', url], { stdio: 'ignore', detached: true }).unref();
        } else if (process.platform === 'darwin') {
          if (isDisplay) {
            spawn('open', ['-a', 'Google Chrome', '--args', '--kiosk', url], { stdio: 'ignore', detached: true }).unref();
          } else {
            spawn('open', [url], { stdio: 'ignore', detached: true }).unref();
          }
        } else {
          if (isDisplay) {
            spawn('chromium-browser', ['--kiosk', url], { stdio: 'ignore', detached: true }).unref();
          } else {
            spawn('xdg-open', [url], { stdio: 'ignore', detached: true }).unref();
          }
        }
      } catch {
        // Safe fallback if graphical display server is unavailable
      }
    }, 1200);
  }

  nextProcess.on('exit', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
    } else {
      process.exit(code ?? 0);
    }
  });

  process.on('SIGINT', () => nextProcess.kill('SIGINT'));
  process.on('SIGTERM', () => nextProcess.kill('SIGTERM'));
}

const isDirectEntry = Boolean(process.argv[1]) && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirectEntry) {
  startAppliance().catch((err) => {
    console.error('[mosque-signage] Failed to start server:', err);
    process.exit(1);
  });
}
