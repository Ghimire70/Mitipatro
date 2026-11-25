// scripts/sync/collectors/trends.ts
//
// Google Trends Daily RSS collector (geo=NP).
// Fetches https://trends.google.com/trends/trendingsearches/daily/rss?geo=NP
// and filters for calendar/festival/date-related titles.

const TRENDS_RSS_URL = 'https://trends.google.com/trends/trendingsearches/daily/rss?geo=NP';

export interface TrendsResult {
  query: string;
  source: 'trends';
}

const CALENDAR_TERMS = [
  'miti', 'date', 'calendar', 'dashain', 'tihar', 'chhath', 'losar', 'teej',
  'shivaratri', 'holi', 'rashifal', 'ekadashi', 'purnima', 'bs', 'ad',
  'bikram', 'sambat', 'converter', 'holiday', 'aaja', 'kati', 'kahile',
  'नपाली', 'मिति', 'राशिफल', 'पर्व', 'बिदा', 'एकादशी', 'पुनि',
  'nepal', 'nepali', 'kathmandu',
];

export async function collectTrendsQueries(): Promise<TrendsResult[]> {
  let text: string;
  try {
    const res = await fetch(TRENDS_RSS_URL, {
      headers: { 'Accept': 'application/rss+xml, application/xml' },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      console.warn(`[trends] RSS returned ${res.status} — skipping.`);
      return [];
    }
    text = await res.text();
  } catch (err) {
    console.warn('[trends] Fetch failed — skipping:', (err as Error).message);
    return [];
  }

  const results: TrendsResult[] = [];
  const seen = new Set<string>();

  // RSS items: <item><title>...</title>...</item>
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match: RegExpExecArray | null;
  while ((match = itemRegex.exec(text)) !== null) {
    const itemContent = match[1];
    const titleMatch = itemContent.match(/<title>([\s\S]*?)<\/title>/i);
    if (!titleMatch) continue;
    let title = titleMatch[1]
      .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/i, '$1')
      .replace(/<[^>]*>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();
    if (!title || seen.has(title)) continue;
    if (looksLikeCalendarQuery(title)) {
      seen.add(title);
      results.push({ query: title, source: 'trends' });
    }
  }

  return results;
}

function looksLikeCalendarQuery(q: string): boolean {
  const lq = q.toLowerCase();
  return CALENDAR_TERMS.some((t) => lq.includes(t));
}
