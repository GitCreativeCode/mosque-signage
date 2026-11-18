/**
 * Slide Transition Animation Class Lookup
 * MosqueSignage (TV)
 */

import type { PosterTransitionType } from '@/types/index';

const OUTGOING_ANIMATIONS: Record<PosterTransitionType, string> = {
  'slide-left': 'animate-poster-slide-out-left',
  'slide-right': 'animate-poster-slide-out-right',
  'slide-up': 'animate-poster-slide-out-up',
  zoom: 'animate-poster-zoom-out',
  fade: 'animate-poster-fade-out',
};

const INCOMING_ANIMATIONS: Record<PosterTransitionType, string> = {
  'slide-left': 'animate-poster-slide-in-right',
  'slide-right': 'animate-poster-slide-in-left',
  'slide-up': 'animate-poster-slide-in-up',
  zoom: 'animate-poster-zoom-in',
  fade: 'animate-poster-fade-in',
};

export function resolveSlideAnimationClass(
  role: 'incoming' | 'outgoing' | 'static',
  transition: PosterTransitionType
): { animClass: string; zIndexClass: string } {
  if (role === 'outgoing') {
    return { animClass: OUTGOING_ANIMATIONS[transition] ?? OUTGOING_ANIMATIONS.fade, zIndexClass: 'z-0' };
  }
  if (role === 'incoming') {
    return { animClass: INCOMING_ANIMATIONS[transition] ?? INCOMING_ANIMATIONS.fade, zIndexClass: 'z-10' };
  }
  return { animClass: 'opacity-100 transform-none', zIndexClass: 'z-10' };
}

