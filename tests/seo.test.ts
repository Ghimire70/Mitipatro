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
  isConverterToolsIndexingEnabled,
  isNoindexSiteEnabled,
  isRashifalIndexingEnabled,
  isPanchangIndexingEnabled,
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

test('converter tools default to noindex and enter the sitemap only when enabled', () => {
  const toolRoutes = ['/bs-date-difference', '/bs-age-calculator', '/nepali-numbers'];
  const titles = new Set<string>();
  assert.equal(isConverterToolsIndexingEnabled({}), false);
  assert.equal(isConverterToolsIndexingEnabled({ CONVERTER_TOOLS_INDEXING_ENABLED: 'true' }), true);
  assert.equal(isConverterToolsIndexingEnabled({ CONVERTER_TOOLS_INDEXING_ENABLED: 'yes' }), false);

  for (const route of toolRoutes) {
    const disabledSeo = getSeoForRoute(route, ORIGIN, new Date(SAMPLE_NOW_MS), false);
    assert.equal(disabledSeo.robots, 'noindex, follow');
    assert.ok(disabledSeo.title.length > 0);
    assert.ok(disabledSeo.description.length > 0);
    assert.ok(disabledSeo.h1.length > 0);
    titles.add(disabledSeo.title);
    assert.ok(disabledSeo.jsonLd.length > 0);
    assert.ok(!generateSitemapPaths().includes(route));

    const enabledSeo = getSeoForRoute(route, ORIGIN, new Date(SAMPLE_NOW_MS), false, true);
    assert.equal(enabledSeo.robots, 'index, follow');
    assert.equal(enabledSeo.canonicalPath, route);
    assert.ok(generateSitemapPaths(true).includes(route));
    assert.ok(generateSitemapXml(ORIGIN, new Date(SAMPLE_NOW_MS), true).includes(
      `<loc>${ORIGIN}${route}</loc>`,
    ));

    const sitewideNoindexSeo = getSeoForRoute(route, ORIGIN, new Date(SAMPLE_NOW_MS), true, true);
    assert.equal(sitewideNoindexSeo.robots, 'noindex, nofollow');
  }
  assert.equal(titles.size, toolRoutes.length, 'Converter tool pages must have unique titles');
  assert.ok(toolRoutes.every((route) => !generateSitemapXml(ORIGIN).includes(`<loc>${ORIGIN}${route}</loc>`)));
});

test('Rashifal defaults to noindex and hidden links, and can be enabled for publication', () => {
  const rashifalRoutes = [
    '/rashifal',
    '/rashifal/daily',
    '/rashifal/weekly',
    '/rashifal/monthly',
    '/rashifal/mesha',
    '/rashifal/weekly/mesha',
    '/rashifal/monthly/mesha',
  ];

  assert.equal(isRashifalIndexingEnabled({}), false);
  assert.equal(isRashifalIndexingEnabled({ RASHIFAL_INDEXING_ENABLED: 'true' }), true);
  assert.equal(isRashifalIndexingEnabled({ RASHIFAL_INDEXING_ENABLED: 'yes' }), false);

  for (const route of rashifalRoutes) {
    assert.equal(
      getSeoForRoute(route, ORIGIN, new Date(SAMPLE_NOW_MS), false).robots,
      'noindex, follow',
      `${route} should be noindex while the gate is disabled`,
    );
    assert.equal(
      getSeoForRoute(route, ORIGIN, new Date(SAMPLE_NOW_MS), false, false, true).robots,
      'index, follow',
      `${route} should be indexable while the gate is enabled`,
    );
  }

  assert.ok(!generateSitemapPaths().some((path) => path.startsWith('/rashifal')));
  assert.ok(!generateSitemapXml(ORIGIN, new Date(SAMPLE_NOW_MS)).includes('/rashifal'));
  assert.ok(generateSitemapPaths(false, true).includes('/rashifal/monthly/meen'));
  assert.ok(
    generateSitemapXml(ORIGIN, new Date(SAMPLE_NOW_MS), false, true).includes(
      `<loc>${ORIGIN}/rashifal/monthly/meen</loc>`,
    ),
  );

  const hiddenHome = render('/', ORIGIN, SAMPLE_NOW_MS, false);
  const hiddenToday = render('/aaja-ko-miti', ORIGIN, SAMPLE_NOW_MS, false);
  const hiddenCalendar = render('/calendar/2083/baisakh', ORIGIN, SAMPLE_NOW_MS, false);
  for (const html of [hiddenHome, hiddenToday, hiddenCalendar]) {
    assert.ok(!html.includes('href="/rashifal"'));
  }
  assert.ok(!hiddenHome.includes('Rashifal (Horoscope)'));
  assert.ok(!hiddenHome.includes('दैनिक राशिफल'));

  const visibleHome = render('/', ORIGIN, SAMPLE_NOW_MS, false, false, '', '', false, true);
  const visibleToday = render('/aaja-ko-miti', ORIGIN, SAMPLE_NOW_MS, false, false, '', '', false, true);
  const visibleCalendar = render(
    '/calendar/2083/baisakh',
    ORIGIN,
    SAMPLE_NOW_MS,
    false,
    false,
    '',
    '',
    false,
    true,
  );
  for (const html of [visibleHome, visibleToday, visibleCalendar]) {
    assert.ok(html.includes('href="/rashifal"'));
  }
  assert.ok(visibleHome.includes('Rashifal (Horoscope)'));
  assert.ok(visibleHome.includes('दैनिक राशिफल'));
});

test('Panchang defaults to noindex and excluded from the sitemap, and can be enabled for publication', () => {
  assert.equal(isPanchangIndexingEnabled({}), false);
  assert.equal(isPanchangIndexingEnabled({ PANCHANG_INDEXING_ENABLED: 'true' }), true);
  assert.equal(isPanchangIndexingEnabled({ PANCHANG_INDEXING_ENABLED: 'yes' }), false);

  const disabledSeo = getSeoForRoute('/panchang', ORIGIN, new Date(SAMPLE_NOW_MS), false);
  assert.equal(disabledSeo.robots, 'noindex, follow', '/panchang should be noindex while the gate is disabled');
  assert.ok(disabledSeo.title.length > 0);
  assert.ok(disabledSeo.description.length > 0);
  assert.ok(disabledSeo.h1.length > 0);
  assert.ok(disabledSeo.jsonLd.length > 0);
  assert.ok(!generateSitemapPaths().includes('/panchang'));
  assert.ok(!generateSitemapXml(ORIGIN, new Date(SAMPLE_NOW_MS)).includes(`/panchang`));

  const enabledSeo = getSeoForRoute('/panchang', ORIGIN, new Date(SAMPLE_NOW_MS), false, false, false, true);
  assert.equal(enabledSeo.robots, 'index, follow', '/panchang should be indexable while the gate is enabled');
  assert.equal(enabledSeo.canonicalPath, '/panchang');
  assert.ok(generateSitemapPaths(false, false, true).includes('/panchang'));
  assert.ok(
    generateSitemapXml(ORIGIN, new Date(SAMPLE_NOW_MS), false, false, true).includes(
      `<loc>${ORIGIN}/panchang</loc>`,
    ),
  );

  const sitewideNoindexSeo = getSeoForRoute('/panchang', ORIGIN, new Date(SAMPLE_NOW_MS), true, false, false, true);
  assert.equal(sitewideNoindexSeo.robots, 'noindex, nofollow');

  const hiddenHome = render('/', ORIGIN, SAMPLE_NOW_MS, false);
  assert.ok(!hiddenHome.includes('href="/panchang"'));
  assert.ok(!hiddenHome.includes('पञ्चाङ्ग'));

  const visibleHome = render('/', ORIGIN, SAMPLE_NOW_MS, false, false, '', '', false, false, true);
  assert.ok(visibleHome.includes('href="/panchang"'));
  assert.ok(visibleHome.includes('पञ्चाङ्ग'));
  assert.ok(visibleHome.includes('Panchang (पञ्चाङ्ग)'));
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

  const converterToolRoutes = [
    ['/bs-date-difference', 'BS Date Difference Calculator'],
    ['/bs-age-calculator', 'BS Age Calculator'],
    ['/nepali-numbers', 'Nepali Digit and Number-to-Words Converter'],
  ] as const;
  for (const [route, heading] of converterToolRoutes) {
    const toolHtml = render(route, ORIGIN, SAMPLE_NOW_MS, false);
    assert.ok(toolHtml.includes(`<h1 class="font-display`), `Missing H1 for ${route}`);
    assert.ok(toolHtml.includes(heading), `Missing page heading for ${route}`);
  }

  const enabledToolHtml = render(
    '/bs-date-difference',
    ORIGIN,
    SAMPLE_NOW_MS,
    false,
    false,
    '',
    '',
    true,
  );
  assert.ok(enabledToolHtml.includes('elapsed'));

  assert.ok(render('/nepali-numbers', ORIGIN, SAMPLE_NOW_MS).includes('Devanagari digits'));
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
