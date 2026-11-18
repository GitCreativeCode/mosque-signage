'use client';

import React from 'react';
import { RefreshCw, Sliders, Tv } from 'lucide-react';

export interface ApplianceDiagnosticsGridProps {
  readonly onQuickReloadTV?: (() => Promise<void>) | undefined;
  readonly onQuickTestDrawer?: (() => Promise<void>) | undefined;
  readonly onQuickToggleSimulator?: (() => Promise<void>) | undefined;
}

export function ApplianceDiagnosticsGrid({
  onQuickReloadTV,
  onQuickTestDrawer,
  onQuickToggleSimulator,
}: ApplianceDiagnosticsGridProps) {
  return (
    <div className="pt-4 border-t border-[var(--admin-border)] grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="p-4 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] space-y-2">
        <h4 className="text-xs font-bold text-[var(--admin-text-primary)]">Force Kiosk Reload</h4>
        <p className="text-[11px] text-[var(--admin-text-muted)]">
          Broadcasts instant refresh signal to all connected display screens.
        </p>
        <button
          type="button"
          onClick={onQuickReloadTV}
          className="w-full py-2 px-3 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card)] hover:bg-[var(--admin-surface)] text-xs font-medium text-[var(--admin-text-primary)] flex items-center justify-center space-x-1 transition shadow-sm active:scale-95 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Send Reload Signal</span>
        </button>
      </div>

      <div className="p-4 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] space-y-2">
        <h4 className="text-xs font-bold text-[var(--admin-text-primary)]">Test Slide Drawer</h4>
        <p className="text-[11px] text-[var(--admin-text-muted)]">
          Forces a 15-second temporary prayer timetable drawer preview on connected kiosks.
        </p>
        <button
          type="button"
          onClick={onQuickTestDrawer}
          className="w-full py-2 px-3 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card)] hover:bg-[var(--admin-surface)] text-xs font-medium text-[var(--admin-text-primary)] flex items-center justify-center space-x-1 transition shadow-sm active:scale-95 cursor-pointer"
        >
          <Tv className="w-3.5 h-3.5" />
          <span>Preview Drawer (15s)</span>
        </button>
      </div>

      <div className="p-4 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] space-y-2">
        <h4 className="text-xs font-bold text-[var(--admin-text-primary)]">Toggle Kiosk Simulator</h4>
        <p className="text-[11px] text-[var(--admin-text-muted)]">
          Remotely toggles the developer scrubber toolbar on live display screens.
        </p>
        <button
          type="button"
          onClick={onQuickToggleSimulator}
          className="w-full py-2 px-3 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card)] hover:bg-[var(--admin-surface)] text-xs font-medium text-[var(--admin-text-primary)] flex items-center justify-center space-x-1 transition shadow-sm active:scale-95 cursor-pointer"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Toggle Simulator</span>
        </button>
      </div>
    </div>
  );
}

