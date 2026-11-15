// tests/astronomy/planetaryPositions.test.ts
//
// Stage 1 unit tests for the getPlanetaryPositions() module.
// These tests validate internal contract (range checks, error handling,
// immutability, geocentric validation).
// Reference values in this file were computed with Astronomy Engine itself
// and are labelled accordingly. For independent JPL DE441 comparison, see
// planetaryPositions.jpl.test.ts in this directory.

import test from 'node:test';
import assert from 'node:assert/strict';
import { getPlanetaryPositions } from '../../lib/astronomy/index.js';
import type { BodyId } from '../../lib/astronomy/index.js';

// Reference values for 2024-03-20T03:06:00Z
// Source: Astronomy Engine v2.1.19 (self-computed – NOT independent)
const AE_REFERENCE: Record<BodyId, { lon: number; lat: number; dist: number }> = {
  Sun:     { lon: 359.9997, lat:  0.0001, dist:  0.995863 },
  Moon:    { lon: 123.8156, lat:  5.0063, dist:  0.002682 },
  Mercury: { lon:  17.4419, lat:  1.4774, dist:  1.027335 },
  Venus:   { lon: 340.1714, lat: -1.2899, dist:  1.581414 },
  Mars:    { lon: 327.7735, lat: -1.1734, dist:  2.136091 },
  Jupiter: { lon:  44.8846, lat: -0.8534, dist:  5.656963 },
  Saturn:  { lon: 342.2240, lat: -1.6469, dist: 10.659139 },
};

function approxEqual(a: number, b: number, tol: number): boolean {
  return Math.abs(a - b) <= tol;
}

const REF_DATE = new Date('2024-03-20T03:06:00Z');

test('returns structured snapshot with correct metadata', () => {
  const snap = getPlanetaryPositions(REF_DATE);
  assert.equal(snap.coordinateSystem, 'geocentric-tropical-ecliptic');
  assert.equal(snap.engine.name, 'astronomy-engine');
  assert.ok(snap.engine.version.length > 0, 'version must be non-empty');
  assert.equal(snap.timestamp, REF_DATE.toISOString());
});

test('returns valid positions for all seven supported bodies (AE self-check)', () => {
  const snap = getPlanetaryPositions(REF_DATE);
  for (const [body, ref] of Object.entries(AE_REFERENCE) as [BodyId, typeof AE_REFERENCE[BodyId]][]) {
    const pos = snap.positions[body];
    assert.ok(
      approxEqual(pos.longitude, ref.lon, 0.01),
      `${body} longitude: got ${pos.longitude.toFixed(4)}, expected ≈ ${ref.lon}`
    );
    assert.ok(
      approxEqual(pos.latitude, ref.lat, 0.01),
      `${body} latitude: got ${pos.latitude.toFixed(4)}, expected ≈ ${ref.lat}`
    );
    assert.ok(
      approxEqual(pos.distance, ref.dist, 0.001),
      `${body} distance: got ${pos.distance.toFixed(6)}, expected ≈ ${ref.dist}`
    );
  }
});

test('all longitudes are normalized to [0, 360)', () => {
  const snap = getPlanetaryPositions(REF_DATE);
  for (const [body, pos] of Object.entries(snap.positions)) {
    assert.ok(
      pos.longitude >= 0 && pos.longitude < 360,
      `${body} longitude ${pos.longitude} is outside [0,360)`
    );
  }
});

test('all latitudes are finite numbers', () => {
  const snap = getPlanetaryPositions(REF_DATE);
  for (const [body, pos] of Object.entries(snap.positions)) {
    assert.ok(Number.isFinite(pos.latitude), `${body} latitude is not finite: ${pos.latitude}`);
  }
});

test('all distances are positive finite numbers', () => {
  const snap = getPlanetaryPositions(REF_DATE);
  for (const [body, pos] of Object.entries(snap.positions)) {
    assert.ok(Number.isFinite(pos.distance) && pos.distance > 0,
      `${body} distance invalid: ${pos.distance}`);
  }
});

test('throws on an invalid Date (NaN time)', () => {
  assert.throws(
    () => getPlanetaryPositions(new Date('not-a-date')),
    /Invalid Date/,
    'Expected error for invalid Date'
  );
});

test('throws when non-Date is supplied', () => {
  assert.throws(
    // @ts-ignore – deliberate misuse for contract test
    () => getPlanetaryPositions('2024-01-01'),
    /Invalid Date/,
    'Expected error for string input'
  );
});

test('does not mutate the supplied Date object', () => {
  const original = new Date('2024-03-20T03:06:00Z');
  const originalMs = original.getTime();
  getPlanetaryPositions(original);
  assert.equal(original.getTime(), originalMs, 'Caller Date was mutated');
});

test('geocentric frame: Sun longitude is near 0° at the 2024 spring equinox', () => {
  // At the March equinox the geocentric apparent ecliptic longitude of the Sun
  // must be very close to 0° (or equivalently 360°). A heliocentric result would
  // give ~180°.
  const snap = getPlanetaryPositions(REF_DATE);
  const lon = snap.positions.Sun.longitude;
  const diff = Math.min(Math.abs(lon), Math.abs(lon - 360));
  assert.ok(diff < 0.02, `Sun longitude ${lon.toFixed(4)}° — expected near 0° for geocentric equinox`);
});

test('different timestamps produce meaningfully different positions', () => {
  const dateA = new Date('2024-03-20T03:06:00Z');
  const dateB = new Date('2024-06-20T00:00:00Z'); // summer solstice
  const snapA = getPlanetaryPositions(dateA);
  const snapB = getPlanetaryPositions(dateB);
  // Sun moves ~90° in 3 months; check it has moved significantly.
  const diff = Math.abs(snapB.positions.Sun.longitude - snapA.positions.Sun.longitude);
  assert.ok(diff > 80, `Sun moved only ${diff.toFixed(2)}° over 3 months — suspiciously small`);
});
