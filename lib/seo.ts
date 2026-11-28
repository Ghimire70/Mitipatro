import {
  BS_MONTHS,
  CURRENT_BS_YEAR,
  INDEXABLE_BS_YEARS,
  PUBLISHED_BS_YEARS,
} from './bsData';
import {
  bsToAd,
  getBsMonthBySlug,
  getBsMonthGrid,
  getTodayNepal,
  getTotalDaysInBsYear,
  toDevanagariDigits,
} from './bsConverter';
import { getHolidaysForMonth, getHolidaysForYear } from './holidays';
import { getEventsForYear } from './eventService';
import { RASHIS, getRashiById } from './rashifal';

export interface FaqItem {
  question: string;
  answer: string;
  id?: string;
  intent?: string;
  category?: string;
  source?: string;
  bsYear?: number;
  bsMonth?: number;
  bsDay?: number;
  adIso?: string;
  generatedAt?: string;
  verified?: boolean;
}

export interface BreadcrumbItem {
  name: string;
  path: string;
}

export interface PageSeoData {
  title: string;
  description: string;
  canonicalPath: string;
  robots: 'index, follow' | 'noindex, follow' | 'noindex, nofollow';
  isNotFound?: boolean;
  h1: string;
  breadcrumbs: BreadcrumbItem[];
  faqs: FaqItem[];
  jsonLd: Record<string, unknown>[];
}

/** Maximum FAQPage JSON-LD entities per route (Google policy: keep it small). */
export const MAX_FAQS_PER_PAGE = 10;

export function selectTopFaqs(
  allFaqs: readonly FaqItem[],
  pathname: string,
  limit: number = MAX_FAQS_PER_PAGE,
): FaqItem[] {
  const clean = pathname === '/' ? '/' : pathname.replace(/\/+$/, '');
  const lower = clean.toLowerCase();

  const scored = allFaqs.map((faq) => {
    let score = 0;
    const pathTokens = lower.split(/[/\-]/);

    // Intent matches route section
    if (lower.includes('/holidays/') && faq.intent === 'holiday') score += 10;
    if (lower.includes('/calendar/') && faq.intent === 'month') score += 10;
    if (lower === '/aaja-ko-miti' && faq.intent === 'today') score += 10;
    if (lower === '/' && faq.intent === 'today') score += 8;
    if (lower.includes('/rashifal/') && faq.intent === 'rashifal') score += 10;
    if (lower.includes('/date-converter') && faq.intent === 'converter') score += 10;
    if (
      (lower.includes('/holidays/') || lower.includes('/festivals/')) &&
      faq.intent === 'tithi'
    )
      score += 6;

    // Keyword overlap between path and question
    for (const t of pathTokens) {
      if (t.length > 2 && faq.question.toLowerCase().includes(t)) score += 2;
    }

    // Source preference: deterministic > editorial > others
    const sourceRank: Record<string, number> = {
      deterministic: 5,
      editorial: 4,
      gsc: 3,
      autocomplete: 2,
      trends: 1,
    };
    score += sourceRank[faq.source ?? ''] ?? 0;

    return { faq, score };
  });

  scored.sort(
    (a, b) => b.score - a.score || a.faq.question.localeCompare(b.faq.question),
  );
  return scored.slice(0, limit).map((s) => s.faq);
}

export function buildJsonLd(
  baseUrl: string,
  breadcrumbs: BreadcrumbItem[],
  faqs: FaqItem[],
  extraSchemas: Record<string, unknown>[] = [],
): Record<string, unknown>[] {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const schemas: Record<string, unknown>[] = [];

  if (breadcrumbs.length > 0) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbs.map((b, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        name: b.name,
        item: `${cleanBase}${b.path}`,
      })),
    });
  }

  if (faqs.length > 0) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map((f) => ({
        '@type': 'Question',
        name: f.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: f.answer,
        },
      })),
    });
  }

  return [...schemas, ...extraSchemas];
}

function getRouteSeo(
  pathname: string,
  baseUrl: string,
  now: Date,
  converterToolsIndexingEnabled: boolean,
  panchangIndexingEnabled = false,
  rashifalIndexingEnabled = false,
  jyotishIndexingEnabled = false,
): PageSeoData {
  const cleanPath = pathname === '/' ? '/' : pathname.replace(/\/+$/, '');
  const today = getTodayNepal(now);

  // Rashifal and Panchang render the same 404 page as unknown routes
  // when their indexing flag is disabled.
  if ((cleanPath === '/rashifal' || cleanPath.startsWith('/rashifal/')) && !rashifalIndexingEnabled) {
    return {
      title: 'Page Not Found – Nepali Calendar | MitiPatro',
      description: 'The requested Nepali calendar page was not found. Browse 2082–2083 BS calendars, Aaja Ko Miti, or the BS to AD converter.',
      canonicalPath: cleanPath,
      robots: 'noindex, follow',
      isNotFound: true,
      h1: 'This calendar route is not published',
      breadcrumbs: [{ name: 'Home', path: '/' }],
      faqs: [],
      jsonLd: [],
    };
  }
  if (cleanPath === '/panchang' && !panchangIndexingEnabled) {
    return {
      title: 'Page Not Found – Nepali Calendar | MitiPatro',
      description: 'The requested Nepali calendar page was not found. Browse 2082–2083 BS calendars, Aaja Ko Miti, or the BS to AD converter.',
      canonicalPath: cleanPath,
      robots: 'noindex, follow',
      isNotFound: true,
      h1: 'This calendar route is not published',
      breadcrumbs: [{ name: 'Home', path: '/' }],
      faqs: [],
      jsonLd: [],
    };
  }
  if (cleanPath === '/kundali') {
    const breadcrumbs: BreadcrumbItem[] = [
      { name: 'Home', path: '/' },
      { name: 'Kundali', path: '/kundali' },
    ];
    const faqs: FaqItem[] = [
      {
        question: 'Kundali birth chart calculation uses which timezone?',
        answer: 'The Kundali page accepts an IANA timezone and defaults to Asia/Kathmandu. Birth-place coordinates affect the ascendant and chart calculation.',
      },
    ];
    return {
      title: 'Nepali Kundali & Birth Chart | MitiPatro',
      description: 'Create a Lahiri sidereal Kundali chart and explore deterministic placements with optional AI Jyotish guidance.',
      canonicalPath: '/kundali',
      robots: jyotishIndexingEnabled ? 'index, follow' : 'noindex, follow',
      h1: 'Nepali Kundali & Birth Chart',
      breadcrumbs,
      faqs,
      jsonLd: buildJsonLd(baseUrl, breadcrumbs, faqs),
    };
  }

  // 1. Home: /
  if (cleanPath === '/') {
    const grid = getBsMonthGrid(today.bs.year, today.bs.month);
    const holidays = getHolidaysForMonth(today.bs.year, today.bs.month);
    const publicCount = holidays.filter((h) => h.isPublicHoliday).length;
    const title = `Nepali Calendar ${today.bs.year} BS – ${today.bs.monthNameEn} ${today.bs.year} & Today's Date | MitiPatro`;
    const description = `Today's Nepali date is ${today.bs.formattedEn} (${today.ad.formattedEn}). Browse the ${today.bs.monthNameEn} ${today.bs.year} BS monthly grid, public holidays, and BS to AD converter.`;
    const breadcrumbs: BreadcrumbItem[] = [{ name: 'Home', path: '/' }];
    const faqs: FaqItem[] = [
      {
        question: 'What is today’s Nepali date (Aaja Ko Miti)?',
        answer: `Today in Nepal (Asia/Kathmandu, UTC+05:45) is ${today.bs.formattedEn} (${today.bs.formattedNe}), which corresponds to ${today.ad.formattedEn} (${today.weekday.en} / ${today.weekday.ne}).`,
      },
      {
        question: `How many days are in ${today.bs.monthNameEn} ${today.bs.year} BS?`,
        answer: `${today.bs.monthNameEn} ${today.bs.year} BS has ${grid.totalDays} days, spanning ${grid.adStartIso} to ${grid.adEndIso} in the Gregorian calendar.`,
      },
      {
        question: `How many public holidays are in ${today.bs.monthNameEn} ${today.bs.year} BS?`,
        answer: `Our records mark ${publicCount} days as public holidays in ${today.bs.monthNameEn} ${today.bs.year} BS. Saturday is commonly observed as the weekly rest day.`,
      },
    ];
    return {
      title,
      description,
      canonicalPath: '/',
      robots: 'index, follow',
      h1: `Nepali Calendar ${today.bs.year} BS (${today.bs.monthNameEn})`,
      breadcrumbs,
      faqs,
      jsonLd: buildJsonLd(baseUrl, breadcrumbs, faqs, [
        {
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'MitiPatro',
          url: baseUrl,
        },
      ]),
    };
  }

  // 2. Aaja Ko Miti: /aaja-ko-miti
  if (cleanPath === '/aaja-ko-miti') {
    const title = `Aaja Ko Miti (${today.bs.formattedEn}) – Today's Nepali Date in BS & AD | MitiPatro`;
    const description = `Aaja ko miti in Nepal time: ${today.bs.formattedEn} (${today.bs.formattedNe}), ${today.weekday.en} (${today.weekday.ne}), corresponding to ${today.ad.formattedEn}.`;
    const breadcrumbs: BreadcrumbItem[] = [
      { name: 'Home', path: '/' },
      { name: 'Aaja Ko Miti', path: '/aaja-ko-miti' },
    ];
    const faqs: FaqItem[] = [
      {
        question: 'What is Aaja Ko Miti in Nepali script and English?',
        answer: `Today's date in Nepal is ${today.bs.formattedNe} (${today.weekday.ne}) in Devanagari script, and ${today.bs.formattedEn} (${today.weekday.en}) in English.`,
      },
      {
        question: 'Which timezone is used to calculate today’s Nepali date?',
        answer: 'All today-date calculations strictly use Asia/Kathmandu (Nepal Standard Time, UTC+05:45), regardless of where in the world you open the page.',
      },
      {
        question: 'What is the Gregorian (AD) equivalent for today’s Nepali date?',
        answer: `${today.bs.formattedEn} corresponds to ${today.ad.formattedEn} (${today.ad.iso}).`,
      },
    ];
    return {
      title,
      description,
      canonicalPath: '/aaja-ko-miti',
      robots: 'index, follow',
      h1: `Aaja Ko Miti — ${today.bs.formattedEn}`,
      breadcrumbs,
      faqs,
      jsonLd: buildJsonLd(baseUrl, breadcrumbs, faqs),
    };
  }

  // 3. Date Converter: /date-converter
  if (cleanPath === '/date-converter') {
    const title = `BS to AD & AD to BS Date Converter (2000–2090 BS) | MitiPatro`;
    const description = `Convert Bikram Sambat (BS) and Gregorian (AD) dates using the stored month-length table. The supported BS range is 2000-2090 BS.`;
    const breadcrumbs: BreadcrumbItem[] = [
      { name: 'Home', path: '/' },
      { name: 'Date Converter', path: '/date-converter' },
    ];
    const faqs: FaqItem[] = [
      {
        question: 'How does the BS to AD date converter work?',
        answer: 'The converter uses a stored table of Bikram Sambat month lengths and counts days from its anchor: 1 Baisakh 2000 BS = 14 April 1943 AD.',
      },
      {
        question: 'Which years are supported by this Bikram Sambat converter?',
        answer: 'The supported range is 2000-2090 BS (April 14, 1943 AD to April 13, 2034 AD). Tests cover selected published date pairs and date-conversion round trips.',
      },
      {
        question: 'Why does Nepali New Year (1 Baisakh) fall on April 13 or 14?',
        answer: 'The stored Bikram Sambat month lengths map 1 Baisakh to dates around April 13 or 14 in the Gregorian calendar.',
      },
    ];
    return {
      title,
      description,
      canonicalPath: '/date-converter',
      robots: 'index, follow',
      h1: 'BS to AD & AD to BS Date Converter',
      breadcrumbs,
      faqs,
      jsonLd: buildJsonLd(baseUrl, breadcrumbs, faqs, [
        {
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: 'MitiPatro BS to AD Date Converter',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'All',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        },
      ]),
    };
  }

  const converterToolPages: Record<string, {
    title: string;
    description: string;
    h1: string;
    name: string;
    faqs: FaqItem[];
  }> = {
    '/bs-date-difference': {
      title: 'BS Date Difference Calculator (2000–2090 BS) | MitiPatro',
      description: 'Find the elapsed number of days between two Bikram Sambat dates in the supported 2000–2090 BS range.',
      h1: 'BS Date Difference Calculator',
      name: 'MitiPatro BS Date Difference Calculator',
      faqs: [
        {
          question: 'How does the BS date difference calculator count days?',
          answer: 'It converts both selected BS dates with the site’s existing date converter and reports elapsed days. The starting date is not counted as an elapsed day.',
        },
        {
          question: 'Which Bikram Sambat years can I compare?',
          answer: 'This tool accepts dates in the supported range, 2000–2090 BS. Dates outside that range are not processed.',
        },
      ],
    },
    '/bs-age-calculator': {
      title: 'BS Age Calculator – Calculate Age in Bikram Sambat | MitiPatro',
      description: 'Calculate completed years, months, and days between two Bikram Sambat dates in the supported 2000–2090 BS range.',
      h1: 'BS Age Calculator',
      name: 'MitiPatro BS Age Calculator',
      faqs: [
        {
          question: 'How is age shown in the BS age calculator?',
          answer: 'The result uses completed Bikram Sambat years, months, and days. If a month has no matching anniversary day, its last day is used for that month anniversary.',
        },
        {
          question: 'What date range does the BS age calculator accept?',
          answer: 'Both dates must be in the supported range, 2000–2090 BS, and the birth date cannot be after the as-of date.',
        },
      ],
    },
    '/nepali-numbers': {
      title: 'Nepali Number Converter – Devanagari Digits and Words | MitiPatro',
      description: 'Convert whole numbers between Arabic and Devanagari digits and display a Nepali word form, from 0 to 999,999,999.',
      h1: 'Nepali Digit and Number-to-Words Converter',
      name: 'MitiPatro Nepali Number Converter',
      faqs: [
        {
          question: 'Can I enter either Arabic or Devanagari digits?',
          answer: 'Yes. Enter a whole number using either digit set; the tool displays both digit forms and a Nepali word form.',
        },
        {
          question: 'What number range is supported?',
          answer: 'The tool accepts whole numbers from 0 to 999,999,999. Decimal and negative values are not accepted.',
        },
      ],
    },
  };
  const converterTool = converterToolPages[cleanPath];
  if (converterTool) {
    const breadcrumbs: BreadcrumbItem[] = [
      { name: 'Home', path: '/' },
      { name: converterTool.h1, path: cleanPath },
    ];
    return {
      title: converterTool.title,
      description: converterTool.description,
      canonicalPath: cleanPath,
      robots: converterToolsIndexingEnabled ? 'index, follow' : 'noindex, follow',
      h1: converterTool.h1,
      breadcrumbs,
      faqs: converterTool.faqs,
      jsonLd: buildJsonLd(baseUrl, breadcrumbs, converterTool.faqs, [
        {
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: converterTool.name,
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'All',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        },
      ]),
    };
  }

  // 4. Month page: /calendar/:year/:month
  const monthMatch = /^\/calendar\/(\d{4})\/([a-z-]+)$/i.exec(cleanPath);
  if (monthMatch) {
    const year = Number(monthMatch[1]);
    const monthMeta = getBsMonthBySlug(monthMatch[2]);
    if (monthMeta && (PUBLISHED_BS_YEARS as readonly number[]).includes(year)) {
      const isIndexable = (INDEXABLE_BS_YEARS as readonly number[]).includes(year);
      const grid = getBsMonthGrid(year, monthMeta.index);
      const holidays = getHolidaysForMonth(year, monthMeta.index);
      const firstAd = bsToAd(year, monthMeta.index, 1);
      const lastAd = bsToAd(year, monthMeta.index, grid.totalDays);
      const holidayNames = holidays.slice(0, 4).map((h) => h.nameEn).join(', ');
      const title = `${monthMeta.en} ${year} Nepali Calendar (${grid.adSpanLabel}) | MitiPatro`;
      const description = `${monthMeta.en} ${year} BS (${monthMeta.ne} ${toDevanagariDigits(year)}) has ${grid.totalDays} days from ${firstAd.formattedEn} to ${lastAd.formattedEn}. View AD dates, Saturdays, and public holidays.`;
      const breadcrumbs: BreadcrumbItem[] = [
        { name: 'Home', path: '/' },
        { name: `Calendar ${year}`, path: `/calendar/${year}` },
        { name: `${monthMeta.en} ${year}`, path: `/calendar/${year}/${monthMeta.slug}` },
      ];
      const faqs: FaqItem[] = [
        {
          question: `How many days are in ${monthMeta.en} ${year} BS?`,
          answer: `${monthMeta.en} ${year} BS has ${grid.totalDays} days, beginning on ${firstAd.weekdayEn}, ${firstAd.formattedEn} and ending on ${lastAd.weekdayEn}, ${lastAd.formattedEn}.`,
        },
        {
          question: `What English (AD) dates fall in ${monthMeta.en} ${year} BS?`,
          answer: `${monthMeta.en} 1, ${year} BS corresponds to ${firstAd.formattedEn}, and ${monthMeta.en} ${grid.totalDays}, ${year} BS corresponds to ${lastAd.formattedEn}.`,
        },
        {
          question: `Which festivals or holidays occur in ${monthMeta.en} ${year} BS?`,
          answer: holidays.length > 0
            ? `Notable observances in ${monthMeta.en} ${year} BS include ${holidayNames}.`
            : `No holiday entries are listed for ${monthMeta.en} ${year} BS. Saturday is commonly observed as the weekly rest day.`,
        },
      ];
      return {
        title,
        description,
          canonicalPath: `/calendar/${year}/${monthMeta.slug}`,
          robots: isIndexable ? 'index, follow' : 'noindex, follow',
          h1: `${monthMeta.en} ${year} Nepali Calendar`,
          breadcrumbs,
          faqs,
          jsonLd: buildJsonLd(baseUrl, breadcrumbs, faqs),
        };
    }
  }

  // 5. Year page: /calendar/:year
  const yearMatch = /^\/calendar\/(\d{4})$/.exec(cleanPath);
  if (yearMatch) {
    const year = Number(yearMatch[1]);
    if ((PUBLISHED_BS_YEARS as readonly number[]).includes(year)) {
      const isIndexable = (INDEXABLE_BS_YEARS as readonly number[]).includes(year);
      const startAd = bsToAd(year, 1, 1);
      const endMonthDays = getBsMonthGrid(year, 12).totalDays;
      const endAd = bsToAd(year, 12, endMonthDays);
      const totalDays = getTotalDaysInBsYear(year);
      const holidays = getHolidaysForYear(year);
      const publicCount = holidays.filter((h) => h.isPublicHoliday).length;
      const title = `Nepali Calendar ${year} BS (${startAd.year}–${endAd.year} AD) – All 12 Months | MitiPatro`;
      const description = `Complete ${year} BS Nepali calendar overview (${startAd.formattedEn} to ${endAd.formattedEn}). Inspect all 12 months from Baisakh to Chaitra, month day counts, and ${publicCount} listed holidays.`;
      const breadcrumbs: BreadcrumbItem[] = [
        { name: 'Home', path: '/' },
        { name: `Nepali Calendar ${year}`, path: `/calendar/${year}` },
      ];
      const faqs: FaqItem[] = [
        {
          question: `When does Nepali Year ${year} BS start and end in AD?`,
          answer: `Baisakh 1, ${year} BS starts on ${startAd.weekdayEn}, ${startAd.formattedEn}, and Chaitra ${endMonthDays}, ${year} BS ends on ${endAd.weekdayEn}, ${endAd.formattedEn} (${totalDays} total days).`,
        },
        {
          question: `How many days are in Bikram Sambat ${year}?`,
          answer: `The Bikram Sambat year ${year} BS has ${totalDays} days across 12 solar months from Baisakh to Chaitra.`,
        },
        {
          question: `Where can I see public holidays for ${year} BS?`,
          answer: `Visit our Holidays and Observances ${year} BS page for the entries currently listed, with their English and Nepali names.`,
        },
      ];
      return {
        title,
        description,
        canonicalPath: `/calendar/${year}`,
        robots: isIndexable ? 'index, follow' : 'noindex, follow',
        h1: `Nepali Calendar ${year} BS Overview`,
        breadcrumbs,
        faqs,
        jsonLd: buildJsonLd(baseUrl, breadcrumbs, faqs),
      };
    }
  }

  // 6. Holidays page: /holidays/:year
  const holMatch = /^\/holidays\/(\d{4})$/.exec(cleanPath);
  if (holMatch) {
    const year = Number(holMatch[1]);
    if ((PUBLISHED_BS_YEARS as readonly number[]).includes(year)) {
      const isIndexable = (INDEXABLE_BS_YEARS as readonly number[]).includes(year);
      const holidays = getHolidaysForYear(year);
      const publicCount = holidays.filter((h) => h.isPublicHoliday).length;
      const title = `Nepal Holidays and Observances ${year} BS | MitiPatro`;
      const description = `Holiday and observance entries for ${year} BS, with BS dates, Gregorian equivalents, and Nepali names. Listed dates are for reference.`;
      const breadcrumbs: BreadcrumbItem[] = [
        { name: 'Home', path: '/' },
        { name: `Public Holidays ${year}`, path: `/holidays/${year}` },
      ];
      const faqs: FaqItem[] = [
        {
          question: `How many public holidays are listed for ${year} BS in Nepal?`,
          answer: `MitiPatro currently has ${publicCount} entries marked as public holidays for ${year} BS, excluding weekly Saturday observances.`,
        },
        {
          question: `Are Saturdays public holidays in Nepal?`,
          answer: 'Saturday (Shanibar) is commonly observed as the weekly rest day.',
        },
        {
          question: `Where should I confirm Nepal holiday dates?`,
          answer: 'Holiday dates on MitiPatro are for reference. Please confirm them with the relevant Government of Nepal official notice.',
        },
      ];
      return {
        title,
        description,
        canonicalPath: `/holidays/${year}`,
        robots: isIndexable ? 'index, follow' : 'noindex, follow',
        h1: `Holidays and Observances in Nepal – ${year} BS`,
        breadcrumbs,
        faqs,
        jsonLd: buildJsonLd(baseUrl, breadcrumbs, faqs),
      };
    }
  }

  // 7. FAQ hub: /faq (new pages default off — noindex, out of sitemap)
  if (cleanPath === '/faq') {
    return {
      title: 'Frequently Asked Questions – Nepali Calendar | MitiPatro',
      description: 'Verified answers about the Nepali (Bikram Sambat) calendar, dates, festivals, holidays, tithis, and rashifal — computed directly from MitiPatro&rsquo;s calendar engine.',
      canonicalPath: '/faq',
      robots: 'noindex, follow',
      isNotFound: false,
      h1: 'Frequently Asked Questions',
      breadcrumbs: [{ name: 'Home', path: '/' }, { name: 'FAQ', path: '/faq' }],
      faqs: [],
      jsonLd: buildJsonLd(baseUrl, [{ name: 'Home', path: '/' }, { name: 'FAQ', path: '/faq' }], []),
    };
  }

  // 7. Static compliance pages
  const staticMap: Record<string, { title: string; desc: string; h1: string }> = {
    '/about': {
      title: 'About MitiPatro – Bikram Sambat Calendar Method',
      desc: 'See how MitiPatro maps Bikram Sambat dates, describes its calendar data, and handles date and holiday corrections.',
      h1: 'About MitiPatro',
    },
    '/contact': {
      title: 'Contact MitiPatro – Report a Date or Holiday Issue',
      desc: 'Report a BS-to-AD conversion discrepancy, holiday listing correction, regional observance, or accessibility issue by email.',
      h1: 'Contact Us',
    },
    '/privacy': {
      title: 'Privacy Policy – MitiPatro',
      desc: 'How MitiPatro handles browser-side date conversions, hosting logs, contact email, and cookies if advertising is enabled.',
      h1: 'Privacy Policy',
    },
    '/terms': {
      title: 'Terms of Use – MitiPatro',
      desc: 'Terms for using MitiPatro calendar, BS-to-AD conversion, and holiday listings as general information.',
      h1: 'Terms of Use',
    },
  };

  if (staticMap[cleanPath]) {
    const info = staticMap[cleanPath];
    const breadcrumbs: BreadcrumbItem[] = [
      { name: 'Home', path: '/' },
      { name: info.h1, path: cleanPath },
    ];
    return {
      title: info.title,
      description: info.desc,
      canonicalPath: cleanPath,
      robots: 'index, follow',
      h1: info.h1,
      breadcrumbs,
      faqs: [],
      jsonLd: buildJsonLd(baseUrl, breadcrumbs, []),
    };
  }

  // Panchang page: /panchang
  if (cleanPath === '/panchang') {
    const title = 'नेपाली पात्रो – दैनिक पञ्चाङ्ग (Daily Nepali Panchang) | MitiPatro';
    const description = `दैनिक पञ्चाङ्ग: वाग्मती प्रदेश, काठमाडौं (Asia/Kathmandu, UTC+05:45) को सूर्योदय समयानुसार तिथि, नक्षत्र, योग र करण। नेपालको स्थानीय पात्रोसँग मिलाउनु अघि कम्प्युट गरिएको परिणामको रूपमा प्रयोग गर्नुहोला।`;
    const breadcrumbs: BreadcrumbItem[] = [
      { name: 'Home', path: '/' },
      { name: 'Panchang', path: '/panchang' },
    ];
    const faqs: FaqItem[] = [
      {
        question: 'दैनिक पञ्चाङ्ग के हो?',
        answer: 'पञ्चाङ्ग नेपाली पात्रोको एक दैनिक खगोलशास्त्रीय विवरण हो, जसमा तिथि, नक्षत्र, योग र करण समावेश हुन्छन्।',
      },
      {
        question: 'यस पृष्ठको पञ्चाङ्ग कुन समय र स्थानको आधारमा गणना गरिएको छ?',
        answer: 'यस पृष्ठको सूर्योदय, सूर्यास्त, तिथि, नक्षत्र, योग र करण काठमाडौं (२७.७१७२° उत्तर, ८५.३२४०° पूर्व) को Asia/Kathmandu (UTC+०५:४५) समयका आधारमा गणना गरिएको छ।',
      },
      {
        question: 'के यो आधिकारिक नेपाली पात्रो हो?',
        answer: 'होइन, यो कम्प्युट गर्ने परिणाम हो। धार्मिक वा उत्सवको मिति निश्चित गर्नु अघि कृपया स्थानीय पात्रो वा अधिकारिक स्रोतसँग पुष्टि गर्नुहोला।',
      },
    ];
    return {
      title,
      description,
      canonicalPath: '/panchang',
      robots: panchangIndexingEnabled ? 'index, follow' : 'noindex, follow',
      h1: 'नेपाली पात्रो – दैनिक पञ्चाङ्ग (Daily Panchang)',
      breadcrumbs,
      faqs,
      jsonLd: buildJsonLd(baseUrl, breadcrumbs, faqs),
    };
  }

  // Festivals page: /festivals/:year
  const festMatch = /^\/festivals\/(\d{4})$/.exec(cleanPath);
  if (festMatch) {
    const year = Number(festMatch[1]);
    if ((PUBLISHED_BS_YEARS as readonly number[]).includes(year)) {
      const isIndexable = (INDEXABLE_BS_YEARS as readonly number[]).includes(year);
      const events = getEventsForYear(year);
      const publicCount = events.filter((e) => e.isPublicHoliday).length;
      const title = `Festivals & Events ${year} BS – Nepali Festival Calendar | MitiPatro`;
      const description = `Complete festival and observance calendar for ${year} BS, with religious festivals, public holidays, cultural events, and international observances.`;
      const breadcrumbs: BreadcrumbItem[] = [
        { name: 'Home', path: '/' },
        { name: `Festivals & Events ${year}`, path: `/festivals/${year}` },
      ];
      const faqs: FaqItem[] = [
        {
          question: `How many festivals and events are listed for ${year} BS?`,
          answer: `MitiPatro currently lists ${events.length} festival and observance entries for ${year} BS, including ${publicCount} public holidays.`,
        },
        {
          question: `Are festival dates on MitiPatro official?`,
          answer: 'Festival dates are sourced from government notices, Panchanga calculations, and international observance calendars. Each entry shows its source and verification status.',
        },
      ];
      return {
        title,
        description,
        canonicalPath: `/festivals/${year}`,
        robots: isIndexable ? 'index, follow' : 'noindex, follow',
        h1: `Festivals & Events in Nepal – ${year} BS`,
        breadcrumbs,
        faqs,
        jsonLd: buildJsonLd(baseUrl, breadcrumbs, faqs),
      };
    }
  }

  // 8. Daily Rashifal (Horoscope): /rashifal or /rashifal/daily
  if (cleanPath === '/rashifal' || cleanPath === '/rashifal/daily') {
    const title = `आजको राशिफल – दैनिक राशिफल (Daily Nepali Rashifal) | MitiPatro`;
    const description = `आजको दैनिक राशिफल (${today.bs.formattedEn} / ${today.bs.formattedNe}): मेष, वृष, मिथुन, कर्कट, सिंह, कन्या, तुला, वृश्चिक, धनु, मकर, कुम्भ र मीन १२ राशिको भाग्य, करिअर र स्वास्थ्य फल।`;
    const breadcrumbs: BreadcrumbItem[] = [
      { name: 'Home', path: '/' },
      { name: 'Rashifal', path: '/rashifal' },
    ];
    const faqs: FaqItem[] = [
      {
        question: 'आजको राशिफल कुन समयमा अद्यावधिक हुन्छ?',
        answer: 'मितिपत्रोमा दैनिक राशिफल नेपालको स्थानीय समय (Asia/Kathmandu, UTC+05:45) अनुसार मध्यरात १२:०० बजे नयाँ मिति र तिथिसँगै नियमित अद्यावधिक हुन्छ।',
      },
      {
        question: 'नेपाली १२ राशीहरू कुन-कुन हुन्?',
        answer: 'वैदिक ज्योतिष परम्परा अनुसार १२ राशीहरू मेष, वृष, मिथुन, कर्कट, सिंह, कन्या, तुला, वृश्चिक, धनु, मकर, कुम्भ र मीन हुन्।',
      },
      {
        question: 'के मितिपत्रोको राशिफल आधिकारिक वैदिक ज्योतिष सिद्धान्तमा आधारित छ?',
        answer: 'हो, हाम्रो राशिफल वैदिक ज्योतिष परम्परा र ग्रहगोचरको शास्त्रीय विश्लेषणमा आधारित छ। कुनै पनि काल्पनिक वा कृत्रिम फल सिर्जना नगरी विश्वसनीय ज्योतिषीय विवरण प्रस्तुत गरिन्छ।',
      },
    ];
    return {
      title,
      description,
      canonicalPath: '/rashifal',
      robots: 'index, follow',
      h1: 'आजको दैनिक राशिफल (Daily Rashifal)',
      breadcrumbs,
      faqs,
      jsonLd: buildJsonLd(baseUrl, breadcrumbs, faqs),
    };
  }

  // 9. Weekly Rashifal: /rashifal/weekly
  if (cleanPath === '/rashifal/weekly') {
    const title = `साप्ताहिक राशिफल – यस हप्ताको राशिफल (Weekly Nepali Rashifal) | MitiPatro`;
    const description = `यस हप्ताको साप्ताहिक राशिफल: मेष देखि मीन सम्मका १२ राशिको साताभरिको ग्रहगोचर, व्यापार, करिअर, प्रेम र स्वास्थ्य फलादेश।`;
    const breadcrumbs: BreadcrumbItem[] = [
      { name: 'Home', path: '/' },
      { name: 'Rashifal', path: '/rashifal' },
      { name: 'Weekly Rashifal', path: '/rashifal/weekly' },
    ];
    const faqs: FaqItem[] = [
      {
        question: 'साप्ताहिक राशिफलले कुन समयावधि समेट्छ?',
        answer: 'साप्ताहिक राशिफलले आइतबारदेखि शनिबारसम्मको सात दिनको ग्रहगोचर र नक्षत्र प्रभावलाई समेटेर फलादेश प्रस्तुत गर्दछ।',
      },
      {
        question: 'साप्ताहिक राशिफल कुन दिन अद्यावधिक हुन्छ?',
        answer: 'साप्ताहिक राशिफल प्रत्येक हप्ताको सुरुमै नेपाली पात्रोको नयाँ साताअनुसार अद्यावधिक गरिन्छ।',
      },
      {
        question: 'साप्ताहिक राशिफलमा कुन-कुन विषय समावेश हुन्छन्?',
        answer: 'साताभरिको समग्र भाग्य, कार्यक्षेत्र, आर्थिक कारोबार, पारिवारिक तथा प्रेम सम्बन्ध, स्वास्थ्य, र साताको शुभ रङ्ग तथा अङ्क समावेश हुन्छन्।',
      },
    ];
    return {
      title,
      description,
      canonicalPath: '/rashifal/weekly',
      robots: 'index, follow',
      h1: 'यस हप्ताको साप्ताहिक राशिफल (Weekly Rashifal)',
      breadcrumbs,
      faqs,
      jsonLd: buildJsonLd(baseUrl, breadcrumbs, faqs),
    };
  }

  // 10. Monthly Rashifal: /rashifal/monthly
  if (cleanPath === '/rashifal/monthly') {
    const title = `मासिक राशिफल – यस महिनाको राशिफल (Monthly Nepali Rashifal) | MitiPatro`;
    const description = `यस महिनाको मासिक राशिफल (${today.bs.monthNameNe} ${toDevanagariDigits(today.bs.year)}): १२ वटै राशिको महिनाभरिको ग्रहगोचर, आर्थिक अवस्था, करिअर र स्वास्थ्य भविष्यवाणी।`;
    const breadcrumbs: BreadcrumbItem[] = [
      { name: 'Home', path: '/' },
      { name: 'Rashifal', path: '/rashifal' },
      { name: 'Monthly Rashifal', path: '/rashifal/monthly' },
    ];
    const faqs: FaqItem[] = [
      {
        question: 'मासिक राशिफल कुन महिनाअनुसार तयार पारिन्छ?',
        answer: 'मासिक राशिफल बिक्रम संवत् (BS) का सौर्य महिनाहरू (वैशाखदेखि चैतसम्म) को अवधि र संक्रान्ति कालीन ग्रहगोचर अनुसार तयार पारिन्छ।',
      },
      {
        question: 'मासिक राशिफलमा दीर्घकालीन लगानी र योजनाका फल पाइन्छन्?',
        answer: 'हो, मासिक राशिफलमा महिनाभरिका प्रमुख ग्रह परिवर्तन, दीर्घकालीन लगानी, व्यापारिक विस्तार, पारिवारिक उन्नति र स्वास्थ्य सतर्कताका फलहरू प्रस्तुत गरिन्छ।',
      },
    ];
    return {
      title,
      description,
      canonicalPath: '/rashifal/monthly',
      robots: 'index, follow',
      h1: `${today.bs.monthNameNe} महिनाको मासिक राशिफल (Monthly Rashifal)`,
      breadcrumbs,
      faqs,
      jsonLd: buildJsonLd(baseUrl, breadcrumbs, faqs),
    };
  }

  // 11. Individual Rashi Page with explicit period: /rashifal/(daily|weekly|monthly)/:rashi
  const periodRashiMatch = /^\/rashifal\/(daily|weekly|monthly)\/([a-z]+)$/i.exec(cleanPath);
  if (periodRashiMatch) {
    const period = periodRashiMatch[1].toLowerCase() as 'daily' | 'weekly' | 'monthly';
    const rashiMeta = getRashiById(periodRashiMatch[2]);
    if (rashiMeta) {
      if (period === 'daily') {
        const title = `${rashiMeta.nameNe} राशिफल – आजको ${rashiMeta.nameNe} दैनिक राशिफल (${rashiMeta.englishSign}) | MitiPatro`;
        const description = `आजको ${rashiMeta.nameNe} राशि दैनिक राशिफल (${rashiMeta.nameEn} / ${rashiMeta.englishSign}): दैनिक भाग्य, करिअर, आर्थिक, प्रेम तथा स्वास्थ्य फल।`;
        const breadcrumbs: BreadcrumbItem[] = [
          { name: 'Home', path: '/' },
          { name: 'Rashifal', path: '/rashifal' },
          { name: `${rashiMeta.nameNe} (${rashiMeta.englishSign})`, path: `/rashifal/${rashiMeta.id}` },
        ];
        return {
          title,
          description,
          canonicalPath: `/rashifal/${rashiMeta.id}`,
          robots: 'index, follow',
          h1: `${rashiMeta.nameNe} दैनिक राशिफल (${rashiMeta.englishSign})`,
          breadcrumbs,
          faqs: [],
          jsonLd: buildJsonLd(baseUrl, breadcrumbs, []),
        };
      }

      if (period === 'weekly') {
        const title = `${rashiMeta.nameNe} साप्ताहिक राशिफल (${rashiMeta.englishSign} Weekly Rashifal) | MitiPatro`;
        const description = `यस हप्ताको ${rashiMeta.nameNe} साप्ताहिक राशिफल (${rashiMeta.nameEn} / ${rashiMeta.englishSign}): साताभरिको ग्रहगोचर, करिअर, आर्थिक, प्रेम तथा स्वास्थ्य फलादेश।`;
        const breadcrumbs: BreadcrumbItem[] = [
          { name: 'Home', path: '/' },
          { name: 'Rashifal', path: '/rashifal' },
          { name: 'Weekly Rashifal', path: '/rashifal/weekly' },
          { name: `${rashiMeta.nameNe} (${rashiMeta.englishSign})`, path: `/rashifal/weekly/${rashiMeta.id}` },
        ];
        return {
          title,
          description,
          canonicalPath: `/rashifal/weekly/${rashiMeta.id}`,
          robots: 'index, follow',
          h1: `${rashiMeta.nameNe} साप्ताहिक राशिफल (${rashiMeta.englishSign})`,
          breadcrumbs,
          faqs: [],
          jsonLd: buildJsonLd(baseUrl, breadcrumbs, []),
        };
      }

      // monthly
      const title = `${rashiMeta.nameNe} मासिक राशिफल (${rashiMeta.englishSign} Monthly Rashifal) | MitiPatro`;
      const description = `यस महिनाको ${rashiMeta.nameNe} मासिक राशिफल (${rashiMeta.nameEn} / ${rashiMeta.englishSign}): महिनाभरिको ग्रहगोचर, करिअर, आर्थिक, पारिवारिक सम्बन्ध र स्वास्थ्य भविष्यवाणी।`;
      const breadcrumbs: BreadcrumbItem[] = [
        { name: 'Home', path: '/' },
        { name: 'Rashifal', path: '/rashifal' },
        { name: 'Monthly Rashifal', path: '/rashifal/monthly' },
        { name: `${rashiMeta.nameNe} (${rashiMeta.englishSign})`, path: `/rashifal/monthly/${rashiMeta.id}` },
      ];
      return {
        title,
        description,
        canonicalPath: `/rashifal/monthly/${rashiMeta.id}`,
        robots: 'index, follow',
        h1: `${rashiMeta.nameNe} मासिक राशिफल (${rashiMeta.englishSign})`,
        breadcrumbs,
        faqs: [],
        jsonLd: buildJsonLd(baseUrl, breadcrumbs, []),
      };
    }
  }

  // 12. Individual Rashi Page (Default Daily): /rashifal/:rashi
  const rashiMatch = /^\/rashifal\/([a-z]+)$/i.exec(cleanPath);
  if (rashiMatch) {
    const rashiMeta = getRashiById(rashiMatch[1]);
    if (rashiMeta) {
      const title = `${rashiMeta.nameNe} राशिफल – आजको ${rashiMeta.nameNe} दैनिक राशिफल (${rashiMeta.englishSign}) | MitiPatro`;
      const description = `आजको ${rashiMeta.nameNe} राशि दैनिक राशिफल (${rashiMeta.nameEn} / ${rashiMeta.englishSign}): दैनिक भाग्य, करिअर, आर्थिक, प्रेम तथा स्वास्थ्य फल। स्वामी ग्रह: ${rashiMeta.rulingPlanetNe}, तत्व: ${rashiMeta.elementNe}।`;
      const breadcrumbs: BreadcrumbItem[] = [
        { name: 'Home', path: '/' },
        { name: 'Rashifal', path: '/rashifal' },
        { name: `${rashiMeta.nameNe} (${rashiMeta.englishSign})`, path: `/rashifal/${rashiMeta.id}` },
      ];
      const faqs: FaqItem[] = [
        {
          question: `${rashiMeta.nameNe} राशिको स्वामी ग्रह र तत्व के हो?`,
          answer: `${rashiMeta.nameNe} (${rashiMeta.englishSign}) राशिको स्वामी ग्रह ${rashiMeta.rulingPlanetNe} र तत्व ${rashiMeta.elementNe} हो। यसको प्रतीक ${rashiMeta.symbolNe} हो।`,
        },
        {
          question: `${rashiMeta.nameNe} राशिका वैदिक नामाक्षरहरू कुन-कुन हुन्?`,
          answer: `वैदिक ज्योतिष शास्त्र अनुसार ${rashiMeta.nameNe} राशिका नामाक्षरहरू "${rashiMeta.lettersNe}" हुन्।`,
        },
        {
          question: `आजको ${rashiMeta.nameNe} राशिफलमा कुन-कुन क्षेत्रको भविष्यवाणी पाइन्छ?`,
          answer: `आजको ${rashiMeta.nameNe} राशिफलमा समग्र दिनको फलका साथै करिअर, आर्थिक अवस्था, पारिवारिक सम्बन्ध, स्वास्थ्य, शुभ रङ्ग र शुभ अङ्क समावेश गरिन्छ।`,
        },
      ];
      return {
        title,
        description,
        canonicalPath: `/rashifal/${rashiMeta.id}`,
        robots: 'index, follow',
        h1: `${rashiMeta.nameNe} राशिफल (${rashiMeta.englishSign} Rashifal)`,
        breadcrumbs,
        faqs,
        jsonLd: buildJsonLd(baseUrl, breadcrumbs, faqs),
      };
    }
  }

  // Print Nepali Calendar page: /print-nepali-calendar
  if (cleanPath === '/print-nepali-calendar') {
    const today = getTodayNepal(now);
    const currentYear = today.bs.year;
    const title = `Print Nepali Calendar ${currentYear} BS – Free Printable Monthly Calendars | MitiPatro`;
    const description = `Print free Nepali calendar ${currentYear} BS (${currentYear + 57}–${currentYear + 58} AD) with all 12 months. Each printable page shows Bikram Sambat dates, Gregorian equivalents, Saturdays, and public holidays. Optimized for A4 printing.`;
    const breadcrumbs: BreadcrumbItem[] = [
      { name: 'Home', path: '/' },
      { name: 'Print Nepali Calendar', path: '/print-nepali-calendar' },
    ];
    const faqs: FaqItem[] = [
      {
        question: 'How do I print a Nepali calendar from this page?',
        answer: 'Click the "Print Calendar" button for any month, or use your browser\'s print function (Ctrl+P / Cmd+P). The pages are optimized for A4 paper with clean layouts showing BS dates, AD equivalents, and holidays.',
      },
      {
        question: 'Which Nepali calendar years are available for printing?',
        answer: `Currently ${currentYear} BS and ${currentYear - 1} BS monthly calendars are available. Each month can be printed individually or you can print the full year overview.`,
      },
      {
        question: 'Do the printable calendars include public holidays?',
        answer: 'Yes, each monthly calendar marks public holidays and Saturdays. Holiday names appear in both English and Nepali. Verify official holiday dates with Government of Nepal notices.',
      },
      {
        question: 'Can I print the calendar in Nepali (Devanagari) script?',
        answer: 'Yes, the calendars display month names, day names, and holiday names in both English and Devanagari (Nepali) script. Numbers can be shown in Arabic or Devanagari digits.',
      },
    ];
    return {
      title,
      description,
      canonicalPath: '/print-nepali-calendar',
      robots: 'index, follow',
      h1: `Print Nepali Calendar ${currentYear} BS – Free Printable Monthly Calendars`,
      breadcrumbs,
      faqs,
      jsonLd: buildJsonLd(baseUrl, breadcrumbs, faqs, [
        {
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: `Print Nepali Calendar ${currentYear} BS`,
          description: `Free printable Nepali (Bikram Sambat) calendar for ${currentYear} BS with all 12 months, holidays, and Gregorian date equivalents.`,
          url: `${baseUrl.replace(/\/+$/, '')}/print-nepali-calendar`,
        },
      ]),
    };
  }

  // Fallback for unknown routes (404)
  return {
    title: 'Page Not Found – Nepali Calendar | MitiPatro',
    description: 'The requested Nepali calendar page was not found. Browse 2082–2083 BS calendars, Aaja Ko Miti, or the BS to AD converter.',
    canonicalPath: cleanPath,
    robots: 'noindex, follow',
    isNotFound: true,
    h1: 'This calendar route is not published',
    breadcrumbs: [{ name: 'Home', path: '/' }],
    faqs: [],
    jsonLd: [],
  };
}

export function getSeoForRoute(
  pathname: string,
  baseUrl = 'http://localhost:3000',
  now = new Date(),
  noindexSite = true,
  converterToolsIndexingEnabled = false,
  rashifalIndexingEnabled = false,
  panchangIndexingEnabled = false,
  jyotishIndexingEnabled = false,
): PageSeoData {
  // Normalize /today alias to /aaja-ko-miti for SEO (same page, canonical URL)
  if (pathname === '/today') {
    pathname = '/aaja-ko-miti';
  }
  const seo = getRouteSeo(
    pathname,
    baseUrl,
    now,
    converterToolsIndexingEnabled,
    panchangIndexingEnabled,
    rashifalIndexingEnabled,
    jyotishIndexingEnabled,
  );
  if (noindexSite) return { ...seo, robots: 'noindex, nofollow' };
  if (pathname === '/rashifal' || pathname.startsWith('/rashifal/')) {
    return { ...seo, robots: rashifalIndexingEnabled ? seo.robots : 'noindex, follow' };
  }
  if (pathname === '/panchang') {
    return { ...seo, robots: panchangIndexingEnabled ? seo.robots : 'noindex, follow' };
  }
  if (pathname === '/kundali') {
    return { ...seo, robots: jyotishIndexingEnabled ? seo.robots : 'noindex, follow' };
  }
  return seo;
}

export function generateSitemapPaths(
  converterToolsIndexingEnabled = false,
  rashifalIndexingEnabled = false,
  panchangIndexingEnabled = false,
  jyotishIndexingEnabled = false,
): string[] {
  const paths = [
    '/',
    '/aaja-ko-miti',
    '/date-converter',
    '/print-nepali-calendar',
    '/about',
    '/contact',
    '/privacy',
    '/terms',
  ];

  // Include only the selected years whose calendar pages are currently eligible for indexing.
  for (const year of INDEXABLE_BS_YEARS) {
    paths.push(`/calendar/${year}`);
    paths.push(`/holidays/${year}`);
    paths.push(`/festivals/${year}`);
    for (const m of BS_MONTHS) {
      paths.push(`/calendar/${year}/${m.slug}`);
    }
  }

  // Panchang page: indexed only when explicitly enabled.
  if (panchangIndexingEnabled) {
    paths.push('/panchang');
  }

  // Kundali/Jyotish page: indexed only when explicitly enabled.
  if (jyotishIndexingEnabled) {
    paths.push('/kundali');
  }

  if (converterToolsIndexingEnabled) {
    paths.push('/bs-date-difference', '/bs-age-calculator', '/nepali-numbers');
  }

  if (rashifalIndexingEnabled) {
    paths.push(
      '/rashifal',
      '/rashifal/weekly',
      '/rashifal/monthly',
      ...RASHIS.map((r) => `/rashifal/${r.id}`),
      ...RASHIS.map((r) => `/rashifal/weekly/${r.id}`),
      ...RASHIS.map((r) => `/rashifal/monthly/${r.id}`),
    );
  }

  return paths;
}

export { CURRENT_BS_YEAR };
