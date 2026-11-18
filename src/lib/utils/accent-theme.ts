/**
 * Pure Theme Tokens for MosqueSignage Display Sidebar & Accents
 * Standardized strictly to Emerald Teal.
 */

import type { SidebarAccentTheme } from '@/types/index';

export interface AccentThemeConfig {
  readonly id: SidebarAccentTheme;
  readonly name: string;
  readonly hex: string;
  readonly dotColor: string;
  readonly textAccent: string;
  readonly textLight: string;
  readonly bgSubtle: string;
  readonly borderSubtle: string;
  readonly borderActive: string;
  readonly shadowGlow: string;
  readonly barBg: string;
}

export const EMERALD_TEAL_THEME: AccentThemeConfig = {
  id: 'teal',
  name: 'Emerald Teal',
  hex: '#10b981',
  dotColor: '#10b981',
  textAccent: 'text-emerald-400',
  textLight: 'text-emerald-300',
  bgSubtle: 'bg-emerald-500/15',
  borderSubtle: 'border-emerald-500/30',
  borderActive: 'border-emerald-500/50',
  shadowGlow: 'shadow-emerald-950/50',
  barBg: 'bg-emerald-500',
};

export const SIDEBAR_ACCENT_THEMES: Record<SidebarAccentTheme, AccentThemeConfig> = {
  teal: EMERALD_TEAL_THEME,
  blue: EMERALD_TEAL_THEME,
  gold: EMERALD_TEAL_THEME,
  slate: EMERALD_TEAL_THEME,
};

/**
 * Returns the standardized Emerald Teal accent tokens.
 */
export function getAccentTheme(_themeId?: SidebarAccentTheme | string | null): AccentThemeConfig {
  return EMERALD_TEAL_THEME;
}
