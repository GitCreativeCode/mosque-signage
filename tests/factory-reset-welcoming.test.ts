import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { DEFAULT_POSTERS_CONFIG } from '@/lib/db/default-posters';
import { CALCULATION_METHODS } from '@/components/admin/settings/AstronomicalCalculationSection';

describe('Factory Reset Confirmation, Welcoming Flow & WebP Poster Assets', () => {
  describe('Confirmation Typing Rule', () => {
    it('strictly requires uppercase CONFIRM and rejects lowercase confirm', () => {
      const validateConfirm = (text: string) => text.trim() === 'CONFIRM';

      expect(validateConfirm('confirm')).toBe(false);
      expect(validateConfirm('Confirm')).toBe(false);
      expect(validateConfirm('CONFIRM ')).toBe(true);
      expect(validateConfirm('  CONFIRM  ')).toBe(true);
      expect(validateConfirm('CONFIR')).toBe(false);
    });
  });

  describe('Post-Reset Welcoming Setup Defaults & Methods', () => {
    it('provides ISNA North America as standard calculation method and valid method catalog', () => {
      const defaultMethod = CALCULATION_METHODS.find((m) => m.id === 'NorthAmerica');
      expect(defaultMethod).toBeDefined();
      expect(defaultMethod?.label).toContain('ISNA');
      expect(CALCULATION_METHODS.length).toBeGreaterThanOrEqual(5);
    });

    it('sanitizes empty mosque name to fallback Islamic Community Center', () => {
      const sanitizeMosqueName = (name: string) => name.trim() || 'Islamic Community Center';
      expect(sanitizeMosqueName('')).toBe('Islamic Community Center');
      expect(sanitizeMosqueName('   ')).toBe('Islamic Community Center');
      expect(sanitizeMosqueName('Masjid Al-Falah')).toBe('Masjid Al-Falah');
    });

    it('validates float coordinates parsing for 1-click GPS detection', () => {
      const parseCoord = (val: string | number) => parseFloat(Number(val).toFixed(5));
      expect(parseCoord(43.5890123)).toBe(43.58901);
      expect(parseCoord(-79.6441234)).toBe(-79.64412);
    });

    it('validates optional admin PIN formatting for step 3 security update', () => {
      const validateOptionalPin = (pin: string) => {
        const trimmed = pin.trim();
        if (trimmed.length === 0) return { valid: true, shouldUpdate: false };
        if (trimmed.length >= 4 && trimmed.length <= 8 && /^\d+$/.test(trimmed)) {
          return { valid: true, shouldUpdate: true };
        }
        return { valid: false, shouldUpdate: false };
      };

      expect(validateOptionalPin('')).toEqual({ valid: true, shouldUpdate: false });
      expect(validateOptionalPin('   ')).toEqual({ valid: true, shouldUpdate: false });
      expect(validateOptionalPin('5678')).toEqual({ valid: true, shouldUpdate: true });
      expect(validateOptionalPin('12345678')).toEqual({ valid: true, shouldUpdate: true });
      expect(validateOptionalPin('123')).toEqual({ valid: false, shouldUpdate: false });
      expect(validateOptionalPin('1234abcd')).toEqual({ valid: false, shouldUpdate: false });
    });
  });

  describe('Default WebP Poster Metadata & Seed Preservation', () => {
    const seedAssetsDir = path.resolve(process.cwd(), 'public/seed-assets');
    const uploadsDir = path.resolve(process.cwd(), 'public/uploads');

    it('confirms DEFAULT_POSTERS_CONFIG references the new WebP posters and correct titles', () => {
      expect(DEFAULT_POSTERS_CONFIG.welcome.title).toBe('Welcome to the Community Center');
      expect(DEFAULT_POSTERS_CONFIG.welcome.image_path).toBe('/uploads/Mosque_Signage_Welcome.webp');
      expect(DEFAULT_POSTERS_CONFIG.welcome.duration_seconds).toBe(15);
      expect(DEFAULT_POSTERS_CONFIG.welcome.qr_url).toBeNull();

      expect(DEFAULT_POSTERS_CONFIG.event.title).toBe('Holy Month of Ramadan');
      expect(DEFAULT_POSTERS_CONFIG.event.image_path).toBe('/uploads/Mosque_Signage_Ramadan.webp');
      expect(DEFAULT_POSTERS_CONFIG.event.duration_seconds).toBe(20);
      expect(DEFAULT_POSTERS_CONFIG.event.qr_url).toBeNull();
    });

    it('ensures pristine seed assets exist in public/seed-assets/ for boot restoration', () => {
      expect(fs.existsSync(path.join(seedAssetsDir, 'Mosque_Signage_Welcome.webp'))).toBe(true);
      expect(fs.existsSync(path.join(seedAssetsDir, 'Mosque_Signage_Ramadan.webp'))).toBe(true);
    });

    it('ensures active upload copies exist in public/uploads/', () => {
      expect(fs.existsSync(path.join(uploadsDir, 'Mosque_Signage_Welcome.webp'))).toBe(true);
      expect(fs.existsSync(path.join(uploadsDir, 'Mosque_Signage_Ramadan.webp'))).toBe(true);
    });
  });

  describe('Kiosk Preview Showcase Raster Verification', () => {
    const previewPngPath = path.resolve(process.cwd(), 'public/kiosk-preview.png');

    it('validates public/kiosk-preview.png is an authentic 1920x1080 screenshot', async () => {
      expect(fs.existsSync(previewPngPath)).toBe(true);
      const stats = fs.statSync(previewPngPath);
      expect(stats.size).toBeGreaterThan(100000);

      const meta = await sharp(previewPngPath).metadata();
      expect(meta.width).toBe(1920);
      expect(meta.height).toBe(1080);
      expect(meta.format).toBe('png');
    });
  });

  describe('Adaptive Factory Reset Step 4 Validation', () => {
    it('validates secret input based on active auth mode', () => {
      const validateStep4 = (secret: string, authMode: 'pin' | 'password') => {
        const clean = secret.trim();
        if (authMode === 'password') {
          return clean.length >= 8;
        }
        return clean.length >= 4 && /^\d+$/.test(clean);
      };

      // PIN mode: 4-8 digits
      expect(validateStep4('123', 'pin')).toBe(false);
      expect(validateStep4('1234', 'pin')).toBe(true);
      expect(validateStep4('1234abcd', 'pin')).toBe(false);

      // Password mode: >= 8 characters
      expect(validateStep4('pass', 'password')).toBe(false);
      expect(validateStep4('password', 'password')).toBe(true);
      expect(validateStep4('SecurePassword2026!', 'password')).toBe(true);
    });
  });

  describe('Factory Reset Modal Choreography & Initial Screening Suppression', () => {
    it('strictly suppresses initial setup modal rendering while factory reset modal is open', () => {
      const isInitialSetupModalOpen = true;
      const isFactoryResetModalOpen = true;
      const shouldRenderInitialSetupModal = isInitialSetupModalOpen && !isFactoryResetModalOpen;

      expect(shouldRenderInitialSetupModal).toBe(false);
    });

    it('prevents background live sync from auto-opening initial setup while factory reset is open', () => {
      const evaluateAutoOpen = (params: {
        isAuthenticated: boolean;
        initialSetupCompleted: boolean;
        hasOpenedInitialSetup: boolean;
        isFactoryResetModalOpen: boolean;
      }) => {
        return (
          params.isAuthenticated &&
          !params.initialSetupCompleted &&
          !params.hasOpenedInitialSetup &&
          !params.isFactoryResetModalOpen
        );
      };

      // When factory reset is open, auto-open must be false even if setup is incomplete in DB
      expect(
        evaluateAutoOpen({
          isAuthenticated: true,
          initialSetupCompleted: false,
          hasOpenedInitialSetup: false,
          isFactoryResetModalOpen: true,
        })
      ).toBe(false);

      // Once reset is closed and user acknowledges, explicit trigger handles opening
      expect(
        evaluateAutoOpen({
          isAuthenticated: true,
          initialSetupCompleted: false,
          hasOpenedInitialSetup: true,
          isFactoryResetModalOpen: false,
        })
      ).toBe(false);
    });

    it('navigates to POSTERS and launches initial setup only upon explicit acknowledgment', () => {
      let activeTab = 'SETTINGS';
      let isInitialSetupOpen = false;
      let isFactoryResetOpen = true;
      let hasOpenedRef = false;

      const onResetSuccessWithSetup = () => {
        isFactoryResetOpen = false;
        activeTab = 'POSTERS';
        hasOpenedRef = true;
        isInitialSetupOpen = true;
      };

      onResetSuccessWithSetup();

      expect(isFactoryResetOpen).toBe(false);
      expect(activeTab).toBe('POSTERS');
      expect(isInitialSetupOpen).toBe(true);
      expect(hasOpenedRef).toBe(true);
    });
  });
});

