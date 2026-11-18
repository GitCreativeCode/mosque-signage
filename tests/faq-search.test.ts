import { describe, it, expect } from 'vitest';
import {
  FAQ_CATEGORIES,
  FAQ_ITEMS,
  getFaqItemBySlug,
  getRelatedFaqItems,
} from '@/lib/faq/faq-data';
import { searchFaqItems } from '@/lib/faq/faq-search';

describe('FAQ Registry Integrity', () => {
  it('contains at least 11 comprehensive items across all 4 categories', () => {
    expect(FAQ_ITEMS.length).toBeGreaterThanOrEqual(11);
    expect(FAQ_CATEGORIES.length).toBe(4);

    const categoryIds = new Set(FAQ_CATEGORIES.map((c) => c.id));
    for (const item of FAQ_ITEMS) {
      expect(categoryIds.has(item.categoryId)).toBe(true);
      expect(item.slug).toBeTruthy();
      expect(item.question).toBeTruthy();
      expect(item.shortAnswer).toBeTruthy();
      expect(item.article.sections.length).toBeGreaterThan(0);
    }
  });

  it('guarantees remote access and security hardening slugs resolve properly', () => {
    const tailscale = getFaqItemBySlug('remote-tailscale-and-domain-access');
    expect(tailscale).toBeDefined();
    expect(tailscale?.categoryId).toBe('security');
    expect(tailscale?.isFeatured).toBe(true);

    const pairing = getFaqItemBySlug('display-pairing-and-screen-security');
    expect(pairing).toBeDefined();
    expect(pairing?.categoryId).toBe('security');
    expect(pairing?.isAccordion).toBe(true);

    const auth = getFaqItemBySlug('dual-mode-admin-authentication');
    expect(auth).toBeDefined();
    expect(auth?.categoryId).toBe('security');
    expect(auth?.isAccordion).toBe(true);
  });

  it('guarantees all relatedSlugs point to valid existing FAQ items', () => {
    const allSlugs = new Set(FAQ_ITEMS.map((item) => item.slug));

    for (const item of FAQ_ITEMS) {
      for (const relSlug of item.relatedSlugs) {
        expect(allSlugs.has(relSlug)).toBe(true);
      }
    }
  });

  it('verifies getFaqItemBySlug and getRelatedFaqItems behave deterministically', () => {
    const item = getFaqItemBySlug('kiosk-dual-monitor-setup');
    expect(item).toBeDefined();
    expect(item?.categoryId).toBe('hardware');

    const unknown = getFaqItemBySlug('non-existent-slug-xyz');
    expect(unknown).toBeUndefined();

    if (item) {
      const related = getRelatedFaqItems(item);
      expect(related.length).toBe(item.relatedSlugs.length);
      expect(related.every((r) => typeof r.slug === 'string')).toBe(true);
    }
  });

  it('validates embedded article images have alt text and valid paths', () => {
    for (const item of FAQ_ITEMS) {
      for (const section of item.article.sections) {
        if (section.image) {
          expect(section.image.src).toMatch(/^\/(faq|uploads)\//);
          expect(section.image.alt).toBeTruthy();
        }
      }
    }
  });
});

describe('FAQ Search & Ranking Algorithm', () => {
  it('returns empty array for empty or whitespace query', () => {
    expect(searchFaqItems('', FAQ_ITEMS)).toEqual([]);
    expect(searchFaqItems('   ', FAQ_ITEMS)).toEqual([]);
  });

  it('ranks exact question matches with the highest score', () => {
    const target = FAQ_ITEMS[0];
    if (!target) throw new Error('No items');

    const results = searchFaqItems(target.question, FAQ_ITEMS);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.item.slug).toBe(target.slug);
    expect(results[0]?.score).toBeGreaterThanOrEqual(100);
  });

  it('finds items by token and tag keywords', () => {
    const pinResults = searchFaqItems('pin lockout', FAQ_ITEMS);
    expect(pinResults.length).toBeGreaterThan(0);
    expect(pinResults.some((r) => r.item.slug === 'admin-pin-and-emergency-recovery')).toBe(true);

    const csvResults = searchFaqItems('csv timetable', FAQ_ITEMS);
    expect(csvResults.length).toBeGreaterThan(0);
    expect(csvResults.some((r) => r.item.slug === 'annual-csv-timetable-import')).toBe(true);

    const videoResults = searchFaqItems('looping video', FAQ_ITEMS);
    expect(videoResults.length).toBeGreaterThan(0);
    expect(videoResults.some((r) => r.item.slug === 'video-posters-and-looping')).toBe(true);

    const tailscaleResults = searchFaqItems('tailscale vpn', FAQ_ITEMS);
    expect(tailscaleResults.length).toBeGreaterThan(0);
    expect(tailscaleResults.some((r) => r.item.slug === 'remote-tailscale-and-domain-access')).toBe(true);

    const pairingResults = searchFaqItems('display pairing access key', FAQ_ITEMS);
    expect(pairingResults.length).toBeGreaterThan(0);
    expect(pairingResults.some((r) => r.item.slug === 'display-pairing-and-screen-security')).toBe(true);

    const sessionResults = searchFaqItems('logout all devices session', FAQ_ITEMS);
    expect(sessionResults.length).toBeGreaterThan(0);
    expect(sessionResults.some((r) => r.item.slug === 'dual-mode-admin-authentication')).toBe(true);
  });

  it('generates match snippets correctly', () => {
    const results = searchFaqItems('edge kiosk', FAQ_ITEMS);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.matchSnippet.length).toBeGreaterThan(0);
  });
});

