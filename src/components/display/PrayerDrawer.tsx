'use client';

import React from 'react';
import type {
  PrayerTimesToday,
  JummahShift,
  DrawerType,
  SidebarMode,
  SidebarPosition,
  SidebarAccentTheme,
  MiniPillState,
  Poster,
} from '@/types/index';
import { Clock, Compass } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { DailyPrayerDrawerTable } from './DailyPrayerDrawerTable';
import { JummahDrawerShiftList } from './JummahDrawerShiftList';
import { format12h, formatRemainingTime } from './MiniPrayerPill';
import { getAccentTheme } from '@/lib/utils/accent-theme';

export interface PrayerDrawerProps {
  readonly isOpen: boolean;
  readonly drawerType: DrawerType;
  readonly prayers: PrayerTimesToday;
  readonly jummahShifts: readonly JummahShift[];
  readonly upcomingPrayerName?: string | undefined;
  readonly showAdhanTimes?: boolean | undefined;
  readonly sidebarMode?: SidebarMode | undefined;
  readonly sidebarPosition?: SidebarPosition | undefined;
  readonly sidebarAccentTheme?: SidebarAccentTheme | undefined;
  readonly pillState?: MiniPillState | null | undefined;
  readonly currentPoster?: Poster | null | undefined;
  readonly isQrVisible?: boolean | undefined;
  readonly isCoordinatesConfigured?: boolean | undefined;
}

/**
 * High-Contrast Prayer & Jummah Sidebar / Drawer
 * Width: 460px
 * Supports:
 * - Position docking: Left or Right
 * - Presentation mode: Periodic sliding drawer vs permanent always-open split screen
 * - Integrated Next Prayer Countdown badge in header (always visible when sidebar/drawer is open)
 * - Contextual QR code under prayer cards
 * - Automatic Friday multi-shift matrix
 */
export function PrayerDrawer({
  isOpen,
  drawerType,
  prayers,
  jummahShifts,
  upcomingPrayerName,
  showAdhanTimes = true,
  sidebarMode = 'drawer',
  sidebarPosition = 'right',
  sidebarAccentTheme = 'teal',
  pillState,
  currentPoster,
  isQrVisible = false,
  isCoordinatesConfigured = true,
}: PrayerDrawerProps) {
  const isJummah = drawerType === 'JUMMAH';
  const isLeft = sidebarPosition === 'left';
  const theme = getAccentTheme(sidebarAccentTheme);

  const positionClasses = isLeft
    ? `left-0 border-r border-white/15 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`
    : `right-0 border-l border-white/15 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`;

  return (
    <aside
      className={`absolute top-24 bottom-0 w-[460px] bg-neutral-950 z-40 px-6 py-4 flex flex-col justify-between shadow-2xl transition-transform duration-500 ease-out transform-gpu ${positionClasses}`}
    >
      <div className="flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="pb-3 border-b border-white/10 mb-3 shrink-0">
          <h2 className="text-2xl font-bold text-white tracking-tight">
            {isJummah ? "Today's Friday Jummah" : "Today's Prayer Schedule"}
          </h2>

          {/* Integrated Next Prayer telemetry: always visible whenever drawer/sidebar is shown */}
          {pillState && isCoordinatesConfigured && (
            <div className="mt-3">
              {pillState.status === 'STARTING_NOW' ? (
                <div className="flex items-center space-x-3 bg-white/[0.08] border border-white/20 px-4 py-3 rounded-2xl font-bold text-base text-white shadow-xl">
                  <span className="relative flex h-3 w-3 shrink-0 items-center justify-center">
                    <span
                      className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                      style={{ backgroundColor: theme.dotColor, animationDuration: '3s' }}
                    />
                    <span
                      className="relative inline-flex rounded-full h-3 w-3"
                      style={{ backgroundColor: theme.dotColor }}
                    />
                  </span>
                  <span className="truncate tracking-wide">{pillState.prayer_name} Prayer in Progress</span>
                </div>
              ) : (
                <div className="flex items-center justify-between bg-white/[0.07] border border-white/15 px-4 py-3 rounded-2xl text-base shadow-lg">
                  <div className="flex items-center space-x-2.5 text-neutral-200 min-w-0">
                    <Clock className={`w-5 h-5 ${theme.textAccent} shrink-0`} />
                    <span className="text-neutral-400 font-bold uppercase tracking-wider text-xs">Next:</span>
                    <span className={`${theme.textAccent} font-extrabold text-lg tracking-tight`}>
                      {pillState.prayer_name}
                    </span>
                    <span className="text-white font-bold text-base tabular-nums truncate">
                      ({format12h(pillState.time_display)})
                    </span>
                  </div>
                  <span className={`text-sm font-black ${theme.textLight} ${theme.bgSubtle} border ${theme.borderSubtle} px-3 py-1 rounded-xl tabular-nums shrink-0 ml-2 shadow-sm`}>
                    {formatRemainingTime(pillState.seconds_remaining, pillState.minutes_remaining)}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Content Body: Prayer Times / Shifts */}
        <div className="flex-1 overflow-y-auto">
          {isJummah ? (
            <JummahDrawerShiftList shifts={jummahShifts} accentTheme={sidebarAccentTheme} />
          ) : !isCoordinatesConfigured ? (
            <div className="h-full min-h-[280px] flex flex-col items-center justify-center p-6 text-center space-y-3">
              <Compass className="w-10 h-10 text-white/30" />
              <div className="text-sm font-bold text-white/90">Timetable Pending Configuration</div>
              <p className="text-xs text-white/60 leading-relaxed max-w-[280px]">
                Venue coordinates are not configured yet. Please configure coordinates in Admin Settings or upload an annual CSV timetable.
              </p>
            </div>
          ) : (
            <DailyPrayerDrawerTable
              prayers={prayers}
              upcomingPrayerName={upcomingPrayerName}
              isStartingNow={pillState?.status === 'STARTING_NOW'}
              showAdhanTimes={showAdhanTimes}
              accentTheme={sidebarAccentTheme}
            />
          )}
        </div>

        {/* Contextual QR Code Card under prayer schedule (Only in permanent always-open sidebar mode; in periodic mode, QR stays on the poster) */}
        {sidebarMode === 'always_open' && currentPoster?.qr_url && (
          <div
            className={`mt-2.5 pt-2.5 border-t border-white/10 shrink-0 transition-opacity duration-500 ease-out ${
              isQrVisible ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div className="bg-white/[0.04] border border-white/10 p-3 rounded-xl flex items-center space-x-3 backdrop-blur-md shadow-lg">
              <div className="bg-white p-1.5 rounded-lg shadow shrink-0 flex items-center justify-center">
                <QRCodeSVG
                  value={currentPoster.qr_url}
                  size={72}
                  level="M"
                  bgColor="#ffffff"
                  fgColor="#000000"
                />
              </div>
              <div className="flex flex-col justify-center space-y-0.5 overflow-hidden min-w-0">
                <span className={`text-[10px] font-bold ${theme.textAccent} uppercase tracking-wider`}>
                  Event / Notice
                </span>
                <h3 className="text-sm font-bold text-white leading-snug line-clamp-2 tracking-tight">
                  {currentPoster.qr_label ?? 'Scan for Details'}
                </h3>
                <p className="text-[11px] text-neutral-400 font-mono truncate">
                  {currentPoster.qr_url.replace(/^https?:\/\//, '')}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
