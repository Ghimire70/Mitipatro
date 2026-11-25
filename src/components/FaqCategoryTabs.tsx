// src/components/FaqCategoryTabs.tsx
import React from 'react';

interface FaqCategoryTabsProps {
  categories: string[];
  activeCategory: string;
  onCategory: (category: string) => void;
}

export const FaqCategoryTabs: React.FC<FaqCategoryTabsProps> = ({
  categories,
  activeCategory,
  onCategory,
}) => {
  return (
    <div className="flex flex-wrap gap-2 mb-8">
      <button
        onClick={() => onCategory('all')}
        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
          activeCategory === 'all'
            ? 'bg-[#9A3412] text-white'
            : 'bg-white border border-stone-200 text-stone-700 hover:bg-[#F3EFE6]/50'
        }`}
      >
        All
      </button>
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => onCategory(category)}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors capitalize ${
            activeCategory === category
              ? 'bg-[#9A3412] text-white'
              : 'bg-white border border-stone-200 text-stone-700 hover:bg-[#F3EFE6]/50'
          }`}
        >
          {category}
        </button>
      ))}
    </div>
  );
};
