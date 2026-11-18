import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import net from 'node:net';
import {
  buildDenonMuteCommand,
  buildYamahaMuteCommand,
  buildWebhookPayload,
  encodeAudioCommand,
} from '@/lib/hardware/audio-protocol';
import { dispatchAudioReceiverCommand } from '@/lib/hardware/audio-driver';
import {
  scheduleFailSafeUnmute,
  clearFailSafeWatchdog,
  getWatchdogStatus,
  recoverAudioReceiverOnBoot,
} from '@/lib/hardware/audio-coordinator';
import type { AudioReceiverConfig } from '@/types/index';

describe('Hall Audio Receiver Driver & Protocol Suite', () => {
  const serverPort = 9999;
  let receivedData: string = '';

  beforeEach(() => {
    receivedData = '';

    vi.spyOn(net.Socket.prototype, 'connect').mockImplementation(function (
      this: net.Socket,
      port: unknown,
      _host?: unknown,
      _connectionListener?: unknown
    ) {
      if (port === serverPort) {
        queueMicrotask(() => {
          this.emit('connect');
        });
        return this;
      }
      queueMicrotask(() => {
        const err = new Error('connect ECONNREFUSED 127.0.0.1:65530');
        Object.assign(err, { code: 'ECONNREFUSED' });
        this.emit('error', err);
      });
      return this;
    });

    vi.spyOn(net.Socket.prototype, 'write').mockImplementation(function (
      this: net.Socket,
      buffer: unknown,
      encoding?: unknown,
      cb?: unknown
    ) {
      receivedData += String(buffer);
      const callback = typeof encoding === 'function' ? (encoding as () => void) : (cb as (() => void) | undefined);
      if (callback) {
        queueMicrotask(() => callback());
      }
      return true;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Protocol Command Encoding', () => {
    it('encodes Denon/Marantz Telnet mute on and off commands', () => {
      expect(buildDenonMuteCommand(true)).toBe('MUON\r');
      expect(buildDenonMuteCommand(false)).toBe('MUOFF\r');

      const encodedOn = encodeAudioCommand('denon_telnet', 'MUTE');
      expect(encodedOn.payload).toBe('MUON\r');
      expect(encodedOn.isJson).toBe(false);

      const encodedOff = encodeAudioCommand('denon_telnet', 'UNMUTE');
      expect(encodedOff.payload).toBe('MUOFF\r');
      expect(encodedOff.isJson).toBe(false);
    });

    it('encodes Yamaha MTX/MRX eCSVP memory preset recall commands', () => {
      expect(buildYamahaMuteCommand(true)).toBe('set MTX:MEM 1\n');
      expect(buildYamahaMuteCommand(false)).toBe('set MTX:MEM 2\n');

      const encoded = encodeAudioCommand('yamaha_csvp', 'MUTE');
      expect(encoded.payload).toBe('set MTX:MEM 1\n');
      expect(encoded.isJson).toBe(false);
    });

    it('encodes generic HTTP REST webhook payloads with metadata', () => {
      const fixedIso = '2026-10-25T12:00:00.000Z';
      const payloadMute = buildWebhookPayload(true, 'Fajr', fixedIso);

      expect(payloadMute.mute).toBe(true);
      expect(payloadMute.action).toBe('MUTE');
      expect(payloadMute.source).toBe('MosqueSignage');
      expect(payloadMute.prayer).toBe('Fajr');
      expect(payloadMute.timestamp).toBe(fixedIso);

      const payloadUnmute = buildWebhookPayload(false, 'Fajr', fixedIso);
      expect(payloadUnmute.mute).toBe(false);
      expect(payloadUnmute.action).toBe('UNMUTE');
    });
  });

  describe('TCP Socket Network Dispatch', () => {
    it('successfully connects and transmits Denon Telnet byte sequence', async () => {
      const config: AudioReceiverConfig = {
        audio_mute_during_prayer: true,
        audio_receiver_host: '127.0.0.1',
        audio_receiver_port: serverPort,
        audio_receiver_protocol: 'denon_telnet',
      };

      const result = await dispatchAudioReceiverCommand(config, 'MUTE', 'Dhuhr');
      expect(result.success).toBe(true);
      expect(receivedData).toBe('MUON\r');
      expect(result.message).toContain('Successfully sent');
    });

    it('successfully connects and transmits Yamaha MTX command sequence', async () => {
      const config: AudioReceiverConfig = {
        audio_mute_during_prayer: true,
        audio_receiver_host: '127.0.0.1',
        audio_receiver_port: serverPort,
        audio_receiver_protocol: 'yamaha_csvp',
      };

      const result = await dispatchAudioReceiverCommand(config, 'UNMUTE', 'Asr');
      expect(result.success).toBe(true);
      expect(receivedData).toBe('set MTX:MEM 2\n');
    });

    it('gracefully returns failure when host is unreachable without crashing', async () => {
      const config: AudioReceiverConfig = {
        audio_mute_during_prayer: true,
        audio_receiver_host: '127.0.0.1',
        // Deliberately target an unused port
        audio_receiver_port: 65530,
        audio_receiver_protocol: 'denon_telnet',
      };

      const result = await dispatchAudioReceiverCommand(config, 'MUTE');
      expect(result.success).toBe(false);
      expect(result.message).toMatch(/TCP socket error|ECONNREFUSED/);
    });

    it('returns failure when receiver host is blank', async () => {
      const config: AudioReceiverConfig = {
        audio_mute_during_prayer: true,
        audio_receiver_host: '',
        audio_receiver_port: 23,
        audio_receiver_protocol: 'denon_telnet',
      };

      const result = await dispatchAudioReceiverCommand(config, 'MUTE');
      expect(result.success).toBe(false);
      expect(result.message).toContain('Audio receiver host/IP is not configured');
    });
  });

  describe('HTTP Webhook Dispatch', () => {
    it('dispatches JSON webhook using fetch', async () => {
      const originalFetch = globalThis.fetch;
      let capturedBody = '';

      globalThis.fetch = vi.fn().mockImplementation(async (_url, options) => {
        capturedBody = options?.body as string;
        return {
          ok: true,
          status: 200,
        } as unknown as Response;
      });

      try {
        const config: AudioReceiverConfig = {
          audio_mute_during_prayer: true,
          audio_receiver_host: 'http://192.168.1.50/webhook',
          audio_receiver_port: 80,
          audio_receiver_protocol: 'http_webhook',
        };

        const result = await dispatchAudioReceiverCommand(config, 'MUTE', 'Maghrib');
        expect(result.success).toBe(true);
        expect(result.message).toContain('HTTP webhook delivered');

        const parsed = JSON.parse(capturedBody);
        expect(parsed.mute).toBe(true);
        expect(parsed.prayer).toBe('Maghrib');
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  });

  describe('Fail-Safe Watchdog Unmute Guard', () => {
    afterEach(() => {
      clearFailSafeWatchdog();
    });

    it('arms and clears the watchdog timer', () => {
      const config: AudioReceiverConfig = {
        audio_mute_during_prayer: true,
        audio_receiver_host: '127.0.0.1',
        audio_receiver_port: 23,
        audio_receiver_protocol: 'denon_telnet',
      };

      expect(getWatchdogStatus().isActive).toBe(false);

      scheduleFailSafeUnmute(60000, config, 'Isha');
      const status = getWatchdogStatus();
      expect(status.isActive).toBe(true);
      expect(status.expiryTimestamp).not.toBeNull();

      clearFailSafeWatchdog();
      expect(getWatchdogStatus().isActive).toBe(false);
    });
  });

  describe('Boot Recovery Unmute Guard', () => {
    type BootDriver = Exclude<Parameters<typeof recoverAudioReceiverOnBoot>[0], undefined | (() => unknown)>;

    it('dispatches UNMUTE when audio_mute_during_prayer is enabled and host is set', async () => {
      const dummyDriver: BootDriver = {
        prepare: () => ({
          get: () => ({
            audio_mute_during_prayer: 1,
            audio_receiver_host: '127.0.0.1',
            audio_receiver_port: 9999,
            audio_receiver_protocol: 'denon_telnet',
          }),
        }),
      };

      const recovered = await recoverAudioReceiverOnBoot(dummyDriver);
      expect(recovered).toBe(true);
      expect(receivedData).toBe('MUOFF\r');
    });

    it('skips UNMUTE when audio_mute_during_prayer is disabled', async () => {
      const dummyDriver: BootDriver = {
        prepare: () => ({
          get: () => ({
            audio_mute_during_prayer: 0,
            audio_receiver_host: '127.0.0.1',
            audio_receiver_port: 9999,
            audio_receiver_protocol: 'denon_telnet',
          }),
        }),
      };

      const recovered = await recoverAudioReceiverOnBoot(dummyDriver);
      expect(recovered).toBe(false);
    });

    it('skips UNMUTE when host is blank or unconfigured', async () => {
      const dummyDriver: BootDriver = {
        prepare: () => ({
          get: () => ({
            audio_mute_during_prayer: 1,
            audio_receiver_host: '   ',
            audio_receiver_port: 9999,
            audio_receiver_protocol: 'denon_telnet',
          }),
        }),
      };

      const recovered = await recoverAudioReceiverOnBoot(dummyDriver);
      expect(recovered).toBe(false);
    });
  });
});
