import test from 'node:test';
import assert from 'node:assert/strict';
import { generateSitemapPaths, getSeoForRoute } from '../lib/seo';
import { generateSitemapXml } from '../lib/sitemap';
import { render } from '../src/entry-server';

const ORIGIN = 'https://mitipatro.com';
const REFERENCE_NOW_MS = new Date('2025-04-08T06:15:00.000Z').getTime();

function renderRoute(pathname: string, nowMs: number, panchangIndexingEnabled = false): string {
  return render(
    pathname,
    ORIGIN,
    nowMs,
    false,
    false,
    '',
    '',
    false,
    false,
    panchangIndexingEnabled,
  );
}

test('Panchang stays noindex, out of the sitemap, and unlinked while its flag is off', () => {
  const seo = getSeoForRoute('/panchang', ORIGIN, new Date(REFERENCE_NOW_MS), false);
  assert.equal(seo.robots, 'noindex, follow');
  assert.ok(!generateSitemapPaths().includes('/panchang'));
  assert.ok(!generateSitemapXml(ORIGIN, new Date(REFERENCE_NOW_MS)).includes('/panchang'));

  for (const pathname of ['/', '/aaja-ko-miti', '/calendar/2083/kartik']) {
    const html = renderRoute(pathname, REFERENCE_NOW_MS);
    assert.ok(!html.includes('href="/panchang"'), `${pathname} must not link to /panchang`);
  }
});

test('Panchang SSR renders minute-level values, tithi text, next elements, and the required note', () => {
  const html = renderRoute('/panchang', REFERENCE_NOW_MS, true);
  const decodedHtml = html.replace(/&#x27;|&apos;/g, "'");

  // SOURCE: vedicmarga.com Kathmandu panchang page, copied in
  // tests/astronomy/panchanga.reference.test.ts (2025-04-08 sunrise: 05:46 NPT).
  assert.ok(html.includes('05:46 NPT'), 'SSR must render the externally sourced sunrise minute');
  assert.ok(html.includes('सूर्योदय (Sunrise)'));
  assert.ok(html.includes('तिथि (Tithi)'));
  assert.ok(html.includes('अर्को:'), 'each Panchang element must identify its next element');
  assert.ok(
    decodedHtml.includes("Computed values, not Nepal's official patro. Cross-checked against one website only. Please confirm with an official patro."),
  );
  assert.ok(!/T\d{2}:\d{2}:\d{2}/.test(html), 'displayed Panchang times must omit seconds');
});

test('Panchang SSR handles vriddhi and kshaya tithi dates without an error', () => {
  const cases = [
    ['vriddhi', '2025-01-18T06:15:00.000Z'],
    ['kshaya', '2025-01-11T06:15:00.000Z'],
  ] as const;

  for (const [label, instant] of cases) {
    const html = renderRoute('/panchang', new Date(instant).getTime(), true);
    assert.ok(html.includes('सूर्योदयको समयमा प्रभावी तत्व'), `${label} date must render Panchang results`);
    assert.ok(!html.includes('यस मितिका लागि सूर्योदय वा पञ्चाङ्गको परिणाम उपलब्ध भएन।'));
  }
});
