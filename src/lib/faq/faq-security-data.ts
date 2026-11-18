import type { FaqItem } from './faq-types';
import { FAQ_REMOTE_ACCESS_ITEMS } from './faq-remote-access-data';

const BASE_SECURITY_ITEMS: readonly FaqItem[] = [
  {
    slug: 'admin-pin-and-emergency-recovery',
    categoryId: 'security',
    question: 'What is the default admin PIN and how do I reset it if locked out?',
    shortAnswer:
      'The initial default PIN is "1234". If locked out by the brute-force defense (5 failed attempts locks for 30s) or forgotten, run "npm run reset-auth" on the host machine to reset it immediately.',
    isAccordion: true,
    isFeatured: true,
    tags: ['pin', 'password', 'security', 'pbkdf2', 'reset', 'cli', 'lockout', 'recovery'],
    relatedSlugs: [
      'dual-mode-admin-authentication',
      'remote-tailscale-and-domain-access',
      'developer-kiosk-simulator',
      'backup-and-factory-reset',
    ],
    article: {
      title: 'Administrative Security, Brute-Force Defense & Emergency Recovery',
      lastUpdated: '2026-11-03',
      summary:
        'PBKDF2-SHA512 password derivation, session secret isolation, and terminal-based emergency recovery.',
      sections: [
        {
          heading: '1. Authentication Architecture',
          paragraphs: [
            'MosqueSignage secures administrative mutations using PBKDF2 with SHA-512 and 100,000 iterations. Admin sessions use signed HTTP-only cookies backed by a cryptographic secret stored in data/.session_secret.',
          ],
          image: {
            src: '/faq/security-pin-hierarchy.svg',
            alt: 'PBKDF2 Cryptography and Security Hierarchy',
            caption: 'Dual-tier rate-limiting defends against credential guessing, while terminal access provides unconditional recovery.',
            width: 960,
            height: 540,
          },
        },
        {
          heading: '2. Emergency Recovery via Terminal CLI',
          paragraphs: [
            'If an administrator forgets the PIN or an IP becomes locked out, the emergency CLI tool overrides the database directly from the host terminal:',
          ],
          steps: [
            'Open a terminal or PowerShell prompt on the host computer.',
            'Navigate to the project root directory.',
            'Execute: npm run reset-auth (or npm run reset-pin)',
            'Follow the prompt to type your new 4–8 digit PIN.',
            'Lockout counters are immediately reset and the new salted hash is written to SQLite.',
          ],
        },
      ],
    },
  },
  {
    slug: 'developer-kiosk-simulator',
    categoryId: 'security',
    question: 'How do I access the live kiosk simulator and timetable scrubber?',
    shortAnswer:
      'Unlock the developer toolbar using any of 4 secret methods: triple-tap the top clock, press F2 on a physical keyboard, append ?debug=true to the URL, or click "Simulator" in the Admin topbar.',
    isAccordion: true,
    isFeatured: false,
    tags: ['simulator', 'debug', 'f2', 'clock', 'time travel', 'scrubber', 'testing'],
    relatedSlugs: ['admin-pin-and-emergency-recovery', 'kiosk-dual-monitor-setup'],
    article: {
      title: 'Developer Kiosk Simulator & 24-Hour Time Travel Scrubber',
      lastUpdated: '2026-11-03',
      summary:
        'Testing timetable drawer choreography, Adhan alert pulses, and approaching Iqamah states without waiting for real wall-clock time.',
      sections: [
        {
          heading: '1. The 4 Secret Access Methods',
          paragraphs: [
            'To test how slides and prayer alerts look at Fajr, Dhuhr, or midnight without waiting hours:',
          ],
          steps: [
            'Triple-Tap Clock: Click or tap the top-left digital clock 3 times within 1.5 seconds on the display.',
            'Keyboard Shortcut: Press F2 on any attached keyboard.',
            'URL Parameter: Open http://localhost:3000/display?debug=true.',
            'Remote Admin Trigger: Click the Simulator button in the Admin Dashboard header.',
          ],
        },
      ],
    },
  },
  {
    slug: 'backup-and-factory-reset',
    categoryId: 'security',
    question: 'How do I backup the database and media assets or execute a factory reset?',
    shortAnswer:
      'Backup data/mosque_signage.db and public/uploads/. To reset everything to default, go to Admin > Venue Settings > Maintenance and complete the 4-step Factory Reset modal.',
    isAccordion: false,
    isFeatured: true,
    tags: ['backup', 'restore', 'factory reset', 'sqlite', 'maintenance', 'database'],
    relatedSlugs: ['admin-pin-and-emergency-recovery', 'annual-csv-timetable-import'],
    article: {
      title: 'Database Backups, Disaster Recovery & Factory Reset Protocol',
      lastUpdated: '2026-11-03',
      summary:
        'Managing local SQLite database snapshots and restoring factory defaults safely.',
      sections: [
        {
          heading: '1. Backup Routine',
          paragraphs: [
            'Because MosqueSignage is 100% local-first, routine backups simply require copying two filesystem directories: data/mosque_signage.db and public/uploads/. SQLite WAL mode permits hot backups while the server is actively running.',
          ],
        },
      ],
    },
  },
];

export const FAQ_SECURITY_ITEMS: readonly FaqItem[] = [
  ...BASE_SECURITY_ITEMS,
  ...FAQ_REMOTE_ACCESS_ITEMS,
];

