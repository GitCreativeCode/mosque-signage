'use client';

import { useState, useEffect, useRef } from 'react';
import type { Settings, SidebarMode } from '@/types/index';
import { updateVenueSettings } from '@/lib/actions/settings';
import { updateAdminPinDirect } from '@/lib/actions/auth';

export function useInitialSetupModal(
  isOpen: boolean,
  settings: Settings,
  onComplete: () => void,
  onClose: () => void
) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [mosqueName, setMosqueName] = useState(settings.mosque_name || 'Islamic Community Center');
  const [headerGreeting, setHeaderGreeting] = useState(settings.header_greeting ?? 'Welcome to');
  const [tickerText, setTickerText] = useState(
    settings.ticker_text || 'Welcome to the Islamic Center • Please silence mobile phones upon entering the prayer hall'
  );
  const [latitude, setLatitude] = useState<number | null>(
    typeof settings.latitude === 'number' && settings.initial_setup_completed ? settings.latitude : null
  );
  const [longitude, setLongitude] = useState<number | null>(
    typeof settings.longitude === 'number' && settings.initial_setup_completed ? settings.longitude : null
  );
  const [timezone, setTimezone] = useState(settings.timezone || 'America/Toronto');
  const [calculationMethod, setCalculationMethod] = useState(settings.calculation_method || 'NorthAmerica');
  const [madhab, setMadhab] = useState<'shafi' | 'hanafi'>(settings.madhab ?? 'shafi');
  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [gpsMessage, setGpsMessage] = useState<string | null>(null);
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>('hidden');
  const [newAdminPin, setNewAdminPin] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(Boolean(settings.terms_accepted));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasAutoDetectedGps = useRef(false);

  useEffect(() => {
    if (!isOpen) return;
    setStep(1);
    setMosqueName(settings.mosque_name || 'Islamic Community Center');
    setHeaderGreeting(settings.header_greeting ?? 'Welcome to');
    setTickerText(
      settings.ticker_text || 'Welcome to the Islamic Center • Please silence mobile phones upon entering the prayer hall'
    );
    setLatitude(typeof settings.latitude === 'number' && settings.initial_setup_completed ? settings.latitude : null);
    setLongitude(typeof settings.longitude === 'number' && settings.initial_setup_completed ? settings.longitude : null);
    setTimezone(settings.timezone || 'America/Toronto');
    setCalculationMethod(settings.calculation_method || 'NorthAmerica');
    setMadhab(settings.madhab ?? 'shafi');
    setSidebarMode('hidden');
    setNewAdminPin('');
    setTermsAccepted(Boolean(settings.terms_accepted));
    setError(null);
    setGpsMessage(null);
    hasAutoDetectedGps.current = false;
  }, [isOpen, settings]);

  const handleDetectGps = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setGpsMessage('Geolocation is not supported by your browser. Please enter coordinates manually.');
      return;
    }
    setIsDetectingGps(true);
    setGpsMessage(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = parseFloat(pos.coords.latitude.toFixed(5));
        const lng = parseFloat(pos.coords.longitude.toFixed(5));
        setLatitude(lat);
        setLongitude(lng);
        setIsDetectingGps(false);
        setGpsMessage(`Location detected: ${lat}, ${lng}`);
      },
      (err) => {
        setIsDetectingGps(false);
        setGpsMessage(`Could not detect location (${err.message}). Please enter coordinates manually.`);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  // Auto-detect browser timezone on entering Step 2 (strictly manual GPS trigger)
  useEffect(() => {
    if (step === 2 && !hasAutoDetectedGps.current) {
      hasAutoDetectedGps.current = true;
      try {
        const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (browserTz) setTimezone(browserTz);
      } catch {
        // ignore
      }
    }
  }, [step]);

  const handleNextStep = () => {
    setStep((prev) => (prev < 3 ? ((prev + 1) as 2 | 3) : 3));
  };

  const handlePrevStep = () => {
    setStep((prev) => (prev > 1 ? ((prev - 1) as 1 | 2) : 1));
  };

  const handleSaveAndLaunch = async () => {
    if (!termsAccepted) {
      setError('Please agree to the Privacy Policy and Terms of Use before launching.');
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      await updateVenueSettings({
        mosque_name: mosqueName.trim() || 'Islamic Community Center',
        header_greeting: headerGreeting.trim(),
        ticker_text: tickerText.trim(),
        latitude,
        longitude,
        timezone,
        calculation_method: calculationMethod,
        madhab,
        sidebar_mode: 'hidden',
        show_mini_prayer_pill: false,
        initial_setup_completed: true,
        terms_accepted: true,
        terms_accepted_at: new Date().toISOString(),
      });
      const trimmedPin = newAdminPin.trim();
      if (trimmedPin.length > 0) {
        const pinRes = await updateAdminPinDirect(trimmedPin);
        if (!pinRes.success) {
          setError(pinRes.error ?? 'Failed to update Admin PIN.');
          setIsSaving(false);
          return;
        }
      }
      onComplete();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred saving initial setup.');
      setIsSaving(false);
    }
  };

  const handleSkipForNow = async () => {
    if (!settings.terms_accepted) {
      setError('Please agree to the Privacy Policy and Terms of Use before proceeding.');
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      await updateVenueSettings({ initial_setup_completed: true });
      onComplete();
      onClose();
    } catch {
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return {
    step,
    setStep,
    handleNextStep,
    handlePrevStep,
    mosqueName,
    setMosqueName,
    headerGreeting,
    setHeaderGreeting,
    tickerText,
    setTickerText,
    latitude,
    setLatitude,
    longitude,
    setLongitude,
    timezone,
    setTimezone,
    calculationMethod,
    setCalculationMethod,
    madhab,
    setMadhab,
    isDetectingGps,
    gpsMessage,
    sidebarMode,
    setSidebarMode,
    newAdminPin,
    setNewAdminPin,
    termsAccepted,
    setTermsAccepted,
    isSaving,
    error,
    handleDetectGps,
    handleSaveAndLaunch,
    handleSkipForNow,
  };
}

