import React, { useState } from 'react';
import { X, Sparkles, Trophy } from 'lucide-react';
import { sound } from '../utils/audio';

interface DailySpinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRewardWon: (amount: number) => void;
}

const PRIZES = [
  { label: '৳৫০ ক্যাশ', amount: 50, color: '#f59e0b' },
  { label: '৳১০০ ক্যাশ', amount: 100, color: '#10b981' },
  { label: '৳২০ ক্যাশ', amount: 20, color: '#3b82f6' },
  { label: '৳৫০০ ক্যাশ', amount: 500, color: '#ec4899' },
  { label: '৳২০০ ক্যাশ', amount: 200, color: '#8b5cf6' },
  { label: '৳১০০০ জ্যাকপট', amount: 1000, color: '#eab308' },
];

export const DailySpinModal: React.FC<DailySpinModalProps> = ({
  isOpen,
  onClose,
  onRewardWon,
}) => {
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [rotation, setRotation] = useState<number>(0);
  const [wonPrize, setWonPrize] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSpin = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setWonPrize(null);
    sound.playClick();

    const selectedPrizeIndex = Math.floor(Math.random() * PRIZES.length);
    const sliceAngle = 360 / PRIZES.length;

    // Calculate angle so wheel arrow points to winning prize
    const targetRotation =
      rotation + 1800 + (360 - (selectedPrizeIndex * sliceAngle + sliceAngle / 2));
    setRotation(targetRotation);

    const tickInterval = setInterval(() => {
      sound.playSpinTick();
    }, 150);

    setTimeout(() => {
      clearInterval(tickInterval);
      const prize = PRIZES[selectedPrizeIndex];
      setWonPrize(prize.label);
      setIsSpinning(false);
      sound.playJackpot();
      onRewardWon(prize.amount);
    }, 3800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#0f172a] border border-amber-500/30 rounded-3xl max-w-sm w-full p-5 text-white shadow-2xl relative my-auto animate-fade-in text-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-white rounded-full bg-gray-800/80 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center justify-center gap-1.5 text-amber-400 font-bold text-sm mb-1">
          <Sparkles className="w-4 h-4" />
          <span>দৈনিক ফ্রি লাকি স্পিন</span>
          <Sparkles className="w-4 h-4" />
        </div>
        <p className="text-xs text-gray-400 mb-4">চাকা ঘুরিয়ে জিতে নিন নিশ্চিত পুরস্কার ও ভিআইপি পয়েন্ট!</p>

        {/* Wheel Container */}
        <div className="relative w-56 h-56 mx-auto my-2 flex items-center justify-center">
          {/* Wheel Pointer Arrow */}
          <div className="absolute top-0 z-20 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[18px] border-t-amber-400 filter drop-shadow" />

          {/* Rotating Wheel */}
          <div
            className="w-52 h-52 rounded-full border-4 border-amber-400 shadow-2xl overflow-hidden relative flex items-center justify-center transition-transform duration-[3800ms] ease-out"
            style={{
              transform: `rotate(${rotation}deg)`,
              background:
                'conic-gradient(#f59e0b 0deg 60deg, #10b981 60deg 120deg, #3b82f6 120deg 180deg, #ec4899 180deg 240deg, #8b5cf6 240deg 300deg, #eab308 300deg 360deg)',
            }}
          >
            {PRIZES.map((p, i) => (
              <div
                key={i}
                className="absolute text-[10px] font-bold text-white uppercase drop-shadow font-mono"
                style={{
                  transform: `rotate(${i * 60 + 30}deg) translateY(-58px)`,
                }}
              >
                {p.label}
              </div>
            ))}

            {/* Center Cap */}
            <div className="w-10 h-10 rounded-full bg-slate-950 border-2 border-amber-400 flex items-center justify-center shadow-lg">
              <Trophy className="w-4 h-4 text-amber-400" />
            </div>
          </div>
        </div>

        {wonPrize && (
          <div className="my-2 p-2 bg-amber-500/20 border border-amber-500/50 rounded-xl text-amber-300 font-bold text-xs animate-bounce">
            🎉 আপনি জিতেছেন: {wonPrize}! (+৩০ VIP পয়েন্ট)
          </div>
        )}

        <button
          onClick={handleSpin}
          disabled={isSpinning}
          className="mt-4 w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-sm rounded-xl shadow-lg shadow-amber-500/30 active:scale-95 transition-all disabled:opacity-50"
        >
          {isSpinning ? 'স্পিন হচ্ছে...' : 'হুইল স্পিন করুন (ফ্রি)'}
        </button>
      </div>
    </div>
  );
};
