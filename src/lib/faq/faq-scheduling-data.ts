import type { FaqItem } from './faq-types';

export const FAQ_SCHEDULING_ITEMS: readonly FaqItem[] = [
  {
    slug: 'poster-scheduling-and-recurring-windows',
    categoryId: 'media',
    question: 'How do I schedule posters for specific dates, recurring time windows (e.g. Fridays only), or expiration?',
    shortAnswer:
      'Set active start/end calendar dates or expand "Recurring Time Windows" in the poster editor to restrict display to specific days and hours (e.g. Fridays 11 AM - 2 PM). Out-of-window slides transition to standby automatically.',
    isAccordion: true,
    isFeatured: true,
    tags: [
      'scheduling',
      'recurring',
      'windows',
      'fridays',
      'expiration',
      'active dates',
      'standby',
      'rotation',
      'time slots',
    ],
    relatedSlugs: [
      'poster-safe-zones-and-dimensions',
      'instant-svg-announcement-slides',
      'multi-asset-poster-layouts',
    ],
    article: {
      title: 'Poster Scheduling: Date Ranges, Recurring Time Windows & Expiration',
      lastUpdated: '2026-11-23',
      summary:
        'A comprehensive guide to automating flyer visibility using start/end date ranges, recurring day/hour windows, and multi-rule schedules.',
      sections: [
        {
          heading: '1. Date Range Scheduling & Autonomous Expiration',
          paragraphs: [
            'Every community flyer or notice card can be configured with active date boundaries. By default, posters run continuously 24/7. However, setting an End Date guarantees that dated event flyers (such as fundraisers, guest lectures, or holiday banquets) automatically expire and disappear from rotation without manual intervention.',
          ],
          steps: [
            'In Admin > Posters & Notices, click edit on any flyer or notice.',
            'Under "Broadcast Schedule", configure the "Active From" and "Expires After" date inputs.',
            'When the expiration timestamp is reached, the slide gracefully exits the display carousel after finishing its current on-screen dwell duration.',
          ],
        },
        {
          heading: '2. Recurring Daily Time Windows & Day Presets',
          paragraphs: [
            'For recurring weekly events like Friday Jummah reminders, weekend youth halaqas, or Fajr breakfast notices, MosqueSignage provides a multi-rule recurring schedule builder.',
            'Rather than running 24/7, recurring rules restrict slide playback to specific days of the week and designated time intervals anchored to your venue timezone.',
          ],
          steps: [
            'In the poster editor, expand the "Recurring Schedule (Optional)" accordion.',
            'Select "Recurring Windows" instead of "All Day Continuous".',
            'Use quick day presets ("Fridays Only", "Weekends", "Weekdays", "All Days") or tap individual day chips.',
            'Set the active time window (e.g. 11:00 to 14:30) using 24-hour time pickers.',
            'Add additional rules if your event takes place across multiple non-consecutive shifts.',
          ],
          callout: {
            type: 'tip',
            text: 'If multiple rules overlap on the same day (e.g. 10:00-12:00 and 11:00-14:00), MosqueSignage flags the overlap and offers a 1-click "Merge Rules" button to union the intervals cleanly.',
          },
        },
        {
          heading: '3. Real-Time Admin Badging & Public Privacy Guards',
          paragraphs: [
            'The administrative poster table and card grid provide real-time visual telemetry for scheduled media: an emerald pulsing dot indicates "Active (Recurring)" while an amber dot displays "Standby (Next: Fri 11:00 AM)".',
            'Public kiosk endpoints strictly filter out inactive standby slides, preventing un-scheduled announcements from leaking before their designated broadcast window.',
          ],
        },
      ],
    },
  },
];
