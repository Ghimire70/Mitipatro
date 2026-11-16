// tests/astronomy/panchanga.reference.test.ts
//
// INDEPENDENT REFERENCE TESTS — Stage 7 daily Panchanga at sunrise.
//
// SOURCE: sunrise/sunset values copied from vedicmarga.com Kathmandu panchang pages.
// These are WEBSITE values, NOT Nepal's official patro. Do not interpret a
// pass/fail here as validation against the official Nepali panchang.
//
// Independent data available in the pasted rows: sunrise and sunset (NPT) only.
// The rows do NOT carry published tithi/nakshatra/yoga/karana values, so the
// four elements are computed and LOGGED (with their gap to sunrise); they are
// NOT asserted against the page. No claim of full independent validation is made.
//
// Times are Nepal time (UTC+05:45). Tolerance: 3 minutes for sunrise/sunset
// change times (published times are to the minute and the same site moved by one
// minute between reads). Not loosened.
//
// Reference data collected 2026-11-16 from vedicmarga.com daily panchang pages
// for Kathmandu, Nepal (27.7172° N, 85.3240° E).
//
// Near-sunrise handling: for each element, the gap between its end transition
// and sunrise is computed automatically. If |gap| < the near-sunrise window
// (default 10 minutes), that element is skipped for this row and the reason is
// logged; rows are NOT hand-picked. A row off by more than the tolerance is
// reported (assertion failure), not tuned.
//
// Conventions: sea-level sunrise (Stage 6), elements prevailing at the unrounded
// sunrise instant (ASSUMPTION — not confirmed against a printed Nepali patro),
// near-sunrise window default 10 minutes, weekday from the civil date.

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getDailyPanchanga,
  type DailyPanchanga,
  DEFAULT_NEAR_SUNRISE_WINDOW_MINUTES,
} from '../../lib/astronomy/panchanga.js';
import type { PanchangaElement } from '../../lib/astronomy/panchanga.js';

const MODE = 'lahiri' as const;
const TOL_MIN = 3;

function nptToUtc(dateStr: string, timeStr: string): Date {
  const y = Number(dateStr.slice(0, 4));
  const mo = Number(dateStr.slice(5, 7)) - 1;
  const d = Number(dateStr.slice(8, 10));
  const [hh, mm] = timeStr.split(':').map(Number);
  const nptAsUtcMs = Date.UTC(y, mo, d, hh, mm, 0, 0);
  // NPT is UTC+05:45
  return new Date(nptAsUtcMs - 5 * 3600 * 1000 - 45 * 60 * 1000);
}

function minDiff(a: Date, b: Date): number {
  return Math.abs(a.getTime() - b.getTime()) / 60000;
}

interface PanchangaRefRow {
  label: string;
  date: string;      // YYYY-MM-DD (Kathmandu civil date)
  sunriseNpt: string;// HH:MM in NPT
  sunsetNpt: string; // HH:MM in NPT
}

const ROWS: PanchangaRefRow[] = [
  { label: '2024-03-26', date: '2024-03-26', sunriseNpt: '06:00', sunsetNpt: '18:18' },
  { label: '2024-07-01', date: '2024-07-01', sunriseNpt: '05:11', sunsetNpt: '19:03' },
  { label: '2025-04-08', date: '2025-04-08', sunriseNpt: '05:46', sunsetNpt: '18:24' },
  { label: '2025-06-16', date: '2025-06-16', sunriseNpt: '05:07', sunsetNpt: '19:01' },
  { label: '2025-07-23', date: '2025-07-23', sunriseNpt: '05:21', sunsetNpt: '18:58' },
  { label: '2026-09-28', date: '2026-09-28', sunriseNpt: '05:54', sunsetNpt: '17:53' },
];

function civilDate(dateStr: string): Date {
  const [y, mo, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, mo - 1, d));
}

function sunriseOf(p: DailyPanchanga): Date {
  return p.sunrise.utcInstant!;
}

function elementLine(
  label: string,
  el: PanchangaElement,
  srMs: number,
): string {
  let gap = '';
  let near = '';
  if (el.end !== null) {
    const gapMs = el.end.utcInstant.getTime() - srMs;
    gap = ` endGapMs=${gapMs.toFixed(0)}`;
    if (el.nearSunrise !== null) {
      near = ` nearSunrise(change=${el.nearSunrise.changeKathmandu}, ${el.nearSunrise.minutesFromSunrise.toFixed(3)}min, before=${el.nearSunrise.beforeSunrise})`;
    }
  }
  return `  ${label}: ${el.name} (idx ${el.index}) end=${el.end?.kathmanduDisplay ?? 'null'}${gap}${near} next=${el.nextName} (idx ${el.nextIndex})`;
}

for (const row of ROWS) {
  test(`panchanga reference: ${row.label} sunrise ${row.sunriseNpt} / sunset ${row.sunsetNpt} NPT`, () => {
    const cd = civilDate(row.date);
    const p = getDailyPanchanga(cd, MODE);
    const srMs = sunriseOf(p).getTime();

    // (a) sunrise vs page (independent: from external website)
    const srDiff = minDiff(sunriseOf(p), nptToUtc(row.date, row.sunriseNpt));
    console.log(
      `[${row.label}] sunrise computed=${p.sunrise.kathmanduDisplay} page=${row.sunriseNpt} NPT diff=${srDiff.toFixed(3)} min (tolerance ${TOL_MIN} min)`,
    );
    assert.ok(
      srDiff <= TOL_MIN,
      `[${row.label}] independent: from external website — sunrise ${p.sunrise.kathmanduDisplay}; page ${row.sunriseNpt} NPT; diff ${srDiff.toFixed(2)} min > ${TOL_MIN} min`,
    );

    // (b) sunset vs page (independent: from external website)
    const ssDiff = minDiff(p.sunset.utcInstant!, nptToUtc(row.date, row.sunsetNpt));
    console.log(
      `[${row.label}] sunset computed=${p.sunset.kathmanduDisplay} page=${row.sunsetNpt} NPT diff=${ssDiff.toFixed(3)} min (tolerance ${TOL_MIN} min)`,
    );
    assert.ok(
      ssDiff <= TOL_MIN,
      `[${row.label}] independent: from external website — sunset ${p.sunset.kathmanduDisplay}; page ${row.sunsetNpt} NPT; diff ${ssDiff.toFixed(2)} min > ${TOL_MIN} min`,
    );

    // (c) elements at sunrise — logged only (no published element values in the rows).
    // Skip any element whose change is within the near-sunrise window.
    const windowMs = DEFAULT_NEAR_SUNRISE_WINDOW_MINUTES * 60000;
    for (const [label, el] of [
      ['tithi', p.tithi],
      ['nakshatra', p.nakshatra],
      ['yoga', p.yoga],
      ['karana', p.karana],
    ] as const) {
      let skipReason = '';
      if (el.end !== null) {
        const gapMs = el.end.utcInstant.getTime() - srMs;
        if (Math.abs(gapMs) < windowMs) {
          skipReason = ` SKIPPED (|gap| ${Math.abs(gapMs / 60000).toFixed(3)} min < ${DEFAULT_NEAR_SUNRISE_WINDOW_MINUTES} min window)`;
        }
      }
      console.log(`[${row.label}] ${elementLine(label, el, srMs)}${skipReason}`);
    }
    // No assertion on element values: the rows carry no published element values.
  });
}

// ---------------------------------------------------------------------------
// Known unresolved / todo rows (kept as test.todo, not tuned).
//
// 2026-03-16: sunrise = 06:12:29.599 NPT (UTC 00:27:29.599); the Shravana ->
// Dhanishta nakshatra change occurs at 06:11:20.273 NPT, i.e. 69.326 seconds
// BEFORE sunrise (|gap| < 10-minute near-sunrise window). The site later showed
// Dhanishta. Documented here as todo; nakshatra is flagged nearSunrise
// (beforeSunrise = true) by getDailyPanchanga, but no value is asserted against
// the page. Formula not changed.
// ---------------------------------------------------------------------------
test.todo(
  'PENDING: panchanga 2026-03-16 nakshatra — sunrise 06:12:29.599 NPT; Shravana->Dhanishta change at 06:11:20.273 NPT, 69.326 s before sunrise (within the 10-minute near-sunrise window, beforeSunrise=true). Site later showed Dhanishta. Gap computed from our own sunrise + nakshatra code; not independently validated. Formula not changed.',
);

// Known unresolved Yoga, Karana and Panchang rows from earlier stages remain as
// test.todo in their respective files and are not touched here.
