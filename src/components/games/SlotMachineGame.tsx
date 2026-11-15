import React, { useState, useEffect } from 'react';
import { ArrowLeft, Volume2, VolumeX, Sparkles, RefreshCw, Zap, Trophy, HelpCircle } from 'lucide-react';
import { sound } from '../../utils/audio';

interface SlotMachineGameProps {
  balance: number;
  onUpdateBalance: (amount: number, reason: string) => void;
  onClose: () => void;
  onOpenDeposit?: () => void;
}

interface SymbolItem {
  id: string;
  name: string;
  icon: string;
  payout3: number; // 3 in line multiplier
  color: string;
}

const SYMBOLS: SymbolItem[] = [
  { id: 'seven', name: 'লাকি ৭', icon: '7️⃣', payout3: 50, color: 'text-rose-500' },
  { id: 'diamond', name: 'ডায়মন্ড', icon: '💎', payout3: 25, color: 'text-cyan-400' },
  { id: 'bar', name: 'গোল্ড বার', icon: '🥇', payout3: 15, color: 'text-amber-400' },
  { id: 'bell', name: 'গোল্ডেন বেল', icon: '🔔', payout3: 10, color: 'text-yellow-400' },
  { id: 'clover', name: 'লাকি ক্লোভার', icon: '🍀', payout3: 8, color: 'text-emerald-400' },
  { id: 'cherry', name: 'চেরি ফল', icon: '🍒', payout3: 5, color: 'text-red-400' },
];

export const SlotMachineGame: React.FC<SlotMachineGameProps> = ({
  balance,
  onUpdateBalance,
  onClose,
  onOpenDeposit,
}) => {
  const [betAmount, setBetAmount] = useState<number>(20);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [reels, setReels] = useState<SymbolItem[][]>([
    [SYMBOLS[0], SYMBOLS[1], SYMBOLS[2]],
    [SYMBOLS[0], SYMBOLS[0], SYMBOLS[0]],
    [SYMBOLS[2], SYMBOLS[3], SYMBOLS[4]],
  ]);
  const [winningLines, setWinningLines] = useState<number[]>([]);
  const [lastWin, setLastWin] = useState<number>(0);
  const [isBigWin, setIsBigWin] = useState<boolean>(false);
  const [isTurbo, setIsTurbo] = useState<boolean>(false);
  const [autoSpinCount, setAutoSpinCount] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [showPaytable, setShowPaytable] = useState<boolean>(false);

  // Auto-spin watcher
  useEffect(() => {
    if (autoSpinCount > 0 && !isSpinning) {
      const timer = setTimeout(() => {
        spinReels();
        setAutoSpinCount(c => c - 1);
      }, isTurbo ? 400 : 1200);
      return () => clearTimeout(timer);
    }
  }, [autoSpinCount, isSpinning]);

  const spinReels = () => {
    if (isSpinning) return;
    if (balance < betAmount) {
      setAutoSpinCount(0);
      if (onOpenDeposit) {
        onOpenDeposit();
      }
      return;
    }

    onUpdateBalance(-betAmount, 'স্লট মেশিন স্পিন');
    setIsSpinning(true);
    setWinningLines([]);
    setLastWin(0);
    setIsBigWin(false);
    if (soundEnabled) sound.playClick();

    // Sound ticks during spin
    const tickInterval = setInterval(() => {
      if (soundEnabled) sound.playSpinTick();
    }, 100);

    const spinDuration = isTurbo ? 600 : 1400;

    setTimeout(() => {
      clearInterval(tickInterval);

      // Generate random 3x3 reel outcome
      const newReels: SymbolItem[][] = [
        [
          SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
          SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
          SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        ],
        [
          SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
          SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
          SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        ],
        [
          SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
          SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
          SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        ],
      ];

      // Check winning horizontal rows:
      const hits: number[] = [];
      let totalMultiplier = 0;

      for (let row = 0; row < 3; row++) {
        if (
          newReels[0][row].id === newReels[1][row].id &&
          newReels[1][row].id === newReels[2][row].id
        ) {
          hits.push(row);
          totalMultiplier += newReels[0][row].payout3;
        }
      }

      // Check diagonals
      if (
        newReels[0][0].id === newReels[1][1].id &&
        newReels[1][1].id === newReels[2][2].id
      ) {
        hits.push(3);
        totalMultiplier += newReels[0][0].payout3;
      }
      if (
        newReels[0][2].id === newReels[1][1].id &&
        newReels[1][1].id === newReels[2][0].id
      ) {
        hits.push(4);
        totalMultiplier += newReels[0][2].payout3;
      }

      setReels(newReels);
      setWinningLines(hits);
      setIsSpinning(false);

      if (totalMultiplier > 0) {
        const winAmount = betAmount * totalMultiplier;
        setLastWin(winAmount);
        onUpdateBalance(winAmount, `স্লট জয় (${totalMultiplier}x)`);
        if (totalMultiplier >= 20) {
          setIsBigWin(true);
          if (soundEnabled) sound.playJackpot();
        } else {
          if (soundEnabled) sound.playWinChime();
        }
      }
    }, spinDuration);
  };

  return (
    <div className="flex flex-col h-full bg-[#0d111d] text-white select-none relative overflow-y-auto">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#161c2e] border-b border-gray-800 shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-gray-300 bg-gray-800 hover:bg-gray-700 rounded transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>লবিতে ফিরুন</span>
          </button>
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-sm tracking-wider text-amber-400">GOLDEN 777</span>
            <span className="text-[10px] text-gray-400 bg-gray-800/80 px-1.5 py-0.5 rounded">Pragmatic</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[10px] text-gray-400">ব্যালেন্স</div>
            <div className="text-xs font-bold text-amber-400 font-mono tabular-nums">
              ৳ {balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <button
            onClick={() => setShowPaytable(!showPaytable)}
            className="p-1.5 text-gray-400 hover:text-white bg-gray-800 rounded transition-colors"
            title="পে-টেবিল"
          >
            <HelpCircle className="w-4 h-4 text-cyan-400" />
          </button>
          <button
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              sound.enabled = !soundEnabled;
            }}
            className="p-1.5 text-gray-400 hover:text-white bg-gray-800 rounded transition-colors"
            title="সাউন্ড"
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-gray-500" />
            )}
          </button>
        </div>
      </div>

      {/* Main Slot Cabinet */}
      <div className="flex-1 flex flex-col items-center justify-center p-3 sm:p-6 max-w-2xl mx-auto w-full">
        {/* Slot Machine Frame */}
        <div className="relative w-full max-w-lg bg-gradient-to-b from-amber-700/30 via-slate-900 to-slate-950 p-3 sm:p-5 rounded-3xl border-2 border-amber-500/40 shadow-2xl shadow-amber-950/40">
          {/* Header Marquee */}
          <div className="text-center pb-3 border-b border-amber-500/20 mb-3 flex items-center justify-between">
            <div className="text-[11px] text-amber-300/80 font-medium">৫ পে-লাইন স্লট</div>
            <div className="text-xs sm:text-sm font-black tracking-widest text-amber-400 flex items-center gap-1">
              <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
              GOLDEN JACKPOT
              <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
            </div>
            <div className="text-[11px] text-emerald-400 font-medium">RTP 96.8%</div>
          </div>

          {/* Reels Display Box (3 Columns x 3 Rows) */}
          <div className="bg-[#070a13] rounded-2xl p-3 border border-amber-500/30 grid grid-cols-3 gap-2 relative shadow-inner overflow-hidden">
            {/* Winning celebration highlight lines */}
            {winningLines.includes(1) && (
              <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-amber-400 shadow-[0_0_12px_#f59e0b] z-20 pointer-events-none" />
            )}
            {winningLines.includes(0) && (
              <div className="absolute left-0 right-0 top-[20%] h-1 bg-amber-400 shadow-[0_0_12px_#f59e0b] z-20 pointer-events-none" />
            )}
            {winningLines.includes(2) && (
              <div className="absolute left-0 right-0 bottom-[20%] h-1 bg-amber-400 shadow-[0_0_12px_#f59e0b] z-20 pointer-events-none" />
            )}

            {/* Reel Columns */}
            {[0, 1, 2].map(colIdx => (
              <div
                key={colIdx}
                className="flex flex-col gap-2 bg-[#0d1322] rounded-xl p-1.5 border border-slate-800 overflow-hidden"
              >
                {[0, 1, 2].map(rowIdx => {
                  const symbol = reels[colIdx][rowIdx];
                  return (
                    <div
                      key={rowIdx}
                      className={`h-16 sm:h-20 rounded-lg flex flex-col items-center justify-center transition-transform ${
                        isSpinning
                          ? 'animate-pulse scale-90 opacity-60 blur-[1px]'
                          : 'scale-100 opacity-100'
                      } bg-[#131b2e] border border-slate-700/50 shadow-sm`}
                    >
                      <span className="text-3xl sm:text-4xl">{symbol.icon}</span>
                      <span className={`text-[10px] font-bold mt-0.5 ${symbol.color}`}>
                        {symbol.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Last Win Ticker */}
          <div className="mt-3 py-2 px-4 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
            <span className="text-xs text-gray-400">সর্বশেষ জয়:</span>
            <span
              className={`font-mono font-bold text-sm sm:text-base ${
                lastWin > 0 ? 'text-amber-400 animate-bounce' : 'text-gray-400'
              }`}
            >
              {lastWin > 0 ? `+ ৳${lastWin.toLocaleString('en-US')}` : '৳ ০.০০'}
            </span>
          </div>

          {/* Controls Panel */}
          <div className="mt-4 flex flex-col gap-3">
            {/* Bet Selector */}
            <div className="flex items-center justify-between bg-slate-950 p-2 rounded-xl border border-slate-800">
              <span className="text-xs text-gray-300 font-medium pl-1">বেটের পরিমাণ:</span>
              <div className="flex items-center gap-1.5">
                {[10, 20, 50, 100, 200].map(amt => (
                  <button
                    key={amt}
                    onClick={() => setBetAmount(amt)}
                    disabled={isSpinning}
                    className={`px-2.5 py-1 text-xs rounded-lg font-mono font-bold transition-all ${
                      betAmount === amt
                        ? 'bg-amber-500 text-black shadow-md shadow-amber-500/30'
                        : 'bg-slate-800 text-gray-300 hover:bg-slate-700'
                    }`}
                  >
                    ৳{amt}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons Row */}
            <div className="grid grid-cols-12 gap-2">
              {/* Turbo Mode Toggle */}
              <button
                onClick={() => setIsTurbo(!isTurbo)}
                className={`col-span-3 py-3 rounded-xl flex flex-col items-center justify-center text-xs font-semibold border transition-all ${
                  isTurbo
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                    : 'bg-slate-800/80 border-slate-700 text-gray-400 hover:text-gray-200'
                }`}
              >
                <Zap className={`w-4 h-4 mb-0.5 ${isTurbo ? 'text-amber-400 fill-amber-400' : ''}`} />
                <span>টার্বো</span>
              </button>

              {/* Auto Spin Toggle */}
              <button
                onClick={() => {
                  if (autoSpinCount > 0) {
                    setAutoSpinCount(0);
                  } else {
                    setAutoSpinCount(10);
                  }
                }}
                className={`col-span-3 py-3 rounded-xl flex flex-col items-center justify-center text-xs font-semibold border transition-all ${
                  autoSpinCount > 0
                    ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                    : 'bg-slate-800/80 border-slate-700 text-gray-400 hover:text-gray-200'
                }`}
              >
                <RefreshCw
                  className={`w-4 h-4 mb-0.5 ${autoSpinCount > 0 ? 'animate-spin text-rose-400' : ''}`}
                />
                <span>{autoSpinCount > 0 ? `অটো (${autoSpinCount})` : 'অটো'}</span>
              </button>

              {/* Main Spin Button */}
              <button
                onClick={spinReels}
                disabled={isSpinning}
                className="col-span-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 active:scale-95 text-slate-950 font-black text-base shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                <Sparkles className="w-5 h-5 text-slate-950" />
                <span>{isSpinning ? 'স্পিন হচ্ছে...' : 'স্পিন করুন'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Paytable Modal */}
      {showPaytable && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111726] border border-amber-500/30 rounded-2xl max-w-md w-full p-4 text-white">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <h3 className="font-bold text-sm text-amber-400 flex items-center gap-2">
                <Trophy className="w-4 h-4" /> পে-টেবিল ও গুণক
              </h3>
              <button
                onClick={() => setShowPaytable(false)}
                className="text-gray-400 hover:text-white text-xs px-2 py-1 bg-gray-800 rounded"
              >
                বন্ধ
              </button>
            </div>
            <div className="py-3 space-y-2 text-xs">
              {SYMBOLS.map(sym => (
                <div key={sym.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-800/40">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{sym.icon}</span>
                    <span className="font-medium text-gray-200">{sym.name} (৩টি এক লাইনে)</span>
                  </div>
                  <span className="font-mono font-bold text-amber-400 text-sm">{sym.payout3}x গুণক</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Big Win Celebration Overlay */}
      {isBigWin && (
        <div
          onClick={() => setIsBigWin(false)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center cursor-pointer p-4"
        >
          <div className="text-center animate-bounce">
            <div className="text-xl font-bold text-amber-300 uppercase tracking-widest">
              জ্যাকপট জয়! BIG WIN!
            </div>
            <div className="text-5xl sm:text-6xl font-black text-amber-400 font-mono mt-2 drop-shadow-[0_0_30px_#f59e0b]">
              ৳ {lastWin.toLocaleString('en-US')}
            </div>
            <div className="text-xs text-gray-400 mt-4">স্ক্রিনে চাপুন বন্ধ করতে</div>
          </div>
        </div>
      )}
    </div>
  );
};
