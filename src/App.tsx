import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { CategoryFilter } from './components/CategoryFilter';
import { GameCard } from './components/GameCard';
import { MobileBottomNav } from './components/MobileBottomNav';
import { DepositModal } from './components/DepositModal';
import { WithdrawModal } from './components/WithdrawModal';
import { DailySpinModal } from './components/DailySpinModal';
import { UserProfileModal } from './components/UserProfileModal';
import { SlotShowcaseSection } from './components/SlotShowcaseSection';
import { RouletteShowcaseSection } from './components/RouletteShowcaseSection';
import { Footer } from './components/Footer';

// Playable Game Engines
import { AviatorGame } from './components/games/AviatorGame';
import { SlotMachineGame } from './components/games/SlotMachineGame';
import { RouletteGame } from './components/games/RouletteGame';
import { MinesGame } from './components/games/MinesGame';
import { DiceGame } from './components/games/DiceGame';
import { LiveInteractiveTable } from './components/LiveInteractiveTable';
import { Babu22Game } from './components/games/Babu22Game';
import { Under7Game } from './components/games/Under7Game';
import { GatesOfOlympusGame } from './components/games/GatesOfOlympusGame';
import { BigBassBonanzaGame } from './components/games/BigBassBonanzaGame';
import { StarlightPrincessGame } from './components/games/StarlightPrincessGame';
import { GatesOfHadesGame } from './components/games/GatesOfHadesGame';
import { FortuneTigerGame } from './components/games/FortuneTigerGame';
import { FortuneGems3Game } from './components/games/FortuneGems3Game';
import { PlinkoGame } from './components/games/PlinkoGame';
import { RodeoCrashGame } from './components/games/RodeoCrashGame';
import { GunsmithGame } from './components/games/GunsmithGame';
import { CowboyCrashGame } from './components/games/CowboyCrashGame';
import { CrownOfAnuketGame } from './components/games/CrownOfAnuketGame';
import { BoomChestGame } from './components/games/BoomChestGame';
import { CowCrashGame } from './components/games/CowCrashGame';
import { BaccaratGame } from './components/games/BaccaratGame';
import { DriftyGame } from './components/games/DriftyGame';
import { ElevatorGame } from './components/games/ElevatorGame';
import { ChargeBuffaloGame } from './components/games/ChargeBuffaloGame';
import { SuperAceGame } from './components/games/SuperAceGame';
import { VipUpgradeToast } from './components/VipUpgradeToast';
import {
  auth,
  googleProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  FirebaseUser,
  testFirestoreConnection,
} from './firebase';

// Login Toll Bar and Auth / Support Components
import { LoginToolbar } from './components/LoginToolbar';
import { AuthModal, AuthTab } from './components/AuthModal';
import { LiveSupportModal } from './components/LiveSupportModal';
import { NotificationModal } from './components/NotificationModal';
import { AdminPanelModal, PostgresDepositRecord } from './components/AdminPanelModal';

import { GAMES_CATALOG } from './data/games';
import { GameCategory, GameItem, GameProvider, Transaction, UserWallet, AppSettingsRecord } from './types';
import { Sparkles, Trophy, X } from 'lucide-react';
import { sound } from './utils/audio';
import { getTierForPoints, getTierRank, VIPTier } from './utils/vip';

const INITIAL_WALLET: UserWallet = {
  balance: 0.0,
  bonusBalance: 0.0,
  totalWon: 0.0,
  totalBet: 0.0,
  vipPoints: 0,
  username: 'খেলোয়াড়_২২',
  vipTier: 'ব্রোঞ্জ',
};

const INITIAL_TRANSACTIONS: Transaction[] = [];

export default function App() {
  // Wallet & persistence: starts at 0.00. Only shows real deposit amounts.
  const [wallet, setWallet] = useState<UserWallet>(() => {
    try {
      localStorage.removeItem('20bets_wallet');
      const saved = localStorage.getItem('babu22_wallet_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.balance === 'number' && parsed.balance !== 5000) {
          return parsed;
        }
      }
    } catch {
      // Ignore
    }
    return INITIAL_WALLET;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      localStorage.removeItem('20bets_transactions');
      const saved = localStorage.getItem('babu22_transactions_v1');
      if (saved) return JSON.parse(saved);
    } catch {
      // Ignore
    }
    return INITIAL_TRANSACTIONS;
  });

  // Track used deposit transaction IDs to prevent reuse
  const [usedTrxIds, setUsedTrxIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('babu22_used_trx_ids_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Ignore
    }
    return [];
  });

  // Active game state
  const [activeGame, setActiveGame] = useState<GameItem | null>(null);

  // Filters & Search
  const [selectedCategory, setSelectedCategory] = useState<GameCategory>('all');
  const [selectedProvider, setSelectedProvider] = useState<GameProvider>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [isDepositOpen, setIsDepositOpen] = useState<boolean>(false);
  const [depositNotice, setDepositNotice] = useState<string | null>(null);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState<boolean>(false);
  const [isDailySpinOpen, setIsDailySpinOpen] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState<boolean>(false);

  // Firebase Auth & PostgreSQL sync state
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [myDeposits, setMyDeposits] = useState<PostgresDepositRecord[]>([]);

  // Login Toll Bar & Authentication State
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('babu22_is_logged_in_v1');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalTab, setAuthModalTab] = useState<AuthTab>('login');
  const [isSupportModalOpen, setIsSupportModalOpen] = useState<boolean>(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState<boolean>(false);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState<number>(3);

  // Toast notification
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // VIP Upgrade Toast Notification
  const [vipUpgradeInfo, setVipUpgradeInfo] = useState<{
    newTier: VIPTier;
    points: number;
    prevTier?: VIPTier;
  } | null>(null);

  // Dynamic App Settings synchronized from Firestore
  const [appSettings, setAppSettings] = useState<AppSettingsRecord>({
    bkashNumber: '01889-421782',
    nagadNumber: '01712-984321',
    rocketNumber: '01911-345678-9',
    upayNumber: '01622-778899',
    minDeposit: 200,
    maxDeposit: 50000,
    minWithdrawal: 500,
    maxWithdrawal: 25000,
    maintenanceMode: false,
    announcement: 'স্বাগতম Babu22 ক্যাসিনো ও স্পোর্টসবুকে! বিকাশ ও নগদে ১ মিনিটে ইনস্ট্যান্ট ডিপোজিট ও নিরাপদ উত্তোলন।',
  });

  const fetchMe = React.useCallback(async (userOverride?: FirebaseUser | null) => {
    const activeUser = userOverride !== undefined ? userOverride : auth.currentUser;
    if (!activeUser) return;
    try {
      const token = await activeUser.getIdToken();
      const res = await fetch('/api/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      if (!data.success || !data.user) return;

      setIsAdmin(Boolean(data.isAdmin));
      if (Array.isArray(data.deposits)) {
        setMyDeposits(data.deposits);
        const serverDeposits: Transaction[] = data.deposits.map((d: PostgresDepositRecord) => ({
          id: `pg-dep-${d.id}`,
          type: 'deposit',
          amount: Number(d.amount),
          method: d.method,
          status:
            d.status === 'approved'
              ? 'সফল'
              : d.status === 'rejected'
              ? 'বাতিল'
              : 'প্রক্রিয়াধীন',
          timestamp: new Date(d.createdAt).toLocaleString('en-GB', {
            dateStyle: 'short',
            timeStyle: 'short',
          }),
          note: `${d.method} ডিপোজিট (TrxID: ${d.trxId})`,
          trxId: d.trxId,
        }));
        setTransactions(prev => {
          const nonServerDeposits = prev.filter(t => !t.id.startsWith('pg-dep-'));
          return [...serverDeposits, ...nonServerDeposits];
        });
      }

      setWallet(prev => ({
        ...prev,
        balance: Number(data.user.balance ?? prev.balance),
        vipPoints: Number(data.user.vipPoints ?? prev.vipPoints),
        vipTier: (data.user.vipTier as VIPTier) || getTierForPoints(Number(data.user.vipPoints ?? 0)),
        username: data.user.username || prev.username,
      }));
      setIsLoggedIn(true);
    } catch {
      // Silent retry on next cycle
    }
  }, []);

  // Fetch live settings, verify Firestore connectivity, and listen to Firebase Auth
  useEffect(() => {
    testFirestoreConnection();
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.settings) setAppSettings(data.settings);
      })
      .catch(() => {});

    const unsubscribe = onAuthStateChanged(auth, user => {
      setFirebaseUser(user);
      if (user) {
        fetchMe(user);
      } else {
        setIsAdmin(false);
        setMyDeposits([]);
      }
    });

    return () => unsubscribe();
  }, [fetchMe]);

  // Periodically sync user wallet & deposit statuses while signed in
  useEffect(() => {
    if (!firebaseUser) return;
    const onFocus = () => fetchMe(firebaseUser);
    window.addEventListener('focus', onFocus);
    const interval = setInterval(() => fetchMe(firebaseUser), 8000);
    return () => {
      window.removeEventListener('focus', onFocus);
      clearInterval(interval);
    };
  }, [firebaseUser, fetchMe]);

  // Save auth & wallet state
  useEffect(() => {
    localStorage.setItem('babu22_is_logged_in_v1', String(isLoggedIn));
  }, [isLoggedIn]);

  useEffect(() => {
    localStorage.setItem('babu22_wallet_v1', JSON.stringify(wallet));
  }, [wallet]);

  useEffect(() => {
    localStorage.setItem('babu22_transactions_v1', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    try {
      localStorage.setItem('babu22_used_trx_ids_v1', JSON.stringify(usedTrxIds));
    } catch {
      // Ignore
    }
  }, [usedTrxIds]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg(prev => (prev === msg ? null : prev));
    }, 3500);
  };

  // Auth Handlers for Login Toll Bar
  const handleDirectLogin = (username: string, _pass: string): boolean => {
    setIsLoggedIn(true);
    setWallet(prev => ({
      ...prev,
      username: username || prev.username,
    }));
    showToast(`🎉 স্বাগতম ${username}! আপনি সফলভাবে লগইন করেছেন।`);
    sound.playWinChime();
    return true;
  };

  const handleLoginSuccess = (username: string) => {
    setIsLoggedIn(true);
    setWallet(prev => ({
      ...prev,
      username: username || prev.username,
    }));
    showToast(`🎉 স্বাগতম ${username}! আপনি সফলভাবে লগইন করেছেন।`);
    sound.playWinChime();
  };

  const handleRegisterSuccess = (username: string, bonusClaimed?: string) => {
    setIsLoggedIn(true);
    // Award welcome gift and bonus points
    setWallet(prev => ({
      ...prev,
      username,
      bonusBalance: prev.bonusBalance + 100,
      vipPoints: prev.vipPoints + 50,
    }));
    showToast(
      `🎉 অভিনন্দন ${username}! আপনার অ্যাকাউন্ট তৈরি হয়েছে এবং ৳১০০ ওয়েলকাম গিফট যোগ হয়েছে (${
        bonusClaimed || 'ওয়েলকাম বোনাস'
      })!`
    );
    sound.playWinChime();
  };

  const handleSignInWithGoogle = async () => {
    const result = await signInWithPopup(auth, googleProvider);
    setFirebaseUser(result.user);
    setIsLoggedIn(true);
    await fetchMe(result.user);
    showToast(`স্বাগতম ${result.user.displayName || result.user.email}!`);
    sound.playWinChime();
  };

  const handleSignOutGoogle = async () => {
    await signOut(auth);
    setFirebaseUser(null);
    setIsAdmin(false);
    setMyDeposits([]);
  };

  const handleLogout = async () => {
    if (firebaseUser) {
      await handleSignOutGoogle().catch(() => {});
    }
    setIsLoggedIn(false);
    showToast('👋 আপনি সফলভাবে লগআউট করেছেন। যেকোনো গেম খেলতে পুনরায় লগইন করুন।');
    sound.playClick();
  };

  // VIP Points & Tier Progression Dispatcher
  const awardVipPoints = (pointsToAdd: number, reason?: string) => {
    setWallet(prev => {
      const currentPoints = prev.vipPoints || 0;
      const newPoints = Math.max(0, currentPoints + pointsToAdd);
      const oldTier = prev.vipTier || getTierForPoints(currentPoints);
      const newTier = getTierForPoints(newPoints);

      // Check if user crossed a VIP tier threshold!
      if (getTierRank(newTier) > getTierRank(oldTier)) {
        setVipUpgradeInfo({
          newTier,
          points: newPoints,
          prevTier: oldTier,
        });
        sound.playJackpot();
      }

      return {
        ...prev,
        vipPoints: newPoints,
        vipTier: newTier,
      };
    });
  };

  // Balance update dispatcher
  const handleUpdateBalance = (amount: number, reason: string) => {
    setWallet(prev => {
      const newBal = Math.max(0, +(prev.balance + amount).toFixed(2));
      const newWon = amount > 0 ? prev.totalWon + amount : prev.totalWon;
      const newBet = amount < 0 ? prev.totalBet + Math.abs(amount) : prev.totalBet;

      return {
        ...prev,
        balance: newBal,
        totalWon: newWon,
        totalBet: newBet,
      };
    });

    let ptsEarned = 0;
    // Award VIP Points for player action
    if (amount < 0) {
      // Placing bet: 1 VIP point per 25 BDT bet
      ptsEarned = Math.max(1, Math.round(Math.abs(amount) / 25));
      awardVipPoints(ptsEarned, 'বেট স্থাপন');
    } else if (amount > 0) {
      // Winning: 1 VIP point per 100 BDT won
      ptsEarned = Math.max(1, Math.round(amount / 100));
      awardVipPoints(ptsEarned, 'গেম জয়');
    }

    if (firebaseUser) {
      firebaseUser
        .getIdToken()
        .then(token =>
          fetch('/api/wallet/sync', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              deltaAmount: amount,
              vipPointsDelta: ptsEarned,
            }),
          })
        )
        .catch(() => {});
    }

    if (amount > 0) {
      showToast(`+ ৳${amount.toLocaleString('en-US')} জয়ী হয়েছেন! (${reason})`);
      setTransactions(prev => [
        {
          id: `tx-${Date.now()}`,
          type: 'win',
          amount,
          status: 'সফল',
          timestamp: 'এখনই',
          note: reason,
        },
        ...prev,
      ]);
    }
  };

  // Pending Deposit submission handler: Does NOT increment balance until Admin approves
  const handleDepositSubmitted = (deposit: PostgresDepositRecord) => {
    const cleanTrx = (deposit.trxId || '').trim().toUpperCase();
    if (cleanTrx) {
      setUsedTrxIds(prev => (prev.includes(cleanTrx) ? prev : [...prev, cleanTrx]));
    }
    setMyDeposits(prev => [deposit, ...prev.filter(d => d.id !== deposit.id)]);
    setTransactions(prev => [
      {
        id: `pg-dep-${deposit.id}`,
        type: 'deposit',
        amount: Number(deposit.amount),
        method: deposit.method,
        status: 'প্রক্রিয়াধীন',
        timestamp: 'এখনই',
        note: `${deposit.method} ডিপোজিট (TrxID: ${cleanTrx})`,
        trxId: cleanTrx,
      },
      ...prev.filter(t => t.id !== `pg-dep-${deposit.id}`),
    ]);
    setDepositNotice(null);
    showToast(`ডিপোজিট রিকোয়েস্ট 'Pending' হিসেবে সেভ হয়েছে! (TrxID: ${cleanTrx})`);
  };

  const handleWithdrawSuccess = (amount: number, method: string, account: string) => {
    setWallet(prev => ({
      ...prev,
      balance: +(prev.balance - amount).toFixed(2),
    }));

    setTransactions(prev => [
      {
        id: `tx-${Date.now()}`,
        type: 'withdraw',
        amount,
        method,
        status: 'প্রক্রিয়াধীন',
        timestamp: 'এখনই',
        note: `${method} উত্তোলন (${account})`,
      },
      ...prev,
    ]);

    showToast(`৳ ${amount.toLocaleString('en-US')} উইথড্রাল সফলভাবে জমা হয়েছে (অ্যাকাউন্ট ভেরিফিকেশন সাপেক্ষে)`);
  };

  const handleRewardWon = (amount: number) => {
    setWallet(prev => ({
      ...prev,
      balance: +(prev.balance + amount).toFixed(2),
    }));

    // Daily spin grants 30 VIP points
    awardVipPoints(30, 'দৈনিক স্পিন বোনাস');

    setTransactions(prev => [
      {
        id: `tx-${Date.now()}`,
        type: 'win',
        amount,
        status: 'সফল',
        timestamp: 'এখনই',
        note: 'দৈনিক ফ্রি স্পিন রিওয়ার্ড (+৩০ VIP pts)',
      },
      ...prev,
    ]);

    showToast(`৳ ${amount} ফ্রি বোনাস জমা হয়েছে! (+৩০ VIP pts)`);
  };

  // Fast launch shortcuts
  const handleLaunchAviator = () => {
    const aviatorGame = GAMES_CATALOG.find(g => g.id === 'aviator-spribe') || GAMES_CATALOG[0];
    setActiveGame(aviatorGame);
    sound.playClick();
  };

  const handleLaunchBabu22 = () => {
    const babuGame = GAMES_CATALOG.find(g => g.id === 'babu22-exclusive') || GAMES_CATALOG[0];
    setActiveGame(babuGame);
    sound.playClick();
  };

  const handleLaunchUnder7 = () => {
    const under7Game = GAMES_CATALOG.find(g => g.id === 'under-7-up-down') || GAMES_CATALOG[1];
    setActiveGame(under7Game);
    sound.playClick();
  };

  const handleLaunchOlympus = () => {
    const olympusGame =
      GAMES_CATALOG.find(g => g.id === 'gates-of-olympus-1000') ||
      GAMES_CATALOG.find(g => g.id === 'gates-of-olympus') ||
      GAMES_CATALOG[0];
    setActiveGame(olympusGame);
    sound.playClick();
  };

  const handleLaunchBigBass = () => {
    const bassGame =
      GAMES_CATALOG.find(g => g.id === 'big-bass-splash') ||
      GAMES_CATALOG.find(g => g.id === 'big-bass-bonanza') ||
      GAMES_CATALOG[0];
    setActiveGame(bassGame);
    sound.playClick();
  };

  const handleLaunchStarlight = () => {
    const starlightGame =
      GAMES_CATALOG.find(g => g.id === 'starlight-princess-1000') ||
      GAMES_CATALOG.find(g => g.id === 'starlight-princess') ||
      GAMES_CATALOG[0];
    setActiveGame(starlightGame);
    sound.playClick();
  };

  const handleLaunchHades = () => {
    const hadesGame =
      GAMES_CATALOG.find(g => g.id === 'gates-of-hades-1000') ||
      GAMES_CATALOG.find(g => g.id === 'gates-of-hades') ||
      GAMES_CATALOG[0];
    setActiveGame(hadesGame);
    sound.playClick();
  };

  const handleLaunchFortuneTiger = () => {
    const tigerGame =
      GAMES_CATALOG.find(g => g.id === 'fortune-tiger') ||
      GAMES_CATALOG.find(g => g.id === 'fortune-tiger-deluxe') ||
      GAMES_CATALOG[0];
    setActiveGame(tigerGame);
    sound.playClick();
  };

  const handleLaunchFortuneGems = () => {
    const gemsGame =
      GAMES_CATALOG.find(g => g.id === 'fortune-gems-3') ||
      GAMES_CATALOG.find(g => g.id === 'fortune-gems-2') ||
      GAMES_CATALOG.find(g => g.id === 'babu22-fortune-gems-vip') ||
      GAMES_CATALOG[0];
    setActiveGame(gemsGame);
    sound.playClick();
  };

  const handleLaunchPlinko = () => {
    const plinkoGame =
      GAMES_CATALOG.find(g => g.id === 'plinko-spribe') ||
      GAMES_CATALOG.find(g => g.id === 'babu22-plinko-vip') ||
      GAMES_CATALOG[0];
    setActiveGame(plinkoGame);
    sound.playClick();
  };

  const handleLaunchDice = () => {
    const diceGame =
      GAMES_CATALOG.find(g => g.id === 'dice-spribe-vip') ||
      GAMES_CATALOG.find(g => g.id === 'babu22-dice-3d-vip') ||
      GAMES_CATALOG[0];
    setActiveGame(diceGame);
    sound.playClick();
  };

  const handleLaunchRodeo = () => {
    const rodeoGame =
      GAMES_CATALOG.find(g => g.id === 'rodeo-crash-spribe') ||
      GAMES_CATALOG.find(g => g.id === 'babu22-rodeo-crash-vip') ||
      GAMES_CATALOG[0];
    setActiveGame(rodeoGame);
    sound.playClick();
  };

  const handleLaunchGunsmith = () => {
    const gunsmithGame =
      GAMES_CATALOG.find(g => g.id === 'gunsmith-armory-spribe') ||
      GAMES_CATALOG.find(g => g.id === 'babu22-gunsmith-specops-vip') ||
      GAMES_CATALOG[0];
    setActiveGame(gunsmithGame);
    sound.playClick();
  };

  const handleLaunchCowboyCrash = () => {
    const cowboyGame =
      GAMES_CATALOG.find(g => g.id === 'cowboy-crash-spribe') ||
      GAMES_CATALOG.find(g => g.id === 'babu22-cowboy-crash-vip') ||
      GAMES_CATALOG[0];
    setActiveGame(cowboyGame);
    sound.playClick();
  };

  const handleLaunchAnuket = () => {
    const anuketGame =
      GAMES_CATALOG.find(g => g.id === 'crown-of-anuket-spribe') ||
      GAMES_CATALOG.find(g => g.id === 'babu22-crown-of-anuket-vip') ||
      GAMES_CATALOG[0];
    setActiveGame(anuketGame);
    sound.playClick();
  };

  const handleLaunchChargeBuffalo = () => {
    const buffaloGame =
      GAMES_CATALOG.find(g => g.id === 'charge-buffalo-jili') ||
      GAMES_CATALOG.find(g => g.playableType === 'charge_buffalo') ||
      GAMES_CATALOG[0];
    setActiveGame(buffaloGame);
    sound.playClick();
  };

  const handleLaunchSuperAce = () => {
    const aceGame =
      GAMES_CATALOG.find(g => g.id === 'super-ace-jili') ||
      GAMES_CATALOG.find(g => g.playableType === 'super_ace') ||
      GAMES_CATALOG[0];
    setActiveGame(aceGame);
    sound.playClick();
  };

  const handleSlotShowcaseClick = (slotName?: string) => {
    const label = slotName ? `(${slotName}) ` : '';
    setDepositNotice(
      `Insufficient Balance — ${label}স্লট গেমটি খেলতে আপনার অ্যাকাউন্টে পর্যাপ্ত ব্যালেন্স নেই! অনুগ্রহ করে ডিপোজিট করুন।`
    );
    showToast('Insufficient Balance — আপনার অ্যাকাউন্টে পর্যাপ্ত ব্যালেন্স নেই!');
    sound.playCrash();
    setIsDepositOpen(true);
  };

  const handleRouletteShowcaseClick = (tableName?: string) => {
    const label = tableName ? `(${tableName}) ` : '';
    setDepositNotice(
      `Insufficient Balance — ${label}রুলেট গেমটি খেলতে আপনার অ্যাকাউন্টে পর্যাপ্ত ব্যালেন্স নেই! অনুগ্রহ করে ডিপোজিট করুন।`
    );
    showToast('Insufficient Balance — আপনার অ্যাকাউন্টে পর্যাপ্ত ব্যালেন্স নেই!');
    sound.playCrash();
    setIsDepositOpen(true);
  };

  // Filtered games
  const filteredGames = useMemo(() => {
    return GAMES_CATALOG.filter(game => {
      // Category match
      if (selectedCategory === 'popular' && game.badge !== 'HOT' && game.badge !== 'POPULAR') {
        return false;
      }
      if (selectedCategory !== 'all' && selectedCategory !== 'popular' && game.category !== selectedCategory) {
        return false;
      }
      // Provider match
      if (selectedProvider !== 'All' && game.provider !== selectedProvider) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchBn = game.titleBn.toLowerCase().includes(query);
        const matchEn = game.titleEn.toLowerCase().includes(query);
        const matchProv = game.provider.toLowerCase().includes(query);
        if (!matchBn && !matchEn && !matchProv) return false;
      }
      return true;
    });
  }, [selectedCategory, selectedProvider, searchQuery]);

  return (
    <div className="min-h-screen bg-[#0b0f19] text-gray-100 flex flex-col selection:bg-amber-500 selection:text-black">
      {/* VIP Tier Upgrade Congratulatory Toast Notification */}
      {vipUpgradeInfo && (
        <VipUpgradeToast
          newTier={vipUpgradeInfo.newTier}
          points={vipUpgradeInfo.points}
          prevTier={vipUpgradeInfo.prevTier}
          username={wallet.username}
          onClose={() => setVipUpgradeInfo(null)}
          onOpenProfile={() => {
            setVipUpgradeInfo(null);
            setIsProfileOpen(true);
          }}
        />
      )}

      {/* Standard Activity Toast Notification */}
      {toastMsg && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-amber-500 text-slate-950 font-bold text-xs sm:text-sm px-4 py-2.5 rounded-2xl shadow-xl shadow-amber-500/30 flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 fill-slate-950" />
          <span>{toastMsg}</span>
          <button onClick={() => setToastMsg(null)} className="ml-2 text-slate-950/70 hover:text-slate-950">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* When a game is active: Render the game in a dedicated full viewport overlay */}
      {activeGame ? (
        <div className="fixed inset-0 z-50 bg-[#090d16] flex flex-col">
          {activeGame.playableType === 'aviator' && (
            <AviatorGame
              balance={wallet.balance}
              onUpdateBalance={handleUpdateBalance}
              onClose={() => setActiveGame(null)}
              onOpenDeposit={() => setIsDepositOpen(true)}
            />
          )}

          {activeGame.playableType === 'slots' && (
            <SlotMachineGame
              balance={wallet.balance}
              onUpdateBalance={handleUpdateBalance}
              onClose={() => setActiveGame(null)}
              onOpenDeposit={() => setIsDepositOpen(true)}
            />
          )}

          {activeGame.playableType === 'roulette' && (
            <RouletteGame
              balance={wallet.balance}
              onUpdateBalance={handleUpdateBalance}
              onClose={() => setActiveGame(null)}
              onOpenDeposit={() => setIsDepositOpen(true)}
            />
          )}

          {activeGame.playableType === 'mines' && (
            <MinesGame
              balance={wallet.balance}
              onUpdateBalance={handleUpdateBalance}
              onClose={() => setActiveGame(null)}
              onOpenDeposit={() => setIsDepositOpen(true)}
            />
          )}

          {activeGame.playableType === 'dice' && (
            <DiceGame
              balance={wallet.balance}
              onUpdateBalance={handleUpdateBalance}
              onClose={() => setActiveGame(null)}
              onOpenDeposit={() => setIsDepositOpen(true)}
            />
          )}

          {activeGame.playableType === 'baccarat' && (
            <BaccaratGame
              balance={wallet.balance}
              onUpdateBalance={handleUpdateBalance}
              onClose={() => setActiveGame(null)}
              onOpenDeposit={() => setIsDepositOpen(true)}
            />
          )}

          {(activeGame.playableType === 'interactive_live' ||
            activeGame.playableType === 'game_show' ||
            activeGame.playableType === 'sicbo') && (
            <LiveInteractiveTable
              game={activeGame}
              balance={wallet.balance}
              onUpdateBalance={handleUpdateBalance}
              onClose={() => setActiveGame(null)}
              onOpenDeposit={() => setIsDepositOpen(true)}
            />
          )}

          {activeGame.playableType === 'babu22' && (
            <Babu22Game
              game={activeGame}
              balance={wallet.balance}
              onUpdateBalance={handleUpdateBalance}
              onClose={() => setActiveGame(null)}
              onOpenDeposit={() => setIsDepositOpen(true)}
            />
          )}

          {activeGame.playableType === 'under7' && (
            <Under7Game
              game={activeGame}
              balance={wallet.balance}
              onUpdateBalance={handleUpdateBalance}
              onClose={() => setActiveGame(null)}
              onOpenDeposit={() => setIsDepositOpen(true)}
            />
          )}

          {activeGame.playableType === 'olympus' && (
            <GatesOfOlympusGame
              game={activeGame}
              balance={wallet.balance}
              onUpdateBalance={handleUpdateBalance}
              onClose={() => setActiveGame(null)}
              onOpenDeposit={() => setIsDepositOpen(true)}
            />
          )}

          {activeGame.playableType === 'big_bass' && (
            <BigBassBonanzaGame
              game={activeGame}
              balance={wallet.balance}
              onUpdateBalance={handleUpdateBalance}
              onClose={() => setActiveGame(null)}
              onOpenDeposit={() => setIsDepositOpen(true)}
            />
          )}

          {activeGame.playableType === 'starlight' && (
            <StarlightPrincessGame
              game={activeGame}
              balance={wallet.balance}
              onUpdateBalance={handleUpdateBalance}
              onClose={() => setActiveGame(null)}
              onOpenDeposit={() => setIsDepositOpen(true)}
            />
          )}

          {activeGame.playableType === 'hades' && (
            <GatesOfHadesGame
              game={activeGame}
              balance={wallet.balance}
              onUpdateBalance={handleUpdateBalance}
              onClose={() => setActiveGame(null)}
              onOpenDeposit={() => setIsDepositOpen(true)}
            />
          )}

          {activeGame.playableType === 'fortune_tiger' && (
            <FortuneTigerGame
              game={activeGame}
              balance={wallet.balance}
              onUpdateBalance={handleUpdateBalance}
              onClose={() => setActiveGame(null)}
            />
          )}

          {activeGame.playableType === 'fortune_gems_3' && (
            <FortuneGems3Game
              game={activeGame}
              balance={wallet.balance}
              onUpdateBalance={handleUpdateBalance}
              onClose={() => setActiveGame(null)}
              onOpenDeposit={() => setIsDepositOpen(true)}
            />
          )}

          {activeGame.playableType === 'plinko' && (
            <PlinkoGame
              game={activeGame}
              balance={wallet.balance}
              onUpdateBalance={handleUpdateBalance}
              onClose={() => setActiveGame(null)}
              onOpenDeposit={() => setIsDepositOpen(true)}
            />
          )}

          {activeGame.playableType === 'rodeo' && (
            <RodeoCrashGame
              balance={wallet.balance}
              onUpdateBalance={handleUpdateBalance}
              onClose={() => setActiveGame(null)}
              onOpenDeposit={() => setIsDepositOpen(true)}
            />
          )}

          {activeGame.playableType === 'gunsmith' && (
            <GunsmithGame
              balance={wallet.balance}
              onUpdateBalance={handleUpdateBalance}
              onClose={() => setActiveGame(null)}
              onOpenDeposit={() => setIsDepositOpen(true)}
            />
          )}

          {activeGame.playableType === 'cowboy_crash' && (
            <CowboyCrashGame
              balance={wallet.balance}
              onUpdateBalance={handleUpdateBalance}
              onClose={() => setActiveGame(null)}
              onOpenDeposit={() => setIsDepositOpen(true)}
            />
          )}

          {activeGame.playableType === 'crown_of_anuket' && (
            <CrownOfAnuketGame
              balance={wallet.balance}
              onUpdateBalance={handleUpdateBalance}
              onClose={() => setActiveGame(null)}
              onOpenDeposit={() => setIsDepositOpen(true)}
            />
          )}

          {activeGame.playableType === 'boom_chest' && (
            <BoomChestGame
              balance={wallet.balance}
              onUpdateBalance={handleUpdateBalance}
              onClose={() => setActiveGame(null)}
              onOpenDeposit={() => setIsDepositOpen(true)}
            />
          )}

          {activeGame.playableType === 'cow_crash' && (
            <CowCrashGame
              balance={wallet.balance}
              onUpdateBalance={handleUpdateBalance}
              onClose={() => setActiveGame(null)}
              onOpenDeposit={() => setIsDepositOpen(true)}
            />
          )}

          {activeGame.playableType === 'drifty' && (
            <DriftyGame
              balance={wallet.balance}
              onUpdateBalance={handleUpdateBalance}
              onClose={() => setActiveGame(null)}
              onOpenDeposit={() => setIsDepositOpen(true)}
            />
          )}

          {activeGame.playableType === 'elevator' && (
            <ElevatorGame
              balance={wallet.balance}
              onUpdateBalance={handleUpdateBalance}
              onClose={() => setActiveGame(null)}
              onOpenDeposit={() => setIsDepositOpen(true)}
            />
          )}

          {activeGame.playableType === 'charge_buffalo' && (
            <ChargeBuffaloGame
              game={activeGame}
              balance={wallet.balance}
              onUpdateBalance={handleUpdateBalance}
              onClose={() => setActiveGame(null)}
              onOpenDeposit={() => setIsDepositOpen(true)}
            />
          )}

          {activeGame.playableType === 'super_ace' && (
            <SuperAceGame
              game={activeGame}
              balance={wallet.balance}
              onUpdateBalance={handleUpdateBalance}
              onClose={() => setActiveGame(null)}
              onOpenDeposit={() => setIsDepositOpen(true)}
            />
          )}
        </div>
      ) : (
        /* Main Casino Portal View */
        <>
          {/* Top Login Toll Bar */}
          <LoginToolbar
            isLoggedIn={isLoggedIn}
            wallet={wallet}
            firebaseUser={firebaseUser}
            isAdmin={isAdmin}
            onSignInWithGoogle={handleSignInWithGoogle}
            onOpenAdminPanel={() => setIsAdminPanelOpen(true)}
            onRefreshBalance={() => fetchMe()}
            onOpenLogin={() => {
              setAuthModalTab('login');
              setIsAuthModalOpen(true);
            }}
            onOpenRegister={() => {
              setAuthModalTab('register');
              setIsAuthModalOpen(true);
            }}
            onOpenForgotPassword={() => {
              setAuthModalTab('forgot');
              setIsAuthModalOpen(true);
            }}
            onDirectLogin={handleDirectLogin}
            onLogout={handleLogout}
            onOpenDeposit={() => {
              if (!isLoggedIn) {
                setAuthModalTab('login');
                setIsAuthModalOpen(true);
              } else {
                setIsDepositOpen(true);
              }
            }}
            onOpenWithdraw={() => {
              if (!isLoggedIn) {
                setAuthModalTab('login');
                setIsAuthModalOpen(true);
              } else {
                setIsWithdrawOpen(true);
              }
            }}
            onOpenProfile={() => {
              if (!isLoggedIn) {
                setAuthModalTab('login');
                setIsAuthModalOpen(true);
              } else {
                setIsProfileOpen(true);
              }
            }}
            onOpenSupport={() => setIsSupportModalOpen(true)}
            onOpenNotifications={() => {
              setUnreadNotificationsCount(0);
              setIsNotificationModalOpen(true);
            }}
            unreadNotificationsCount={unreadNotificationsCount}
          />

          <Navbar
            wallet={wallet}
            activeNav={selectedCategory}
            onSelectNav={nav => setSelectedCategory(nav as GameCategory)}
            onOpenDeposit={() => {
              if (!isLoggedIn) {
                setAuthModalTab('login');
                setIsAuthModalOpen(true);
              } else {
                setIsDepositOpen(true);
              }
            }}
            onOpenProfile={() => {
              if (!isLoggedIn) {
                setAuthModalTab('login');
                setIsAuthModalOpen(true);
              } else {
                setIsProfileOpen(true);
              }
            }}
            onOpenDailySpin={() => setIsDailySpinOpen(true)}
            onOpenAdminPanel={() => setIsAdminPanelOpen(true)}
            isAdmin={isAdmin}
            firebaseUser={firebaseUser}
            onSignInWithGoogle={handleSignInWithGoogle}
            isLoggedIn={isLoggedIn}
            onOpenLogin={() => {
              setAuthModalTab('login');
              setIsAuthModalOpen(true);
            }}
            onOpenRegister={() => {
              setAuthModalTab('register');
              setIsAuthModalOpen(true);
            }}
          />

          <main className="flex-1 max-w-7xl mx-auto w-full px-3 sm:px-6 lg:px-8">
            {/* Promotional Banner Carousel */}
            <HeroBanner
              onOpenDeposit={() => setIsDepositOpen(true)}
              onLaunchAviator={handleLaunchAviator}
              onOpenDailySpin={() => setIsDailySpinOpen(true)}
              onLaunchBabu22={handleLaunchBabu22}
              onLaunchUnder7={handleLaunchUnder7}
              onLaunchOlympus={handleLaunchOlympus}
              onLaunchBigBass={handleLaunchBigBass}
              onLaunchStarlight={handleLaunchStarlight}
              onLaunchHades={handleLaunchHades}
              onLaunchFortuneTiger={handleLaunchFortuneTiger}
              onLaunchFortuneGems={handleLaunchFortuneGems}
              onLaunchPlinko={handleLaunchPlinko}
              onLaunchDice={handleLaunchDice}
              onLaunchRodeo={handleLaunchRodeo}
              onLaunchGunsmith={handleLaunchGunsmith}
              onLaunchCowboyCrash={handleLaunchCowboyCrash}
              onLaunchAnuket={handleLaunchAnuket}
              onLaunchChargeBuffalo={handleLaunchChargeBuffalo}
              onLaunchSuperAce={handleLaunchSuperAce}
            />

            {/* Live Jackpot Ticker Bar */}
            <div className="my-4 py-2.5 px-4 bg-gradient-to-r from-amber-950/40 via-slate-900 to-amber-950/40 border border-amber-500/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-lg">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  গ্র্যান্ড প্রাইজপুল জ্যাকপট:
                </span>
                <span className="font-mono font-black text-sm sm:text-base text-white tracking-wider tabular-nums">
                  ৳ ১,৮৪,৭২,৫৫০
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span className="text-emerald-400 font-medium">ইনস্ট্যান্ট বিকাশ ও নগদ ক্যাশআউট</span>
                <span aria-hidden="true">•</span>
                <span className="text-gray-400">Babu22 এক্সক্লুসিভ VIP প্ল্যাটফর্ম</span>
              </div>
            </div>

            {/* Category & Provider Filters */}
            <CategoryFilter
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              selectedProvider={selectedProvider}
              onSelectProvider={setSelectedProvider}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              totalGamesCount={filteredGames.length}
            />

            {/* Uploaded Slot Photos & Slot Option Showcase on First Page */}
            {(selectedCategory === 'all' || selectedCategory === 'popular' || selectedCategory === 'slots') &&
              !searchQuery.trim() && (
                <SlotShowcaseSection onSelectSlotAction={handleSlotShowcaseClick} />
              )}

            {/* Uploaded Roulette Photos & Roulette Options Showcase */}
            {(selectedCategory === 'all' ||
              selectedCategory === 'popular' ||
              selectedCategory === 'live' ||
              selectedCategory === 'roulette') &&
              !searchQuery.trim() && (
                <RouletteShowcaseSection onSelectRouletteAction={handleRouletteShowcaseClick} />
              )}

            {/* Section Header with live indicator */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                <h2 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
                  <span>Babu22 লাইভ ক্যাসিনো ও আর্কেড গেমস</span>
                  <span className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full font-mono">
                    HOT {filteredGames.length}+
                  </span>
                </h2>
              </div>
              <div className="text-xs text-gray-400 hidden sm:block">
                রিয়েল-টাইম ডিলার ও সরাসরি প্লেয়ার টেবিলে যুক্ত হোন
              </div>
            </div>

            {/* Featured Games Grid (8 Columns on wide desktop matching 20bets.asia layout) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2.5 sm:gap-3">
              {filteredGames.map(game => (
                <GameCard
                  key={game.id}
                  game={game}
                  onSelectGame={game => {
                    setActiveGame(game);
                    sound.playClick();
                  }}
                />
              ))}
            </div>

            {filteredGames.length === 0 && (
              <div className="text-center py-16 bg-slate-900/40 rounded-3xl border border-gray-800 my-6">
                <p className="text-gray-400 text-sm">কোনো গেম খুঁজে পাওয়া যায়নি!</p>
                <button
                  onClick={() => {
                    setSelectedCategory('all');
                    setSelectedProvider('All');
                    setSearchQuery('');
                  }}
                  className="mt-3 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold rounded-xl"
                >
                  সব গেম দেখুন
                </button>
              </div>
            )}

          </main>

          <Footer />

          {/* Mobile Bottom Navigation */}
          <MobileBottomNav
            activeTab={selectedCategory}
            onSelectTab={tab => setSelectedCategory(tab as GameCategory)}
            onOpenDeposit={() => {
              if (!isLoggedIn) {
                setAuthModalTab('login');
                setIsAuthModalOpen(true);
              } else {
                setIsDepositOpen(true);
              }
            }}
            onOpenProfile={() => {
              if (!isLoggedIn) {
                setAuthModalTab('login');
                setIsAuthModalOpen(true);
              } else {
                setIsProfileOpen(true);
              }
            }}
            onLaunchAviator={handleLaunchAviator}
          />
        </>
      )}

      {/* Modals */}
      <DepositModal
        isOpen={isDepositOpen}
        onClose={() => {
          setIsDepositOpen(false);
          setDepositNotice(null);
        }}
        firebaseUser={firebaseUser}
        onSignInWithGoogle={handleSignInWithGoogle}
        myDeposits={myDeposits}
        onDepositSubmitted={handleDepositSubmitted}
        usedTrxIds={usedTrxIds}
        appSettings={appSettings}
        insufficientFundsMsg={depositNotice}
      />
      <WithdrawModal
        isOpen={isWithdrawOpen}
        onClose={() => setIsWithdrawOpen(false)}
        balance={wallet.balance}
        onWithdrawSuccess={handleWithdrawSuccess}
        appSettings={appSettings}
        userId={firebaseUser?.uid || wallet.username || 'user_guest'}
        userEmail={firebaseUser?.email || (isLoggedIn ? `${wallet.username.toLowerCase()}@babu22.vip` : '')}
        username={wallet.username}
      />
      <DailySpinModal
        isOpen={isDailySpinOpen}
        onClose={() => setIsDailySpinOpen(false)}
        onRewardWon={handleRewardWon}
      />
      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        wallet={wallet}
        transactions={transactions}
        onOpenDeposit={() => setIsDepositOpen(true)}
        onOpenWithdraw={() => setIsWithdrawOpen(true)}
        onAddVipPoints={pts => awardVipPoints(pts, 'ম্যানুয়াল বোনাস পয়েন্ট')}
        onLogout={handleLogout}
      />

      {/* Secure Admin Panel Modal */}
      <AdminPanelModal
        isOpen={isAdminPanelOpen}
        onClose={() => setIsAdminPanelOpen(false)}
        firebaseUser={firebaseUser}
        onSignInWithGoogle={handleSignInWithGoogle}
        onSignOutGoogle={handleSignOutGoogle}
        onApprovedSuccess={msg => {
          showToast(msg);
          fetchMe();
        }}
      />

      {/* Login & Registration Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialTab={authModalTab}
        onLoginSuccess={handleLoginSuccess}
        onRegisterSuccess={handleRegisterSuccess}
        onSignInWithGoogle={handleSignInWithGoogle}
      />

      {/* 24/7 Live Customer Support Modal */}
      <LiveSupportModal
        isOpen={isSupportModalOpen}
        onClose={() => setIsSupportModalOpen(false)}
        username={wallet.username}
        onOpenDeposit={() => setIsDepositOpen(true)}
      />

      {/* Notifications & System Announcements Modal */}
      <NotificationModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
        onOpenDeposit={() => setIsDepositOpen(true)}
        onLaunchFortuneTiger={handleLaunchFortuneTiger}
        onLaunchFortuneGems={handleLaunchFortuneGems}
        onLaunchPlinko={handleLaunchPlinko}
      />
    </div>
  );
}
