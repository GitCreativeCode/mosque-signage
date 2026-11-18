'use client';

import React from 'react';
import type { DateDisplayMode } from '@/types/index';

export interface TopBarDateBlockProps {
  readonly hijriDate: string;
  readonly gregorianDate?: string | undefined;
  readonly dateFormat: DateDisplayMode;
}

export function TopBarDateBlock({ hijriDate, gregorianDate, dateFormat }: TopBarDateBlockProps) {
  return (
    <div suppressHydrationWarning className="flex flex-col justify-center shrink-0 pr-5 max-w-[360px]">
      {dateFormat === 'hijri' ? (
        <span suppressHydrationWarning className="text-2xl font-semibold tracking-tight text-white truncate">
          {hijriDate}
        </span>
      ) : dateFormat === 'gregorian' ? (
        <span suppressHydrationWarning className="text-2xl font-semibold tracking-tight text-white truncate tabular-nums">
          {gregorianDate ?? hijriDate}
        </span>
      ) : (
        <div className="flex flex-col justify-center space-y-1">
          <span suppressHydrationWarning className="text-base font-semibold tracking-tight text-white truncate tabular-nums">
            {hijriDate}
          </span>
          {gregorianDate && (
            <span suppressHydrationWarning className="text-base font-medium text-neutral-300 truncate tabular-nums">
              {gregorianDate}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

