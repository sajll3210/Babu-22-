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
  Layers,
} from 'lucide-react';
import { GameItem } from '../../types';
import { sound } from '../../utils/audio';

interface SuperAceGameProps {
  game: GameItem;
  balance: number;
  onUpdateBalance: (amount: number, reason: string) => void;
  onClose: () => void;
  onOpenDeposit?: () => void;
}

// Super Ace Symbol Definitions
export type SuperAceSymbolId =
  | 'ace_spades'
  | 'king_hearts'
  | 'queen_clubs'
  | 'jack_diamonds'
  | 'suit_spades'
  | 'suit_hearts'
  | 'suit_clubs'
  | 'suit_diamonds'
  | 'little_joker'
  | 'big_joker'
  | 'scatter';

export interface SuperAceSymbolDef {
  id: SuperAceSymbolId;
  nameBn: string;
  nameEn: string;
  icon: string;
  cardRank: string;
  cardSuit: string;
  suitColor: string;
  badge?: string;
  isWild?: boolean;
  isScatter?: boolean;
  isPremium?: boolean;
  // Multipliers for 3, 4, 5 of a kind (relative to bet)
  payouts: [number, number, number];
}

export const SUPER_ACE_SYMBOLS: Record<SuperAceSymbolId, SuperAceSymbolDef> = {
  ace_spades: {
    id: 'ace_spades',
    nameBn: 'শীর্ষ এস (Ace)',
    nameEn: 'Ace of Spades',
    icon: '♠️',
    cardRank: 'A',
    cardSuit: '♠',
    suitColor: 'text-amber-400',
    isPremium: true,
    badge: 'TOP PAY',
    payouts: [2.5, 6.0, 15.0],
  },
  king_hearts: {
    id: 'king_hearts',
    nameBn: 'কিং (King)',
    nameEn: 'King of Hearts',
    icon: '👑',
    cardRank: 'K',
    cardSuit: '♥',
    suitColor: 'text-red-500',
    isPremium: true,
    payouts: [1.8, 4.0, 10.0],
  },
  queen_clubs: {
    id: 'queen_clubs',
    nameBn: 'কুইন (Queen)',
    nameEn: 'Queen of Clubs',
    icon: '👸',
    cardRank: 'Q',
    cardSuit: '♣',
    suitColor: 'text-cyan-400',
    isPremium: true,
    payouts: [1.2, 3.0, 7.5],
  },
  jack_diamonds: {
    id: 'jack_diamonds',
    nameBn: 'জ্যাক (Jack)',
    nameEn: 'Jack of Diamonds',
    icon: '⚔️',
    cardRank: 'J',
    cardSuit: '♦',
    suitColor: 'text-amber-500',
    isPremium: true,
    payouts: [0.8, 2.0, 5.0],
  },
  suit_spades: {
    id: 'suit_spades',
    nameBn: 'ইশকাপন (Spade)',
    nameEn: 'Spade',
    icon: '♠️',
    cardRank: '♠',
    cardSuit: '♠',
    suitColor: 'text-slate-300',
    payouts: [0.4, 1.0, 2.5],
  },
  suit_hearts: {
    id: 'suit_hearts',
    nameBn: 'হরতন (Heart)',
    nameEn: 'Heart',
    icon: '♥️',
    cardRank: '♥',
    cardSuit: '♥',
    suitColor: 'text-rose-500',
    payouts: [0.3, 0.8, 2.0],
  },
  suit_clubs: {
    id: 'suit_clubs',
    nameBn: 'রুইতন (Club)',
    nameEn: 'Club',
    icon: '♣️',
    cardRank: '♣',
    cardSuit: '♣',
    suitColor: 'text-emerald-400',
    payouts: [0.25, 0.6, 1.5],
  },
  suit_diamonds: {
    id: 'suit_diamonds',
    nameBn: 'চিড়িতন (Diamond)',
    nameEn: 'Diamond',
    icon: '♦️',
    cardRank: '♦',
    cardSuit: '♦',
    suitColor: 'text-yellow-400',
    payouts: [0.2, 0.5, 1.2],
  },
  little_joker: {
    id: 'little_joker',
    nameBn: 'ছোট জোকার (Little Joker)',
    nameEn: 'Little Joker Wild',
    icon: '🃏',
    cardRank: 'W',
    cardSuit: '★',
    suitColor: 'text-amber-300',
    isWild: true,
    badge: 'WILD',
    payouts: [0, 0, 0],
  },
  big_joker: {
    id: 'big_joker',
    nameBn: 'বড় জোকার (Big Joker)',
    nameEn: 'Big Joker Wild',
    icon: '🎭',
    cardRank: '★W★',
    cardSuit: '⚡',
    suitColor: 'text-yellow-300',
    isWild: true,
    badge: 'BIG WILD',
    payouts: [0, 0, 0],
  },
  scatter: {
    id: 'scatter',
    nameBn: 'সুপার এস কয়েন (Scatter)',
    nameEn: 'Scatter Medallion',
    icon: '🪙',
    cardRank: 'SCATTER',
    cardSuit: '🪙',
    suitColor: 'text-amber-400',
    isScatter: true,
    badge: 'FREE GAME',
    payouts: [0, 0, 0],
  },
};

export interface GridCell {
  uid: string;
  symbolId: SuperAceSymbolId;
  isGolden: boolean; // Golden card on reels 2, 3, 4
  isWinning?: boolean;
  isTransforming?: boolean; // Flipping into Joker
  isNew?: boolean;
}

export interface WinningWayResult {
  symbolId: SuperAceSymbolId;
  count: number; // 3, 4, 5
  ways: number; // Total paths
  winAmount: number;
}

const BASE_MULTIPLIERS = [1, 2, 3, 5];
const FREE_MULTIPLIERS = [2, 4, 6, 10];

export const SuperAceGame: React.FC<SuperAceGameProps> = ({
  game,
  balance,
  onUpdateBalance,
  onClose,
  onOpenDeposit,
}) => {
  // Betting state
  const BET_PRESETS = [10, 20, 50, 100, 200, 500, 1000, 2000, 5000];
  const [bet, setBet] = useState<number>(20);

  // Sound & Turbo
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isTurbo, setIsTurbo] = useState<boolean>(false);

  // Auto-spin state
  const [isAutoSpin, setIsAutoSpin] = useState<boolean>(false);
  const [autoSpinsRemaining, setAutoSpinsRemaining] = useState<number>(0);
  const [showAutoModal, setShowAutoModal] = useState<boolean>(false);

  // Multiplier Combo state (Elimination ladder)
  const [eliminationStep, setEliminationStep] = useState<number>(0); // 0 = 1x, 1 = 2x, 2 = 3x, 3 = 5x

  // Free Game / Bonus State
  const [isFreeSpinMode, setIsFreeSpinMode] = useState<boolean>(false);
  const [freeSpinsLeft, setFreeSpinsLeft] = useState<number>(0);
  const [freeSpinTotalWin, setFreeSpinTotalWin] = useState<number>(0);
  const [showFreeSpinIntro, setShowFreeSpinIntro] = useState<boolean>(false);
  const [showFreeSpinSummary, setShowFreeSpinSummary] = useState<boolean>(false);

  // Big Win celebration
  const [showCelebration, setShowCelebration] = useState<{
    type: 'big' | 'mega' | 'super';
    amount: number;
  } | null>(null);

  // Help & Paytable modal
  const [showPaytable, setShowPaytable] = useState<boolean>(false);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [spinHistory, setSpinHistory] = useState<
    Array<{
      id: string;
      time: string;
      bet: number;
      win: number;
      cascades: number;
      freeSpins: boolean;
    }>
  >([]);

  // 5 Reels x 4 Rows
  const NUM_REELS = 5;
  const NUM_ROWS = 4;

  // Initialize random grid
  const generateRandomCell = useCallback(
    (reelIdx: number, forceScatter = false): GridCell => {
      const uid = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      if (forceScatter) {
        return { uid, symbolId: 'scatter', isGolden: false };
      }

      // Scatter chance
      const randScatter = Math.random();
      if (randScatter < 0.04) {
        return { uid, symbolId: 'scatter', isGolden: false };
      }

      // Regular symbols pool
      const pool: SuperAceSymbolId[] = [
        'ace_spades',
        'ace_spades',
        'king_hearts',
        'king_hearts',
        'queen_clubs',
        'queen_clubs',
        'queen_clubs',
        'jack_diamonds',
        'jack_diamonds',
        'jack_diamonds',
        'suit_spades',
        'suit_spades',
        'suit_hearts',
        'suit_hearts',
        'suit_clubs',
        'suit_clubs',
        'suit_diamonds',
        'suit_diamonds',
      ];

      const symbolId = pool[Math.floor(Math.random() * pool.length)];

      // Golden Card chance: only on reels 2, 3, 4 (indices 1, 2, 3) and only on regular paying symbols
      let isGolden = false;
      if (reelIdx >= 1 && reelIdx <= 3 && Math.random() < 0.3) {
        isGolden = true;
      }

      return { uid, symbolId, isGolden };
    },
    []
  );

  const generateInitialGrid = useCallback((): GridCell[][] => {
    const grid: GridCell[][] = [];
    for (let r = 0; r < NUM_REELS; r++) {
      const col: GridCell[] = [];
      for (let row = 0; row < NUM_ROWS; row++) {
        col.push(generateRandomCell(r));
      }
      grid.push(col);
    }
    return grid;
  }, [NUM_REELS, NUM_ROWS, generateRandomCell]);

  const [grid, setGrid] = useState<GridCell[][]>(generateInitialGrid);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [isCascading, setIsCascading] = useState<boolean>(false);
  const [lastWin, setLastWin] = useState<number>(0);
  const [currentSpinTotalWin, setCurrentSpinTotalWin] = useState<number>(0);
  const [winningWaysInfo, setWinningWaysInfo] = useState<WinningWayResult[]>([]);
  const [bigJokerEffect, setBigJokerEffect] = useState<boolean>(false);

  // Evaluate 1024 ways
  const evaluateWins = useCallback(
    (currentGrid: GridCell[][], multiplier: number): {
      winningWays: WinningWayResult[];
      winningCoords: Set<string>; // "col,row"
      goldenCoordsToTransform: Array<{ col: number; row: number }>;
      totalWin: number;
      scatterCount: number;
    } => {
      let scatterCount = 0;
      for (let col = 0; col < NUM_REELS; col++) {
        for (let row = 0; row < NUM_ROWS; row++) {
          if (currentGrid[col][row].symbolId === 'scatter') {
            scatterCount++;
          }
        }
      }

      const regularSymbols: SuperAceSymbolId[] = [
        'ace_spades',
        'king_hearts',
        'queen_clubs',
        'jack_diamonds',
        'suit_spades',
        'suit_hearts',
        'suit_clubs',
        'suit_diamonds',
      ];

      const winningWays: WinningWayResult[] = [];
      const winningCoords = new Set<string>();
      const goldenCoordsToTransform: Array<{ col: number; row: number }> = [];

      regularSymbols.forEach(targetSym => {
        const symDef = SUPER_ACE_SYMBOLS[targetSym];
        const matchCols: number[][] = []; // indices of rows matching per reel

        for (let col = 0; col < NUM_REELS; col++) {
          const matchedRows: number[] = [];
          for (let row = 0; row < NUM_ROWS; row++) {
            const cell = currentGrid[col][row];
            if (
              cell.symbolId === targetSym ||
              cell.symbolId === 'little_joker' ||
              cell.symbolId === 'big_joker'
            ) {
              matchedRows.push(row);
            }
          }
          if (matchedRows.length > 0) {
            matchCols.push(matchedRows);
          } else {
            break; // Must be consecutive from reel 0
          }
        }

        const consecutiveReels = matchCols.length;
        if (consecutiveReels >= 3) {
          // Calculate ways
          let ways = 1;
          for (let c = 0; c < consecutiveReels; c++) {
            ways *= matchCols[c].length;
          }

          // Mark coordinates
          for (let c = 0; c < consecutiveReels; c++) {
            matchCols[c].forEach(r => {
              winningCoords.add(`${c},${r}`);
              if (currentGrid[c][r].isGolden) {
                goldenCoordsToTransform.push({ col: c, row: r });
              }
            });
          }

          // Payout: index 0 for 3, index 1 for 4, index 2 for 5
          const payoutMultiplier = symDef.payouts[consecutiveReels - 3];
          const win = ways * (bet * (payoutMultiplier / 10)) * multiplier;

          winningWays.push({
            symbolId: targetSym,
            count: consecutiveReels,
            ways,
            winAmount: win,
          });
        }
      });

      const totalWin = winningWays.reduce((sum, w) => sum + w.winAmount, 0);

      return {
        winningWays,
        winningCoords,
        goldenCoordsToTransform,
        totalWin,
        scatterCount,
      };
    },
    [NUM_REELS, NUM_ROWS, bet]
  );

  // Master Spin Routine
  const runSpin = useCallback(async () => {
    if (isSpinning || isCascading) return;

    // Balance check if not in Free Spins
    if (!isFreeSpinMode) {
      if (balance < bet) {
        if (soundEnabled) sound.playClick();
        if (onOpenDeposit) onOpenDeposit();
        setIsAutoSpin(false);
        return;
      }
      onUpdateBalance(-bet, `Super Ace কোড ৫৫৭ বেট (৳${bet.toLocaleString()})`);
    }

    setIsSpinning(true);
    setWinningWaysInfo([]);
    setCurrentSpinTotalWin(0);
    setEliminationStep(0);
    if (soundEnabled) {
      sound.playCardFlip();
      sound.playSpinTick();
    }

    // Step 1: Initial Spin - generate full new grid
    const spinDelay = isTurbo ? 250 : 500;
    await new Promise(r => setTimeout(r, spinDelay));

    // Scatter bonus chance logic (guaranteed scatter tease if lucky)
    const forceBonus = Math.random() < 0.05; // 5% chance of triggering free spins
    const initialGrid: GridCell[][] = [];
    let scatterAssigned = 0;

    for (let c = 0; c < NUM_REELS; c++) {
      const col: GridCell[] = [];
      for (let r = 0; r < NUM_ROWS; r++) {
        if (forceBonus && scatterAssigned < 3 && Math.random() < 0.4 && (c === 0 || c === 2 || c === 4)) {
          col.push(generateRandomCell(c, true));
          scatterAssigned++;
        } else {
          col.push(generateRandomCell(c));
        }
      }
      initialGrid.push(col);
    }

    setGrid(initialGrid);
    setIsSpinning(false);

    // Step 2: Cascade loop
    let currentGrid = initialGrid;
    let step = 0;
    let accumulatedWin = 0;
    let hasMoreCascades = true;

    while (hasMoreCascades) {
      const multipliers = isFreeSpinMode ? FREE_MULTIPLIERS : BASE_MULTIPLIERS;
      const currentMultiplier = multipliers[Math.min(step, multipliers.length - 1)];
      setEliminationStep(step);

      const evalResult = evaluateWins(currentGrid, currentMultiplier);

      if (evalResult.winningWays.length > 0) {
        setIsCascading(true);
        setWinningWaysInfo(evalResult.winningWays);
        accumulatedWin += evalResult.totalWin;
        setCurrentSpinTotalWin(accumulatedWin);

        if (soundEnabled) {
          sound.playAceCascade();
          sound.playAceMultiplierLevel(step);
        }

        // Highlight winning cells
        setGrid(prev =>
          prev.map((col, cIdx) =>
            col.map((cell, rIdx) => ({
              ...cell,
              isWinning: evalResult.winningCoords.has(`${cIdx},${rIdx}`),
            }))
          )
        );

        // Pause to show win
        const winDisplayDelay = isTurbo ? 350 : 600;
        await new Promise(r => setTimeout(r, winDisplayDelay));

        // Step 3: Handle Golden Card transformations into Joker Wilds!
        let hasBigJokerSpawned = false;
        const transformedGrid: GridCell[][] = currentGrid.map(col => [...col]);

        if (evalResult.goldenCoordsToTransform.length > 0) {
          if (soundEnabled) sound.playJokerTransform();

          evalResult.goldenCoordsToTransform.forEach(({ col, row }) => {
            const isBig = Math.random() < 0.25; // 25% chance of Big Joker
            if (isBig) hasBigJokerSpawned = true;

            transformedGrid[col][row] = {
              uid: `${Date.now()}_joker_${Math.random()}`,
              symbolId: isBig ? 'big_joker' : 'little_joker',
              isGolden: false,
              isTransforming: true,
            };
          });

          // Big Joker extra wild transform: replace 1-4 random regular symbols on screen
          if (hasBigJokerSpawned) {
            setBigJokerEffect(true);
            const extraWildCount = 1 + Math.floor(Math.random() * 3);
            for (let i = 0; i < extraWildCount; i++) {
              const randCol = Math.floor(Math.random() * NUM_REELS);
              const randRow = Math.floor(Math.random() * NUM_ROWS);
              if (
                !evalResult.winningCoords.has(`${randCol},${randRow}`) &&
                transformedGrid[randCol][randRow].symbolId !== 'scatter'
              ) {
                transformedGrid[randCol][randRow] = {
                  uid: `${Date.now()}_extra_wild_${i}`,
                  symbolId: 'little_joker',
                  isGolden: false,
                  isTransforming: true,
                };
              }
            }
            setTimeout(() => setBigJokerEffect(false), 900);
          }
        }

        // Step 4: Elimination & Cascade drop
        const nextGrid: GridCell[][] = [];
        for (let c = 0; c < NUM_REELS; c++) {
          const newCol: GridCell[] = [];
          for (let r = 0; r < NUM_ROWS; r++) {
            const coordKey = `${c},${r}`;
            const wasGolden = currentGrid[c][r].isGolden;

            // If it was winning and golden, it became a Joker!
            if (evalResult.winningCoords.has(coordKey) && wasGolden) {
              newCol.push(transformedGrid[c][r]);
            }
            // If it was winning and not golden, it is removed!
            else if (evalResult.winningCoords.has(coordKey)) {
              // symbol removed
            } else {
              // Kept
              newCol.push(transformedGrid[c][r]);
            }
          }

          // Fill empty spots from top
          const needed = NUM_ROWS - newCol.length;
          const fallingCards: GridCell[] = [];
          for (let i = 0; i < needed; i++) {
            fallingCards.push({
              ...generateRandomCell(c),
              isNew: true,
            });
          }

          nextGrid.push([...fallingCards, ...newCol]);
        }

        currentGrid = nextGrid;
        setGrid(nextGrid);
        step++;

        const dropDelay = isTurbo ? 250 : 450;
        await new Promise(r => setTimeout(r, dropDelay));
      } else {
        // No more winning combos
        hasMoreCascades = false;

        // Check for 3+ Scatters anywhere on the grid
        if (evalResult.scatterCount >= 3) {
          if (soundEnabled) sound.playFreeSpinsTrigger();
          setShowFreeSpinIntro(true);
          setIsFreeSpinMode(true);
          setFreeSpinsLeft(prev => prev + 10);
        }
      }
    }

    setIsCascading(false);
    setLastWin(accumulatedWin);

    // Credit win
    if (accumulatedWin > 0) {
      onUpdateBalance(
        accumulatedWin,
        isFreeSpinMode
          ? `Super Ace ফ্রি স্পিন জয় (৳${accumulatedWin.toLocaleString()})`
          : `Super Ace কম্বো জয় (৳${accumulatedWin.toLocaleString()})`
      );

      if (soundEnabled) {
        sound.playWinChime();
      }

      // Check for Celebration tier
      const winRatio = accumulatedWin / bet;
      if (winRatio >= 25) {
        setShowCelebration({ type: 'super', amount: accumulatedWin });
      } else if (winRatio >= 10) {
        setShowCelebration({ type: 'mega', amount: accumulatedWin });
      } else if (winRatio >= 5) {
        setShowCelebration({ type: 'big', amount: accumulatedWin });
      }
    }

    // Add to History
    setSpinHistory(prev => [
      {
        id: `sa_${Date.now()}`,
        time: new Date().toLocaleTimeString('bn-BD', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
        bet,
        win: accumulatedWin,
        cascades: step,
        freeSpins: isFreeSpinMode,
      },
      ...prev.slice(0, 19),
    ]);

    // Handle Free Spins progression
    if (isFreeSpinMode) {
      setFreeSpinTotalWin(prev => prev + accumulatedWin);
      setFreeSpinsLeft(prev => {
        const next = prev - 1;
        if (next <= 0) {
          setTimeout(() => {
            setShowFreeSpinSummary(true);
            setIsFreeSpinMode(false);
          }, 800);
        }
        return Math.max(0, next);
      });
    }

    // Handle Auto-spin progression
    if (isAutoSpin && !isFreeSpinMode) {
      setAutoSpinsRemaining(prev => {
        if (prev <= 1) {
          setIsAutoSpin(false);
          return 0;
        }
        return prev - 1;
      });
    }
  }, [
    isSpinning,
    isCascading,
    isFreeSpinMode,
    balance,
    bet,
    soundEnabled,
    onOpenDeposit,
    onUpdateBalance,
    isTurbo,
    NUM_REELS,
    NUM_ROWS,
    generateRandomCell,
    evaluateWins,
    isAutoSpin,
  ]);

  // Auto spin trigger timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (
      (isAutoSpin && autoSpinsRemaining > 0 && !isSpinning && !isCascading && !showCelebration) ||
      (isFreeSpinMode && freeSpinsLeft > 0 && !isSpinning && !isCascading && !showFreeSpinIntro)
    ) {
      timer = setTimeout(() => {
        runSpin();
      }, isTurbo ? 400 : 900);
    }
    return () => clearTimeout(timer);
  }, [
    isAutoSpin,
    autoSpinsRemaining,
    isFreeSpinMode,
    freeSpinsLeft,
    isSpinning,
    isCascading,
    showCelebration,
    showFreeSpinIntro,
    isTurbo,
    runSpin,
  ]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col select-none overflow-hidden font-sans">
      {/* Top Header Bar */}
      <header className="bg-slate-900/90 border-b border-amber-500/30 px-3 py-2 flex items-center justify-between text-white backdrop-blur-md">
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            aria-label="গেম থেকে প্রস্থান"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-gray-300 hover:text-white transition flex items-center gap-1 text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">লবিতে ফিরুন</span>
          </button>

          <div className="flex items-center gap-2 ml-1">
            <span className="px-2 py-0.5 rounded bg-gradient-to-r from-amber-500 to-amber-700 text-slate-950 font-black text-xs uppercase tracking-wider shadow">
              JILI
            </span>
            <div>
              <h1 className="text-sm sm:text-base font-black text-amber-300 tracking-wide flex items-center gap-1.5">
                <span>♠️</span>
                <span>সুপার এস (Super Ace)</span>
                <span className="text-[10px] font-mono text-amber-400/80 bg-amber-950/60 px-1.5 py-0.2 rounded border border-amber-500/30">
                  কোড ৫৫৭
                </span>
              </h1>
              <p className="text-[10px] text-gray-400 hidden sm:block">
                ১,০২৪ ওয়েজ • গোল্ডেন কার্ড রূপান্তর • মাল্টিপ্লায়ার x১০
              </p>
            </div>
          </div>
        </div>

        {/* Live Balance & Quick Actions */}
        <div className="flex items-center gap-2">
          <div className="bg-slate-950/80 border border-emerald-500/40 rounded-xl px-2.5 py-1 flex items-center gap-1.5 shadow-inner">
            <Coins className="w-3.5 h-3.5 text-emerald-400" />
            <div className="text-right">
              <div className="text-[9px] uppercase tracking-wider text-gray-400">ব্যালেন্স</div>
              <div className="text-xs sm:text-sm font-mono font-bold text-emerald-400">
                ৳ {balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            {onOpenDeposit && (
              <button
                onClick={onOpenDeposit}
                className="ml-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-lg transition"
              >
                +
              </button>
            )}
          </div>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            aria-label={soundEnabled ? 'সাউন্ড বন্ধ করুন' : 'সাউন্ড চালু করুন'}
            className="p-1.5 rounded-lg bg-slate-800 text-gray-300 hover:text-white"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-gray-500" />}
          </button>

          <button
            onClick={() => setShowPaytable(true)}
            aria-label="পে-টেবিল ও নিয়মাবলী"
            className="p-1.5 rounded-lg bg-slate-800 text-gray-300 hover:text-white"
          >
            <HelpCircle className="w-4 h-4 text-amber-400" />
          </button>

          <button
            onClick={() => setShowHistory(true)}
            aria-label="স্পিন হিস্ট্রি"
            className="p-1.5 rounded-lg bg-slate-800 text-gray-300 hover:text-white"
          >
            <History className="w-4 h-4 text-cyan-400" />
          </button>
        </div>
      </header>

      {/* Main Game Stage */}
      <div className="flex-1 flex flex-col items-center justify-between p-2 sm:p-4 max-w-4xl mx-auto w-full overflow-y-auto">
        {/* Dynamic Combo Multiplier Ladder */}
        <div className="w-full bg-slate-900/90 border border-amber-500/30 rounded-2xl p-2 sm:p-2.5 mb-2 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between mb-1 px-1">
            <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1 uppercase tracking-wider">
              <TrendingUp className="w-3.5 h-3.5" />
              {isFreeSpinMode ? 'ফ্রি গেম মাল্টিপ্লায়ার (ডাবল)' : 'কম্বো মাল্টিপ্লায়ার মিটার'}
            </span>
            <span className="text-[10px] text-gray-400">
              {isFreeSpinMode ? `ফ্রি স্পিন অবশিষ্ট: ${freeSpinsLeft}` : '১,০২৪ উপায়ে জয়'}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
            {(isFreeSpinMode ? FREE_MULTIPLIERS : BASE_MULTIPLIERS).map((mult, idx) => {
              const isActive = eliminationStep >= idx;
              const isCurrent = eliminationStep === idx;
              return (
                <div
                  key={idx}
                  className={`relative py-1.5 px-2 rounded-xl text-center border transition-all duration-300 ${
                    isActive
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black border-yellow-200 shadow-[0_0_15px_rgba(250,204,21,0.5)] scale-105'
                      : 'bg-slate-950/60 text-gray-400 border-slate-800'
                  }`}
                >
                  <div className="text-[9px] uppercase tracking-wider font-semibold opacity-80">
                    {idx === 0 ? 'বেস' : `${idx}ম কম্বো`}
                  </div>
                  <div className="text-base sm:text-xl font-mono font-black tracking-tight">
                    x{mult}
                  </div>
                  {isCurrent && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 5x4 Slot Grid */}
        <div className="relative w-full aspect-[5/4] sm:aspect-[5/3.6] max-h-[56vh] bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border-2 border-amber-500/40 rounded-2xl p-1.5 sm:p-2.5 shadow-[0_0_30px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col justify-center">
          {/* Big Joker Lightning Screen Effect */}
          {bigJokerEffect && (
            <div className="absolute inset-0 z-30 pointer-events-none bg-yellow-400/20 animate-pulse flex items-center justify-center">
              <div className="text-center bg-slate-950/90 border-2 border-yellow-400 px-4 py-2 rounded-2xl shadow-[0_0_25px_rgba(250,204,21,0.8)]">
                <span className="text-2xl animate-bounce">⚡🃏⚡</span>
                <div className="text-amber-300 font-black text-sm uppercase tracking-wider">
                  বিগ জোকার ওয়াইল্ড ব্লাস্ট!
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-5 gap-1 sm:gap-2 h-full">
            {grid.map((column, colIdx) => (
              <div
                key={colIdx}
                className="flex flex-col gap-1 sm:gap-1.5 h-full justify-between"
              >
                {column.map((cell, rowIdx) => {
                  const symDef = SUPER_ACE_SYMBOLS[cell.symbolId];
                  return (
                    <div
                      key={cell.uid}
                      className={`relative flex-1 rounded-lg sm:rounded-xl flex flex-col items-center justify-center p-1 border transition-all duration-300 transform ${
                        cell.isWinning
                          ? 'bg-amber-400/30 border-amber-300 scale-105 shadow-[0_0_15px_rgba(251,191,36,0.6)] z-10 animate-pulse'
                          : cell.isGolden
                          ? 'bg-gradient-to-b from-amber-700/40 via-yellow-600/30 to-amber-900/40 border-yellow-400/80 shadow-[0_0_10px_rgba(250,204,21,0.4)]'
                          : 'bg-slate-900/90 border-slate-800/80 hover:border-slate-700'
                      } ${cell.isTransforming ? 'rotate-y-180 duration-500' : ''}`}
                    >
                      {/* Golden Frame Indicator */}
                      {cell.isGolden && (
                        <div className="absolute inset-0 rounded-lg sm:rounded-xl border border-yellow-300/80 pointer-events-none animate-pulse">
                          <span className="absolute top-0.5 right-0.5 text-[8px] font-black text-yellow-300 bg-slate-950/80 px-1 rounded">
                            GOLD
                          </span>
                        </div>
                      )}

                      {/* Card Rank & Suit Corner */}
                      {symDef.isPremium && (
                        <div className="absolute top-0.5 left-1 text-[9px] sm:text-[11px] font-black leading-tight flex items-center gap-0.5">
                          <span className={symDef.suitColor}>{symDef.cardRank}</span>
                          <span className={symDef.suitColor}>{symDef.cardSuit}</span>
                        </div>
                      )}

                      {/* Main Center Symbol */}
                      <div className="text-xl sm:text-3xl filter drop-shadow">
                        {symDef.icon}
                      </div>

                      {/* Symbol Label / Title */}
                      <div className={`text-[8px] sm:text-[10px] font-bold tracking-tight text-center truncate max-w-full px-0.5 ${symDef.suitColor}`}>
                        {symDef.nameBn.split(' ')[0]}
                      </div>

                      {/* Wild / Scatter / Top Pay Badges */}
                      {symDef.badge && (
                        <span
                          className={`absolute bottom-0.5 px-1 py-0.2 rounded text-[7px] sm:text-[8px] font-black uppercase tracking-tighter ${
                            symDef.isWild
                              ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950'
                              : symDef.isScatter
                              ? 'bg-purple-600 text-white'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                          }`}
                        >
                          {symDef.badge}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Win Banner / Feedback */}
        <div className="w-full mt-2 min-h-[38px] flex items-center justify-between px-3 py-1 bg-slate-900/80 border border-amber-500/30 rounded-xl">
          <div className="flex items-center gap-1.5 text-xs text-gray-300">
            <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
            {isSpinning ? (
              <span className="text-amber-300 animate-pulse font-medium">কার্ড স্পিন হচ্ছে...</span>
            ) : isCascading ? (
              <span className="text-yellow-400 font-bold animate-bounce">
                ক্যাসকেড এলিমিনেশন সক্রিয়! (x{isFreeSpinMode ? FREE_MULTIPLIERS[Math.min(eliminationStep, 3)] : BASE_MULTIPLIERS[Math.min(eliminationStep, 3)]})
              </span>
            ) : winningWaysInfo.length > 0 ? (
              <span className="text-emerald-400 font-bold">
                {winningWaysInfo.length}টি উপায়ে জয়!
              </span>
            ) : (
              <span className="text-gray-400 text-[11px]">স্পিন করতে বোতাম চাপুন</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider text-gray-400">জয়:</span>
            <span className="font-mono font-black text-sm sm:text-base text-emerald-400 tabular-nums">
              ৳ {currentSpinTotalWin > 0 ? currentSpinTotalWin.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
            </span>
          </div>
        </div>

        {/* Bottom Control Dock: Bet Presets & Action Buttons */}
        <div className="w-full mt-2 bg-slate-900/95 border border-amber-500/30 rounded-2xl p-2.5 sm:p-3 shadow-2xl backdrop-blur-md">
          {/* Quick Bet Presets */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1.5 mb-2 scrollbar-none">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
              <Coins className="w-3 h-3 text-amber-400" />
              বেট:
            </span>
            {BET_PRESETS.map(preset => (
              <button
                key={preset}
                disabled={isSpinning || isCascading || isFreeSpinMode}
                onClick={() => {
                  setBet(preset);
                  if (soundEnabled) sound.playClick();
                }}
                className={`px-2 py-1 rounded-lg text-xs font-mono font-bold shrink-0 transition ${
                  bet === preset
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black shadow'
                    : 'bg-slate-800 hover:bg-slate-700 text-gray-300'
                }`}
              >
                ৳{preset}
              </button>
            ))}
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between gap-2">
            {/* Bet Step Controls */}
            <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
              <button
                disabled={isSpinning || isCascading || isFreeSpinMode || bet <= BET_PRESETS[0]}
                onClick={() => {
                  const idx = BET_PRESETS.indexOf(bet);
                  if (idx > 0) setBet(BET_PRESETS[idx - 1]);
                  if (soundEnabled) sound.playClick();
                }}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white font-bold flex items-center justify-center text-sm"
              >
                -
              </button>

              <div className="px-2 text-center min-w-[65px]">
                <div className="text-[9px] uppercase tracking-wider text-gray-400">বর্তমান বেট</div>
                <div className="font-mono font-black text-xs sm:text-sm text-amber-300">
                  ৳{bet}
                </div>
              </div>

              <button
                disabled={isSpinning || isCascading || isFreeSpinMode || bet >= BET_PRESETS[BET_PRESETS.length - 1]}
                onClick={() => {
                  const idx = BET_PRESETS.indexOf(bet);
                  if (idx < BET_PRESETS.length - 1) setBet(BET_PRESETS[idx + 1]);
                  if (soundEnabled) sound.playClick();
                }}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white font-bold flex items-center justify-center text-sm"
              >
                +
              </button>
            </div>

            {/* Mode Controls: Turbo & Auto */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsTurbo(!isTurbo)}
                className={`p-2 rounded-xl border flex items-center gap-1 text-xs font-bold transition ${
                  isTurbo
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                    : 'bg-slate-800/80 border-slate-700 text-gray-400 hover:text-white'
                }`}
              >
                <FastForward className="w-4 h-4" />
                <span className="hidden sm:inline">টার্বো</span>
              </button>

              <button
                onClick={() => {
                  if (isAutoSpin) {
                    setIsAutoSpin(false);
                    setAutoSpinsRemaining(0);
                  } else {
                    setShowAutoModal(true);
                  }
                }}
                className={`p-2 rounded-xl border flex items-center gap-1 text-xs font-bold transition ${
                  isAutoSpin
                    ? 'bg-red-500/20 border-red-500 text-red-400 animate-pulse'
                    : 'bg-slate-800/80 border-slate-700 text-gray-400 hover:text-white'
                }`}
              >
                {isAutoSpin ? (
                  <>
                    <Pause className="w-4 h-4" />
                    <span>থামুন ({autoSpinsRemaining})</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-4 h-4" />
                    <span className="hidden sm:inline">অটো</span>
                  </>
                )}
              </button>
            </div>

            {/* Main Spin Button */}
            <button
              disabled={isSpinning || isCascading}
              onClick={runSpin}
              className={`flex-1 max-w-[180px] h-12 rounded-xl font-black text-sm sm:text-base tracking-wider uppercase transition shadow-lg flex items-center justify-center gap-1.5 ${
                isSpinning || isCascading
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:brightness-110 active:scale-95 text-slate-950 shadow-amber-500/30'
              }`}
            >
              <Zap className="w-5 h-5 fill-current" />
              <span>{isSpinning ? 'স্পিনিং...' : isCascading ? 'ক্যাসকেড' : isFreeSpinMode ? 'ফ্রি স্পিন' : 'স্পিন'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Auto Spin Modal */}
      {showAutoModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-amber-500/40 rounded-2xl max-w-sm w-full p-4 shadow-2xl text-white">
            <h3 className="text-base font-black text-amber-400 mb-2 flex items-center gap-2">
              <RotateCcw className="w-5 h-5" />
              অটো-স্পিন রাউন্ড নির্বাচন করুন
            </h3>
            <p className="text-xs text-gray-400 mb-4">
              আপনার নির্দিষ্ট সংখ্যক স্পিন স্বয়ংক্রিয়ভাবে চলতে থাকবে। যে কোনো সময় থামাতে পারবেন।
            </p>

            <div className="grid grid-cols-4 gap-2 mb-4">
              {[10, 20, 50, 100].map(count => (
                <button
                  key={count}
                  onClick={() => {
                    setAutoSpinsRemaining(count);
                    setIsAutoSpin(true);
                    setShowAutoModal(false);
                  }}
                  className="py-2.5 rounded-xl bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-white font-mono font-bold text-sm transition"
                >
                  {count}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowAutoModal(false)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-gray-300 rounded-xl text-xs font-bold"
            >
              বাতিল
            </button>
          </div>
        </div>
      )}

      {/* Free Spins Intro Modal */}
      {showFreeSpinIntro && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-gradient-to-b from-purple-950 via-slate-900 to-purple-950 border-2 border-yellow-400 rounded-3xl max-w-md w-full p-6 text-center text-white shadow-[0_0_50px_rgba(168,85,247,0.5)] animate-in zoom-in-95">
            <span className="text-5xl animate-bounce mb-3 block">🪙🪙🪙</span>
            <h2 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-300 to-yellow-400 mb-2">
              ফ্রি স্পিন বোনাস অ্যাক্টিভেটেড!
            </h2>
            <div className="text-4xl font-mono font-black text-yellow-300 my-3">
              ১০ ফ্রি গেমস
            </div>
            <p className="text-xs text-gray-300 mb-4 leading-relaxed">
              ফ্রি স্পিন চলাকালীন কম্বো মাল্টিপ্লায়ার দ্বিগুণ হবে:{' '}
              <span className="font-bold text-yellow-300">x2, x4, x6, x10!</span>
            </p>
            <button
              onClick={() => setShowFreeSpinIntro(false)}
              className="w-full py-3 bg-gradient-to-r from-yellow-400 to-amber-500 hover:brightness-110 text-slate-950 font-black text-base rounded-2xl shadow-lg transition"
            >
              ফ্রি গেমস শুরু করুন
            </button>
          </div>
        </div>
      )}

      {/* Free Spins Summary Modal */}
      {showFreeSpinSummary && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-slate-900 border-2 border-yellow-400 rounded-3xl max-w-md w-full p-6 text-center text-white shadow-[0_0_50px_rgba(250,204,21,0.5)]">
            <Trophy className="w-12 h-12 text-yellow-400 mx-auto mb-2 animate-bounce" />
            <h2 className="text-xl sm:text-2xl font-black text-amber-300 mb-1">
              অভিনন্দন! ফ্রি গেমস সমাপ্ত
            </h2>
            <p className="text-xs text-gray-400 mb-3">মোট অর্জিত জয়</p>
            <div className="text-3xl sm:text-4xl font-mono font-black text-emerald-400 mb-4">
              ৳ {freeSpinTotalWin.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <button
              onClick={() => {
                setShowFreeSpinSummary(false);
                setFreeSpinTotalWin(0);
              }}
              className="w-full py-2.5 bg-gradient-to-r from-amber-400 to-amber-600 text-slate-950 font-black rounded-xl text-sm"
            >
              প্রধান খেলায় ফিরুন
            </button>
          </div>
        </div>
      )}

      {/* Win Tier Celebrations */}
      {showCelebration && (
        <div
          onClick={() => setShowCelebration(null)}
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm cursor-pointer"
        >
          <div className="bg-gradient-to-b from-amber-950 via-slate-900 to-amber-950 border-2 border-yellow-400 rounded-3xl max-w-sm w-full p-6 text-center shadow-[0_0_50px_rgba(250,204,21,0.8)] animate-in zoom-in-95">
            <div className="text-4xl mb-2 animate-bounce">
              {showCelebration.type === 'super' ? '👑⚡🃏' : showCelebration.type === 'mega' ? '🔥🏆🔥' : '✨💰✨'}
            </div>
            <div className="text-xs font-black uppercase tracking-widest text-yellow-300 mb-1">
              {showCelebration.type === 'super' ? 'সুপার মেগা জয়!' : showCelebration.type === 'mega' ? 'মেগা জয়!' : 'বিগ জয়!'}
            </div>
            <div className="text-3xl font-mono font-black text-emerald-400 my-2">
              ৳ {showCelebration.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-[10px] text-gray-400">বন্ধ করতে ট্যাপ করুন</p>
          </div>
        </div>
      )}

      {/* Paytable & Rules Modal */}
      {showPaytable && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-3 sm:p-4 backdrop-blur-md">
          <div className="bg-slate-900 border border-amber-500/40 rounded-2xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl text-white">
            <div className="p-3 sm:p-4 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-sm sm:text-base font-black text-amber-300 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-amber-400" />
                সুপার এস (Super Ace) কোড ৫৫৭ নিয়মাবলী ও পে-টেবিল
              </h2>
              <button
                onClick={() => setShowPaytable(false)}
                className="p-1 rounded bg-slate-800 text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-3 sm:p-4 overflow-y-auto space-y-4 text-xs text-gray-300">
              {/* Feature 1: 1024 Ways */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <h3 className="font-bold text-amber-300 mb-1 flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5" />
                  ১,০২৪ উপায়ে জয় (1,024 Ways)
                </h3>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  বামদিকের প্রথম রিল থেকে শুরু করে পাশাপাশি রিলে যে কোনো অবস্থানে ৩ বা ততোধিক একই প্রতীক থাকলে জয় অর্জিত হয়।
                </p>
              </div>

              {/* Feature 2: Golden Card to Joker */}
              <div className="bg-slate-950 p-3 rounded-xl border border-yellow-500/30">
                <h3 className="font-bold text-yellow-300 mb-1 flex items-center gap-1">
                  <span>🃏</span>
                  গোল্ডেন কার্ড ও জোকার ওয়াইল্ড (Golden Cards & Jokers)
                </h3>
                <p className="text-[11px] text-gray-400 leading-relaxed mb-2">
                  রিল ২, ৩ এবং ৪ এ গোল্ডেন কার্ড উপস্থিত হতে পারে। কোনো জয়ী কম্বিনেশনে গোল্ডেন কার্ড অংশ নিলে তা নষ্ট না হয়ে জোকারে (Wild) রূপান্তরিত হয়!
                </p>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="p-1.5 rounded bg-slate-900 border border-slate-700">
                    <span className="font-bold text-amber-300">ছোট জোকার (Little Joker):</span> সকল সাধারণ প্রতীকের পরিপূরক হিসেবে কাজ করে।
                  </div>
                  <div className="p-1.5 rounded bg-slate-900 border border-slate-700">
                    <span className="font-bold text-yellow-300">বড় জোকার (Big Joker):</span> পর্দার ১-৪টি অতিরিক্ত সাধারণ প্রতীককে তাৎক্ষণিক ওয়াইল্ডে পরিণত করে!
                  </div>
                </div>
              </div>

              {/* Feature 3: Combo Multiplier Ladder */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <h3 className="font-bold text-amber-300 mb-1 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  এলিমিনেশন মাল্টিপ্লায়ার মিটার
                </h3>
                <p className="text-[11px] text-gray-400 leading-relaxed mb-2">
                  প্রতিটি জয়ী প্রতীক মুছে নতুন প্রতীক ক্যাসকেড হওয়ার সাথে সাথে মাল্টিপ্লায়ার বৃদ্ধি পায়:
                </p>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="p-2 rounded bg-slate-900">
                    <div className="font-bold text-amber-300 mb-0.5">সাধারণ খেলা:</div>
                    <div>বেস: x1 • ১ম কম্বো: x2 • ২য়: x3 • ৩য়+: x5</div>
                  </div>
                  <div className="p-2 rounded bg-purple-950/60 border border-purple-500/30">
                    <div className="font-bold text-purple-300 mb-0.5">ফ্রি গেমস (দ্বিগুণ):</div>
                    <div>বেস: x2 • ১ম কম্বো: x4 • ২য়: x6 • ৩য়+: x10</div>
                  </div>
                </div>
              </div>

              {/* Paytable Grid */}
              <div>
                <h3 className="font-bold text-amber-300 mb-2">প্রতীক পে-আউট রেট (বেট অনুপাত):</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {Object.values(SUPER_ACE_SYMBOLS)
                    .filter(s => s.payouts[0] > 0)
                    .map(sym => (
                      <div
                        key={sym.id}
                        className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-center"
                      >
                        <div className="text-2xl mb-1">{sym.icon}</div>
                        <div className={`font-bold text-[11px] truncate ${sym.suitColor}`}>
                          {sym.nameBn}
                        </div>
                        <div className="text-[9px] text-gray-400 mt-1">
                          5টি: x{sym.payouts[2]} • 4টি: x{sym.payouts[1]} • 3টি: x{sym.payouts[0]}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            <div className="p-3 border-t border-slate-800">
              <button
                onClick={() => setShowPaytable(false)}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold"
              >
                বুঝেছি, খেলা চালিয়ে যান
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Spin History Modal */}
      {showHistory && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-3 sm:p-4 backdrop-blur-md">
          <div className="bg-slate-900 border border-amber-500/40 rounded-2xl max-w-md w-full max-h-[80vh] flex flex-col shadow-2xl text-white">
            <div className="p-3 sm:p-4 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-sm sm:text-base font-black text-cyan-300 flex items-center gap-1.5">
                <History className="w-4 h-4 text-cyan-400" />
                সাম্প্রতিক সুপার এস স্পিন হিস্ট্রি
              </h2>
              <button
                onClick={() => setShowHistory(false)}
                className="p-1 rounded bg-slate-800 text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-3 sm:p-4 overflow-y-auto space-y-2 text-xs">
              {spinHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  এখনো কোনো স্পিন রেকর্ড নেই।
                </div>
              ) : (
                spinHistory.map(item => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-gray-200 flex items-center gap-1">
                        <span>বেট: ৳{item.bet}</span>
                        {item.freeSpins && (
                          <span className="px-1 py-0.2 rounded bg-purple-900 text-purple-300 text-[9px] font-bold">
                            FREE
                          </span>
                        )}
                        {item.cascades > 1 && (
                          <span className="px-1 py-0.2 rounded bg-amber-900/60 text-amber-300 text-[9px] font-bold">
                            {item.cascades} ক্যাসকেড
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-gray-500">{item.time}</div>
                    </div>

                    <div className="text-right">
                      <div
                        className={`font-mono font-bold ${
                          item.win > 0 ? 'text-emerald-400' : 'text-gray-500'
                        }`}
                      >
                        {item.win > 0 ? `+৳${item.win.toLocaleString()}` : '৳০.০০'}
                      </div>
                      <div className="text-[9px] text-gray-400">
                        {item.win > item.bet
                          ? `মুনাফা ${(item.win / item.bet).toFixed(1)}x`
                          : item.win > 0
                          ? 'আংশিক ফেরত'
                          : 'কোনো জয় নেই'}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-3 border-t border-slate-800">
              <button
                onClick={() => setShowHistory(false)}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
