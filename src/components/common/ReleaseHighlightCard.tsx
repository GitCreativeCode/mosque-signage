import React from 'react';
import { Calendar, Download, ExternalLink, Tag } from 'lucide-react';
import type { ReleaseLogItem } from '@/lib/system/version';

export interface ReleaseHighlightCardProps {
  readonly release: ReleaseLogItem;
  readonly repoSlug: string;
}

function ReleaseBulletSection({ title, items }: { title: string; items?: readonly string[] | undefined }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="space-y-2.5">
      <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--admin-text-primary)]">{title}</h3>
      <ul className="space-y-1.5 pl-4 list-disc text-xs sm:text-sm text-[var(--admin-text-secondary)] leading-relaxed marker:text-green-600 dark:marker:text-green-400">
        {items.map((item, idx) => (
          <li key={idx} className="pl-1">{item}</li>
        ))}
      </ul>
    </div>
  );
}

export function ReleaseHighlightCard({ release, repoSlug }: ReleaseHighlightCardProps) {
  return (
    <article className="rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-6 sm:p-8 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--admin-border)]/60 pb-5">
        <div className="flex items-center space-x-3">
          <span className="px-3 py-1 rounded-xl bg-green-600/10 border border-green-600/25 text-green-700 dark:text-green-400 font-mono font-bold text-sm">
            v{release.version}
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-[var(--admin-surface)] border border-[var(--admin-border)] text-[11px] font-semibold text-[var(--admin-text-secondary)]">
            Latest Stable
          </span>
        </div>
        <div className="flex items-center space-x-4 text-xs text-[var(--admin-text-muted)]">
          <span className="flex items-center space-x-1.5"><Calendar className="w-3.5 h-3.5" /><span>{release.date}</span></span>
          <a href={`https://github.com/${repoSlug}/releases/tag/v${release.version}`} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-1 text-green-700 dark:text-green-400 hover:underline underline-offset-4 font-semibold transition">
            <Tag className="w-3.5 h-3.5" /><span>GitHub Tag</span>
          </a>
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-bold text-[var(--admin-text-primary)]">{release.title}</h2>
        {release.summary && <p className="text-xs sm:text-sm text-[var(--admin-text-secondary)] leading-relaxed">{release.summary}</p>}
      </div>

      <div className="space-y-6 pt-2">
        {release.sections && release.sections.length > 0 ? (
          release.sections.map((section, idx) => (
            <ReleaseBulletSection key={idx} title={section.title} items={section.items} />
          ))
        ) : (
          <>
            <ReleaseBulletSection title="New Features" items={release.features} />
            <ReleaseBulletSection title="Improvements & Polish" items={release.improvements} />
            <ReleaseBulletSection title="Fixes & Security Hardening" items={release.fixes} />
          </>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-[var(--admin-border)]/60 text-xs">
        <a href={`https://github.com/${repoSlug}/archive/refs/tags/v${release.version}.zip`} className="inline-flex items-center space-x-1.5 text-green-700 dark:text-green-400 hover:underline underline-offset-4 font-semibold">
          <Download className="w-3.5 h-3.5" /><span>Download Source (.zip)</span>
        </a>
        <a href={`https://github.com/${repoSlug}/releases/tag/v${release.version}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center space-x-1 text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)] hover:underline underline-offset-4 font-medium transition">
          <span>View Release on GitHub</span><ExternalLink className="w-3.5 h-3.5 opacity-70" />
        </a>
      </div>
    </article>
  );
}

