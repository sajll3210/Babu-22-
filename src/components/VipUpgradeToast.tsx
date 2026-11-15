import React, { useEffect, useState } from 'react';
import { Crown, Sparkles, X, ChevronRight, Gift } from 'lucide-react';
import { VIPTier, VIP_TIERS_CONFIG } from '../utils/vip';
import { sound } from '../utils/audio';

interface VipUpgradeToastProps {
  newTier: VIPTier;
  points: number;
  prevTier?: VIPTier;
  username?: string;
  onClose: () => void;
  onOpenProfile: () => void;
}

export const VipUpgradeToast: React.FC<VipUpgradeToastProps> = ({
  newTier,
  points,
  prevTier,
  username = 'খেলোয়াড়',
  onClose,
  onOpenProfile,
}) => {
  const config = VIP_TIERS_CONFIG[newTier] || VIP_TIERS_CONFIG['ব্রোঞ্জ'];
  const [progress, setProgress] = useState<number>(100);

  // Play celebration sound upon mount
  useEffect(() => {
    sound.playJackpot();
    const duration = 7000;
    const interval = 50;
    const decrement = (interval / duration) * 100;
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev <= decrement) {
          clearInterval(timer);
          onClose();
          return 0;
        }
        return prev - decrement;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [newTier, onClose]);

  // Color schemes customized per VIP Tier
  const tierThemes: Record<
    VIPTier,
    {
      gradient: string;
      glow: string;
      border: string;
      badgeBg: string;
      iconBg: string;
      textAccent: string;
      ringColor: string;
    }
  > = {
    'ব্রোঞ্জ': {
      gradient: 'from-[#1c120c] via-[#2a1b12] to-[#120a06]',
      glow: 'shadow-amber-900/50',
      border: 'border-amber-700/60',
      badgeBg: 'bg-amber-900/60 text-amber-300 border-amber-600',
      iconBg: 'from-amber-700 to-amber-900 text-amber-200',
      textAccent: 'text-amber-400',
      ringColor: 'ring-amber-500/30',
    },
    'সিলভার': {
      gradient: 'from-[#0e1726] via-[#1e293b] to-[#0f172a]',
      glow: 'shadow-slate-500/40',
      border: 'border-slate-400/70',
      badgeBg: 'bg-slate-700/70 text-slate-200 border-slate-400',
      iconBg: 'from-slate-400 to-slate-600 text-slate-950',
      textAccent: 'text-slate-200',
      ringColor: 'ring-slate-400/40',
    },
    'গোল্ড': {
      gradient: 'from-[#1a1202] via-[#2e1f05] to-[#130d02]',
      glow: 'shadow-amber-500/50',
      border: 'border-amber-400',
      badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-400/60',
      iconBg: 'from-amber-400 via-yellow-300 to-amber-600 text-slate-950',
      textAccent: 'text-amber-400',
      ringColor: 'ring-amber-400/50',
    },
    'প্লাটিনাম': {
      gradient: 'from-[#031b26] via-[#082f49] to-[#02131d]',
      glow: 'shadow-cyan-500/50',
      border: 'border-cyan-400',
      badgeBg: 'bg-cyan-500/20 text-cyan-200 border-cyan-400/60',
      iconBg: 'from-cyan-400 via-teal-300 to-cyan-600 text-slate-950',
      textAccent: 'text-cyan-300',
      ringColor: 'ring-cyan-400/50',
    },
    'ডায়মন্ড': {
      gradient: 'from-[#1e0a29] via-[#3b0764] to-[#14051c]',
      glow: 'shadow-purple-500/60',
      border: 'border-fuchsia-400',
      badgeBg: 'bg-purple-500/25 text-fuchsia-200 border-fuchsia-400/60',
      iconBg: 'from-fuchsia-400 via-pink-400 to-purple-600 text-white',
      textAccent: 'text-fuchsia-300',
      ringColor: 'ring-purple-400/50',
    },
  };

  const theme = tierThemes[newTier] || tierThemes['ব্রোঞ্জ'];

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-full max-w-lg px-3 transition-all duration-300 animate-slide-down pointer-events-auto"
    >
      <div
        className={`relative bg-gradient-to-br ${theme.gradient} border-2 ${theme.border} rounded-3xl p-4 sm:p-5 shadow-2xl ${theme.glow} text-white overflow-hidden ring-4 ${theme.ringColor}`}
      >
        {/* Ambient background glows */}
        <div className="absolute -top-16 -left-16 w-36 h-36 bg-amber-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-36 h-36 bg-fuchsia-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Decorative corner sparkles */}
        <div className="absolute top-2 left-3 flex items-center gap-1 opacity-70 pointer-events-none">
          <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-widest text-amber-300/80">
            VIP CLUB
          </span>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-white rounded-full bg-slate-900/80 hover:bg-slate-800 transition-colors z-20"
          aria-label="বন্ধ করুন"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3.5 sm:gap-4 mt-2">
          {/* Animated Tier Crown Emblem */}
          <div className="relative shrink-0">
            <div
              className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr ${theme.iconBg} flex items-center justify-center shadow-lg border border-white/30 transform hover:rotate-6 transition-transform`}
            >
              <Crown className="w-8 h-8 sm:w-9 sm:h-9 stroke-[2.2] drop-shadow-md" />
            </div>
            <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500 border border-white/50" />
            </span>
          </div>

          {/* Details Content */}
          <div className="flex-1 pr-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${theme.badgeBg} flex items-center gap-1`}
              >
                <Sparkles className="w-3 h-3" />
                ভিআইপি আপগ্রেড!
              </span>
              {prevTier && (
                <span className="text-[11px] text-gray-400">
                  {prevTier} থেকে <strong className={theme.textAccent}>{newTier}</strong>
                </span>
              )}
            </div>

            {/* Congratulatory Title */}
            <h3 className="text-base sm:text-lg font-black text-white mt-1 leading-snug">
              অভিনন্দন {username}! আপনি এখন{' '}
              <span className={`${theme.textAccent} font-extrabold underline decoration-current underline-offset-2`}>
                {newTier} VIP
              </span>{' '}
              সদস্য!
            </h3>

            {/* Milestone explanation */}
            <p className="text-xs text-gray-200 mt-1 leading-relaxed">
              আপনার মোট ভিআইপি পয়েন্ট <strong className="text-amber-400 font-mono font-bold">{points}</strong> হয়েছে।
            </p>

            {/* Unlocked Benefit Feature */}
            <div className="mt-2.5 p-2 bg-slate-950/70 border border-white/10 rounded-xl flex items-center gap-2.5 text-xs">
              <Gift className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="truncate">
                <span className="text-gray-400 text-[10px] block">আনলক সুবিধা:</span>
                <span className="font-bold text-amber-300 truncate block">{config.benefits}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-3.5 flex items-center gap-2">
              <button
                onClick={() => {
                  onClose();
                  onOpenProfile();
                  sound.playClick();
                }}
                className={`px-3.5 py-1.5 bg-gradient-to-r ${theme.iconBg} hover:opacity-95 text-slate-950 font-black text-xs rounded-xl shadow-md active:scale-95 transition-all flex items-center gap-1`}
              >
                <span>সুবিধা দেখুন</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  onClose();
                  sound.playClick();
                }}
                className="px-3 py-1.5 bg-slate-800/90 hover:bg-slate-700 text-gray-300 hover:text-white font-semibold text-xs rounded-xl transition-colors border border-slate-700"
              >
                ধন্যবাদ
              </button>
            </div>
          </div>
        </div>

        {/* Dismissal progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/40">
          <div
            className={`h-full bg-gradient-to-r ${theme.iconBg} transition-all duration-75 ease-linear`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};
