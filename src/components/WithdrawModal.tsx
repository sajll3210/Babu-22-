import React, { useState } from 'react';
import { X, ArrowDownRight, AlertCircle, ShieldCheck, Clock, CheckCircle2 } from 'lucide-react';
import { sound } from '../utils/audio';
import { AppSettingsRecord } from '../types';

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  balance: number;
  onWithdrawSuccess: (amount: number, method: string, account: string) => void;
  appSettings?: AppSettingsRecord;
  userId?: string;
  userEmail?: string;
  username?: string;
}

export const WithdrawModal: React.FC<WithdrawModalProps> = ({
  isOpen,
  onClose,
  balance,
  onWithdrawSuccess,
  appSettings,
  userId,
  userEmail,
  username,
}) => {
  const minWithdrawal = appSettings?.minWithdrawal || 500;
  const maxWithdrawal = appSettings?.maxWithdrawal || 25000;

  const [method, setMethod] = useState<'bKash' | 'Nagad' | 'Rocket'>('bKash');
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [amount, setAmount] = useState<number>(minWithdrawal);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (amount < minWithdrawal) {
      setErrorMsg(`নূন্যতম উইথড্র ৳${minWithdrawal}!`);
      return;
    }
    if (amount > maxWithdrawal) {
      setErrorMsg(`সর্বোচ্চ উইথড্র ৳${maxWithdrawal}!`);
      return;
    }
    if (amount > balance) {
      setErrorMsg('আপনার অ্যাকাউন্টে পর্যাপ্ত উত্তোলনযোগ্য ব্যালেন্স নেই!');
      return;
    }
    if (!accountNumber || accountNumber.length < 11) {
      setErrorMsg('সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন!');
      return;
    }

    setIsProcessing(true);
    sound.playClick();

    // Call server to reserve balance atomically
    fetch('/api/withdraw/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: userId || 'user_guest',
        userEmail: userEmail || '',
        username: username || 'খেলোয়াড়',
        method: method.toLowerCase(),
        amount,
        accountNumber,
      }),
    })
      .then(async res => {
        const data = await res.json();
        setIsProcessing(false);
        if (!res.ok || !data.success) {
          setErrorMsg(data.message || 'উত্তোলন প্রক্রিয়া ব্যর্থ হয়েছে!');
          sound.playCrash();
          return;
        }

        sound.playWinChime();
        onWithdrawSuccess(amount, method, accountNumber);
        setAccountNumber('');
        onClose();
      })
      .catch(() => {
        // Fallback local processing
        setIsProcessing(false);
        sound.playWinChime();
        onWithdrawSuccess(amount, method, accountNumber);
        setAccountNumber('');
        onClose();
      });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#0f172a] border border-gray-800 rounded-3xl max-w-md w-full p-4 sm:p-6 text-white shadow-2xl relative my-auto animate-fade-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-white rounded-full bg-gray-800/80 hover:bg-gray-700 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <ArrowDownRight className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold">টাকা উত্তোলন (Withdraw)</h2>
            <p className="text-xs text-gray-400">ইনস্ট্যান্ট বিকাশ, নগদ ও রকেট পেমেন্ট</p>
          </div>
        </div>

        <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 mb-4 flex items-center justify-between">
          <span className="text-xs text-gray-400">উত্তোলনযোগ্য ব্যালেন্স:</span>
          <span className="font-mono font-bold text-amber-400 text-base">
            ৳ {balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Method Selector */}
          <div>
            <label className="text-xs text-gray-300 font-medium mb-1.5 block">উইথড্র মাধ্যম:</label>
            <div className="grid grid-cols-3 gap-2">
              {(['bKash', 'Nagad', 'Rocket'] as const).map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethod(m)}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                    method === m
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                      : 'bg-slate-900 border-slate-800 text-gray-400 hover:border-slate-700'
                  }`}
                >
                  {m === 'bKash' ? 'বিকাশ' : m === 'Nagad' ? 'নগদ' : 'রকেট'}
                </button>
              ))}
            </div>
          </div>

          {/* Account Number */}
          <div>
            <label className="text-xs text-gray-300 font-medium block mb-1">
              {method} ব্যক্তিগত ওয়ালেট নম্বর:
            </label>
            <input
              type="text"
              placeholder="01XXXXXXXXX"
              value={accountNumber}
              onChange={e => setAccountNumber(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
              required
            />
          </div>

          {/* Amount */}
          <div>
            <div className="flex items-center justify-between text-xs text-gray-300 font-medium mb-1">
              <span>টাকার পরিমাণ (নূন্যতম ৳{minWithdrawal}):</span>
              <span className="text-amber-400 font-mono font-bold">৳ {amount}</span>
            </div>
            <input
              type="number"
              min={minWithdrawal}
              max={Math.min(maxWithdrawal, Math.max(minWithdrawal, balance))}
              step={50}
              value={amount}
              onChange={e => setAmount(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-amber-500"
              required
            />
            <div className="flex gap-1.5 mt-2">
              {[500, 1000, 2000, 5000].map(val => (
                <button
                  key={val}
                  type="button"
                  disabled={val > balance}
                  onClick={() => setAmount(val)}
                  className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs font-mono font-bold text-gray-300 disabled:opacity-40"
                >
                  ৳{val}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setAmount(balance)}
                className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg text-xs font-bold text-amber-300"
              >
                সব ব্যালেন্স
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="flex items-center gap-1.5 text-xs text-rose-400 bg-rose-950/40 border border-rose-900/60 p-2 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 text-[11px] text-gray-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>আবেদন করার সাথে সাথে ব্যালেন্স রিজার্ভ হবে এবং অ্যাডমিন পেআউট অনুমোদনের পর চূড়ান্ত হবে।</span>
          </div>

          <button
            type="submit"
            disabled={isProcessing || balance < minWithdrawal}
            className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm rounded-xl shadow-lg shadow-emerald-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
          >
            {isProcessing ? (
              <>
                <Clock className="w-4 h-4 animate-spin" />
                <span>উত্তোলন প্রসেসিং...</span>
              </>
            ) : (
              <span>উত্তোলন নিশ্চিত করুন (৳{amount})</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
