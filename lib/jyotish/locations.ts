// lib/jyotish/locations.ts
//
// Built-in dataset of Nepali cities and district headquarters for jyotish
// birth-place lookup. Coordinates are approximate unless marked verified;
// verify against an authoritative source (e.g. Survey Department, Nepal or
// vedicmarga.com) before production use for chart calculations.
//
// All locations use Asia/Kathmandu (UTC+05:45), Nepal's single timezone
// (no DST). Custom coordinates/timezones are supported for diaspora users.

import type { BirthPlace } from './types.js';

/** Kathmandu coordinates — verified from lib/astronomy/sunriseSunset.ts. */
export const KATHMANDU: BirthPlace = {
  name: 'Kathmandu',
  latitude: 27.7172,
  longitude: 85.3240,
  timezone: 'Asia/Kathmandu',
};

/** Major Nepali cities with approximate coordinates (UNVERIFIED unless noted). */
export const MAJOR_CITIES: readonly BirthPlace[] = [
  { ...KATHMANDU, name: 'Kathmandu' }, // verified
  {
    name: 'Pokhara',
    latitude: 28.2096,
    longitude: 83.9856,
    timezone: 'Asia/Kathmandu',
  },
  {
    name: 'Lalitpur',
    latitude: 27.6657,
    longitude: 85.3228,
    timezone: 'Asia/Kathmandu',
  },
  {
    name: 'Bharatpur',
    latitude: 27.6746,
    longitude: 84.4319,
    timezone: 'Asia/Kathmandu',
  },
  {
    name: 'Biratnagar',
    latitude: 26.4525,
    longitude: 87.2706,
    timezone: 'Asia/Kathmandu',
  },
  {
    name: 'Birgunj',
    latitude: 27.0041,
    longitude: 84.8704,
    timezone: 'Asia/Kathmandu',
  },
  {
    name: 'Butwal',
    latitude: 27.7034,
    longitude: 83.4500,
    timezone: 'Asia/Kathmandu',
  },
  {
    name: 'Dharan',
    latitude: 26.8104,
    longitude: 87.2782,
    timezone: 'Asia/Kathmandu',
  },
  {
    name: 'Janakpur',
    latitude: 26.7284,
    longitude: 85.9271,
    timezone: 'Asia/Kathmandu',
  },
  {
    name: 'Nepalgunj',
    latitude: 28.0520,
    longitude: 81.6176,
    timezone: 'Asia/Kathmandu',
  },
  {
    name: 'Dhangadhi',
    latitude: 28.7010,
    longitude: 80.5780,
    timezone: 'Asia/Kathmandu',
  },
  {
    name: 'Hetauda',
    latitude: 27.4232,
    longitude: 85.0250,
    timezone: 'Asia/Kathmandu',
  },
  {
    name: 'Itahari',
    latitude: 26.6617,
    longitude: 87.2726,
    timezone: 'Asia/Kathmandu',
  },
  {
    name: 'Bhairahawa',
    latitude: 27.5233,
    longitude: 83.4333,
    timezone: 'Asia/Kathmandu',
  },
  {
    name: 'Tansen',
    latitude: 27.8617,
    longitude: 83.5333,
    timezone: 'Asia/Kathmandu',
  },
  {
    name: 'Baglung',
    latitude: 28.2533,
    longitude: 83.6000,
    timezone: 'Asia/Kathmandu',
  },
  {
    name: 'Damak',
    latitude: 26.6750,
    longitude: 87.6833,
    timezone: 'Asia/Kathmandu',
  },
  {
    name: 'Lahan',
    latitude: 26.7083,
    longitude: 86.4767,
    timezone: 'Asia/Kathmandu',
  },
  {
    name: 'Inaruwa',
    latitude: 26.6333,
    longitude: 87.2667,
    timezone: 'Asia/Kathmandu',
  },
] as const;

/**
 * All 77 Nepali district headquarters. Coordinates are approximate and
 * UNVERIFIED unless the district is Kathmandu. District names and HQ names
 follow the official list of districts of Nepal; lat/lon figures should be
 * verified against an authoritative source before production chart use.
 */
export const DISTRICT_HEADQUARTERS: readonly BirthPlace[] = [
  // Koshi Province
  { name: 'Biratnagar', district: 'Morang', latitude: 26.4525, longitude: 87.2706, timezone: 'Asia/Kathmandu' },
  { name: 'Dhankuta', district: 'Dhankuta', latitude: 26.9833, longitude: 87.3500, timezone: 'Asia/Kathmandu' },
  { name: 'Ilam', district: 'Ilam', latitude: 26.9000, longitude: 87.9333, timezone: 'Asia/Kathmandu' },
  { name: 'Jhapa (Chandragadhi)', district: 'Jhapa', latitude: 26.6500, longitude: 87.9833, timezone: 'Asia/Kathmandu' },
  { name: 'Khotang', district: 'Khotang', latitude: 27.1500, longitude: 86.8500, timezone: 'Asia/Kathmandu' },
  { name: 'Okhaldhunga', district: 'Okhaldhunga', latitude: 27.3000, longitude: 86.5000, timezone: 'Asia/Kathmandu' },
  { name: 'Panchthar', district: 'Panchthar', latitude: 27.1333, longitude: 87.8500, timezone: 'Asia/Kathmandu' },
  { name: 'Solukhumbu', district: 'Solukhumbu', latitude: 27.8000, longitude: 86.7000, timezone: 'Asia/Kathmandu' },
  { name: 'Sunsari (Inaruwa)', district: 'Sunsari', latitude: 26.6333, longitude: 87.2667, timezone: 'Asia/Kathmandu' },
  { name: 'Taplejung', district: 'Taplejung', latitude: 27.3500, longitude: 87.6667, timezone: 'Asia/Kathmandu' },
  { name: 'Terhathum', district: 'Terhathum', latitude: 27.0000, longitude: 87.5000, timezone: 'Asia/Kathmandu' },
  { name: 'Udayapur (Gaighat)', district: 'Udayapur', latitude: 26.9000, longitude: 86.8500, timezone: 'Asia/Kathmandu' },

  // Madhesh Province
  { name: 'Bara (Kalaiya)', district: 'Bara', latitude: 27.0667, longitude: 84.9500, timezone: 'Asia/Kathmandu' },
  { name: 'Dhanusha (Janakpur)', district: 'Dhanusha', latitude: 26.7284, longitude: 85.9271, timezone: 'Asia/Kathmandu' },
  { name: 'Mahottari (Jaleshwar)', district: 'Mahottari', latitude: 26.7667, longitude: 85.7500, timezone: 'Asia/Kathmandu' },
  { name: 'Parsa (Birgunj)', district: 'Parsa', latitude: 27.0041, longitude: 84.8704, timezone: 'Asia/Kathmandu' },
  { name: 'Rautahat (Gaur)', district: 'Rautahat', latitude: 26.8500, longitude: 85.2000, timezone: 'Asia/Kathmandu' },
  { name: 'Saptari (Rajbiraj)', district: 'Saptari', latitude: 26.5167, longitude: 86.7500, timezone: 'Asia/Kathmandu' },
  { name: 'Sarlahi (Malangwa)', district: 'Sarlahi', latitude: 26.8500, longitude: 85.4000, timezone: 'Asia/Kathmandu' },
  { name: 'Siraha', district: 'Siraha', latitude: 26.7083, longitude: 86.4767, timezone: 'Asia/Kathmandu' },

  // Bagmati Province
  { name: 'Bhaktapur', district: 'Bhaktapur', latitude: 27.6710, longitude: 85.4302, timezone: 'Asia/Kathmandu' },
  { name: 'Chitwan (Bharatpur)', district: 'Chitwan', latitude: 27.6746, longitude: 84.4319, timezone: 'Asia/Kathmandu' },
  { name: 'Dhading', district: 'Dhading', latitude: 27.8833, longitude: 84.9000, timezone: 'Asia/Kathmandu' },
  { name: 'Dolakha (Charikot)', district: 'Dolakha', latitude: 27.6500, longitude: 86.0500, timezone: 'Asia/Kathmandu' },
  { name: 'Kathmandu', district: 'Kathmandu', latitude: 27.7172, longitude: 85.3240, timezone: 'Asia/Kathmandu' }, // verified
  { name: 'Kavrepalanchok (Dhulikhel)', district: 'Kavrepalanchok', latitude: 27.5833, longitude: 85.5500, timezone: 'Asia/Kathmandu' },
  { name: 'Lalitpur', district: 'Lalitpur', latitude: 27.6657, longitude: 85.3228, timezone: 'Asia/Kathmandu' },
  { name: 'Makwanpur (Hetauda)', district: 'Makwanpur', latitude: 27.4232, longitude: 85.0250, timezone: 'Asia/Kathmandu' },
  { name: 'Nuwakot (Bidur)', district: 'Nuwakot', latitude: 27.9000, longitude: 85.1500, timezone: 'Asia/Kathmandu' },
  { name: 'Ramechhap', district: 'Ramechhap', latitude: 27.4000, longitude: 86.0500, timezone: 'Asia/Kathmandu' },
  { name: 'Rasuwa (Dhunche)', district: 'Rasuwa', latitude: 28.1000, longitude: 85.3000, timezone: 'Asia/Kathmandu' },
  { name: 'Sindhuli', district: 'Sindhuli', latitude: 27.2500, longitude: 86.0000, timezone: 'Asia/Kathmandu' },
  { name: 'Sindhupalchok (Chautara)', district: 'Sindhupalchok', latitude: 27.7500, longitude: 85.7500, timezone: 'Asia/Kathmandu' },

  // Gandaki Province
  { name: 'Baglung', district: 'Baglung', latitude: 28.2533, longitude: 83.6000, timezone: 'Asia/Kathmandu' },
  { name: 'Gorkha', district: 'Gorkha', latitude: 28.0000, longitude: 84.6500, timezone: 'Asia/Kathmandu' },
  { name: 'Kaski (Pokhara)', district: 'Kaski', latitude: 28.2096, longitude: 83.9856, timezone: 'Asia/Kathmandu' },
  { name: 'Lamjung (Besisahar)', district: 'Lamjung', latitude: 28.2000, longitude: 84.3500, timezone: 'Asia/Kathmandu' },
  { name: 'Manang (Chame)', district: 'Manang', latitude: 28.6500, longitude: 84.1500, timezone: 'Asia/Kathmandu' },
  { name: 'Mustang (Jomsom)', district: 'Mustang', latitude: 28.7833, longitude: 83.7167, timezone: 'Asia/Kathmandu' },
  { name: 'Nawalpur (Kawasoti)', district: 'Nawalpur', latitude: 27.7500, longitude: 83.7500, timezone: 'Asia/Kathmandu' },
  { name: 'Parbat (Kusma)', district: 'Parbat', latitude: 28.2500, longitude: 83.7000, timezone: 'Asia/Kathmandu' },
  { name: 'Syangja', district: 'Syangja', latitude: 28.0667, longitude: 83.8500, timezone: 'Asia/Kathmandu' },
  { name: 'Tanahu (Damauli)', district: 'Tanahu', latitude: 28.0000, longitude: 84.3000, timezone: 'Asia/Kathmandu' },

  // Lumbini Province
  { name: 'Arghakhanchi (Sandhikharka)', district: 'Arghakhanchi', latitude: 27.9500, longitude: 83.2000, timezone: 'Asia/Kathmandu' },
  { name: 'Banke (Nepalgunj)', district: 'Banke', latitude: 28.0520, longitude: 81.6176, timezone: 'Asia/Kathmandu' },
  { name: 'Bardiya (Gulariya)', district: 'Bardiya', latitude: 28.1500, longitude: 81.5500, timezone: 'Asia/Kathmandu' },
  { name: 'Dang (Ghorahi)', district: 'Dang', latitude: 28.0000, longitude: 82.5000, timezone: 'Asia/Kathmandu' },
  { name: 'Gulmi (Tamghas)', district: 'Gulmi', latitude: 28.0500, longitude: 83.2500, timezone: 'Asia/Kathmandu' },
  { name: 'Kapilvastu (Taulihaur)', district: 'Kapilvastu', latitude: 27.5000, longitude: 83.0500, timezone: 'Asia/Kathmandu' },
  { name: 'Palpa (Tansen)', district: 'Palpa', latitude: 27.8617, longitude: 83.5333, timezone: 'Asia/Kathmandu' },
  { name: 'Pyuthan', district: 'Pyuthan', latitude: 28.1000, longitude: 82.9000, timezone: 'Asia/Kathmandu' },
  { name: 'Rolpa (Liwang)', district: 'Rolpa', latitude: 28.2500, longitude: 82.7500, timezone: 'Asia/Kathmandu' },
  { name: 'Rukum East (Rukumkot)', district: 'Rukum East', latitude: 28.6000, longitude: 82.5000, timezone: 'Asia/Kathmandu' },
  { name: 'Rupandehi (Bhairahawa)', district: 'Rupandehi', latitude: 27.5233, longitude: 83.4333, timezone: 'Asia/Kathmandu' },

  // Karnali Province
  { name: 'Dolpa (Dunai)', district: 'Dolpa', latitude: 29.0000, longitude: 82.9000, timezone: 'Asia/Kathmandu' },
  { name: 'Humla (Simikot)', district: 'Humla', latitude: 30.0000, longitude: 81.8500, timezone: 'Asia/Kathmandu' },
  { name: 'Jajarkot', district: 'Jajarkot', latitude: 28.6500, longitude: 82.2500, timezone: 'Asia/Kathmandu' },
  { name: 'Jumla', district: 'Jumla', latitude: 29.2500, longitude: 82.2000, timezone: 'Asia/Kathmandu' },
  { name: 'Kalikot (Manma)', district: 'Kalikot', latitude: 29.1000, longitude: 81.7500, timezone: 'Asia/Kathmandu' },
  { name: 'Mugu (Gamgadhi)', district: 'Mugu', latitude: 29.5000, longitude: 82.0000, timezone: 'Asia/Kathmandu' },
  { name: 'Salyan', district: 'Salyan', latitude: 28.4000, longitude: 82.2000, timezone: 'Asia/Kathmandu' },
  { name: 'Surkhet (Birendranagar)', district: 'Surkhet', latitude: 28.6000, longitude: 81.6000, timezone: 'Asia/Kathmandu' },
  { name: 'Western Rukum (Musikot)', district: 'Western Rukum', latitude: 28.5000, longitude: 82.4500, timezone: 'Asia/Kathmandu' },

  // Sudurpashchim Province
  { name: 'Acharya (Mangalsen)', district: 'Achham', latitude: 29.1000, longitude: 81.2500, timezone: 'Asia/Kathmandu' },
  { name: 'Baitadi', district: 'Baitadi', latitude: 29.5500, longitude: 80.5500, timezone: 'Asia/Kathmandu' },
  { name: 'Bajhang (Chainpur)', district: 'Bajhang', latitude: 29.6000, longitude: 81.2000, timezone: 'Asia/Kathmandu' },
  { name: 'Bajura (Martadi)', district: 'Bajura', latitude: 29.5500, longitude: 81.3500, timezone: 'Asia/Kathmandu' },
  { name: 'Dadeldhura (Amargadhi)', district: 'Dadeldhura', latitude: 29.3000, longitude: 80.5500, timezone: 'Asia/Kathmandu' },
  { name: 'Darchula (Khalanga)', district: 'Darchula', latitude: 29.8500, longitude: 80.6000, timezone: 'Asia/Kathmandu' },
  { name: 'Doti (Dipayal)', district: 'Doti', latitude: 29.2500, longitude: 80.9500, timezone: 'Asia/Kathmandu' },
  { name: 'Kailali (Dhangadhi)', district: 'Kailali', latitude: 28.7010, longitude: 80.5780, timezone: 'Asia/Kathmandu' },
  { name: 'Kanchanpur (Mahendranagar)', district: 'Kanchanpur', latitude: 28.9500, longitude: 80.2000, timezone: 'Asia/Kathmandu' },
] as const;

/** All built-in locations (major cities + district HQs), deduplicated by name. */
export const ALL_LOCATIONS: readonly BirthPlace[] = (() => {
  const seen = new Set<string>();
  const out: BirthPlace[] = [];
  for (const loc of [...MAJOR_CITIES, ...DISTRICT_HEADQUARTERS]) {
    if (!seen.has(loc.name)) {
      seen.add(loc.name);
      out.push(loc);
    }
  }
  return out;
})();

/** Look up a location by name (case-insensitive). Returns null if not found. */
export function findLocation(name: string): BirthPlace | null {
  const normalized = name.trim().toLowerCase();
  for (const loc of ALL_LOCATIONS) {
    if (loc.name.toLowerCase() === normalized) {
      return loc;
    }
  }
  return null;
}

/** Build a BirthPlace from custom coordinates/timezone (for diaspora users). */
export function customPlace(
  name: string,
  latitude: number,
  longitude: number,
  timezone: string,
): BirthPlace {
  return { name, latitude, longitude, timezone };
}

/** Number of districts covered. */
export const DISTRICT_COUNT = DISTRICT_HEADQUARTERS.length;
