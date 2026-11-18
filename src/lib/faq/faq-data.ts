import type { FaqCategory, FaqItem } from './faq-types';
import { FAQ_HARDWARE_ITEMS } from './faq-hardware-data';
import { FAQ_PRAYER_ITEMS } from './faq-prayer-data';
import { FAQ_MEDIA_ITEMS } from './faq-media-data';
import { FAQ_SECURITY_ITEMS } from './faq-security-data';

export const FAQ_CATEGORIES: readonly FaqCategory[] = [
  {
    id: 'hardware',
    title: 'Hardware & Kiosk Deployment',
    badge: 'Hardware Guides',
    description:
      'Connecting Windows Mini PCs or Raspberry Pi devices to 1080p displays, setting up auto-start kiosk mode, and HDMI-CEC power sleep schedules.',
    iconName: 'Tv',
  },
  {
    id: 'prayer',
    title: 'Prayer Timetable & Astronomical Math',
    badge: 'Liturgical Engine',
    description:
      'Understanding solar calculations (ISNA, MWL, Umm Al-Qura), Hanafi Asr shadows, annual CSV timetable imports, and Friday Jummah multi-shift Khutbahs.',
    iconName: 'Calendar',
  },
  {
    id: 'media',
    title: 'Posters, Announcements & Media Guidelines',
    badge: 'Media Management',
    description:
      'Recommended 16:9 poster aspect ratios, safe zones avoiding corner cards, 60s video looping limits, and instant vector SVG notices.',
    iconName: 'Image',
  },
  {
    id: 'security',
    title: 'Security, PIN Gates & Maintenance',
    badge: 'Security & Access',
    description:
      'PBKDF2-SHA512 authentication, brute-force rate limit defense, emergency terminal PIN recovery, and developer simulator unlock methods.',
    iconName: 'Lock',
  },
];

export const FAQ_ITEMS: readonly FaqItem[] = [
  ...FAQ_HARDWARE_ITEMS,
  ...FAQ_PRAYER_ITEMS,
  ...FAQ_MEDIA_ITEMS,
  ...FAQ_SECURITY_ITEMS,
];

export function getFaqItemBySlug(slug: string): FaqItem | undefined {
  return FAQ_ITEMS.find((item) => item.slug === slug);
}

export function getRelatedFaqItems(item: FaqItem): readonly FaqItem[] {
  return item.relatedSlugs
    .map((slug) => getFaqItemBySlug(slug))
    .filter((it): it is FaqItem => it !== undefined);
}
