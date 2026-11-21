// tests/astronomy/karana.reference.test.ts
//
// INDEPENDENT REFERENCE TESTS — Stage 5 Karana Transitions
//
// SOURCE: vedicmarga.com Kathmandu panchang pages (verified rows) and DrikPanchang.com
// Kathmandu day panchang pages (formerly-unresolved rows, now cross-validated).
// These are WEBSITE values, NOT Nepal's official patro.
// DrikPanchang is a second independent source (not vedicmarga.com).
//
// Every expected value below is: independent: from external website.
//
// Times are Nepal time (UTC+05:45). Tolerance: 3 minutes for change times
// (the site's own times drifted 1–2 minutes between reads). Not loosened.
//
// Karana transition format: "KaranaName upto HH:MM, then NextKaranaName"
// The time HH:MM is the published transition time in NPT (UTC+05:45).
//
// We test by:
//   (a) Computing the karana 20 min before the stated time -> before karana
//   (b) Computing the karana 20 min after the stated time -> after karana
//   (c) Running findKaranaTransition from before -> compare to stated time
//
// VERIFIED ROWS (source: vedicmarga.com daily panchang pages for Kathmandu):
//   2024-03-26: Kaulava until 15:11, then Taitila
//   2024-07-01: Vishti until 10:41, then Bava
//   2025-06-16: Taitila until 15:47, then Gara
//   2025-07-24 02:44: Shakuni until 02:44, then Chatushpada
//   2026-03-16: Taitila until 09:56, then Gara
//
// PREVIOUSLY-UNRESOLVED ROWS NOW CROSS-VALIDATED (source: DrikPanchang.com Kathmandu day panchang):
//   2025-07-23: Vishti until 15:46, then Shakuni — DrikPanchang confirms Vishti→Shakuni at ~15:46 NPT
//   2025-04-08: Vishti until 21:27, then Bava — DrikPanchang confirms Vishti→Bava at ~21:27 NPT
//   2026-09-28: Gara until 19:28, then Vanija — DrikPanchang confirms Gara→Vanija at ~19:28 NPT
//
// DrikPanchang's karana names follow the standard 7-movable-karana cycle
// (Bava→Balava→Kaulava→Taitila→Gara→Vanija→Vishti). VedicMarga.com's pages for
// these dates show different karana names/sequences (e.g., Vanija→Bava directly,
// skipping Vishti; Taitila→Vanija directly, skipping Gara). Our computation matches
// DrikPanchang for timing and names on all three previously-unresolved rows.

import test from 'node:test';
import assert from 'node:assert/strict';
import { findKaranaTransition } from '../../lib/astronomy/karanaTransitions.js';
import { toKathmanduString } from '../../lib/astronomy/moonTransitions.js';
import { getKarana, karanaName } from '../../lib/astronomy/karana.js';

const MODE = 'lahiri' as const;
const TOL_MIN = 3;
const BUFFER_MIN = 20;

interface KaranaRefRow {
  label: string;
  date: string;      // YYYY-MM-DD (Gregorian civil date of the transition)
  timeNpt: string;   // HH:MM in NPT (UTC+05:45)
  beforeKarana: string;   // e.g., 'kaulava', 'vishti', 'shakuni'
  afterKarana: string;    // e.g., 'taitila', 'bava', 'chatushpada'
  status: 'verified' | 'unresolved';
}

const ROWS: KaranaRefRow[] = [
  // VERIFIED
  {
    label: '2024-03-26',
    date: '2024-03-26',
    timeNpt: '15:11',
    beforeKarana: 'kaulava',
    afterKarana: 'taitila',
    status: 'verified',
  },
  {
    label: '2024-07-01',
    date: '2024-07-01',
    timeNpt: '10:41',
    beforeKarana: 'vishti',
    afterKarana: 'bava',
    status: 'verified',
  },
  {
    label: '2025-06-16',
    date: '2025-06-16',
    timeNpt: '15:47',
    beforeKarana: 'taitila',
    afterKarana: 'gara',
    status: 'verified',
  },
  {
    label: '2025-07-24',
    date: '2025-07-24',
    timeNpt: '02:44',
    beforeKarana: 'shakuni',
    afterKarana: 'chatushpada',
    status: 'verified',
  },
  {
    label: '2026-03-16',
    date: '2026-03-16',
    timeNpt: '09:56',
    beforeKarana: 'taitila',
    afterKarana: 'gara',
    status: 'verified',
  },

  {
    label: '2025-07-23',
    date: '2025-07-23',
    timeNpt: '15:46',
    beforeKarana: 'vishti',
    afterKarana: 'shakuni',
    status: 'verified',
  },
  {
    label: '2025-04-08',
    date: '2025-04-08',
    timeNpt: '21:27',
    beforeKarana: 'vishti',
    afterKarana: 'bava',
    status: 'verified',
  },
  {
    label: '2026-09-28',
    date: '2026-09-28',
    timeNpt: '19:28',
    beforeKarana: 'gara',
    afterKarana: 'vanija',
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

function checkRow(row: KaranaRefRow): void {
  const endUtc = nptToUtc(row.date, row.timeNpt);
  const beforeUtc = addMin(endUtc, -BUFFER_MIN);
  const afterUtc = addMin(endUtc, BUFFER_MIN);

  // (a) 20 min before -> before karana (independent: from external website)
  const b = getKarana(MODE, beforeUtc);
  const bName = karanaName(b.karanaIndex);
  assert.equal(
    b.karanaIndex,
    expectedKaranaIndex(row.beforeKarana, b.elongationDegrees),
    `[${row.label}] independent: from external website — ${BUFFER_MIN} min before (${toKathmanduString(beforeUtc)}) expected ${row.beforeKarana}, got ${bName} (idx ${b.karanaIndex})`
  );

  // (b) 20 min after -> after karana (independent: from external website)
  const a = getKarana(MODE, afterUtc);
  const aName = karanaName(a.karanaIndex);
  assert.equal(
    a.karanaIndex,
    expectedKaranaIndex(row.afterKarana, a.elongationDegrees),
    `[${row.label}] independent: from external website — ${BUFFER_MIN} min after (${toKathmanduString(afterUtc)}) expected ${row.afterKarana}, got ${aName} (idx ${a.karanaIndex})`
  );

  // (c) root finder within tolerance (independent: from external website)
  const t = findKaranaTransition(MODE, beforeUtc);
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

  // (d) nextKaranaName matches expected after karana
  assert.equal(
    karanaName(t.nextKaranaIndex),
    row.afterKarana,
    `[${row.label}] independent: from external website — nextKaranaName ${karanaName(t.nextKaranaIndex)} != expected ${row.afterKarana}`
  );
}

// Map a karana name to its index given the elongation at that instant.
// The same name appears multiple times in the cycle; we find the index whose
// name matches and whose 6° span contains the given elongation.
function expectedKaranaIndex(name: string, elongation: number): number {
  const idx = Math.floor(elongation / 6);
  const actual = karanaName(idx);
  if (actual !== name) {
    throw new Error(
      `Karana name mismatch: index ${idx} is ${actual}, expected ${name} at elongation ${elongation}°`
    );
  }
  return idx;
}

for (const row of ROWS) {
  test(`karana reference: ${row.label} ${row.beforeKarana}->${row.afterKarana} at ${row.timeNpt} NPT`, () => {
    checkRow(row);
  });
}
