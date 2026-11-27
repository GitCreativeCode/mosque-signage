import { describe, it, expect } from 'vitest';
import {
  isCompactAdminViewport,
  isSmallScreenViewport,
} from '@/lib/engine/viewport-scale';
import { OFFICIAL_RELEASE_HISTORY } from '@/lib/system/release-history';
import { APP_VERSION } from '@/lib/system/version';

describe('Responsive Multi-Screen Viewport Classification', () => {
  it('flags portrait phones and small viewports (< 768px) as small screens', () => {
    expect(isSmallScreenViewport(320, 568)).toBe(true); // iPhone SE 1st gen
    expect(isSmallScreenViewport(375, 667)).toBe(true); // iPhone SE
    expect(isSmallScreenViewport(390, 844)).toBe(true); // iPhone 14/15
    expect(isSmallScreenViewport(412, 915)).toBe(true); // Pixel / Galaxy
    expect(isSmallScreenViewport(767, 1024)).toBe(true);
  });

  it('flags short landscape phone viewports (< 500px height and < 960px width) as small screens', () => {
    expect(isSmallScreenViewport(844, 390)).toBe(true);
    expect(isSmallScreenViewport(667, 375)).toBe(true);
  });

  it('allows tablets (>= 768px) and desktop monitors for Studio and 16:9 broadcast', () => {
    expect(isSmallScreenViewport(768, 1024)).toBe(false); // iPad Mini portrait
    expect(isSmallScreenViewport(1024, 768)).toBe(false); // iPad landscape
    expect(isSmallScreenViewport(1280, 720)).toBe(false); // 720p laptop
    expect(isSmallScreenViewport(1920, 1080)).toBe(false); // 1080p desktop/TV
  });

  it('safely handles invalid zero/negative dimensions', () => {
    expect(isSmallScreenViewport(0, 0)).toBe(false);
    expect(isSmallScreenViewport(-100, 600)).toBe(false);
    expect(isCompactAdminViewport(0)).toBe(false);
  });

  it('uses compact hamburger drawer below 1024px (lg) and desktop 3-zone topbar at >= 1024px', () => {
    expect(isCompactAdminViewport(375)).toBe(true);
    expect(isCompactAdminViewport(768)).toBe(true);
    expect(isCompactAdminViewport(1023)).toBe(true);
    expect(isCompactAdminViewport(1024)).toBe(false);
    expect(isCompactAdminViewport(1440)).toBe(false);
  });
});

describe('v0.2.0 Release History Synchronization', () => {
  it('promotes current release to v0.2.0 minor release with responsive multi-screen notes', () => {
    const latest = OFFICIAL_RELEASE_HISTORY[0];
    expect(APP_VERSION).toBe('0.2.0');
    expect(latest?.version).toBe('0.2.0');
    expect(latest?.category).toBe('minor');
    expect(latest?.isCurrent).toBe(true);
    expect(latest?.sections?.some((s) => s.title.includes('Responsive Multi-Screen'))).toBe(true);
  });
});
