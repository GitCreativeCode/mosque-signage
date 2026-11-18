/**
 * Curated Liturgical Color Themes for Broadcast Notice Slides
 * Designed specifically for Mosque Signage to avoid generic AI-generated aesthetics.
 */

import type { NoticeTheme } from '@/types/index';

export interface LiturgicalThemeConfig {
  readonly id: NoticeTheme;
  readonly name: string;
  readonly gradStart: string;
  readonly gradMid: string;
  readonly gradEnd: string;
  readonly borderAccent: string;
  readonly headlineColor: string;
  readonly textColor: string;
  readonly accentGlow: string;
  readonly cssBackground: string;
}

export const LITURGICAL_THEMES: Record<NoticeTheme, LiturgicalThemeConfig> = {
  sapphire: {
    id: 'sapphire',
    name: 'Midnight Navy',
    gradStart: '#14233c',
    gradMid: '#0f1a2e',
    gradEnd: '#0a111e',
    borderAccent: '#3b5a82',
    headlineColor: '#ffffff',
    textColor: '#d8e2ed',
    accentGlow: '#5b8ec7',
    cssBackground: 'linear-gradient(135deg, #14233c 0%, #0f1a2e 60%, #0a111e 100%)',
  },
  emerald: {
    id: 'emerald',
    name: 'Mosque Green',
    gradStart: '#133826',
    gradMid: '#0d281a',
    gradEnd: '#081a10',
    borderAccent: '#2f6b47',
    headlineColor: '#ffffff',
    textColor: '#d2ebd9',
    accentGlow: '#48a66d',
    cssBackground: 'linear-gradient(135deg, #133826 0%, #0d281a 60%, #081a10 100%)',
  },
  amethyst: {
    id: 'amethyst',
    name: 'Classic Teal',
    gradStart: '#13363f',
    gradMid: '#0c262d',
    gradEnd: '#07191e',
    borderAccent: '#276775',
    headlineColor: '#ffffff',
    textColor: '#d1ebf0',
    accentGlow: '#3aa2b5',
    cssBackground: 'linear-gradient(135deg, #13363f 0%, #0c262d 60%, #07191e 100%)',
  },
  amber: {
    id: 'amber',
    name: 'Warm Earth',
    gradStart: '#36241a',
    gradMid: '#261811',
    gradEnd: '#170e0a',
    borderAccent: '#6b4632',
    headlineColor: '#ffffff',
    textColor: '#ebdcd2',
    accentGlow: '#b87754',
    cssBackground: 'linear-gradient(135deg, #36241a 0%, #261811 60%, #170e0a 100%)',
  },
  ruby: {
    id: 'ruby',
    name: 'Deep Burgundy',
    gradStart: '#38141d',
    gradMid: '#260d13',
    gradEnd: '#17070b',
    borderAccent: '#6e2a39',
    headlineColor: '#ffffff',
    textColor: '#ebd2d8',
    accentGlow: '#b54d63',
    cssBackground: 'linear-gradient(135deg, #38141d 0%, #260d13 60%, #17070b 100%)',
  },
  slate: {
    id: 'slate',
    name: 'Dark Slate',
    gradStart: '#232731',
    gradMid: '#181b22',
    gradEnd: '#101217',
    borderAccent: '#444b5c',
    headlineColor: '#ffffff',
    textColor: '#dbe0ea',
    accentGlow: '#737e96',
    cssBackground: 'linear-gradient(135deg, #232731 0%, #181b22 60%, #101217 100%)',
  },
};

export const NOTICE_THEMES = LITURGICAL_THEMES;
export const LITURGICAL_THEME_LIST: readonly LiturgicalThemeConfig[] = Object.values(LITURGICAL_THEMES);

export function getLiturgicalTheme(themeId?: string | null): LiturgicalThemeConfig {
  if (themeId && themeId in LITURGICAL_THEMES) {
    return LITURGICAL_THEMES[themeId as NoticeTheme];
  }
  return LITURGICAL_THEMES.sapphire;
}
