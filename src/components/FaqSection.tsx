// src/components/FaqSection.tsx
import React, { useCallback, useMemo, useState } from 'react';
import type { FaqItem } from '../../lib/seo';

interface FaqSectionProps {
  heading?: string;
  faqs: FaqItem[];
  searchQuery?: string;
  category?: string;
  pageSize?: number;
}

export const FaqSection: React.FC<FaqSectionProps> = ({
  heading = 'Frequently Asked Questions',
  faqs,
  searchQuery,
  category,
  pageSize = 10,
}) => {
  if (faqs.length === 0) return null;

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const filtered = useMemo(() => {
    return faqs.filter((item) => {
      const matchSearch =
        !searchQuery ||
        item.question.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategory = !category || item.intent === category;
      return matchSearch && matchCategory;
    });
  }, [faqs, searchQuery, category]);

  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice(page * pageSize, (page + 1) * pageSize);

  const toggleItem = useCallback((question: string) => {
    setExpanded((prev) => ({ ...prev, [question]: !prev[question] }));
  }, []);

  return (
    <section aria-labelledby="faq-heading" className="mt-12 border-t border-stone-200 pt-10">
      <h2 id="faq-heading" className="font-display text-2xl font-semibold text-stone-900">
        {heading}
      </h2>
      <dl className="mt-6 divide-y divide-stone-200 border-y border-stone-200">
        {paginated.map((item) => (
          <div key={item.id ?? item.question} className="py-5">
            <dt
              className="text-base font-semibold text-stone-900 cursor-pointer select-none"
              onClick={() => toggleItem(item.question)}
            >
              {item.question}
            </dt>
            {expanded[item.question] && (
              <dd className="mt-2 max-w-3xl text-sm leading-relaxed text-stone-600">
                {item.answer}
              </dd>
            )}
          </div>
        ))}
      </dl>

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-xs text-stone-500">
            Showing {page * pageSize + 1}-{' '}
            {Math.min((page + 1) * pageSize, filtered.length)} of {filtered.length}
          </p>
          <div className="flex gap-1">
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(p - 1, 0))}
              className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none ${
                page === 0
                  ? 'bg-white border border-stone-200 text-stone-400'
                  : 'bg-[#9A3412] text-white hover:bg-[#7C2D12]'
              }"
            >
              Prev
            </button>
            <button
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => Math.min(p + 1, totalPages - 1))}
              className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none ${
                page >= totalPages - 1
                  ? 'bg-white border border-stone-200 text-stone-400'
                  : 'bg-[#9A3412] text-white hover:bg-[#7C2D12]'
              }"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
