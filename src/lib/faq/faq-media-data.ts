import type { FaqItem } from './faq-types';
import { FAQ_SCHEDULING_ITEMS } from './faq-scheduling-data';

export const BASE_MEDIA_ITEMS: readonly FaqItem[] = [
  {
    slug: 'poster-safe-zones-and-dimensions',
    categoryId: 'media',
    question: 'What are the recommended dimensions and safe zones for community posters?',
    shortAnswer:
      'Design flyers in 16:9 aspect ratio at 1920x1080 resolution. Keep critical text centered and clear of dynamic corner widgets (the QR code card and configurable mini prayer countdown pill).',
    isAccordion: true,
    isFeatured: true,
    tags: ['poster', 'dimensions', '16:9', '1080p', 'safe zone', 'qr code', 'media', 'flyer'],
    relatedSlugs: ['video-posters-and-looping', 'instant-svg-announcement-slides', 'multi-asset-poster-layouts', 'kiosk-dual-monitor-setup'],
    article: {
      title: '16:9 Broadcast Poster Dimensions & Safe Zone Guidelines',
      lastUpdated: '2026-11-23',
      summary:
        'Graphic design standards to guarantee readability from 20+ feet and prevent text occlusion by dynamic UI cards.',
      sections: [
        {
          heading: '1. Recommended Aspect Ratio & Resolution',
          paragraphs: [
            'All MosqueSignage displays operate on a 1920 x 1080 (16:9) canvas. Uploading posters in native 1080p WebP or PNG format guarantees sharp, high-contrast typography across large commercial displays.',
          ],
          image: {
            src: '/faq/poster-safe-zones.svg',
            alt: '16:9 Poster Safe Zone and Collision Margins',
            caption: 'Safe Zone Grid: Keep critical titles centered; avoid the dynamic QR card zone and mini prayer pill.',
            width: 960,
            height: 540,
          },
        },
        {
          heading: '2. Avoiding Dynamic Corner Overlays & Stage Squeeze',
          paragraphs: [
            'The signage kiosk features reactive broadcast widgets that pop out over active posters:',
          ],
          steps: [
            'Dynamic QR Code Card: Glides out in the bottom-left corner (or custom corner) when a slide has a URL. If sharing a corner with the Mini Prayer Pill, it automatically offsets upward to avoid collision.',
            'Configurable Mini Prayer Pill: The countdown pill can be positioned in any of the 4 corners (bottom-right, bottom-left, top-right, top-left) or toggled off completely in Admin Settings.',
            'Timetable Drawer Squeeze: When the periodic prayer timetable drawer glides open (left or right), the display engine applies a 500ms stage margin squeeze so 100% of your flyer artwork remains fully visible.',
          ],
          callout: {
            type: 'tip',
            text: 'If your flyer was designed in vertical 9:16 portrait orientation, MosqueSignage automatically applies a blurred letterbox background fill to preserve aesthetic proportion.',
          },
        },
      ],
    },
  },
  {
    slug: 'video-posters-and-looping',
    categoryId: 'media',
    question: 'What video formats and durations are supported?',
    shortAnswer:
      'Upload MP4, WebM, MOV, or OGG videos up to 50MB and 60 seconds in duration. MosqueSignage calculates optimal looping (N = floor(60 / duration)) and cleans up GPU hardware decoders on unmount.',
    isAccordion: true,
    isFeatured: false,
    tags: ['video', 'mp4', 'webm', 'looping', 'gpu', 'media', 'duration'],
    relatedSlugs: ['poster-safe-zones-and-dimensions', 'instant-svg-announcement-slides', 'multi-asset-poster-layouts'],
    article: {
      title: 'Video Media Ingestion & Intelligent Looping Engine',
      lastUpdated: '2026-11-03',
      summary:
        'Performance guidelines for running motion posters on low-power Raspberry Pi and Intel Mini PCs without GPU starvation.',
      sections: [
        {
          heading: '1. Video Limits & Specifications',
          paragraphs: [
            'MosqueSignage enforces strict upload invariants to protect 24/7 reliability: maximum file size of 50MB, maximum clip length of 60 seconds, and audio tracks are automatically muted during display rotation.',
          ],
          callout: {
            type: 'warning',
            text: 'Videos with durations under 10 seconds suppress the dynamic QR code popout card because spectators require at least 10 seconds to align phone cameras for scannability.',
          },
        },
      ],
    },
  },
  {
    slug: 'instant-svg-announcement-slides',
    categoryId: 'media',
    question: 'How do I create instant text announcement notices without design software?',
    shortAnswer:
      'Click "+ Add Content" > "16:9 Notice Card" in Admin > Posters & Notices to generate broadcast-ready vector SVG notices with customizable titles, body paragraphs, and luminous jewel color themes in under 30 seconds.',
    isAccordion: false,
    isFeatured: true,
    tags: ['notices', 'announcements', 'svg', 'generator', 'templates'],
    relatedSlugs: ['poster-safe-zones-and-dimensions', 'video-posters-and-looping', 'multi-asset-poster-layouts'],
    article: {
      title: 'Built-in Vector SVG Notice Generator',
      lastUpdated: '2026-11-23',
      summary:
        'Publishing urgent announcements, parking notices, and funeral details directly from your web browser.',
      sections: [
        {
          heading: '1. Instant Typography & Jewel Themes',
          paragraphs: [
            'Administrative volunteers do not need third-party graphics software to publish announcements. The built-in generator creates pure vector SVGs rendered at native 1080p resolution with guaranteed contrast and legible typography across vibrant jewel themes (Sapphire, Emerald, Teal, Amber, Ruby, Slate).',
          ],
          steps: [
            'In Admin Dashboard, navigate to Posters & Notices.',
            'Hover over "+ Add Content" and select "16:9 Notice Card".',
            'Select an announcement category and choose your preferred color palette.',
            'Type your headline and announcement details with real-time TV preview feedback.',
            'Click "Save Notice" to immediately broadcast to the display carousel.',
          ],
        },
      ],
    },
  },
  {
    slug: 'multi-asset-poster-layouts',
    categoryId: 'media',
    question: 'How do I display multiple images, videos, or notices side-by-side on one poster?',
    shortAnswer:
      'Hover over "+ Add Content" > "Multi-Asset Studio" in Admin > Posters & Notices. The studio provides split grids, resizable dividers, in-place text editing, canvas right-click context menus, and atmospheric backgrounds.',
    isAccordion: true,
    isFeatured: true,
    tags: ['multi-asset', 'split screen', 'frames', 'layout', 'collage', 'video', 'posters', 'notices'],
    relatedSlugs: ['poster-safe-zones-and-dimensions', 'video-posters-and-looping', 'instant-svg-announcement-slides'],
    article: {
      title: 'Multi-Asset Layout Studio: Split Grids, Video Mixing & Frame Borders',
      lastUpdated: '2026-11-23',
      summary:
        'A comprehensive guide to composing multi-item slides with draggable splitters, curated frame presets, and collision-free QR codes.',
      sections: [
        {
          heading: '1. Accessing Multi-Asset Studio & Adaptive Upload',
          paragraphs: [
            'Open the studio by hovering over "+ Add Content" and selecting "Multi-Asset Studio", or by selecting multiple images/videos at once during upload.',
            'You can arrange media slots on a 16:9 canvas with balanced layout archetypes (50/50 split, top/bottom, 1-Hero + 2-Stacked, 2x2 grid, or freeform).',
          ],
        },
        {
          heading: '2. In-Place Text Editing, Context Menu & Creative Suite Controls',
          paragraphs: [
            'The studio functions as an in-browser creative suite designed specifically for digital signage:',
          ],
          steps: [
            'In-Place Text Editing: Double-click any text banner to edit directly on canvas with natural downward expansion.',
            'Text Sizing & Stretching: Type any font size (14–240 px) in the Text inspector or drag corner handles on the live preview to scale font size proportionally; drag side, top, or bottom edges (or enter W/H % with 1-click Reset) to stretch text horizontally or vertically (25%–400%) with flush edge-to-edge outlines in Fitted per Row mode.',
            'Right-Click Context Menu: Right-click any element to Bring to Front, Send to Back, Lock/Unlock (Ctrl+L), Duplicate (Ctrl+D), or Delete (Del).',
            'Canvas Marquee Selection: Click and drag across the canvas to select multiple layers at once.',
            'Atmospheric Backgrounds: Choose from 6 luminous presets (Deep Black, Midnight Slate, Sacred Emerald, Royal Sapphire, Imperial Amber, Masjid Forest).',
            'Sacred Stickers: Add floating vector calligraphy (Bismillah, Ayat, Jummah Mubarak) with zero clipping.',
          ],
          callout: {
            type: 'tip',
            text: 'Use the visual History Flyout panel in the studio header to jump to any prior edit or undo/redo mistakes with Ctrl+Z / Ctrl+Y.',
          },
        },
      ],
    },
  },
];

export const FAQ_MEDIA_ITEMS: readonly FaqItem[] = [
  ...BASE_MEDIA_ITEMS,
  ...FAQ_SCHEDULING_ITEMS,
];


