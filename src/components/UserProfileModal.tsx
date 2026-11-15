import React, { useState } from 'react';
import { X, Crown, Wallet, ArrowDownRight, ArrowUpRight, Clock, Award, AlertCircle, LogOut, ChevronRight } from 'lucide-react';
import { UserWallet, Transaction } from '../types';
import { sound } from '../utils/audio';
import { VIP_TIERS_CONFIG } from '../utils/vip';
import { VipTiersModal } from './VipTiersModal';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallet: UserWallet;
  transactions: Transaction[];
  onOpenDeposit: () => void;
  onOpenWithdraw: () => void;
  onAddVipPoints?: (points: number) => void;
  onLogout?: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  wallet,
  transactions,
  onOpenDeposit,
  onOpenWithdraw,
  onAddVipPoints,
  onLogout,
}) => {
  const [isVipTiersModalOpen, setIsVipTiersModalOpen] = useState(false);

  if (!isOpen) return null;

  const currentTierInfo = VIP_TIERS_CONFIG[wallet.vipTier] || VIP_TIERS_CONFIG['ব্রোঞ্জ'];
  const nextTarget = currentTierInfo.nextTierPoints || currentTierInfo.minPoints;
  const prevMin = currentTierInfo.minPoints;
  const progressPercent = currentTierInfo.nextTierPoints
    ? Math.min(
        100,
        Math.max(0, Math.round(((wallet.vipPoints - prevMin) / (nextTarget - prevMin)) * 100))
      )
    : 100;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#0f172a] border border-gray-800 rounded-3xl max-w-lg w-full p-4 sm:p-6 text-white shadow-2xl relative my-auto animate-fade-in max-h-[92vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-white rounded-full bg-gray-800/80 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Profile Card Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-gray-800">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center font-black text-xl shadow-lg">
            {wallet.username[0]}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold">{wallet.username}</h2>
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setIsVipTiersModalOpen(true);
                }}
                className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${currentTierInfo.badgeBg} ${currentTierInfo.badgeText} hover:brightness-125 cursor-pointer active:scale-95 transition-all`}
                title="সকল ভিআইপি টিয়ার ও সুবিধা দেখুন"
              >
                <Crown className="w-3 h-3 text-amber-400" />
                {wallet.vipTier} VIP
              </button>
            </div>
            <div className="text-xs text-gray-400 font-mono mt-0.5">অ্যাকাউন্ট আইডি: BABU22-88219</div>
          </div>
        </div>

        {/* VIP Tier Progress & Benefits Card */}
        <div className="my-3 p-3.5 bg-gradient-to-r from-amber-950/30 via-slate-900 to-slate-950 rounded-2xl border border-amber-500/30 shadow-inner">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-bold text-amber-300 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-400" />
              ভিআইপি রিওয়ার্ড প্রগ্রেস
            </span>
            <span className="font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/30">
              {wallet.vipPoints} পয়েন্ট
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden my-2 border border-slate-700/80">
            <div
              className="bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300 h-full rounded-full transition-all duration-500 shadow-sm shadow-amber-500/50"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-gray-300">
            <span>
              বর্তমান ধাপ: <strong className="text-amber-400 font-bold">{wallet.vipTier}</strong>
            </span>
            {currentTierInfo.nextTierPoints ? (
              <span>
                পরবর্তী টার্গেট:{' '}
                <strong className="text-amber-400 font-bold">{nextTarget} পয়েন্ট</strong>{' '}
                <span className="text-[10px] text-gray-400">
                  (বাকি {Math.max(0, nextTarget - wallet.vipPoints)})
                </span>
              </span>
            ) : (
              <span className="text-purple-400 font-bold">সর্বোচ্চ ধাপ অর্জিত!</span>
            )}
          </div>

          <div className="mt-2.5 pt-2 border-t border-gray-800/80 flex flex-col gap-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-emerald-400 font-medium">
                সুবিধা: {currentTierInfo.cashback} ({currentTierInfo.benefits})
              </span>
            </div>

            {/* Quick point addition & test buttons */}
            {onAddVipPoints && (
              <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                <span className="text-[10px] text-gray-400 font-medium">পয়েন্ট যোগ করুন:</span>
                <button
                  onClick={() => {
                    onAddVipPoints(20);
                    sound.playClick();
                  }}
                  className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-[10px] font-bold active:scale-95 transition-all"
                >
                  +২০
                </button>
                <button
                  onClick={() => {
                    onAddVipPoints(100);
                    sound.playClick();
                  }}
                  className="px-2 py-1 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 border border-yellow-500/40 rounded-lg text-[10px] font-bold active:scale-95 transition-all"
                >
                  +১০০
                </button>
                <button
                  onClick={() => {
                    const targetPoints = currentTierInfo.nextTierPoints
                      ? currentTierInfo.nextTierPoints - wallet.vipPoints
                      : 500;
                    onAddVipPoints(Math.max(25, targetPoints));
                    sound.playClick();
                  }}
                  className="px-2.5 py-1 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black rounded-lg text-[10px] shadow-sm active:scale-95 transition-all"
                >
                  পরবর্তী ধাপে উন্নীত হোন
                </button>
              </div>
            )}

            {/* Explore Full VIP Tiers & Requirements Button */}
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setIsVipTiersModalOpen(true);
              }}
              className="mt-1 w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500/15 via-yellow-500/20 to-amber-500/15 hover:from-amber-500/25 hover:to-yellow-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center justify-between transition-all group active:scale-[0.99] shadow-sm cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Crown className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
                <span className="font-extrabold text-[11px] sm:text-xs">সকল ভিআইপি টিয়ার ও এক্সক্লুসিভ সুবিধা দেখুন</span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-amber-400 font-semibold font-mono">
                <span>অন্বেষণ করুন</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>
          </div>
        </div>

        {/* Wallet Balance Cards */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
            <div className="text-[11px] text-gray-400 flex items-center gap-1">
              <Wallet className="w-3.5 h-3.5 text-amber-400" /> বর্তমান ব্যালেন্স
            </div>
            <div className="text-lg font-black text-amber-400 font-mono mt-1 tabular-nums">
              {wallet.balance > 0 ? (
                `৳ ${wallet.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
              ) : (
                <span className="text-gray-400 text-sm font-semibold">৳০.০০</span>
              )}
            </div>
            <div className="text-[9px] text-gray-500 mt-0.5">প্রকৃত ডিপোজিট ব্যালেন্স</div>
          </div>
          <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
            <div className="text-[11px] text-gray-400 flex items-center gap-1">
              <Crown className="w-3.5 h-3.5 text-emerald-400" /> মোট উইন
            </div>
            <div className="text-lg font-black text-emerald-400 font-mono mt-1 tabular-nums">
              ৳ {wallet.totalWon.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[9px] text-emerald-400/80 mt-0.5">গেম উইনিং ফান্ড</div>
          </div>
        </div>

        {/* Zero Balance Notice: Real Deposit Funds Account */}
        {wallet.balance === 0 && (
          <div className="mb-3 px-3 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-amber-300">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>গেমে অংশ নিতে ও ক্যাশ জিততে এখনই ডিপোজিট করুন</span>
            </div>
            <button
              onClick={() => {
                onClose();
                onOpenDeposit();
              }}
              className="text-[11px] font-bold text-amber-400 hover:text-amber-300 underline shrink-0"
            >
              ডিপোজিট
            </button>
          </div>
        )}

        {/* Action Buttons: Real Deposit & Withdraw Only */}
        <div className="grid grid-cols-2 gap-2.5 mb-3">
          <button
            onClick={() => {
              onClose();
              onOpenDeposit();
            }}
            className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-amber-500/20 active:scale-95"
          >
            <ArrowDownRight className="w-4 h-4 stroke-[2.5]" />
            <span>টাকা ডিপোজিট</span>
          </button>
          <button
            onClick={() => {
              onClose();
              onOpenWithdraw();
            }}
            className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-gray-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all border border-slate-700 active:scale-95"
          >
            <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
            <span>টাকা উত্তোলন</span>
          </button>
        </div>

        {/* Recent Transactions List */}
        <div className="flex-1 flex flex-col min-h-0 border-t border-gray-800 pt-3">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-300 mb-2">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-gray-400" /> সাম্প্রতিক লেনদেন
            </span>
            <span className="text-[11px] text-gray-400">সর্বমোট ({transactions.length})</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 no-scrollbar max-h-40">
            {transactions.length === 0 ? (
              <div className="text-center py-6 text-xs text-gray-500">এখনও কোনো লেনদেনের ইতিহাস নেই</div>
            ) : (
              transactions.map(tx => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-2.5 bg-slate-900/60 rounded-xl border border-slate-800 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                        tx.type === 'deposit' || tx.type === 'win'
                          ? 'bg-emerald-950 text-emerald-400'
                          : 'bg-rose-950 text-rose-400'
                      }`}
                    >
                      {tx.type === 'deposit' || tx.type === 'win' ? (
                        <ArrowDownRight className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-200">
                        {tx.note || (tx.type === 'deposit' ? 'ডিপোজিট' : tx.type === 'win' ? 'গেম জয়' : 'উত্তোলন')}
                      </div>
                      <div className="text-[10px] text-gray-400 flex items-center gap-1.5 flex-wrap">
                        <span>{tx.timestamp}</span>
                        {tx.trxId && (
                          <span className="font-mono text-[9px] text-amber-300 bg-amber-950/70 border border-amber-500/40 px-1.5 py-0.2 rounded font-bold">
                            TrxID: {tx.trxId}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div
                      className={`font-mono font-bold tabular-nums ${
                        tx.type === 'deposit' || tx.type === 'win'
                          ? 'text-emerald-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {tx.type === 'deposit' || tx.type === 'win' ? '+' : '-'} ৳{tx.amount.toLocaleString('en-US')}
                    </div>
                    <span className="text-[10px] text-emerald-400 font-medium">{tx.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Optional Logout Button */}
        {onLogout && (
          <div className="pt-3 border-t border-gray-800 mt-2">
            <button
              onClick={() => {
                onClose();
                onLogout();
              }}
              className="w-full py-2 bg-red-950/40 hover:bg-red-900/50 text-red-400 hover:text-red-300 border border-red-500/30 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>অ্যাকাউন্ট থেকে লগআউট করুন</span>
            </button>
          </div>
        )}
      </div>

      {/* Full VIP Tiers & Exclusive Benefits Modal */}
      <VipTiersModal
        isOpen={isVipTiersModalOpen}
        onClose={() => setIsVipTiersModalOpen(false)}
        wallet={wallet}
        onOpenDeposit={() => {
          setIsVipTiersModalOpen(false);
          onClose();
          onOpenDeposit();
        }}
      />
    </div>
  );
};
