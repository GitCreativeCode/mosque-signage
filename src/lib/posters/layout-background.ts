/**
 * Canvas Background Styling Resolver
 * MosqueSignage (TV)
 */

import type { CanvasBackgroundPreset } from '@/types/index';

export interface PureCssStyle {
  readonly backgroundColor?: string;
  readonly backgroundImage?: string;
  readonly backgroundRepeat?: string;
  readonly backgroundSize?: string;
}

interface BackgroundStyleResult {
  readonly className: string;
  readonly style: PureCssStyle;
}

const PRESET_STYLES: Record<Exclude<CanvasBackgroundPreset, 'custom'>, BackgroundStyleResult> = {
  black: { className: 'bg-black', style: { backgroundColor: '#000000' } },
  dark_slate: {
    className: 'bg-slate-900',
    style: {
      backgroundImage: 'radial-gradient(circle at center, #334155 0%, #1e293b 65%, #090d16 100%)',
      backgroundColor: '#090d16',
    },
  },
  emerald_gradient: {
    className: 'bg-emerald-950',
    style: {
      backgroundImage: 'radial-gradient(circle at center, #059669 0%, #047857 60%, #064e3b 100%)',
      backgroundColor: '#064e3b',
    },
  },
  blur_ambient: {
    className: 'bg-blue-950',
    style: {
      backgroundImage: 'radial-gradient(circle at center, #2563eb 0%, #1d4ed8 60%, #0f172a 100%)',
      backgroundColor: '#0f172a',
    },
  },
  gold_gradient: {
    className: 'bg-amber-950',
    style: {
      backgroundImage: 'radial-gradient(circle at center, #f59e0b 0%, #d97706 60%, #78350f 100%)',
      backgroundColor: '#78350f',
    },
  },
  mosque_green: {
    className: 'bg-rose-950',
    style: {
      backgroundImage: 'radial-gradient(circle at center, #e11d48 0%, #be123c 60%, #4c0519 100%)',
      backgroundColor: '#4c0519',
    },
  },
  islamic_star: { className: 'bg-black', style: { backgroundColor: '#000000' } },
  arabesque: { className: 'bg-black', style: { backgroundColor: '#000000' } },
  mashrabiya: { className: 'bg-black', style: { backgroundColor: '#000000' } },
};

export function getCanvasBackgroundProps(
  bg?: CanvasBackgroundPreset,
  custom?: string,
): { className: string; style: React.CSSProperties } {
  if (bg === 'custom') {
    const val = custom || '#000000';
    const isGradient = val.includes('gradient');
    return {
      className: 'bg-black',
      style: isGradient ? { backgroundImage: val, backgroundSize: 'cover' } : { backgroundColor: val },
    };
  }
  if (!bg) return PRESET_STYLES.black;
  return PRESET_STYLES[bg] ?? PRESET_STYLES.black;
}
