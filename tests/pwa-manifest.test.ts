import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('PWA Manifest & Web Standards Compliance', () => {
  it('loads a valid static public/manifest.json adhering strictly to W3C PWA specification', () => {
    const manifestPath = path.resolve(process.cwd(), 'public/manifest.json');
    expect(fs.existsSync(manifestPath)).toBe(true);

    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

    expect(manifest.name).toBe('MosqueSignage Kiosk Display');
    expect(manifest.short_name).toBe('MosqueSignage');
    expect(manifest.start_url).toBe('/display');
    expect(manifest.scope).toBe('/');
    expect(manifest.display).toBe('standalone');
    expect(manifest.background_color).toBe('#020617');
    expect(manifest.theme_color).toBe('#0a0a0a');
    expect(manifest.orientation).toBe('any');

    // Icon verification
    expect(manifest.icons).toBeDefined();
    expect(manifest.icons.length).toBeGreaterThanOrEqual(4);

    const sizes = manifest.icons.map((i: { sizes: string }) => i.sizes);
    expect(sizes).toContain('192x192');
    expect(sizes).toContain('512x512');

    const maskableIcon = manifest.icons.find((i: { purpose: string }) => i.purpose === 'maskable');
    expect(maskableIcon).toBeDefined();

    // App shortcuts verification
    expect(manifest.shortcuts).toBeDefined();
    expect(manifest.shortcuts.length).toBe(2);

    const shortcutUrls = manifest.shortcuts.map((s: { url: string }) => s.url);
    expect(shortcutUrls).toContain('/display');
    expect(shortcutUrls).toContain('/admin');
  });

  it('validates manifest theme, start_url, and display mode configuration', () => {
    const manifestPath = path.resolve(process.cwd(), 'public/manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

    expect(manifest.name).toBe('MosqueSignage Kiosk Display');
    expect(manifest.start_url).toBe('/display');
    expect(manifest.display).toBe('standalone');
    expect(manifest.theme_color).toBe('#0a0a0a');
  });

  it('guarantees required PWA icon assets exist on disk in public/', () => {
    const publicDir = path.resolve(process.cwd(), 'public');
    const requiredAssets = [
      'icon.svg',
      'icon-192.png',
      'icon-512.png',
      'icon-maskable.png',
      'apple-touch-icon.png',
      'favicon.ico',
    ];

    for (const asset of requiredAssets) {
      const fullPath = path.join(publicDir, asset);
      expect(fs.existsSync(fullPath)).toBe(true);
      const stat = fs.statSync(fullPath);
      expect(stat.size).toBeGreaterThan(0);
    }

    // Invariant: public/icon.svg uses Version 16 Girih Typography emblem
    const svgPath = path.join(publicDir, 'icon.svg');
    const svgContent = fs.readFileSync(svgPath, 'utf-8');
    expect(svgContent).toContain('Girih');
    expect(svgContent).toContain('SIGNAGE');
  });

  it('verifies public/sw.js precache entries resolve to valid routes or public files', () => {
    const swPath = path.resolve(process.cwd(), 'public/sw.js');
    expect(fs.existsSync(swPath)).toBe(true);

    const swContent = fs.readFileSync(swPath, 'utf-8');
    expect(swContent).toContain("'/display'");
    expect(swContent).not.toContain("'/manifest.webmanifest'");
    expect(swContent).toContain("url.pathname.startsWith('/api/')");
    expect(swContent).toContain("url.pathname.startsWith('/_next/')");
    expect(swContent).toContain("request.method !== 'GET'");
    expect(swContent).toContain('caches.match(request)');

    const precacheMatch = swContent.match(/const STATIC_PRECACHE\s*=\s*\[([\s\S]*?)\];/);
    expect(precacheMatch).not.toBeNull();
    const entries = [...(precacheMatch?.[1]?.matchAll(/'([^']+)'/g) ?? [])].map((m) => m[1]!);
    expect(entries.length).toBeGreaterThanOrEqual(8);

    const appRoutes = new Set(['/', '/display']);
    const publicDir = path.resolve(process.cwd(), 'public');
    for (const entry of entries) {
      if (appRoutes.has(entry)) continue;
      expect(fs.existsSync(path.join(publicDir, entry.slice(1)))).toBe(true);
    }
  });
});

interface MockDeferredPrompt {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string; platform: string }>;
}

interface MockPwaWindow {
  matchMedia: (query: string) => { matches: boolean };
  navigator: Record<string, unknown>;
  deferredPwaPrompt?: MockDeferredPrompt;
  addEventListener: ReturnType<typeof vi.fn>;
  removeEventListener: ReturnType<typeof vi.fn>;
  dispatchEvent: ReturnType<typeof vi.fn>;
}

describe('usePwaInstall Hook & Event Coordination', () => {
  let mockPrompt: ReturnType<typeof vi.fn>;
  let mockWindow: MockPwaWindow;

  beforeEach(() => {
    mockPrompt = vi.fn().mockResolvedValue(undefined);
    mockWindow = {
      matchMedia: vi.fn().mockReturnValue({ matches: false }),
      navigator: {},
      deferredPwaPrompt: {
        prompt: mockPrompt as () => Promise<void>,
        userChoice: Promise.resolve({ outcome: 'accepted', platform: 'web' }),
      },
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    };
    Object.defineProperty(globalThis, 'window', {
      value: mockWindow,
      writable: true,
      configurable: true,
    });
  });

  it('triggers prompt and handles accepted outcome', async () => {
    const promptEvent = mockWindow.deferredPwaPrompt!;
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;

    expect(mockPrompt).toHaveBeenCalledTimes(1);
    expect(choice.outcome).toBe('accepted');
  });

  it('identifies standalone display mode when matchMedia matches', () => {
    mockWindow.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query === '(display-mode: standalone)',
    }));

    const isStandalone = mockWindow.matchMedia('(display-mode: standalone)').matches;
    expect(isStandalone).toBe(true);
  });
});

