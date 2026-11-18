'use client';

import React, { useState } from 'react';
import { Loader2, CheckCircle2 } from 'lucide-react';

/**
 * Admin Kiosk Action Center & Remote Control Section
 * Provides direct broadcast actions: hard-refreshing kiosk browsers,
 * and triggering temporary 15-second drawer inspection tests.
 */
export function KioskActionCenterSection() {
  const [isReloading, setIsReloading] = useState(false);
  const [isTestingDrawer, setIsTestingDrawer] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleRemoteReload = async () => {
    setIsReloading(true);
    setStatusMessage(null);
    try {
      const { triggerKioskReload } = await import('@/lib/actions/hardware');
      await triggerKioskReload();
      setStatusMessage('Hard reload command sent! All connected kiosk screens are refreshing.');
      setTimeout(() => setStatusMessage(null), 5000);
    } catch (err) {
      console.error('Failed to trigger kiosk reload:', err);
      setStatusMessage('Failed to broadcast reload command.');
    } finally {
      setIsReloading(false);
    }
  };

  const handleTestDrawer = async () => {
    setIsTestingDrawer(true);
    setStatusMessage(null);
    try {
      const { triggerKioskTestDrawer } = await import('@/lib/actions/hardware');
      await triggerKioskTestDrawer(15);
      setStatusMessage('Test drawer preview triggered on all live kiosk screens for 15 seconds.');
      setTimeout(() => setStatusMessage(null), 5000);
    } catch (err) {
      console.error('Failed to trigger test drawer:', err);
      setStatusMessage('Failed to broadcast test drawer command.');
    } finally {
      setIsTestingDrawer(false);
    }
  };

  return (
    <div className="bg-[#20222a] border border-[#2e323b] rounded-xl p-6 md:p-8 shadow-sm space-y-5">
      <div className="pb-4 border-b border-[#2e323b] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-white tracking-tight">
            Screen Controls & Testing
          </h3>
          <p className="text-xs text-neutral-400 mt-1">
            Send commands directly to your connected TV display screens.
          </p>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3 rounded-lg bg-[#282a35] border border-[#388bfd]/40 text-[#58a6ff] text-xs flex items-center space-x-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-[#3fb950] shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Action 1: Hard Reload */}
        <div className="p-5 rounded-lg bg-[#15161b] border border-[#313542] flex flex-col justify-between space-y-4">
          <div>
            <div className="text-white font-semibold text-xs">
              Reload Display Screens
            </div>
            <p className="text-[11px] text-neutral-400 mt-1.5 leading-relaxed">
              Forces all active TV screens to refresh. Useful after software updates or visual troubleshooting.
            </p>
          </div>

          <button
            type="button"
            onClick={handleRemoteReload}
            disabled={isReloading}
            className="w-full py-2.5 px-4 rounded-lg bg-[#282a35] hover:bg-[#323642] active:scale-[0.98] cursor-pointer disabled:opacity-50 text-white font-semibold text-xs border border-[#353945] flex items-center justify-center space-x-2 transition-all duration-150 shadow-sm"
          >
            {isReloading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{isReloading ? 'Sending Reload...' : 'Reload Screens Now'}</span>
          </button>
        </div>

        {/* Action 2: Test Drawer Preview */}
        <div className="p-5 rounded-lg bg-[#15161b] border border-[#313542] flex flex-col justify-between space-y-4">
          <div>
            <div className="text-white font-semibold text-xs">
              Preview Prayer Drawer (15s)
            </div>
            <p className="text-[11px] text-neutral-400 mt-1.5 leading-relaxed">
              Opens the sliding prayer schedule drawer on all connected screens for 15 seconds to check how it looks.
            </p>
          </div>

          <button
            type="button"
            onClick={handleTestDrawer}
            disabled={isTestingDrawer}
            className="w-full py-2.5 px-4 rounded-lg bg-[#282a35] hover:bg-[#323642] active:scale-[0.98] cursor-pointer disabled:opacity-50 text-white font-semibold text-xs border border-[#353945] flex items-center justify-center space-x-2 transition-all duration-150 shadow-sm"
          >
            {isTestingDrawer && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{isTestingDrawer ? 'Opening Drawer...' : 'Preview Drawer Now'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
