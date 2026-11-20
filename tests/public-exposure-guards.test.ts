import { describe, it, expect, beforeEach, vi } from 'vitest';
import robots from '@/app/robots';
import nextConfig from '../next.config';
import { GET as sseHandler } from '@/app/api/sse/display/route';
import {
  getActiveSseConnectionCount,
  resetActiveSseConnectionCount,
} from '@/lib/events/sse-connections';

vi.mock('@/lib/auth/display-pairing', () => ({
  verifyCurrentDisplaySession: async () => true,
}));

describe('Public Exposure Guards, Crawler Suppression & SSE Limits (Plan 2)', () => {
  beforeEach(() => {
    resetActiveSseConnectionCount();
    delete process.env.MAX_SSE_CONNECTIONS;
  });

  describe('Search Engine Robot Suppression', () => {
    it('robots() config disallows all user-agents from all routes', () => {
      const result = robots();
      expect(result).toBeDefined();
      expect(result.rules).toEqual([
        {
          userAgent: '*',
          disallow: '/',
        },
      ]);
    });

    it('next.config.ts sets X-Robots-Tag headers across all routes', async () => {
      expect(typeof nextConfig.headers).toBe('function');
      const headersConfig = await nextConfig.headers!();

      const globalHeader = headersConfig.find((entry) => entry.source === '/(.*)');
      expect(globalHeader).toBeDefined();

      const robotsTag = globalHeader?.headers.find((h) => h.key === 'X-Robots-Tag');
      expect(robotsTag).toBeDefined();
      expect(robotsTag?.value).toContain('noindex');
      expect(robotsTag?.value).toContain('nofollow');
      expect(robotsTag?.value).toContain('noarchive');
      expect(robotsTag?.value).toContain('nosnippet');
    });
  });

  describe('SSE Connection Saturation Guard', () => {
    it('bounds concurrent SSE connections and returns 503 when ceiling reached', async () => {
      process.env.MAX_SSE_CONNECTIONS = '3';

      // 3 connections succeed
      const res1 = await sseHandler();
      const res2 = await sseHandler();
      const res3 = await sseHandler();

      expect(res1.status).toBe(200);
      expect(res2.status).toBe(200);
      expect(res3.status).toBe(200);
      expect(getActiveSseConnectionCount()).toBe(3);

      // 4th connection exceeds ceiling
      const res4 = await sseHandler();
      expect(res4.status).toBe(503);
      expect(res4.headers.get('Retry-After')).toBe('30');
      const text = await res4.text();
      expect(text).toContain('Maximum SSE display connections reached');
    });
  });
});

