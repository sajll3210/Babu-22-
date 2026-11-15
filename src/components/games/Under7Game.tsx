import React, { useState } from 'react';
import { ArrowLeft, Volume2, VolumeX, Sparkles, Plus, RotateCcw, Trophy, HelpCircle, AlertCircle } from 'lucide-react';
import { GameItem } from '../../types';
import { sound } from '../../utils/audio';

interface Under7GameProps {
  game: GameItem;
  balance: number;
  onUpdateBalance: (amount: number, reason: string) => void;
  onClose: () => void;
  onOpenDeposit?: () => void;
}

type BetZone = 'under7' | 'lucky7' | 'over7' | 'even' | 'odd' | 'pair';

interface BetState {
  under7: number;
  lucky7: number;
  over7: number;
  even: number;
  odd: number;
  pair: number;
}

interface RollHistoryItem {
  id: string;
  die1: number;
  die2: number;
  sum: number;
  zone: 'under7' | 'lucky7' | 'over7';
  isPair: boolean;
  isEven: boolean;
  time: string;
}

const CHIP_VALUES = [10, 20, 50, 100, 500, 1000, 5000];

const INITIAL_BETS: BetState = {
  under7: 0,
  lucky7: 0,
  over7: 0,
  even: 0,
  odd: 0,
  pair: 0,
};

// SVG Dice pip layout helper
const renderDiceDots = (val: number, isGold = false) => {
  const dotColor = isGold
    ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]'
    : 'bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.8)]';

  switch (val) {
    case 1:
      return (
        <div className="w-full h-full flex items-center justify-center">
          <span className={`w-5 h-5 rounded-full ${dotColor}`} />
        </div>
      );
    case 2:
      return (
        <div className="w-full h-full p-2 flex justify-between">
          <span className={`w-3.5 h-3.5 rounded-full ${dotColor} self-start`} />
          <span className={`w-3.5 h-3.5 rounded-full ${dotColor} self-end`} />
        </div>
      );
    case 3:
      return (
        <div className="w-full h-full p-2 flex justify-between">
          <span className={`w-3.5 h-3.5 rounded-full ${dotColor} self-start`} />
          <span className={`w-3.5 h-3.5 rounded-full ${dotColor} self-center`} />
          <span className={`w-3.5 h-3.5 rounded-full ${dotColor} self-end`} />
        </div>
      );
    case 4:
      return (
        <div className="w-full h-full p-2 grid grid-cols-2 gap-2 place-content-between">
          <span className={`w-3.5 h-3.5 rounded-full ${dotColor}`} />
          <span className={`w-3.5 h-3.5 rounded-full ${dotColor} justify-self-end`} />
          <span className={`w-3.5 h-3.5 rounded-full ${dotColor}`} />
          <span className={`w-3.5 h-3.5 rounded-full ${dotColor} justify-self-end`} />
        </div>
      );
    case 5:
      return (
        <div className="w-full h-full p-2 relative">
          <span className={`w-3 h-3 rounded-full ${dotColor} absolute top-2 left-2`} />
          <span className={`w-3 h-3 rounded-full ${dotColor} absolute top-2 right-2`} />
          <span
            className={`w-3 h-3 rounded-full ${dotColor} absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2`}
          />
          <span className={`w-3 h-3 rounded-full ${dotColor} absolute bottom-2 left-2`} />
          <span className={`w-3 h-3 rounded-full ${dotColor} absolute bottom-2 right-2`} />
        </div>
      );
    case 6:
      return (
        <div className="w-full h-full p-2 grid grid-cols-2 gap-2 place-content-between">
          <span className={`w-3.5 h-3.5 rounded-full ${dotColor}`} />
          <span className={`w-3.5 h-3.5 rounded-full ${dotColor} justify-self-end`} />
          <span className={`w-3.5 h-3.5 rounded-full ${dotColor}`} />
          <span className={`w-3.5 h-3.5 rounded-full ${dotColor} justify-self-end`} />
          <span className={`w-3.5 h-3.5 rounded-full ${dotColor}`} />
          <span className={`w-3.5 h-3.5 rounded-full ${dotColor} justify-self-end`} />
        </div>
      );
    default:
      return null;
  }
};

export const Under7Game: React.FC<Under7GameProps> = ({
  balance,
  onUpdateBalance,
  onClose,
  onOpenDeposit,
}) => {
  const [selectedChip, setSelectedChip] = useState<number>(50);
  const [bets, setBets] = useState<BetState>(INITIAL_BETS);
  const [previousBets, setPreviousBets] = useState<BetState>(INITIAL_BETS);
  const [die1, setDie1] = useState<number>(3);
  const [die2, setDie2] = useState<number>(4);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [lastWinAmount, setLastWinAmount] = useState<number | null>(null);
  const [roundMessage, setRoundMessage] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [lowBalanceAlert, setLowBalanceAlert] = useState<boolean>(false);
  const [showRules, setShowRules] = useState<boolean>(false);

  // History of recent rolls
  const [history, setHistory] = useState<RollHistoryItem[]>([
    { id: 'h1', die1: 2, die2: 3, sum: 5, zone: 'under7', isPair: false, isEven: false, time: 'এখন' },
    { id: 'h2', die1: 4, die2: 3, sum: 7, zone: 'lucky7', isPair: false, isEven: false, time: '১ মিনিট আগে' },
    { id: 'h3', die1: 5, die2: 5, sum: 10, zone: 'over7', isPair: true, isEven: true, time: '২ মিনিট আগে' },
    { id: 'h4', die1: 1, die2: 4, sum: 5, zone: 'under7', isPair: false, isEven: false, time: '৩ মিনিট আগে' },
    { id: 'h5', die1: 6, die2: 3, sum: 9, zone: 'over7', isPair: false, isEven: false, time: '৪ মিনিট আগে' },
  ]);

  const totalBet = Object.values(bets).reduce((a, b) => a + b, 0);

  // Place bet on a zone
  const handlePlaceBet = (zone: BetZone) => {
    if (isRolling) return;
    if (balance < selectedChip) {
      setLowBalanceAlert(true);
      if (soundEnabled) sound.playCrash();
      return;
    }
    setLowBalanceAlert(false);
    onUpdateBalance(-selectedChip, `৭ আপ ডাউন বেট (${zone})`);
    if (soundEnabled) sound.playClick();
    setBets(prev => ({
      ...prev,
      [zone]: prev[zone] + selectedChip,
    }));
  };

  // Clear bets and refund
  const handleClearBets = () => {
    if (isRolling || totalBet === 0) return;
    onUpdateBalance(totalBet, 'বেট বাতিল ও রিফান্ড');
    setBets(INITIAL_BETS);
    if (soundEnabled) sound.playClick();
  };

  // Double current bets
  const handleDoubleBets = () => {
    if (isRolling || totalBet === 0) return;
    if (balance < totalBet) {
      setLowBalanceAlert(true);
      return;
    }
    setLowBalanceAlert(false);
    onUpdateBalance(-totalBet, 'ডাবল বেট');
    if (soundEnabled) sound.playClick();
    setBets(prev => ({
      under7: prev.under7 * 2,
      lucky7: prev.lucky7 * 2,
      over7: prev.over7 * 2,
      even: prev.even * 2,
      odd: prev.odd * 2,
      pair: prev.pair * 2,
    }));
  };

  // Rebet previous round
  const handleRebet = () => {
    if (isRolling) return;
    const prevTotal = Object.values(previousBets).reduce((a, b) => a + b, 0);
    if (prevTotal === 0) return;
    if (balance < prevTotal) {
      setLowBalanceAlert(true);
      return;
    }
    setLowBalanceAlert(false);
    onUpdateBalance(-prevTotal, 'পুনরায় বেট স্থাপন');
    if (soundEnabled) sound.playClick();
    setBets(previousBets);
  };

  // Execute Dice Roll
  const handleRoll = () => {
    if (isRolling) return;
    if (totalBet === 0) {
      setRoundMessage('প্রথমে যেকোনো অপশনে বেট ধরুন!');
      return;
    }

    setIsRolling(true);
    setPreviousBets(bets);
    setRoundMessage(null);
    setLastWinAmount(null);
    setLowBalanceAlert(false);

    // Roll animation ticker
    const interval = setInterval(() => {
      setDie1(Math.floor(Math.random() * 6) + 1);
      setDie2(Math.floor(Math.random() * 6) + 1);
      if (soundEnabled) sound.playSpinTick();
    }, 80);

    setTimeout(() => {
      clearInterval(interval);
      const finalDie1 = Math.floor(Math.random() * 6) + 1;
      const finalDie2 = Math.floor(Math.random() * 6) + 1;
      const sum = finalDie1 + finalDie2;
      const isPair = finalDie1 === finalDie2;
      const isEven = sum % 2 === 0;
      setDie1(finalDie1);
      setDie2(finalDie2);
      setIsRolling(false);

      const zone: 'under7' | 'lucky7' | 'over7' = sum < 7 ? 'under7' : sum === 7 ? 'lucky7' : 'over7';

      // Payout Calculation
      let winnings = 0;
      if (sum < 7 && bets.under7 > 0) winnings += bets.under7 * 2.0;
      if (sum === 7 && bets.lucky7 > 0) winnings += bets.lucky7 * 5.0;
      if (sum > 7 && bets.over7 > 0) winnings += bets.over7 * 2.0;
      if (isEven && bets.even > 0) winnings += Math.floor(bets.even * 1.95);
      if (!isEven && bets.odd > 0) winnings += Math.floor(bets.odd * 1.95);
      if (isPair && bets.pair > 0) winnings += bets.pair * 6.0;

      // Add to history
      const newHistoryItem: RollHistoryItem = {
        id: `roll-${Date.now()}`,
        die1: finalDie1,
        die2: finalDie2,
        sum,
        zone,
        isPair,
        isEven,
        time: 'এখনই',
      };
      setHistory(prev => [newHistoryItem, ...prev.slice(0, 11)]);

      if (winnings > 0) {
        setLastWinAmount(winnings);
        onUpdateBalance(winnings, `৭ আপ ডাউন জয় (ফলাফল: ${sum})`);
        if (sum === 7) {
          sound.playJackpot();
          setRoundMessage(`🎉 লাকি ৭ (LUCKY 7)! জিতেছেন ৳${winnings.toLocaleString('en-US')}`);
        } else {
          sound.playWinChime();
          setRoundMessage(`🎉 শুভ জয় [${sum}]! জিতেছেন ৳${winnings.toLocaleString('en-US')}`);
        }
      } else {
        if (soundEnabled) sound.playCrash();
        const outcomeBn = sum < 7 ? '৭ এর নিচে (ডাউন)' : sum === 7 ? 'লাকি ৭' : '৭ এর উপরে (আপ)';
        setRoundMessage(`ফলাফল [${sum}] (${outcomeBn}) - আপনার কোনো বেট মেলেনি!`);
      }

      // Reset active round bets
      setBets(INITIAL_BETS);
    }, 1800);
  };

  // Stats calculation
  const totalHistory = history.length;
  const underCount = history.filter(h => h.zone === 'under7').length;
  const luckyCount = history.filter(h => h.zone === 'lucky7').length;
  const overCount = history.filter(h => h.zone === 'over7').length;
  const underPct = totalHistory ? Math.round((underCount / totalHistory) * 100) : 40;
  const luckyPct = totalHistory ? Math.round((luckyCount / totalHistory) * 100) : 20;
  const overPct = totalHistory ? Math.round((overCount / totalHistory) * 100) : 40;

  return (
    <div className="flex flex-col h-full bg-[#070b14] text-white select-none overflow-y-auto">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-3 sm:px-6 py-2.5 bg-[#0f172a] border-b border-gray-800 shrink-0 sticky top-0 z-30 shadow-md">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-300 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors active:scale-95 border border-slate-700"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">লবিতে ফিরুন</span>
            <span className="sm:hidden">লবি</span>
          </button>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-sm sm:text-base text-amber-400 tracking-wide">
                আন্ডার ৭ ওভার ৭
              </span>
              <span className="text-[10px] font-bold text-amber-300 bg-amber-500/20 border border-amber-500/40 px-1.5 py-0.5 rounded-full">
                7 UP DOWN
              </span>
            </div>
            <div className="text-[10px] text-gray-400 flex items-center gap-1">
              <span>Babu22 ডাইস লাউঞ্জ</span>
              <span>•</span>
              <span className="text-emerald-400">RTP 98.5%</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Rules Modal Trigger */}
          <button
            onClick={() => setShowRules(true)}
            className="p-1.5 text-gray-400 hover:text-amber-400 rounded-lg hover:bg-slate-800 transition-colors"
            title="নিয়মাবলী"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            title={soundEnabled ? 'সাউন্ড বন্ধ করুন' : 'সাউন্ড চালু করুন'}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-gray-500" />
            )}
          </button>
          {/* Real Balance Display */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <div className="text-right">
              <div className="text-[10px] text-gray-400">ব্যালেন্স</div>
              <div className="text-xs sm:text-sm font-black text-amber-400 font-mono tabular-nums">
                {balance > 0 ? (
                  `৳ ${balance.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`
                ) : (
                  <span className="text-rose-400 font-medium">৳ ০.০০</span>
                )}
              </div>
            </div>
            {onOpenDeposit && (
              <button
                onClick={onOpenDeposit}
                className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs flex items-center gap-1 shadow-md shadow-amber-500/20 active:scale-95 transition-all"
                title="ডিপোজিট করুন"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span className="hidden sm:inline">ডিপোজিট</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Game Stage */}
      <div className="flex-1 max-w-4xl w-full mx-auto p-3 sm:p-5 flex flex-col justify-between">
        {/* Dice Arena */}
        <div className="relative rounded-3xl overflow-hidden p-5 sm:p-7 bg-gradient-to-b from-[#0b1322] via-[#09101d] to-[#060a12] border border-amber-500/20 shadow-2xl text-center">
          {/* Decorative Table Felt Border */}
          <div className="absolute inset-0 border-2 border-emerald-900/30 rounded-3xl pointer-events-none" />
          <div className="absolute top-2 left-4 text-[10px] font-mono text-emerald-400/60 uppercase tracking-widest">
            Babu22 Official Dice Table
          </div>

          {/* Rolling Dice Container */}
          <div className="my-3 sm:my-5 flex items-center justify-center gap-4 sm:gap-6">
            {/* Die 1 (Red Casino Die) */}
            <div
              className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-red-600 via-red-700 to-red-900 border-2 border-red-400/60 shadow-[0_10px_25px_rgba(220,38,38,0.4)] flex items-center justify-center transform transition-all duration-150 ${
                isRolling ? 'rotate-180 scale-95 animate-spin' : 'hover:scale-105'
              }`}
            >
              {renderDiceDots(die1, false)}
            </div>
            {/* Plus Indicator */}
            <div className="text-xl sm:text-2xl font-black text-amber-400/80 font-mono">+</div>
            {/* Die 2 (Gold Casino Die) */}
            <div
              className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-amber-500 via-amber-600 to-yellow-700 border-2 border-amber-300/80 shadow-[0_10px_25px_rgba(245,158,11,0.4)] flex items-center justify-center transform transition-all duration-150 ${
                isRolling ? '-rotate-180 scale-95 animate-spin' : 'hover:scale-105'
              }`}
            >
              {renderDiceDots(die2, true)}
            </div>
          </div>

          {/* Result Tag Banner */}
          <div className="min-h-[50px] flex flex-col items-center justify-center">
            {isRolling ? (
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm sm:text-base animate-pulse">
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>পাশা ঘুরছে... ফল প্রস্তুত হচ্ছে...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1 animate-fade-in">
                <div className="flex items-center gap-2 font-mono font-black text-xl sm:text-2xl text-white">
                  <span>{die1}</span>
                  <span className="text-gray-500">+</span>
                  <span>{die2}</span>
                  <span className="text-amber-400">=</span>
                  <span className="text-2xl sm:text-3xl font-extrabold text-amber-300 bg-amber-500/20 px-3 py-0.5 rounded-xl border border-amber-500/40">
                    {die1 + die2}
                  </span>
                </div>
                {roundMessage && (
                  <div
                    className={`text-xs sm:text-sm font-bold ${
                      lastWinAmount ? 'text-emerald-400 animate-bounce' : 'text-gray-300'
                    }`}
                  >
                    {roundMessage}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Frequency Trend Bar */}
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-gray-400 px-2">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              <span>
                ৭ ডাউন: <strong className="text-blue-400 font-mono">{underPct}%</strong>
              </span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>
                লাকি ৭: <strong className="text-amber-400 font-mono">{luckyPct}%</strong>
              </span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              <span>
                ৭ আপ: <strong className="text-rose-400 font-mono">{overPct}%</strong>
              </span>
            </span>
          </div>
        </div>

        {/* Low balance guidance banner */}
        {(lowBalanceAlert || balance < selectedChip) && (
          <div className="my-2 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-2 text-xs text-amber-300">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                {balance === 0
                  ? 'আপনার ওয়ালেটে কোনো ব্যালেন্স নেই। খেলতে ডিপোজিট করুন।'
                  : 'নির্বাচিত চিপের চেয়ে আপনার ব্যালেন্স কম।'}
              </span>
            </div>
            {onOpenDeposit && (
              <button
                onClick={onOpenDeposit}
                className="px-3 py-1.5 text-xs font-black text-slate-950 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 rounded-xl whitespace-nowrap active:scale-95 transition-all shadow-sm"
              >
                এখনই ডিপোজিট করুন
              </button>
            )}
          </div>
        )}

        {/* Primary 3-Zone Betting Board */}
        <div className="my-3 grid grid-cols-3 gap-2 sm:gap-3.5">
          {/* Zone 1: UNDER 7 (2 - 6) */}
          <button
            type="button"
            onClick={() => handlePlaceBet('under7')}
            disabled={isRolling}
            className={`relative p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border text-center transition-all duration-150 active:scale-95 flex flex-col items-center justify-between min-h-[125px] sm:min-h-[145px] ${
              bets.under7 > 0
                ? 'bg-blue-950/60 border-blue-500 ring-2 ring-blue-500/50 shadow-lg shadow-blue-500/20'
                : 'bg-slate-900/90 hover:bg-slate-800/90 border-slate-700/80 hover:border-blue-400/50'
            }`}
          >
            <div className="text-[11px] sm:text-xs font-black text-blue-400 tracking-wider">
              ৭ এর নিচে (7 DOWN)
            </div>
            <div className="text-xl sm:text-3xl font-black text-white font-mono tracking-tight my-1">
              ২ থেকে ৬
            </div>
            <div className="text-[10px] sm:text-xs font-bold text-gray-400 bg-slate-950/60 px-2 py-0.5 rounded-full border border-slate-800">
              পেআউট: <span className="text-blue-400 font-mono font-bold">2.0x</span>
            </div>
            {/* Bet Chip Overlay */}
            {bets.under7 > 0 && (
              <div className="absolute -top-2.5 right-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-mono font-black text-[11px] sm:text-xs px-2.5 py-0.5 rounded-full shadow-md border border-white/30 animate-scale-in">
                ৳{bets.under7}
              </div>
            )}
          </button>

          {/* Zone 2: LUCKY 7 (EXACT 7) */}
          <button
            type="button"
            onClick={() => handlePlaceBet('lucky7')}
            disabled={isRolling}
            className={`relative p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border text-center transition-all duration-150 active:scale-95 flex flex-col items-center justify-between min-h-[125px] sm:min-h-[145px] ${
              bets.lucky7 > 0
                ? 'bg-amber-950/70 border-amber-400 ring-2 ring-amber-400/60 shadow-xl shadow-amber-500/30'
                : 'bg-gradient-to-b from-amber-950/30 to-slate-900/90 hover:from-amber-950/50 border-amber-500/40 hover:border-amber-400'
            }`}
          >
            <div className="text-[11px] sm:text-xs font-black text-amber-400 tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>সমান ৭ (LUCKY 7)</span>
            </div>
            <div className="text-3xl sm:text-4xl font-black text-amber-300 font-mono tracking-tight my-1 drop-shadow-[0_0_12px_rgba(251,191,36,0.5)]">
              ৭
            </div>
            <div className="text-[10px] sm:text-xs font-black text-amber-300 bg-amber-500/20 px-2.5 py-0.5 rounded-full border border-amber-500/40">
              পেআউট: <span className="font-mono">5.0x</span>
            </div>
            {/* Bet Chip Overlay */}
            {bets.lucky7 > 0 && (
              <div className="absolute -top-2.5 right-2 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-mono font-black text-[11px] sm:text-xs px-2.5 py-0.5 rounded-full shadow-lg border border-white/50 animate-scale-in">
                ৳{bets.lucky7}
              </div>
            )}
          </button>

          {/* Zone 3: OVER 7 (8 - 12) */}
          <button
            type="button"
            onClick={() => handlePlaceBet('over7')}
            disabled={isRolling}
            className={`relative p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border text-center transition-all duration-150 active:scale-95 flex flex-col items-center justify-between min-h-[125px] sm:min-h-[145px] ${
              bets.over7 > 0
                ? 'bg-rose-950/60 border-rose-500 ring-2 ring-rose-500/50 shadow-lg shadow-rose-500/20'
                : 'bg-slate-900/90 hover:bg-slate-800/90 border-slate-700/80 hover:border-rose-400/50'
            }`}
          >
            <div className="text-[11px] sm:text-xs font-black text-rose-400 tracking-wider">
              ৭ এর উপরে (7 UP)
            </div>
            <div className="text-xl sm:text-3xl font-black text-white font-mono tracking-tight my-1">
              ৮ থেকে ১২
            </div>
            <div className="text-[10px] sm:text-xs font-bold text-gray-400 bg-slate-950/60 px-2 py-0.5 rounded-full border border-slate-800">
              পেআউট: <span className="text-rose-400 font-mono font-bold">2.0x</span>
            </div>
            {/* Bet Chip Overlay */}
            {bets.over7 > 0 && (
              <div className="absolute -top-2.5 right-2 bg-gradient-to-r from-rose-500 to-red-600 text-white font-mono font-black text-[11px] sm:text-xs px-2.5 py-0.5 rounded-full shadow-md border border-white/30 animate-scale-in">
                ৳{bets.over7}
              </div>
            )}
          </button>
        </div>

        {/* Secondary Side Bets Row */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {/* Even Bet */}
          <button
            type="button"
            onClick={() => handlePlaceBet('even')}
            disabled={isRolling}
            className={`p-2 sm:p-2.5 rounded-xl border text-center transition-colors relative ${
              bets.even > 0
                ? 'bg-indigo-950/60 border-indigo-400'
                : 'bg-slate-900/60 hover:bg-slate-800 border-slate-800'
            }`}
          >
            <div className="text-[10px] sm:text-xs font-bold text-gray-300">জোড় সংখ্যা (EVEN)</div>
            <div className="text-[9px] text-gray-400 font-mono">1.95x</div>
            {bets.even > 0 && (
              <span className="text-[10px] font-mono font-black text-amber-400 block mt-0.5">
                ৳{bets.even}
              </span>
            )}
          </button>

          {/* Odd Bet */}
          <button
            type="button"
            onClick={() => handlePlaceBet('odd')}
            disabled={isRolling}
            className={`p-2 sm:p-2.5 rounded-xl border text-center transition-colors relative ${
              bets.odd > 0
                ? 'bg-purple-950/60 border-purple-400'
                : 'bg-slate-900/60 hover:bg-slate-800 border-slate-800'
            }`}
          >
            <div className="text-[10px] sm:text-xs font-bold text-gray-300">বিজোড় সংখ্যা (ODD)</div>
            <div className="text-[9px] text-gray-400 font-mono">1.95x</div>
            {bets.odd > 0 && (
              <span className="text-[10px] font-mono font-black text-amber-400 block mt-0.5">
                ৳{bets.odd}
              </span>
            )}
          </button>

          {/* Double / Pair */}
          <button
            type="button"
            onClick={() => handlePlaceBet('pair')}
            disabled={isRolling}
            className={`p-2 sm:p-2.5 rounded-xl border text-center transition-colors relative ${
              bets.pair > 0
                ? 'bg-amber-950/60 border-amber-400'
                : 'bg-slate-900/60 hover:bg-slate-800 border-slate-800'
            }`}
          >
            <div className="text-[10px] sm:text-xs font-bold text-amber-300">ডাবল/পেয়ার (PAIR)</div>
            <div className="text-[9px] text-amber-400 font-mono">6.0x</div>
            {bets.pair > 0 && (
              <span className="text-[10px] font-mono font-black text-amber-400 block mt-0.5">
                ৳{bets.pair}
              </span>
            )}
          </button>
        </div>

        {/* Chip Denomination Selector */}
        <div className="bg-[#0f172a] p-3 rounded-2xl border border-gray-800 mb-3">
          <div className="text-[10px] text-gray-400 font-medium mb-1.5 flex items-center justify-between">
            <span>চিপের মান বেছে নিন (বেট ধরুন):</span>
            <span className="text-amber-400 font-mono">মোট বেট: ৳{totalBet}</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 no-scrollbar">
            {CHIP_VALUES.map(chip => (
              <button
                key={chip}
                onClick={() => {
                  setSelectedChip(chip);
                  if (soundEnabled) sound.playClick();
                }}
                className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl font-mono font-extrabold text-xs transition-all active:scale-95 shrink-0 ${
                  selectedChip === chip
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 ring-2 ring-white/50 scale-105 shadow-md shadow-amber-500/25'
                    : 'bg-slate-800 text-gray-300 hover:bg-slate-700 hover:text-white border border-slate-700'
                }`}
              >
                ৳{chip}
              </button>
            ))}
          </div>
        </div>

        {/* Action Controls & Roll Button */}
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleClearBets}
              disabled={isRolling || totalBet === 0}
              className="flex-1 sm:flex-none px-3 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-xs font-bold text-gray-300 transition-colors flex items-center justify-center gap-1 border border-slate-700"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>মুছুন</span>
            </button>
            <button
              onClick={handleDoubleBets}
              disabled={isRolling || totalBet === 0}
              className="flex-1 sm:flex-none px-3 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-xs font-bold text-gray-300 transition-colors flex items-center justify-center gap-1 border border-slate-700"
            >
              <span>২X দ্বিগুণ</span>
            </button>
            <button
              onClick={handleRebet}
              disabled={
                isRolling || Object.values(previousBets).reduce((a, b) => a + b, 0) === 0
              }
              className="flex-1 sm:flex-none px-3 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-xs font-bold text-gray-300 transition-colors flex items-center justify-center gap-1 border border-slate-700"
            >
              <span>পূর্বের বেট</span>
            </button>
          </div>

          {/* Big Roll Button */}
          <button
            onClick={handleRoll}
            disabled={isRolling || totalBet === 0}
            className="w-full sm:flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 hover:from-emerald-400 hover:to-green-400 text-slate-950 font-black text-sm sm:text-base shadow-lg shadow-emerald-500/25 active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-5 h-5 text-slate-950 fill-slate-950" />
            <span>{isRolling ? 'পাশা ঘুরছে...' : totalBet > 0 ? `পাশা ফেলুন (৳${totalBet})` : 'বেট ধরে পাশা ফেলুন'}</span>
          </button>
        </div>

        {/* Recent Roll History Bar */}
        <div className="mt-3 bg-slate-950/80 p-2.5 rounded-2xl border border-slate-800/80">
          <div className="text-[10px] text-gray-400 mb-1.5 flex items-center justify-between">
            <span>সাম্প্রতিক ফলাফল হিস্ট্রি:</span>
            <span className="text-[9px] text-gray-500">সর্বশেষ ১২ রাউন্ড</span>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {history.map(item => (
              <div
                key={item.id}
                className={`px-2 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1 shrink-0 border ${
                  item.zone === 'lucky7'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                    : item.zone === 'under7'
                    ? 'bg-blue-950/60 text-blue-400 border-blue-800/50'
                    : 'bg-rose-950/60 text-rose-400 border-rose-800/50'
                }`}
                title={`পাশা: ${item.die1} + ${item.die2} = ${item.sum}`}
              >
                <span>{item.sum}</span>
                <span className="text-[9px] opacity-75">
                  ({item.zone === 'lucky7' ? '৭' : item.zone === 'under7' ? 'ডাউন' : 'আপ'})
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Rules Modal */}
      {showRules && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-gray-800 rounded-3xl max-w-md w-full p-5 text-white shadow-2xl relative animate-fade-in">
            <h3 className="text-base font-bold text-amber-400 mb-2 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>আন্ডার ৭ ওভার ৭ (7 Up Down) খেলার নিয়ম</span>
            </h3>
            <div className="text-xs text-gray-300 space-y-2 leading-relaxed">
              <p>দুটো পাশা একসাথে ঘোরালে যে ফলাফল হয় তার যোগফলের উপর বাজি ধরা হয়।</p>
              <p>• <strong>৭ এর নিচে (7 Down / ২ থেকে ৬):</strong> গুণক ২.০x (দ্বিগুণ লাভ)</p>
              <p>• <strong>লাকি ৭ (Lucky 7 / সমান ৭):</strong> গুণক ৫.০x (পাঁচগুণ মেগা পেআউট)</p>
              <p>• <strong>৭ এর উপরে (7 Up / ৮ থেকে ১২):</strong> গুণক ২.০x (দ্বিগুণ লাভ)</p>
              <p>• <strong>সাইড বেট:</strong> জোড় সংখ্যা (1.95x), বিজোড় সংখ্যা (1.95x) ও Pair (6.0x)</p>
              <p className="text-amber-400 font-semibold">ন্যায্য ও অডিটেড পাশার ফলাফল নিশ্চিত করা হয়!</p>
            </div>
            <button
              onClick={() => setShowRules(false)}
              className="mt-4 w-full py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-xl transition-colors"
            >
              বুঝেছি, খেলা শুরু করুন
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
