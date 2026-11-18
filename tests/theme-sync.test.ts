import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getStoredTheme,
  applyTheme,
  THEME_COOKIE_NAME,
  THEME_STORAGE_KEY,
  THEME_EVENT_NAME,
} from '@/lib/theme/theme-sync';

interface MockThemeEvent {
  type: string;
  detail?: unknown;
}

interface MockWindowWithEvents {
  addEventListener: (evt: string, fn: (event: MockThemeEvent) => void) => void;
  removeEventListener: (evt: string, fn: (event: MockThemeEvent) => void) => void;
  dispatchEvent: (evt: MockThemeEvent) => boolean;
}

interface GlobalThemeEnv {
  window?: MockWindowWithEvents | undefined;
  document?: unknown;
  localStorage?: unknown;
  CustomEvent?: unknown;
}

describe('Theme Synchronization Engine', () => {
  const globalEnv = globalThis as unknown as GlobalThemeEnv;
  const originalWindow = globalEnv.window;
  const originalDocument = globalEnv.document;
  const originalLocalStorage = globalEnv.localStorage;

  let mockClasses: Set<string>;
  let mockAttributes: Map<string, string>;
  let mockStorage: Map<string, string>;
  let mockCookie: string;
  let eventListeners: Map<string, Array<(event: MockThemeEvent) => void>>;

  beforeEach(() => {
    mockClasses = new Set<string>();
    mockAttributes = new Map<string, string>();
    mockStorage = new Map<string, string>();
    mockCookie = '';
    eventListeners = new Map();

    const mockDocumentElement = {
      classList: {
        add: (cls: string) => mockClasses.add(cls),
        remove: (cls: string) => mockClasses.delete(cls),
        contains: (cls: string) => mockClasses.has(cls),
        toggle: (cls: string, force?: boolean) => {
          if (force === true) mockClasses.add(cls);
          else if (force === false) mockClasses.delete(cls);
          else if (mockClasses.has(cls)) mockClasses.delete(cls);
          else mockClasses.add(cls);
        },
      },
      getAttribute: (attr: string) => mockAttributes.get(attr) || null,
      setAttribute: (attr: string, val: string) => mockAttributes.set(attr, val),
      removeAttribute: (attr: string) => mockAttributes.delete(attr),
    };

    const mockDocument = {
      documentElement: mockDocumentElement,
      get cookie() {
        return mockCookie;
      },
      set cookie(val: string) {
        mockCookie = val;
      },
    };

    const mockLocalStorageObj = {
      getItem: (key: string) => mockStorage.get(key) || null,
      setItem: (key: string, val: string) => mockStorage.set(key, val),
      removeItem: (key: string) => mockStorage.delete(key),
      clear: () => mockStorage.clear(),
    };

    const mockWindow: MockWindowWithEvents = {
      addEventListener: (evt, fn) => {
        if (!eventListeners.has(evt)) eventListeners.set(evt, []);
        eventListeners.get(evt)!.push(fn);
      },
      removeEventListener: (evt, fn) => {
        const list = eventListeners.get(evt) || [];
        eventListeners.set(evt, list.filter((f) => f !== fn));
      },
      dispatchEvent: (evt) => {
        const list = eventListeners.get(evt.type) || [];
        for (const fn of list) fn(evt);
        return true;
      },
    };

    globalEnv.window = mockWindow;
    globalEnv.document = mockDocument;
    globalEnv.localStorage = mockLocalStorageObj;
    globalEnv.CustomEvent = class MockCustomEvent {
      type: string;
      detail: unknown;
      constructor(type: string, opts?: { detail?: unknown }) {
        this.type = type;
        this.detail = opts?.detail;
      }
    };
  });

  afterEach(() => {
    globalEnv.window = originalWindow;
    globalEnv.document = originalDocument;
    globalEnv.localStorage = originalLocalStorage;
  });

  describe('getStoredTheme', () => {
    it('returns default fallback when window is undefined (SSR)', () => {
      delete globalEnv.window;
      expect(getStoredTheme('dark')).toBe('dark');
      expect(getStoredTheme('light')).toBe('light');
    });

    it('returns data-theme attribute if set on document element', () => {
      mockAttributes.set('data-theme', 'light');
      expect(getStoredTheme('dark')).toBe('light');

      mockAttributes.set('data-theme', 'dark');
      expect(getStoredTheme('light')).toBe('dark');
    });

    it('falls back to cookie if data-theme is absent', () => {
      mockCookie = `${THEME_COOKIE_NAME}=light`;
      expect(getStoredTheme('dark')).toBe('light');
    });

    it('falls back to localStorage if cookie is absent', () => {
      mockStorage.set(THEME_STORAGE_KEY, 'light');
      expect(getStoredTheme('dark')).toBe('light');
    });

    it('falls back to classList if storage is empty', () => {
      mockClasses.add('light');
      expect(getStoredTheme('dark')).toBe('light');

      mockClasses.delete('light');
      mockClasses.add('dark');
      expect(getStoredTheme('light')).toBe('dark');
    });

    it('returns default fallback when nothing is set', () => {
      expect(getStoredTheme('dark')).toBe('dark');
      expect(getStoredTheme('light')).toBe('light');
    });
  });

  describe('applyTheme', () => {
    it('applies dark theme universally across classList, data-theme, cookie, and storage', () => {
      const listener = vi.fn();
      globalEnv.window?.addEventListener(THEME_EVENT_NAME, listener);

      applyTheme('dark');

      expect(mockClasses.has('dark')).toBe(true);
      expect(mockClasses.has('light')).toBe(false);
      expect(mockAttributes.get('data-theme')).toBe('dark');
      expect(mockStorage.get(THEME_STORAGE_KEY)).toBe('dark');
      expect(mockCookie).toContain(`${THEME_COOKIE_NAME}=dark`);

      expect(listener).toHaveBeenCalled();
      const eventDetail = listener.mock.calls[0]?.[0] as MockThemeEvent | undefined;
      expect(eventDetail?.detail).toBe('dark');
    });

    it('applies light theme universally across classList, data-theme, cookie, and storage', () => {
      const listener = vi.fn();
      globalEnv.window?.addEventListener(THEME_EVENT_NAME, listener);

      applyTheme('light');

      expect(mockClasses.has('light')).toBe(true);
      expect(mockClasses.has('dark')).toBe(false);
      expect(mockAttributes.get('data-theme')).toBe('light');
      expect(mockStorage.get(THEME_STORAGE_KEY)).toBe('light');
      expect(mockCookie).toContain(`${THEME_COOKIE_NAME}=light`);

      expect(listener).toHaveBeenCalled();
      const eventDetail = listener.mock.calls[0]?.[0] as MockThemeEvent | undefined;
      expect(eventDetail?.detail).toBe('light');
    });
  });
});
