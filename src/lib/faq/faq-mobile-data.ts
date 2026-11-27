import type { FaqItem } from './faq-types';

export const FAQ_MOBILE_ITEMS: readonly FaqItem[] = [
  {
    slug: 'mobile-admin-and-companion-display',
    categoryId: 'hardware',
    question: 'Can I manage MosqueSignage or view the live display from a smartphone or tablet?',
    shortAnswer:
      'Yes. Phones and vertical tablets automatically use a slide-out hamburger menu, stacked cards with zero horizontal scroll, and a readable Mobile Companion view on /display. Multi-Asset Layout Studio requires a tablet or computer.',
    isAccordion: true,
    isFeatured: false,
    tags: [
      'mobile',
      'phone',
      'smartphone',
      'tablet',
      'ipad',
      'responsive',
      'small screen',
      'hamburger',
      'companion view',
      'multi-asset',
    ],
    relatedSlugs: [
      'remote-tailscale-and-domain-access',
      'kiosk-dual-monitor-setup',
      'screen-layouts-and-tv-overscan',
    ],
    article: {
      title: 'Using MosqueSignage on Phones, Tablets & Multi-Size Screens',
      lastUpdated: '2026-11-26',
      summary:
        'How the Admin Dashboard and /display Kiosk adapt automatically across smartphones, vertical tablets, laptops, and 1080p/4K televisions.',
      sections: [
        {
          heading: '1. Mobile & Vertical Tablet Admin Controls (< 1024px)',
          paragraphs: [
            'When you open /admin on a phone or vertical tablet, the 3-zone desktop topbar collapses into a streamlined header with Mosque Signage on the left and a smoothly animated hamburger menu on the right.',
            'Inside the hamburger drawer, you can expand Prayer & Jummah, Settings, and Display Tools sub-menus, switch between System/Light/Dark themes, or lock the admin panel.',
            'Wide tables (such as Order Table, the 31-day Monthly Prayer Timetable, Friday Jummah shifts, and Eid schedules) automatically transform into touch-friendly stacked cards on phones with 44×44px tap targets and Up/Down reorder arrows.',
          ],
        },
        {
          heading: '2. Creating & Editing Content on Phones vs. Tablets/Computers',
          paragraphs: [
            'On a smartphone, administrators can upload flyer images or looping videos, create 16:9 liturgical Notice Slides, edit schedules and QR links, and reorder, archive, duplicate, or delete any slide.',
            'The Multi-Asset Layout Studio (used for split-screen layouts, freeform dragging, stickers, and layered text banners) is intentionally restricted to tablets and desktop/laptop computers where precision canvas editing works best.',
          ],
          callout: {
            type: 'note',
            text: 'If you tap Edit on an existing Multi-Asset composite slide from a phone, MosqueSignage displays a friendly reminder to open that slide on a tablet or computer—while still letting you reorder, archive, duplicate, or delete it on mobile.',
          },
        },
        {
          heading: '3. Mobile Companion View on /display',
          paragraphs: [
            'Opening /display on a smartphone automatically switches from the 1920×1080 TV canvas to a vertical Mobile Companion View showing the live clock, Hijri/Gregorian dates, scrolling ticker, active posters with clickable QR links, Congregation Silence status, and readable daily/Jummah/Eid prayer cards.',
            'Administrators who want to inspect the exact television layout from a phone can tap "16:9 TV Preview" in the top-right corner of the mobile display header and switch back anytime.',
          ],
        },
      ],
    },
  },
];
