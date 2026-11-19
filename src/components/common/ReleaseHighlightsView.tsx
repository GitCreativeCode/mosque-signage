'use client';

import React from 'react';
import { Sparkles, ChevronRight } from 'lucide-react';

export interface ReleaseHighlightsViewProps {
  readonly title?: string | undefined;
  readonly body?: string | undefined;
}

interface ParsedSection {
  heading?: string;
  items: string[];
}

/**
 * Strips HTML tags, technical offline asset details, and horizontal rules from GitHub markdown.
 */
export function sanitizeReleaseMarkdown(rawMarkdown: string): string {
  if (!rawMarkdown) return '';

  return rawMarkdown
    // Strip <details>...</details> blocks entirely (technical offline archive info)
    .replace(/<details[\s\S]*?<\/details>/gi, '')
    // Strip remaining HTML tags like <summary>, </summary>, <br>, etc.
    .replace(/<\/?[^>]+(>|$)/g, '')
    // Strip markdown horizontal rules (---, ***, ___)
    .replace(/^(\s*[-*_]\s*){3,}$/gm, '')
    .trim();
}

/**
 * Parses cleaned release markdown into sections with headings and bullet lists.
 */
export function parseReleaseSections(sanitized: string): ParsedSection[] {
  if (!sanitized) return [];

  const lines = sanitized.split(/\r?\n/);
  const sections: ParsedSection[] = [];
  let currentSection: ParsedSection = { items: [] };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // Check for section headings: # Heading, ## Heading, ### Heading
    const headingMatch = line.match(/^#{1,4}\s+(.+)$/);
    if (headingMatch && headingMatch[1]) {
      if (currentSection.heading || currentSection.items.length > 0) {
        sections.push(currentSection);
      }
      currentSection = { heading: headingMatch[1].trim(), items: [] };
      continue;
    }

    // Check for bullet points: - item, * item, • item, or numbered 1. item
    const bulletMatch = line.match(/^[-*•]\s+(.+)$/) || line.match(/^\d+\.\s+(.+)$/);
    if (bulletMatch && bulletMatch[1]) {
      currentSection.items.push(bulletMatch[1].trim());
    } else {
      // Regular text paragraph
      currentSection.items.push(line);
    }
  }

  if (currentSection.heading || currentSection.items.length > 0) {
    sections.push(currentSection);
  }

  return sections;
}

/**
 * Helper to render inline **bold** text.
 */
function renderInlineMarkdown(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={idx} className="font-semibold text-[var(--admin-text-primary)]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={idx}>{part}</span>;
  });
}

/**
 * Renders structured, clean release highlights in place of raw monospace markdown.
 */
export function ReleaseHighlightsView({ title, body }: ReleaseHighlightsViewProps) {
  const sanitized = sanitizeReleaseMarkdown(
    body || 'Includes performance optimizations, security hardening, and liturgical calculation adjustments.'
  );
  const sections = parseReleaseSections(sanitized);

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-1.5 text-xs font-bold text-[var(--admin-text-muted)] uppercase tracking-wider">
        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
        <span>Release Highlights</span>
      </div>

      <div className="p-4 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)]/60 text-xs text-[var(--admin-text-secondary)] space-y-4 max-h-52 overflow-y-auto leading-relaxed">
        {title && (
          <p className="font-bold text-[var(--admin-text-primary)] text-sm pb-1 border-b border-[var(--admin-border)]/60">
            {title}
          </p>
        )}

        {sections.length === 0 ? (
          <p className="text-[11px] text-[var(--admin-text-muted)] italic">No release notes provided.</p>
        ) : (
          sections.map((sec, secIdx) => (
            <div key={secIdx} className="space-y-2">
              {sec.heading && (
                <div className="inline-flex items-center px-2 py-0.5 rounded-md bg-[var(--admin-card)] border border-[var(--admin-border)] text-[11px] font-semibold text-[var(--admin-text-primary)]">
                  {sec.heading}
                </div>
              )}
              <ul className="space-y-1.5 pl-0.5">
                {sec.items.map((item, itemIdx) => (
                  <li key={itemIdx} className="flex items-start space-x-2 text-[11px]">
                    <ChevronRight className="w-3 h-3 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                    <span className="leading-snug">{renderInlineMarkdown(item)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

