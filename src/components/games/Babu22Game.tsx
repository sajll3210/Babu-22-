import React, { useState } from 'react';
import { ArrowLeft, Volume2, VolumeX, ShieldCheck, Sparkles, Crown, Trophy, Flame } from 'lucide-react';
import { GameItem } from '../../types';
import { sound } from '../../utils/audio';
import { BABU22_LOGO } from '../../data/games';

interface Babu22GameProps {
  game: GameItem;
  balance: number;
  onUpdateBalance: (amount: number, reason: string) => void;
  onClose: () => void;
  onOpenDeposit?: () => void;
}

interface CardItem {
  suit: '♠' | '♥' | '♦' | '♣';
  val: string;
  color: string;
}

const ROYAL_BETS = [
  { id: 'ace_high', labelBn: 'এস হাই (Ace High)', payout: '২.৫x', mult: 2.5, desc: 'কমপক্ষে ১টি টেক্কা' },
  { id: 'royal_pair', labelBn: 'রয়্যাল পেয়ার (Pair)', payout: '৫.০x', mult: 5.0, desc: 'যেকোনো জোড়া কার্ড' },
  { id: 'babu_combo', labelBn: 'বাবু ২২ কম্বো (Babu 22)', payout: '২২.০x', mult: 22.0, desc: 'কার্ড পয়েন্ট যোগফল ২২' },
  { id: 'four_aces', labelBn: 'ফোর এসিস (4 Aces)', payout: '২২২x', mult: 222.0, desc: '৪টি টেক্কা জ্যাকপট' },
];

export const Babu22Game: React.FC<Babu22GameProps> = ({
  game,
  balance,
  onUpdateBalance,
  onClose,
  onOpenDeposit,
}) => {
  const [selectedBetType, setSelectedBetType] = useState<string>('ace_high');
  const [betAmount, setBetAmount] = useState<number>(50);
  const [isDealing, setIsDealing] = useState<boolean>(false);
  const [lowBalanceAlert, setLowBalanceAlert] = useState<boolean>(false);
  const [dealtCards, setDealtCards] = useState<CardItem[]>([
    { suit: '♠', val: 'A', color: 'text-white' },
    { suit: '♥', val: 'A', color: 'text-rose-500' },
    { suit: '♦', val: 'A', color: 'text-amber-400' },
    { suit: '♣', val: 'A', color: 'text-rose-500' },
  ]);
  const [roundResult, setRoundResult] = useState<{
    won: boolean;
    amount: number;
    title: string;
    description: string;
  } | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Play Babu22 Royal Deal
  const handleDeal = () => {
    if (isDealing) return;
    if (balance < betAmount) {
      setLowBalanceAlert(true);
      if (onOpenDeposit) {
        onOpenDeposit();
      }
      return;
    }

    setLowBalanceAlert(false);
    onUpdateBalance(-betAmount, 'Babu22 রয়্যাল বেট');
    setIsDealing(true);
    setRoundResult(null);
    if (soundEnabled) sound.playClick();

    setTimeout(() => {
      const suits: Array<'♠' | '♥' | '♦' | '♣'> = ['♠', '♥', '♦', '♣'];
      const values = ['A', 'K', 'Q', 'J', '10', '9', '8', '7'];

      // Generate 4 cards
      const newCards: CardItem[] = Array.from({ length: 4 }).map(() => {
        const s = suits[Math.floor(Math.random() * suits.length)];
        const v = values[Math.floor(Math.random() * values.length)];
        return {
          suit: s,
          val: v,
          color: s === '♥' || s === '♦' ? 'text-rose-500' : 'text-amber-300',
        };
      });

      setDealtCards(newCards);
      setIsDealing(false);

      // Evaluate Winning Condition
      const aceCount = newCards.filter(c => c.val === 'A').length;
      const valuesCount: Record<string, number> = {};
      newCards.forEach(c => {
        valuesCount[c.val] = (valuesCount[c.val] || 0) + 1;
      });
      const hasPair = Object.values(valuesCount).some(count => count >= 2);

      // Card numeric values sum
      const getNumVal = (v: string) => {
        if (v === 'A') return 11;
        if (v === 'K' || v === 'Q' || v === 'J') return 10;
        return parseInt(v, 10);
      };

      const totalPoints = newCards.reduce((acc, c) => acc + getNumVal(c.val), 0);
      const is22Combo = totalPoints === 22 || totalPoints % 22 === 0;

      let won = false;
      let multiplier = 0;

      if (selectedBetType === 'ace_high' && aceCount >= 1) {
        won = true;
        multiplier = 2.5;
      } else if (selectedBetType === 'royal_pair' && hasPair) {
        won = true;
        multiplier = 5.0;
      } else if (selectedBetType === 'babu_combo' && is22Combo) {
        won = true;
        multiplier = 22.0;
      } else if (selectedBetType === 'four_aces' && aceCount === 4) {
        won = true;
        multiplier = 222.0;
      } else if (Math.random() < 0.25) {
        // Lucky Golden Mystery Bonus (House VIP gesture)
        won = true;
        multiplier = 2.2;
      }

      if (won) {
        const winAmt = Math.floor(betAmount * multiplier);
        setRoundResult({
          won: true,
          amount: winAmt,
          title: `🎉 BABU22 রয়্যাল জয়! (${multiplier}x)`,
          description: `আপনি জিতেছেন ৳${winAmt.toLocaleString('en-US')}`,
        });
        onUpdateBalance(winAmt, 'Babu22 রয়্যাল জয়');
        if (soundEnabled) sound.playWinChime();
      } else {
        setRoundResult({
          won: false,
          amount: 0,
          title: 'এই রাউন্ডে কোনো কম্বিনেশন হয়নি',
          description: `মোট কার্ড পয়েন্ট: ${totalPoints}। Babu22 আবার খেলুন!`,
        });
        if (soundEnabled) sound.playCrash();
      }
    }, 1200);
  };

  return (
    <div className="flex flex-col h-full bg-[#070b12] text-white select-none overflow-y-auto">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-3 sm:px-6 py-2.5 bg-[#0f172a] border-b border-amber-500/30 shrink-0 shadow-lg">
        <div className="flex items-center gap-2.5">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-200 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors border border-gray-700 active:scale-95"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="font-semibold">লবিতে ফিরুন</span>
          </button>
          <div className="flex items-center gap-2">
            <img
              src={BABU22_LOGO}
              alt="Babu22"
              className="w-7 h-7 rounded-full object-cover border border-amber-400"
            />
            <span className="font-black text-sm sm:text-base tracking-wider text-amber-400 font-serif italic">
              Babu22
            </span>
            <span className="text-[10px] text-amber-300 bg-amber-950/80 border border-amber-500/50 px-2 py-0.5 rounded-full flex items-center gap-1 font-bold">
              <Crown className="w-3 h-3 text-amber-400" />
              ROYAL VIP
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="text-right">
            <div className="text-[10px] text-gray-400">ব্যালেন্স</div>
            <div className="text-xs sm:text-sm font-bold text-amber-400 font-mono tabular-nums">
              ৳ {balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </div>
          {onOpenDeposit && (
            <button
              onClick={onOpenDeposit}
              className="px-2.5 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs rounded-xl shadow active:scale-95 transition-all whitespace-nowrap"
            >
              + ডিপোজিট
            </button>
          )}
          <button
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              sound.enabled = !soundEnabled;
            }}
            className="p-2 text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors border border-gray-700"
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

      {/* Main Babu22 VIP Velvet Arena */}
      <div className="flex-1 flex flex-col items-center justify-start p-3 sm:p-6 max-w-4xl mx-auto w-full">
        {/* VIP Stage Banner with Emblem */}
        <div className="w-full bg-gradient-to-r from-amber-950/40 via-slate-900 to-amber-950/40 border-2 border-amber-500/50 rounded-3xl p-4 sm:p-6 mb-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xl relative overflow-hidden">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={BABU22_LOGO}
                alt="Babu22 Gold Emblem"
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-amber-400 shadow-2xl shadow-amber-500/40"
              />
              <div className="absolute -top-2 -right-2 bg-gradient-to-r from-red-600 to-amber-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow">
                HOT VIP
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black italic text-amber-400 font-serif">
                  Babu22 BETTING
                </h1>
                <span className="text-[10px] bg-red-600 text-white font-black px-2 py-0.5 rounded-full uppercase">
                  Exclusive
                </span>
              </div>
              <p className="text-xs text-gray-300 mt-1 max-w-md">
                রয়্যাল ফোর এসিস (Four Aces) গোল্ডেন লাউঞ্জ। ২২ কম্বো অথবা ৪ টেক্কায় জিতে নিন মেগা পেআউট।
              </p>
              <div className="flex items-center gap-3 mt-2 text-[11px] text-amber-300 font-mono">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  RTP ৯৯.২%
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-rose-500" />
                  ম্যাক্স: ২,২২২x
                </span>
              </div>
            </div>
          </div>
          <div className="text-center sm:text-right bg-slate-950/60 p-3 rounded-2xl border border-amber-500/30">
            <div className="text-[10px] text-gray-400">রয়্যাল প্রাইজপুল</div>
            <div className="text-base sm:text-lg font-black font-mono text-amber-400 tracking-wider">
              ৳ ২২,২২,২২২
            </div>
          </div>
        </div>

        {/* 4 Aces Card Dealing Table */}
        <div className="w-full bg-gradient-to-b from-[#141b2d] via-[#0d1424] to-[#080d18] border-2 border-amber-500/40 rounded-3xl p-5 sm:p-7 shadow-2xl flex flex-col items-center relative">
          <div className="text-xs font-bold text-amber-300 uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <Crown className="w-4 h-4 text-amber-400" />
            <span>BABU22 ডিলিং টেবিল (Royal 4 Aces Hand)</span>
          </div>

          {/* Cards Display Grid */}
          <div className="grid grid-cols-4 gap-2.5 sm:gap-4 my-2">
            {dealtCards.map((card, idx) => (
              <div
                key={idx}
                className={`w-16 h-24 sm:w-24 sm:h-36 bg-gradient-to-b from-slate-900 to-black rounded-2xl border-2 ${
                  isDealing
                    ? 'border-amber-400/30 animate-pulse'
                    : 'border-amber-400 shadow-xl shadow-amber-500/10'
                } flex flex-col items-center justify-between p-2 sm:p-3 font-mono transition-all transform hover:-translate-y-1`}
              >
                <div className="w-full flex items-center justify-between text-xs sm:text-sm font-black">
                  <span className={card.color}>{isDealing ? '?' : card.val}</span>
                  <span className={card.color}>{isDealing ? '♠' : card.suit}</span>
                </div>
                <div className={`text-2xl sm:text-4xl font-black ${card.color} drop-shadow-md`}>
                  {isDealing ? (
                    <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-amber-400 animate-spin" />
                  ) : (
                    card.suit
                  )}
                </div>
                <div className="w-full flex items-center justify-between text-xs sm:text-sm font-black rotate-180">
                  <span className={card.color}>{isDealing ? '?' : card.val}</span>
                  <span className={card.color}>{isDealing ? '♠' : card.suit}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Result announcement */}
          {roundResult && (
            <div
              className={`w-full max-w-lg text-center font-bold text-xs sm:text-sm py-2.5 px-4 rounded-xl border my-3 transition-all ${
                roundResult.won
                  ? 'bg-amber-950/80 border-amber-400 text-amber-300 animate-bounce'
                  : 'bg-slate-950/80 border-gray-700 text-gray-300'
              }`}
            >
              <div>{roundResult.title}</div>
              <div className="text-[11px] font-normal opacity-90 mt-0.5">
                {roundResult.description}
              </div>
            </div>
          )}

          {/* Betting Category Options */}
          <div className="w-full mt-3">
            <div className="text-[11px] text-gray-400 font-semibold mb-2 text-center">
              বেটিং অপশন নির্বাচন করুন:
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {ROYAL_BETS.map(bet => (
                <button
                  key={bet.id}
                  onClick={() => setSelectedBetType(bet.id)}
                  disabled={isDealing}
                  className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                    selectedBetType === bet.id
                      ? 'bg-gradient-to-b from-amber-500 to-yellow-500 text-slate-950 border-amber-300 shadow-lg shadow-amber-500/20 scale-102 font-bold'
                      : 'bg-slate-900/90 border-gray-800 text-gray-300 hover:border-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold truncate">{bet.labelBn}</span>
                    <span className="text-[11px] font-mono font-black ml-1">{bet.payout}</span>
                  </div>
                  <span
                    className={`text-[10px] mt-1 line-clamp-1 ${
                      selectedBetType === bet.id ? 'text-slate-900' : 'text-gray-400'
                    }`}
                  >
                    {bet.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Insufficient balance alert */}
          {(lowBalanceAlert || balance < betAmount) && (
            <div className="w-full mt-3 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/40 text-amber-300 text-xs flex flex-col sm:flex-row items-center justify-between gap-2 shadow-inner">
              <span className="font-medium text-center sm:text-left">
                বেটের জন্য পর্যাপ্ত ব্যালেন্স নেই (বর্তমান: ৳{balance.toFixed(2)})
              </span>
              {onOpenDeposit && (
                <button
                  onClick={onOpenDeposit}
                  className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black rounded-xl text-xs shadow hover:brightness-110 active:scale-95 transition-all whitespace-nowrap"
                >
                  এখনই ডিপোজিট করুন
                </button>
              )}
            </div>
          )}

          {/* Bet Chips & Deal Button */}
          <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 pt-4 border-t border-gray-800">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {[20, 50, 100, 250, 500, 1000, 2222].map(val => (
                <button
                  key={val}
                  onClick={() => setBetAmount(val)}
                  disabled={isDealing}
                  className={`px-3 py-1.5 text-xs font-mono font-bold rounded-lg transition-all ${
                    betAmount === val
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-md font-black scale-105'
                      : 'bg-slate-800 text-gray-300 hover:bg-slate-700'
                  }`}
                >
                  ৳{val}
                </button>
              ))}
            </div>

            <button
              onClick={handleDeal}
              disabled={isDealing}
              className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-sm rounded-xl shadow-xl shadow-amber-500/30 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Trophy className="w-4 h-4 text-slate-950" />
              <span>{isDealing ? 'ডিল হচ্ছে...' : `Babu22 ডিল (৳${betAmount})`}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
