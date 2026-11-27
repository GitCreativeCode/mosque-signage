'use client';

import React from 'react';

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
    // Strip actual HTML tags like <summary>, </summary>, <br>, etc., without matching math/comparisons like (< 2025)
    .replace(/<[a-zA-Z/][^>]*>/g, '')
    // Strip markdown horizontal rules (---, ***, ___)
    .replace(/^(\s*[-*_]\s*){3,}$/gm, '')
    .trim();
}

/**
 * Extracts the concise opening paragraph from sanitized GitHub release markdown,
 * falling back to the first non-heading line if no intro paragraph precedes headings.
 */
export function extractFirstReleaseParagraph(rawMarkdown: string): string {
  const sanitized = sanitizeReleaseMarkdown(rawMarkdown);
  if (!sanitized) return '';

  const lines = sanitized.split(/\r?\n/);
  const introLines: string[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      if (introLines.length > 0) break;
      continue;
    }

    const isHeading = /^#{1,4}\s+/.test(line);
    const isBullet = /^[-*•]\s+/.test(line) || /^\d+\.\s+/.test(line);
    if (isHeading || isBullet) {
      if (introLines.length > 0) break;
      continue;
    }

    introLines.push(line);
  }

  if (introLines.length > 0) {
    return introLines.join(' ');
  }

  // Fallback for releases that start directly with a heading and bullet list
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || /^#{1,4}\s+/.test(line)) continue;
    const bulletMatch = line.match(/^[-*•]\s+(.+)$/) || line.match(/^\d+\.\s+(.+)$/);
    return (bulletMatch?.[1] ?? line).trim();
  }

  return '';
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
 * Renders a concise release summary paragraph and directs administrators to GitHub for the full release notes.
 */
export function ReleaseHighlightsView({ title, body }: ReleaseHighlightsViewProps) {
  const summaryParagraph = extractFirstReleaseParagraph(
    body || 'Includes performance optimizations, security hardening, and liturgical calculation adjustments.'
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-1.5 text-xs font-bold text-[var(--admin-text-muted)] uppercase tracking-wider">
        <span>Release Summary</span>
      </div>

      <div className="p-4 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)]/60 text-xs text-[var(--admin-text-secondary)] space-y-2.5 leading-relaxed">
        {title && (
          <p className="font-bold text-[var(--admin-text-primary)] text-sm pb-1.5 border-b border-[var(--admin-border)]/60">
            {title}
          </p>
        )}

        {summaryParagraph ? (
          <p className="text-xs text-[var(--admin-text-secondary)] leading-relaxed">
            {renderInlineMarkdown(summaryParagraph)}
          </p>
        ) : (
          <p className="text-[11px] text-[var(--admin-text-muted)] italic">No release notes provided.</p>
        )}

        <p className="text-[11px] text-[var(--admin-text-muted)] pt-1">
          View the full release on GitHub below for complete feature details, bug fixes, and update instructions.
        </p>
      </div>
    </div>
  );
}

