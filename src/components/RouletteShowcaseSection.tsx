import React, { useState } from 'react';
import { Disc, Play, Sparkles } from 'lucide-react';

interface RouletteShowcaseSectionProps {
  onSelectRouletteAction: (tableName?: string) => void;
}

interface RoulettePictureCard {
  id: string;
  image: string;
  title: string;
  provider: string;
  optionTag: string;
}

const ROULETTE_PICTURE_CARDS: RoulettePictureCard[] = [
  { id: 'roulette-ct-01', image: '/assets/aistudio/crazy_time_image_1_7ddded16.png', title: 'Crazy Time', provider: 'Evolution', optionTag: 'Crazy Time & Wheel' },
  { id: 'roulette-ct-02', image: '/assets/aistudio/crazy_time_image_2_8f138080.png', title: 'Crazy Time Live', provider: 'Evolution', optionTag: 'Crazy Time & Wheel' },
  { id: 'roulette-ct-03', image: '/assets/aistudio/crazy_time_image_3_a5128968.png', title: 'Crazy Time Wheel Show', provider: 'Evolution', optionTag: 'Crazy Time & Wheel' },
  { id: 'roulette-ct-04', image: '/assets/aistudio/crazy_time_image_4_91d6e7a7.png', title: 'Crazy Time Italia', provider: 'Evolution', optionTag: 'Crazy Time & Wheel' },
  { id: 'roulette-ct-05', image: '/assets/aistudio/crazy_time_image_5_285f90d4.png', title: 'Crazy Time Turkey', provider: 'Evolution', optionTag: 'Crazy Time & Wheel' },
  { id: 'roulette-pic-01', image: '/assets/aistudio/roulette_01_49e62d4b.png', title: 'Extra Time Roulette 2', provider: 'Pragmatic Play', optionTag: 'Live VIP & Speed' },
  { id: 'roulette-pic-02', image: '/assets/aistudio/roulette_02_914fa375.png', title: 'Roulette 3', provider: 'Pragmatic Play', optionTag: 'Live VIP & Speed' },
  { id: 'roulette-pic-03', image: '/assets/aistudio/roulette_03_bebfdce2.png', title: 'Roulette A', provider: 'CreedRoomz', optionTag: 'CreedRoomz & Ezugi' },
  { id: 'roulette-pic-04', image: '/assets/aistudio/roulette_04_ffbafab2.png', title: 'Arabic Roulette', provider: 'CreedRoomz', optionTag: 'Global Tables' },
  { id: 'roulette-pic-05', image: '/assets/aistudio/roulette_05_09e25797.png', title: 'Armenia Roulette', provider: 'CreedRoomz', optionTag: 'Global Tables' },
  { id: 'roulette-pic-06', image: '/assets/aistudio/roulette_06_261109cc.png', title: 'Roulette Aurum', provider: 'CreedRoomz', optionTag: 'Lightning & 50x' },
  { id: 'roulette-pic-07', image: '/assets/aistudio/roulette_07_d2042b02.png', title: 'Azure Roulette', provider: 'Pragmatic Play', optionTag: 'Live VIP & Speed' },
  { id: 'roulette-pic-08', image: '/assets/aistudio/roulette_08_b3e5cc7c.png', title: 'Roleta Brasileira', provider: 'CreedRoomz', optionTag: 'Global Tables' },
  { id: 'roulette-pic-09', image: '/assets/aistudio/roulette_09_143c61a4.png', title: 'Roulette Deluxe', provider: 'CreedRoomz', optionTag: 'Live VIP & Speed' },
  { id: 'roulette-pic-10', image: '/assets/aistudio/roulette_10_59b5ab25.png', title: 'Roulette FTV', provider: 'CreedRoomz', optionTag: 'CreedRoomz & Ezugi' },
  { id: 'roulette-pic-11', image: '/assets/aistudio/roulette_11_4fb063a6.png', title: 'Italia Tricolore Roulette', provider: 'Pragmatic Play', optionTag: 'Global Tables' },
  { id: 'roulette-pic-12', image: '/assets/aistudio/roulette_12_65d4702d.png', title: 'Evolution Roulette', provider: 'Evolution', optionTag: 'Live VIP & Speed' },
  { id: 'roulette-pic-13', image: '/assets/aistudio/roulette_13_2878a39b.png', title: 'Roulette Lobby', provider: 'Ezugi', optionTag: 'CreedRoomz & Ezugi' },
  { id: 'roulette-pic-14', image: '/assets/aistudio/roulette_14_cf244b8a.png', title: 'Macao Roulette', provider: 'Pragmatic Play', optionTag: 'Global Tables' },
  { id: 'roulette-pic-15', image: '/assets/aistudio/roulette_15_b4555c00.png', title: 'Persian Roulette', provider: 'CreedRoomz', optionTag: 'Global Tables' },
  { id: 'roulette-pic-16', image: '/assets/aistudio/roulette_16_67c36aa9.png', title: 'PopOK Roulette', provider: 'CreedRoomz', optionTag: 'CreedRoomz & Ezugi' },
  { id: 'roulette-pic-17', image: '/assets/aistudio/roulette_17_1c435610.png', title: 'PopOK Roulette Aurum', provider: 'CreedRoomz', optionTag: 'Lightning & 50x' },
  { id: 'roulette-pic-18', image: '/assets/aistudio/roulette_18_7c00be4a.png', title: 'Roulette Speed', provider: 'CreedRoomz', optionTag: 'Live VIP & Speed' },
  { id: 'roulette-pic-19', image: '/assets/aistudio/roulette_19_8a6bfb07.png', title: 'Turkish Roulette', provider: 'CreedRoomz', optionTag: 'Global Tables' },
  { id: 'roulette-pic-20', image: '/assets/aistudio/roulette_20_c378a035.png', title: 'Roulette Vision VIP', provider: 'CreedRoomz', optionTag: 'Live VIP & Speed' },
  { id: 'roulette-pic-21', image: '/assets/aistudio/roulette_21_4a63a569.png', title: 'Ruleta del Sol', provider: 'Ezugi', optionTag: 'CreedRoomz & Ezugi' },
  { id: 'roulette-pic-22', image: '/assets/aistudio/roulette_22_046b7dc2.png', title: 'Ruleta En Vivo', provider: 'Evolution', optionTag: 'Global Tables' },
  { id: 'roulette-pic-23', image: '/assets/aistudio/roulette_23_4d6adb06.png', title: 'Puerta Roja Ruleta En Vivo', provider: 'Evolution', optionTag: 'Global Tables' },
  { id: 'roulette-pic-24', image: '/assets/aistudio/roulette_24_77889dfb.png', title: 'XXXtreme Lightning Ruleta Relampago', provider: 'Evolution', optionTag: 'Lightning & 50x' },
  { id: 'roulette-pic-25', image: '/assets/aistudio/roulette_25_a87f5093.png', title: 'Lightning Ruleta Relampago', provider: 'Evolution', optionTag: 'Lightning & 50x' },
  { id: 'roulette-pic-26', image: '/assets/aistudio/roulette_26_8995f8cc.png', title: 'Russian Roulette VIP', provider: 'Pragmatic Play', optionTag: 'Global Tables' },
  { id: 'roulette-pic-27', image: '/assets/aistudio/roulette_27_69980670.png', title: 'Russian Roulette', provider: 'Ezugi', optionTag: 'CreedRoomz & Ezugi' },
  { id: 'roulette-pic-28', image: '/assets/aistudio/roulette_28_5b3c6159.png', title: 'Salon Prive Roulette Live', provider: 'Evolution', optionTag: 'Live VIP & Speed' },
];

const ROULETTE_OPTIONS = [
  'All Roulette',
  'Crazy Time & Wheel',
  'Live VIP & Speed',
  'Lightning & 50x',
  'CreedRoomz & Ezugi',
  'Global Tables',
] as const;

export const RouletteShowcaseSection: React.FC<RouletteShowcaseSectionProps> = ({
  onSelectRouletteAction,
}) => {
  const [activeOption, setActiveOption] = useState<string>('All Roulette');
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const visibleCards =
    activeOption === 'All Roulette'
      ? ROULETTE_PICTURE_CARDS
      : ROULETTE_PICTURE_CARDS.filter(c => c.optionTag === activeOption);

  const markImageFailed = (id: string) => {
    setFailedImages(prev => ({ ...prev, [id]: true }));
  };

  return (
    <section
      aria-label="Roulette Options Showcase"
      className="my-6 bg-[#111827] border border-gray-800 rounded-2xl p-4 sm:p-5 shadow-xl"
    >
      {/* Section Header + Roulette Option Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-4 border-b border-gray-800/80">
        <div>
          <div className="flex items-center gap-2 text-xs text-rose-400 font-semibold">
            <Disc className="w-4 h-4 shrink-0" />
            <span>রুলেট অপশন (Roulette Options)</span>
            <span aria-hidden="true">·</span>
            <span className="text-gray-400">৩৩+ লাইভ ডিলার রুলেট ও হুইল টেবিল</span>
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold text-white mt-1">
            লাইভ রুলেট কালেকশন (Live Roulette Tables)
          </h2>
        </div>

        {/* Interactive Roulette Option Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          {ROULETTE_OPTIONS.map(opt => (
            <button
              key={opt}
              type="button"
              onClick={() => setActiveOption(opt)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                activeOption === opt
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'bg-slate-900 text-gray-300 hover:bg-slate-800 border border-gray-800'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* All 28 Roulette Table Pictures Grid */}
      <div className="mt-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 gap-2.5 sm:gap-3">
          {visibleCards.map(card => (
            <button
              key={card.id}
              type="button"
              onClick={() => onSelectRouletteAction(card.title)}
              aria-label={`${card.title} (${card.provider})`}
              className="group relative aspect-[3/4] w-full rounded-xl overflow-hidden border border-gray-800 hover:border-rose-400 bg-slate-950 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-rose-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 cursor-pointer text-left"
            >
              {!failedImages[card.id] ? (
                <img
                  src={card.image}
                  alt={card.title}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  onError={() => markImageFailed(card.id)}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-2 bg-gradient-to-br from-slate-900 to-slate-950 text-center">
                  <Sparkles className="w-5 h-5 text-rose-400 mb-1.5" />
                  <span className="text-[11px] font-bold text-white leading-tight line-clamp-2">
                    {card.title}
                  </span>
                  <span className="text-[10px] text-gray-400 mt-1">{card.provider}</span>
                </div>
              )}

              {/* Hover Play Overlay */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center p-2 text-center">
                <span className="w-10 h-10 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-500/40 mb-1.5 transform scale-90 group-hover:scale-100 transition-transform">
                  <Play className="w-4 h-4 fill-white ml-0.5" />
                </span>
                <span className="text-[11px] font-extrabold text-white leading-tight line-clamp-2 drop-shadow">
                  {card.title}
                </span>
                <span className="text-[10px] text-amber-300 font-semibold mt-0.5">
                  খেলুন
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
