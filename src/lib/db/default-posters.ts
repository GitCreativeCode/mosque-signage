/**
 * Production-ready default raster poster constants and metadata for initial onboarding.
 * Broadcast-grade 1920x1080 (16:9) raster images adhering to ui_principles.md and ux_principles.md.
 */

export const DEFAULT_POSTERS_CONFIG = {
  welcome: {
    id: 'poster-1',
    title: 'Welcome to the Community Center',
    image_path: '/uploads/Mosque_Signage_Welcome.webp',
    fileName: 'Mosque_Signage_Welcome.webp',
    qr_url: null,
    qr_label: null,
    qr_position: 'bottom-left' as const,
    duration_seconds: 15,
  },
  event: {
    id: 'poster-2',
    title: 'Holy Month of Ramadan',
    image_path: '/uploads/Mosque_Signage_Ramadan.webp',
    fileName: 'Mosque_Signage_Ramadan.webp',
    qr_url: null,
    qr_label: null,
    qr_position: 'bottom-left' as const,
    duration_seconds: 20,
  },
} as const;
