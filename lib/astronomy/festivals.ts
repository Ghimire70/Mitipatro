// lib/astronomy/festivals.ts
//
// Stage 9 — Nepali calendar festivals and special Panchanga rules
//
// Computes festival dates from tithi rules using the sunrise rule:
//   "The tithi prevailing at sunrise defines the civil date."
//
// SCOPE (Stage 9, approved):
//   - Ghatasthapana (Shukla Pratipada in Ashwin) — 2082 & 2083 BS
//   - Dashain block edges: Ghatasthapana (start) + Vijaya Dashami (Shukla Dashami, end) — 2082 & 2083 BS
//   - Tihar block edges: Kaag Tihar (Krishna Trayodashi, start) + Bhai Tika (Shukla Dwitiya, end) — 2082 & 2083 BS
//   - Chhath (Shukla Shashthi in Kartik) — 2082 & 2083 BS
//
// OUT OF SCOPE (single days, marked 'unsourced', no assertions):
//   Fulpati, Maha Ashtami, Navami, Laxmi Puja, Mha Puja, Bhai Tika
//   These need a printed Nepali patro or another named source before assertions.
//
// SOURCES:
//   - Nepal Panchanga Nirnayak Bikash Samiti notice:
//     https://www.nepalpanchanga.com/notice/publication/15
//     States purnimanta convention: "प्रत्येक महिना परेवा तिथिबाट शुरू भई
//     औंसी तिथिमा पूर्ण हुन्छ" (each month starts at Shukla Pratipada and
//     ends at Krishna Amavasya).
//   - Ministry of Home Affairs gazette notices:
//     2082 BS: ref 25873, https://rajpatra.dop.gov.np
//     2083 BS: ref 26242, https://rajpatra.dop.gov.np
//
// All values are computed independently and compared against listed dates.
// Mismatches are reported, never tuned away. Nothing in this file replaces
// or edits lib/holidays.ts.

import { getDailyPanchanga } from './panchanga.js';

const MODE = 'lahiri' as const;

export interface FestivalRule {
  label: string;
  bsYear: number;
  tithiNumber: number; // 1-15 within paksha
  paksha: 'shukla' | 'krishna';
  searchStartAd: string; // YYYY-MM-DD
  searchEndAd: string;   // YYYY-MM-DD
  expectedAdDate: string; // from gazette
  source: string;
  scope: 'in-scope' | 'unsourced';
}

export interface FestivalResult {
  label: string;
  bsYear: number;
  computedDate: string | null;
  listedDate: string;
  dayDifference: number | null; // computed - listed in days
  computedTithi: string | null;
  expectedTithi: string;
  match: boolean;
  source: string;
  scope: 'in-scope' | 'unsourced';
}

function ymdToDate(y: number, m: number, d: number): Date {
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0, 0)); // noon Kathmandu
}

/**
 * Find the first date in [start, end] where the given tithi is at sunrise.
 * Returns null if no match in range.
 */
export function findDateForTithiAtSunrise(
  start: Date,
  end: Date,
  tithiNumber: number,
  paksha: 'shukla' | 'krishna',
): { date: string; tithiIndex: number; tithiName: string } | null {
  const current = new Date(start.getTime());
  const endTime = end.getTime();

  while (current.getTime() <= endTime) {
    const p = getDailyPanchanga(new Date(current.getTime()), MODE);
    if (p.tithi.paksha === paksha && p.tithi.tithiNumber === tithiNumber) {
      return {
        date: p.civilDate,
        tithiIndex: p.tithi.index,
        tithiName: p.tithi.name,
      };
    }
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return null;
}

export function computeFestival(rule: FestivalRule): FestivalResult {
  const [sy, sm, sd] = rule.searchStartAd.split('-').map(Number);
  const [ey, em, ed] = rule.searchEndAd.split('-').map(Number);
  const start = ymdToDate(sy, sm, sd);
  const end = ymdToDate(ey, em, ed);

  const found = findDateForTithiAtSunrise(
    start, end, rule.tithiNumber, rule.paksha,
  );

  const [ey2, em2, ed2] = rule.expectedAdDate.split('-').map(Number);
  const expected = new Date(Date.UTC(ey2, em2 - 1, ed2, 12, 0, 0, 0));

  let dayDifference: number | null = null;
  let match = false;

  if (found) {
    const [cy, cm, cd] = found.date.split('-').map(Number);
    const computed = new Date(Date.UTC(cy, cm - 1, cd, 12, 0, 0, 0));
    dayDifference = Math.round(
      (computed.getTime() - expected.getTime()) / 86400000,
    );
    match = dayDifference === 0;
  }

  const expectedTithi = `${
    rule.paksha === 'shukla' ? 'Shukla' : 'Krishna'
  } ${rule.tithiNumber}`;

  return {
    label: rule.label,
    bsYear: rule.bsYear,
    computedDate: found?.date ?? null,
    listedDate: rule.expectedAdDate,
    dayDifference,
    computedTithi: found?.tithiName ?? null,
    expectedTithi,
    match,
    source: rule.source,
    scope: rule.scope,
  };
}

export const FESTIVAL_RULES: FestivalRule[] = [
  // ======== 2082 BS (gazette ref 25873, published 27 Feb 2025) ========
  {
    label: 'Ghatasthapana 2082',
    bsYear: 2082,
    tithiNumber: 1,
    paksha: 'shukla',
    searchStartAd: '2025-09-15',
    searchEndAd: '2025-09-30',
    expectedAdDate: '2025-09-22',
    source: 'Ministry of Home Affairs gazette ref 25873 (27 Feb 2025)',
    scope: 'in-scope',
  },
  {
    label: 'Dashain block end (Vijaya Dashami) 2082',
    bsYear: 2082,
    tithiNumber: 10,
    paksha: 'shukla',
    searchStartAd: '2025-09-29',
    searchEndAd: '2025-10-05',
    expectedAdDate: '2025-10-02',
    source: 'Nepal Panchanga Nirnayak Bikash Samitee + multiple independent sources (Ashwin 16, 2082 = Oct 2, 2025)',
    scope: 'in-scope',
  },
  {
    label: 'Tihar block start (Kaag Tihar) 2082',
    bsYear: 2082,
    tithiNumber: 13,
    paksha: 'krishna',
    searchStartAd: '2025-10-15',
    searchEndAd: '2025-10-25',
    expectedAdDate: '2025-10-19',
    source: 'Nepal Panchanga Nirnayak Bikash Samitee + multiple independent sources (Kartik 2, 2082 = Oct 19, 2025)',
    scope: 'in-scope',
  },
  {
    label: 'Tihar block end (Bhai Tika) 2082',
    bsYear: 2082,
    tithiNumber: 2,
    paksha: 'shukla',
    searchStartAd: '2025-10-20',
    searchEndAd: '2025-10-30',
    expectedAdDate: '2025-10-24',
    source: 'Ministry of Home Affairs gazette ref 25873 (27 Feb 2025)',
    scope: 'unsourced', // single day conflict with UN list
  },
  {
    label: 'Chhath 2082',
    bsYear: 2082,
    tithiNumber: 6,
    paksha: 'shukla',
    searchStartAd: '2025-10-15',
    searchEndAd: '2025-10-31',
    expectedAdDate: '2025-10-27',
    source: 'Ministry of Home Affairs gazette ref 25873 (27 Feb 2025)',
    scope: 'in-scope',
  },

  // ======== 2083 BS (gazette ref 26242) ========
  {
    label: 'Ghatasthapana 2083',
    bsYear: 2083,
    tithiNumber: 1,
    paksha: 'shukla',
    searchStartAd: '2026-09-25',
    searchEndAd: '2026-10-15',
    expectedAdDate: '2026-10-11',
    source: 'Ministry of Home Affairs gazette ref 26242',
    scope: 'in-scope',
  },
  {
    label: 'Dashain block end (Vijaya Dashami) 2083',
    bsYear: 2083,
    tithiNumber: 10,
    paksha: 'shukla',
    searchStartAd: '2026-10-15',
    searchEndAd: '2026-10-25',
    expectedAdDate: '2026-10-21',
    source: 'Ministry of Home Affairs gazette ref 26242',
    scope: 'in-scope',
  },
  {
    label: 'Tihar block start (Kaag Tihar) 2083',
    bsYear: 2083,
    tithiNumber: 13,
    paksha: 'krishna',
    searchStartAd: '2026-11-01',
    searchEndAd: '2026-11-15',
    expectedAdDate: '2026-11-07',
    source: 'Nepal Panchanga Nirnayak Bikash Samitee + multiple independent sources (Kartik 21, 2083 = Nov 7, 2026)',
    scope: 'in-scope',
  },
  {
    label: 'Tihar block end (Bhai Tika) 2083',
    bsYear: 2083,
    tithiNumber: 2,
    paksha: 'shukla',
    searchStartAd: '2026-11-05',
    searchEndAd: '2026-11-15',
    expectedAdDate: '2026-11-10',
    source: 'Ministry of Home Affairs gazette ref 26242',
    scope: 'unsourced', // single day conflict with UN list
  },
  {
    label: 'Chhath 2083',
    bsYear: 2083,
    tithiNumber: 6,
    paksha: 'shukla',
    searchStartAd: '2026-11-05',
    searchEndAd: '2026-11-20',
    expectedAdDate: '2026-11-15',
    source: 'Ministry of Home Affairs gazette ref 26242',
    scope: 'in-scope',
  },
];

export function computeAllFestivals(): FestivalResult[] {
  return FESTIVAL_RULES.map(computeFestival);
}
