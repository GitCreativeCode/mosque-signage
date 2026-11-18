import type { AudioReceiverProtocol } from '@/types/index';

export interface WebhookMutePayload {
  readonly mute: boolean;
  readonly action: 'MUTE' | 'UNMUTE';
  readonly source: 'MosqueSignage';
  readonly prayer?: string | undefined;
  readonly timestamp: string;
}

/**
 * Builds Denon/Marantz Telnet/TCP command byte string.
 * Uses standard AVR-protocol carriage return delimiter.
 */
export function buildDenonMuteCommand(mute: boolean): string {
  return mute ? 'MUON\r' : 'MUOFF\r';
}

/**
 * Builds Yamaha MTX/MRX eCSVP or ASCII DSP command string.
 * Sends memory preset recall or mute flag with newline.
 */
export function buildYamahaMuteCommand(mute: boolean): string {
  // Preset 1 = Prayer Silence (Secondary Hall Mute)
  // Preset 2 = Normal Unmuted Broadcast
  return mute ? 'set MTX:MEM 1\n' : 'set MTX:MEM 2\n';
}

/**
 * Builds standard JSON-RPC / REST Webhook payload for home automation,
 * Crestron, Q-SYS, or smart relay integration.
 */
export function buildWebhookPayload(
  mute: boolean,
  prayerName?: string | undefined,
  timestamp: string = new Date().toISOString()
): WebhookMutePayload {
  return {
    mute,
    action: mute ? 'MUTE' : 'UNMUTE',
    source: 'MosqueSignage',
    prayer: prayerName,
    timestamp,
  };
}

/**
 * Encodes audio control command based on configured protocol.
 */
export function encodeAudioCommand(
  protocol: AudioReceiverProtocol,
  action: 'MUTE' | 'UNMUTE',
  prayerName?: string | undefined
): { readonly payload: string | WebhookMutePayload; readonly isJson: boolean } {
  const isMute = action === 'MUTE';

  switch (protocol) {
    case 'denon_telnet':
      return { payload: buildDenonMuteCommand(isMute), isJson: false };
    case 'yamaha_csvp':
      return { payload: buildYamahaMuteCommand(isMute), isJson: false };
    case 'http_webhook':
      return { payload: buildWebhookPayload(isMute, prayerName), isJson: true };
    default: {
      const _exhaustive: never = protocol;
      return { payload: buildDenonMuteCommand(isMute), isJson: false };
    }
  }
}
