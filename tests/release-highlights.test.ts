import { describe, it, expect } from 'vitest';
import {
  sanitizeReleaseMarkdown,
  parseReleaseSections,
} from '@/components/common/ReleaseHighlightsView';

describe('Release Highlights Markdown Formatter', () => {
  it('strips <details>...</details> technical offline archive blocks', () => {
    const raw = `
### New Features
- Added automatic update polling.

---
<details>
<summary>Automated Offline Archive Assets</summary>
SHA-256 Checksums:
abc123def456
</details>
`;
    const sanitized = sanitizeReleaseMarkdown(raw);
    expect(sanitized).not.toContain('<details>');
    expect(sanitized).not.toContain('Automated Offline Archive Assets');
    expect(sanitized).not.toContain('SHA-256 Checksums');
    expect(sanitized).toContain('New Features');
    expect(sanitized).toContain('Added automatic update polling.');
  });

  it('strips markdown horizontal rules (---, ***, ___)', () => {
    const raw = `
Section 1
---
Section 2
***
Section 3
___
`;
    const sanitized = sanitizeReleaseMarkdown(raw);
    expect(sanitized).not.toMatch(/^[ \t]*[-*_]{3,}[ \t]*$/m);
  });

  it('parses sections with headings and bullet items correctly', () => {
    const raw = `
### Visual Design & UI Enhancements
- **Dynamic Previews:** Instant real-time rendering.
- **Color Themes:** Curated liturgical themes.

### Bug Fixes
* Fixed SQLite migration path.
* Fixed production media 404s.
`;
    const sanitized = sanitizeReleaseMarkdown(raw);
    const sections = parseReleaseSections(sanitized);

    expect(sections.length).toBe(2);
    expect(sections[0]?.heading).toBe('Visual Design & UI Enhancements');
    expect(sections[0]?.items.length).toBe(2);
    expect(sections[0]?.items[0]).toContain('Dynamic Previews');

    expect(sections[1]?.heading).toBe('Bug Fixes');
    expect(sections[1]?.items.length).toBe(2);
    expect(sections[1]?.items[0]).toContain('Fixed SQLite migration path.');
  });

  it('handles empty or undefined inputs gracefully without throwing', () => {
    expect(sanitizeReleaseMarkdown('')).toBe('');
    expect(parseReleaseSections('')).toEqual([]);
  });
});

describe('Canonical Release Notes Formatter Script (release-notes-builder.ts)', () => {
  it('resolves release item for a specific version or defaults to latest', async () => {
    const { resolveReleaseItem } = await import('@/lib/system/release-notes-builder');
    const rel013 = resolveReleaseItem('0.1.3');
    expect(rel013.version).toBe('0.1.3');

    const latest = resolveReleaseItem();
    expect(latest.version).toBe('0.1.3');

    const fallback = resolveReleaseItem('999.0.0');
    expect(fallback.version).toBe('0.1.3');
  });

  it('builds canonical title prefixed with MosqueSignage', async () => {
    const { resolveReleaseItem, buildReleaseTitle } = await import('@/lib/system/release-notes-builder');
    const rel = resolveReleaseItem('0.1.3');
    const title = buildReleaseTitle(rel);
    expect(title).toBe('MosqueSignage v0.1.3 - Recurring Poster Schedules, Appliance Resiliency & Security Hardening');
  });

  it('generates full structured markdown layout matching on-site sections', async () => {
    const { resolveReleaseItem, buildReleaseNotesMarkdown } = await import('@/lib/system/release-notes-builder');
    const rel = resolveReleaseItem('0.1.3');
    const md = buildReleaseNotesMarkdown(rel, true);

    expect(md).toContain(rel.summary);
    expect(md).toContain('### Key Highlights');
    expect(md).toContain('Power-Loss WAL Recovery');
    expect(md).toContain('### Appliance Resiliency & Security Hardening');
    expect(md).toContain('### New Features');
    expect(md).toContain('### Improvements & Bug Fixes');
    expect(md).toContain('<details>');
    expect(md).toContain('How to Download, Run &amp; Configure Autostart');
    expect(md).toContain('How to Update from an Existing Installation');
  });
});

