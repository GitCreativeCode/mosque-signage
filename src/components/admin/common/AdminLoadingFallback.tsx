'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

export interface AdminLoadingFallbackProps {
  readonly label?: string | undefined;
  readonly minHeightClass?: string | undefined;
}

/**
 * Lightweight loading placeholder rendered while dynamic admin tabs and modals load.
 */
export function AdminLoadingFallback({
  label = 'Loading...',
  minHeightClass = 'min-h-[240px]',
}: AdminLoadingFallbackProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`w-full flex flex-col items-center justify-center p-8 text-[var(--admin-text-muted)] space-y-3 ${minHeightClass}`}
    >
      <Loader2 className="w-6 h-6 animate-spin text-[var(--admin-accent)]" />
      <span className="text-xs font-medium tracking-wide">{label}</span>
    </div>
  );
}

