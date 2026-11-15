import React, { useState } from 'react';
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
  Building,
  ArrowUp,
  AlertTriangle,
} from 'lucide-react';
import { sound } from '../../utils/audio';

interface ElevatorGameProps {
  balance: number;
  onUpdateBalance: (amount: number, reason: string) => void;
  onClose: () => void;
  onOpenDeposit?: () => void;
}

const FLOORS = [
  { floor: 1, mult: 1.15, label: 'গ্রাউন্ড লবি' },
  { floor: 2, mult: 1.35, label: 'রেস্তোরাঁ ডেক' },
  { floor: 3, mult: 1.65, label: 'লাউঞ্জ ফ্লোর' },
  { floor: 4, mult: 2.1, label: 'ভিআইপি স্যুট' },
  { floor: 5, mult: 2.8, label: 'ক্লাউড ব্যালকনি' },
  { floor: 6, mult: 4.0, label: 'রয়্যাল চেম্বার' },
  { floor: 7, mult: 6.0, label: 'স্কাই গার্ডেন' },
  { floor: 8, mult: 10.0, label: 'ইনফিনিটি ডেক' },
  { floor: 9, mult: 18.0, label: 'গোল্ডেন পেন্টহাউস' },
  { floor: 10, mult: 35.0, label: 'স্টার অবজারভেটরি' },
  { floor: 11, mult: 75.0, label: 'স্ট্রাটোস্ফিয়ার লাউঞ্জ' },
  { floor: 12, mult: 250.0, label: 'শীর্ষ চূড়া (Apex)' },
];

export const ElevatorGame: React.FC<ElevatorGameProps> = ({
  balance,
  onUpdateBalance,
  onClose,
  onOpenDeposit,
}) => {
  const [betAmount, setBetAmount] = useState<number>(100);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [showFairModal, setShowFairModal] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Game state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentFloorIdx, setCurrentFloorIdx] = useState<number>(-1);
  const [isAscending, setIsAscending] = useState<boolean>(false);
  const [hasSnapped, setHasSnapped] = useState<boolean>(false);

  // History
  const [history, setHistory] = useState<Array<{ floor: number; mult: number; won: boolean }>>([
    { floor: 4, mult: 2.1, won: true },
    { floor: 2, mult: 1.35, won: true },
    { floor: 1, mult: 0, won: false },
    { floor: 7, mult: 6.0, won: true },
    { floor: 5, mult: 0, won: false },
  ]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const currentMult = currentFloorIdx >= 0 ? FLOORS[currentFloorIdx].mult : 1.0;
  const currentProfit = +(betAmount * currentMult).toFixed(2);
  const nextMult = currentFloorIdx + 1 < FLOORS.length ? FLOORS[currentFloorIdx + 1].mult : null;
  const nextProfit = nextMult ? +(betAmount * nextMult).toFixed(2) : null;

  const handleStartGame = () => {
    if (balance < betAmount) {
      showToast('অপর্যাপ্ত ব্যালেন্স! ডিপোজিট করুন।');
      if (soundEnabled) sound.playCrash();
      return;
    }

    onUpdateBalance(-betAmount, 'Elevator: লিফটে আরোহণ');
    if (soundEnabled) sound.playClick();

    setIsPlaying(true);
    setCurrentFloorIdx(-1);
    setHasSnapped(false);

    // Automatically ascend to floor 1
    handleAscendFloor(0);
  };

  const handleAscendFloor = (targetFloor?: number) => {
    if (isAscending) return;
    setIsAscending(true);

    const nextIndex = targetFloor !== undefined ? targetFloor : currentFloorIdx + 1;
    if (nextIndex >= FLOORS.length) return;

    // Cable snap chance based on floor height (~4% per floor)
    const snapChance = 0.08 + (nextIndex / FLOORS.length) * 0.15;
    const willSnap = Math.random() < snapChance;

    setTimeout(() => {
      setIsAscending(false);
      if (willSnap) {
        // Cable snap! Crash!
        setHasSnapped(true);
        setIsPlaying(false);
        if (soundEnabled) sound.playCrash();
        setHistory(prev => [{ floor: nextIndex + 1, mult: 0, won: false }, ...prev.slice(0, 7)]);
        showToast(`💥 ক্যাবল স্ন্যাপ! ফ্লোর ${FLOORS[nextIndex].floor}-এ লিফট অচল!`);
      } else {
        // Arrived safely at floor!
        setCurrentFloorIdx(nextIndex);
        if (soundEnabled) sound.playElevatorDing();

        if (nextIndex === FLOORS.length - 1) {
          // Reached apex penthouse jackpot!
          const apexWin = +(betAmount * FLOORS[nextIndex].mult).toFixed(2);
          onUpdateBalance(apexWin, `Elevator: শীর্ষ পেন্টহাউস জয় (${FLOORS[nextIndex].mult}x)`);
          setIsPlaying(false);
          setHistory(prev => [{ floor: nextIndex + 1, mult: FLOORS[nextIndex].mult, won: true }, ...prev.slice(0, 7)]);
          if (soundEnabled) sound.playJackpot();
          showToast(`🏆 শীর্ষ চূড়ায় সফল আরোহণ! ৳${apexWin.toLocaleString()} জয়!`);
        }
      }
    }, 600);
  };

  const handleCashout = () => {
    if (!isPlaying || currentFloorIdx < 0 || isAscending) return;

    onUpdateBalance(currentProfit, `Elevator: ফ্লোর ${FLOORS[currentFloorIdx].floor}-এ ক্যাশ আউট (${currentMult}x)`);
    if (soundEnabled) sound.playWinChime();

    setIsPlaying(false);
    setHistory(prev => [{ floor: currentFloorIdx + 1, mult: currentMult, won: true }, ...prev.slice(0, 7)]);
    showToast(`💰 ফ্লোর ${FLOORS[currentFloorIdx].floor}-এ ক্যাশ আউট! ৳${currentProfit.toLocaleString()} (${currentMult}x) অর্জিত!`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#060814] flex flex-col overflow-y-auto select-none font-sans text-gray-100">
      {/* Header */}
      <header className="bg-[#0b0e22] border-b border-cyan-500/20 px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between sticky top-0 z-20 shadow-lg">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-gray-300 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-sm sm:text-base tracking-wide bg-gradient-to-r from-cyan-300 via-sky-100 to-cyan-400 bg-clip-text text-transparent">
                Elevator of Fortune
              </span>
              <span className="text-[10px] font-black uppercase px-1.5 py-0.2 bg-cyan-500/20 text-cyan-300 rounded border border-cyan-500/40">
                PENTHOUSE
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-gray-400">স্কাইস্ক্র্যাপার গ্লাস লিফট আরোহণ</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <div className="bg-slate-950/90 px-3 py-1.5 rounded-xl border border-cyan-500/30 flex items-center gap-2">
            <span className="text-[10px] sm:text-xs text-gray-400">ব্যালেন্স:</span>
            <span className="font-mono font-bold text-amber-400 text-xs sm:text-sm">
              ৳ {balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
            {onOpenDeposit && (
              <button
                onClick={onOpenDeposit}
                className="ml-1 text-[10px] bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-2 py-0.5 rounded shadow"
              >
                + জমা
              </button>
            )}
          </div>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1.5 sm:p-2 rounded-xl bg-slate-800 text-gray-400 hover:text-white"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-cyan-500 text-slate-950 font-bold text-xs sm:text-sm px-4 py-2 rounded-xl shadow-xl animate-bounce">
          {toastMsg}
        </div>
      )}

      {/* Main Skyscraper Ascent Arena */}
      <div className="flex-1 max-w-5xl w-full mx-auto p-3 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start">
        {/* Left Side: Vertical Skyscraper Elevator Shaft */}
        <div className="lg:col-span-8 bg-[#090d20] border border-cyan-500/20 rounded-3xl p-4 sm:p-6 shadow-2xl space-y-4">
          {/* History Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-mono">
            <span className="text-[11px] text-gray-500 shrink-0">পূর্ববর্তী আরোহণ:</span>
            {history.map((h, i) => (
              <span
                key={i}
                className={`px-2.5 py-1 rounded-lg font-bold shrink-0 ${
                  h.won
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'
                    : 'bg-rose-950 text-rose-300 border border-rose-500/40'
                }`}
              >
                {h.won ? `FL ${h.floor} (${h.mult}x)` : `FL ${h.floor} 💥`}
              </span>
            ))}
          </div>

          {/* Current Status Banner */}
          <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-cyan-500/30 flex items-center justify-between">
            <div>
              <span className="text-xs text-gray-400 block">বর্তমান অবস্থান</span>
              <span className="font-bold text-sm text-cyan-300">
                {currentFloorIdx >= 0
                  ? `ফ্লোর ${FLOORS[currentFloorIdx].floor} - ${FLOORS[currentFloorIdx].label}`
                  : 'গ্রাউন্ড লেভেল'}
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs text-gray-400 block">মাল্টিপ্লায়ার</span>
              <span className="font-mono font-black text-2xl text-amber-400">
                {currentMult.toFixed(2)}x
              </span>
            </div>
          </div>

          {/* Vertical 12 Floor Elevator Shaft Ladder */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-3 flex flex-col-reverse gap-1.5 max-h-[360px] overflow-y-auto">
            {FLOORS.map((f, idx) => {
              const isCurrent = currentFloorIdx === idx;
              const isPast = currentFloorIdx > idx;

              return (
                <div
                  key={f.floor}
                  className={`p-2.5 rounded-xl border transition-all duration-300 flex items-center justify-between ${
                    isCurrent
                      ? hasSnapped
                        ? 'bg-rose-950/90 border-rose-500 text-rose-200 shadow-lg shadow-rose-500/30 animate-pulse'
                        : 'bg-cyan-950/90 border-cyan-400 text-cyan-200 shadow-lg shadow-cyan-500/30 scale-102'
                      : isPast
                      ? 'bg-slate-900/60 border-slate-800/80 text-gray-400'
                      : 'bg-slate-950 border-slate-800 text-gray-500'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center font-mono font-bold text-xs">
                      {f.floor}
                    </span>
                    <span className="text-xs font-semibold">{f.label}</span>
                    {isCurrent && (
                      <span className="text-xs px-2 py-0.5 rounded bg-cyan-500 text-slate-950 font-black animate-bounce">
                        {hasSnapped ? '💥 ক্যাবল স্ন্যাপ' : '🛗 লিফট কার'}
                      </span>
                    )}
                  </div>
                  <div className="font-mono font-black text-sm text-amber-400">
                    {f.mult.toFixed(2)}x
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Bet & Elevator Controls */}
        <div className="lg:col-span-4 bg-[#090d20] border border-cyan-500/20 rounded-3xl p-4 sm:p-6 shadow-2xl space-y-4">
          <div className="pb-3 border-b border-slate-800">
            <h3 className="font-bold text-sm text-gray-200 flex items-center gap-2">
              <Building className="w-4 h-4 text-cyan-400" /> লিফট কন্ট্রোল প্যানেল
            </h3>
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1">বাজির পরিমাণ (BDT):</label>
            <input
              type="number"
              disabled={isPlaying}
              value={betAmount}
              onChange={e => setBetAmount(Math.max(10, Number(e.target.value)))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono font-bold text-white text-base focus:border-cyan-500 focus:outline-none"
            />
          </div>

          {/* Action buttons */}
          <div className="space-y-3 pt-2">
            {!isPlaying ? (
              <button
                type="button"
                onClick={handleStartGame}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-400 to-cyan-600 hover:from-cyan-400 text-slate-950 font-black text-base shadow-xl shadow-cyan-500/25 active:scale-95 transition"
              >
                লিফটে প্রবেশ করুন (৳{betAmount})
              </button>
            ) : (
              <>
                <button
                  type="button"
                  disabled={isAscending || currentFloorIdx >= FLOORS.length - 1}
                  onClick={() => handleAscendFloor()}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 text-slate-950 font-black text-base shadow-xl shadow-cyan-500/25 active:scale-95 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <ArrowUp className="w-5 h-5 stroke-[3]" />
                  <span>{isAscending ? 'আরোহণ হচ্ছে...' : `পরবর্তী ফ্লোর (+${nextMult}x)`}</span>
                </button>

                <button
                  type="button"
                  disabled={isAscending || currentFloorIdx < 0}
                  onClick={handleCashout}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 text-slate-950 font-black text-base shadow-xl shadow-emerald-500/25 active:scale-95 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Trophy className="w-5 h-5 fill-slate-950" />
                  <span>ক্যাশ আউট (৳{currentProfit.toLocaleString()})</span>
                </button>
              </>
            )}
          </div>

          {/* Predictions */}
          {isPlaying && nextProfit && (
            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 text-xs font-mono space-y-1">
              <div className="flex justify-between text-gray-400">
                <span>পরবর্তী ফ্লোরে পেআউট:</span>
                <span className="text-cyan-300 font-bold">৳{nextProfit.toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
