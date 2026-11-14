import React from 'react';
import type { FaqItem } from '../../lib/seo';

interface FaqSectionProps {
  heading?: string;
  faqs: FaqItem[];
}

export const FaqSection: React.FC<FaqSectionProps> = ({
  heading = 'Frequently Asked Questions',
  faqs,
}) => {
  if (faqs.length === 0) return null;

  return (
    <section aria-labelledby="faq-heading" className="mt-12 border-t border-stone-200 pt-10">
      <h2 id="faq-heading" className="font-display text-2xl font-semibold text-stone-900">
        {heading}
      </h2>
      <dl className="mt-6 divide-y divide-stone-200 border-y border-stone-200">
        {faqs.map((item) => (
          <div key={item.question} className="py-5">
            <dt className="text-base font-semibold text-stone-900">{item.question}</dt>
            <dd className="mt-2 max-w-3xl text-sm leading-relaxed text-stone-600">
              {item.answer}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
};
