// tests/astronomy/panchanga.test.ts
//
// Stage 7 internal-consistency tests for daily Panchanga at sunrise.
// ALL TESTS HERE ARE "NOT INDEPENDENT": expected values are derived from the
// code under test or from our own search, NOT from an external panchang.
// No Stage 1 to 6 formula is changed.

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getDailyPanchanga,
  DEFAULT_NEAR_SUNRISE_WINDOW_MINUTES,
  WEEKDAY_NAMES,
  type DailyPanchanga,
} from '../../lib/astronomy/panchanga.js';
import { getTithi, tithiName } from '../../lib/astronomy/tithi.js';

const MODE = 'lahiri';
const CIVIL_DATE = new Date(Date.UTC(2026, 2, 16)); // Kathmandu 2026-03-16

function sunriseOf(p: DailyPanchanga): Date {
  return p.sunrise.utcInstant!;
}

test('panchanga: returns a well-formed daily panchanga (not independent — range checks)', () => {
  const p = getDailyPanchanga(CIVIL_DATE, MODE);
  assert.equal(p.civilDate, '2026-03-16');
  assert.ok(typeof p.weekday === 'string' && p.weekday.length > 0);
  assert.equal(
    p.weekday,
    WEEKDAY_NAMES[CIVIL_DATE.getUTCDay()],
    `weekday ${p.weekday} != ${WEEKDAY_NAMES[CIVIL_DATE.getUTCDay()]}`,
  );
  assert.ok(p.sunrise.utcInstant !== null && p.sunset.utcInstant !== null);
  assert.ok(
    sunriseOf(p).getTime() < p.sunset.utcInstant!.getTime(),
    'sunrise must precede sunset',
  );
  assert.ok(p.sunrise.kathmanduDisplay!.endsWith('+05:45'));
  assert.ok(p.sunset.kathmanduDisplay!.endsWith('+05:45'));

  for (const el of [p.tithi, p.nakshatra, p.yoga, p.karana]) {
    assert.ok(el.index >= 0);
    assert.ok(typeof el.name === 'string' && el.name.length > 0);
    assert.ok(el.nextIndex >= 0);
    assert.ok(typeof el.nextName === 'string' && el.nextName.length > 0);
    if (el.end !== null) {
      assert.ok(
        el.end.utcInstant.getTime() >= sunriseOf(p).getTime(),
        'element end must not precede sunrise',
      );
    }
    assert.ok(
      el.nearSunrise === null ||
        typeof el.nearSunrise.minutesFromSunrise === 'number',
    );
  }
});

test('panchanga: tithi index and karana index obey tithiIndex = floor(karanaIndex / 2) (not independent — item 1 mapping)', () => {
  const p = getDailyPanchanga(CIVIL_DATE, MODE);
  assert.equal(
    p.tithi.index,
    Math.floor(p.karana.index / 2),
    `tithi ${p.tithi.index} != floor(karana ${p.karana.index} / 2)`,
  );
  assert.equal(p.tithi.name, tithiName(p.tithi.index));
});

test('panchanga: next index wraps to index + 1 (not independent — definitional)', () => {
  const p = getDailyPanchanga(CIVIL_DATE, MODE);
  assert.equal(p.tithi.nextIndex, (p.tithi.index + 1) % 30);
  assert.equal(p.nakshatra.nextIndex, (p.nakshatra.index + 1) % 27);
  assert.equal(p.yoga.nextIndex, (p.yoga.index + 1) % 27);
  assert.equal(p.karana.nextIndex, (p.karana.index + 1) % 60);
});

test('panchanga: tithi carries paksha and tithi number (not independent — composition)', () => {
  const p = getDailyPanchanga(CIVIL_DATE, MODE);
  assert.ok(p.tithi.paksha === 'shukla' || p.tithi.paksha === 'krishna');
  assert.ok(p.tithi.tithiNumber >= 1 && p.tithi.tithiNumber <= 15);
  const t = getTithi(MODE, sunriseOf(p));
  assert.equal(p.tithi.paksha, t.paksha);
  assert.equal(p.tithi.tithiNumber, t.tithiNumber);
});

test('panchanga: nakshatra carries pada (not independent — composition)', () => {
  const p = getDailyPanchanga(CIVIL_DATE, MODE);
  assert.ok(p.nakshatra.pada >= 1 && p.nakshatra.pada <= 4);
});

test('panchanga: end instant is after sunrise instant (not independent — sanity)', () => {
  const p = getDailyPanchanga(CIVIL_DATE, MODE);
  const sr = sunriseOf(p).getTime();
  for (const el of [p.tithi, p.nakshatra, p.yoga, p.karana]) {
    if (el.end !== null) {
      assert.ok(el.end.utcInstant.getTime() >= sr, `${el.name} end precedes sunrise`);
    }
  }
});

test('panchanga: 2026-03-16 nakshatra change is near sunrise (before sunrise) (not independent — near-sunrise flag)', () => {
  const p = getDailyPanchanga(CIVIL_DATE, MODE);
  assert.ok(p.nakshatra.nearSunrise !== null, 'nakshatra should be flagged near sunrise');
  assert.ok(p.nakshatra.nearSunrise!.beforeSunrise, 'nakshatra change should precede sunrise');
  assert.ok(
    Math.abs(p.nakshatra.nearSunrise!.minutesFromSunrise) < DEFAULT_NEAR_SUNRISE_WINDOW_MINUTES,
    `nakshatra gap ${p.nakshatra.nearSunrise!.minutesFromSunrise.toFixed(3)} min should be within ${DEFAULT_NEAR_SUNRISE_WINDOW_MINUTES} min`,
  );
  assert.ok(p.nakshatra.nearSunrise!.changeKathmandu.endsWith('+05:45'));
});

test('panchanga: determinism — same date gives same panchanga (not independent — contract)', () => {
  const a = getDailyPanchanga(CIVIL_DATE, MODE);
  const b = getDailyPanchanga(CIVIL_DATE, MODE);
  assert.deepEqual(a, b);
});

test('panchanga: does not mutate the supplied civil date (not independent — contract)', () => {
  const original = new Date(CIVIL_DATE.getTime());
  const ms = original.getTime();
  getDailyPanchanga(original, MODE);
  assert.equal(original.getTime(), ms, 'Caller Date was mutated');
});

test('panchanga: vriddhi — same tithi at two consecutive sunrises is reported on both dates with the same end (not independent — found in 2025-2026 from our own tithi code)', () => {
  // Real example found by scanning Kathmandu sunrises 2025-01-01 .. 2026-12-31:
  // 2025-01-18 and 2025-01-19 both have tithi index 19 at sunrise.
  const d1 = new Date(Date.UTC(2025, 0, 18));
  const d2 = new Date(Date.UTC(2025, 0, 19));
  const p1 = getDailyPanchanga(d1, MODE);
  const p2 = getDailyPanchanga(d2, MODE);
  assert.equal(p1.tithi.index, 19, `2025-01-18 tithi ${p1.tithi.index} != 19`);
  assert.equal(p2.tithi.index, 19, `2025-01-19 tithi ${p2.tithi.index} != 19`);
  assert.equal(
    p1.tithi.name,
    p2.tithi.name,
    `tithi name differs across vriddhi dates`,
  );
  // Both sunrises fall inside the same tithi (vriddhi), so the end boundary
  // (tithi 19 -> 20) is the same instant; allow bisection noise (~2 s).
  const endDiffMs = Math.abs(
    p1.tithi.end!.utcInstant.getTime() - p2.tithi.end!.utcInstant.getTime(),
  );
  assert.ok(
    endDiffMs < 2000,
    `vriddhi end instants differ by ${endDiffMs} ms`,
  );
  assert.equal(p1.tithi.nextIndex, 20, `p1 nextIndex ${p1.tithi.nextIndex} != 20`);
  assert.equal(p2.tithi.nextIndex, 20, `p2 nextIndex ${p2.tithi.nextIndex} != 20`);
});

test('panchanga: kshaya — tithi skipped between two consecutive sunrises is assigned to no date (not independent — found in 2025-2026 from our own tithi code)', () => {
  // Real example found by scanning Kathmandu sunrises 2025-01-01 .. 2026-12-31:
  // 2025-01-11 has tithi 11 at sunrise; 2025-01-12 has tithi 13 at sunrise,
  // so tithi 12 (trayodashi) is skipped (kshaya) between them.
  const d1 = new Date(Date.UTC(2025, 0, 11));
  const d2 = new Date(Date.UTC(2025, 0, 12));
  const p1 = getDailyPanchanga(d1, MODE);
  const p2 = getDailyPanchanga(d2, MODE);
  assert.equal(p1.tithi.index, 11, `2025-01-11 tithi ${p1.tithi.index} != 11`);
  assert.equal(p2.tithi.index, 13, `2025-01-12 tithi ${p2.tithi.index} != 13`);
  assert.equal(
    (p2.tithi.index - p1.tithi.index + 30) % 30,
    2,
    `tithi should skip one index: ${p1.tithi.index} -> ${p2.tithi.index}`,
  );
  const skipped = (p1.tithi.index + 1) % 30;
  assert.equal(skipped, 12, `skipped tithi should be 12, got ${skipped}`);
});
