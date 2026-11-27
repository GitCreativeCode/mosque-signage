/**
 * Bundled MosqueSignage Release Changelog Registry
 * MosqueSignage (TV)
 */

import { ARCHIVED_RELEASE_HISTORY } from './release-archive';

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

const RELEASE_0_2_0: ReleaseLogItem = {
  version: '0.2.0',
  date: 'November 26, 2026',
  title: 'v0.2.0 - Responsive Multi-Screen Experience, Prayer & Jummah Overhaul, Seasonal Roster & Studio',
  summary:
    'Major milestone release introducing full responsive mobile & tablet support across /admin, /display (Mobile Companion View with 16:9 TV Preview toggle), and public pages (/faq, /releases, /privacy, /terms), alongside an architectural overhaul of the Prayer & Jummah scheduling suite (3-sub-tab workflow, single-row Actions toolbar, unified time pickers, smart solar drift clamping, Friday Khutbah silence reverence mode, multi-shift turnover collision guards, unified weekly/date-specific Khateeb overrides, multi-session Ramadan Taraweeh & Witr configuration, and date-activated Eid multi-shift schedules with Eid-on-Friday handoff and Force Eid simulator), advanced QR availability scheduling across flyers and Multi-Asset slides, Posters & Notices operational upgrades, major Multi-Asset Layout Studio overhaul, and an expanded FAQ knowledge base.',
  category: 'minor',
  isCurrent: true,
  highlights: [
    'Responsive Mobile & Tablet Admin Dashboard (< 1024px Hamburger Drawer): Replaces the desktop topbar below 1024px with a left-aligned Mosque Signage header and smoothly animated right-hand slide-out hamburger drawer containing all 4 expandable navigation modules, theme switcher, and lock/logout controls.',
    'Touch-First Admin Workflows & Multi-Asset Studio Gating (< 768px): Enables full poster/video uploading, notice creation, editing, reordering, and bulk actions on phones with 44x44px touch targets, near-full-screen dvh sheets with collapsible live previews, stacked sequence/timetable/Jummah/Eid cards (zero horizontal scroll), and clean tablet/desktop-only gating for Multi-Asset Studio.',
    'Mobile Companion Display View (/display on Phones): Automatically switches phone viewports (< 768px) from microscopic 1920x1080 scaling to a readable stacked Mobile Companion view with live clock/Hijri/ticker, swipe-friendly poster controls, clickable QR links, Congregation Silence/Standby awareness, full daily/Jummah/Eid prayer cards, and a 1-tap "16:9 TV Preview" toggle.',
    'Responsive Public Pages & Documentation Chrome: Added a mobile hamburger menu to PublicHeader on small screens (< 640px), wrapped SiteFooter links cleanly, and improved touch ergonomics across /faq, /releases, /privacy, /terms, Initial Setup, Factory Reset, Update, and What\'s New dialogs.',
    'Prayer & Jummah 3-Sub-Tab Architecture & Single-Row Toolbar: Streamlined liturgical management into Prayer Timetable, Friday Jummah, and Seasonal (Eid & Ramadan) workflows with an Actions dropdown for CSV tools and pure astronomical reset, plus unified time pickers matching the rest of the admin portal.',
    'Smart Solar Drift Clamping & [Adj] Advisory Badge: Automatically clamps fixed Iqamah rules to Adhan + 5 minutes whenever solar drift causes Adhan to occur later than or within 5 minutes of Iqamah, highlighting adjusted times with an amber [Adj] pill in the admin grid.',
    'Friday Multi-Shift Turnover & Collision Guard: Enforces minimum prayer duration and clearing buffers between consecutive Jummah shifts, with inline chronological validation alerts preventing overlapping services.',
    'Khutbah Reverence Mode, Dual-Phase Silence & Audio Sync: When Congregation Silence is enabled, the 1080p kiosk display automatically pauses slides during sermon delivery showing "Khutbah [N] in Progress • Please switch mobile phones to silent and listen attentively" (including Khateeb/topic details when set, and an automatic 25-minute fallback window if Salah time is omitted), smoothly transitioning to "Jummah Prayer in Progress" at Salah time while keeping PA audio receiver unmuted during sermons and muted during congregational prayers including Eid Salah.',
    'Unified Weekly Shifts & Specific-Friday Guest Khateeb Roster: Configure recurring weekly shifts or assign date-specific guest Khateebs and sermon topics directly from the Khutbah modal or Roster card, updating the live TV display automatically on that Friday.',
    'Ramadan Mode with Hijri Visibility Guards, Full-Duration Musallah Silence & Night Prayers Card: Configure optional Suhoor cutoff buffers (set to 0 to omit), an optional TV Display Start Date (validated inside Hijri Sha\'ban or Ramadan to pre-announce Taraweeh schedules before Ramadan while automatically hiding outside Sha\'ban/Ramadan and on Eid Day/Eve), up to 4 nightly sessions with Prayer Type (Taraweeh/Qiyam/Tahajjud), Rakats (2–20), Witr (2+1/3 Continuous/1/None), and configurable per-session Silence Duration (10–180 min) synchronized with the global Congregation Silence Screen master toggle and featuring soft dimmed anti-burn-in protection for extended Musallah prayers.',
    'Eid Multi-Shift Scheduler, Target Date Activation & Eid-on-Friday Handoff: Schedule Eid al-Fitr and Eid al-Adha shifts with Takbeerat and Salah times, set an active Eid date and configurable post-Salah auto-hide grace timer, show afternoon Jummah or Dhuhr reminders during Eid morning, and preview anytime via Force Eid in the Kiosk Simulator (F2).',
    'High-Latitude Calculation & Reset to Pure Astronomical: Configurable high-latitude rules (Seventh of Night, Middle of Night, Twilight Angle) active across both admin and live TV display calculations, plus 1-click "Reset to Pure Astronomical" in the timetable Actions menu.',
    'Interactive Prayer Schedule FAQ Guide: Published complete operational guide at /faq/prayer-and-jummah-schedule-guide with a question-mark help icon and hover tooltip on the admin schedule page.',
    'Congregation Silence Screen Customization & Theming: Personalize reverence subtitles and select between 4 high-contrast broadcast accents (Mosque Green, Warm Amber, Cyan Teal, Monochrome White) on pitch-black OLED background.',
    'Kiosk Simulator On-Demand Silence Trigger: Dedicated "Silence / Exit Silence" simulator toggle button and [T] keyboard shortcut allowing administrators to preview overlay animations, typography, and countdown transitions instantly.',
    'Advanced QR Availability Scheduling: Configure independent Start ("Available From") and End ("Available Until") date/time windows for QR codes across flyers, notices, and Multi-Asset slides.',
    'Autonomous Display Kiosk QR Suppression: When a QR code is outside its scheduled window, the QR card completely hides so the slide displays clean without an inactive QR link.',
    'Posters Page Instant Search: Real-time search filter in toolbar instantly matching slides by title, QR label text, or target destination URL.',
    '1-Click Active/Archive Toggle: Toggle poster visibility immediately via tactile card and table status buttons without opening full edit modals.',
    'Multi-Select Checkboxes & Bulk Operations: Select multiple slides or select all with a floating bulk action bar to archive or delete batches simultaneously.',
    'Studio Topbar & Toolbar Redesign: Clean minimal branding, removed cluttered subtext/badges, and segmented toolbar with guides, history controls, and slide actions.',
    'Visual History Flyout Panel: Chronological action stack with click-to-revert state restoration and forward-state overwrite protection.',
    'Canvas Marquee Multi-Select: Drag a bounding box across the live canvas to select all intersecting layers in one fluid motion.',
    'Keyboard Arrow Key Nudge: Nudge selected layers with 1% fine precision via arrow keys, or 5% steps holding Shift.',
    'Top-Level Selection Outline: Elevated selection outline renders above overlapping layers so boundary is always visible without altering layer depth.',
    'Interactive Text Banner Sizing, Stretching & Edge-to-Edge Outline: Replaced the 6-step font size dropdown with a typed numeric box (14–240 px) matched 1:1 to the 1080p TV display; enabled dragging corner handles on the live preview to scale font size smoothly along the diagonal (with Alt to scale from center), dragging side/top/bottom edges (or using W/H % controls with Reset) to stretch text horizontally or vertically (25%–400%), dragging text smoothly with center snap guides without re-wrapping near canvas edges, 4-level click selection while typing (double-click word, triple-click row, quad-click all rows), and live per-row pill highlighting while double-click typing in "Fitted per Row" mode with a flush edge-to-edge selection box.',
    '3-Way Visual Theme Support: Added System Default (auto OS match), Light, and Dark modes across onboarding and topbars.',
    'Comprehensive FAQ Knowledge Base & Technical Blueprint Overhaul: Expanded documentation with 6 new guides scaling the knowledge base to 21 articles.',
    'Multi-Platform Display Guidance & Dual-Mode Recovery: Cross-platform kiosk setup for Windows, Linux, and macOS with browser neutrality (Edge/Chrome recommended for kiosk flags), public npm run autostart automation, and dual-mode credential recovery (PIN & Password) via npm run reset-auth.',
    'Terms of Use & Privacy Policy Modernization: Rewrote the Terms of Use and Privacy Policy in plain, direct English—clarifying self-hosted open-source software scope, venue content responsibility, prayer calculation authority, third-party hardware integration disclaimers, dual licensing (GPLv3 & commercial), and local-first data privacy.',
  ],
  sections: [
    {
      title: 'Responsive Multi-Screen, Mobile Admin & Companion Display',
      items: [
        'Mobile & Vertical Tablet Admin Drawer (< 1024px): Collapsed the 3-zone desktop topbar into a streamlined header with Mosque Signage on the left and a smoothly animated right slide-out hamburger drawer housing all 4 expandable navigation groups (Posters & Notices, Prayer & Jummah, Settings, Display Tools), 3-way Theme Switcher, and Lock & Log Out.',
        'Phone-Safe Studio Gating (< 768px): Keeps Upload Poster, Create Notice, Edit Flyer/Notice, and all list management active on phones while gating Multi-Asset Layout Studio behind clear "Tablet / PC" badges and a dedicated guidance dialog when tapping Edit on composite slides.',
        'Touch-First Posters, Prayers & Settings Lists: Added 44x44px touch targets on card actions, wrapped bulk action and timetable toolbars, and replaced wide 6–8 column tables below 768px with stacked sequence cards, daily prayer cards, Jummah Khutbah cards, and Eid shift cards with zero horizontal overflow.',
        'Near-Full-Screen Mobile Modal Sheets (dvh): Adapted Upload, Create Notice, Edit, Initial Setup, Factory Reset, PWA Install, and Prayer modals into viewport-safe 100dvh sheets with collapsible live 16:9 previews on phones and responsive version/action rows in Update, What\'s New, Beta Notice, and Confirmation popups.',
        'Mobile Companion Display (/display): Reflowed /display on phone screens (< 768px) into a readable vertical companion layout with live SSE updates, Congregation Silence and Standby states, clickable QR link banners, and a 1-tap "16:9 TV Preview" toggle while preserving the 1920x1080 auto-scaled broadcast on tablets and TVs.',
        'Responsive Public Chrome & Pages: Added a mobile navigation menu to PublicHeader below 640px, wrapped SiteFooter links cleanly, added touch-friendly expand hints to FAQ schematic lightboxes, and refined spacing across /releases, /faq, /privacy, and /terms.',
      ],
    },
    {
      title: 'Prayer & Jummah Schedule Overhaul & Seasonal Timetables',
      items: [
        '3-Sub-Tab Organization & Single-Row Actions Menu: Sub-tabs for Prayer Timetable, Friday Jummah, and Seasonal (Eid & Ramadan) schedules with URL deep-linking (?tab=prayers&sub=timetable|jummah|seasonal), unified time inputs across all modals/rules, and a compact Actions dropdown grouping Import CSV, Export & Print, and Reset to Pure Astronomical.',
        'Smart Solar Drift Clamping: Daily timetable automatically clamps fixed Iqamah rules to Adhan + 5 minutes if solar movement shifts Adhan later than or within 5m of Iqamah, badging the cell with an amber [Adj] pill.',
        'High Latitude Rules: Added high_latitude_rule venue setting supporting Seventh of the Night, Middle of the Night, and Twilight Angle methods across both monthly schedules and live TV broadcasts.',
        'Friday Multi-Shift Turnover Buffers: Enforces minimum prayer duration and clearing buffers between shifts, rendering clear visual turnover status rows in the admin table and preventing overlapping shifts.',
        'Friday Khutbah Reverence Silence & 25-Min Sermon Fallback: Displays "Khutbah [N] in Progress • Please switch mobile phones to silent and listen attentively" along with assigned Khateeb and topic details during sermon delivery, transitioning to "Jummah Prayer in Progress • Salah <time>" at Salah time (or holding the sermon silence window for at least 25 minutes when no separate Salah time is specified).',
        'Unified Weekly Shifts & Guest Khateeb Roster: Switch directly between Every Friday (Weekly) and Specific Friday Date overrides inside the Khutbah modal, or manage upcoming Friday overrides with inline editing on the Roster card.',
        'Ramadan Mode (Hijri Guards, Prayer Type/Rakat Dropdowns, Extended Silence & Night Prayers Card): Supports optional Suhoor cutoff buffers (0 hides it), an optional TV Display Start Date constrained to Hijri Sha\'ban/Ramadan (auto-suppressing outside Sha\'ban/Ramadan and on Active Eid Dates / Eid Eve), 3 distinct selectors per nightly session (Prayer Type: Taraweeh/Qiyam/Tahajjud, Rakats: 2–20, Witr), per-session Silence Duration (10–180 min) auto-clamped before Fajr and overlapping sessions with live Global Silence Screen master-switch status & soft dimmed burn-in guard on TV, missing-Isha safeguards, and full-width odd-session rows in the TV Night Prayers card alongside smooth QR card transitions.',
        'Eid Multi-Shift Scheduler, Target Date Activation & Audio Sync: Manage Eid al-Fitr and Eid al-Adha shifts with Takbeerat and Salah timings, configure target Eid date and post-Salah auto-hide grace duration, show afternoon Jummah/Dhuhr reminders on Eid morning, sync Eid Salah and high-latitude schedules with the PA audio receiver mute engine, and preview anytime via Force Eid in the Kiosk Simulator.',
        'Interactive Admin Help Icon & FAQ Guide: Added question-mark help icon on the schedule page linking directly to /faq/prayer-and-jummah-schedule-guide.',
      ],
    },
    {
      title: 'Congregation Silence Screen & Liturgical Automation',
      items: [
        'On-Demand Kiosk Simulator Trigger: Added interactive "Silence / Exit Silence" button with [T] key toggle and Escape dismissal in the bottom simulator toolbar (F2 / ~) to inspect reverence layouts and transitions anytime.',
        'Dynamic Liturgical Wording Engine: Differentiates sermon delivery from prayer; shows "Khutbah in Progress • Please listen attentively" for sermons without Salah times, and "[Prayer] in Progress • Please switch mobile phones to silent" for congregational prayer.',
        'Reverence Subtitle Customization: Configurable subtitle input under Settings -> Display Timings & Behaviors with 1-click default restoration ("Please switch mobile phones to silent").',
        'High-Contrast Broadcast Accent Presets: 4 OLED-optimized accent themes (Mosque Forest Green, Warm Amber, Cyan Teal, and Monochrome White with contrast-bordered preview swatches visible in both light and dark modes).',
        'Friday-Only Venue Lifecycles: Enhanced prayer detection so venues without daily coordinates still trigger Friday Jummah silence screens reliably, and cleanly suppress the mini-pill into Clean Slide Broadcast mode once Friday services conclude.',
      ],
    },
    {
      title: 'Advanced QR Availability Scheduling',
      items: [
        'Flexible Availability Window: Set independent "Available From" and "Available Until" dates/times (or open-ended bounds) to withhold links until registrations open or hide them when signups close.',
        'Clean Display Kiosk Behavior: During inactive periods, QR codes are completely omitted on the TV presentation so slides present cleanly without dead links.',
        'Admin Telemetry & Timezone Formatting: Grid cards and sequence rows display color-coded status badges ("Until <Date>", "Starts <Date>", "Active", "Link Closed") formatted in the venue timezone.',
        'Safe-Zone Layout Preview in Modals: Upload and edit modals keep the QR card visible with schedule telemetry tags so administrators can preview layout spacing.',
      ],
    },
    {
      title: 'Posters & Notices Page Operations',
      items: [
        'Real-Time Filter Bar: Quickly locate flyers and notices by title keywords, QR labels, or URLs directly from the management toolbar.',
        '1-Click Active/Archive Status Switch: Instantly activate or archive slides directly from the card top-left badge or table row button with inline loading feedback.',
        'Bulk Checkbox Selection & Actions: Floating action bar supporting Select All, Clear, Bulk Archive, and Bulk Delete with safety confirmation prompts.',
      ],
    },
    {
      title: 'Poster Layout Studio Overhaul & Usability',
      items: [
        'Visual History Timeline Panel: Floating history flyout next to Undo/Redo allowing users to browse past actions, jump to earlier snapshots, and safely overwrite future branches upon new edits.',
        'Topbar Redesign & Segmented Controls: Clean minimal left title, removed redundant slot/archetype badges, and structured right toolbar into cohesive segmented groups.',
        'Canvas Marquee Drag-to-Select: Dragging a selection box on empty canvas space instantly selects all intersecting stickers, text banners, slots, and compound layers.',
        'Arrow Key Precision Nudging: Arrow keys (Up, Down, Left, Right) nudge unlocked selected layers by 1% (or 5% with Shift) for pixel-perfect alignment.',
        'Top-Level Selection Outline: Selection boundaries project onto an elevated overlay (z-55), ensuring the yellow selection frame is always visible even when layers are obscured beneath others.',
        'Multi-Layer Context Menu & Two-Step Dismissal: Right-clicking anywhere with multiple layers selected opens the batch actions menu; first click closes menu while preserving selection.',
        'Undo/Redo False Trigger Fix: Pointer up only pushes history snapshots when actual movement or resizing occurs, eliminating phantom undo states on simple clicks.',
        'Full-Screen Portal Studio: Rendered Studio via React Portal taking 100% of the screen (100vw x 100vh), completely replacing the webpage header for an immersive workspace.',
        'Smart Multi-Select Frames & Tab Freedom: Opens the Layers tab once on multi-selection without locking tabs, allowing unrestricted tab navigation and batch frame styling across all selected slots.',
        'In-Place Direct Text Editing & Copy/Paste: CSS Grid auto-sizing text editing without horizontal expansion, keyboard Ctrl+C copy and Ctrl+V paste, and reliable Ctrl+D layer duplication.',
        'Numeric Text Sizing, Live Canvas Stretch & Flush Fitted-per-Row Outline: Replaced the font size dropdown with a typed 14–240 px input synchronized 1:1 between Studio preview and 1080p TV broadcasts; corner handles scale font size smoothly along the diagonal while top/bottom/left/right edges stretch text vertically or horizontally (25%–400%, with Alt for center-anchored transform and an inspector W/H readout + 1-click Reset); smooth grab-offset text dragging with center snap guides prevents shrinking or re-wrapping near canvas edges; double-click editing in "Fitted per Row" keeps per-row tight highlight widths live while typing with a flush edge-to-edge selection outline and 4-level multi-click selection (double-click word, triple-click row, quad-click all rows).',
      ],
    },
    {
      title: 'Appliance Maintenance & Bug Fixes',
      items: [
        'Admin Topbar Hydration Safety: Eliminated SSR/client hydration mismatches on theme toggles via deterministic initial render states.',
        'Release Notes Truncation Fix: Corrected markdown sanitizer regex so non-tag comparisons like (< 2025) render completely.',
        'Custom Frame Reset Wipe: Cleanly wipes orphaned custom frames, metadata, and orchestrates single-trigger onboarding.',
        'Factory Reset Choreography: Initial setup modal remains strictly suppressed until administrator acknowledges reset.',
        'Coding Standards & Foundations Refactoring: Enforced strict zero-any TypeScript rules, deterministic time parameters in pure choreography engines, modularized PosterGridCard, and disambiguated isHugLines stepped text line naming.',
        'Factory Reset Clarity & Streamlined Wizard: Simplified Step 1 of the Factory Reset dialog to a single, accurate "What Will Be Cleared" list (removing the "What Will Be Kept Safe" panel) and ensured factory reset always restores PIN Mode with the default PIN 1234.',
        'Concise Update & What\'s New Summaries: Updated the Appliance Update dialog and post-update What\'s New popup to show the release summary paragraph and direct administrators to GitHub or /releases for the full changelog instead of crowding modals with long lists.',
        'Admin Performance & Dynamic Code-Splitting: Implemented on-demand lazy loading via next/dynamic for inactive tabs (Prayers, Settings) and heavy modals (MultiAssetStudioModal, upload/edit dialogs, timetable exporters), drastically reducing initial JavaScript bundle execution on low-end hardware (Raspberry Pi/N100).',
      ],
    },
    {
      title: 'Knowledge Base, FAQ & Technical Blueprints',
      items: [
        'Five High-Value Knowledge Base Guides: Added dedicated articles covering poster recurring time windows, screen layout archetypes (Periodic Drawer, Always Pinned, Poster Only) with TV overscan safe margins, standalone PWA Smart TV installation with Screen Wake Lock, congregation silence screen with PA audio receiver muting (Denon, Yamaha, Webhook), and appliance software update channels.',
        'Multi-Platform & Browser-Neutral Kiosk Guidance: Updated hardware guides and vector diagrams to cover Windows, Linux (Raspberry Pi OS), and macOS, highlighting Microsoft Edge and Google Chrome for kiosk flags, and documenting cross-platform autostart automation (npm run autostart).',
        'Dual-Mode Authentication & Emergency CLI Recovery: Updated security documentation and blueprints detailing both tactile 4–8 digit PIN mode and Username + Password mode, with interactive terminal recovery workflows via npm run reset-auth.',
        'Technical Blueprint Modernization: Redesigned SVG technical blueprints for poster safe zones (illustrating 4-corner Mini Prayer Pill placement, dynamic 500ms stage squeeze, and smart QR collision avoidance) and dual-topology hardware deployments (Direct HDMI vs. LAN Network Display & Smart TV).',
      ],
    },
    {
      title: 'Terms of Use & Privacy Policy Modernization',
      items: [
        'Plain English Scope & Content Responsibility: Clarified that MosqueSignage is self-hosted software run on the venue\'s own hardware, with the venue solely responsible for displayed announcements and content.',
        'Prayer Times & Religious Authority: Reaffirmed that astronomical calculations are mathematical estimates, with local mosque Imams and committees holding final authority over official timetables.',
        'Practical Hardware & Audio Disclaimers: Added software disclaimers for optional TV standby (HDMI-CEC/DPMS) and prayer hall receiver muting integrations (Denon, Yamaha, webhooks) operating on third-party hardware.',
        'Dual-Licensing Framework: Outlined open-source GNU GPLv3 terms alongside private commercial licensing for proprietary white-label distribution.',
        'Local-First Privacy Transparency: Clearly explained local storage guarantees, zero cloud tracking, essential login cookies, anonymous GitHub update polling, and full venue data control.',
      ],
    },
  ],
};

export const OFFICIAL_RELEASE_HISTORY: readonly ReleaseLogItem[] = [
  RELEASE_0_2_0,
  ...ARCHIVED_RELEASE_HISTORY,
];
