import React, { useState } from 'react';
import { ArrowLeft, Volume2, VolumeX, Bomb, Diamond, Sparkles } from 'lucide-react';
import { sound } from '../../utils/audio';

interface MinesGameProps {
  balance: number;
  onUpdateBalance: (amount: number, reason: string) => void;
  onClose: () => void;
  onOpenDeposit?: () => void;
}

interface TileState {
  revealed: boolean;
  isMine: boolean;
}

export const MinesGame: React.FC<MinesGameProps> = ({
  balance,
  onUpdateBalance,
  onClose,
  onOpenDeposit,
}) => {
  const [betAmount, setBetAmount] = useState<number>(50);
  const [minesCount, setMinesCount] = useState<number>(3);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [grid, setGrid] = useState<TileState[]>(() =>
    Array(25)
      .fill(null)
      .map(() => ({ revealed: false, isMine: false }))
  );
  const [diamondsFound, setDiamondsFound] = useState<number>(0);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Multiplier formula based on mines and revealed diamonds
  const getMultiplier = (mines: number, diamonds: number): number => {
    if (diamonds === 0) return 1.0;
    let mult = 1.0;
    for (let i = 0; i < diamonds; i++) {
      mult *= (25 - i) / (25 - mines - i);
    }
    return +(mult * 0.97).toFixed(2); // 97% RTP house edge
  };

  const currentMultiplier = getMultiplier(minesCount, diamondsFound);
  const nextMultiplier = getMultiplier(minesCount, diamondsFound + 1);
  const currentCashoutAmount = Math.floor(betAmount * currentMultiplier);

  const startGame = () => {
    if (balance < betAmount) {
      if (onOpenDeposit) {
        onOpenDeposit();
      }
      return;
    }

    onUpdateBalance(-betAmount, 'মাইনস গেম শুরু');
    if (soundEnabled) sound.playClick();

    // Create random mine distribution
    const mineIndices = new Set<number>();
    while (mineIndices.size < minesCount) {
      mineIndices.add(Math.floor(Math.random() * 25));
    }

    const newGrid: TileState[] = Array(25)
      .fill(null)
      .map((_, idx) => ({
        revealed: false,
        isMine: mineIndices.has(idx),
      }));

    setGrid(newGrid);
    setDiamondsFound(0);
    setIsGameOver(false);
    setIsPlaying(true);
  };

  const handleTileClick = (index: number) => {
    if (!isPlaying || grid[index].revealed || isGameOver) return;

    const tile = grid[index];
    if (tile.isMine) {
      // Exploded!
      if (soundEnabled) sound.playCrash();
      setIsGameOver(true);
      setIsPlaying(false);
      // Reveal all mines
      setGrid(prev => prev.map(t => ({ ...t, revealed: true })));
    } else {
      // Found Diamond!
      if (soundEnabled) sound.playSpinTick();
      const updatedDiamonds = diamondsFound + 1;
      setDiamondsFound(updatedDiamonds);
      setGrid(prev =>
        prev.map((t, i) => (i === index ? { ...t, revealed: true } : t))
      );

      // Check if won all non-mine tiles
      if (updatedDiamonds === 25 - minesCount) {
        // Complete clear!
        handleCashout();
      }
    }
  };

  const handleCashout = () => {
    if (!isPlaying || diamondsFound === 0) return;
    const won = Math.floor(betAmount * currentMultiplier);
    onUpdateBalance(won, `মাইনস ক্যাশআউট (${currentMultiplier}x)`);
    if (soundEnabled) sound.playWinChime();
    setIsPlaying(false);
    // Reveal rest of grid
    setGrid(prev => prev.map(t => ({ ...t, revealed: true })));
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0f19] text-white select-none overflow-y-auto">
      {/* Top Bar */}
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
            <span className="font-extrabold text-sm tracking-wider text-cyan-400">LUCKY MINES</span>
            <span className="text-[10px] text-gray-400 bg-gray-800/80 px-1.5 py-0.5 rounded">Spribe</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="text-right">
            <div className="text-[10px] text-gray-400">ব্যালেন্স</div>
            <div className="text-xs font-bold text-amber-400 font-mono tabular-nums">
              ৳ {balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </div>
          {onOpenDeposit && (
            <button
              onClick={onOpenDeposit}
              className="px-2.5 py-1 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs rounded shadow active:scale-95 transition-all whitespace-nowrap"
            >
              + ডিপোজিট
            </button>
          )}
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

      {/* Main Game Frame */}
      <div className="flex-1 flex flex-col md:flex-row items-center justify-center p-3 sm:p-6 gap-4 max-w-4xl mx-auto w-full">
        {/* 5x5 Mine Grid */}
        <div className="w-full max-w-sm aspect-square bg-[#0f172a] p-3 rounded-2xl border border-gray-800 shadow-xl grid grid-cols-5 gap-2">
          {grid.map((tile, idx) => (
            <button
              key={idx}
              onClick={() => handleTileClick(idx)}
              disabled={!isPlaying || tile.revealed}
              className={`rounded-xl flex items-center justify-center text-xl sm:text-2xl font-bold transition-all transform ${
                tile.revealed
                  ? tile.isMine
                    ? 'bg-rose-950/80 border-2 border-rose-500 text-rose-400 scale-95'
                    : 'bg-cyan-950/80 border-2 border-cyan-400 text-cyan-300 scale-95 shadow-md shadow-cyan-500/20'
                  : isPlaying
                  ? 'bg-slate-800 hover:bg-slate-700 active:scale-90 border border-slate-700'
                  : 'bg-slate-800/60 border border-slate-700/50 cursor-not-allowed'
              }`}
            >
              {tile.revealed ? (
                tile.isMine ? (
                  <Bomb className="w-7 h-7 text-rose-500 animate-bounce" />
                ) : (
                  <Diamond className="w-7 h-7 text-cyan-400 fill-cyan-400" />
                )
              ) : null}
            </button>
          ))}
        </div>

        {/* Controls Panel */}
        <div className="w-full max-w-sm flex flex-col gap-3 bg-[#111827] p-4 rounded-2xl border border-gray-800">
          <div className="flex items-center justify-between text-xs pb-2 border-b border-gray-800">
            <span className="text-gray-400">ডায়মন্ড পাওয়া গেছে:</span>
            <span className="font-mono font-bold text-cyan-400 text-sm">
              {diamondsFound} / {25 - minesCount}
            </span>
          </div>

          {isPlaying && (
            <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-[10px] text-gray-400">বর্তমান গুণক:</div>
                <div className="text-base font-black font-mono text-emerald-400">
                  {currentMultiplier.toFixed(2)}x
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-gray-400">পরবর্তী ধাপ:</div>
                <div className="text-xs font-mono text-cyan-300">{nextMultiplier.toFixed(2)}x</div>
              </div>
            </div>
          )}

          {/* Mines Count Selector */}
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">বোমার সংখ্যা (Mines):</label>
            <div className="grid grid-cols-5 gap-1.5">
              {[1, 3, 5, 10, 15].map(cnt => (
                <button
                  key={cnt}
                  onClick={() => setMinesCount(cnt)}
                  disabled={isPlaying}
                  className={`py-1.5 text-xs font-mono font-bold rounded-lg border transition-all ${
                    minesCount === cnt
                      ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                      : 'bg-slate-800/80 border-slate-700 text-gray-400 hover:text-white'
                  }`}
                >
                  {cnt}
                </button>
              ))}
            </div>
          </div>

          {/* Bet Amount */}
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">বেটের পরিমাণ (টাকা):</label>
            <div className="grid grid-cols-4 gap-1.5">
              {[20, 50, 100, 500].map(val => (
                <button
                  key={val}
                  onClick={() => setBetAmount(val)}
                  disabled={isPlaying}
                  className={`py-1.5 text-xs font-mono font-bold rounded-lg border transition-all ${
                    betAmount === val
                      ? 'bg-amber-500 text-black border-amber-500 shadow-sm'
                      : 'bg-slate-800/80 border-slate-700 text-gray-300'
                  }`}
                >
                  ৳{val}
                </button>
              ))}
            </div>
          </div>

          {/* Action Button */}
          {isPlaying ? (
            <button
              onClick={handleCashout}
              disabled={diamondsFound === 0}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-sm shadow-lg shadow-emerald-900/40 active:scale-95 transition-all flex flex-col items-center justify-center disabled:opacity-50"
            >
              <span>ক্যাশআউট করুন</span>
              <span className="text-xs font-mono font-bold mt-0.5">৳ {currentCashoutAmount}</span>
            </button>
          ) : (
            <button
              onClick={startGame}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-base shadow-lg shadow-amber-500/30 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5 text-slate-950" />
              <span>গেম শুরু করুন (৳{betAmount})</span>
            </button>
          )}

          {isGameOver && (
            <div className="text-center text-xs text-rose-400 font-semibold animate-pulse">
              💥 বোমা ফুটেছে! আবার চেষ্টা করুন।
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
