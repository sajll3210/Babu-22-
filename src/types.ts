export type GameCategory =
  | 'all'
  | 'popular'
  | 'live'
  | 'game_show'
  | 'baccarat'
  | 'roulette'
  | 'dice'
  | 'crash'
  | 'slots'
  | 'table'
  | 'mines';

export type GameProvider =
  | 'All'
  | 'Babu22'
  | 'Spribe'
  | 'Pragmatic Play'
  | 'Evolution'
  | 'Playtech'
  | 'Aura Gaming'
  | 'Royal Gaming'
  | 'Sexy Gaming'
  | 'PG Soft'
  | 'JILI'
  | 'FastSpin'
  | 'JDB'
  | 'NetEnt'
  | 'Hacksaw Gaming'
  | "Play'n GO";

export interface GameItem {
  id: string;
  titleBn: string;
  titleEn: string;
  category: GameCategory;
  provider: GameProvider;
  image: string;
  badge?: 'HOT' | 'NEW' | 'JACKPOT' | 'POPULAR' | 'LIVE';
  rtp: string;
  playableType:
    | 'aviator'
    | 'slots'
    | 'roulette'
    | 'mines'
    | 'dice'
    | 'interactive_live'
    | 'game_show'
    | 'baccarat'
    | 'sicbo'
    | 'babu22'
    | 'under7'
    | 'olympus'
    | 'big_bass'
    | 'starlight'
    | 'hades'
    | 'fortune_tiger'
    | 'fortune_gems_3'
    | 'plinko'
    | 'rodeo'
    | 'gunsmith'
    | 'cowboy_crash'
    | 'crown_of_anuket'
    | 'boom_chest'
    | 'cow_crash'
    | 'drifty'
    | 'elevator'
    | 'charge_buffalo'
    | 'super_ace';
  isLive?: boolean;
  minBet: number;
  maxMultiplier: string;
  studioName?: string;
  dealerName?: string;
}

export type VIPTier =
  | 'ব্রোঞ্জ'
  | 'সিলভার'
  | 'গোল্ড'
  | 'প্লাটিনাম'
  | 'ডায়মন্ড';

export interface UserWallet {
  balance: number;
  bonusBalance: number;
  totalWon: number;
  totalBet: number;
  vipPoints: number;
  username: string;
  vipTier: VIPTier;
}

export type PaymentMethodType = 'bkash' | 'nagad' | 'rocket' | 'upay' | 'crypto';

export interface Transaction {
  id: string;
  type: 'deposit' | 'withdraw' | 'win' | 'bet';
  amount: number;
  method?: string;
  status: 'সফল' | 'প্রক্রিয়াধীন' | 'বাতিল';
  timestamp: string;
  note?: string;
  trxId?: string;
}

export interface DepositRequestRecord {
  id: string;
  userId: string;
  userEmail?: string;
  username?: string;
  method: PaymentMethodType;
  amount: number;
  senderNumber: string;
  trxId: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
  note?: string;
}

export interface WithdrawalRequestRecord {
  id: string;
  userId: string;
  userEmail?: string;
  username?: string;
  method: PaymentMethodType;
  amount: number;
  accountNumber: string;
  status: 'pending' | 'completed' | 'rejected';
  createdAt: string;
  processedAt?: string;
  processedBy?: string;
  payoutReference?: string;
  rejectionReason?: string;
}

export interface AppSettingsRecord {
  bkashNumber: string;
  nagadNumber: string;
  rocketNumber: string;
  upayNumber: string;
  minDeposit: number;
  maxDeposit: number;
  minWithdrawal: number;
  maxWithdrawal: number;
  maintenanceMode: boolean;
  announcement: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface AdminAuditLogRecord {
  id: string;
  adminUid: string;
  adminEmail: string;
  action: string;
  targetId: string;
  details: string;
  timestamp: string;
}

