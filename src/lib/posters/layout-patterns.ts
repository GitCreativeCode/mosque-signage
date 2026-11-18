/**
 * Sacred Islamic Geometric SVG Pattern Data URIs
 * MosqueSignage (TV)
 */

export const ISLAMIC_STAR_SVG = `data:image/svg+xml,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60">
  <rect width="60" height="60" fill="#040914"/>
  <radialGradient id="starGlow" cx="50%" cy="50%" r="50%">
    <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.3"/>
    <stop offset="100%" stop-color="#f59e0b" stop-opacity="0"/>
  </radialGradient>
  <circle cx="30" cy="30" r="26" fill="url(#starGlow)"/>
  <g transform="translate(30, 30)" stroke="#f59e0b" stroke-width="1.3" fill="none">
    <polygon points="-11,-11 11,-11 11,11 -11,11" stroke-opacity="0.8" fill="#f59e0b" fill-opacity="0.12"/>
    <polygon points="0,-15.5 15.5,0 0,15.5 -15.5,0" stroke-opacity="0.8" fill="#f59e0b" fill-opacity="0.12"/>
    <circle cx="0" cy="0" r="3.5" fill="#10b981" fill-opacity="0.85" stroke="#fbbf24" stroke-width="1"/>
  </g>
  <circle cx="0" cy="0" r="3" fill="none" stroke="#10b981" stroke-width="1" stroke-opacity="0.6"/>
  <circle cx="60" cy="0" r="3" fill="none" stroke="#10b981" stroke-width="1" stroke-opacity="0.6"/>
  <circle cx="0" cy="60" r="3" fill="none" stroke="#10b981" stroke-width="1" stroke-opacity="0.6"/>
  <circle cx="60" cy="60" r="3" fill="none" stroke="#10b981" stroke-width="1" stroke-opacity="0.6"/>
</svg>
`)}`;

export const MASHRABIYA_SVG = `data:image/svg+xml,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
  <rect width="40" height="40" fill="#140f0b"/>
  <path d="M0 20 L20 0 L40 20 L20 40 Z" fill="none" stroke="#d97706" stroke-width="1.2" stroke-opacity="0.5"/>
  <path d="M10 20 L20 10 L30 20 L20 30 Z" fill="#b45309" fill-opacity="0.18" stroke="#f59e0b" stroke-width="0.8" stroke-opacity="0.4"/>
  <circle cx="20" cy="20" r="2" fill="#f59e0b" fill-opacity="0.7"/>
</svg>
`)}`;

export const ARABESQUE_SVG = `data:image/svg+xml,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
  <rect width="48" height="48" fill="#022c22"/>
  <circle cx="24" cy="24" r="16" fill="none" stroke="#10b981" stroke-width="1" stroke-opacity="0.4"/>
  <path d="M24 8 C30 16 38 18 38 24 C38 30 30 32 24 40 C18 32 10 30 10 24 C10 18 18 16 24 8 Z" fill="#059669" fill-opacity="0.14" stroke="#f59e0b" stroke-width="1" stroke-opacity="0.5"/>
  <circle cx="24" cy="24" r="2.5" fill="#f59e0b" fill-opacity="0.8"/>
</svg>
`)}`;

