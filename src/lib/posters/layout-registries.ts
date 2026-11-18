/**
 * Frame Styles, Badges, Stickers & Canvas Background Registries
 * MosqueSignage (TV)
 */

import type {
  CanvasBackgroundPreset,
  IslamicStickerType,
  SlotFrameStyle,
} from '@/types/index';
import type { PureCssStyle } from './layout-background';
import { ARABESQUE_SVG, ISLAMIC_STAR_SVG, MASHRABIYA_SVG } from './layout-patterns';

export interface FrameStyleMeta {
  readonly id: SlotFrameStyle;
  readonly label: string;
  readonly description: string;
  readonly containerClasses: string;
  readonly innerClasses: string;
}

export const FRAME_STYLES_REGISTRY: Record<SlotFrameStyle, FrameStyleMeta> = {
  none: {
    id: 'none',
    label: 'Frameless',
    description: 'Direct edge-to-edge full bleed with zero padding or borders',
    containerClasses: 'p-0 bg-transparent',
    innerClasses: 'rounded-none border-0 shadow-none',
  },
  clean_border: {
    id: 'clean_border',
    label: 'Clean Border',
    description: 'Subtle high-contrast white border with rounded corners and soft shadow',
    containerClasses: 'p-2.5 bg-black/40',
    innerClasses: 'rounded-2xl border-2 border-white/20 shadow-2xl overflow-hidden',
  },
  islamic_matting: {
    id: 'islamic_matting',
    label: 'Islamic Matting',
    description: 'Deep Mosque Forest Green outer border with gold inner lining and sacred geometry matting',
    containerClasses: 'p-3.5 bg-green-950/90 border border-amber-500/40 shadow-[0_0_30px_rgba(20,83,45,0.4)]',
    innerClasses: 'rounded-xl border border-amber-400/60 shadow-inner overflow-hidden',
  },
  gold_emerald_trim: {
    id: 'gold_emerald_trim',
    label: 'Gold & Emerald Trim',
    description: 'Polished gold leaf outer frame with emerald ambient halo',
    containerClasses: 'p-3 bg-gradient-to-br from-amber-600/30 via-slate-900 to-green-950/60 border-2 border-amber-400/80 shadow-[0_0_35px_rgba(217,119,6,0.35)]',
    innerClasses: 'rounded-2xl border border-white/25 overflow-hidden shadow-2xl',
  },
  card_shadow: {
    id: 'card_shadow',
    label: 'Card Shadow',
    description: 'Modern glassmorphic floating card with deep diffuse drop shadow',
    containerClasses: 'p-3 bg-slate-950/70 backdrop-blur-md',
    innerClasses: 'rounded-3xl border border-white/15 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.85)] overflow-hidden',
  },
  polaroid: {
    id: 'polaroid',
    label: 'Polaroid Card',
    description: 'Crisp white frame with extended bottom margin for captions',
    containerClasses: 'p-3 pb-8 bg-white text-slate-900 shadow-2xl',
    innerClasses: 'rounded-lg border border-slate-200 overflow-hidden',
  },
  custom: {
    id: 'custom',
    label: 'Custom Frame',
    description: 'Imported mosque frame border or transparent ornate overlay',
    containerClasses: 'p-1 bg-transparent relative',
    innerClasses: 'rounded-none border-0 shadow-none overflow-hidden',
  },
};

export interface MosqueBadgePreset {
  readonly id: string;
  readonly label: string;
  readonly text: string;
  readonly variant: 'red' | 'gold' | 'emerald' | 'blue' | 'purple' | 'amber';
}

export const MOSQUE_BADGES_REGISTRY: readonly MosqueBadgePreset[] = [
  { id: 'tonight', label: 'Tonight', text: 'TONIGHT', variant: 'red' },
  { id: 'free_dinner', label: 'Free Dinner', text: 'FREE DINNER', variant: 'gold' },
  { id: 'registration_req', label: 'Registration Req', text: 'REGISTRATION REQUIRED', variant: 'blue' },
  { id: 'youth_program', label: 'Youth Program', text: 'YOUTH PROGRAM', variant: 'emerald' },
  { id: 'brothers_sisters', label: 'Brothers & Sisters', text: 'BROTHERS & SISTERS WELCOME', variant: 'purple' },
  { id: 'jummah_mubarak', label: 'Jummah Mubarak', text: 'JUMMAH MUBARAK', variant: 'gold' },
  { id: 'special_guest', label: 'Special Guest', text: 'SPECIAL GUEST SPEAKER', variant: 'amber' },
  { id: 'potluck', label: 'Community Potluck', text: 'COMMUNITY POTLUCK', variant: 'red' },
];

export interface CanvasBackgroundMeta {
  readonly id: CanvasBackgroundPreset;
  readonly label: string;
  readonly description: string;
  readonly previewStyle?: string;
  readonly previewBackground: PureCssStyle;
}

export const CANVAS_BACKGROUNDS_REGISTRY: readonly CanvasBackgroundMeta[] = [
  {
    id: 'black',
    label: 'Deep Black',
    description: 'Pitch black presentation background',
    previewBackground: { backgroundColor: '#000000' },
  },
  {
    id: 'dark_slate',
    label: 'Dark Slate',
    description: 'Subtle deep charcoal slate',
    previewBackground: { backgroundColor: '#0f172a' },
  },
  {
    id: 'mosque_green',
    label: 'Mosque Green',
    description: 'Reverent deep forest green',
    previewBackground: { backgroundColor: '#052e16' },
  },
  {
    id: 'blur_ambient',
    label: 'Blur Ambient',
    description: 'Dynamic ambient halo from primary media',
    previewBackground: {
      backgroundImage: 'radial-gradient(ellipse at center, #312e81 0%, #090d16 65%, #020617 100%)',
      backgroundColor: '#020617',
    },
  },
  {
    id: 'islamic_star',
    label: 'Islamic Star Tile',
    description: 'Traditional 8-point geometric star pattern',
    previewBackground: {
      backgroundImage: `url("${ISLAMIC_STAR_SVG}")`,
      backgroundRepeat: 'repeat',
      backgroundSize: '28px 28px',
      backgroundColor: '#040914',
    },
  },
  {
    id: 'arabesque',
    label: 'Arabesque Lattice',
    description: 'Ornate sacred floral arabesque lattice',
    previewBackground: {
      backgroundImage: `url("${ARABESQUE_SVG}")`,
      backgroundRepeat: 'repeat',
      backgroundSize: '24px 24px',
      backgroundColor: '#022c22',
    },
  },
  {
    id: 'mashrabiya',
    label: 'Mashrabiya Wood',
    description: 'Warm traditional carved wooden mashrabiya',
    previewBackground: {
      backgroundImage: `url("${MASHRABIYA_SVG}")`,
      backgroundRepeat: 'repeat',
      backgroundSize: '20px 20px',
      backgroundColor: '#140f0b',
    },
  },
  {
    id: 'emerald_gradient',
    label: 'Emerald Glow',
    description: 'Regal emerald & gold radial gradient',
    previewBackground: {
      backgroundImage: 'radial-gradient(ellipse at center, #059669 0%, #022c22 65%, #000000 100%)',
      backgroundColor: '#000000',
    },
  },
  {
    id: 'gold_gradient',
    label: 'Royal Gold',
    description: 'Polished gold ambient glow on midnight slate',
    previewBackground: {
      backgroundImage: 'radial-gradient(ellipse at center, #d97706 0%, #1e1b4b 60%, #020617 100%)',
      backgroundColor: '#020617',
    },
  },
];

export interface IslamicStickerPreset {
  readonly id: IslamicStickerType;
  readonly label: string;
  readonly description: string;
  readonly defaultWidth: number;
  readonly defaultHeight: number;
}

export const ISLAMIC_STICKERS_REGISTRY: readonly IslamicStickerPreset[] = [
  { id: 'fanous', label: 'Fanous Lantern', description: 'Traditional hanging Ramadan lantern with golden flame', defaultWidth: 16, defaultHeight: 25 },
  { id: 'crescent_moon', label: 'Crescent & Star', description: 'Sacred golden crescent moon and five-point star', defaultWidth: 18, defaultHeight: 22 },
  { id: 'mosque', label: 'Mosque & Minaret', description: 'Majestic dome and minaret architectural silhouette', defaultWidth: 22, defaultHeight: 22 },
  { id: 'islamic_star', label: '8-Point Star', description: 'Traditional Islamic Khatam geometric star', defaultWidth: 16, defaultHeight: 19 },
  { id: 'bismillah', label: 'Bismillah Calligraphy', description: 'Sacred Bismillah calligraphy in ornate medallion', defaultWidth: 24, defaultHeight: 16 },
  { id: 'kaaba', label: 'The Holy Kaaba', description: 'Kaaba cube with golden Kiswah band and door', defaultWidth: 18, defaultHeight: 22 },
  { id: 'tasbih', label: 'Tasbih Beads', description: 'Circular prayer beads with decorative tassel', defaultWidth: 18, defaultHeight: 20 },
];

