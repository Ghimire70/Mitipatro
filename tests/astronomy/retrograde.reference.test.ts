// tests/astronomy/retrograde.reference.test.ts
//
// INDEPENDENT REFERENCE TESTS — Stage 8 Retrograde
//
// SOURCE: vedicmarga.com /transit/saturn/2026/ — "Saturn Retrograde Period in
// 2026: Jul 27 to Dec 11 in Pisces"; Saturn turns direct on 11 Dec 2026.
// Positions are sidereal, Lahiri ayanamsa, Kathmandu (GMT +5:45).
// These are WEBSITE values, NOT Nepal's official patro. Do not interpret a
// pass/fail here as validation against the official Nepali panchang.
//
// Independent values: Saturn retrograde date range for 2026.

import test from 'node:test';
import assert from 'node:assert/strict';
import { getRetrogradeStatus } from '../../lib/astronomy/retrograde.js';

const MODE = 'lahiri';

function nptNoon(dateStr: string): Date {
  const [y, mo, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, mo - 1, d, 6, 15)); // 12:00 NPT = 06:15 UTC
}

test('retrograde reference: Saturn direct before retrograde period (independent: vedicmarga.com retrograde starts 27 Jul 2026)', () => {
  const r = getRetrogradeStatus(MODE, nptNoon('2026-01-15'), 'Saturn');
  assert.equal(r.direction, 'direct');
});

test('retrograde reference: Saturn retrograde within 2026 period (independent: vedicmarga.com Jul 27 - Dec 11)', () => {
  const r = getRetrogradeStatus(MODE, nptNoon('2026-09-01'), 'Saturn');
  assert.equal(r.direction, 'retrograde');
});

test('retrograde reference: Saturn direct after retrograde period (independent: vedicmarga.com retrograde ends 11 Dec 2026)', () => {
  const r = getRetrogradeStatus(MODE, nptNoon('2026-12-20'), 'Saturn');
  assert.equal(r.direction, 'direct');
});
