// tests/astronomy/planetaryPositions.jpl.extended.test.ts
//
// INDEPENDENT VALIDATION — Stage 10 Extended JPL DE441 Coverage
//
// Extends tests/astronomy/planetaryPositions.jpl.test.ts with additional
// dates across seasons to detect seasonal ephemeris differences between
// Astronomy Engine (VSOP87/ELP2000-82B) and JPL DE441.
//
// SOURCE: NASA/JPL Horizons On-Line Ephemeris System (DE441)
//   API endpoint: https://ssd.jpl.nasa.gov/api/horizons.api (API v1.2)
//   EPHEM_TYPE   = OBSERVER
//   CENTER       = '500@399'  (Earth geocenter)
//   QUANTITIES   = '20,31'    (20 = delta range AU; 31 = ObsEcLon, ObsEcLat)
//   REF_SYSTEM   = 'J2000'
//   AIRLESS      = YES
//
// NOTE: Only one date (2024-03-20T03:06:00Z) has verified JPL DE441 values
// retrieved live from the Horizons API. Additional dates require live JPL
// API queries — values below are NOT filled in for other dates because
// fabricating ephemeris constants violates AGENTS.md.
//   - Do not guess JPL values.
//   - Add new entries only after querying JPL Horizons live.
//
// Reference instant (VERIFIED against JPL Horizons API, retrieved 2026-11-15):
//   2024-Mar-20 03:06:00.0000 UT  (Julian date 2460389.628472 UT1 ≈ UTC)
//
// Coordinate convention matches getPlanetaryPositions():
//   Observer: Earth geocenter; Ecliptic of date (tropical); IAU76/80 precession
//   + nutation; Aberration corrected; Light-time corrected; Gravitational
//   deflection corrected; Longitude degrees [0,360); Latitude degrees (-90,90);
//   Distance AU.
//
// Known convention differences:
//   • JPL uses DE441; Astronomy Engine uses VSOP87/ELP2000-82B.
//   • Measured errors at 2024-03-20T03:06:00Z:
//       Moon longitude: 0.000442° (1.59 arcseconds)
//       Moon latitude:  0.000079° (0.28 arcseconds)
//       Moon distance:  0.00000028 AU

import test from 'node:test';
import assert from 'node:assert/strict';
import { getPlanetaryPositions } from '../../lib/astronomy/index.js';
import type { BodyId } from '../../lib/astronomy/index.js';

interface JplRef {
  lonJpl: number;   // ObsEcLon degrees
  latJpl: number;   // ObsEcLat degrees
  distJpl: number;  // delta AU (apparent range)
  lonTol: number;   // tolerance in degrees for longitude
  latTol: number;   // tolerance in degrees for latitude
  distTol: number;  // tolerance in AU for distance
  source: string;   // source URL or description
}

// Only the verified instant is filled in. Additional dates require live JPL
// API queries — do not fabricate values.
const JPL_DE441: Record<string, { instant: Date; refs: Record<BodyId, JplRef> }> = {
  '2024-03-20T03:06:00Z': {
    instant: new Date('2024-03-20T03:06:00Z'),
    refs: {
      Sun: {
        lonJpl: 359.9997093, latJpl: 0.0001109, distJpl: 0.99586330743730,
        lonTol: 0.017, latTol: 0.017, distTol: 0.0001,
        source: 'JPL Horizons API, DE441, retrieved 2026-11-15',
      },
      Moon: {
        lonJpl: 123.8151802, latJpl: 5.0063811, distJpl: 0.00268218017484,
        lonTol: 0.10, latTol: 0.10, distTol: 0.000001,
        source: 'JPL Horizons API, DE441, retrieved 2026-11-15',
      },
      Mercury: {
        lonJpl: 17.4409072, latJpl: 1.4774826, distJpl: 1.02738668422192,
        lonTol: 0.017, latTol: 0.017, distTol: 0.0001,
        source: 'JPL Horizons API, DE441, retrieved 2026-11-15',
      },
      Venus: {
        lonJpl: 340.1712838, latJpl: -1.2899750, distJpl: 1.58135414008827,
        lonTol: 0.017, latTol: 0.017, distTol: 0.0001,
        source: 'JPL Horizons API, DE441, retrieved 2026-11-15',
      },
      Mars: {
        lonJpl: 327.7733973, latJpl: -1.1734256, distJpl: 2.13599444747524,
        lonTol: 0.017, latTol: 0.017, distTol: 0.0001,
        source: 'JPL Horizons API, DE441, retrieved 2026-11-15',
      },
      Jupiter: {
        lonJpl: 44.8856241, latJpl: -0.8526435, distJpl: 5.65736183181970,
        lonTol: 0.017, latTol: 0.017, distTol: 0.001,
        source: 'JPL Horizons API, DE441, retrieved 2026-11-15',
      },
      Saturn: {
        lonJpl: 342.2254263, latJpl: -1.6453503, distJpl: 10.65840982446910,
        lonTol: 0.017, latTol: 0.017, distTol: 0.001,
        source: 'JPL Horizons API, DE441, retrieved 2026-11-15',
      },
    },
  },
};

function lonDiff(a: number, b: number): number {
  let d = Math.abs(a - b);
  if (d > 180) d = 360 - d;
  return d;
}

function approxEqual(a: number, b: number, tol: number): boolean {
  return Math.abs(a - b) <= tol;
}

test(
  'JPL DE441 extended: all seven bodies pass longitude comparison at every verified instant',
  () => {
    for (const [key, entry] of Object.entries(JPL_DE441)) {
      const snap = getPlanetaryPositions(entry.instant);
      for (const [body, ref] of Object.entries(entry.refs) as [BodyId, JplRef][]) {
        const pos = snap.positions[body];
        const diff = lonDiff(pos.longitude, ref.lonJpl);
        assert.ok(
          diff <= ref.lonTol,
          `${key} ${body} longitude: AE=${pos.longitude.toFixed(6)}° vs JPL=${ref.lonJpl.toFixed(6)}°  diff=${diff.toFixed(4)}°  tol=${ref.lonTol}°  source=${ref.source}`,
        );
      }
    }
  },
);

test(
  'JPL DE441 extended: all seven bodies pass latitude comparison at every verified instant',
  () => {
    for (const [key, entry] of Object.entries(JPL_DE441)) {
      const snap = getPlanetaryPositions(entry.instant);
      for (const [body, ref] of Object.entries(entry.refs) as [BodyId, JplRef][]) {
        const pos = snap.positions[body];
        const diff = Math.abs(pos.latitude - ref.latJpl);
        assert.ok(
          diff <= ref.latTol,
          `${key} ${body} latitude: AE=${pos.latitude.toFixed(6)}° vs JPL=${ref.latJpl.toFixed(6)}°  diff=${diff.toFixed(4)}°  tol=${ref.latTol}°  source=${ref.source}`,
        );
      }
    }
  },
);

test(
  'JPL DE441 extended: all seven bodies pass distance comparison at every verified instant',
  () => {
    for (const [key, entry] of Object.entries(JPL_DE441)) {
      const snap = getPlanetaryPositions(entry.instant);
      for (const [body, ref] of Object.entries(entry.refs) as [BodyId, JplRef][]) {
        const pos = snap.positions[body];
        const diff = Math.abs(pos.distance - ref.distJpl);
        assert.ok(
          diff <= ref.distTol,
          `${key} ${body} distance: AE=${pos.distance.toFixed(8)} AU vs JPL=${ref.distJpl.toFixed(8)} AU  diff=${diff.toFixed(8)} AU  tol=${ref.distTol} AU  source=${ref.source}`,
        );
      }
    }
  },
);
