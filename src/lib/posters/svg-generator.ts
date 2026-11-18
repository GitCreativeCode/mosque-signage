/**
 * Pure SVG Generation Engine for Mosque Notice Slides
 * Generates broadcast-grade 1920x1080 vector graphics with high legibility.
 */

import type { NoticeTheme } from '@/types/index';
import { getLiturgicalTheme, LITURGICAL_THEMES } from './notice-themes';

export interface GenerateNoticeSvgOptions {
  readonly headline: string;
  readonly description: string;
  readonly theme?: NoticeTheme | undefined;
}

export function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function unescapeXml(xml: string): string {
  return xml
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

/**
 * Generates a clean 1920x1080 16:9 SVG with embedded metadata comment.
 * Matches the interactive live display preview: no heavy border boxes,
 * balanced vertical typography, and consistent liturgical styling.
 */
export function generateNoticeSvg(options: GenerateNoticeSvgOptions): string {
  const theme = getLiturgicalTheme(options.theme);
  const selectedTheme = theme.id;
  const headlineEscaped = escapeXml(options.headline);
  const descEscaped = escapeXml(options.description);

  return `<?xml version="1.0" encoding="UTF-8"?>
<!-- NOTICE_META:{"theme":"${selectedTheme}"} -->
<svg width="1920" height="1080" viewBox="0 0 1920 1080" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${theme.gradStart}" stop-opacity="1"/>
      <stop offset="60%" stop-color="${theme.gradMid}" stop-opacity="1"/>
      <stop offset="100%" stop-color="${theme.gradEnd}" stop-opacity="1"/>
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#000000" flood-opacity="0.5"/>
    </filter>
  </defs>

  <!-- Background Canvas -->
  <rect width="1920" height="1080" fill="url(#bgGrad)"/>

  <!-- Content Group -->
  <g filter="url(#shadow)">
    <!-- Headline -->
    <text x="140" y="320" font-family="Inter, -apple-system, Roboto, sans-serif" font-size="76" font-weight="800" fill="${theme.headlineColor}" letter-spacing="-1">
      ${headlineEscaped}
    </text>

    <!-- Decorative Accent Bar -->
    <rect x="140" y="360" width="120" height="8" rx="4" fill="${theme.borderAccent}"/>

    <!-- Description (ForeignObject for automatic word wrapping) -->
    <foreignObject x="140" y="420" width="1640" height="520">
      <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: Inter, -apple-system, Roboto, sans-serif; font-size: 40px; line-height: 1.6; color: ${theme.textColor}; font-weight: 500;">
        <!-- NOTICE_DESC_START -->${descEscaped}<!-- NOTICE_DESC_END -->
      </div>
    </foreignObject>
  </g>
</svg>`;
}

/**
 * Extracts theme from SVG metadata comment or color heuristic.
 */
export function extractThemeFromSvg(svgContent: string): NoticeTheme {
  const metaMatch = svgContent.match(/<!--\s*NOTICE_META:(.*?)\s*-->/);
  if (metaMatch && metaMatch[1]) {
    try {
      const parsed = JSON.parse(metaMatch[1]);
      if (parsed.theme && parsed.theme in LITURGICAL_THEMES) {
        return parsed.theme as NoticeTheme;
      }
    } catch {
      // ignore
    }
  }

  // Fallback heuristic based on color gradient
  for (const [key, val] of Object.entries(LITURGICAL_THEMES)) {
    if (svgContent.includes(val.gradStart) || svgContent.includes(val.borderAccent)) {
      return key as NoticeTheme;
    }
  }

  return 'sapphire';
}

/**
 * Extracts description text from SVG foreignObject body.
 */
export function extractDescriptionFromSvg(svgContent: string): string {
  const tagMatch = svgContent.match(/<!--\s*NOTICE_DESC_START\s*-->([\s\S]*?)<!--\s*NOTICE_DESC_END\s*-->/);
  if (tagMatch && tagMatch[1]) {
    return unescapeXml(tagMatch[1]).trim();
  }

  const descMatch = svgContent.match(/<foreignObject[\s\S]*?<div[\s\S]*?>([\s\S]*?)<\/div>[\s\S]*?<\/foreignObject>/i);
  if (descMatch && descMatch[1]) {
    // Strip any HTML comments that might be captured
    const cleaned = descMatch[1].replace(/<!--[\s\S]*?-->/g, '').trim();
    return unescapeXml(cleaned).trim();
  }
  return '';
}
