import React, { useState } from 'react';
import { ArrowLeft, Volume2, VolumeX, ShieldCheck, Sparkles } from 'lucide-react';
import { sound } from '../../utils/audio';

interface RouletteGameProps {
  balance: number;
  onUpdateBalance: (amount: number, reason: string) => void;
  onClose: () => void;
  onOpenDeposit?: () => void;
}

// European Roulette Numbers in wheel order
const WHEEL_NUMBERS = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1,
  20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
];

const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

interface ActiveBet {
  type: string;
  label: string;
  amount: number;
  payout: number;
}

export const RouletteGame: React.FC<RouletteGameProps> = ({
  balance,
  onUpdateBalance,
  onClose,
  onOpenDeposit,
}) => {
  const [selectedChip, setSelectedChip] = useState<number>(50);
  const [bets, setBets] = useState<ActiveBet[]>([]);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [winningNumber, setWinningNumber] = useState<number | null>(null);
  const [wheelRotation, setWheelRotation] = useState<number>(0);
  const [ballRotation, setBallRotation] = useState<number>(0);
  const [pastWins, setPastWins] = useState<number[]>([32, 15, 19, 4, 21, 0, 7, 18]);
  const [lastWinAmount, setLastWinAmount] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  const totalBetAmount = bets.reduce((sum, b) => sum + b.amount, 0);

  const getNumberColor = (num: number) => {
    if (num === 0) return 'text-emerald-400 bg-emerald-600/30 border-emerald-500/50';
    return RED_NUMBERS.includes(num)
      ? 'text-rose-400 bg-rose-600/30 border-rose-500/50'
      : 'text-gray-200 bg-slate-800/80 border-slate-700/60';
  };

  const addBet = (type: string, label: string, payout: number) => {
    if (isSpinning) return;
    if (balance < selectedChip) {
      if (onOpenDeposit) {
        onOpenDeposit();
      }
      return;
    }

    onUpdateBalance(-selectedChip, `রুলেট বেট: ${label}`);
    if (soundEnabled) sound.playClick();

    setBets(prev => {
      const existing = prev.find(b => b.type === type);
      if (existing) {
        return prev.map(b => (b.type === type ? { ...b, amount: b.amount + selectedChip } : b));
      }
      return [...prev, { type, label, amount: selectedChip, payout }];
    });
  };

  const clearBets = () => {
    if (isSpinning || bets.length === 0) return;
    onUpdateBalance(totalBetAmount, 'রুলেট বেট বাতিল');
    setBets([]);
    if (soundEnabled) sound.playClick();
  };

  const spinRoulette = () => {
    if (isSpinning || bets.length === 0) return;

    setIsSpinning(true);
    setWinningNumber(null);
    setLastWinAmount(0);

    const targetNumber = WHEEL_NUMBERS[Math.floor(Math.random() * WHEEL_NUMBERS.length)];
    const numberIndex = WHEEL_NUMBERS.indexOf(targetNumber);
    const sliceAngle = 360 / WHEEL_NUMBERS.length;

    // Spin rotations
    const newWheelRotation = wheelRotation + 1440 + Math.random() * 360;
    const newBallRotation = ballRotation - 2160 - numberIndex * sliceAngle;

    setWheelRotation(newWheelRotation);
    setBallRotation(newBallRotation);

    const tickInterval = setInterval(() => {
      if (soundEnabled) sound.playSpinTick();
    }, 120);

    setTimeout(() => {
      clearInterval(tickInterval);
      setWinningNumber(targetNumber);
      setPastWins(prev => [targetNumber, ...prev.slice(0, 11)]);
      setIsSpinning(false);

      // Evaluate Winnings
      let wonAmount = 0;
      const isRed = RED_NUMBERS.includes(targetNumber);
      const isEven = targetNumber !== 0 && targetNumber % 2 === 0;
      const isOdd = targetNumber !== 0 && targetNumber % 2 !== 0;
      const isLow = targetNumber >= 1 && targetNumber <= 18;
      const isHigh = targetNumber >= 19 && targetNumber <= 36;
      const isDoz1 = targetNumber >= 1 && targetNumber <= 12;
      const isDoz2 = targetNumber >= 13 && targetNumber <= 24;
      const isDoz3 = targetNumber >= 25 && targetNumber <= 36;

      bets.forEach(b => {
        if (b.type === `num-${targetNumber}`) {
          wonAmount += b.amount * b.payout;
        } else if (b.type === 'red' && isRed) {
          wonAmount += b.amount * b.payout;
        } else if (b.type === 'black' && !isRed && targetNumber !== 0) {
          wonAmount += b.amount * b.payout;
        } else if (b.type === 'even' && isEven) {
          wonAmount += b.amount * b.payout;
        } else if (b.type === 'odd' && isOdd) {
          wonAmount += b.amount * b.payout;
        } else if (b.type === 'low' && isLow) {
          wonAmount += b.amount * b.payout;
        } else if (b.type === 'high' && isHigh) {
          wonAmount += b.amount * b.payout;
        } else if (b.type === 'doz1' && isDoz1) {
          wonAmount += b.amount * b.payout;
        } else if (b.type === 'doz2' && isDoz2) {
          wonAmount += b.amount * b.payout;
        } else if (b.type === 'doz3' && isDoz3) {
          wonAmount += b.amount * b.payout;
        }
      });

      if (wonAmount > 0) {
        setLastWinAmount(wonAmount);
        onUpdateBalance(wonAmount, `রুলেট জয় (+৳${wonAmount})`);
        if (soundEnabled) sound.playWinChime();
      }
      setBets([]);
    }, 3800);
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0f18] text-white select-none overflow-y-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#121927] border-b border-gray-800 shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-gray-300 bg-gray-800 hover:bg-gray-700 rounded transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>লবিতে ফিরুন</span>
          </button>
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-sm tracking-wider text-emerald-400">
              EUROPEAN ROULETTE
            </span>
            <span className="text-[10px] text-gray-400 bg-gray-800/80 px-1.5 py-0.5 rounded">
              Evolution
            </span>
          </div>
        </div>

        {/* Recent Numbers Ticker */}
        <div className="hidden sm:flex items-center gap-1 overflow-x-auto max-w-sm py-1">
          {pastWins.map((n, i) => (
            <span
              key={i}
              className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-mono font-bold border ${getNumberColor(
                n
              )}`}
            >
              {n}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[10px] text-gray-400">ব্যালেন্স</div>
            <div className="text-xs font-bold text-amber-400 font-mono tabular-nums">
              ৳ {balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <button
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              sound.enabled = !soundEnabled;
            }}
            className="p-1.5 text-gray-400 hover:text-white bg-gray-800 rounded transition-colors"
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-gray-500" />
            )}
          </button>
        </div>
      </div>

      {/* Arena */}
      <div className="flex-1 flex flex-col lg:flex-row p-3 gap-3 max-w-6xl mx-auto w-full">
        {/* Left: Roulette Wheel Visualizer */}
        <div className="flex flex-col items-center justify-center bg-[#0d1424] rounded-2xl p-4 border border-gray-800 relative">
          <div className="text-xs text-emerald-400 font-medium mb-2 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            লাইভ অডিটেড হুইল
          </div>

          {/* Animated SVG Wheel */}
          <div className="relative w-56 h-56 sm:w-64 sm:h-64 flex items-center justify-center my-2">
            {/* Outer Wood Rim */}
            <div className="absolute inset-0 rounded-full border-8 border-amber-950/80 shadow-2xl bg-gradient-to-tr from-amber-900/40 via-slate-900 to-amber-900/30" />

            {/* Wheel Rotating Circle */}
            <div
              className="w-44 h-44 sm:w-52 sm:h-52 rounded-full border-4 border-amber-500/50 flex items-center justify-center transition-transform duration-[3800ms] ease-out shadow-inner"
              style={{ transform: `rotate(${wheelRotation}deg)` }}
            >
              <div className="relative w-full h-full rounded-full flex items-center justify-center">
                {WHEEL_NUMBERS.slice(0, 18).map((num, idx) => {
                  const rot = idx * 20;
                  return (
                    <div
                      key={idx}
                      className="absolute text-[9px] font-mono font-bold origin-center"
                      style={{
                        transform: `rotate(${rot}deg) translateY(-85px)`,
                        color:
                          num === 0
                            ? '#10b981'
                            : RED_NUMBERS.includes(num)
                            ? '#f43f5e'
                            : '#cbd5e1',
                      }}
                    >
                      {num}
                    </div>
                  );
                })}
                {/* Center Brass Hub */}
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-yellow-600 via-amber-300 to-yellow-600 shadow-md border border-amber-200/50 flex items-center justify-center">
                  <div className="w-4 h-4 rounded-full bg-amber-950" />
                </div>
              </div>
            </div>

            {/* Spinning Ivory Ball */}
            <div
              className="absolute inset-0 flex items-center justify-center transition-transform duration-[3800ms] ease-out pointer-events-none"
              style={{ transform: `rotate(${ballRotation}deg)` }}
            >
              <div className="w-3.5 h-3.5 rounded-full bg-white shadow-[0_0_8px_#ffffff] -translate-y-24 sm:-translate-y-28" />
            </div>

            {/* Winning Number Badge in Center during rest */}
            {winningNumber !== null && !isSpinning && (
              <div className="absolute z-20 flex flex-col items-center justify-center bg-slate-950/90 border-2 border-amber-400 rounded-xl px-4 py-2 animate-bounce">
                <span className="text-[10px] text-gray-400">জয়ী নম্বর</span>
                <span
                  className={`text-2xl font-black font-mono ${
                    winningNumber === 0
                      ? 'text-emerald-400'
                      : RED_NUMBERS.includes(winningNumber)
                      ? 'text-rose-400'
                      : 'text-white'
                  }`}
                >
                  {winningNumber}
                </span>
              </div>
            )}
          </div>

          {/* Outcome Win Toast */}
          {lastWinAmount > 0 && (
            <div className="text-center font-bold text-amber-400 text-sm animate-pulse mt-1">
              জয়: + ৳{lastWinAmount.toLocaleString('en-US')}
            </div>
          )}
        </div>

        {/* Right: Interactive Betting Board */}
        <div className="flex-1 flex flex-col bg-[#0f172a] rounded-2xl p-3 sm:p-4 border border-gray-800">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-semibold text-gray-300">বেটিং বোর্ড</span>
            <div className="flex items-center gap-2">
              <span className="text-gray-400">মোট বেট:</span>
              <span className="font-mono font-bold text-amber-400">৳ {totalBetAmount}</span>
            </div>
          </div>

          {/* Betting Grid */}
          <div className="flex-1 flex flex-col gap-2">
            {/* Number 0 */}
            <button
              onClick={() => addBet('num-0', '০ (জিরো)', 36)}
              disabled={isSpinning}
              className="w-full py-2 bg-emerald-700/60 hover:bg-emerald-600/80 border border-emerald-500/50 rounded-lg text-xs font-mono font-bold text-emerald-200 transition-all flex items-center justify-center gap-2"
            >
              <span>০ (জিরো)</span>
              <span className="text-[10px] text-emerald-300/80">৩৬x গুণক</span>
            </button>

            {/* Numbers 1-36 Compact Grid */}
            <div className="grid grid-cols-6 sm:grid-cols-12 gap-1">
              {Array.from({ length: 36 }, (_, i) => i + 1).map(num => {
                const isRed = RED_NUMBERS.includes(num);
                const currentBet = bets.find(b => b.type === `num-${num}`);
                return (
                  <button
                    key={num}
                    onClick={() => addBet(`num-${num}`, `${num}`, 36)}
                    disabled={isSpinning}
                    className={`h-9 rounded font-mono text-xs font-bold border transition-all flex flex-col items-center justify-center relative ${
                      isRed
                        ? 'bg-rose-950/70 hover:bg-rose-900/90 text-rose-200 border-rose-800/60'
                        : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700'
                    }`}
                  >
                    <span>{num}</span>
                    {currentBet && (
                      <span className="absolute -top-1 -right-1 bg-amber-400 text-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                        ৳
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Dozen Bets */}
            <div className="grid grid-cols-3 gap-1.5 mt-1">
              {[
                { type: 'doz1', label: '১ম ডজন (১-১২)', payout: 3 },
                { type: 'doz2', label: '২য় ডজন (১৩-২৪)', payout: 3 },
                { type: 'doz3', label: '৩য় ডজন (২৫-৩৬)', payout: 3 },
              ].map(item => (
                <button
                  key={item.type}
                  onClick={() => addBet(item.type, item.label, item.payout)}
                  disabled={isSpinning}
                  className="py-2 bg-slate-800/80 hover:bg-slate-700 rounded-lg text-xs font-medium border border-slate-700 text-gray-300"
                >
                  {item.label} (৩x)
                </button>
              ))}
            </div>

            {/* Outside Color & Odd/Even Bets */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              <button
                onClick={() => addBet('red', 'লাল (Red)', 2)}
                disabled={isSpinning}
                className="py-2 bg-rose-700/60 hover:bg-rose-600/80 border border-rose-500 rounded-lg text-xs font-bold text-white"
              >
                লাল (২x)
              </button>
              <button
                onClick={() => addBet('black', 'কালো (Black)', 2)}
                disabled={isSpinning}
                className="py-2 bg-slate-950 hover:bg-slate-900 border border-slate-700 rounded-lg text-xs font-bold text-gray-200"
              >
                কালো (২x)
              </button>
              <button
                onClick={() => addBet('even', 'জোড় (Even)', 2)}
                disabled={isSpinning}
                className="py-2 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-medium text-gray-200"
              >
                জোড় (২x)
              </button>
              <button
                onClick={() => addBet('odd', 'বিজোড় (Odd)', 2)}
                disabled={isSpinning}
                className="py-2 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-medium text-gray-200"
              >
                বিজোড় (২x)
              </button>
            </div>
          </div>

          {/* Chips & Action Controls */}
          <div className="mt-4 pt-3 border-t border-gray-800 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">চিপ বেছে নিন:</span>
              <div className="flex items-center gap-1.5">
                {[10, 50, 100, 500, 1000].map(val => (
                  <button
                    key={val}
                    onClick={() => setSelectedChip(val)}
                    disabled={isSpinning}
                    className={`w-9 h-9 rounded-full font-mono text-[11px] font-bold border-2 transition-all flex items-center justify-center ${
                      selectedChip === val
                        ? 'border-amber-400 bg-amber-500 text-black scale-110 shadow-lg'
                        : 'border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-500'
                    }`}
                  >
                    ৳{val}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-12 gap-2 mt-1">
              <button
                onClick={clearBets}
                disabled={isSpinning || bets.length === 0}
                className="col-span-4 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold text-xs transition-all disabled:opacity-40"
              >
                বেট মুছুন
              </button>
              <button
                onClick={spinRoulette}
                disabled={isSpinning || bets.length === 0}
                className="col-span-8 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-sm shadow-lg shadow-emerald-900/40 active:scale-95 transition-all disabled:opacity-40 flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isSpinning ? 'হুইল ঘুরছে...' : 'স্পিন করুন'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
