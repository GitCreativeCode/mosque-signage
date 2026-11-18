/**
 * FAQ Knowledge Base Data Types
 */

export type FaqCategoryId = 'hardware' | 'prayer' | 'media' | 'security';

export interface FaqCategory {
  readonly id: FaqCategoryId;
  readonly title: string;
  readonly badge: string;
  readonly description: string;
  readonly iconName: 'Tv' | 'Calendar' | 'Image' | 'Lock';
}

export interface FaqArticleSection {
  readonly heading?: string;
  readonly paragraphs: readonly string[];
  readonly steps?: readonly string[];
  readonly callout?: {
    readonly type: 'tip' | 'note' | 'warning';
    readonly text: string;
  };
  readonly image?: {
    readonly src: string;
    readonly alt: string;
    readonly caption?: string;
    readonly width?: number;
    readonly height?: number;
  };
}

export interface FaqArticle {
  readonly title: string;
  readonly lastUpdated: string;
  readonly summary: string;
  readonly sections: readonly FaqArticleSection[];
}

export interface FaqItem {
  readonly slug: string;
  readonly categoryId: FaqCategoryId;
  readonly question: string;
  readonly shortAnswer: string;
  readonly isAccordion: boolean;
  readonly isFeatured: boolean;
  readonly tags: readonly string[];
  readonly relatedSlugs: readonly string[];
  readonly article: FaqArticle;
}

export interface FaqSearchResult {
  readonly item: FaqItem;
  readonly score: number;
  readonly matchSnippet: string;
}

