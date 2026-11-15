import React, { useState } from 'react';
import {
  X,
  User,
  Lock,
  Phone,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  Gift,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  LogIn,
  Zap,
} from 'lucide-react';
import { sound } from '../utils/audio';

export type AuthTab = 'login' | 'register' | 'forgot';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: AuthTab;
  onLoginSuccess: (username: string) => void;
  onRegisterSuccess: (username: string, bonusClaimed?: string) => void;
  onSignInWithGoogle?: () => Promise<void>;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'login',
  onLoginSuccess,
  onRegisterSuccess,
  onSignInWithGoogle,
}) => {
  const [activeTab, setActiveTab] = useState<AuthTab>(initialTab);

  // Sync initial tab when opened
  React.useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab, isOpen]);

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Register form state
  const [regUsername, setRegUsername] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [selectedBonus, setSelectedBonus] = useState<'slots' | 'live' | 'sports'>('slots');
  const [referralCode, setReferralCode] = useState('BABU22VIP');
  const [agreedTerms, setAgreedTerms] = useState(true);
  const [regError, setRegError] = useState<string | null>(null);

  // Forgot password form state
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotOtpSent, setForgotOtpSent] = useState(false);
  const [forgotOtpCode, setForgotOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotMsg, setForgotMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();
    setLoginError(null);

    const id = loginIdentifier.trim();
    if (!id) {
      setLoginError('অনুগ্রহ করে আপনার ইউজারনেম অথবা মোবাইল নম্বর লিখুন');
      return;
    }
    if (!loginPassword.trim()) {
      setLoginError('পাসওয়ার্ড প্রবেশ করুন');
      return;
    }

    // Success login
    sound.playWinChime();
    onLoginSuccess(id);
    onClose();
  };

  const handleInstantDemoLogin = () => {
    sound.playClick();
    sound.playWinChime();
    onLoginSuccess('খেলোয়াড়_২২');
    onClose();
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();
    setRegError(null);

    const user = regUsername.trim();
    const phone = regPhone.trim();

    if (!user || user.length < 3) {
      setRegError('ইউজারনেম কমপক্ষে ৩ অক্ষরের হতে হবে');
      return;
    }
    if (!phone || phone.length < 10) {
      setRegError('সঠিক ১১ সংখ্যার মোবাইল নম্বর লিখুন (উদা: 017xxxxxxxx)');
      return;
    }
    if (!regPassword || regPassword.length < 6) {
      setRegError('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setRegError('পাসওয়ার্ড মিলছে না!');
      return;
    }
    if (!agreedTerms) {
      setRegError('অনুগ্রহ করে ১৮+ এবং শর্তাবলীর সাথে সম্মতি জানান');
      return;
    }

    const bonusLabel =
      selectedBonus === 'slots'
        ? '১০০% স্লটস বোনাস'
        : selectedBonus === 'live'
        ? '৫০% লাইভ ক্যাসিনো বোনাস'
        : '১০০% স্পোর্টস বোনাস';

    sound.playWinChime();
    onRegisterSuccess(user, bonusLabel);
    onClose();
  };

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();
    if (!forgotIdentifier.trim()) {
      setForgotMsg('আপনার ফোন নম্বর লিখুন');
      return;
    }
    setForgotOtpSent(true);
    setForgotMsg('একটি ৪ ডিজিটের যাচাইকরণ কোড (OTP: 2288) পাঠানো হয়েছে!');
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();
    if (forgotOtpCode !== '2288' && forgotOtpCode.length < 4) {
      setForgotMsg('সঠিক ৪-সংখ্যার OTP কোড দিন (পরীক্ষামূলক: 2288)');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setForgotMsg('নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের দিন');
      return;
    }
    sound.playWinChime();
    setForgotMsg('পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে! এখন লগইন করুন।');
    setTimeout(() => {
      setActiveTab('login');
      setForgotOtpSent(false);
      setForgotMsg(null);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#0b101b] border border-amber-500/30 rounded-3xl max-w-md w-full p-5 sm:p-6 text-white shadow-2xl relative my-auto animate-fade-in max-h-[95vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={() => {
            sound.playClick();
            onClose();
          }}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white rounded-full bg-slate-900/80 hover:bg-slate-800 transition-colors z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Brand Header */}
        <div className="text-center pb-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5 fill-amber-400" />
            <span>Babu22 অফিসিয়াল মেম্বারশিপ পোর্টাল</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black italic tracking-wide text-white">
            <span className="text-amber-400 font-serif">Babu</span>
            <span className="text-red-500">22</span>
            <span className="text-sm font-sans font-bold text-gray-300 ml-2">লগইন ও সাইন আপ</span>
          </h2>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 bg-slate-900 p-1 rounded-2xl border border-gray-800 mb-4">
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('login');
            }}
            className={`py-2 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'login'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>লগইন (Login)</span>
          </button>
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('register');
            }}
            className={`py-2 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'register'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>রেজিস্ট্রেশন (Sign Up)</span>
          </button>
        </div>

        {/* TAB 1: LOGIN */}
        {activeTab === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-3.5 flex-1">
            {loginError && (
              <div className="p-2.5 rounded-xl bg-red-950/60 border border-red-500/50 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{loginError}</span>
              </div>
            )}

            {/* Username / Phone input */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                ইউজারনেম অথবা মোবাইল নম্বর
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder="ইউজারনেম অথবা 017xxxxxxxx"
                  className="w-full bg-slate-900 border border-gray-700 focus:border-amber-400 rounded-xl px-3 py-2.5 pl-10 text-sm text-white placeholder-gray-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Password input */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-gray-300">পাসওয়ার্ড</label>
                <button
                  type="button"
                  onClick={() => setActiveTab('forgot')}
                  className="text-[11px] text-amber-400 hover:underline"
                >
                  পাসওয়ার্ড ভুলে গেছেন?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="আপনার পাসওয়ার্ড লিখুন"
                  className="w-full bg-slate-900 border border-gray-700 focus:border-amber-400 rounded-xl px-3 py-2.5 pl-10 pr-10 text-sm text-white placeholder-gray-500 focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                >
                  {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between text-xs text-gray-400">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded bg-slate-900 border-gray-700 text-amber-500 focus:ring-0 w-3.5 h-3.5"
                />
                <span>লগইন মনে রাখুন</span>
              </label>
            </div>

            {/* Submit Login Button */}
            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-sm rounded-xl shadow-lg shadow-amber-500/25 active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4 stroke-[2.5]" />
              <span>লগইন করুন</span>
            </button>

            {/* 1-Click Google Sign-In */}
            {onSignInWithGoogle && (
              <button
                type="button"
                onClick={async () => {
                  sound.playClick();
                  await onSignInWithGoogle();
                  onClose();
                }}
                className="w-full py-2.5 px-3 bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/40 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5 text-sky-400" />
                <span>Google দিয়ে নিরাপদ সাইন ইন করুন</span>
              </button>
            )}

            {/* 1-Click Instant Demo Login */}
            <button
              type="button"
              onClick={handleInstantDemoLogin}
              className="w-full py-2 px-3 bg-slate-800/80 hover:bg-slate-700 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>১-ক্লিকে ডেমো অ্যাকাউন্ট দিয়ে প্রবেশ করুন</span>
            </button>

            {/* Switch to Register link */}
            <div className="text-center text-xs text-gray-400 pt-2 border-t border-gray-800/80">
              অ্যাকাউন্ট নেই?{' '}
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setActiveTab('register');
                }}
                className="text-amber-400 font-bold hover:underline"
              >
                এখানে বিনামূল্যে সাইন আপ করুন
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: REGISTER */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3 flex-1 overflow-y-auto pr-1 max-h-[70vh]">
            {regError && (
              <div className="p-2.5 rounded-xl bg-red-950/60 border border-red-500/50 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{regError}</span>
              </div>
            )}

            {/* Username */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">ইউজারনেম</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  placeholder="যেমন: babu_player22"
                  className="w-full bg-slate-900 border border-gray-700 focus:border-amber-400 rounded-xl px-3 py-2 pl-10 text-xs text-white placeholder-gray-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Mobile Phone (bKash/Nagad friendly) */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                মোবাইল নম্বর (বিকাশ / নগদ সক্রিয়)
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="tel"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  placeholder="017xxxxxxxx"
                  className="w-full bg-slate-900 border border-gray-700 focus:border-amber-400 rounded-xl px-3 py-2 pl-10 text-xs text-white placeholder-gray-500 focus:outline-none transition-colors"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-emerald-400 font-bold bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-500/40">
                  BDT ৳
                </span>
              </div>
            </div>

            {/* Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">পাসওয়ার্ড</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="কমপক্ষে ৬ ডিজিট"
                    className="w-full bg-slate-900 border border-gray-700 focus:border-amber-400 rounded-xl px-3 py-2 pl-9 text-xs text-white placeholder-gray-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">পাসওয়ার্ড নিশ্চিত করুন</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="পুনরায় লিখুন"
                    className="w-full bg-slate-900 border border-gray-700 focus:border-amber-400 rounded-xl px-3 py-2 pl-9 text-xs text-white placeholder-gray-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Welcome Bonus Selection */}
            <div>
              <label className="block text-xs font-semibold text-amber-300 mb-1.5 flex items-center gap-1">
                <Gift className="w-3.5 h-3.5 text-amber-400" />
                <span>ওয়েলকাম বোনাস অফার বেছে নিন:</span>
              </label>
              <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => setSelectedBonus('slots')}
                  className={`p-2 rounded-xl border text-center transition-all ${
                    selectedBonus === 'slots'
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold'
                      : 'bg-slate-900 border-gray-800 text-gray-400 hover:border-gray-700'
                  }`}
                >
                  <div>🎰 স্লটস</div>
                  <div className="text-[10px] text-amber-400 font-black">১০০% বোনাস</div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedBonus('live')}
                  className={`p-2 rounded-xl border text-center transition-all ${
                    selectedBonus === 'live'
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold'
                      : 'bg-slate-900 border-gray-800 text-gray-400 hover:border-gray-700'
                  }`}
                >
                  <div>🔴 লাইভ ক্যাসিনো</div>
                  <div className="text-[10px] text-amber-400 font-black">৫০% বোনাস</div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedBonus('sports')}
                  className={`p-2 rounded-xl border text-center transition-all ${
                    selectedBonus === 'sports'
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold'
                      : 'bg-slate-900 border-gray-800 text-gray-400 hover:border-gray-700'
                  }`}
                >
                  <div>🏏 স্পোর্টস</div>
                  <div className="text-[10px] text-amber-400 font-black">১০০% বোনাস</div>
                </button>
              </div>
            </div>

            {/* Referral / Promo code */}
            <div>
              <label className="block text-[11px] text-gray-400 mb-1">রেফারেল / প্রোমো কোড (ঐচ্ছিক)</label>
              <input
                type="text"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                placeholder="PROMO CODE"
                className="w-full bg-slate-900 border border-gray-800 focus:border-amber-400 rounded-xl px-3 py-1.5 text-xs text-amber-400 font-mono tracking-wider focus:outline-none"
              />
            </div>

            {/* Terms checkbox */}
            <label className="flex items-start gap-2 text-[11px] text-gray-400 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={agreedTerms}
                onChange={(e) => setAgreedTerms(e.target.checked)}
                className="mt-0.5 rounded bg-slate-900 border-gray-700 text-amber-500 focus:ring-0 w-3.5 h-3.5"
              />
              <span>
                আমার বয়স ১৮+ বছর এবং আমি Babu22-এর শর্তাবলী ও দায়িত্বশীল গেমিং নীতিমালা মেনে নিচ্ছি।
              </span>
            </label>

            {/* Submit Register Button */}
            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-sm rounded-xl shadow-lg shadow-amber-500/25 active:scale-98 transition-all flex items-center justify-center gap-2 mt-2"
            >
              <Sparkles className="w-4 h-4 fill-slate-950" />
              <span>রেজিস্ট্রেশন সম্পন্ন করুন</span>
            </button>

            {/* Switch to Login */}
            <div className="text-center text-xs text-gray-400 pt-2 border-t border-gray-800/80">
              ইতিমধ্যে অ্যাকাউন্ট আছে?{' '}
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setActiveTab('login');
                }}
                className="text-amber-400 font-bold hover:underline"
              >
                এখানে লগইন করুন
              </button>
            </div>
          </form>
        )}

        {/* TAB 3: FORGOT PASSWORD */}
        {activeTab === 'forgot' && (
          <div className="space-y-3.5 flex-1">
            <div className="text-center pb-2">
              <KeyRound className="w-8 h-8 text-amber-400 mx-auto mb-1" />
              <h3 className="text-sm font-bold text-white">পাসওয়ার্ড উদ্ধার করুন</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                আপনার নিবন্ধিত ফোন নম্বর লিখুন, আমরা এসএমএস এর মাধ্যমে ওটিপি কোড পাঠাব।
              </p>
            </div>

            {forgotMsg && (
              <div className="p-2.5 rounded-xl bg-amber-950/60 border border-amber-500/50 text-amber-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-amber-400" />
                <span>{forgotMsg}</span>
              </div>
            )}

            {!forgotOtpSent ? (
              <form onSubmit={handleSendOtp} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    মোবাইল নম্বর অথবা ইউজারনেম
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type="text"
                      value={forgotIdentifier}
                      onChange={(e) => setForgotIdentifier(e.target.value)}
                      placeholder="017xxxxxxxx"
                      className="w-full bg-slate-900 border border-gray-700 focus:border-amber-400 rounded-xl px-3 py-2.5 pl-10 text-sm text-white focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-sm rounded-xl shadow-lg transition-all"
                >
                  ওটিপি কোড পাঠান (Send OTP)
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    ৪-সংখ্যার OTP কোড দিন (পরীক্ষামূলক: 2288)
                  </label>
                  <input
                    type="text"
                    value={forgotOtpCode}
                    onChange={(e) => setForgotOtpCode(e.target.value)}
                    placeholder="2288"
                    className="w-full bg-slate-900 border border-gray-700 focus:border-amber-400 rounded-xl px-3 py-2 text-center font-mono text-base tracking-widest text-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">নতুন পাসওয়ার্ড</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="নতুন পাসওয়ার্ড লিখুন"
                    className="w-full bg-slate-900 border border-gray-700 focus:border-amber-400 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-sm rounded-xl shadow-lg transition-all"
                >
                  পাসওয়ার্ড রিসেট করুন
                </button>
              </form>
            )}

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setActiveTab('login')}
                className="text-xs text-amber-400 font-semibold hover:underline"
              >
                ← লগইন স্ক্রিনে ফিরে যান
              </button>
            </div>
          </div>
        )}

        {/* Trust & Security Footer Badges */}
        <div className="mt-4 pt-3 border-t border-gray-800 flex items-center justify-center gap-4 text-[10px] text-gray-400">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            256-Bit SSL সুরক্ষিত
          </span>
          <span>•</span>
          <span className="text-amber-400 font-bold">১৮+ দায়িত্বশীল গেমিং</span>
          <span>•</span>
          <span className="text-emerald-400">লাইসেন্সপ্রাপ্ত ক্যাসিনো</span>
        </div>
      </div>
    </div>
  );
};
