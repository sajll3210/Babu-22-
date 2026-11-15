import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft,
  Volume2,
  VolumeX,
  Sparkles,
  Zap,
  RotateCcw,
  Trophy,
  History,
  ShieldCheck,
  Flame,
  Award,
  ChevronDown,
  Info,
} from 'lucide-react';
import { GameItem } from '../../types';
import { sound } from '../../utils/audio';

interface PlinkoGameProps {
  game: GameItem;
  balance: number;
  onUpdateBalance: (amount: number, reason: string) => void;
  onClose: () => void;
  onOpenDeposit?: () => void;
}

export type RiskLevel = 'low' | 'medium' | 'high';
export type RowCount = 8 | 10 | 12 | 14 | 16;

// Authentic Spribe / Stake Multipliers Configuration
export const PLINKO_MULTIPLIERS: Record<RowCount, Record<RiskLevel, number[]>> = {
  8: {
    low: [5.6, 2.1, 1.1, 1.0, 0.5, 1.0, 1.1, 2.1, 5.6],
    medium: [13, 3, 1.3, 0.7, 0.4, 0.7, 1.3, 3, 13],
    high: [29, 4, 1.5, 0.3, 0.2, 0.3, 1.5, 4, 29],
  },
  10: {
    low: [8.9, 3, 1.4, 1.1, 1.0, 0.5, 1.0, 1.1, 1.4, 3, 8.9],
    medium: [22, 5, 2, 1.4, 0.6, 0.4, 0.6, 1.4, 2, 5, 22],
    high: [76, 10, 3, 1.5, 0.3, 0.2, 0.3, 1.5, 3, 10, 76],
  },
  12: {
    low: [10, 3, 1.6, 1.4, 1.1, 1.0, 0.5, 1.0, 1.1, 1.4, 1.6, 3, 10],
    medium: [33, 11, 4, 2, 1.1, 0.6, 0.3, 0.6, 1.1, 2, 4, 11, 33],
    high: [170, 24, 8.1, 2, 0.7, 0.2, 0.2, 0.2, 0.7, 2, 8.1, 24, 170],
  },
  14: {
    low: [15, 4.5, 1.9, 1.4, 1.2, 1.1, 1.0, 0.5, 1.0, 1.1, 1.2, 1.4, 1.9, 4.5, 15],
    medium: [58, 15, 7, 4, 1.9, 1.0, 0.5, 0.2, 0.5, 1.0, 1.9, 4, 7, 15, 58],
    high: [420, 56, 18, 5, 1.9, 0.3, 0.2, 0.2, 0.2, 0.3, 1.9, 5, 18, 56, 420],
  },
  16: {
    low: [16, 9, 2, 1.4, 1.4, 1.2, 1.1, 1.0, 0.5, 1.0, 1.1, 1.2, 1.4, 1.4, 2, 9, 16],
    medium: [110, 41, 10, 5, 3, 1.5, 1.0, 0.5, 0.3, 0.5, 1.0, 1.5, 3, 5, 10, 41, 110],
    high: [1000, 130, 26, 9, 4, 2, 0.2, 0.2, 0.2, 0.2, 0.2, 2, 4, 9, 26, 130, 1000],
  },
};

interface PlinkoBall {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  bet: number;
  color: string;
  targetStep: number;
  currentStep: number;
  finalSlotIndex: number;
  path: number[];
}

interface Peg {
  x: number;
  y: number;
  radius: number;
  hitTime: number; // timestamp for bounce flash
}

const PRESET_BETS = [10, 20, 50, 100, 200, 500, 1000, 2000];

export const PlinkoGame: React.FC<PlinkoGameProps> = ({
  game,
  balance,
  onUpdateBalance,
  onClose,
  onOpenDeposit,
}) => {
  const [bet, setBet] = useState<number>(20);
  const [risk, setRisk] = useState<RiskLevel>('medium');
  const [rows, setRows] = useState<RowCount>(12);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isAutoBetting, setIsAutoBetting] = useState<boolean>(false);
  const [recentHits, setRecentHits] = useState<Array<{ id: string; mult: number; win: number }>>([
    { id: '1', mult: 2, win: 40 },
    { id: '2', mult: 0.6, win: 12 },
    { id: '3', mult: 4, win: 80 },
    { id: '4', mult: 11, win: 220 },
    { id: '5', mult: 0.3, win: 6 },
  ]);

  const [activeSlotHighlight, setActiveSlotHighlight] = useState<number | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ballsRef = useRef<PlinkoBall[]>([]);
  const pegsRef = useRef<Peg[]>([]);
  const animFrameRef = useRef<number | null>(null);
  const autoBetTimerRef = useRef<NodeJS.Timeout | null>(null);

  const currentMultipliers = PLINKO_MULTIPLIERS[rows][risk];

  const playSound = useCallback(
    (fn: () => void) => {
      if (soundEnabled) fn();
    },
    [soundEnabled]
  );

  // Helper to color code multiplier buckets
  const getBucketColor = useCallback((index: number, total: number) => {
    const center = (total - 1) / 2;
    const distFromCenter = Math.abs(index - center) / center; // 0 to 1

    if (distFromCenter < 0.25) {
      return {
        bg: 'bg-emerald-950/80',
        border: 'border-emerald-500/50',
        text: 'text-emerald-400',
        glow: 'rgba(16, 185, 129, 0.4)',
      };
    }
    if (distFromCenter < 0.65) {
      return {
        bg: 'bg-amber-950/80',
        border: 'border-amber-500/50',
        text: 'text-amber-400',
        glow: 'rgba(245, 158, 11, 0.4)',
      };
    }
    return {
      bg: 'bg-rose-950/90',
      border: 'border-rose-500/80',
      text: 'text-rose-400',
      glow: 'rgba(244, 63, 94, 0.6)',
    };
  }, []);

  // Initialize and calculate pegs positions for canvas
  const setupPegs = useCallback(
    (width: number, height: number) => {
      const pegs: Peg[] = [];
      const topPadding = 45;
      const bottomPadding = 75;
      const availableHeight = height - topPadding - bottomPadding;
      const rowSpacing = availableHeight / rows;

      for (let r = 0; r <= rows; r++) {
        const countInRow = r + 3; // e.g. row 0 has 3 pegs, row 1 has 4 pegs...
        const rowWidth = (countInRow - 1) * (width / (rows + 4));
        const startX = (width - rowWidth) / 2;
        const y = topPadding + r * rowSpacing;

        for (let c = 0; c < countInRow; c++) {
          const x = startX + c * (width / (rows + 4));
          pegs.push({
            x,
            y,
            radius: 3.5,
            hitTime: 0,
          });
        }
      }
      pegsRef.current = pegs;
    },
    [rows]
  );

  // Drop a ball into the Plinko pyramid
  const dropBall = useCallback(
    (customBet?: number) => {
      const activeBet = customBet !== undefined ? customBet : bet;
      if (balance < activeBet) {
        setIsAutoBetting(false);
        playSound(() => sound.playCrash());
        if (onOpenDeposit) onOpenDeposit();
        return;
      }

      onUpdateBalance(-activeBet, `প্লিংকো বাজি (৳${activeBet})`);
      playSound(() => sound.playClick());

      const canvas = canvasRef.current;
      const width = canvas ? canvas.width : 500;
      const startX = width / 2 + (Math.random() - 0.5) * 8; // slight drop offset
      const startY = 15;

      // Pre-compute authentic binomial distribution path (left/right decisions)
      const path: number[] = [];
      let currentCol = 0;
      for (let i = 0; i < rows; i++) {
        const dir = Math.random() < 0.5 ? 0 : 1;
        path.push(dir);
        currentCol += dir;
      }
      // Final slot index is currentCol (0 to rows)
      const finalSlotIndex = Math.min(Math.max(0, currentCol), currentMultipliers.length - 1);

      const color =
        risk === 'high' ? '#f43f5e' : risk === 'medium' ? '#fbbf24' : '#10b981';

      const newBall: PlinkoBall = {
        id: Math.random().toString(),
        x: startX,
        y: startY,
        vx: (Math.random() - 0.5) * 1.2,
        vy: 2.2,
        radius: 6,
        bet: activeBet,
        color,
        targetStep: rows,
        currentStep: 0,
        finalSlotIndex,
        path,
      };

      ballsRef.current.push(newBall);
    },
    [balance, bet, currentMultipliers.length, onOpenDeposit, onUpdateBalance, playSound, risk, rows]
  );

  // Drop multiple balls (Spam Drop 5x)
  const dropMultiBalls = (count: number) => {
    let dropped = 0;
    const interval = setInterval(() => {
      dropBall();
      dropped++;
      if (dropped >= count) clearInterval(interval);
    }, 120);
  };

  // Main Canvas Physics & Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = canvas.parentElement?.clientWidth || 560);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 460);

    const handleResize = () => {
      if (!canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
      setupPegs(width, height);
    };
    window.addEventListener('resize', handleResize);
    setupPegs(width, height);

    const gravity = 0.22;
    const friction = 0.985;
    const bounce = 0.55;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Draw glowing background grid
      ctx.fillStyle = '#080c18';
      ctx.fillRect(0, 0, width, height);

      // Subtle pyramid guide ambient gradient
      const pyramidGrad = ctx.createRadialGradient(
        width / 2,
        height * 0.45,
        20,
        width / 2,
        height * 0.5,
        width * 0.6
      );
      pyramidGrad.addColorStop(0, 'rgba(56, 189, 248, 0.05)');
      pyramidGrad.addColorStop(1, 'rgba(8, 12, 24, 0.0)');
      ctx.fillStyle = pyramidGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Draw Pegs
      const now = performance.now();
      pegsRef.current.forEach(peg => {
        const timeSinceHit = now - peg.hitTime;
        const isHit = timeSinceHit < 250;

        ctx.beginPath();
        ctx.arc(peg.x, peg.y, isHit ? peg.radius * 1.5 : peg.radius, 0, Math.PI * 2);

        if (isHit) {
          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = 'rgba(255, 255, 255, 0.9)';
          ctx.shadowBlur = 10;
        } else {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
          ctx.shadowBlur = 0;
        }
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // 3. Update & Draw Balls
      const remainingBalls: PlinkoBall[] = [];
      const bottomThreshold = height - 55;

      ballsRef.current.forEach(ball => {
        ball.vy += gravity;
        ball.vx *= friction;
        ball.x += ball.vx;
        ball.y += ball.vy;

        // Peg Collision Check
        pegsRef.current.forEach(peg => {
          const dx = ball.x - peg.x;
          const dy = ball.y - peg.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const minDist = ball.radius + peg.radius;

          if (dist < minDist) {
            // Collision detected! Bounce ball
            const normalX = dx / dist;
            const normalY = dy / dist;

            // Deflect
            const dot = ball.vx * normalX + ball.vy * normalY;
            ball.vx = (ball.vx - 2 * dot * normalX) * bounce + (Math.random() - 0.5) * 0.8;
            ball.vy = (ball.vy - 2 * dot * normalY) * bounce + 1.2;

            // Separate
            ball.x = peg.x + normalX * minDist;
            ball.y = peg.y + normalY * minDist;

            peg.hitTime = performance.now();
            playSound(() => sound.playSpinTick());
          }
        });

        // Left / Right wall bounds
        if (ball.x - ball.radius < 10) {
          ball.x = 10 + ball.radius;
          ball.vx = Math.abs(ball.vx) * 0.7;
        } else if (ball.x + ball.radius > width - 10) {
          ball.x = width - 10 - ball.radius;
          ball.vx = -Math.abs(ball.vx) * 0.7;
        }

        // Check if ball landed into bottom multiplier bucket
        if (ball.y >= bottomThreshold) {
          // Calculate landing bucket based on x coordinate
          const numBuckets = currentMultipliers.length;
          const bucketWidth = (width - 20) / numBuckets;
          const bucketIndex = Math.min(
            Math.max(0, Math.floor((ball.x - 10) / bucketWidth)),
            numBuckets - 1
          );

          const mult = currentMultipliers[bucketIndex];
          const winAmount = Math.floor(ball.bet * mult);

          // Trigger bucket visual highlight
          setActiveSlotHighlight(bucketIndex);
          setTimeout(() => setActiveSlotHighlight(null), 300);

          // Update balance and record hit
          onUpdateBalance(winAmount, `প্লিংকো জয় (+৳${winAmount})`);

          setRecentHits(prev => [
            { id: Math.random().toString(), mult, win: winAmount },
            ...prev.slice(0, 15),
          ]);

          if (mult >= 10) {
            playSound(() => sound.playJackpot());
          } else if (mult >= 1.0) {
            playSound(() => sound.playWinChime());
          }

          // Ball is done!
          return;
        }

        // Draw ball with neon glow
        ctx.save();
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fillStyle = ball.color;
        ctx.shadowColor = ball.color;
        ctx.shadowBlur = 12;
        ctx.fill();

        // Ball center white highlight
        ctx.beginPath();
        ctx.arc(ball.x - 1.5, ball.y - 1.5, ball.radius * 0.35, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.restore();

        remainingBalls.push(ball);
      });

      ballsRef.current = remainingBalls;
      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [currentMultipliers, onUpdateBalance, playSound, rows, setupPegs]);

  // Auto Bet Runner
  useEffect(() => {
    if (isAutoBetting) {
      autoBetTimerRef.current = setInterval(() => {
        dropBall();
      }, 350);
    } else {
      if (autoBetTimerRef.current) clearInterval(autoBetTimerRef.current);
    }

    return () => {
      if (autoBetTimerRef.current) clearInterval(autoBetTimerRef.current);
    };
  }, [isAutoBetting, dropBall]);

  return (
    <div className="flex flex-col h-full bg-[#070a14] text-white select-none font-sans overflow-hidden">
      {/* 1. Header Bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#0e1220] border-b border-gray-800/90 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              sound.playClick();
              setIsAutoBetting(false);
              onClose();
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-gray-300 bg-slate-800/90 hover:bg-slate-700 hover:text-white rounded-lg transition-colors border border-gray-700 active:scale-95"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="font-semibold hidden sm:inline">লবিতে ফিরুন</span>
          </button>

          <div className="flex items-center gap-1.5">
            <span className="text-xl">⚪</span>
            <div>
              <div className="flex items-center gap-1">
                <span className="font-black text-sm sm:text-base text-cyan-400 tracking-wide font-sans">
                  PLINKO
                </span>
                <span className="text-[9px] font-black bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-1.5 py-0.5 rounded">
                  SPRIBE
                </span>
                <span className="hidden md:inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.5 rounded-full ml-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>৯৯.০% RTP</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Balance & Audio Control */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2 bg-emerald-950/50 border border-emerald-500/40 px-2.5 py-1 rounded-xl shadow-sm">
            <div className="text-right leading-tight">
              <span className="text-[9px] text-gray-400 uppercase tracking-wider block">ব্যালেন্স</span>
              <span className="text-xs sm:text-sm font-black text-emerald-400 font-mono tabular-nums">
                ৳ {balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            {onOpenDeposit && (
              <button
                onClick={() => {
                  sound.playClick();
                  onOpenDeposit();
                }}
                className="px-2 py-1 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-[11px] rounded-lg shadow active:scale-95 transition-all"
              >
                + ডিপোজিট
              </button>
            )}
          </div>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1.5 text-gray-400 hover:text-white bg-slate-800 rounded-lg border border-gray-700 transition-colors"
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-gray-500" />
            )}
          </button>
        </div>
      </div>

      {/* 2. Top Multiplier Hit Stream */}
      <div className="px-3 py-1.5 bg-[#090d18] border-b border-gray-800/80 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar shrink-0">
        <div className="flex items-center gap-1.5 shrink-0 text-gray-400 text-xs font-semibold">
          <History className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">লাইভ হিট:</span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-1 px-1">
          {recentHits.map((hit, idx) => (
            <span
              key={hit.id || idx}
              className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full border tabular-nums transition-transform hover:scale-105 shrink-0 ${
                hit.mult >= 10
                  ? 'bg-rose-950/80 text-rose-300 border-rose-500 shadow-sm shadow-rose-500/20'
                  : hit.mult >= 2
                  ? 'bg-amber-950/80 text-amber-300 border-amber-500'
                  : hit.mult >= 1
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500'
                  : 'bg-slate-900 text-gray-400 border-gray-800'
              }`}
            >
              {hit.mult}x
            </span>
          ))}
        </div>
      </div>

      {/* 3. Main Arena: Plinko Canvas & Bottom Buckets */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
        {/* Left/Center: Pyramid Canvas & Bottom Buckets */}
        <div className="flex-1 flex flex-col p-2 sm:p-3 relative overflow-hidden">
          <div className="relative flex-1 bg-[#060812] rounded-2xl border border-gray-800/90 overflow-hidden flex flex-col shadow-2xl">
            {/* The Pegboard Canvas */}
            <div className="flex-1 relative w-full h-full">
              <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
            </div>

            {/* Bottom Multiplier Buckets */}
            <div className="px-2 pb-2.5 pt-1 grid grid-flow-col auto-cols-fr gap-1 z-10 shrink-0">
              {currentMultipliers.map((mult, idx) => {
                const colors = getBucketColor(idx, currentMultipliers.length);
                const isHighlighted = activeSlotHighlight === idx;

                return (
                  <div
                    key={idx}
                    className={`py-1.5 px-0.5 rounded-lg border text-center font-mono font-black text-[10px] sm:text-xs transition-all transform ${
                      colors.bg
                    } ${colors.border} ${colors.text} ${
                      isHighlighted ? 'scale-110 -translate-y-1 brightness-150 shadow-lg' : 'scale-100'
                    }`}
                    style={{
                      boxShadow: isHighlighted ? `0 0 15px ${colors.glow}` : undefined,
                    }}
                  >
                    {mult >= 100 ? `${mult}x` : `${mult}x`}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Cockpit: Controls Panel */}
        <div className="w-full md:w-80 bg-[#0a0e1c] border-t md:border-t-0 md:border-l border-gray-800/90 p-3 flex flex-col justify-between shrink-0">
          <div className="space-y-3">
            {/* 1. Bet Amount */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">বাজির পরিমাণ</label>
              <div className="flex items-center bg-slate-950 rounded-xl border border-gray-700 px-2 py-1.5 shadow-inner">
                <button
                  onClick={() => {
                    sound.playClick();
                    setBet(prev => Math.max(10, prev - 10));
                  }}
                  className="w-8 h-8 rounded-lg bg-slate-800 text-white font-bold flex items-center justify-center text-sm active:scale-95 transition-all"
                >
                  -
                </button>
                <div className="flex-1 text-center font-mono font-black text-sm sm:text-base text-amber-400">
                  <span className="text-gray-400 text-xs mr-1">৳</span>
                  <input
                    type="number"
                    value={bet}
                    onChange={e => setBet(Math.max(10, parseInt(e.target.value) || 10))}
                    className="w-20 bg-transparent text-center font-mono font-bold text-white focus:outline-none"
                  />
                </div>
                <button
                  onClick={() => {
                    sound.playClick();
                    setBet(prev => prev + 10);
                  }}
                  className="w-8 h-8 rounded-lg bg-slate-800 text-white font-bold flex items-center justify-center text-sm active:scale-95 transition-all"
                >
                  +
                </button>
              </div>

              {/* Quick Chips */}
              <div className="grid grid-cols-4 gap-1 mt-1.5">
                {PRESET_BETS.slice(0, 4).map(val => (
                  <button
                    key={val}
                    onClick={() => {
                      sound.playClick();
                      setBet(val);
                    }}
                    className={`text-[10px] font-mono py-1 rounded-lg border transition-all ${
                      bet === val
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold'
                        : 'bg-slate-900 border-gray-800 text-gray-400 hover:text-white'
                    }`}
                  >
                    ৳{val}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Risk Level */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">ঝুঁকির স্তর (Risk)</label>
              <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-gray-800 text-xs font-bold">
                <button
                  onClick={() => {
                    sound.playClick();
                    setRisk('low');
                  }}
                  className={`py-1.5 rounded-lg transition-all ${
                    risk === 'low'
                      ? 'bg-emerald-600 text-white shadow'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  কম (Low)
                </button>
                <button
                  onClick={() => {
                    sound.playClick();
                    setRisk('medium');
                  }}
                  className={`py-1.5 rounded-lg transition-all ${
                    risk === 'medium'
                      ? 'bg-amber-500 text-slate-950 shadow'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  মাঝারি (Med)
                </button>
                <button
                  onClick={() => {
                    sound.playClick();
                    setRisk('high');
                  }}
                  className={`py-1.5 rounded-lg transition-all ${
                    risk === 'high'
                      ? 'bg-rose-600 text-white shadow'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  উচ্চ (High)
                </button>
              </div>
            </div>

            {/* 3. Row Count */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">পিন সারি সংখ্যা (Rows)</label>
              <div className="grid grid-cols-5 gap-1 bg-slate-950 p-1 rounded-xl border border-gray-800 text-xs font-bold font-mono">
                {([8, 10, 12, 14, 16] as RowCount[]).map(r => (
                  <button
                    key={r}
                    onClick={() => {
                      sound.playClick();
                      setRows(r);
                    }}
                    className={`py-1 rounded-lg transition-all ${
                      rows === r
                        ? 'bg-cyan-600 text-white shadow'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons: Drop Ball, Multi Drop, Auto Bet */}
          <div className="space-y-2 mt-4">
            {/* Primary Drop Ball Button */}
            <button
              onClick={() => dropBall()}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 active:scale-95 transition-all cursor-pointer"
            >
              <span>ড্রপ বল (DROP BALL)</span>
              <span className="text-xs font-mono font-bold bg-slate-950/20 px-2 py-0.5 rounded">
                ৳{bet}
              </span>
            </button>

            {/* Multi-Drop & Auto Bet Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => dropMultiBalls(5)}
                className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 font-bold text-xs flex items-center justify-center gap-1 active:scale-95 transition-all"
              >
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                <span>৫x ড্রপ (Drop 5x)</span>
              </button>

              <button
                onClick={() => {
                  sound.playClick();
                  setIsAutoBetting(!isAutoBetting);
                }}
                className={`py-2.5 rounded-xl border font-bold text-xs flex items-center justify-center gap-1 active:scale-95 transition-all ${
                  isAutoBetting
                    ? 'bg-rose-950/80 border-rose-500 text-rose-300'
                    : 'bg-slate-800 hover:bg-slate-700 border-amber-500/30 text-amber-300'
                }`}
              >
                <RotateCcw className={`w-3.5 h-3.5 ${isAutoBetting ? 'animate-spin' : ''}`} />
                <span>{isAutoBetting ? 'অটো বন্ধ' : 'অটো বেট'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
