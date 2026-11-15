import { render } from '../src/entry-server';
import { generateSitemapPaths, getSeoForRoute } from '../lib/seo';
import { generateSitemapXml } from '../lib/sitemap';
import {
  buildCanonicalUrl,
  getSiteUrl,
  isConverterToolsIndexingEnabled,
  isNoindexSiteEnabled,
} from '../lib/siteConfig';

interface LaunchCheck {
  label: string;
  passed: boolean;
  detail: string;
}

const siteUrl = getSiteUrl(process.env, true);
const siteHost = new URL(siteUrl).hostname.toLowerCase();
const converterToolsIndexingEnabled = isConverterToolsIndexingEnabled();
const sitemapPaths = generateSitemapPaths(converterToolsIndexingEnabled);
const canonicalUrls = sitemapPaths.map((route) => {
  const seo = getSeoForRoute(route, siteUrl, new Date(), false, converterToolsIndexingEnabled);
  return buildCanonicalUrl(seo.canonicalPath, siteUrl);
});
const sitemapXml = generateSitemapXml(siteUrl, new Date(), converterToolsIndexingEnabled);
const sitemapUrls = [...sitemapXml.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
const contactHtml = render('/contact', siteUrl, Date.now(), false);
const checks: LaunchCheck[] = [
  {
    label: 'NOINDEX_SITE is disabled',
    passed: !isNoindexSiteEnabled(process.env),
    detail: 'Set NOINDEX_SITE=false before launch.',
  },
  {
    label: 'SITE_URL uses a custom domain',
    passed:
      siteHost !== 'localhost' &&
      !siteHost.endsWith('.localhost') &&
      siteHost !== '127.0.0.1' &&
      !siteHost.endsWith('.vercel.app'),
    detail: `Current SITE_URL: ${siteUrl}`,
  },
  {
    label: 'Contact email placeholder is replaced',
    passed: !contactHtml.includes('replace-with-your-email'),
    detail: 'Replace the placeholder address on the Contact page.',
  },
  {
    label: 'Canonical and sitemap URLs use SITE_URL',
    passed: [...canonicalUrls, ...sitemapUrls].every((url) => url.startsWith(`${siteUrl}/`)),
    detail: `${canonicalUrls.length} canonical URLs and ${sitemapUrls.length} sitemap URLs checked.`,
  },
];

for (const check of checks) {
  console.log(`${check.passed ? 'PASS' : 'FAIL'} ${check.label}${check.passed ? '' : ` — ${check.detail}`}`);
}

if (checks.some((check) => !check.passed)) {
  process.exitCode = 1;
} else {
  console.log('Launch checks passed.');
}
