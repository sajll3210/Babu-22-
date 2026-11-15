import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Volume2, VolumeX, Sparkles, RefreshCw, Zap, Trophy, HelpCircle, Heart, Star, Moon, Sun, Wand2, Flame } from 'lucide-react';
import { GameItem } from '../../types';
import { sound } from '../../utils/audio';

interface StarlightPrincessGameProps {
  game?: GameItem;
  balance: number;
  onUpdateBalance: (amount: number, reason: string) => void;
  onClose: () => void;
  onOpenDeposit?: () => void;
}

interface StarlightSymbol {
  id: string;
  nameBn: string;
  nameEn: string;
  icon: string;
  color: string;
  bgGrad: string;
  basePayout: number; // 8-9 hits
  payout10: number;   // 10-11 hits
  payout12: number;   // 12+ hits
  isScatter?: boolean;
}

interface MultiplierHeart {
  val: number;
  color: string;
}

const STARLIGHT_SYMBOLS: StarlightSymbol[] = [
  {
    id: 'sun',
    nameBn: 'গোল্ডেন সান',
    nameEn: 'Sun Emblem',
    icon: '☀️',
    color: 'text-amber-300',
    bgGrad: 'from-amber-600/40 via-yellow-500/30 to-amber-900/40 border-amber-400',
    basePayout: 10,
    payout10: 25,
    payout12: 50,
  },
  {
    id: 'heart_gem',
    nameBn: 'ম্যাজিক হার্ট',
    nameEn: 'Heart Gem',
    icon: '💖',
    color: 'text-pink-300',
    bgGrad: 'from-pink-600/40 via-rose-500/30 to-fuchsia-900/40 border-pink-400',
    basePayout: 2.5,
    payout10: 10,
    payout12: 25,
  },
  {
    id: 'moon',
    nameBn: 'ক্রিসেন্ট মুন',
    nameEn: 'Moon Crest',
    icon: '🌙',
    color: 'text-indigo-200',
    bgGrad: 'from-indigo-600/40 via-purple-500/30 to-blue-900/40 border-indigo-400',
    basePayout: 2,
    payout10: 5,
    payout12: 15,
  },
  {
    id: 'star',
    nameBn: 'স্টার চার্ম',
    nameEn: 'Star Charm',
    icon: '⭐',
    color: 'text-yellow-300',
    bgGrad: 'from-yellow-500/40 via-amber-400/30 to-orange-900/40 border-yellow-400',
    basePayout: 1.5,
    payout10: 2,
    payout12: 12,
  },
  {
    id: 'ruby',
    nameBn: 'রেড ক্রিস্টাল',
    nameEn: 'Red Crystal',
    icon: '♦️',
    color: 'text-rose-400',
    bgGrad: 'from-rose-600/30 to-red-950/40 border-rose-400',
    basePayout: 1,
    payout10: 1.5,
    payout12: 10,
  },
  {
    id: 'blue_gem',
    nameBn: 'নীল ক্রিস্টাল',
    nameEn: 'Blue Crystal',
    icon: '🔷',
    color: 'text-sky-300',
    bgGrad: 'from-sky-600/30 to-cyan-950/40 border-sky-400',
    basePayout: 0.8,
    payout10: 1.2,
    payout12: 8,
  },
  {
    id: 'green_gem',
    nameBn: 'সবুজ পান্না',
    nameEn: 'Green Gem',
    icon: '🟢',
    color: 'text-emerald-300',
    bgGrad: 'from-emerald-600/30 to-teal-950/40 border-emerald-400',
    basePayout: 0.5,
    payout10: 1,
    payout12: 5,
  },
  {
    id: 'yellow_gem',
    nameBn: 'হলুদ জেম',
    nameEn: 'Yellow Gem',
    icon: '💛',
    color: 'text-amber-300',
    bgGrad: 'from-amber-600/30 to-yellow-950/40 border-amber-400',
    basePayout: 0.4,
    payout10: 0.9,
    payout12: 4,
  },
  {
    id: 'turquoise',
    nameBn: 'টার্কিশ জেম',
    nameEn: 'Turquoise Gem',
    icon: '💠',
    color: 'text-cyan-300',
    bgGrad: 'from-cyan-600/30 to-blue-950/40 border-cyan-400',
    basePayout: 0.25,
    payout10: 0.75,
    payout12: 2,
  },
];

const SCATTER_PRINCESS: StarlightSymbol = {
  id: 'princess_scatter',
  nameBn: 'স্টারলাইট প্রিন্সেস স্ক্যাটার',
  nameEn: 'Princess Scatter',
  icon: '👸',
  color: 'text-pink-300',
  bgGrad: 'from-pink-500/60 via-purple-400/50 to-indigo-600/60 border-pink-300',
  basePayout: 3,
  payout10: 5,
  payout12: 100,
  isScatter: true,
};

const getRandomSymbol = (): StarlightSymbol => {
  if (Math.random() < 0.05) return SCATTER_PRINCESS;
  return STARLIGHT_SYMBOLS[Math.floor(Math.random() * STARLIGHT_SYMBOLS.length)];
};

export const StarlightPrincessGame: React.FC<StarlightPrincessGameProps> = ({
  game,
  balance,
  onUpdateBalance,
  onClose,
  onOpenDeposit,
}) => {
  const is1000 = game?.id?.includes('1000') || false;
  const isVip = game?.id?.includes('vip') || false;
  const maxWinMultiplier = is1000 ? 15000 : isVip ? 25000 : 5000;

  // 6 Columns x 5 Rows = 30 Cells
  const [grid, setGrid] = useState<StarlightSymbol[][]>(() =>
    Array.from({ length: 6 }).map(() =>
      Array.from({ length: 5 }).map(() => getRandomSymbol())
    )
  );

  const [betAmount, setBetAmount] = useState<number>(20);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [isTumbling, setIsTumbling] = useState<boolean>(false);
  const [winningCells, setWinningCells] = useState<{ col: number; row: number }[]>([]);
  const [tumbleRoundWin, setTumbleRoundWin] = useState<number>(0);
  const [currentRoundMultipliers, setCurrentRoundMultipliers] = useState<MultiplierHeart[]>([]);
  const [lastWin, setLastWin] = useState<number>(0);

  // Free Spins Mode
  const [freeSpinsLeft, setFreeSpinsLeft] = useState<number>(0);
  const [totalFreeSpinWin, setTotalFreeSpinWin] = useState<number>(0);
  const [cumulativeMultiplier, setCumulativeMultiplier] = useState<number>(0);
  const [isBonusRound, setIsBonusRound] = useState<boolean>(false);

  // Princess Animation
  const [princessWandActive, setPrincessWandActive] = useState<boolean>(false);

  // Settings
  const [isTurbo, setIsTurbo] = useState<boolean>(false);
  const [autoSpinCount, setAutoSpinCount] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [showPaytable, setShowPaytable] = useState<boolean>(false);
  const [celebrationMessage, setCelebrationMessage] = useState<string | null>(null);

  // Auto spin loop
  useEffect(() => {
    if (autoSpinCount > 0 && !isSpinning && !isTumbling) {
      const delay = isTurbo ? 250 : 800;
      const timer = setTimeout(() => {
        handleSpin();
        setAutoSpinCount(c => c - 1);
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [autoSpinCount, isSpinning, isTumbling]);

  // Free spins loop
  useEffect(() => {
    if (freeSpinsLeft > 0 && !isSpinning && !isTumbling) {
      const timer = setTimeout(() => {
        handleSpin(true);
      }, isTurbo ? 400 : 1200);
      return () => clearTimeout(timer);
    } else if (freeSpinsLeft === 0 && isBonusRound && !isSpinning && !isTumbling) {
      setIsBonusRound(false);
      setCelebrationMessage(`✨ স্টারলাইট ফ্রি স্পিন বোনাস শেষ! মোট জয়: ৳ ${totalFreeSpinWin.toLocaleString('en-US')}`);
      sound.playJackpot();
    }
  }, [freeSpinsLeft, isBonusRound, isSpinning, isTumbling]);

  // Princess Wand Multiplier Orb Strike
  const triggerPrincessWand = useCallback(() => {
    setPrincessWandActive(true);
    if (soundEnabled) sound.playMagicWand();

    let orbVal = 2;
    const r = Math.random();
    if (is1000) {
      if (r < 0.38) orbVal = [2, 3, 4, 5][Math.floor(Math.random() * 4)];
      else if (r < 0.7) orbVal = [10, 15, 20, 25][Math.floor(Math.random() * 4)];
      else if (r < 0.9) orbVal = [50, 100, 250][Math.floor(Math.random() * 3)];
      else if (r < 0.97) orbVal = 500;
      else orbVal = 1000; // Legendary 1000x multiplier!
    } else {
      if (r < 0.5) orbVal = [2, 3, 4, 5][Math.floor(Math.random() * 4)];
      else if (r < 0.8) orbVal = [10, 15, 20, 25][Math.floor(Math.random() * 4)];
      else if (r < 0.95) orbVal = [50, 100][Math.floor(Math.random() * 2)];
      else orbVal = [250, 500][Math.floor(Math.random() * 2)];
    }

    const orbColor =
      orbVal >= 500
        ? 'from-amber-400 via-yellow-300 to-rose-500 text-slate-950 shadow-yellow-400/80 ring-2 ring-yellow-200'
        : orbVal >= 50
        ? 'from-purple-500 to-pink-500 text-white shadow-fuchsia-500/80'
        : orbVal >= 10
        ? 'from-sky-500 to-blue-600 text-white shadow-sky-500/70'
        : 'from-emerald-400 to-teal-500 text-slate-950 shadow-emerald-400/70';

    setCurrentRoundMultipliers(prev => [...prev, { val: orbVal, color: orbColor }]);

    setTimeout(() => {
      setPrincessWandActive(false);
    }, 900);
  }, [is1000, soundEnabled]);

  // Spin Reels handler
  const handleSpin = (isFreeSpin = false) => {
    if (isSpinning || isTumbling) return;

    if (!isFreeSpin) {
      if (balance < betAmount) {
        setAutoSpinCount(0);
        if (onOpenDeposit) onOpenDeposit();
        return;
      }
      onUpdateBalance(-betAmount, `${game?.titleEn || 'Starlight Princess'} স্পিন`);
    } else {
      setFreeSpinsLeft(prev => prev - 1);
    }

    setIsSpinning(true);
    setWinningCells([]);
    setTumbleRoundWin(0);
    setCelebrationMessage(null);
    setCurrentRoundMultipliers([]);
    if (soundEnabled) sound.playClick();

    setTimeout(() => {
      const newGrid = Array.from({ length: 6 }).map(() =>
        Array.from({ length: 5 }).map(() => getRandomSymbol())
      );
      setGrid(newGrid);
      setIsSpinning(false);

      // Princess magic wand strike chance
      const magicChance = isFreeSpin ? 0.45 : 0.25;
      if (Math.random() < magicChance) {
        triggerPrincessWand();
      }

      // Check for 4+ Princess Scatters (Free Spins Trigger)
      let scatterCount = 0;
      newGrid.forEach(col => {
        col.forEach(s => {
          if (s.isScatter) scatterCount++;
        });
      });

      if (scatterCount >= 4) {
        const scatterPayout = scatterCount >= 6 ? 100 : scatterCount === 5 ? 5 : 3;
        const scatterWin = betAmount * scatterPayout;
        onUpdateBalance(scatterWin, 'স্টারলাইট প্রিন্সেস স্ক্যাটার জয়');
        setFreeSpinsLeft(prev => prev + 15);
        setIsBonusRound(true);
        setCelebrationMessage(`✨ প্রিন্সেস ৪+ স্ক্যাটার! ১৫টি ফ্রি স্পিন আনলক! (+৳ ${scatterWin})`);
        if (soundEnabled) sound.playJackpot();
      }

      // Start tumble evaluation
      evaluateTumble(newGrid, isFreeSpin);
    }, isTurbo ? 250 : 650);
  };

  // Evaluate Tumbles (Scatter pays 8+ anywhere)
  const evaluateTumble = (currentGrid: StarlightSymbol[][], isFreeSpin: boolean) => {
    setIsTumbling(true);

    const counts: Record<string, { count: number; def: StarlightSymbol; cells: { col: number; row: number }[] }> = {};

    currentGrid.forEach((col, cIdx) => {
      col.forEach((sym, rIdx) => {
        if (sym.isScatter) return;
        if (!counts[sym.id]) {
          counts[sym.id] = { count: 0, def: sym, cells: [] };
        }
        counts[sym.id].count++;
        counts[sym.id].cells.push({ col: cIdx, row: rIdx });
      });
    });

    const winningHits = Object.values(counts).filter(item => item.count >= 8);

    if (winningHits.length > 0) {
      let winForTumble = 0;
      const highlightCells: { col: number; row: number }[] = [];

      winningHits.forEach(hit => {
        highlightCells.push(...hit.cells);
        let mult = hit.def.basePayout;
        if (hit.count >= 12) mult = hit.def.payout12;
        else if (hit.count >= 10) mult = hit.def.payout10;

        winForTumble += betAmount * mult;
      });

      setWinningCells(highlightCells);
      setTumbleRoundWin(prev => prev + winForTumble);
      if (soundEnabled) sound.playWinChime();

      setTimeout(() => {
        const nextGrid: StarlightSymbol[][] = currentGrid.map((col, cIdx) => {
          const surviving = col.filter((_, rIdx) => !highlightCells.some(h => h.col === cIdx && h.row === rIdx));
          const missingCount = 5 - surviving.length;
          const fresh = Array.from({ length: missingCount }).map(() => getRandomSymbol());
          return [...fresh, ...surviving];
        });

        setGrid(nextGrid);
        setWinningCells([]);

        if (Math.random() < 0.2) {
          triggerPrincessWand();
        }

        setTimeout(() => {
          evaluateTumble(nextGrid, isFreeSpin);
        }, isTurbo ? 200 : 500);
      }, isTurbo ? 350 : 700);
    } else {
      finishRound(isFreeSpin);
    }
  };

  const finishRound = (isFreeSpin: boolean) => {
    setIsTumbling(false);

    setTumbleRoundWin(roundWin => {
      if (roundWin > 0) {
        const orbsSum = currentRoundMultipliers.reduce((acc, orb) => acc + orb.val, 0);
        let finalMult = orbsSum > 0 ? orbsSum : 1;

        if (isFreeSpin) {
          if (orbsSum > 0) {
            setCumulativeMultiplier(prev => {
              const newCumul = prev + orbsSum;
              finalMult = newCumul;
              return newCumul;
            });
          } else if (cumulativeMultiplier > 0) {
            finalMult = cumulativeMultiplier;
          }
        }

        const totalPayout = Math.min(roundWin * finalMult, betAmount * maxWinMultiplier);
        setLastWin(totalPayout);
        onUpdateBalance(totalPayout, `${game?.titleEn || 'Starlight Princess'} জয় (${finalMult}x)`);

        if (isFreeSpin) {
          setTotalFreeSpinWin(prev => prev + totalPayout);
        }

        if (finalMult >= 50 || totalPayout >= betAmount * 25) {
          sound.playJackpot();
        }

        return 0;
      }
      return 0;
    });
  };

  // Buy Free Spins Feature (100x bet)
  const handleBuyBonus = () => {
    if (isSpinning || isTumbling || isBonusRound) return;
    const cost = betAmount * 100;
    if (balance < cost) {
      if (onOpenDeposit) onOpenDeposit();
      return;
    }
    onUpdateBalance(-cost, 'প্রিন্সেস ফ্রি স্পিন ফিচার ক্রয় (100x)');
    setFreeSpinsLeft(15);
    setIsBonusRound(true);
    setCumulativeMultiplier(0);
    setTotalFreeSpinWin(0);
    setCelebrationMessage('✨ স্টারলাইট প্যালেস বোনাস সক্রিয়! ১৫টি ফ্রি স্পিন শুরু হচ্ছে!');
    sound.playJackpot();
  };

  const activeMultiplierSum = currentRoundMultipliers.reduce((acc, o) => acc + o.val, 0);

  return (
    <div className="flex flex-col h-full bg-[#10061e] text-white select-none overflow-y-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between px-3 sm:px-6 py-2.5 bg-[#1a0b33] border-b border-fuchsia-500/40 shrink-0 sticky top-0 z-30 shadow-lg">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-200 bg-purple-950/80 hover:bg-purple-900 rounded-xl transition-colors active:scale-95 border border-purple-700/60"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">লবিতে ফিরুন</span>
            <span className="sm:hidden">লবি</span>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-sm sm:text-base text-fuchsia-300 tracking-wide font-sans">
                {game?.titleEn || 'Starlight Princess'}
              </span>
              <span className="text-[10px] font-black text-slate-950 bg-gradient-to-r from-fuchsia-400 via-pink-300 to-amber-300 px-2 py-0.5 rounded-full uppercase tracking-wider">
                {is1000 ? '1000x MULT' : isVip ? 'VIP EXCLUSIVE' : 'PRAGMATIC'}
              </span>
            </div>
            <div className="text-[10px] text-fuchsia-300/80 flex items-center gap-1">
              <span>{is1000 ? 'ম্যাক্স উইন ১৫,০০০x' : 'ম্যাক্স উইন ৫,০০০x'}</span>
              <span>•</span>
              <span className="text-emerald-400">RTP 96.5%</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setShowPaytable(!showPaytable)}
            className="p-1.5 text-gray-400 hover:text-fuchsia-300 rounded-lg hover:bg-purple-950 transition-colors"
            title="পে-টেবিল"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-purple-950 transition-colors"
            title={soundEnabled ? 'সাউন্ড বন্ধ করুন' : 'সাউন্ড চালু করুন'}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-gray-500" />
            )}
          </button>
          {/* Balance Widget */}
          <div className="flex items-center gap-2 pl-2 border-l border-purple-900/60">
            <div className="text-right">
              <div className="text-[10px] text-gray-400">ব্যালেন্স</div>
              <div className="text-xs sm:text-sm font-black text-amber-400 font-mono tabular-nums">
                ৳ {balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            {onOpenDeposit && (
              <button
                onClick={onOpenDeposit}
                className="px-2.5 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-md active:scale-95 transition-all"
              >
                +
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Arena */}
      <div className="flex-1 max-w-6xl w-full mx-auto p-3 sm:p-5 flex flex-col justify-between">
        {/* Top Status Bar: Free Spins / Multipliers */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
          {/* Free Spins Indicator */}
          <div className="p-2 sm:p-2.5 rounded-2xl bg-gradient-to-r from-fuchsia-950/80 to-purple-900/60 border border-fuchsia-500/40 flex items-center justify-between">
            <div className="text-[11px] text-fuchsia-300">ফ্রি স্পিন বাকি:</div>
            <div className="text-base font-black text-amber-400 font-mono">
              {freeSpinsLeft > 0 ? `${freeSpinsLeft} টি` : '০'}
            </div>
          </div>

          {/* Active Round Multiplier Orb */}
          <div className="p-2 sm:p-2.5 rounded-2xl bg-gradient-to-r from-amber-950/80 to-pink-950/60 border border-amber-500/40 flex items-center justify-between">
            <div className="text-[11px] text-amber-300">রাউন্ড গুণক:</div>
            <div className="text-base font-black text-amber-400 font-mono">
              {activeMultiplierSum > 0 ? `${activeMultiplierSum}x` : '1x'}
            </div>
          </div>

          {/* Cumulative Bonus Multiplier */}
          <div className="p-2 sm:p-2.5 rounded-2xl bg-gradient-to-r from-pink-950/80 to-purple-950/60 border border-pink-500/40 flex items-center justify-between">
            <div className="text-[11px] text-pink-300">মোট কিউমুলেটিভ:</div>
            <div className="text-base font-black text-pink-300 font-mono">
              {cumulativeMultiplier > 0 ? `${cumulativeMultiplier}x` : '0x'}
            </div>
          </div>

          {/* Last Win Amount */}
          <div className="p-2 sm:p-2.5 rounded-2xl bg-gradient-to-r from-emerald-950/80 to-teal-900/60 border border-emerald-500/40 flex items-center justify-between">
            <div className="text-[11px] text-emerald-300">সর্বশেষ জয়:</div>
            <div className="text-base font-black text-emerald-400 font-mono">
              ৳ {lastWin.toLocaleString('en-US')}
            </div>
          </div>
        </div>

        {/* Celebration Announcement */}
        {celebrationMessage && (
          <div className="mb-3 py-2 px-4 rounded-2xl bg-gradient-to-r from-fuchsia-500 via-pink-400 to-amber-400 text-slate-950 font-black text-xs sm:text-sm text-center shadow-lg animate-bounce">
            {celebrationMessage}
          </div>
        )}

        {/* 6x5 Grid Stage with Celestial Princess Mascot */}
        <div className="relative flex flex-col lg:flex-row items-center justify-center gap-4 my-2">
          {/* Buy Free Spins Feature Button on Left */}
          <div className="hidden lg:flex flex-col gap-3 w-44">
            <button
              onClick={handleBuyBonus}
              disabled={isSpinning || isTumbling || isBonusRound}
              className="p-3 rounded-2xl bg-gradient-to-b from-fuchsia-500 via-pink-600 to-purple-700 hover:brightness-110 border-2 border-pink-300 text-white font-black text-xs shadow-xl active:scale-95 transition-all flex flex-col items-center justify-center text-center gap-1 disabled:opacity-50"
            >
              <Wand2 className="w-5 h-5 text-amber-300" />
              <span className="uppercase tracking-wider">ফ্রি স্পিন কিনুন</span>
              <span className="text-[11px] bg-slate-950 text-fuchsia-300 px-2 py-0.5 rounded-full font-mono mt-0.5 border border-fuchsia-500/50">
                ৳ {betAmount * 100}
              </span>
            </button>
            <div className="p-3 rounded-2xl bg-purple-950/60 border border-purple-800 text-[10px] text-purple-200/80 leading-relaxed text-center">
              ১৫টি ফ্রি স্পিনসহ প্রিন্সেস ম্যাজিক মাল্টিপ্লায়ার আনলক করুন
            </div>
          </div>

          {/* 6 Reels x 5 Rows Grid Box */}
          <div className="relative bg-gradient-to-b from-[#220c3a] via-[#140624] to-[#0a0214] rounded-3xl p-3 sm:p-4 border-2 border-fuchsia-500/60 shadow-2xl shadow-fuchsia-950/60">
            {/* Celestial Palace Header */}
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-fuchsia-500/30 text-[11px]">
              <span className="text-fuchsia-300 font-bold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                স্টারলাইট ৮+ স্ক্যাটার পে
              </span>
              <span className="text-purple-300/80 font-mono">
                {isTumbling ? 'টাম্বল হচ্ছে...' : isSpinning ? 'রিল ঘুরছে...' : 'স্পিন প্রস্তুত'}
              </span>
            </div>

            {/* Floating Multiplier Hearts Bar */}
            {currentRoundMultipliers.length > 0 && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 bg-slate-950/95 border border-pink-400 px-3 py-1 rounded-full shadow-xl animate-bounce">
                <span className="text-[10px] font-bold text-pink-300">ম্যাজিক হার্ট:</span>
                {currentRoundMultipliers.map((orb, i) => (
                  <span
                    key={i}
                    className={`text-xs font-black font-mono px-2 py-0.5 rounded-full bg-gradient-to-r ${orb.color}`}
                  >
                    {orb.val}x
                  </span>
                ))}
              </div>
            )}

            {/* 6 Columns of 5 Rows */}
            <div className="grid grid-cols-6 gap-1.5 sm:gap-2">
              {grid.map((col, cIdx) => (
                <div key={cIdx} className="flex flex-col gap-1.5 sm:gap-2">
                  {col.map((sym, rIdx) => {
                    const isWinning = winningCells.some(w => w.col === cIdx && w.row === rIdx);
                    return (
                      <div
                        key={rIdx}
                        className={`w-11 h-11 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-xl sm:rounded-2xl border flex flex-col items-center justify-center relative transition-all duration-200 ${
                          isWinning
                            ? 'bg-gradient-to-tr from-pink-400 to-amber-300 text-slate-950 scale-105 border-white shadow-[0_0_15px_#f472b6] z-10 animate-bounce'
                            : `bg-gradient-to-br ${sym.bgGrad}`
                        } ${isSpinning ? 'opacity-70 blur-[0.5px] scale-95' : 'scale-100'}`}
                      >
                        <span className="text-xl sm:text-3xl md:text-4xl drop-shadow-md">
                          {sym.icon}
                        </span>
                        <span
                          className={`text-[8px] sm:text-[10px] font-bold font-mono tracking-tight mt-0.5 truncate max-w-full px-1 ${
                            isWinning ? 'text-slate-950' : sym.color
                          }`}
                        >
                          {sym.nameEn}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Right Mascot: Celestial Anime Princess */}
          <div className="flex flex-col items-center justify-center p-3.5 rounded-3xl bg-gradient-to-b from-purple-950/50 via-pink-950/40 to-slate-950 border border-fuchsia-500/40 w-full sm:w-48 text-center relative overflow-hidden">
            {/* Princess Wand Avatar */}
            <div className="relative my-2">
              <div
                className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-tr from-fuchsia-500 via-pink-400 to-amber-300 border-4 ${
                  princessWandActive
                    ? 'border-yellow-200 shadow-[0_0_30px_#f472b6] scale-110'
                    : 'border-pink-300 shadow-xl'
                } flex items-center justify-center text-5xl sm:text-6xl transition-all duration-300`}
              >
                👸
              </div>
              {princessWandActive && (
                <div className="absolute inset-0 rounded-full border-2 border-pink-300 animate-ping pointer-events-none" />
              )}
            </div>

            <div className="font-bold text-pink-300 text-sm sm:text-base">
              স্টারলাইট প্রিন্সেস
            </div>
            <p className="text-[10px] text-gray-300 mt-1 leading-relaxed">
              ম্যাজিক লাঠি ঘুরিয়ে যেকোনো স্পিনে নামিয়ে আনেন ১,০০০x পর্যন্ত উইংড হার্ট মাল্টিপ্লায়ার!
            </p>

            <button
              onClick={handleBuyBonus}
              disabled={isSpinning || isTumbling || isBonusRound}
              className="lg:hidden mt-3 w-full py-2 px-3 rounded-xl bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white font-black text-xs shadow-md active:scale-95 transition-all disabled:opacity-50"
            >
              ফ্রি স্পিন কিনুন (৳{betAmount * 100})
            </button>
          </div>
        </div>

        {/* Controls Cockpit */}
        <div className="mt-3 bg-[#170a2a] p-3 sm:p-4 rounded-3xl border border-purple-900/60">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Bet Denomination Presets */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 w-full sm:w-auto">
              <span className="text-[11px] text-purple-300 font-semibold mr-1 shrink-0">বেট:</span>
              {[20, 50, 100, 250, 500, 1000].map(val => (
                <button
                  key={val}
                  onClick={() => setBetAmount(val)}
                  disabled={isSpinning || isTumbling}
                  className={`px-3 py-1.5 text-xs font-mono font-bold rounded-xl transition-all shrink-0 ${
                    betAmount === val
                      ? 'bg-gradient-to-r from-fuchsia-400 via-pink-400 to-amber-300 text-slate-950 shadow-md font-black scale-105'
                      : 'bg-purple-950 text-gray-300 hover:bg-purple-900 border border-purple-800'
                  }`}
                >
                  ৳{val}
                </button>
              ))}
            </div>

            {/* Action Buttons: Turbo + Auto + Main Spin */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {/* Turbo */}
              <button
                onClick={() => setIsTurbo(!isTurbo)}
                className={`py-3 px-3.5 rounded-2xl border text-xs font-bold transition-all flex items-center gap-1 ${
                  isTurbo
                    ? 'bg-fuchsia-500/20 border-fuchsia-400 text-fuchsia-300'
                    : 'bg-purple-950/80 border-purple-800 text-gray-400 hover:text-white'
                }`}
              >
                <Zap className={`w-4 h-4 ${isTurbo ? 'text-fuchsia-400 fill-fuchsia-400' : ''}`} />
                <span>টার্বো</span>
              </button>

              {/* Auto */}
              <button
                onClick={() => {
                  if (autoSpinCount > 0) setAutoSpinCount(0);
                  else setAutoSpinCount(10);
                }}
                className={`py-3 px-3.5 rounded-2xl border text-xs font-bold transition-all flex items-center gap-1 ${
                  autoSpinCount > 0
                    ? 'bg-pink-500/20 border-pink-500 text-pink-300'
                    : 'bg-purple-950/80 border-purple-800 text-gray-400 hover:text-white'
                }`}
              >
                <RefreshCw className={`w-4 h-4 ${autoSpinCount > 0 ? 'animate-spin text-pink-400' : ''}`} />
                <span>{autoSpinCount > 0 ? `অটো (${autoSpinCount})` : 'অটো'}</span>
              </button>

              {/* Big Spin Button */}
              <button
                onClick={() => handleSpin(false)}
                disabled={isSpinning || isTumbling || isBonusRound}
                className="flex-1 sm:flex-none px-8 py-3.5 bg-gradient-to-r from-fuchsia-500 via-pink-500 to-amber-400 hover:brightness-110 text-slate-950 font-black text-sm rounded-2xl shadow-xl shadow-fuchsia-500/30 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Sparkles className="w-5 h-5 text-slate-950 fill-slate-950" />
                <span>{isSpinning || isTumbling ? 'টাম্বল হচ্ছে...' : `স্পিন (৳${betAmount})`}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Paytable Modal */}
      {showPaytable && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#170a2a] border border-fuchsia-500/40 rounded-3xl max-w-lg w-full p-5 text-white shadow-2xl relative animate-fade-in max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-purple-800">
              <h3 className="font-bold text-base text-fuchsia-300 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                <span>Starlight Princess পে-টেবিল ও নিয়মাবলী</span>
              </h3>
              <button
                onClick={() => setShowPaytable(false)}
                className="text-xs px-2.5 py-1 bg-purple-950 hover:bg-purple-900 rounded-lg text-gray-300"
              >
                বন্ধ
              </button>
            </div>

            <div className="py-3 space-y-3 text-xs leading-relaxed text-gray-300">
              <p>
                • <strong>৮+ স্ক্যাটার পে:</strong> যেকোনো রিল ও সারিতে ৮টি বা ততোধিক একই প্রতীক থাকলে জয়ী হবেন।
              </p>
              <p>
                • <strong>টাম্বল ফিচার:</strong> জয়ী প্রতীকগুলো বিলুপ্ত হয় এবং ওপর থেকে নতুন প্রতীক পড়ে টানা জয়ের সুযোগ সৃষ্টি করে।
              </p>
              <p>
                • <strong>উইংড হার্ট মাল্টিপ্লায়ার:</strong> প্রিন্সেসের ম্যাজিক লাঠির স্পর্শে ২x থেকে ১,০০০x পর্যন্ত উইংড হার্ট ওর্ব পড়তে পারে।
              </p>
              <p>
                • <strong>ফ্রি স্পিন বোনাস:</strong> ৪ বা ততোধিক প্রিন্সেস স্ক্যাটার (👸) চিহ্নে ১৫টি ফ্রি স্পিন পাওয়া যায়।
              </p>
            </div>

            {/* Symbol Payout Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
              {[SCATTER_PRINCESS, ...STARLIGHT_SYMBOLS].map(s => (
                <div key={s.id} className="p-2.5 rounded-xl bg-purple-950/80 border border-purple-800 text-center">
                  <div className="text-2xl mb-1">{s.icon}</div>
                  <div className="font-bold text-white text-[11px] truncate">{s.nameEn}</div>
                  <div className="text-[10px] text-fuchsia-300 font-mono mt-0.5">
                    ১২+: {s.payout12}x | ৮-৯: {s.basePayout}x
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
