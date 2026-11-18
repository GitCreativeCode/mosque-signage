import { describe, it, expect } from 'vitest';
import { getAccentTheme, SIDEBAR_ACCENT_THEMES } from '@/lib/utils/accent-theme';

describe('Sidebar Accent Theme Tokens & Defaults', () => {
  it('standardizes strictly to Emerald Teal theme across all inputs', () => {
    expect(getAccentTheme().id).toBe('teal');
    expect(getAccentTheme().name).toBe('Emerald Teal');
    expect(getAccentTheme().dotColor).toBe('#10b981');
    expect(getAccentTheme(null).id).toBe('teal');
    expect(getAccentTheme(undefined).id).toBe('teal');
    expect(getAccentTheme('unknown').id).toBe('teal');
    expect(getAccentTheme('teal').id).toBe('teal');
  });

  it('provides all expected color tokens for styling and breathing indicator', () => {
    for (const [_themeKey, config] of Object.entries(SIDEBAR_ACCENT_THEMES)) {
      expect(config.id).toBe('teal');
      expect(config.name).toBe('Emerald Teal');
      expect(config.hex).toMatch(/^#[0-9a-f]{6}$/i);
      expect(config.dotColor).toMatch(/^#[0-9a-f]{6}$/i);
      expect(config.textAccent).toBeTruthy();
      expect(config.textLight).toBeTruthy();
      expect(config.bgSubtle).toBeTruthy();
      expect(config.borderSubtle).toBeTruthy();
      expect(config.borderActive).toBeTruthy();
      expect(config.shadowGlow).toBeTruthy();
      expect(config.barBg).toBeTruthy();
    }
  });
});
