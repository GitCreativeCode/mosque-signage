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
    gradStart: '#1e3a8a',
    gradMid: '#172554',
    gradEnd: '#0f172a',
    borderAccent: '#3b82f6',
    headlineColor: '#ffffff',
    textColor: '#dbeafe',
    accentGlow: '#60a5fa',
    cssBackground: 'linear-gradient(135deg, #1e3a8a 0%, #172554 60%, #0f172a 100%)',
  },
  emerald: {
    id: 'emerald',
    name: 'Mosque Green',
    gradStart: '#14532d',
    gradMid: '#064e3b',
    gradEnd: '#022c22',
    borderAccent: '#10b981',
    headlineColor: '#ffffff',
    textColor: '#d1fae5',
    accentGlow: '#34d399',
    cssBackground: 'linear-gradient(135deg, #14532d 0%, #064e3b 60%, #022c22 100%)',
  },
  amethyst: {
    id: 'amethyst',
    name: 'Classic Teal',
    gradStart: '#155e75',
    gradMid: '#0e4a5c',
    gradEnd: '#083344',
    borderAccent: '#06b6d4',
    headlineColor: '#ffffff',
    textColor: '#cffafe',
    accentGlow: '#22d3ee',
    cssBackground: 'linear-gradient(135deg, #155e75 0%, #0e4a5c 60%, #083344 100%)',
  },
  amber: {
    id: 'amber',
    name: 'Warm Earth',
    gradStart: '#7c2d12',
    gradMid: '#5a200c',
    gradEnd: '#3c1407',
    borderAccent: '#f59e0b',
    headlineColor: '#ffffff',
    textColor: '#fef3c7',
    accentGlow: '#fbbf24',
    cssBackground: 'linear-gradient(135deg, #7c2d12 0%, #5a200c 60%, #3c1407 100%)',
  },
  ruby: {
    id: 'ruby',
    name: 'Deep Burgundy',
    gradStart: '#831843',
    gradMid: '#58102e',
    gradEnd: '#3b071e',
    borderAccent: '#f43f5e',
    headlineColor: '#ffffff',
    textColor: '#ffe4e6',
    accentGlow: '#fb7185',
    cssBackground: 'linear-gradient(135deg, #831843 0%, #58102e 60%, #3b071e 100%)',
  },
  slate: {
    id: 'slate',
    name: 'Dark Slate',
    gradStart: '#334155',
    gradMid: '#1e293b',
    gradEnd: '#0f172a',
    borderAccent: '#64748b',
    headlineColor: '#ffffff',
    textColor: '#e2e8f0',
    accentGlow: '#94a3b8',
    cssBackground: 'linear-gradient(135deg, #334155 0%, #1e293b 60%, #0f172a 100%)',
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
