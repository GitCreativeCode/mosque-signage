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
    version: '0.1.2',
    date: 'November 18, 2026',
    title: 'v0.1.2 - Dynamic Media Serving, Resilient Data Migration & Instant Update Polling',
    summary:
      'Maintenance and stability patch resolving production media preview streaming in npm start, expanding SQLite migration tooling to detect mosque_signage.db across nested folders, and introducing 2-minute tab-focus update polling with styled release highlights.',
    category: 'patch',
    isCurrent: true,
    highlights: [
      'Production Dynamic Media Serving: Added dynamic Next.js App Router streaming at /uploads/* ensuring newly uploaded flyers, video clips, and vector SVG notices display immediately in production mode without 404s.',
      'Resilient Data Migration: Upgraded migrate-data.mjs to automatically recognize mosque_signage.db (and legacy signage.db) and detect nested release folders created during zip extraction.',
      'Active Update Detection: Added 2-minute interval polling and instant window/tab-focus re-checks so available GitHub updates appear in real-time without restarting the server.',
      'Structured Release Highlights: Replaced raw monospace markdown in update dialogs with formatted cards, styled section badges, and clean bullet lists.',
    ],
    sections: [
      {
        title: 'Production Media & Kiosk Streaming',
        items: [
          'Dynamic /uploads/* Route: Intercepts runtime media requests in production next start with HTTP 200/206 partial range streaming for video loops and directory traversal security.',
          'Instant Notice & Flyer Previews: Notice SVGs and flyer uploads render immediately on the admin dashboard and TV display without requiring server rebuilds.',
        ],
      },
      {
        title: 'Appliance Maintenance & Migration Tooling',
        items: [
          'Flexible SQLite Database Detection: migrate-data supports primary mosque_signage.db, legacy signage.db, and nested release directories with automated timestamped backups.',
          'Real-Time Update Polling: Site footer polls GitHub releases every 2 minutes and immediately when switching back to the browser tab.',
          'Sanitized Markdown Highlights: Strips technical offline checksum blocks and formats release notes into clean, readable cards.',
        ],
      },
    ],
  },
  {
    version: '0.1.1',
    date: 'November 18, 2026',
    title: 'v0.1.1 - Poster Studio Enhancements & Locked Layer Safeguards',
    summary:
      'A focused maintenance and UX upgrade for the Multi-Asset Poster Layout Studio. Introduces inline double-click canvas text editing with real-time sidebar synchronization and robust keyboard deletion safeguards for locked layers.',
    category: 'patch',
    isCurrent: false,
    highlights: [
      'Inline Double-Click Canvas Text Editing: Double-click any unlocked text banner directly on the visual stage canvas to edit text in place with auto-focus, multiline support (Shift+Enter), and automatic sidebar inspector sync.',
      'Locked Layer Deletion Safeguards: Delete and Backspace keyboard shortcuts now strictly respect layer locks, preventing accidental deletion of locked slots, stickers, text overlays, and compound layers.',
    ],
    sections: [
      {
        title: 'Poster Layout Studio UX Upgrades',
        items: [
          'Inline Stage Text Editing: Double-clicking an unlocked text banner opens a transparent, auto-resizing in-place editor matching font, size, weight, and color without requiring sidebar-only interaction.',
          'Multiline & Escape Controls: Press Enter to commit, Shift+Enter to insert newlines, Escape to cancel edits without mutation, and auto-revert on empty/whitespace submission.',
          'Auto-Focus Inspector Sidebar: Double-clicking an unlocked canvas text element automatically switches the tool drawer to the Text tab for immediate access to styling controls.',
        ],
      },
      {
        title: 'Safety, Locks & Keyboard Ergonomics',
        items: [
          'Locked Layer Delete Guard: Pressing Delete or Backspace when a layer is locked (directly or via parent folder) is a silent no-op, preventing unintended layout loss.',
          'Multi-Selection Partial Delete: Deleting a selection containing both locked and unlocked items safely removes only the unlocked elements while preserving locked layers intact.',
        ],
      },
    ],
  },
  {
    version: '0.1.0',
    date: 'November 18, 2026',
    title: 'v0.1.0 - Official Public Beta Release',
    summary:
      'The initial public beta release of MosqueSignage - a 100% local-first, zero-subscription digital signage appliance engineered for mosques, Islamic schools, community centers, and public venues. Designed for unattended 24/7 autonomous display on prayer hall televisions or general venue screens, with local astronomical calculations, in-browser poster creation, TV hardware automation, and robust appliance security. We warmly invite community testing and feedback!',
    category: 'minor',
    isCurrent: false,
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
