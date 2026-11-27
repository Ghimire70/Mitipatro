import type { BirthDetails } from './types.js';

export interface JyotishClientChart {
  lagnaRashiIndex?: number;
  moonRashiIndex?: number;
  sunRashiIndex?: number;
  ayanamshaDegrees?: number;
  [key: string]: unknown;
}

export interface JyotishRequestBase {
  birthDetails: BirthDetails;
  chart?: JyotishClientChart;
  language?: string;
}

export interface FullReadingRequest extends JyotishRequestBase {
  mode: 'full_reading';
  question?: never;
}

export interface AskQuestionRequest extends JyotishRequestBase {
  mode: 'ask_question';
  question: string;
}

export type JyotishRequest = FullReadingRequest | AskQuestionRequest;

export interface FullReadingResponse {
  overview: string;
  personalityAndStrengths: string;
  careerAndWealth: string;
  relationshipsAndFamily: string;
  currentDashaGuidance: string;
  detectedYogas: string[];
  practicalRemedies: string[];
  language: string;
}

export interface AskQuestionResponse {
  answer: string;
  relevantHouses: number[];
  relevantDashas: string[];
  language: string;
}

export interface JyotishApiErrorResponse {
  error: string;
  details?: string[];
}

export class JyotishApiError extends Error {
  readonly status: number;
  readonly details: string[];

  constructor(message: string, status: number, details: string[] = []) {
    super(message);
    this.name = 'JyotishApiError';
    this.status = status;
    this.details = details;
  }
}

async function postJyotish<T>(payload: JyotishRequest): Promise<T> {
  let response: Response;
  try {
    response = await fetch('/api/jyotish', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new JyotishApiError(
      'Could not connect to the Jyotish service. Check your connection and try again.',
      0,
    );
  }

  let body: JyotishApiErrorResponse | T;
  try {
    body = await response.json() as JyotishApiErrorResponse | T;
  } catch {
    throw new JyotishApiError(
      'The Jyotish service returned an unreadable response. Please try again.',
      response.status,
    );
  }

  if (!response.ok) {
    const errorBody = body as JyotishApiErrorResponse;
    if (response.status === 429) {
      throw new JyotishApiError(
        'Too many Jyotish requests. Please wait a moment and try again.',
        429,
        errorBody.details ?? [],
      );
    }
    if (response.status === 400) {
      const details = errorBody.details ?? [];
      throw new JyotishApiError(
        details.length > 0
          ? `Please check your birth details: ${details.join(', ')}`
          : 'Please check the birth details and question, then try again.',
        400,
        details,
      );
    }
    throw new JyotishApiError(
      errorBody.error || 'The Jyotish service is temporarily unavailable. Please try again.',
      response.status,
      errorBody.details ?? [],
    );
  }

  return body as T;
}

export async function fetchFullReading(
  payload: FullReadingRequest,
): Promise<FullReadingResponse> {
  return postJyotish<FullReadingResponse>(payload);
}

export async function askJyotishQuestion(
  payload: AskQuestionRequest,
): Promise<AskQuestionResponse> {
  return postJyotish<AskQuestionResponse>(payload);
}
