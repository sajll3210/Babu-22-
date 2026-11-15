import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Volume2,
  VolumeX,
  ShieldCheck,
  History,
  RotateCcw,
  Trophy,
  HelpCircle,
  Sparkles,
  Layers,
} from 'lucide-react';
import { sound } from '../../utils/audio';

interface BaccaratGameProps {
  balance: number;
  onUpdateBalance: (amount: number, reason: string) => void;
  onClose: () => void;
  onOpenDeposit?: () => void;
}

type BetSpot = 'player' | 'banker' | 'tie' | 'playerPair' | 'bankerPair';

interface Card {
  suit: '♠' | '♥' | '♦' | '♣';
  value: string;
  numValue: number;
  color: 'red' | 'black';
}

const SUITS: Array<'♠' | '♥' | '♦' | '♣'> = ['♠', '♥', '♦', '♣'];
const VALUES = [
  { val: 'A', num: 1 },
  { val: '2', num: 2 },
  { val: '3', num: 3 },
  { val: '4', num: 4 },
  { val: '5', num: 5 },
  { val: '6', num: 6 },
  { val: '7', num: 7 },
  { val: '8', num: 8 },
  { val: '9', num: 9 },
  { val: '10', num: 0 },
  { val: 'J', num: 0 },
  { val: 'Q', num: 0 },
  { val: 'K', num: 0 },
];

export const BaccaratGame: React.FC<BaccaratGameProps> = ({
  balance,
  onUpdateBalance,
  onClose,
  onOpenDeposit,
}) => {
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [selectedChip, setSelectedChip] = useState<number>(100);
  const [bets, setBets] = useState<Record<BetSpot, number>>({
    player: 0,
    banker: 0,
    tie: 0,
    playerPair: 0,
    bankerPair: 0,
  });

  const [isDealing, setIsDealing] = useState<boolean>(false);
  const [roundOver, setRoundOver] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Cards
  const [playerCards, setPlayerCards] = useState<Card[]>([]);
  const [bankerCards, setBankerCards] = useState<Card[]>([]);
  const [playerTotal, setPlayerTotal] = useState<number | null>(null);
  const [bankerTotal, setBankerTotal] = useState<number | null>(null);
  const [winnerMessage, setWinnerMessage] = useState<string>('');

  // Road history (Banker = 'B', Player = 'P', Tie = 'T')
  const [roadHistory, setRoadHistory] = useState<Array<'B' | 'P' | 'T'>>([
    'B', 'B', 'P', 'B', 'T', 'P', 'P', 'B', 'P', 'B', 'B',
  ]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const totalBet = Object.values(bets).reduce((a, b) => a + b, 0);

  const drawRandomCard = (): Card => {
    const suit = SUITS[Math.floor(Math.random() * SUITS.length)];
    const valObj = VALUES[Math.floor(Math.random() * VALUES.length)];
    return {
      suit,
      value: valObj.val,
      numValue: valObj.num,
      color: suit === '♥' || suit === '♦' ? 'red' : 'black',
    };
  };

  const calculateHandValue = (cards: Card[]): number => {
    const sum = cards.reduce((acc, c) => acc + c.numValue, 0);
    return sum % 10;
  };

  const handlePlaceBet = (spot: BetSpot) => {
    if (isDealing) return;
    if (balance < selectedChip) {
      showToast('অপর্যাপ্ত ব্যালেন্স! দয়া করে ডিপোজিট করুন।');
      if (soundEnabled) sound.playCrash();
      return;
    }

    onUpdateBalance(-selectedChip, `Baccarat: ${spot} এ বাজি স্থাপন`);
    if (soundEnabled) sound.playClick();
    setBets(prev => ({ ...prev, [spot]: prev[spot] + selectedChip }));
  };

  const handleClearBets = () => {
    if (isDealing || totalBet === 0) return;
    onUpdateBalance(totalBet, 'Baccarat: বাজি প্রত্যাহার');
    setBets({
      player: 0,
      banker: 0,
      tie: 0,
      playerPair: 0,
      bankerPair: 0,
    });
    if (soundEnabled) sound.playClick();
  };

  const handleDeal = () => {
    if (isDealing || totalBet === 0) return;

    setIsDealing(true);
    setRoundOver(false);
    setPlayerCards([]);
    setBankerCards([]);
    setPlayerTotal(null);
    setBankerTotal(null);
    setWinnerMessage('');

    if (soundEnabled) sound.playCardFlip();

    // Deal 2 initial cards to Player & Banker
    const p1 = drawRandomCard();
    const b1 = drawRandomCard();
    const p2 = drawRandomCard();
    const b2 = drawRandomCard();

    setTimeout(() => {
      setPlayerCards([p1]);
      if (soundEnabled) sound.playCardFlip();
    }, 400);

    setTimeout(() => {
      setBankerCards([b1]);
      if (soundEnabled) sound.playCardFlip();
    }, 800);

    setTimeout(() => {
      setPlayerCards([p1, p2]);
      if (soundEnabled) sound.playCardFlip();
    }, 1200);

    setTimeout(() => {
      setBankerCards([b1, b2]);
      if (soundEnabled) sound.playCardFlip();

      // Check initial totals
      let currentP = (p1.numValue + p2.numValue) % 10;
      let currentB = (b1.numValue + b2.numValue) % 10;
      setPlayerTotal(currentP);
      setBankerTotal(currentB);

      // Natural 8 or 9 check
      if (currentP >= 8 || currentB >= 8) {
        finalizeRound([p1, p2], [b1, b2]);
      } else {
        // Player Third Card Rule
        let finalP = [p1, p2];
        let finalB = [b1, b2];
        let pThird: Card | null = null;

        if (currentP <= 5) {
          pThird = drawRandomCard();
          finalP.push(pThird);
          setTimeout(() => {
            setPlayerCards([...finalP]);
            if (soundEnabled) sound.playCardFlip();
            setPlayerTotal(calculateHandValue(finalP));
          }, 600);
        }

        // Banker Third Card Rule
        setTimeout(() => {
          let bankerDraws = false;
          if (!pThird) {
            // Player stood on 6 or 7
            if (currentB <= 5) bankerDraws = true;
          } else {
            // Player drew a third card
            const pThirdVal = pThird.numValue;
            if (currentB <= 2) bankerDraws = true;
            else if (currentB === 3 && pThirdVal !== 8) bankerDraws = true;
            else if (currentB === 4 && [2, 3, 4, 5, 6, 7].includes(pThirdVal)) bankerDraws = true;
            else if (currentB === 5 && [4, 5, 6, 7].includes(pThirdVal)) bankerDraws = true;
            else if (currentB === 6 && [6, 7].includes(pThirdVal)) bankerDraws = true;
          }

          if (bankerDraws) {
            const bThird = drawRandomCard();
            finalB.push(bThird);
            setBankerCards([...finalB]);
            if (soundEnabled) sound.playCardFlip();
            setBankerTotal(calculateHandValue(finalB));
          }

          setTimeout(() => {
            finalizeRound(finalP, finalB);
          }, 600);
        }, pThird ? 1200 : 600);
      }
    }, 1600);
  };

  const finalizeRound = (pHand: Card[], bHand: Card[]) => {
    const pScore = calculateHandValue(pHand);
    const bScore = calculateHandValue(bHand);
    setPlayerTotal(pScore);
    setBankerTotal(bScore);

    let winner: 'player' | 'banker' | 'tie';
    if (pScore > bScore) winner = 'player';
    else if (bScore > pScore) winner = 'banker';
    else winner = 'tie';

    // Pairs check
    const isPlayerPair = pHand.length >= 2 && pHand[0].value === pHand[1].value;
    const isBankerPair = bHand.length >= 2 && bHand[0].value === bHand[1].value;

    let payout = 0;
    let wonBets: string[] = [];

    // Player win: 1:1
    if (winner === 'player' && bets.player > 0) {
      payout += bets.player * 2;
      wonBets.push('Player (1:1)');
    }
    // Banker win: 0.95:1 (5% commission)
    if (winner === 'banker' && bets.banker > 0) {
      payout += bets.banker * 1.95;
      wonBets.push('Banker (0.95:1)');
    }
    // Tie win: 8:1 (and pushes Player/Banker bets back)
    if (winner === 'tie') {
      if (bets.tie > 0) {
        payout += bets.tie * 9;
        wonBets.push('Tie (8:1)');
      }
      payout += bets.player + bets.banker; // Push
    }
    // Pairs payout 11:1
    if (isPlayerPair && bets.playerPair > 0) {
      payout += bets.playerPair * 12;
      wonBets.push('Player Pair (11:1)');
    }
    if (isBankerPair && bets.bankerPair > 0) {
      payout += bets.bankerPair * 12;
      wonBets.push('Banker Pair (11:1)');
    }

    const roadSymbol = winner === 'banker' ? 'B' : winner === 'player' ? 'P' : 'T';
    setRoadHistory(prev => [roadSymbol, ...prev.slice(0, 15)]);

    const resultMsg =
      winner === 'player'
        ? `প্লেয়ার জয়ী (${pScore} বনাম ${bScore})!`
        : winner === 'banker'
        ? `ব্যাংকার জয়ী (${bScore} বনাম ${pScore})!`
        : `টাই (${pScore} বনাম ${bScore})!`;
    setWinnerMessage(resultMsg);

    if (payout > 0) {
      const roundedPayout = +payout.toFixed(2);
      onUpdateBalance(roundedPayout, `Baccarat: জয় (${wonBets.join(', ')})`);
      if (soundEnabled) sound.playWinChime();
      showToast(`🎉 জয়! ৳${roundedPayout.toLocaleString()} পেআউট অর্জিত!`);
    } else {
      if (soundEnabled) sound.playCrash();
      showToast(resultMsg);
    }

    setIsDealing(false);
    setRoundOver(true);
    setBets({ player: 0, banker: 0, tie: 0, playerPair: 0, bankerPair: 0 });
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#07130f] flex flex-col overflow-y-auto select-none font-sans text-gray-100">
      {/* Header */}
      <header className="bg-[#0b1a15] border-b border-emerald-500/20 px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between sticky top-0 z-20 shadow-lg">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-gray-300 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-sm sm:text-base tracking-wide bg-gradient-to-r from-emerald-300 via-teal-100 to-emerald-400 bg-clip-text text-transparent">
                VIP Baccarat Salon
              </span>
              <span className="text-[10px] font-black uppercase px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/40">
                LIVE TABLE
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-gray-400">লাইভ ব্যাকারাত রিয়েল ফেস কার্ড</p>
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
        </div>
      </header>

      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-slate-950 font-bold text-xs sm:text-sm px-4 py-2 rounded-xl shadow-xl animate-bounce">
          {toastMsg}
        </div>
      )}

      {/* Main Table Felt */}
      <div className="flex-1 max-w-5xl w-full mx-auto p-3 sm:p-6 space-y-4">
        {/* Road Map History Bead Plate */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-mono bg-slate-950/60 p-2.5 rounded-2xl border border-slate-800">
          <span className="text-[11px] text-gray-400 font-bold mr-1 shrink-0">বিড প্লেট:</span>
          {roadHistory.map((r, i) => (
            <span
              key={i}
              className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-[11px] shrink-0 shadow ${
                r === 'B'
                  ? 'bg-rose-600 text-white'
                  : r === 'P'
                  ? 'bg-blue-600 text-white'
                  : 'bg-emerald-600 text-white'
              }`}
            >
              {r}
            </span>
          ))}
        </div>

        {/* Baccarat Card Felt Table */}
        <div className="bg-gradient-to-b from-[#0a2318] to-[#06150f] border-4 border-amber-600/40 rounded-3xl p-4 sm:p-8 shadow-2xl relative">
          <div className="grid grid-cols-2 gap-4 sm:gap-8 pb-6 border-b border-emerald-500/20">
            {/* Player Hand */}
            <div className="bg-slate-950/60 border border-blue-500/40 rounded-2xl p-4 text-center space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-black text-sm text-blue-400 uppercase tracking-wider">
                  PLAYER (প্লেয়ার)
                </span>
                <span className="px-2.5 py-0.5 rounded-lg bg-blue-950 text-blue-300 font-mono font-bold text-xs border border-blue-500/30">
                  {playerTotal !== null ? `পয়েন্ট: ${playerTotal}` : 'কার্ড হ্যান্ড'}
                </span>
              </div>
              {/* Cards row */}
              <div className="flex items-center justify-center gap-2 min-h-[90px]">
                {playerCards.length === 0 ? (
                  <div className="text-xs text-gray-500 italic">কার্ডের অপেক্ষা...</div>
                ) : (
                  playerCards.map((c, i) => (
                    <div
                      key={i}
                      className="w-14 sm:w-16 h-20 sm:h-24 bg-white rounded-xl shadow-lg border border-gray-300 flex flex-col justify-between p-1.5 text-slate-950 font-black animate-fade-in"
                    >
                      <div className={`text-xs ${c.color === 'red' ? 'text-red-600' : 'text-slate-950'}`}>
                        {c.value} {c.suit}
                      </div>
                      <div className="text-xl sm:text-2xl text-center">{c.suit}</div>
                      <div className={`text-xs text-right ${c.color === 'red' ? 'text-red-600' : 'text-slate-950'}`}>
                        {c.value}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Banker Hand */}
            <div className="bg-slate-950/60 border border-rose-500/40 rounded-2xl p-4 text-center space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-black text-sm text-rose-400 uppercase tracking-wider">
                  BANKER (ব্যাংকার)
                </span>
                <span className="px-2.5 py-0.5 rounded-lg bg-rose-950 text-rose-300 font-mono font-bold text-xs border border-rose-500/30">
                  {bankerTotal !== null ? `পয়েন্ট: ${bankerTotal}` : 'কার্ড হ্যান্ড'}
                </span>
              </div>
              {/* Cards row */}
              <div className="flex items-center justify-center gap-2 min-h-[90px]">
                {bankerCards.length === 0 ? (
                  <div className="text-xs text-gray-500 italic">কার্ডের অপেক্ষা...</div>
                ) : (
                  bankerCards.map((c, i) => (
                    <div
                      key={i}
                      className="w-14 sm:w-16 h-20 sm:h-24 bg-white rounded-xl shadow-lg border border-gray-300 flex flex-col justify-between p-1.5 text-slate-950 font-black animate-fade-in"
                    >
                      <div className={`text-xs ${c.color === 'red' ? 'text-red-600' : 'text-slate-950'}`}>
                        {c.value} {c.suit}
                      </div>
                      <div className="text-xl sm:text-2xl text-center">{c.suit}</div>
                      <div className={`text-xs text-right ${c.color === 'red' ? 'text-red-600' : 'text-slate-950'}`}>
                        {c.value}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Winner Banner */}
          {winnerMessage && (
            <div className="text-center py-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl my-4 text-amber-300 font-bold text-sm animate-pulse">
              {winnerMessage}
            </div>
          )}

          {/* Table Betting Spots */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4 pt-4">
            {/* Player Spot */}
            <button
              type="button"
              disabled={isDealing}
              onClick={() => handlePlaceBet('player')}
              className={`p-4 rounded-2xl border-2 transition text-center relative ${
                bets.player > 0
                  ? 'bg-blue-900/60 border-blue-400 shadow-lg shadow-blue-500/20'
                  : 'bg-slate-950/70 border-blue-500/40 hover:border-blue-400'
              }`}
            >
              <div className="font-black text-sm sm:text-base text-blue-300">PLAYER</div>
              <div className="text-[11px] text-gray-400 font-mono">1 : 1 পেআউট</div>
              {bets.player > 0 && (
                <div className="mt-2 inline-block px-3 py-1 rounded-full bg-blue-500 text-white font-mono font-bold text-xs shadow">
                  ৳{bets.player}
                </div>
              )}
            </button>

            {/* Tie Spot */}
            <button
              type="button"
              disabled={isDealing}
              onClick={() => handlePlaceBet('tie')}
              className={`p-4 rounded-2xl border-2 transition text-center relative ${
                bets.tie > 0
                  ? 'bg-emerald-900/60 border-emerald-400 shadow-lg shadow-emerald-500/20'
                  : 'bg-slate-950/70 border-emerald-500/40 hover:border-emerald-400'
              }`}
            >
              <div className="font-black text-sm sm:text-base text-emerald-300">TIE (টাই)</div>
              <div className="text-[11px] text-gray-400 font-mono">8 : 1 পেআউট</div>
              {bets.tie > 0 && (
                <div className="mt-2 inline-block px-3 py-1 rounded-full bg-emerald-500 text-slate-950 font-mono font-bold text-xs shadow">
                  ৳{bets.tie}
                </div>
              )}
            </button>

            {/* Banker Spot */}
            <button
              type="button"
              disabled={isDealing}
              onClick={() => handlePlaceBet('banker')}
              className={`p-4 rounded-2xl border-2 transition text-center relative ${
                bets.banker > 0
                  ? 'bg-rose-900/60 border-rose-400 shadow-lg shadow-rose-500/20'
                  : 'bg-slate-950/70 border-rose-500/40 hover:border-rose-400'
              }`}
            >
              <div className="font-black text-sm sm:text-base text-rose-300">BANKER</div>
              <div className="text-[11px] text-gray-400 font-mono">0.95 : 1 পেআউট</div>
              {bets.banker > 0 && (
                <div className="mt-2 inline-block px-3 py-1 rounded-full bg-rose-500 text-white font-mono font-bold text-xs shadow">
                  ৳{bets.banker}
                </div>
              )}
            </button>
          </div>

          {/* Side Bets (Player Pair & Banker Pair) */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-3">
            <button
              type="button"
              disabled={isDealing}
              onClick={() => handlePlaceBet('playerPair')}
              className="p-2.5 rounded-xl bg-slate-950/70 border border-blue-500/30 hover:border-blue-400 text-center"
            >
              <span className="text-xs font-bold text-blue-300 block">প্লেয়ার পেয়ার (11:1)</span>
              {bets.playerPair > 0 && <span className="font-mono text-xs text-amber-400">৳{bets.playerPair}</span>}
            </button>
            <button
              type="button"
              disabled={isDealing}
              onClick={() => handlePlaceBet('bankerPair')}
              className="p-2.5 rounded-xl bg-slate-950/70 border border-rose-500/30 hover:border-rose-400 text-center"
            >
              <span className="text-xs font-bold text-rose-300 block">ব্যাংকার পেয়ার (11:1)</span>
              {bets.bankerPair > 0 && <span className="font-mono text-xs text-amber-400">৳{bets.bankerPair}</span>}
            </button>
          </div>
        </div>

        {/* Chip Denomination Bar & Actions */}
        <div className="bg-[#0b1a15] border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl">
          {/* Chips */}
          <div className="flex items-center gap-2 overflow-x-auto">
            <span className="text-xs text-gray-400 mr-1">চিপস:</span>
            {[50, 100, 500, 1000, 5000].map(val => (
              <button
                key={val}
                type="button"
                onClick={() => setSelectedChip(val)}
                className={`w-10 h-10 rounded-full font-mono font-black text-xs flex items-center justify-center border-2 transition transform active:scale-90 ${
                  selectedChip === val
                    ? 'border-amber-400 scale-110 shadow-lg shadow-amber-500/40 bg-amber-500 text-slate-950'
                    : 'border-slate-700 bg-slate-900 text-gray-300 hover:border-slate-500'
                }`}
              >
                {val >= 1000 ? `${val / 1000}k` : val}
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleClearBets}
              disabled={isDealing || totalBet === 0}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-gray-300 font-bold text-xs disabled:opacity-40"
            >
              ক্লিয়ার
            </button>
            <button
              type="button"
              onClick={handleDeal}
              disabled={isDealing || totalBet === 0}
              className="flex-1 sm:flex-initial px-8 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/25 active:scale-95 transition disabled:opacity-50"
            >
              {isDealing ? 'ডিল হচ্ছে...' : `ডিল করুন (৳${totalBet})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
