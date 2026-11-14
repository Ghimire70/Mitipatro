export function getSiteUrl(env: NodeJS.ProcessEnv = process.env): string {
  const siteUrl = env.SITE_URL?.trim() || 'http://localhost:3000';
  return siteUrl.replace(/\/+$/, '');
}

export function isNoindexSiteEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  const value = env.NOINDEX_SITE;
  return value === undefined || value.trim().toLowerCase() !== 'false';
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
