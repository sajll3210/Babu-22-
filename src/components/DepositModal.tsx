import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  Clock,
  CheckCircle2,
  XCircle,
  LogIn,
} from 'lucide-react';
import { PaymentMethodType, AppSettingsRecord } from '../types';
import { FirebaseUser } from '../firebase';
import { PostgresDepositRecord } from './AdminPanelModal';
import { sound } from '../utils/audio';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  firebaseUser: FirebaseUser | null;
  onSignInWithGoogle: () => Promise<void>;
  myDeposits?: PostgresDepositRecord[];
  onDepositSubmitted: (deposit: PostgresDepositRecord) => void;
  usedTrxIds?: string[];
  appSettings?: AppSettingsRecord;
  insufficientFundsMsg?: string | null;
}

interface PaymentOption {
  id: PaymentMethodType;
  nameBn: string;
  number: string;
  type: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
}

export const DepositModal: React.FC<DepositModalProps> = ({
  isOpen,
  onClose,
  firebaseUser,
  onSignInWithGoogle,
  myDeposits = [],
  onDepositSubmitted,
  usedTrxIds = [],
  appSettings,
  insufficientFundsMsg,
}) => {
  const paymentMethods: PaymentOption[] = [
    {
      id: 'bkash',
      nameBn: 'বিকাশ (bKash)',
      number: appSettings?.bkashNumber || '01889-421782',
      type: 'ব্যক্তিগত এজেন্ট',
      bgColor: 'bg-pink-950/40',
      textColor: 'text-pink-400',
      borderColor: 'border-pink-500/40',
    },
    {
      id: 'nagad',
      nameBn: 'নগদ (Nagad)',
      number: appSettings?.nagadNumber || '01712-984321',
      type: 'ব্যক্তিগত এজেন্ট',
      bgColor: 'bg-orange-950/40',
      textColor: 'text-orange-400',
      borderColor: 'border-orange-500/40',
    },
    {
      id: 'rocket',
      nameBn: 'রকেট (Rocket)',
      number: appSettings?.rocketNumber || '01911-345678-9',
      type: 'ব্যক্তিগত এজেন্ট',
      bgColor: 'bg-purple-950/40',
      textColor: 'text-purple-400',
      borderColor: 'border-purple-500/40',
    },
    {
      id: 'upay',
      nameBn: 'উপায় (Upay)',
      number: appSettings?.upayNumber || '01622-778899',
      type: 'ব্যক্তিগত এজেন্ট',
      bgColor: 'bg-amber-950/40',
      textColor: 'text-amber-400',
      borderColor: 'border-amber-500/40',
    },
  ];

  const minDeposit = appSettings?.minDeposit || 200;
  const maxDeposit = appSettings?.maxDeposit || 50000;

  const [selectedMethod, setSelectedMethod] = useState<PaymentOption>(paymentMethods[0]);
  const [amountInput, setAmountInput] = useState<string>('1000');
  const [senderNumber, setSenderNumber] = useState<string>('');
  const [trxId, setTrxId] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [submittedDeposit, setSubmittedDeposit] = useState<PostgresDepositRecord | null>(null);

  if (!isOpen) return null;

  const numericAmount = Number(amountInput) || 0;

  // Check if a TrxID has already been submitted and used
  const checkIsTrxUsed = (id: string): boolean => {
    const formatted = id.trim().toUpperCase();
    if (!formatted) return false;
    if (usedTrxIds && usedTrxIds.some(t => t.toUpperCase() === formatted)) {
      return true;
    }
    if (myDeposits.some(d => d.trxId.toUpperCase() === formatted)) {
      return true;
    }
    return false;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedMethod.number.replace(/-/g, ''));
    setCopied(true);
    sound.playClick();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setIsSigningIn(true);
    sound.playClick();
    try {
      await onSignInWithGoogle();
    } catch {
      setErrorMsg('Google সাইন ইন সম্পন্ন করা যায়নি। আবার চেষ্টা করুন।');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!firebaseUser) {
      setErrorMsg('ডিপোজিট রিকোয়েস্ট জমা দিতে অনুগ্রহ করে প্রথমে Google দিয়ে সাইন ইন করুন।');
      sound.playCrash();
      return;
    }

    if (Number.isNaN(numericAmount) || numericAmount < minDeposit) {
      setErrorMsg(`নূন্যতম ডিপোজিট ৳${minDeposit}!`);
      return;
    }
    if (numericAmount > maxDeposit) {
      setErrorMsg(`সর্বোচ্চ ডিপোজিট ৳${maxDeposit}!`);
      return;
    }

    const cleanSender = senderNumber.trim();
    if (cleanSender && cleanSender.length < 11) {
      setErrorMsg('সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন অথবা ফাঁকা রাখুন!');
      return;
    }

    const cleanTrx = trxId.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!cleanTrx || cleanTrx.length < 6) {
      setErrorMsg('লেনদেনের সঠিক ট্রানজেকশন আইডি (Transaction ID) দিন (নূন্যতম ৬ অক্ষর)!');
      return;
    }

    if (checkIsTrxUsed(cleanTrx)) {
      setErrorMsg(`এই ট্রানজেকশন আইডি (${cleanTrx}) ইতিপূর্বে ব্যবহার করা হয়েছে! অনুগ্রহ করে নতুন TrxID দিন।`);
      sound.playCrash();
      return;
    }

    setIsSubmitting(true);
    sound.playClick();

    try {
      const token = await firebaseUser.getIdToken();
      const res = await fetch('/api/deposit/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          method: selectedMethod.id,
          amount: numericAmount,
          senderNumber: cleanSender,
          trxId: cleanTrx,
        }),
      });

      const data = await res.json();
      setIsSubmitting(false);

      if (!res.ok || !data.success || !data.deposit) {
        setErrorMsg(data.message || 'ডিপোজিট রিকোয়েস্ট প্রক্রিয়া ব্যর্থ হয়েছে!');
        sound.playCrash();
        return;
      }

      sound.playWinChime();
      setSubmittedDeposit(data.deposit as PostgresDepositRecord);
      onDepositSubmitted(data.deposit as PostgresDepositRecord);
      setTrxId('');
      setSenderNumber('');
    } catch {
      setIsSubmitting(false);
      setErrorMsg('সার্ভারের সাথে সংযোগ স্থাপন করা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।');
      sound.playCrash();
    }
  };

  const handleCloseModal = () => {
    setSubmittedDeposit(null);
    setErrorMsg('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#0f172a] border border-gray-800 rounded-3xl max-w-md w-full p-4 sm:p-6 text-white shadow-2xl relative my-auto animate-fade-in max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={handleCloseModal}
          className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-white rounded-full bg-gray-800/80 hover:bg-gray-700 transition-colors"
          aria-label="Close Deposit Modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2 mb-4 pr-8">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold">ডিপোজিট রিকোয়েস্ট (Deposit)</h2>
            <p className="text-xs text-gray-400">বিকাশ, নগদ, রকেট ও উপায় ওয়ালেট</p>
          </div>
        </div>

        {/* Insufficient Balance / Insufficient Funds Alert Banner */}
        {insufficientFundsMsg && (
          <div
            role="alert"
            className="mb-4 p-3.5 rounded-2xl bg-rose-950/80 border border-rose-500/70 flex items-start gap-2.5 shadow-lg shadow-rose-950/50"
          >
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-black text-rose-300 tracking-wide">
                Insufficient Balance · Insufficient Funds
              </div>
              <p className="text-xs text-rose-100/90 mt-0.5 leading-relaxed">
                {insufficientFundsMsg}
              </p>
            </div>
          </div>
        )}

        {/* Google Auth Gate Banner when not signed in */}
        {!firebaseUser && (
          <div className="mb-4 p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/40 space-y-2.5">
            <div className="text-xs text-amber-200 font-semibold leading-relaxed">
              ডিপোজিট রিকোয়েস্ট আপনার অ্যাকাউন্টে &apos;Pending&apos; হিসেবে সেভ করতে ও অ্যাপ্রুভালের পর ব্যালেন্স পেতে অনুগ্রহ করে Google দিয়ে সাইন ইন করুন।
            </div>
            <button
              type="button"
              disabled={isSigningIn}
              onClick={handleGoogleSignIn}
              className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-60 cursor-pointer"
            >
              <LogIn className="w-4 h-4 stroke-[2.5]" />
              <span>{isSigningIn ? 'সাইন ইন হচ্ছে...' : 'Google দিয়ে সাইন ইন করুন'}</span>
            </button>
          </div>
        )}

        {submittedDeposit ? (
          <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/50 space-y-3 text-center my-2">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <span className="inline-block text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 mb-1.5">
                Status: Pending
              </span>
              <h3 className="text-base font-black text-emerald-300">
                ডিপোজিট রিকোয়েস্ট &apos;Pending&apos; হিসেবে সেভ হয়েছে!
              </h3>
              <p className="text-xs text-gray-300 mt-1.5 leading-relaxed">
                পরিমাণ: <strong className="text-white font-mono">৳{submittedDeposit.amount}</strong> · TrxID:{' '}
                <strong className="text-amber-300 font-mono">{submittedDeposit.trxId}</strong>
                <br />
                অ্যাডমিন যাচাই করে Approve করলেই আপনার অ্যাকাউন্টের ব্যালেন্স অটোমেটিক বেড়ে যাবে।
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setSubmittedDeposit(null)}
                className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-amber-300 cursor-pointer"
              >
                নতুন ডিপোজিট
              </button>
              <button
                type="button"
                onClick={handleCloseModal}
                className="py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black cursor-pointer"
              >
                ঠিক আছে
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Payment Method Selector */}
            <div className="mb-4">
              <label className="text-xs text-gray-300 font-medium mb-1.5 block">পেমেন্ট মেথড বেছে নিন:</label>
              <div className="grid grid-cols-2 gap-2">
                {paymentMethods.map(method => (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => {
                      setSelectedMethod(method);
                      sound.playClick();
                    }}
                    className={`p-2.5 rounded-2xl border text-left transition-all ${
                      selectedMethod.id === method.id
                        ? `${method.bgColor} ${method.borderColor} ring-1 ring-amber-500/50 shadow-md`
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className={`text-xs font-bold ${method.textColor}`}>{method.nameBn}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5">{method.type}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Method Details / Copy Number */}
            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 mb-4">
              <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                <span>ক্যাশ-আউট / সেন্ড মানি নম্বর ({selectedMethod.nameBn}):</span>
                <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> যাচাইকৃত
                </span>
              </div>
              <div className="flex items-center justify-between bg-slate-900 px-3 py-2 rounded-xl border border-slate-800">
                <span className="font-mono font-bold text-amber-400 text-sm tracking-wide">
                  {selectedMethod.number}
                </span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-2 py-1 rounded-lg transition-colors border border-amber-500/20"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">কপি হয়েছে</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-gray-400" />
                      <span>কপি করুন</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-[11px] text-gray-400 mt-2 bg-slate-900/60 p-2 rounded-lg">
                * টাকা পাঠানোর পর নিচে Amount এবং Transaction ID দিয়ে সাবমিট করুন।
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Amount Input + Presets */}
              <div>
                <div className="flex items-center justify-between text-xs text-gray-300 font-medium mb-1.5">
                  <label htmlFor="deposit-amount-input">
                    ডিপোজিট পরিমাণ / Amount (৳{minDeposit} - ৳{maxDeposit}):
                  </label>
                  <span className="text-amber-400 font-mono font-bold">৳ {numericAmount}</span>
                </div>
                <input
                  id="deposit-amount-input"
                  type="number"
                  min={minDeposit}
                  max={maxDeposit}
                  step={1}
                  placeholder="টাকার পরিমাণ লিখুন (যেমন: 1000)"
                  value={amountInput}
                  onChange={e => {
                    setAmountInput(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 font-mono mb-2"
                  required
                />
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1">
                  {[200, 500, 1000, 2500, 5000, 10000].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setAmountInput(String(val))}
                      className={`py-1.5 text-xs font-mono font-semibold rounded-lg border transition-all ${
                        numericAmount === val
                          ? 'bg-amber-500 text-black border-amber-500 font-bold'
                          : 'bg-slate-900 border-slate-800 text-gray-300 hover:bg-slate-800'
                      }`}
                    >
                      ৳{val}
                    </button>
                  ))}
                </div>
              </div>

              {/* Transaction ID */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="deposit-trx-input" className="text-xs text-gray-300 font-medium block">
                    ট্রানজেকশন আইডি (Transaction ID):
                  </label>
                  <span className="text-[10px] text-amber-400 font-medium">
                    (একক ব্যবহারযোগ্য)
                  </span>
                </div>
                <input
                  id="deposit-trx-input"
                  type="text"
                  placeholder="যেমন: 9H7B3R92AB"
                  value={trxId}
                  onChange={e => {
                    const val = e.target.value.toUpperCase().replace(/\s+/g, '');
                    setTrxId(val);
                    if (errorMsg) setErrorMsg('');
                  }}
                  className={`w-full bg-slate-950 border rounded-xl px-3 py-2 text-sm text-amber-300 uppercase tracking-wider focus:outline-none font-mono ${
                    checkIsTrxUsed(trxId) && trxId.length >= 6
                      ? 'border-rose-500 ring-1 ring-rose-500 text-rose-300'
                      : 'border-slate-800 focus:border-amber-500'
                  }`}
                  required
                />
                {checkIsTrxUsed(trxId) && trxId.length >= 6 && (
                  <p className="text-[10px] text-rose-400 mt-1 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    এই TrxID ইতিপূর্বে ব্যবহার করা হয়েছে! অনুগ্রহ করে নতুন TrxID দিন।
                  </p>
                )}
              </div>

              {/* Optional Sender Number */}
              <div>
                <label htmlFor="deposit-sender-input" className="text-xs text-gray-400 font-medium block mb-1">
                  প্রেরকের মোবাইল নম্বর (ঐচ্ছিক):
                </label>
                <input
                  id="deposit-sender-input"
                  type="text"
                  placeholder="01XXXXXXXXX"
                  value={senderNumber}
                  onChange={e => setSenderNumber(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              {errorMsg && (
                <div className="flex items-center gap-1.5 text-xs text-rose-400 bg-rose-950/40 border border-rose-900/60 p-2 rounded-lg">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isSubmitting || !firebaseUser}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-sm rounded-xl shadow-lg shadow-amber-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Clock className="w-4 h-4 animate-spin" />
                    <span>সেভ হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>ডিপোজিট রিকোয়েস্ট পাঠান (৳{numericAmount})</span>
                  </>
                )}
              </button>
            </form>
          </>
        )}

        {/* Recent Deposit Requests Status List */}
        {firebaseUser && myDeposits.length > 0 && (
          <div className="mt-5 pt-4 border-t border-gray-800 space-y-2">
            <div className="text-xs font-bold text-gray-300 flex items-center justify-between">
              <span>সাম্প্রতিক ডিপোজিট রিকোয়েস্ট</span>
              <span className="text-[10px] text-gray-400 font-normal">সর্বশেষ {Math.min(5, myDeposits.length)} টি</span>
            </div>
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {myDeposits.slice(0, 5).map(dep => (
                <div
                  key={dep.id}
                  className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-2 text-xs"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-white">৳{Number(dep.amount).toLocaleString('en-US')}</span>
                      <span className="text-[10px] uppercase text-gray-400">({dep.method})</span>
                    </div>
                    <div className="text-[10px] font-mono text-amber-300/90 truncate">
                      TrxID: {dep.trxId}
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-md border shrink-0 ${
                      dep.status === 'pending'
                        ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                        : dep.status === 'approved'
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                        : 'bg-rose-500/15 text-rose-300 border-rose-500/40'
                    }`}
                  >
                    {dep.status === 'pending' && <Clock className="w-2.5 h-2.5" />}
                    {dep.status === 'approved' && <CheckCircle2 className="w-2.5 h-2.5" />}
                    {dep.status === 'rejected' && <XCircle className="w-2.5 h-2.5" />}
                    {dep.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
