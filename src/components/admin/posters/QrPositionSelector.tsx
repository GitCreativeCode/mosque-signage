'use client';

import React from 'react';
import type { QrPosition } from '@/types/index';

export interface QrPositionSelectorProps {
  readonly value: QrPosition;
  readonly onChange: (pos: QrPosition) => void;
  readonly disabled?: boolean | undefined;
}

interface SpotOption {
  readonly id: QrPosition;
  readonly shortLabel: string;
  readonly title: string;
  readonly dotClass: string;
}

const SPOTS: readonly SpotOption[] = [
  {
    id: 'top-left',
    shortLabel: 'Top Left',
    title: 'Top Left Corner',
    dotClass: 'top-1 left-1',
  },
  {
    id: 'top-center',
    shortLabel: 'Top Center',
    title: 'Top Edge Center',
    dotClass: 'top-1 left-1/2 -translate-x-1/2',
  },
  {
    id: 'top-right',
    shortLabel: 'Top Right',
    title: 'Top Right Corner',
    dotClass: 'top-1 right-1',
  },
  {
    id: 'bottom-left',
    shortLabel: 'Bottom Left (Default)',
    title: 'Bottom Left Corner',
    dotClass: 'bottom-1 left-1',
  },
  {
    id: 'bottom-center',
    shortLabel: 'Bottom Center',
    title: 'Bottom Edge Center',
    dotClass: 'bottom-1 left-1/2 -translate-x-1/2',
  },
  {
    id: 'bottom-right',
    shortLabel: 'Bottom Right',
    title: 'Bottom Right Corner',
    dotClass: 'bottom-1 right-1',
  },
];

/**
 * 3x2 Visual Screen Placement Grid for Poster QR Code
 * Allows admins to place the QR pop-out badge in any of 6 spots (Option A)
 * so it never obscures critical flyer dates, speaker photos, or sponsor logos.
 */
export function QrPositionSelector({
  value,
  onChange,
  disabled = false,
}: QrPositionSelectorProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-[var(--admin-text-secondary)]">
          QR Code Screen Placement
        </label>
        <span className="text-[11px] text-[var(--admin-text-muted)] font-mono">
          {SPOTS.find((s) => s.id === value)?.title ?? 'Bottom Left'}
        </span>
      </div>

      <p className="text-[11px] text-[var(--admin-text-muted)]">
        Choose where the QR code appears on your slide so it doesn&apos;t cover essential artwork or text.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
        {SPOTS.map((spot) => {
          const isSelected = value === spot.id;
          return (
            <button
              key={spot.id}
              type="button"
              disabled={disabled}
              onClick={() => onChange(spot.id)}
              className={`p-2 rounded-xl border text-left transition-all duration-150 flex flex-col justify-between h-[68px] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                isSelected
                  ? 'bg-[var(--admin-surface)] border-[var(--admin-tab-active-border)] text-[var(--admin-text-primary)] ring-1 ring-[var(--admin-tab-active-border)] shadow-sm'
                  : 'bg-[var(--admin-card)] border-[var(--admin-border)] text-[var(--admin-text-muted)] hover:bg-[var(--admin-surface)] hover:text-[var(--admin-text-primary)] hover:border-[var(--admin-tab-active-border)]/50'
              }`}
            >
              {/* Mini Screen Viewport Representation with Always-Visible Small QR Box */}
              <div
                className={`relative w-full h-6 rounded-md overflow-hidden transition-colors ${
                  isSelected
                    ? 'bg-neutral-950 border border-[var(--admin-tab-active-border)] ring-1 ring-[var(--admin-tab-active-border)]/40'
                    : 'bg-neutral-900 border border-neutral-700/70'
                }`}
              >
                {/* The Small QR Box showing where it will be placed */}
                <span
                  className={`absolute w-3.5 h-2.5 rounded-[2px] transition-all ${
                    spot.dotClass
                  } ${
                    isSelected
                      ? 'bg-white border border-white shadow-[0_0_6px_rgba(255,255,255,0.9)]'
                      : 'bg-neutral-300 border border-neutral-400/80 shadow-sm opacity-85'
                  }`}
                />
              </div>

              {/* Position Label */}
              <span
                className={`text-[10px] font-semibold truncate ${
                  isSelected ? 'text-[var(--admin-text-primary)]' : 'text-[var(--admin-text-muted)]'
                }`}
              >
                {spot.shortLabel}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
