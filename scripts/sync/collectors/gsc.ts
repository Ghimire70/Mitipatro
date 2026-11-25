// scripts/sync/collectors/gsc.ts
//
// Optional Google Search Console Search Analytics collector.
// Uses raw fetch with a manually-constructed service-account JWT Bearer token.
// No googleapis dependency. Gracefully degrades (returns [] + warning) when
// GSC_CREDENTIALS_JSON or GSC_SITE_URL env vars are missing.
//
// Reads queries, impressions, and clicks for question-pattern searches
// (kati, kahile, aaja, bs, ad, holiday, rashifal, tithi, what, when, where).

import { createSign, createHash } from 'node:crypto';

const GSC_BASE = 'https://searchconsole.googleapis.com/webmasters/v3';

const QUESTION_FILTERS = [
  'kati', 'kahile', 'aaja', 'bs to ad', 'ad to bs', 'holiday', 'rashifal',
  'tithi', 'ekadashi', 'purnima', 'what', 'when', 'where', 'date',
  'bikram sambat', 'nepali date', 'dashain', 'tihar', 'chhath', 'losar',
  'teej', 'shivaratri', 'holi', 'maghe sankranti',
];

interface GscCredentials {
  client_email: string;
  private_key: string;
  token_uri?: string;
}

function buildJwt(creds: GscCredentials): string {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: creds.client_email,
    scope: 'https://www.googleapis.com/auth/webmasters.readonly',
    aud: creds.token_uri || 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  };
  const b64url = (obj: object) =>
    Buffer.from(JSON.stringify(obj))
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  const signingInput = `${b64url(header)}.${b64url(payload)}`;
  const signer = createSign('RSA-SHA256');
  signer.update(signingInput);
  signer.end();
  const signature = signer.sign(creds.private_key, 'base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return `${signingInput}.${signature}`;
}

async function getAccessToken(creds: GscCredentials): Promise<string> {
  const jwt = buildJwt(creds);
  const body = new URLSearchParams({
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion: jwt,
  });
  const tokenUri = creds.token_uri || 'https://oauth2.googleapis.com/token';
  const res = await fetch(tokenUri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`GSC token request failed: ${res.status} ${text}`);
  }
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

export interface GscQueryRow {
  query: string;
  impressions: number;
  clicks: number;
}

export async function collectGscQueries(
  siteUrl: string,
  credentialsJson?: string,
): Promise<GscQueryRow[]> {
  if (!credentialsJson) {
    console.warn('[gsc] GSC_CREDENTIALS_JSON not set — skipping GSC collection.');
    return [];
  }
  if (!siteUrl) {
    console.warn('[gsc] GSC_SITE_URL not set — skipping GSC collection.');
    return [];
  }

  let creds: GscCredentials;
  try {
    creds = JSON.parse(credentialsJson) as GscCredentials;
  } catch (err) {
    console.warn('[gsc] Invalid GSC_CREDENTIALS_JSON — skipping:', (err as Error).message);
    return [];
  }

  let accessToken: string;
  try {
    accessToken = await getAccessToken(creds);
  } catch (err) {
    console.warn('[gsc] Failed to obtain access token — skipping:', (err as Error).message);
    return [];
  }

  const rows: GscQueryRow[] = [];
  const now = new Date();
  const endDate = now.toISOString().slice(0, 10);
  const startDate = new Date(Date.now() - 28 * 86_400_000).toISOString().slice(0, 10);

  for (const filter of QUESTION_FILTERS) {
    try {
      const url = new URL(`${GSC_BASE}/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`);
      url.searchParams.set('startDate', startDate);
      url.searchParams.set('endDate', endDate);
      url.searchParams.set('dimensions', 'query');
      url.searchParams.set('rowLimit', '25');
      url.searchParams.set('filters', `query==${filter}`);

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) {
        console.warn(`[gsc] Filter "${filter}" returned ${res.status} — skipping.`);
        continue;
      }
      const data = (await res.json()) as { rows?: Array<{ keys: string[]; impressions: number; clicks: number }> };
      for (const row of data.rows ?? []) {
        const query = row.keys[0];
        if (query) {
          rows.push({ query, impressions: row.impressions, clicks: row.clicks });
        }
      }
    } catch (err) {
      console.warn(`[gsc] Filter "${filter}" errored — skipping:`, (err as Error).message);
    }
  }

  return rows;
}
