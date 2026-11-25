// scripts/sync-search-faqs.ts
//
// Daily FAQ sync script entry point.
//   npm run sync:faqs
//   npm run sync:faqs -- --dry-run
//   npm run sync:faqs -- --limit 50 --no-gsc
//
// Collects queries from GSC (optional), Autocomplete, and Trends;
// synthesizes answers from the verified BS engine; normalizes/dedups;
// writes shard JSON files to data/faqs/ and public/data/faqs/.

import { collectGscQueries } from './sync/collectors/gsc';
import { collectAutocompleteQueries } from './sync/collectors/autocomplete';
import { collectTrendsQueries } from './sync/collectors/trends';
import { generateDeterministicFaqs } from './sync/generator/deterministic';
import { writeShards } from './sync/writer';
import { classifyIntent, dedup } from '../lib/faqNormalizer';
import type { FaqItem } from '../lib/faqTypes';

interface CliArgs {
  dryRun: boolean;
  limit?: number;
  noGsc: boolean;
  noAutocomplete: boolean;
  noTrends: boolean;
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {
    dryRun: false,
    noGsc: false,
    noAutocomplete: false,
    noTrends: false,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dry-run') args.dryRun = true;
    else if (a === '--no-gsc') args.noGsc = true;
    else if (a === '--no-autocomplete') args.noAutocomplete = true;
    else if (a === '--no-trends') args.noTrends = true;
    else if (a === '--limit' && i + 1 < argv.length) {
      args.limit = Number(argv[++i]);
      if (!Number.isFinite(args.limit)) args.limit = undefined;
    }
  }
  return args;
}

function rankQueries(queries: string[]): string[] {
  const seen = new Set<string>();
  return queries.filter((q) => {
    if (seen.has(q)) return false;
    seen.add(q);
    return q.trim().length > 0;
  });
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv);
  const now = new Date().toISOString();
  console.log(`[sync:faqs] Starting FAQ sync at ${now}`);

  const rawQueries: string[] = [];

  // 1. Google Search Console (optional)
  if (!args.noGsc) {
    const gscSiteUrl = process.env.GSC_SITE_URL?.trim();
    const gscCreds = process.env.GSC_CREDENTIALS_JSON?.trim();
    try {
      const gscRows = await collectGscQueries(gscSiteUrl ?? '', gscCreds);
      const gscQueries = gscRows.map((r) => r.query);
      console.log(`[sync:faqs] GSC: ${gscQueries.length} queries collected.`);
      rawQueries.push(...gscQueries);
    } catch (err) {
      console.warn('[sync:faqs] GSC collection errored:', (err as Error).message);
    }
  }

  // 2. Google Autocomplete
  if (!args.noAutocomplete) {
    try {
      const autoResults = await collectAutocompleteQueries();
      const autoQueries = autoResults.map((r) => r.query);
      console.log(`[sync:faqs] Autocomplete: ${autoQueries.length>0?autoResults.length:0} queries collected.`);
      rawQueries.push(...autoQueries);
    } catch (err) {
      console.warn('[sync:faqs] Autocomplete collection errored:', (err as Error).message);
    }
  }

  // 3. Google Trends
  if (!args.noTrends) {
    try {
      const trendsResults = await collectTrendsQueries();
      const trendsQueries = trendsResults.map((r) => r.query);
      console.log(`[sync:faqs] Trends: ${trendsQueries.length} queries collected.`);
      rawQueries.push(...trendsQueries);
    } catch (err) {
      console.warn('[sync:faqs] Trends collection errored:', (err as Error).message);
    }
  }

  const uniqueQueries = rankQueries(rawQueries);
  console.log(`[sync:faqs] Total unique raw queries: ${uniqueQueries.length}`);

  // 4. Synthesize programmatic FAQs from verified engine
  const generatedFaqs = generateDeterministicFaqs();
  console.log(`[sync:faqs] Deterministic generator produced ${generatedFaqs.length} FAQs.`);

  // 5. Convert search queries into candidate FAQ items (intent + general source)
  const queryFaqs: FaqItem[] = uniqueQueries
    .slice(0, args.limit ?? Infinity)
    .map((q) => {
      const intent = classifyIntent(q);
      const category = intent === 'general' ? 'search-demand' : intent;
      return {
        id: '', // filled by faq() canonicalHash
        question: q.charAt(0).toUpperCase() + q.slice(1),
        answer: '', // placeholder; synthesizer would need context to answer arbitrary queries
        intent,
        category,
        source: intent === 'general' ? 'trends' : 'autocomplete',
        generatedAt: now,
        verified: false, // arbitrary search queries can't be engine-verified without context
      } as FaqItem;
    });

  // 6. Combine: deterministic (verified) first, then query-derived (unverified placeholders)
  const combined: FaqItem[] = [...generatedFaqs, ...queryFaqs];

  // 7. Dedup by canonical hash (question + intent)
  const deduped = dedup(combined);
  console.log(`[sync:faqs] After dedup: ${deduped.length} FAQs (from ${combined.length} raw).`);

  // 8. Write shards (unless dry-run)
  if (args.dryRun) {
    console.log('[sync:faqs] Dry-run complete. No files written.');
    console.log(`[sync:faqs] Would write ${deduped.length} FAQs across shards.`);
    return;
  }

  const shards = writeShards(deduped);
  console.log(`[sync:faqs] Wrote ${shards.length} shards with ${deduped.length} total FAQs.`);
  console.log('[sync:faqs] Sync complete.');
}

main().catch((err) => {
  console.error('[sync:faqs] Fatal error:', err);
  process.exit(1);
});
