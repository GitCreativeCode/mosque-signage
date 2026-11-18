import React from 'react';
import type { Metadata } from 'next';
import { SiteFooter } from '@/components/common/SiteFooter';
import { PublicHeader } from '@/components/common/PublicHeader';
import { HelpdeskSupportCard } from '@/components/common/HelpdeskSupportCard';

export const metadata: Metadata = {
  title: 'Terms of Use | MosqueSignage',
  description: 'Terms of use, prayer calculation disclaimer, and community content guidelines for MosqueSignage.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[var(--admin-bg)] text-[var(--admin-text-primary)] flex flex-col font-sans selection:bg-[var(--admin-accent)]/20">
      <PublicHeader subtitle="Terms of Use" />

      {/* Main Legal Content Container - Flat clean reading typography */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-6 py-12 space-y-8">
        {/* Page Title & Intro */}
        <div className="space-y-2 border-b border-[var(--admin-border)] pb-6">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--admin-text-primary)]">
            Terms of Use
          </h2>
          <p className="text-xs text-[var(--admin-text-muted)]">
            Last updated: October 2026
          </p>
          <p className="text-sm text-[var(--admin-text-secondary)] leading-relaxed pt-2">
            These terms describe the guidelines, disclaimers, and responsibilities associated with running and viewing the MosqueSignage digital display system.
          </p>
        </div>

        {/* Section 1: Purpose & Permitted Use */}
        <section className="space-y-3">
          <h3 className="text-base font-bold text-[var(--admin-text-primary)]">
            1. Purpose and permitted use
          </h3>
          <p className="text-sm text-[var(--admin-text-secondary)] leading-relaxed">
            MosqueSignage is built to help mosques, Islamic centers, and non-profit community facilities share daily prayer schedules, Friday services, and community notices on digital screens.
          </p>
          <p className="text-sm text-[var(--admin-text-secondary)] leading-relaxed">
            The software is meant for community presentation and informational display. It should be used in a manner that serves the congregation and respects the peaceful ambiance of the facility.
          </p>
        </section>

        {/* Section 2: Prayer Calculations & Religious Authority */}
        <section className="space-y-3">
          <h3 className="text-base font-bold text-[var(--admin-text-primary)]">
            2. Prayer times and religious authority
          </h3>
          <p className="text-sm text-[var(--admin-text-secondary)] leading-relaxed">
            The software calculates Adhan times using well-established astronomical calculation methods (such as the Islamic Society of North America, Muslim World League, or Egyptian General Authority).
          </p>
          <p className="text-sm text-[var(--admin-text-secondary)] leading-relaxed">
            Because astronomical calculations are mathematical estimates based on solar angles, your mosque&apos;s Imam, religious committee, or leadership maintains final authority over congregation prayer and Iqamah schedules. The software provides built-in tools—including manual overrides, offset rules, and custom CSV schedule imports—to ensure your display accurately reflects your community&apos;s liturgical decisions.
          </p>
        </section>

        {/* Section 3: Content Responsibility */}
        <section className="space-y-3">
          <h3 className="text-base font-bold text-[var(--admin-text-primary)]">
            3. Uploaded posters and announcements
          </h3>
          <p className="text-sm text-[var(--admin-text-secondary)] leading-relaxed">
            Authorized administrators can upload event flyers, class schedules, and notices to rotate on the display screen.
          </p>
          <p className="text-sm text-[var(--admin-text-secondary)] leading-relaxed">
            The venue administration is responsible for ensuring that all uploaded images and text are appropriate for a place of worship, respect intellectual property and copyright rules, and do not contain misleading or harmful content.
          </p>
        </section>

        {/* Section 4: Display Hardware and Automation */}
        <section className="space-y-3">
          <h3 className="text-base font-bold text-[var(--admin-text-primary)]">
            4. Hardware controls and automation
          </h3>
          <p className="text-sm text-[var(--admin-text-secondary)] leading-relaxed">
            MosqueSignage includes optional features to automate connected display hardware, such as turning screens on before Fajr and into standby after Isha.
          </p>
          <p className="text-sm text-[var(--admin-text-secondary)] leading-relaxed">
            While these features are designed for energy savings and convenience, organizations are responsible for ensuring their TVs, mini PCs, power cables, and mountings are properly installed and operated safely.
          </p>
        </section>

        {/* Section 5: Software Disclaimer */}
        <section className="space-y-3">
          <h3 className="text-base font-bold text-[var(--admin-text-primary)]">
            5. Software disclaimer and limitation of liability
          </h3>
          <p className="text-sm text-[var(--admin-text-secondary)] leading-relaxed">
            This software is provided on an &quot;as is&quot; and &quot;as available&quot; basis. While every care has been taken to make the software reliable, offline-resilient, and accurate, the developers and contributors are not liable for any technical outages, hardware wear, scheduling misunderstandings, or indirect issues arising from the use of the system.
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
