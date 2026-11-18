'use client';

import React, { useState, useEffect } from 'react';
import type { DisplayResolution } from '@/types/index';
import {
  calculateViewportScale,
  DISPLAY_BASE_HEIGHT,
  DISPLAY_BASE_WIDTH,
} from '@/lib/engine/viewport-scale';
export interface DisplayViewportProps {
  readonly children: React.ReactNode;
  readonly resolution?: DisplayResolution | undefined;
  readonly overscanMarginPercent?: number | undefined;
}

const BASE_WIDTH = DISPLAY_BASE_WIDTH;
const BASE_HEIGHT = DISPLAY_BASE_HEIGHT;

/**
 * Adaptive Kiosk Viewport Container
 * Standardizes on universal 16:9 1080p base coordinate plane (1920x1080).
 * Autonomously scales via GPU transform matrix to center-fit any screen or TV (720p, 1080p, 1440p, 4K, 8K)
 * with zero layout reflows and optional overscan safe-zone compensation.
 */
export function DisplayViewport({
  children,
  resolution = '1080p',
  overscanMarginPercent = 0,
}: DisplayViewportProps) {
  const [scale, setScale] = useState<number>(1);
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);

    const updateScale = () => {
      setScale(
        calculateViewportScale(
          window.innerWidth,
          window.innerHeight,
          overscanMarginPercent ?? 0
        )
      );
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [overscanMarginPercent, resolution]);

  return (
    <div
      data-testid="kiosk-viewport-container"
      className="relative w-screen h-screen overflow-hidden bg-black flex items-center justify-center select-none cursor-none"
    >
      <div
        data-testid="kiosk-viewport-stage"
        className="relative bg-neutral-950 overflow-hidden shadow-2xl flex flex-col"
        style={{
          width: `${BASE_WIDTH}px`,
          height: `${BASE_HEIGHT}px`,
          minWidth: `${BASE_WIDTH}px`,
          minHeight: `${BASE_HEIGHT}px`,
          maxWidth: `${BASE_WIDTH}px`,
          maxHeight: `${BASE_HEIGHT}px`,
          transform: mounted ? `scale(${scale})` : 'scale(1)',
          transformOrigin: 'center center',
          transition: 'transform 0.15s ease-out',
        }}
      >
        {children}
      </div>
    </div>
  );
}
