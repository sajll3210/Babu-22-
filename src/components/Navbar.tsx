import React from 'react';
import { Wallet, Plus, User, Gift, Crown, ShieldCheck } from 'lucide-react';
import { UserWallet } from '../types';
import { BABU22_LOGO } from '../data/games';

import { Babu22Logo } from './Babu22Logo';

import { FirebaseUser } from '../firebase';

interface NavbarProps {
  wallet: UserWallet;
  activeNav: string;
  onSelectNav: (nav: string) => void;
  onOpenDeposit: () => void;
  onOpenProfile: () => void;
  onOpenDailySpin: () => void;
  onOpenAdminPanel?: () => void;
  isAdmin?: boolean;
  firebaseUser?: FirebaseUser | null;
  onSignInWithGoogle?: () => Promise<void>;
  isLoggedIn?: boolean;
  onOpenLogin?: () => void;
  onOpenRegister?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  wallet,
  activeNav,
  onSelectNav,
  onOpenDeposit,
  onOpenProfile,
  onOpenDailySpin,
  onOpenAdminPanel,
  isAdmin = false,
  firebaseUser,
  onSignInWithGoogle,
  isLoggedIn = true,
  onOpenLogin,
  onOpenRegister,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#090d16]/95 backdrop-blur-md border-b border-gray-800/80 px-4 lg:px-8 py-2.5 flex items-center justify-between transition-colors">
      {/* Brand Logo Emblem and Wordmark */}
      <div className="flex items-center gap-6">
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            onSelectNav('all');
          }}
          className="flex items-center gap-2.5 group focus:outline-none"
        >
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full p-0.5 bg-gradient-to-tr from-amber-500 via-yellow-300 to-amber-600 shadow-lg shadow-amber-500/25 group-hover:scale-105 transition-transform flex items-center justify-center overflow-hidden">
            <Babu22Logo className="w-full h-full rounded-full" />
          </div>
          <div className="flex flex-col leading-none">
            <div className="flex items-center gap-1">
              <span className="text-xl sm:text-2xl font-black italic tracking-wide text-amber-400 font-serif">Babu</span>
              <span className="text-xl sm:text-2xl font-black italic text-red-500">22</span>
              <span className="text-[9px] font-black text-slate-950 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 px-1.5 py-0.5 rounded uppercase tracking-wider ml-1 shadow-sm">
                BETTING
              </span>
            </div>
            <span className="text-[10px] text-gray-400 font-medium tracking-tight mt-0.5">
              অফিসিয়াল ক্যাসিনো পোর্টাল
            </span>
          </div>
        </a>

        {/* Navigation links (hidden on mobile, visible on desktop) */}
        <nav className="hidden md:flex items-center gap-5 text-xs font-semibold text-gray-300">
          <button
            onClick={() => onSelectNav('all')}
            className={`transition-colors whitespace-nowrap hover:text-amber-400 ${
              activeNav === 'all' ? 'text-amber-400 font-bold' : ''
            }`}
          >
            সব গেম
          </button>
          <button
            onClick={() => onSelectNav('live')}
            className={`transition-colors whitespace-nowrap hover:text-amber-400 ${
              activeNav === 'live' ? 'text-amber-400 font-bold' : ''
            }`}
          >
            লাইভ ক্যাসিনো
          </button>
          <button
            onClick={() => onSelectNav('crash')}
            className={`transition-colors whitespace-nowrap hover:text-amber-400 ${
              activeNav === 'crash' ? 'text-amber-400 font-bold' : ''
            }`}
          >
            ক্র্যাশ / এভিয়েটর
          </button>
          <button
            onClick={() => onSelectNav('slots')}
            className={`transition-colors whitespace-nowrap hover:text-amber-400 ${
              activeNav === 'slots' ? 'text-amber-400 font-bold' : ''
            }`}
          >
            স্লটস
          </button>
          <button
            onClick={() => onSelectNav('roulette')}
            className={`transition-colors whitespace-nowrap hover:text-amber-400 ${
              activeNav === 'roulette' ? 'text-amber-400 font-bold' : ''
            }`}
          >
            রুলেট
          </button>
          <button
            onClick={onOpenDailySpin}
            className="flex items-center gap-1 text-amber-300 hover:text-amber-200 transition-colors whitespace-nowrap"
          >
            <Gift className="w-3.5 h-3.5 text-amber-400" />
            <span>দৈনিক স্পিন</span>
          </button>
        </nav>
      </div>

      {/* Primary actions (VIP + Balance + Deposit + Profile) or (Login + Register) */}
      <div className="flex items-center gap-2 sm:gap-3">
        {isLoggedIn ? (
          <>
            {/* VIP Tier Badge */}
            <div
              onClick={onOpenProfile}
              className="hidden sm:flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 bg-gradient-to-r from-amber-500/10 via-yellow-400/15 to-amber-500/10 hover:from-amber-500/20 hover:to-yellow-400/25 border border-amber-500/40 text-amber-300 rounded-xl cursor-pointer transition-all active:scale-95 shadow-sm"
              title="ভিআইপি স্ট্যাটাস দেখুন"
            >
              <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="font-extrabold">{wallet.vipTier} VIP</span>
              <span className="text-[10px] text-amber-400/80 font-mono">({wallet.vipPoints} pts)</span>
            </div>

            {/* Balance Display: Real Deposited Balance Only */}
            {wallet.balance > 0 ? (
              <div
                onClick={onOpenProfile}
                className="flex items-center gap-1.5 bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/50 px-2.5 py-1.5 rounded-xl cursor-pointer transition-colors shadow-sm"
                title="আপনার ওয়ালেট ব্যালেন্স"
              >
                <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-mono font-black text-xs sm:text-sm text-emerald-400 tabular-nums">
                  ৳ {wallet.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            ) : (
              <button
                onClick={onOpenDeposit}
                className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 border border-amber-500/30 px-2.5 py-1.5 rounded-xl text-amber-400 transition-colors"
                title="ডিপোজিট করুন"
              >
                <Wallet className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs font-semibold">
                  ব্যালেন্স: <strong className="text-gray-400 font-normal">৳০.০০</strong>
                </span>
              </button>
            )}

            {/* Deposit Button */}
            <button
              onClick={onOpenDeposit}
              className="flex items-center gap-1 px-3 sm:px-4 py-2 text-xs sm:text-sm font-black text-slate-950 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 rounded-xl shadow-md shadow-amber-500/20 active:scale-95 transition-all whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>ডিপোজিট</span>
            </button>

            {/* Admin Panel Button */}
            {onOpenAdminPanel && (
              <button
                type="button"
                onClick={onOpenAdminPanel}
                className={`hidden sm:flex items-center gap-1 px-2.5 py-2 text-xs font-bold rounded-xl border transition-all active:scale-95 whitespace-nowrap cursor-pointer ${
                  isAdmin
                    ? 'bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-500/50 text-emerald-300'
                    : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-amber-300'
                }`}
                title="সিকিউর অ্যাডমিন প্যানেল"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>অ্যাডমিন প্যানেল</span>
              </button>
            )}

            {/* Google Sign-In Quick Button if not authenticated with Google */}
            {!firebaseUser && onSignInWithGoogle && (
              <button
                type="button"
                onClick={onSignInWithGoogle}
                className="hidden lg:flex items-center gap-1 px-2.5 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 border border-sky-500/40 text-sky-300 rounded-xl transition-all whitespace-nowrap cursor-pointer"
                title="Google দিয়ে সাইন ইন করুন"
              >
                <span>Google সাইন ইন</span>
              </button>
            )}

            {/* Profile Avatar Trigger */}
            <button
              onClick={onOpenProfile}
              className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-gray-300 transition-colors"
              title="প্রোফাইল"
            >
              <User className="w-4 h-4" />
            </button>
          </>
        ) : (
          <>
            {/* Admin Panel Button */}
            {onOpenAdminPanel && (
              <button
                type="button"
                onClick={onOpenAdminPanel}
                className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-300 rounded-xl transition-all whitespace-nowrap cursor-pointer"
                title="সিকিউর অ্যাডমিন প্যানেল"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>অ্যাডমিন প্যানেল</span>
              </button>
            )}
            {/* Logged Out Buttons */}
            <button
              onClick={onOpenLogin}
              className="flex items-center gap-1 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-bold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 rounded-xl transition-all active:scale-95 whitespace-nowrap"
            >
              <span>লগইন</span>
            </button>
            <button
              onClick={onOpenRegister}
              className="flex items-center gap-1 px-3.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-black text-slate-950 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 rounded-xl shadow-md shadow-amber-500/20 active:scale-95 transition-all whitespace-nowrap"
            >
              <span>রেজিস্ট্রেশন</span>
            </button>
          </>
        )}
      </div>
    </header>
  );
};
