// tests/astronomy/__pending_panchang_tithi.test.ts
//
// INDEPENDENT PANCHANG TITHI TESTS
//
// SOURCE: vedicmarga.com (Kathmandu, 27.7172° N, 85.3240° E, NPT = UTC+05:45,
// Lahiri ayanamsa) for 2025-07-23 (2082 साउन ७), corroborated by SanghuNews /
// local Nepali panchang summary and monthly Nepali calendars (ramropatro,
// hamropatro, nepalipatro) which list the sunrise tithi as Chaturdashi.
// These are WEBSITE values, NOT Nepal's official patro.
//
// Independent values asserted: sunrise tithi name and paksha.
// Tithi-change date-times are NOT asserted here — only sunrise-reckoned names
// are reliably published by the sources above; minute-level end times come
// solely from vedicmarga.com and are asserted in panchanga.reference.test.ts.

import test from 'node:test';
import assert from 'node:assert/strict';
import { getDailyPanchanga } from '../../lib/astronomy/panchanga.js';

const MODE = 'lahiri';

test(
  'panchang tithi: 2025-07-23 sunrise tithi = Krishna Chaturdashi (independent: vedicmarga.com, Kathmandu)',
  () => {
    const p = getDailyPanchanga(new Date(Date.UTC(2025, 6, 23)), MODE);
    assert.equal(
      p.tithi.name,
      'chaturdashi',
      `sunrise tithi ${p.tithi.name} != chaturdashi`,
    );
    assert.equal(
      p.tithi.paksha,
      'krishna',
      `sunrise paksha ${p.tithi.paksha} != krishna`,
    );
  },
);
