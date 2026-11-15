import { generateSitemapPaths } from './seo';
import { buildCanonicalUrl, getSiteUrl } from './siteConfig';

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function generateSitemapXml(
  siteUrl = getSiteUrl(),
  now = new Date(),
  converterToolsIndexingEnabled = false,
  rashifalIndexingEnabled = false,
): string {
  const todayIso = now.toISOString().split('T')[0];
  const urls = generateSitemapPaths(converterToolsIndexingEnabled, rashifalIndexingEnabled)
    .map((route) => {
      const priority =
        route === '/' ? '1.0' : route === '/aaja-ko-miti' || route === '/date-converter' ? '0.9' : '0.8';
      const changefreq = route === '/' || route === '/aaja-ko-miti' ? 'daily' : 'monthly';
      return `  <url>\n    <loc>${escapeXml(buildCanonicalUrl(route, siteUrl))}</loc>\n    <lastmod>${todayIso}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}
