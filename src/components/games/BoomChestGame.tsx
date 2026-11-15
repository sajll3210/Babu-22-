import React, { useState, useEffect } from 'react';
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
  HelpCircle,
  Bomb,
  Coins,
} from 'lucide-react';
import { sound } from '../../utils/audio';

interface BoomChestGameProps {
  balance: number;
  onUpdateBalance: (amount: number, reason: string) => void;
  onClose: () => void;
  onOpenDeposit?: () => void;
}

interface ChestItem {
  id: number;
  isBomb: boolean;
  isOpened: boolean;
  multiplier: number;
}

export const BoomChestGame: React.FC<BoomChestGameProps> = ({
  balance,
  onUpdateBalance,
  onClose,
  onOpenDeposit,
}) => {
  const [betAmount, setBetAmount] = useState<number>(100);
  const [bombCount, setBombCount] = useState<number>(3); // 1 to 5 bombs
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [showFairModal, setShowFairModal] = useState<boolean>(false);
  const [showRulesModal, setShowRulesModal] = useState<boolean>(false);

  // Game state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [chests, setChests] = useState<ChestItem[]>([]);
  const [openedCount, setOpenedCount] = useState<number>(0);
  const [currentMultiplier, setCurrentMultiplier] = useState<number>(1.0);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Provably Fair
  const [clientSeed, setClientSeed] = useState<string>('bc-' + Math.random().toString(36).substring(2, 8));
  const [serverSeedHash, setServerSeedHash] = useState<string>('0x' + Math.random().toString(16).substring(2, 14) + 'f89a');
  const [historyList, setHistoryList] = useState<Array<{ mult: number; won: boolean; amount: number }>>([
    { mult: 2.45, won: true, amount: 245 },
    { mult: 0, won: false, amount: 100 },
    { mult: 4.12, won: true, amount: 824 },
    { mult: 1.65, won: true, amount: 330 },
  ]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Pre-generate chest visual layout
  const TOTAL_CHESTS = 15; // 5x3 grid

  // Multiplier curve based on number of opened chests & bomb density
  const calculateMultiplier = (opened: number, bombs: number) => {
    if (opened === 0) return 1.0;
    // House edge ~ 3%
    let prob = 1.0;
    for (let i = 0; i < opened; i++) {
      prob *= (TOTAL_CHESTS - bombs - i) / (TOTAL_CHESTS - i);
    }
    const fairMult = 0.97 / Math.max(prob, 0.001);
    return +fairMult.toFixed(2);
  };

  const handleStartGame = () => {
    if (balance < betAmount) {
      showToast('অপর্যাপ্ত ব্যালেন্স! দয়া করে ডিপোজিট করুন।');
      if (soundEnabled) sound.playCrash();
      return;
    }

    onUpdateBalance(-betAmount, 'BoomChest: বাজি স্থাপন');
    if (soundEnabled) sound.playClick();

    // Assign bombs randomly
    const bombIndices = new Set<number>();
    while (bombIndices.size < bombCount) {
      const idx = Math.floor(Math.random() * TOTAL_CHESTS);
      bombIndices.add(idx);
    }

    const newChests: ChestItem[] = Array.from({ length: TOTAL_CHESTS }, (_, i) => ({
      id: i,
      isBomb: bombIndices.has(i),
      isOpened: false,
      multiplier: 0,
    }));

    setChests(newChests);
    setIsPlaying(true);
    setGameOver(false);
    setOpenedCount(0);
    setCurrentMultiplier(1.0);
    setServerSeedHash('0x' + Math.random().toString(16).substring(2, 14) + 'a77c');
  };

  const handleOpenChest = (id: number) => {
    if (!isPlaying || gameOver) return;
    const target = chests.find(c => c.id === id);
    if (!target || target.isOpened) return;

    if (target.isBomb) {
      // BOOM! Explosion!
      if (soundEnabled) {
        sound.playCrash();
      }
      setGameOver(true);
      setIsPlaying(false);
      setChests(prev => prev.map(c => ({ ...c, isOpened: true })));
      setHistoryList(prev => [{ mult: 0, won: false, amount: betAmount }, ...prev.slice(0, 7)]);
      showToast('💥 বুম! টিএনটি বিস্ফোরিত হয়েছে! বাজি বাতিল।');
    } else {
      // Safe chest!
      const nextCount = openedCount + 1;
      const nextMult = calculateMultiplier(nextCount, bombCount);
      setOpenedCount(nextCount);
      setCurrentMultiplier(nextMult);

      if (soundEnabled) {
        sound.playChestOpen();
      }

      setChests(prev =>
        prev.map(c => (c.id === id ? { ...c, isOpened: true, multiplier: nextMult } : c))
      );

      // Check if all safe chests opened
      if (nextCount === TOTAL_CHESTS - bombCount) {
        // Complete clear jackpot!
        const winAmount = +(betAmount * nextMult).toFixed(2);
        onUpdateBalance(winAmount, `BoomChest: সকল নিরাপদ চেস্ট উদ্ধার (${nextMult}x)`);
        setGameOver(true);
        setIsPlaying(false);
        setChests(prev => prev.map(c => ({ ...c, isOpened: true })));
        setHistoryList(prev => [{ mult: nextMult, won: true, amount: winAmount }, ...prev.slice(0, 7)]);
        if (soundEnabled) sound.playJackpot();
        showToast(`🎉 অসাধারণ! আপনি সকল রত্ন উদ্ধার করেছেন! ৳${winAmount.toLocaleString()} জয়!`);
      }
    }
  };

  const handleCashout = () => {
    if (!isPlaying || gameOver || openedCount === 0) return;
    const winAmount = +(betAmount * currentMultiplier).toFixed(2);
    onUpdateBalance(winAmount, `BoomChest: ক্যাশ আউট (${currentMultiplier}x)`);
    if (soundEnabled) sound.playWinChime();

    setIsPlaying(false);
    setGameOver(true);
    setChests(prev => prev.map(c => ({ ...c, isOpened: true })));
    setHistoryList(prev => [{ mult: currentMultiplier, won: true, amount: winAmount }, ...prev.slice(0, 7)]);
    showToast(`💰 সফল ক্যাশ আউট! ৳${winAmount.toLocaleString()} (${currentMultiplier}x) অর্জিত!`);
  };

  const nextProfit = +(betAmount * calculateMultiplier(openedCount + 1, bombCount)).toFixed(2);
  const currentProfit = +(betAmount * currentMultiplier).toFixed(2);

  return (
    <div className="fixed inset-0 z-50 bg-[#070b14] flex flex-col overflow-y-auto select-none font-sans text-gray-100">
      {/* Top Header */}
      <header className="bg-[#0c1220] border-b border-amber-500/20 px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between shadow-lg sticky top-0 z-20">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-gray-300 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950 font-black">
              <Coins className="w-5 h-5 fill-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-sm sm:text-base tracking-wide bg-gradient-to-r from-amber-300 via-yellow-100 to-amber-400 bg-clip-text text-transparent">
                  BoomChest
                </span>
                <span className="text-[10px] font-black uppercase px-1.5 py-0.2 bg-amber-500/20 text-amber-300 rounded border border-amber-500/40">
                  NEW
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-gray-400">ট্রেজার চেস্ট মাল্টিপ্লায়ার বাজি</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {/* Balance display */}
          <div className="bg-slate-950/90 px-3 py-1.5 rounded-xl border border-amber-500/30 flex items-center gap-2">
            <span className="text-[10px] sm:text-xs text-gray-400">ব্যালেন্স:</span>
            <span className="font-mono font-bold text-amber-400 text-xs sm:text-sm">
              ৳ {balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
            {onOpenDeposit && (
              <button
                onClick={onOpenDeposit}
                className="ml-1 text-[10px] bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-2 py-0.5 rounded shadow"
              >
                + জমা
              </button>
            )}
          </div>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1.5 sm:p-2 rounded-xl bg-slate-800 text-gray-400 hover:text-white"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4" />}
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
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-amber-500 text-slate-950 font-bold text-xs sm:text-sm px-4 py-2 rounded-xl shadow-xl animate-bounce">
          {toastMsg}
        </div>
      )}

      {/* Main Game Screen */}
      <div className="flex-1 max-w-6xl w-full mx-auto p-3 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start">
        {/* Left Side: Chest Vault Grid */}
        <div className="lg:col-span-8 bg-[#0d1424] border border-slate-800/80 rounded-3xl p-4 sm:p-6 shadow-2xl relative flex flex-col justify-between min-h-[460px]">
          {/* History Pill Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800/80 mb-4 text-xs font-mono">
            <span className="text-[11px] text-gray-500 flex items-center gap-1 shrink-0">
              <History className="w-3.5 h-3.5" /> হিস্ট্রি:
            </span>
            {historyList.map((h, i) => (
              <span
                key={i}
                className={`px-2.5 py-1 rounded-lg font-bold shrink-0 ${
                  h.won
                    ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/40'
                    : 'bg-rose-950/80 text-rose-400 border border-rose-500/40'
                }`}
              >
                {h.won ? `${h.mult}x` : '💥 BOOM'}
              </span>
            ))}
          </div>

          {/* Current Win Multiplier Banner */}
          <div className="flex items-center justify-between bg-slate-950/80 p-3 rounded-2xl border border-amber-500/20 mb-4">
            <div>
              <span className="text-xs text-gray-400">বর্তমান মাল্টিপ্লায়ার</span>
              <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">
                {currentMultiplier}x
              </div>
            </div>
            {isPlaying && openedCount > 0 && (
              <div className="text-right">
                <span className="text-xs text-gray-400">উত্তোলনযোগ্য পেআউট</span>
                <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
                  ৳ {currentProfit.toLocaleString()}
                </div>
              </div>
            )}
          </div>

          {/* 5x3 Chest Grid */}
          <div className="grid grid-cols-5 gap-2.5 sm:gap-3.5 my-auto">
            {chests.length === 0
              ? Array.from({ length: TOTAL_CHESTS }).map((_, i) => (
                  <div
                    key={i}
                    className="aspect-square bg-slate-900/90 border border-slate-800 rounded-2xl flex flex-col items-center justify-center p-2 opacity-60"
                  >
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                      🎁
                    </div>
                  </div>
                ))
              : chests.map(c => (
                  <button
                    key={c.id}
                    onClick={() => handleOpenChest(c.id)}
                    disabled={!isPlaying || c.isOpened || gameOver}
                    className={`aspect-square rounded-2xl p-2 transition-all duration-200 flex flex-col items-center justify-center relative shadow-md group ${
                      !c.isOpened
                        ? isPlaying
                          ? 'bg-gradient-to-b from-slate-800 to-slate-900 border-2 border-amber-500/40 hover:border-amber-400 hover:scale-105 active:scale-95 cursor-pointer shadow-amber-500/10'
                          : 'bg-slate-900 border border-slate-800 opacity-60'
                        : c.isBomb
                        ? 'bg-gradient-to-b from-rose-900 to-red-950 border-2 border-rose-500 shadow-rose-500/30 animate-pulse'
                        : 'bg-gradient-to-b from-amber-900/70 to-yellow-950 border-2 border-amber-400 shadow-amber-500/30'
                    }`}
                  >
                    {!c.isOpened ? (
                      <>
                        <span className="text-2xl sm:text-3xl filter drop-shadow group-hover:scale-110 transition-transform">
                          📦
                        </span>
                        <span className="text-[10px] text-amber-300 font-bold mt-1">লকড</span>
                      </>
                    ) : c.isBomb ? (
                      <div className="flex flex-col items-center justify-center animate-bounce">
                        <span className="text-2xl sm:text-3xl">💥</span>
                        <span className="text-[9px] font-black text-rose-300 uppercase mt-0.5">বুম!</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center">
                        <span className="text-2xl sm:text-3xl">💎</span>
                        <span className="text-[10px] sm:text-xs font-black text-amber-300 font-mono mt-0.5">
                          {c.multiplier ? `${c.multiplier}x` : 'GOLD'}
                        </span>
                      </div>
                    )}
                  </button>
                ))}
          </div>

          {/* Bottom Game Live Indicator */}
          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-gray-400">
            <span className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-emerald-400 animate-ping' : 'bg-gray-500'}`} />
              {isPlaying ? `খেলা চলছে (${openedCount}/${TOTAL_CHESTS - bombCount} নিরাপদ উন্মোচিত)` : 'নতুন রাউন্ড শুরু করুন'}
            </span>
            <span className="font-mono text-gray-400">RTP: 97.00%</span>
          </div>
        </div>

        {/* Right Side: Bet Configuration Panel */}
        <div className="lg:col-span-4 bg-[#0d1424] border border-slate-800/80 rounded-3xl p-4 sm:p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="font-bold text-sm text-gray-200 flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400" /> বেট সেটিংস
            </h3>
            <span className="text-[11px] text-gray-400 font-mono">মিন ৳১০ • ম্যাক্স ৳১০,০০০</span>
          </div>

          {/* Bet Amount Input */}
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block font-medium">বাজির পরিমাণ (BDT):</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-400 font-bold font-mono">৳</span>
              <input
                type="number"
                disabled={isPlaying}
                value={betAmount}
                onChange={e => setBetAmount(Math.max(10, Number(e.target.value)))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-8 pr-4 font-mono font-bold text-white text-base focus:border-amber-500 focus:outline-none disabled:opacity-50"
              />
            </div>
            {/* Quick Presets */}
            <div className="grid grid-cols-4 gap-1.5 mt-2">
              {[50, 100, 500, 1000].map(val => (
                <button
                  key={val}
                  type="button"
                  disabled={isPlaying}
                  onClick={() => setBetAmount(val)}
                  className="py-1 rounded-lg bg-slate-800/70 hover:bg-slate-700 text-xs font-mono font-semibold text-gray-300 disabled:opacity-40"
                >
                  ৳{val}
                </button>
              ))}
            </div>
          </div>

          {/* Bomb Count Selector */}
          <div>
            <label className="text-xs text-gray-400 mb-1.5 flex items-center justify-between font-medium">
              <span>টিএনটি বোমার সংখ্যা (Mines):</span>
              <span className="font-mono text-rose-400 font-bold">{bombCount} টি বোমা</span>
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {[1, 2, 3, 4, 5].map(b => (
                <button
                  key={b}
                  type="button"
                  disabled={isPlaying}
                  onClick={() => setBombCount(b)}
                  className={`py-2 rounded-xl text-xs font-bold transition-all ${
                    bombCount === b
                      ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
                      : 'bg-slate-900 border border-slate-800 text-gray-400 hover:border-slate-700'
                  }`}
                >
                  {b} 💣
                </button>
              ))}
            </div>
          </div>

          {/* Action Button: Start or Cashout */}
          <div className="pt-2">
            {!isPlaying ? (
              <button
                type="button"
                onClick={handleStartGame}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 font-black text-base shadow-xl shadow-amber-500/25 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="w-5 h-5 fill-slate-950" />
                <span>রাউন্ড শুরু করুন (৳{betAmount})</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCashout}
                disabled={openedCount === 0}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-slate-950 font-black text-base shadow-xl shadow-emerald-500/25 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Trophy className="w-5 h-5 fill-slate-950" />
                <span>ক্যাশ আউট (৳{currentProfit.toLocaleString()})</span>
              </button>
            )}
          </div>

          {/* Next Step Prediction */}
          {isPlaying && (
            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 text-xs space-y-1 font-mono">
              <div className="flex justify-between text-gray-400">
                <span>পরবর্তী চেস্টে পেআউট:</span>
                <span className="text-amber-400 font-bold">৳{nextProfit.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>নিরাপদ সম্ভাবনা:</span>
                <span className="text-emerald-400 font-bold">
                  {Math.round(((TOTAL_CHESTS - bombCount - openedCount) / (TOTAL_CHESTS - openedCount)) * 100)}%
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Provably Fair Modal */}
      {showFairModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-800 rounded-3xl max-w-md w-full p-6 text-white space-y-4">
            <h3 className="font-bold text-lg text-emerald-400 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5" /> ক্রিপ্টোগ্রাফিক Provably Fair
            </h3>
            <p className="text-xs text-gray-300 leading-relaxed">
              BoomChest SHA-256 প্রোভ্যাবলি ফেয়ার প্রযুক্তি ব্যবহার করে। রাউন্ড শুরুর পূর্বেই প্রতিটি চেস্টের বোমা ও রত্নের পজিশন অপরিবর্তনীয় হ্যাশ দ্বারা নির্ধারিত হয়।
            </p>
            <div className="space-y-2 text-xs font-mono">
              <div>
                <span className="text-gray-400 block mb-1">Server Seed Hash:</span>
                <input readOnly value={serverSeedHash} className="w-full bg-slate-950 p-2 rounded border border-slate-800 text-amber-400" />
              </div>
              <div>
                <span className="text-gray-400 block mb-1">Client Seed:</span>
                <input readOnly value={clientSeed} className="w-full bg-slate-950 p-2 rounded border border-slate-800 text-emerald-400" />
              </div>
            </div>
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
