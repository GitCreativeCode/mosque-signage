'use client';

import React from 'react';
import { AlertTriangle, ArrowLeft, ArrowRight, Loader2, X } from 'lucide-react';
import type { Settings } from '@/types/index';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { useInitialSetupModal } from '@/hooks/useInitialSetupModal';
import { useAppTheme } from '@/lib/theme/theme-sync';
import { InitialSetupIdentityStep } from './InitialSetupIdentityStep';
import { InitialSetupLocationStep } from './InitialSetupLocationStep';
import { InitialSetupScreenStep } from './InitialSetupScreenStep';

export interface InitialSetupModalProps {
  readonly isOpen: boolean;
  readonly settings: Settings;
  readonly onClose: () => void;
  readonly onComplete: () => void;
}

export const STEP_LABELS: Record<number, string> = {
  1: 'Identity & Ticker',
  2: 'Location & Math',
  3: 'Security & Terms',
};

export function InitialSetupModal({ isOpen, settings, onClose, onComplete }: InitialSetupModalProps) {
  const isTermsAlreadyAccepted = Boolean(settings.terms_accepted);
  const s = useInitialSetupModal(isOpen, settings, onComplete, onClose);
  const { preference: themePref, setPreference: setThemePref } = useAppTheme();
  const scrollContainerRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [s.step]);

  const trapRef = useFocusTrap<HTMLDivElement>({
    isActive: isOpen && !s.isSaving,
    onEscape: isTermsAlreadyAccepted ? onClose : () => {},
  });
  if (!isOpen) return null;

  return (
    <div
      ref={trapRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="initial-setup-title"
      tabIndex={-1}
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4"
    >
      <div
        className="fixed -inset-8 bg-black/80 backdrop-blur-md animate-fadeIn"
        aria-hidden="true"
        onClick={isTermsAlreadyAccepted ? onClose : undefined}
      />
      <div className="relative w-full h-[100dvh] sm:h-auto sm:max-w-xl rounded-none sm:rounded-2xl border-0 sm:border border-[var(--admin-border)] bg-[var(--admin-card)] text-[var(--admin-text-primary)] shadow-2xl overflow-hidden flex flex-col sm:max-h-[92dvh]">
        <div className="px-4 sm:px-6 pt-4 sm:pt-5 pb-3.5 sm:pb-4 border-b border-[var(--admin-border)] bg-[var(--admin-surface)]/60 flex items-start justify-between gap-2 shrink-0">
          <div className="space-y-1 min-w-0">
            <h2 id="initial-setup-title" className="text-base font-bold tracking-tight text-[var(--admin-text-primary)]">
              Initial Venue Configuration
            </h2>
            <p className="text-xs text-[var(--admin-text-muted)] leading-relaxed">
              Configure your mosque or venue details, prayer calculation methods, and display preferences.
            </p>
          </div>
          {isTermsAlreadyAccepted && (
            <button
              type="button"
              onClick={onClose}
              disabled={s.isSaving}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)] hover:bg-[var(--admin-surface)] transition cursor-pointer disabled:opacity-30 shrink-0"
              aria-label="Close setup modal"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="px-4 sm:px-6 py-2.5 bg-[var(--admin-card)] border-b border-[var(--admin-border)]/60 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2 w-full">
            {[1, 2, 3].map((idx) => (
              <div
                key={idx}
                className={`py-1.5 px-2.5 sm:px-3 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 sm:space-x-2 transition-all ${
                  s.step === idx
                    ? 'flex-1 border border-[var(--admin-tab-active-border)] bg-[var(--admin-surface)] text-[var(--admin-text-primary)] font-bold shadow-xs'
                    : s.step > idx
                      ? 'sm:flex-1 border border-[var(--admin-border)] bg-[var(--admin-surface)]/60 text-[var(--admin-text-primary)]'
                      : 'sm:flex-1 border border-[var(--admin-border)] text-[var(--admin-text-muted)] opacity-60'
                }`}
              >
                <span className="w-4 h-4 rounded-full bg-[var(--admin-border)] text-[var(--admin-text-secondary)] flex items-center justify-center text-[10px] font-bold shrink-0">
                  {idx}
                </span>
                <span className={`text-[11px] truncate ${s.step === idx ? 'inline' : 'hidden sm:inline'}`}>
                  {STEP_LABELS[idx]}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div ref={scrollContainerRef} className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-5 text-xs leading-relaxed select-text">
          {s.error && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-medium flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{s.error}</span>
            </div>
          )}
          {s.step === 1 && (
            <InitialSetupIdentityStep
              mosqueName={s.mosqueName}
              headerGreeting={s.headerGreeting}
              tickerText={s.tickerText}
              themePreference={themePref}
              onChangeMosqueName={s.setMosqueName}
              onChangeHeaderGreeting={s.setHeaderGreeting}
              onChangeTickerText={s.setTickerText}
              onChangeThemePreference={setThemePref}
            />
          )}
          {s.step === 2 && (
            <InitialSetupLocationStep
              latitude={s.latitude}
              longitude={s.longitude}
              timezone={s.timezone}
              calculationMethod={s.calculationMethod}
              madhab={s.madhab}
              isDetectingGps={s.isDetectingGps}
              gpsMessage={s.gpsMessage}
              onChangeLatitude={s.setLatitude}
              onChangeLongitude={s.setLongitude}
              onChangeTimezone={s.setTimezone}
              onChangeCalculationMethod={s.setCalculationMethod}
              onChangeMadhab={s.setMadhab}
              onDetectGps={s.handleDetectGps}
            />
          )}
          {s.step === 3 && (
            <InitialSetupScreenStep
              newAdminPin={s.newAdminPin}
              termsAccepted={s.termsAccepted}
              onChangeNewAdminPin={s.setNewAdminPin}
              onChangeTermsAccepted={s.setTermsAccepted}
            />
          )}
        </div>

        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-t border-[var(--admin-border)] bg-[var(--admin-surface)]/60 flex items-center justify-between gap-2 shrink-0">
          <div>
            {s.step > 1 ? (
              <button
                type="button"
                onClick={s.handlePrevStep}
                disabled={s.isSaving}
                className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text-secondary)] hover:text-[var(--admin-text-primary)] transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            ) : isTermsAlreadyAccepted ? (
              <button
                type="button"
                onClick={s.handleSkipForNow}
                disabled={s.isSaving}
                className="px-3.5 py-2 text-xs font-semibold text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)] transition cursor-pointer"
              >
                Skip for Now
              </button>
            ) : null}
          </div>
          <div className="flex items-center space-x-2">
            {s.step < 3 ? (
              <button
                type="button"
                onClick={s.handleNextStep}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-neutral-100 dark:text-neutral-950 transition flex items-center space-x-1.5 shadow-sm cursor-pointer active:scale-95"
              >
                <span>Next Step</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={s.handleSaveAndLaunch}
                disabled={s.isSaving || !s.termsAccepted}
                title={!s.termsAccepted ? 'Please agree to the Privacy Policy and Terms of Use to proceed' : undefined}
                className={`px-5 py-2 text-xs font-bold rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-neutral-100 dark:text-neutral-950 transition flex items-center space-x-2 shadow-sm ${
                  !s.termsAccepted || s.isSaving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-95'
                }`}
              >
                {s.isSaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving Configuration...</span>
                  </>
                ) : (
                  <span>Save &amp; Launch Signage</span>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
