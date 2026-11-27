import React from 'react';
import type { Metadata } from 'next';
import { SiteFooter } from '@/components/common/SiteFooter';
import { PublicHeader } from '@/components/common/PublicHeader';
import { HelpdeskSupportCard } from '@/components/common/HelpdeskSupportCard';

export const metadata: Metadata = {
  title: 'Terms of Use | MosqueSignage',
  description: 'Terms of use, licensing, and disclaimers for the MosqueSignage digital signage system.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[var(--admin-bg)] text-[var(--admin-text-primary)] flex flex-col font-sans selection:bg-[var(--admin-accent)]/20">
      <PublicHeader subtitle="Terms of Use" />

      {/* Main Content Container */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
        {/* Page Title & Intro */}
        <div className="space-y-2 border-b border-[var(--admin-border)] pb-6">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--admin-text-primary)]">
            Terms of Use
          </h2>
          <p className="text-xs text-[var(--admin-text-muted)]">
            Last updated: November 2026
          </p>
          <p className="text-sm text-[var(--admin-text-secondary)] leading-relaxed pt-2">
            These terms describe the scope, licensing, and practical disclaimers for using the MosqueSignage software.
          </p>
        </div>

        {/* Section 1: Scope of Software */}
        <section className="space-y-3">
          <h3 className="text-base font-bold text-[var(--admin-text-primary)]">
            1. Scope of the software
          </h3>
          <p className="text-sm text-[var(--admin-text-secondary)] leading-relaxed">
            MosqueSignage is self-hosted, local-first digital signage software designed for mosques, community centers, schools, and public halls. The software runs locally on your own computer or device (such as a mini PC or Raspberry Pi).
          </p>
          <p className="text-sm text-[var(--admin-text-secondary)] leading-relaxed">
            Venues can run MosqueSignage in standard Mosque mode (with prayer and Iqamah schedules) or in Poster-Only mode (for full-screen announcements without prayer times). Your venue is solely responsible for all images, announcements, flyers, links, and content displayed on your screens.
          </p>
        </section>

        {/* Section 2: Prayer Times & Religious Authority */}
        <section className="space-y-3">
          <h3 className="text-base font-bold text-[var(--admin-text-primary)]">
            2. Prayer times and religious authority
          </h3>
          <p className="text-sm text-[var(--admin-text-secondary)] leading-relaxed">
            When operating in Mosque mode, the software calculates prayer times using established astronomical methods. These calculations are mathematical estimates based on solar angles and geographical coordinates.
          </p>
          <p className="text-sm text-[var(--admin-text-secondary)] leading-relaxed">
            Your local mosque, Imam, or religious committee holds final authority over official congregation prayer and Iqamah schedules. The software provides built-in tools—such as minute offsets, manual day overrides, and custom CSV schedule imports—so you can match your display to your community&apos;s official timetable.
          </p>
        </section>

        {/* Section 3: Optional Hardware & Audio Integrations */}
        <section className="space-y-3">
          <h3 className="text-base font-bold text-[var(--admin-text-primary)]">
            3. Optional hardware and audio integrations
          </h3>
          <p className="text-sm text-[var(--admin-text-secondary)] leading-relaxed">
            MosqueSignage includes optional features to automate connected equipment, such as putting TVs into standby via HDMI-CEC or DPMS, and sending mute commands to local prayer hall audio receivers (such as Denon, Yamaha, or HTTP webhooks) during congregational prayer.
          </p>
          <p className="text-sm text-[var(--admin-text-secondary)] leading-relaxed">
            These features send commands over hardware ports and your local network to third-party equipment. Different TV models and audio receivers implement control protocols differently. Venues should test compatibility with their specific equipment and use these optional hardware automations at their own risk.
          </p>
        </section>

        {/* Section 4: Dual Licensing */}
        <section className="space-y-3">
          <h3 className="text-base font-bold text-[var(--admin-text-primary)]">
            4. Dual licensing (Open Source &amp; Commercial)
          </h3>
          <p className="text-sm text-[var(--admin-text-secondary)] leading-relaxed">
            MosqueSignage is available under two distinct licenses:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-sm text-[var(--admin-text-secondary)]">
            <li>
              <strong>Open Source (GNU GPLv3):</strong> The software is free to use, modify, and distribute under the GNU General Public License v3.0. If you modify and distribute the software to others, your modifications must also remain open source under the GPLv3.
            </li>
            <li>
              <strong>Commercial License:</strong> If you are a vendor, audiovisual integrator, or business wishing to distribute or white-label MosqueSignage as part of a closed-source or proprietary commercial product without GPLv3 copyleft requirements, please contact{' '}
              <a href="mailto:helpdesk.guidance@gmail.com" className="text-[var(--admin-accent)] hover:underline font-medium">
                helpdesk.guidance@gmail.com
              </a>{' '}
              to obtain a commercial license.
            </li>
          </ul>
        </section>

        {/* Section 5: Disclaimer of Warranty & Liability */}
        <section className="space-y-3">
          <h3 className="text-base font-bold text-[var(--admin-text-primary)]">
            5. Disclaimer of warranty and liability
          </h3>
          <p className="text-sm text-[var(--admin-text-secondary)] leading-relaxed">
            MosqueSignage is provided on an &quot;as is&quot; and &quot;as available&quot; basis, without warranty of any kind. While the project is built for 24/7 reliability and offline operation, the developers and contributors are not liable for any service interruptions, display downtime, missed prayers, hardware issues, or other damages arising from the use of the software.
          </p>
        </section>

        {/* Section 6: Contact & Support */}
        <div id="contact" className="border-t border-[var(--admin-border)] pt-8">
          <HelpdeskSupportCard />
        </div>
      </main>

      {/* Global Site Footer */}
      <SiteFooter />
    </div>
  );
}
