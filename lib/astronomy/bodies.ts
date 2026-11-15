// lib/astronomy/bodies.ts

import { Body as AstroBody } from 'astronomy-engine';
import type { BodyId } from './types.js';

/**
 * Map our internal BodyId strings to the Astronomy-Engine Body enum values.
 * Astronomy Engine uses the same names, so this is a direct 1-to-1 mapping.
 */
export const BODY_MAP: Record<BodyId, AstroBody> = {
  Sun:     AstroBody.Sun,
  Moon:    AstroBody.Moon,
  Mercury: AstroBody.Mercury,
  Venus:   AstroBody.Venus,
  Mars:    AstroBody.Mars,
  Jupiter: AstroBody.Jupiter,
  Saturn:  AstroBody.Saturn,
};

/** Retrieve the Astronomy-Engine enum for a given BodyId. */
export function toAstronomyBody(id: BodyId): AstroBody {
  return BODY_MAP[id];
}
