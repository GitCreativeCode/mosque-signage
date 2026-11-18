import type { FaqItem } from './faq-types';

export const FAQ_HARDWARE_ITEMS: readonly FaqItem[] = [
  {
    slug: 'kiosk-dual-monitor-setup',
    categoryId: 'hardware',
    question: 'How do I configure Windows Extended Desktop and Microsoft Edge Kiosk Mode?',
    shortAnswer:
      'Set Windows Display to Extend mode with Monitor 2 at 1920x1080 100% scaling, then run scripts/setup-autostart.ps1 to automatically launch Edge in locked fullscreen kiosk mode on PC startup.',
    isAccordion: true,
    isFeatured: true,
    tags: ['kiosk', 'windows', 'edge', 'dual monitor', 'hardware', 'autostart', 'display'],
    relatedSlugs: [
      'display-pairing-and-screen-security',
      'screen-burn-in-sleep-timers',
      'poster-safe-zones-and-dimensions',
      'developer-kiosk-simulator',
    ],
    article: {
      title: 'Windows Extended Desktop & Microsoft Edge Locked Kiosk Setup',
      lastUpdated: '2026-11-03',
      summary:
        'A comprehensive guide for mosques operating MosqueSignage from an office desktop PC while driving a dedicated 1080p prayer hall TV over HDMI.',
      sections: [
        {
          heading: '1. Architecture & Cabling Overview',
          paragraphs: [
            'In typical community centers and mosques, a single desktop PC in the administrative office powers both the admin workflow and the prayer hall TV. Windows Extended Desktop mode enables Monitor 1 (Desk) to remain on the management dashboard while Monitor 2 (Prayer Hall) runs the locked signage canvas.',
          ],
          image: {
            src: '/faq/kiosk-hardware-setup.svg',
            alt: 'Windows Extended Desktop & HDMI Cabling Schematic',
            caption: 'Hardware topology: Monitor 1 (Office Desk) and Monitor 2 (Prayer Hall TV) over high-speed HDMI/DP.',
            width: 960,
            height: 540,
          },
        },
        {
          heading: '2. Windows Display Settings Configuration',
          paragraphs: [
            'Before launching the kiosk script, Windows display topology must be configured accurately:',
          ],
          steps: [
            'Connect the prayer hall TV to your computer via HDMI or DisplayPort.',
            'Press Win + P on your keyboard and select "Extend".',
            'Right-click the Desktop and choose "Display settings".',
            'Select Monitor 1 (Desk) and check "Make this my main display".',
            'Select Monitor 2 (Prayer Hall TV), set Display Resolution to 1920 x 1080, and set Scale to 100%.',
          ],
          callout: {
            type: 'warning',
            text: 'Setting the scale to anything other than 100% (e.g. 125% or 150%) on Monitor 2 will cause subpixel font blurring and layout overflow.',
          },
        },
        {
          heading: '3. One-Click Windows Autostart Setup',
          paragraphs: [
            'MosqueSignage includes an automated PowerShell script that installs an autostart shortcut in your Windows Startup directory. Upon machine reboot (such as after a power outage or Windows update), the script polls the local Next.js server until healthy and opens Microsoft Edge on Monitor 2 in locked kiosk mode.',
          ],
          steps: [
            'Open PowerShell as Administrator in the project directory.',
            'Execute: powershell -ExecutionPolicy Bypass -File scripts\\setup-autostart.ps1',
            'The script registers "MosqueSignage-Kiosk.lnk" in your Windows Startup directory.',
            'To test immediately without rebooting, run: scripts\\launch-kiosk.bat',
          ],
          callout: {
            type: 'tip',
            text: 'Microsoft Edge runs with flags --kiosk --edge-kiosk-type=fullscreen --no-first-run --disable-pinch to prevent congregants from interacting with or closing the window.',
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

