// lib/rashifalReadings.ts
//
// Rashifal reading content — position-based (Moon position counted from the
// reader's sign, 1–12), shared by all 12 rashis. Daily only.
//
// EDITORIAL POLICY:
//   - Readings are keyed by position (1–12) and variant only.
//   - Same reading text applies to all signs at the same position.
//   - Multiple variants per position enable deterministic daily rotation.
//   - Approved readings MUST have source === 'original-editorial' and
//     non-empty textNe. Unapproved readings (approved: false) must never render.
//   - Placeholder entries are marked 'SAMPLE, not for publication' and must
//     not be published.

export type RashifalVariant = 'a' | 'b' | 'c';

export interface RashifalReading {
  position: number;      // 1..12 (Moon counted from reader's sign)
  variant: RashifalVariant;
  textNe: string;        // Nepali reading text
  source: string;        // 'original-editorial' or 'unsourced'
  approved: boolean;     // must be true to display
  updatedAt?: string;    // ISO date of last editorial change
}

// Position 1–12, variants a/b/c. All entries are unapproved placeholders.
// Replace with original editorial content and set approved: true before
// publishing. Source MUST be 'original-editorial' for approved entries.
export const RASHIFAL_READINGS: RashifalReading[] = [
  // Position 1 — Moon in the reader's own sign
  { position: 1, variant: 'a', textNe: 'SAMPLE, not for publication', source: 'unsourced', approved: false },
  { position: 1, variant: 'b', textNe: 'SAMPLE, not for publication', source: 'unsourced', approved: false },
  { position: 1, variant: 'c', textNe: 'SAMPLE, not for publication', source: 'unsourced', approved: false },
  // Position 2
  { position: 2, variant: 'a', textNe: 'SAMPLE, not for publication', source: 'unsourced', approved: false },
  { position: 2, variant: 'b', textNe: 'SAMPLE, not for publication', source: 'unsourced', approved: false },
  { position: 2, variant: 'c', textNe: 'SAMPLE, not for publication', source: 'unsourced', approved: false },
  // Position 3
  { position: 3, variant: 'a', textNe: 'SAMPLE, not for publication', source: 'unsourced', approved: false },
  { position: 3, variant: 'b', textNe: 'SAMPLE, not for publication', source: 'unsourced', approved: false },
  { position: 3, variant: 'c', textNe: 'SAMPLE, not for publication', source: 'unsourced', approved: false },
  // Position 4
  { position: 4, variant: 'a', textNe: 'SAMPLE, not for publication', source: 'unsourced', approved: false },
  { position: 4, variant: 'b', textNe: 'SAMPLE, not for publication', source: 'unsourced', approved: false },
  { position: 4, variant: 'c', textNe: 'SAMPLE, not for publication', source: 'unsourced', approved: false },
  // Position 5
  { position: 5, variant: 'a', textNe: 'SAMPLE, not for publication', source: 'unsourced', approved: false },
  { position: 5, variant: 'b', textNe: 'SAMPLE, not for publication', source: 'unsourced', approved: false },
  { position: 5, variant: 'c', textNe: 'SAMPLE, not for publication', source: 'unsourced', approved: false },
  // Position 6
  { position: 6, variant: 'a', textNe: 'SAMPLE, not for publication', source: 'unsourced', approved: false },
  { position: 6, variant: 'b', textNe: 'SAMPLE, not for publication', source: 'unsourced', approved: false },
  { position: 6, variant: 'c', textNe: 'SAMPLE, not for publication', source: 'unsourced', approved: false },
  // Position 7
  { position: 7, variant: 'a', textNe: 'SAMPLE, not for publication', source: 'unsourced', approved: false },
  { position: 7, variant: 'b', textNe: 'SAMPLE, not for publication', source: 'unsourced', approved: false },
  { position: 7, variant: 'c', textNe: 'SAMPLE, not for publication', source: 'unsourced', approved: false },
  // Position 8
  { position: 8, variant: 'a', textNe: 'SAMPLE, not for publication', source: 'unsourced', approved: false },
  { position: 8, variant: 'b', textNe: 'SAMPLE, not for publication', source: 'unsourced', approved: false },
  { position: 8, variant: 'c', textNe: 'SAMPLE, not for publication', source: 'unsourced', approved: false },
  // Position 9
  { position: 9, variant: 'a', textNe: 'SAMPLE, not for publication', source: 'unsourced', approved: false },
  { position: 9, variant: 'b', textNe: 'SAMPLE, not for publication', source: 'unsourced', approved: false },
  { position: 9, variant: 'c', textNe: 'SAMPLE, not for publication', source: 'unsourced', approved: false },
  // Position 10
  { position: 10, variant: 'a', textNe: 'SAMPLE, not for publication', source: 'unsourced', approved: false },
  { position: 10, variant: 'b', textNe: 'SAMPLE, not for publication', source: 'unsourced', approved: false },
  { position: 10, variant: 'c', textNe: 'SAMPLE, not for publication', source: 'unsourced', approved: false },
  // Position 11
  { position: 11, variant: 'a', textNe: 'SAMPLE, not for publication', source: 'unsourced', approved: false },
  { position: 11, variant: 'b', textNe: 'SAMPLE, not for publication', source: 'unsourced', approved: false },
  { position: 11, variant: 'c', textNe: 'SAMPLE, not for publication', source: 'unsourced', approved: false },
  // Position 12
  { position: 12, variant: 'a', textNe: 'SAMPLE, not for publication', source: 'unsourced', approved: false },
  { position: 12, variant: 'b', textNe: 'SAMPLE, not for publication', source: 'unsourced', approved: false },
  { position: 12, variant: 'c', textNe: 'SAMPLE, not for publication', source: 'unsourced', approved: false },
];
