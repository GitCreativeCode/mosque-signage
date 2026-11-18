import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calculateViewportScale } from '@/lib/engine/viewport-scale';

interface MockNavigatorWakeLock {
  wakeLock?: {
    request: (type: 'screen') => Promise<{
      released: boolean;
      release: () => Promise<void>;
      addEventListener: ReturnType<typeof vi.fn>;
    }>;
  };
}

describe('Universal 1080p Base Canvas Auto-Scaling & Overscan Engine', () => {
  describe('Aspect-Ratio Fit Scaling Across Television Resolutions', () => {
    it('evaluates scale to exactly 1.0 on standard 1080p display (1920x1080)', () => {
      expect(calculateViewportScale(1920, 1080)).toBe(1);
    });

    it('evaluates scale to exactly 2.0 on 4K Ultra HD TV (3840x2160)', () => {
      expect(calculateViewportScale(3840, 2160)).toBe(2);
    });

    it('evaluates scale to 0.6666... on 720p HD TV (1280x720)', () => {
      const scale = calculateViewportScale(1280, 720);
      expect(scale).toBeCloseTo(1280 / 1920, 5);
      expect(scale).toBeCloseTo(720 / 1080, 5);
    });

    it('evaluates scale to 0.8333... on HD+ screen (1600x900)', () => {
      expect(calculateViewportScale(1600, 900)).toBeCloseTo(1600 / 1920, 5);
    });

    it('evaluates scale to 1.3333... on 1440p QHD monitor (2560x1440)', () => {
      expect(calculateViewportScale(2560, 1440)).toBeCloseTo(2560 / 1920, 5);
    });

    it('handles non-16:9 16:10 monitor (1920x1200) by fitting to width without vertical overflow', () => {
      expect(calculateViewportScale(1920, 1200)).toBe(1);
    });

    it('handles windowed desktop browser with URL/tabs bar (e.g. 1920x960) by scaling down to fit height', () => {
      expect(calculateViewportScale(1920, 960)).toBeCloseTo(960 / 1080, 5);
    });
  });

  describe('TV Overscan Safe-Zone Margin Compensation', () => {
    it('applies 0% margin with full bleed on 1080p display', () => {
      expect(calculateViewportScale(1920, 1080, 0)).toBe(1);
    });

    it('applies 2% inward safe-zone compensation on 1080p display', () => {
      expect(calculateViewportScale(1920, 1080, 2)).toBe(0.98);
    });

    it('applies 4% deep safe-zone compensation on 1080p display', () => {
      expect(calculateViewportScale(1920, 1080, 4)).toBe(0.96);
    });

    it('applies 2% safe-zone compensation on 4K Ultra HD TV (scale 1.96)', () => {
      expect(calculateViewportScale(3840, 2160, 2)).toBe(2 * 0.98);
    });

    it('clamps negative overscan margin to 0%', () => {
      expect(calculateViewportScale(1920, 1080, -5)).toBe(1);
    });

    it('clamps excessive overscan margin above 10% to maximum safe 10%', () => {
      expect(calculateViewportScale(1920, 1080, 25)).toBe(0.9);
    });
  });
});

describe('Screen Wake Lock Sentinel Lifecycle', () => {
  let mockSentinel: { release: ReturnType<typeof vi.fn>; released: boolean; addEventListener: ReturnType<typeof vi.fn> };
  let mockRequest: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockSentinel = {
      released: false,
      release: vi.fn().mockImplementation(async () => {
        mockSentinel.released = true;
      }),
      addEventListener: vi.fn(),
    };
    mockRequest = vi.fn().mockResolvedValue(mockSentinel);

    Object.defineProperty(globalThis, 'navigator', {
      value: { wakeLock: { request: mockRequest } },
      writable: true,
      configurable: true,
    });
  });

  it('requests and releases screen wake lock sentinel safely', async () => {
    const nav = globalThis.navigator as unknown as MockNavigatorWakeLock;
    const sentinel = await nav.wakeLock?.request('screen');
    expect(mockRequest).toHaveBeenCalledWith('screen');
    expect(sentinel?.released).toBe(false);
    await sentinel?.release();
    expect(sentinel?.released).toBe(true);
  });

  it('safely detects when navigator.wakeLock is unavailable', () => {
    Object.defineProperty(globalThis, 'navigator', {
      value: {},
      writable: true,
      configurable: true,
    });
    expect('wakeLock' in globalThis.navigator).toBe(false);
  });
});
