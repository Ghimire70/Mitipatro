// scripts/sync/collectors/autocomplete.ts
//
// Google Autocomplete / Suggest collector.
// Calls suggestqueries.google.com (no API key required). Expands seed prefixes
// around Nepali dates, BS months, festivals, holidays, conversions, and Rashifal
// in English and Nepali (gl=np, hl=en/ne) with alphabet suffixes (a-z).

const SUGGEST_BASE = 'https://suggestqueries.google.com/complete/search';

const SEEDS_EN = [
  'what is today nepali date',
  'kati din',
  'dashain 2083 date',
  'tihar 2083 date',
  'bs to ad converter',
  'ad to bs converter',
  'rashifal today',
  'ekadashi date',
  'purnima date',
  'aaja ko miti',
  'nepali new year',
  'bikram sambat calendar',
  'nepal holiday 2083',
  'maghe sankranti date',
  'losar 2083 date',
];

const SEEDS_NE = [
  'आजको मिति',
  'बिक्रम संवत्',
  'दशैँ मिति',
  'तिहार मिति',
  'राशिफल',
  'एकादशी मिति',
  'पुनि मिति',
  'बिदा मिति',
];

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz'.split('');

interface SuggestResponse {
  queries: string[];
}

export interface AutocompleteResult {
  query: string;
  source: 'autocomplete';
}

export async function collectAutocompleteQueries(
  opts?: { hl?: string; gl?: string; limitPerSeed?: number },
): Promise<AutocompleteResult[]> {
  const hl = opts?.hl ?? 'en';
  const gl = opts?.gl ?? 'np';
  const limitPerSeed = opts?.limitPerSeed ?? 10;
  const results = new Map<string, AutocompleteResult>();

  const seeds = [...SEEDS_EN, ...SEEDS_NE];

  for (const seed of seeds) {
    // Seed itself
    await fetchSuggestions(seed, hl, gl, results, limitPerSeed);
    // Seed + alphabet suffixes
    for (const letter of ALPHABET) {
      await fetchSuggestions(`${seed} ${letter}`, hl, gl, results, limitPerSeed);
    }
  }

  return [...results.values()];
}

async function fetchSuggestions(
  q: string,
  hl: string,
  gl: string,
  results: Map<string, AutocompleteResult>,
  limitPerSeed: number,
): Promise<void> {
  let count = 0;
  try {
    const url = new URL(SUGGEST_BASE);
    url.searchParams.set('client', 'chrome');
    url.searchParams.set('q', q);
    url.searchParams.set('hl', hl);
    url.searchParams.set('gl', gl);

    const res = await fetch(url.toString(), {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return;

    const text = await res.text();
    // Autocomplete returns JSONP-like: ["query", ["suggestion1", "suggestion2"]]
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      // Try stripping JSONP wrapper
      const stripped = text.replace(/^[^\(]*\(/, '').replace(/\);?$/, '');
      data = JSON.parse(stripped);
    }

    const arr = data as unknown[];
    if (!Array.isArray(arr) || arr.length < 2) return;
    const suggestions = arr[1] as unknown[];
    if (!Array.isArray(suggestions)) return;

    for (const s of suggestions) {
      if (typeof s !== 'string') continue;
      const query = String(s).trim();
      if (!query || results.has(query)) continue;
      if (!looksLikeCalendarQuery(query)) continue;
      results.set(query, { query, source: 'autocomplete' });
      count++;
      if (count >= limitPerSeed) break;
    }
  } catch {
    // Silently ignore per-seed failures
  }
}

function looksLikeCalendarQuery(q: string): boolean {
  const lq = q.toLowerCase();
  const calendarTerms = [
    'miti', 'date', 'calendar', 'dashain', 'tihar', 'chhath', 'losar', 'teej',
    'shivaratri', 'holi', 'rashifal', 'ekadashi', 'purnima', 'bs', 'ad',
    'bikram', 'sambat', 'converter', 'holiday', 'aaja', 'kati', 'kahile',
    'नपाली', 'मिति', 'राशिफल', 'पर्व', 'बिदा', 'एकादशी', 'पुनि',
  ];
  return calendarTerms.some((t) => lq.includes(t));
}
