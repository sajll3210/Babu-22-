import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft,
  Volume2,
  VolumeX,
  Dices,
  Sparkles,
  Zap,
  RotateCcw,
  Trophy,
  History,
  ShieldCheck,
  Flame,
  Award,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';
import { sound } from '../../utils/audio';

interface DiceGameProps {
  balance: number;
  onUpdateBalance: (amount: number, reason: string) => void;
  onClose: () => void;
  onOpenDeposit?: () => void;
}

export type DiceMode = '3d_craps' | 'hilo_slider';

// Markets for 3D Twin Dice
export type TwinDiceMarket =
  | 'under_7'
  | 'lucky_7'
  | 'over_7'
  | 'even'
  | 'odd'
  | 'any_double'
  | 'snake_eyes'
  | 'double_six';

interface MarketDef {
  id: TwinDiceMarket;
  titleBn: string;
  titleEn: string;
  multiplier: number;
  badge: string;
  desc: string;
  color: string;
}

const TWIN_MARKETS: MarketDef[] = [
  {
    id: 'under_7',
    titleBn: 'আন্ডার ৭ (২-৬)',
    titleEn: 'Under 7',
    multiplier: 2.0,
    badge: '২.০০x',
    desc: 'যোগফল ২, ৩, ৪, ৫ বা ৬',
    color: 'from-blue-600 to-indigo-600 border-blue-400',
  },
  {
    id: 'lucky_7',
    titleBn: 'লাকি ৭ (ঠিক ৭)',
    titleEn: 'Lucky 7',
    multiplier: 5.8,
    badge: '৫.৮০x',
    desc: 'যোগফল ঠিক ৭',
    color: 'from-amber-500 to-yellow-400 border-amber-300 text-slate-950 font-black',
  },
  {
    id: 'over_7',
    titleBn: 'ওভার ৭ (৮-১২)',
    titleEn: 'Over 7',
    multiplier: 2.0,
    badge: '২.০০x',
    desc: 'যোগফল ৮, ৯, ১০, ১১ বা ১২',
    color: 'from-rose-600 to-red-600 border-rose-400',
  },
  {
    id: 'even',
    titleBn: 'জোড় (Even)',
    titleEn: 'Even Sum',
    multiplier: 1.95,
    badge: '১.৯৫x',
    desc: 'যোগফল ৪, ৬, ৮, ১০, ১২',
    color: 'from-emerald-600 to-teal-600 border-emerald-400',
  },
  {
    id: 'odd',
    titleBn: 'বিজোড় (Odd)',
    titleEn: 'Odd Sum',
    multiplier: 1.95,
    badge: '১.৯৫x',
    desc: 'যোগফল ৩, ৫, ৭, ৯, ১১',
    color: 'from-purple-600 to-violet-600 border-purple-400',
  },
  {
    id: 'any_double',
    titleBn: 'যেকোনো ডাবল',
    titleEn: 'Any Double',
    multiplier: 6.0,
    badge: '৬.০০x',
    desc: '১-১, ২-২, ৩-৩, ৪-৪, ৫-৫, ৬-৬',
    color: 'from-cyan-600 to-blue-600 border-cyan-400',
  },
  {
    id: 'snake_eyes',
    titleBn: 'স্নেক আইজ (১ ও ১)',
    titleEn: 'Snake Eyes (1-1)',
    multiplier: 30.0,
    badge: '৩০.০০x',
    desc: 'উভয় ডাইসে ১ ও ১ = ২',
    color: 'from-pink-600 via-rose-600 to-red-600 border-pink-400',
  },
  {
    id: 'double_six',
    titleBn: 'ডাবল সিক্স (৬ ও ৬)',
    titleEn: 'Double Six (6-6)',
    multiplier: 30.0,
    badge: '৩০.০০x',
    desc: 'উভয় ডাইসে ৬ ও ৬ = ১২',
    color: 'from-yellow-500 via-amber-500 to-orange-600 border-yellow-300 text-slate-950 font-black',
  },
];

const PRESET_BETS = [10, 20, 50, 100, 200, 500, 1000, 2500];

export const DiceGame: React.FC<DiceGameProps> = ({
  balance,
  onUpdateBalance,
  onClose,
  onOpenDeposit,
}) => {
  const [mode, setMode] = useState<DiceMode>('3d_craps');
  const [betAmount, setBetAmount] = useState<number>(50);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [autoRollCount, setAutoRollCount] = useState<number>(0);
  const [turboMode, setTurboMode] = useState<boolean>(false);

  // Mode 1: 3D Twin Dice State
  const [die1, setDie1] = useState<number>(3);
  const [die2, setDie2] = useState<number>(4);
  const [selectedMarket, setSelectedMarket] = useState<TwinDiceMarket>('lucky_7');
  const [lastTwinWin, setLastTwinWin] = useState<number | null>(null);

  // Mode 2: Hi-Lo 1-100 Slider State
  const [targetNumber, setTargetNumber] = useState<number>(50);
  const [isRollUnder, setIsRollUnder] = useState<boolean>(true);
  const [lastSliderRoll, setLastSliderRoll] = useState<number | null>(null);
  const [lastSliderWin, setLastSliderWin] = useState<number | null>(null);

  // Roll History Stream
  const [rollHistory, setRollHistory] = useState<
    Array<{ id: string; result: string; mult: number; won: boolean }>
  >([
    { id: '1', result: '৭ (৩+৪)', mult: 5.8, won: true },
    { id: '2', result: '৯ (৫+৪)', mult: 2.0, won: true },
    { id: '3', result: '৫ (২+৩)', mult: 2.0, won: false },
    { id: '4', result: '১২ (৬+৬)', mult: 30.0, won: true },
    { id: '5', result: '৬ (৩+৩)', mult: 6.0, won: true },
  ]);

  const autoRollRef = useRef<NodeJS.Timeout | null>(null);

  const playSound = useCallback(
    (fn: () => void) => {
      if (soundEnabled) fn();
    },
    [soundEnabled]
  );

  // Hi-Lo calculations (98.5% RTP)
  const winChance = isRollUnder ? targetNumber : 100 - targetNumber;
  const sliderMultiplier = +((98.5 / winChance).toFixed(2));

  // Mode 1: Handle Twin 3D Dice Roll
  const handleRollTwinDice = useCallback(() => {
    if (isRolling) return;
    if (balance < betAmount) {
      setAutoRollCount(0);
      playSound(() => sound.playCrash());
      if (onOpenDeposit) onOpenDeposit();
      return;
    }

    onUpdateBalance(-betAmount, 'ডাইস বাজি');
    setIsRolling(true);
    setLastTwinWin(null);
    playSound(() => sound.playClick());

    // Tumble animation interval
    const rollInterval = setInterval(() => {
      setDie1(Math.floor(Math.random() * 6) + 1);
      setDie2(Math.floor(Math.random() * 6) + 1);
      playSound(() => sound.playSpinTick());
    }, turboMode ? 40 : 80);

    const rollDuration = turboMode ? 350 : 800;

    setTimeout(() => {
      clearInterval(rollInterval);
      const final1 = Math.floor(Math.random() * 6) + 1;
      const final2 = Math.floor(Math.random() * 6) + 1;
      const sum = final1 + final2;
      const isDouble = final1 === final2;

      setDie1(final1);
      setDie2(final2);
      setIsRolling(false);

      // Check win condition
      const mDef = TWIN_MARKETS.find(m => m.id === selectedMarket)!;
      let isWin = false;

      if (selectedMarket === 'under_7' && sum < 7) isWin = true;
      else if (selectedMarket === 'lucky_7' && sum === 7) isWin = true;
      else if (selectedMarket === 'over_7' && sum > 7) isWin = true;
      else if (selectedMarket === 'even' && sum % 2 === 0) isWin = true;
      else if (selectedMarket === 'odd' && sum % 2 !== 0) isWin = true;
      else if (selectedMarket === 'any_double' && isDouble) isWin = true;
      else if (selectedMarket === 'snake_eyes' && final1 === 1 && final2 === 1) isWin = true;
      else if (selectedMarket === 'double_six' && final1 === 6 && final2 === 6) isWin = true;

      if (isWin) {
        const winAmt = Math.floor(betAmount * mDef.multiplier);
        setLastTwinWin(winAmt);
        onUpdateBalance(winAmt, `ডাইস জয় (${mDef.multiplier}x)`);

        if (mDef.multiplier >= 10) {
          playSound(() => sound.playJackpot());
        } else {
          playSound(() => sound.playWinChime());
        }

        setRollHistory(prev => [
          {
            id: Math.random().toString(),
            result: `${sum} (${final1}+${final2})`,
            mult: mDef.multiplier,
            won: true,
          },
          ...prev.slice(0, 14),
        ]);
      } else {
        playSound(() => sound.playCrash());
        setRollHistory(prev => [
          {
            id: Math.random().toString(),
            result: `${sum} (${final1}+${final2})`,
            mult: mDef.multiplier,
            won: false,
          },
          ...prev.slice(0, 14),
        ]);
      }

      // Decrement Auto Roll
      if (autoRollCount > 0) {
        autoRollRef.current = setTimeout(() => {
          setAutoRollCount(prev => prev - 1);
        }, turboMode ? 400 : 900);
      }
    }, rollDuration);
  }, [
    autoRollCount,
    balance,
    betAmount,
    onOpenDeposit,
    onUpdateBalance,
    playSound,
    selectedMarket,
    turboMode,
    isRolling,
  ]);

  // Mode 2: Handle Hi-Lo Slider Roll
  const handleRollSlider = useCallback(() => {
    if (isRolling) return;
    if (balance < betAmount) {
      setAutoRollCount(0);
      playSound(() => sound.playCrash());
      if (onOpenDeposit) onOpenDeposit();
      return;
    }

    onUpdateBalance(-betAmount, 'হাই-লো ডাইস বাজি');
    setIsRolling(true);
    setLastSliderWin(null);
    playSound(() => sound.playClick());

    const rollInterval = setInterval(() => {
      setLastSliderRoll(Math.floor(Math.random() * 100) + 1);
      playSound(() => sound.playSpinTick());
    }, turboMode ? 35 : 60);

    const rollDuration = turboMode ? 350 : 700;

    setTimeout(() => {
      clearInterval(rollInterval);
      const final = Math.floor(Math.random() * 100) + 1;
      setLastSliderRoll(final);
      setIsRolling(false);

      const hasWon = isRollUnder ? final < targetNumber : final > targetNumber;
      if (hasWon) {
        const winAmt = Math.floor(betAmount * sliderMultiplier);
        setLastSliderWin(winAmt);
        onUpdateBalance(winAmt, `হাই-লো জয় (${sliderMultiplier}x)`);

        if (sliderMultiplier >= 10) {
          playSound(() => sound.playJackpot());
        } else {
          playSound(() => sound.playWinChime());
        }

        setRollHistory(prev => [
          {
            id: Math.random().toString(),
            result: `${final}`,
            mult: sliderMultiplier,
            won: true,
          },
          ...prev.slice(0, 14),
        ]);
      } else {
        playSound(() => sound.playCrash());
        setRollHistory(prev => [
          {
            id: Math.random().toString(),
            result: `${final}`,
            mult: sliderMultiplier,
            won: false,
          },
          ...prev.slice(0, 14),
        ]);
      }

      if (autoRollCount > 0) {
        autoRollRef.current = setTimeout(() => {
          setAutoRollCount(prev => prev - 1);
        }, turboMode ? 400 : 900);
      }
    }, rollDuration);
  }, [
    autoRollCount,
    balance,
    betAmount,
    isRollUnder,
    isRolling,
    onOpenDeposit,
    onUpdateBalance,
    playSound,
    sliderMultiplier,
    targetNumber,
    turboMode,
  ]);

  // Auto Roll Hook
  useEffect(() => {
    if (autoRollCount > 0 && !isRolling) {
      if (mode === '3d_craps') handleRollTwinDice();
      else handleRollSlider();
    }
  }, [autoRollCount, isRolling, mode, handleRollTwinDice, handleRollSlider]);

  // Dice Dot Renderer Component (1 to 6)
  const renderDiceFace = (num: number) => {
    const dotPatterns: Record<number, number[][]> = {
      1: [[1, 1]],
      2: [
        [0, 0],
        [2, 2],
      ],
      3: [
        [0, 0],
        [1, 1],
        [2, 2],
      ],
      4: [
        [0, 0],
        [0, 2],
        [2, 0],
        [2, 2],
      ],
      5: [
        [0, 0],
        [0, 2],
        [1, 1],
        [2, 0],
        [2, 2],
      ],
      6: [
        [0, 0],
        [0, 2],
        [1, 0],
        [1, 2],
        [2, 0],
        [2, 2],
      ],
    };

    const dots = dotPatterns[num] || dotPatterns[1];

    return (
      <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-red-600 via-rose-500 to-red-700 rounded-2xl border-4 border-yellow-400 p-2.5 shadow-2xl shadow-rose-900/60 grid grid-cols-3 grid-rows-3 gap-1 relative transform transition-transform hover:scale-105">
        {[0, 1, 2].map(r =>
          [0, 1, 2].map(c => {
            const hasDot = dots.some(([dr, dc]) => dr === r && dc === c);
            return (
              <div key={`${r}-${c}`} className="flex items-center justify-center">
                {hasDot && (
                  <span className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-white shadow-inner border border-gray-200" />
                )}
              </div>
            );
          })
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#080c16] text-white select-none font-sans overflow-hidden">
      {/* 1. Header Bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#0e1424] border-b border-gray-800 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              sound.playClick();
              setAutoRollCount(0);
              onClose();
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-gray-300 bg-slate-800/90 hover:bg-slate-700 hover:text-white rounded-lg transition-colors border border-gray-700 active:scale-95"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="font-semibold hidden sm:inline">লবিতে ফিরুন</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xl">🎲</span>
            <div>
              <div className="flex items-center gap-1">
                <span className="font-black text-sm sm:text-base text-amber-400 tracking-wide font-sans">
                  DICE BETTING
                </span>
                <span className="text-[9px] font-black bg-gradient-to-r from-red-600 to-amber-600 text-white px-1.5 py-0.5 rounded">
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

      {/* 2. Mode Selector Bar & Roll History */}
      <div className="px-3 py-1.5 bg-[#0a0e1c] border-b border-gray-800 flex items-center justify-between gap-3 shrink-0">
        {/* Game Mode Tabs: 3D Twin Dice vs Hi-Lo Slider */}
        <div className="flex items-center bg-slate-900 rounded-xl p-0.5 border border-gray-700">
          <button
            onClick={() => {
              sound.playClick();
              setMode('3d_craps');
            }}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              mode === '3d_craps'
                ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white shadow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Dices className="w-3.5 h-3.5" />
            <span>থ্রিডি ডাবল ডাইস</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setMode('hilo_slider');
            }}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              mode === 'hilo_slider'
                ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white shadow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>হাই-লো ১০০ ডাইস</span>
          </button>
        </div>

        {/* Live Roll History Chips */}
        <div className="hidden sm:flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <History className="w-3 h-3 text-gray-400 shrink-0" />
          {rollHistory.map((h, idx) => (
            <span
              key={h.id || idx}
              className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full border tabular-nums shrink-0 ${
                h.won
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/60'
                  : 'bg-slate-900 text-gray-400 border-gray-800'
              }`}
            >
              {h.result}
            </span>
          ))}
        </div>
      </div>

      {/* 3. Main Arena */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
        {/* Left Arena: Active Mode Visual Board */}
        <div className="flex-1 flex flex-col p-3 sm:p-5 items-center justify-center relative overflow-y-auto">
          {mode === '3d_craps' ? (
            /* MODE 1: 3D TWIN DICE ARENA */
            <div className="max-w-xl w-full flex flex-col items-center gap-4">
              {/* Rolling Dice Stage */}
              <div className="w-full bg-gradient-to-b from-[#11182c] via-[#0b101f] to-[#080d1a] border-2 border-amber-500/40 rounded-3xl p-6 sm:p-8 flex flex-col items-center justify-center shadow-2xl relative">
                <div className="absolute top-3 left-4 flex items-center gap-1 text-[11px] text-amber-400 font-bold uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>রোল যোগফল:</span>
                </div>

                <div className="absolute top-3 right-4 font-mono font-black text-2xl text-amber-400 tabular-nums">
                  {die1 + die2}
                </div>

                {/* The Two 3D Animated Dice */}
                <div
                  className={`flex items-center gap-5 sm:gap-8 my-4 transition-transform ${
                    isRolling ? 'animate-bounce' : 'scale-100'
                  }`}
                >
                  <div className={isRolling ? 'animate-spin' : ''}>{renderDiceFace(die1)}</div>
                  <div className="text-3xl font-black text-gray-500">+</div>
                  <div className={isRolling ? 'animate-spin' : ''}>{renderDiceFace(die2)}</div>
                </div>

                {/* Win Alert Badge */}
                {lastTwinWin !== null && (
                  <div className="mt-2 px-4 py-1.5 rounded-full bg-emerald-950 border border-emerald-500/60 text-emerald-300 font-black text-sm flex items-center gap-2 animate-bounce shadow-lg">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <span>অভিনন্দন! জয়: +৳{lastTwinWin.toLocaleString()}</span>
                  </div>
                )}
              </div>

              {/* Betting Table Markets (Under 7, Lucky 7, Over 7, Even, Odd, Snake Eyes, etc.) */}
              <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-2">
                {TWIN_MARKETS.map(m => {
                  const isSelected = selectedMarket === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => {
                        sound.playClick();
                        setSelectedMarket(m.id);
                      }}
                      className={`p-2.5 rounded-2xl border-2 text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                        isSelected
                          ? `bg-gradient-to-br ${m.color} shadow-lg scale-102 ring-2 ring-white/50`
                          : 'bg-slate-900/90 border-gray-800 text-gray-300 hover:border-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs">{m.titleBn}</span>
                        <span className="text-[10px] font-mono font-black px-1.5 py-0.5 rounded bg-black/40 text-amber-300">
                          {m.badge}
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-300/80 mt-1">{m.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* MODE 2: HI-LO SLIDER (1 - 100) */
            <div className="max-w-lg w-full bg-gradient-to-b from-[#11182c] to-[#080d1a] border-2 border-gray-800 rounded-3xl p-6 shadow-2xl flex flex-col items-center">
              <span className="text-xs text-gray-400 mb-1">রোল ফলাফল (১ - ১০০)</span>
              <div
                className={`text-7xl font-black font-mono tracking-tight my-3 ${
                  lastSliderWin !== null ? 'text-emerald-400 scale-105' : 'text-white'
                }`}
              >
                {lastSliderRoll !== null ? lastSliderRoll : '--'}
              </div>

              {lastSliderWin !== null && (
                <div className="mb-3 text-xs font-bold text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-500/40 animate-bounce">
                  জয়: +৳{lastSliderWin.toLocaleString()}
                </div>
              )}

              {/* Slider & Stats */}
              <div className="w-full space-y-3 my-2">
                <div className="flex items-center justify-between text-xs text-gray-300">
                  <span>
                    টার্গেট:{' '}
                    <strong className="text-white font-mono text-sm">{targetNumber}</strong>
                  </span>
                  <span>
                    জয়ের সুযোগ:{' '}
                    <strong className="text-amber-400 font-mono text-sm">{winChance}%</strong>
                  </span>
                  <span>
                    মাল্টিপ্লায়ার:{' '}
                    <strong className="text-emerald-400 font-mono text-sm">
                      {sliderMultiplier}x
                    </strong>
                  </span>
                </div>

                <input
                  type="range"
                  min="2"
                  max="98"
                  value={targetNumber}
                  onChange={e => setTargetNumber(parseInt(e.target.value))}
                  disabled={isRolling}
                  className="w-full accent-amber-500 cursor-pointer h-2.5 bg-slate-800 rounded-lg"
                />

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    onClick={() => setIsRollUnder(true)}
                    className={`py-2 rounded-xl border text-xs font-bold transition-all ${
                      isRollUnder
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : 'bg-slate-900 border-slate-800 text-gray-400'
                    }`}
                  >
                    রোল নিচে (&lt; {targetNumber})
                  </button>
                  <button
                    onClick={() => setIsRollUnder(false)}
                    className={`py-2 rounded-xl border text-xs font-bold transition-all ${
                      !isRollUnder
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : 'bg-slate-900 border-slate-800 text-gray-400'
                    }`}
                  >
                    রোল উপরে (&gt; {targetNumber})
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Cockpit: Betting Controls */}
        <div className="w-full md:w-80 bg-[#0a0e1c] border-t md:border-t-0 md:border-l border-gray-800/90 p-3.5 flex flex-col justify-between shrink-0">
          <div className="space-y-3.5">
            {/* Bet Amount Input */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-gray-300 mb-1">
                <span>বাজির পরিমাণ</span>
                <span className="text-amber-400 font-mono font-bold">৳{betAmount}</span>
              </div>
              <div className="flex items-center bg-slate-950 rounded-xl border border-gray-700 px-2 py-1.5 shadow-inner">
                <button
                  onClick={() => {
                    sound.playClick();
                    setBetAmount(prev => Math.max(10, prev - 10));
                  }}
                  className="w-8 h-8 rounded-lg bg-slate-800 text-white font-bold flex items-center justify-center text-sm active:scale-95 transition-all"
                >
                  -
                </button>
                <div className="flex-1 text-center font-mono font-black text-sm sm:text-base text-amber-400">
                  <span className="text-gray-400 text-xs mr-1">৳</span>
                  <input
                    type="number"
                    value={betAmount}
                    onChange={e => setBetAmount(Math.max(10, parseInt(e.target.value) || 10))}
                    className="w-20 bg-transparent text-center font-mono font-bold text-white focus:outline-none"
                  />
                </div>
                <button
                  onClick={() => {
                    sound.playClick();
                    setBetAmount(prev => prev + 10);
                  }}
                  className="w-8 h-8 rounded-lg bg-slate-800 text-white font-bold flex items-center justify-center text-sm active:scale-95 transition-all"
                >
                  +
                </button>
              </div>

              {/* Quick Preset Chips */}
              <div className="grid grid-cols-4 gap-1 mt-1.5">
                {PRESET_BETS.slice(0, 4).map(val => (
                  <button
                    key={val}
                    onClick={() => {
                      sound.playClick();
                      setBetAmount(val);
                    }}
                    className={`text-[10px] font-mono py-1 rounded-lg border transition-all ${
                      betAmount === val
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold'
                        : 'bg-slate-900 border-gray-800 text-gray-400 hover:text-white'
                    }`}
                  >
                    ৳{val}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Half / Double Chips */}
            <div className="grid grid-cols-3 gap-1.5 text-xs font-mono font-bold">
              <button
                onClick={() => {
                  sound.playClick();
                  setBetAmount(prev => Math.max(10, Math.floor(prev / 2)));
                }}
                className="py-1.5 rounded-lg bg-slate-900 border border-gray-800 text-gray-300 hover:text-white"
              >
                ½ HALF
              </button>
              <button
                onClick={() => {
                  sound.playClick();
                  setBetAmount(prev => prev * 2);
                }}
                className="py-1.5 rounded-lg bg-slate-900 border border-gray-800 text-gray-300 hover:text-white"
              >
                2X DOUBLE
              </button>
              <button
                onClick={() => {
                  sound.playClick();
                  setBetAmount(Math.min(5000, balance > 10 ? balance : 1000));
                }}
                className="py-1.5 rounded-lg bg-slate-900 border border-gray-800 text-amber-400 hover:text-amber-300"
              >
                MAX
              </button>
            </div>

            {/* Mode & Payout Summary Card */}
            <div className="p-2.5 rounded-xl bg-slate-950 border border-gray-800 text-xs space-y-1">
              <div className="flex items-center justify-between text-gray-400">
                <span>সম্ভাব্য গুণক:</span>
                <span className="font-mono font-black text-emerald-400">
                  {mode === '3d_craps'
                    ? `${TWIN_MARKETS.find(m => m.id === selectedMarket)?.multiplier}x`
                    : `${sliderMultiplier}x`}
                </span>
              </div>
              <div className="flex items-center justify-between text-gray-400">
                <span>সম্ভাব্য রিটার্ন:</span>
                <span className="font-mono font-black text-amber-400">
                  ৳
                  {mode === '3d_craps'
                    ? Math.floor(
                        betAmount * (TWIN_MARKETS.find(m => m.id === selectedMarket)?.multiplier || 1)
                      ).toLocaleString()
                    : Math.floor(betAmount * sliderMultiplier).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons: Roll, Turbo, Auto Roll */}
          <div className="space-y-2 mt-4">
            <button
              onClick={mode === '3d_craps' ? handleRollTwinDice : handleRollSlider}
              disabled={isRolling}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
            >
              <Dices className={`w-5 h-5 ${isRolling ? 'animate-spin' : ''}`} />
              <span>{isRolling ? 'ডাইস রোল হচ্ছে...' : `রোল করুন (৳${betAmount})`}</span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  sound.playClick();
                  setTurboMode(!turboMode);
                }}
                className={`py-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1 ${
                  turboMode
                    ? 'bg-rose-950/60 border-rose-500 text-rose-400'
                    : 'bg-slate-900 border-gray-800 text-gray-400'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>টার্বো {turboMode ? 'অন' : 'অফ'}</span>
              </button>

              <button
                onClick={() => {
                  sound.playClick();
                  if (autoRollCount > 0) setAutoRollCount(0);
                  else setAutoRollCount(20);
                }}
                className={`py-2 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                  autoRollCount > 0
                    ? 'bg-amber-950/80 border-amber-500 text-amber-300'
                    : 'bg-slate-900 border-gray-800 text-gray-400'
                }`}
              >
                <RotateCcw className={`w-3.5 h-3.5 ${autoRollCount > 0 ? 'animate-spin' : ''}`} />
                <span>{autoRollCount > 0 ? `অটো (${autoRollCount})` : 'অটো রোল'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
