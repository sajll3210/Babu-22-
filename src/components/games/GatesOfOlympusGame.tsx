import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, Volume2, VolumeX, Sparkles, Zap, RefreshCw, Trophy, HelpCircle, Flame, ShieldCheck, ChevronRight } from 'lucide-react';
import { GameItem } from '../../types';
import { sound } from '../../utils/audio';

interface GatesOfOlympusGameProps {
  game?: GameItem;
  balance: number;
  onUpdateBalance: (amount: number, reason: string) => void;
  onClose: () => void;
  onOpenDeposit?: () => void;
}

interface SymbolDef {
  id: string;
  nameBn: string;
  nameEn: string;
  icon: string;
  color: string;
  bgGrad: string;
  basePayout: number; // for 8-9 symbols
  payout10: number;   // for 10-11 symbols
  payout12: number;   // for 12+ symbols
  isScatter?: boolean;
}

interface MultiplierOrb {
  val: number;
  color: string;
}

const OLYMPUS_SYMBOLS: SymbolDef[] = [
  {
    id: 'crown',
    nameBn: 'গোল্ডেন ক্রাউন',
    nameEn: 'Crown',
    icon: '👑',
    color: 'text-amber-300',
    bgGrad: 'from-amber-600/30 to-yellow-900/40 border-amber-400',
    basePayout: 10,
    payout10: 25,
    payout12: 50,
  },
  {
    id: 'hourglass',
    nameBn: 'আওয়ারগ্লাস',
    nameEn: 'Hourglass',
    icon: '⏳',
    color: 'text-cyan-300',
    bgGrad: 'from-cyan-600/30 to-blue-900/40 border-cyan-400',
    basePayout: 2.5,
    payout10: 10,
    payout12: 25,
  },
  {
    id: 'ring',
    nameBn: 'রয়্যাল রিং',
    nameEn: 'Ring',
    icon: '💍',
    color: 'text-purple-300',
    bgGrad: 'from-purple-600/30 to-fuchsia-900/40 border-purple-400',
    basePayout: 2,
    payout10: 5,
    payout12: 15,
  },
  {
    id: 'chalice',
    nameBn: 'গোল্ডেন কাপ',
    nameEn: 'Chalice',
    icon: '🏆',
    color: 'text-yellow-300',
    bgGrad: 'from-yellow-600/30 to-amber-900/40 border-yellow-400',
    basePayout: 1.5,
    payout10: 2,
    payout12: 12,
  },
  {
    id: 'ruby',
    nameBn: 'রেড রুবি',
    nameEn: 'Red Gem',
    icon: '♦️',
    color: 'text-rose-400',
    bgGrad: 'from-rose-600/30 to-red-900/40 border-rose-400',
    basePayout: 1,
    payout10: 1.5,
    payout12: 10,
  },
  {
    id: 'purple_gem',
    nameBn: 'পার্পল জেম',
    nameEn: 'Purple Gem',
    icon: '🔮',
    color: 'text-fuchsia-400',
    bgGrad: 'from-fuchsia-600/30 to-purple-900/40 border-fuchsia-400',
    basePayout: 0.8,
    payout10: 1.2,
    payout12: 8,
  },
  {
    id: 'yellow_gem',
    nameBn: 'টোপাজ জেম',
    nameEn: 'Yellow Gem',
    icon: '💛',
    color: 'text-amber-400',
    bgGrad: 'from-amber-600/30 to-yellow-900/40 border-amber-400',
    basePayout: 0.5,
    payout10: 1,
    payout12: 5,
  },
  {
    id: 'green_gem',
    nameBn: 'পান্না জেম',
    nameEn: 'Green Gem',
    icon: '💚',
    color: 'text-emerald-400',
    bgGrad: 'from-emerald-600/30 to-teal-900/40 border-emerald-400',
    basePayout: 0.4,
    payout10: 0.9,
    payout12: 4,
  },
  {
    id: 'blue_gem',
    nameBn: 'নীল জেম',
    nameEn: 'Blue Gem',
    icon: '💎',
    color: 'text-sky-400',
    bgGrad: 'from-sky-600/30 to-indigo-900/40 border-sky-400',
    basePayout: 0.25,
    payout10: 0.75,
    payout12: 2,
  },
];

const SCATTER_ZEUS: SymbolDef = {
  id: 'zeus_scatter',
  nameBn: 'জিউস স্ক্যাটার',
  nameEn: 'Zeus Scatter',
  icon: '⚡',
  color: 'text-amber-300',
  bgGrad: 'from-amber-500/50 via-yellow-400/40 to-amber-600/50 border-amber-300',
  basePayout: 3,
  payout10: 5,
  payout12: 100,
  isScatter: true,
};

// Generates random symbol (with rare scatter chance)
const getRandomSymbol = (): SymbolDef => {
  if (Math.random() < 0.05) return SCATTER_ZEUS;
  return OLYMPUS_SYMBOLS[Math.floor(Math.random() * OLYMPUS_SYMBOLS.length)];
};

export const GatesOfOlympusGame: React.FC<GatesOfOlympusGameProps> = ({
  game,
  balance,
  onUpdateBalance,
  onClose,
  onOpenDeposit,
}) => {
  const is1000 = game?.id?.includes('1000') || false;
  const isVip = game?.id?.includes('vip') || false;
  const maxWinMultiplier = is1000 ? 15000 : isVip ? 25000 : 5000;

  // Grid dimensions: 6 reels x 5 rows = 30 slots
  const [grid, setGrid] = useState<SymbolDef[][]>(() =>
    Array.from({ length: 6 }).map(() =>
      Array.from({ length: 5 }).map(() => getRandomSymbol())
    )
  );

  const [betAmount, setBetAmount] = useState<number>(20);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [isTumbling, setIsTumbling] = useState<boolean>(false);
  const [winningCells, setWinningCells] = useState<{ col: number; row: number }[]>([]);
  const [tumbleRoundWin, setTumbleRoundWin] = useState<number>(0);
  const [currentRoundMultipliers, setCurrentRoundMultipliers] = useState<MultiplierOrb[]>([]);
  const [lastWin, setLastWin] = useState<number>(0);

  // Free Spins Mode
  const [freeSpinsLeft, setFreeSpinsLeft] = useState<number>(0);
  const [totalFreeSpinWin, setTotalFreeSpinWin] = useState<number>(0);
  const [cumulativeMultiplier, setCumulativeMultiplier] = useState<number>(0);
  const [isBonusRound, setIsBonusRound] = useState<boolean>(false);

  // Settings
  const [isTurbo, setIsTurbo] = useState<boolean>(false);
  const [autoSpinCount, setAutoSpinCount] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [showPaytable, setShowPaytable] = useState<boolean>(false);
  const [zeusLightningActive, setZeusLightningActive] = useState<boolean>(false);
  const [celebrationMessage, setCelebrationMessage] = useState<string | null>(null);

  // Auto spin trigger
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

  // Free spins auto loop
  useEffect(() => {
    if (freeSpinsLeft > 0 && !isSpinning && !isTumbling) {
      const timer = setTimeout(() => {
        handleSpin(true);
      }, isTurbo ? 400 : 1200);
      return () => clearTimeout(timer);
    } else if (freeSpinsLeft === 0 && isBonusRound && !isSpinning && !isTumbling) {
      // Bonus round finished
      setIsBonusRound(false);
      setCelebrationMessage(`ফ্রি স্পিন বোনাস শেষ! মোট জয়: ৳ ${totalFreeSpinWin.toLocaleString('en-US')}`);
      sound.playJackpot();
    }
  }, [freeSpinsLeft, isBonusRound, isSpinning, isTumbling]);

  // Zeus random lightning strike during spins or tumbles
  const triggerZeusLightning = useCallback(() => {
    setZeusLightningActive(true);
    if (soundEnabled) sound.playThunder();

    // Orb options
    let orbVal = 2;
    const r = Math.random();
    if (is1000) {
      if (r < 0.4) orbVal = [2, 3, 4, 5][Math.floor(Math.random() * 4)];
      else if (r < 0.7) orbVal = [10, 15, 20, 25][Math.floor(Math.random() * 4)];
      else if (r < 0.9) orbVal = [50, 100, 250][Math.floor(Math.random() * 3)];
      else if (r < 0.97) orbVal = 500;
      else orbVal = 1000; // Legendary 1000x multiplier orb!
    } else {
      if (r < 0.5) orbVal = [2, 3, 4, 5][Math.floor(Math.random() * 4)];
      else if (r < 0.8) orbVal = [10, 15, 20, 25][Math.floor(Math.random() * 4)];
      else if (r < 0.95) orbVal = [50, 100][Math.floor(Math.random() * 2)];
      else orbVal = [250, 500][Math.floor(Math.random() * 2)];
    }

    const orbColor =
      orbVal >= 500
        ? 'from-red-600 via-rose-500 to-yellow-400 text-white shadow-rose-500/80 ring-2 ring-yellow-300'
        : orbVal >= 50
        ? 'from-purple-600 to-pink-500 text-white shadow-purple-500/80'
        : orbVal >= 10
        ? 'from-blue-600 to-cyan-400 text-white shadow-blue-500/70'
        : 'from-emerald-500 to-teal-400 text-slate-950 shadow-emerald-500/70';

    setCurrentRoundMultipliers(prev => [...prev, { val: orbVal, color: orbColor }]);
    if (soundEnabled) sound.playZeusMultiplier();

    setTimeout(() => {
      setZeusLightningActive(false);
    }, 900);
  }, [is1000, soundEnabled]);

  // Main Spin Handler
  const handleSpin = (isFreeSpin = false) => {
    if (isSpinning || isTumbling) return;

    if (!isFreeSpin) {
      if (balance < betAmount) {
        setAutoSpinCount(0);
        if (onOpenDeposit) onOpenDeposit();
        return;
      }
      onUpdateBalance(-betAmount, `${game?.titleEn || 'Gates of Olympus'} স্পিন`);
    } else {
      setFreeSpinsLeft(prev => prev - 1);
    }

    setIsSpinning(true);
    setWinningCells([]);
    setTumbleRoundWin(0);
    setCelebrationMessage(null);
    setCurrentRoundMultipliers([]);
    if (soundEnabled) sound.playClick();

    // Drop new grid
    setTimeout(() => {
      const newGrid = Array.from({ length: 6 }).map(() =>
        Array.from({ length: 5 }).map(() => getRandomSymbol())
      );
      setGrid(newGrid);
      setIsSpinning(false);

      // Check for Zeus Lightning strike chance
      const lightningChance = isFreeSpin ? 0.45 : 0.25;
      if (Math.random() < lightningChance) {
        triggerZeusLightning();
      }

      // Check for Scatter Zeus Free Spin Trigger (4+ Scatters)
      let scatterCount = 0;
      newGrid.forEach(col => {
        col.forEach(s => {
          if (s.isScatter) scatterCount++;
        });
      });

      if (scatterCount >= 4) {
        const scatterPayout = scatterCount >= 6 ? 100 : scatterCount === 5 ? 5 : 3;
        const scatterWin = betAmount * scatterPayout;
        onUpdateBalance(scatterWin, 'জিউস স্ক্যাটার বোনাস জয়');
        setFreeSpinsLeft(prev => prev + 15);
        setIsBonusRound(true);
        setCelebrationMessage(`⚡ জিউস ৪+ স্ক্যাটার! ১৫টি ফ্রি স্পিন আনলক! (+৳ ${scatterWin})`);
        if (soundEnabled) sound.playJackpot();
      }

      // Evaluate Tumble Wins
      evaluateTumble(newGrid, isFreeSpin);
    }, isTurbo ? 250 : 650);
  };

  // Evaluate 8+ scatter pays & execute tumble sequence
  const evaluateTumble = (currentGrid: SymbolDef[][], isFreeSpin: boolean) => {
    setIsTumbling(true);

    // Count occurrences of each symbol
    const counts: Record<string, { count: number; def: SymbolDef; cells: { col: number; row: number }[] }> = {};

    currentGrid.forEach((col, cIdx) => {
      col.forEach((sym, rIdx) => {
        if (sym.isScatter) return; // Scatters handled separately
        if (!counts[sym.id]) {
          counts[sym.id] = { count: 0, def: sym, cells: [] };
        }
        counts[sym.id].count++;
        counts[sym.id].cells.push({ col: cIdx, row: rIdx });
      });
    });

    // Check symbols with 8 or more hits
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

      // Explode and drop replacement symbols
      setTimeout(() => {
        // Build new grid where winning symbols disappear and symbols drop down
        const nextGrid: SymbolDef[][] = currentGrid.map((col, cIdx) => {
          const surviving = col.filter((_, rIdx) => !highlightCells.some(h => h.col === cIdx && h.row === rIdx));
          const missingCount = 5 - surviving.length;
          const fresh = Array.from({ length: missingCount }).map(() => getRandomSymbol());
          return [...fresh, ...surviving];
        });

        setGrid(nextGrid);
        setWinningCells([]);

        // Random chance for Zeus lightning on tumble
        if (Math.random() < 0.2) {
          triggerZeusLightning();
        }

        // Recursive tumble check
        setTimeout(() => {
          evaluateTumble(nextGrid, isFreeSpin);
        }, isTurbo ? 200 : 500);
      }, isTurbo ? 350 : 700);
    } else {
      // Tumble chain finished! Apply multiplier orbs
      finishRound(isFreeSpin);
    }
  };

  // Finalize round win with multiplier orbs
  const finishRound = (isFreeSpin: boolean) => {
    setIsTumbling(false);

    setTumbleRoundWin(roundWin => {
      if (roundWin > 0) {
        // Calculate sum of all multiplier orbs
        const orbsSum = currentRoundMultipliers.reduce((acc, orb) => acc + orb.val, 0);

        let finalMult = orbsSum > 0 ? orbsSum : 1;

        if (isFreeSpin) {
          // If in free spins and an orb landed, add to cumulative multiplier
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
        onUpdateBalance(totalPayout, `${game?.titleEn || 'Gates of Olympus'} জয় (${finalMult}x)`);

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
    onUpdateBalance(-cost, 'ফ্রি স্পিন ফিচার ক্রয় (100x)');
    setFreeSpinsLeft(15);
    setIsBonusRound(true);
    setCumulativeMultiplier(0);
    setTotalFreeSpinWin(0);
    setCelebrationMessage('⚡ অলিম্পাস বোনাস সক্রিয়! ১৫টি ফ্রি স্পিন শুরু হচ্ছে!');
    sound.playJackpot();
  };

  const activeMultiplierSum = currentRoundMultipliers.reduce((acc, o) => acc + o.val, 0);

  return (
    <div className="flex flex-col h-full bg-[#080711] text-white select-none overflow-y-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between px-3 sm:px-6 py-2.5 bg-[#0f0e1c] border-b border-amber-500/30 shrink-0 sticky top-0 z-30 shadow-lg">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-300 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors active:scale-95 border border-slate-700"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">লবিতে ফিরুন</span>
            <span className="sm:hidden">লবি</span>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-sm sm:text-base text-amber-400 tracking-wide font-serif">
                {game?.titleEn || 'Gates of Olympus'}
              </span>
              <span className="text-[10px] font-black text-slate-950 bg-gradient-to-r from-amber-400 to-yellow-400 px-2 py-0.5 rounded-full uppercase tracking-wider">
                {is1000 ? '1000x MULT' : isVip ? 'VIP EXCLUSIVE' : 'PRAGMATIC'}
              </span>
            </div>
            <div className="text-[10px] text-gray-400 flex items-center gap-1">
              <span>{is1000 ? 'ম্যাক্স উইন ১৫,০০০x' : 'ম্যাক্স উইন ৫,০০০x'}</span>
              <span>•</span>
              <span className="text-emerald-400">RTP 96.5%</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setShowPaytable(!showPaytable)}
            className="p-1.5 text-gray-400 hover:text-amber-400 rounded-lg hover:bg-slate-800 transition-colors"
            title="পে-টেবিল"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            title={soundEnabled ? 'সাউন্ড বন্ধ করুন' : 'সাউন্ড চালু করুন'}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-gray-500" />
            )}
          </button>
          {/* Balance Widget */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
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
          <div className="p-2 sm:p-2.5 rounded-2xl bg-gradient-to-r from-indigo-950/80 to-slate-900 border border-indigo-500/40 flex items-center justify-between">
            <div className="text-[11px] text-indigo-300">ফ্রি স্পিন বাকি:</div>
            <div className="text-base font-black text-amber-400 font-mono">
              {freeSpinsLeft > 0 ? `${freeSpinsLeft} টি` : '০'}
            </div>
          </div>

          {/* Active Round Multiplier Orb */}
          <div className="p-2 sm:p-2.5 rounded-2xl bg-gradient-to-r from-amber-950/80 to-slate-900 border border-amber-500/40 flex items-center justify-between">
            <div className="text-[11px] text-amber-300">রাউন্ড গুণক:</div>
            <div className="text-base font-black text-amber-400 font-mono">
              {activeMultiplierSum > 0 ? `${activeMultiplierSum}x` : '1x'}
            </div>
          </div>

          {/* Cumulative Bonus Multiplier */}
          <div className="p-2 sm:p-2.5 rounded-2xl bg-gradient-to-r from-purple-950/80 to-slate-900 border border-purple-500/40 flex items-center justify-between">
            <div className="text-[11px] text-purple-300">মোট কিউমুলেটিভ:</div>
            <div className="text-base font-black text-purple-300 font-mono">
              {cumulativeMultiplier > 0 ? `${cumulativeMultiplier}x` : '0x'}
            </div>
          </div>

          {/* Last Win Amount */}
          <div className="p-2 sm:p-2.5 rounded-2xl bg-gradient-to-r from-emerald-950/80 to-slate-900 border border-emerald-500/40 flex items-center justify-between">
            <div className="text-[11px] text-emerald-300">সর্বশেষ জয়:</div>
            <div className="text-base font-black text-emerald-400 font-mono">
              ৳ {lastWin.toLocaleString('en-US')}
            </div>
          </div>
        </div>

        {/* Celebration Announcement */}
        {celebrationMessage && (
          <div className="mb-3 py-2 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-black text-xs sm:text-sm text-center shadow-lg animate-bounce">
            {celebrationMessage}
          </div>
        )}

        {/* 6x5 Grid Stage with Zeus Figure */}
        <div className="relative flex flex-col lg:flex-row items-center justify-center gap-4 my-2">
          {/* Buy Free Spins Feature Button on Left */}
          <div className="hidden lg:flex flex-col gap-3 w-44">
            <button
              onClick={handleBuyBonus}
              disabled={isSpinning || isTumbling || isBonusRound}
              className="p-3 rounded-2xl bg-gradient-to-b from-amber-500 via-amber-600 to-yellow-600 hover:brightness-110 border-2 border-yellow-300 text-slate-950 font-black text-xs shadow-xl active:scale-95 transition-all flex flex-col items-center justify-center text-center gap-1 disabled:opacity-50"
            >
              <Sparkles className="w-5 h-5 text-slate-950" />
              <span className="uppercase tracking-wider">ফ্রি স্পিন কিনুন</span>
              <span className="text-[11px] bg-slate-950 text-amber-300 px-2 py-0.5 rounded-full font-mono mt-0.5">
                ৳ {betAmount * 100}
              </span>
            </button>
            <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-[10px] text-gray-400 leading-relaxed text-center">
              ১৫টি ফ্রি স্পিনসহ তাত্ক্ষণিক বোনাস রাউন্ড সক্রিয় করুন
            </div>
          </div>

          {/* 6 Reels x 5 Rows Grid Box */}
          <div className="relative bg-gradient-to-b from-[#13112a] via-[#0d0c1e] to-[#070611] rounded-3xl p-3 sm:p-4 border-2 border-amber-500/50 shadow-2xl shadow-purple-950/50">
            {/* Greek Pillar Header */}
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-amber-500/20 text-[11px]">
              <span className="text-amber-300 font-bold flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                অলিম্পাস ৮+ স্ক্যাটার পে
              </span>
              <span className="text-gray-400">
                {isTumbling ? 'টাম্বল হচ্ছে...' : isSpinning ? 'রিল ঘুরছে...' : 'স্পিন প্রস্তুত'}
              </span>
            </div>

            {/* Floating Multiplier Orbs Bar */}
            {currentRoundMultipliers.length > 0 && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 bg-slate-950/90 border border-amber-400 px-3 py-1 rounded-full shadow-xl animate-bounce">
                <span className="text-[10px] font-bold text-amber-300">লাইটনিং ওর্ব:</span>
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
                            ? 'bg-amber-400 text-slate-950 scale-105 border-white shadow-[0_0_15px_#fde047] z-10 animate-bounce'
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

          {/* Right: Zeus Mascot Pillar */}
          <div className="flex flex-col items-center justify-center p-3 rounded-3xl bg-gradient-to-b from-indigo-950/40 via-purple-950/30 to-slate-950 border border-amber-500/30 w-full sm:w-48 text-center relative overflow-hidden">
            {/* Zeus Visual Graphic */}
            <div className="relative my-2">
              <div
                className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-600 border-4 ${
                  zeusLightningActive
                    ? 'border-yellow-300 shadow-[0_0_30px_#fde047] scale-110'
                    : 'border-amber-400/80 shadow-xl'
                } flex items-center justify-center text-5xl sm:text-6xl transition-all duration-300`}
              >
                ⚡
              </div>
              {zeusLightningActive && (
                <div className="absolute inset-0 rounded-full border-2 border-yellow-200 animate-ping pointer-events-none" />
              )}
            </div>

            <div className="font-serif italic font-black text-amber-400 text-sm sm:text-base">
              অলিম্পাসের দেবতা জিউস
            </div>
            <p className="text-[10px] text-gray-300 mt-1 leading-relaxed">
              যেকোনো স্পিনে জিউসের বজ্রপাত ড্রপ করতে পারে ৫০০x পর্যন্ত মেগা গুণক ওর্ব!
            </p>

            <button
              onClick={handleBuyBonus}
              disabled={isSpinning || isTumbling || isBonusRound}
              className="lg:hidden mt-3 w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-xs shadow-md active:scale-95 transition-all disabled:opacity-50"
            >
              ফ্রি স্পিন কিনুন (৳{betAmount * 100})
            </button>
          </div>
        </div>

        {/* Controls Cockpit */}
        <div className="mt-3 bg-[#0f0e1c] p-3 sm:p-4 rounded-3xl border border-gray-800">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Bet Denomination Presets */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 w-full sm:w-auto">
              <span className="text-[11px] text-gray-400 font-semibold mr-1 shrink-0">বেট:</span>
              {[20, 50, 100, 250, 500, 1000].map(val => (
                <button
                  key={val}
                  onClick={() => setBetAmount(val)}
                  disabled={isSpinning || isTumbling}
                  className={`px-3 py-1.5 text-xs font-mono font-bold rounded-xl transition-all shrink-0 ${
                    betAmount === val
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-md font-black scale-105'
                      : 'bg-slate-800 text-gray-300 hover:bg-slate-700'
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
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                    : 'bg-slate-800 border-slate-700 text-gray-400 hover:text-white'
                }`}
              >
                <Zap className={`w-4 h-4 ${isTurbo ? 'text-amber-400 fill-amber-400' : ''}`} />
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
                    ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                    : 'bg-slate-800 border-slate-700 text-gray-400 hover:text-white'
                }`}
              >
                <RefreshCw className={`w-4 h-4 ${autoSpinCount > 0 ? 'animate-spin text-rose-400' : ''}`} />
                <span>{autoSpinCount > 0 ? `অটো (${autoSpinCount})` : 'অটো'}</span>
              </button>

              {/* Big Spin Button */}
              <button
                onClick={() => handleSpin(false)}
                disabled={isSpinning || isTumbling || isBonusRound}
                className="flex-1 sm:flex-none px-8 py-3.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-sm rounded-2xl shadow-xl shadow-amber-500/30 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
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
          <div className="bg-[#100f24] border border-amber-500/40 rounded-3xl max-w-lg w-full p-5 text-white shadow-2xl relative animate-fade-in max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <h3 className="font-bold text-base text-amber-400 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                <span>Gates of Olympus পে-টেবিল ও নিয়মাবলী</span>
              </h3>
              <button
                onClick={() => setShowPaytable(false)}
                className="text-xs px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-gray-300"
              >
                বন্ধ
              </button>
            </div>

            <div className="py-3 space-y-3 text-xs leading-relaxed text-gray-300">
              <p>
                • <strong>৮+ স্ক্যাটার পে:</strong> যেকোনো রিল ও সারিতে ৮টি বা ততোধিক একই প্রতীক থাকলে জয়ী হবেন।
              </p>
              <p>
                • <strong>টাম্বল ফিচার:</strong> জয়ী প্রতীকগুলো ফেটে বিলুপ্ত হয় এবং ওপর থেকে নতুন প্রতীক পড়ে টানা জয়ের সুযোগ তৈরি করে।
              </p>
              <p>
                • <strong>জিউস মাল্টিপ্লায়ার ওর্ব:</strong> যেকোনো স্পিন বা টাম্বলে ২x থেকে ১,০০০x পর্যন্ত উইংড ওর্ব পড়তে পারে।
              </p>
              <p>
                • <strong>ফ্রি স্পিন বোনাস:</strong> ৪ বা ততোধিক জিউস স্ক্যাটার (⚡) চিহ্নে ১৫টি ফ্রি স্পিন পাওয়া যায়।
              </p>
            </div>

            {/* Symbol Payout Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
              {[SCATTER_ZEUS, ...OLYMPUS_SYMBOLS].map(s => (
                <div key={s.id} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
                  <div className="text-2xl mb-1">{s.icon}</div>
                  <div className="font-bold text-white text-[11px] truncate">{s.nameEn}</div>
                  <div className="text-[10px] text-amber-400 font-mono mt-0.5">
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
