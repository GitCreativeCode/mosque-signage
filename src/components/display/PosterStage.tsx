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
  readonly children?: React.ReactNode | undefined;
}

export function PosterStage({
  currentPoster,
  previousPoster,
  isCrossFading,
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
  children,
}: PosterStageProps) {
  const activeSec = slideDuration ?? currentPoster?.duration_seconds ?? 15;
  const theme = getAccentTheme(sidebarAccentTheme);
  const isPermanentSplit = sidebarMode === 'always_open';
  const shouldShift = isPermanentSplit || isDrawerOpen;
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
      {previousPoster && isCrossFading && (
        <SlideLayer
          key={`out-${previousPoster.id}`}
          poster={previousPoster}
          role="outgoing"
          transition={transition}
          fitMode={fitMode}
          mosqueName={mosqueName}
          isDrawerOpen={isDrawerOpen}
          slideIndex={slideIndex}
        />
      )}

      <SlideLayer
        key={`in-${currentPoster?.id ?? 'empty'}`}
        poster={currentPoster}
        role={isCrossFading ? 'incoming' : 'static'}
        transition={transition}
        fitMode={fitMode}
        mosqueName={mosqueName}
        isDrawerOpen={isDrawerOpen}
        slideIndex={slideIndex}
      />

      {children}

      <style>{`
        @keyframes smoothDwellSlide {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
      `}</style>
      {currentPoster && showProgressBar && !isSingleStatic && (
        <div className="absolute bottom-0 inset-x-0 h-[4px] bg-white/10 z-20 overflow-hidden pointer-events-none">
          <div
            key={`dwell-bar-${currentPoster.id}-${slideIndex}`}
            className={`h-full w-full ${theme.barBg} origin-left`}
            style={{ animation: `smoothDwellSlide ${activeSec}s linear forwards`, willChange: 'transform' }}
          />
        </div>
      )}
    </main>
  );
}
