import type { FaqItem } from './faq-types';
import { FAQ_DISPLAY_MODES_ITEMS } from './faq-display-modes-data';

const BASE_HARDWARE_ITEMS: readonly FaqItem[] = [
  {
    slug: 'kiosk-dual-monitor-setup',
    categoryId: 'hardware',
    question: 'How do I configure display screens and locked fullscreen kiosk mode across Windows, Linux, and macOS?',
    shortAnswer:
      'MosqueSignage works on any modern browser (Edge or Chrome recommended for kiosk flags). On Windows, configure Extended Desktop and run "npm run autostart -- --display". On Linux/Raspberry Pi, use Chromium autostart desktop entries. On macOS, use Chrome kiosk flags and Login Items.',
    isAccordion: true,
    isFeatured: true,
    tags: [
      'kiosk',
      'windows',
      'linux',
      'macos',
      'raspberry pi',
      'chrome',
      'edge',
      'dual monitor',
      'hardware',
      'autostart',
      'display',
      'lan',
    ],
    relatedSlugs: [
      'display-pairing-and-screen-security',
      'screen-burn-in-sleep-timers',
      'poster-safe-zones-and-dimensions',
      'developer-kiosk-simulator',
    ],
    article: {
      title: 'Multi-Platform Display Setup & Fullscreen Kiosk Mode (Windows, Linux, macOS)',
      lastUpdated: '2026-11-23',
      summary:
        'A comprehensive guide for mosques operating MosqueSignage via direct HDMI or dedicated networked devices across Windows, Linux (Raspberry Pi), and macOS.',
      sections: [
        {
          heading: '1. Architecture & Deployment Topologies',
          paragraphs: [
            'MosqueSignage supports two primary physical deployment architectures for community centers and mosques:',
            'Topology A (Direct HDMI): A single desktop or laptop powers both the admin desk workflow (Monitor 1) and drives the prayer hall TV (Monitor 2) over an HDMI or DisplayPort cable using Extended Desktop mode.',
            'Topology B (Network Mini-PC or Smart TV): The MosqueSignage server runs on an office desktop, while dedicated micro-PCs (Intel N100, Raspberry Pi 4/5) or Smart TVs mount directly behind prayer hall screens, streaming the display over local Wi-Fi or LAN.',
          ],
          image: {
            src: '/faq/kiosk-hardware-setup.svg',
            alt: 'Hardware Deployment Topology: Direct HDMI and LAN Network Display',
            caption: 'Hardware deployment topologies: Direct HDMI extended desktop vs. dedicated micro-PC / Smart TV connected over local LAN.',
            width: 960,
            height: 540,
          },
        },
        {
          heading: '2. Browser Compatibility & Fullscreen Kiosk Flags',
          paragraphs: [
            'MosqueSignage works with any modern web browser: Microsoft Edge, Google Chrome, Chromium, Mozilla Firefox, and Apple Safari.',
            'Microsoft Edge and Google Chrome/Chromium are recommended for unattended prayer hall displays because they natively support locked fullscreen kiosk flags (--kiosk --no-first-run --disable-pinch). These flags hide the address bar, window frames, and cursor popups while preventing visitors from closing or minimizing the signage.',
          ],
        },
        {
          heading: '3. Operating System Setup & Autostart Automation',
          paragraphs: [
            'Follow the instructions below for your venue operating system to ensure the display launches automatically on computer boot:',
          ],
          steps: [
            'Windows: Press Win + P, select "Extend", and ensure Monitor 2 is set to 1920x1080 at 100% scaling. In your project terminal, run "npm run autostart -- --display" to register an automated startup shortcut that boots the local server and opens your browser in locked kiosk mode on Monitor 2. (Use "npm run autostart -- --server" for headless background server mode).',
            'Linux / Raspberry Pi OS: For a dedicated display client, create ~/.config/autostart/mosque-signage-display.desktop containing: Exec=chromium-browser --kiosk --noerrdialogs --disable-infobars http://<SERVER-IP>:3000/display. On host servers, launch via ./start-signage.sh or a systemd service.',
            'macOS: Open System Settings > Displays, set the prayer hall TV to "Extended Display" at 1080p, and launch Chrome via: open -a "Google Chrome" --args --kiosk http://localhost:3000/display. Add start-signage.sh to System Settings > General > Login Items.',
          ],
          callout: {
            type: 'tip',
            text: 'You can check your Windows autostart configuration anytime by running "npm run autostart -- --status" or disable it with "npm run autostart -- --remove".',
          },
        },
      ],
    },
  },
  {
    slug: 'screen-burn-in-sleep-timers',
    categoryId: 'hardware',
    question: 'How do automatic HDMI-CEC and DPMS screen sleep schedules work?',
    shortAnswer:
      'Configure auto-power schedules in Admin > Settings > Hardware to put displays into deep standby at night (fixed clock times or relative to Fajr/Isha), saving electricity and eliminating OLED burn-in.',
    isAccordion: true,
    isFeatured: false,
    tags: ['cec', 'dpms', 'burn in', 'oled', 'sleep', 'power', 'standby', 'energy'],
    relatedSlugs: ['kiosk-dual-monitor-setup', 'prayer-calculation-methods'],
    article: {
      title: 'Automated Display Power Management & OLED Burn-In Prevention',
      lastUpdated: '2026-11-03',
      summary:
        'Technical overview of HDMI-CEC (Raspberry Pi/Linux) and DPMS (Windows) screen standby orchestration.',
      sections: [
        {
          heading: '1. Why Power Scheduling Matters',
          paragraphs: [
            'Display TVs operating 24 hours a day in prayer halls consume excess electricity and risk severe LED/OLED phosphor burn-in. MosqueSignage features an integrated auto-power engine supporting both fixed wall-clock times and liturgical offsets (e.g., wake 30 minutes before Fajr, sleep 45 minutes after Isha).',
          ],
        },
        {
          heading: '2. Protocol Execution by Platform',
          paragraphs: [
            'On Linux and Raspberry Pi, MosqueSignage uses native HDMI-CEC commands via cec-client (tx 10 36 for standby, tx 10 04 for wake). On Windows, DPMS monitor power states are synchronized with an OLED pitch-black standby canvas featuring a faint 8% clock and burn-in pixel shifting.',
          ],
          callout: {
            type: 'note',
            text: 'When in standby, pressing any key or clicking the screen snoozes standby for 60 seconds so technicians can inspect the display during off hours.',
          },
        },
      ],
    },
  },
];

export const FAQ_HARDWARE_ITEMS: readonly FaqItem[] = [
  ...BASE_HARDWARE_ITEMS,
  ...FAQ_DISPLAY_MODES_ITEMS,
];


