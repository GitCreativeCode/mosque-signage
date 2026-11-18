import type { FaqItem, FaqSearchResult } from './faq-types';

function scoreSurfaceFields(
  cleanQuery: string,
  tokens: readonly string[],
  item: FaqItem
): { score: number; matchSnippet: string } {
  let score = 0;
  let matchSnippet = item.shortAnswer;
  const lowerQuestion = item.question.toLowerCase();
  const lowerShortAnswer = item.shortAnswer.toLowerCase();
  const lowerSummary = item.article.summary.toLowerCase();

  if (lowerQuestion === cleanQuery) {
    score += 100;
  } else if (lowerQuestion.includes(cleanQuery)) {
    score += 50;
    matchSnippet = item.question;
  }

  for (const token of tokens) {
    if (lowerQuestion.includes(token)) score += 25;
    if (item.tags.some((tag) => tag.toLowerCase().includes(token))) score += 20;
    if (lowerShortAnswer.includes(token)) score += 15;
    if (lowerSummary.includes(token)) score += 10;
  }

  return { score, matchSnippet };
}

function findDeepSectionSnippet(item: FaqItem, tokens: readonly string[]): string | null {
  for (const section of item.article.sections) {
    const matched = section.paragraphs.find((p) => {
      const lower = p.toLowerCase();
      return tokens.some((token) => lower.includes(token));
    });
    if (matched) {
      return matched.length > 130 ? `${matched.slice(0, 130)}...` : matched;
    }
  }
  return null;
}

/**
 * Searches the FAQ items using token scoring and extracts match snippets.
 */
export function searchFaqItems(
  query: string,
  items: readonly FaqItem[],
  maxResults = 8
): FaqSearchResult[] {
  const cleanQuery = query.trim().toLowerCase();
  if (!cleanQuery) return [];

  const tokens = cleanQuery.split(/\s+/).filter((t) => t.length > 1);
  if (tokens.length === 0) return [];

  const results: FaqSearchResult[] = [];
  for (const item of items) {
    let { score, matchSnippet } = scoreSurfaceFields(cleanQuery, tokens, item);
    if (score === 0) {
      const snippet = findDeepSectionSnippet(item, tokens);
      if (snippet) {
        score = 5;
        matchSnippet = snippet;
      }
    }
    if (score > 0) {
      results.push({ item, score, matchSnippet });
    }
  }

  return results.sort((a, b) => b.score - a.score).slice(0, maxResults);
}
