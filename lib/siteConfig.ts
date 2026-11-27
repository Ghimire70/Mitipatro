const DEFAULT_SITE_URL = 'http://localhost:3000';

function isLocalHost(hostname: string): boolean {
  const normalized = hostname.toLowerCase();
  return (
    normalized === 'localhost' ||
    normalized.endsWith('.localhost') ||
    normalized === '127.0.0.1' ||
    normalized === '[::1]' ||
    normalized.endsWith('.vercel.app') ||
    /^\d{1,3}(?:\.\d{1,3}){3}$/.test(normalized)
  );
}

export function getSiteUrl(
  env: NodeJS.ProcessEnv = process.env,
  production = env.NODE_ENV === 'production',
): string {
  const rawSiteUrl = env.SITE_URL?.trim() || DEFAULT_SITE_URL;
  const siteUrl = new URL(rawSiteUrl);
  if (siteUrl.protocol !== 'http:' && siteUrl.protocol !== 'https:') {
    throw new Error('SITE_URL must use http or https.');
  }
  if (siteUrl.pathname !== '/' || siteUrl.search || siteUrl.hash || siteUrl.username || siteUrl.password) {
    throw new Error('SITE_URL must be an origin without a path, query, or credentials.');
  }
  if (production) siteUrl.protocol = 'https:';
  if (!isLocalHost(siteUrl.hostname) && siteUrl.hostname.toLowerCase().startsWith('www.')) {
    siteUrl.hostname = siteUrl.hostname.slice(4);
  }
  return siteUrl.origin.replace(/\/+$/, '');
}

export function getCanonicalHostRedirect(
  requestHost: string,
  requestProtocol: string,
  requestUrl: string,
  siteUrl: string,
  production: boolean,
): string | null {
  const canonicalUrl = new URL(siteUrl);
  if (canonicalUrl.protocol !== 'https:' || isLocalHost(canonicalUrl.hostname) || !production) {
    return null;
  }

  const requestedHost = requestHost.toLowerCase();
  const canonicalHost = canonicalUrl.host.toLowerCase();
  if (requestedHost === canonicalHost && requestProtocol.toLowerCase() === 'https') {
    return null;
  }

  const path = requestUrl.startsWith('/') && !requestUrl.startsWith('//')
    ? requestUrl
    : `/${requestUrl.replace(/^\/+/, '')}`;
  return new URL(path, canonicalUrl).toString();
}

export function isNoindexSiteEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  const value = env.NOINDEX_SITE;
  return value === undefined || value.trim().toLowerCase() !== 'false';
}

export function isConverterToolsIndexingEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.CONVERTER_TOOLS_INDEXING_ENABLED?.trim().toLowerCase() === 'true';
}

export function isRashifalIndexingEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  const raw = env.RASHIFAL_INDEXING_ENABLED;
  if (raw === undefined) return true;
  const value = raw.trim();
  if (value.length === 0) return true;
  // Rashifal is published by default. Opt out with RASHIFAL_INDEXING_ENABLED=false|0|off|no.
  return !['false', '0', 'off', 'no'].includes(value.toLowerCase());
}

export function isPanchangIndexingEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.PANCHANG_INDEXING_ENABLED?.trim().toLowerCase() === 'true';
}

export function isJyotishIndexingEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.JYOTISH_INDEXING_ENABLED?.trim().toLowerCase() === 'true';
}

export function getAdSettings(env: NodeJS.ProcessEnv = process.env): {
  enabled: boolean;
  clientId: string;
} {
  const clientId = env.ADSENSE_CLIENT_ID?.trim() || '';
  return {
    enabled: env.ADS_ENABLED?.trim().toLowerCase() === 'true' && clientId.length > 0,
    clientId,
  };
}

export function getAdSenseSlotId(
  variant: 'leaderboard' | 'rectangle',
  env: NodeJS.ProcessEnv = process.env,
): string {
  const key = variant === 'leaderboard' ? 'ADSENSE_SLOT_LEADERBOARD' : 'ADSENSE_SLOT_RECTANGLE';
  return env[key]?.trim() || '';
}

export function getAdSenseConfig(env: NodeJS.ProcessEnv = process.env): {
  enabled: boolean;
  clientId: string;
  slotLeaderboard: string;
  slotRectangle: string;
} {
  const adSettings = getAdSettings(env);
  return {
    enabled: adSettings.enabled,
    clientId: adSettings.clientId,
    slotLeaderboard: getAdSenseSlotId('leaderboard', env),
    slotRectangle: getAdSenseSlotId('rectangle', env),
  };
}

export function getGoogleSiteVerificationTag(pathname: string, value?: string): string {
  const token = value?.trim();
  if (pathname !== '/' || !token) return '';
  const escapedToken = token
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
  return `<meta name="google-site-verification" content="${escapedToken}" />`;
}

export function generateRobotsTxt(
  siteUrl = getSiteUrl(),
  noindexSite = isNoindexSiteEnabled(),
): string {
  const rules = noindexSite ? 'Disallow: /' : 'Allow: /';
  return `User-agent: *\n${rules}\n\nSitemap: ${buildCanonicalUrl('/sitemap.xml', siteUrl)}\n`;
}

export function buildCanonicalUrl(path: string, siteUrl = getSiteUrl()): string {
  return `${siteUrl.replace(/\/+$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
}
