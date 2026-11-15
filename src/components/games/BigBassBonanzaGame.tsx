import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Volume2, VolumeX, Sparkles, RefreshCw, Zap, Trophy, HelpCircle, Anchor, Waves, Fish } from 'lucide-react';
import { GameItem } from '../../types';
import { sound } from '../../utils/audio';

interface BigBassBonanzaGameProps {
  game?: GameItem;
  balance: number;
  onUpdateBalance: (amount: number, reason: string) => void;
  onClose: () => void;
  onOpenDeposit?: () => void;
}

interface SymbolItem {
  id: string;
  nameBn: string;
  nameEn: string;
  icon: string;
  payout5: number;
  payout4: number;
  payout3: number;
  isScatter?: boolean;
  isWild?: boolean;
  isFish?: boolean;
  fishValue?: number; // Multiple of bet (e.g. 2, 5, 10, 50)
  color: string;
}

// 10 Fixed Classic Paylines (Row indices 0 to 2 for 5 reels)
const PAYLINES: number[][] = [
  [1, 1, 1, 1, 1], // Line 1: Middle horizontal
  [0, 0, 0, 0, 0], // Line 2: Top horizontal
  [2, 2, 2, 2, 2], // Line 3: Bottom horizontal
  [0, 1, 2, 1, 0], // Line 4: V shape
  [2, 1, 0, 1, 2], // Line 5: Inverted V
  [0, 0, 1, 2, 2], // Line 6: Step down
  [2, 2, 1, 0, 0], // Line 7: Step up
  [1, 2, 2, 2, 1], // Line 8
  [1, 0, 0, 0, 1], // Line 9
  [0, 1, 0, 1, 0], // Line 10
];

const FISH_VALUES = [2, 5, 10, 15, 20, 25, 50, 100, 250, 500];

const BASE_SYMBOLS: Omit<SymbolItem, 'fishValue'>[] = [
  { id: 'bobber', nameBn: 'ফ্লোট / ববার', nameEn: 'Float', icon: '🔴', payout5: 200, payout4: 50, payout3: 15, color: 'text-red-400' },
  { id: 'rod', nameBn: 'ফিশিং রড', nameEn: 'Fishing Rod', icon: '🎣', payout5: 100, payout4: 30, payout3: 10, color: 'text-amber-400' },
  { id: 'dragonfly', nameBn: 'ড্রাগনফ্লাই', nameEn: 'Dragonfly', icon: '🦗', payout5: 50, payout4: 15, payout3: 5, color: 'text-emerald-400' },
  { id: 'box', nameBn: 'ট্যাকল বক্স', nameEn: 'Tackle Box', icon: '🧰', payout5: 50, payout4: 15, payout3: 5, color: 'text-blue-400' },
  { id: 'ace', nameBn: 'কার্ড A', nameEn: 'Ace', icon: '🅰️', payout5: 10, payout4: 3, payout3: 1, color: 'text-yellow-300' },
  { id: 'king', nameBn: 'কার্ড K', nameEn: 'King', icon: '👑', payout5: 10, payout4: 3, payout3: 1, color: 'text-cyan-300' },
  { id: 'queen', nameBn: 'কার্ড Q', nameEn: 'Queen', icon: '👸', payout5: 10, payout4: 3, payout3: 1, color: 'text-pink-300' },
  { id: 'jack', nameBn: 'কার্ড J', nameEn: 'Jack', icon: '🃏', payout5: 5, payout4: 2, payout3: 0.5, color: 'text-purple-300' },
  { id: 'ten', nameBn: 'কার্ড 10', nameEn: 'Ten', icon: '🔟', payout5: 5, payout4: 2, payout3: 0.5, color: 'text-sky-300' },
];

const getRandomReelSymbol = (isFreeSpin = false): SymbolItem => {
  const r = Math.random();
  // Scatter (Big Bass Hook)
  if (r < 0.055) {
    return {
      id: 'scatter',
      nameBn: 'বিগ ব্যাস স্ক্যাটার',
      nameEn: 'Scatter',
      icon: '🐟',
      payout5: 100,
      payout4: 20,
      payout3: 2,
      isScatter: true,
      color: 'text-emerald-300',
    };
  }

  // Fisherman Wild (Only in free spins, or rare in base game)
  if (isFreeSpin && r < 0.16) {
    return {
      id: 'fisherman',
      nameBn: 'জেলে (Fisherman)',
      nameEn: 'Wild',
      icon: '🧔‍♂️',
      payout5: 200,
      payout4: 50,
      payout3: 10,
      isWild: true,
      color: 'text-amber-300',
    };
  }

  // Money Fish Symbol
  if (r < 0.28) {
    const val = FISH_VALUES[Math.floor(Math.random() * FISH_VALUES.length)];
    return {
      id: 'fish_money',
      nameBn: `ক্যাশ ফিশ (৳${val}x)`,
      nameEn: 'Money Fish',
      icon: '🐠',
      payout5: 20,
      payout4: 5,
      payout3: 1,
      isFish: true,
      fishValue: val,
      color: 'text-teal-300',
    };
  }

  const base = BASE_SYMBOLS[Math.floor(Math.random() * BASE_SYMBOLS.length)];
  return { ...base };
};

export const BigBassBonanzaGame: React.FC<BigBassBonanzaGameProps> = ({
  game,
  balance,
  onUpdateBalance,
  onClose,
  onOpenDeposit,
}) => {
  const isSplash = game?.id?.includes('splash') || false;
  const isAmazon = game?.id?.includes('amazon') || false;
  const isHold = game?.id?.includes('hold') || false;

  // 5 Reels x 3 Rows
  const [reels, setReels] = useState<SymbolItem[][]>(() =>
    Array.from({ length: 5 }).map(() =>
      Array.from({ length: 3 }).map(() => getRandomReelSymbol(false))
    )
  );

  const [betAmount, setBetAmount] = useState<number>(20);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [lastWin, setLastWin] = useState<number>(0);
  const [winningLines, setWinningLines] = useState<number[]>([]);
  const [collectedFishCount, setCollectedFishCount] = useState<number>(0);
  const [celebrationMsg, setCelebrationMsg] = useState<string | null>(null);

  // Free spins mode states
  const [freeSpinsLeft, setFreeSpinsLeft] = useState<number>(0);
  const [isBonusRound, setIsBonusRound] = useState<boolean>(false);
  const [totalBonusWin, setTotalBonusWin] = useState<number>(0);
  const [fishermanCount, setFishermanCount] = useState<number>(0); // Progress to level up multiplier
  const [currentMultiplierLevel, setCurrentMultiplierLevel] = useState<number>(1); // 1x, 2x, 3x, 10x

  // Controls
  const [isTurbo, setIsTurbo] = useState<boolean>(false);
  const [autoSpinCount, setAutoSpinCount] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [showPaytable, setShowPaytable] = useState<boolean>(false);
  const [fishermanCasting, setFishermanCasting] = useState<boolean>(false);

  // Auto spin loop
  useEffect(() => {
    if (autoSpinCount > 0 && !isSpinning) {
      const delay = isTurbo ? 250 : 800;
      const timer = setTimeout(() => {
        spinReels();
        setAutoSpinCount(c => c - 1);
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [autoSpinCount, isSpinning]);

  // Free spins loop
  useEffect(() => {
    if (freeSpinsLeft > 0 && !isSpinning) {
      const delay = isTurbo ? 350 : 1100;
      const timer = setTimeout(() => {
        spinReels(true);
      }, delay);
      return () => clearTimeout(timer);
    } else if (freeSpinsLeft === 0 && isBonusRound && !isSpinning) {
      setIsBonusRound(false);
      setCelebrationMsg(`🎣 বিগ ব্যাস বোনাস শেষ! মোট জয়: ৳ ${totalBonusWin.toLocaleString('en-US')}`);
      sound.playJackpot();
    }
  }, [freeSpinsLeft, isBonusRound, isSpinning]);

  // Spin Reels execution
  const spinReels = (isFreeSpin = false) => {
    if (isSpinning) return;

    if (!isFreeSpin) {
      if (balance < betAmount) {
        setAutoSpinCount(0);
        if (onOpenDeposit) onOpenDeposit();
        return;
      }
      onUpdateBalance(-betAmount, `${game?.titleEn || 'Big Bass Bonanza'} স্পিন`);
    } else {
      setFreeSpinsLeft(prev => prev - 1);
    }

    setIsSpinning(true);
    setWinningLines([]);
    setLastWin(0);
    setCelebrationMsg(null);
    setCollectedFishCount(0);
    setFishermanCasting(false);
    if (soundEnabled) sound.playClick();

    // Sound ticking while spinning
    const tickInterval = setInterval(() => {
      if (soundEnabled) sound.playSpinTick();
    }, 90);

    const spinDuration = isTurbo ? 350 : 900;

    setTimeout(() => {
      clearInterval(tickInterval);

      // Generate new 5x3 reels outcome
      const newReels: SymbolItem[][] = Array.from({ length: 5 }).map(() =>
        Array.from({ length: 3 }).map(() => getRandomReelSymbol(isFreeSpin))
      );

      setReels(newReels);
      setIsSpinning(false);

      // 1. Evaluate Line Wins (from left to right across 10 paylines)
      let lineWinsTotal = 0;
      const activeLineHits: number[] = [];

      PAYLINES.forEach((line, lineIdx) => {
        const symbol0 = newReels[0][line[0]];
        if (symbol0.isScatter) return; // Scatters do not pay on regular lines

        let matchCount = 1;
        const targetId = symbol0.id;

        for (let reelIdx = 1; reelIdx < 5; reelIdx++) {
          const sym = newReels[reelIdx][line[reelIdx]];
          if (sym.id === targetId || sym.isWild) {
            matchCount++;
          } else {
            break;
          }
        }

        if (matchCount >= 3) {
          activeLineHits.push(lineIdx);
          let payout = symbol0.payout3;
          if (matchCount === 5) payout = symbol0.payout5;
          else if (matchCount === 4) payout = symbol0.payout4;

          lineWinsTotal += betAmount * payout;
        }
      });

      setWinningLines(activeLineHits);

      // 2. Count Scatters (3+ triggers 10, 15, or 20 Free Spins)
      let scatterCount = 0;
      newReels.forEach(reel => {
        reel.forEach(sym => {
          if (sym.isScatter) scatterCount++;
        });
      });

      if (scatterCount >= 3) {
        const spinsAwarded = scatterCount >= 5 ? 20 : scatterCount === 4 ? 15 : 10;
        setFreeSpinsLeft(prev => prev + spinsAwarded);
        setIsBonusRound(true);
        setCelebrationMsg(`🐟 ${scatterCount}টি স্ক্যাটার! ${spinsAwarded}টি ফ্রি স্পিন আনলক!`);
        if (soundEnabled) {
          sound.playSplash();
          sound.playJackpot();
        }
      }

      // 3. Fisherman Wild Cash Collection Feature during Free Spins
      let fishCollectionWin = 0;
      if (isFreeSpin) {
        let fishermanFound = 0;
        let fishSymbols: { val: number }[] = [];

        newReels.forEach(reel => {
          reel.forEach(sym => {
            if (sym.isWild) fishermanFound++;
            if (sym.isFish && sym.fishValue) fishSymbols.push({ val: sym.fishValue });
          });
        });

        if (fishermanFound > 0) {
          setFishermanCasting(true);

          // Level up fisherman meter
          const updatedFishermanCount = fishermanCount + fishermanFound;
          setFishermanCount(updatedFishermanCount);

          // Calculate current multiplier
          let currentMult = 1;
          if (updatedFishermanCount >= 12) currentMult = 10;
          else if (updatedFishermanCount >= 8) currentMult = 3;
          else if (updatedFishermanCount >= 4) currentMult = 2;
          setCurrentMultiplierLevel(currentMult);

          // Retrigger check at 4, 8, 12 fishermen
          if (updatedFishermanCount >= 4 && fishermanCount < 4) {
            setFreeSpinsLeft(prev => prev + 10);
            setCelebrationMsg('🎣 লেভেল ২ আনলক! +১০ ফ্রি স্পিন ও ২x ক্যাশ মাল্টিপ্লায়ার!');
          } else if (updatedFishermanCount >= 8 && fishermanCount < 8) {
            setFreeSpinsLeft(prev => prev + 10);
            setCelebrationMsg('🎣 লেভেল ৩ আনলক! +১০ ফ্রি স্পিন ও ৩x ক্যাশ মাল্টিপ্লায়ার!');
          } else if (updatedFishermanCount >= 12 && fishermanCount < 12) {
            setFreeSpinsLeft(prev => prev + 10);
            setCelebrationMsg('🔥 লেভেল ৪ আনলক! +১০ ফ্রি স্পিন ও মেগা ১০x মাল্টিপ্লায়ার!');
          }

          // Reel in fish
          if (fishSymbols.length > 0) {
            const sumFishValue = fishSymbols.reduce((acc, f) => acc + f.val, 0);
            fishCollectionWin = betAmount * sumFishValue * fishermanFound * currentMult;
            setCollectedFishCount(fishSymbols.length);
            if (soundEnabled) sound.playReelIn();
          }
        }
      }

      // Total win for round
      const totalRoundWin = lineWinsTotal + fishCollectionWin;

      if (totalRoundWin > 0) {
        setLastWin(totalRoundWin);
        onUpdateBalance(totalRoundWin, `${game?.titleEn || 'Big Bass'} জয় (+৳${totalRoundWin})`);
        if (isFreeSpin) {
          setTotalBonusWin(prev => prev + totalRoundWin);
        }
        if (totalRoundWin >= betAmount * 20) {
          if (soundEnabled) sound.playJackpot();
        } else {
          if (soundEnabled) sound.playWinChime();
        }
      }
    }, spinDuration);
  };

  // Buy Free Spins Feature (100x bet)
  const handleBuyBonus = () => {
    if (isSpinning || isBonusRound) return;
    const cost = betAmount * 100;
    if (balance < cost) {
      if (onOpenDeposit) onOpenDeposit();
      return;
    }
    onUpdateBalance(-cost, 'বিগ ব্যাস ফ্রি স্পিন ফিচার ক্রয় (100x)');
    setFreeSpinsLeft(10);
    setIsBonusRound(true);
    setFishermanCount(0);
    setCurrentMultiplierLevel(1);
    setTotalBonusWin(0);
    setCelebrationMsg('🐟 ফ্রি স্পিন বোনাস সক্রিয়! ১০টি স্পিন শুরু হচ্ছে!');
    sound.playSplash();
  };

  return (
    <div className="flex flex-col h-full bg-[#051329] text-white select-none overflow-y-auto">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-3 sm:px-6 py-2.5 bg-[#081a38] border-b border-cyan-500/30 shrink-0 sticky top-0 z-30 shadow-lg">
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
              <span className="font-black text-sm sm:text-base text-cyan-300 tracking-wide font-sans">
                {game?.titleEn || 'Big Bass Bonanza'}
              </span>
              <span className="text-[10px] font-black text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-300 px-2 py-0.5 rounded-full uppercase tracking-wider">
                {isSplash ? 'SPLASH' : isAmazon ? 'AMAZON' : isHold ? 'HOLD & SPIN' : 'PRAGMATIC'}
              </span>
            </div>
            <div className="text-[10px] text-cyan-400/80 flex items-center gap-1">
              <span>১০ ফিক্সড পে-লাইন</span>
              <span>•</span>
              <span className="text-emerald-400">RTP 96.71%</span>
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
          <div className="flex items-center gap-2 pl-2 border-l border-cyan-800/60">
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

      {/* Main Underwater Fishing Arena */}
      <div className="flex-1 max-w-5xl w-full mx-auto p-3 sm:p-5 flex flex-col justify-between">
        {/* Top Status Indicators (Free Spins + Fisherman Collection Meter) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
          {/* Free Spins Left */}
          <div className="p-2 sm:p-2.5 rounded-2xl bg-gradient-to-r from-cyan-950/80 to-slate-900 border border-cyan-500/40 flex items-center justify-between">
            <div className="text-[11px] text-cyan-300">ফ্রি স্পিন:</div>
            <div className="text-base font-black text-amber-400 font-mono">
              {freeSpinsLeft > 0 ? `${freeSpinsLeft} টি` : '০'}
            </div>
          </div>

          {/* Fisherman Collection Progress */}
          <div className="p-2 sm:p-2.5 rounded-2xl bg-gradient-to-r from-emerald-950/80 to-slate-900 border border-emerald-500/40 flex items-center justify-between">
            <div className="text-[11px] text-emerald-300">জেলে ট্র্যাকার:</div>
            <div className="text-sm font-black text-emerald-400 font-mono">
              {fishermanCount}/12 ({currentMultiplierLevel}x)
            </div>
          </div>

          {/* Multiplier Level */}
          <div className="p-2 sm:p-2.5 rounded-2xl bg-gradient-to-r from-amber-950/80 to-slate-900 border border-amber-500/40 flex items-center justify-between">
            <div className="text-[11px] text-amber-300">ক্যাশ মাল্টিপ্লায়ার:</div>
            <div className="text-base font-black text-amber-400 font-mono">
              {currentMultiplierLevel}x
            </div>
          </div>

          {/* Last Win Amount */}
          <div className="p-2 sm:p-2.5 rounded-2xl bg-gradient-to-r from-teal-950/80 to-slate-900 border border-teal-500/40 flex items-center justify-between">
            <div className="text-[11px] text-teal-300">সর্বশেষ জয়:</div>
            <div className="text-base font-black text-emerald-400 font-mono">
              ৳ {lastWin.toLocaleString('en-US')}
            </div>
          </div>
        </div>

        {/* Celebration Toast */}
        {celebrationMsg && (
          <div className="mb-3 py-2 px-4 rounded-2xl bg-gradient-to-r from-teal-500 via-emerald-400 to-cyan-500 text-slate-950 font-black text-xs sm:text-sm text-center shadow-lg animate-bounce">
            {celebrationMsg}
          </div>
        )}

        {/* Underwater 5x3 Grid Stage */}
        <div className="relative flex flex-col lg:flex-row items-center justify-center gap-4 my-2">
          {/* Buy Free Spins Feature Box on Left */}
          <div className="hidden lg:flex flex-col gap-3 w-44">
            <button
              onClick={handleBuyBonus}
              disabled={isSpinning || isBonusRound}
              className="p-3 rounded-2xl bg-gradient-to-b from-teal-500 via-emerald-600 to-cyan-700 hover:brightness-110 border-2 border-cyan-300 text-white font-black text-xs shadow-xl active:scale-95 transition-all flex flex-col items-center justify-center text-center gap-1 disabled:opacity-50"
            >
              <Fish className="w-5 h-5 text-amber-300" />
              <span className="uppercase tracking-wider">ফ্রি স্পিন কিনুন</span>
              <span className="text-[11px] bg-slate-950 text-cyan-300 px-2.5 py-0.5 rounded-full font-mono mt-0.5 border border-cyan-500/50">
                ৳ {betAmount * 100}
              </span>
            </button>
            <div className="p-3 rounded-2xl bg-slate-900/80 border border-cyan-900 text-[10px] text-cyan-300/80 leading-relaxed text-center">
              ১০টি ফ্রি স্পিনসহ জেলে ক্যাশ কালেকশন ফিচার আনলক করুন
            </div>
          </div>

          {/* 5 Reels x 3 Rows Underwater Frame */}
          <div className="relative bg-gradient-to-b from-[#092347] via-[#051733] to-[#020b1c] rounded-3xl p-3 sm:p-5 border-4 border-cyan-500/60 shadow-2xl shadow-cyan-950/80 overflow-hidden">
            {/* Water bubbles overlay */}
            <div className="absolute inset-0 bg-radial from-transparent to-black/30 pointer-events-none" />

            {/* Header water bar */}
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-cyan-500/30 text-xs">
              <span className="text-cyan-300 font-bold flex items-center gap-1.5">
                <Waves className="w-4 h-4 text-cyan-400" />
                ১০ পে-লাইন ফিশিং রিল
              </span>
              <span className="text-gray-300 font-mono text-[11px]">
                {isBonusRound ? `🎣 ফ্রি স্পিন সক্রিয় (${currentMultiplierLevel}x)` : isSpinning ? 'রিল ঘুরছে...' : 'স্পিন প্রস্তুত'}
              </span>
            </div>

            {/* 5 Columns x 3 Rows */}
            <div className="grid grid-cols-5 gap-2 sm:gap-3 relative z-10">
              {reels.map((reel, rIdx) => (
                <div key={rIdx} className="flex flex-col gap-2 sm:gap-3">
                  {reel.map((sym, rowIdx) => {
                    const isLineHit = winningLines.some(lineIdx => PAYLINES[lineIdx][rIdx] === rowIdx);
                    return (
                      <div
                        key={rowIdx}
                        className={`w-14 h-16 sm:w-20 sm:h-24 md:w-24 md:h-28 rounded-2xl border flex flex-col items-center justify-between p-1.5 sm:p-2 relative transition-all duration-200 ${
                          isLineHit
                            ? 'bg-amber-400 text-slate-950 scale-105 border-white shadow-[0_0_15px_#fde047] z-10 animate-bounce'
                            : sym.isWild
                            ? 'bg-gradient-to-br from-amber-600/50 via-yellow-500/40 to-amber-700/50 border-amber-400 shadow-lg'
                            : sym.isScatter
                            ? 'bg-gradient-to-br from-emerald-600/50 via-teal-500/40 to-cyan-700/50 border-emerald-400'
                            : sym.isFish
                            ? 'bg-gradient-to-br from-teal-900/60 to-cyan-950/60 border-cyan-500/60'
                            : 'bg-gradient-to-br from-slate-900/90 to-blue-950/60 border-cyan-800/40'
                        } ${isSpinning ? 'opacity-70 blur-[0.5px] scale-95' : 'scale-100'}`}
                      >
                        {/* Fish cash tag badge */}
                        {sym.isFish && sym.fishValue && (
                          <span className="absolute top-1 right-1 text-[9px] sm:text-[10px] font-black font-mono px-1 rounded bg-amber-400 text-slate-950 shadow-xs">
                            ৳{sym.fishValue * betAmount}
                          </span>
                        )}

                        {/* Symbol Emoji Icon */}
                        <span className="text-2xl sm:text-4xl md:text-5xl my-auto drop-shadow-md">
                          {sym.icon}
                        </span>

                        {/* Title text */}
                        <span
                          className={`text-[9px] sm:text-[10px] font-bold font-mono tracking-tight truncate max-w-full ${
                            isLineHit ? 'text-slate-950' : sym.color
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

          {/* Right Mascot: Cheerful Fisherman */}
          <div className="flex flex-col items-center justify-center p-4 rounded-3xl bg-gradient-to-b from-cyan-950/40 via-blue-950/30 to-slate-950 border border-cyan-500/30 w-full sm:w-48 text-center relative">
            <div className="relative my-2">
              <div
                className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-tr from-teal-500 via-cyan-400 to-blue-600 border-4 ${
                  fishermanCasting ? 'border-yellow-300 shadow-[0_0_25px_#22d3ee] scale-110' : 'border-cyan-400 shadow-xl'
                } flex items-center justify-center text-5xl sm:text-6xl transition-all duration-300`}
              >
                🧔‍♂️
              </div>
              {fishermanCasting && (
                <div className="absolute inset-0 rounded-full border-2 border-cyan-200 animate-ping pointer-events-none" />
              )}
            </div>

            <div className="font-bold text-cyan-300 text-sm sm:text-base">
              বিগ ব্যাস ফিশারম্যান
            </div>
            <p className="text-[10px] text-gray-300 mt-1 leading-relaxed">
              ফ্রি স্পিন চলাকালে জেলে সকল ক্যাশ মাছের টাকা এক সাথে রিল-ইন করে সংগ্রহ করে!
            </p>

            <button
              onClick={handleBuyBonus}
              disabled={isSpinning || isBonusRound}
              className="lg:hidden mt-3 w-full py-2 px-3 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 font-black text-xs shadow-md active:scale-95 transition-all disabled:opacity-50"
            >
              ফ্রি স্পিন কিনুন (৳{betAmount * 100})
            </button>
          </div>
        </div>

        {/* Controls Cockpit */}
        <div className="mt-3 bg-[#081a38] p-3 sm:p-4 rounded-3xl border border-cyan-900/60">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Bet Denomination Presets */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 w-full sm:w-auto">
              <span className="text-[11px] text-gray-400 font-semibold mr-1 shrink-0">বেট:</span>
              {[10, 20, 50, 100, 250, 500, 1000].map(val => (
                <button
                  key={val}
                  onClick={() => setBetAmount(val)}
                  disabled={isSpinning}
                  className={`px-3 py-1.5 text-xs font-mono font-bold rounded-xl transition-all shrink-0 ${
                    betAmount === val
                      ? 'bg-gradient-to-r from-cyan-400 to-teal-300 text-slate-950 shadow-md font-black scale-105'
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
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                    : 'bg-slate-800 border-slate-700 text-gray-400 hover:text-white'
                }`}
              >
                <Zap className={`w-4 h-4 ${isTurbo ? 'text-cyan-400 fill-cyan-400' : ''}`} />
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
                onClick={() => spinReels(false)}
                disabled={isSpinning || isBonusRound}
                className="flex-1 sm:flex-none px-8 py-3.5 bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 hover:brightness-110 text-slate-950 font-black text-sm rounded-2xl shadow-xl shadow-cyan-500/30 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Sparkles className="w-5 h-5 text-slate-950 fill-slate-950" />
                <span>{isSpinning ? 'রিল ঘুরছে...' : `স্পিন (৳${betAmount})`}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Paytable Modal */}
      {showPaytable && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1f3b] border border-cyan-500/40 rounded-3xl max-w-lg w-full p-5 text-white shadow-2xl relative animate-fade-in max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <h3 className="font-bold text-base text-cyan-300 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                <span>Big Bass Bonanza পে-টেবিল ও নিয়মাবলী</span>
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
                • <strong>১০ ফিক্সড পে-লাইন:</strong> বাম থেকে ডানে একই পে-লাইনে ৩ বা ততোধিক প্রতীক মিললে পেআউট হয়।
              </p>
              <p>
                • <strong>ফিশারম্যান ওয়াইল্ড (🧔‍♂️):</strong> ফ্রি স্পিনে রিলের সকল ক্যাশ মাছের টাকা সংগ্রহ করে।
              </p>
              <p>
                • <strong>জেলে মিটার ও মাল্টিপ্লায়ার:</strong> প্রতি ৪টি জেলে প্রতীকে +১০ ফ্রি স্পিন ও মাল্টিপ্লায়ার আপগ্রেড হয় (২x, ৩x, এবং ১০x)!
              </p>
              <p>
                • <strong>স্ক্যাটার পে:</strong> ৩, ৪ বা ৫টি বিগ ব্যাস স্ক্যাটারে যথাক্রমে ১০, ১৫ বা ২০টি ফ্রি স্পিন পাওয়া যায়।
              </p>
            </div>

            {/* Symbol Payout Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
              {BASE_SYMBOLS.map(s => (
                <div key={s.id} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
                  <div className="text-2xl mb-1">{s.icon}</div>
                  <div className="font-bold text-white text-[11px] truncate">{s.nameEn}</div>
                  <div className="text-[10px] text-amber-400 font-mono mt-0.5">
                    ৫টি: {s.payout5}x | ৪টি: {s.payout4}x | ৩টি: {s.payout3}x
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
