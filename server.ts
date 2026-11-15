import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { CURRENT_BS_YEAR } from './lib/bsData';
import { getSeoForRoute } from './lib/seo';
import { generateSitemapXml } from './lib/sitemap';
import {
  buildCanonicalUrl,
  getCanonicalHostRedirect,
  generateRobotsTxt,
  getAdSettings,
  getGoogleSiteVerificationTag,
  getSiteUrl,
  isConverterToolsIndexingEnabled,
  isNoindexSiteEnabled,
} from './lib/siteConfig';

const PORT = 3000;
const IS_PROD = process.env.NODE_ENV === 'production';
const SITE_URL = getSiteUrl();
const NOINDEX_SITE = isNoindexSiteEnabled();
const AD_SETTINGS = getAdSettings();
const GOOGLE_SITE_VERIFICATION = process.env.GOOGLE_SITE_VERIFICATION?.trim() ?? '';
const CONVERTER_TOOLS_INDEXING_ENABLED = isConverterToolsIndexingEnabled();

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function injectRouteSeo(
  html: string,
  pathname: string,
  origin: string,
  nowMs: number,
  appHtml: string,
  noindexSite: boolean,
  adsEnabled: boolean,
  adsenseClientId: string,
  googleSiteVerification: string,
  converterToolsIndexingEnabled: boolean,
): { html: string; status: number } {
  const seo = getSeoForRoute(
    pathname,
    origin,
    new Date(nowMs),
    noindexSite,
    converterToolsIndexingEnabled,
  );
  const canonicalUrl = buildCanonicalUrl(seo.canonicalPath, origin);
  const jsonLdScripts = seo.jsonLd
    .map(
      (schema) =>
        `<script type="application/ld+json" data-mitipatro-jsonld="true">${JSON.stringify(schema)}</script>`,
    )
    .join('\n    ');

  const headExtras = `
    <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
    <meta property="og:url" content="${escapeHtml(canonicalUrl)}" />
    ${getGoogleSiteVerificationTag(pathname, googleSiteVerification)}
    ${jsonLdScripts}
  `;

  const ssrDataPayload = JSON.stringify({
    initialPath: pathname,
    initialOrigin: origin,
    initialNowMs: nowMs,
    noindexSite,
    adsEnabled,
    adsenseClientId,
    googleSiteVerification,
    converterToolsIndexingEnabled,
  }).replace(/</g, '\\u003c');

  const finalHtml = html
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(seo.title)}</title>`)
    .replace(
      /<meta\s+name="robots"\s+content="[^"]*"\s*\/?>/,
      `<meta name="robots" content="${escapeHtml(seo.robots)}" />`,
    )
    .replace(
      /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/,
      `<meta name="description" content="${escapeHtml(seo.description)}" />`,
    )
    .replace(
      /<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/,
      `<meta property="og:title" content="${escapeHtml(seo.title)}" />`,
    )
    .replace(
      /<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/,
      `<meta property="og:description" content="${escapeHtml(seo.description)}" />`,
    )
    .replace('<!--SSR_HEAD-->', headExtras)
    .replace('<!--SSR_APP-->', appHtml)
    .replace(
      '<!--SSR_DATA-->',
      `<script>window.__MITIPATRO_DATA__=${ssrDataPayload};</script>`,
    );

  return {
    html: finalHtml,
    status: seo.isNotFound ? 404 : 200,
  };
}

async function startServer() {
  const app = express();
  app.disable('x-powered-by');

  // 301 canonical redirects (one intent = one URL)
  const redirects: Record<string, string> = {
    '/today': '/aaja-ko-miti',
    '/today-nepali-date': '/aaja-ko-miti',
    '/converter': '/date-converter',
    '/bs-to-ad': '/date-converter',
    '/calendar': `/calendar/${CURRENT_BS_YEAR}`,
    '/holidays': `/holidays/${CURRENT_BS_YEAR}`,
    '/rasifal': '/rashifal',
    '/horoscope': '/rashifal',
    '/rasifal/weekly': '/rashifal/weekly',
    '/horoscope/weekly': '/rashifal/weekly',
    '/rasifal/monthly': '/rashifal/monthly',
    '/horoscope/monthly': '/rashifal/monthly',
  };

  app.use((req, res, next) => {
    const canonicalRedirect = getCanonicalHostRedirect(
      req.get('host') ?? '',
      req.protocol,
      req.originalUrl,
      SITE_URL,
      IS_PROD,
    );
    if (canonicalRedirect) {
      return res.redirect(301, canonicalRedirect);
    }

    const cleanPath = req.path === '/' ? '/' : req.path.replace(/\/+$/, '');
    if (req.path.length > 1 && req.path.endsWith('/')) {
      return res.redirect(301, cleanPath);
    }
    if (redirects[cleanPath]) {
      return res.redirect(301, redirects[cleanPath]);
    }
    next();
  });

  // robots.txt
  app.get('/robots.txt', (req, res) => {
    res.type('text/plain').send(generateRobotsTxt(SITE_URL, NOINDEX_SITE));
  });

  // Dynamic XML Sitemap (only complete, indexable years 2082-2083 BS)
  app.get('/sitemap.xml', (req, res) => {
    res
      .type('application/xml')
      .send(generateSitemapXml(SITE_URL, new Date(), CONVERTER_TOOLS_INDEXING_ENABLED));
  });

  let vite: Awaited<ReturnType<typeof createViteServer>> | null = null;
  if (!IS_PROD) {
    vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(process.cwd(), 'dist'), { index: false }));
  }

  // Catch-all route serving full SSR React HTML with route-specific SEO tags & JSON-LD
  app.get('*', async (req, res, next) => {
    try {
      const cleanOrigin = SITE_URL;
      const nowMs = Date.now();
      const templatePath = IS_PROD
        ? path.resolve(process.cwd(), 'dist', 'index.html')
        : path.resolve(process.cwd(), 'index.html');

      let html = fs.readFileSync(templatePath, 'utf-8');
      let renderFn: (
        pathname: string,
        origin: string,
        nowMs: number,
        noindexSite: boolean,
        adsEnabled: boolean,
        adsenseClientId: string,
        googleSiteVerification: string,
        converterToolsIndexingEnabled: boolean,
      ) => string;

      if (vite) {
        html = await vite.transformIndexHtml(req.originalUrl, html);
        const mod = (await vite.ssrLoadModule('/src/entry-server.tsx')) as {
          render: typeof renderFn;
        };
        renderFn = mod.render;
      } else {
        const mod = (await import('./src/entry-server.tsx')) as {
          render: typeof renderFn;
        };
        renderFn = mod.render;
      }

      const appHtml = renderFn(
        req.path,
        cleanOrigin,
        nowMs,
        NOINDEX_SITE,
        AD_SETTINGS.enabled,
        AD_SETTINGS.clientId,
        GOOGLE_SITE_VERIFICATION,
        CONVERTER_TOOLS_INDEXING_ENABLED,
      );
      const rendered = injectRouteSeo(
        html,
        req.path,
        cleanOrigin,
        nowMs,
        appHtml,
        NOINDEX_SITE,
        AD_SETTINGS.enabled,
        AD_SETTINGS.clientId,
        GOOGLE_SITE_VERIFICATION,
        CONVERTER_TOOLS_INDEXING_ENABLED,
      );
      res.status(rendered.status).set({ 'Content-Type': 'text/html; charset=utf-8' }).end(rendered.html);
    } catch (err) {
      if (vite && err instanceof Error) {
        vite.ssrFixStacktrace(err);
      }
      next(err);
    }
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MitiPatro server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
