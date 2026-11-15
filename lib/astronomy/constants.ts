// lib/astronomy/constants.ts

/** List of supported bodies (as string identifiers), in traditional Vedic order. */
export const SUPPORTED_BODIES = [
  'Sun',
  'Moon',
  'Mercury',
  'Venus',
  'Mars',
  'Jupiter',
  'Saturn',
] as const;

/** Type representing the literal body identifiers. */
export type SupportedBody = typeof SUPPORTED_BODIES[number];
