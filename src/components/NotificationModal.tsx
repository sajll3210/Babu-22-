import React from 'react';
import { X, Bell, Sparkles, Gift, Flame, Trophy, CheckCircle2 } from 'lucide-react';
import { sound } from '../utils/audio';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenDeposit?: () => void;
  onLaunchFortuneTiger?: () => void;
  onLaunchFortuneGems?: () => void;
  onLaunchPlinko?: () => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  onOpenDeposit,
  onLaunchFortuneTiger,
  onLaunchFortuneGems,
  onLaunchPlinko,
}) => {
  if (!isOpen) return null;

  const NOTIFICATIONS = [
    {
      id: 'notif-plinko',
      title: '⚪ নতুন গেম: Plinko (প্লিংকো) এখন Babu22-তে লাইভ!',
      time: 'এখনই',
      content:
        'Spribe-এর সুপারহিট ক্যাজুয়াল আর্কেড "Plinko" এখন প্ল্যাটফর্মে যুক্ত হয়েছে! পিন পিরামিড দিয়ে বল ড্রপ করুন এবং জিতে নিন ১,০০০x পর্যন্ত মেগা জ্যাকপট।',
      badge: 'NEW ARCADE',
      actionText: 'এখনই খেলুন',
      onAction: () => {
        onClose();
        if (onLaunchPlinko) onLaunchPlinko();
      },
    },
    {
      id: 'notif-0',
      title: '🦅 নতুন গেম: Fortune Gems 3 (JILI) এখন Babu22-তে লাইভ!',
      time: '১০ মিনিট আগে',
      content:
        'JILI Games-এর সেরা ৩x৩ স্লট "Fortune Gems 3" এখন Babu22-তে যুক্ত হয়েছে! গোল্ডেন গরুড়া ওয়াইল্ড, ৪র্থ মাল্টিপ্লায়ার হুইল ও লাকি বোনাস হুইলে জিতে নিন ১০,০০০x মেগা জ্যাকপট।',
      badge: 'HOT GAME',
      actionText: 'এখনই খেলুন',
      onAction: () => {
        onClose();
        if (onLaunchFortuneGems) onLaunchFortuneGems();
      },
    },
    {
      id: 'notif-1',
      title: '🐯 নতুন গেম: Fortune Tiger এখন Babu22-তে লাইভ!',
      time: '১০ মিনিট আগে',
      content:
        'PG Soft-এর বিশ্বখ্যাত ৩x৩ স্লট "Fortune Tiger" এখন Babu22 প্ল্যাটফর্মে যুক্ত হয়েছে। র্যান্ডম রিস্পিন ফিচার ও ১০x ফুল গ্রিড মাল্টিপ্লায়ার সহ মেগা জ্যাকপট জিতে নিন!',
      badge: 'NEW GAME',
      actionText: 'এখনই খেলুন',
      onAction: () => {
        onClose();
        if (onLaunchFortuneTiger) onLaunchFortuneTiger();
      },
    },
    {
      id: 'notif-2',
      title: '🎁 ১০০% মেগা ডিপোজিট ওয়েলকাম বোনাস!',
      time: '১ ঘন্টা আগে',
      content:
        'আপনার পরবর্তী ডিপোজিটে উপভোগ করুন ১০০% ম্যাচ বোনাস। বিকাশ, নগদ এবং রকেটের মাধ্যমে মাত্র ৳৫০০ ডিপোজিট করলেই বোনাস স্বয়ংক্রিয়ভাবে সক্রিয় হবে।',
      badge: 'PROMO',
      actionText: 'ডিপোজিট করুন',
      onAction: () => {
        onClose();
        if (onOpenDeposit) onOpenDeposit();
      },
    },
    {
      id: 'notif-3',
      title: '⚡ বিকাশ ও নগদ ক্যাশআউট অপটিমাইজেশন',
      time: '৩ ঘন্টা আগে',
      content:
        'আমাদের পেমেন্ট সিস্টেম আরও দ্রুত করা হয়েছে। এখন যেকোনো উইথড্রল রিকোয়েস্ট ৫ থেকে ১৫ মিনিটের মধ্যে সরাসরি আপনার বিকাশ বা নগদ নম্বরে পৌঁছে যাবে।',
      badge: 'UPDATE',
    },
    {
      id: 'notif-4',
      title: '👑 ভিআইপি রয়্যাল ক্যাশব্যাক প্রোগ্রাম',
      time: 'আজ সকালে',
      content:
        'আপনি প্রতিটি গেম রাউন্ড খেলার সাথে সাথে ভিআইপি পয়েন্ট জমা হচ্ছে। সিলভার ও গোল্ড লেভেলে পৌঁছালে পাবেন আনলিমিটেড উইকলি ক্যাশব্যাক ও এক্সক্লুসিভ রিওয়ার্ড।',
      badge: 'VIP',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#0b101b] border border-amber-500/30 rounded-3xl max-w-md w-full text-white shadow-2xl relative my-auto animate-fade-in p-5 max-h-[88vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">বিজ্ঞপ্তি ও নোটিফিকেশন</h3>
              <p className="text-[10px] text-gray-400">সর্বশেষ অফার ও প্ল্যাটফর্ম আপডেট</p>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-1.5 text-gray-400 hover:text-white rounded-full bg-slate-900 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Notifications list */}
        <div className="flex-1 overflow-y-auto space-y-2.5 py-3 pr-1">
          {NOTIFICATIONS.map((n) => (
            <div
              key={n.id}
              className="p-3 rounded-2xl bg-slate-900/80 border border-gray-800 hover:border-amber-500/30 transition-all space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 rounded">
                  {n.badge}
                </span>
                <span className="text-[10px] text-gray-500">{n.time}</span>
              </div>
              <h4 className="text-xs font-bold text-white">{n.title}</h4>
              <p className="text-[11px] text-gray-300 leading-relaxed">{n.content}</p>
              {n.actionText && (
                <div className="pt-1">
                  <button
                    onClick={n.onAction}
                    className="text-[11px] font-bold text-slate-950 bg-gradient-to-r from-amber-500 to-yellow-400 px-3 py-1 rounded-lg shadow-sm hover:from-amber-400 hover:to-yellow-300 transition-all active:scale-95"
                  >
                    {n.actionText} →
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Close Button at bottom */}
        <button
          onClick={() => {
            sound.playClick();
            onClose();
          }}
          className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-gray-300 text-xs font-bold rounded-xl transition-colors border border-slate-700"
        >
          বন্ধ করুন
        </button>
      </div>
    </div>
  );
};
