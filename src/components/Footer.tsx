import React from 'react';
import { ShieldCheck, Award, HeartHandshake } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#070a12] border-t border-gray-900 text-gray-400 text-xs py-8 px-4 lg:px-8 mt-12 pb-24 md:pb-10">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Payment Methods Badges */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-800/80">
          <div>
            <div className="text-xs font-bold text-gray-200 uppercase tracking-wider mb-1">
              সমর্থিত পেমেন্ট মাধ্যমসমূহ
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="px-3 py-1 bg-pink-950/40 border border-pink-500/30 text-pink-400 font-bold text-xs rounded-lg">
                বিকাশ (bKash)
              </span>
              <span className="px-3 py-1 bg-orange-950/40 border border-orange-500/30 text-orange-400 font-bold text-xs rounded-lg">
                নগদ (Nagad)
              </span>
              <span className="px-3 py-1 bg-purple-950/40 border border-purple-500/30 text-purple-400 font-bold text-xs rounded-lg">
                রকেট (Rocket)
              </span>
              <span className="px-3 py-1 bg-amber-950/40 border border-amber-500/30 text-amber-400 font-bold text-xs rounded-lg">
                উপায় (Upay)
              </span>
              <span className="px-3 py-1 bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 font-bold text-xs rounded-lg font-mono">
                USDT (TRC20)
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5 text-gray-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>SSL সিকিউরড পেমেন্ট</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-300">
              <Award className="w-4 h-4 text-amber-400" />
              <span>লাইসেন্সপ্রাপ্ত RNG অডিটেড</span>
            </div>
          </div>
        </div>

        {/* Responsible Gaming & Age Warning */}
        <div className="bg-slate-950/80 p-4 rounded-2xl border border-gray-800/70 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-rose-600/20 border border-rose-500/40 text-rose-400 font-black text-xs flex items-center justify-center shrink-0">
              ১৮+
            </div>
            <p className="text-[11px] text-gray-300 leading-relaxed">
              অনলাইন গেমিং ও বাজি ধরা শুধুমাত্র ১৮ বছর বা তার বেশি বয়সের প্রাপ্তবয়স্ক ব্যক্তিদের জন্য। দায়িত্বশীলভাবে খেলুন।
            </p>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-amber-400 shrink-0">
            <HeartHandshake className="w-4 h-4" />
            <span>দায়িত্বশীল গেমিং</span>
          </div>
        </div>

        {/* Quiet Copyright */}
        <div className="flex flex-col sm:flex-row items-center justify-between text-[11px] text-gray-500 pt-2">
          <div>
            © 2026 Babu22 Betting Portal. সর্বস্বত্ব সংরক্ষিত।
          </div>
          <div className="flex items-center gap-4 mt-2 sm:mt-0">
            <a href="#" onClick={e => e.preventDefault()} className="hover:text-gray-400">শর্তাবলী</a>
            <span>•</span>
            <a href="#" onClick={e => e.preventDefault()} className="hover:text-gray-400">গোপনীয়তা নীতি</a>
            <span>•</span>
            <a href="#" onClick={e => e.preventDefault()} className="hover:text-gray-400">কাস্টমার সাপোর্ট</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
