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

export interface FaqItem {
  question: string;
  answer: string;
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

function getRouteSeo(pathname: string, baseUrl: string, now: Date): PageSeoData {
  const cleanPath = pathname === '/' ? '/' : pathname.replace(/\/+$/, '');
  const today = getTodayNepal(now);

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
        answer: `There are ${publicCount} gazetted public holiday days in ${today.bs.monthNameEn} ${today.bs.year} BS, in addition to weekly Saturday holidays.`,
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
    const description = `Convert Bikram Sambat (BS) dates to Gregorian (AD) and AD to BS accurately between 2000 and 2090 BS using verified official month lengths.`;
    const breadcrumbs: BreadcrumbItem[] = [
      { name: 'Home', path: '/' },
      { name: 'Date Converter', path: '/date-converter' },
    ];
    const faqs: FaqItem[] = [
      {
        question: 'How does the BS to AD date converter work?',
        answer: 'Because Bikram Sambat month lengths vary between 29 and 32 days each year, conversion counts exact days from a verified anchor (1 Baisakh 2000 BS = 14 April 1943 AD) using a lookup table of official month lengths.',
      },
      {
        question: 'Which years are supported by this Bikram Sambat converter?',
        answer: 'The converter supports 2000 BS to 2090 BS (April 14, 1943 AD to April 13, 2034 AD), cross-verified across multiple open-source references and Nepal calendar records.',
      },
      {
        question: 'Why does Nepali New Year (1 Baisakh) fall on April 13 or 14?',
        answer: 'Bikram Sambat is a solar-sidereal calendar anchored to Mesha Sankranti, when the Sun enters Aries. Due to Gregorian leap years and sidereal precession, 1 Baisakh lands around April 13 or 14.',
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
            : `No national gazetted holidays are listed for ${monthMeta.en} ${year} BS yet; weekly Saturday holidays apply throughout the month.`,
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
          answer: `Visit our dedicated Public Holidays ${year} BS page for all confirmed national, cultural, and civic holidays with their English and Nepali names.`,
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
      const title = `Public Holidays Nepal ${year} BS – Official Festival & Civic List | MitiPatro`;
      const description = `Official public holidays and major festivals in Nepal for ${year} BS (${publicCount} gazetted holidays listed). Includes BS dates, AD equivalents, and Nepali names.`;
      const breadcrumbs: BreadcrumbItem[] = [
        { name: 'Home', path: '/' },
        { name: `Public Holidays ${year}`, path: `/holidays/${year}` },
      ];
      const faqs: FaqItem[] = [
        {
          question: `How many public holidays are listed for ${year} BS in Nepal?`,
          answer: `Currently ${publicCount} gazetted public holidays are documented for ${year} BS on MitiPatro, excluding weekly Saturday holidays.`,
        },
        {
          question: `Are Saturdays public holidays in Nepal?`,
          answer: 'Yes. Saturday (Shanibar) is the official weekly weekend holiday across government offices, banks, and schools in Nepal.',
        },
        {
          question: `How are Nepal public holiday dates verified?`,
          answer: 'Holiday dates are compiled from Government of Nepal Gazette notices and cross-checked against Nepal Panchanga Nirnayak Samiti lunar-solar calendars.',
        },
      ];
      return {
        title,
        description,
        canonicalPath: `/holidays/${year}`,
        robots: isIndexable ? 'index, follow' : 'noindex, follow',
        h1: `Public Holidays in Nepal – ${year} BS`,
        breadcrumbs,
        faqs,
        jsonLd: buildJsonLd(baseUrl, breadcrumbs, faqs),
      };
    }
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
): PageSeoData {
  const seo = getRouteSeo(pathname, baseUrl, now);
  return noindexSite ? { ...seo, robots: 'noindex, nofollow' } : seo;
}

export function generateSitemapPaths(): string[] {
  const paths = [
    '/',
    '/aaja-ko-miti',
    '/date-converter',
    '/about',
    '/contact',
    '/privacy',
    '/terms',
  ];

  // Only include complete, verified years (2082–2083 BS). Thin years (2084–2085 BS) are excluded until official holidays are published.
  for (const year of INDEXABLE_BS_YEARS) {
    paths.push(`/calendar/${year}`);
    paths.push(`/holidays/${year}`);
    for (const m of BS_MONTHS) {
      paths.push(`/calendar/${year}/${m.slug}`);
    }
  }

  return paths;
}

export { CURRENT_BS_YEAR };
