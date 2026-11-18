/**
 * Canvas Background Styling Resolver
 * MosqueSignage (TV)
 */

import type { CanvasBackgroundPreset } from '@/types/index';
import { ARABESQUE_SVG, ISLAMIC_STAR_SVG, MASHRABIYA_SVG } from './layout-patterns';

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
  dark_slate: { className: 'bg-slate-900', style: { backgroundColor: '#0f172a' } },
  mosque_green: { className: 'bg-green-950', style: { backgroundColor: '#052e16' } },
  blur_ambient: {
    className: 'bg-slate-950',
    style: {
      backgroundImage:
        'radial-gradient(ellipse at center, rgba(49, 46, 129, 0.7) 0%, rgba(9, 13, 22, 0.95) 65%, #020617 100%)',
      backgroundColor: '#020617',
    },
  },
  islamic_star: {
    className: 'bg-slate-950',
    style: {
      backgroundImage: `url("${ISLAMIC_STAR_SVG}")`,
      backgroundRepeat: 'repeat',
      backgroundSize: '60px 60px',
      backgroundColor: '#040914',
    },
  },
  arabesque: {
    className: 'bg-emerald-950',
    style: {
      backgroundImage: `url("${ARABESQUE_SVG}")`,
      backgroundRepeat: 'repeat',
      backgroundSize: '48px 48px',
      backgroundColor: '#022c22',
    },
  },
  mashrabiya: {
    className: 'bg-stone-950',
    style: {
      backgroundImage: `url("${MASHRABIYA_SVG}")`,
      backgroundRepeat: 'repeat',
      backgroundSize: '40px 40px',
      backgroundColor: '#140f0b',
    },
  },
  emerald_gradient: {
    className: 'bg-emerald-950',
    style: {
      backgroundImage: 'radial-gradient(ellipse at center, #059669 0%, #022c22 65%, #000000 100%)',
      backgroundColor: '#000000',
    },
  },
  gold_gradient: {
    className: 'bg-slate-950',
    style: {
      backgroundImage:
        'radial-gradient(ellipse at center, rgba(217, 119, 6, 0.55) 0%, rgba(30, 27, 75, 0.9) 60%, #020617 100%)',
      backgroundColor: '#020617',
    },
  },
};

export function getCanvasBackgroundProps(
  bg?: CanvasBackgroundPreset,
  custom?: string
): { className: string; style: React.CSSProperties } {
  if (bg === 'custom') {
    return {
      className: 'bg-black',
      style: custom ? { backgroundColor: custom } : { backgroundColor: '#000000' },
    };
  }
  if (!bg) return PRESET_STYLES.black;
  return PRESET_STYLES[bg] ?? PRESET_STYLES.black;
}

