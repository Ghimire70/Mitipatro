import { render } from '../src/entry-server';
import { generateSitemapPaths, getSeoForRoute } from '../lib/seo';
import { generateSitemapXml } from '../lib/sitemap';
import {
  buildCanonicalUrl,
  getSiteUrl,
  isConverterToolsIndexingEnabled,
  isNoindexSiteEnabled,
  generateRobotsTxt,
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
const homeHtml = render('/', siteUrl, Date.now(), false);
const aajaKoMitiHtml = render('/aaja-ko-miti', siteUrl, Date.now(), false);
const dateConverterHtml = render('/date-converter', siteUrl, Date.now(), false);

// SEO meta checks: title and description present on key routes
const seoRoutes = ['/', '/aaja-ko-miti', '/date-converter'];
const seoChecks = seoRoutes.map((route) => {
  const seo = getSeoForRoute(route, siteUrl, new Date(), false, converterToolsIndexingEnabled);
  return {
    label: `SEO title present: ${route}`,
    passed: typeof seo.title === 'string' && seo.title.length > 0,
    detail: `Title: "${seo.title}"`,
  };
});

const seoDescChecks = seoRoutes.map((route) => {
  const seo = getSeoForRoute(route, siteUrl, new Date(), false, converterToolsIndexingEnabled);
  return {
    label: `SEO description present: ${route}`,
    passed: typeof seo.description === 'string' && seo.description.length > 0,
    detail: `Description: "${seo.description.slice(0, 60)}..."`,
  };
});

// JSON-LD validity: BreadcrumbList and FAQPage schemas present
const homeSeo = getSeoForRoute('/', siteUrl, new Date(), false, converterToolsIndexingEnabled);
const hasBreadcrumbJsonLd = homeSeo.jsonLd.some(
  (s) => s['@type'] === 'BreadcrumbList',
);
const hasFaqJsonLd = homeSeo.jsonLd.some((s) => s['@type'] === 'FAQPage');

// robots.txt rules
const robotsTxt = isNoindexSiteEnabled(process.env)
  ? 'User-agent: *\nDisallow: /'
  : 'User-agent: *\nAllow: /';
const robotsTxtGenerated = generateRobotsTxt(siteUrl, isNoindexSiteEnabled(process.env));
const robotsHasUserAgent = robotsTxtGenerated.includes('User-agent: *');
const robotsHasCorrectRule = isNoindexSiteEnabled(process.env)
  ? robotsTxtGenerated.includes('Disallow: /')
  : robotsTxtGenerated.includes('Allow: /');

const distExists = (() => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require('node:fs').statSync('dist/index.html');
    return true;
  } catch {
    return false;
  }
})();

const seoCheckArray: LaunchCheck[] = [
  ...seoChecks,
  ...seoDescChecks,
  {
    label: 'JSON-LD contains BreadcrumbList schema (home)',
    passed: hasBreadcrumbJsonLd,
    detail: `Found ${homeSeo.jsonLd.length} JSON-LD schemas; BreadcrumbList=${hasBreadcrumbJsonLd}`,
  },
  {
    label: 'JSON-LD contains FAQPage schema (home)',
    passed: hasFaqJsonLd,
    detail: `Found ${homeSeo.jsonLd.length} JSON-LD schemas; FAQPage=${hasFaqJsonLd}`,
  },
  {
    label: 'robots.txt has User-agent: * rule',
    passed: robotsHasUserAgent,
    detail: `Robots.txt: ${robotsTxtGenerated.replace(/\n/g, ' ')}`,
  },
  {
    label: 'robots.txt has correct indexing rule',
    passed: robotsHasCorrectRule,
    detail: `NOINDEX_SITE=${isNoindexSiteEnabled(process.env)}`,
  },
  {
    label: 'Build output exists (dist/index.html)',
    passed: distExists,
    detail: 'Run npm run build before launch.',
  },
];

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
    passed: canonicalUrls.concat(sitemapUrls).every((url) => url.startsWith(`${siteUrl}/`)),
    detail: `${canonicalUrls.length} canonical URLs and ${sitemapUrls.length} sitemap URLs checked.`,
  },
].concat(seoCheckArray);

for (const check of checks) {
  console.log(`${check.passed ? 'PASS' : 'FAIL'} ${check.label}${check.passed ? '' : ` — ${check.detail}`}`);
}

if (checks.some((check) => !check.passed)) {
  process.exitCode = 1;
} else {
  console.log('Launch checks passed.');
}
