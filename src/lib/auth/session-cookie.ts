/**
 * Next.js Request Header & Signed Admin Session Cookie Helpers
 * MosqueSignage (TV)
 */

import { cookies, headers } from 'next/headers';

export const ADMIN_COOKIE_NAME = 'mosque_admin_session';

export async function getClientIdentifier(): Promise<string> {
  if (process.env.TRUST_PROXY_HEADERS !== 'true') {
    return 'default-client';
  }

  try {
    const headerStore = await headers();
    const cfIp = headerStore.get('cf-connecting-ip')?.trim();
    if (cfIp) return `ip:${cfIp}`;

    const forwarded = headerStore.get('x-forwarded-for');
    if (forwarded) {
      const firstIp = forwarded.split(',')[0]?.trim();
      if (firstIp) return `ip:${firstIp}`;
    }
    const realIp = headerStore.get('x-real-ip');
    if (realIp) return `ip:${realIp.trim()}`;
  } catch {
    // headers() throws in unit tests
  }
  return 'default-client';
}

export async function readSessionCookieToken(): Promise<string | undefined> {
  try {
    const cookieStore = await cookies();
    return cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  } catch {
    return undefined;
  }
}

export async function isHttpsRequest(): Promise<boolean> {
  if (process.env.COOKIE_SECURE === 'true') return true;
  if (process.env.COOKIE_SECURE === 'false') return false;
  if (process.env.TRUST_PROXY_HEADERS === 'false') return false;

  try {
    const headerStore = await headers();
    const isTrustedOrTest =
      process.env.TRUST_PROXY_HEADERS === 'true' ||
      process.env.VITEST === 'true' ||
      process.env.NODE_ENV === 'test';

    if (isTrustedOrTest) {
      const forwardedProto = headerStore.get('x-forwarded-proto')?.split(',')[0]?.trim().toLowerCase();
      if (forwardedProto) return forwardedProto === 'https';
    }

    const originOrReferer = headerStore.get('origin') ?? headerStore.get('referer') ?? '';
    if (originOrReferer.startsWith('https://')) return true;
  } catch {
    // headers() throws in non-request unit tests
  }
  return false;
}

export async function writeSessionCookieToken(token: string): Promise<void> {
  try {
    const cookieStore = await cookies();
    const secure = await isHttpsRequest();
    cookieStore.set(ADMIN_COOKIE_NAME, token, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });
  } catch {
    // Ignored in non-request unit tests
  }
}

export async function clearSessionCookieToken(): Promise<void> {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(ADMIN_COOKIE_NAME);
  } catch {
    // Ignored in non-request unit tests
  }
}
