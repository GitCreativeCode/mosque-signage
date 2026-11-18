import type { FaqItem } from './faq-types';

export const FAQ_PRAYER_ITEMS: readonly FaqItem[] = [
  {
    slug: 'prayer-calculation-methods',
    categoryId: 'prayer',
    question: 'How does MosqueSignage calculate daily liturgical times?',
    shortAnswer:
      'Times follow a strict 4-tier hierarchy: Astronomical solar angles (ISNA, MWL, Umm Al-Qura) -> Global Adhan offsets -> Annual CSV timetable overrides -> Relative Iqamah countdown windows.',
    isAccordion: true,
    isFeatured: true,
    tags: ['prayer', 'adhan', 'iqamah', 'isna', 'mwl', 'hanafi', 'shafi', 'calculation', 'astronomy'],
    relatedSlugs: ['annual-csv-timetable-import', 'friday-jummah-khutbah-shifts', 'kiosk-dual-monitor-setup'],
    article: {
      title: 'Liturgical Engine: 4-Tier Calculation Hierarchy & Algorithms',
      lastUpdated: '2026-11-03',
      summary:
        'Deep-dive into solar trigonometry, convention parameters, Asr shadow lengths, and deterministic local calculation.',
      sections: [
        {
          heading: '1. The 4-Tier Calculation Hierarchy',
          paragraphs: [
            'To ensure 100% offline continuity while honoring community customs, MosqueSignage evaluates prayer timings through four progressive tiers. If an annual timetable CSV is uploaded, it overrides astronomical formulas; otherwise, astronomical angles calculate the schedule deterministically.',
          ],
          image: {
            src: '/faq/prayer-calculation-flow.svg',
            alt: '4-Tier Liturgical Calculation Precedence',
            caption: 'Precedence ladder: Astronomical Angles -> Global Offsets -> Annual CSV -> Relative Iqamah.',
            width: 960,
            height: 540,
          },
        },
        {
          heading: '2. Supported Astronomical Conventions',
          paragraphs: [
            'MosqueSignage incorporates international astronomical calculation authorities:',
          ],
          steps: [
            'ISNA (Islamic Society of North America): Fajr 15°, Isha 15°.',
            'MWL (Muslim World League): Fajr 18°, Isha 17°.',
            'Egyptian General Authority of Survey: Fajr 19.5°, Isha 17.5°.',
            'Umm Al-Qura (Makkah): Fajr 18.5°, Isha 90 minutes after Maghrib (120m in Ramadan).',
            'Asr Shadow Length: Standard / Shafi / Maliki / Hanbali (shadow factor 1) vs Hanafi (shadow factor 2).',
          ],
          callout: {
            type: 'tip',
            text: 'All calculations accept an injected `now: Date` parameter anchored to your local venue IANA timezone. The engine automatically handles Daylight Saving Time (DST) transitions with zero manual clock skews.',
          },
        },
      ],
    },
  },
  {
    slug: 'annual-csv-timetable-import',
    categoryId: 'prayer',
    question: 'How do I import an annual 365-day prayer timetable spreadsheet?',
    shortAnswer:
      'Navigate to Admin > Prayer Times > Import Timetable and upload a standard CSV spreadsheet. MosqueSignage auto-detects date columns, Adhans, and fixed Iqamah times for the whole year.',
    isAccordion: true,
    isFeatured: false,
    tags: ['csv', 'spreadsheet', 'import', 'annual', 'timetable', 'schedule'],
    relatedSlugs: ['prayer-calculation-methods', 'friday-jummah-khutbah-shifts'],
    article: {
      title: 'Importing Annual Prayer Timetables from CSV Spreadsheets',
      lastUpdated: '2026-11-03',
      summary:
        'Step-by-step instructions for uploading custom annual schedules with fail-closed date validation.',
      sections: [
        {
          heading: '1. CSV Format Requirements',
          paragraphs: [
            'MosqueSignage supports multi-dialect CSV headers. The importer recognizes columns such as "Date", "Day", "Fajr Adhan", "Fajr Iqamah", "Sunrise", "Dhuhr", "Asr", "Maghrib", and "Isha". Out-of-range dates or malformed time tokens fail closed safely without corrupting existing records.',
          ],
          steps: [
            'Open your annual prayer spreadsheet in Microsoft Excel or Google Sheets.',
            'Ensure dates use DD/MM/YYYY, MM/DD/YYYY, or YYYY-MM-DD format.',
            'Export or Save As a CSV (Comma Delimited) file.',
            'In the Admin Dashboard, click Prayer Times > Import Timetable CSV.',
            'Preview the mapped columns and click "Apply Annual Timetable".',
          ],
        },
      ],
    },
  },
  {
    slug: 'friday-jummah-khutbah-shifts',
    categoryId: 'prayer',
    question: 'How do multiple Friday Jummah Khutbah shifts work?',
    shortAnswer:
      'Configure multiple Friday shifts in Admin > Prayer Times > Friday Jummah. On Fridays, the display drawer replaces standard Dhuhr with labeled Khutbah cards, Adhan times, and Khateeb names.',
    isAccordion: false,
    isFeatured: true,
    tags: ['friday', 'jummah', 'khutbah', 'shifts', 'khateeb', 'dhuhr'],
    relatedSlugs: ['prayer-calculation-methods', 'poster-safe-zones-and-dimensions'],
    article: {
      title: 'Friday Jummah Multi-Khutbah Configuration & Broadcast',
      lastUpdated: '2026-11-03',
      summary:
        'Managing high-capacity Friday services with independent Adhan, Khutbah, and Salah countdowns.',
      sections: [
        {
          heading: '1. Community Khutbah Standardization',
          paragraphs: [
            'Many mosques conduct two or three consecutive Friday prayer services to accommodate large congregations. MosqueSignage uses standardized "Khutbah 1", "Khutbah 2" terminology and dynamically highlights the currently active shift on the display.',
          ],
          callout: {
            type: 'note',
            text: 'On Fridays, the display timetable drawer automatically switches its noon slot from standard Dhuhr to the full Friday Jummah schedule 2 hours prior to the first Khutbah.',
          },
        },
      ],
    },
  },
];

