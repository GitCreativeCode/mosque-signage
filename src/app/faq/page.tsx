import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ExternalLink, ArrowRight } from 'lucide-react';
import { SiteFooter } from '@/components/common/SiteFooter';
import { PublicHeader } from '@/components/common/PublicHeader';
import { HelpdeskSupportCard } from '@/components/common/HelpdeskSupportCard';
import { FAQ_ITEMS, FAQ_CATEGORIES } from '@/lib/faq/faq-data';
import { FaqSearchSection } from '@/components/faq/FaqSearchSection';

export const metadata: Metadata = {
  title: 'Frequently Asked Questions | MosqueSignage',
  description: 'Hardware deployment guides, liturgical calculation details, and troubleshooting documentation for MosqueSignage.',
};

export default function FaqPage() {
  return (
    <div className="min-h-screen bg-[var(--admin-bg)] text-[var(--admin-text-primary)] flex flex-col font-sans selection:bg-[var(--admin-accent)]/20">
      {/* Top Application Header with Theme Switcher */}
      <PublicHeader subtitle="Frequently Asked Questions" />

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-10 space-y-12">
        {/* Page Hero */}
        <div className="space-y-4 border-b border-[var(--admin-border)] pb-8 text-center sm:text-left">
          <div className="space-y-2 max-w-2xl">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--admin-text-primary)]">
              Frequently Asked Questions
            </h1>
            <p className="text-xs sm:text-sm text-[var(--admin-text-secondary)] leading-relaxed">
              Clear guides for mosque staff, imams, and facility technicians covering kiosk hardware, timetable math, flyer guidelines, and admin access.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-1">
            <Link
              href="/admin"
              className="px-4 py-2 rounded-xl bg-[var(--admin-btn-primary-bg)] hover:bg-[var(--admin-btn-primary-hover)] text-[var(--admin-btn-primary-text)] font-semibold text-xs transition shadow-xs"
            >
              Open Admin Dashboard
            </Link>
            <a
              href="/display"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl border border-[var(--admin-btn-secondary-border)] bg-[var(--admin-btn-secondary-bg)] hover:bg-[var(--admin-btn-secondary-hover)] text-[var(--admin-btn-secondary-text)] font-semibold text-xs flex items-center space-x-1.5 transition shadow-xs"
            >
              <span>Launch Live Display</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-70" />
            </a>
          </div>
        </div>

        {/* Centered Search Bar & Common Questions Accordion */}
        <Suspense
          fallback={
            <div className="p-8 text-center text-xs text-[var(--admin-text-muted)] animate-pulse">
              Loading knowledge base...
            </div>
          }
        >
          <FaqSearchSection items={FAQ_ITEMS} categories={FAQ_CATEGORIES} />
        </Suspense>

        {/* Browse by Category: Minimalist Documentation Directory */}
        <section className="space-y-6 pt-6 border-t border-[var(--admin-border)]">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--admin-text-muted)]">
              Browse by Category
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {FAQ_CATEGORIES.map((cat) => {
              const categoryItems = FAQ_ITEMS.filter((i) => i.categoryId === cat.id);

              return (
                <div key={cat.id} className="space-y-3">
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-[var(--admin-text-primary)]">
                      {cat.title}
                    </h3>
                    <p className="text-xs text-[var(--admin-text-muted)] leading-relaxed">
                      {cat.description}
                    </p>
                  </div>

                  <ul className="space-y-2 pt-1 border-t border-[var(--admin-border)]/60">
                    {categoryItems.map((item) => (
                      <li key={item.slug}>
                        <Link
                          href={`/faq/${item.slug}`}
                          className="text-xs sm:text-sm text-[var(--admin-text-secondary)] hover:text-green-700 dark:hover:text-green-400 hover:underline underline-offset-4 flex items-center justify-between py-1 transition group"
                        >
                          <span className="pr-3 leading-snug">{item.question}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-[var(--admin-text-muted)] group-hover:text-green-600 dark:group-hover:text-green-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </section>

        {/* Operational Cheatsheet Helper */}
        <div className="p-5 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] text-xs text-[var(--admin-text-muted)] space-y-1.5">
          <p className="font-semibold text-[var(--admin-text-primary)]">
            Looking for command-line instructions or offline manuals?
          </p>
          <p className="leading-relaxed">
            A single-page operational guide is available in <code className="font-mono text-[11px] text-green-700 dark:text-green-400">docs/admin-handbook.md</code> for immediate PIN reset commands, SQLite hot backups, and Windows autostart shortcuts.
          </p>
        </div>

        {/* Community Helpdesk & Feedback Support Banner */}
        <HelpdeskSupportCard />
      </main>

      {/* Global Site Footer */}
      <SiteFooter />
    </div>
  );
}
