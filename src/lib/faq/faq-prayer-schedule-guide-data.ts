import type { FaqItem } from './faq-types';

export const FAQ_PRAYER_SCHEDULE_GUIDE_ITEM: FaqItem = {
  slug: 'prayer-and-jummah-schedule-guide',
  categoryId: 'prayer',
  question: 'How does the Prayer & Jummah Schedule management work?',
  shortAnswer:
    'Comprehensive operational guide to managing daily timetables, smart solar drift clamping, Friday Jummah multi-shifts with Khutbah silence, weekly vs date-specific Khateeb rosters, multi-session Ramadan Taraweeh & Witr, and date-activated Eid multi-shifts.',
  isAccordion: true,
  isFeatured: true,
  tags: [
    'prayer',
    'jummah',
    'khutbah',
    'iqamah',
    'adhan',
    'ramadan',
    'taraweeh',
    'witr',
    'eid',
    'khateeb',
    'timetable',
    'guide',
  ],
  relatedSlugs: ['prayer-calculation-methods', 'annual-csv-timetable-import'],
  article: {
    title: 'Complete Prayer & Jummah Schedule Administration Guide',
    lastUpdated: '2026-11-25',
    summary:
      'Step-by-step operational handbook for MosqueSignage prayer administrators, detailing the 3-sub-tab layout, solar clamping, turnover collision protection, weekly vs date-specific Khateeb overrides, multi-session Ramadan Taraweeh & Witr markers, and Eid multi-shift broadcast scheduling.',
    sections: [
      {
        heading: '1. Overview & 3-Sub-Tab Layout',
        paragraphs: [
          'The Prayer & Jummah Schedule manager in the Admin portal (/admin?tab=prayers) is organized into three dedicated operational sub-tabs:',
        ],
        steps: [
          'Prayer Timetable: Inspect monthly solar Adhan and congregational Iqamah times, edit specific daily slots, apply bulk ranges, or use the Actions dropdown to import CSVs, export printable sheets, or reset a month to pure astronomical calculations.',
          'Friday Jummah: Configure repeating every-Friday services (Khutbah & Salah times, language, location, turnover buffers) and assign or edit guest Khateebs for specific upcoming Fridays.',
          'Seasonal (Eid & Ramadan): Toggle Ramadan mode (optional Suhoor cutoff, Iftar marker, and multi-session Taraweeh + Witr) and manage Eid al-Fitr and Eid al-Adha multi-shift prayer timetables with target date activation.',
        ],
        callout: {
          type: 'tip',
          text: 'You can switch between sub-tabs anytime using the navigation tabs or directly from the Prayer & Jummah topbar dropdown menu.',
        },
      },
      {
        heading: '2. Daily Timetable & Smart Solar Clamping',
        paragraphs: [
          'Daily prayer timings are calculated using high-precision astronomical formulas (Adhan library) anchored to your venue latitude, longitude, calculation convention (ISNA, MWL, Umm Al-Qura, etc.), and high-latitude rule.',
          'When a mosque defines a fixed automated Iqamah rule (e.g. Asr fixed at 3:30 PM), solar movement across seasons can cause the astronomical Adhan to shift later than the fixed rule (e.g. Asr Adhan at 3:34 PM). To preserve prayer validity, MosqueSignage applies Smart Clamping automatically on rule-derived slots: whenever Adhan is later than or within 5 minutes of the rule, Iqamah clamps to Adhan + 5 minutes.',
        ],
        steps: [
          'The monthly timetable table displays an amber [Adj] pill next to any clamped Iqamah time so administrators see immediately where solar drift adjusted the rule.',
          'From the Actions dropdown, click "Reset to Pure Astronomical" at any time to clear manual day overrides and uploaded CSV records for that month and recalculate from astronomical parameters.',
          'High Latitude calculation rules (Seventh of Night, Middle of Night, Twilight Angle) are honored in both monthly timetables and live TV display calculations.',
        ],
        callout: {
          type: 'note',
          text: 'Smart clamping ensures automated fixed rules never schedule Salah before the astronomical Adhan enters.',
        },
      },
      {
        heading: '3. Friday Jummah Services, Turnover Buffers & Reverence Mode',
        paragraphs: [
          'MosqueSignage supports multi-shift Friday services with distinct Khutbah and Salah times, hall locations, languages, and Khateeb assignments.',
          'When adding or editing shifts, built-in chronological validation enforces a clearing turnover buffer between consecutive shifts so crowd flow and parking do not collide.',
        ],
        steps: [
          'Every Friday vs Specific Friday Date: Inside the Add or Edit Khutbah modal, choose "Every Friday (Weekly)" to update your permanent weekly schedule, or choose "Specific Friday Date" to assign a guest Khateeb and topic for one upcoming Friday only.',
          'Roster Editing: The Upcoming Friday Khateeb & Guest Speaker Roster card lets you view, assign, edit (pencil icon), or delete guest overrides for upcoming Fridays.',
          'Khutbah Silence Mode: When Congregation Silence Screen is enabled, poster slides pause as soon as Khutbah begins ("Khutbah [N] in Progress — Please switch mobile phones to silent and listen attentively" with assigned Khateeb and topic details) and transition to "Jummah Prayer in Progress" at Salah time (holding sermon silence for at least 25 minutes if no separate Salah time is entered).',
        ],
      },
      {
        heading: '4. Ramadan Mode: Suhoor, Iftar & Multi-Session Taraweeh + Witr',
        paragraphs: [
          'Under Seasonal (Eid & Ramadan), toggling Ramadan Sacred Mode immediately activates or deactivates fasting and night-prayer indicators on the 1080p TV prayer drawer:',
        ],
        steps: [
          'Suhoor / Imsak Buffer: Calculates Suhoor cutoff time under Fajr as Fajr Adhan minus your buffer minutes. Set the buffer to 0 if your mosque does not display a separate Suhoor cutoff.',
          'Maghrib Iftar Marker: Highlights Iftar timing alongside Maghrib Adhan.',
          'Display Start Date & Hijri Window Protection: Optionally set a TV Display Start Date (validated within Hijri Sha\'ban or Ramadan) to announce Taraweeh timings ahead of time. Ramadan fasting markers, Night Prayers, and Taraweeh silence screens automatically hide outside Sha\'ban/Ramadan and never appear on Active Eid Dates or Eid al-Fitr Eve after Maghrib.',
          'Taraweeh, Qiyam & Tahajjud Sessions (3 Selectors & Silence Duration): Add 1 to 4 nightly sessions choosing Prayer Type (Taraweeh, Qiyam, or Tahajjud), Rakats (2, 4, 6, 8, 10, 12, or 20), Witr (2+1, 3 Continuous, 1, or None), Start Timing (Fixed Clock Time or After Isha once daily Isha is set), and Silence Duration (10–180 min, automatically capped before Fajr or the next session). When the global Congregation Silence Screen is active, the TV holds a gently dimmed, burn-in-safe Silence Screen so posters stay hidden throughout long Musallah prayers (you can uncheck the Seasonal silence toggle for Lobby TVs). Sessions display in a dedicated TV sidebar card where odd bottom sessions span full width.',
        ],
      },
      {
        heading: '5. Eid Multi-Shift Activation, Eid-on-Friday Handoff & Testing',
        paragraphs: [
          'Configure multi-shift schedules for Eid al-Fitr and Eid al-Adha with Takbeerat start times, Salah times, Khateebs, and optional hall locations.',
        ],
        steps: [
          'Target Eid Date & Auto-Hide Grace Timer: Select which Eid is active (Off, Eid al-Fitr, or Eid al-Adha), set the Target Eid Date, and choose how many minutes after the final Eid Salah the schedule stays visible (default 60 min).',
          'Smart Morning-to-Afternoon & Eid-on-Friday Handoff: During Eid morning, the TV drawer shows Eid shifts along with a compact footer strip showing afternoon Jummah times (on Fridays) or Dhuhr (on other days) plus any optional Eid-on-Friday note. Once the grace timer expires, the display automatically hands off to the Friday Jummah or Daily Prayer drawer.',
          'Testing Anytime on TV: Open /display, press F2 (or ~) to open the Kiosk Simulator, and click Force Eid alongside the time scrubber to preview Eid shifts and countdown telemetry without waiting for Eid Day.',
        ],
        callout: {
          type: 'tip',
          text: 'During Eid Salah times, the Congregation Silence Screen also automatically protects the hall when silence overlay is enabled.',
        },
      },
    ],
  },
};
