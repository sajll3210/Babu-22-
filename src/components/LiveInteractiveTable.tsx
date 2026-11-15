import React, { useState } from 'react';
import { ArrowLeft, Volume2, VolumeX, ShieldCheck, Sparkles, Flame, Disc, Layers } from 'lucide-react';
import { GameItem } from '../types';
import { sound } from '../utils/audio';

interface LiveInteractiveTableProps {
  game: GameItem;
  balance: number;
  onUpdateBalance: (amount: number, reason: string) => void;
  onClose: () => void;
  onOpenDeposit?: () => void;
}

// Wheel segments for Game Shows (Crazy Time, Mega Wheel, Sweet Bonanza, etc.)
const WHEEL_SEGMENTS = [
  { label: '1x', mult: 1, color: '#3b82f6', textColor: '#ffffff' },
  { label: '2x', mult: 2, color: '#10b981', textColor: '#ffffff' },
  { label: '5x', mult: 5, color: '#f59e0b', textColor: '#000000' },
  { label: 'BONUS', mult: 25, color: '#ec4899', textColor: '#ffffff' },
  { label: '1x', mult: 1, color: '#3b82f6', textColor: '#ffffff' },
  { label: '2x', mult: 2, color: '#10b981', textColor: '#ffffff' },
  { label: '10x', mult: 10, color: '#8b5cf6', textColor: '#ffffff' },
  { label: 'MEGA', mult: 50, color: '#ef4444', textColor: '#ffffff' },
  { label: '1x', mult: 1, color: '#3b82f6', textColor: '#ffffff' },
  { label: '2x', mult: 2, color: '#10b981', textColor: '#ffffff' },
  { label: '5x', mult: 5, color: '#f59e0b', textColor: '#000000' },
  { label: 'CRAZY', mult: 100, color: '#fbbf24', textColor: '#000000' },
];

export const LiveInteractiveTable: React.FC<LiveInteractiveTableProps> = ({
  game,
  balance,
  onUpdateBalance,
  onClose,
  onOpenDeposit,
}) => {
  // Determine game mode: 'wheel' for Game Shows, 'sicbo' for Sic Bo/Dice, 'baccarat' for Cards, 'lobby' for lobbies
  const isGameShow =
    game.playableType === 'game_show' ||
    game.id.includes('time') ||
    game.id.includes('wheel') ||
    game.id.includes('monopoly') ||
    game.id.includes('candy');
  const isSicBo =
    game.playableType === 'sicbo' ||
    game.id.includes('sic') ||
    game.id.includes('bac-bo') ||
    game.id.includes('tan');
  const isBaccarat =
    !isGameShow &&
    !isSicBo &&
    (game.playableType === 'baccarat' ||
      game.id.includes('baccarat') ||
      game.id.includes('dragon') ||
      game.id.includes('bahar') ||
      game.id.includes('studio'));
  const isLobby = !isGameShow && !isSicBo && !isBaccarat;

  // Betting states
  const [betAmount, setBetAmount] = useState<number>(50);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [roundResult, setRoundResult] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Wheel state
  const [wheelRotation, setWheelRotation] = useState<number>(0);
  const [selectedWheelBet, setSelectedWheelBet] = useState<string>('1x');

  // Baccarat state
  const [baccaratBet, setBaccaratBet] = useState<'player' | 'banker' | 'tie'>('player');
  const [playerCards, setPlayerCards] = useState<number[]>([8, 9]);
  const [bankerCards, setBankerCards] = useState<number[]>([7, 6]);

  // Sic Bo state
  const [sicBoBet, setSicBoBet] = useState<'small' | 'big' | 'triple'>('big');
  const [diceValues, setDiceValues] = useState<number[]>([4, 5, 6]);
  const [lightningMultiplier, setLightningMultiplier] = useState<number>(1);

  // Live Chat simulation
  const [chatMessages] = useState<Array<{ user: string; text: string; time: string }>>([
    { user: 'সাকিব_ঢাকা', text: 'দারুণ রাউন্ড চলছে!', time: 'এখন' },
    { user: 'তানভীর_৭৭', text: 'আমার বিগ উইন হয়েছে!', time: '১ মিনিট আগে' },
    { user: 'VIP_রাজা', text: 'সবাইকে শুভকামনা!', time: '২ মিনিট আগে' },
  ]);

  // Wheel Spin Execution
  const handleSpinWheel = () => {
    if (isPlaying) return;
    if (balance < betAmount) {
      if (onOpenDeposit) onOpenDeposit();
      return;
    }

    onUpdateBalance(-betAmount, `${game.titleEn} বেট`);
    setIsPlaying(true);
    setRoundResult(null);
    if (soundEnabled) sound.playClick();

    // Select random winning segment
    const winIndex = Math.floor(Math.random() * WHEEL_SEGMENTS.length);
    const winningSeg = WHEEL_SEGMENTS[winIndex];
    const segmentDegrees = 360 / WHEEL_SEGMENTS.length;

    // Extra full turns (5 to 8 rotations) + target segment offset
    const randomRotations = (5 + Math.floor(Math.random() * 3)) * 360;
    const targetDeg = wheelRotation + randomRotations + (360 - winIndex * segmentDegrees);
    setWheelRotation(targetDeg);

    setTimeout(() => {
      setIsPlaying(false);
      const isWinner =
        (selectedWheelBet === '1x' && winningSeg.mult === 1) ||
        (selectedWheelBet === '2x' && winningSeg.mult === 2) ||
        (selectedWheelBet === '5x' && winningSeg.mult === 5) ||
        (selectedWheelBet === '10x' && winningSeg.mult === 10) ||
        (selectedWheelBet === 'BONUS' && winningSeg.mult >= 25);

      if (isWinner) {
        const winAmt = Math.floor(betAmount * winningSeg.mult);
        setRoundResult(`🎉 দুর্দান্ত জয়! [${winningSeg.label}]- জিতেছেন ৳${winAmt.toLocaleString('en-US')}`);
        onUpdateBalance(winAmt, `${game.titleEn} হুইল জয়`);
        if (soundEnabled) sound.playWinChime();
      } else {
        setRoundResult(`ফলাফল [${winningSeg.label}] (${winningSeg.mult}x)- এই রাউন্ডে মেলেনি!`);
        if (soundEnabled) sound.playCrash();
      }
    }, 4500);
  };

  // Baccarat Deal Execution
  const handleDealBaccarat = () => {
    if (isPlaying) return;
    if (balance < betAmount) {
      if (onOpenDeposit) onOpenDeposit();
      return;
    }

    onUpdateBalance(-betAmount, `${game.titleEn} বেট`);
    setIsPlaying(true);
    setRoundResult(null);
    if (soundEnabled) sound.playClick();

    setTimeout(() => {
      const p1 = Math.floor(Math.random() * 9) + 1;
      const p2 = Math.floor(Math.random() * 9) + 1;
      const b1 = Math.floor(Math.random() * 9) + 1;
      const b2 = Math.floor(Math.random() * 9) + 1;
      const pScore = (p1 + p2) % 10;
      const bScore = (b1 + b2) % 10;

      setPlayerCards([p1, p2]);
      setBankerCards([b1, b2]);

      let outcome: 'player' | 'banker' | 'tie' = 'player';
      if (pScore > bScore) outcome = 'player';
      else if (bScore > pScore) outcome = 'banker';
      else outcome = 'tie';

      setIsPlaying(false);

      if (baccaratBet === outcome) {
        const mult = outcome === 'tie' ? 8 : outcome === 'banker' ? 1.95 : 2;
        const winAmt = Math.floor(betAmount * mult);
        setRoundResult(`🎉 অভিনন্দন! ${outcome.toUpperCase()} জিতেছেন ৳${winAmt.toLocaleString('en-US')}`);
        onUpdateBalance(winAmt, `${game.titleEn} ব্যাকারাত জয়`);
        if (soundEnabled) sound.playWinChime();
      } else {
        setRoundResult(`ফলাফল: ${outcome === 'player' ? 'প্লেয়ার' : outcome === 'banker' ? 'ব্যাংকার' : 'টাই'} জয়ী`);
        if (soundEnabled) sound.playCrash();
      }
    }, 1800);
  };

  // Sic Bo Shake Execution
  const handleShakeSicBo = () => {
    if (isPlaying) return;
    if (balance < betAmount) {
      if (onOpenDeposit) onOpenDeposit();
      return;
    }

    onUpdateBalance(-betAmount, `${game.titleEn} বেট`);
    setIsPlaying(true);
    setRoundResult(null);
    if (soundEnabled) sound.playClick();

    // Random Lightning Multiplier
    const isLightning = Math.random() < 0.4;
    const lightningMult = isLightning ? [2, 5, 10, 50, 100][Math.floor(Math.random() * 5)] : 1;
    setLightningMultiplier(lightningMult);

    setTimeout(() => {
      const d1 = Math.floor(Math.random() * 6) + 1;
      const d2 = Math.floor(Math.random() * 6) + 1;
      const d3 = Math.floor(Math.random() * 6) + 1;
      const sum = d1 + d2 + d3;
      const isTriple = d1 === d2 && d2 === d3;
      const isSmall = sum >= 4 && sum <= 10 && !isTriple;
      const isBig = sum >= 11 && sum <= 17 && !isTriple;

      setDiceValues([d1, d2, d3]);
      setIsPlaying(false);

      const won =
        (sicBoBet === 'small' && isSmall) ||
        (sicBoBet === 'big' && isBig) ||
        (sicBoBet === 'triple' && isTriple);

      if (won) {
        const baseMult = sicBoBet === 'triple' ? 30 : 2;
        const totalMult = baseMult * lightningMult;
        const winAmt = Math.floor(betAmount * totalMult);
        setRoundResult(`🎉 জয়ী যোগফল ${sum}! জিতেছেন ৳${winAmt.toLocaleString('en-US')} (${totalMult}x)`);
        onUpdateBalance(winAmt, `${game.titleEn} সিক বো জয়`);
        if (soundEnabled) sound.playWinChime();
      } else {
        setRoundResult(`ফলাফল: ${d1} + ${d2} + ${d3} = ${sum} (${sum > 10 ? 'BIG' : 'SMALL'})`);
        if (soundEnabled) sound.playCrash();
      }
    }, 2000);
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0e17] text-white select-none overflow-y-auto">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-3 sm:px-6 py-2.5 bg-[#111827] border-b border-gray-800 shrink-0">
        <div className="flex items-center gap-2.5">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-200 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors border border-gray-700 active:scale-95"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="font-semibold">লবিতে ফিরুন</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm sm:text-base tracking-wide text-amber-400">
              {game.titleEn}
            </span>
            <span className="text-[10px] text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              লাইভ ক্যাসিনো
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[10px] text-gray-400">ব্যালেন্স</div>
            <div className="text-xs sm:text-sm font-bold text-amber-400 font-mono tabular-nums">
              ৳ {balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <button
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              sound.enabled = !soundEnabled;
            }}
            className="p-2 text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors border border-gray-700"
            title="সাউন্ড"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-gray-500" />}
          </button>
        </div>
      </div>

      {/* Main Studio Arena */}
      <div className="flex-1 flex flex-col items-center justify-start p-3 sm:p-6 max-w-4xl mx-auto w-full">
        {/* Studio Host Header */}
        <div className="w-full bg-[#111827] border border-gray-800/90 rounded-2xl p-3 sm:p-4 mb-3 flex items-center justify-between shadow-xl">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={game.image}
                alt={game.titleEn}
                className="w-12 h-12 rounded-full object-cover border-2 border-amber-500 shadow-md"
              />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-900" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold text-gray-100 flex items-center gap-1.5">
                <span>{game.dealerName || 'লাইভ ডিলার'}</span>
                <span className="text-[10px] text-amber-400 font-mono font-normal">({game.provider})</span>
              </div>
              <div className="text-[10px] text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{game.studioName || 'Babu22 VIP Studio'} • আল্ট্রা HD ৬০ FPS</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-gray-400">সর্বোচ্চ মাল্টিপ্লায়ার</div>
            <div className="font-mono font-black text-xs sm:text-sm text-amber-400 flex items-center justify-end gap-1">
              <Flame className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
              <span>{game.maxMultiplier}</span>
            </div>
          </div>
        </div>

        {/* 1. GAME SHOW MODE (WHEEL OF FORTUNE) */}
        {isGameShow && (
          <div className="w-full bg-gradient-to-b from-[#162033] to-[#0c1322] border border-amber-500/20 rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-col items-center">
            {/* Prize Multiplier Marquee */}
            <div className="flex items-center gap-2 mb-4 overflow-x-auto max-w-full pb-1">
              {['1x (নীল)', '2x (সবুজ)', '5x (হলুদ)', '10x (বেগুনি)', 'BONUS 25x', 'MEGA 50x', 'CRAZY 100x'].map((item, idx) => (
                <span key={idx} className="text-[10px] bg-slate-900/80 border border-white/10 px-2 py-0.5 rounded text-amber-300 font-mono shrink-0">
                  {item}
                </span>
              ))}
            </div>

            {/* Giant Wheel Visual */}
            <div className="relative w-56 h-56 sm:w-64 sm:h-64 my-2 flex items-center justify-center">
              {/* Pointer at the top */}
              <div className="absolute -top-3 z-20 w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[22px] border-t-amber-400 filter drop-shadow(0 2px 4px rgba(0,0,0,0.8))" />

              {/* The Spinning Wheel */}
              <div
                className="w-full h-full rounded-full border-4 border-amber-500 shadow-2xl shadow-amber-500/20 flex items-center justify-center transition-transform duration-[4500ms] ease-out relative overflow-hidden"
                style={{
                  transform: `rotate(${wheelRotation}deg)`,
                  background:
                    'conic-gradient(#3b82f6 0deg 30deg, #10b981 30deg 60deg, #f59e0b 60deg 90deg, #ec4899 90deg 120deg, #3b82f6 120deg 150deg, #10b981 150deg 180deg, #8b5cf6 180deg 210deg, #ef4444 210deg 240deg, #3b82f6 240deg 270deg, #10b981 270deg 300deg, #f59e0b 300deg 330deg, #fbbf24 330deg 360deg)',
                }}
              >
                {/* Center Hub */}
                <div className="w-16 h-16 rounded-full bg-slate-950 border-4 border-amber-400 shadow-xl flex items-center justify-center z-10">
                  <Sparkles className="w-6 h-6 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
                </div>
              </div>
            </div>

            {/* Outcome Display */}
            {roundResult && (
              <div className="w-full text-center font-bold text-amber-300 text-xs sm:text-sm py-2 px-3 bg-slate-950/90 rounded-xl border border-amber-500/30 my-3 animate-pulse">
                {roundResult}
              </div>
            )}

            {/* Betting Selector for Wheel */}
            <div className="w-full mt-3">
              <div className="text-[11px] text-gray-300 font-semibold mb-1.5 text-center">বেট অপশন নির্বাচন করুন:</div>
              <div className="grid grid-cols-5 gap-2">
                {[
                  { id: '1x', label: '1x', payout: '১ গুণ' },
                  { id: '2x', label: '2x', payout: '২ গুণ' },
                  { id: '5x', label: '5x', payout: '৫ গুণ' },
                  { id: '10x', label: '10x', payout: '১০ গুণ' },
                  { id: 'BONUS', label: 'BONUS', payout: '২৫x+' },
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setSelectedWheelBet(opt.id)}
                    disabled={isPlaying}
                    className={`py-2 px-1 rounded-xl border font-bold text-xs flex flex-col items-center transition-all ${
                      selectedWheelBet === opt.id
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/30 scale-105'
                        : 'bg-slate-900 border-gray-800 text-gray-300 hover:border-gray-700'
                    }`}
                  >
                    <span>{opt.label}</span>
                    <span className="text-[9px] opacity-80 mt-0.5">{opt.payout}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Bet Chip and Spin Button */}
            <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 pt-4 border-t border-gray-800">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {[20, 50, 100, 250, 500, 1000].map(val => (
                  <button
                    key={val}
                    onClick={() => setBetAmount(val)}
                    disabled={isPlaying}
                    className={`px-3 py-1.5 text-xs font-mono font-bold rounded-lg transition-all ${
                      betAmount === val
                        ? 'bg-amber-500 text-slate-950 shadow-md scale-105'
                        : 'bg-slate-800 text-gray-300 hover:bg-slate-700'
                    }`}
                  >
                    ৳{val}
                  </button>
                ))}
              </div>

              <button
                onClick={handleSpinWheel}
                disabled={isPlaying}
                className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-sm rounded-xl shadow-xl shadow-amber-500/30 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Disc className={`w-4 h-4 ${isPlaying ? 'animate-spin' : ''}`} />
                <span>{isPlaying ? 'হুইল ঘুরছে...' : `স্পিন করুন (৳${betAmount})`}</span>
              </button>
            </div>
          </div>
        )}

        {/* 2. BACCARAT & LIVE CARDS MODE */}
        {isBaccarat && (
          <div className="w-full bg-gradient-to-b from-[#162033] to-[#0c1322] border border-gray-800 rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-col">
            {/* Green Felt Table */}
            <div className="bg-[#0b3824] rounded-2xl p-5 border-4 border-amber-900/60 shadow-inner flex flex-col sm:flex-row items-center justify-around gap-6 my-2">
              {/* Player Side */}
              <div className="flex flex-col items-center">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-300 mb-2">
                  প্লেয়ার (Player)
                </span>
                <div className="flex gap-2">
                  {playerCards.map((card, i) => (
                    <div
                      key={i}
                      className="w-12 h-16 sm:w-14 sm:h-20 bg-white rounded-lg border-2 border-blue-400 text-slate-900 flex items-center justify-center font-bold text-lg shadow-lg font-mono transition-transform"
                    >
                      {isPlaying ? '?' : card}
                    </div>
                  ))}
                </div>
                <span className="text-xs font-mono font-bold text-blue-200 mt-2">
                  পয়েন্ট: {isPlaying ? '...' : (playerCards[0] + playerCards[1]) % 10}
                </span>
              </div>

              {/* VS Crest */}
              <div className="w-10 h-10 rounded-full bg-amber-500 text-slate-950 font-black text-sm flex items-center justify-center shadow-lg">
                VS
              </div>

              {/* Banker Side */}
              <div className="flex flex-col items-center">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-300 mb-2">
                  ব্যাংকার (Banker)
                </span>
                <div className="flex gap-2">
                  {bankerCards.map((card, i) => (
                    <div
                      key={i}
                      className="w-12 h-16 sm:w-14 sm:h-20 bg-white rounded-lg border-2 border-rose-400 text-slate-900 flex items-center justify-center font-bold text-lg shadow-lg font-mono transition-transform"
                    >
                      {isPlaying ? '?' : card}
                    </div>
                  ))}
                </div>
                <span className="text-xs font-mono font-bold text-rose-200 mt-2">
                  পয়েন্ট: {isPlaying ? '...' : (bankerCards[0] + bankerCards[1]) % 10}
                </span>
              </div>
            </div>

            {/* Outcome Display */}
            {roundResult && (
              <div className="w-full text-center font-bold text-amber-300 text-xs sm:text-sm py-2 px-3 bg-slate-950/90 rounded-xl border border-amber-500/30 my-2 animate-pulse">
                {roundResult}
              </div>
            )}

            {/* Betting Positions */}
            <div className="grid grid-cols-3 gap-2 mt-3">
              <button
                onClick={() => setBaccaratBet('player')}
                disabled={isPlaying}
                className={`py-3 px-2 rounded-xl border font-bold text-xs flex flex-col items-center transition-all ${
                  baccaratBet === 'player'
                    ? 'bg-blue-600/40 border-blue-400 text-blue-200 ring-2 ring-blue-500'
                    : 'bg-slate-900 border-slate-800 text-gray-400 hover:border-slate-700'
                }`}
              >
                <span>প্লেয়ার (Player)</span>
                <span className="text-[10px] text-blue-300 font-mono mt-0.5">১:১ লাভ</span>
              </button>

              <button
                onClick={() => setBaccaratBet('tie')}
                disabled={isPlaying}
                className={`py-3 px-2 rounded-xl border font-bold text-xs flex flex-col items-center transition-all ${
                  baccaratBet === 'tie'
                    ? 'bg-emerald-600/40 border-emerald-400 text-emerald-200 ring-2 ring-emerald-500'
                    : 'bg-slate-900 border-slate-800 text-gray-400 hover:border-slate-700'
                }`}
              >
                <span>টাই (Tie)</span>
                <span className="text-[10px] text-emerald-300 font-mono mt-0.5">৮:১ লাভ</span>
              </button>

              <button
                onClick={() => setBaccaratBet('banker')}
                disabled={isPlaying}
                className={`py-3 px-2 rounded-xl border font-bold text-xs flex flex-col items-center transition-all ${
                  baccaratBet === 'banker'
                    ? 'bg-rose-600/40 border-rose-400 text-rose-200 ring-2 ring-rose-500'
                    : 'bg-slate-900 border-slate-800 text-gray-400 hover:border-slate-700'
                }`}
              >
                <span>ব্যাংকার (Banker)</span>
                <span className="text-[10px] text-rose-300 font-mono mt-0.5">০.৯৫:১ লাভ</span>
              </button>
            </div>

            {/* Bet Chip and Deal Button */}
            <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 pt-3 border-t border-gray-800">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {[50, 100, 250, 500, 1000].map(val => (
                  <button
                    key={val}
                    onClick={() => setBetAmount(val)}
                    disabled={isPlaying}
                    className={`px-3 py-1.5 text-xs font-mono font-bold rounded-lg transition-all ${
                      betAmount === val
                        ? 'bg-amber-500 text-slate-950 shadow-md scale-105'
                        : 'bg-slate-800 text-gray-300 hover:bg-slate-700'
                    }`}
                  >
                    ৳{val}
                  </button>
                ))}
              </div>

              <button
                onClick={handleDealBaccarat}
                disabled={isPlaying}
                className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-sm rounded-xl shadow-lg shadow-amber-500/30 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Layers className="w-4 h-4" />
                <span>{isPlaying ? 'ডিল হচ্ছে...' : `কার্ড ডিল করুন (৳${betAmount})`}</span>
              </button>
            </div>
          </div>
        )}

        {/* 3. SIC BO & BAC BO (DICE SHAKER MODE) */}
        {isSicBo && (
          <div className="w-full bg-gradient-to-b from-[#162033] to-[#0c1322] border border-gray-800 rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-col items-center">
            {/* Glass Dome Dice Chamber */}
            <div className="relative w-48 h-40 bg-gradient-to-b from-amber-950/40 via-slate-900 to-amber-950/40 rounded-3xl border-4 border-amber-500/50 shadow-2xl flex items-center justify-center gap-3 my-2 overflow-hidden">
              {/* Lightning Strike Multiplier overlay */}
              {lightningMultiplier > 1 && (
                <div className="absolute top-2 right-2 bg-amber-500 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full shadow animate-pulse">
                  ⚡ {lightningMultiplier}x লাইটনিং
                </div>
              )}
              {diceValues.map((val, idx) => (
                <div
                  key={idx}
                  className={`w-12 h-12 bg-white rounded-xl shadow-2xl border-2 border-amber-500 flex items-center justify-center text-2xl font-black text-slate-900 font-mono ${
                    isPlaying ? 'animate-bounce' : ''
                  }`}
                  style={{ animationDuration: '0.2s', animationIterationCount: isPlaying ? 'infinite' : '1' }}
                >
                  {val}
                </div>
              ))}
            </div>

            {/* Outcome Display */}
            {roundResult && (
              <div className="w-full text-center font-bold text-amber-300 text-xs sm:text-sm py-2 px-3 bg-slate-950/90 rounded-xl border border-amber-500/30 my-2 animate-pulse">
                {roundResult}
              </div>
            )}

            {/* Sic Bo Bet Placement */}
            <div className="grid grid-cols-3 gap-2 w-full mt-3">
              <button
                onClick={() => setSicBoBet('small')}
                disabled={isPlaying}
                className={`py-3 px-2 rounded-xl border font-bold text-xs flex flex-col items-center transition-all ${
                  sicBoBet === 'small'
                    ? 'bg-blue-600/40 border-blue-400 text-blue-200 ring-2 ring-blue-500'
                    : 'bg-slate-900 border-slate-800 text-gray-400 hover:border-slate-700'
                }`}
              >
                <span>SMALL (৪-১০)</span>
                <span className="text-[10px] text-blue-300 font-mono mt-0.5">২x গুণক</span>
              </button>

              <button
                onClick={() => setSicBoBet('triple')}
                disabled={isPlaying}
                className={`py-3 px-2 rounded-xl border font-bold text-xs flex flex-col items-center transition-all ${
                  sicBoBet === 'triple'
                    ? 'bg-amber-600/40 border-amber-400 text-amber-200 ring-2 ring-amber-500'
                    : 'bg-slate-900 border-slate-800 text-gray-400 hover:border-slate-700'
                }`}
              >
                <span>TRIPLE (একই পাশা)</span>
                <span className="text-[10px] text-amber-300 font-mono mt-0.5">৩০x গুণক</span>
              </button>

              <button
                onClick={() => setSicBoBet('big')}
                disabled={isPlaying}
                className={`py-3 px-2 rounded-xl border font-bold text-xs flex flex-col items-center transition-all ${
                  sicBoBet === 'big'
                    ? 'bg-rose-600/40 border-rose-400 text-rose-200 ring-2 ring-rose-500'
                    : 'bg-slate-900 border-slate-800 text-gray-400 hover:border-slate-700'
                }`}
              >
                <span>BIG (১১-১৭)</span>
                <span className="text-[10px] text-rose-300 font-mono mt-0.5">২x গুণক</span>
              </button>
            </div>

            {/* Bet Chip and Shake Button */}
            <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 pt-3 border-t border-gray-800">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {[20, 50, 100, 250, 500, 1000].map(val => (
                  <button
                    key={val}
                    onClick={() => setBetAmount(val)}
                    disabled={isPlaying}
                    className={`px-3 py-1.5 text-xs font-mono font-bold rounded-lg transition-all ${
                      betAmount === val
                        ? 'bg-amber-500 text-slate-950 shadow-md scale-105'
                        : 'bg-slate-800 text-gray-300 hover:bg-slate-700'
                    }`}
                  >
                    ৳{val}
                  </button>
                ))}
              </div>

              <button
                onClick={handleShakeSicBo}
                disabled={isPlaying}
                className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-sm rounded-xl shadow-lg shadow-amber-500/30 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isPlaying ? 'পাশা কাঁপছে...' : `পাশা ঝাঁকান (৳${betAmount})`}</span>
              </button>
            </div>
          </div>
        )}

        {/* 4. GENERAL LIVE LOBBY SUITE */}
        {isLobby && (
          <div className="w-full bg-gradient-to-b from-[#162033] to-[#0c1322] border border-gray-800 rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-col">
            <div className="text-center py-4">
              <h3 className="text-base sm:text-lg font-bold text-amber-400 mb-1">{game.titleEn} লাইভ লবি</h3>
              <p className="text-xs text-gray-400">
                আন্তর্জাতিক ভিআইপি স্টুডিওর সাথে সংযুক্ত। লাইভ টেবিল বেছে নিন।
              </p>
            </div>

            {/* Quick Switcher within Lobby */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-3">
              {[
                { title: 'স্পিড ব্যাকারাত ১', status: 'সক্রিয় (ডিলার এলেনা)', min: '৫০' },
                { title: 'ভিআইপি রুলেট ২', status: 'সক্রিয় (ডিলার সোফি)', min: '১০০' },
                { title: 'লাইটনিং ডাইস ৩', status: 'সক্রিয় (ডিলার মার্কো)', min: '২০' },
                { title: 'ড্রাগন টাইগার ৪', status: 'সক্রিয় (ডিলার চেন)', min: '৫০' },
              ].map((table, idx) => (
                <div
                  key={idx}
                  className="bg-slate-900 border border-gray-800 p-3 rounded-xl flex flex-col justify-between hover:border-amber-500/50 cursor-pointer"
                >
                  <div>
                    <div className="text-xs font-bold text-gray-200">{table.title}</div>
                    <div className="text-[10px] text-emerald-400 mt-0.5">{table.status}</div>
                  </div>
                  <div className="text-[10px] text-gray-400 mt-2 font-mono">মিনিমাম ৳ {table.min}</div>
                </div>
              ))}
            </div>

            {/* Fast play button */}
            <div className="text-center mt-3">
              <button
                onClick={handleDealBaccarat}
                disabled={isPlaying}
                className="px-8 py-3 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-amber-500/30"
              >
                লবি টেবিলে যুক্ত হোন
              </button>
            </div>
          </div>
        )}

        {/* Live Studio Chat Feed */}
        <div className="w-full bg-[#111827] border border-gray-800/80 rounded-2xl p-3 mt-4 text-xs">
          <div className="font-bold text-gray-300 text-[11px] mb-2 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>লাইভ চ্যাট ও অন্যান্য খেলোয়াড়:</span>
          </div>
          <div className="space-y-1.5 max-h-24 overflow-y-auto">
            {chatMessages.map((msg, idx) => (
              <div key={idx} className="flex items-center justify-between text-gray-400 text-[11px]">
                <div>
                  <span className="text-amber-400 font-medium mr-1.5">{msg.user}:</span>
                  <span>{msg.text}</span>
                </div>
                <span className="text-[9px] text-gray-500">{msg.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
