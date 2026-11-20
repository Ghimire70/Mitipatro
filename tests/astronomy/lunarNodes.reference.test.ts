// tests/astronomy/lunarNodes.reference.test.ts
//
// INDEPENDENT REFERENCE TESTS — Stage 8 Lunar Nodes (Rahu/Ketu)
//
// SOURCE: vedicmarga.com /transit/rahu/2026/ and /transit/ — "Rahu moves back
// into Capricorn on 5 Dec 2026"; "Rahu in Aquarius since 18 May 2025";
// "Ketu enters Cancer on 5 December 2026." The site computes Rahu "by mean node
// reckoning," sidereal, Lahiri ayanamsa, Kathmandu (GMT +5:45).
// These are WEBSITE values, NOT Nepal's official patro. Do not interpret a
// pass/fail here as validation against the official Nepali panchang.

import test from 'node:test';
import assert from 'node:assert/strict';
import { getLunarNodes, getKetu } from '../../lib/astronomy/lunarNodes.js';

const MODE = 'lahiri';

function nptNoon(dateStr: string): Date {
  const [y, mo, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, mo - 1, d, 6, 15)); // 12:00 NPT = 06:15 UTC
}

// ---------------------------------------------------------------------------
// Internal consistency (not independent — definitional)
// ---------------------------------------------------------------------------

test('lunarNodes reference: Rahu/Ketu are 180° apart (not independent — definitional)', () => {
  const r = getLunarNodes('lahiri', new Date('2026-11-16T06:00:00Z'));
  const ketu = getKetu('lahiri', new Date('2026-11-16T06:00:00Z'));
  const diff = ((r.rahuSiderealDegrees - ketu.ketuSiderealDegrees + 180) % 360) - 180;
  assert.ok(
    Math.abs(Math.abs(diff) - 180) < 1e-6,
    `Rahu/Ketu separation: diff from 180° = ${Math.abs(Math.abs(diff) - 180).toFixed(6)}°`,
  );
});

// ---------------------------------------------------------------------------
// Independent: Rahu/Ketu sign-entry dates (vedicmarga.com)
// ---------------------------------------------------------------------------

test('lunarNodes reference: Rahu enters Capricorn on 5 Dec 2026 (independent: vedicmarga.com mean-node reckoning)', () => {
  const d4 = getLunarNodes(MODE, nptNoon('2026-12-04')); // Aquarius
  const d5 = getLunarNodes(MODE, nptNoon('2026-12-05')); // boundary day
  const d6 = getLunarNodes(MODE, nptNoon('2026-12-06')); // Capricorn
  assert.equal(d4.rashiIndex, 10, `Rahu on 4 Dec: ${d4.rashiName}, expected Aquarius(10)`);
  assert.equal(d6.rashiIndex, 9, `Rahu on 6 Dec: ${d6.rashiName}, expected Capricorn(9)`);
  // On 5 Dec Rahu crosses the Aquarius|Capricorn (300°) boundary.
  assert.ok(
    Math.abs(d5.rahuSiderealDegrees - 300) <= 1,
    `Rahu on 5 Dec at ${d5.rahuSiderealDegrees.toFixed(4)}°, expected near 300° boundary`,
  );
});

test('lunarNodes reference: Ketu enters Cancer on 5 Dec 2026 (independent: vedicmarga.com)', () => {
  const d4 = getKetu(MODE, nptNoon('2026-12-04')); // Leo
  const d6 = getKetu(MODE, nptNoon('2026-12-06')); // Cancer
  assert.equal(d4.rashiIndex, 4, `Ketu on 4 Dec: ${d4.rashiName}, expected Leo(4)`);
  assert.equal(d6.rashiIndex, 3, `Ketu on 6 Dec: ${d6.rashiName}, expected Cancer(3)`);
  const d5 = getKetu(MODE, nptNoon('2026-12-05'));
  assert.ok(
    Math.abs(d5.ketuSiderealDegrees - 120) <= 1,
    `Ketu on 5 Dec at ${d5.ketuSiderealDegrees.toFixed(4)}°, expected near 120° boundary`,
  );
});

// ---------------------------------------------------------------------------
// Independent: mean node validated against vedicmarga.com Rahu sign
// ---------------------------------------------------------------------------

test('lunarNodes reference: mean node places Rahu in Aquarius through 2026 until 5 Dec (independent: vedicmarga.com)', () => {
  // Rahu in Aquarius (index 10) on these 2026 dates per vedicmarga.com;
  // enters Capricorn only on 5 Dec 2026.
  for (const dateStr of ['2026-01-01', '2026-06-01', '2026-09-01', '2026-11-20']) {
    const r = getLunarNodes(MODE, nptNoon(dateStr));
    assert.equal(
      r.rashiIndex,
      10,
      `mean node: Rahu on ${dateStr} is ${r.rashiName} (${r.rashiIndex}), expected Aquarius(10)`,
    );
  }
});
