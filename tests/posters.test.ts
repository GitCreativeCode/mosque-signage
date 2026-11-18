import { describe, it, expect } from 'vitest';
import { getActivePosters, calculatePosterStatus } from '@/lib/engine/index';
import type { Poster } from '@/types/index';

describe('Poster Scheduling & Eligibility Engine', () => {
  const samplePoster: Poster = {
    id: 'poster-oct-15',
    title: 'Community Dinner',
    image_path: '/uploads/dinner.webp',
    qr_url: 'https://icco.org/dinner',
    qr_label: 'RSVP Here',
    start_at: '2026-10-15T00:00:00.000Z',
    end_at: '2026-10-20T23:59:59.000Z',
    duration_seconds: 15,
    created_at: '2026-10-01T12:00:00.000Z',
  };

  it('excludes a poster one second before start_at', () => {
    const beforeStart = new Date('2026-10-14T23:59:59.000Z');
    const active = getActivePosters([samplePoster], beforeStart);
    expect(active).toHaveLength(0);
  });

  it('includes a poster on the exact start_at second', () => {
    const exactStart = new Date('2026-10-15T00:00:00.000Z');
    const active = getActivePosters([samplePoster], exactStart);
    expect(active).toHaveLength(1);
    expect(active[0]?.id).toBe('poster-oct-15');
  });

  it('includes a poster one second after start_at', () => {
    const afterStart = new Date('2026-10-15T00:00:01.000Z');
    const active = getActivePosters([samplePoster], afterStart);
    expect(active).toHaveLength(1);
    expect(active[0]?.id).toBe('poster-oct-15');
  });

  it('includes a poster during its active schedule window', () => {
    const midWindow = new Date('2026-10-17T14:30:00.000Z');
    const active = getActivePosters([samplePoster], midWindow);
    expect(active).toHaveLength(1);
    expect(active[0]?.id).toBe('poster-oct-15');
  });

  it('includes a poster down to the exact second of expiration (end_at)', () => {
    const exactEnd = new Date('2026-10-20T23:59:59.000Z');
    const active = getActivePosters([samplePoster], exactEnd);
    expect(active).toHaveLength(1);
  });

  it('excludes a poster one second after expiration (end_at)', () => {
    const afterEnd = new Date('2026-10-21T00:00:00.000Z');
    const active = getActivePosters([samplePoster], afterEnd);
    expect(active).toHaveLength(0);
  });

  it('handles multiple posters with overlapping, disjoint, and expired schedules', () => {
    const posters: Poster[] = [
      {
        id: 'expired',
        title: 'Past Event',
        image_path: '/uploads/past.webp',
        start_at: '2026-09-01T00:00:00.000Z',
        end_at: '2026-09-30T23:59:59.000Z',
        duration_seconds: 15,
        created_at: '2026-08-15T00:00:00.000Z',
      },
      {
        id: 'active-1',
        title: 'Active Event 1',
        image_path: '/uploads/e1.webp',
        start_at: '2026-10-01T00:00:00.000Z',
        end_at: '2026-10-31T23:59:59.000Z',
        duration_seconds: 15,
        created_at: '2026-09-15T00:00:00.000Z',
      },
      {
        id: 'active-2',
        title: 'Active Event 2',
        image_path: '/uploads/e2.webp',
        start_at: '2026-10-15T12:00:00.000Z',
        end_at: '2026-10-18T12:00:00.000Z',
        duration_seconds: 20,
        created_at: '2026-10-01T00:00:00.000Z',
      },
      {
        id: 'future',
        title: 'Future Event',
        image_path: '/uploads/future.webp',
        start_at: '2026-11-01T00:00:00.000Z',
        end_at: '2026-11-30T23:59:59.000Z',
        duration_seconds: 15,
        created_at: '2026-10-01T00:00:00.000Z',
      },
    ];

    const evalTime = new Date('2026-10-16T15:00:00.000Z');
    const active = getActivePosters(posters, evalTime);

    expect(active.map((p) => p.id)).toEqual(['active-1', 'active-2']);
  });

  it('keeps an indefinite poster (end_at = null) active indefinitely after start_at', () => {
    const indefinitePoster: Poster = {
      id: 'poster-indefinite',
      title: 'Perpetual Notice',
      image_path: '/uploads/perpetual.webp',
      start_at: '2026-10-15T00:00:00.000Z',
      end_at: null,
      duration_seconds: 15,
      created_at: '2026-10-01T00:00:00.000Z',
    };

    // Before start
    const beforeStart = new Date('2026-10-14T23:59:59.000Z');
    expect(getActivePosters([indefinitePoster], beforeStart)).toHaveLength(0);

    // Exact start
    const exactStart = new Date('2026-10-15T00:00:00.000Z');
    expect(getActivePosters([indefinitePoster], exactStart)).toHaveLength(1);

    // Far in the future (10 years later)
    const futureDate = new Date('2036-10-15T00:00:00.000Z');
    expect(getActivePosters([indefinitePoster], futureDate)).toHaveLength(1);
    expect(getActivePosters([indefinitePoster], futureDate)[0]?.id).toBe('poster-indefinite');
  });

  it('marks inactive posters as ARCHIVED and excludes them from active rotation', () => {
    const archivedPoster: Poster = {
      id: 'poster-archived',
      title: 'Archived Flyer',
      image_path: '/uploads/flyer.webp',
      start_at: '2026-10-01T00:00:00.000Z',
      end_at: '2026-10-31T23:59:59.000Z',
      duration_seconds: 15,
      is_active: false,
      created_at: '2026-09-15T00:00:00.000Z',
    };

    const midWindow = new Date('2026-10-17T12:00:00.000Z');
    
    // Status must resolve to ARCHIVED
    const status = calculatePosterStatus(archivedPoster, midWindow);
    expect(status).toBe('ARCHIVED');

    // Must be omitted from rotation
    const active = getActivePosters([archivedPoster], midWindow);
    expect(active).toHaveLength(0);
  });
});

describe('Notice SVG Slide Generator', () => {
  it('does NOT include COMMUNITY ANNOUNCEMENT badge in generated SVG', async () => {
    const { generateNoticeSvg, extractThemeFromSvg, extractDescriptionFromSvg } = await import('@/lib/posters/svg-generator');
    const svg = generateNoticeSvg({
      theme: 'emerald',
      headline: 'Special Eid Gathering',
      description: 'Join us for prayers and community breakfast.',
    });

    expect(svg).not.toContain('COMMUNITY ANNOUNCEMENT');
    expect(svg).not.toContain('1080p Broadcast Slide');
    expect(svg).toContain('Special Eid Gathering');
    expect(svg).toContain('Join us for prayers and community breakfast.');

    expect(extractThemeFromSvg(svg)).toBe('emerald');
    expect(extractDescriptionFromSvg(svg)).toBe('Join us for prayers and community breakfast.');
  });
});

