import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { en } from '../lib/i18n/en.js';
import { ne } from '../lib/i18n/ne.js';
import type { Locale } from '../lib/i18n/types.js';

const LOCALE_STORAGE_KEY = 'mitipatro.locale';

type TranslationTree = typeof en;

type LeafKeys<T, Prefix extends string = ''> =
  T extends object
    ? {
        [K in keyof T & string]:
          T[K] extends object
            ? LeafKeys<T[K], Prefix extends '' ? K : `${Prefix}.${K}`>
            : Prefix extends '' ? K : `${Prefix}.${K}`;
      }[keyof T & string]
    : never;

export type TranslationKey = LeafKeys<TranslationTree>;

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  t: (key: TranslationKey, values?: Record<string, string | number>) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

function getStoredLocale(): Locale {
  if (typeof window === 'undefined') return 'en';
  try {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    return stored === 'ne' ? 'ne' : 'en';
  } catch {
    return 'en';
  }
}

function getNestedValue(tree: TranslationTree, key: TranslationKey): string {
  let current: unknown = tree;
  for (const segment of key.split('.')) {
    if (!current || typeof current !== 'object' || !(segment in current)) {
      return key;
    }
    current = (current as Record<string, unknown>)[segment];
  }
  return typeof current === 'string' ? current : key;
}

export const LocaleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    setLocaleState(getStoredLocale());
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  const setLocale = useCallback((nextLocale: Locale) => {
    setLocaleState(nextLocale);
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(LOCALE_STORAGE_KEY, nextLocale);
      } catch {
        // Locale remains active for the current session.
      }
    }
  }, []);

  const toggleLocale = useCallback(() => {
    setLocaleState((current) => {
      const next = current === 'en' ? 'ne' : 'en';
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
        } catch {
          // Locale remains active for the current session.
        }
      }
      return next;
    });
  }, []);

  const t = useCallback((key: TranslationKey, values?: Record<string, string | number>) => {
    const tree = locale === 'ne' ? ne : en;
    let translated = getNestedValue(tree as TranslationTree, key);
    if (values) {
      for (const [name, value] of Object.entries(values)) {
        translated = translated.replaceAll(`{${name}}`, String(value));
      }
    }
    return translated;
  }, [locale]);

  const value = useMemo(
    () => ({ locale, setLocale, toggleLocale, t }),
    [locale, setLocale, toggleLocale, t],
  );

  return (
    <LocaleContext.Provider value={value}>
      {children}
    </LocaleContext.Provider>
  );
};

export function useLocale(): LocaleContextValue {
  const context = useContext(LocaleContext);
  if (!context) {
    const t = (key: TranslationKey) => getNestedValue(en as TranslationTree, key);
    return {
      locale: 'en',
      setLocale: () => undefined,
      toggleLocale: () => undefined,
      t,
    };
  }
  return context;
}
