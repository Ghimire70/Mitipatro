// src/pages/FaqPage.tsx
//
// Dedicated FAQ hub at /faq. Searchable, category-filtered, paginated Q&A.
// FAQ data lives in sharded JSON under public/data/faqs/ (fetched at runtime,
// never bundled into the client JS).
//
// New pages default to noindex (per AGENTS.md): /faq is hidden from navigation
// and sitemap until the user explicitly opts it in.

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { FaqIndex, FaqItem, FaqShard } from '../../lib/faqTypes';
import { FaqSection } from '../components/FaqSection';
import { FaqSearchBox } from '../components/FaqSearchBox';
import { FaqCategoryTabs } from '../components/FaqCategoryTabs';

interface FaqPageProps {
  onNavigate: (path: string) => void;
}

export const FaqPage: React.FC<FaqPageProps> = ({ onNavigate }) => {
  const [index, setIndex] = useState<FaqIndex | null>(null);
  const [shards, setShards] = useState<Map<string, FaqItem[]>>(new Map());
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [page, setPage] = useState(0);
  const pageSize = 10;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch('/data/faqs/index.json', { cache: 'no-store' });
        if (!res.ok) throw new Error(`index.json ${res.status}`);
        const data: FaqIndex = await res.json();
        if (!cancelled) setIndex(data);
      } catch (err) {
        console.warn('[FaqPage] Failed to load FAQ index:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const fetchShard = useCallback(async (path: string): Promise<FaqItem[]> => {
    const cached = shards.get(path);
    if (cached) return cached;
    try {
      const res = await fetch(path, { cache: 'no-store' });
      if (!res.ok) return [];
      const data = (await res.json()) as { faqs: FaqItem[] };
      const items = data.faqs ?? [];
      setShards((prev) => new Map(prev).set(path, items));
      return items;
    } catch {
      return [];
    }
  }, [shards]);

  const allFaqs = useMemo(() => {
    const items: FaqItem[] = [];
    for (const arr of shards.values()) items.push(...arr);
    return items;
  }, [shards]);

  const filtered = useMemo(() => {
    return allFaqs.filter((item) => {
      const matchSearch =
        !searchQuery ||
        item.question.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategory =
        activeCategory === 'all' || item.intent === activeCategory;
      return matchSearch && matchCategory;
    });
  }, [allFaqs, searchQuery, activeCategory]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice(page * pageSize, (page + 1) * pageSize);

  const categories = useMemo(() => {
    const set = new Set<string>();
    if (index) {
      for (const s of index.shards) set.add(s.category);
    }
    return [...set].sort();
  }, [index]);

  const loadMoreShards = useCallback(async () => {
    if (!index) return;
    const toFetch = index.shards.filter((s) => !shards.has(s.path));
    for (const s of toFetch.slice(0, 3)) {
      await fetchShard(s.path);
    }
  }, [index, shards, fetchShard]);

  useEffect(() => {
    loadMoreShards();
  }, [loadMoreShards]);

  if (loading && !index) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <p className="text-stone-600">Loading questions…</p>
      </div>
    );
  }

  if (!index) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <h1 className="font-display text-3xl font-bold text-stone-900">
          Frequently Asked Questions
        </h1>
        <p className="mt-4 text-stone-600">
          FAQ data is not available. Run <code>npm run sync:faqs</code> to generate it.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <nav aria-label="Breadcrumb" className="text-xs text-stone-500 mb-6">
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            onNavigate('/');
          }}
          className="hover:text-[#9A3412] hover:underline"
        >
          Home
        </a>
        <span className="mx-2">/</span>
        <span className="text-stone-800">Frequently Asked Questions</span>
      </nav>

      <h1 className="font-display text-3xl font-bold text-stone-900 mb-2">
        Frequently Asked Questions
      </h1>
      <p className="mb-8 max-w-2xl text-stone-600">
        Verified answers about the Nepali (Bikram Sambat) calendar, dates,
        festivals, holidays, and rashifal — computed directly from MitiPatro&rsquo;s
        calendar engine.
      </p>

      <FaqSearchBox
        value={searchQuery}
        onChange={setSearchQuery}
        onSearch={(q) => {
          setSearchQuery(q);
          setPage(0);
        }}
      />

      <FaqCategoryTabs
        categories={categories}
        activeCategory={activeCategory}
        onCategory={(cat) => {
          setActiveCategory(cat);
          setPage(0);
        }}
      />

      <FaqSection
        heading={`${filtered.length} questions`}
        faqs={paginated}
        searchQuery={searchQuery}
        category={activeCategory === 'all' ? undefined : activeCategory}
        pageSize={pageSize}
      />

      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-between">
          <p className="text-xs text-stone-500">
            Showing {page * pageSize + 1}-{' '}
            {Math.min((page + 1) * pageSize, filtered.length)} of {filtered.length}
          </p>
          <div className="flex gap-1">
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(p - 1, 0))}
              className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none bg-white border border-stone-200 text-stone-400"
            >
              Prev
            </button>
            <button
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => Math.min(p + 1, totalPages - 1))}
              className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none bg-[#9A3412] text-white hover:bg-[#7C2D12]"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
