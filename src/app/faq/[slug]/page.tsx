import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, Calendar } from 'lucide-react';
import { SiteFooter } from '@/components/common/SiteFooter';
import { PublicHeader } from '@/components/common/PublicHeader';
import { HelpdeskSupportCard } from '@/components/common/HelpdeskSupportCard';
import { FaqArticleBody } from '@/components/faq/FaqArticleBody';
import {
  FAQ_CATEGORIES,
  FAQ_ITEMS,
  getFaqItemBySlug,
  getRelatedFaqItems,
} from '@/lib/faq/faq-data';

export function generateStaticParams() {
  return FAQ_ITEMS.map((item) => ({ slug: item.slug }));
}

interface PageProps {
  readonly params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const item = getFaqItemBySlug(slug);
  if (!item) return { title: 'Article Not Found | MosqueSignage' };
  return { title: `${item.article.title} | MosqueSignage FAQ`, description: item.article.summary };
}

export default async function FaqArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const item = getFaqItemBySlug(slug);
  if (!item) notFound();

  const category = FAQ_CATEGORIES.find((c) => c.id === item.categoryId);
  const relatedItems = getRelatedFaqItems(item);

  return (
    <div className="min-h-screen bg-[var(--admin-bg)] text-[var(--admin-text-primary)] flex flex-col font-sans selection:bg-[var(--admin-accent)]/20">
      <PublicHeader subtitle="Knowledge Base" />

      <main className="flex-1 max-w-3xl w-full mx-auto px-6 py-10 space-y-10">
        <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-xs text-[var(--admin-text-muted)] flex-wrap">
          <Link href="/faq" className="hover:text-[var(--admin-text-primary)] hover:underline underline-offset-4 transition">FAQ</Link>
          <span className="text-[var(--admin-border)]">/</span>
          {category && (
            <Link href={`/faq?category=${category.id}`} className="hover:text-[var(--admin-text-primary)] hover:underline underline-offset-4 text-[var(--admin-text-secondary)] transition font-medium">
              {category.title}
            </Link>
          )}
          <span className="text-[var(--admin-border)]">/</span>
          <span className="text-[var(--admin-text-primary)] font-semibold truncate max-w-[200px] sm:max-w-xs">{item.article.title}</span>
        </nav>

        <header className="space-y-4 border-b border-[var(--admin-border)] pb-8">
          <div className="flex items-center space-x-3 text-xs">
            {category && (
              <Link href={`/faq?category=${category.id}`} className="px-2.5 py-0.5 rounded-full bg-[var(--admin-surface)] border border-[var(--admin-border)] font-semibold text-green-700 dark:text-green-400 hover:underline underline-offset-4 transition">
                {category.badge}
              </Link>
            )}
            <span className="flex items-center space-x-1.5 text-[var(--admin-text-muted)]">
              <Calendar className="w-3.5 h-3.5" />
              <span>Updated {item.article.lastUpdated}</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--admin-text-primary)] leading-tight">{item.article.title}</h1>
          <p className="text-sm text-[var(--admin-text-secondary)] leading-relaxed">{item.article.summary}</p>
        </header>

        <FaqArticleBody sections={item.article.sections} />

        {relatedItems.length > 0 && (
          <section className="space-y-4 pt-8 border-t border-[var(--admin-border)]">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--admin-text-muted)]">Related Questions</h2>
            <ul className="divide-y divide-[var(--admin-border)]/60">
              {relatedItems.map((rel) => (
                <li key={rel.slug} className="py-3">
                  <Link href={`/faq/${rel.slug}`} className="flex items-center justify-between gap-4 group">
                    <div className="space-y-0.5">
                      <p className="text-xs sm:text-sm font-semibold text-[var(--admin-text-primary)] group-hover:text-green-700 dark:group-hover:text-green-400 group-hover:underline underline-offset-4 transition">{rel.question}</p>
                      <p className="text-xs text-[var(--admin-text-muted)] line-clamp-1">{rel.shortAnswer}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[var(--admin-text-muted)] group-hover:text-green-600 dark:group-hover:text-green-400 group-hover:translate-x-1 transition-transform shrink-0" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Community Helpdesk & Feedback Support Banner */}
        <HelpdeskSupportCard />

        <div className="pt-4 border-t border-[var(--admin-border)] flex items-center justify-between text-xs">
          <Link href="/faq" className="inline-flex items-center space-x-1.5 text-[var(--admin-text-secondary)] hover:text-[var(--admin-text-primary)] hover:underline underline-offset-4 transition">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to All Questions</span>
          </Link>
          {category && (
            <Link href={`/faq?category=${category.id}`} className="text-green-700 dark:text-green-400 hover:underline underline-offset-4 transition font-semibold">
              Browse all {category.title} guides &rarr;
            </Link>
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
