import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MonthPage } from '../src/pages/MonthPage';

test('monthly calendar renders a print action and a printable month view', () => {
  const html = renderToStaticMarkup(
    <MonthPage
      year={2083}
      month={7}
      faqs={[]}
      nowMs={Date.parse('2026-11-15T00:00:00Z')}
      onNavigate={() => undefined}
    />,
  );

  assert.match(html, /aria-label="Print Kartik 2083 BS calendar"/);
  assert.match(html, />Print calendar<\/button>/);
  assert.match(html, /class="print-month-page/);
  assert.match(html, /class="print-calendar"/);
  assert.match(html, /Kartik 2083 Nepali Calendar/);
});

test('print stylesheet provides a dedicated page layout and hides screen-only controls', () => {
  const css = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8');

  assert.match(css, /@media print/);
  assert.match(css, /\.print-month-page/);
  assert.match(css, /\.print-hidden\s*\{\s*display:\s*none\s*!important;/);
});
