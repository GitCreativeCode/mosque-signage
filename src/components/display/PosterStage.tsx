'use client';

import React from 'react';
import type { Poster, PosterFitMode, PosterTransitionType, SidebarAccentTheme, SidebarMode, SidebarPosition } from '@/types/index';
import { getAccentTheme } from '@/lib/utils/accent-theme';
import { posterContainsVideo } from '@/lib/engine/choreography-helpers';
import { SlideLayer } from './SlideLayer';

export interface PosterStageProps {
  readonly currentPoster: Poster | null;
  readonly previousPoster: Poster | null;
  readonly isCrossFading: boolean;
  readonly progressPercentage: number;
  readonly isDrawerOpen: boolean;
  readonly sidebarMode?: SidebarMode | undefined;
  readonly sidebarPosition?: SidebarPosition | undefined;
  readonly transition?: PosterTransitionType | undefined;
  readonly fitMode?: PosterFitMode | undefined;
  readonly slideIndex?: number | undefined;
  readonly slideDuration?: number | undefined;
  readonly activePostersCount?: number | undefined;
  readonly mosqueName?: string | undefined;
  readonly sidebarAccentTheme?: SidebarAccentTheme | undefined;
  readonly showProgressBar?: boolean | undefined;
  readonly isSilenceActive?: boolean | undefined;
  readonly children?: React.ReactNode | undefined;
}

export function PosterStage({
  currentPoster,
  previousPoster,
  isCrossFading,
  progressPercentage,
  isDrawerOpen,
  sidebarMode = 'drawer',
  sidebarPosition = 'right',
  transition = 'fade',
  fitMode = 'cover',
  slideIndex = 0,
  slideDuration,
  activePostersCount,
  mosqueName,
  sidebarAccentTheme = 'teal',
  showProgressBar = true,
  isSilenceActive = false,
  children,
}: PosterStageProps) {
  const theme = getAccentTheme(sidebarAccentTheme);
  const isPermanentSplit = sidebarMode === 'always_open';
  const shouldShift = !isSilenceActive && (isPermanentSplit || isDrawerOpen);
  const isSingleStatic = (activePostersCount ?? 1) <= 1 && !posterContainsVideo(currentPoster);
  const marginClass = !shouldShift
    ? 'ml-0 mr-0'
    : sidebarPosition === 'left'
    ? 'ml-[460px] mr-0'
    : 'mr-[460px] ml-0';

  return (
    <main
      className={`relative flex-1 overflow-hidden bg-neutral-950 transition-all duration-500 ease-in-out ${marginClass}`}
    >
      {previousPoster && isCrossFading && !isSilenceActive && (
        <SlideLayer
          key={`out-${previousPoster.id}`}
          poster={previousPoster}
          role="outgoing"
          transition={transition}
          fitMode={fitMode}
          mosqueName={mosqueName}
          isDrawerOpen={isDrawerOpen}
          slideIndex={slideIndex}
          isPaused={isSilenceActive}
        />
      )}

      <SlideLayer
        key={`in-${currentPoster?.id ?? 'empty'}`}
        poster={currentPoster}
        role={isCrossFading && !isSilenceActive ? 'incoming' : 'static'}
        transition={transition}
        fitMode={fitMode}
        mosqueName={mosqueName}
        isDrawerOpen={isDrawerOpen}
        slideIndex={slideIndex}
        isPaused={isSilenceActive}
      />

      {children}

      {currentPoster && showProgressBar && !isSingleStatic && !isSilenceActive && (
        <div className="absolute bottom-0 inset-x-0 h-[4px] bg-white/10 z-20 overflow-hidden pointer-events-none">
          <div
            key={`dwell-bar-${currentPoster.id}-${slideIndex}`}
            className={`h-full ${theme.barBg} origin-left`}
            style={{
              width: `${Math.min(100, Math.max(0, progressPercentage))}%`,
              transition: isSilenceActive ? 'none' : 'width 1s linear',
              willChange: 'width',
            }}
          />
        </div>
      )}
    </main>
  );
}
