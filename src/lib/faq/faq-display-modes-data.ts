import type { FaqItem } from './faq-types';

export const FAQ_DISPLAY_MODES_ITEMS: readonly FaqItem[] = [
  {
    slug: 'screen-layouts-and-tv-overscan',
    categoryId: 'hardware',
    question: 'How do I customize the display layout (sliding drawer vs pinned split-screen vs poster only) and fix TV edge cutoff?',
    shortAnswer:
      'Choose from 3 screen archetypes in Admin > Venue Settings > Display Timings: Periodic Drawer, Always Pinned Split-Screen, or Hidden (Poster Only). If television bezels crop the clock or ticker edges, apply a 2% or 4% TV Overscan Safe Margin.',
    isAccordion: true,
    isFeatured: true,
    tags: [
      'layout',
      'screen',
      'overscan',
      'drawer',
      'sidebar',
      'split screen',
      'hidden',
      'tv calibration',
      'margins',
      '1080p',
    ],
    relatedSlugs: [
      'kiosk-dual-monitor-setup',
      'poster-safe-zones-and-dimensions',
      'pwa-smart-tv-and-kiosk-mode',
    ],
    article: {
      title: 'Screen Layout Archetypes, TV Overscan Calibration & GPU Auto-Scaling',
      lastUpdated: '2026-11-23',
      summary:
        'Configuring kiosk layout modes (periodic sliding drawer, permanent sidebar, poster only), overscan bezel padding, and resolution auto-scaling.',
      sections: [
        {
          heading: '1. The Three Screen Presentation Archetypes',
          paragraphs: [
            'MosqueSignage accommodates diverse venue aesthetics through three selectable layout archetypes configured in Admin > Venue Settings > Display Timings:',
            'Periodic Drawer (Recommended): Displays posters full-width with a dynamic sliding timetable drawer that glides in for 20 seconds at your chosen cadence (e.g. every 2 minutes). When opening, a smooth 500ms stage squeeze shifts poster artwork aside.',
            'Always Pinned Split-Screen: Permanently reserves a 460px sidebar (dockable to either the Left or Right edge) showing prayer times and countdowns alongside the poster carousel.',
            'Hidden (Poster Only): Disables the timetable drawer and sidebar completely, broadcasting full-bleed 1080p flyers without interruption.',
          ],
        },
        {
          heading: '2. TV Overscan Safe-Zone Calibration',
          paragraphs: [
            'Many commercial and consumer televisions apply hardware overscan by default, cropping the outer 2% to 5% of HDMI input signals and cutting off the top clock, marquee ticker, or bottom progress bar.',
            'Instead of struggling with confusing TV remote menus, navigate to Admin > Settings > Display Calibration and select your overscan compensation:',
          ],
          steps: [
            '0% Full Bleed: Standard for modern computer monitors, PC displays, and low-overscan TVs.',
            '2% Safe Margin (Recommended for TVs): Insets the entire kiosk viewport by 2% on all four sides, protecting clocks and badges from standard TV bezel cropping.',
            '4% Deep Margin: High-padding safety mode designed for older legacy plasma and CRT projection screens.',
          ],
        },
        {
          heading: '3. Universal 1080p GPU Auto-Scaling Matrix',
          paragraphs: [
            'The display engine is anchored to a fixed 1920x1080 design coordinate plane. An integrated hardware-accelerated GPU transform matrix automatically calculates uniform scale factors across any screen resolution: 720p, 1080p, 1440p, 4K UHD, or 8K, with zero layout shift (CLS = 0) and zero font distortion.',
          ],
        },
      ],
    },
  },
  {
    slug: 'pwa-smart-tv-and-kiosk-mode',
    categoryId: 'hardware',
    question: 'How do I install MosqueSignage as a standalone PWA on Smart TVs, Android TVs, or tablets?',
    shortAnswer:
      'Open /display in Chrome, Edge, or Android TV browser and click "Install MosqueSignage" or use Admin > Display Tools > Install Kiosk App. The PWA operates in standalone fullscreen mode without URL bars and includes offline caching.',
    isAccordion: true,
    isFeatured: false,
    tags: [
      'pwa',
      'smart tv',
      'android tv',
      'kiosk',
      'offline',
      'wake lock',
      'service worker',
      'tablet',
      'app',
    ],
    relatedSlugs: [
      'kiosk-dual-monitor-setup',
      'screen-layouts-and-tv-overscan',
      'screen-burn-in-sleep-timers',
    ],
    article: {
      title: 'Progressive Web App (PWA) Standalone Kiosk Installation',
      lastUpdated: '2026-11-23',
      summary:
        'Installing MosqueSignage as an autonomous native-like web application on Smart TVs, Android TV boxes, and touchscreens.',
      sections: [
        {
          heading: '1. W3C Standalone Kiosk Standard',
          paragraphs: [
            'MosqueSignage incorporates a fully compliant W3C Web App Manifest and Service Worker. Installing the application as a PWA removes the browser address bar, navigation buttons, and OS window frames, turning any browser-capable device into a dedicated signage appliance.',
          ],
        },
        {
          heading: '2. Installing on Smart TVs & Remote Browsers',
          paragraphs: [
            'Follow these simple steps on your target television or display hardware:',
          ],
          steps: [
            'Open the television web browser and navigate to http://[host-ip]:3000/display.',
            'Click the Install icon in the browser URL bar (or open Admin > Display Tools > Install Kiosk App).',
            'Click "Install" to create a desktop or home screen launcher.',
            'Launch the installed "MosqueSignage" app. It boots instantly into borderless, distraction-free landscape kiosk mode.',
          ],
        },
        {
          heading: '3. Offline Resilience & 24/7 Screen Wake Lock',
          paragraphs: [
            'The bundled background Service Worker (Stale-While-Revalidate) pre-caches the signage shell, vector icons, and active flyer assets. If the host PC reboots or Wi-Fi drops, the TV continues cycling cached slides and computing prayer times offline uninterrupted.',
            'Additionally, the integrated Screen Wake Lock API prevents TVs, tablets, and mini-PCs from entering sleep mode or triggering system screen savers during playback.',
          ],
        },
      ],
    },
  },
];
