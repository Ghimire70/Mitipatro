import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  askJyotishQuestion,
  fetchFullReading,
  JyotishApiError,
  type AskQuestionResponse,
  type FullReadingResponse,
  type JyotishClientChart,
} from '../lib/jyotish/client.js';
import type { BirthDetails } from '../lib/jyotish/types.js';

export interface JyotishQaPair {
  question: string;
  answer: AskQuestionResponse;
}

interface UseJyotishReadingOptions {
  birthDetails: BirthDetails | null;
  chart?: JyotishClientChart;
  language?: string;
}

interface UseJyotishReadingResult {
  fullReading: FullReadingResponse | null;
  loading: boolean;
  error: string | null;
  generateReading: () => Promise<void>;
  reset: () => void;
  history: JyotishQaPair[];
  asking: boolean;
  askError: string | null;
  submitQuestion: (question: string) => Promise<void>;
}

const FULL_READING_CACHE_PREFIX = 'mitipatro:jyotish:full-reading:';
const MAX_QUESTION_LENGTH = 500;

function normalizedDate(birthDetails: BirthDetails): string {
  const date = birthDetails.birthDateAd ?? birthDetails.birthDateBs;
  if (!date) return '';
  return `${String(date.year).padStart(4, '0')}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
}

export function getJyotishCacheKey(birthDetails: BirthDetails): string {
  const lat = birthDetails.location.latitude.toFixed(6);
  const lon = birthDetails.location.longitude.toFixed(6);
  const timezone = (birthDetails.timeZone || birthDetails.location.timezone).trim();
  return [
    normalizedDate(birthDetails),
    birthDetails.birthTime,
    lat,
    lon,
    timezone,
  ].join('|');
}

function getCacheStorageKey(cacheKey: string): string {
  return `${FULL_READING_CACHE_PREFIX}${encodeURIComponent(cacheKey)}`;
}

function readCachedFullReading(storageKey: string): FullReadingResponse | null {
  if (typeof window === 'undefined') return null;
  try {
    const cached = window.sessionStorage.getItem(storageKey);
    return cached ? JSON.parse(cached) as FullReadingResponse : null;
  } catch {
    return null;
  }
}

export function useJyotishReading({
  birthDetails,
  chart,
  language = 'en',
}: UseJyotishReadingOptions): UseJyotishReadingResult {
  const cacheKey = useMemo(
    () => (birthDetails ? getJyotishCacheKey(birthDetails) : null),
    [birthDetails],
  );
  const cacheStorageKey = cacheKey ? getCacheStorageKey(cacheKey) : null;

  const [fullReading, setFullReading] = useState<FullReadingResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<JyotishQaPair[]>([]);
  const [asking, setAsking] = useState(false);
  const [askError, setAskError] = useState<string | null>(null);

  useEffect(() => {
    if (!cacheStorageKey) {
      setFullReading(null);
      setError(null);
      return;
    }
    setFullReading(readCachedFullReading(cacheStorageKey));
  }, [cacheStorageKey]);

  const generateReading = useCallback(async () => {
    if (!birthDetails) {
      setError('Birth details are required to generate a reading.');
      return;
    }

    if (cacheStorageKey) {
      const cached = readCachedFullReading(cacheStorageKey);
      if (cached) {
        setFullReading(cached);
        setError(null);
        return;
      }
    }

    setLoading(true);
    setError(null);
    try {
      const result = await fetchFullReading({
        mode: 'full_reading',
        birthDetails,
        chart,
        language,
      });
      setFullReading(result);
      if (cacheStorageKey && typeof window !== 'undefined') {
        try {
          window.sessionStorage.setItem(cacheStorageKey, JSON.stringify(result));
        } catch {
          // Reading still works when session storage is unavailable.
        }
      }
    } catch (caught) {
      setError(
        caught instanceof JyotishApiError
          ? caught.message
          : 'The Jyotish reading could not be generated. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  }, [birthDetails, chart, language, cacheStorageKey]);

  const reset = useCallback(() => {
    setFullReading(null);
    setLoading(false);
    setError(null);
    if (cacheStorageKey && typeof window !== 'undefined') {
      try {
        window.sessionStorage.removeItem(cacheStorageKey);
      } catch {
        // State reset remains effective when session storage is unavailable.
      }
    }
  }, [cacheStorageKey]);

  const submitQuestion = useCallback(async (question: string) => {
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion) {
      setAskError('Enter a question before submitting.');
      return;
    }
    if (trimmedQuestion.length > MAX_QUESTION_LENGTH) {
      setAskError(`Questions must be ${MAX_QUESTION_LENGTH} characters or fewer.`);
      return;
    }
    if (!birthDetails) {
      setAskError('Birth details are required to ask a question.');
      return;
    }

    setAsking(true);
    setAskError(null);
    try {
      const result = await askJyotishQuestion({
        mode: 'ask_question',
        birthDetails,
        chart,
        language,
        question: trimmedQuestion,
      });
      setHistory((current) => [
        ...current,
        { question: trimmedQuestion, answer: result },
      ]);
    } catch (caught) {
      setAskError(
        caught instanceof JyotishApiError
          ? caught.message
          : 'The question could not be answered. Please try again.',
      );
    } finally {
      setAsking(false);
    }
  }, [birthDetails, chart, language]);

  return {
    fullReading,
    loading,
    error,
    generateReading,
    reset,
    history,
    asking,
    askError,
    submitQuestion,
  };
}
