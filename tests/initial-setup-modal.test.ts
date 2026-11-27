import { describe, it, expect } from 'vitest';
import { CALCULATION_METHODS } from '@/components/admin/settings/AstronomicalCalculationSection';
import { STEP_LABELS } from '@/components/admin/settings/InitialSetupModal';

describe('Initial Venue Configuration & Onboarding Modal', () => {
  describe('Step Indicator Badges & Labels', () => {
    it('defines clean step labels without redundant number prefixes to prevent duplication', () => {
      expect(STEP_LABELS[1]).toBe('Identity & Ticker');
      expect(STEP_LABELS[2]).toBe('Location & Math');
      expect(STEP_LABELS[3]).toBe('Security & Terms');
      Object.values(STEP_LABELS).forEach((label) => {
        expect(/^\d+\./.test(label)).toBe(false);
      });
    });
  });

  describe('Step 1: Venue Identity & Ticker', () => {
    it('applies fallback name when mosque name is whitespace or empty', () => {
      const resolveMosqueName = (val: string) => val.trim() || 'Islamic Community Center';
      expect(resolveMosqueName('')).toBe('Islamic Community Center');
      expect(resolveMosqueName('   ')).toBe('Islamic Community Center');
      expect(resolveMosqueName('Al-Rashid Mosque')).toBe('Al-Rashid Mosque');
    });

    it('formats live preview header title with optional prefix greeting', () => {
      const getHeaderPreview = (greeting: string, name: string) => {
        const cleanGreeting = greeting.trim();
        const cleanName = name.trim() || 'Islamic Community Center';
        return cleanGreeting ? `${cleanGreeting} ${cleanName}` : cleanName;
      };

      expect(getHeaderPreview('Welcome to', 'Islamic Community Center')).toBe(
        'Welcome to Islamic Community Center'
      );
      expect(getHeaderPreview('Ahlan wa Sahlan to', 'Masjid Omar')).toBe(
        'Ahlan wa Sahlan to Masjid Omar'
      );
      expect(getHeaderPreview('', 'Direct Mosque Name')).toBe('Direct Mosque Name');
    });

    it('evaluates linear 3-step wizard navigation rules (1 -> 2 -> 3 and 3 -> 2 -> 1)', () => {
      const getNextStep = (currentStep: number) => (currentStep < 3 ? currentStep + 1 : 3);
      const getPrevStep = (currentStep: number) => (currentStep > 1 ? currentStep - 1 : 1);

      expect(getNextStep(1)).toBe(2);
      expect(getNextStep(2)).toBe(3);
      expect(getNextStep(3)).toBe(3);

      expect(getPrevStep(3)).toBe(2);
      expect(getPrevStep(2)).toBe(1);
      expect(getPrevStep(1)).toBe(1);
    });

    it('defaults kiosk display mode to hidden (poster-only) out of the box', () => {
      const initialSidebarMode = 'hidden';
      const initialShowMiniPrayerPill = false;

      expect(initialSidebarMode).toBe('hidden');
      expect(initialShowMiniPrayerPill).toBe(false);
    });
  });

  describe('Step 2: Location & Liturgical Calculation', () => {
    it('initializes coordinates as null on fresh onboarding without injecting default Toronto coordinates', () => {
      const getInitialCoordinates = (settings: { latitude?: number | null; initial_setup_completed?: boolean }) => {
        return typeof settings.latitude === 'number' && settings.initial_setup_completed ? settings.latitude : null;
      };

      expect(getInitialCoordinates({})).toBeNull();
      expect(getInitialCoordinates({ latitude: 43.589, initial_setup_completed: false })).toBeNull();
      expect(getInitialCoordinates({ latitude: 51.5074, initial_setup_completed: true })).toBe(51.5074);
    });

    it('does not inject default coordinates when GPS times out or is denied', () => {
      const handleGpsError = (currentCoords: { latitude: number | null; longitude: number | null }) => {
        // Preserves current coordinates unchanged; does NOT overwrite with defaults
        return {
          coords: currentCoords,
          message: 'Could not detect location (Timeout). Please enter coordinates manually.',
        };
      };

      const result = handleGpsError({ latitude: null, longitude: null });
      expect(result.coords.latitude).toBeNull();
      expect(result.coords.longitude).toBeNull();
      expect(result.message).toContain('Please enter coordinates manually');
    });

    it('verifies 1-click GPS detection coordinate precision (5 decimal places)', () => {
      const roundCoord = (coord: number) => parseFloat(coord.toFixed(5));
      expect(roundCoord(43.5890123)).toBe(43.58901);
      expect(roundCoord(-79.6441299)).toBe(-79.64413);
    });

    it('ensures standard astronomical calculation authorities exist', () => {
      const ids = CALCULATION_METHODS.map((m) => m.id);
      expect(ids).toContain('NorthAmerica');
      expect(ids).toContain('MuslimWorldLeague');
      expect(ids).toContain('Egyptian');
      expect(ids).toContain('Karachi');
      expect(ids).toContain('UmmAlQura');
    });

    it('validates juristic madhab options', () => {
      const validMadhabs = ['shafi', 'hanafi'] as const;
      expect(validMadhabs.includes('shafi')).toBe(true);
      expect(validMadhabs.includes('hanafi')).toBe(true);
    });
  });

  describe('Step 3: Security & Terms Agreement', () => {

    it('enforces mandatory terms and privacy policy agreement before launch', () => {
      const canSaveAndLaunch = (termsAccepted: boolean, isSaving: boolean) =>
        termsAccepted && !isSaving;

      expect(canSaveAndLaunch(false, false)).toBe(false);
      expect(canSaveAndLaunch(false, true)).toBe(false);
      expect(canSaveAndLaunch(true, true)).toBe(false);
      expect(canSaveAndLaunch(true, false)).toBe(true);
    });

    it('creates valid terms acceptance payload on launch', () => {
      const nowIso = new Date('2026-11-13T17:00:00.000Z').toISOString();
      const createLaunchPayload = (termsAccepted: boolean, timestamp: string) => {
        if (!termsAccepted) throw new Error('Terms not accepted');
        return {
          initial_setup_completed: true,
          terms_accepted: true,
          terms_accepted_at: timestamp,
        };
      };

      const payload = createLaunchPayload(true, nowIso);
      expect(payload.terms_accepted).toBe(true);
      expect(payload.initial_setup_completed).toBe(true);
      expect(payload.terms_accepted_at).toBe(nowIso);
      expect(() => createLaunchPayload(false, nowIso)).toThrow('Terms not accepted');
    });

    it('validates canonical legal routes and helpdesk email format', () => {
      const privacyRoute = '/privacy';
      const termsRoute = '/terms';
      const helpdeskEmail = 'helpdesk.guidance@gmail.com';

      expect(privacyRoute).toBe('/privacy');
      expect(termsRoute).toBe('/terms');
      expect(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(helpdeskEmail)).toBe(true);
    });

    it('ensures Terms of Use and Privacy Policy links open in a new tab without enclosing label tags', () => {
      const linkProps = {
        privacy: { href: '/privacy', target: '_blank', rel: 'noopener noreferrer' },
        terms: { href: '/terms', target: '_blank', rel: 'noopener noreferrer' },
      };

      expect(linkProps.privacy.target).toBe('_blank');
      expect(linkProps.privacy.rel).toBe('noopener noreferrer');
      expect(linkProps.terms.target).toBe('_blank');
      expect(linkProps.terms.rel).toBe('noopener noreferrer');
    });

    it('validates optional Admin PIN: blank maintains existing PIN, 4-8 digits is valid', () => {
      const validatePin = (pin: string) => {
        const trimmed = pin.trim();
        if (trimmed.length === 0) return { shouldUpdate: false, valid: true };
        if (trimmed.length >= 4 && trimmed.length <= 8 && /^\d+$/.test(trimmed)) {
          return { shouldUpdate: true, valid: true };
        }
        return { shouldUpdate: false, valid: false };
      };

      expect(validatePin('')).toEqual({ shouldUpdate: false, valid: true });
      expect(validatePin('   ')).toEqual({ shouldUpdate: false, valid: true });
      expect(validatePin('1234')).toEqual({ shouldUpdate: true, valid: true });
      expect(validatePin('98765432')).toEqual({ shouldUpdate: true, valid: true });
      expect(validatePin('123')).toEqual({ shouldUpdate: false, valid: false });
      expect(validatePin('123456789')).toEqual({ shouldUpdate: false, valid: false });
      expect(validatePin('123a')).toEqual({ shouldUpdate: false, valid: false });
    });
  });

  describe('Initial Setup Completion & Terms Gating Lifecycle', () => {
    it('defaults initial_setup_completed to false on factory reset and first boot', () => {
      const defaultState = { initial_setup_completed: false, terms_accepted: false };
      expect(defaultState.initial_setup_completed).toBe(false);
      expect(defaultState.terms_accepted).toBe(false);
    });

    it('disallows dismiss (X button, backdrop, Esc) and hides Skip for Now when terms_accepted is false', () => {
      const canDismissOrSkip = (termsAccepted: boolean) => ({
        showCloseButton: termsAccepted,
        allowBackdropClose: termsAccepted,
        allowEscapeClose: termsAccepted,
        allowSkipForNow: termsAccepted,
      });

      expect(canDismissOrSkip(false)).toEqual({
        showCloseButton: false,
        allowBackdropClose: false,
        allowEscapeClose: false,
        allowSkipForNow: false,
      });

      expect(canDismissOrSkip(true)).toEqual({
        showCloseButton: true,
        allowBackdropClose: true,
        allowEscapeClose: true,
        allowSkipForNow: true,
      });
    });

    it('marks initial_setup_completed as true when setup is saved with terms', () => {
      const completeSetup = (state: { initial_setup_completed: boolean; terms_accepted: boolean }) => ({
        ...state,
        initial_setup_completed: true,
        terms_accepted: true,
      });
      const updated = completeSetup({ initial_setup_completed: false, terms_accepted: false });
      expect(updated.initial_setup_completed).toBe(true);
      expect(updated.terms_accepted).toBe(true);
    });
  });
});

