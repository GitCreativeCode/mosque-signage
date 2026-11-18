import React from 'react';
import type { Metadata } from 'next';
import { SiteFooter } from '@/components/common/SiteFooter';
import { PublicHeader } from '@/components/common/PublicHeader';
import { HelpdeskSupportCard } from '@/components/common/HelpdeskSupportCard';

export const metadata: Metadata = {
  title: 'Privacy Policy | MosqueSignage',
  description: 'Privacy policy and data handling practices for MosqueSignage.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[var(--admin-bg)] text-[var(--admin-text-primary)] flex flex-col font-sans selection:bg-[var(--admin-accent)]/20">
      <PublicHeader subtitle="Privacy Policy" />

      {/* Main Legal Content Container - Flat clean reading typography */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-6 py-12 space-y-8">
        {/* Page Title & Intro */}
        <div className="space-y-2 border-b border-[var(--admin-border)] pb-6">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--admin-text-primary)]">
            Privacy Policy
          </h2>
          <p className="text-xs text-[var(--admin-text-muted)]">
            Last updated: October 2026
          </p>
          <p className="text-sm text-[var(--admin-text-secondary)] leading-relaxed pt-2">
            This policy outlines what information MosqueSignage uses, how it is handled, and how your privacy is protected. Our goal is to keep things simple, transparent, and respectful of your community.
          </p>
        </div>

        {/* Section 1: Overview */}
        <section className="space-y-3">
          <h3 className="text-base font-bold text-[var(--admin-text-primary)]">
            1. Everything stays on your local device
          </h3>
          <p className="text-sm text-[var(--admin-text-secondary)] leading-relaxed">
            MosqueSignage is built as a local-first system. That means all of your data—prayer schedules, flyers, announcements, and configuration settings—lives directly on the computer or server situated in your building.
          </p>
          <p className="text-sm text-[var(--admin-text-secondary)] leading-relaxed">
            We do not send your information to external cloud servers, we do not track visitors or congregants, and we do not run third-party advertising or analytics scripts. Your data stays entirely in your hands.
          </p>
        </section>

        {/* Section 2: What information is stored */}
        <section className="space-y-3">
          <h3 className="text-base font-bold text-[var(--admin-text-primary)]">
            2. What information the software uses
          </h3>
          <p className="text-sm text-[var(--admin-text-secondary)] leading-relaxed">
            The software only handles the basic details needed to operate the display screens:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-sm text-[var(--admin-text-secondary)]">
            <li>
              <strong>Venue settings:</strong> Basic display labels such as the mosque or center name, top bar greeting, and local time zone.
            </li>
            <li>
              <strong>Prayer timings:</strong> Calculation methods (such as ISNA or Muslim World League), custom Iqamah offsets, and any uploaded timetable spreadsheets.
            </li>
            <li>
              <strong>Community announcements:</strong> Event posters, flyer images, and scrolling news tickers uploaded by authorized staff.
            </li>
            <li>
              <strong>Friday prayer schedules:</strong> Shift timings and Khateeb names voluntarily added for Friday services.
            </li>
            <li>
              <strong>Security PIN:</strong> An encrypted, salted hash of your management PIN so unauthorized users cannot alter settings. We never store your PIN in plain text.
            </li>
          </ul>
          <p className="text-sm text-[var(--admin-text-secondary)] leading-relaxed">
            We do not collect names, email addresses, phone numbers, payment details, or attendance history from attendees.
          </p>
        </section>

        {/* Section 3: Cookies & browser storage */}
        <section className="space-y-3">
          <h3 className="text-base font-bold text-[var(--admin-text-primary)]">
            3. Cookies and browser storage
          </h3>
          <p className="text-sm text-[var(--admin-text-secondary)] leading-relaxed">
            We only use storage mechanisms strictly necessary for the system to work:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-sm text-[var(--admin-text-secondary)]">
            <li>
              <strong>Session cookie (mosque_admin_session):</strong> When an administrator logs into the control panel with the correct PIN, an encrypted session cookie is saved so they stay signed in. This cookie expires after 7 days and cannot be accessed by outside scripts.
            </li>
            <li>
              <strong>Theme preference (mosque_admin_theme):</strong> A simple browser storage value that remembers whether you prefer the light or dark appearance.
            </li>
          </ul>
          <p className="text-sm text-[var(--admin-text-secondary)] leading-relaxed">
            There are no marketing cookies, tracking pixels, or third-party advertising trackers.
          </p>
        </section>

        {/* Section 4: Data control and deletion */}
        <section className="space-y-3">
          <h3 className="text-base font-bold text-[var(--admin-text-primary)]">
            4. Managing and deleting your data
          </h3>
          <p className="text-sm text-[var(--admin-text-secondary)] leading-relaxed">
            Because all files and database tables are stored locally on your own machine, your organization maintains complete ownership. Authorized administrators can update, replace, or permanently delete any announcement, poster, or schedule entry at any time through the admin panel.
          </p>
        </section>

        {/* Section 5: Accessibility */}
        <section className="space-y-3">
          <h3 className="text-base font-bold text-[var(--admin-text-primary)]">
            5. Accessibility commitment
          </h3>
          <p className="text-sm text-[var(--admin-text-secondary)] leading-relaxed">
            We strive to make our software accessible and easy to read for everyone. Both the public display screens and administrative areas are designed with high-contrast color palettes, readable typography, keyboard navigation support, and clean semantic structure following standard accessibility guidelines (including WCAG 2.1 AA and AODA principles).
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
