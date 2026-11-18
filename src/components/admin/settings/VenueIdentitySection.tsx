'use client';

import React from 'react';
import type { DateDisplayMode } from '@/types/index';

export interface TimezoneOption {
  readonly label: string;
  readonly value: string;
}

export interface VenueIdentitySectionProps {
  readonly mosqueName: string;
  readonly setMosqueName: (val: string) => void;
  readonly timezone: string;
  readonly setTimezone: (val: string) => void;
  readonly dateFormat: DateDisplayMode;
  readonly setDateFormat: (val: DateDisplayMode) => void;
  readonly tickerText: string;
  readonly setTickerText: (val: string) => void;
  readonly timezones: readonly TimezoneOption[];
}

/**
 * Venue Identity & Broadcast Marquee Section
 */
export function VenueIdentitySection({
  mosqueName,
  setMosqueName,
  timezone,
  setTimezone,
  dateFormat,
  setDateFormat,
  tickerText,
  setTickerText,
  timezones,
}: VenueIdentitySectionProps) {
  return (
    <div className="bg-[#20222a] border border-[#2e323b] rounded-xl p-6 shadow-sm space-y-5">
      <div className="pb-3 border-b border-[#2e323b]">
        <h3 className="text-sm font-semibold text-white tracking-tight">
          Mosque Identity & Announcement Ticker
        </h3>
        <p className="text-xs text-neutral-400 mt-0.5">
          Set your mosque name, local timezone, and the scrolling announcement ticker shown on the screen.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div>
          <label className="block text-xs font-medium text-neutral-300 mb-1.5">
            Mosque Name
          </label>
          <input
            type="text"
            required
            value={mosqueName}
            onChange={(e) => setMosqueName(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-[#15161b] border border-[#313542] text-white font-medium focus:outline-none focus:border-[#388bfd] text-xs"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-neutral-300 mb-1.5">
            Timezone
          </label>
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-[#15161b] border border-[#313542] text-white font-mono text-xs focus:outline-none focus:border-[#388bfd]"
          >
            {timezones.map((tz) => (
              <option key={tz.value} value={tz.value} className="bg-[#20222a] text-white">
                {tz.label}
              </option>
            ))}
            {!timezones.some((tz) => tz.value === timezone) && (
              <option value={timezone} className="bg-[#20222a] text-white">
                {timezone} (Custom)
              </option>
            )}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-neutral-300 mb-1.5">
            Top Bar Date Display
          </label>
          <select
            value={dateFormat}
            onChange={(e) => setDateFormat(e.target.value as DateDisplayMode)}
            className="w-full px-3 py-2 rounded-lg bg-[#15161b] border border-[#313542] text-white text-xs focus:outline-none focus:border-[#388bfd]"
          >
            <option value="both" className="bg-[#20222a] text-white">
              Both Hijri & Gregorian Dates
            </option>
            <option value="hijri" className="bg-[#20222a] text-white">
              Hijri Date Only
            </option>
            <option value="gregorian" className="bg-[#20222a] text-white">
              Gregorian Date Only
            </option>
          </select>
        </div>

        <div className="md:col-span-3">
          <label className="block text-xs font-medium text-neutral-300 mb-1.5">
            Announcement Ticker{' '}
            <span className="text-neutral-500 font-normal lowercase">
              (optional — leave blank to hide)
            </span>
          </label>
          <textarea
            rows={2}
            value={tickerText}
            onChange={(e) => setTickerText(e.target.value)}
            placeholder="Welcome to the mosque • Please silence mobile devices • Donate at..."
            className="w-full px-3 py-2 rounded-lg bg-[#15161b] border border-[#313542] text-white text-xs focus:outline-none focus:border-[#388bfd] leading-relaxed"
          />
        </div>
      </div>
    </div>
  );
}
