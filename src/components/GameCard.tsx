import React from 'react';
import { Play } from 'lucide-react';
import { GameItem } from '../types';
import { Babu22Logo } from './Babu22Logo';

interface GameCardProps {
  game: GameItem;
  onSelectGame: (game: GameItem) => void;
}

export const GameCard: React.FC<GameCardProps> = ({ game, onSelectGame }) => {
  return (
    <div
      onClick={() => onSelectGame(game)}
      className="group relative flex flex-col bg-[#111827] rounded-xl border border-gray-800/80 hover:border-amber-500/60 transition-all duration-200 overflow-hidden cursor-pointer shadow-md hover:shadow-xl hover:shadow-amber-500/10 active:scale-[0.97]"
    >
      {/* Thumbnail Aspect Ratio 4:3 matching screenshot */}
      <div className="relative aspect-[4/3] w-full bg-slate-900 overflow-hidden">
        {game.playableType === 'babu22' ? (
          <div className="w-full h-full flex items-center justify-center p-2 bg-gradient-to-b from-[#141a29] to-[#070a12]">
            <Babu22Logo className="w-full h-full object-contain" />
          </div>
        ) : (
          <img
            src={game.image}
            alt={game.titleEn}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        )}
        {/* Fiery HOT badge on top right, exactly as shown in screenshot */}
        <div className="absolute top-1.5 right-1.5 z-10 flex items-center gap-1 bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded shadow-lg tracking-wider border border-amber-300/30">
          <span className="text-amber-200 animate-pulse text-[11px] leading-none">🔥</span>
          <span className="drop-shadow">HOT</span>
        </div>
        {/* Provider badge on top-left subtle */}
        <div className="absolute top-1.5 left-1.5 z-10 bg-black/60 backdrop-blur-xs text-[9px] font-medium text-amber-300 px-1.5 py-0.5 rounded border border-white/10">
          {game.provider}
        </div>
        {/* Overlay gradient on bottom of image for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#111827] via-transparent to-black/20 pointer-events-none" />
        {/* Play Button Trigger on Hover */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/50 transform scale-75 group-hover:scale-100 transition-transform">
            <Play className="w-5 h-5 fill-slate-950 ml-0.5" />
          </div>
        </div>
      </div>

      {/* Card Info Details */}
      <div className="p-2 sm:p-2.5 flex flex-col justify-between flex-1 bg-[#111827]">
        <div className="text-center sm:text-left">
          {/* Main title from screenshot */}
          <h3 className="font-bold text-xs sm:text-sm text-gray-100 group-hover:text-amber-400 transition-colors truncate">
            {game.titleEn}
          </h3>
          {/* Bengali translation subtitle */}
          <p className="text-[11px] text-gray-400 truncate mt-0.5">
            {game.titleBn}
          </p>
        </div>

        {/* Footer info: Min Bet & RTP */}
        <div className="mt-2 pt-1.5 border-t border-gray-800/80 flex items-center justify-between text-[10px] text-gray-400">
          <span className="text-gray-400">
            মিনিমাম: <strong className="text-amber-300 font-mono">৳{game.minBet}</strong>
          </span>
          <span className="text-emerald-400 font-mono font-medium">
            RTP {game.rtp}
          </span>
        </div>
      </div>
    </div>
  );
};
