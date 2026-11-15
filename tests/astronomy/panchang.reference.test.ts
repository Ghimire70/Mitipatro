// tests/astronomy/panchang.reference.test.ts
//
// INDEPENDENT REFERENCE TESTS — Stage 2
//
// SOURCE: values copied by the user on 15 Nov 2026 from vedicmarga.com
// Kathmandu panchang pages. These are WEBSITE values, NOT Nepal's official
// patro. Do not interpret a pass/fail here as validation against the official
// Nepali panchang.
//
// Every expected value below is: independent: from external website.
//
// Times are Nepal time (UTC+05:45). Tolerance: 3 minutes for change times
// (the site's own times drifted 1–2 minutes between reads). Not loosened.

import test from 'node:test';
import assert from 'node:assert/strict';
import { findMoonTransition, toKathmanduString } from '../../lib/astronomy/moonTransitions.js';
import { getRashiNakshatraPada, nakshatraName, rashiName, NAKSHATRA_IDS } from '../../lib/astronomy/nakshatra.js';

const MODE = 'lahiri' as const;
const BODY = 'Moon';
const TOL_MIN = 3;

// Nakshatra index lookup (spelling-independent identity).
// Transliteration alias: some panchang sources spell Dhanishtha as 'Dhanishta'.
// Both refer to the same nakshatra (index 22); this is NOT a loosened tolerance.
const NAK_INDEX: Record<string, number> = {};
NAKSHATRA_IDS.forEach((name, i) => { NAK_INDEX[name] = i; });
NAK_INDEX['dhanishta'] = 22;

function nakIndexOf(name: string): number {
  const idx = NAK_INDEX[name.toLowerCase()];
  if (idx === undefined) {
    throw new Error(`Unknown nakshatra name: ${name}`);
  }
  return idx;
}

function nptToUtc(dateStr: string, timeStr: string): Date {
  const y = Number(dateStr.slice(0, 4));
  const mo = Number(dateStr.slice(5, 7)) - 1;
  const d = Number(dateStr.slice(8, 10));
  const [hh, mm] = timeStr.split(':').map(Number);
  const nptAsUtcMs = Date.UTC(y, mo, d, hh, mm, 0, 0);
  return new Date(nptAsUtcMs - 5 * 3600 * 1000 - 45 * 60 * 1000);
}
function addMin(date: Date, m: number): Date { return new Date(date.getTime() + m * 60000); }
function minDiff(a: Date, b: Date): number { return Math.abs(a.getTime() - b.getTime()) / 60000; }

interface Row { label: string; date: string; timeNpt: string; before: string; after: string; checkRashi?: boolean; }

const ROWS: Row[] = [
  { label: '2024-07-01', date: '2024-07-01', timeNpt: '06:41', before: 'Ashwini', after: 'Bharani' },
  { label: '2025-07-23', date: '2025-07-23', timeNpt: '18:09', before: 'Ardra', after: 'Punarvasu' },
  { label: '2025-04-08', date: '2025-04-08', timeNpt: '08:10', before: 'Ashlesha', after: 'Magha' },
  { label: '2024-03-26', date: '2024-03-26', timeNpt: '13:48', before: 'Hasta', after: 'Chitra' },
  { label: '2025-06-17', date: '2025-06-17', timeNpt: '01:28', before: 'Dhanishta', after: 'Shatabhisha' },
  { label: '2026-09-28', date: '2026-09-28', timeNpt: '10:31', before: 'Revati', after: 'Ashwini', checkRashi: true },
];

function checkRow(row: Row): void {
  const endUtc = nptToUtc(row.date, row.timeNpt);
  const beforeUtc = addMin(endUtc, -20);
  const afterUtc = addMin(endUtc, 20);

  // (a) 20 min before -> before nakshatra (independent: from external website)
  const b = getRashiNakshatraPada(MODE, beforeUtc, BODY);
  const bNak = nakshatraName(b.nakshatraIndex);
  assert.equal(
    b.nakshatraIndex,
    nakIndexOf(row.before),
    `[${row.label}] independent: from external website — 20 min before (${toKathmanduString(beforeUtc)}) expected ${row.before}, got ${bNak}`
  );

  // (b) 20 min after -> after nakshatra (independent: from external website)
  const a = getRashiNakshatraPada(MODE, afterUtc, BODY);
  const aNak = nakshatraName(a.nakshatraIndex);
  assert.equal(
    a.nakshatraIndex,
    nakIndexOf(row.after),
    `[${row.label}] independent: from external website — 20 min after (${toKathmanduString(afterUtc)}) expected ${row.after}, got ${aNak}`
  );

  // (c) root finder within tolerance (independent: from external website)
  const t = findMoonTransition(MODE, beforeUtc, 'nakshatra');
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

  // (d) row 6 rashi: Meen before, Mesh after (independent: from external website)
  if (row.checkRashi) {
    assert.equal(rashiName(b.rashiIndex), 'meen', `[${row.label}] independent: from external website — rashi before expected meen, got ${rashiName(b.rashiIndex)}`);
    assert.equal(rashiName(a.rashiIndex), 'mesha', `[${row.label}] independent: from external website — rashi after expected mesha, got ${rashiName(a.rashiIndex)}`);
  }
}

for (const row of ROWS) {
  test(`panchang reference: ${row.label} ${row.before}->${row.after} at ${row.timeNpt} NPT`, () => {
    checkRow(row);
  });
}

test('panchang reference: informational pada at sunrise (does not fail suite)', () => {
  const INFO = [
    { label: '2024-07-01 05:11', date: '2024-07-01', timeNpt: '05:11', expNak: 'Ashwini', expPada: 4 },
    { label: '2025-07-23 05:21', date: '2025-07-23', timeNpt: '05:21', expNak: 'Ardra', expPada: 2 },
    { label: '2025-04-08 05:46', date: '2025-04-08', timeNpt: '05:46', expNak: 'Ashlesha', expPada: 4 },
    { label: '2024-03-26 06:00', date: '2024-03-26', timeNpt: '06:00', expNak: 'Hasta', expPada: 3 },
    { label: '2025-06-16 05:07', date: '2025-06-16', timeNpt: '05:07', expNak: 'Dhanishta', expPada: 1 },
    { label: '2026-09-28 05:54', date: '2026-09-28', timeNpt: '05:54', expNak: 'Revati', expPada: 4 },
  ];
  for (const c of INFO) {
    const instant = nptToUtc(c.date, c.timeNpt);
    const r = getRashiNakshatraPada(MODE, instant, BODY);
    const nak = nakshatraName(r.nakshatraIndex);
    const pada = r.pada;
    const nakOk = r.nakshatraIndex === nakIndexOf(c.expNak);
    const padaOk = pada === c.expPada;
    console.log(
      `[INFORMATIONAL] ${c.label} ${toKathmanduString(instant)} ` +
      `nak=${nak} (exp ${c.expNak} ${nakOk ? 'OK' : 'MISMATCH'}) ` +
      `pada=${pada} (exp ${c.expPada} ${padaOk ? 'OK' : 'MISMATCH'})`
    );
    // Intentionally no assert: informational only, must not fail the suite.
  }
});

