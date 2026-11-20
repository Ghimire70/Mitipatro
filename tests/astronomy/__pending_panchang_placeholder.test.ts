// tests/astronomy/__pending_panchang_placeholder.test.ts
//
// INDEPENDENT PANCHANG TESTS — sunrise element names
//
// SOURCE: vedicmarga.com (Kathmandu, 27.7172° N, 85.3240° E, NPT = UTC+05:45,
// Lahiri ayanamsa) for 2025-07-23 (2082 साउन ७), corroborated by SanghuNews /
// local Nepali panchang summary (nakshatra आर्द्रा/Ardra, yoga व्याघात/Vyaghata,
// karana भद्रा/Vishti) and monthly Nepali calendars which list sunrise tithi
// Chaturdashi. These are WEBSITE values, NOT Nepal's official patro.
//
// Independent values asserted: sunrise nakshatra name/pada, yoga name, karana
// name. Minute-level end-times and rashi-change/nakshatra-change date-times
// are NOT asserted here — only sunrise-reckoned names are reliably published;
// end-times come solely from vedicmarga.com and are asserted in
// panchanga.reference.test.ts (the karana end mismatch remains test.todo).

import test from 'node:test';
import assert from 'node:assert/strict';
import { getDailyPanchanga } from '../../lib/astronomy/panchanga.js';

const MODE = 'lahiri';

test(
  'panchang: 2025-07-23 sunrise nakshatra = Ardra pada 2 (independent: vedicmarga.com, Kathmandu)',
  () => {
    const p = getDailyPanchanga(new Date(Date.UTC(2025, 6, 23)), MODE);
    assert.equal(
      p.nakshatra.name,
      'ardra',
      `sunrise nakshatra ${p.nakshatra.name} != ardra`,
    );
    assert.equal(
      p.nakshatra.pada,
      2,
      `sunrise pada ${p.nakshatra.pada} != 2`,
    );
  },
);

test(
  'panchang: 2025-07-23 sunrise yoga = Vyaghata (independent: vedicmarga.com, Kathmandu)',
  () => {
    const p = getDailyPanchanga(new Date(Date.UTC(2025, 6, 23)), MODE);
    assert.equal(
      p.yoga.name,
      'vyaghata',
      `sunrise yoga ${p.yoga.name} != vyaghata`,
    );
  },
);

test(
  'panchang: 2025-07-23 sunrise karana = Vishti (independent: vedicmarga.com, Kathmandu)',
  () => {
    const p = getDailyPanchanga(new Date(Date.UTC(2025, 6, 23)), MODE);
    assert.equal(
      p.karana.name,
      'vishti',
      `sunrise karana ${p.karana.name} != vishti`,
    );
  },
);
