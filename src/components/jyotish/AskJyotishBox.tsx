import React, { useState } from 'react';
import { Loader2, MessageCircle, Send } from 'lucide-react';
import type { JyotishClientChart } from '../../../lib/jyotish/client.js';
import type { BirthDetails } from '../../../lib/jyotish/types.js';
import { useJyotishReading } from '../../../hooks/useJyotishReading.js';
import { useLocale } from '../../../contexts/LocaleContext';
import { formatLocaleNumber } from '../../../lib/i18n/format';

export interface AskJyotishBoxProps {
  birthDetails: BirthDetails | null;
  chart?: JyotishClientChart;
  language?: string;
}

const MAX_QUESTION_LENGTH = 500;

export const AskJyotishBox: React.FC<AskJyotishBoxProps> = ({
  birthDetails,
  chart,
  language = 'en',
}) => {
  const [question, setQuestion] = useState('');
  const { locale, t } = useLocale();
  const starterQuestions = [
    t('jyotish.starterDasha'),
    t('jyotish.starterCareer'),
    t('jyotish.starterRelationships'),
    t('jyotish.starterSadeSati'),
  ];
  const {
    history,
    asking,
    askError,
    submitQuestion,
  } = useJyotishReading({ birthDetails, chart, language: locale, locale });

  const submit = () => {
    if (!asking) {
      void submitQuestion(question);
    }
  };

  return (
    <section
      aria-labelledby="ask-jyotish-heading"
      className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs sm:p-6"
    >
      <div className="flex items-center gap-2">
        <MessageCircle className="h-5 w-5 text-[#9A3412]" aria-hidden="true" />
        <h2
          id="ask-jyotish-heading"
          className="font-display text-xl font-semibold text-stone-900"
        >
          {t('kundali.askJyotish')}
        </h2>
      </div>

      <div className="mt-4 flex flex-wrap gap-2" aria-label={t('jyotish.suggestedQuestions')}>
        {starterQuestions.map((starter) => (
          <button
            key={starter}
            type="button"
            onClick={() => setQuestion(starter)}
            disabled={asking}
            className="rounded-full border border-stone-300 bg-[#FBF9F5] px-3 py-1.5 text-left text-xs font-medium text-stone-700 transition-colors hover:border-[#9A3412]/40 hover:text-[#7C2D12] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {starter}
          </button>
        ))}
      </div>

      <div className="mt-4">
        <label htmlFor="jyotish-question" className="sr-only">
          {t('jyotish.questionLabel')}
        </label>
        <textarea
          id="jyotish-question"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          onKeyDown={(event) => {
            if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
              event.preventDefault();
              submit();
            }
          }}
          maxLength={MAX_QUESTION_LENGTH}
          rows={3}
          placeholder={t('jyotish.questionPlaceholder')}
          className="w-full resize-y rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm leading-6 text-stone-900 placeholder:text-stone-400 focus:border-[#9A3412] focus:outline-none"
        />
        <div className="mt-2 flex items-center justify-between gap-3">
          <span className="text-xs tabular-nums text-stone-500">
            {formatLocaleNumber(question.length, locale)}/{formatLocaleNumber(MAX_QUESTION_LENGTH, locale)}
          </span>
          <button
            type="button"
            onClick={submit}
            disabled={asking || !birthDetails || question.trim().length === 0}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-md bg-[#9A3412] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#7C2D12] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {asking ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="h-4 w-4" aria-hidden="true" />
            )}
            {asking ? t('loadingStates.asking') : t('common.submit')}
          </button>
        </div>
      </div>

      {askError && (
        <div
          role="alert"
          className="mt-4 rounded-lg border border-[#B91C1C]/30 bg-[#FEF2F2] px-4 py-3 text-sm text-[#991B1B]"
        >
          {askError}
        </div>
      )}

      {history.length > 0 && (
        <div className="mt-6 space-y-4" aria-live="polite">
          {history.map((item, index) => (
            <article
              key={`${index}-${item.question}`}
              className="rounded-lg border border-stone-200 bg-[#FBF9F5] p-4"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                {locale === 'ne' ? 'प्रश्न' : 'Question'}
              </p>
              <p className="mt-1 text-sm font-medium text-stone-900">{item.question}</p>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-[#9A3412]">
                {t('jyotish.answerLabel')}
              </p>
              <p className="mt-1 text-sm leading-7 text-stone-700">{item.answer.answer}</p>

              {(item.answer.relevantHouses.length > 0 ||
                item.answer.relevantDashas.length > 0) && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {item.answer.relevantHouses.map((house) => (
                    <span
                      key={`house-${house}`}
                      className="rounded-full border border-stone-200 bg-white px-2.5 py-1 text-xs font-medium text-stone-700"
                    >
                      {t('jyotish.house')} {formatLocaleNumber(house, locale)}
                    </span>
                  ))}
                  {item.answer.relevantDashas.map((graha) => (
                    <span
                      key={`graha-${graha}`}
                      className="rounded-full border border-[#9A3412]/20 bg-[#FDF7F2] px-2.5 py-1 text-xs font-semibold text-[#7C2D12]"
                    >
                      {t('jyotish.graha')}: {graha}
                    </span>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
};
