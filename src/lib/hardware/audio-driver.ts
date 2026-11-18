import net from 'node:net';
import type { AudioReceiverConfig } from '@/types/index';
import { encodeAudioCommand } from './audio-protocol';
import { eventBus } from '@/lib/events/event-bus';

export interface AudioDispatchResult {
  readonly success: boolean;
  readonly message: string;
  readonly timestamp: string;
}

/**
 * Dispatches a TCP raw packet command (Denon / Yamaha) to the receiver.
 */
function sendTcpCommand(
  host: string,
  port: number,
  command: string,
  timeoutMs: number = 3500
): Promise<{ success: boolean; message: string }> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let isResolved = false;
    let writeTimer: ReturnType<typeof setTimeout> | undefined;

    const cleanup = () => {
      if (writeTimer) {
        clearTimeout(writeTimer);
        writeTimer = undefined;
      }
      socket.removeAllListeners();
      socket.destroy();
    };

    socket.setTimeout(timeoutMs);

    socket.on('connect', () => {
      socket.write(command, 'utf-8', (err) => {
        if (err) {
          if (!isResolved) {
            isResolved = true;
            cleanup();
            resolve({ success: false, message: `Socket write error: ${err.message}` });
          }
          return;
        }
        // Small buffer delay to allow device buffer intake before closing
        writeTimer = setTimeout(() => {
          if (!isResolved) {
            isResolved = true;
            cleanup();
            resolve({
              success: true,
              message: `Successfully sent '${command.trim()}' to ${host}:${port}`,
            });
          }
        }, 150);
      });
    });

    socket.on('timeout', () => {
      if (!isResolved) {
        isResolved = true;
        cleanup();
        resolve({ success: false, message: `Connection timed out after ${timeoutMs}ms to ${host}:${port}` });
      }
    });

    socket.on('error', (err) => {
      if (!isResolved) {
        isResolved = true;
        cleanup();
        resolve({ success: false, message: `TCP socket error (${host}:${port}): ${err.message}` });
      }
    });

    socket.connect(port, host);
  });
}

function isBlockedMetadataTarget(hostname: string): boolean {
  const lower = hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (lower === '169.254.169.254' || lower === 'metadata.google.internal') return true;
  if (lower.startsWith('169.254.') || lower === 'fd00:ec2::254') return true;
  return false;
}

/**
 * Dispatches an HTTP Webhook POST request for generic automation.
 */
async function sendHttpWebhook(
  host: string,
  port: number,
  payload: object,
  timeoutMs: number = 4000
): Promise<{ success: boolean; message: string }> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const targetUrl = host.startsWith('http://') || host.startsWith('https://')
      ? host
      : `http://${host}:${port || 80}/api/audio/mute`;

    const parsed = new URL(targetUrl);
    if (isBlockedMetadataTarget(parsed.hostname)) {
      return { success: false, message: `Rejected SSRF target: ${parsed.hostname} is not allowed.` };
    }

    const controller = new AbortController();
    timer = setTimeout(() => controller.abort(), timeoutMs);

    const res = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (res.ok) {
      return { success: true, message: `HTTP webhook delivered to ${targetUrl} (Status ${res.status})` };
    }
    return { success: false, message: `HTTP webhook to ${targetUrl} failed with status ${res.status}` };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, message: `HTTP webhook error: ${msg}` };
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * High-level network dispatch driver for Hall Audio Receiver muting.
 */
export async function dispatchAudioReceiverCommand(
  config: AudioReceiverConfig,
  action: 'MUTE' | 'UNMUTE',
  prayerName?: string | undefined
): Promise<AudioDispatchResult> {
  const timestamp = new Date().toISOString();

  if (!config.audio_receiver_host || config.audio_receiver_host.trim().length === 0) {
    const msg = 'Audio receiver host/IP is not configured in venue settings.';
    eventBus.emitEvent('AUDIO_MUTE_DISPATCHED', {
      timestamp,
      action,
      protocol: config.audio_receiver_protocol,
      host: 'unconfigured',
      success: false,
      message: msg,
    });
    return { success: false, message: msg, timestamp };
  }

  const encoded = encodeAudioCommand(config.audio_receiver_protocol, action, prayerName);
  let result: { success: boolean; message: string };

  if (encoded.isJson) {
    result = await sendHttpWebhook(
      config.audio_receiver_host.trim(),
      config.audio_receiver_port || 80,
      encoded.payload as object
    );
  } else {
    result = await sendTcpCommand(
      config.audio_receiver_host.trim(),
      config.audio_receiver_port || 23,
      encoded.payload as string
    );
  }

  eventBus.emitEvent('AUDIO_MUTE_DISPATCHED', {
    timestamp,
    action,
    protocol: config.audio_receiver_protocol,
    host: `${config.audio_receiver_host}:${config.audio_receiver_port}`,
    success: result.success,
    message: result.message,
  });

  return {
    success: result.success,
    message: result.message,
    timestamp,
  };
}
