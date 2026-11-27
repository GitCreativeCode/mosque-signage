'use client';

import { useState, useEffect } from 'react';
import { isSmallScreenViewport } from '@/lib/engine/viewport-scale';

export interface ViewportCapabilityState {
  readonly isMounted: boolean;
  readonly isSmallScreen: boolean;
  readonly width: number;
  readonly height: number;
}

/**
 * Tracks live viewport dimensions and classifies phone/small screens (< 768px or short phone landscape)
 * vs. tablets and desktop computers. SSR-safe (defaults to non-small until mounted).
 */
export function useIsSmallScreen(): ViewportCapabilityState {
  const [state, setState] = useState<ViewportCapabilityState>({
    isMounted: false,
    isSmallScreen: false,
    width: 1280,
    height: 800,
  });

  useEffect(() => {
    const update = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      setState({
        isMounted: true,
        isSmallScreen: isSmallScreenViewport(width, height),
        width,
        height,
      });
    };

    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return state;
}
