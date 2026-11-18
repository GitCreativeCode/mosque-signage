'use client';

import React from 'react';

export interface HijriCalibrationSectionProps {
  readonly hijriOffset: number;
  readonly setHijriOffset: (offset: number) => void;
  readonly liveHijriPreview: string;
}

/**
 * Islamic Hijri Date & Moon-Sighting Calibration Section
 */
export function HijriCalibrationSection({
  hijriOffset,
  setHijriOffset,
  liveHijriPreview,
}: HijriCalibrationSectionProps) {
  return (
    <div className="bg-[#20222a] border border-[#2e323b] rounded-xl p-6 shadow-sm space-y-5">
      <div className="pb-3 border-b border-[#2e323b]">
        <h3 className="text-sm font-semibold text-white tracking-tight">
          Hijri Date & Moon Sighting Adjustment
        </h3>
        <p className="text-xs text-neutral-400 mt-0.5">
          Adjust the Islamic date by ±1 or 2 days to match local moon sighting announcements.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-center">
        <div>
          <label className="block text-xs font-medium text-neutral-300 mb-2">
            Day Adjustment
          </label>
          <div className="flex items-center space-x-2">
            {([-2, -1, 0, 1, 2] as const).map((offset) => (
              <button
                key={offset}
                type="button"
                onClick={() => setHijriOffset(offset)}
                className={`flex-1 py-2 rounded-lg font-mono tabular-nums font-semibold text-xs transition-all duration-150 active:scale-95 cursor-pointer border ${
                  hijriOffset === offset
                    ? 'bg-[#282a35] text-white border-[#388bfd] shadow-sm'
                    : 'bg-[#181a20] hover:bg-[#282a35] text-neutral-400 border-[#2e323b]'
                }`}
              >
                {offset > 0 ? `+${offset}` : offset}d
              </button>
            ))}
          </div>
        </div>

        {/* Live Preview Card */}
        <div className="bg-[#181a20] p-4 rounded-lg border border-[#2e323b] flex flex-col justify-center">
          <span className="text-[11px] font-medium uppercase tracking-wider text-neutral-400">
            Preview
          </span>
          <span className="text-sm font-semibold text-white mt-0.5">{liveHijriPreview}</span>
          <span className="text-[11px] text-neutral-400 mt-0.5 tabular-nums">
            Offset: {hijriOffset > 0 ? `+${hijriOffset}` : hijriOffset} day(s)
          </span>
        </div>
      </div>
    </div>
  );
}
