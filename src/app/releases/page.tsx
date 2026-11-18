import React from 'react';
import type { Metadata } from 'next';
import { SiteFooter } from '@/components/common/SiteFooter';
import { PublicHeader } from '@/components/common/PublicHeader';
import { ReleaseHighlightCard } from '@/components/common/ReleaseHighlightCard';
import { APP_VERSION, DEFAULT_GITHUB_REPO, OFFICIAL_RELEASE_HISTORY } from '@/lib/system/version';

export const metadata: Metadata = {
  title: 'Releases & Changelog | MosqueSignage',
  description: 'Chronological release notes, liturgical calculation upgrades, and security improvements for MosqueSignage.',
};

export default function ReleasesPage() {
  const repoSlug = process.env['GITHUB_REPO'] || DEFAULT_GITHUB_REPO;
  const latestRelease = OFFICIAL_RELEASE_HISTORY[0];
  const pastReleases = OFFICIAL_RELEASE_HISTORY.slice(1);

  return (
    <div className="min-h-screen bg-[var(--admin-bg)] text-[var(--admin-text-primary)] flex flex-col font-sans selection:bg-[var(--admin-accent)]/20">
      <PublicHeader subtitle="Releases & Changelog" />

      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-10 space-y-12">
        <div className="space-y-3 border-b border-[var(--admin-border)] pb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--admin-text-primary)]">Releases &amp; Changelog</h1>
          <p className="text-xs sm:text-sm text-[var(--admin-text-secondary)] max-w-2xl leading-relaxed">
            All updates and milestones for the MosqueSignage digital signage appliance. Built local-first for 24/7 reliability in community centers and prayer halls.
          </p>
        </div>

        {latestRelease && (
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--admin-text-muted)]">Latest Release</span>
              <span className="text-xs text-[var(--admin-text-muted)] font-mono">Current Installed: v{APP_VERSION}</span>
            </div>
            <ReleaseHighlightCard release={latestRelease} repoSlug={repoSlug} />
          </section>
        )}

        {pastReleases.length > 0 && (
          <section className="space-y-6 pt-4 border-t border-[var(--admin-border)]">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--admin-text-muted)]">Previous Releases</h2>
            <div className="space-y-6">
              {pastReleases.map((rel) => (
                <article key={rel.version} className="rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-sm text-[var(--admin-text-primary)]">v{rel.version}</span>
                    <span className="text-xs text-[var(--admin-text-muted)]">{rel.date}</span>
                  </div>
                  <h3 className="text-sm font-bold text-[var(--admin-text-primary)]">{rel.title}</h3>
                  <ul className="pl-4 list-disc text-xs text-[var(--admin-text-secondary)] space-y-1">
                    {rel.highlights.map((h, i) => <li key={i}>{h}</li>)}
                  </ul>
                </article>
              ))}
            </div>
          </section>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
