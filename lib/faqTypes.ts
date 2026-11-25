// lib/faqTypes.ts
//
// FAQ data model for the FAQ Intelligence & Programmatic Q&A System.
//
// Every FAQ answer is computed from the verified BS calendar / holiday /
// astronomy engine. No hardcoded or guessed dates.

export type FaqIntent =
  | 'today'
  | 'month'
  | 'holiday'
  | 'converter'
  | 'rashifal'
  | 'tithi'
  | 'general';

export type FaqSource = 'gsc' | 'autocomplete' | 'trends' | 'deterministic' | 'editorial';

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  intent: FaqIntent;
  category: string;
  source: FaqSource;
  bsYear?: number;
  bsMonth?: number;
  bsDay?: number;
  adIso?: string;
  generatedAt: string;
  verified: boolean;
}

export interface FaqShard {
  path: string;
  intent: string;
  category: string;
  count: number;
  generatedAt: string;
}

export interface FaqIndex {
  version: string;
  generatedAt: string;
  totalCount: number;
  shards: FaqShard[];
}

export const FAQ_INDEX_VERSION = '1';
export const MAX_FAQS_PER_PAGE = 10;
