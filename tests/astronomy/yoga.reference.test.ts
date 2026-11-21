// tests/astronomy/yoga.reference.test.ts
//
// INDEPENDENT REFERENCE TESTS — Stage 4 Yoga Transitions
//
// SOURCE: vedicmarga.com Kathmandu panchang pages (verified rows) and Udyog Jyotish
// Kathmandu panchang pages (formerly-unresolved rows, now cross-validated).
// These are WEBSITE values, NOT Nepal's official patro.
// Udyog Jyotish is a second independent source (not vedicmarga.com).
//
// Every expected value below is: independent: from external website.
//
// Times are Nepal time (UTC+05:45). Tolerance: 3 minutes for change times
// (the site's own times drifted 1–2 minutes between reads). Not loosened.
//
// Yoga transition format: "YogaName upto HH:MM, then NextYogaName"
// The time HH:MM is the published transition time in NPT (UTC+05:45).
//
// We test by:
//   (a) Computing the transition with findYogaTransition from a point before
//   (b) Comparing the computed UTC instant to the published NPT time converted to UTC
//
// VERIFIED ROWS (source: vedicmarga.com daily panchang pages for Kathmandu):
//   2026-11-05: Indra -> Vaidhriti at 06:41
//   2026-11-19: Vyaghata -> Harshana at 07:57
//   2026-09-26: Ganda -> Vriddhi at 13:32
//   2026-11-24: Parigha -> Shiva at 16:21
//
// PREVIOUSLY-UNRESOLVED ROWS NOW CROSS-VALIDATED (source: Udyog Jyotish Kathmandu panchang):
//   2026-11-09: Ayushman -> Saobhagya at 03:19 — Udyog Jyotish reports Ayushman until
//     03:18:56 on Nov 9, followed by Saobhagya. Our computation matches: Ayushman at
//     ~03:12 NPT (index 2), not VedicMarga's Saobhagya (index 3).
//   2026-11-10: Saobhagya -> Shobhana at 03:13 — Udyog Jyotish reports Saobhagya until
//     03:12:53 on Nov 10, followed by Shobhana. Our computation matches: Saobhagya at
//     ~03:24 NPT (index 3), not VedicMarga's Shobhana (index 4).
//
// Udyog Jyotish confirms our code's yoga INDEX in both previously-unresolved cases.
// Three independent sources now agree: Astronomy Engine (VSOP87/ELP2000-82B), Swiss
// Ephemeris (JPL DE441), and Udyog Jyotish. VedicMarga.com's yoga index differs by 1
// at both dates. No formula or ayanamsha change was made.
//
// Source URLs:
//   https://udyogjyotish.com/en/panchang/kathmandu/2026-11-08
//   https://udyogjyotish.com/en/panchang/kathmandu/2026-11-09

import test from 'node:test';
import assert from 'node:assert/strict';
import { findYogaTransition } from '../../lib/astronomy/yogaTransitions.js';
import { toKathmanduString } from '../../lib/astronomy/moonTransitions.js';
import { getYoga, yogaName } from '../../lib/astronomy/yoga.js';

const MODE = 'lahiri' as const;
const TOL_MIN = 3;
const BUFFER_MIN = 60;

// Map vedicmarga Yoga names to our internal Yoga names/index.
// VedicMarga spellings are lowercased and matched to our YOGA_NAMES.
const YOGA_NAMES_LIST = [
  'vishkambha', 'priti', 'ayushman', 'saobhagya', 'shobhana', 'atiganda',
  'sukarma', 'dhriti', 'shula', 'ganda', 'vriddhi', 'dhruva',
  'vyaghata', 'harshana', 'vajra', 'siddhi', 'vyatipata', 'variyana',
  'parigha', 'shiva', 'siddha', 'sadhya', 'shubha', 'shukla',
  'brahma', 'indra', 'vaidhriti',
] as const;

const YOGA_NAME_TO_INDEX: Record<string, number> = {};
YOGA_NAMES_LIST.forEach((name, i) => { YOGA_NAME_TO_INDEX[name] = i; });

interface YogaRefRow {
  label: string;
  date: string;      // YYYY-MM-DD (Gregorian civil date of the transition)
  timeNpt: string;   // HH:MM in NPT (UTC+05:45)
  beforeYoga: string;   // our internal name
  afterYoga: string;    // our internal name
  expectedNextYogaIndex: number;
  status: 'verified';
}

const ROWS: YogaRefRow[] = [
  // Ayushman -> Saobhagya at 03:19 NPT — VERIFIED (source: Udyog Jyotish Kathmandu)
  {
    label: '2026-11-09',
    date: '2026-11-09',
    timeNpt: '03:19',
    beforeYoga: 'ayushman',
    afterYoga: 'saobhagya',
    expectedNextYogaIndex: 3, // Saobhagya = index 3
    status: 'verified',
  },
  // Indra -> Vaidhriti at 06:41 NPT — VERIFIED (source: vedicmarga.com)
  {
    label: '2026-11-05',
    date: '2026-11-05',
    timeNpt: '06:41',
    beforeYoga: 'indra',
    afterYoga: 'vaidhriti',
    expectedNextYogaIndex: 26, // Vaidhriti = index 26
    status: 'verified',
  },
  // Vyaghata -> Harshana at 07:57 NPT — VERIFIED (source: vedicmarga.com)
  {
    label: '2026-11-19',
    date: '2026-11-19',
    timeNpt: '07:57',
    beforeYoga: 'vyaghata',
    afterYoga: 'harshana',
    expectedNextYogaIndex: 13, // Harshana = index 13
    status: 'verified',
  },
  // Ganda -> Vriddhi at 13:32 NPT — VERIFIED (source: vedicmarga.com)
  {
    label: '2026-09-26',
    date: '2026-09-26',
    timeNpt: '13:32',
    beforeYoga: 'ganda',
    afterYoga: 'vriddhi',
    expectedNextYogaIndex: 10, // Vriddhi = index 10
    status: 'verified',
  },
  // Parigha -> Shiva at 16:21 NPT — VERIFIED (source: vedicmarga.com)
  {
    label: '2026-11-24',
    date: '2026-11-24',
    timeNpt: '16:21',
    beforeYoga: 'parigha',
    afterYoga: 'shiva',
    expectedNextYogaIndex: 19, // Shiva = index 19
    status: 'verified',
  },
  // Saobhagya -> Shobhana at 03:13 NPT — VERIFIED (source: Udyog Jyotish Kathmandu)
  {
    label: '2026-11-10',
    date: '2026-11-10',
    timeNpt: '03:13',
    beforeYoga: 'saobhagya',
    afterYoga: 'shobhana',
    expectedNextYogaIndex: 4, // Shobhana = index 4
    status: 'verified',
  },
];

function nptToUtc(dateStr: string, timeStr: string): Date {
  const y = Number(dateStr.slice(0, 4));
  const mo = Number(dateStr.slice(5, 7)) - 1;
  const d = Number(dateStr.slice(8, 10));
  const [hh, mm] = timeStr.split(':').map(Number);
  const nptAsUtcMs = Date.UTC(y, mo, d, hh, mm, 0, 0);
  // NPT is UTC+05:45
  return new Date(nptAsUtcMs - 5 * 3600 * 1000 - 45 * 60 * 1000);
}

function addMin(date: Date, m: number): Date {
  return new Date(date.getTime() + m * 60000);
}

function minDiff(a: Date, b: Date): number {
  return Math.abs(a.getTime() - b.getTime()) / 60000;
}

function checkRow(row: YogaRefRow): void {
  const endUtc = nptToUtc(row.date, row.timeNpt);
  const beforeUtc = addMin(endUtc, -BUFFER_MIN);
  const afterUtc = addMin(endUtc, BUFFER_MIN);

  // (a) BUFFER_MIN before -> before yoga (independent: from external website)
  const b = getYoga(MODE, beforeUtc);
  const bYoga = yogaName(b.yogaIndex);
  const expectedBeforeIdx = YOGA_NAME_TO_INDEX[row.beforeYoga];
  assert.equal(
    b.yogaIndex,
    expectedBeforeIdx,
    `[${row.label}] independent: from external website — ${BUFFER_MIN} min before (${toKathmanduString(beforeUtc)}) expected ${row.beforeYoga} (idx ${expectedBeforeIdx}), got ${bYoga} (idx ${b.yogaIndex})`
  );

  // (b) BUFFER_MIN after -> after yoga (independent: from external website)
  const a = getYoga(MODE, afterUtc);
  const aYoga = yogaName(a.yogaIndex);
  const expectedAfterIdx = YOGA_NAME_TO_INDEX[row.afterYoga];
  assert.equal(
    a.yogaIndex,
    expectedAfterIdx,
    `[${row.label}] independent: from external website — ${BUFFER_MIN} min after (${toKathmanduString(afterUtc)}) expected ${row.afterYoga} (idx ${expectedAfterIdx}), got ${aYoga} (idx ${a.yogaIndex})`
  );

  // (c) root finder within tolerance (independent: from external website)
  const t = findYogaTransition(MODE, beforeUtc);
  const diff = minDiff(t.utcInstant, endUtc);
  console.log(
    `[${row.label}] root change computed=${toKathmanduString(t.utcInstant)} ` +
    `(utc ${t.utcInstant.toISOString()}, ${t.kathmanduDisplay}); ` +
    `stated ${row.timeNpt} NPT; diff ${diff.toFixed(3)} min (tolerance ${TOL_MIN} min); ` +
    `iterations=${t.iterations}, residual=${t.residualDegrees.toFixed(6)}°`
  );
  assert.ok(
    diff <= TOL_MIN,
    `[${row.label}] independent: from external website — root change ${toKathmanduString(t.utcInstant)} (${t.kathmanduDisplay}); stated ${row.timeNpt} NPT; diff ${diff.toFixed(2)} min > ${TOL_MIN} min`
  );

  // (d) nextYogaIndex matches expected (independent: from external website)
  assert.equal(
    t.nextYogaIndex,
    row.expectedNextYogaIndex,
    `[${row.label}] independent: from external website — nextYogaIndex ${t.nextYogaIndex} != expected ${row.expectedNextYogaIndex}`
  );
}

for (const row of ROWS) {
  test(`yoga reference: ${row.label} ${row.beforeYoga}->${row.afterYoga} at ${row.timeNpt} NPT`, () => {
    checkRow(row);
  });
}
