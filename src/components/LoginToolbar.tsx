import React, { useState, useEffect } from 'react';
import {
  User,
  Lock,
  LogIn,
  LogOut,
  Headphones,
  Smartphone,
  Crown,
  Bell,
  Wallet,
  Plus,
  ArrowUpRight,
  RefreshCw,
  Eye,
  EyeOff,
  Clock,
  Sparkles,
  HelpCircle,
  ShieldCheck,
} from 'lucide-react';
import { UserWallet } from '../types';
import { sound } from '../utils/audio';

import { FirebaseUser } from '../firebase';

interface LoginToolbarProps {
  isLoggedIn: boolean;
  wallet: UserWallet;
  firebaseUser?: FirebaseUser | null;
  isAdmin?: boolean;
  onSignInWithGoogle?: () => Promise<void>;
  onOpenAdminPanel?: () => void;
  onRefreshBalance?: () => void;
  onOpenLogin: () => void;
  onOpenRegister: () => void;
  onOpenForgotPassword: () => void;
  onDirectLogin: (username: string, pass: string) => boolean;
  onLogout: () => void;
  onOpenDeposit: () => void;
  onOpenWithdraw: () => void;
  onOpenProfile: () => void;
  onOpenSupport: () => void;
  onOpenNotifications: () => void;
  unreadNotificationsCount?: number;
}

export const LoginToolbar: React.FC<LoginToolbarProps> = ({
  isLoggedIn,
  wallet,
  firebaseUser,
  isAdmin = false,
  onSignInWithGoogle,
  onOpenAdminPanel,
  onRefreshBalance,
  onOpenLogin,
  onOpenRegister,
  onOpenForgotPassword,
  onDirectLogin,
  onLogout,
  onOpenDeposit,
  onOpenWithdraw,
  onOpenProfile,
  onOpenSupport,
  onOpenNotifications,
  unreadNotificationsCount = 3,
}) => {
  // Inline login fields state for top toolbar
  const [toolbarUsername, setToolbarUsername] = useState('');
  const [toolbarPassword, setToolbarPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Live Bangladesh (GMT+6) Clock
  const [currentTime, setCurrentTime] = useState('');

  // Balance refreshing animation
  const [isRefreshingBalance, setIsRefreshingBalance] = useState(false);

  // Language state
  const [language, setLanguage] = useState<'bn' | 'en'>('bn');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // Format in GMT+6 (Asia/Dhaka)
      const options: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Dhaka',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      };
      try {
        const timeStr = new Intl.DateTimeFormat('en-GB', options).format(now);
        setCurrentTime(`${timeStr} (GMT+6)`);
      } catch {
        setCurrentTime(now.toLocaleTimeString() + ' (GMT+6)');
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleInlineLogin = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();
    if (!toolbarUsername.trim()) {
      setLoginError('ইউজারনেম দিন');
      onOpenLogin();
      return;
    }
    if (!toolbarPassword.trim()) {
      setLoginError('পাসওয়ার্ড দিন');
      onOpenLogin();
      return;
    }

    const success = onDirectLogin(toolbarUsername.trim(), toolbarPassword.trim());
    if (success) {
      setLoginError(null);
      setToolbarPassword('');
    }
  };

  const handleRefreshBalance = () => {
    sound.playClick();
    setIsRefreshingBalance(true);
    onRefreshBalance?.();
    setTimeout(() => {
      setIsRefreshingBalance(false);
    }, 600);
  };

  return (
    <div className="bg-[#05070d] border-b border-amber-500/20 text-gray-300 text-xs py-1 px-3 sm:px-6 lg:px-8 z-50 relative selection:bg-amber-500 selection:text-slate-950">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4 flex-wrap sm:flex-nowrap">
        {/* Left Section: Live Clock, 24/7 Live Support, App Download, Language */}
        <div className="flex items-center gap-2 sm:gap-4 text-[11px] text-gray-400 shrink-0">
          {/* Live Bangladesh Time */}
          <div className="hidden lg:flex items-center gap-1.5 font-mono text-gray-400 bg-slate-900/80 px-2 py-0.5 rounded border border-gray-800">
            <Clock className="w-3 h-3 text-amber-400" />
            <span className="tabular-nums tracking-wide">{currentTime || '15:30:00 (GMT+6)'}</span>
          </div>

          {/* 24/7 Live Customer Support Trigger */}
          <button
            onClick={() => {
              sound.playClick();
              onOpenSupport();
            }}
            className="flex items-center gap-1.5 text-amber-300 hover:text-amber-200 transition-colors bg-amber-500/10 hover:bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30 group cursor-pointer"
            title="২৪/৭ লাইভ চ্যাট সাপোর্ট"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <Headphones className="w-3 h-3 text-amber-400 group-hover:scale-110 transition-transform" />
            <span className="font-semibold text-[11px] hidden sm:inline">২৪/৭ লাইভ সাপোর্ট</span>
            <span className="font-semibold text-[11px] sm:hidden">সাপোর্ট</span>
          </button>

          {/* Mobile App Download link */}
          <button
            onClick={() => {
              sound.playClick();
              alert('Babu22 অফিসিয়াল অ্যান্ড্রয়েড APK অ্যাপ শীঘ্রই সরাসরি ডাউনলোডের জন্য উন্মুক্ত হচ্ছে!');
            }}
            className="hidden md:flex items-center gap-1 hover:text-white transition-colors text-gray-400"
            title="Babu22 মোবাইল অ্যাপ"
          >
            <Smartphone className="w-3 h-3 text-amber-400" />
            <span className="text-[11px]">অ্যাপ ডাউনলোড</span>
          </button>

          {/* Language selector toggle */}
          <div className="flex items-center bg-slate-900 rounded p-0.5 border border-slate-800 text-[10px]">
            <button
              onClick={() => setLanguage('bn')}
              className={`px-1.5 py-0.5 rounded transition-all font-bold ${
                language === 'bn'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              🇧🇩 বাংলা
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`px-1.5 py-0.5 rounded transition-all font-bold ${
                language === 'en'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              🇬🇧 EN
            </button>
          </div>
        </div>

        {/* Right Section: Toolbar Auth State */}
        <div className="flex items-center gap-2 sm:gap-3 ml-auto">
          {isLoggedIn ? (
            /* Logged In View on Toolbar */
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              {/* User greeting with VIP Tier */}
              <div
                onClick={() => {
                  sound.playClick();
                  onOpenProfile();
                }}
                className="flex items-center gap-1.5 text-xs text-gray-200 cursor-pointer hover:text-amber-400 transition-colors group"
                title="প্রোফাইল বিবরণ দেখুন"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 font-black text-[11px] flex items-center justify-center shadow">
                  {wallet.username ? wallet.username[0] : 'U'}
                </div>
                <div className="flex flex-col leading-none">
                  <span className="font-bold text-[11px] text-white group-hover:text-amber-400 flex items-center gap-1">
                    {wallet.username}
                  </span>
                  <span className="text-[9px] text-amber-400 font-medium flex items-center gap-0.5">
                    <Crown className="w-2.5 h-2.5" />
                    {wallet.vipTier} VIP
                  </span>
                </div>
              </div>

              {/* Main Balance with quick refresh */}
              <div className="flex items-center gap-1 bg-emerald-950/60 border border-emerald-500/40 rounded-lg px-2 py-0.5 shadow-sm">
                <span className="text-[10px] text-emerald-400 font-semibold hidden sm:inline">ব্যালেন্স:</span>
                <span className="font-mono font-black text-xs text-emerald-400 tabular-nums">
                  ৳ {wallet.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <button
                  onClick={handleRefreshBalance}
                  className={`p-0.5 text-emerald-400 hover:text-emerald-300 transition-transform ${
                    isRefreshingBalance ? 'animate-spin' : ''
                  }`}
                  title="ব্যালেন্স রিফ্রেশ"
                >
                  <RefreshCw className="w-2.5 h-2.5" />
                </button>
              </div>

              {/* Quick Deposit Shortcut */}
              <button
                onClick={() => {
                  sound.playClick();
                  onOpenDeposit();
                }}
                className="flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-[11px] rounded shadow transition-all active:scale-95"
                title="টাকা ডিপোজিট"
              >
                <Plus className="w-3 h-3 stroke-[3]" />
                <span className="hidden sm:inline">ডিপোজিট</span>
              </button>

              {/* Quick Withdraw Shortcut */}
              <button
                onClick={() => {
                  sound.playClick();
                  onOpenWithdraw();
                }}
                className="hidden md:flex items-center gap-1 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-gray-200 font-bold text-[11px] rounded border border-slate-700 transition-colors"
                title="উত্তোলন"
              >
                <ArrowUpRight className="w-3 h-3 text-amber-400" />
                <span>উত্তোলন</span>
              </button>

              {/* Admin Panel Shortcut */}
              {onOpenAdminPanel && (
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    onOpenAdminPanel();
                  }}
                  className={`flex items-center gap-1 px-2 py-1 text-[11px] font-bold rounded border transition-colors cursor-pointer ${
                    isAdmin
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25'
                      : 'bg-slate-800 border-amber-500/30 text-amber-300 hover:bg-slate-700'
                  }`}
                  title="অ্যাডমিন প্যানেল"
                >
                  <ShieldCheck className="w-3 h-3" />
                  <span>অ্যাডমিন</span>
                </button>
              )}

              {/* Google Sign-In Status / Trigger */}
              {!firebaseUser && onSignInWithGoogle && (
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    onSignInWithGoogle();
                  }}
                  className="hidden sm:flex items-center gap-1 px-2 py-1 bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/40 text-sky-300 text-[11px] font-bold rounded transition-colors cursor-pointer"
                  title="Google দিয়ে সাইন ইন করুন"
                >
                  <span>Google লগইন</span>
                </button>
              )}

              {/* Notification / Inbox button */}
              <button
                onClick={() => {
                  sound.playClick();
                  onOpenNotifications();
                }}
                className="relative p-1 text-gray-300 hover:text-amber-400 transition-colors"
                title="নোটিফিকেশন ও অফার"
              >
                <Bell className="w-3.5 h-3.5" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 text-white rounded-full text-[8px] font-black flex items-center justify-center animate-pulse">
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>

              {/* Logout button */}
              <button
                onClick={() => {
                  sound.playClick();
                  onLogout();
                }}
                className="flex items-center gap-1 text-[11px] font-semibold text-gray-400 hover:text-red-400 transition-colors px-1.5 py-0.5 rounded hover:bg-red-950/30"
                title="লগআউট করুন"
              >
                <LogOut className="w-3 h-3" />
                <span className="hidden sm:inline">লগআউট</span>
              </button>
            </div>
          ) : (
            /* Logged Out View on Toolbar */
            <div className="flex items-center gap-2 sm:gap-2.5">
              {/* Desktop Inline Login Toolbar Form */}
              <form onSubmit={handleInlineLogin} className="hidden xl:flex items-center gap-1.5">
                {/* Username Input */}
                <div className="relative">
                  <User className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    value={toolbarUsername}
                    onChange={(e) => setToolbarUsername(e.target.value)}
                    placeholder="ইউজারনেম / মোবাইল"
                    className="w-32 bg-slate-900 border border-gray-700 rounded px-2 py-1 pl-6 text-[11px] text-white placeholder-gray-500 focus:outline-none focus:border-amber-400 transition-colors"
                  />
                </div>

                {/* Password Input */}
                <div className="relative">
                  <Lock className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={toolbarPassword}
                    onChange={(e) => setToolbarPassword(e.target.value)}
                    placeholder="পাসওয়ার্ড"
                    className="w-28 bg-slate-900 border border-gray-700 rounded px-2 py-1 pl-6 pr-6 text-[11px] text-white placeholder-gray-500 focus:outline-none focus:border-amber-400 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff className="w-2.5 h-2.5" /> : <Eye className="w-2.5 h-2.5" />}
                  </button>
                </div>

                {/* Direct Login Button */}
                <button
                  type="submit"
                  className="px-3 py-1 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-[11px] rounded shadow-md shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                >
                  <LogIn className="w-3 h-3 stroke-[2.5]" />
                  <span>লগইন</span>
                </button>
              </form>

              {/* Forgot password link on desktop */}
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  onOpenForgotPassword();
                }}
                className="hidden 2xl:inline text-[10px] text-gray-400 hover:text-amber-400 transition-colors underline-offset-2 hover:underline"
              >
                পাসওয়ার্ড ভুলে গেছেন?
              </button>

              {/* Compact Login Button (visible on non-XL screens or as primary quick trigger) */}
              <button
                onClick={() => {
                  sound.playClick();
                  onOpenLogin();
                }}
                className="xl:hidden flex items-center gap-1 px-2.5 sm:px-3 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/40 font-bold text-[11px] rounded transition-all active:scale-95"
              >
                <LogIn className="w-3 h-3" />
                <span>লগইন</span>
              </button>

              {/* Sign Up / Registration Button */}
              <button
                onClick={() => {
                  sound.playClick();
                  onOpenRegister();
                }}
                className="flex items-center gap-1 px-3 sm:px-3.5 py-1 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-[11px] rounded shadow-sm shadow-amber-500/30 active:scale-95 transition-all"
              >
                <Sparkles className="w-3 h-3 fill-slate-950" />
                <span>রেজিস্ট্রেশন</span>
              </button>

              {/* Admin Panel Shortcut */}
              {onOpenAdminPanel && (
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    onOpenAdminPanel();
                  }}
                  className="flex items-center gap-1 px-2 py-1 bg-slate-800 hover:bg-slate-700 border border-amber-500/30 text-amber-300 text-[11px] font-bold rounded transition-colors cursor-pointer"
                  title="অ্যাডমিন প্যানেল"
                >
                  <ShieldCheck className="w-3 h-3" />
                  <span className="hidden sm:inline">অ্যাডমিন</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
