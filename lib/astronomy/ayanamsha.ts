// lib/astronomy/ayanamsha.ts
//
// Stage 2 sidereal layer — NEW FILE (Stage 1 files are untouched).
//
// Computes the Lahiri (Chitrapaksha) ayanamsha and exposes it as a swappable
// mode so a different ayanamsha can be plugged in later.
//
// CONVENTION (approved Stage 2):
//   sidereal_lon = true_apparent_ecliptic_lon  -  A_true_Lahiri(t)
//   A_true_Lahiri(t) = A_mean_Lahiri(t) + dpsi(t)/3600
//
// Stage 1 (getPlanetaryPositions) already returns the TRUE apparent
// ecliptic-of-date longitude (precession + nutation, true equinox of date).
// Subtracting the TRUE ayanamsha cancels the nutation term, so the sidereal
// longitude is nutation-independent (see JME ayanamsha docs §1.1).
//
// dpsi unit: CONFIRMED arcseconds from the installed astronomy.js
// (iau2000b returns dpsi in arcsec; e_tilt re-exposes tilt.dpsi).

import { MakeTime, e_tilt, type AstroTime } from 'astronomy-engine';

/** Supported ayanamsha modes. Parameterized so the ayanamsha can be swapped later. */
export type AyanamshaMode = 'lahiri';

/** Result of an ayanamsha computation. All angles in degrees unless noted. */
export interface AyanamshaResult {
  mode: AyanamshaMode;
  /** TT Julian Date of the instant (J2000 + tt days). */
  jdTt: number;
  /** Centuries (TT) from J2000.0. */
  tCenturies: number;
  /** Mean ayanamsha in degrees: A(1950.0) + IAU1976 precession(1950.0 -> t). */
  meanDegrees: number;
  /** Nutation in longitude from Astronomy Engine e_tilt(), arcseconds. */
  dpsiArcsec: number;
  /** True ayanamsha in degrees: meanDegrees + dpsiArcsec/3600. */
  trueDegrees: number;
}

/* ------------------------------------------------------------------ */
/* CONSTANTS — every constant carries its source and verification note */
/* ------------------------------------------------------------------ */

/**
 * Reference epoch for the Lahiri (Chitrapaksha) ayanamsha: 1950.0
 * = 1950-01-01 12:00 TT = JD 2433282.5.
 *
 * Source: Report of the Calendar Reform Committee, Government of India
 * (CSIR, New Delhi, November 1955); N. C. Lahiri, Secretary & Chief
 * Ephemeris Compiler; the Chitra Paksha / Lahiri ayanamsha. Cited via
 * Astrodai's reference library (Part C: Astronomy & Calendar).
 *
 * VERIFIED: epoch year 1950.0 and JD 2433282.5 are consistent with the
 * 1955 Committee specification as quoted by Astrodai.
 */
export const LAHIRI_EPOCH_JD = 2433282.5;

/**
 * Value of the Lahiri ayanamsha at the reference epoch 1950.0:
 * 23° 09' 34" = 83374 arcseconds = 23.159444... degrees.
 *
 * Source: same 1955 Calendar Reform Committee table (initial value),
 * as quoted by Astrodai.
 *
 * UNVERIFIED: the refined sub-arcsecond value published in the Indian
 * Astronomical Ephemeris (1985 ed.) — the Astrodai citation was truncated
 * at "refined ... to 2…". We encode 23°09'34" (the 1955 Committee value)
 * pending confirmation of the refined value.
 */
export const LAHIRI_VALUE_AT_EPOCH_ARCSEC = 23 * 3600 + 9 * 60 + 34; // 83374

/**
 * IAU 1976 general precession in longitude, two-epoch form, as published
 * in The Indian Astronomical Ephemeris 1989, p. 525.
 *
 *   P = (c0 + c1*T + c2*T^2) * t + (d0 + d1*T) * t^2 + e0 * t^3   [arcsec]
 *   T = (t0 - J2000)/36525      [centuries TT from J2000]
 *   t = (t_target - t0)/36525   [centuries TT elapsed]
 *
 * Source: Lieske, Lederle, Fricke & Morando, A&A 58, 1–16 (1977), as
 * reproduced in JME ayanamsha documentation §1.2 ("Epoch-defined models"),
 * which states the Indian reference ayanamsha values were defined with
 * this precession and that propagating with a different model changes the
 * convention.
 *
 * VERIFIED: formula text transcribed from the JME documentation; no
 * independent re-derivation performed.
 */
export const PREC_IAU76 = {
  c0: 5029.0966,
  c1: 2.22226,
  c2: -0.000042,
  d0: 1.11161,
  d1: -0.000127,
  e0: -0.000113,
} as const;

/** J2000.0 epoch in Julian Date (TT). IAU definition of the J2000.0 epoch. */
export const J2000_JD = 2451545.0;

/** Days per Julian century (TT). IAU Julian century = 36525 days. */
export const DAYS_PER_JULIAN_CENTURY = 36525;

/** Arcseconds per degree. Definition of the degree (60' per °, 60" per '). */
export const ARCSEC_PER_DEGREE = 3600;

/**
 * IAU 1976 general precession in longitude from reference epoch t0 to target t.
 * Returns arcseconds.
 */
export function precessionLongitudeIau76Arcsec(
  epochJd: number,
  targetJd: number,
): number {
  const T = (epochJd - J2000_JD) / DAYS_PER_JULIAN_CENTURY;
  const t = (targetJd - epochJd) / DAYS_PER_JULIAN_CENTURY;
  const t2 = t * t;
  const t3 = t2 * t;
  const T2 = T * T;
  const p =
    (PREC_IAU76.c0 + PREC_IAU76.c1 * T + PREC_IAU76.c2 * T2) * t +
    (PREC_IAU76.d0 + PREC_IAU76.d1 * T) * t2 +
    PREC_IAU76.e0 * t3;
  return p;
}

/**
 * Compute the Lahiri ayanamsha for a UTC instant.
 *
 * @param mode  ayanamsha mode (currently only 'lahiri'); parameterized so the
 *              ayanamsha can be swapped later.
 * @param instant  UTC Date (never mutated).
 * @returns AyanamshaResult
 * @throws if instant is invalid or mode unsupported.
 */
export function getAyanamsha(mode: AyanamshaMode, instant: Date): AyanamshaResult {
  if (!(instant instanceof Date) || Number.isNaN(instant.getTime())) {
    throw new Error('Invalid Date object supplied to getAyanamsha');
  }
  if (mode !== 'lahiri') {
    throw new Error(`Unsupported ayanamsha mode: ${mode}`);
  }

  // Work on a snapshot so the caller's Date is never mutated.
  const workDate = new Date(instant.getTime());
  const time: AstroTime = MakeTime(workDate);
  const jdTt = J2000_JD + time.tt; // TT Julian Date of the instant
  const tCenturies = time.tt / DAYS_PER_JULIAN_CENTURY;

  const pArcsec = precessionLongitudeIau76Arcsec(LAHIRI_EPOCH_JD, jdTt);
  const meanDegrees =
    (LAHIRI_VALUE_AT_EPOCH_ARCSEC + pArcsec) / ARCSEC_PER_DEGREE;

  const tilt = e_tilt(time);
  const dpsiArcsec = tilt.dpsi; // arcseconds (CONFIRMED in installed astronomy.js)
  const trueDegrees = meanDegrees + dpsiArcsec / ARCSEC_PER_DEGREE;

  return {
    mode,
    jdTt,
    tCenturies,
    meanDegrees,
    dpsiArcsec,
    trueDegrees,
  };
}

