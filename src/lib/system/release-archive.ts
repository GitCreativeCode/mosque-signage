/**
 * Archived MosqueSignage Release History Entries (v0.1.0 - v0.1.3)
 * MosqueSignage (TV)
 */

import type { ReleaseLogItem } from './release-history';

export const ARCHIVED_RELEASE_HISTORY: readonly ReleaseLogItem[] = [
  {
    version: '0.1.3',
    date: 'November 20, 2026',
    title: 'v0.1.3 - Recurring Poster Schedules, Appliance Resiliency & Security Hardening',
    summary:
      'Major feature and resilience release introducing recurring day and time window poster scheduling, consolidated content creation, power-loss WAL recovery, clock-skew fail-safe mode, timetable injection defenses, and pairing security hardening.',
    category: 'patch',
    isCurrent: false,
    highlights: [
      'Power-Loss WAL Recovery & Auto-Quarantine: Startup PRAGMA wal_checkpoint(TRUNCATE) and integrity check automatically quarantine corrupted databases after sudden power cuts without halting kiosk boots.',
      'Clock-Skew & RTC Battery Death Protection: Detects un-synchronized clocks (< 2025), automatically suppressing audio muting and DND blackouts to maintain uninterrupted flyer rotation with an amber TopBar alert.',
      'CSV Formula Injection & Chronological Validation: Sanitizes exported CSV cells against spreadsheet DDE attacks and rejects out-of-order Adhan/Iqamah times fail-closed with actionable row warnings.',
      'Display Pairing Security Hardening: Hardened client IP resolution against Host-header spoofing, safely defaulting direct LAN requests to lan-client.',
      'Recurring Day & Time Windows: Schedule flyers and notices for specific days of the week and hours evaluated in your venue\'s configured timezone.',
      'Consolidated + Add Content Menu: Streamlined the admin toolbar with a single content creation dropdown featuring rich hover preview cards.',
    ],
    sections: [
      {
        title: 'Appliance Resiliency & Security Hardening',
        items: [
          'Abrupt Power-Cut WAL Protection: Startup checkpoint truncation and integrity checks automatically quarantine corrupted databases with timestamped backups and reseed defaults.',
          'Clock Skew & RTC Failure Fail-Safe: Suppresses prayer silence muting and DND blackout when system clock is unsynchronized (< 2025), showing an amber TopBar warning pill.',
          'CSV Formula Injection & Chronological Enforcing: Neutralizes DDE formula injection via apostrophe escaping and enforces ascending Adhan/Iqamah chronological order.',
          'Display Pairing Host Header Hardening: Removed Host header trust in client IP resolution, preventing LAN clients from bypassing pairing authentication.',
        ],
      },
      {
        title: 'New Features',
        items: [
          'Recurring Day & Time Windows: Author multiple weekly time-windows per poster or notice with 1-click presets (Fridays Only, Weekends, Weekdays, All Days), automatic interval conflict merging, and venue timezone evaluation.',
          'Unified Broadcast Schedule Accordion: Seamlessly integrates standard date ranges with recurring day and time windows behind a clean expandable chevron toggle.',
          '+ Add Content Dropdown: Replaces scattered buttons in the admin toolbar with a clean, unified dropdown for Upload Poster, Create Notice, and Multi-Asset Studio with rich hover preview cards.',
          'Congregation Silence Screen Toggle: Added a dedicated setting under Overlays allowing administrators to enable or disable the mobile silence popup during prayer times (defaults to OFF for continuous 24/7 slide rotation).',
        ],
      },
      {
        title: 'Improvements & Bug Fixes',
        items: [
          'DST Fall Back Dwelling Continuity: Guarded against negative elapsed milliseconds during 1-hour fall-back clock transitions.',
          'Reverent Silence Transitions & Auto-Pause: Pitch-black silence screen animates in/out using configured slide transitions, pausing video playback and slide timers until prayer ends.',
          'Mini Prayer Pill Persistence: Fixed an issue where turning off the floating mini prayer pill in admin settings could revert back to active on page reload.',
          'Production Build Version Detection: Server pre-start checks now automatically detect when the codebase version changes and trigger a clean production build.',
        ],
      },
    ],
  },
  {
    version: '0.1.2',
    date: 'November 18, 2026',
    title: 'v0.1.2 - Dynamic Media Serving, Resilient Data Migration & Instant Update Polling',
    summary:
      'Maintenance and stability patch resolving production media preview streaming in npm start, expanding SQLite migration tooling to detect mosque_signage.db across nested folders, and introducing 2-minute tab-focus update polling with styled release highlights.',
    category: 'patch',
    isCurrent: false,
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
      'The initial public beta release of MosqueSignage - a 100% local-first, zero-subscription digital signage appliance engineered for mosques, Islamic schools, community centers, and public venues.',
    category: 'patch',
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
  },
];

