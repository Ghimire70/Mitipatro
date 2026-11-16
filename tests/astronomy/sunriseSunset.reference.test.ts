// tests/astronomy/sunriseSunset.reference.test.ts
//
// INDEPENDENT REFERENCE TESTS — Stage 6 Sunrise/Sunset
//
// SOURCE: values copied from vedicmarga.com Kathmandu panchang pages.
// These are WEBSITE values, NOT Nepal's official patro. Do not interpret
// a pass/fail here as validation against the official Nepali panchang.
//
// Reference data (published sunrise/sunset in NPT, UTC+05:45):
//
//   2024-03-26: sunrise 06:00, sunset 18:18
//   2024-07-01: sunrise 05:11, sunset 19:03
//   2025-04-08: sunrise 05:46, sunset 18:24
//   2025-06-16: sunrise 05:07, sunset 19:01
//   2025-07-23: sunrise 05:21, sunset 18:58
//   2026-03-16: sunrise 06:12, sunset 18:12
//   2026-09-28: sunrise 05:54, sunset 17:53
//
// Tolerance: 2 minutes. Every assertion below is: independent: from external website.
// If a row fails, the computed value and difference are reported; tolerance is
// NOT loosened.
//
// NOTE ON ROUNDING: The scratch elevation-comparison script
// (scripts/elevation_variant_compare.mjs) reported 0.00 minute differences for
// all 14 values because it rounded each computed time to the nearest minute
// (nptFromUtc emits only HH:MM) before comparing. This reference test compares
// against the UNROUNDED computed value (unroundedMinutesFromMidnight), so its
// differences range from 0.15 to 0.93 minutes. Both approaches agree on the
// minute-level label; the discrepancy is purely sub-minute rounding.
//
// FLOORING OBSERVATION (not a proven rule, not a tolerance change):
//   Flooring each unrounded computed time to the minute (dropping seconds)
//   matches the site's published value on all 14 numbers (verified
//   2026-11-16). This is an observation about this website's minute-granular
//   display, not a proven astronomical rule. The 2-minute tolerance is NOT
//   loosened based on this observation.

import test from 'node:test';
import assert from 'node:assert/strict';
import { getSunriseSunset } from '../../lib/astronomy/sunriseSunset.js';

const TOL_MIN = 2;

interface SunRefRow {
  label: string;
  date: string;   // YYYY-MM-DD
  expectedSunrise: string; // HH:MM NPT
  expectedSunset: string;  // HH:MM NPT
}

const ROWS: SunRefRow[] = [
  { label: '2024-03-26', date: '2024-03-26', expectedSunrise: '06:00', expectedSunset: '18:18' },
  { label: '2024-07-01', date: '2024-07-01', expectedSunrise: '05:11', expectedSunset: '19:03' },
  { label: '2025-04-08', date: '2025-04-08', expectedSunrise: '05:46', expectedSunset: '18:24' },
  { label: '2025-06-16', date: '2025-06-16', expectedSunrise: '05:07', expectedSunset: '19:01' },
  { label: '2025-07-23', date: '2025-07-23', expectedSunrise: '05:21', expectedSunset: '18:58' },
  { label: '2026-03-16', date: '2026-03-16', expectedSunrise: '06:12', expectedSunset: '18:12' },
  { label: '2026-09-28', date: '2026-09-28', expectedSunrise: '05:54', expectedSunset: '17:53' },
];

function nptToUtcMs(dateStr: string, timeStr: string): number {
  const [y, mo, d] = dateStr.split('-').map(Number);
  const [hh, mm] = timeStr.split(':').map(Number);
  // NPT = UTC+05:45; to get UTC, subtract 5:45 from the NPT-local instant
  return Date.UTC(y, mo - 1, d, hh, mm, 0, 0) - (5 * 3600 + 45 * 60) * 1000;
}

function minDiff(aMs: number, bMs: number): number {
  return Math.abs(aMs - bMs) / 60000;
}

for (const row of ROWS) {
  test(`sunrise/sunset reference: ${row.label} sunrise ${row.expectedSunrise} sunset ${row.expectedSunset} NPT`, () => {
    const [y, mo, d] = row.date.split('-').map(Number);
    const r = getSunriseSunset(new Date(Date.UTC(y, mo - 1, d)));

    assert.equal(r.sunrise.status, 'computed', `${row.label}: sunrise should be computed, not missing`);
    assert.equal(r.sunset.status, 'computed', `${row.label}: sunset should be computed, not missing`);

    const expRiseMs = nptToUtcMs(row.date, row.expectedSunrise);
    const expSetMs = nptToUtcMs(row.date, row.expectedSunset);

    const riseDiff = minDiff(r.sunrise.utcInstant!.getTime(), expRiseMs);
    const setDiff = minDiff(r.sunset.utcInstant!.getTime(), expSetMs);

    console.log(
      `[${row.label}] computed sunrise=${r.sunrise.kathmanduDisplay} ` +
      `(unrounded ${r.sunrise.unroundedMinutesFromMidnight!.toFixed(2)} min from midnight) ` +
      `stated ${row.expectedSunrise} NPT; diff ${riseDiff.toFixed(2)} min; ` +
      `computed sunset=${r.sunset.kathmanduDisplay} ` +
      `(unrounded ${r.sunset.unroundedMinutesFromMidnight!.toFixed(2)} min from midnight) ` +
      `stated ${row.expectedSunset} NPT; diff ${setDiff.toFixed(2)} min; ` +
      `tolerance ${TOL_MIN} min`
    );

    assert.ok(
      riseDiff <= TOL_MIN,
      `${row.label}: sunrise diff ${riseDiff.toFixed(2)} min > ${TOL_MIN} min ` +
      `(computed ${r.sunrise.kathmanduDisplay}, stated ${row.expectedSunrise} NPT)`
    );
    assert.ok(
      setDiff <= TOL_MIN,
      `${row.label}: sunset diff ${setDiff.toFixed(2)} min > ${TOL_MIN} min ` +
      `(computed ${r.sunset.kathmanduDisplay}, stated ${row.expectedSunset} NPT)`
    );
  });
}