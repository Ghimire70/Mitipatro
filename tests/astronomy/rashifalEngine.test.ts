// tests/astronomy/rashifalEngine.test.ts
//
// Rashifal engine tests — published reference rows only.
// Independent external sources (websites), NOT code-under-test values.
// Tolerance: 3 minutes for transition times. Not loosened.
//
// SOURCE ROWS:
//   2026-09-06 AD: Chandrarashi Mithun at sunrise (Ratopati, Nepali panchang page
//                  — website value, not official)
//   2025-04-08 AD: Ashlesha to Magha at 08:10 (Karka → Simha) — website value,
//                  not official
//   2026-09-28 AD: Revati to Ashwini at 10:31 (Meen → Mesh) — website value,
//                  not official
//
// Labelled 'independent: external website, not official'.

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeRashifalEngine,
  moonPositionFromSign,
  RASHI_NAMES,
} from '../../lib/rashifalEngine.js';
import { adToBs } from '../../lib/bsConverter.js';

const MODE_SOURCE_LABEL = 'independent: external website, not official';

const RASHI_INDEX: Record<string, number> = {
  mesha: 0,
  vrisha: 1,
  mithun: 2,
  karkat: 3,
  simha: 4,
  kanya: 5,
  tula: 6,
  vrischik: 7,
  dhanu: 8,
  makar: 9,
  kumbha: 10,
  meen: 11,
};

// Convert AD date (from published panchang) to BS date for engine input.
function adToBsDate(adYear: number, adMonth: number, adDay: number): { year: number; month: number; day: number } {
  const bs = adToBs({ year: adYear, month: adMonth, day: adDay });
  return { year: bs.year, month: bs.month, day: bs.day };
}

function nptToUtc(dateStr: string, timeStr: string): Date {
  const y = Number(dateStr.slice(0, 4));
  const mo = Number(dateStr.slice(5, 7)) - 1;
  const d = Number(dateStr.slice(8, 10));
  const [hh, mm] = timeStr.split(':').map(Number);
  return new Date(Date.UTC(y, mo, d, hh, mm, 0, 0) - 5 * 3600 * 1000 - 45 * 60 * 1000);
}

function minDiff(a: Date, b: Date): number {
  return Math.abs(a.getTime() - b.getTime()) / 60000;
}

test(
  'rashifal engine: 2026-09-06 moon rashi at sunrise = Mithun (independent: external website, not official)',
  () => {
    const bs = adToBsDate(2026, 9, 6);
    const result = computeRashifalEngine(bs.year, bs.month, bs.day, 'mesha');
    assert.equal(
      result.moonRashiIndex,
      RASHI_INDEX.mithun,
      `Moon rashi at sunrise 2026-09-06 = ${RASHI_NAMES[result.moonRashiIndex]}, expected mithun (${MODE_SOURCE_LABEL})`,
    );
  },
);

test(
  'rashifal engine: 2025-04-08 moon rashi change Karka → Simha at ~08:10 NPT (independent: external website, not official)',
  () => {
    const bs = adToBsDate(2025, 4, 8);
    const result = computeRashifalEngine(bs.year, bs.month, bs.day, 'mesha');

    // Before the change: Moon in Karka (index 3)
    assert.equal(
      result.moonRashiIndex,
      RASHI_INDEX.karkat,
      `Moon rashi at sunrise 2025-04-08 = ${RASHI_NAMES[result.moonRashiIndex]}, expected karkat (${MODE_SOURCE_LABEL})`,
    );

    // After the change: Moon in Simha (index 4)
    assert.ok(result.changesSignToday, 'Moon should change sign today');
    assert.ok(result.nextChangeUtc !== null, 'Next change should exist');

    // Change time within 3 minutes of 08:10 NPT
    const expected = nptToUtc('2025-04-08', '08:10');
    const diff = minDiff(result.nextChangeUtc!, expected);
    assert.ok(
      diff <= 3,
      `Change time diff ${diff.toFixed(3)} min > 3 min tolerance (${MODE_SOURCE_LABEL})`,
    );
  },
);

test(
  'rashifal engine: 2026-09-28 moon rashi change Meen → Mesh at ~10:31 NPT (independent: external website, not official)',
  () => {
    const bs = adToBsDate(2026, 9, 28);
    const result = computeRashifalEngine(bs.year, bs.month, bs.day, 'mesha');

    // Before the change: Moon in Meen (index 11)
    assert.equal(
      result.moonRashiIndex,
      RASHI_INDEX.meen,
      `Moon rashi at sunrise 2026-09-28 = ${RASHI_NAMES[result.moonRashiIndex]}, expected meen (${MODE_SOURCE_LABEL})`,
    );

    // After the change: Moon in Mesha (index 0)
    assert.ok(result.changesSignToday, 'Moon should change sign today');
    assert.ok(result.nextChangeUtc !== null, 'Next change should exist');

    // Change time within 3 minutes of 10:31 NPT
    const expected = nptToUtc('2026-09-28', '10:31');
    const diff = minDiff(result.nextChangeUtc!, expected);
    assert.ok(
      diff <= 3,
      `Change time diff ${diff.toFixed(3)} min > 3 min tolerance (${MODE_SOURCE_LABEL})`,
    );
  },
);

test(
  'rashifal engine: moonPositionFromSign maps correctly (deterministic, not sourced)',
  () => {
    // Moon in own sign -> position 1
    assert.equal(moonPositionFromSign(0, 0), 1);
    assert.equal(moonPositionFromSign(5, 5), 1);
    // Moon one sign ahead -> position 2
    assert.equal(moonPositionFromSign(0, 1), 2);
    // Moon one sign behind (wrap) -> position 12
    assert.equal(moonPositionFromSign(0, 11), 12);
    assert.equal(moonPositionFromSign(1, 0), 12);
  },
);

import { RASHIFAL_READINGS } from '../../lib/rashifalReadings.js';

test(
  'rashifal readings: all approved entries have source original-editorial and non-empty text (gate check)',
  () => {
    for (const r of RASHIFAL_READINGS) {
      if (r.approved === true) {
        assert.equal(
          r.source,
          'original-editorial',
          `Approved reading at position ${r.position} variant ${r.variant} has source ${r.source}, expected original-editorial`,
        );
        assert.ok(
          r.textNe.trim().length > 0,
          `Approved reading at position ${r.position} variant ${r.variant} has empty text`,
        );
      }
    }
  },
);

test(
  'rashifal readings: unapproved entries are never displayable (gate check)',
  () => {
    const unapproved = RASHIFAL_READINGS.filter((r) => r.approved !== true);
    for (const r of unapproved) {
      assert.ok(
        r.approved !== true,
        `Unapproved reading at position ${r.position} variant ${r.variant} must not be displayable`,
      );
    }
  },
);
