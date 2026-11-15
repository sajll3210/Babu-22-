import React from 'react';
import { Search, Flame, Plane, Coins, Radio, Dice5, Bomb, Grid, X, Sparkles, Layers, Disc } from 'lucide-react';
import { GameCategory, GameProvider } from '../types';
import { CATEGORIES, PROVIDERS } from '../data/games';

interface CategoryFilterProps {
  selectedCategory: GameCategory;
  onSelectCategory: (category: GameCategory) => void;
  selectedProvider: GameProvider;
  onSelectProvider: (provider: GameProvider) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  totalGamesCount: number;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedCategory,
  onSelectCategory,
  selectedProvider,
  onSelectProvider,
  searchQuery,
  onSearchChange,
  totalGamesCount,
}) => {
  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Flame': return <Flame className="w-4 h-4 text-rose-500" />;
      case 'Plane': return <Plane className="w-4 h-4 text-sky-400" />;
      case 'Coins': return <Coins className="w-4 h-4 text-amber-400" />;
      case 'Radio': return <Radio className="w-4 h-4 text-emerald-400" />;
      case 'Sparkles': return <Sparkles className="w-4 h-4 text-yellow-400" />;
      case 'Layers': return <Layers className="w-4 h-4 text-blue-400" />;
      case 'Disc': return <Disc className="w-4 h-4 text-red-400" />;
      case 'Dice5': return <Dice5 className="w-4 h-4 text-purple-400" />;
      case 'Bomb': return <Bomb className="w-4 h-4 text-orange-400" />;
      default: return <Grid className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-3 mb-6">
      {/* Category Tabs: Horizontal Scrollable */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {CATEGORIES.map(cat => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id as GameCategory)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
                isActive
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-[#111827] hover:bg-slate-800 text-gray-300 border border-gray-800'
              }`}
            >
              {getCategoryIcon(cat.iconName)}
              <span>{cat.labelBn}</span>
            </button>
          );
        })}
      </div>

      {/* Search Bar & Provider Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="গেম খুঁজুন (যেমন: Crazy Time, Baccarat, Roulette)..."
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            className="w-full bg-[#111827] border border-gray-800 focus:border-amber-500 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-gray-500 focus:outline-none transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Provider Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <span className="text-[11px] text-gray-400 font-medium shrink-0 hidden md:inline">
            প্রোভাইডার:
          </span>
          {PROVIDERS.map(prov => (
            <button
              key={prov}
              onClick={() => onSelectProvider(prov as GameProvider)}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap transition-colors shrink-0 ${
                selectedProvider === prov
                  ? 'bg-slate-800 text-amber-400 border border-amber-500/40'
                  : 'bg-[#111827] text-gray-400 hover:text-gray-200 border border-gray-800'
              }`}
            >
              {prov === 'All' ? 'সব প্রোভাইডার' : prov}
            </button>
          ))}
        </div>
      </div>

      {/* Counter */}
      <div className="flex items-center justify-between text-[11px] text-gray-400 px-1 pt-1">
        <span>মোট গেম: <strong className="text-amber-400 font-mono">{totalGamesCount}</strong> টি</span>
        <span className="text-gray-400 font-medium">Babu22 লাইভ ক্যাসিনো প্ল্যাটফর্ম</span>
      </div>
    </div>
  );
};
