import React, { useState } from 'react';
import {
  X,
  Crown,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  TrendingUp,
  Gift,
  Zap,
  Award,
  ChevronRight,
  Headphones,
  Coins,
} from 'lucide-react';
import { VIPTier, UserWallet } from '../types';
import { VIP_TIERS_CONFIG, TIER_ORDER, getTierRank } from '../utils/vip';
import { sound } from '../utils/audio';

interface VipTiersModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallet: UserWallet;
  onOpenDeposit?: () => void;
}

interface TierVisualTheme {
  gradient: string;
  borderGlow: string;
  badgeBg: string;
  badgeColor: string;
  iconColor: string;
  pillBg: string;
  headerAccent: string;
  pointsRange: string;
  withdrawalSpeed: string;
  maxWithdrawal: string;
  vipManager: string;
}

const TIER_THEMES: Record<VIPTier, TierVisualTheme> = {
  'ব্রোঞ্জ': {
    gradient: 'from-amber-950/60 via-slate-900/90 to-slate-950',
    borderGlow: 'border-amber-700/50 hover:border-amber-600',
    badgeBg: 'bg-amber-900/40 border border-amber-700/60',
    badgeColor: 'text-amber-400',
    iconColor: 'text-amber-500',
    pillBg: 'bg-amber-900/30 text-amber-300 border-amber-700/50',
    headerAccent: 'text-amber-400',
    pointsRange: '০ - ৯৯ পয়েন্ট',
    withdrawalSpeed: 'সাধারণ স্পিড (১৫-৩০ মিনিট)',
    maxWithdrawal: '৳২৫,০০০ / দৈনিক',
    vipManager: 'স্ট্যান্ডার্ড সাপোর্ট',
  },
  'সিলভার': {
    gradient: 'from-slate-800/60 via-slate-900/90 to-slate-950',
    borderGlow: 'border-slate-500/50 hover:border-slate-400',
    badgeBg: 'bg-slate-700/40 border border-slate-400/60',
    badgeColor: 'text-slate-200',
    iconColor: 'text-slate-300',
    pillBg: 'bg-slate-800/60 text-slate-200 border-slate-600/50',
    headerAccent: 'text-slate-300',
    pointsRange: '১০০ - ৪৯৯ পয়েন্ট',
    withdrawalSpeed: 'এক্সপ্রেস স্পিড (১০-১৫ মিনিট)',
    maxWithdrawal: '৳৫০,০০০ / দৈনিক',
    vipManager: 'অগ্রাধিকার চ্যাট সাপোর্ট',
  },
  'গোল্ড': {
    gradient: 'from-yellow-950/60 via-slate-900/90 to-slate-950',
    borderGlow: 'border-amber-500/60 hover:border-amber-400',
    badgeBg: 'bg-amber-500/20 border border-amber-500/60',
    badgeColor: 'text-amber-300',
    iconColor: 'text-amber-400',
    pillBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    headerAccent: 'text-amber-300',
    pointsRange: '৫০০ - ১,৪৯৯ পয়েন্ট',
    withdrawalSpeed: 'ইনস্ট্যান্ট স্পিড (৩-৫ মিনিট)',
    maxWithdrawal: '৳১,৫০,০০০ / দৈনিক',
    vipManager: 'ডেডিকেটেড অ্যাকাউন্ট ম্যানেজার',
  },
  'প্লাটিনাম': {
    gradient: 'from-cyan-950/60 via-slate-900/90 to-slate-950',
    borderGlow: 'border-cyan-500/60 hover:border-cyan-400',
    badgeBg: 'bg-cyan-500/20 border border-cyan-400/60',
    badgeColor: 'text-cyan-300',
    iconColor: 'text-cyan-400',
    pillBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    headerAccent: 'text-cyan-300',
    pointsRange: '১,৫০০ - ৩,৯৯৯ পয়েন্ট',
    withdrawalSpeed: 'আল্ট্রা-ফাস্ট (১-৩ মিনিট)',
    maxWithdrawal: '৳৫,০০,০০০ / দৈনিক',
    vipManager: 'ব্যক্তিগত ভিআইপি কনসিয়ার্জ',
  },
  'ডায়মন্ড': {
    gradient: 'from-purple-950/70 via-slate-900/90 to-slate-950',
    borderGlow: 'border-purple-500/70 hover:border-purple-400',
    badgeBg: 'bg-purple-500/20 border border-purple-400/60',
    badgeColor: 'text-purple-300',
    iconColor: 'text-purple-400',
    pillBg: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    headerAccent: 'text-purple-300',
    pointsRange: '৪,০০০+ পয়েন্ট (সর্বোচ্চ)',
    withdrawalSpeed: 'রিয়েল-টাইম প্রায়োরিটি চ্যানেল',
    maxWithdrawal: 'আনলিমিটেড নো-ক্যাপ ক্যাশআউট',
    vipManager: '২৪/৭ ডিরেক্ট ভিআইপি হটলাইন ও ম্যানেজার',
  },
};

export const VipTiersModal: React.FC<VipTiersModalProps> = ({
  isOpen,
  onClose,
  wallet,
  onOpenDeposit,
}) => {
  const [selectedTier, setSelectedTier] = useState<VIPTier>(wallet.vipTier || 'ব্রোঞ্জ');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  if (!isOpen) return null;

  const currentRank = getTierRank(wallet.vipTier);
  const currentTierConfig = VIP_TIERS_CONFIG[wallet.vipTier] || VIP_TIERS_CONFIG['ব্রোঞ্জ'];
  const nextTierPoints = currentTierConfig.nextTierPoints;
  const pointsToNext = nextTierPoints ? Math.max(0, nextTierPoints - wallet.vipPoints) : 0;

  const handleTierSelect = (tier: VIPTier) => {
    setSelectedTier(tier);
    sound.playClick();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in font-sans">
      <div className="bg-[#0b101f] border border-slate-800 rounded-3xl max-w-4xl w-full p-4 sm:p-6 text-white shadow-2xl relative my-auto max-h-[92vh] flex flex-col overflow-hidden">
        {/* Glow Accents */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 relative z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20">
              <Crown className="w-6 h-6 fill-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-xl font-black tracking-wide text-white flex items-center gap-1.5">
                  Babu22 VIP এলিট ক্লাব
                </h2>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-gradient-to-r from-amber-500/20 to-purple-500/20 text-amber-300 rounded-full border border-amber-500/30 font-mono">
                  ৫টি রিওয়ার্ড টিয়ার
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                প্রতিটি বাজি ও ডিপোজিটে পয়েন্ট অর্জন করুন এবং আনলক করুন এক্সক্লুসিভ ক্যাশব্যাক ও ভিআইপি সুবিধা
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-2 text-gray-400 hover:text-white rounded-full bg-slate-900 border border-slate-800 hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Modal Content */}
        <div className="overflow-y-auto flex-1 pr-1 space-y-4 my-3 relative z-10">
          {/* User's Current Status Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-purple-950/40 border border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-slate-950 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">আপনার বর্তমান ভিআইপি লেভেল:</span>
                  <span
                    className={`text-xs font-black px-2 py-0.5 rounded-full border ${currentTierConfig.badgeBg} ${currentTierConfig.badgeText}`}
                  >
                    {wallet.vipTier} VIP
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-lg sm:text-xl font-mono font-black text-amber-300">
                    {wallet.vipPoints.toLocaleString()} পয়েন্ট
                  </span>
                  <span className="text-xs text-emerald-400 font-bold">
                    ({currentTierConfig.cashback})
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {nextTierPoints ? (
                <div className="text-xs text-right hidden sm:block">
                  <div className="text-gray-400">পরবর্তী ধাপে যেতে বাকি:</div>
                  <div className="font-mono font-bold text-amber-300">{pointsToNext} পয়েন্ট</div>
                </div>
              ) : (
                <div className="text-xs text-purple-300 font-bold hidden sm:block">
                  🎉 সর্বোচ্চ এলিট ধাপে অবস্থান করছেন!
                </div>
              )}

              {onOpenDeposit && (
                <button
                  onClick={() => {
                    sound.playClick();
                    onClose();
                    onOpenDeposit();
                  }}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 active:scale-95 transition flex items-center gap-1.5 shrink-0"
                >
                  <Coins className="w-4 h-4" />
                  <span>পয়েন্ট বাড়াতে ডিপোজিট</span>
                </button>
              )}
            </div>
          </div>

          {/* View Toggle Tabs */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-xl">
              <button
                onClick={() => {
                  sound.playClick();
                  setViewMode('cards');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  viewMode === 'cards'
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                কার্ড ভিউ (বিস্তারিত)
              </button>
              <button
                onClick={() => {
                  sound.playClick();
                  setViewMode('table');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  viewMode === 'table'
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                তুলনামূলক টেবিল
              </button>
            </div>

            <div className="text-[11px] text-gray-400 hidden sm:flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>প্রতি ২০ টাকা বাজি / ডিপোজিটে ১ পয়েন্ট অর্জিত হয়</span>
            </div>
          </div>

          {/* MODE 1: CARDS VIEW */}
          {viewMode === 'cards' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {TIER_ORDER.map(tierName => {
                const config = VIP_TIERS_CONFIG[tierName];
                const theme = TIER_THEMES[tierName];
                const rank = getTierRank(tierName);
                const isCurrent = tierName === wallet.vipTier;
                const isUnlocked = rank <= currentRank;
                const isSelected = selectedTier === tierName;

                return (
                  <div
                    key={tierName}
                    onClick={() => handleTierSelect(tierName)}
                    className={`rounded-2xl p-4 sm:p-5 flex flex-col justify-between cursor-pointer transition-all duration-200 border-2 relative overflow-hidden bg-gradient-to-b ${
                      theme.gradient
                    } ${
                      isSelected
                        ? `${theme.borderGlow} ring-2 ring-amber-400/30 scale-[1.01]`
                        : isCurrent
                        ? 'border-amber-400 shadow-md shadow-amber-400/20'
                        : 'border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    {/* Active / Current Badge */}
                    {isCurrent && (
                      <span className="absolute top-3 right-3 text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 shadow flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        বর্তমান ধাপ
                      </span>
                    )}

                    {!isCurrent && isUnlocked && (
                      <span className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        অর্জিত
                      </span>
                    )}

                    {!isUnlocked && (
                      <span className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-gray-400 border border-slate-700 flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        লকড
                      </span>
                    )}

                    <div>
                      {/* Tier Name & Badge */}
                      <div className="flex items-center gap-2 mb-2">
                        <Crown className={`w-5 h-5 ${theme.iconColor}`} />
                        <h3 className={`text-base font-black ${theme.headerAccent}`}>{tierName} VIP</h3>
                      </div>

                      {/* Requirement & Points Range */}
                      <div className="mb-3 space-y-1">
                        <div className="text-[11px] text-gray-400">যোগ্যতার পয়েন্ট:</div>
                        <div className="text-xs font-mono font-bold text-white bg-slate-950/70 px-2.5 py-1 rounded-lg border border-slate-800 inline-block">
                          {theme.pointsRange}
                        </div>
                      </div>

                      {/* Cashback Highlight Box */}
                      <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 mb-3 flex items-center justify-between">
                        <span className="text-[11px] text-gray-400">ক্যাশব্যাক রেট:</span>
                        <span className="font-mono font-black text-xs sm:text-sm text-emerald-400">
                          {config.cashback}
                        </span>
                      </div>

                      {/* Exclusive Perks List */}
                      <div className="space-y-2 mb-4">
                        <div className="text-[11px] font-bold text-gray-300 flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-amber-400" />
                          এক্সক্লুসিভ সুবিধাসমূহ:
                        </div>
                        <ul className="space-y-1.5 text-xs text-gray-300">
                          {config.perks.map((perk, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                              <span className="leading-tight">{perk}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Footer Limits */}
                    <div className="pt-3 border-t border-slate-800/80 text-[11px] text-gray-400 space-y-1">
                      <div className="flex justify-between">
                        <span>উত্তোলন লিমিট:</span>
                        <span className="font-mono font-bold text-gray-200">{theme.maxWithdrawal}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>উত্তোলন গতি:</span>
                        <span className="text-gray-300">{theme.withdrawalSpeed}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* MODE 2: COMPARISON TABLE VIEW */}
          {viewMode === 'table' && (
            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/80">
              <table className="w-full text-left text-xs text-gray-300 min-w-[620px]">
                <thead className="bg-slate-900/90 text-gray-400 border-b border-slate-800 font-bold text-[11px]">
                  <tr>
                    <th className="py-3 px-4">ভিআইপি ধাপ</th>
                    <th className="py-3 px-4">পয়েন্ট প্রয়োজন</th>
                    <th className="py-3 px-4">ডেইলি ক্যাশব্যাক</th>
                    <th className="py-3 px-4">উত্তোলন লিমিট</th>
                    <th className="py-3 px-4">ক্যাশআউট গতি</th>
                    <th className="py-3 px-4">ভিআইপি সুবিধা</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {TIER_ORDER.map(tierName => {
                    const config = VIP_TIERS_CONFIG[tierName];
                    const theme = TIER_THEMES[tierName];
                    const isCurrent = tierName === wallet.vipTier;

                    return (
                      <tr
                        key={tierName}
                        className={`transition-colors ${
                          isCurrent
                            ? 'bg-amber-500/10 font-bold'
                            : 'hover:bg-slate-900/60'
                        }`}
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Crown className={`w-4 h-4 ${theme.iconColor}`} />
                            <span className={theme.headerAccent}>{tierName}</span>
                            {isCurrent && (
                              <span className="text-[9px] bg-amber-500 text-slate-950 font-black px-1.5 py-0.5 rounded">
                                বর্তমান
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono font-semibold text-white">
                          {theme.pointsRange}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                          {config.cashback}
                        </td>
                        <td className="py-3 px-4 font-mono text-gray-200">
                          {theme.maxWithdrawal}
                        </td>
                        <td className="py-3 px-4 text-gray-300">
                          {theme.withdrawalSpeed}
                        </td>
                        <td className="py-3 px-4 text-gray-300 text-[11px]">
                          {config.benefits}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* How to Earn Points Guide */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <h4 className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              ভিআইপি পয়েন্ট কীভাবে অর্জন করবেন?
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-gray-300 pt-1">
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="font-bold text-white mb-0.5">১. রিয়েল ক্যাশ ডিপোজিট</div>
                <div className="text-[11px] text-gray-400">
                  প্রতি ২০ টাকা ডিপোজিটে ১টি ভিআইপি রিওয়ার্ড পয়েন্ট স্বয়ংক্রিয়ভাবে যুক্ত হয়।
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="font-bold text-white mb-0.5">২. ক্যাসিনো ও ক্র্যাশ বেটিং</div>
                <div className="text-[11px] text-gray-400">
                  স্লট, এভিয়েটর, রুলেট বা লাইভ টেবিল গেমে বাজি ধরে অতিরিক্ত পয়েন্ট অর্জন করুন।
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="font-bold text-white mb-0.5">৩. অটো-আপগ্রেড সিস্টেম</div>
                <div className="text-[11px] text-gray-400">
                  টার্গেট পয়েন্টে পৌঁছানোর সাথে সাথেই আপনার অ্যাকাউন্ট উচ্চতর লেভেলে আপগ্রেড হবে।
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between relative z-10 shrink-0">
          <div className="text-xs text-gray-400">
            বর্তমানে আপনি <span className="font-bold text-amber-300">{wallet.vipTier}</span> ভিআইপিতে আছেন।
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              className="py-2 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-gray-300 font-bold text-xs border border-slate-800 transition"
            >
              বন্ধ করুন
            </button>
            {onOpenDeposit && (
              <button
                onClick={() => {
                  sound.playClick();
                  onClose();
                  onOpenDeposit();
                }}
                className="py-2 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 active:scale-95 transition flex items-center gap-1.5"
              >
                <span>ডিপোজিট করুন</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
