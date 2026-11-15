import React, { useState } from 'react';
import { Coins, Lock, Play, Sparkles, ArrowRight } from 'lucide-react';

interface SlotShowcaseSectionProps {
  onSelectSlotAction: (slotName?: string) => void;
}

interface SlotPictureCard {
  id: string;
  image: string;
  title: string;
  provider: string;
  optionTag: string;
}

interface SlotPhotoBoard {
  id: string;
  image: string;
  titleEn: string;
  titleBn: string;
  subtitle: string;
  optionTag: string;
  gamesCount: string;
}

const FEATURED_SLOT_PICTURE_CARDS: SlotPictureCard[] = [
  { id: 'slot-pic-01', image: '/assets/aistudio/image_01_eb0caeba.png', title: 'Christmas 5 Sevens Hold & Win', provider: 'Novomatic', optionTag: 'Hold & Win' },
  { id: 'slot-pic-02', image: '/assets/aistudio/image_02_eb4c9545.png', title: '5 Lions Reborn', provider: 'Pragmatic Play', optionTag: 'Megaways & Lions' },
  { id: 'slot-pic-03', image: '/assets/aistudio/image_03_1d3a50ad.png', title: '5 Families', provider: 'Red Tiger', optionTag: 'Adventure Slots' },
  { id: 'slot-pic-04', image: '/assets/aistudio/image_04_1c8c817e.png', title: 'Lucky Fruit', provider: 'GameArt', optionTag: 'Crazy & Arcade' },
  { id: 'slot-pic-05', image: '/assets/aistudio/image_05_41d6705a.png', title: '5 Super Clover', provider: 'Novomatic', optionTag: 'Crazy & Arcade' },
  { id: 'slot-pic-06', image: '/assets/aistudio/image_06_afb59916.png', title: '5 Lucky Lions', provider: 'Habanero', optionTag: 'Megaways & Lions' },
  { id: 'slot-pic-07', image: '/assets/aistudio/image_07_d96df4fb.png', title: '5 Frozen Charms Megaways', provider: 'Pragmatic Play', optionTag: 'Megaways & Lions' },
  { id: 'slot-pic-08', image: '/assets/aistudio/image_08_ddbcf7bf.png', title: '40 Mega Hotfire', provider: 'Novomatic', optionTag: '777 Classic' },
  { id: 'slot-pic-09', image: '/assets/aistudio/image_09_4061c639.png', title: '50 Jokers Christmas', provider: 'Novomatic', optionTag: 'Crazy & Arcade' },
  { id: 'slot-pic-10', image: '/assets/aistudio/image_10_3c24b2b2.png', title: '5 Lucky Sevens', provider: 'GameArt', optionTag: '777 Classic' },
  { id: 'slot-pic-11', image: '/assets/aistudio/image_11_8323c0f9.png', title: '5 Lions', provider: 'Pragmatic Play', optionTag: 'Megaways & Lions' },
  { id: 'slot-pic-12', image: '/assets/aistudio/image_12_8bb5a8c1.png', title: '40 Super Blazing Sevens', provider: 'GameArt', optionTag: '777 Classic' },
  { id: 'slot-pic-13', image: '/assets/aistudio/image_13_f42befa8.png', title: '50 Jokers Hotfire', provider: 'Novomatic', optionTag: 'Crazy & Arcade' },
  { id: 'slot-pic-14', image: '/assets/aistudio/image_14_55e97e6b.png', title: '5 Mariachis', provider: 'Habanero', optionTag: 'Adventure Slots' },
  { id: 'slot-pic-15', image: '/assets/aistudio/image_15_43a8778a.png', title: '5 Lions Dance', provider: 'Pragmatic Play', optionTag: 'Megaways & Lions' },
  { id: 'slot-pic-16', image: '/assets/aistudio/image_16_98b76c05.png', title: '40 Super Clover', provider: 'Novomatic', optionTag: 'Crazy & Arcade' },
  { id: 'slot-pic-17', image: '/assets/aistudio/image_17_248fd692.png', title: '5000x Rush', provider: 'Platipus', optionTag: 'Crazy & Arcade' },
  { id: 'slot-pic-18', image: '/assets/aistudio/image_18_1aff7950.png', title: '5 Sevens', provider: 'Novomatic', optionTag: '777 Classic' },
  { id: 'slot-pic-19', image: '/assets/aistudio/image_19_f6c64593.png', title: '5 Lions Gold', provider: 'Pragmatic Play', optionTag: 'Megaways & Lions' },
  { id: 'slot-pic-20', image: '/assets/aistudio/image_20_222616e9.png', title: '40 Super Heated Sevens', provider: 'GameArt', optionTag: '777 Classic' },
  { id: 'slot-pic-21', image: '/assets/aistudio/image_21_da76e06b.png', title: '6 Jokers', provider: 'Pragmatic Play', optionTag: 'Crazy & Arcade' },
  { id: 'slot-pic-22', image: '/assets/aistudio/image_22_46707926.png', title: '5 Sevens Dice', provider: 'Novomatic', optionTag: '777 Classic' },
  { id: 'slot-pic-23', image: '/assets/aistudio/image_23_e0029b69.png', title: '5 Lions Megaways', provider: 'Pragmatic Play', optionTag: 'Megaways & Lions' },
  { id: 'slot-pic-24', image: '/assets/aistudio/image_24_a0298371.png', title: '4 Four Squad', provider: 'Red Tiger', optionTag: 'Adventure Slots' },
  { id: 'slot-pic-25', image: '/assets/aistudio/image_25_231399e7.png', title: '64 Gold Coins Hold & Win', provider: 'Booming Games', optionTag: 'Hold & Win' },
  { id: 'slot-pic-26', image: '/assets/aistudio/image_26_88517f5d.png', title: '5 Sevens Hold & Win', provider: 'Novomatic', optionTag: 'Hold & Win' },
  { id: 'slot-pic-27', image: '/assets/aistudio/image_27_66da3bcf.png', title: '5 Lions 2 Megaways', provider: 'Pragmatic Play', optionTag: 'Megaways & Lions' },
  { id: 'slot-pic-28', image: '/assets/aistudio/image_28_17927f24.png', title: '5 Amazon Jewels', provider: 'Atomic Slot Lab', optionTag: 'Adventure Slots' },
  { id: 'slot-pic-29', image: '/assets/aistudio/image_29_e60b25ec.png', title: '7th Heaven', provider: 'Betsoft', optionTag: '777 Classic' },
  { id: 'slot-pic-30', image: '/assets/aistudio/image_30_0aafad9a.png', title: '777 Valentines', provider: 'Retro Gaming', optionTag: '777 Classic' },
  { id: 'slot-pic-31', image: '/assets/aistudio/image_31_8c484fc2.png', title: '777 Oktoberfest', provider: 'Retro Gaming', optionTag: '777 Classic' },
  { id: 'slot-pic-32', image: '/assets/aistudio/image_32_b93903fc.png', title: '777 Electro Spin', provider: 'Retro Gaming', optionTag: '777 Classic' },
  { id: 'slot-pic-33', image: '/assets/aistudio/image_33_5d9211eb.png', title: "7's Luck", provider: 'Red Tiger', optionTag: '777 Classic' },
  { id: 'slot-pic-34', image: '/assets/aistudio/image_34_fc6f3c5b.png', title: '777 Western', provider: 'Retro Gaming', optionTag: '777 Classic' },
  { id: 'slot-pic-35', image: '/assets/aistudio/image_35_abd7c5c8.png', title: '777 Rush', provider: 'Pragmatic Play', optionTag: '777 Classic' },
  { id: 'slot-pic-36', image: '/assets/aistudio/image_36_996f5289.png', title: '777 Fruits', provider: 'Retro Gaming', optionTag: '777 Classic' },
  { id: 'slot-pic-37', image: '/assets/aistudio/image_37_158ccd67.png', title: '8 Bullets Hold & Win', provider: 'Novomatic', optionTag: 'Hold & Win' },
  { id: 'slot-pic-38', image: '/assets/aistudio/image_38_79c90de4.png', title: '777 Xmas', provider: 'Retro Gaming', optionTag: '777 Classic' },
  { id: 'slot-pic-39', image: '/assets/aistudio/image_39_ae8b7233.png', title: '777 Space', provider: 'Retro Gaming', optionTag: '777 Classic' },
  { id: 'slot-pic-40', image: '/assets/aistudio/image_40_a27db8c3.png', title: '777 Heist', provider: 'Red Rake Gaming', optionTag: 'Adventure Slots' },
  { id: 'slot-pic-41', image: '/assets/aistudio/image_41_b2f9a8b9.png', title: '8 Dragons', provider: 'Pragmatic Play', optionTag: 'Adventure Slots' },
  { id: 'slot-pic-42', image: '/assets/aistudio/image_42_75ea24d4.png', title: '7s Fruit Fiesta', provider: 'Platipus', optionTag: 'Crazy & Arcade' },
  { id: 'slot-pic-43', image: '/assets/aistudio/image_43_df55ea1c.png', title: '777 Strike', provider: 'Red Tiger', optionTag: '777 Classic' },
  { id: 'slot-pic-44', image: '/assets/aistudio/image_44_9435cacd.png', title: '777 Heist 2: The Art Forger', provider: 'Red Rake Gaming', optionTag: 'Adventure Slots' },
  { id: 'slot-pic-45', image: '/assets/aistudio/image_45_0d741aa3.png', title: '8 Golden Dragon Challenge', provider: 'Pragmatic Play', optionTag: 'Adventure Slots' },
  { id: 'slot-pic-46', image: '/assets/aistudio/image_46_50e3a185.png', title: '7s Fury 20', provider: 'GameArt', optionTag: '777 Classic' },
  { id: 'slot-pic-47', image: '/assets/aistudio/image_47_15673d71.png', title: '777 Summer', provider: 'Retro Gaming', optionTag: '777 Classic' },
  { id: 'slot-pic-48', image: '/assets/aistudio/image_48_0e93d057.png', title: '777 Joyas De Los Muertos', provider: 'Retro Gaming', optionTag: '777 Classic' },
  { id: 'slot-pic-49', image: '/assets/aistudio/image_49_164af909.png', title: '8-Bit Quest', provider: 'Platipus', optionTag: 'Adventure Slots' },
  { id: 'slot-pic-50', image: '/assets/aistudio/image_50_52579de3.png', title: '7s Fury 40', provider: 'GameArt', optionTag: '777 Classic' },
  { id: 'slot-pic-51', image: '/assets/aistudio/image_51_3c2ad2f9.png', title: '777 Super Strike', provider: 'Red Tiger', optionTag: '777 Classic' },
  { id: 'slot-pic-52', image: '/assets/aistudio/image_52_f486288b.png', title: '777 Lucky Hits', provider: 'Retro Gaming', optionTag: '777 Classic' },
  { id: 'slot-pic-53', image: '/assets/aistudio/image_53_493c1721.png', title: '80sPop', provider: 'AvatarUX', optionTag: 'Crazy & Arcade' },
  { id: 'slot-pic-54', image: '/assets/aistudio/image_54_b0b73396.png', title: '7s and Diamonds', provider: 'GameArt', optionTag: '777 Classic' },
  { id: 'slot-pic-55', image: '/assets/aistudio/image_55_b4e0f6d0.png', title: '777 Triple Seven', provider: 'Retro Gaming', optionTag: '777 Classic' },
  { id: 'slot-pic-56', image: '/assets/aistudio/image_56_886ad036.png', title: '777 Magma Spins', provider: 'Retro Gaming', optionTag: '777 Classic' },
];

const SLOT_PHOTO_BOARDS: SlotPhotoBoard[] = [
  {
    id: 'crazy-slots',
    image: '/assets/aistudio/Screenshot_15_836b86ba.png',
    titleEn: 'Crazy Slots & Live Wheels',
    titleBn: 'ক্রেজি স্লটস ও মেগা হুইল',
    subtitle: 'Crazy Shark · Crazy Time · Three Crazy Piggies · Fruitbat Crazy',
    optionTag: 'Crazy & Arcade',
    gamesCount: '১৩+ গেম',
  },
  {
    id: 'lions-megaways',
    image: '/assets/aistudio/Screenshot_12_ad1e37dd.png',
    titleEn: '5 Lions & Joker Series',
    titleBn: '৫ লায়ন্স মেগাওয়েজ ও জোকার স্লট',
    subtitle: '5 Lions Megaways · 40 Mega Hotfire · 50 Jokers · 64 Gold Coins',
    optionTag: 'Megaways & Lions',
    gamesCount: '২৮+ গেম',
  },
  {
    id: 'classic-777',
    image: '/assets/aistudio/Screenshot_13_cacf29dd.png',
    titleEn: '777 Jackpot & Dragons',
    titleBn: '৭৭৭ সুপার স্ট্রাইক ও ড্রাগন স্লট',
    subtitle: '777 Rush · 777 Strike · 8 Dragons · 80sPop · 8 Bullets',
    optionTag: '777 Classic',
    gamesCount: '২৮+ গেম',
  },
  {
    id: 'hold-and-win',
    image: '/assets/aistudio/Screenshot_11_7be85157.png',
    titleEn: 'Hold & Win Kingdoms',
    titleBn: 'হোল্ড অ্যান্ড উইন ও থ্রি কিংডমস',
    subtitle: '3 Kingdoms · 3 Witch Pots · 4 Horsemen · 40 Chilli Fruits',
    optionTag: 'Hold & Win',
    gamesCount: '২৮+ গেম',
  },
  {
    id: 'ancient-adventures',
    image: '/assets/aistudio/Screenshot_14_5dc1128e.png',
    titleEn: 'Ancient Egypt & Aloha Slots',
    titleBn: 'প্রাচীন মিশর ও অ্যাডভেঞ্চার স্লট',
    subtitle: 'Ancient Egypt · Aloha Christmas · Alpha Eagle · Angel vs Sinner',
    optionTag: 'Adventure Slots',
    gamesCount: '২৮+ গেম',
  },
];

const SLOT_OPTIONS = [
  'All Slots',
  '777 Classic',
  'Megaways & Lions',
  'Hold & Win',
  'Crazy & Arcade',
  'Adventure Slots',
] as const;

export const SlotShowcaseSection: React.FC<SlotShowcaseSectionProps> = ({
  onSelectSlotAction,
}) => {
  const [activeOption, setActiveOption] = useState<string>('All Slots');
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const visiblePictureCards =
    activeOption === 'All Slots'
      ? FEATURED_SLOT_PICTURE_CARDS
      : FEATURED_SLOT_PICTURE_CARDS.filter(c => c.optionTag === activeOption);

  const visibleBoards =
    activeOption === 'All Slots'
      ? SLOT_PHOTO_BOARDS
      : SLOT_PHOTO_BOARDS.filter(b => b.optionTag === activeOption);

  const markImageFailed = (id: string) => {
    setFailedImages(prev => ({ ...prev, [id]: true }));
  };

  return (
    <section
      aria-label="Featured Slots Showcase"
      className="my-6 bg-[#111827] border border-gray-800 rounded-2xl p-4 sm:p-5 shadow-xl"
    >
      {/* Section Header + Slot Option Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-4 border-b border-gray-800/80">
        <div>
          <div className="flex items-center gap-2 text-xs text-amber-400 font-semibold">
            <Coins className="w-4 h-4 shrink-0" />
            <span>স্লট অপশন (Slot Options)</span>
            <span aria-hidden="true">·</span>
            <span className="text-gray-400">৫৬+ প্রিমিয়াম স্লট গেম</span>
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold text-white mt-1">
            প্রিমিয়াম স্লট কালেকশন (Premium Slots)
          </h2>
        </div>

        {/* Interactive Slot Option Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          {SLOT_OPTIONS.map(opt => (
            <button
              key={opt}
              type="button"
              onClick={() => setActiveOption(opt)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                activeOption === opt
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'bg-slate-900 text-gray-300 hover:bg-slate-800 border border-gray-800'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* Beginning of Slot Options: All 56 Individual Slot Thumbnail Pictures */}
      <div className="mt-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 gap-2.5 sm:gap-3">
          {visiblePictureCards.map(card => (
            <button
              key={card.id}
              type="button"
              onClick={() => onSelectSlotAction(card.title)}
              aria-label={`${card.title} (${card.provider})`}
              className="group relative aspect-[3/4] w-full rounded-xl overflow-hidden border border-gray-800 hover:border-amber-400 bg-slate-950 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-amber-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 cursor-pointer text-left"
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
                  <Sparkles className="w-5 h-5 text-amber-400 mb-1.5" />
                  <span className="text-[11px] font-bold text-white leading-tight line-clamp-2">
                    {card.title}
                  </span>
                  <span className="text-[10px] text-gray-400 mt-1">{card.provider}</span>
                </div>
              )}

              {/* Hover Play Overlay */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center p-2 text-center">
                <span className="w-10 h-10 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/40 mb-1.5 transform scale-90 group-hover:scale-100 transition-transform">
                  <Play className="w-4 h-4 fill-slate-950 ml-0.5" />
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

      {/* Slot Gallery Boards Below Individual Cards */}
      <div className="mt-5 pt-4 border-t border-gray-800/70 space-y-4">
        {visibleBoards.length > 0 && (
          <div
            role="button"
            tabIndex={0}
            onClick={() => onSelectSlotAction(visibleBoards[0].titleEn)}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelectSlotAction(visibleBoards[0].titleEn);
              }
            }}
            className="group relative rounded-xl overflow-hidden border border-gray-800 hover:border-amber-500/70 transition-all cursor-pointer bg-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          >
            <img
              src={visibleBoards[0].image}
              alt={visibleBoards[0].titleEn}
              referrerPolicy="no-referrer"
              className="w-full h-auto max-h-[360px] object-cover object-top transition-transform duration-300 group-hover:scale-[1.01]"
            />
            <div className="bg-gradient-to-t from-black/95 via-black/70 to-transparent p-4 sm:p-5 flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:absolute sm:inset-x-0 sm:bottom-0">
              <div className="space-y-1">
                <div className="text-xs text-amber-300 font-semibold">
                  {visibleBoards[0].optionTag} · {visibleBoards[0].gamesCount}
                </div>
                <h3 className="text-base sm:text-lg font-extrabold text-white">
                  {visibleBoards[0].titleBn} ({visibleBoards[0].titleEn})
                </h3>
                <p className="text-xs text-gray-300 line-clamp-1">
                  {visibleBoards[0].subtitle}
                </p>
              </div>
              <span className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 group-hover:bg-amber-400 text-slate-950 text-xs sm:text-sm font-extrabold whitespace-nowrap shrink-0 shadow-lg transition-colors">
                <Play className="w-4 h-4 fill-slate-950" />
                <span>স্লট খেলুন (Play Slot)</span>
                <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </div>
        )}

        {visibleBoards.length > 1 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {visibleBoards.slice(1).map(board => (
              <div
                key={board.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelectSlotAction(board.titleEn)}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectSlotAction(board.titleEn);
                  }
                }}
                className="group relative rounded-xl overflow-hidden border border-gray-800 hover:border-amber-500/70 bg-slate-950 transition-all cursor-pointer flex flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
              >
                <div className="relative w-full overflow-hidden bg-slate-900">
                  <img
                    src={board.image}
                    alt={board.titleEn}
                    referrerPolicy="no-referrer"
                    className="w-full h-48 sm:h-56 object-cover object-top transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 opacity-80 group-hover:opacity-90 transition-opacity" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-extrabold text-xs shadow-xl">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>খেলতে ক্লিক করুন (Play Now)</span>
                    </span>
                  </div>
                </div>

                <div className="p-3.5 flex items-center justify-between gap-3 bg-[#0f1624]">
                  <div className="min-w-0">
                    <div className="text-[11px] text-amber-400 font-semibold">
                      {board.optionTag} · {board.gamesCount}
                    </div>
                    <h3 className="text-sm font-bold text-white truncate mt-0.5">
                      {board.titleBn}
                    </h3>
                    <p className="text-[11px] text-gray-400 truncate mt-0.5">
                      {board.subtitle}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-slate-800 group-hover:bg-amber-500 text-amber-400 group-hover:text-slate-950 text-xs font-bold whitespace-nowrap shrink-0 transition-colors">
                    <Lock className="w-3.5 h-3.5" />
                    <span>খেলুন</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
