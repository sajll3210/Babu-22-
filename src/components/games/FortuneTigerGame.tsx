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
  CheckCircle2,
  Info,
} from 'lucide-react';
import { GameItem } from '../../types';
import { sound } from '../../utils/audio';

interface FortuneTigerGameProps {
  game: GameItem;
  balance: number;
  onUpdateBalance: (amount: number, description: string) => void;
  onClose: () => void;
}

// 7 Authentic Fortune Tiger symbols
export interface TigerSymbol {
  id: string;
  nameBn: string;
  nameEn: string;
  multiplier: number; // 3 of a kind on 1 payline
  isWild?: boolean;
  color: string;
  border: string;
  bgGradient: string;
  emoji: string;
  rarity: 'wild' | 'high' | 'mid' | 'low';
}

export const TIGER_SYMBOLS: TigerSymbol[] = [
  {
    id: 'wild_tiger',
    nameBn: 'লাকি গোল্ডেন টাইগার (WILD)',
    nameEn: 'Fortune Tiger Wild',
    multiplier: 250,
    isWild: true,
    color: '#fbbf24',
    border: 'border-amber-400',
    bgGradient: 'from-amber-600/40 via-yellow-500/30 to-amber-900/60',
    emoji: '🐯',
    rarity: 'wild',
  },
  {
    id: 'golden_sycee',
    nameBn: 'স্বর্ণের ইউয়ানবাও (গোল্ড ইনগট)',
    nameEn: 'Golden Sycee Ingot',
    multiplier: 100,
    color: '#facc15',
    border: 'border-yellow-400',
    bgGradient: 'from-yellow-500/30 via-amber-500/20 to-yellow-950/60',
    emoji: '🪙',
    rarity: 'high',
  },
  {
    id: 'jade_amulet',
    nameBn: 'সবুজ জেড লকেট (Jade Amulet)',
    nameEn: 'Jade Amulet',
    multiplier: 25,
    color: '#4ade80',
    border: 'border-emerald-400',
    bgGradient: 'from-emerald-500/30 via-green-500/20 to-emerald-950/60',
    emoji: '📿',
    rarity: 'high',
  },
  {
    id: 'coin_pouch',
    nameBn: 'স্বর্ণের মুদ্রার থলি (Coin Pouch)',
    nameEn: 'Lucky Coin Pouch',
    multiplier: 10,
    color: '#fb923c',
    border: 'border-orange-400',
    bgGradient: 'from-orange-500/30 via-amber-500/20 to-orange-950/60',
    emoji: '💰',
    rarity: 'mid',
  },
  {
    id: 'red_envelope',
    nameBn: 'শুভ লাল খাম (Red Envelope)',
    nameEn: 'Lucky Red Envelope',
    multiplier: 8,
    color: '#ef4444',
    border: 'border-red-500',
    bgGradient: 'from-red-600/30 via-rose-500/20 to-red-950/60',
    emoji: '🧧',
    rarity: 'mid',
  },
  {
    id: 'firecrackers',
    nameBn: 'উৎসবের পটকা (Firecrackers)',
    nameEn: 'Festive Firecrackers',
    multiplier: 5,
    color: '#f43f5e',
    border: 'border-pink-500',
    bgGradient: 'from-rose-500/30 via-red-500/20 to-rose-950/60',
    emoji: '🧨',
    rarity: 'low',
  },
  {
    id: 'mandarin_oranges',
    nameBn: 'লাকি ম্যান্ডারিন কমলা (Oranges)',
    nameEn: 'Golden Mandarins',
    multiplier: 3,
    color: '#f97316',
    border: 'border-amber-500',
    bgGradient: 'from-orange-500/30 via-amber-400/20 to-orange-950/60',
    emoji: '🍊',
    rarity: 'low',
  },
];

// The 5 fixed paylines on 3x3 grid: [row, col]
export const PAYLINES = [
  { id: 1, name: 'লাইন ১ (টপ অনুভূমিক)', coords: [[0, 0], [0, 1], [0, 2]], color: '#ef4444' },
  { id: 2, name: 'লাইন ২ (মাঝের অনুভূমিক)', coords: [[1, 0], [1, 1], [1, 2]], color: '#eab308' },
  { id: 3, name: 'লাইন ৩ (নিচের অনুভূমিক)', coords: [[2, 0], [2, 1], [2, 2]], color: '#10b981' },
  { id: 4, name: 'লাইন ৪ (উপর-বাম থেকে নিচ-ডান)', coords: [[0, 0], [1, 1], [2, 2]], color: '#3b82f6' },
  { id: 5, name: 'লাইন ৫ (নিচ-বাম থেকে উপর-ডান)', coords: [[2, 0], [1, 1], [0, 2]], color: '#a855f7' },
];

export const BET_SIZES = [10, 20, 50, 100, 250, 500, 1000, 2500, 5000];

export const FortuneTigerGame: React.FC<FortuneTigerGameProps> = ({
  game,
  balance,
  onUpdateBalance,
  onClose,
}) => {
  const [bet, setBet] = useState<number>(50);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [isTurbo, setIsTurbo] = useState<boolean>(false);
  const [isSoundMuted, setIsSoundMuted] = useState<boolean>(false);
  const [autoSpinCount, setAutoSpinCount] = useState<number>(0);

  // 3x3 grid state: array of 9 symbols (indices 0..8)
  const [grid, setGrid] = useState<TigerSymbol[]>(() => {
    return [
      TIGER_SYMBOLS[0], TIGER_SYMBOLS[1], TIGER_SYMBOLS[0],
      TIGER_SYMBOLS[2], TIGER_SYMBOLS[0], TIGER_SYMBOLS[3],
      TIGER_SYMBOLS[1], TIGER_SYMBOLS[4], TIGER_SYMBOLS[1],
    ];
  });

  // Winning states
  const [activeWinningLines, setActiveWinningLines] = useState<number[]>([]);
  const [winningCellIndices, setWinningCellIndices] = useState<Set<number>>(new Set());
  const [lastWinAmount, setLastWinAmount] = useState<number>(0);
  const [isFullGrid10x, setIsFullGrid10x] = useState<boolean>(false);

  // Fortune Tiger Respin Feature state
  const [isTigerFeatureActive, setIsTigerFeatureActive] = useState<boolean>(false);
  const [featureChosenSymbol, setFeatureChosenSymbol] = useState<TigerSymbol | null>(null);
  const [lockedIndices, setLockedIndices] = useState<Set<number>>(new Set());
  const [featureRespinRound, setFeatureRespinRound] = useState<number>(0);
  const [showFeatureIntroModal, setShowFeatureIntroModal] = useState<boolean>(false);
  const [showFeatureSummaryModal, setShowFeatureSummaryModal] = useState<boolean>(false);
  const [featureTotalWin, setFeatureTotalWin] = useState<number>(0);

  // UI Modals
  const [showPaytable, setShowPaytable] = useState<boolean>(false);
  const [showWinCelebration, setShowWinCelebration] = useState<boolean>(false);
  const [celebrationWin, setCelebrationWin] = useState<{ amount: number; type: 'big' | 'mega' | 'super' | 'fortune10x' } | null>(null);

  // Tiger Mascot Mood & Animations
  const [tigerMood, setTigerMood] = useState<'idle' | 'cheering' | 'roaring' | 'respin' | 'rich'>('idle');
  const [tigerDialogue, setTigerDialogue] = useState<string>('শুভ ভাগ্য ও সমৃদ্ধি আপনার জন্য অপেক্ষা করছে!');

  // Reel spinning visual effect (spinning columns)
  const [spinningReels, setSpinningReels] = useState<boolean[]>([false, false, false]);

  // History log
  const [history, setHistory] = useState<Array<{ id: number; bet: number; win: number; feature: boolean }>>([]);

  const isSpinningRef = useRef(isSpinning);
  isSpinningRef.current = isSpinning;

  const autoSpinRef = useRef(autoSpinCount);
  autoSpinRef.current = autoSpinCount;

  const playSound = useCallback((fn: () => void) => {
    if (!isSoundMuted) fn();
  }, [isSoundMuted]);

  // Mascot random pleasant dialogues
  useEffect(() => {
    const dialogues = [
      '🧧 ফরচুন টাইগার আপনাকে আশীর্বাদ করছে!',
      '🪙 সোনালী ইনগট আনুন, ১০x মেগা মাল্টিপ্লায়ার জিতুন!',
      '🐯 টাইগার যখন গর্জন করবে, তখনই রিস্পিন বোনাস চালু হবে!',
      '✨ ৯টি একই প্রতীকে পান ১০ গুণ গ্র্যান্ড পেআউট!',
      '🎋 আজকের দিনটি আপনার ভাগ্য পরীক্ষার শ্রেষ্ঠ সময়!',
    ];
    const timer = setInterval(() => {
      if (!isTigerFeatureActive && !isSpinningRef.current) {
        const rand = dialogues[Math.floor(Math.random() * dialogues.length)];
        setTigerDialogue(rand);
      }
    }, 7000);
    return () => clearInterval(timer);
  }, [isTigerFeatureActive]);

  // Generate weighted random symbol
  const getRandomSymbol = useCallback((boostWild = false): TigerSymbol => {
    const roll = Math.random();
    if (boostWild) {
      if (roll < 0.25) return TIGER_SYMBOLS[0]; // Wild
      if (roll < 0.45) return TIGER_SYMBOLS[1]; // Golden Sycee
      if (roll < 0.65) return TIGER_SYMBOLS[2]; // Jade
      if (roll < 0.80) return TIGER_SYMBOLS[3]; // Coin Pouch
      if (roll < 0.90) return TIGER_SYMBOLS[4]; // Red Envelope
      if (roll < 0.95) return TIGER_SYMBOLS[5]; // Firecrackers
      return TIGER_SYMBOLS[6]; // Oranges
    }

    // Standard distribution
    if (roll < 0.08) return TIGER_SYMBOLS[0]; // Wild Tiger (rare, pays 250x)
    if (roll < 0.18) return TIGER_SYMBOLS[1]; // Golden Sycee
    if (roll < 0.32) return TIGER_SYMBOLS[2]; // Jade Amulet
    if (roll < 0.48) return TIGER_SYMBOLS[3]; // Coin Pouch
    if (roll < 0.64) return TIGER_SYMBOLS[4]; // Red Envelope
    if (roll < 0.82) return TIGER_SYMBOLS[5]; // Firecrackers
    return TIGER_SYMBOLS[6]; // Mandarin Oranges
  }, []);

  // Helper to check winning paylines on a 3x3 grid
  const evaluateGrid = useCallback((currentGrid: TigerSymbol[], currentBet: number) => {
    const winningLines: number[] = [];
    const winningCells = new Set<number>();
    let totalLineWin = 0;

    // Line bet is totalBet / 5
    const lineBet = currentBet / 5;

    PAYLINES.forEach(line => {
      const [r1, c1] = line.coords[0];
      const [r2, c2] = line.coords[1];
      const [r3, c3] = line.coords[2];

      const s1 = currentGrid[r1 * 3 + c1];
      const s2 = currentGrid[r2 * 3 + c2];
      const s3 = currentGrid[r3 * 3 + c3];

      // Determine match: symbols match or are wild
      // If all 3 are wild -> 250x
      if (s1.isWild && s2.isWild && s3.isWild) {
        winningLines.push(line.id);
        winningCells.add(r1 * 3 + c1);
        winningCells.add(r2 * 3 + c2);
        winningCells.add(r3 * 3 + c3);
        totalLineWin += lineBet * s1.multiplier;
        return;
      }

      // Find non-wild symbol
      const nonWild = [s1, s2, s3].find(s => !s.isWild);
      if (nonWild) {
        const matches1 = s1.isWild || s1.id === nonWild.id;
        const matches2 = s2.isWild || s2.id === nonWild.id;
        const matches3 = s3.isWild || s3.id === nonWild.id;

        if (matches1 && matches2 && matches3) {
          winningLines.push(line.id);
          winningCells.add(r1 * 3 + c1);
          winningCells.add(r2 * 3 + c2);
          winningCells.add(r3 * 3 + c3);
          totalLineWin += lineBet * nonWild.multiplier;
        }
      }
    });

    // Check Full Screen (all 9 spots part of winning lines or all matching)
    // In PG Soft Fortune Tiger, when all 9 positions are filled with paying combinations, 10x multiplier applies to the total win!
    let fullGridMultiplier = 1;
    let isFull = false;

    if (winningLines.length === 5 || winningCells.size === 9) {
      // All 9 cells participate in wins
      fullGridMultiplier = 10;
      isFull = true;
    }

    const finalWin = Math.round(totalLineWin * fullGridMultiplier);

    return {
      winningLines,
      winningCells,
      totalWin: finalWin,
      isFullGrid: isFull,
    };
  }, []);

  // Main spin execution
  const executeSpin = useCallback(() => {
    if (isSpinning || isTigerFeatureActive) return;

    if (balance < bet) {
      setAutoSpinCount(0);
      playSound(() => sound.playCrash());
      setTigerDialogue('আপনার একাউন্টে পর্যাপ্ত ব্যালেন্স নেই! ডিপোজিট করুন।');
      return;
    }

    // Deduct bet
    onUpdateBalance(-bet, `ফরচুন টাইগার বাজি: ৳${bet}`);
    setIsSpinning(true);
    setActiveWinningLines([]);
    setWinningCellIndices(new Set());
    setLastWinAmount(0);
    setIsFullGrid10x(false);
    setTigerMood('cheering');
    setSpinningReels([true, true, true]);

    playSound(() => sound.playSpinTick());

    // Check if Fortune Tiger Feature triggers (approx 5-8% probability or lucky streak)
    const triggerFeature = Math.random() < 0.08;

    const spinDuration = isTurbo ? 400 : 900;

    // Sequential reel stops
    setTimeout(() => {
      setSpinningReels([false, true, true]);
      playSound(() => sound.playSpinTick());
    }, spinDuration * 0.5);

    setTimeout(() => {
      setSpinningReels([false, false, true]);
      playSound(() => sound.playSpinTick());
    }, spinDuration * 0.75);

    setTimeout(() => {
      setSpinningReels([false, false, false]);

      if (triggerFeature) {
        // TRIGGER FORTUNE TIGER RESPIN FEATURE
        setIsSpinning(false);
        startFortuneTigerFeature();
      } else {
        // Regular Spin Outcome
        // Generate 3x3 grid
        const newGrid: TigerSymbol[] = [];
        for (let i = 0; i < 9; i++) {
          newGrid.push(getRandomSymbol());
        }

        // Random chance of forced nice win for excitement
        if (Math.random() < 0.28) {
          const luckySym = TIGER_SYMBOLS[Math.floor(Math.random() * (TIGER_SYMBOLS.length - 1)) + 1];
          // Pick a random payline
          const line = PAYLINES[Math.floor(Math.random() * PAYLINES.length)];
          line.coords.forEach(([r, c]) => {
            newGrid[r * 3 + c] = Math.random() < 0.3 ? TIGER_SYMBOLS[0] : luckySym;
          });
        }

        setGrid(newGrid);

        // Evaluate wins
        const result = evaluateGrid(newGrid, bet);

        if (result.totalWin > 0) {
          setActiveWinningLines(result.winningLines);
          setWinningCellIndices(result.winningCells);
          setLastWinAmount(result.totalWin);
          setIsFullGrid10x(result.isFullGrid);

          onUpdateBalance(result.totalWin, `ফরচুন টাইগার জয়: ৳${result.totalWin}`);

          if (result.isFullGrid) {
            setTigerMood('rich');
            playSound(() => sound.playFortuneTigerRoar());
            playSound(() => sound.playGong());
            setCelebrationWin({ amount: result.totalWin, type: 'fortune10x' });
            setShowWinCelebration(true);
            setTigerDialogue(`🎉 অবিশ্বাস্য! ৯টি ঘর পূর্ণ! ১০x মেগা মাল্টিপ্লায়ার বুস্টে মোট জয় ৳${result.totalWin}!`);
          } else if (result.totalWin >= bet * 20) {
            setTigerMood('rich');
            playSound(() => sound.playJackpot());
            setCelebrationWin({
              amount: result.totalWin,
              type: result.totalWin >= bet * 50 ? 'super' : 'mega',
            });
            setShowWinCelebration(true);
            setTigerDialogue(`🔥 বিশাল মেগা জয়! ৳${result.totalWin} আপনার ব্যালেন্সে যোগ হয়েছে!`);
          } else {
            setTigerMood('cheering');
            playSound(() => sound.playWinChime());
            setTigerDialogue(`✨ অভিনন্দন! আপনি ৳${result.totalWin} জিতেছেন!`);
          }

          setHistory(prev => [
            { id: Date.now(), bet, win: result.totalWin, feature: false },
            ...prev.slice(0, 19),
          ]);
        } else {
          setTigerMood('idle');
          setHistory(prev => [
            { id: Date.now(), bet, win: 0, feature: false },
            ...prev.slice(0, 19),
          ]);
        }

        setIsSpinning(false);

        // Handle auto-spin
        if (autoSpinRef.current > 0) {
          setAutoSpinCount(c => c - 1);
          setTimeout(() => {
            executeSpin();
          }, isTurbo ? 600 : 1200);
        }
      }
    }, spinDuration);
  }, [
    isSpinning,
    isTigerFeatureActive,
    balance,
    bet,
    isTurbo,
    getRandomSymbol,
    evaluateGrid,
    onUpdateBalance,
    playSound,
  ]);

  // START FORTUNE TIGER RESPIN FEATURE
  const startFortuneTigerFeature = useCallback(() => {
    // Play Tiger Roar and gong
    playSound(() => sound.playFortuneTigerRoar());
    playSound(() => sound.playGong());

    // Pick a paying symbol (excluding Wild initially as the base chosen symbol)
    const candidates = TIGER_SYMBOLS.slice(1);
    const chosen = candidates[Math.floor(Math.random() * candidates.length)];
    setFeatureChosenSymbol(chosen);
    setIsTigerFeatureActive(true);
    setLockedIndices(new Set());
    setFeatureRespinRound(1);
    setFeatureTotalWin(0);
    setTigerMood('roaring');
    setTigerDialogue(`🐯 গর্জন! ফরচুন টাইগার ফিচার সক্রিয়! প্রতীক: ${chosen.nameBn}`);
    setShowFeatureIntroModal(true);
  }, [playSound]);

  // Execute one respin step in the Fortune Tiger Feature
  const runFeatureRespin = useCallback((
    currentLocked: Set<number>,
    currentGrid: TigerSymbol[],
    chosen: TigerSymbol,
    round: number
  ) => {
    setIsSpinning(true);
    setSpinningReels([true, true, true]);
    playSound(() => sound.playSpinTick());

    const spinDuration = isTurbo ? 350 : 700;

    setTimeout(() => {
      setSpinningReels([false, false, false]);
      const newGrid = [...currentGrid];
      const newlyLocked = new Set(currentLocked);
      let landedAnyNew = false;

      // For every unlocked slot in the 3x3, it can land: chosen symbol, Wild, or empty
      for (let i = 0; i < 9; i++) {
        if (!newlyLocked.has(i)) {
          const rand = Math.random();
          // High chance to land symbol to make the feature thrilling
          if (rand < 0.42) {
            newGrid[i] = chosen;
            newlyLocked.add(i);
            landedAnyNew = true;
          } else if (rand < 0.55) {
            newGrid[i] = TIGER_SYMBOLS[0]; // Wild
            newlyLocked.add(i);
            landedAnyNew = true;
          } else {
            // Placeholder/empty symbol during respin
            newGrid[i] = {
              id: 'empty_' + i,
              nameBn: 'খালি',
              nameEn: 'Blank',
              multiplier: 0,
              color: '#334155',
              border: 'border-slate-800',
              bgGradient: 'from-slate-900/60 to-slate-950/90',
              emoji: '·',
              rarity: 'low',
            };
          }
        }
      }

      setGrid(newGrid);
      setLockedIndices(newlyLocked);

      // Check if all 9 positions are filled
      if (newlyLocked.size === 9) {
        // Full screen hit!
        playSound(() => sound.playGong());
        playSound(() => sound.playFortuneTigerRoar());
        setIsSpinning(false);
        finishFeature(newGrid, newlyLocked, chosen, true);
        return;
      }

      // If at least one new symbol landed, continue respin
      if (landedAnyNew) {
        playSound(() => sound.playWinChime());
        setTigerMood('respin');
        setTigerDialogue(`🎉 আরও প্রতীক লক হয়েছে! (${newlyLocked.size}/৯) রিস্পিন চলছে...`);

        setTimeout(() => {
          runFeatureRespin(newlyLocked, newGrid, chosen, round + 1);
        }, isTurbo ? 500 : 900);
      } else {
        // No new symbols landed -> feature ends!
        setIsSpinning(false);
        finishFeature(newGrid, newlyLocked, chosen, false);
      }
    }, spinDuration);
  }, [isTurbo, playSound]);

  // Finish Fortune Tiger feature and calculate payouts
  const finishFeature = (
    finalGrid: TigerSymbol[],
    finalLocked: Set<number>,
    chosen: TigerSymbol,
    isFull9: boolean
  ) => {
    // Fill remaining non-locked with random low symbols
    const cleanGrid = finalGrid.map((sym, idx) => {
      if (finalLocked.has(idx)) return sym;
      return getRandomSymbol();
    });

    setGrid(cleanGrid);

    // Evaluate payouts
    const result = evaluateGrid(cleanGrid, bet);

    // If full 9 were locked, guaranteed 10x multiplier on all 5 paylines!
    let win = result.totalWin;
    if (isFull9 || result.isFullGrid) {
      setIsFullGrid10x(true);
      if (win === 0) {
        // 5 lines of chosen symbol * 10
        win = Math.round((bet / 5) * chosen.multiplier * 5 * 10);
      }
    }

    if (win === 0 && finalLocked.size >= 3) {
      win = Math.round((bet / 5) * chosen.multiplier * 2);
    }

    setLastWinAmount(win);
    setFeatureTotalWin(win);
    setActiveWinningLines(result.winningLines);
    setWinningCellIndices(finalLocked);

    if (win > 0) {
      onUpdateBalance(win, `ফরচুন টাইগার রিস্পিন বোনাস জয়: ৳${win}`);
      setTigerMood('rich');
    }

    setShowFeatureSummaryModal(true);

    setHistory(prev => [
      { id: Date.now(), bet, win, feature: true },
      ...prev.slice(0, 19),
    ]);
  };

  // Instant Buy / Trigger Fortune Tiger Feature (costs 50x bet, high VIP perk)
  const handleBuyFeature = () => {
    const cost = bet * 50;
    if (balance < cost) {
      playSound(() => sound.playCrash());
      setTigerDialogue(`বোনাস ক্রয়ের জন্য পর্যাপ্ত ব্যালেন্স নেই! প্রয়োজন ৳${cost}।`);
      return;
    }
    onUpdateBalance(-cost, `ফরচুন টাইগার বোনাস ক্রয়: ৳${cost}`);
    startFortuneTigerFeature();
  };

  // When intro modal is dismissed, initiate the respin sequence
  const startRespinsAfterModal = () => {
    setShowFeatureIntroModal(false);
    if (featureChosenSymbol) {
      const initialGrid: TigerSymbol[] = Array(9).fill({
        id: 'empty',
        nameBn: 'খালি',
        nameEn: 'Blank',
        multiplier: 0,
        color: '#334155',
        border: 'border-slate-800',
        bgGradient: 'from-slate-900/60 to-slate-950/90',
        emoji: '·',
        rarity: 'low',
      });
      setGrid(initialGrid);
      runFeatureRespin(new Set(), initialGrid, featureChosenSymbol, 1);
    }
  };

  const closeSummaryModal = () => {
    setShowFeatureSummaryModal(false);
    setIsTigerFeatureActive(false);
    setFeatureChosenSymbol(null);
    setLockedIndices(new Set());
    setTigerMood('idle');
  };

  return (
    <div className="relative min-h-screen bg-[#0d0406] text-white flex flex-col justify-between selection:bg-amber-500 selection:text-black">
      {/* Background Asian Imperial Dragon & Lantern Texture */}
      <div className="absolute inset-0 bg-radial-gradient from-[#420d13] via-[#1a0508] to-[#0a0203] pointer-events-none" />
      <div
        className="absolute inset-0 opacity-10 bg-repeat pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 50% 50%, #f59e0b 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* TOP HEADER */}
      <header className="relative z-20 flex items-center justify-between px-3 sm:px-6 py-2 sm:py-3 bg-black/60 backdrop-blur-md border-b border-amber-900/40">
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-xl bg-amber-950/60 hover:bg-amber-900/80 border border-amber-600/40 text-amber-200 transition-all hover:scale-105 active:scale-95"
            title="লবিতে ফিরে যান"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl sm:text-2xl">🐯</span>
              <h1 className="text-base sm:text-xl font-black bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 bg-clip-text text-transparent uppercase tracking-wider">
                Fortune Tiger
              </h1>
              <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-red-600/80 text-yellow-200 border border-red-400/50">
                PG SOFT
              </span>
            </div>
            <p className="text-[11px] text-amber-400/80 hidden sm:block">
              ৩x৩ রিল • ৫ পেলাইন • ১০x মাল্টিপ্লায়ার বুস্ট • RTP ৯৬.৮১%
            </p>
          </div>
        </div>

        {/* User Balance & Sound Toggles */}
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="bg-gradient-to-r from-amber-950/80 to-red-950/80 border border-amber-500/40 px-3 sm:px-4 py-1.5 rounded-xl flex flex-col items-end">
            <span className="text-[10px] text-amber-400 uppercase font-semibold">ব্যালেন্স</span>
            <span className="text-sm sm:text-base font-black text-amber-300">
              ৳{balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <button
            onClick={() => setIsSoundMuted(!isSoundMuted)}
            className="p-2 rounded-xl bg-black/50 border border-amber-700/40 text-amber-300 hover:bg-amber-950/60 transition-all"
            title={isSoundMuted ? 'শব্দ চালু করুন' : 'মিউট করুন'}
          >
            {isSoundMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
          </button>

          <button
            onClick={() => setShowPaytable(true)}
            className="p-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 text-amber-300 transition-all"
            title="পে-টেবিল ও নিয়মাবলী"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* MAIN GAME CONTAINER */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-2 sm:p-4 max-w-4xl mx-auto w-full">
        {/* TOP MASCOT: 3D ANIMATED FORTUNE TIGER WITH SUNGLASSES */}
        <div className="relative flex flex-col items-center mb-1 sm:mb-2">
          {/* Dialogue Cloud */}
          <div className="relative mb-2 px-3 sm:px-4 py-1 rounded-full bg-gradient-to-r from-red-900/90 via-amber-950/90 to-red-900/90 border border-amber-400/60 text-xs sm:text-sm font-medium text-amber-200 shadow-lg text-center max-w-md animate-pulse">
            <span>{tigerDialogue}</span>
            <div className="absolute left-1/2 -bottom-1.5 -translate-x-1/2 w-3 h-3 bg-red-900 border-r border-b border-amber-400/60 rotate-45" />
          </div>

          {/* Tiger Mascot Avatar with Dynamic Reactions */}
          <div className="relative group cursor-pointer" onClick={() => playSound(() => sound.playFortuneTigerRoar())}>
            {/* Golden Halo Glow */}
            <div
              className={`absolute -inset-4 rounded-full bg-gradient-to-r from-yellow-500/30 via-red-500/30 to-amber-500/30 blur-xl transition-all duration-500 ${
                isTigerFeatureActive ? 'scale-125 opacity-100' : 'opacity-60'
              }`}
            />

            <div
              className={`relative w-20 h-20 sm:w-28 sm:h-28 rounded-full border-4 ${
                isTigerFeatureActive ? 'border-yellow-400 animate-bounce' : 'border-amber-500/80'
              } bg-gradient-to-b from-amber-600 via-red-800 to-black p-1 shadow-2xl flex items-center justify-center transition-transform hover:scale-105`}
            >
              <div className="text-5xl sm:text-6xl filter drop-shadow-lg select-none">
                {tigerMood === 'roaring' ? '🐯' : tigerMood === 'rich' ? '🤑' : tigerMood === 'respin' ? '🔥' : '🐅'}
              </div>
              {/* Golden Sunglasses badge */}
              <div className="absolute top-1 right-2 text-xs sm:text-base filter drop-shadow">🕶️</div>
              {/* Sycee ingot in hand */}
              <div className="absolute -bottom-1 left-2 text-xs sm:text-base animate-pulse">🪙</div>
              {/* Chinese lucky knot */}
              <div className="absolute -bottom-1 right-2 text-xs sm:text-base">🧧</div>
            </div>

            {/* Feature Active Pulsing Banner */}
            {isTigerFeatureActive && (
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap px-3 py-0.5 rounded-full bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-600 text-black font-black text-xs shadow-lg uppercase tracking-wider animate-pulse flex items-center gap-1 border border-white">
                <Sparkles className="w-3 h-3" />
                <span>ফরচুন টাইগার রিস্পিন!</span>
              </div>
            )}
          </div>
        </div>

        {/* 10x MULTIPLIER BAR (ICONIC PG SOFT FEATURE) */}
        <div className="w-full max-w-sm mb-3">
          <div
            className={`relative rounded-xl p-2 border transition-all duration-300 ${
              isFullGrid10x
                ? 'bg-gradient-to-r from-yellow-500 via-amber-300 to-yellow-500 border-white text-black shadow-lg shadow-yellow-500/50 scale-105'
                : 'bg-black/60 border-amber-800/50 text-amber-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">⚡</span>
                <span className="text-xs sm:text-sm font-bold uppercase tracking-wider">
                  ফুল গ্রিড মাল্টিপ্লায়ার
                </span>
              </div>
              <div className="flex items-center gap-1 bg-amber-950/80 px-2 py-0.5 rounded-lg border border-amber-500/50">
                <span className="text-xs font-black text-yellow-400">x10 BOOST</span>
              </div>
            </div>
            <div className="mt-1 h-2 w-full bg-black/60 rounded-full overflow-hidden border border-amber-900/50">
              <div
                className={`h-full transition-all duration-500 ${
                  isFullGrid10x
                    ? 'w-full bg-gradient-to-r from-yellow-300 to-amber-500'
                    : isTigerFeatureActive
                    ? `bg-amber-400 w-[${(lockedIndices.size / 9) * 100}%]`
                    : 'w-1/6 bg-amber-600/60'
                }`}
                style={{
                  width: isFullGrid10x
                    ? '100%'
                    : isTigerFeatureActive
                    ? `${(lockedIndices.size / 9) * 100}%`
                    : '15%',
                }}
              />
            </div>
          </div>
        </div>

        {/* 3x3 SLOT REELS GRID CONTAINER */}
        <div className="relative rounded-2xl sm:rounded-3xl p-3 sm:p-4 bg-gradient-to-b from-[#2e090f] via-[#1c0509] to-[#0c0204] border-2 sm:border-4 border-amber-500/70 shadow-2xl shadow-red-950/80 w-full max-w-sm sm:max-w-md">
          {/* Ornate Golden Corners */}
          <div className="absolute top-1 left-1 text-amber-500/70 text-xs">╔</div>
          <div className="absolute top-1 right-1 text-amber-500/70 text-xs">╗</div>
          <div className="absolute bottom-1 left-1 text-amber-500/70 text-xs">╚</div>
          <div className="absolute bottom-1 right-1 text-amber-500/70 text-xs">╝</div>

          {/* Active Payline Indicators on Left and Right */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 relative">
            {grid.map((symbol, idx) => {
              const row = Math.floor(idx / 3);
              const col = idx % 3;
              const isColSpinning = spinningReels[col];
              const isWinning = winningCellIndices.has(idx);
              const isLocked = lockedIndices.has(idx);

              return (
                <div
                  key={idx}
                  className={`relative aspect-square rounded-xl sm:rounded-2xl border-2 flex flex-col items-center justify-center p-1 sm:p-2 transition-all duration-300 select-none overflow-hidden ${
                    symbol.border
                  } ${
                    isWinning
                      ? 'scale-105 shadow-lg shadow-yellow-500/40 ring-2 ring-yellow-400 bg-gradient-to-b from-yellow-500/30 to-amber-950/80'
                      : isLocked
                      ? 'ring-2 ring-amber-400 bg-amber-950/70'
                      : 'bg-gradient-to-b ' + symbol.bgGradient
                  }`}
                >
                  {/* Subtle Inner Glow */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-white/10 pointer-events-none" />

                  {/* Spinning Blur Animation */}
                  {isColSpinning ? (
                    <div className="flex flex-col items-center justify-center animate-spin">
                      <RotateCcw className="w-8 h-8 text-amber-400/80" />
                    </div>
                  ) : (
                    <>
                      {/* Main Symbol Emoji / Icon */}
                      <span
                        className={`text-3xl sm:text-4xl filter drop-shadow transition-transform ${
                          isWinning ? 'animate-bounce scale-110' : ''
                        }`}
                      >
                        {symbol.emoji}
                      </span>

                      {/* Symbol Label */}
                      <span className="text-[9px] sm:text-[10px] font-bold text-center text-amber-200 mt-1 line-clamp-1 leading-tight">
                        {symbol.nameEn}
                      </span>

                      {/* Wild / Payout Tag */}
                      {symbol.isWild ? (
                        <span className="absolute top-1 right-1 px-1 rounded bg-amber-500 text-black font-black text-[8px] uppercase tracking-tighter">
                          WILD
                        </span>
                      ) : (
                        <span className="text-[8px] text-amber-400/70 font-semibold mt-0.5">
                          {symbol.multiplier}x
                        </span>
                      )}

                      {/* Feature Locked Badge */}
                      {isTigerFeatureActive && isLocked && (
                        <span className="absolute bottom-1 right-1 text-xs">🔒</span>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* Winning Line Overlay Highlights */}
          {activeWinningLines.length > 0 && (
            <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-red-600 via-amber-500 to-red-600 text-black font-black text-[11px] shadow-lg border border-yellow-300 whitespace-nowrap animate-pulse">
              🎉 {activeWinningLines.length} লাইন জয়! মোট: ৳{lastWinAmount}
              {isFullGrid10x && ' (10x MULTIPLIER!)'}
            </div>
          )}
        </div>

        {/* PAYLINES MINI-LEGEND */}
        <div className="flex items-center justify-center gap-1.5 sm:gap-2 mt-2 flex-wrap">
          {PAYLINES.map(line => {
            const isHit = activeWinningLines.includes(line.id);
            return (
              <div
                key={line.id}
                className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all ${
                  isHit
                    ? 'bg-amber-400 text-black border-yellow-300 scale-105 shadow'
                    : 'bg-black/40 text-gray-400 border-amber-900/30'
                }`}
              >
                লাইন {line.id}
              </div>
            );
          })}
        </div>
      </main>

      {/* BOTTOM CONTROLS & BET BAR */}
      <footer className="relative z-20 bg-gradient-to-t from-black via-black/95 to-[#1a0407]/90 border-t border-amber-800/40 p-2 sm:p-4">
        <div className="max-w-4xl mx-auto flex flex-col gap-2 sm:gap-3">
          {/* Bet Selector Bar */}
          <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 scrollbar-thin">
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-xs text-amber-400 font-bold uppercase mr-1">বাজি:</span>
              {BET_SIZES.map(amount => (
                <button
                  key={amount}
                  onClick={() => {
                    setBet(amount);
                    playSound(() => sound.playSpinTick());
                  }}
                  disabled={isSpinning || isTigerFeatureActive}
                  className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all ${
                    bet === amount
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black shadow-md shadow-amber-500/30 scale-105'
                      : 'bg-amber-950/40 hover:bg-amber-900/50 text-amber-200 border border-amber-800/40'
                  }`}
                >
                  ৳{amount}
                </button>
              ))}
            </div>

            {/* Buy Feature Button (VIP Quick Access) */}
            <button
              onClick={handleBuyFeature}
              disabled={isSpinning || isTigerFeatureActive}
              className="shrink-0 px-3 py-1.5 rounded-xl bg-gradient-to-r from-red-600 via-amber-600 to-red-600 hover:from-red-500 hover:to-amber-500 border border-amber-400/60 text-white font-black text-xs shadow-lg flex items-center gap-1 transition-all active:scale-95 disabled:opacity-50"
              title="ফরচুন টাইগার রিস্পিন বোনাস অবিলম্বে কিনুন (৫০x)"
            >
              <Flame className="w-3.5 h-3.5 text-yellow-300" />
              <span>বোনাস কিনুন (৳{bet * 50})</span>
            </button>
          </div>

          {/* Action Spin Buttons */}
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            {/* Turbo Toggle */}
            <button
              onClick={() => setIsTurbo(!isTurbo)}
              className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                isTurbo
                  ? 'bg-yellow-500 text-black border-yellow-300 shadow'
                  : 'bg-black/60 text-amber-300 border-amber-800/40 hover:bg-amber-950/40'
              }`}
            >
              <Zap className={`w-4 h-4 ${isTurbo ? 'fill-black' : ''}`} />
              <span className="hidden sm:inline">টার্বো</span>
            </button>

            {/* Auto Spin Toggle */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  if (autoSpinCount > 0) {
                    setAutoSpinCount(0);
                  } else {
                    setAutoSpinCount(20);
                    executeSpin();
                  }
                }}
                disabled={isTigerFeatureActive}
                className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                  autoSpinCount > 0
                    ? 'bg-red-600 text-white border-red-400 shadow animate-pulse'
                    : 'bg-black/60 text-amber-300 border-amber-800/40 hover:bg-amber-950/40'
                }`}
              >
                <RefreshCw className={`w-4 h-4 ${autoSpinCount > 0 ? 'animate-spin' : ''}`} />
                <span>{autoSpinCount > 0 ? `অটো (${autoSpinCount})` : 'অটো'}</span>
              </button>
            </div>

            {/* MAIN GOLDEN SPIN BUTTON */}
            <button
              onClick={executeSpin}
              disabled={isSpinning || isTigerFeatureActive}
              className={`flex-1 max-w-xs sm:max-w-sm py-3 sm:py-3.5 rounded-2xl font-black text-base sm:text-lg uppercase tracking-wider transition-all duration-200 shadow-xl flex items-center justify-center gap-2 border-2 ${
                isSpinning || isTigerFeatureActive
                  ? 'bg-amber-950/40 text-amber-600 border-amber-900/40 cursor-not-allowed'
                  : 'bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-500 hover:from-yellow-300 hover:to-amber-400 text-black border-white shadow-amber-500/40 hover:scale-[1.02] active:scale-[0.98]'
              }`}
            >
              <Sparkles className="w-5 h-5 fill-current" />
              <span>{isSpinning ? 'স্পিন হচ্ছে...' : 'স্পিন করুন'}</span>
            </button>

            {/* Win Display */}
            <div className="bg-black/60 border border-amber-800/40 px-3 py-1.5 rounded-xl flex flex-col items-end min-w-[90px] sm:min-w-[120px]">
              <span className="text-[10px] text-amber-400 uppercase font-semibold">জয়</span>
              <span className="text-sm sm:text-base font-black text-yellow-300">
                ৳{lastWinAmount.toLocaleString('en-US')}
              </span>
            </div>
          </div>
        </div>
      </footer>

      {/* FEATURE INTRO MODAL */}
      {showFeatureIntroModal && featureChosenSymbol && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-sm rounded-3xl bg-gradient-to-b from-[#3a080e] via-[#200407] to-black border-2 border-yellow-400 p-6 text-center shadow-2xl">
            <div className="text-6xl mb-2 animate-bounce">🐯</div>
            <h2 className="text-2xl font-black text-yellow-400 uppercase tracking-wider">
              ফরচুন টাইগার ফিচার!
            </h2>
            <p className="text-xs text-amber-200 mt-1">
              লাকি টাইগার গর্জন করেছে! নির্বাচন করা হয়েছে বিশেষ প্রতীক:
            </p>

            <div className="my-4 p-4 rounded-2xl bg-amber-950/60 border border-yellow-500/50 flex flex-col items-center justify-center">
              <span className="text-5xl">{featureChosenSymbol.emoji}</span>
              <span className="text-base font-bold text-yellow-300 mt-2">
                {featureChosenSymbol.nameBn}
              </span>
              <span className="text-xs text-amber-400">
                প্রতি লাইনে পেআউট: {featureChosenSymbol.multiplier}x
              </span>
            </div>

            <p className="text-xs text-gray-300 mb-4">
              রিস্পিন চলাকালীন নির্বাচিত প্রতীক ও ওয়াইল্ড টাইগার লক থাকবে। ৯টি ঘর পূর্ণ হলে পাবেন <strong className="text-yellow-400">১০x মাল্টিপ্লায়ার</strong>!
            </p>

            <button
              onClick={startRespinsAfterModal}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-400 text-black font-black text-base uppercase tracking-wider shadow-xl hover:scale-105 active:scale-95 transition-all"
            >
              রিস্পিন শুরু করুন 🚀
            </button>
          </div>
        </div>
      )}

      {/* FEATURE SUMMARY MODAL */}
      {showFeatureSummaryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-sm rounded-3xl bg-gradient-to-b from-[#2e090f] via-[#1a0306] to-black border-2 border-yellow-400 p-6 text-center shadow-2xl">
            <div className="text-6xl mb-2">🎉</div>
            <h2 className="text-2xl font-black text-yellow-400 uppercase tracking-wider">
              রিস্পিন বোনাস সম্পন্ন!
            </h2>
            {isFullGrid10x && (
              <div className="my-2 px-3 py-1 rounded-full bg-yellow-400 text-black font-black text-xs uppercase animate-pulse">
                ⚡ ১০x ফুল গ্রিড মাল্টিপ্লায়ার বুস্ট প্রয়োগ করা হয়েছে! ⚡
              </div>
            )}
            <p className="text-xs text-amber-200 mt-2">মোট জয়:</p>
            <div className="text-4xl font-black text-yellow-300 my-3">
              ৳{featureTotalWin.toLocaleString('en-US')}
            </div>

            <button
              onClick={closeSummaryModal}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-400 text-black font-black text-base uppercase tracking-wider shadow-xl hover:scale-105 active:scale-95 transition-all"
            >
              সংগ্রহ করুন
            </button>
          </div>
        </div>
      )}

      {/* PAYTABLE & RULES MODAL */}
      {showPaytable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md max-h-[85vh] rounded-3xl bg-gradient-to-b from-[#24060a] via-[#120204] to-black border border-amber-600/60 p-4 sm:p-6 text-white shadow-2xl overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-amber-800/40">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🐯</span>
                <h3 className="text-lg font-black text-yellow-400">
                  ফরচুন টাইগার পে-টেবিল ও নিয়মাবলী
                </h3>
              </div>
              <button
                onClick={() => setShowPaytable(false)}
                className="p-1 rounded-lg bg-amber-950/60 hover:bg-amber-900 border border-amber-700/50 text-amber-200"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs sm:text-sm text-gray-300">
              <div>
                <h4 className="font-bold text-yellow-400 mb-2 flex items-center gap-1">
                  <Star className="w-4 h-4" /> প্রতীক পেআউট (৩টি চিহ্নের ম্যাচ):
                </h4>
                <div className="space-y-1.5">
                  {TIGER_SYMBOLS.map(sym => (
                    <div
                      key={sym.id}
                      className="flex items-center justify-between p-2 rounded-xl bg-black/40 border border-amber-900/40"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{sym.emoji}</span>
                        <div>
                          <div className="font-bold text-amber-200">{sym.nameBn}</div>
                          <div className="text-[10px] text-gray-400">{sym.nameEn}</div>
                        </div>
                      </div>
                      <span className="font-black text-yellow-400 text-sm">
                        {sym.multiplier}x লাইন বেট
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-bold text-yellow-400 mb-1 flex items-center gap-1">
                  <Flame className="w-4 h-4" /> ফরচুন টাইগার ফিচার (Fortune Tiger Feature):
                </h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  যেকোনো স্পিনে দৈবচয়নভাবে (randomly) ফরচুন টাইগার ফিচার ট্রিগার হতে পারে। এই সময় একটি পেয়িং প্রতীক নির্বাচিত হবে। রিল কেবল সেই প্রতীক এবং ওয়াইল্ড সিম্বল নিয়ে ঘুরবে। নতুন প্রতীক আসলে তা লক থাকবে এবং রি-স্পিন চলবে।
                </p>
              </div>

              <div>
                <h4 className="font-bold text-yellow-400 mb-1 flex items-center gap-1">
                  <Zap className="w-4 h-4" /> ১০x ফুল গ্রিড মাল্টিপ্লায়ার:
                </h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  যখন সম্পূর্ণ ৩x৩ গ্রিডের ৯টি ঘরই বিজয়ী প্রতীকে পূর্ণ হয়, তখন ৫টি লাইনের মোট জয়কে <strong className="text-yellow-400">১০ দিয়ে গুণ</strong> করা হয়! এতে সর্বোচ্চ ২,৫০০x পর্যন্ত উইন হতে পারে।
                </p>
              </div>

              <div>
                <h4 className="font-bold text-yellow-400 mb-1 flex items-center gap-1">
                  <Info className="w-4 h-4" /> পেলাইন বিন্যাস (৫টি ফিক্সড পেলাইন):
                </h4>
                <div className="grid grid-cols-2 gap-1 text-[11px] text-gray-400">
                  <div>• লাইন ১: টপ অনুভূমিক</div>
                  <div>• লাইন ২: মাঝের অনুভূমিক</div>
                  <div>• লাইন ৩: নিচের অনুভূমিক</div>
                  <div>• লাইন ৪: বাম-উপর থেকে ডান-নিচ</div>
                  <div className="col-span-2">• লাইন ৫: বাম-নিচ থেকে ডান-উপর</div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowPaytable(false)}
              className="mt-5 w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider"
            >
              বন্ধ করুন
            </button>
          </div>
        </div>
      )}

      {/* BIG WIN CELEBRATION MODAL */}
      {showWinCelebration && celebrationWin && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn cursor-pointer"
          onClick={() => setShowWinCelebration(false)}
        >
          <div className="relative w-full max-w-sm rounded-3xl bg-gradient-to-b from-[#4a0812] via-[#220307] to-black border-4 border-yellow-400 p-6 text-center shadow-2xl animate-scaleUp">
            <div className="text-7xl mb-2 animate-bounce">
              {celebrationWin.type === 'fortune10x' ? '👑' : '🔥'}
            </div>
            <h2 className="text-3xl font-black bg-gradient-to-r from-yellow-300 via-amber-200 to-yellow-400 bg-clip-text text-transparent uppercase tracking-wider">
              {celebrationWin.type === 'fortune10x'
                ? '১০x গ্র্যান্ড জ্যাকপট!'
                : celebrationWin.type === 'super'
                ? 'সুপার মেগা উইন!'
                : 'মেগা উইন!'}
            </h2>
            <p className="text-xs text-amber-300 mt-1">ফরচুন টাইগার আপনার ভাগ্য উজ্জ্বল করেছে!</p>

            <div className="text-4xl sm:text-5xl font-black text-yellow-300 my-4 drop-shadow-md">
              ৳{celebrationWin.amount.toLocaleString('en-US')}
            </div>

            <p className="text-[11px] text-gray-400 mb-4">ট্যাপ করে চালিয়ে যান</p>

            <button
              onClick={() => setShowWinCelebration(false)}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-400 text-black font-black text-sm uppercase tracking-wider shadow-lg"
            >
              সংগ্রহ করুন
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
