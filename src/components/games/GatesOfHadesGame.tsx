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
  Skull,
  ShieldAlert,
  Crown,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { GameItem } from '../../types';
import { sound } from '../../utils/audio';

interface GatesOfHadesGameProps {
  game?: GameItem;
  balance: number;
  onUpdateBalance: (amount: number, reason: string) => void;
  onClose: () => void;
  onOpenDeposit?: () => void;
}

interface HadesSymbol {
  id: string;
  nameBn: string;
  nameEn: string;
  icon: string;
  color: string;
  bgGrad: string;
  basePayout: number; // 8-9 symbols
  payout10: number;   // 10-11 symbols
  payout12: number;   // 12+ symbols
  isScatter?: boolean;
}

interface MultiplierOrb {
  val: number;
  color: string;
}

const HADES_SYMBOLS: HadesSymbol[] = [
  {
    id: 'hades_crown',
    nameBn: 'হেলম অফ হেডিস',
    nameEn: 'Helm of Darkness',
    icon: '👑',
    color: 'text-amber-400',
    bgGrad: 'from-amber-700/40 via-red-900/40 to-black/60 border-amber-500/80',
    basePayout: 10,
    payout10: 25,
    payout12: 50,
  },
  {
    id: 'underworld_hourglass',
    nameBn: 'কালাসুর আওয়ারগ্লাস',
    nameEn: 'Underworld Hourglass',
    icon: '⏳',
    color: 'text-red-400',
    bgGrad: 'from-red-700/40 via-rose-900/40 to-black/60 border-red-500/80',
    basePayout: 2.5,
    payout10: 10,
    payout12: 25,
  },
  {
    id: 'ring_of_styx',
    nameBn: 'রিং অফ স্টাইক্স',
    nameEn: 'Ring of Styx',
    icon: '💍',
    color: 'text-purple-300',
    bgGrad: 'from-purple-700/40 via-indigo-950/40 to-black/60 border-purple-500/80',
    basePayout: 2,
    payout10: 5,
    payout12: 15,
  },
  {
    id: 'chalice_of_fire',
    nameBn: 'রক্তিম পাত্র (Chalice)',
    nameEn: 'Goblet of Souls',
    icon: '🏆',
    color: 'text-orange-400',
    bgGrad: 'from-orange-700/40 via-amber-950/40 to-black/60 border-orange-500/80',
    basePayout: 1.5,
    payout10: 2,
    payout12: 12,
  },
  {
    id: 'ruby_fire',
    nameBn: 'লাভা রুবি',
    nameEn: 'Lava Ruby',
    icon: '♦️',
    color: 'text-rose-400',
    bgGrad: 'from-rose-800/40 via-red-950/40 to-black/60 border-rose-500/70',
    basePayout: 1,
    payout10: 1.5,
    payout12: 10,
  },
  {
    id: 'soul_amethyst',
    nameBn: 'সোল অ্যামিথিস্ট',
    nameEn: 'Soul Crystal',
    icon: '🔮',
    color: 'text-fuchsia-300',
    bgGrad: 'from-fuchsia-800/40 via-purple-950/40 to-black/60 border-fuchsia-500/70',
    basePayout: 0.8,
    payout10: 1.2,
    payout12: 8,
  },
  {
    id: 'emerald_poison',
    nameBn: 'টক্সিক এমারেল্ড',
    nameEn: 'Toxic Emerald',
    icon: '💚',
    color: 'text-emerald-400',
    bgGrad: 'from-emerald-800/40 via-teal-950/40 to-black/60 border-emerald-500/70',
    basePayout: 0.5,
    payout10: 1,
    payout12: 5,
  },
  {
    id: 'sulfur_gem',
    nameBn: 'সালফার গোল্ড',
    nameEn: 'Sulfur Gem',
    icon: '🔶',
    color: 'text-amber-400',
    bgGrad: 'from-amber-800/40 via-yellow-950/40 to-black/60 border-amber-500/70',
    basePayout: 0.4,
    payout10: 0.9,
    payout12: 4,
  },
  {
    id: 'styx_sapphire',
    nameBn: 'স্টাইক্স নীলকান্ত',
    nameEn: 'Styx Sapphire',
    icon: '🔷',
    color: 'text-cyan-400',
    bgGrad: 'from-cyan-800/40 via-blue-950/40 to-black/60 border-cyan-500/70',
    basePayout: 0.25,
    payout10: 0.75,
    payout12: 2,
  },
];

const SCATTER_SYMBOL: HadesSymbol = {
  id: 'hades_scatter',
  nameBn: 'নরকরাজ হেডিস (SCATTER)',
  nameEn: 'Hades Scatter',
  icon: '💀',
  color: 'text-red-500',
  bgGrad: 'from-red-600/70 via-rose-700/60 to-black border-red-500 ring-2 ring-red-500/60 shadow-[0_0_15px_rgba(239,68,68,0.6)]',
  basePayout: 3,
  payout10: 5,
  payout12: 100,
  isScatter: true,
};

// Generates random Hades Underworld multiplier orb
function getRandomHadesMultiplier(): MultiplierOrb {
  const roll = Math.random();
  if (roll < 0.65) {
    const vals = [2, 3, 4, 5, 6, 8];
    return {
      val: vals[Math.floor(Math.random() * vals.length)],
      color: 'from-emerald-500 via-teal-500 to-green-700 border-emerald-400 text-white ring-emerald-500/70 shadow-emerald-600/60',
    };
  } else if (roll < 0.88) {
    const vals = [10, 12, 15, 20, 25];
    return {
      val: vals[Math.floor(Math.random() * vals.length)],
      color: 'from-cyan-500 via-blue-600 to-indigo-800 border-cyan-400 text-white ring-cyan-500/70 shadow-cyan-600/60',
    };
  } else if (roll < 0.97) {
    const vals = [50, 100];
    return {
      val: vals[Math.floor(Math.random() * vals.length)],
      color: 'from-purple-500 via-fuchsia-600 to-pink-800 border-purple-400 text-white ring-purple-500/70 shadow-purple-600/60',
    };
  } else {
    const vals = [250, 500];
    return {
      val: vals[Math.floor(Math.random() * vals.length)],
      color: 'from-red-500 via-amber-500 to-yellow-400 border-yellow-300 text-white ring-red-500/90 shadow-red-600/80 animate-pulse',
    };
  }
}

// 6 columns x 5 rows
const ROWS = 5;
const COLS = 6;

export const GatesOfHadesGame: React.FC<GatesOfHadesGameProps> = ({
  game,
  balance,
  onUpdateBalance,
  onClose,
  onOpenDeposit,
}) => {
  // Sound toggle
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Betting states
  const [bet, setBet] = useState<number>(game?.minBet || 20);
  const [anteBet, setAnteBet] = useState<boolean>(false);
  const effectiveBet = anteBet ? Math.round(bet * 1.25) : bet;

  // Grid state: grid[row][col]
  const [grid, setGrid] = useState<HadesSymbol[][]>([]);
  const [multiplierOrbs, setMultiplierOrbs] = useState<(MultiplierOrb | null)[][]>([]);

  // Spin & Tumble flow states
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [isTumbling, setIsTumbling] = useState<boolean>(false);
  const [winningSymbolIds, setWinningSymbolIds] = useState<Set<string>>(new Set());
  const [currentTumbleWin, setCurrentTumbleWin] = useState<number>(0);
  const [accumulatedMultipliers, setAccumulatedMultipliers] = useState<number[]>([]);
  const [lastWinAmount, setLastWinAmount] = useState<number>(0);
  const [tumbleStep, setTumbleStep] = useState<number>(0);

  // Hades character animation state
  const [hadesState, setHadesState] = useState<'idle' | 'charging' | 'striking'>('idle');
  const [showUnderworldFire, setShowUnderworldFire] = useState<boolean>(false);

  // Free Spins feature
  const [isFreeSpinsActive, setIsFreeSpinsActive] = useState<boolean>(false);
  const [freeSpinsLeft, setFreeSpinsLeft] = useState<number>(0);
  const [totalFreeSpinWins, setTotalFreeSpinWins] = useState<number>(0);
  const [persistentHadesMultiplier, setPersistentHadesMultiplier] = useState<number>(1);
  const [showFreeSpinsModal, setShowFreeSpinsModal] = useState<boolean>(false);
  const [freeSpinsTriggeredCount, setFreeSpinsTriggeredCount] = useState<number>(0);

  // Big Win celebrations
  const [celebrationWin, setCelebrationWin] = useState<{ amount: number; title: string } | null>(null);

  // Auto Spin
  const [autoSpinsRemaining, setAutoSpinsRemaining] = useState<number>(0);
  const [turboMode, setTurboMode] = useState<boolean>(false);
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);

  // Sound helper wrapper
  const playSound = useCallback((fn: () => void) => {
    if (soundEnabled) {
      try {
        fn();
      } catch {
        // audio safeguard
      }
    }
  }, [soundEnabled]);

  // Generate a random symbol with Ante Bet weighting
  const getRandomSymbol = useCallback((): HadesSymbol => {
    const scatterChance = anteBet ? 0.055 : 0.032;
    if (Math.random() < scatterChance) {
      return SCATTER_SYMBOL;
    }
    // High tier vs Low tier distribution
    const roll = Math.random();
    if (roll < 0.08) return HADES_SYMBOLS[0]; // Helm of darkness
    if (roll < 0.18) return HADES_SYMBOLS[1]; // Hourglass
    if (roll < 0.30) return HADES_SYMBOLS[2]; // Ring
    if (roll < 0.44) return HADES_SYMBOLS[3]; // Chalice
    if (roll < 0.58) return HADES_SYMBOLS[4]; // Ruby
    if (roll < 0.72) return HADES_SYMBOLS[5]; // Amethyst
    if (roll < 0.82) return HADES_SYMBOLS[6]; // Emerald
    if (roll < 0.91) return HADES_SYMBOLS[7]; // Sulfur
    return HADES_SYMBOLS[8]; // Sapphire
  }, [anteBet]);

  // Initial grid creation
  const createFreshGrid = useCallback(() => {
    const newGrid: HadesSymbol[][] = [];
    const newOrbs: (MultiplierOrb | null)[][] = [];
    for (let r = 0; r < ROWS; r++) {
      const rowSymbols: HadesSymbol[] = [];
      const rowOrbs: (MultiplierOrb | null)[] = [];
      for (let c = 0; c < COLS; c++) {
        rowSymbols.push(getRandomSymbol());
        rowOrbs.push(null);
      }
      newGrid.push(rowSymbols);
      newOrbs.push(rowOrbs);
    }
    return { newGrid, newOrbs };
  }, [getRandomSymbol]);

  // Set initial grid on mount
  useEffect(() => {
    const { newGrid, newOrbs } = createFreshGrid();
    setGrid(newGrid);
    setMultiplierOrbs(newOrbs);
  }, [createFreshGrid]);

  // Trigger Hades bident strike animation
  const triggerHadesStrike = useCallback(() => {
    setHadesState('charging');
    playSound(() => sound.playThunder());
    setShowUnderworldFire(true);

    setTimeout(() => {
      setHadesState('striking');
      playSound(() => sound.playHadesHellfire());

      setTimeout(() => {
        setHadesState('idle');
        setShowUnderworldFire(false);
      }, 700);
    }, 400);
  }, [playSound]);

  // Handle Big Win popup
  const checkCelebration = useCallback((winAmt: number, currentBetVal: number) => {
    const ratio = winAmt / currentBetVal;
    if (ratio >= 50) {
      setCelebrationWin({ amount: winAmt, title: '🔥 সেনসেশনাল হেডিস মেগা জ্যাকপট!' });
      playSound(() => sound.playJackpot());
    } else if (ratio >= 25) {
      setCelebrationWin({ amount: winAmt, title: '⚡ আন্ডারওয়ার্ল্ড মেগা উইন!' });
      playSound(() => sound.playWinChime());
    } else if (ratio >= 10) {
      setCelebrationWin({ amount: winAmt, title: '💀 নরকরাজের বিগ উইন!' });
      playSound(() => sound.playWinChime());
    }
  }, [playSound]);

  // Primary Spin Trigger
  const executeSpin = useCallback(() => {
    if (isSpinning || isTumbling) return;

    if (!isFreeSpinsActive) {
      if (balance < effectiveBet) {
        if (onOpenDeposit) onOpenDeposit();
        return;
      }
      onUpdateBalance(-effectiveBet, `Gates of Hades বেট: ৳${effectiveBet}`);
    }

    setIsSpinning(true);
    setIsTumbling(false);
    setWinningSymbolIds(new Set());
    setCurrentTumbleWin(0);
    setAccumulatedMultipliers([]);
    setLastWinAmount(0);
    setTumbleStep(0);

    playSound(() => sound.playSpinTick());

    // Generate fresh symbols and random Hades multiplier orbs
    const { newGrid, newOrbs } = createFreshGrid();

    // Chance of Hades summoning multiplier orbs
    const multiplierChance = isFreeSpinsActive ? 0.38 : (anteBet ? 0.25 : 0.18);
    const hasMultiplier = Math.random() < multiplierChance;

    if (hasMultiplier) {
      triggerHadesStrike();
      const numOrbs = Math.random() < 0.8 ? 1 : 2;
      for (let i = 0; i < numOrbs; i++) {
        const randR = Math.floor(Math.random() * ROWS);
        const randC = Math.floor(Math.random() * COLS);
        newOrbs[randR][randC] = getRandomHadesMultiplier();
      }
    }

    const spinDuration = turboMode ? 350 : 700;

    setTimeout(() => {
      setGrid(newGrid);
      setMultiplierOrbs(newOrbs);
      setIsSpinning(false);
      startTumbleSequence(newGrid, newOrbs, 0, []);
    }, spinDuration);
  }, [
    isSpinning,
    isTumbling,
    isFreeSpinsActive,
    balance,
    effectiveBet,
    onOpenDeposit,
    onUpdateBalance,
    playSound,
    createFreshGrid,
    anteBet,
    triggerHadesStrike,
    turboMode,
  ]);

  // Recursively process pay-anywhere tumble rounds
  const startTumbleSequence = useCallback(
    (
      currentGrid: HadesSymbol[][],
      currentOrbs: (MultiplierOrb | null)[][],
      runningWin: number,
      collectedMults: number[]
    ) => {
      setIsTumbling(true);

      // Count symbol occurrences (Pay Anywhere: 8+ pays!)
      const counts: Record<string, number> = {};
      let scatterCount = 0;

      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const sym = currentGrid[r][c];
          if (sym.isScatter) {
            scatterCount++;
          } else {
            counts[sym.id] = (counts[sym.id] || 0) + 1;
          }
        }
      }

      // Collect multipliers currently on screen
      const currentRoundMults = [...collectedMults];
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const orb = currentOrbs[r][c];
          if (orb) {
            currentRoundMults.push(orb.val);
          }
        }
      }
      setAccumulatedMultipliers(currentRoundMults);

      // Check winning regular symbols (>= 8)
      const winningIds = new Set<string>();
      let roundWin = 0;

      for (const [symId, count] of Object.entries(counts)) {
        if (count >= 8) {
          winningIds.add(symId);
          const def = HADES_SYMBOLS.find(s => s.id === symId);
          if (def) {
            let mult = def.basePayout;
            if (count >= 12) mult = def.payout12;
            else if (count >= 10) mult = def.payout10;
            roundWin += mult * (bet / 20); // normalized to base bet scale
          }
        }
      }

      // Scatter Payout (>= 4 scatters)
      let scatterWin = 0;
      if (scatterCount >= 4) {
        if (scatterCount === 4) scatterWin = bet * 3;
        else if (scatterCount === 5) scatterWin = bet * 5;
        else scatterWin = bet * 100;
        roundWin += scatterWin;
      }

      // If we had wins, animate removal and drop new symbols
      if (winningIds.size > 0 || roundWin > 0) {
        setWinningSymbolIds(winningIds);
        playSound(() => sound.playWinChime());

        const newTotalWin = runningWin + roundWin;
        setCurrentTumbleWin(newTotalWin);
        setTumbleStep(prev => prev + 1);

        const stepDelay = turboMode ? 400 : 700;

        setTimeout(() => {
          // Drop symbols: create next grid state
          const nextGrid: HadesSymbol[][] = [];
          const nextOrbs: (MultiplierOrb | null)[][] = [];

          for (let r = 0; r < ROWS; r++) {
            nextGrid.push(new Array(COLS));
            nextOrbs.push(new Array(COLS).fill(null));
          }

          // Column by column gravity drop
          for (let c = 0; c < COLS; c++) {
            const remainingColumnSymbols: HadesSymbol[] = [];
            const remainingColumnOrbs: (MultiplierOrb | null)[] = [];

            for (let r = 0; r < ROWS; r++) {
              const sym = currentGrid[r][c];
              if (!winningIds.has(sym.id) || sym.isScatter) {
                remainingColumnSymbols.push(sym);
                remainingColumnOrbs.push(currentOrbs[r][c]);
              }
            }

            // Fill top with new falling symbols
            const needed = ROWS - remainingColumnSymbols.length;
            const newColumnSymbols: HadesSymbol[] = [];
            const newColumnOrbs: (MultiplierOrb | null)[] = [];

            for (let i = 0; i < needed; i++) {
              newColumnSymbols.push(getRandomSymbol());
              // Small chance of new multiplier dropping
              if (Math.random() < 0.1) {
                newColumnOrbs.push(getRandomHadesMultiplier());
              } else {
                newColumnOrbs.push(null);
              }
            }

            const finalCol = [...newColumnSymbols, ...remainingColumnSymbols];
            const finalOrbs = [...newColumnOrbs, ...remainingColumnOrbs];

            for (let r = 0; r < ROWS; r++) {
              nextGrid[r][c] = finalCol[r];
              nextOrbs[r][c] = finalOrbs[r];
            }
          }

          setGrid(nextGrid);
          setMultiplierOrbs(nextOrbs);
          setWinningSymbolIds(new Set());

          // Continue tumble loop
          startTumbleSequence(nextGrid, nextOrbs, newTotalWin, currentRoundMults);
        }, stepDelay);
      } else {
        // Tumble finished! Calculate total payout
        finishTumbleSequence(runningWin, currentRoundMults, scatterCount);
      }
    },
    [bet, getRandomSymbol, turboMode, playSound]
  );

  // Finalize spin and payouts
  const finishTumbleSequence = useCallback(
    (baseWin: number, mults: number[], scatters: number) => {
      setIsTumbling(false);

      let finalMultiplier = 1;
      let totalMultSum = mults.reduce((a, b) => a + b, 0);

      if (isFreeSpinsActive) {
        // In Free Spins, all multiplier orbs add to persistent multiplier!
        if (totalMultSum > 0 && baseWin > 0) {
          const newPersistent = persistentHadesMultiplier + totalMultSum;
          setPersistentHadesMultiplier(newPersistent);
          finalMultiplier = newPersistent;
          triggerHadesStrike();
        } else {
          finalMultiplier = persistentHadesMultiplier;
        }
      } else {
        // Base game multiplier sum
        finalMultiplier = totalMultSum > 0 ? totalMultSum : 1;
      }

      const totalWin = Math.round(baseWin * finalMultiplier);

      if (totalWin > 0) {
        setLastWinAmount(totalWin);
        onUpdateBalance(totalWin, `Gates of Hades জয়: ৳${totalWin} (${finalMultiplier}x)`);
        checkCelebration(totalWin, effectiveBet);

        if (isFreeSpinsActive) {
          setTotalFreeSpinWins(prev => prev + totalWin);
        }
      }

      // Check Free Spins trigger or retrigger
      if (!isFreeSpinsActive && scatters >= 4) {
        setFreeSpinsTriggeredCount(15);
        setShowFreeSpinsModal(true);
        playSound(() => sound.playJackpot());
      } else if (isFreeSpinsActive && scatters >= 3) {
        // Retrigger +5 Free Spins
        setFreeSpinsLeft(prev => prev + 5);
        playSound(() => sound.playJackpot());
      }

      // Free Spins step handling
      if (isFreeSpinsActive) {
        setFreeSpinsLeft(prev => {
          const next = prev - 1;
          if (next <= 0) {
            setTimeout(() => {
              setIsFreeSpinsActive(false);
              playSound(() => sound.playJackpot());
            }, 1200);
          }
          return next;
        });
      }
    },
    [
      isFreeSpinsActive,
      persistentHadesMultiplier,
      onUpdateBalance,
      checkCelebration,
      effectiveBet,
      playSound,
      triggerHadesStrike,
    ]
  );

  // Auto-Spin & Free-Spin step loop
  useEffect(() => {
    if (isSpinning || isTumbling) return;

    if (isFreeSpinsActive && freeSpinsLeft > 0) {
      const timer = setTimeout(() => {
        executeSpin();
      }, turboMode ? 500 : 1200);
      return () => clearTimeout(timer);
    }

    if (autoSpinsRemaining > 0) {
      const timer = setTimeout(() => {
        setAutoSpinsRemaining(prev => prev - 1);
        executeSpin();
      }, turboMode ? 400 : 1000);
      return () => clearTimeout(timer);
    }
  }, [
    isSpinning,
    isTumbling,
    isFreeSpinsActive,
    freeSpinsLeft,
    autoSpinsRemaining,
    turboMode,
    executeSpin,
  ]);

  // Start Free Spins from modal
  const handleStartFreeSpins = () => {
    setShowFreeSpinsModal(false);
    setIsFreeSpinsActive(true);
    setFreeSpinsLeft(15);
    setPersistentHadesMultiplier(1);
    setTotalFreeSpinWins(0);
    playSound(() => sound.playJackpot());
  };

  // Buy Free Spins Feature (100x bet)
  const handleBuyFreeSpins = () => {
    const cost = bet * 100;
    if (balance < cost) {
      if (onOpenDeposit) onOpenDeposit();
      return;
    }
    onUpdateBalance(-cost, `Gates of Hades ফ্রি স্পিন ক্রয় (100x): ৳${cost}`);
    setShowFreeSpinsModal(true);
    setFreeSpinsTriggeredCount(15);
    playSound(() => sound.playJackpot());
  };

  return (
    <div className="relative min-h-[92vh] bg-[#0c0507] text-white flex flex-col font-sans select-none overflow-hidden pb-12">
      {/* Hellfire & Underworld Atmosphere Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Burning Nether Gradients */}
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-red-950/40 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/2 -right-40 w-[550px] h-[550px] bg-orange-950/30 rounded-full blur-[130px] pointer-events-none" />
        <div className="absolute -bottom-20 left-1/3 w-[500px] h-[400px] bg-rose-950/40 rounded-full blur-[120px] pointer-events-none" />

        {/* Hellfire Strike flash overlay */}
        {showUnderworldFire && (
          <div className="absolute inset-0 bg-red-600/20 mix-blend-screen transition-opacity duration-300 pointer-events-none animate-pulse" />
        )}
      </div>

      {/* Top Header Bar */}
      <header className="relative z-20 flex items-center justify-between px-3 sm:px-6 py-3 bg-[#15070a]/90 backdrop-blur-md border-b border-red-900/50">
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-950/60 hover:bg-red-900/80 border border-red-800/60 text-xs sm:text-sm font-semibold transition-all text-red-200"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>লবি</span>
          </button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-600 via-rose-700 to-black p-0.5 border border-red-500 shadow-md flex items-center justify-center">
              <Skull className="w-5 h-5 text-red-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm sm:text-base tracking-wide bg-gradient-to-r from-red-400 via-rose-200 to-amber-300 bg-clip-text text-transparent">
                  GATES OF HADES
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-red-600 text-white shadow-sm">
                  1000x
                </span>
              </div>
              <p className="text-[10px] text-red-300/70 font-mono">
                Pragmatic Play • ৯৬.৫০% RTP • আন্ডারওয়ার্ল্ড টাম্বল
              </p>
            </div>
          </div>
        </div>

        {/* Right Info Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="bg-[#20090e]/80 border border-red-900/70 px-3 py-1.5 rounded-xl text-right">
            <span className="text-[10px] text-gray-400 block leading-tight">ব্যালেন্স</span>
            <span className="text-xs sm:text-sm font-bold text-amber-300 font-mono">
              ৳{balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <button
            onClick={() => setSoundEnabled(prev => !prev)}
            className="p-2 rounded-xl bg-red-950/60 hover:bg-red-900/70 border border-red-800/60 text-red-300 transition-all"
            title="শব্দ অন/অফ"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-gray-400" />}
          </button>

          <button
            onClick={() => setShowHelpModal(true)}
            className="p-2 rounded-xl bg-red-950/60 hover:bg-red-900/70 border border-red-800/60 text-red-300 transition-all"
            title="গেম নিয়মাবলী ও পে-টেবিল"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Game Screen */}
      <div className="relative z-10 flex-1 max-w-7xl mx-auto w-full px-2 sm:px-4 py-3 flex flex-col lg:flex-row gap-4 items-center lg:items-start justify-center">
        {/* Left Side: Ante Bet & Buy Feature Controls */}
        <div className="w-full lg:w-64 flex flex-row lg:flex-col gap-2.5 order-2 lg:order-1">
          {/* Buy Free Spins Card */}
          <div className="flex-1 bg-gradient-to-b from-[#2a0c12] to-[#170508] border border-red-700/60 rounded-2xl p-3 sm:p-4 shadow-xl text-center flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute -top-6 -right-6 w-20 h-20 bg-red-500/20 rounded-full blur-xl pointer-events-none" />
            <div>
              <div className="flex items-center justify-center gap-1.5 text-amber-400 text-xs font-black uppercase tracking-wider mb-1">
                <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400 animate-pulse" />
                ফ্রি স্পিন কিনুন
              </div>
              <p className="text-[11px] text-gray-300 leading-tight">
                ১৫টি ফ্রি স্পিন ও অবিচল মাল্টিপ্লায়ার
              </p>
            </div>
            <div className="my-2">
              <span className="text-base sm:text-lg font-black text-amber-300 font-mono">
                ৳{(bet * 100).toLocaleString()}
              </span>
              <span className="text-[10px] text-red-300 block">১০০ গুণ বেট</span>
            </div>
            <button
              onClick={handleBuyFreeSpins}
              disabled={isSpinning || isTumbling || isFreeSpinsActive}
              className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-extrabold text-xs shadow-lg shadow-red-900/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              এখনই কিনুন
            </button>
          </div>

          {/* Ante Bet Toggle Card */}
          <div
            onClick={() => {
              if (!isSpinning && !isTumbling && !isFreeSpinsActive) {
                setAnteBet(prev => !prev);
                playSound(() => sound.playClick());
              }
            }}
            className={`flex-1 cursor-pointer transition-all rounded-2xl p-3 sm:p-4 border shadow-xl flex flex-col justify-between ${
              anteBet
                ? 'bg-gradient-to-b from-amber-950/60 to-red-950/80 border-amber-500 ring-1 ring-amber-500/50'
                : 'bg-[#1b080c]/80 border-red-900/60 hover:border-red-700/60'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-amber-300 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 fill-amber-400" />
                ANTE BET +২৫%
              </span>
              <div
                className={`w-9 h-5 rounded-full transition-colors relative flex items-center px-0.5 ${
                  anteBet ? 'bg-amber-500' : 'bg-gray-700'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform ${
                    anteBet ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </div>
            </div>
            <p className="text-[11px] text-gray-300 mt-1 leading-tight">
              স্ক্যাটার আসার সুযোগ ২ গুণ বৃদ্ধি করুন
            </p>
            <div className="text-[10px] text-amber-400/80 font-mono mt-1">
              বেট: ৳{effectiveBet} (সাধারণ ৳{bet})
            </div>
          </div>

          {/* Global Multiplier status in Free Spins */}
          {isFreeSpinsActive && (
            <div className="bg-gradient-to-b from-red-900/50 to-black border-2 border-amber-500 rounded-2xl p-3 text-center shadow-[0_0_20px_rgba(245,158,11,0.4)] animate-pulse">
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-amber-300 block">
                হেডিস গ্লোবাল মাল্টিপ্লায়ার
              </span>
              <div className="text-3xl font-black text-white font-mono drop-shadow-[0_2px_10px_rgba(239,68,68,0.8)]">
                {persistentHadesMultiplier}x
              </div>
              <span className="text-[10px] text-red-200">
                ফ্রি স্পিন বাকি: <strong className="text-amber-300 text-sm">{freeSpinsLeft}</strong>
              </span>
            </div>
          )}
        </div>

        {/* Center: The 6x5 Pay Anywhere Grid with Greek Underworld Frame */}
        <div className="flex-1 w-full max-w-2xl flex flex-col items-center order-1 lg:order-2">
          {/* Tumble Banner & Multiplier Display */}
          <div className="w-full flex items-center justify-between px-3 py-1.5 mb-2 bg-[#220a0f]/80 rounded-xl border border-red-900/60 shadow-md">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-red-500 animate-bounce" />
              <span className="text-xs font-bold text-gray-200">
                {isTumbling ? (
                  <span className="text-amber-400 font-extrabold">টাম্বল জয় চলমান...</span>
                ) : isSpinning ? (
                  <span className="text-red-400">স্পিন হচ্ছে...</span>
                ) : (
                  <span>যেকোনো স্থানে ৮+ একই চিহ্নে জয়!</span>
                )}
              </span>
            </div>

            {/* Accumulated Multipliers during current spin */}
            <div className="flex items-center gap-1.5">
              {accumulatedMultipliers.length > 0 && (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-red-600/40 border border-red-500 text-amber-300 text-xs font-black">
                  <span>মাল্টিপ্লায়ার:</span>
                  <span>{accumulatedMultipliers.reduce((a, b) => a + b, 0)}x</span>
                </div>
              )}
              {currentTumbleWin > 0 && (
                <div className="px-2 py-0.5 rounded-lg bg-emerald-950/80 border border-emerald-600 text-emerald-300 font-bold text-xs font-mono">
                  +৳{currentTumbleWin.toFixed(0)}
                </div>
              )}
            </div>
          </div>

          {/* Underworld 6x5 Grid Frame */}
          <div className="relative w-full p-2.5 sm:p-4 rounded-3xl bg-gradient-to-b from-[#24080e] via-[#150407] to-[#0c0204] border-2 border-red-800/80 shadow-[0_0_35px_rgba(185,28,28,0.35)]">
            {/* Top Frame Gargoyles & Flame Ornaments */}
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 px-4 py-0.5 rounded-full bg-gradient-to-r from-red-800 via-rose-700 to-red-900 border border-red-500 text-[10px] font-black uppercase tracking-wider text-amber-200 shadow-lg flex items-center gap-1.5">
              <Crown className="w-3 h-3 text-amber-300" />
              GATES OF HADES • 6X5
            </div>

            {/* Symbols Grid */}
            <div className="grid grid-cols-6 gap-1 sm:gap-2">
              {grid.map((row, rIdx) =>
                row.map((sym, cIdx) => {
                  const isWinning = winningSymbolIds.has(sym.id);
                  const orb = multiplierOrbs[rIdx]?.[cIdx];

                  return (
                    <div
                      key={`${rIdx}-${cIdx}`}
                      className={`relative aspect-square rounded-xl sm:rounded-2xl border transition-all duration-300 flex flex-col items-center justify-center p-1 overflow-hidden ${
                        isWinning
                          ? 'scale-105 border-amber-400 bg-amber-600/40 ring-4 ring-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.8)] animate-bounce z-10'
                          : sym.bgGrad
                      } ${isSpinning ? 'opacity-80 blur-[0.4px]' : 'opacity-100'}`}
                    >
                      {/* Symbol Icon */}
                      <span className="text-xl sm:text-3xl select-none filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                        {sym.icon}
                      </span>

                      {/* Symbol Label for Accessibility & Style */}
                      <span className={`text-[8px] sm:text-[9px] font-bold tracking-tighter truncate max-w-full ${sym.color}`}>
                        {sym.nameEn}
                      </span>

                      {/* Multiplier Orb overlay if landed on this cell */}
                      {orb && (
                        <div
                          className={`absolute inset-0 m-1 rounded-xl bg-gradient-to-br ${orb.color} border-2 flex flex-col items-center justify-center font-black shadow-lg animate-pulse z-20`}
                        >
                          <Flame className="w-3.5 h-3.5 fill-current opacity-80" />
                          <span className="text-xs sm:text-sm font-mono tracking-tight">{orb.val}x</span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Under-Grid Win Summary Ticker */}
          <div className="w-full mt-3 flex items-center justify-between px-4 py-2 rounded-2xl bg-[#1c080d]/90 border border-red-900/60 shadow-lg">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span className="text-xs text-gray-300 font-semibold">শেষ জয়:</span>
              <span className="text-sm font-extrabold text-amber-300 font-mono">
                {lastWinAmount > 0 ? `৳${lastWinAmount.toLocaleString()}` : '৳০'}
              </span>
            </div>

            {isFreeSpinsActive && (
              <div className="text-xs font-bold text-red-300">
                মোট ফ্রি স্পিন জয়:{' '}
                <span className="text-amber-400 font-mono text-sm">৳{totalFreeSpinWins.toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Animated Hades Character Avatar & Action Tower */}
        <div className="w-full lg:w-64 flex flex-col gap-3 order-3">
          {/* Animated Lord Hades Card */}
          <div className="relative rounded-2xl bg-gradient-to-b from-[#24080e] via-[#170509] to-black border-2 border-red-800/80 p-4 shadow-2xl flex flex-col items-center text-center overflow-hidden">
            {/* Hades Aura Glow */}
            <div
              className={`absolute inset-0 transition-opacity duration-500 pointer-events-none ${
                hadesState === 'striking'
                  ? 'bg-red-600/30'
                  : hadesState === 'charging'
                  ? 'bg-amber-600/20'
                  : 'bg-transparent'
              }`}
            />

            {/* Lord Hades Visual Representation */}
            <div className="relative my-2">
              <div
                className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full border-2 border-red-500/80 bg-gradient-to-b from-red-950 via-black to-red-900 shadow-[0_0_25px_rgba(239,68,68,0.5)] flex items-center justify-center transition-transform duration-300 ${
                  hadesState === 'striking'
                    ? 'scale-110 rotate-6 shadow-red-500'
                    : hadesState === 'charging'
                    ? 'scale-105 animate-pulse'
                    : ''
                }`}
              >
                <div className="text-4xl sm:text-5xl select-none">
                  {hadesState === 'striking' ? '🔱' : hadesState === 'charging' ? '⚡' : '👑'}
                </div>
              </div>

              {/* Hades glowing badge */}
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-red-600 text-[10px] font-black text-white uppercase tracking-wider shadow">
                নরকরাজ হেডিস
              </div>
            </div>

            <div className="mt-2 text-xs font-bold text-gray-200">
              {hadesState === 'striking' ? (
                <span className="text-amber-400 animate-pulse font-extrabold">
                  ⚡ হেডিসের বর্শা প্রহার! মাল্টিপ্লায়ার আনলক!
                </span>
              ) : hadesState === 'charging' ? (
                <span className="text-red-400">🔥 আন্ডারওয়ার্ল্ডের অগ্নি শক্তি সঞ্চিত হচ্ছে...</span>
              ) : (
                <span className="text-gray-400">হেডিসের মাল্টিপ্লায়ার ৫০০x পর্যন্ত হতে পারে!</span>
              )}
            </div>
          </div>

          {/* Bet Controls Card */}
          <div className="bg-[#1a060a] border border-red-900/60 rounded-2xl p-3 sm:p-4 shadow-xl flex flex-col gap-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-300 font-semibold">বেট পরিমাণ</span>
              <span className="text-amber-300 font-mono font-bold text-sm">৳{bet}</span>
            </div>

            {/* Quick Bet Buttons */}
            <div className="grid grid-cols-4 gap-1.5">
              {[20, 50, 100, 250, 500, 1000, 2500, 5000].map(val => (
                <button
                  key={val}
                  onClick={() => {
                    setBet(val);
                    playSound(() => sound.playClick());
                  }}
                  disabled={isSpinning || isTumbling || isFreeSpinsActive}
                  className={`py-1 rounded-lg text-xs font-bold font-mono transition-all border ${
                    bet === val
                      ? 'bg-red-600 border-red-400 text-white shadow-md'
                      : 'bg-red-950/40 border-red-900/50 hover:bg-red-900/40 text-gray-300'
                  } disabled:opacity-50`}
                >
                  ৳{val}
                </button>
              ))}
            </div>

            {/* Turbo & Auto Spin Toggles */}
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-red-950">
              <button
                onClick={() => setTurboMode(prev => !prev)}
                className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 border transition-all ${
                  turboMode
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                    : 'bg-red-950/40 border-red-900/40 text-gray-400 hover:text-gray-200'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>টার্বো</span>
              </button>

              <button
                onClick={() => {
                  if (autoSpinsRemaining > 0) {
                    setAutoSpinsRemaining(0);
                  } else {
                    setAutoSpinsRemaining(20);
                  }
                  playSound(() => sound.playClick());
                }}
                disabled={isFreeSpinsActive}
                className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 border transition-all ${
                  autoSpinsRemaining > 0
                    ? 'bg-red-600 border-red-400 text-white animate-pulse'
                    : 'bg-red-950/40 border-red-900/40 text-gray-400 hover:text-gray-200'
                }`}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{autoSpinsRemaining > 0 ? `অটো (${autoSpinsRemaining})` : 'অটো ২০'}</span>
              </button>
            </div>

            {/* Main Spin CTA Button */}
            <button
              onClick={executeSpin}
              disabled={isSpinning || isTumbling || isFreeSpinsActive}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-black text-base shadow-xl shadow-red-900/60 active:scale-95 transition-all flex items-center justify-center gap-2 border border-red-400/50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Flame className="w-5 h-5 fill-current" />
              <span>
                {isSpinning
                  ? 'স্পিন হচ্ছে...'
                  : isTumbling
                  ? 'টাম্বল হচ্ছে...'
                  : isFreeSpinsActive
                  ? `ফ্রি স্পিন (${freeSpinsLeft})`
                  : `স্পিন করুন ৳${effectiveBet}`}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Free Spins Award Modal */}
      {showFreeSpinsModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-md w-full bg-gradient-to-b from-[#2e0c12] via-[#1a0509] to-black border-2 border-red-600 rounded-3xl p-6 text-center shadow-[0_0_50px_rgba(239,68,68,0.6)] animate-in fade-in zoom-in-95 duration-300">
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-tr from-red-600 to-amber-500 p-0.5 flex items-center justify-center shadow-lg mb-4">
              <Skull className="w-12 h-12 text-white" />
            </div>

            <span className="px-3 py-1 rounded-full bg-red-600/40 border border-red-500 text-amber-300 text-xs font-black uppercase tracking-wider inline-block mb-2">
              আন্ডারওয়ার্ল্ডের আশীর্বাদ
            </span>

            <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">
              {freeSpinsTriggeredCount}টি ফ্রি স্পিন জয়!
            </h2>

            <p className="text-xs sm:text-sm text-gray-300 mb-6 leading-relaxed">
              ফ্রি স্পিন রাউন্ডে মাল্টিপ্লায়ারের মান কখনো রিসেট হয় না! নরকরাজ হেডিসের শক্তি প্রতিটি জয়ে স্থায়ী
              মাল্টিপ্লায়ার যোগ করবে!
            </p>

            <button
              onClick={handleStartFreeSpins}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-extrabold text-base shadow-xl transition-all"
            >
              ফ্রি স্পিন শুরু করুন
            </button>
          </div>
        </div>
      )}

      {/* Big Win Celebration Modal */}
      {celebrationWin && (
        <div
          onClick={() => setCelebrationWin(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-md w-full bg-gradient-to-b from-[#2e0910] via-black to-[#1a0509] border-2 border-amber-500 rounded-3xl p-6 text-center shadow-[0_0_60px_rgba(245,158,11,0.7)] animate-in zoom-in-95">
            <Sparkles className="w-16 h-16 text-amber-400 mx-auto mb-3 animate-spin" />
            <h3 className="text-xl sm:text-2xl font-black text-amber-300 mb-2">{celebrationWin.title}</h3>
            <div className="text-4xl sm:text-5xl font-black text-white font-mono my-4 drop-shadow-[0_4px_12px_rgba(239,68,68,0.8)]">
              ৳{celebrationWin.amount.toLocaleString()}
            </div>
            <p className="text-xs text-gray-400">ট্যাপ করে বন্ধ করুন</p>
          </div>
        </div>
      )}

      {/* Paytable & Rules Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative max-w-lg w-full max-h-[85vh] bg-[#170509] border border-red-800 rounded-3xl p-5 overflow-y-auto text-left shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-red-900/60 mb-4">
              <h3 className="text-base sm:text-lg font-bold text-amber-300 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-red-500" />
                গেটস অফ হেডিস নিয়মাবলী ও পে-টেবিল
              </h3>
              <button
                onClick={() => setShowHelpModal(false)}
                className="w-8 h-8 rounded-full bg-red-950 hover:bg-red-900 flex items-center justify-center text-gray-300"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs text-gray-300">
              <div className="bg-[#240a10] p-3 rounded-xl border border-red-900/60">
                <h4 className="font-bold text-amber-400 mb-1">পে-এনিহোয়ার (Pay Anywhere)</h4>
                <p>
                  স্ক্রিনের যেকোনো অবস্থানে ৮ বা ততোধিক একই প্রতীক উপস্থিত হলে জয় লাভ হয়। কোনো নির্দিষ্ট পে-লাইনের
                  প্রয়োজন নেই!
                </p>
              </div>

              <div className="bg-[#240a10] p-3 rounded-xl border border-red-900/60">
                <h4 className="font-bold text-amber-400 mb-1">টাম্বল ফিচার (Tumble Feature)</h4>
                <p>
                  জয়ী প্রতীকগুলো বিস্ফোরিত হয়ে স্থান ত্যাগ করে এবং উপরের প্রতীকগুলো নিচে নেমে আসে। ফাঁকা স্থানগুলো
                  নতুন প্রতীক দিয়ে পূর্ণ হয়। জয় বন্ধ না হওয়া পর্যন্ত টাম্বল অব্যাহত থাকে!
                </p>
              </div>

              <div className="bg-[#240a10] p-3 rounded-xl border border-red-900/60">
                <h4 className="font-bold text-amber-400 mb-1">হেডিস মাল্টিপ্লায়ার বল (২x থেকে ৫০০x)</h4>
                <p>
                  যেকোনো স্পিন বা টাম্বলে হেডিস তার বর্শার শক্তিতে ২x, ৩x, ৫x, ১০x, ২৫x, ১০০x এমনকি ৫০০x পর্যন্ত
                  মাল্টিপ্লায়ার বল অবতরণ করাতে পারে। টাম্বল শেষে সমস্ত মাল্টিপ্লায়ার যোগ হয়ে মোট জয়ের সাথে গুণিত হয়!
                </p>
              </div>

              <div className="bg-[#240a10] p-3 rounded-xl border border-red-900/60">
                <h4 className="font-bold text-amber-400 mb-1">ফ্রি স্পিন ও স্থায়ী মাল্টিপ্লায়ার</h4>
                <p>
                  ৪ বা ততোধিক হেডিস স্ক্যাটার প্রতীক পেলে ১৫টি ফ্রি স্পিন পাওয়া যায়। ফ্রি স্পিনে কোনো মাল্টিপ্লায়ার
                  দিয়ে জয় পেলে সেই মাল্টিপ্লায়ার স্থায়ীভাবে হেডিস গ্লোবাল মাল্টিপ্লায়ারে যুক্ত হয়!
                </p>
              </div>

              {/* Symbol values breakdown */}
              <div>
                <h4 className="font-bold text-white mb-2">প্রতীক মূল্য তালিকা (১২+ টি প্রতীকে):</h4>
                <div className="grid grid-cols-2 gap-2">
                  {HADES_SYMBOLS.map(s => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-black/40 border border-red-950"
                    >
                      <span className="flex items-center gap-1.5 font-bold text-gray-200">
                        <span>{s.icon}</span> {s.nameEn}
                      </span>
                      <span className="font-mono text-amber-300 font-bold">{s.payout12}x বেট</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowHelpModal(false)}
              className="w-full mt-5 py-2.5 rounded-xl bg-red-700 hover:bg-red-600 text-white font-bold text-sm"
            >
              বুঝেছি
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
