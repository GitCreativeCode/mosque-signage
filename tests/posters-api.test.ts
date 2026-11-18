import { describe, it, expect, vi } from 'vitest';
import { GET } from '@/app/api/posters/route';

vi.mock('@/lib/actions/posters', () => ({
  getPublicActivePosters: vi.fn().mockResolvedValue({
    posters: [
      {
        id: 'test-poster-1',
        title: 'Friday Khutbah Announcement',
        image_path: '/uploads/khutbah.webp',
        media_type: 'image',
        start_at: '2026-11-01T00:00:00.000Z',
        end_at: null,
        duration_seconds: 15,
        display_order: 0,
        is_active: true,
        created_at: '2026-11-01T00:00:00.000Z',
      },
    ],
    nextTransitionAt: '2026-11-20T00:00:00.000Z',
  }),
}));

vi.mock('@/lib/auth/display-pairing', () => ({
  verifyCurrentDisplaySession: vi.fn().mockResolvedValue(true),
}));

describe('GET /api/posters Route Handler', () => {
  it('returns HTTP 200 with strictly active posters, no-cache headers, and transition header', async () => {
    const response = await GET();
    expect(response.status).toBe(200);

    const headers = response.headers;
    expect(headers.get('Cache-Control')).toContain('no-store');
    expect(headers.get('X-Next-Transition-At')).toBe('2026-11-20T00:00:00.000Z');

    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data).toHaveLength(1);
    expect(data[0]?.title).toBe('Friday Khutbah Announcement');
  });
});
