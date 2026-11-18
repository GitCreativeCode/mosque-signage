/**
 * Bundled MosqueSignage Release Changelog Registry
 * MosqueSignage (TV)
 */

export interface ReleaseSection {
  readonly title: string;
  readonly items: readonly string[];
}

export interface ReleaseLogItem {
  readonly version: string;
  readonly date: string;
  readonly title: string;
  readonly summary?: string | undefined;
  readonly highlights: readonly string[];
  readonly sections?: readonly ReleaseSection[] | undefined;
  readonly features?: readonly string[] | undefined;
  readonly improvements?: readonly string[] | undefined;
  readonly fixes?: readonly string[] | undefined;
  readonly category: 'major' | 'minor' | 'patch';
  readonly isCurrent?: boolean;
}

export const OFFICIAL_RELEASE_HISTORY: readonly ReleaseLogItem[] = [
  {
    version: '0.1.0',
    date: 'November 16, 2026',
    title: 'v0.1.0 - Official Public Beta Release',
    summary:
      'The initial public beta release of MosqueSignage - a 100% local-first, zero-subscription digital signage appliance engineered for mosques, Islamic schools, community centers, and public venues. Designed for unattended 24/7 autonomous display on prayer hall televisions or general venue screens, with local astronomical calculations, in-browser poster creation, TV hardware automation, and robust appliance security. We warmly invite community testing and feedback!',
    category: 'minor',
    isCurrent: true,
    highlights: [
      'Autonomous 1080p kiosk presentation with universal GPU auto-scaling across 720p, 1080p, 1440p, and 4K displays.',
      'Deterministic prayer & Jummah engine with astronomical solar calculations, CSV timetable imports, and Friday multi-shift manager.',
      'Flexible presentation modes: full mosque timetable displays or 1-click Poster-Only Mode for general community halls and schools.',
      'In-browser Multi-Asset Poster Studio for creating split-screen layouts, text notices, geometric stickers, and looping videos.',
      '24/7 reliability features: Screen Wake Lock, Do-Not-Disturb prayer silence, auto-power sleep scheduling, and midnight date rollover.',
      'Dual-mode admin security with on-screen tactile PIN for touchscreens, username/password for remote access, and CLI emergency recovery.',
      'Zero-dependency terminal startup on Windows, shell scripts for Linux/Raspberry Pi, and zero-config Docker support.',
    ],
    sections: [
      {
        title: 'Core Liturgical Engine & Timetables',
        items: [
          'Deterministic Astronomical Prayer Math: Calculates accurate prayer times locally using established solar calculation methods (ISNA, MWL, Egyptian, Makkah, Karachi) with no internet connection required.',
          'Annual Timetable CSV Importer: Supports multi-dialect CSV schedules (Full, Adhan-Only, Legacy) with fail-closed validation for venues using custom astronomical timetables.',
          'Friday Jummah Khutbah Management: Multi-shift Friday scheduling ("Khutbah 1", "Khutbah 2") that automatically replaces standard Dhuhr display on Fridays.',
          'Liturgical Presentation Modes: Choose between a periodic sliding timetable drawer with customizable cadence, a permanently pinned split-screen sidebar, or a clean poster-only broadcast.',
          'Daylight Saving & Midnight Rollover: Timezone-aware DST calculations preventing 1-hour schedule skews, coupled with autonomous midnight date changes without requiring page reloads.',
        ],
      },
      {
        title: 'Broadcast Display & Creative Poster Studio',
        items: [
          'Universal 1080p GPU Auto-Scaling: Renders a pixel-perfect 1920x1080 locked kiosk canvas that dynamically scales across 720p, 1080p, 1440p, and 4K displays with zero layout shift (CLS = 0).',
          'In-Browser Multi-Asset Poster Studio: Drag-and-drop slide composition with split layouts, 8-point proportional transform handles, sacred Islamic geometric stickers, ribbon badges, and custom frames.',
          'Multi-Media & Looping Video Support: Display 16:9 announcements, portrait flyers with ambient blurred backdrops, vector SVGs, and native looping video posters (up to 60s).',
          'Smart Overlay Choreography: Contextual corner QR code pop-out card with live URL scannability guards and a floating mini prayer countdown pill with 4-corner placement options.',
          'PWA Offline Standalone Display: Installable Progressive Web App with service worker caching ensuring uninterrupted broadcast playback even during unexpected network drops.',
        ],
      },
      {
        title: '24/7 Appliance Reliability & Hardware Control',
        items: [
          '100% Local-First & Zero Subscriptions: All state runs on an embedded SQLite database with local asset storage - zero recurring monthly fees, telemetry, or external cloud dependencies.',
          'Display Auto-Power Scheduling: Automated screen sleep and wake schedules via HDMI-CEC and DPMS, synchronized with an OLED pitch-black standby canvas and burn-in prevention pixel shifting.',
          'Hall Audio Receiver Muting: Automated network mute commands for Denon/Marantz, Yamaha, or HTTP webhooks during congregation prayers, backed by a fail-safe background unmute watchdog.',
          'Real-Time Live Sync (SSE): Immediate broadcast synchronization between administrative updates and display screens with exponential backoff and automatic state reconciliation.',
          'Screen Wake Lock Guardian: Continuous 24/7 wake lock preventing televisions, mini-PCs, and browser kiosks from entering OS sleep or screensavers.',
        ],
      },
      {
        title: 'Security, Privacy & 1-Click Operations',
        items: [
          'Dual-Mode Administrative Security: Touchscreen-friendly tactile on-screen PIN gate with 100,000 PBKDF2 hash iterations, paired with remote username and complex password authentication.',
          'Appliance-Wide Brute-Force Rate Limiting: Dual-tier defense locking out malicious IP attempts after 5 failures and triggering a global appliance lockout after 10 cumulative attempts.',
          'Binary Magic-Number Media Validation: Strict inspection of image and video file headers preventing non-media file execution.',
          'Emergency Terminal Recovery: Interactive command-line PIN and authentication reset tool (npm run reset-pin, npm run reset-auth) with zero database corruption risk.',
          'Multi-Platform Operational Tooling: Zero-dependency terminal startup (npm install && npm start) on Windows, autostart and data migration tools (npm run autostart, npm run migrate-data), shell scripts (start-signage.sh, update.sh) for Linux/macOS, and zero-config Docker containerization.',
        ],
      },
    ],
  },
];
