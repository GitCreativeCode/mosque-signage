import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import {
  dispatchTvPowerCommand,
  isValidPowerAction,
  isValidTvControlProtocol,
} from '@/lib/hardware/display-driver';
import { resolveStandbyWithManualOverride } from '@/hooks/choreography-side-effects';
import { POWER_CONTROL_MODE_OPTIONS } from '@/components/admin/settings/PowerControlModePicker';
import { eventBus } from '@/lib/events/event-bus';

describe('Display Auto-Power Security, Edge Cases & Remote Synchronization', () => {
  describe('Security: Allowlist & Shell-Injection Defenses', () => {
    it('strictly validates power actions and rejects command-injection payloads', () => {
      expect(isValidPowerAction('ON')).toBe(true);
      expect(isValidPowerAction('STANDBY')).toBe(true);
      expect(isValidPowerAction('STANDBY; calc.exe')).toBe(false);
      expect(isValidPowerAction('ON && whoami')).toBe(false);
      expect(isValidPowerAction('')).toBe(false);
      expect(isValidPowerAction(null)).toBe(false);
    });

    it('strictly validates control protocols and rejects unknown/malicious values', () => {
      expect(isValidTvControlProtocol('software_blackout')).toBe(true);
      expect(isValidTvControlProtocol('hybrid')).toBe(true);
      expect(isValidTvControlProtocol('cec_client')).toBe(true);
      expect(isValidTvControlProtocol('dpms')).toBe(true);
      expect(isValidTvControlProtocol('dpms; rm -rf /')).toBe(false);
      expect(isValidTvControlProtocol('powershell')).toBe(false);
    });

    it('rejects malformed action or protocol cleanly inside dispatchTvPowerCommand without throwing', async () => {
      const badAction = await dispatchTvPowerCommand('INVALID' as 'ON', 'software_blackout');
      expect(badAction.success).toBe(false);
      expect(badAction.message).toContain('rejected');

      const badProto = await dispatchTvPowerCommand('ON', 'evil;cmd' as 'dpms');
      expect(badProto.success).toBe(false);
      expect(badProto.message).toContain('rejected');
    });

    it('uses shell-free execFile in display-driver.ts and never leaks raw PowerShell commands to UI', () => {
      const driverSrc = fs.readFileSync(
        path.resolve(process.cwd(), 'src/lib/hardware/display-driver.ts'),
        'utf8'
      );
      const actionsSrc = fs.readFileSync(
        path.resolve(process.cwd(), 'src/lib/actions/hardware.ts'),
        'utf8'
      );

      expect(driverSrc).toContain("import { execFile } from 'node:child_process'");
      expect(driverSrc).not.toMatch(/import\s*\{[^}]*\bexec\b[^}]*\}\s*from\s*'node:child_process'/);
      expect(driverSrc).toContain('-EncodedCommand');
      expect(driverSrc).not.toContain('DPMS command skipped (${msg');
      expect(actionsSrc).toContain('await requireAdminAuth()');
    });
  });

  describe('Server vs. Remote Display Safety & Defaults', () => {
    it('defaults to software_blackout so remote TVs work safely without executing host OS commands', async () => {
      const captured: Array<{ state?: string; method?: string }> = [];
      const unsub = eventBus.subscribe('POWER_STATE_CHANGED', (payload) => {
        captured.push(payload as { state?: string; method?: string });
      });

      try {
        const res = await dispatchTvPowerCommand('STANDBY', undefined, { isManualTest: true });
        expect(res.success).toBe(true);
        expect(res.method).toBe('software_blackout');
        expect(res.message).toContain('auto-resumes in 60s');
        expect(captured.length).toBe(1);
        expect(captured[0]?.state).toBe('STANDBY');
        expect(captured[0]?.method).toBe('software_blackout');
      } finally {
        unsub();
      }
    });

    it('classifies Browser Blackout as safe for all displays and hardware modes as Local Host Only', () => {
      const software = POWER_CONTROL_MODE_OPTIONS.find((o) => o.value === 'software_blackout');
      const hybrid = POWER_CONTROL_MODE_OPTIONS.find((o) => o.value === 'hybrid');
      const cec = POWER_CONTROL_MODE_OPTIONS.find((o) => o.value === 'cec_client');
      const dpms = POWER_CONTROL_MODE_OPTIONS.find((o) => o.value === 'dpms');

      expect(software?.isLocalHostHardware).toBe(false);
      expect(hybrid?.isLocalHostHardware).toBe(true);
      expect(cec?.isLocalHostHardware).toBe(true);
      expect(dpms?.isLocalHostHardware).toBe(true);
    });
  });

  describe('60-Second Manual Standby Override & Auto-Recovery', () => {
    it('activates standby during daytime ON window while manual STANDBY override is unexpired', () => {
      const now = 1_700_000_000_000;
      const override = { state: 'STANDBY' as const, expiresAtMs: now + 60_000 };

      expect(resolveStandbyWithManualOverride(false, override, now + 10_000)).toBe(true);
    });

    it('auto-expires forgotten Test Standby after 60s and resumes normal daytime schedule', () => {
      const now = 1_700_000_000_000;
      const override = { state: 'STANDBY' as const, expiresAtMs: now + 60_000 };

      expect(resolveStandbyWithManualOverride(false, override, now + 60_001)).toBe(false);
    });

    it('allows manual Test Wake On during overnight OFF window and resumes standby after 60s', () => {
      const now = 1_700_000_000_000;
      const override = { state: 'ON' as const, expiresAtMs: now + 60_000 };

      expect(resolveStandbyWithManualOverride(true, override, now + 15_000)).toBe(false);
      expect(resolveStandbyWithManualOverride(true, override, now + 60_001)).toBe(true);
    });

    it('defers to scheduledStandby when override is null', () => {
      expect(resolveStandbyWithManualOverride(true, null)).toBe(true);
      expect(resolveStandbyWithManualOverride(false, null)).toBe(false);
    });
  });

  describe('UI Guardrails & Live SSE/Broadcast Wiring', () => {
    it('disables Prayer-Relative Offsets when no prayer timings are configured', () => {
      const cardSrc = fs.readFileSync(
        path.resolve(process.cwd(), 'src/components/admin/settings/AppliancePowerCard.tsx'),
        'utf8'
      );

      expect(cardSrc).toContain("mode === 'prayer_relative' && !hasPrayerTiming");
      expect(cardSrc).toContain('disabled={isDisabled}');
      expect(cardSrc).toContain('testTvPowerAction(action, tvControlProtocol)');
    });

    it('wires POWER_STATE_CHANGED across SSE stream and BroadcastChannel to display choreography', () => {
      const sseSrc = fs.readFileSync(
        path.resolve(process.cwd(), 'src/hooks/useDisplaySseStream.ts'),
        'utf8'
      );
      const syncSrc = fs.readFileSync(
        path.resolve(process.cwd(), 'src/hooks/useDisplaySync.ts'),
        'utf8'
      );
      const choreoSrc = fs.readFileSync(
        path.resolve(process.cwd(), 'src/hooks/useDisplayChoreography.ts'),
        'utf8'
      );

      expect(sseSrc).toContain("addEventListener('POWER_STATE_CHANGED'");
      expect(syncSrc).toContain("message.type === 'POWER_STATE_CHANGED'");
      expect(choreoSrc).toContain("addEventListener('kiosk:power-state-changed'");
    });
  });

  describe('Server Startup Real LAN IP Detection', () => {
    it('skips loopback and 169.254.x.x link-local virtual adapters and selects real private LAN IPv4', async () => {
      const { detectPrimaryLanIp } = await import('../scripts/start-server.mjs');
      const mockInterfaces = {
        Loopback: [{ address: '127.0.0.1', family: 'IPv4', internal: true }],
        'Virtual Adapter': [{ address: '169.254.83.107', family: 'IPv4', internal: false }],
        'Wi-Fi': [
          { address: 'fe80::1', family: 'IPv6', internal: false },
          { address: '192.168.1.42', family: 'IPv4', internal: false },
        ],
      };
      expect(detectPrimaryLanIp(mockInterfaces as never)).toBe('192.168.1.42');
    });

    it('returns null gracefully when only loopback or disconnected link-local adapters exist', async () => {
      const { detectPrimaryLanIp } = await import('../scripts/start-server.mjs');
      const mockInterfaces = {
        Loopback: [{ address: '127.0.0.1', family: 'IPv4', internal: true }],
        Disconnected: [{ address: '169.254.12.34', family: 'IPv4', internal: false }],
      };
      expect(detectPrimaryLanIp(mockInterfaces as never)).toBeNull();
    });

    it('prints intuitive remote device instructions in start-server banner', () => {
      const startScript = fs.readFileSync(
        path.resolve(process.cwd(), 'scripts/start-server.mjs'),
        'utf8'
      );
      expect(startScript).toContain('Remote Screens & Mobile (Same Wi-Fi / LAN):');
      expect(startScript).toContain('• Connect TV:');
      expect(startScript).toContain('• Mobile Admin:');
      expect(startScript).not.toContain('Other Devices:');
    });
  });

  describe('Power Control Guide Modal & Standby Customization', () => {
    it('provides accessible modal guide and hover tooltip for power control modes', () => {
      const pickerSrc = fs.readFileSync(path.resolve(process.cwd(), 'src/components/admin/settings/PowerControlModePicker.tsx'), 'utf8');
      const modalSrc = fs.readFileSync(path.resolve(process.cwd(), 'src/components/admin/settings/PowerControlGuideModal.tsx'), 'utf8');

      expect(pickerSrc).toContain('PowerControlGuideModal');
      expect(pickerSrc).toContain('role="tooltip"');
      expect(modalSrc).toContain('role="dialog"');
      expect(modalSrc).toContain('aria-modal="true"');
      expect(modalSrc).toContain('useFocusTrap');
      expect(modalSrc).toContain('Browser Blackout');
      expect(modalSrc).toContain('Windows Lock Screen');
    });

    it('supports customizable Standby appearance and opt-in attribution watermark', () => {
      const overlaySrc = fs.readFileSync(path.resolve(process.cwd(), 'src/components/display/StandbyOverlay.tsx'), 'utf8');
      const cardSrc = fs.readFileSync(path.resolve(process.cwd(), 'src/components/admin/settings/AppliancePowerCard.tsx'), 'utf8');

      expect(overlaySrc).toContain("appearance === 'dim_clock'");
      expect(overlaySrc).toContain("Powered by MosqueSignage");
      expect(overlaySrc).toContain("appearance === 'pure_black'");
      expect(cardSrc).toContain('standbyAppearance');
      expect(cardSrc).toContain('standbyShowAttribution');
      expect(cardSrc).toContain("disabled={standbyAppearance === 'pure_black'}");
    });
  });
});

