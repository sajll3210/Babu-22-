import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, Zap } from 'lucide-react';
import { HERO_BANNER, BABU22_LOGO, UNDER_7_COVER } from '../data/games';

interface HeroBannerProps {
  onOpenDeposit: () => void;
  onLaunchAviator: () => void;
  onOpenDailySpin: () => void;
  onLaunchBabu22?: () => void;
  onLaunchUnder7?: () => void;
  onLaunchOlympus?: () => void;
  onLaunchBigBass?: () => void;
  onLaunchStarlight?: () => void;
  onLaunchHades?: () => void;
  onLaunchFortuneTiger?: () => void;
  onLaunchFortuneGems?: () => void;
  onLaunchPlinko?: () => void;
  onLaunchDice?: () => void;
  onLaunchRodeo?: () => void;
  onLaunchGunsmith?: () => void;
  onLaunchCowboyCrash?: () => void;
  onLaunchAnuket?: () => void;
  onLaunchChargeBuffalo?: () => void;
  onLaunchSuperAce?: () => void;
}

const SLIDES = [
  {
    id: 0,
    badge: 'JILI কোড ৫৫৭ এক্সক্লুসিভ • ১,০২৪ WAYS',
    title: 'সুপার এস (Super Ace)',
    subtitle: 'গোল্ডেন কার্ডের ম্যাজিকাল জোকার রূপান্তর ও ফ্রি গেমসে দ্বিগুণ মাল্টিপ্লায়ার (x২, x৪, x৬, x১০) নিয়ে খেলুন!',
    ctaText: 'সুপার এস খেলুন',
    ctaAction: 'super_ace',
    highlight: '১,০২৪ Ways • x১০ মাল্টিপ্লায়ার',
  },
  {
    id: 1,
    badge: 'হট ৪,০৯৬ WAYS JILI & BABU22',
    title: 'চার্জ বাফেলো (Charge Buffalo)',
    subtitle: 'বুনো মহিষের স্ট্যাম্পিড চার্জ ও সানসেট ওয়াইল্ড মাল্টিপ্লায়ার (২x, ৩x, ৫x) কম্বিনেশনে লুফে নিন ১০,০০০x মেগা জ্যাকপট!',
    ctaText: 'বাফেলো খেলুন',
    ctaAction: 'charge_buffalo',
    highlight: '১০,০০০x মেগা জ্যাকপট',
  },
  {
    id: 1,
    badge: 'হট মিশরীয় মিথোলজি SPRIBE & JILI',
    title: 'ক্রাউন অফ অনুকেত (Crown of Anuket)',
    subtitle: 'নীলনদ বেয়ে স্বর্ণের নৌকায় ছুটুন অথবা ৬x৫ গ্রিডে পবিত্র মুকুট সংগ্রহ করে জিতুন ১০,০০০x মেগা জ্যাকপট!',
    ctaText: 'Anuket খেলুন',
    ctaAction: 'anuket',
    highlight: '১০,০০০x মেগা জ্যাকপট',
  },
  {
    id: 1,
    badge: 'হট ওয়েস্টার্ন ক্র্যাশ SPRIBE',
    title: 'কাউবয় ক্র্যাশ (Cowboy Crash)',
    subtitle: 'মুস্তাং ঘোড়ায় সওয়ার হয়ে ক্যানিয়নে ছুটুন ও ঘোড়া থামার পূর্বেই ৫,০০০x পর্যন্ত ক্যাশআউট করুন!',
    ctaText: 'Cowboy খেলুন',
    ctaAction: 'cowboy_crash',
    highlight: '৫,০০০x মেগা জ্যাকপট',
  },
  {
    id: 1,
    badge: 'হট আর্মারি বেটিং SPRIBE',
    title: 'গানস্মিথ আর্মারি বেটিং (Gunsmith)',
    subtitle: 'ট্যাকটিকাল অস্ত্রাগার থেকে রাইফেল ও স্নাইপার বেছে নিয়ে টার্গেট শুট করুন ও ৫০০x পর্যন্ত মেগা গুণক জিতুন!',
    ctaText: 'Gunsmith খেলুন',
    ctaAction: 'gunsmith',
    highlight: '৫০০x জ্যাকপট ভল্ট',
  },
  {
    id: 1,
    badge: 'হট রোডিও ক্র্যাশ বেটিং SPRIBE',
    title: 'রোডিও ক্র্যাশ (Rodeo Crash)',
    subtitle: 'ক্ষ্যাপাটে ষাঁড়ের পিঠে চেপে থাকুন ও ৫,০০০x পর্যন্ত মেগা গুণক নিয়ে ক্র্যাশের আগে ক্যাশআউট করুন!',
    ctaText: 'Rodeo খেলুন',
    ctaAction: 'rodeo',
    highlight: '৫,০০০x মেগা জ্যাকপট',
  },
  {
    id: 1,
    badge: 'হট ক্যাসিনো ডাইস SPRIBE',
    title: 'ডাইস বেটিং গেম (Dice)',
    subtitle: 'থ্রিডি ডাবল ডাইস ও হাই-লো স্লাইডারে জিতে নিন সর্বোচ্চ ৯৯০x পর্যন্ত মেগা জ্যাকপট!',
    ctaText: 'Dice খেলুন',
    ctaAction: 'dice',
    highlight: '৯৯০x মাল্টিপ্লায়ার',
  },
  {
    id: 1,
    badge: 'হট আর্কেড বেটিং SPRIBE',
    title: 'প্লিংকো বেটিং গেম (Plinko)',
    subtitle: 'বল ড্রপ করে পিরামিডের পিন দিয়ে জিতে নিন সর্বোচ্চ ১,০০০x মেগা মাল্টিপ্লায়ার জ্যাকপট!',
    ctaText: 'Plinko খেলুন',
    ctaAction: 'plinko',
    highlight: '১,০০০x জ্যাকপট',
  },
  {
    id: 1,
    badge: 'হট JILI এক্সক্লুসিভ স্লট',
    title: 'ফরচুন জেমস ৩ (Fortune Gems 3)',
    subtitle: 'গোল্ডেন গরুড়া ওয়াইল্ড, স্প্লিট সিম্বল এবং ৪র্থ মাল্টিপ্লায়ার হুইলে জিতে নিন ১০,০০০x মেগা জ্যাকপট!',
    ctaText: 'Fortune Gems 3 খেলুন',
    ctaAction: 'fortune_gems_3',
    highlight: '১৫x মাল্টিপ্লায়ার হুইল',
  },
  {
    id: 1,
    badge: 'এক্সক্লুসিভ রয়্যাল ক্যাসিনো',
    title: 'Babu22 রয়্যাল গোল্ডেন টেবিল',
    subtitle: 'ফোর এসিস (Four Aces) চ্যালেঞ্জে জিতে নিন ২,২২২x পর্যন্ত মেগা রয়্যাল জ্যাকপট!',
    ctaText: 'Babu22 খেলুন',
    ctaAction: 'babu22',
    highlight: '৯৯.২% RTP',
    customLogo: BABU22_LOGO,
  },
  {
    id: 2,
    badge: 'হট এশিয়ান স্লটস PG SOFT',
    title: 'ফরচুন টাইগার (Fortune Tiger)',
    subtitle: 'গোল্ডেন লাকি টাইগারের রিস্পিন ফিচার ও ১০x মাল্টিপ্লায়ার বুস্টে জিতে নিন ২,৫০০x মেগা উইন!',
    ctaText: 'Fortune Tiger খেলুন',
    ctaAction: 'fortune_tiger',
    highlight: '১০x ফুল গ্রিড মাল্টিপ্লায়ার',
  },
  {
    id: 2,
    badge: 'ডার্ক আন্ডারওয়ার্ল্ড স্লটস',
    title: 'গেটস অফ হেডিস (Gates of Hades)',
    subtitle: 'আন্ডারওয়ার্ল্ডের নরকরাজ হেডিসের বর্শা ও ৫০০x হেলফায়ার মাল্টিপ্লায়ার আনলক করুন!',
    ctaText: 'Hades খেলুন',
    ctaAction: 'hades',
    highlight: '৫০০x মাল্টিপ্লায়ার',
  },
  {
    id: 2,
    badge: 'ম্যাজিক স্লটস',
    title: 'স্টারলাইট প্রিন্সেস (Starlight Princess)',
    subtitle: 'পে-এনিহোয়ার টাম্বলিং রিল ও ৫০০x মাল্টিপ্লায়ার হার্টে জিতে নিন ১৫,০০০x মেগা উইন!',
    ctaText: 'Starlight খেলুন',
    ctaAction: 'starlight',
    highlight: '১৫,০০০x জ্যাকপট',
  },
  {
    id: 3,
    badge: 'হট ফিশিং স্লট',
    title: 'বিগ ব্যাস স্প্ল্যাশ (Big Bass)',
    subtitle: 'জেলেকে নিয়ে যান মাছ শিকারে! ফ্রি স্পিনে ক্যাশ ফিশ ও ১০x পর্যন্ত মেগা মাল্টিপ্লায়ার!',
    ctaText: 'Big Bass খেলুন',
    ctaAction: 'big_bass',
    highlight: 'ফিশারম্যান ওয়াইল্ড',
  },
  {
    id: 4,
    badge: 'জিউস ১০০০x মাল্টিপ্লায়ার',
    title: 'গেটস অফ অলিম্পাস ১০০০ (Zeus)',
    subtitle: 'বজ্রপাতের শক্তিতে আনলক করুন ১০০০x মাল্টিপ্লায়ার ও ১৫,০০০x পর্যন্ত মেগা উইন!',
    ctaText: 'Olympus খেলুন',
    ctaAction: 'olympus',
    highlight: '১০০০x মাল্টিপ্লায়ার',
  },
  {
    id: 5,
    badge: 'হট এক্সক্লুসিভ ডাইস',
    title: 'আন্ডার ৭ ওভার ৭ (7 UP DOWN)',
    subtitle: 'পাশার দান ঘুরিয়ে জিতে নিন ৬ গুণ পর্যন্ত মেগা জ্যাকপট!',
    ctaText: 'Under 7 খেলুন',
    ctaAction: 'under7',
    highlight: 'নতুন HOT গেম',
    customLogo: UNDER_7_COVER,
  },
  {
    id: 4,
    badge: 'মেগা অফার',
    title: 'প্রথম ডিপোজিটে ১০০% ওয়েলকাম বোনাস',
    subtitle: 'বিকাশ, নগদ ও রকেটে দ্রুত ডিপোজিট করুন এবং পান বিশেষ ভিআইপি ক্যাশব্যাক!',
    ctaText: 'ডিপোজিট করুন',
    ctaAction: 'deposit',
    highlight: 'ইনস্ট্যান্ট ক্যাশআউট',
  },
  {
    id: 5,
    badge: 'জনপ্রিয় ক্র্যাশ',
    title: 'এভিয়েটর স্প্রাইব (Aviator Crash)',
    subtitle: 'প্লেন উড়ে যাওয়ার আগেই ক্যাশআউট করুন এবং জিতুন ১০,০০০ গুণ পর্যন্ত!',
    ctaText: 'এভিয়েটর খেলুন',
    ctaAction: 'aviator',
    highlight: '১০,০০০x পর্যন্ত',
  },
  {
    id: 6,
    badge: 'দৈনিক ফ্রি স্পিন',
    title: 'লাকি হুইল স্পিন রিওয়ার্ড',
    subtitle: 'প্রতিদিন ফ্রি স্পিন ঘুরিয়ে জিতে নিন ক্যাশ প্রাইজ ও বোনাস পয়েন্ট!',
    ctaText: 'স্পিন করুন',
    ctaAction: 'spin',
    highlight: '১০০% ফ্রি',
  },
];

export const HeroBanner: React.FC<HeroBannerProps> = ({
  onOpenDeposit,
  onLaunchAviator,
  onOpenDailySpin,
  onLaunchBabu22,
  onLaunchUnder7,
  onLaunchOlympus,
  onLaunchBigBass,
  onLaunchStarlight,
  onLaunchHades,
  onLaunchFortuneTiger,
  onLaunchFortuneGems,
  onLaunchPlinko,
  onLaunchDice,
  onLaunchRodeo,
  onLaunchGunsmith,
  onLaunchCowboyCrash,
  onLaunchAnuket,
  onLaunchChargeBuffalo,
  onLaunchSuperAce,
}) => {
  const [currentSlide, setCurrentSlide] = useState<number>(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const slide = SLIDES[currentSlide];

  const handleCta = () => {
    if (slide.ctaAction === 'deposit') onOpenDeposit();
    else if (slide.ctaAction === 'super_ace') (onLaunchSuperAce ? onLaunchSuperAce() : onOpenDeposit());
    else if (slide.ctaAction === 'aviator') onLaunchAviator();
    else if (slide.ctaAction === 'charge_buffalo') (onLaunchChargeBuffalo ? onLaunchChargeBuffalo() : onOpenDeposit());
    else if (slide.ctaAction === 'anuket') (onLaunchAnuket ? onLaunchAnuket() : onOpenDeposit());
    else if (slide.ctaAction === 'babu22') (onLaunchBabu22 ? onLaunchBabu22() : onOpenDeposit());
    else if (slide.ctaAction === 'under7') (onLaunchUnder7 ? onLaunchUnder7() : onOpenDeposit());
    else if (slide.ctaAction === 'cowboy_crash') (onLaunchCowboyCrash ? onLaunchCowboyCrash() : onOpenDeposit());
    else if (slide.ctaAction === 'gunsmith') (onLaunchGunsmith ? onLaunchGunsmith() : onOpenDeposit());
    else if (slide.ctaAction === 'rodeo') (onLaunchRodeo ? onLaunchRodeo() : onOpenDeposit());
    else if (slide.ctaAction === 'dice') (onLaunchDice ? onLaunchDice() : onOpenDeposit());
    else if (slide.ctaAction === 'plinko') (onLaunchPlinko ? onLaunchPlinko() : onOpenDeposit());
    else if (slide.ctaAction === 'fortune_gems_3') (onLaunchFortuneGems ? onLaunchFortuneGems() : onOpenDeposit());
    else if (slide.ctaAction === 'hades') (onLaunchHades ? onLaunchHades() : onOpenDeposit());
    else if (slide.ctaAction === 'fortune_tiger') (onLaunchFortuneTiger ? onLaunchFortuneTiger() : onOpenDeposit());
    else if (slide.ctaAction === 'olympus') (onLaunchOlympus ? onLaunchOlympus() : onOpenDeposit());
    else if (slide.ctaAction === 'big_bass') (onLaunchBigBass ? onLaunchBigBass() : onOpenDeposit());
    else if (slide.ctaAction === 'starlight') (onLaunchStarlight ? onLaunchStarlight() : onOpenDeposit());
    else onOpenDailySpin();
  };

  return (
    <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden border border-gray-800 shadow-2xl bg-[#090d16] my-4">
      {/* Background Graphic Asset with measured scrim */}
      <div className="absolute inset-0 bg-slate-950 overflow-hidden">
        <img
          src={HERO_BANNER}
          alt="Babu22 Casino Banner"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover opacity-35 sm:opacity-45 scale-105 transition-transform duration-1000 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#090d16] via-[#090d16]/85 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#090d16] via-transparent to-black/20" />
      </div>

      {/* Slide Content */}
      <div className="relative z-10 p-5 sm:p-8 lg:p-10 flex flex-col justify-between min-h-[220px] sm:min-h-[260px] max-w-2xl">
        <div>
          {/* Subtle text kicker / category */}
          <div className="flex items-center gap-2 text-xs text-amber-400 font-semibold mb-2">
            <Zap className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>{slide.badge}</span>
            <span aria-hidden="true" className="text-gray-500">•</span>
            <span className="text-emerald-400">{slide.highlight}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight [text-wrap:balance]">
            {slide.title}
          </h1>

          <p className="text-xs sm:text-sm text-gray-300 mt-2 max-w-lg leading-relaxed [text-wrap:balance]">
            {slide.subtitle}
          </p>
        </div>

        {/* Right side floating emblem if slide has custom logo */}
        {slide.customLogo && (
          <div className="hidden sm:flex absolute right-8 top-1/2 -translate-y-1/2 z-10 items-center justify-center pointer-events-none">
            <img
              src={slide.customLogo}
              alt="Promotion Emblem"
              className="w-28 h-28 lg:w-36 lg:h-36 rounded-2xl object-cover border-2 border-amber-400/90 shadow-2xl shadow-amber-500/50"
            />
          </div>
        )}

        {/* CTA and Dots Row */}
        <div className="mt-5 flex items-center gap-4">
          <button
            onClick={handleCta}
            className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-amber-500/25 active:scale-95 transition-all flex items-center gap-1.5"
          >
            <span>{slide.ctaText}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenDailySpin}
            className="px-4 py-2.5 bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-gray-200 font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>দৈনিক স্পিন</span>
          </button>

          {/* Dots Indicator */}
          <div className="ml-auto flex items-center gap-1.5">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={`h-1.5 rounded-full transition-all ${
                  currentSlide === i ? 'w-6 bg-amber-400' : 'w-2 bg-gray-700 hover:bg-gray-500'
                }`}
                title={`স্লাইড ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
