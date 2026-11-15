import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft,
  Volume2,
  VolumeX,
  ShieldCheck,
  History,
  Sparkles,
  Flame,
  AlertTriangle,
  RotateCcw,
  Trophy,
  Users,
  TrendingUp,
} from 'lucide-react';
import { sound } from '../../utils/audio';

interface CowCrashGameProps {
  balance: number;
  onUpdateBalance: (amount: number, reason: string) => void;
  onClose: () => void;
  onOpenDeposit?: () => void;
}

export const CowCrashGame: React.FC<CowCrashGameProps> = ({
  balance,
  onUpdateBalance,
  onClose,
  onOpenDeposit,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [showFairModal, setShowFairModal] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Multiplier Game Loop States
  const [gameState, setGameState] = useState<'WAITING' | 'FLYING' | 'CRASHED'>('WAITING');
  const [currentMultiplier, setCurrentMultiplier] = useState<number>(1.0);
  const [countdown, setCountdown] = useState<number>(5);
  const [crashPoint, setCrashPoint] = useState<number>(2.5);

  // Dual Betting Panels
  const [bet1, setBet1] = useState<{ amount: number; hasBet: boolean; hasCashedOut: boolean; autoCashout: number }>({
    amount: 100,
    hasBet: false,
    hasCashedOut: false,
    autoCashout: 2.0,
  });
  const [bet2, setBet2] = useState<{ amount: number; hasBet: boolean; hasCashedOut: boolean; autoCashout: number }>({
    amount: 50,
    hasBet: false,
    hasCashedOut: false,
    autoCashout: 3.5,
  });

  // History Multipliers
  const [history, setHistory] = useState<number[]>([1.42, 3.88, 1.15, 8.24, 2.1, 1.95, 12.4, 1.05]);

  // Simulated active players
  const [activePlayers, setActivePlayers] = useState([
    { name: 'রাকিব_০৭', bet: 250, mult: 2.1, cashed: true },
    { name: 'শাকিব_কিং', bet: 500, mult: 0, cashed: false },
    { name: 'বিজয়_৯৯', bet: 100, mult: 1.65, cashed: true },
    { name: 'তানভীর_বস', bet: 1000, mult: 0, cashed: false },
  ]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Generate fair crash point
  const generateCrashPoint = useCallback(() => {
    // 97% RTP distribution
    const r = Math.random();
    if (r < 0.04) return 1.0; // 4% instant crash
    return +(0.97 / (1 - r)).toFixed(2);
  }, []);

  // Main Canvas Animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let stars: Array<{ x: number; y: number; speed: number; size: number }> = [];

    for (let i = 0; i < 40; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        speed: 1 + Math.random() * 2,
        size: 1 + Math.random() * 2,
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Sky Background gradient
      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grad.addColorStop(0, '#040814');
      grad.addColorStop(0.6, '#081733');
      grad.addColorStop(1, '#0e2a47');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Ground green hill at bottom
      ctx.fillStyle = '#14532d';
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height + 250, 400, Math.PI, 0);
      ctx.fill();

      // Moving Stars & Clouds
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      stars.forEach(s => {
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
        if (gameState === 'FLYING') {
          s.x -= s.speed * 2;
          s.y += s.speed;
          if (s.x < 0) s.x = canvas.width;
          if (s.y > canvas.height) s.y = 0;
        }
      });

      // Cow Position calculation
      const progress = Math.min(1, (currentMultiplier - 1) / 10);
      const cowX = 60 + progress * (canvas.width - 150);
      const cowY = canvas.height - 80 - progress * (canvas.height - 180);

      if (gameState === 'FLYING') {
        // Jet Flame particle trail
        ctx.fillStyle = 'rgba(249, 115, 22, 0.8)';
        ctx.beginPath();
        ctx.arc(cowX - 25, cowY + 12, 10 + Math.random() * 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(234, 179, 8, 0.9)';
        ctx.beginPath();
        ctx.arc(cowX - 20, cowY + 12, 6 + Math.random() * 4, 0, Math.PI * 2);
        ctx.fill();

        // Rocket Cow Drawing
        ctx.save();
        ctx.translate(cowX, cowY);
        ctx.rotate(-0.15);

        // Rocket booster on back
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(-26, 4, 16, 12);
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(-26, 10, 4, 0, Math.PI * 2);
        ctx.fill();

        // Cow Body (Black & White spotted cow)
        ctx.font = '38px sans-serif';
        ctx.fillText('🐄', -15, 15);

        // Aviator Goggles
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(8, -8, 8, 4);

        ctx.restore();
      } else if (gameState === 'CRASHED') {
        // Crash explosion
        ctx.font = '48px sans-serif';
        ctx.fillText('💥', cowX - 20, cowY + 15);
      } else {
        // Waiting at launchpad
        ctx.font = '36px sans-serif';
        ctx.fillText('🐄', 60, canvas.height - 75);
      }

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [gameState, currentMultiplier]);

  // Round loop
  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (gameState === 'WAITING') {
      if (countdown > 0) {
        timer = setTimeout(() => setCountdown(prev => prev - 1), 1000);
      } else {
        // Launch Cow!
        const target = generateCrashPoint();
        setCrashPoint(target);
        setCurrentMultiplier(1.0);
        setGameState('FLYING');
        if (soundEnabled) {
          sound.playMoo();
        }
      }
    } else if (gameState === 'FLYING') {
      const step = 0.02 * Math.max(1, currentMultiplier * 0.4);
      timer = setTimeout(() => {
        const next = +(currentMultiplier + step).toFixed(2);

        // Auto Cashout check for Bet 1
        if (bet1.hasBet && !bet1.hasCashedOut && bet1.autoCashout > 0 && next >= bet1.autoCashout) {
          handleCashout(1, bet1.autoCashout);
        }
        // Auto Cashout check for Bet 2
        if (bet2.hasBet && !bet2.hasCashedOut && bet2.autoCashout > 0 && next >= bet2.autoCashout) {
          handleCashout(2, bet2.autoCashout);
        }

        if (next >= crashPoint) {
          // Crash!
          setGameState('CRASHED');
          if (soundEnabled) sound.playCrash();
          setHistory(prev => [crashPoint, ...prev.slice(0, 9)]);

          // Reset bets
          setBet1(prev => ({ ...prev, hasBet: false, hasCashedOut: false }));
          setBet2(prev => ({ ...prev, hasBet: false, hasCashedOut: false }));

          // Next round countdown
          setTimeout(() => {
            setGameState('WAITING');
            setCountdown(5);
          }, 3000);
        } else {
          setCurrentMultiplier(next);
        }
      }, 60);
    }

    return () => clearTimeout(timer);
  }, [gameState, countdown, currentMultiplier, crashPoint, bet1, bet2, generateCrashPoint, soundEnabled]);

  const handlePlaceBet = (panel: 1 | 2) => {
    const target = panel === 1 ? bet1 : bet2;
    if (balance < target.amount) {
      showToast('অপর্যাপ্ত ব্যালেন্স!');
      if (soundEnabled) sound.playCrash();
      return;
    }

    onUpdateBalance(-target.amount, `Cow Crash: বেট ${panel} স্থাপন`);
    if (soundEnabled) sound.playClick();

    if (panel === 1) {
      setBet1(prev => ({ ...prev, hasBet: true, hasCashedOut: false }));
    } else {
      setBet2(prev => ({ ...prev, hasBet: true, hasCashedOut: false }));
    }
  };

  const handleCashout = (panel: 1 | 2, multOverride?: number) => {
    const targetMult = multOverride || currentMultiplier;
    const targetBet = panel === 1 ? bet1 : bet2;

    if (!targetBet.hasBet || targetBet.hasCashedOut || gameState !== 'FLYING') return;

    const winAmount = +(targetBet.amount * targetMult).toFixed(2);
    onUpdateBalance(winAmount, `Cow Crash: প্যানেল ${panel} ক্যাশ আউট (${targetMult}x)`);
    if (soundEnabled) sound.playWinChime();

    if (panel === 1) {
      setBet1(prev => ({ ...prev, hasCashedOut: true }));
    } else {
      setBet2(prev => ({ ...prev, hasCashedOut: true }));
    }

    showToast(`💰 প্যানেল ${panel} ক্যাশ আউট! ৳${winAmount.toLocaleString()} (${targetMult}x)`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#060a14] flex flex-col overflow-y-auto select-none font-sans text-gray-100">
      {/* Header */}
      <header className="bg-[#0b1220] border-b border-emerald-500/20 px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between sticky top-0 z-20 shadow-lg">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-gray-300 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-slate-950 font-black text-lg">
              🐄
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-sm sm:text-base tracking-wide bg-gradient-to-r from-emerald-300 via-green-100 to-emerald-400 bg-clip-text text-transparent">
                  Cow Crash
                </span>
                <span className="text-[10px] font-black uppercase px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/40">
                  NEW
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-gray-400">রকেট কাউ টার্বো ক্র্যাশ গেম</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <div className="bg-slate-950/90 px-3 py-1.5 rounded-xl border border-emerald-500/30 flex items-center gap-2">
            <span className="text-[10px] sm:text-xs text-gray-400">ব্যালেন্স:</span>
            <span className="font-mono font-bold text-amber-400 text-xs sm:text-sm">
              ৳ {balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
            {onOpenDeposit && (
              <button
                onClick={onOpenDeposit}
                className="ml-1 text-[10px] bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-2 py-0.5 rounded shadow"
              >
                + জমা
              </button>
            )}
          </div>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1.5 sm:p-2 rounded-xl bg-slate-800 text-gray-400 hover:text-white"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setShowFairModal(true)}
            className="p-1.5 sm:p-2 rounded-xl bg-slate-800 text-gray-400 hover:text-white"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </button>
        </div>
      </header>

      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-slate-950 font-bold text-xs sm:text-sm px-4 py-2 rounded-xl shadow-xl animate-bounce">
          {toastMsg}
        </div>
      )}

      {/* Game Content */}
      <div className="flex-1 max-w-6xl w-full mx-auto p-3 sm:p-6 space-y-4">
        {/* Multiplier History Pill Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-mono">
          <span className="text-[11px] text-gray-500 shrink-0">হিস্ট্রি:</span>
          {history.map((h, i) => (
            <span
              key={i}
              className={`px-2.5 py-1 rounded-lg font-bold shrink-0 ${
                h >= 2.0
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40'
                  : 'bg-slate-900 text-gray-300 border border-slate-800'
              }`}
            >
              {h.toFixed(2)}x
            </span>
          ))}
        </div>

        {/* Flight Canvas Viewport */}
        <div className="bg-[#0b1220] border border-slate-800 rounded-3xl overflow-hidden relative shadow-2xl h-[340px] sm:h-[400px]">
          <canvas ref={canvasRef} width={800} height={400} className="w-full h-full object-cover" />

          {/* Centered Multiplier Overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            {gameState === 'WAITING' ? (
              <div className="bg-slate-950/80 backdrop-blur-md px-6 py-4 rounded-3xl border border-emerald-500/30 text-center animate-pulse">
                <div className="text-3xl sm:text-4xl font-black text-amber-400 font-mono">
                  {countdown}s
                </div>
                <span className="text-xs text-gray-300 font-medium">কাউ উড্ডয়নের প্রস্তুতি নিচ্ছে...</span>
              </div>
            ) : gameState === 'FLYING' ? (
              <div className="text-center drop-shadow-2xl">
                <div className="text-5xl sm:text-7xl font-black tracking-tight text-white font-mono drop-shadow-[0_4px_24px_rgba(16,185,129,0.8)]">
                  {currentMultiplier.toFixed(2)}x
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-500/40">
                  🚀 উড্ডয়নরত
                </span>
              </div>
            ) : (
              <div className="bg-rose-950/90 backdrop-blur-md px-6 py-4 rounded-3xl border border-rose-500/50 text-center">
                <div className="text-4xl sm:text-5xl font-black text-rose-400 font-mono">
                  {crashPoint.toFixed(2)}x
                </div>
                <span className="text-xs text-rose-200 font-bold uppercase">ক্র্যাশ হয়েছে!</span>
              </div>
            )}
          </div>
        </div>

        {/* Dual Bet Control Panels */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Bet Panel 1 */}
          <div className="bg-[#0c1424] border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span className="font-bold text-gray-200">বেট প্যানেল ১</span>
              <span className="font-mono">অটো ক্যাশআউট</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-gray-400 block mb-1">বাজি (BDT):</label>
                <input
                  type="number"
                  disabled={bet1.hasBet && gameState === 'FLYING'}
                  value={bet1.amount}
                  onChange={e => setBet1(prev => ({ ...prev, amount: Math.max(10, Number(e.target.value)) }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 font-mono font-bold text-white text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] text-gray-400 block mb-1">অটো মাল্টিপ্লায়ার:</label>
                <input
                  type="number"
                  step="0.1"
                  value={bet1.autoCashout}
                  onChange={e => setBet1(prev => ({ ...prev, autoCashout: Number(e.target.value) }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 font-mono font-bold text-emerald-400 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {!bet1.hasBet || gameState !== 'FLYING' ? (
              <button
                type="button"
                onClick={() => handlePlaceBet(1)}
                disabled={bet1.hasBet}
                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm shadow-lg shadow-emerald-500/25 active:scale-95 transition disabled:opacity-50"
              >
                {bet1.hasBet ? 'বেট গৃহীত (অপেক্ষা করুন)' : `বেট ১ স্থাপন করুন (৳${bet1.amount})`}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleCashout(1)}
                disabled={bet1.hasCashedOut}
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/25 active:scale-95 transition disabled:opacity-50"
              >
                {bet1.hasCashedOut ? 'ক্যাশ আউট সম্পন্ন' : `ক্যাশ আউট ৳${(bet1.amount * currentMultiplier).toFixed(0)}`}
              </button>
            )}
          </div>

          {/* Bet Panel 2 */}
          <div className="bg-[#0c1424] border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span className="font-bold text-gray-200">বেট প্যানেল ২</span>
              <span className="font-mono">অটো ক্যাশআউট</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-gray-400 block mb-1">বাজি (BDT):</label>
                <input
                  type="number"
                  disabled={bet2.hasBet && gameState === 'FLYING'}
                  value={bet2.amount}
                  onChange={e => setBet2(prev => ({ ...prev, amount: Math.max(10, Number(e.target.value)) }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 font-mono font-bold text-white text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] text-gray-400 block mb-1">অটো মাল্টিপ্লায়ার:</label>
                <input
                  type="number"
                  step="0.1"
                  value={bet2.autoCashout}
                  onChange={e => setBet2(prev => ({ ...prev, autoCashout: Number(e.target.value) }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 font-mono font-bold text-emerald-400 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {!bet2.hasBet || gameState !== 'FLYING' ? (
              <button
                type="button"
                onClick={() => handlePlaceBet(2)}
                disabled={bet2.hasBet}
                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm shadow-lg shadow-emerald-500/25 active:scale-95 transition disabled:opacity-50"
              >
                {bet2.hasBet ? 'বেট গৃহীত (অপেক্ষা করুন)' : `বেট ২ স্থাপন করুন (৳${bet2.amount})`}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleCashout(2)}
                disabled={bet2.hasCashedOut}
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/25 active:scale-95 transition disabled:opacity-50"
              >
                {bet2.hasCashedOut ? 'ক্যাশ আউট সম্পন্ন' : `ক্যাশ আউট ৳${(bet2.amount * currentMultiplier).toFixed(0)}`}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Provably Fair Modal */}
      {showFairModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-800 rounded-3xl max-w-md w-full p-6 text-white space-y-4">
            <h3 className="font-bold text-lg text-emerald-400 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5" /> Cow Crash প্রোভ্যাবলি ফেয়ার
            </h3>
            <p className="text-xs text-gray-300 leading-relaxed">
              কাউ ক্র্যাশের প্রতিটি রাউন্ড ক্রিপ্টোগ্রাফিক SHA-256 অ্যালগরিদমের মাধ্যমে স্বাধীনভাবে তৈরি হয়। কোনো ম্যানিপুলেশন সম্ভব নয়।
            </p>
            <button
              onClick={() => setShowFairModal(false)}
              className="w-full py-2.5 rounded-xl bg-slate-800 text-gray-200 font-bold hover:bg-slate-700"
            >
              বন্ধ করুন
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
