import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft,
  Volume2,
  VolumeX,
  ShieldCheck,
  History,
  Sparkles,
  Flame,
  RotateCcw,
  Trophy,
  Gauge,
} from 'lucide-react';
import { sound } from '../../utils/audio';

interface DriftyGameProps {
  balance: number;
  onUpdateBalance: (amount: number, reason: string) => void;
  onClose: () => void;
  onOpenDeposit?: () => void;
}

export const DriftyGame: React.FC<DriftyGameProps> = ({
  balance,
  onUpdateBalance,
  onClose,
  onOpenDeposit,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [showFairModal, setShowFairModal] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Game Loop
  const [gameState, setGameState] = useState<'WAITING' | 'DRIFTING' | 'SPUN_OUT'>('WAITING');
  const [currentMultiplier, setCurrentMultiplier] = useState<number>(1.0);
  const [countdown, setCountdown] = useState<number>(5);
  const [spinOutPoint, setSpinOutPoint] = useState<number>(3.0);

  // Bet settings
  const [betAmount, setBetAmount] = useState<number>(100);
  const [hasBet, setHasBet] = useState<boolean>(false);
  const [hasCashedOut, setHasCashedOut] = useState<boolean>(false);
  const [autoCashout, setAutoCashout] = useState<number>(2.0);

  // Multiplier history
  const [history, setHistory] = useState<number[]>([1.88, 5.4, 1.25, 2.7, 1.1, 14.5, 3.2]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const generateSpinOutPoint = useCallback(() => {
    const r = Math.random();
    if (r < 0.04) return 1.0;
    return +(0.97 / (1 - r)).toFixed(2);
  }, []);

  // Canvas visual rendering (Drifting race car on neon track)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let skidMarks: Array<{ x: number; y: number; opacity: number }> = [];

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Cyberpunk road asphalt
      const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      bgGrad.addColorStop(0, '#090514');
      bgGrad.addColorStop(0.5, '#120b29');
      bgGrad.addColorStop(1, '#1f0d3d');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Neon Track Hairpin Curve
      ctx.strokeStyle = '#ec4899';
      ctx.lineWidth = 14;
      ctx.shadowColor = '#ec4899';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2, 130, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Inner neon curb
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2, 100, 0, Math.PI * 2);
      ctx.stroke();

      // Outer neon curb
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2, 160, 0, Math.PI * 2);
      ctx.stroke();

      // Car angle on circular track
      const angle = (Date.now() / 400) % (Math.PI * 2);
      const radius = 130;
      const carX = canvas.width / 2 + Math.cos(angle) * radius;
      const carY = canvas.height / 2 + Math.sin(angle) * radius;

      if (gameState === 'DRIFTING') {
        // Record skid mark
        skidMarks.push({ x: carX, y: carY, opacity: 1 });
        if (skidMarks.length > 50) skidMarks.shift();

        // Draw skid marks
        skidMarks.forEach(s => {
          ctx.fillStyle = `rgba(15, 23, 42, ${s.opacity})`;
          ctx.beginPath();
          ctx.arc(s.x, s.y, 4, 0, Math.PI * 2);
          ctx.fill();
          s.opacity *= 0.96;
        });

        // Nitrous flames from exhaust
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(carX - Math.cos(angle + 0.3) * 15, carY - Math.sin(angle + 0.3) * 15, 6, 0, Math.PI * 2);
        ctx.fill();

        // Draw Sports Car
        ctx.save();
        ctx.translate(carX, carY);
        // Angle tangent to track + drift angle offset
        ctx.rotate(angle + Math.PI / 2 + 0.35);

        // Car Body
        ctx.fillStyle = '#f43f5e';
        ctx.fillRect(-12, -22, 24, 44);

        // Windshield
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-9, -8, 18, 14);

        // Headlights
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(-10, -22, 5, 3);
        ctx.fillRect(5, -22, 5, 3);

        ctx.restore();
      } else if (gameState === 'SPUN_OUT') {
        // Spin out smoke & explosion
        ctx.font = '40px sans-serif';
        ctx.fillText('💥', carX - 20, carY + 15);
      } else {
        // Waiting state
        ctx.save();
        ctx.translate(canvas.width / 2 + radius, canvas.height / 2);
        ctx.rotate(Math.PI / 2);
        ctx.fillStyle = '#f43f5e';
        ctx.fillRect(-12, -22, 24, 44);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-9, -8, 18, 14);
        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [gameState]);

  // Round loop
  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (gameState === 'WAITING') {
      if (countdown > 0) {
        timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      } else {
        const target = generateSpinOutPoint();
        setSpinOutPoint(target);
        setCurrentMultiplier(1.0);
        setGameState('DRIFTING');
        if (soundEnabled) sound.playDrift();
      }
    } else if (gameState === 'DRIFTING') {
      const step = 0.02 * Math.max(1, currentMultiplier * 0.4);
      timer = setTimeout(() => {
        const next = +(currentMultiplier + step).toFixed(2);

        // Auto Cashout
        if (hasBet && !hasCashedOut && autoCashout > 0 && next >= autoCashout) {
          handleCashout(autoCashout);
        }

        if (next >= spinOutPoint) {
          setGameState('SPUN_OUT');
          if (soundEnabled) sound.playCrash();
          setHistory(prev => [spinOutPoint, ...prev.slice(0, 9)]);
          setHasBet(false);
          setHasCashedOut(false);

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
  }, [gameState, countdown, currentMultiplier, spinOutPoint, hasBet, hasCashedOut, autoCashout, generateSpinOutPoint, soundEnabled]);

  const handlePlaceBet = () => {
    if (balance < betAmount) {
      showToast('অপর্যাপ্ত ব্যালেন্স! ডিপোজিট করুন।');
      if (soundEnabled) sound.playCrash();
      return;
    }

    onUpdateBalance(-betAmount, 'Drifty: বাজি স্থাপন');
    if (soundEnabled) sound.playClick();
    setHasBet(true);
    setHasCashedOut(false);
  };

  const handleCashout = (overrideMult?: number) => {
    const mult = overrideMult || currentMultiplier;
    if (!hasBet || hasCashedOut || gameState !== 'DRIFTING') return;

    const winAmount = +(betAmount * mult).toFixed(2);
    onUpdateBalance(winAmount, `Drifty: ক্যাশ আউট (${mult}x)`);
    if (soundEnabled) sound.playWinChime();

    setHasCashedOut(true);
    showToast(`💰 সফল ড্র্রিফট ক্যাশ আউট! ৳${winAmount.toLocaleString()} (${mult}x)`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#070512] flex flex-col overflow-y-auto select-none font-sans text-gray-100">
      {/* Header */}
      <header className="bg-[#0f0924] border-b border-rose-500/20 px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between sticky top-0 z-20 shadow-lg">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-gray-300 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-sm sm:text-base tracking-wide bg-gradient-to-r from-rose-400 via-pink-200 to-rose-400 bg-clip-text text-transparent">
                Drifty Tokyo Race
              </span>
              <span className="text-[10px] font-black uppercase px-1.5 py-0.2 bg-rose-500/20 text-rose-300 rounded border border-rose-500/40">
                TURBO
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-gray-400">সাইবারপাঙ্ক ড্রিফট মাল্টিপ্লায়ার</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <div className="bg-slate-950/90 px-3 py-1.5 rounded-xl border border-rose-500/30 flex items-center gap-2">
            <span className="text-[10px] sm:text-xs text-gray-400">ব্যালেন্স:</span>
            <span className="font-mono font-bold text-amber-400 text-xs sm:text-sm">
              ৳ {balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
            {onOpenDeposit && (
              <button
                onClick={onOpenDeposit}
                className="ml-1 text-[10px] bg-rose-500 hover:bg-rose-400 text-white font-bold px-2 py-0.5 rounded shadow"
              >
                + জমা
              </button>
            )}
          </div>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1.5 sm:p-2 rounded-xl bg-slate-800 text-gray-400 hover:text-white"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-rose-400" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-rose-500 text-white font-bold text-xs sm:text-sm px-4 py-2 rounded-xl shadow-xl animate-bounce">
          {toastMsg}
        </div>
      )}

      {/* Main Game Screen */}
      <div className="flex-1 max-w-5xl w-full mx-auto p-3 sm:p-6 space-y-4">
        {/* History Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-mono">
          <span className="text-[11px] text-gray-500 shrink-0">হিস্ট্রি:</span>
          {history.map((h, i) => (
            <span
              key={i}
              className={`px-2.5 py-1 rounded-lg font-bold shrink-0 ${
                h >= 2.0
                  ? 'bg-rose-950 text-rose-300 border border-rose-500/40'
                  : 'bg-slate-900 text-gray-400 border border-slate-800'
              }`}
            >
              {h.toFixed(2)}x
            </span>
          ))}
        </div>

        {/* Drift Arena Canvas */}
        <div className="bg-[#0b081b] border-2 border-rose-500/30 rounded-3xl overflow-hidden relative shadow-2xl h-[340px] sm:h-[400px]">
          <canvas ref={canvasRef} width={800} height={400} className="w-full h-full object-cover" />

          {/* Centered Speed Multiplier Display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            {gameState === 'WAITING' ? (
              <div className="bg-slate-950/80 backdrop-blur-md px-6 py-4 rounded-3xl border border-rose-500/30 text-center animate-pulse">
                <div className="text-3xl sm:text-4xl font-black text-rose-400 font-mono">
                  {countdown}s
                </div>
                <span className="text-xs text-gray-300 font-medium">ইঞ্জিন রেভ হচ্ছে... প্রস্তুত হন!</span>
              </div>
            ) : gameState === 'DRIFTING' ? (
              <div className="text-center drop-shadow-2xl">
                <div className="text-5xl sm:text-7xl font-black tracking-tight text-white font-mono drop-shadow-[0_4px_24px_rgba(244,63,94,0.8)]">
                  {currentMultiplier.toFixed(2)}x
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-rose-400 bg-rose-950/80 px-3 py-1 rounded-full border border-rose-500/40">
                  🔥 ফুল ড্রিফট অন
                </span>
              </div>
            ) : (
              <div className="bg-rose-950/90 backdrop-blur-md px-6 py-4 rounded-3xl border border-rose-500 text-center">
                <div className="text-4xl sm:text-5xl font-black text-rose-300 font-mono">
                  {spinOutPoint.toFixed(2)}x
                </div>
                <span className="text-xs text-rose-200 font-bold uppercase">স্পিন আউট (ক্র্যাশ)!</span>
              </div>
            )}
          </div>
        </div>

        {/* Bet Controls */}
        <div className="bg-[#0f0924] border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <div>
            <label className="text-xs text-gray-400 block mb-1">বাজির পরিমাণ (BDT):</label>
            <input
              type="number"
              disabled={hasBet && gameState === 'DRIFTING'}
              value={betAmount}
              onChange={e => setBetAmount(Math.max(10, Number(e.target.value)))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono font-bold text-white text-base focus:border-rose-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1">অটো ক্যাশআউট মাল্টিপ্লায়ার:</label>
            <input
              type="number"
              step="0.1"
              value={autoCashout}
              onChange={e => setAutoCashout(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono font-bold text-rose-400 text-base focus:border-rose-500 focus:outline-none"
            />
          </div>

          <div>
            {!hasBet || gameState !== 'DRIFTING' ? (
              <button
                type="button"
                onClick={handlePlaceBet}
                disabled={hasBet}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 text-white font-black text-base shadow-xl shadow-rose-500/25 active:scale-95 transition disabled:opacity-50"
              >
                {hasBet ? 'বেট সক্রিয় (অপেক্ষা করুন)' : `ড্রিফট শুরু করুন (৳${betAmount})`}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleCashout()}
                disabled={hasCashedOut}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 text-slate-950 font-black text-base shadow-xl shadow-amber-500/25 active:scale-95 transition disabled:opacity-50"
              >
                {hasCashedOut ? 'ক্যাশ আউট সফল' : `ক্যাশ আউট ৳${(betAmount * currentMultiplier).toFixed(0)}`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
