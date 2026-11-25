// scripts/sync/generator/deterministic.ts
//
// Programmatic FAQ generator. Produces verified Q&As for every BS month,
// holiday, date-conversion pair, tithi observance, and rashifal topic across
// the published BS years (2082–2085). All answers computed via lib/faqSynthesizer.

import { synthesizeAllFaqs } from '../../../lib/faqSynthesizer';
import type { FaqItem } from '../../../lib/faqTypes';

export function generateDeterministicFaqs(): FaqItem[] {
  return synthesizeAllFaqs();
}
