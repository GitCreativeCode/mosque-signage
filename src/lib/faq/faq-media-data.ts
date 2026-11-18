import type { FaqItem } from './faq-types';

export const FAQ_MEDIA_ITEMS: readonly FaqItem[] = [
  {
    slug: 'poster-safe-zones-and-dimensions',
    categoryId: 'media',
    question: 'What are the recommended dimensions and safe zones for community posters?',
    shortAnswer:
      'Design flyers in 16:9 aspect ratio at 1920x1080 resolution. Keep critical text and dates out of the bottom-left corner (QR code popout) and bottom-right corner (mini prayer countdown pill).',
    isAccordion: true,
    isFeatured: true,
    tags: ['poster', 'dimensions', '16:9', '1080p', 'safe zone', 'qr code', 'media', 'flyer'],
    relatedSlugs: ['video-posters-and-looping', 'instant-svg-announcement-slides', 'multi-asset-poster-layouts', 'kiosk-dual-monitor-setup'],
    article: {
      title: '16:9 Broadcast Poster Dimensions & Safe Zone Guidelines',
      lastUpdated: '2026-11-03',
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
            caption: 'Safe Zone Grid: Keep critical titles centered; avoid the bottom-left QR card zone and bottom-right countdown pill.',
            width: 960,
            height: 540,
          },
        },
        {
          heading: '2. Avoiding Dynamic Corner Overlays',
          paragraphs: [
            'The signage kiosk features reactive broadcast widgets that pop out over active posters:',
          ],
          steps: [
            'Bottom-Left Zone: The glassmorphic QR code card expands here when a slide includes a website URL or donation link.',
            'Bottom-Right Zone: The floating mini prayer countdown pill is anchored here, showing the next liturgical event.',
            'Right Edge (30% width): When the periodic timetable drawer glides open, it occupies the right side of the screen.',
          ],
          callout: {
            type: 'tip',
            text: 'If your flyer was designed in vertical 9:16 portrait orientation (e.g. for WhatsApp or Instagram stories), MosqueSignage automatically applies a blurred letterbox background fill to preserve aesthetic proportion.',
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
      'Click "Create Notice" in Admin > Posters & Notices to generate broadcast-ready vector SVG notices with customizable titles, body paragraphs, and community color themes in under 30 seconds.',
    isAccordion: false,
    isFeatured: true,
    tags: ['notices', 'announcements', 'svg', 'generator', 'templates'],
    relatedSlugs: ['poster-safe-zones-and-dimensions', 'video-posters-and-looping', 'multi-asset-poster-layouts'],
    article: {
      title: 'Built-in Vector SVG Notice Generator',
      lastUpdated: '2026-11-03',
      summary:
        'Publishing urgent announcements, parking notices, and funeral details directly from your web browser.',
      sections: [
        {
          heading: '1. Instant Typography & Themes',
          paragraphs: [
            'Administrative volunteers do not need Adobe Photoshop or Canva to publish announcements. The built-in generator creates pure vector SVGs rendered at native 1080p resolution with guaranteed contrast and legible typography.',
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
      'Upload multiple files at once or click "+ Add Media / Split" in the poster editor. The Multi-Asset Layout Studio provides split grids with resizable dividers, curated Islamic frames, and notice cards.',
    isAccordion: true,
    isFeatured: true,
    tags: ['multi-asset', 'split screen', 'frames', 'layout', 'collage', 'video', 'posters', 'notices'],
    relatedSlugs: ['poster-safe-zones-and-dimensions', 'video-posters-and-looping', 'instant-svg-announcement-slides'],
    article: {
      title: 'Multi-Asset Layout Studio: Split Grids, Video Mixing & Frame Borders',
      lastUpdated: '2026-11-06',
      summary:
        'A comprehensive guide to composing multi-item slides with draggable splitters, curated frame presets, and collision-free QR codes.',
      sections: [
        {
          heading: '1. Adaptive Upload & Multi-File Drag-and-Drop',
          paragraphs: [
            'MosqueSignage automatically detects when you select multiple images or videos. Instead of creating separate consecutive slides, the system invites you into the Multi-Asset Layout Studio where you can arrange items together on a single 16:9 canvas.',
            'You can also start with a single flyer and click "+ Add Media / Split" to add more photos, video clips, or text notices to adjacent slots.',
          ],
        },
        {
          heading: '2. Smart Split Grids & Interactive Dividers',
          paragraphs: [
            'Choose from balanced layout archetypes including 50/50 side-by-side, top-and-bottom split, 1-Hero + 2-Stacked, and 2x2 grids. Click and drag the center divider handle to customize partition proportions (e.g., 60/40 or 70/30) with real-time TV preview feedback.',
          ],
          callout: {
            type: 'tip',
            text: 'Use keyboard shortcuts inside the studio: Tab or 1-9 to navigate slots, Arrow keys to nudge divider positions, Delete to remove an asset, and Ctrl+Z to undo.',
          },
        },
        {
          heading: '3. Curated Frames, Seamless Gaps & Dead Space Elimination',
          paragraphs: [
            'Each media slot can be customized individually with curated frame presets: Islamic Geometric Matting, Elegant Gold & Emerald Trim, Clean Border, or Soft Rounded Shadow Card. You can also customize the gap between slots (from 0px seamless to 16px spacious) and use the 1-click "Fill All Cells (Cover)" action to eliminate dead black letterbox bars across all slots instantly.',
          ],
        },
        {
          heading: '4. Freeform Text Banners, Eye Dropper & Typography Styling',
          paragraphs: [
            'Add customizable floating text banners across the canvas with crisp rectangular borders. You can drag and position text banners anywhere on the 16:9 canvas with your mouse, adjust rotation (-180° to +180°), and set width sizing (Fit to Text, Wide 75%, or Full Bleed).',
            'Full typography controls include font family (Modern Sans, Traditional Serif, Traditional Islamic, Monospace), text size, bold, italic, underline, text alignment, and curated color swatches with a built-in Eye Dropper tool to sample exact colors from your artwork.',
          ],
        },
        {
          heading: '5. Layers Reordering, Motion Videos, Notices & Live QR Preview',
          paragraphs: [
            'The Layers panel supports intuitive drag-and-drop reordering with a 3-dots action menu for quick layer manipulation (Rename, Move Up, Move Down, Duplicate, Delete). In addition, slots can be reordered directly on the 16:9 canvas preview by dragging and dropping them between positions.',
            'Each media slot can be customized with curated frame presets, and frame selection styling matches the layout tool for visual consistency.',
            'You can place motion videos alongside static flyers or liturgical notice cards with automated first-frame thumbnail extraction and seamless playback. The studio renders a live, true-to-life QR code preview card on the canvas at your chosen corner, with a convenient preview toggle (in the header, QR tab, or directly on the card) to temporarily hide it while editing content underneath without removing it from the saved poster.',
            'In the Admin Posters dashboard, multi-asset posters display miniature composite thumbnails rendering all slots, aspect ratios, and text banners exactly as seen on the prayer hall TV.',
          ],
        },
      ],
    },
  },
];

