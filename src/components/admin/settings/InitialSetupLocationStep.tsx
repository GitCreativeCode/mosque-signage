'use client';

import React from 'react';
import { AlertTriangle, CheckCircle2, Compass, Globe, Loader2, MapPin, Sliders } from 'lucide-react';
import { CALCULATION_METHODS } from '@/lib/prayer/calculation-methods';
import { PrayerCalculationDisclaimer } from '../prayer/PrayerCalculationDisclaimer';

const COMMON_TIMEZONES = [
  { label: 'America/Toronto (Eastern Time - Canada)', value: 'America/Toronto' },
  { label: 'America/New_York (Eastern Time - US)', value: 'America/New_York' },
  { label: 'America/Chicago (Central Time)', value: 'America/Chicago' },
  { label: 'America/Edmonton (Mountain Time - Canada)', value: 'America/Edmonton' },
  { label: 'America/Denver (Mountain Time - US)', value: 'America/Denver' },
  { label: 'America/Vancouver (Pacific Time - Canada)', value: 'America/Vancouver' },
  { label: 'America/Los_Angeles (Pacific Time - US)', value: 'America/Los_Angeles' },
  { label: 'Europe/London (GMT/BST - UK)', value: 'Europe/London' },
  { label: 'Asia/Riyadh (AST - Saudi Arabia)', value: 'Asia/Riyadh' },
  { label: 'Asia/Dubai (GST - UAE)', value: 'Asia/Dubai' },
  { label: 'Asia/Karachi (PKT - Pakistan)', value: 'Asia/Karachi' },
];

export interface InitialSetupLocationStepProps {
  readonly latitude: number | null;
  readonly longitude: number | null;
  readonly timezone: string;
  readonly calculationMethod: string;
  readonly madhab: 'shafi' | 'hanafi';
  readonly isDetectingGps: boolean;
  readonly gpsMessage: string | null;
  readonly onChangeLatitude: (val: number | null) => void;
  readonly onChangeLongitude: (val: number | null) => void;
  readonly onChangeTimezone: (val: string) => void;
  readonly onChangeCalculationMethod: (val: string) => void;
  readonly onChangeMadhab: (val: 'shafi' | 'hanafi') => void;
  readonly onDetectGps: () => void;
}

export function InitialSetupLocationStep({
  latitude,
  longitude,
  timezone,
  calculationMethod,
  madhab,
  isDetectingGps,
  gpsMessage,
  onChangeLatitude,
  onChangeLongitude,
  onChangeTimezone,
  onChangeCalculationMethod,
  onChangeMadhab,
  onDetectGps,
}: InitialSetupLocationStepProps) {
  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="flex items-center space-x-2 text-xs font-bold text-[var(--admin-text-secondary)] uppercase tracking-wider">
        <Compass className="w-4 h-4 text-[var(--admin-text-primary)]" />
        <span>Geographic Location &amp; Astronomical Calculation</span>
      </div>

      <PrayerCalculationDisclaimer />

      <div className="space-y-2.5 p-3.5 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)]/60">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-[var(--admin-text-secondary)] flex items-center space-x-1.5">
            <MapPin className="w-3.5 h-3.5 text-[var(--admin-text-muted)]" />
            <span>Exact Coordinates (Latitude &amp; Longitude)</span>
          </label>
          <button
            type="button"
            onClick={onDetectGps}
            disabled={isDetectingGps}
            className="px-2.5 py-1 text-[11px] font-semibold rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card)] hover:bg-[var(--admin-card-hover)] text-[var(--admin-text-primary)] flex items-center space-x-1 transition cursor-pointer disabled:opacity-50 shadow-xs"
          >
            {isDetectingGps ? (
              <><Loader2 className="w-3 h-3 animate-spin" /><span>Detecting...</span></>
            ) : (
              <><Compass className="w-3 h-3" /><span>Detect Location</span></>
            )}
          </button>
        </div>

        {gpsMessage && (
          <p
            className={`text-[11px] flex items-center space-x-1 font-medium ${
              gpsMessage.startsWith('Location detected')
                ? 'text-emerald-500 dark:text-emerald-400'
                : 'text-amber-600 dark:text-amber-400'
            }`}
          >
            {gpsMessage.startsWith('Location detected') ? (
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-500" />
            )}
            <span>{gpsMessage}</span>
          </p>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <span className="block text-[11px] text-[var(--admin-text-muted)] mb-1">Latitude</span>
            <input
              type="number"
              step="any"
              placeholder="e.g. 43.5890"
              value={latitude ?? ''}
              onChange={(e) => {
                const val = e.target.value.trim();
                onChangeLatitude(val === '' ? null : parseFloat(val));
              }}
              className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card)] text-[var(--admin-text-primary)] font-mono focus:outline-none focus:ring-1 focus:ring-[var(--admin-tab-active-border)]"
            />
          </div>
          <div>
            <span className="block text-[11px] text-[var(--admin-text-muted)] mb-1">Longitude</span>
            <input
              type="number"
              step="any"
              placeholder="e.g. -79.6441"
              value={longitude ?? ''}
              onChange={(e) => {
                const val = e.target.value.trim();
                onChangeLongitude(val === '' ? null : parseFloat(val));
              }}
              className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card)] text-[var(--admin-text-primary)] font-mono focus:outline-none focus:ring-1 focus:ring-[var(--admin-tab-active-border)]"
            />
          </div>
        </div>

        {(latitude === null || longitude === null) && (
          <div className="p-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-[11px] text-amber-800 dark:text-amber-200 flex items-start space-x-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Coordinates not entered:</strong> Astronomical prayer calculation will remain paused until coordinates are set. You can still continue to launch signage and configure coordinates later or upload a CSV schedule.
            </p>
          </div>
        )}
      </div>

      <div className="space-y-1.5 p-3.5 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)]/60">
        <label className="block text-xs font-semibold text-[var(--admin-text-secondary)] flex items-center space-x-1.5">
          <Globe className="w-3.5 h-3.5 text-[var(--admin-text-muted)]" />
          <span>Timezone</span>
        </label>
        <select
          value={timezone}
          onChange={(e) => onChangeTimezone(e.target.value)}
          className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card)] text-[var(--admin-text-primary)] font-mono focus:outline-none focus:ring-1 focus:ring-[var(--admin-tab-active-border)]"
        >
          {COMMON_TIMEZONES.map((tz) => (
            <option key={tz.value} value={tz.value} className="bg-[var(--admin-card)]">{tz.label}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)]/60">
        <div>
          <label className="block text-xs font-semibold text-[var(--admin-text-secondary)] mb-1">Calculation Method</label>
          <select
            value={calculationMethod}
            onChange={(e) => onChangeCalculationMethod(e.target.value)}
            className="w-full px-2.5 py-2 text-xs rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card)] text-[var(--admin-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--admin-tab-active-border)]"
          >
            {CALCULATION_METHODS.map((m) => (
              <option key={m.id} value={m.id} className="bg-[var(--admin-card)]">{m.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[var(--admin-text-secondary)] mb-1">Asr Juristic Madhab</label>
          <div className="grid grid-cols-2 gap-2 mt-1">
            <button
              type="button"
              onClick={() => onChangeMadhab('shafi')}
              className={`py-1.5 px-2 text-xs font-semibold rounded-lg border transition cursor-pointer text-center ${
                madhab === 'shafi'
                  ? 'border-[var(--admin-tab-active-border)] bg-[var(--admin-surface)] text-[var(--admin-text-primary)] font-bold shadow-xs'
                  : 'border-[var(--admin-border)] bg-[var(--admin-card)] text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)]'
              }`}
            >
              Shafi / Standard
            </button>
            <button
              type="button"
              onClick={() => onChangeMadhab('hanafi')}
              className={`py-1.5 px-2 text-xs font-semibold rounded-lg border transition cursor-pointer text-center ${
                madhab === 'hanafi'
                  ? 'border-[var(--admin-tab-active-border)] bg-[var(--admin-surface)] text-[var(--admin-text-primary)] font-bold shadow-xs'
                  : 'border-[var(--admin-border)] bg-[var(--admin-card)] text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)]'
              }`}
            >
              Hanafi
            </button>
          </div>
        </div>
      </div>

      <div className="p-3 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)]/40 flex items-start space-x-2.5 text-xs text-[var(--admin-text-muted)]">
        <Sliders className="w-4 h-4 text-[var(--admin-text-secondary)] shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-[var(--admin-text-primary)] font-semibold">Need custom twilight angles or degrees?</strong>{' '}
          Don’t worry if you’re unsure right now. You can customize calculation methods, custom angles (e.g. 15° vs 18° Fajr/Isha), minute buffers, and Hijri moon calibration anytime in{' '}
          <span className="text-[var(--admin-text-primary)] font-semibold">Settings → Calculation &amp; Hijri Calendar</span>.
        </p>
      </div>
    </div>
  );
}

