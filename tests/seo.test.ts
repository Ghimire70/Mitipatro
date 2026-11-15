import test from 'node:test';
import assert from 'node:assert/strict';
import { generateSitemapPaths, getSeoForRoute } from '../lib/seo';
import { generateSitemapXml } from '../lib/sitemap';
import {
  buildCanonicalUrl,
  getCanonicalHostRedirect,
  generateRobotsTxt,
  getAdSettings,
  getGoogleSiteVerificationTag,
  getSiteUrl,
  isNoindexSiteEnabled,
} from '../lib/siteConfig';
import { render } from '../src/entry-server';
import { getHolidaysForYear } from '../lib/holidays';

const SAMPLE_NOW_MS = new Date('2026-11-14T06:15:00.000Z').getTime(); // Kartik 28, 2083 BS
const ORIGIN = 'https://mitipatro.com';

test('SITE_URL is used for canonical URLs and sitemap entries', () => {
  const siteUrl = getSiteUrl({ SITE_URL: 'https://calendar.example/' });
  const seo = getSeoForRoute('/calendar/2083/baisakh', siteUrl, new Date(SAMPLE_NOW_MS), false);
  const canonicalUrl = buildCanonicalUrl(seo.canonicalPath, siteUrl);
  const sitemap = generateSitemapXml(siteUrl, new Date(SAMPLE_NOW_MS));

  assert.equal(canonicalUrl, 'https://calendar.example/calendar/2083/baisakh');
  assert.ok(sitemap.includes('<loc>https://calendar.example/</loc>'));
  assert.ok(sitemap.includes(`<loc>${canonicalUrl}</loc>`));
  assert.ok(!sitemap.includes('https://mitipatro.com'));
});

test('SITE_URL normalizes trailing slashes, production HTTPS, and www hosts', () => {
  assert.equal(getSiteUrl({ SITE_URL: 'https://example.com.np/' }), 'https://example.com.np');
  assert.equal(
    getSiteUrl({ SITE_URL: 'http://www.example.com.np/' }, true),
    'https://example.com.np',
  );
  assert.equal(getSiteUrl({ SITE_URL: 'http://localhost:3000/' }, true), 'https://localhost:3000');
});

test('canonical host redirects apply only to production custom-domain requests', () => {
  const siteUrl = 'https://example.com.np';
  assert.equal(
    getCanonicalHostRedirect('www.example.com.np', 'https', '/calendar/2083?month=1', siteUrl, true),
    'https://example.com.np/calendar/2083?month=1',
  );
  assert.equal(
    getCanonicalHostRedirect('preview.example.net', 'https', '/today', siteUrl, true),
    'https://example.com.np/today',
  );
  assert.equal(
    getCanonicalHostRedirect('example.com.np', 'http', '/about', siteUrl, true),
    'https://example.com.np/about',
  );
  assert.equal(
    getCanonicalHostRedirect('www.example.com.np', 'https', '/', siteUrl, false),
    null,
  );
  assert.equal(
    getCanonicalHostRedirect('localhost:3000', 'http', '/', 'http://localhost:3000', true),
    null,
  );
  assert.equal(
    getCanonicalHostRedirect('test.vercel.app', 'https', '/', 'https://test.vercel.app', true),
    null,
  );
});

test('Google Search Console verification tag is optional and home-only', () => {
  assert.equal(getGoogleSiteVerificationTag('/', undefined), '');
  assert.equal(getGoogleSiteVerificationTag('/about', 'token'), '');
  assert.equal(
    getGoogleSiteVerificationTag('/', ' token&value '),
    '<meta name="google-site-verification" content="token&amp;value" />',
  );
});

test('NOINDEX_SITE defaults on and can be disabled for launch', () => {
  assert.equal(isNoindexSiteEnabled({}), true);
  assert.equal(isNoindexSiteEnabled({ NOINDEX_SITE: 'true' }), true);
  assert.equal(isNoindexSiteEnabled({ NOINDEX_SITE: 'false' }), false);

  const prelaunchSeo = getSeoForRoute('/', ORIGIN, new Date(SAMPLE_NOW_MS));
  const liveSeo = getSeoForRoute('/', ORIGIN, new Date(SAMPLE_NOW_MS), false);
  assert.equal(prelaunchSeo.robots, 'noindex, nofollow');
  assert.equal(liveSeo.robots, 'index, follow');
  assert.match(generateRobotsTxt(ORIGIN, true), /Disallow: \//);
  assert.match(generateRobotsTxt(ORIGIN, false), /Allow: \//);
});

test('ads stay disabled unless both the flag and AdSense client ID are configured', () => {
  assert.deepEqual(getAdSettings({}), { enabled: false, clientId: '' });
  assert.equal(getAdSettings({ ADS_ENABLED: 'true' }).enabled, false);
  assert.equal(getAdSettings({ ADSENSE_CLIENT_ID: 'ca-pub-test' }).enabled, false);
  assert.deepEqual(
    getAdSettings({ ADS_ENABLED: 'true', ADSENSE_CLIENT_ID: ' ca-pub-test ' }),
    { enabled: true, clientId: 'ca-pub-test' },
  );
});

test('women-only holiday entries are not classified as general public holidays', () => {
  const restrictedHolidays = getHolidaysForYear(2083).filter((holiday) => holiday.type === 'women_only');
  assert.deepEqual(
    restrictedHolidays.map((holiday) => holiday.nameEn),
    ['Haritalika Teej', 'International Women’s Day'],
  );
  assert.ok(restrictedHolidays.every((holiday) => !holiday.isPublicHoliday));

  const holidaysPage = render('/holidays/2083', ORIGIN, SAMPLE_NOW_MS);
  assert.ok(holidaysPage.includes('Women-only Holiday'));
});

test('indexable routes (core + 2082/2083 BS) emit robots "index, follow"', () => {
  const indexableRoutes = [
    '/',
    '/aaja-ko-miti',
    '/date-converter',
    '/calendar/2082',
    '/calendar/2082/baisakh',
    '/holidays/2082',
    '/calendar/2083',
    '/calendar/2083/baisakh',
    '/holidays/2083',
    '/about',
    '/contact',
    '/privacy',
    '/terms',
  ];

  for (const route of indexableRoutes) {
    const seo = getSeoForRoute(route, ORIGIN, new Date(SAMPLE_NOW_MS), false);
    assert.equal(seo.robots, 'index, follow', `Expected index, follow for ${route}`);
    assert.ok(!seo.isNotFound, `Did not expect isNotFound for ${route}`);
  }
});

test('thin future years (2084 & 2085 BS) emit robots "noindex, follow"', () => {
  const noindexRoutes = [
    '/calendar/2084',
    '/calendar/2084/baisakh',
    '/calendar/2084/chaitra',
    '/holidays/2084',
    '/calendar/2085',
    '/calendar/2085/kartik',
    '/holidays/2085',
  ];

  for (const route of noindexRoutes) {
    const seo = getSeoForRoute(route, ORIGIN, new Date(SAMPLE_NOW_MS), false);
    assert.equal(seo.robots, 'noindex, follow', `Expected noindex, follow for ${route}`);
    assert.ok(!seo.isNotFound, `Published thin year ${route} should still resolve as a valid browsable route`);
  }
});

test('unknown routes emit robots "noindex, follow" and isNotFound=true', () => {
  const seo = getSeoForRoute('/calendar/2099', ORIGIN, new Date(SAMPLE_NOW_MS), false);
  assert.equal(seo.robots, 'noindex, follow');
  assert.equal(seo.isNotFound, true);
});

test('generateSitemapPaths includes 2082 & 2083 BS and excludes 2084 & 2085 BS', () => {
  const paths = generateSitemapPaths();
  assert.ok(paths.includes('/'), 'Sitemap should include /');
  assert.ok(paths.includes('/aaja-ko-miti'), 'Sitemap should include /aaja-ko-miti');
  assert.ok(paths.includes('/date-converter'), 'Sitemap should include /date-converter');
  assert.ok(paths.includes('/calendar/2082'), 'Sitemap should include /calendar/2082');
  assert.ok(paths.includes('/calendar/2083/baisakh'), 'Sitemap should include /calendar/2083/baisakh');
  assert.ok(paths.includes('/holidays/2083'), 'Sitemap should include /holidays/2083');

  const forbidden = paths.filter((p) => p.includes('2084') || p.includes('2085'));
  assert.deepEqual(forbidden, [], 'Sitemap must not contain 2084 or 2085 BS URLs');
});

test('SSR renderToString produces full body HTML (grid, holidays, FAQs) for all public routes', () => {
  const textOnly = (html: string) => html.replace(/<!--[\s\S]*?-->/g, '');

  const baisakhHtml = render('/calendar/2083/baisakh', ORIGIN, SAMPLE_NOW_MS);
  const baisakhText = textOnly(baisakhHtml);
  assert.ok(baisakhText.includes('Baisakh 2083 Nepali Calendar'), 'Missing H1 in Baisakh SSR HTML');
  assert.ok(baisakhHtml.includes('role="grid"'), 'Missing calendar grid role in Baisakh SSR HTML');
  assert.ok(baisakhText.includes('Nepali New Year 2083'), 'Missing holiday label in Baisakh SSR HTML');
  assert.ok(baisakhText.includes('Frequently Asked Questions'), 'Missing FAQs section in Baisakh SSR HTML');
  assert.ok(baisakhText.includes('How many days are in Baisakh 2083 BS?'), 'Missing FAQ question in Baisakh SSR HTML');

  const holidaysText = textOnly(render('/holidays/2083', ORIGIN, SAMPLE_NOW_MS));
  assert.ok(holidaysText.includes('Vijaya Dashami'), 'Missing holiday list in Holidays 2083 SSR HTML');
  assert.ok(holidaysText.includes('Frequently Asked Questions'), 'Missing FAQs in Holidays 2083 SSR HTML');

  const homeHtml = render('/', ORIGIN, SAMPLE_NOW_MS);
  const homeText = textOnly(homeHtml);
  assert.ok(homeText.includes('Nepali Calendar 2083 BS'), 'Missing H1 in Home SSR HTML');
  assert.ok(homeHtml.includes('role="grid"'), 'Missing calendar grid in Home SSR HTML');
  assert.ok(!homeText.includes('Advertisement'), 'Ad placeholders should be hidden when ads are disabled');

  const adsEnabledHtml = render('/', ORIGIN, SAMPLE_NOW_MS, false, true, 'ca-pub-test');
  assert.ok(adsEnabledHtml.includes('Advertisement'), 'Enabled ad slots should retain their reserved placeholder');

  const todayText = textOnly(render('/aaja-ko-miti', ORIGIN, SAMPLE_NOW_MS));
  assert.ok(todayText.includes('Aaja Ko Miti'), 'Missing H1 in Aaja Ko Miti SSR HTML');
  assert.ok(todayText.includes('Kartik 28, 2083 BS'), 'Missing today BS date in Aaja Ko Miti SSR HTML');

  const yearText = textOnly(render('/calendar/2083', ORIGIN, SAMPLE_NOW_MS));
  assert.ok(yearText.includes('Nepali Calendar 2083 BS Overview'), 'Missing H1 in Year 2083 SSR HTML');
  assert.ok(yearText.includes('12. Chaitra'), 'Missing 12th month in Year 2083 SSR HTML');

  const converterText = textOnly(render('/date-converter', ORIGIN, SAMPLE_NOW_MS));
  assert.ok(converterText.includes('BS to AD &amp; AD to BS Date Converter'), 'Missing H1 in Converter SSR HTML');
  assert.ok(converterText.includes('1 Baisakh 2083'), 'Missing reference table in Converter SSR HTML');
});

test('static policy pages explain date verification, contact, privacy, and terms without false form claims', () => {
  const about = render('/about', ORIGIN, SAMPLE_NOW_MS);
  assert.ok(about.includes('How Dates Are Checked'));
  assert.ok(about.includes('1 Baisakh 2000 BS = 14 April 1943 AD'));
  assert.ok(about.includes('Asia/Kathmandu'));
  assert.ok(about.includes('Holiday records currently have empty source fields'));

  const contact = render('/contact', ORIGIN, SAMPLE_NOW_MS);
  assert.ok(contact.includes('mailto:replace-with-your-email@example.com'));
  assert.ok(contact.includes('Response time is not guaranteed'));
  assert.ok(!contact.includes('Message recorded'));

  const privacy = render('/privacy', ORIGIN, SAMPLE_NOW_MS);
  assert.ok(privacy.includes('Cookies and Advertising'));
  assert.ok(privacy.includes('does not currently provide accounts, analytics'));
  assert.ok(privacy.includes('ADS_ENABLED=true'));

  const terms = render('/terms', ORIGIN, SAMPLE_NOW_MS);
  assert.ok(terms.includes('for general reference only'));
  assert.ok(terms.includes('confirm holidays and any time-sensitive date with the relevant official source'));
});

test('holiday listings include the reference disclaimer and avoid unsupported certainty claims', () => {
  const holidayNote = 'Holiday dates are for reference. Please confirm with official government notices.';
  const home = render('/', ORIGIN, SAMPLE_NOW_MS);
  const holidays = render('/holidays/2083', ORIGIN, SAMPLE_NOW_MS);
  const month = render('/calendar/2083/baisakh', ORIGIN, SAMPLE_NOW_MS);

  assert.ok(home.includes(holidayNote));
  assert.ok(holidays.includes(holidayNote));
  assert.ok(month.includes(holidayNote));
  const holidaysText = holidays.replace(/<!--[\s\S]*?-->/g, '');
  assert.match(holidaysText, /Showing \d+ entries marked as public holidays/);
  assert.ok(!holidays.includes('gazetted'));
  assert.ok(!holidays.includes('Verified Bikram Sambat'));
});
