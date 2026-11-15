// lib/astronomy/types.ts

/**
 * Identifiers for the supported celestial bodies.
 */
export type BodyId = 'Sun' | 'Moon' | 'Mercury' | 'Venus' | 'Mars' | 'Jupiter' | 'Saturn';

/**
 * Geocentric tropical ecliptic coordinates for a body.
 */
export interface EclipticCoord {
  /** Longitude in degrees, normalized to [0, 360). */
  longitude: number;
  /** Latitude in degrees. */
  latitude: number;
  /** Distance from Earth's centre in astronomical units (AU). */
  distance: number;
}

/**
 * Result of a planetary positions snapshot.
 */
export interface PlanetarySnapshot {
  /** ISO‑8601 UTC timestamp of the input instant. */
  timestamp: string;
  /** Identifier of the coordinate system used. */
  coordinateSystem: 'geocentric-tropical-ecliptic';
  /** Engine information. */
  engine: { name: string; version: string };
  /** Positions keyed by body identifier. */
  positions: Record<BodyId, EclipticCoord>;
}
