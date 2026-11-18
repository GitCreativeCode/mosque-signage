/**
 * URL & Media Path Sanitization Helpers
 * MosqueSignage (TV)
 */

const ALLOWED_EXTERNAL_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:']);
const CONTROL_CHARS_REGEX = /[\u0000-\u001f\u007f]/g;
const SAFE_DATA_IMAGE_REGEX = /^data:image\/(?:png|jpeg|jpg|webp);base64,[a-z0-9+/=]+$/i;

function stripControlChars(value: string): string {
  return value.replace(CONTROL_CHARS_REGEX, '').trim();
}

/**
 * Sanitizes an external anchor/QR URL, permitting only http:, https:, mailto:, and tel:.
 * Returns null for dangerous schemes such as javascript:, vbscript:, data:, or malformed URLs.
 */
export function sanitizeExternalUrl(raw?: string | null): string | null {
  if (typeof raw !== 'string') return null;
  const clean = stripControlChars(raw);
  if (!clean) return null;

  try {
    const parsed = new URL(clean);
    if (!ALLOWED_EXTERNAL_PROTOCOLS.has(parsed.protocol.toLowerCase())) {
      return null;
    }
    return clean;
  } catch {
    return null;
  }
}

/**
 * Validates optional QR URLs submitted to Server Actions before persisting to SQLite.
 */
export function assertSafeOptionalQrUrl(raw?: string | null): string | null {
  if (typeof raw !== 'string') return null;
  const clean = stripControlChars(raw);
  if (!clean) return null;
  const safe = sanitizeExternalUrl(clean);
  if (!safe) {
    throw new Error('Invalid QR URL scheme. Only http://, https://, mailto:, and tel: links are permitted.');
  }
  return safe;
}

/**
 * Validates media/frame paths inside multi-asset layout payloads, blocking traversal and script URIs.
 */
export function isSafeAssetPath(raw: string): boolean {
  const clean = stripControlChars(raw);
  if (!clean) return false;
  if (clean.includes('..') || clean.includes('\\')) return false;

  const lower = clean.toLowerCase();
  if (lower.startsWith('javascript:') || lower.startsWith('vbscript:')) return false;
  if (lower.startsWith('data:')) {
    return SAFE_DATA_IMAGE_REGEX.test(clean);
  }
  if (clean.startsWith('//')) return false;
  if (clean.startsWith('/')) return true;

  try {
    const parsed = new URL(clean);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

