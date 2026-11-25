// src/components/FaqSearchBox.tsx
import React, { useCallback, useRef, useState } from 'react';

interface FaqSearchBoxProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: (query: string) => void;
  placeholder?: string;
}

export const FaqSearchBox: React.FC<FaqSearchBoxProps> = ({
  value,
  onChange,
  onSearch,
  placeholder = 'Search questions…',
}) => {
  const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const next = e.currentTarget.value;
      onChange(next);
      if (debounceTimer) clearTimeout(debounceTimer);
      const id = setTimeout(() => {
        onSearch(next);
        setDebounceTimer(null);
      }, 300);
      setDebounceTimer(id);
    },
    [onChange, onSearch, debounceTimer],
  );

  return (
    <div className="relative max-w-2xl mx-auto mb-8">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414L4.414 8.828A1 1 0 012 8z"
            clipRule="evenodd"
          />
        </svg>
      </div>
      <input
        ref={inputRef}
        type="search"
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        className="w-full min-h-[44px] pl-10 pr-4 text-stone-900 placeholder:text-stone-400 border border-stone-200 rounded-lg bg-white focus:ring-2 focus:ring-[#9A3412] focus:border-transparent transition-all shadow-sm"
      />
    </div>
  );
};
