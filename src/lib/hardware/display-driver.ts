import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type { TvControlProtocol, HardwareCommandResult } from '@/types/index';
import { eventBus } from '@/lib/events/event-bus';

const execFileAsync = promisify(execFile);

const VALID_ACTIONS = new Set<'ON' | 'STANDBY'>(['ON', 'STANDBY']);
const VALID_PROTOCOLS = new Set<TvControlProtocol>([
  'software_blackout',
  'hybrid',
  'cec_client',
  'dpms',
]);

const WIN_DPMS_STANDBY_PS = [
  'Add-Type -TypeDefinition \'using System; using System.Runtime.InteropServices; public class MsDpms { [DllImport("user32.dll")] public static extern bool PostMessage(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam); }\'',
  '[MsDpms]::PostMessage([IntPtr]0xFFFF, 0x0112, [IntPtr]0xF170, [IntPtr]2) | Out-Null',
].join('\n');

const WIN_DPMS_WAKE_PS = [
  'Add-Type -TypeDefinition \'using System; using System.Runtime.InteropServices; public class MsWake { [DllImport("kernel32.dll")] public static extern uint SetThreadExecutionState(uint esFlags); [DllImport("user32.dll")] public static extern void mouse_event(uint dwFlags, int dx, int dy, uint dwData, UIntPtr dwExtraInfo); }\'',
  '[MsWake]::SetThreadExecutionState(0x00000003) | Out-Null',
  '[MsWake]::mouse_event(0x0001, 0, 0, 0, [UIntPtr]::Zero)',
].join('\n');

let isHardwareCommandRunning = false;

export function isValidTvControlProtocol(value: unknown): value is TvControlProtocol {
  return typeof value === 'string' && VALID_PROTOCOLS.has(value as TvControlProtocol);
}

export function isValidPowerAction(value: unknown): value is 'ON' | 'STANDBY' {
  return typeof value === 'string' && VALID_ACTIONS.has(value as 'ON' | 'STANDBY');
}

function runCecClient(isPowerOn: boolean): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = execFile(
      'cec-client',
      ['-s', '-d', '1'],
      { timeout: 5000 },
      (err) => {
        if (err) reject(err);
        else resolve();
      }
    );
    child.stdin?.write(isPowerOn ? 'on 0\n' : 'standby 0\n');
    child.stdin?.end();
  });
}

async function runWindowsDpms(isPowerOn: boolean): Promise<void> {
  const script = isPowerOn ? WIN_DPMS_WAKE_PS : WIN_DPMS_STANDBY_PS;
  const encoded = Buffer.from(script, 'utf16le').toString('base64');
  await execFileAsync(
    'powershell.exe',
    ['-NoProfile', '-NonInteractive', '-EncodedCommand', encoded],
    { timeout: 12000, windowsHide: true }
  );
}

async function runLinuxDpms(isPowerOn: boolean): Promise<void> {
  await execFileAsync(
    'xset',
    ['dpms', 'force', isPowerOn ? 'on' : 'off'],
    { timeout: 4000 }
  );
}

/**
 * Dispatches an OS or hardware level display power command safely using execFile
 * (never spawning an interactive shell or interpolating user input) and broadcasts
 * the software blackout standby signal to all connected kiosk displays via SSE.
 */
export async function dispatchTvPowerCommand(
  action: 'ON' | 'STANDBY',
  protocol: TvControlProtocol = 'software_blackout',
  options?: { readonly isManualTest?: boolean | undefined }
): Promise<HardwareCommandResult> {
  const timestamp = new Date().toISOString();

  if (!isValidPowerAction(action) || !isValidTvControlProtocol(protocol)) {
    return {
      success: false,
      method: 'software_blackout',
      message: 'Invalid power action or control mode rejected.',
      timestamp,
    };
  }

  const isPowerOn = action === 'ON';
  const requiresHostHardware = protocol !== 'software_blackout';
  let executionDetail = '';

  if (requiresHostHardware) {
    if (isHardwareCommandRunning) {
      return {
        success: false,
        method: protocol,
        message: 'A hardware display command is already in progress. Please wait a moment and try again.',
        timestamp,
      };
    }

    isHardwareCommandRunning = true;
    try {
      let hardwareSucceeded = false;

      if (protocol === 'cec_client' || protocol === 'hybrid') {
        if (process.platform === 'linux') {
          try {
            await runCecClient(isPowerOn);
            executionDetail = `Local HDMI-CEC '${isPowerOn ? 'on 0' : 'standby 0'}' dispatched`;
            hardwareSucceeded = true;
          } catch {
            executionDetail = 'Local HDMI-CEC unavailable on this host (cec-client or CEC adapter not found)';
          }
        } else if (protocol === 'cec_client') {
          executionDetail = 'HDMI-CEC requires Linux or Raspberry Pi with a CEC-capable HDMI port';
        }
      }

      if ((protocol === 'dpms' || protocol === 'hybrid') && !hardwareSucceeded) {
        if (process.platform === 'win32') {
          try {
            await runWindowsDpms(isPowerOn);
            executionDetail = `Local Windows monitor ${isPowerOn ? 'wake' : 'standby'} dispatched`;
          } catch {
            executionDetail = 'Local Windows monitor command skipped (no interactive desktop session or blocked by OS policy)';
          }
        } else if (process.platform === 'linux') {
          try {
            await runLinuxDpms(isPowerOn);
            executionDetail = `Local Linux X11 DPMS ${isPowerOn ? 'wake' : 'standby'} dispatched`;
          } catch {
            executionDetail = 'Local Linux X11 DPMS skipped (xset unavailable or no X11 display)';
          }
        } else {
          executionDetail = 'Local monitor sleep (DPMS) is not supported on this OS; using Browser Blackout';
        }
      }
    } finally {
      isHardwareCommandRunning = false;
    }
  }

  // Always broadcast software standby state to all connected kiosk displays via SSE
  eventBus.emitEvent('POWER_STATE_CHANGED', {
    timestamp,
    state: action,
    method: protocol,
    reason: options?.isManualTest
      ? `Manual admin test: ${action}`
      : `Power schedule automated trigger: ${action}`,
  });

  const finalMessage = requiresHostHardware
    ? `Display set to ${action}. ${executionDetail}. Browser blackout synced to all connected displays.`
    : `Display set to ${action}. Browser blackout synced to all connected displays${options?.isManualTest && !isPowerOn ? ' (auto-resumes in 60s)' : ''}.`;

  return {
    success: true,
    method: protocol,
    message: finalMessage,
    timestamp,
  };
}
