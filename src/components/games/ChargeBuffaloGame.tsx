import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft,
  Volume2,
  VolumeX,
  Sparkles,
  Zap,
  Trophy,
  HelpCircle,
  Flame,
  Award,
  ChevronRight,
  TrendingUp,
  RotateCcw,
  Star,
  ShieldCheck,
  Disc,
  Play,
  Pause,
  FastForward,
  CheckCircle2,
  Coins,
  History,
} from 'lucide-react';
import { GameItem } from '../../types';
import { sound } from '../../utils/audio';

interface ChargeBuffaloGameProps {
  game: GameItem;
  balance: number;
  onUpdateBalance: (amount: number, reason: string) => void;
  onClose: () => void;
  onOpenDeposit?: () => void;
}

// 4096 Ways Symbol Definitions for Charge Buffalo
export type BuffaloSymbolId =
  | 'buffalo_gold'
  | 'sunset_wild'
  | 'coin_scatter'
  | 'eagle'
  | 'tiger'
  | 'wolf'
  | 'elk'
  | 'card_a'
  | 'card_k'
  | 'card_q'
  | 'card_j'
  | 'card_10'
  | 'card_9';

export interface BuffaloSymbolDef {
  id: BuffaloSymbolId;
  nameBn: string;
  nameEn: string;
  icon: string;
  badge?: string;
  isWild?: boolean;
  isScatter?: boolean;
  isPremium?: boolean;
  bgGradient: string;
  borderGlow: string;
  textColor: string;
  payouts: Record<number, number>; // 2OAK, 3OAK, 4OAK, 5OAK, 6OAK multipliers
  weight: number; // Reel strip probability
}

export const BUFFALO_SYMBOLS: Record<BuffaloSymbolId, BuffaloSymbolDef> = {
  buffalo_gold: {
    id: 'buffalo_gold',
    nameBn: 'গোল্ডেন বাফেলো (TOP)',
    nameEn: 'Golden Buffalo',
    icon: '🦬',
    badge: 'TOP',
    isPremium: true,
    bgGradient: 'from-amber-600 via-yellow-500 to-amber-700',
    borderGlow: 'border-yellow-300 shadow-amber-500/60 ring-2 ring-yellow-400/40',
    textColor: 'text-amber-100',
    payouts: { 2: 2.0, 3: 5.0, 4: 15.0, 5: 40.0, 6: 120.0 },
    weight: 9,
  },
  sunset_wild: {
    id: 'sunset_wild',
    nameBn: 'সানসেট ওয়াইল্ড (WILD)',
    nameEn: 'Sunset WILD',
    icon: '🌅',
    badge: 'WILD',
    isWild: true,
    bgGradient: 'from-rose-600 via-orange-500 to-amber-600',
    borderGlow: 'border-orange-400 shadow-orange-500/60 ring-2 ring-orange-400/50',
    textColor: 'text-orange-100',
    payouts: {}, // Substitutes
    weight: 8,
  },
  coin_scatter: {
    id: 'coin_scatter',
    nameBn: 'গোল্ডেন কয়েন (SCATTER)',
    nameEn: 'Buffalo Coin Scatter',
    icon: '🪙',
    badge: 'FREE SPINS',
    isScatter: true,
    bgGradient: 'from-yellow-400 via-amber-300 to-yellow-600',
    borderGlow: 'border-yellow-200 shadow-yellow-400/80 ring-2 ring-yellow-300 animate-pulse',
    textColor: 'text-yellow-900',
    payouts: { 3: 5.0, 4: 20.0, 5: 50.0, 6: 100.0 }, // Also awards Free Spins
    weight: 7,
  },
  eagle: {
    id: 'eagle',
    nameBn: 'গোল্ডেন ঈগল',
    nameEn: 'Soaring Eagle',
    icon: '🦅',
    isPremium: true,
    bgGradient: 'from-amber-700 via-yellow-600 to-amber-800',
    borderGlow: 'border-amber-400/60 shadow-amber-600/30',
    textColor: 'text-amber-200',
    payouts: { 3: 3.0, 4: 8.0, 5: 20.0, 6: 50.0 },
    weight: 12,
  },
  tiger: {
    id: 'tiger',
    nameBn: 'বুনো বাঘ',
    nameEn: 'Wild Tiger',
    icon: '🐅',
    isPremium: true,
    bgGradient: 'from-orange-700 via-amber-600 to-stone-800',
    borderGlow: 'border-orange-400/60 shadow-orange-600/30',
    textColor: 'text-orange-200',
    payouts: { 3: 2.5, 4: 6.0, 5: 15.0, 6: 40.0 },
    weight: 14,
  },
  wolf: {
    id: 'wolf',
    nameBn: 'গ্রেল উলফ',
    nameEn: 'Timber Wolf',
    icon: '🐺',
    isPremium: true,
    bgGradient: 'from-slate-700 via-cyan-900 to-slate-800',
    borderGlow: 'border-cyan-400/50 shadow-cyan-600/30',
    textColor: 'text-cyan-200',
    payouts: { 3: 2.0, 4: 5.0, 5: 12.0, 6: 30.0 },
    weight: 15,
  },
  elk: {
    id: 'elk',
    nameBn: 'শিংওয়ালা হরিণ',
    nameEn: 'Highland Elk',
    icon: '🦌',
    isPremium: true,
    bgGradient: 'from-emerald-800 via-teal-900 to-stone-800',
    borderGlow: 'border-teal-400/50 shadow-teal-600/30',
    textColor: 'text-teal-200',
    payouts: { 3: 1.5, 4: 4.0, 5: 10.0, 6: 25.0 },
    weight: 16,
  },
  card_a: {
    id: 'card_a',
    nameBn: 'টেক্সাস A',
    nameEn: 'Ace',
    icon: '🅰️',
    bgGradient: 'from-red-950 via-slate-900 to-red-950',
    borderGlow: 'border-red-500/40',
    textColor: 'text-red-300',
    payouts: { 3: 1.0, 4: 2.5, 5: 6.0, 6: 15.0 },
    weight: 20,
  },
  card_k: {
    id: 'card_k',
    nameBn: 'রয়্যাল K',
    nameEn: 'King',
    icon: '👑',
    bgGradient: 'from-amber-950 via-slate-900 to-amber-950',
    borderGlow: 'border-amber-500/40',
    textColor: 'text-amber-300',
    payouts: { 3: 0.8, 4: 2.0, 5: 5.0, 6: 12.0 },
    weight: 22,
  },
  card_q: {
    id: 'card_q',
    nameBn: 'রয়্যাল Q',
    nameEn: 'Queen',
    icon: '👸',
    bgGradient: 'from-pink-950 via-slate-900 to-pink-950',
    borderGlow: 'border-pink-500/40',
    textColor: 'text-pink-300',
    payouts: { 3: 0.6, 4: 1.5, 5: 4.0, 6: 10.0 },
    weight: 24,
  },
  card_j: {
    id: 'card_j',
    nameBn: 'রয়্যাল J',
    nameEn: 'Jack',
    icon: '⚔️',
    bgGradient: 'from-blue-950 via-slate-900 to-blue-950',
    borderGlow: 'border-blue-500/40',
    textColor: 'text-blue-300',
    payouts: { 3: 0.5, 4: 1.2, 5: 3.0, 6: 8.0 },
    weight: 25,
  },
  card_10: {
    id: 'card_10',
    nameBn: 'কার্ড ১০',
    nameEn: 'Ten',
    icon: '🔟',
    bgGradient: 'from-slate-900 via-stone-900 to-slate-900',
    borderGlow: 'border-slate-600/40',
    textColor: 'text-gray-300',
    payouts: { 3: 0.4, 4: 1.0, 5: 2.5, 6: 6.0 },
    weight: 28,
  },
  card_9: {
    id: 'card_9',
    nameBn: 'কার্ড ৯',
    nameEn: 'Nine',
    icon: '9️⃣',
    bgGradient: 'from-slate-900 via-stone-900 to-slate-900',
    borderGlow: 'border-slate-600/40',
    textColor: 'text-gray-400',
    payouts: { 2: 0.2, 3: 0.4, 4: 1.0, 5: 2.0, 6: 5.0 },
    weight: 30,
  },
};

// Reel dimensions: 6 Reels x 4 Rows = 4,096 Ways
const NUM_REELS = 6;
const NUM_ROWS = 4;

export interface ReelSymbolInstance {
  symbolId: BuffaloSymbolId;
  wildMultiplier?: number; // 2x, 3x, 5x
  isWinning?: boolean;
}

export interface WinningWayResult {
  symbolId: BuffaloSymbolId;
  matchCount: number;
  waysCount: number;
  multiplier: number;
  payout: number;
}

export const ChargeBuffaloGame: React.FC<ChargeBuffaloGameProps> = ({
  game,
  balance,
  onUpdateBalance,
  onClose,
  onOpenDeposit,
}) => {
  // Betting states
  const [betAmount, setBetAmount] = useState<number>(50);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [turboMode, setTurboMode] = useState<boolean>(false);
  const [autoplayCount, setAutoplayCount] = useState<number>(0);
  const [isAutoplaying, setIsAutoplaying] = useState<boolean>(false);

  // Animation states
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [isStampeding, setIsStampeding] = useState<boolean>(false);
  const [grid, setGrid] = useState<ReelSymbolInstance[][]>(() => generateInitialGrid());
  const [winningWays, setWinningWays] = useState<WinningWayResult[]>([]);
  const [lastWinAmount, setLastWinAmount] = useState<number>(0);
  const [celebrationTier, setCelebrationTier] = useState<'BIG' | 'MEGA' | 'SUPER_MEGA' | null>(null);

  // Free Spins Mode
  const [freeSpinsRemaining, setFreeSpinsRemaining] = useState<number>(0);
  const [freeSpinsTotalWon, setFreeSpinsTotalWon] = useState<number>(0);
  const [freeSpinsMultiplierBonus, setFreeSpinsMultiplierBonus] = useState<number>(1);
  const [showFreeSpinsIntro, setShowFreeSpinsIntro] = useState<boolean>(false);

  // Modals & UI
  const [showRulesModal, setShowRulesModal] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [spinHistory, setSpinHistory] = useState<Array<{ win: number; bet: number; won: boolean }>>([
    { win: 180, bet: 50, won: true },
    { win: 0, bet: 50, won: false },
    { win: 650, bet: 50, won: true },
    { win: 0, bet: 50, won: false },
    { win: 1200, bet: 50, won: true },
  ]);

  const autoPlayRef = useRef<boolean>(false);
  autoPlayRef.current = isAutoplaying;

  function showToast(msg: string) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  }

  // Pre-generate balanced initial 6x4 grid
  function generateInitialGrid(): ReelSymbolInstance[][] {
    const symbolsList: BuffaloSymbolId[] = [
      'buffalo_gold',
      'eagle',
      'tiger',
      'wolf',
      'elk',
      'card_a',
      'card_k',
      'card_q',
      'card_j',
      'card_10',
    ];
    return Array.from({ length: NUM_REELS }, (_, reelIdx) =>
      Array.from({ length: NUM_ROWS }, () => {
        const sym = symbolsList[Math.floor(Math.random() * symbolsList.length)];
        return { symbolId: sym };
      })
    );
  }

  // Weighted symbol picker
  const pickRandomSymbol = (reelIndex: number, isFreeSpin: boolean): BuffaloSymbolId => {
    // Wilds only appear on reels 2, 3, 4, 5, 6
    const entries = Object.values(BUFFALO_SYMBOLS).filter(sym => {
      if (sym.isWild && reelIndex === 0) return false;
      return true;
    });

    const totalWeight = entries.reduce((acc, s) => acc + s.weight, 0);
    let rand = Math.random() * totalWeight;

    for (const sym of entries) {
      if (rand < sym.weight) {
        return sym.id;
      }
      rand -= sym.weight;
    }
    return 'card_j';
  };

  // Main Spin Handler
  const handleSpin = useCallback(() => {
    if (isSpinning) return;

    const isFreeSpin = freeSpinsRemaining > 0;

    // Balance check on regular spins
    if (!isFreeSpin) {
      if (balance < betAmount) {
        showToast('অপর্যাপ্ত ব্যালেন্স! দয়া করে ডিপোজিট করুন।');
        if (soundEnabled) sound.playCrash();
        setIsAutoplaying(false);
        return;
      }
      onUpdateBalance(-betAmount, 'চার্জ বাফেলো: স্পিন বাজি');
    } else {
      setFreeSpinsRemaining(prev => prev - 1);
    }

    setIsSpinning(true);
    setWinningWays([]);
    setCelebrationTier(null);

    // Audio triggers
    if (soundEnabled) {
      sound.playStampede();
    }

    // Random Buffalo Stampede Trigger (15% chance of thunder charge)
    const stampedeTriggered = Math.random() < 0.16;
    if (stampedeTriggered) {
      setIsStampeding(true);
      if (soundEnabled) sound.playBuffaloRoar();
      showToast('🦬 বাফেলো স্ট্যাম্পিড চার্জ! অতিরিক্ত গোল্ডেন বাফেলো রেলে ছুটছে!');
    } else {
      setIsStampeding(false);
    }

    const spinDuration = turboMode ? 450 : 850;

    // Generate outcome grid
    setTimeout(() => {
      let scatterCount = 0;
      let totalWildMultiplierInSpin = 1;

      const newGrid: ReelSymbolInstance[][] = Array.from({ length: NUM_REELS }, (_, reelIdx) => {
        return Array.from({ length: NUM_ROWS }, () => {
          let symId = pickRandomSymbol(reelIdx, isFreeSpin);

          // If stampede triggered, boost buffalo symbols
          if (stampedeTriggered && Math.random() < 0.38) {
            symId = 'buffalo_gold';
          }

          if (symId === 'coin_scatter') {
            scatterCount++;
          }

          let wildMult: number | undefined;
          if (symId === 'sunset_wild') {
            // Wild multipliers: 2x, 3x, or 5x in Free Spins or occasional in Base
            if (isFreeSpin || Math.random() < 0.4) {
              const possible = [2, 3, 5];
              wildMult = possible[Math.floor(Math.random() * possible.length)];
              totalWildMultiplierInSpin *= wildMult;
            }
          }

          return {
            symbolId: symId,
            wildMultiplier: wildMult,
            isWinning: false,
          };
        });
      });

      // 4096 Ways Evaluator
      const winningWaysList: WinningWayResult[] = [];
      let totalSpinWin = 0;

      // Check all non-wild non-scatter paying symbols
      const checkableSymbols = Object.keys(BUFFALO_SYMBOLS).filter(
        id => id !== 'sunset_wild' && id !== 'coin_scatter'
      ) as BuffaloSymbolId[];

      checkableSymbols.forEach(symId => {
        const def = BUFFALO_SYMBOLS[symId];
        let consecutiveReels = 0;
        let ways = 1;
        const matchingReels: number[] = [];

        for (let reel = 0; reel < NUM_REELS; reel++) {
          let countInReel = 0;
          for (let row = 0; row < NUM_ROWS; row++) {
            const cell = newGrid[reel][row];
            if (cell.symbolId === symId || cell.symbolId === 'sunset_wild') {
              countInReel++;
            }
          }

          if (countInReel > 0) {
            consecutiveReels++;
            ways *= countInReel;
            matchingReels.push(reel);
          } else {
            break; // Must be consecutive from left to right
          }
        }

        // Check if consecutive match qualifies for paytable
        const payoutMult = def.payouts[consecutiveReels];
        if (payoutMult && consecutiveReels >= (def.payouts[2] ? 2 : 3)) {
          // Highlight winning cells
          matchingReels.forEach(r => {
            for (let row = 0; row < NUM_ROWS; row++) {
              if (
                newGrid[r][row].symbolId === symId ||
                newGrid[r][row].symbolId === 'sunset_wild'
              ) {
                newGrid[r][row].isWinning = true;
              }
            }
          });

          const wayWin = +(ways * payoutMult * (betAmount / 20) * totalWildMultiplierInSpin).toFixed(2);
          totalSpinWin += wayWin;

          winningWaysList.push({
            symbolId: symId,
            matchCount: consecutiveReels,
            waysCount: ways,
            multiplier: payoutMult * totalWildMultiplierInSpin,
            payout: wayWin,
          });
        }
      });

      // Scatter Payout & Free Spins Award
      if (scatterCount >= 3) {
        const awardSpins =
          scatterCount === 3 ? 8 : scatterCount === 4 ? 15 : scatterCount === 5 ? 25 : 100;
        const scatterPayout = (BUFFALO_SYMBOLS.coin_scatter.payouts[scatterCount] || 5) * betAmount;
        totalSpinWin += scatterPayout;

        setFreeSpinsRemaining(prev => prev + awardSpins);
        setShowFreeSpinsIntro(true);

        if (soundEnabled) {
          sound.playBuffaloWin();
          sound.playBuffaloRoar();
        }
        showToast(`🪙 ${scatterCount}টি স্ক্যাটার! ${awardSpins}টি ফ্রি স্পিনস বোনাস সক্রিয় হয়েছে!`);
      }

      setGrid(newGrid);
      setWinningWays(winningWaysList);
      setIsSpinning(false);
      setLastWinAmount(totalSpinWin);

      // Handle win celebrations & balance crediting
      if (totalSpinWin > 0) {
        onUpdateBalance(totalSpinWin, `চার্জ বাফেলো: জয়লাভ (${winningWaysList.length} ওয়েজ)`);
        setSpinHistory(prev => [
          { win: totalSpinWin, bet: betAmount, won: true },
          ...prev.slice(0, 7),
        ]);

        if (isFreeSpin) {
          setFreeSpinsTotalWon(prev => +(prev + totalSpinWin).toFixed(2));
        }

        const winRatio = totalSpinWin / betAmount;
        if (winRatio >= 50) {
          setCelebrationTier('SUPER_MEGA');
          if (soundEnabled) sound.playBuffaloWin();
        } else if (winRatio >= 25) {
          setCelebrationTier('MEGA');
          if (soundEnabled) sound.playBuffaloWin();
        } else if (winRatio >= 10) {
          setCelebrationTier('BIG');
          if (soundEnabled) sound.playBuffaloWin();
        } else {
          if (soundEnabled) sound.playWinChime();
        }
      } else {
        setSpinHistory(prev => [
          { win: 0, bet: betAmount, won: false },
          ...prev.slice(0, 7),
        ]);
      }
    }, spinDuration);
  }, [
    isSpinning,
    freeSpinsRemaining,
    balance,
    betAmount,
    onUpdateBalance,
    soundEnabled,
    turboMode,
  ]);

  // Autoplay countdown effect
  useEffect(() => {
    let timer: any;
    if (isAutoplaying && !isSpinning && autoplayCount > 0) {
      timer = setTimeout(() => {
        setAutoplayCount(prev => prev - 1);
        handleSpin();
      }, turboMode ? 350 : 800);
    } else if (isAutoplaying && autoplayCount <= 0) {
      setIsAutoplaying(false);
    }
    return () => clearTimeout(timer);
  }, [isAutoplaying, isSpinning, autoplayCount, handleSpin, turboMode]);

  return (
    <div className="fixed inset-0 z-50 bg-[#070913] flex flex-col overflow-y-auto select-none font-sans text-gray-100">
      {/* Top Header Bar */}
      <header className="bg-[#0b1020] border-b border-amber-500/20 px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between sticky top-0 z-30 shadow-lg">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-gray-300 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-amber-500 via-orange-600 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-500/30 text-white font-black text-xl">
              🦬
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-sm sm:text-base tracking-wide bg-gradient-to-r from-amber-300 via-yellow-200 to-orange-400 bg-clip-text text-transparent">
                  চার্জ বাফেলো
                </span>
                <span className="text-[10px] font-black uppercase px-1.5 py-0.2 bg-amber-500/20 text-amber-300 rounded border border-amber-500/40">
                  ৪,০৯৬ WAYS
                </span>
                <span className="text-[10px] font-black uppercase px-1.5 py-0.2 bg-red-500/20 text-red-300 rounded border border-red-500/40 hidden sm:inline">
                  JILI HOT
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-gray-400">
                ওয়াইল্ড মাল্টিপ্লায়ার ও ফ্রি স্পিনস স্ট্যাম্পিড
              </p>
            </div>
          </div>
        </div>

        {/* Balance & Action Controls */}
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="bg-slate-950/90 px-3 py-1.5 rounded-xl border border-amber-500/30 flex items-center gap-2">
            <span className="text-[10px] sm:text-xs text-gray-400">ব্যালেন্স:</span>
            <span className="font-mono font-bold text-amber-400 text-xs sm:text-sm">
              ৳ {balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
            {onOpenDeposit && (
              <button
                onClick={onOpenDeposit}
                className="ml-1 text-[10px] bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-2 py-0.5 rounded shadow active:scale-95 transition"
              >
                + জমা
              </button>
            )}
          </div>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1.5 sm:p-2 rounded-xl bg-slate-800 text-gray-400 hover:text-white"
            title={soundEnabled ? 'সাউন্ড বন্ধ করুন' : 'সাউন্ড চালু করুন'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setShowRulesModal(true)}
            className="p-1.5 sm:p-2 rounded-xl bg-slate-800 text-gray-400 hover:text-white"
            title="গেমের নিয়মাবলী ও পে-টেবিল"
          >
            <HelpCircle className="w-4 h-4 text-cyan-400" />
          </button>
        </div>
      </header>

      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-bold text-xs sm:text-sm px-4 py-2 rounded-xl shadow-xl shadow-orange-950/60 animate-bounce flex items-center gap-1.5 border border-amber-400/40">
          <Sparkles className="w-4 h-4 fill-white" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Main Game Stage */}
      <div className="flex-1 max-w-6xl w-full mx-auto p-2 sm:p-4 md:p-6 flex flex-col justify-between space-y-4">
        {/* Free Spins Banner (Active during bonus round) */}
        {freeSpinsRemaining > 0 && (
          <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-yellow-950/80 via-amber-900/90 to-yellow-950/80 border-2 border-yellow-400 shadow-xl shadow-yellow-500/20 flex items-center justify-between animate-pulse">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 rounded-xl bg-yellow-400 text-slate-950 flex items-center justify-center font-black text-lg">
                🪙
              </div>
              <div>
                <div className="text-xs sm:text-sm font-black text-yellow-300 uppercase tracking-wider">
                  ফ্রি স্পিনস স্ট্যাম্পিড রাউন্ড
                </div>
                <div className="text-[11px] text-gray-300">
                  ওয়াইল্ড মাল্টিপ্লায়ার ২x, ৩x, ৫x একত্রিত হয়ে বিশাল জ্যাকপট প্রদান করে!
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-yellow-300 font-bold">অবশিষ্ট স্পিন:</div>
              <div className="text-xl sm:text-2xl font-mono font-black text-white">
                {freeSpinsRemaining}
              </div>
            </div>
          </div>
        )}

        {/* 6x4 Slot Reel Cabinet with Prairie Western Sunset theme */}
        <div
          className={`relative rounded-3xl p-3 sm:p-5 bg-gradient-to-b from-[#1b150f] via-[#100d18] to-[#0a0710] border-2 shadow-2xl transition-all duration-300 overflow-hidden ${
            isStampeding
              ? 'border-yellow-400 ring-4 ring-yellow-500/40 shadow-yellow-500/30'
              : freeSpinsRemaining > 0
              ? 'border-amber-400 shadow-amber-500/30'
              : 'border-amber-700/40 shadow-black'
          }`}
        >
          {/* Ambient Lighting */}
          <div className="absolute -top-32 -left-32 w-80 h-80 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Stampede Dust Overlay Animation */}
          {isStampeding && (
            <div className="absolute inset-0 bg-yellow-500/10 backdrop-brightness-110 pointer-events-none z-20 flex items-center justify-center">
              <div className="text-2xl sm:text-4xl font-black text-yellow-300 tracking-wider drop-shadow-[0_4px_20px_rgba(245,158,11,0.9)] animate-pulse">
                ⚡ বাফেলো চার্জ স্ট্যাম্পিড! ⚡
              </div>
            </div>
          )}

          {/* Reels Container: 6 Columns */}
          <div className="grid grid-cols-6 gap-1.5 sm:gap-2.5 relative z-10">
            {grid.map((reel, reelIdx) => (
              <div
                key={reelIdx}
                className={`flex flex-col gap-1.5 sm:gap-2 bg-slate-950/70 p-1 sm:p-1.5 rounded-2xl border border-amber-900/40 transition-transform ${
                  isSpinning ? 'animate-pulse' : ''
                }`}
              >
                {reel.map((cell, rowIdx) => {
                  const symDef = BUFFALO_SYMBOLS[cell.symbolId] || BUFFALO_SYMBOLS.card_10;
                  return (
                    <div
                      key={rowIdx}
                      className={`relative aspect-square rounded-xl sm:rounded-2xl p-1 flex flex-col items-center justify-center text-center transition-all duration-200 border ${
                        cell.isWinning
                          ? 'border-yellow-300 bg-gradient-to-b from-yellow-500/30 to-amber-600/30 scale-105 z-10 shadow-lg shadow-yellow-500/50'
                          : symDef.borderGlow
                      } bg-gradient-to-b ${symDef.bgGradient}`}
                    >
                      {/* Wild Multiplier Ribbon */}
                      {cell.wildMultiplier && (
                        <div className="absolute -top-1.5 -right-1.5 bg-gradient-to-r from-red-600 to-orange-500 text-white font-black text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-full shadow-md shadow-red-900/60 border border-yellow-300 animate-bounce">
                          {cell.wildMultiplier}X
                        </div>
                      )}

                      {/* Icon */}
                      <span
                        className={`text-2xl sm:text-4xl md:text-5xl filter drop-shadow transition-transform ${
                          cell.isWinning ? 'scale-110 animate-bounce' : ''
                        }`}
                      >
                        {symDef.icon}
                      </span>

                      {/* Symbol Label */}
                      <span className="text-[8px] sm:text-[10px] font-bold text-white/90 leading-tight mt-0.5 truncate max-w-full">
                        {symDef.nameBn}
                      </span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Win Evaluation Summary Ribbon */}
          {winningWays.length > 0 && !isSpinning && (
            <div className="mt-3 p-2 sm:p-3 rounded-2xl bg-gradient-to-r from-amber-950/90 via-yellow-900/90 to-amber-950/90 border border-yellow-400 flex flex-wrap items-center justify-between gap-2 text-xs relative z-10 animate-fade-in">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="font-bold text-yellow-300">
                  মোট জয়ের ওয়েজ: <span className="font-mono">{winningWays.length} লাইন</span>
                </span>
              </div>
              <div className="font-mono font-black text-sm sm:text-base text-yellow-300 flex items-center gap-1">
                <span>মোট জয়:</span>
                <span className="text-emerald-400">৳ {lastWinAmount.toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>

        {/* Big Win Popups */}
        {celebrationTier && !isSpinning && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
            <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-b from-[#2b1e0f] via-[#1a1209] to-[#0d0905] border-4 border-yellow-400 text-center max-w-md w-full space-y-4 shadow-2xl shadow-yellow-500/50 relative overflow-hidden animate-bounce">
              <div className="text-6xl sm:text-7xl">🦬💨</div>
              <div className="text-2xl sm:text-4xl font-black text-yellow-300 uppercase tracking-wider drop-shadow-[0_2px_15px_rgba(250,204,21,0.8)]">
                {celebrationTier === 'SUPER_MEGA'
                  ? 'সুপার মেগা উইন!'
                  : celebrationTier === 'MEGA'
                  ? 'মেগা উইন!'
                  : 'বিগ উইন!'}
              </div>
              <div className="text-4xl sm:text-6xl font-black font-mono text-emerald-400 tracking-tight drop-shadow-[0_4px_25px_rgba(52,211,153,0.8)]">
                ৳ {lastWinAmount.toLocaleString()}
              </div>
              <p className="text-xs text-amber-200">
                চার্জ বাফেলো ৪,০৯৬ ওয়েজে বিশাল জ্যাকপট পেআউট অর্জিত হয়েছে!
              </p>
              <button
                onClick={() => setCelebrationTier(null)}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-sm uppercase shadow-lg active:scale-95 transition"
              >
                ক্যাশ সংগ্রহ করুন
              </button>
            </div>
          </div>
        )}

        {/* Control Console */}
        <div className="bg-[#0b1020] border border-amber-500/30 rounded-3xl p-3 sm:p-5 shadow-xl space-y-3">
          {/* Bet Amount Adjuster Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-gray-400 font-bold whitespace-nowrap">বাজির পরিমাণ:</span>
              <div className="relative flex-1 sm:w-48">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-400 font-bold font-mono">
                  ৳
                </span>
                <input
                  type="number"
                  disabled={isSpinning || isAutoplaying || freeSpinsRemaining > 0}
                  value={betAmount}
                  onChange={e => setBetAmount(Math.max(20, Number(e.target.value)))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-7 pr-3 font-mono font-bold text-white text-sm focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* Modifiers */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={isSpinning || isAutoplaying}
                  onClick={() => setBetAmount(prev => Math.max(20, Math.floor(prev / 2)))}
                  className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-mono font-bold text-gray-300 rounded-lg"
                >
                  ½
                </button>
                <button
                  type="button"
                  disabled={isSpinning || isAutoplaying}
                  onClick={() => setBetAmount(prev => Math.min(10000, prev * 2))}
                  className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-mono font-bold text-gray-300 rounded-lg"
                >
                  2X
                </button>
                <button
                  type="button"
                  disabled={isSpinning || isAutoplaying}
                  onClick={() => setBetAmount(5000)}
                  className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-mono font-bold text-amber-300 rounded-lg"
                >
                  MAX
                </button>
              </div>
            </div>

            {/* Quick Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 no-scrollbar">
              {[20, 50, 100, 200, 500, 1000].map(val => (
                <button
                  key={val}
                  type="button"
                  disabled={isSpinning || isAutoplaying}
                  onClick={() => setBetAmount(val)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold border transition ${
                    betAmount === val
                      ? 'bg-amber-500 border-amber-300 text-slate-950 shadow-md'
                      : 'bg-slate-900 border-slate-800 hover:bg-slate-800 text-gray-300'
                  }`}
                >
                  ৳{val}
                </button>
              ))}
            </div>
          </div>

          {/* Action Row: Spin, Turbo, Autoplay */}
          <div className="grid grid-cols-12 gap-2 sm:gap-3 pt-1">
            {/* Turbo Toggle */}
            <button
              type="button"
              onClick={() => setTurboMode(!turboMode)}
              className={`col-span-3 sm:col-span-2 py-3 rounded-2xl border font-bold text-xs flex flex-col items-center justify-center transition ${
                turboMode
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                  : 'bg-slate-900 border-slate-800 text-gray-400 hover:text-white'
              }`}
            >
              <FastForward className="w-4 h-4 mb-0.5" />
              <span>টার্বো {turboMode ? 'ON' : 'OFF'}</span>
            </button>

            {/* Autoplay Button */}
            <button
              type="button"
              onClick={() => {
                if (isAutoplaying) {
                  setIsAutoplaying(false);
                  setAutoplayCount(0);
                } else {
                  setIsAutoplaying(true);
                  setAutoplayCount(20);
                  handleSpin();
                }
              }}
              className={`col-span-3 sm:col-span-2 py-3 rounded-2xl border font-bold text-xs flex flex-col items-center justify-center transition ${
                isAutoplaying
                  ? 'bg-rose-500/20 border-rose-500 text-rose-300 animate-pulse'
                  : 'bg-slate-900 border-slate-800 text-gray-400 hover:text-white'
              }`}
            >
              {isAutoplaying ? (
                <>
                  <Pause className="w-4 h-4 mb-0.5 text-rose-400" />
                  <span>থামান ({autoplayCount})</span>
                </>
              ) : (
                <>
                  <RotateCcw className="w-4 h-4 mb-0.5" />
                  <span>অটো স্পিন</span>
                </>
              )}
            </button>

            {/* Big Main Spin Button */}
            <button
              type="button"
              onClick={handleSpin}
              disabled={isSpinning}
              className="col-span-6 sm:col-span-8 py-3.5 sm:py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-base sm:text-lg shadow-xl shadow-amber-500/30 active:scale-95 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Flame className="w-6 h-6 fill-slate-950 animate-bounce" />
              <span>
                {isSpinning
                  ? 'স্পিন হচ্ছে...'
                  : freeSpinsRemaining > 0
                  ? `ফ্রি স্পিন চালান (${freeSpinsRemaining}টি বাকি)`
                  : `স্পিন করুন ৳${betAmount.toLocaleString()}`}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Rules & Paytable Modal */}
      {showRulesModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e1324] border border-amber-500/40 rounded-3xl max-w-2xl w-full p-6 text-white space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className="font-bold text-lg text-amber-300 flex items-center gap-2">
                🦬 চার্জ বাফেলো: পে-টেবিল ও গেমের নিয়ম
              </h3>
              <button
                onClick={() => setShowRulesModal(false)}
                className="p-1 rounded-full bg-slate-800 text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-gray-300 leading-relaxed">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="font-bold text-amber-300 mb-1">🔥 ৪,০৯৬ ওয়েজ টু উইন (4096 Ways)</div>
                <p>
                  ৬টি রিল ও ৪টি সারির প্রতিটি সমন্বয়ে বাম থেকে ডানে পরপর রিলে প্রতীক মিললে জয় হয়। পে-লাইনের কোনো বাধ্যবাধকতা নেই।
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="font-bold text-orange-300 mb-1">🌅 সানসেট ওয়াইল্ড ও মাল্টিপ্লায়ার</div>
                <p>
                  ওয়াইল্ড প্রতীক স্ক্যাটার ব্যতীত সকল প্রতীকের বিকল্প হিসেবে কাজ করে। ফ্রি স্পিনস চলাকালীন প্রতিটি ওয়াইল্ডে ২x, ৩x অথবা ৫x গুণক থাকে, যা একাধিক ওয়াইল্ড থাকলে পরস্পরের সাথে গুণিত হয় (যেমন ২x * ৫x = ১০x)!
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="font-bold text-yellow-300 mb-1">🪙 ফ্রি স্পিনস বোনাস রাউন্ড</div>
                <p>
                  ৩, ৪, ৫, বা ৬টি গোল্ডেন কয়েন স্ক্যাটার পেলে যথাক্রমে ৮, ১৫, ২৫, অথবা ১০০টি ফ্রি স্পিনস পাওয়া যায়। ফ্রি স্পিনসে ২+ স্ক্যাটার এলেই অতিরিক্ত স্পিন যুক্ত হয়!
                </p>
              </div>

              {/* Paytable Grid */}
              <div className="space-y-2 pt-2">
                <h4 className="font-bold text-sm text-white">প্রতীকের গুণক তালিকা (৬টি মিললে):</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {Object.values(BUFFALO_SYMBOLS).map(sym => (
                    <div
                      key={sym.id}
                      className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center gap-2"
                    >
                      <span className="text-2xl">{sym.icon}</span>
                      <div className="text-[11px]">
                        <div className="font-bold text-white">{sym.nameBn}</div>
                        <div className="text-amber-400 font-mono">
                          {sym.payouts[6] ? `${sym.payouts[6]}x বেট` : sym.badge || 'স্পেশাল'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowRulesModal(false)}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition"
            >
              বুঝেছি, খেলা শুরু করুন
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
