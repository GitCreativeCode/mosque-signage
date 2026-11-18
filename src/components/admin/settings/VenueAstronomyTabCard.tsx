'use client';

import React from 'react';
import { Info, Loader2, MapPin } from 'lucide-react';
import { formatHijriDate } from '@/lib/prayer/hijri';
import { PrayerCalculationDisclaimer } from '../prayer/PrayerCalculationDisclaimer';

export interface VenueAstronomyTabCardProps {
  readonly calculationMethod: string;
  readonly madhab: 'shafi' | 'hanafi';
  readonly latitude: number | null;
  readonly longitude: number | null;
  readonly hijriOffset: number;
  readonly isDetectingLocation: boolean;
  readonly detectLocationMsg: string | null;
  readonly onChangeCalculationMethod: (val: string) => void;
  readonly onChangeMadhab: (val: 'shafi' | 'hanafi') => void;
  readonly onChangeLatitude: (val: number | null) => void;
  readonly onChangeLongitude: (val: number | null) => void;
  readonly onChangeHijriOffset: (val: number) => void;
  readonly onAutoDetectLocation: () => void;
  readonly markDirty: () => void;
}

export function VenueAstronomyTabCard(props: VenueAstronomyTabCardProps) {
  const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const liveHijriPreview = formatHijriDate(new Date(), props.hijriOffset, { timezone: localTz });

  return (
    <div className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-6 space-y-6 shadow-sm">
      <div className="border-b border-[var(--admin-border)] pb-3">
        <h3 className="text-sm font-bold text-[var(--admin-text-primary)]">Calculation Method &amp; Hijri Moon Calibration</h3>
        <p className="text-xs text-[var(--admin-text-muted)]">
          Configure calculation methods, madhab juristic angles, GPS coordinates, and lunar offset.
        </p>
      </div>

      <PrayerCalculationDisclaimer />

      <div className="p-4 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] space-y-2">
        <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
          <Info className="w-4 h-4 shrink-0" />
          <span>Prayer Calculation Engine &amp; Offline Mathematical Models</span>
        </div>
        <p className="text-xs text-[var(--admin-text-secondary)] leading-relaxed">
          Adhan timetables and Islamic Hijri dates are computed <strong>100% locally and offline</strong> via embedded <strong>Astronomical Algorithms</strong> (incorporating Jean Meeus solar ephemeris and Umm Al-Qura lunar calibration). Solar declination curves and prayer angles evaluate deterministically against your venue&apos;s coordinates with zero external API calls or internet dependencies.
        </p>
        <div className="flex flex-wrap gap-2 text-[11px] text-[var(--admin-text-muted)] pt-1 font-mono">
          <span className="px-2 py-0.5 rounded bg-[var(--admin-card)] border border-[var(--admin-border)]">Engine: Embedded Local Math (Offline)</span>
          <span className="px-2 py-0.5 rounded bg-[var(--admin-card)] border border-[var(--admin-border)]">Hijri Table: Umm al-Qura Makkah</span>
          <span className="px-2 py-0.5 rounded bg-[var(--admin-card)] border border-[var(--admin-border)]">Algorithms: Jean Meeus Astronomical Formulae</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[var(--admin-text-secondary)]">Calculation Method</label>
          <select value={props.calculationMethod} onChange={(e) => { props.onChangeCalculationMethod(e.target.value); props.markDirty(); }} className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--admin-tab-active-border)]">
            <option value="NorthAmerica">ISNA — Islamic Society of North America (15° / 15°)</option>
            <option value="MuslimWorldLeague">Muslim World League (MWL - 18° / 17°)</option>
            <option value="Egyptian">Egyptian General Authority of Survey (19.5° / 17.5°)</option>
            <option value="UmmAlQura">Umm al-Qura University, Makkah (18.5° / +90m)</option>
            <option value="Dubai">Dubai Unified Hijri Calendar (18.2° / 18.2°)</option>
            <option value="Karachi">University of Islamic Sciences, Karachi (18° / 18°)</option>
            <option value="Tehran">Institute of Geophysics, University of Tehran</option>
            <option value="Kuwait">Kuwait (18° / 17.5°)</option>
            <option value="Qatar">Qatar (18° / +90m)</option>
            <option value="Singapore">MUIS — Islamic Religious Council of Singapore</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[var(--admin-text-secondary)]">Asr Juristic Calculation (Madhab)</label>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => { props.onChangeMadhab('shafi'); props.markDirty(); }} className={`py-2 px-3 rounded-xl text-xs font-semibold border transition cursor-pointer text-center ${props.madhab === 'shafi' ? 'bg-[var(--admin-btn-primary-bg)] text-[var(--admin-btn-primary-text)] border-[var(--admin-btn-primary-bg)] shadow-sm' : 'bg-[var(--admin-surface)] border-[var(--admin-border)] text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)]'}`}>
              Standard (Shafi/Hanbali/Maliki)
            </button>
            <button type="button" onClick={() => { props.onChangeMadhab('hanafi'); props.markDirty(); }} className={`py-2 px-3 rounded-xl text-xs font-semibold border transition cursor-pointer text-center ${props.madhab === 'hanafi' ? 'bg-[var(--admin-btn-primary-bg)] text-[var(--admin-btn-primary-text)] border-[var(--admin-btn-primary-bg)] shadow-sm' : 'bg-[var(--admin-surface)] border-[var(--admin-border)] text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)]'}`}>
              Hanafi (2x Shadow)
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[var(--admin-text-secondary)]">Venue Latitude</label>
          <input
            type="number"
            step="any"
            placeholder="e.g. 43.5890"
            value={props.latitude ?? ''}
            onChange={(e) => {
              const val = e.target.value.trim();
              props.onChangeLatitude(val === '' ? null : parseFloat(val));
              props.markDirty();
            }}
            className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--admin-tab-active-border)] font-mono"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[var(--admin-text-secondary)]">Venue Longitude</label>
          <input
            type="number"
            step="any"
            placeholder="e.g. -79.6441"
            value={props.longitude ?? ''}
            onChange={(e) => {
              const val = e.target.value.trim();
              props.onChangeLongitude(val === '' ? null : parseFloat(val));
              props.markDirty();
            }}
            className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--admin-tab-active-border)] font-mono"
          />
        </div>

        <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-2 pt-1">
          <button type="button" onClick={props.onAutoDetectLocation} disabled={props.isDetectingLocation} className="px-3 py-1.5 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] hover:bg-[var(--admin-card)] text-xs font-medium text-[var(--admin-text-primary)] flex items-center space-x-1.5 transition cursor-pointer shadow-sm active:scale-95 disabled:opacity-50">
            {props.isDetectingLocation ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MapPin className="w-3.5 h-3.5 text-emerald-500" />}
            <span>{props.isDetectingLocation ? 'Detecting Coordinates...' : 'Auto-Detect Coordinates'}</span>
          </button>
          {props.detectLocationMsg && (
            <span className="text-xs font-semibold text-emerald-500 animate-fadeIn font-mono">{props.detectLocationMsg}</span>
          )}
        </div>
      </div>

      <div className="pt-4 border-t border-[var(--admin-border)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-xs font-bold text-[var(--admin-text-primary)] uppercase tracking-wider">Hijri Moon-Sighting Offset</h4>
            <p className="text-xs text-[var(--admin-text-muted)] mt-0.5">
              Adjust date forwards or backwards by up to 2 days to synchronize with local hilal sightings.
            </p>
          </div>
          <div className="px-3 py-1.5 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] text-xs font-mono font-semibold text-[var(--admin-text-primary)] shrink-0 shadow-sm">
            <span>{liveHijriPreview}</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {([-2, -1, 0, 1, 2] as const).map((offset) => (
            <button key={offset} type="button" onClick={() => { props.onChangeHijriOffset(offset); props.markDirty(); }} className={`flex-1 py-2 text-xs font-mono rounded-xl border transition cursor-pointer ${props.hijriOffset === offset ? 'bg-[var(--admin-card)] text-[var(--admin-text-primary)] border-[var(--admin-tab-active-border)] shadow-sm font-bold' : 'bg-[var(--admin-surface)] text-[var(--admin-text-muted)] border-[var(--admin-border)] hover:text-[var(--admin-text-primary)]'}`}>
              {offset === 0 ? '0 (Standard)' : offset > 0 ? `+${offset} Day` : `${offset} Day`}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

