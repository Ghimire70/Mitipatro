// lib/faqNormalizer.ts
//
// Normalization, deduplication (fuzzy/canonical question hashing), and
// intent classification for FAQ items. Runs in Node (tsx), not bundled to
// the client.

import { createHash } from 'node:crypto';
import type { FaqItem, FaqIntent, FaqSource, FAQ_INDEX_VERSION } from './faqTypes';

export function normalizeQuestion(question: string): string {
  return question
    .toLowerCase()
    .trim()
    .replace(/[^\w\s\u0900-\u097F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function canonicalHash(question: string, intent: string): string {
  const normalized = normalizeQuestion(question);
  return createHash('sha1').update(`${intent}|${normalized}`).digest('hex');
}

const TODAY_KEYWORDS = [
  'aaja', 'today', 'ajako miti', 'nepali date today', 'current nepali date',
  'today\'s nepali date', "today's nepali date",
];
const MONTH_KEYWORDS = [
  'kati din', 'how many days', 'days in', 'month', 'baisakh', 'jestha', 'ashad',
  'shrawan', 'bhadra', 'ashwin', 'kartik', 'mangsir', 'poush', 'magh', 'falgun',
  'chaitra', 'span', 'ad dates',
];
const HOLIDAY_KEYWORDS = [
  'holiday', 'bida', 'parva', 'festival', 'dashain', 'tihar', 'chhath', 'losar',
  'teej', 'shivaratri', 'holi', 'maghe sankranti', 'public holiday',
];
const CONVERTER_KEYWORDS = [
  'bs to ad', 'ad to bs', 'convert', 'converter', 'bikram sambat to gregorian',
  'gregorian to bikram', 'date conversion',
];
const RASHIFAL_KEYWORDS = [
  'rashifal', 'horoscope', 'rashi', 'aajako rashifal', 'daily rashifal',
  'mesha', 'vrisha', 'simha', 'kanya', 'tula', 'vrischik', 'dhanu', 'makar',
  'kumbha', 'meen',
];
const TITHI_KEYWORDS = [
  'tithi', 'ekadashi', 'purnima', 'aunsi', 'amavasya', 'paksha',
];

export function classifyIntent(question: string): FaqIntent {
  const q = normalizeQuestion(question);

  if (TODAY_KEYWORDS.some((k) => q.includes(k))) return 'today';
  if (RASHIFAL_KEYWORDS.some((k) => q.includes(k))) return 'rashifal';
  if (TITHI_KEYWORDS.some((k) => q.includes(k))) return 'tithi';
  if (CONVERTER_KEYWORDS.some((k) => q.includes(k))) return 'converter';
  if (HOLIDAY_KEYWORDS.some((k) => q.includes(k))) return 'holiday';
  if (MONTH_KEYWORDS.some((k) => q.includes(k))) return 'month';
  return 'general';
}

export function dedup(faqs: FaqItem[]): FaqItem[] {
  const seen = new Map<string, FaqItem>();
  const sourceRank: Record<FaqSource, number> = {
    deterministic: 5,
    editorial: 4,
    gsc: 3,
    autocomplete: 2,
    trends: 1,
  };

  for (const faq of faqs) {
    const key = canonicalHash(faq.question, faq.intent);
    const existing = seen.get(key);
    if (!existing) {
      seen.set(key, faq);
      continue;
    }
    const keepNew =
      sourceRank[faq.source] > sourceRank[existing.source] ||
      (sourceRank[faq.source] === sourceRank[existing.source] &&
        faq.generatedAt > existing.generatedAt);
    if (keepNew) seen.set(key, faq);
  }

  return [...seen.values()].sort((a, b) => {
    const ra = sourceRank[a.source];
    const rb = sourceRank[b.source];
    if (ra !== rb) return rb - ra;
    return a.question.localeCompare(b.question);
  });
}
