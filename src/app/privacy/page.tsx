import React from 'react';
import type { Metadata } from 'next';
import { SiteFooter } from '@/components/common/SiteFooter';
import { PublicHeader } from '@/components/common/PublicHeader';
import { HelpdeskSupportCard } from '@/components/common/HelpdeskSupportCard';

export const metadata: Metadata = {
  title: 'Privacy Policy | MosqueSignage',
  description: 'Privacy policy and local-first data practices for MosqueSignage.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[var(--admin-bg)] text-[var(--admin-text-primary)] flex flex-col font-sans selection:bg-[var(--admin-accent)]/20">
      <PublicHeader subtitle="Privacy Policy" />

      {/* Main Content Container */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
        {/* Page Title & Intro */}
        <div className="space-y-2 border-b border-[var(--admin-border)] pb-6">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--admin-text-primary)]">
            Privacy Policy
          </h2>
          <p className="text-xs text-[var(--admin-text-muted)]">
            Last updated: November 2026
          </p>
          <p className="text-sm text-[var(--admin-text-secondary)] leading-relaxed pt-2">
            This policy outlines how MosqueSignage handles data. Because the software is self-hosted and local-first, your venue retains complete ownership and control of its information.
          </p>
        </div>

        {/* Section 1: Local-First Architecture */}
        <section className="space-y-3">
          <h3 className="text-base font-bold text-[var(--admin-text-primary)]">
            1. Local-first architecture
          </h3>
          <p className="text-sm text-[var(--admin-text-secondary)] leading-relaxed">
            MosqueSignage runs directly on the venue&apos;s own computer or mini PC. All schedules, media files, announcements, and configuration settings are stored exclusively on that local machine.
          </p>
          <p className="text-sm text-[var(--admin-text-secondary)] leading-relaxed">
            No data is uploaded to external cloud servers, and the software contains zero advertising, analytics, or user tracking tools.
          </p>
        </section>

        {/* Section 2: Data Processed Locally */}
        <section className="space-y-3">
          <h3 className="text-base font-bold text-[var(--admin-text-primary)]">
            2. Data processed locally
          </h3>
          <p className="text-sm text-[var(--admin-text-secondary)] leading-relaxed">
            The software only handles basic operational information necessary to render your display screens:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-sm text-[var(--admin-text-secondary)]">
            <li>
              <strong>Venue settings:</strong> Organization name, greeting text, timezone, and display layout preferences.
            </li>
            <li>
              <strong>Prayer and Jummah schedules:</strong> Calculation methods, Iqamah rules, custom timetable files, and Friday Khutbah timings. (Venues operating in Poster-Only mode do not store or calculate prayer times).
            </li>
            <li>
              <strong>Uploaded media and announcements:</strong> Event flyers, posters, looping videos, and scrolling news tickers uploaded by authorized staff.
            </li>
            <li>
              <strong>Admin login credentials:</strong> Passwords and PINs are securely hashed before storage. Plaintext passwords or PINs are never stored.
            </li>
            <li>
              <strong>Local screen pairing:</strong> Temporary numeric pairing codes used when connecting remote TV screens or tablets over your local Wi-Fi network.
            </li>
          </ul>
          <p className="text-sm text-[var(--admin-text-secondary)] leading-relaxed">
            The software does not collect, record, or track any personal information from congregation members, visitors, or students.
          </p>
        </section>

        {/* Section 3: Essential Cookies & Local Storage */}
        <section className="space-y-3">
          <h3 className="text-base font-bold text-[var(--admin-text-primary)]">
            3. Essential cookies and local storage
          </h3>
          <p className="text-sm text-[var(--admin-text-secondary)] leading-relaxed">
            MosqueSignage uses only the minimum browser storage necessary for the system to function:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-sm text-[var(--admin-text-secondary)]">
            <li>
              <strong>Admin session:</strong> A temporary, secure browser cookie that keeps administrators signed in after entering the correct PIN or password.
            </li>
            <li>
              <strong>Display preferences:</strong> Local browser storage that remembers interface preferences, such as your light or dark mode choice.
            </li>
          </ul>
          <p className="text-sm text-[var(--admin-text-secondary)] leading-relaxed">
            There are no third-party tracking cookies or marketing pixels.
          </p>
        </section>

        {/* Section 4: Network & Update Checks */}
        <section className="space-y-3">
          <h3 className="text-base font-bold text-[var(--admin-text-primary)]">
            4. Network communication and update checks
          </h3>
          <p className="text-sm text-[var(--admin-text-secondary)] leading-relaxed">
            All communication between the MosqueSignage server and your TV screens or administrative devices occurs strictly across your local network (LAN / Wi-Fi). The software can operate indefinitely without an active internet connection.
          </p>
          <p className="text-sm text-[var(--admin-text-secondary)] leading-relaxed">
            The only optional external network request is a periodic, read-only check to GitHub&apos;s public releases API (<code>api.github.com</code>) to see if a newer version of MosqueSignage is available. This check sends no personal or venue data, and fails silently without affecting displays if the computer is offline.
          </p>
        </section>

        {/* Section 5: Data Control & Deletion */}
        <section className="space-y-3">
          <h3 className="text-base font-bold text-[var(--admin-text-primary)]">
            5. Data control and deletion
          </h3>
          <p className="text-sm text-[var(--admin-text-secondary)] leading-relaxed">
            Because all database records and uploaded media reside on your own hardware, your venue has complete control over all data:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-sm text-[var(--admin-text-secondary)]">
            <li>Administrators can edit, replace, or permanently delete individual posters, schedule rows, and notices at any time through the admin panel.</li>
            <li>A Factory Reset tool is available in Settings, allowing administrators to export schedules to CSV and wipe all local database tables, uploaded files, and credentials back to defaults.</li>
          </ul>
        </section>

        {/* Section 6: Accessibility */}
        <section className="space-y-3">
          <h3 className="text-base font-bold text-[var(--admin-text-primary)]">
            6. Accessibility
          </h3>
          <p className="text-sm text-[var(--admin-text-secondary)] leading-relaxed">
            MosqueSignage display views and administrative pages follow WCAG 2.1 AA and AODA accessibility principles, including high-contrast color choices designed for reading from a distance, scalable layouts, and full keyboard navigation.
          </p>
        </section>

        {/* Section 7: Contact & Support */}
        <div id="contact" className="border-t border-[var(--admin-border)] pt-8">
          <HelpdeskSupportCard />
        </div>
      </main>

      {/* Global Site Footer */}
      <SiteFooter />
    </div>
  );
}
