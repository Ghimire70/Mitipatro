# MitiPatro – Project Instructions & Context

## 1. What MitiPatro Is & Stack
MitiPatro is an original Nepali Bikram Sambat (BS) calendar web application.
- **Stack**: React 19, TypeScript, Tailwind CSS v4, Vite 8, Express SSR (Node.js).
- **Core logic**: Pure logic in `lib/` (`bsData.ts`, `bsConverter.ts`, `converterTools.ts`, `holidays.ts`, `seo.ts`, `siteConfig.ts`).
- **Rendering**: SSR via `src/entry-server.tsx` (`renderToString`) and hydration in `src/main.tsx` (`hydrateRoot`).

## 2. Core Rules
- **Protect date integrity**: Never alter `lib/bsData.ts`, the converter (`lib/bsConverter.ts`), or holiday dates unless a test proves a bug.
- **No unverified claims**: Never claim data is "official", "verified", "gazetted", "exact", or "100% consistent". Use truthful phrasing ("tested against published dates", "listed for reference; confirm with official notices").
- **Originality**: All content and code must be original. Never copy from Hamro Patro or any competitor.
- **Feature indexing flags**: Every new feature route must have its own indexing flag defaulting to `false`, remaining out of `sitemap.xml` and returning `noindex, follow` until approved.
- **Workflow discipline**: Work in small steps. Ask before starting anything not explicitly requested.

## 3. Mandatory Validation Commands
Run and show the output after every change:
```bash
npx tsx --test tests/bsConverter.test.ts tests/seo.test.ts
npx tsc --noEmit
npm run build
```

## 4. Environment Variables & Flags
- `SITE_URL`: Canonical site origin (e.g. `http://localhost:3000` or production domain). Strips `www`, forces HTTPS in production.
- `NOINDEX_SITE`: Pre-launch site-wide kill switch (default `true`). Emits `noindex, nofollow` on all routes and blocks robots in `robots.txt`.
- `ADS_ENABLED`: Toggle for AdSense slots (default `false`). Requires `ADSENSE_CLIENT_ID` to render any ad box.
- `ADSENSE_CLIENT_ID`: Google AdSense client ID.
- `GOOGLE_SITE_VERIFICATION`: Optional Google Search Console HTML verification token (homepage only).
- Feature indexing flags (default `false`):
  - `CONVERTER_TOOLS_INDEXING_ENABLED`: Indexes `/bs-date-difference`, `/bs-age-calculator`, `/nepali-numbers`.
  - `RASHIFAL_INDEXING_ENABLED`: For upcoming `/rashifal` routes.
  - `PANCHANG_INDEXING_ENABLED`: For upcoming `/panchang` routes.
  - `FESTIVAL_INDEXING_ENABLED`: For upcoming `/festivals` routes.

## 5. Current Status & Key Decisions
- **Decisions Made**:
  - Supported BS converter range: 2000–2090 BS (1943–2034 AD). Anchor: 1 Baisakh 2000 BS = 14 April 1943 AD.
  - Timezone: Strictly `Asia/Kathmandu` (NPT, UTC+05:45) for all date calculations.
  - Astronomical defaults: Lahiri ayanamsa and Kathmandu sunrise (27.7172° N, 85.3240° E) as named constants with `astronomy-engine` (pinned at 2.1.19).
  - Disclaimer required: "For entertainment and reference only" on rashifal, panchang, and holiday listings.
- **Completed**:
  - Monthly calendar & year grids (2082–2083 BS indexed; 2084–2085 BS published but noindexed).
  - Core routes: `/`, `/aaja-ko-miti`, `/date-converter`, `/holidays/:year`.
  - Long-tail tools: `/bs-date-difference`, `/bs-age-calculator`, `/nepali-numbers`.
  - Printable monthly calendar: Print stylesheet and action button on month pages (no separate route).
  - SEO, JSON-LD, canonical redirects, Open Graph, sitemap, robots.txt, and `npm run check:launch`.
  - Policy pages: About, Contact, Privacy, Terms.
- **Pending**:
  - Vercel host adaptation (serverless functions and rewrites).
  - Holiday source checks against official Government of Nepal gazette (currently `source` fields are empty).
  - Replace placeholder email on Contact page.
  - Panchang reference dates from user for testing sunrise, sunset, tithi, and nakshatra.
  - Rashifal calculation verification and original reading text.
