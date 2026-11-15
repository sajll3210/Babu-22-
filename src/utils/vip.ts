import { VIPTier } from '../types';

export { type VIPTier };

export interface VIPTierInfo {
  tier: VIPTier;
  minPoints: number;
  nextTierPoints: number | null;
  badgeBg: string;
  badgeText: string;
  cashback: string;
  benefits: string;
  perks: string[];
}

export const VIP_TIERS_CONFIG: Record<VIPTier, VIPTierInfo> = {
  'ব্রোঞ্জ': {
    tier: 'ব্রোঞ্জ',
    minPoints: 0,
    nextTierPoints: 100,
    badgeBg: 'bg-amber-900/40 border-amber-700/60',
    badgeText: 'text-amber-500',
    cashback: '০.৫% ক্যাশব্যাক',
    benefits: 'দৈনিক ফ্রি স্পিন ও স্বাগত বোনাস',
    perks: ['স্ট্যান্ডার্ড উইথড্র স্পিড', 'দৈনিক ফ্রি স্পিন', 'সার্বক্ষণিক কাস্টমার সাপোর্ট'],
  },
  'সিলভার': {
    tier: 'সিলভার',
    minPoints: 100,
    nextTierPoints: 500,
    badgeBg: 'bg-slate-700/40 border-slate-400/60',
    badgeText: 'text-slate-300',
    cashback: '১.০% ক্যাশব্যাক',
    benefits: 'সাপ্তাহিক রিলোড বোনাস ও দ্রুত উইথড্র',
    perks: ['দ্রুত উইথড্রাল প্রসেসিং', 'সাপ্তাহিক স্পেশাল রিলোড', 'উচ্চতর বেট লিমিট', '+৫% উইন বুস্টার'],
  },
  'গোল্ড': {
    tier: 'গোল্ড',
    minPoints: 500,
    nextTierPoints: 1500,
    badgeBg: 'bg-amber-500/20 border-amber-500/60',
    badgeText: 'text-amber-400',
    cashback: '১.৫% ক্যাশব্যাক',
    benefits: 'পার্সোনাল ভিআইপি হোস্ট ও ফ্রি গিফট',
    perks: ['ডেডিকেটেড অ্যাকাউন্ট ম্যানেজার', 'ইনস্ট্যান্ট উইথড্রাল', 'মাসিক লাক্সারি গিফট ড্র', 'আনলিমিটেড ডিপোজিট বোনাস'],
  },
  'প্লাটিনাম': {
    tier: 'প্লাটিনাম',
    minPoints: 1500,
    nextTierPoints: 4000,
    badgeBg: 'bg-cyan-500/20 border-cyan-400/60',
    badgeText: 'text-cyan-300',
    cashback: '২.০% ক্যাশব্যাক',
    benefits: 'আনলিমিটেড ক্যাশব্যাক ও এক্সক্লুসিভ টেবিল',
    perks: ['এক্সক্লুসিভ ভিআইপি টেবিল অ্যাক্সেস', 'সর্বোচ্চ উইথড্রাল লিমিট', 'জন্মদিনের বিশেষ গিফট ক্যাশ', 'হসপিটালিটি ইনভাইটেশন'],
  },
  'ডায়মন্ড': {
    tier: 'ডায়মন্ড',
    minPoints: 4000,
    nextTierPoints: null,
    badgeBg: 'bg-purple-500/20 border-purple-400/60',
    badgeText: 'text-purple-300',
    cashback: '৩.০% ক্যাশব্যাক',
    benefits: 'রয়্যাল এলিট স্টেটাস ও নো-লিমিট ক্যাশআউট',
    perks: ['রয়্যাল ভিআইপি ব্ল্যাক কার্ড', 'কোন উইথড্রাল লিমিট নেই', '২৪/৭ ডিরেক্ট ভিআইপি হটলাইন', 'আন্তর্জাতিক ইভেন্ট ট্রিপ স্পনসরশিপ'],
  },
};

export const TIER_ORDER: VIPTier[] = ['ব্রোঞ্জ', 'সিলভার', 'গোল্ড', 'প্লাটিনাম', 'ডায়মন্ড'];

export function getTierForPoints(points: number): VIPTier {
  if (points >= 4000) return 'ডায়মন্ড';
  if (points >= 1500) return 'প্লাটিনাম';
  if (points >= 500) return 'গোল্ড';
  if (points >= 100) return 'সিলভার';
  return 'ব্রোঞ্জ';
}

export function getTierRank(tier: VIPTier): number {
  return TIER_ORDER.indexOf(tier);
}
