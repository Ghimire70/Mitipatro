// tests/astronomy/__pending_panchang_tithi.test.ts
//
// PLACEHOLDER — INDEPENDENT PANCHANG TITHI TESTS (NOT IMPLEMENTED).
//
// This file is intentionally a pending/placeholder test. It exists so the
// independent panchang validation suite for Tithi has a clearly named home and
// CANNOT be mistaken for a passing test.
//
// What is needed to implement real tests here (to be supplied by the user):
//   - Nepali panchang dates with SOURCE (panchang name/edition/publisher),
//     LOCATION, and TIME (UTC or Asia/Kathmandu) for:
//       * Tithi index/name/paksha on specific dates,
//       * Tithi-change date-times,
//   - Clarification whether change-times are exact geocentric crossing
//     instants (converted to Asia/Kathmandu) or sunrise-reckoned panchang times.
//
// Until that reference data is provided, no independent test can be written.
// This placeholder is marked `test.todo` (pending) and will NOT run and
// will NOT pass. Do not replace it with expected values computed from
// Astronomy Engine or from the code under test — that would not be
// independent validation.

import test from 'node:test';

test.todo(
  'PENDING: independent panchang Tithi reference tests — provide Nepali panchang dates (source, location, time) before enabling; this is not a real test and must not pass',
);
