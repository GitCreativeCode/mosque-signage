import type { FaqItem } from './faq-types';
import { FAQ_REMOTE_ACCESS_ITEMS } from './faq-remote-access-data';

const BASE_SECURITY_ITEMS: readonly FaqItem[] = [
  {
    slug: 'admin-pin-and-emergency-recovery',
    categoryId: 'security',
    question: 'What are the default admin credentials and how do I reset them if locked out?',
    shortAnswer:
      'The initial default PIN is "1234". If locked out by the brute-force defense (5 failed attempts locks for 30s) or forgotten, run "npm run reset-auth" on the host machine. It automatically detects your mode to reset your PIN, update your password/username, or switch back to PIN mode.',
    isAccordion: true,
    isFeatured: true,
    tags: [
      'pin',
      'password',
      'username',
      'credentials',
      'security',
      'pbkdf2',
      'reset',
      'cli',
      'lockout',
      'recovery',
    ],
    relatedSlugs: [
      'dual-mode-admin-authentication',
      'remote-tailscale-and-domain-access',
      'developer-kiosk-simulator',
      'backup-and-factory-reset',
    ],
    article: {
      title: 'Administrative Credentials (PIN & Password), Rate Limiting & Emergency Recovery',
      lastUpdated: '2026-11-23',
      summary:
        'PBKDF2-SHA512 key derivation, brute-force IP rate limiting, and interactive terminal-based emergency recovery for both PIN and Username + Password modes.',
      sections: [
        {
          heading: '1. Dual-Mode Authentication Architecture (PIN vs Password)',
          paragraphs: [
            'MosqueSignage supports two administrative credential modes to balance lobby convenience with remote network hardening:',
            'PIN Mode (Default): A tactile 4–8 digit numeric PIN (initial default: "1234") engineered for lobby touchscreens and isolated local offices where rapid keypad entry is preferred.',
            'Password Mode: An enterprise credential mode requiring a unique username and a password of at least 8 characters (with uppercase, lowercase, number, and symbol rules). Recommended when managing the appliance over VPNs, reverse proxies, or public domains.',
            'Both modes use PBKDF2 with SHA-512 and 100,000 iterations with cryptographically random salts. Authenticated sessions use signed HTTP-only cookies backed by a private secret in data/.session_secret.',
          ],
          image: {
            src: '/faq/security-pin-hierarchy.svg',
            alt: 'PBKDF2 Cryptography, Dual-Mode Authentication and Emergency Recovery CLI',
            caption: 'Security architecture: Dual credential derivation, two-tier brute-force defense, and interactive terminal recovery.',
            width: 960,
            height: 540,
          },
        },
        {
          heading: '2. Emergency Recovery via Terminal CLI (npm run reset-auth)',
          paragraphs: [
            'If an administrator forgets their credentials or an IP triggers a brute-force lockout, the interactive emergency CLI tool provides immediate recovery directly on the host server without needing to restart the appliance:',
          ],
          steps: [
            'Open a terminal or PowerShell prompt on the host computer in the project directory.',
            'Run: npm run reset-auth (or npm run reset-pin).',
            'If currently in PIN Mode: The CLI prompts you to type a new 4–8 digit numeric PIN (or press Enter to restore default "1234").',
            'If currently in Password Mode: The CLI detects password mode and presents an interactive menu: (1) Change Admin Password, (2) Change both Username and Password, or (3) Switch back to PIN Mode.',
            'Lockout counters are immediately reset and the new salted hash is written to SQLite.',
          ],
          callout: {
            type: 'tip',
            text: 'For non-interactive scripting or Docker containers, pass the --yes flag: npm run reset-auth -- --yes --pin 1234 to reset immediately to a specified PIN.',
          },
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
        {
          heading: '2. Four-Step Factory Reset Protocol',
          paragraphs: [
            'If you need to return the appliance to factory defaults (e.g. at the start of a new liturgical year or venue handover):',
          ],
          steps: [
            'Navigate to Admin Dashboard > Venue Settings > Maintenance.',
            'Click "Factory Reset Appliance" to open the 4-step progressive modal.',
            'Step 1: Download an automatic CSV backup of your current prayer timetable schedule.',
            'Step 2: Type case-sensitive uppercase "CONFIRM" to acknowledge data reset.',
            'Step 3: Enter your current Admin PIN or Password to authorize the wipe.',
            'Step 4: The appliance cleanly resets settings to defaults and redirects to the Initial Venue Configuration wizard.',
          ],
        },
      ],
    },
  },
  {
    slug: 'appliance-software-updates',
    categoryId: 'security',
    question: 'How do I update MosqueSignage to the latest version?',
    shortAnswer:
      'Click "Check for Updates" in Admin > Settings > Appliance Updates for 1-click in-app upgrades. Alternatively, run update.bat on Windows, ./update.sh on Linux/Mac, or pull the latest Docker image. Database records are fully preserved.',
    isAccordion: true,
    isFeatured: true,
    tags: [
      'update',
      'upgrade',
      'version',
      'git',
      'docker',
      'maintenance',
      'releases',
      'changelog',
    ],
    relatedSlugs: [
      'backup-and-factory-reset',
      'admin-pin-and-emergency-recovery',
      'kiosk-dual-monitor-setup',
    ],
    article: {
      title: 'Appliance Software Updates, Release Channels & Maintenance',
      lastUpdated: '2026-11-23',
      summary:
        'Upgrading MosqueSignage safely via 1-click administrative controls, platform scripts, or Docker containers without data loss.',
      sections: [
        {
          heading: '1. One-Click Administrative Updates',
          paragraphs: [
            'MosqueSignage checks the public GitHub releases feed in the background. When a new version is published, an animated update badge illuminates in the application footer.',
          ],
          steps: [
            'Open Admin Dashboard > Venue Settings > Appliance Controls.',
            'Locate the "Appliance Updates" card and click "Check for Updates".',
            'Review the release highlights and click "Update Appliance Now".',
            'The server automatically pulls the release, installs any new dependencies, and safely restarts the service while preserving your database and uploaded posters.',
          ],
        },
        {
          heading: '2. Terminal Script Updates (Windows & Linux)',
          paragraphs: [
            'For headless servers or environments where terminal execution is preferred, dedicated update scripts automate git pull, dependency resolution, and build generation:',
          ],
          steps: [
            'Windows: Double-click update.bat in the project folder (or run it via PowerShell).',
            'Linux / Raspberry Pi OS / macOS: Run ./update.sh in the terminal.',
            'Docker Compose: Run docker compose pull && docker compose up -d --build.',
          ],
          callout: {
            type: 'note',
            text: 'All settings, prayer timetables, and flyer assets reside in data/ and public/uploads/, guaranteeing zero configuration loss during software upgrades.',
          },
        },
      ],
    },
  },
];

export const FAQ_SECURITY_ITEMS: readonly FaqItem[] = [
  ...BASE_SECURITY_ITEMS,
  ...FAQ_REMOTE_ACCESS_ITEMS,
];

