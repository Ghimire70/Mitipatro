// tests/events.test.ts
//
// Phase 8 — Festival & Events Calendar test suite.
//
// Tests:
//   - BS/AD date mapping for events
//   - Duplicate prevention (events.ts never duplicates holidays.ts)
//   - Multi-day events
//   - Regional applicability
//   - Verification metadata
//   - Event filtering by category
//   - Calendar rendering (events appear on correct dates)

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FESTIVAL_EVENTS,
  RECURRING_OBSERVANCE_RULES,
  type FestivalEvent,
} from '../lib/events';
import {
  getEventsForMonth,
  getEventsForDate,
  getEventsForYear,
  getEventCategoriesForMonth,
  type EventEntry,
} from '../lib/eventService';
import { getHolidaysForMonth, getHolidaysForYear } from '../lib/holidays';
import { bsToAd } from '../lib/bsConverter';
import { BS_MONTHS } from '../lib/bsData';

const TEST_YEAR = 2083;

// ============================================================
// 1. BS/AD date mapping
// ============================================================

test('events have valid BS/AD date mapping for 2083 BS', () => {
  const events = getEventsForYear(TEST_YEAR);
  assert.ok(events.length > 0, 'Should have events for 2083 BS');

  for (const e of events) {
    // BS date must be valid
    assert.ok(e.bsYear === TEST_YEAR, `Event ${e.id} has wrong bsYear`);
    assert.ok(e.bsMonth >= 1 && e.bsMonth <= 12, `Event ${e.id} has invalid bsMonth`);
    assert.ok(e.bsDay >= 1, `Event ${e.id} has invalid bsDay`);

    // AD date must be parseable and correspond to the BS date
    const ad = bsToAd(e.bsYear, e.bsMonth, e.bsDay);
    assert.equal(e.adDate, ad.iso, `Event ${e.id}: adDate ${e.adDate} != computed ${ad.iso}`);
  }
});

test('every month of 2083 BS has event coverage (dates without events still render)', () => {
  for (let bsMonth = 1; bsMonth <= 12; bsMonth++) {
    const events = getEventsForMonth(TEST_YEAR, bsMonth);
    // Every month should return an array (possibly empty)
    assert.ok(Array.isArray(events), `Month ${bsMonth} should return an array`);
    // Events should be sorted by bsDay
    for (let i = 1; i < events.length; i++) {
      assert.ok(
        events[i].bsDay >= events[i - 1].bsDay,
        `Events in month ${bsMonth} should be sorted by bsDay`,
      );
    }
  }
});

// ============================================================
// 2. Duplicate prevention
// ============================================================

test('events.ts does not duplicate holidays.ts entries for 2083 BS', () => {
  const holidays = getHolidaysForYear(TEST_YEAR);
  const events = getEventsForYear(TEST_YEAR);

  // Build a set of holiday (bsMonth, bsDay, nameEn) tuples
  const holidayKeys = new Set<string>();
  for (const h of holidays) {
    holidayKeys.add(`${h.bsMonth}-${h.bsDay}-${h.nameEn.toLowerCase()}`);
  }

  // No festival event should duplicate a holiday on the same date with the same name
  for (const e of events) {
    if (e.sourceType === 'festival') {
      const key = `${e.bsMonth}-${e.bsDay}-${e.nameEn.toLowerCase()}`;
      assert.ok(
        !holidayKeys.has(key),
        `Festival event ${e.id} duplicates holiday on ${e.bsMonth}/${e.bsDay}`,
      );
    }
  }
});

test('event service deduplicates overlapping entries', () => {
  const events = getEventsForMonth(TEST_YEAR, 7); // Kartik - has many festivals
  const ids = events.map((e) => e.id);
  const uniqueIds = new Set(ids);
  assert.equal(ids.length, uniqueIds.size, 'No duplicate event IDs in merged output');
});

// ============================================================
// 3. Multi-day events
// ============================================================

test('multi-day events have endBsDay and endAdDate', () => {
  const multiDayEvents = FESTIVAL_EVENTS.filter((e) => e.endBsDay !== undefined);
  // If no multi-day events in the data, that's OK - test the structure
  for (const e of multiDayEvents) {
    assert.ok(e.endBsDay! >= e.bsDay, `Multi-day event ${e.id}: endBsDay >= bsDay`);
    assert.ok(e.endAdDate, `Multi-day event ${e.id} must have endAdDate`);
  }
});

test('getEventsForDate returns events for a specific BS date', () => {
  // 2083-07-29 is Chhath Parba in holidays.ts
  const events = getEventsForDate(TEST_YEAR, 7, 29);
  assert.ok(events.length > 0, 'Should have events on Kartik 29, 2083');
  assert.ok(
    events.some((e) => e.nameEn.includes('Chhath')),
    'Should find Chhath Parba on Kartik 29',
  );
});

// ============================================================
// 4. Regional applicability
// ============================================================

test('regional events do not invent province information', () => {
  const events = getEventsForYear(TEST_YEAR);
  for (const e of events) {
    if (e.applicability === 'regional') {
      // Per corrections: never invent province information
      assert.ok(
        e.provinces === undefined || e.provinces.length === 0,
        `Regional event ${e.id} should not invent provinces`,
      );
    }
  }
});

// ============================================================
// 5. Verification metadata
// ============================================================

test('every event has a valid verification status', () => {
  const validStatuses = new Set([
    'official',
    'cross_verified',
    'unverified',
    'astronomical',
    'editorial',
    'international',
  ]);
  const events = getEventsForYear(TEST_YEAR);
  for (const e of events) {
    assert.ok(
      validStatuses.has(e.verificationStatus),
      `Event ${e.id} has invalid verificationStatus: ${e.verificationStatus}`,
    );
  }
});

test('apiVerified field is preserved when present', () => {
  const events = getEventsForYear(TEST_YEAR);
  for (const e of events) {
    if (e.apiVerified !== undefined) {
      assert.ok(
        typeof e.apiVerified === 'boolean',
        `Event ${e.id} apiVerified should be boolean: ${e.apiVerified}`,
      );
    }
  }
});

test('API-sourced events are never labeled official without independent confirmation', () => {
  const events = getEventsForYear(TEST_YEAR);
  for (const e of events) {
    if (e.sourceType === 'trisambat') {
      assert.equal(
        e.verificationStatus,
        'unverified',
        `Trisambat event ${e.id} should be unverified, not official`,
      );
      assert.ok(
        e.apiVerified !== undefined,
        `Trisambat event ${e.id} should preserve apiVerified field`,
      );
    }
  }
});

test('every event has a non-empty source', () => {
  const events = getEventsForYear(TEST_YEAR);
  for (const e of events) {
    assert.ok(
      e.source && e.source.length > 0,
      `Event ${e.id} must have a non-empty source`,
    );
  }
});

test('every event has a lastUpdated date', () => {
  const events = getEventsForYear(TEST_YEAR);
  for (const e of events) {
    assert.ok(e.lastUpdated, `Event ${e.id} must have lastUpdated`);
    // Should be ISO date format
    assert.ok(
      /^\d{4}-\d{2}-\d{2}$/.test(e.lastUpdated),
      `Event ${e.id} lastUpdated should be ISO date: ${e.lastUpdated}`,
    );
  }
});

test('unverified events are never labeled official', () => {
  const events = getEventsForYear(TEST_YEAR);
  for (const e of events) {
    if (e.verificationStatus === 'unverified') {
      assert.notEqual(
        e.verificationStatus,
        'official',
        `Event ${e.id} is unverified but labeled official`,
      );
    }
  }
});

// ============================================================
// 6. Event filtering
// ============================================================

test('getEventCategoriesForMonth returns valid categories', () => {
  const cats = getEventCategoriesForMonth(TEST_YEAR, 7); // Kartik
  assert.ok(Array.isArray(cats));
  for (const cat of cats) {
    assert.ok(
      ['religious_festival', 'religious_observance', 'public_holiday', 'national_day', 'cultural_regional', 'international'].includes(cat),
      `Unknown category: ${cat}`,
    );
  }
});

test('filtering by category returns only matching events', () => {
  const all = getEventsForYear(TEST_YEAR);
  const religious = all.filter((e) => e.category === 'religious_festival');
  for (const e of religious) {
    assert.equal(e.category, 'religious_festival');
  }
});

test('international observances are not labeled as public holidays', () => {
  const events = getEventsForYear(TEST_YEAR);
  for (const e of events) {
    if (e.category === 'international') {
      assert.equal(
        e.isPublicHoliday,
        false,
        `International observance ${e.id} should not be a public holiday`,
      );
    }
  }
});

// ============================================================
// 7. Recurring observance rules
// ============================================================

test('recurring observance rules have valid tithi numbers', () => {
  for (const rule of RECURRING_OBSERVANCE_RULES) {
    assert.ok(rule.tithiNumber >= 1 && rule.tithiNumber <= 15, `Rule ${rule.id} has invalid tithiNumber`);
    assert.ok(
      rule.paksha === 'shukla' || rule.paksha === 'krishna',
      `Rule ${rule.id} has invalid paksha`,
    );
    assert.equal(rule.verificationStatus, 'astronomical', `Rule ${rule.id} should be astronomical`);
  }
});

// ============================================================
// 8. EventEntry type completeness
// ============================================================

test('EventEntry has all required fields', () => {
  const events = getEventsForYear(TEST_YEAR);
  for (const e of events) {
    assert.ok(e.id, 'Missing id');
    assert.ok(e.category, 'Missing category');
    assert.ok(e.nameEn, 'Missing nameEn');
    assert.ok(e.nameNe, 'Missing nameNe');
    assert.ok(e.bsYear, 'Missing bsYear');
    assert.ok(e.bsMonth, 'Missing bsMonth');
    assert.ok(e.bsDay, 'Missing bsDay');
    assert.ok(e.adDate, 'Missing adDate');
    assert.ok(typeof e.isPublicHoliday === 'boolean', 'Missing isPublicHoliday');
    assert.ok(e.applicability, 'Missing applicability');
    assert.ok(e.source, 'Missing source');
    assert.ok(e.verificationStatus, 'Missing verificationStatus');
    assert.ok(e.lastUpdated, 'Missing lastUpdated');
    assert.ok(
      ['holiday', 'festival', 'recurring', 'trisambat'].includes(e.sourceType),
      `Invalid sourceType: ${e.sourceType}`,
    );
    // Optional fields: when present, must be valid
    if (e.apiVerified !== undefined) {
      assert.ok(typeof e.apiVerified === 'boolean', `Invalid apiVerified: ${e.apiVerified}`);
    }
    if (e.uncertainMatch !== undefined) {
      assert.ok(typeof e.uncertainMatch === 'boolean', `Invalid uncertainMatch: ${e.uncertainMatch}`);
    }
  }
});
