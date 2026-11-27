// api/jyotish.ts
//
// Phase 2: Vercel serverless function for AI Jyotish (Nepali/Vedic Astrology).
//
// POST /api/jyotish
// Accepts birth details, optional precomputed chart, mode, and question.
// Returns structured AI interpretation grounded in deterministic astronomical facts.
//
// ARCHITECTURE:
// - Recomputes chart server-side if chart provided (tamper-proof validation).
// - If no chart provided, computes from birthDetails using calculateJyotishChart().
// - Builds deterministic InterpreterContext via buildInterpreterContext().
// - Calls Gemini 2.5 Flash (@google/genai) with strict system prompt.
// - In-memory rate limiting per IP (10 req/min, 50 req/hour).
// - CORS enabled for local development.
//
// ENVIRONMENT:
// - GEMINI_API_KEY: Required. Google AI Studio API key for Gemini 2.5 Flash.
// - NODE_ENV: production or development (affects CORS and rate limit strictness).
//
// SOURCES:
// - System prompt grounded in classical Vedic texts (BPHS, Phaladeepika, Saravali, etc.)
// - Astronomical calculations from lib/jyotish/* (Lahiri ayanamsha, whole-sign houses).
// - Dasha from Vimshottari system (120-year cycle).
// - Yoga detection from classical definitions in interpreter-context.ts.
//
// BOUNDARY: No astrological computation logic here -- all delegated to lib/jyotish/*.
// This endpoint only handles HTTP, validation, rate limiting, and LLM orchestration.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

import { calculateJyotishChart } from '../lib/jyotish/ephemeris.js';
import { buildInterpreterContext, type InterpreterContext, serializeInterpreterContext } from '../lib/jyotish/interpreter-context.js';
import type { BirthDetails, JyotishCalculationResult, JyotishConfig } from '../lib/jyotish/types.js';

/* ------------------------------------------------------------------ */
/* REQUEST / RESPONSE TYPES                                           */
/* ------------------------------------------------------------------ */

interface ClientChart {
  lagnaRashiIndex?: number;
  moonRashiIndex?: number;
  sunRashiIndex?: number;
  ayanamshaDegrees?: number;
  [key: string]: unknown;
}

interface ApiBirthDetails {
  birthDateAd?: { year: number; month: number; day: number } | null;
  birthDateBs?: { year: number; month: number; day: number } | null;
  birthTime?: string;
  timeZone?: string;
  location?: { name?: string; latitude?: number; longitude?: number; timezone?: string; district?: string };
}

interface ApiRequestBody {
  birthDetails?: ApiBirthDetails;
  chart?: ClientChart;
  mode?: string;
  language?: string;
  question?: string;
}

interface FullReadingResponse {
  overview: string;
  personalityAndStrengths: string;
  careerAndWealth: string;
  relationshipsAndFamily: string;
  currentDashaGuidance: string;
  detectedYogas: string[];
  practicalRemedies: string[];
  language: string;
}

interface AskQuestionResponse {
  answer: string;
  relevantHouses: number[];
  relevantDashas: string[];
  language: string;
}

interface ApiErrorResponse {
  error: string;
  details?: string[];
}

/* ------------------------------------------------------------------ */
/* RATE LIMITING (IN-MEMORY)                                          */
/* ------------------------------------------------------------------ */

interface RateLimitEntry {
  requests: number[];
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_PER_MIN = 10;
const RATE_LIMIT_HOUR_WINDOW_MS = 3_600_000;
const RATE_LIMIT_MAX_PER_HOUR = 50;

function cleanupRateLimit(): void {
  const now = Date.now();
  for (const [ip, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) rateLimitStore.delete(ip);
  }
}

function checkRateLimit(ip: string): { allowed: boolean; retryAfterMs?: number } {
  cleanupRateLimit();
  const now = Date.now();
  let entry = rateLimitStore.get(ip);
  if (!entry) {
    entry = { requests: [now], resetAt: now + RATE_LIMIT_HOUR_WINDOW_MS };
    rateLimitStore.set(ip, entry);
    return { allowed: true };
  }
  const recentRequests = entry.requests.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (recentRequests.length >= RATE_LIMIT_MAX_PER_MIN) {
    const oldestRecent = recentRequests[0];
    return { allowed: false, retryAfterMs: RATE_LIMIT_WINDOW_MS - (now - oldestRecent) };
  }
  const hourlyRequests = entry.requests.filter((t) => now - t < RATE_LIMIT_HOUR_WINDOW_MS);
  if (hourlyRequests.length >= RATE_LIMIT_MAX_PER_HOUR) {
    const oldestHourly = hourlyRequests[0];
    return { allowed: false, retryAfterMs: RATE_LIMIT_HOUR_WINDOW_MS - (now - oldestHourly) };
  }
  entry.requests.push(now);
  entry.requests = entry.requests.filter((t) => now - t < RATE_LIMIT_HOUR_WINDOW_MS);
  return { allowed: true };
}

/* ------------------------------------------------------------------ */
/* ENV                                                                */
/* ------------------------------------------------------------------ */

function isDevelopment(): boolean {
  return (typeof process === 'object' && process.env && (process.env as Record<string, string>).NODE_ENV) !== 'production';
}

function getEnv(key: string): string | undefined {
  if (typeof process !== 'object' || !process.env) return undefined;
  return (process.env as Record<string, string>)[key];
}

/* ------------------------------------------------------------------ */
/* CORS                                                               */
/* ------------------------------------------------------------------ */

function setCorsHeaders(res: VercelResponse): void {
  const origin = isDevelopment() ? '*' : '';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400');
}

/* ------------------------------------------------------------------ */
/* VALIDATION                                                         */
/* ------------------------------------------------------------------ */

const TIME_RE = /^([01][0-9]|2[0-3]):[0-5][0-9]$/;

function isValidTime(time: unknown): boolean {
  return typeof time === 'string' && TIME_RE.test(time);
}

function isValidTimezone(tz: unknown): boolean {
  if (typeof tz !== 'string') return false;
  try {
    Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

function isValidLocation(loc: unknown): boolean {
  if (!loc || typeof loc !== 'object') return false;
  const l = loc as Record<string, unknown>;
  return (
    typeof l.name === 'string' && l.name.length > 0 &&
    typeof l.latitude === 'number' && Number.isFinite(l.latitude) && l.latitude >= -90 && l.latitude <= 90 &&
    typeof l.longitude === 'number' && Number.isFinite(l.longitude) && l.longitude >= -180 && l.longitude <= 180 &&
    typeof l.timezone === 'string' && isValidTimezone(l.timezone)
  );
}

function normalizeBirthDetails(bd: ApiBirthDetails): { valid: boolean; errors: string[]; normalized?: BirthDetails } {
  const errors: string[] = [];

  const hasAd = !!bd.birthDateAd;
  const hasBs = !!bd.birthDateBs;
  if (!hasAd && !hasBs) {
    errors.push('birthDetails must include birthDateAd or birthDateBs');
  }

  if (!isValidTime(bd.birthTime)) {
    errors.push('birthDetails.birthTime must be HH:MM in 24h format (e.g. 14:30)');
  }

  if (!isValidTimezone(bd.timeZone)) {
    errors.push('birthDetails.timeZone must be a valid IANA timezone (e.g. Asia/Kathmandu)');
  }

  if (!isValidLocation(bd.location)) {
    errors.push('birthDetails.location must include name, latitude (-90 to 90), longitude (-180 to 180), and timezone');
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    errors: [],
    normalized: {
      birthDateAd: bd.birthDateAd ?? null,
      birthDateBs: bd.birthDateBs ?? null,
      birthTime: bd.birthTime!,
      timeZone: bd.timeZone!,
      location: bd.location as BirthDetails['location'],
    },
  };
}

function validateMode(mode: unknown): { valid: boolean; mode?: 'full_reading' | 'ask_question'; error?: string } {
  if (mode !== 'full_reading' && mode !== 'ask_question') {
    return { valid: false, error: "mode must be 'full_reading' or 'ask_question'" };
  }
  return { valid: true, mode };
}

/* ------------------------------------------------------------------ */
/* CHART REVALIDATION                                                 */
/* ------------------------------------------------------------------ */

const AYANAMSHA_TOLERANCE_DEG = 0.01;

function getGrahaRashiIndex(planets: JyotishCalculationResult['planets'], graha: string): number | undefined {
  const p = planets.find((x) => x.graha === graha);
  return p?.rashiIndex;
}

function validateClientChart(server: JyotishCalculationResult, chart: ClientChart): { match: boolean; mismatches: string[] } {
  const mismatches: string[] = [];

  const serverLagna = server.houses.lagnaRashiIndex;
  const serverMoon = getGrahaRashiIndex(server.planets, 'Moon');
  const serverSun = getGrahaRashiIndex(server.planets, 'Sun');

  if (typeof chart.lagnaRashiIndex === 'number' && chart.lagnaRashiIndex !== serverLagna) {
    mismatches.push(`Lagna rashi mismatch: server=${serverLagna}, client=${chart.lagnaRashiIndex}`);
  }
  if (typeof chart.moonRashiIndex === 'number' && serverMoon !== undefined && chart.moonRashiIndex !== serverMoon) {
    mismatches.push(`Moon rashi mismatch: server=${serverMoon}, client=${chart.moonRashiIndex}`);
  }
  if (typeof chart.sunRashiIndex === 'number' && serverSun !== undefined && chart.sunRashiIndex !== serverSun) {
    mismatches.push(`Sun rashi mismatch: server=${serverSun}, client=${chart.sunRashiIndex}`);
  }
  if (typeof chart.ayanamshaDegrees === 'number' && Math.abs(chart.ayanamshaDegrees - server.ayanamshaDegrees) > AYANAMSHA_TOLERANCE_DEG) {
    mismatches.push(`Ayanamsha mismatch: server=${server.ayanamshaDegrees}, client=${chart.ayanamshaDegrees}`);
  }

  return { match: mismatches.length === 0, mismatches };
}

/* ------------------------------------------------------------------ */
/* SYSTEM PROMPTS                                                     */
/* ------------------------------------------------------------------ */

const SYSTEM_PROMPT_FULL_READING = `You are an expert Vedic (Jyotish) astrologer specializing in Nepali (Bikram Sambat) calendar traditions.
You receive a deterministic InterpreterContext JSON computed from Lahiri ayanamsha, whole-sign houses, and Vimshottari dasha.
Ground every statement in the provided astronomical facts. Do not invent planets, houses, or dashas.
Respond ONLY with valid JSON matching this schema:
{
  "overview": string,
  "personalityAndStrengths": string,
  "careerAndWealth": string,
  "relationshipsAndFamily": string,
  "currentDashaGuidance": string,
  "detectedYogas": string[],
  "practicalRemedies": string[],
  "language": string
}
Use classical Vedic principles (BPHS, Phaladeepika, Saravali): Lagna strength, graha dignity (exaltation/debilitation/own sign), house lordship, yogas (Gaja Kesari, Budhaditya, Pancha Mahapurusha, Chandra-Mangal, Vipareeta Raja, Amala, Durudhara, Sunapha, Anapha, Saraswati, Parivartana), Sade Sati phase, and current Mahadasha/Antardasha.
Keep the tone respectful, practical, and non-fatalistic. Offer remedies as suggestions, not prescriptions.
language must match the user's requested language code (default 'en').`;

const SYSTEM_PROMPT_ASK_QUESTION = `You are an expert Vedic (Jyotish) astrologer.
You receive a deterministic InterpreterContext JSON and a user question.
Answer the question using ONLY the chart facts provided (Lagna, graha rashis, house lordships, dignities, yogas, Sade Sati, current Mahadasha/Antardasha).
Do not invent planetary positions or dashas.
Respond ONLY with valid JSON matching this schema:
{
  "answer": string,
  "relevantHouses": number[],
  "relevantDashas": string[],
  "language": string
}
relevantHouses: whole-sign house numbers (1-12) most relevant to the question.
relevantDashas: names of grahas running current Mahadasha/Antardasha relevant to the question.
Keep the answer concise, respectful, practical, and non-fatalistic.
language must match the user's requested language code (default 'en').`;

/* ------------------------------------------------------------------ */
/* LLM INTEGRATION                                                    */
/* ------------------------------------------------------------------ */

let geminiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!geminiClient) {
    const apiKey = getEnv('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not set. Set the Google AI Studio API key to enable AI interpretations.');
    }
    geminiClient = new GoogleGenAI({ apiKey });
  }
  return geminiClient;
}

async function generateInterpretation(systemPrompt: string, userContent: string): Promise<string> {
  const ai = getGeminiClient();
  const result = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: userContent,
    config: {
      systemInstruction: systemPrompt,
      temperature: 0.3,
      responseMimeType: 'application/json',
    },
  });
  return result.text ?? '';
}

/* ------------------------------------------------------------------ */
/* RESPONSE FORMATTING                                                */
/* ------------------------------------------------------------------ */

function parseJsonResponse(text: string): Record<string, unknown> {
  const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
  return JSON.parse(cleaned);
}

function formatFullReading(ctx: InterpreterContext, raw: Record<string, unknown>, language: string): FullReadingResponse {
  return {
    overview: String(raw.overview ?? ''),
    personalityAndStrengths: String(raw.personalityAndStrengths ?? ''),
    careerAndWealth: String(raw.careerAndWealth ?? ''),
    relationshipsAndFamily: String(raw.relationshipsAndFamily ?? ''),
    currentDashaGuidance: String(raw.currentDashaGuidance ?? ''),
    detectedYogas: Array.isArray(raw.detectedYogas) ? raw.detectedYogas.map(String) : ctx.yogas.map((y) => y.name),
    practicalRemedies: Array.isArray(raw.practicalRemedies) ? raw.practicalRemedies.map(String) : [],
    language,
  };
}

function formatAskQuestion(raw: Record<string, unknown>, language: string): AskQuestionResponse {
  return {
    answer: String(raw.answer ?? ''),
    relevantHouses: Array.isArray(raw.relevantHouses) ? raw.relevantHouses.map(Number).filter((n) => Number.isFinite(n)) : [],
    relevantDashas: Array.isArray(raw.relevantDashas) ? raw.relevantDashas.map(String) : [],
    language,
  };
}

/* ------------------------------------------------------------------ */
/* MAIN HANDLER                                                       */
/* ------------------------------------------------------------------ */

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    res.status(405).json({ error: 'Method not allowed. Use POST.' } as ApiErrorResponse);
    return;
  }

  // Rate limiting
  const ip = (Array.isArray(req.headers['x-forwarded-for']) ? req.headers['x-forwarded-for'][0] : req.headers['x-forwarded-for']) || 'unknown';
  const rateLimit = checkRateLimit(String(ip));
  res.setHeader('X-RateLimit-Limit-Min', String(RATE_LIMIT_MAX_PER_MIN));
  res.setHeader('X-RateLimit-Limit-Hour', String(RATE_LIMIT_MAX_PER_HOUR));
  res.setHeader('X-RateLimit-Remaining-Min', String(Math.max(0, RATE_LIMIT_MAX_PER_MIN - 1)));
  if (!rateLimit.allowed) {
    res.setHeader('Retry-After', String(Math.ceil((rateLimit.retryAfterMs ?? 0) / 1000)));
    res.status(429).json({ error: 'Rate limit exceeded. Try again later.' } as ApiErrorResponse);
    return;
  }

  // Parse body
  let body: ApiRequestBody;
  try {
    body = (req.body ?? {}) as ApiRequestBody;
  } catch {
    res.status(400).json({ error: 'Invalid request body.' } as ApiErrorResponse);
    return;
  }

  const { birthDetails, chart, mode, language = 'en', question } = body;

  // Validate mode
  const modeValidation = validateMode(mode);
  if (!modeValidation.valid) {
    res.status(400).json({ error: modeValidation.error } as ApiErrorResponse);
    return;
  }
  const resolvedMode = modeValidation.mode!;

  // Validate birth details
  if (!birthDetails) {
    res.status(400).json({ error: 'birthDetails is required.' } as ApiErrorResponse);
    return;
  }
  const birthValidation = normalizeBirthDetails(birthDetails);
  if (!birthValidation.valid) {
    res.status(400).json({ error: 'Invalid birth details.', details: birthValidation.errors } as ApiErrorResponse);
    return;
  }
  const normalizedBirthDetails = birthValidation.normalized!;

  // Compute chart server-side
  const config: JyotishConfig = {
    ayanamshaMode: 'lahiri',
    referenceNow: new Date(),
  };
  let serverResult: JyotishCalculationResult;
  try {
    serverResult = calculateJyotishChart(normalizedBirthDetails, config);
  } catch (err) {
    res.status(400).json({ error: 'Failed to compute chart.', details: [err instanceof Error ? err.message : String(err)] } as ApiErrorResponse);
    return;
  }

  // Revalidate client-provided chart
  if (chart) {
    const validation = validateClientChart(serverResult, chart);
    if (!validation.match) {
      res.status(400).json({ error: 'Provided chart does not match server-side computation.', details: validation.mismatches } as ApiErrorResponse);
      return;
    }
  }

  // Build interpreter context
  const ctx = buildInterpreterContext(serverResult);
  const contextJson = serializeInterpreterContext(ctx);

  // Call Gemini
  let aiText: string;
  try {
    if (resolvedMode === 'full_reading') {
      aiText = await generateInterpretation(SYSTEM_PROMPT_FULL_READING, contextJson);
    } else {
      const userContent = `${contextJson}\n\nUser question: ${question ?? ''}`;
      aiText = await generateInterpretation(SYSTEM_PROMPT_ASK_QUESTION, userContent);
    }
  } catch (err) {
    res.status(502).json({ error: 'AI interpretation failed.', details: [err instanceof Error ? err.message : String(err)] } as ApiErrorResponse);
    return;
  }

  // Parse and format response
  let raw: Record<string, unknown>;
  try {
    raw = parseJsonResponse(aiText);
  } catch {
    res.status(502).json({ error: 'AI returned invalid JSON.', details: [aiText.slice(0, 200)] } as ApiErrorResponse);
    return;
  }

  let responseBody: FullReadingResponse | AskQuestionResponse;
  if (resolvedMode === 'full_reading') {
    responseBody = formatFullReading(ctx, raw, String(language));
  } else {
    responseBody = formatAskQuestion(raw, String(language));
  }

  res.status(200).json(responseBody);
}
