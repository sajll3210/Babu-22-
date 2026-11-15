import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ArrowLeft,
  Volume2,
  VolumeX,
  Sparkles,
  RefreshCw,
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
  CheckCircle2,
} from 'lucide-react';
import { GameItem } from '../../types';
import { sound } from '../../utils/audio';

interface FortuneGems3GameProps {
  game: GameItem;
  balance: number;
  onUpdateBalance: (amount: number, reason: string) => void;
  onClose: () => void;
  onOpenDeposit?: () => void;
}

// Fortune Gems 3 Symbol Types
export type GemSymbolId =
  | 'garuda_wild'
  | 'red_ruby'
  | 'blue_sapphire'
  | 'green_emerald'
  | 'gold_a'
  | 'gold_k'
  | 'gold_q'
  | 'gold_j';

export interface GemSymbolDef {
  id: GemSymbolId;
  nameBn: string;
  nameEn: string;
  icon: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  payout3: number; // Base 3-of-a-kind payout multiplier
  weight: number;
}

export const SYMBOL_DEFINITIONS: Record<GemSymbolId, GemSymbolDef> = {
  garuda_wild: {
    id: 'garuda_wild',
    nameBn: 'গোল্ডেন গরুড়া (WILD)',
    nameEn: 'Golden Garuda WILD',
    icon: '🦅',
    bgColor: 'from-amber-600 via-yellow-400 to-amber-700',
    borderColor: 'border-yellow-300 shadow-yellow-500/50',
    textColor: 'text-amber-200',
    payout3: 25,
    weight: 8,
  },
  red_ruby: {
    id: 'red_ruby',
    nameBn: 'রেড রুবি',
    nameEn: 'Red Ruby Gem',
    icon: '💎',
    bgColor: 'from-rose-600 via-red-500 to-rose-700',
    borderColor: 'border-rose-400 shadow-rose-500/50',
    textColor: 'text-rose-200',
    payout3: 20,
    weight: 12,
  },
  blue_sapphire: {
    id: 'blue_sapphire',
    nameBn: 'ব্লু স্যাফায়ার',
    nameEn: 'Blue Sapphire Gem',
    icon: '🔷',
    bgColor: 'from-blue-600 via-cyan-500 to-blue-700',
    borderColor: 'border-cyan-300 shadow-cyan-500/50',
    textColor: 'text-cyan-200',
    payout3: 15,
    weight: 15,
  },
  green_emerald: {
    id: 'green_emerald',
    nameBn: 'গ্রিন এমারেল্ড',
    nameEn: 'Green Emerald Gem',
    icon: '🟢',
    bgColor: 'from-emerald-600 via-green-500 to-emerald-700',
    borderColor: 'border-emerald-300 shadow-emerald-500/50',
    textColor: 'text-emerald-200',
    payout3: 10,
    weight: 18,
  },
  gold_a: {
    id: 'gold_a',
    nameBn: 'গোল্ডেন A',
    nameEn: 'Golden Ace',
    icon: '🅰️',
    bgColor: 'from-amber-700 via-amber-500 to-amber-800',
    borderColor: 'border-amber-400 shadow-amber-500/30',
    textColor: 'text-amber-100',
    payout3: 8,
    weight: 22,
  },
  gold_k: {
    id: 'gold_k',
    nameBn: 'গোল্ডেন K',
    nameEn: 'Golden King',
    icon: '👑',
    bgColor: 'from-purple-700 via-indigo-600 to-purple-800',
    borderColor: 'border-purple-400 shadow-purple-500/30',
    textColor: 'text-purple-200',
    payout3: 5,
    weight: 25,
  },
  gold_q: {
    id: 'gold_q',
    nameBn: 'গোল্ডেন Q',
    nameEn: 'Golden Queen',
    icon: '👸',
    bgColor: 'from-pink-700 via-rose-600 to-pink-800',
    borderColor: 'border-pink-400 shadow-pink-500/30',
    textColor: 'text-pink-200',
    payout3: 3,
    weight: 28,
  },
  gold_j: {
    id: 'gold_j',
    nameBn: 'গোল্ডেন J',
    nameEn: 'Golden Jack',
    icon: '🗡️',
    bgColor: 'from-slate-700 via-teal-700 to-slate-800',
    borderColor: 'border-teal-400 shadow-teal-500/30',
    textColor: 'text-teal-200',
    payout3: 2,
    weight: 30,
  },
};

// 4th Special Multiplier Wheel Reel Values
export type FourthReelValue = 1 | 2 | 3 | 5 | 10 | 15 | 'WHEEL';

// 5 Fixed Paylines in 3x3 Grid
const PAYLINES: Array<[number, number][]> = [
  // Line 1: Center Horizontal
  [
    [1, 0],
    [1, 1],
    [1, 2],
  ],
  // Line 2: Top Horizontal
  [
    [0, 0],
    [0, 1],
    [0, 2],
  ],
  // Line 3: Bottom Horizontal
  [
    [2, 0],
    [2, 1],
    [2, 2],
  ],
  // Line 4: Diagonal Top-Left to Bottom-Right
  [
    [0, 0],
    [1, 1],
    [2, 2],
  ],
  // Line 5: Diagonal Bottom-Left to Top-Right
  [
    [2, 0],
    [1, 1],
    [0, 2],
  ],
];

const BET_OPTIONS = [10, 20, 50, 100, 200, 500, 1000, 2500, 5000];

export const FortuneGems3Game: React.FC<FortuneGems3GameProps> = ({
  game,
  balance,
  onUpdateBalance,
  onClose,
  onOpenDeposit,
}) => {
  const [bet, setBet] = useState<number>(20);
  const [extraBetEnabled, setExtraBetEnabled] = useState<boolean>(false); // JILI signature Extra Bet (guarantees high multipliers)
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [turboMode, setTurboMode] = useState<boolean>(false);
  const [autoSpinCount, setAutoSpinCount] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [showPaytable, setShowPaytable] = useState<boolean>(false);

  // 3x3 Grid State
  const [grid, setGrid] = useState<GemSymbolId[][]>([
    ['red_ruby', 'garuda_wild', 'blue_sapphire'],
    ['gold_a', 'red_ruby', 'gold_a'],
    ['green_emerald', 'gold_k', 'green_emerald'],
  ]);

  // 4th Multiplier Reel State
  const [fourthReelValue, setFourthReelValue] = useState<FourthReelValue>(3);
  const [isSpinningFourthReel, setIsSpinningFourthReel] = useState<boolean>(false);

  // Winning lines in current spin
  const [winningLines, setWinningLines] = useState<
    Array<{ lineIndex: number; symbolId: GemSymbolId; payout: number }>
  >([]);
  const [lastWin, setLastWin] = useState<number>(0);
  const [totalMultiplierApplied, setTotalMultiplierApplied] = useState<number>(1);

  // Lucky Wheel Bonus Feature Trigger
  const [showLuckyWheel, setShowLuckyWheel] = useState<boolean>(false);
  const [wheelSpinning, setWheelSpinning] = useState<boolean>(false);
  const [wheelPrize, setWheelPrize] = useState<number | null>(null);

  // Big Win celebration overlay
  const [bigWinAmount, setBigWinAmount] = useState<number | null>(null);

  const autoSpinRef = useRef<NodeJS.Timeout | null>(null);

  const playSound = useCallback(
    (fn: () => void) => {
      if (soundEnabled) fn();
    },
    [soundEnabled]
  );

  // Helper to pick random symbol based on weights
  const getRandomSymbol = useCallback((): GemSymbolId => {
    const list = Object.values(SYMBOL_DEFINITIONS);
    const totalWeight = list.reduce((acc, s) => acc + s.weight, 0);
    let rand = Math.random() * totalWeight;
    for (const sym of list) {
      if (rand < sym.weight) return sym.id;
      rand -= sym.weight;
    }
    return 'gold_a';
  }, []);

  // Helper to pick 4th Reel Multiplier
  const getRandomFourthReel = useCallback((): FourthReelValue => {
    // If Extra Bet enabled, higher multipliers
    const rand = Math.random();
    if (extraBetEnabled) {
      if (rand < 0.25) return 2;
      if (rand < 0.50) return 3;
      if (rand < 0.75) return 5;
      if (rand < 0.90) return 10;
      if (rand < 0.96) return 15;
      return 'WHEEL';
    }

    if (rand < 0.40) return 1;
    if (rand < 0.65) return 2;
    if (rand < 0.82) return 3;
    if (rand < 0.92) return 5;
    if (rand < 0.97) return 10;
    if (rand < 0.99) return 15;
    return 'WHEEL';
  }, [extraBetEnabled]);

  // Main Spin Action
  const handleSpin = useCallback(() => {
    const effectiveBet = extraBetEnabled ? Math.round(bet * 1.5) : bet;

    if (balance < effectiveBet) {
      setAutoSpinCount(0);
      playSound(() => sound.playCrash());
      if (onOpenDeposit) onOpenDeposit();
      return;
    }

    // Deduct bet
    onUpdateBalance(-effectiveBet, `ফরচুন জেমস ৩ স্পিন (৳${effectiveBet})`);
    playSound(() => sound.playClick());
    playSound(() => sound.playSpinTick());

    setIsSpinning(true);
    setIsSpinningFourthReel(true);
    setWinningLines([]);
    setLastWin(0);

    const spinDuration = turboMode ? 400 : 900;

    setTimeout(() => {
      // 1. Generate new 3x3 grid
      const newGrid: GemSymbolId[][] = [
        [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
        [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
        [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
      ];

      // 2. Generate 4th Reel Value
      const newFourth = getRandomFourthReel();

      setGrid(newGrid);
      setFourthReelValue(newFourth);
      setIsSpinning(false);
      setIsSpinningFourthReel(false);

      // 3. Evaluate Winning Paylines
      const wins: Array<{ lineIndex: number; symbolId: GemSymbolId; payout: number }> = [];
      let roundWin = 0;

      PAYLINES.forEach((line, lIdx) => {
        const [p1, p2, p3] = line;
        const s1 = newGrid[p1[0]][p1[1]];
        const s2 = newGrid[p2[0]][p2[1]];
        const s3 = newGrid[p3[0]][p3[1]];

        // Determine matching target symbol considering WILDs
        let matchSym: GemSymbolId | null = null;
        if (s1 !== 'garuda_wild') matchSym = s1;
        else if (s2 !== 'garuda_wild') matchSym = s2;
        else if (s3 !== 'garuda_wild') matchSym = s3;
        else matchSym = 'garuda_wild';

        const isWin =
          (s1 === matchSym || s1 === 'garuda_wild') &&
          (s2 === matchSym || s2 === 'garuda_wild') &&
          (s3 === matchSym || s3 === 'garuda_wild');

        if (isWin && matchSym) {
          const symDef = SYMBOL_DEFINITIONS[matchSym];
          const linePay = symDef.payout3 * (bet / 5);
          wins.push({ lineIndex: lIdx, symbolId: matchSym, payout: linePay });
          roundWin += linePay;
        }
      });

      // 4. Apply 4th Reel Multiplier
      let finalWin = roundWin;
      let multiplierNum = 1;

      if (newFourth === 'WHEEL') {
        // Trigger Lucky Wheel Bonus
        setShowLuckyWheel(true);
      } else {
        multiplierNum = typeof newFourth === 'number' ? newFourth : 1;
        finalWin = Math.floor(roundWin * multiplierNum);
      }

      setWinningLines(wins);
      setTotalMultiplierApplied(multiplierNum);
      setLastWin(finalWin);

      if (finalWin > 0) {
        onUpdateBalance(finalWin, `ফরচুন জেমস ৩ জয় (+৳${finalWin})`);
        playSound(() => sound.playWinChime());

        if (finalWin >= bet * 10) {
          setBigWinAmount(finalWin);
          playSound(() => sound.playJackpot());
        }
      }

      // Handle Auto Spin decrement
      if (autoSpinCount > 0) {
        autoSpinRef.current = setTimeout(() => {
          setAutoSpinCount(prev => prev - 1);
        }, turboMode ? 600 : 1200);
      }
    }, spinDuration);
  }, [
    balance,
    bet,
    extraBetEnabled,
    turboMode,
    autoSpinCount,
    onUpdateBalance,
    playSound,
    onOpenDeposit,
    getRandomSymbol,
    getRandomFourthReel,
  ]);

  // Auto spin loop trigger
  useEffect(() => {
    if (autoSpinCount > 0 && !isSpinning && !showLuckyWheel && !bigWinAmount) {
      handleSpin();
    }
  }, [autoSpinCount, isSpinning, showLuckyWheel, bigWinAmount, handleSpin]);

  // Handle Lucky Wheel Bonus Spin
  const spinLuckyWheel = () => {
    if (wheelSpinning) return;
    setWheelSpinning(true);
    playSound(() => sound.playSpinTick());

    const prizes = [20, 50, 100, 200, 500, 1000];
    const chosenMultiplier = prizes[Math.floor(Math.random() * prizes.length)];

    setTimeout(() => {
      setWheelSpinning(false);
      setWheelPrize(chosenMultiplier);
      const bonusWin = Math.floor(bet * chosenMultiplier);
      onUpdateBalance(bonusWin, `ফরচুন জেমস ৩ লাকি হুইল বোনাস (+৳${bonusWin})`);
      setLastWin(prev => prev + bonusWin);
      setBigWinAmount(bonusWin);
      playSound(() => sound.playJackpot());

      setTimeout(() => {
        setShowLuckyWheel(false);
        setWheelPrize(null);
      }, 2500);
    }, 2000);
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0614] text-white select-none font-sans overflow-hidden">
      {/* 1. Header Bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#120924] border-b border-amber-500/30 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-gray-300 bg-slate-900 hover:bg-slate-800 rounded-lg border border-gray-700 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline font-semibold">লবিতে ফিরুন</span>
          </button>

          <div className="flex items-center gap-1.5">
            <span className="text-xl">🦅</span>
            <div>
              <div className="flex items-center gap-1">
                <span className="font-black text-sm sm:text-base text-amber-400 tracking-wide font-serif">
                  FORTUNE GEMS 3
                </span>
                <span className="text-[9px] font-black bg-gradient-to-r from-red-600 to-amber-600 text-white px-1.5 py-0.5 rounded">
                  JILI
                </span>
              </div>
              <span className="text-[10px] text-gray-400">৩x৩ রিল + ৪র্থ মাল্টিপ্লায়ার হুইল</span>
            </div>
          </div>
        </div>

        {/* Balance & Audio Control */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="text-right">
            <span className="text-[10px] text-gray-400 block leading-none">ব্যালেন্স</span>
            <span className="text-xs sm:text-sm font-black font-mono text-emerald-400 tabular-nums">
              ৳ {balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          {onOpenDeposit && (
            <button
              onClick={() => {
                sound.playClick();
                onOpenDeposit();
              }}
              className="px-2.5 py-1 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-xs rounded-lg shadow active:scale-95 transition-all"
            >
              + ডিপোজিট
            </button>
          )}

          <button
            onClick={() => setShowPaytable(!showPaytable)}
            className="p-1.5 text-gray-400 hover:text-amber-400 bg-slate-900 rounded-lg border border-gray-800 transition-colors"
            title="পে-টেবিল ও নিয়মাবলী"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1.5 text-gray-400 hover:text-white bg-slate-900 rounded-lg border border-gray-800 transition-colors"
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-gray-500" />
            )}
          </button>
        </div>
      </div>

      {/* 2. Top Banner / JILI Aztec Temple Marquee */}
      <div className="bg-gradient-to-r from-amber-950/60 via-purple-950/70 to-amber-950/60 border-b border-amber-500/20 px-3 py-1.5 flex items-center justify-between text-xs shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
          <span className="font-bold text-amber-300 text-[11px] sm:text-xs">
            গরুড়া ওয়াইল্ড ও ১৫x মাল্টিপ্লায়ার হুইল সক্রিয়!
          </span>
        </div>

        {/* Win Display */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-gray-400">সর্বশেষ জয়:</span>
          <span className="font-mono font-black text-amber-400 text-xs sm:text-sm tabular-nums">
            ৳ {lastWin.toLocaleString('en-US')}
          </span>
          {totalMultiplierApplied > 1 && (
            <span className="text-[10px] font-black bg-rose-600 text-white px-1.5 py-0.5 rounded-full animate-bounce">
              {totalMultiplierApplied}x বুস্ট!
            </span>
          )}
        </div>
      </div>

      {/* 3. Main Slot Machine Reels Arena */}
      <div className="flex-1 flex flex-col items-center justify-center p-3 relative overflow-hidden">
        {/* Aztec Golden Temple Frame */}
        <div className="relative max-w-xl w-full bg-gradient-to-b from-[#1b1030] via-[#110822] to-[#0a0515] p-3 sm:p-5 rounded-3xl border-2 border-amber-500/50 shadow-2xl shadow-amber-900/40 flex flex-col items-center">
          {/* Top Arch Eagle / Garuda Emblem */}
          <div className="absolute -top-4 bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-600 px-4 py-0.5 rounded-full border border-yellow-200 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-lg">
            <span>🦅</span>
            <span>JILI FORTUNE GEMS 3</span>
            <span>🦅</span>
          </div>

          {/* Reels Layout: 3 Gemstone Reels + 1 Multiplier Wheel Reel */}
          <div className="w-full grid grid-cols-4 gap-2 sm:gap-3 my-2 pt-2">
            {/* Reel 1 (3 cells) */}
            <div className="flex flex-col gap-2">
              <span className="text-center text-[10px] font-bold text-amber-400/80">রিল ১</span>
              {[0, 1, 2].map(r => {
                const sym = SYMBOL_DEFINITIONS[grid[r][0]];
                return (
                  <div
                    key={`c0-${r}`}
                    className={`h-20 sm:h-24 rounded-2xl bg-gradient-to-tr ${sym.bgColor} border-2 ${sym.borderColor} p-2 flex flex-col items-center justify-center shadow-lg transition-all transform ${
                      isSpinning ? 'animate-pulse scale-95 blur-[1px]' : 'scale-100 hover:scale-105'
                    }`}
                  >
                    <span className="text-2xl sm:text-3xl filter drop-shadow">{sym.icon}</span>
                    <span className="text-[9px] font-black text-white mt-1 text-center leading-tight">
                      {sym.nameBn}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Reel 2 (3 cells) */}
            <div className="flex flex-col gap-2">
              <span className="text-center text-[10px] font-bold text-amber-400/80">রিল ২</span>
              {[0, 1, 2].map(r => {
                const sym = SYMBOL_DEFINITIONS[grid[r][1]];
                return (
                  <div
                    key={`c1-${r}`}
                    className={`h-20 sm:h-24 rounded-2xl bg-gradient-to-tr ${sym.bgColor} border-2 ${sym.borderColor} p-2 flex flex-col items-center justify-center shadow-lg transition-all transform ${
                      isSpinning ? 'animate-pulse scale-95 blur-[1px]' : 'scale-100 hover:scale-105'
                    }`}
                  >
                    <span className="text-2xl sm:text-3xl filter drop-shadow">{sym.icon}</span>
                    <span className="text-[9px] font-black text-white mt-1 text-center leading-tight">
                      {sym.nameBn}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Reel 3 (3 cells) */}
            <div className="flex flex-col gap-2">
              <span className="text-center text-[10px] font-bold text-amber-400/80">রিল ৩</span>
              {[0, 1, 2].map(r => {
                const sym = SYMBOL_DEFINITIONS[grid[r][2]];
                return (
                  <div
                    key={`c2-${r}`}
                    className={`h-20 sm:h-24 rounded-2xl bg-gradient-to-tr ${sym.bgColor} border-2 ${sym.borderColor} p-2 flex flex-col items-center justify-center shadow-lg transition-all transform ${
                      isSpinning ? 'animate-pulse scale-95 blur-[1px]' : 'scale-100 hover:scale-105'
                    }`}
                  >
                    <span className="text-2xl sm:text-3xl filter drop-shadow">{sym.icon}</span>
                    <span className="text-[9px] font-black text-white mt-1 text-center leading-tight">
                      {sym.nameBn}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Reel 4: THE SPECIAL MULTIPLIER WHEEL REEL */}
            <div className="flex flex-col gap-2 bg-gradient-to-b from-amber-950/60 via-purple-950/60 to-amber-950/60 p-1.5 rounded-2xl border-2 border-amber-400/70 shadow-inner">
              <span className="text-center text-[10px] font-black text-yellow-300 uppercase tracking-tight flex items-center justify-center gap-0.5">
                <Disc className="w-2.5 h-2.5 text-amber-400" />
                ৪র্থ রিল
              </span>

              {/* Multiplier Center Display */}
              <div
                className={`flex-1 rounded-2xl bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-500 border-2 border-yellow-200 text-slate-950 flex flex-col items-center justify-center p-2 shadow-2xl transition-all transform ${
                  isSpinningFourthReel ? 'animate-spin scale-90' : 'scale-100'
                }`}
              >
                {fourthReelValue === 'WHEEL' ? (
                  <>
                    <span className="text-3xl animate-bounce">🎡</span>
                    <span className="text-[10px] font-black text-slate-950 uppercase tracking-widest text-center mt-1">
                      হুইল বোনাস!
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-3xl sm:text-4xl font-black font-mono leading-none">
                      {fourthReelValue}x
                    </span>
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-900 mt-1">
                      মাল্টিপ্লায়ার
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Payline Win Alert */}
          {winningLines.length > 0 && (
            <div className="w-full bg-emerald-950/80 border border-emerald-500/50 rounded-xl p-2 mt-2 flex items-center justify-between text-xs animate-fade-in">
              <div className="flex items-center gap-1.5 text-emerald-300 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{winningLines.length} টি পে-লাইনে জয়!</span>
              </div>
              <div className="font-mono font-black text-emerald-300">
                +৳{lastWin.toLocaleString()} ({totalMultiplierApplied}x)
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. Controls & Bet Cockpit */}
      <div className="bg-[#0e071c] border-t border-amber-500/30 p-2.5 sm:p-3 shrink-0">
        <div className="max-w-xl mx-auto flex flex-col gap-2">
          {/* Bet Selector and Extra Bet Switch */}
          <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
            {/* Bet amount adjuster */}
            <div className="flex items-center bg-slate-950 rounded-xl border border-gray-700 px-2 py-1">
              <span className="text-xs text-gray-400 mr-2">বাজি:</span>
              <button
                onClick={() => {
                  sound.playClick();
                  const curIdx = BET_OPTIONS.indexOf(bet);
                  if (curIdx > 0) setBet(BET_OPTIONS[curIdx - 1]);
                }}
                disabled={isSpinning}
                className="w-7 h-7 rounded-lg bg-slate-800 text-white font-bold flex items-center justify-center text-sm disabled:opacity-40"
              >
                -
              </button>
              <span className="mx-2 font-mono font-black text-amber-400 text-sm sm:text-base tabular-nums">
                ৳{bet}
              </span>
              <button
                onClick={() => {
                  sound.playClick();
                  const curIdx = BET_OPTIONS.indexOf(bet);
                  if (curIdx < BET_OPTIONS.length - 1) setBet(BET_OPTIONS[curIdx + 1]);
                }}
                disabled={isSpinning}
                className="w-7 h-7 rounded-lg bg-slate-800 text-white font-bold flex items-center justify-center text-sm disabled:opacity-40"
              >
                +
              </button>
            </div>

            {/* JILI Signature Extra Bet Toggle */}
            <button
              onClick={() => {
                sound.playClick();
                setExtraBetEnabled(!extraBetEnabled);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                extraBetEnabled
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 border-yellow-300 shadow-md shadow-amber-500/30'
                  : 'bg-slate-900 border-gray-700 text-gray-400 hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>এক্সট্রা বেট (+৫০%)</span>
              <span className="text-[10px] bg-black/30 px-1 py-0.5 rounded">
                {extraBetEnabled ? 'অন (উচ্চ মাল্টি)' : 'অফ'}
              </span>
            </button>
          </div>

          {/* Action Buttons: Turbo, Auto, and Primary Spin */}
          <div className="grid grid-cols-12 gap-2 items-center">
            {/* Turbo Toggle */}
            <div className="col-span-3">
              <button
                onClick={() => {
                  sound.playClick();
                  setTurboMode(!turboMode);
                }}
                className={`w-full py-2.5 rounded-xl text-xs font-bold border transition-all flex flex-col items-center justify-center ${
                  turboMode
                    ? 'bg-rose-950/60 border-rose-500 text-rose-400'
                    : 'bg-slate-900 border-gray-700 text-gray-400'
                }`}
              >
                <Zap className="w-3.5 h-3.5 mb-0.5" />
                <span>টার্বো {turboMode ? 'অন' : 'অফ'}</span>
              </button>
            </div>

            {/* Auto Spin Toggle */}
            <div className="col-span-3">
              <button
                onClick={() => {
                  sound.playClick();
                  if (autoSpinCount > 0) {
                    setAutoSpinCount(0);
                  } else {
                    setAutoSpinCount(20);
                  }
                }}
                className={`w-full py-2.5 rounded-xl text-xs font-bold border transition-all flex flex-col items-center justify-center ${
                  autoSpinCount > 0
                    ? 'bg-amber-950/60 border-amber-500 text-amber-300'
                    : 'bg-slate-900 border-gray-700 text-gray-400'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5 mb-0.5" />
                <span>অটো {autoSpinCount > 0 ? `(${autoSpinCount})` : 'স্পিন'}</span>
              </button>
            </div>

            {/* Main Spin Button */}
            <div className="col-span-6">
              <button
                onClick={handleSpin}
                disabled={isSpinning}
                className="w-full py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-amber-500/30 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${isSpinning ? 'animate-spin' : ''}`} />
                <span>{isSpinning ? 'ঘুরছে...' : 'স্পিন (SPIN)'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Lucky Wheel Bonus Modal */}
      {showLuckyWheel && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#150a28] border-2 border-amber-400 rounded-3xl max-w-sm w-full p-5 text-center shadow-2xl relative animate-fade-in">
            <span className="text-4xl animate-bounce block mb-1">🎡</span>
            <h3 className="text-lg font-black text-amber-400 font-serif">
              LUCKY WHEEL BONUS!
            </h3>
            <p className="text-xs text-gray-300 mt-1">
              ৪র্থ রিলে বোনাস হুইল সক্রিয় হয়েছে! চাকা ঘুরিয়ে জিতে নিন সর্বোচ্চ ১,০০০x জ্যাকপট!
            </p>

            {/* Giant Wheel Animation */}
            <div className="my-6 relative flex items-center justify-center">
              <div
                className={`w-36 h-36 rounded-full border-4 border-amber-400 bg-gradient-to-tr from-amber-600 via-yellow-300 to-amber-700 flex items-center justify-center shadow-2xl text-slate-950 font-black text-2xl ${
                  wheelSpinning ? 'animate-spin' : ''
                }`}
              >
                {wheelPrize ? `${wheelPrize}x` : '???'}
              </div>
            </div>

            <button
              onClick={spinLuckyWheel}
              disabled={wheelSpinning}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-sm rounded-xl shadow-lg active:scale-95 transition-all disabled:opacity-50"
            >
              {wheelSpinning ? 'হুইল ঘুরছে...' : 'চাকা ঘুরান (SPIN WHEEL)'}
            </button>
          </div>
        </div>
      )}

      {/* Big Win Celebration Modal */}
      {bigWinAmount !== null && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gradient-to-b from-[#241042] to-[#0c0516] border-2 border-amber-400 rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl animate-fade-in">
            <span className="text-5xl animate-bounce block mb-2">🎉</span>
            <h2 className="text-2xl font-black text-amber-400 tracking-wide font-serif">
              MEGA WIN!
            </h2>
            <div className="my-3 text-3xl font-black font-mono text-emerald-400 tabular-nums">
              ৳ {bigWinAmount.toLocaleString()}
            </div>
            <button
              onClick={() => setBigWinAmount(null)}
              className="mt-2 w-full py-2.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-xs rounded-xl shadow"
            >
              সংগ্রহ করুন
            </button>
          </div>
        </div>
      )}

      {/* Paytable & Rules Modal */}
      {showPaytable && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-[#120824] border border-amber-500/40 rounded-3xl max-w-md w-full p-5 text-white max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <h3 className="font-black text-amber-400 text-sm">Fortune Gems 3 পে-টেবিল</h3>
              <button
                onClick={() => setShowPaytable(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 py-3 pr-1 text-xs">
              {Object.values(SYMBOL_DEFINITIONS).map(s => (
                <div
                  key={s.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-gray-800"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{s.icon}</span>
                    <span className="font-bold">{s.nameBn}</span>
                  </div>
                  <span className="font-mono font-bold text-amber-400">{s.payout3}x</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
