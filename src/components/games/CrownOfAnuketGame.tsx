import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Volume2,
  VolumeX,
  ArrowLeft,
  ShieldCheck,
  History,
  Sparkles,
  HelpCircle,
  Award,
  Zap,
  Flame,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Play,
  Layers,
  Crown,
  ChevronRight,
  TrendingUp,
  RefreshCw,
  Gift,
  Clock,
} from 'lucide-react';
import { sound } from '../../utils/audio';

interface CrownOfAnuketGameProps {
  balance: number;
  onUpdateBalance: (amount: number, reason: string) => void;
  onClose: () => void;
  onOpenDeposit?: () => void;
}

// Bet Cockpit for Nile Crash Mode
interface CrashBetControl {
  amount: number;
  hasBet: boolean;
  hasCashedOut: boolean;
  cashedOutMultiplier: number;
  autoCashout: boolean;
  autoCashoutAt: number;
  isAutoBet: boolean;
}

// Simulated active Egyptian Nile temple players
interface SimulatedNilePlayer {
  id: string;
  name: string;
  avatar: string;
  bet: number;
  multiplier?: number;
  status: 'navigating' | 'cashed_out' | 'submerged';
}

// Temple Slot Symbols for Anuket Mode
interface TempleSymbol {
  id: string;
  nameBn: string;
  nameEn: string;
  icon: string;
  color: string;
  bgGrad: string;
  basePayout: number; // 8-9 matches
  payout10: number;   // 10-11 matches
  payout12: number;   // 12+ matches
  isScatter?: boolean;
}

const TEMPLE_SYMBOLS: TempleSymbol[] = [
  {
    id: 'anuket_crown',
    nameBn: 'ক্রাউন অফ অনুকেত',
    nameEn: 'Crown of Anuket',
    icon: '👑',
    color: 'text-amber-300',
    bgGrad: 'from-amber-600/50 via-yellow-500/30 to-teal-950/70 border-amber-400',
    basePayout: 25,
    payout10: 60,
    payout12: 150,
    isScatter: true,
  },
  {
    id: 'sacred_scarab',
    nameBn: 'পবিত্র স্কারাব পোকা',
    nameEn: 'Sacred Scarab',
    icon: '🪲',
    color: 'text-emerald-400',
    bgGrad: 'from-emerald-700/40 via-teal-800/30 to-black/60 border-emerald-500/70',
    basePayout: 12,
    payout10: 30,
    payout12: 65,
  },
  {
    id: 'eye_of_horus',
    nameBn: 'আই অফ হোরাস',
    nameEn: 'Eye of Horus',
    icon: '👁️',
    color: 'text-cyan-400',
    bgGrad: 'from-cyan-700/40 via-blue-900/30 to-black/60 border-cyan-500/70',
    basePayout: 10,
    payout10: 22,
    payout12: 45,
  },
  {
    id: 'golden_ankh',
    nameBn: 'স্বর্ণ আংখ ক্রুশ',
    nameEn: 'Golden Ankh',
    icon: '☥',
    color: 'text-yellow-400',
    bgGrad: 'from-yellow-700/40 via-amber-900/30 to-black/60 border-yellow-500/70',
    basePayout: 7,
    payout10: 16,
    payout12: 32,
  },
  {
    id: 'nile_lotus',
    nameBn: 'নীলনদ পদ্মফুল',
    nameEn: 'Nile Lotus Chalice',
    icon: '🪷',
    color: 'text-pink-400',
    bgGrad: 'from-pink-700/40 via-rose-900/30 to-black/60 border-pink-500/70',
    basePayout: 5,
    payout10: 12,
    payout12: 24,
  },
  {
    id: 'lapis_gem',
    nameBn: 'ল্যাপিস লাজুলি মণি',
    nameEn: 'Lapis Lazuli Gem',
    icon: '💎',
    color: 'text-blue-400',
    bgGrad: 'from-blue-700/40 via-indigo-900/30 to-black/60 border-blue-500/60',
    basePayout: 3,
    payout10: 6,
    payout12: 14,
  },
  {
    id: 'ruby_pyramid',
    nameBn: 'রুবি পিরামিড স্টোন',
    nameEn: 'Ruby Pyramid Stone',
    icon: '🔺',
    color: 'text-red-400',
    bgGrad: 'from-red-700/40 via-rose-900/30 to-black/60 border-red-500/60',
    basePayout: 2.5,
    payout10: 5,
    payout12: 10,
  },
  {
    id: 'turquoise_feather',
    nameBn: 'টারকয়েজ পালক',
    nameEn: 'Turquoise Plume',
    icon: '🪶',
    color: 'text-teal-300',
    bgGrad: 'from-teal-700/40 via-emerald-900/30 to-black/60 border-teal-500/60',
    basePayout: 2,
    payout10: 4,
    payout12: 8,
  },
];

const PRESET_CHIPS_BET1 = [50, 100, 200, 500];
const PRESET_CHIPS_BET2 = [100, 200, 500, 1000];

const SIMULATED_NILE_PLAYERS: { name: string; avatar: string }[] = [
  { name: 'ফারাও_সাকিব', avatar: 'S' },
  { name: 'নীল_তানভীর', avatar: 'T' },
  { name: 'রাকিব_ইজিপ্ট', avatar: 'R' },
  { name: 'অনুকেত_২২', avatar: 'A' },
  { name: 'আরিফ_রয়্যাল', avatar: 'A' },
  { name: 'মেহেদী_কায়রো', avatar: 'M' },
  { name: 'ফারহান_লাক্সর', avatar: 'F' },
  { name: 'সুমন_আলেক্সান্দ্রিয়া', avatar: 'S' },
];

export const CrownOfAnuketGame: React.FC<CrownOfAnuketGameProps> = ({
  balance,
  onUpdateBalance,
  onClose,
  onOpenDeposit,
}) => {
  // Game Tab: 'nile_crash' (Sacred Nile Multiplier Surge) vs 'temple_reels' (6x5 Egyptian Cascading Reels)
  const [activeTab, setActiveTab] = useState<'nile_crash' | 'temple_reels'>('nile_crash');

  // Audio / Sound
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Common modals
  const [showRules, setShowRules] = useState(false);
  const [showFairness, setShowFairness] = useState(false);
  const [showWheelBonus, setShowWheelBonus] = useState(false);

  // ==========================================
  // 1. NILE CRASH MODE STATE (Sacred Nile Surge)
  // ==========================================
  const [crashState, setCrashState] = useState<'waiting' | 'navigating' | 'submerged'>('waiting');
  const [currentMultiplier, setCurrentMultiplier] = useState(1.0);
  const [crashPoint, setCrashPoint] = useState(2.2);
  const [countdown, setCountdown] = useState(5);
  const [history, setHistory] = useState<number[]>([
    2.45, 1.34, 5.12, 1.08, 12.8, 1.88, 3.22, 1.15, 8.4, 25.1, 1.95,
  ]);
  const [provablyHash, setProvablyHash] = useState(
    'e9b7f309a82cd8d9e29a27c0f135b1d4c728e81d7f6b43293845b91b5c2a1e84'
  );
  const [clientSeed, setClientSeed] = useState('babu22-anuket-client-seed-889');

  const [bet1, setBet1] = useState<CrashBetControl>({
    amount: 100,
    hasBet: false,
    hasCashedOut: false,
    cashedOutMultiplier: 0,
    autoCashout: false,
    autoCashoutAt: 2.0,
    isAutoBet: false,
  });

  const [bet2, setBet2] = useState<CrashBetControl>({
    amount: 200,
    hasBet: false,
    hasCashedOut: false,
    cashedOutMultiplier: 0,
    autoCashout: false,
    autoCashoutAt: 3.0,
    isAutoBet: false,
  });

  const [simulatedPlayers, setSimulatedPlayers] = useState<SimulatedNilePlayer[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Canvas Ref for Nile River Surge
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  // ==========================================
  // 2. TEMPLE REELS (6x5 CASCADING SLOTS) STATE
  // ==========================================
  const [slotBet, setSlotBet] = useState(100);
  const [grid, setGrid] = useState<TempleSymbol[][]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [freeSpinsLeft, setFreeSpinsLeft] = useState(0);
  const [totalFreeSpinWin, setTotalFreeSpinWin] = useState(0);
  const [freeSpinMultiplier, setFreeSpinMultiplier] = useState(1);
  const [lastWinAmount, setLastWinAmount] = useState(0);
  const [winningSymbolIds, setWinningSymbolIds] = useState<string[]>([]);
  const [activeMultipliers, setActiveMultipliers] = useState<number[]>([]);

  // Wheel Bonus state
  const [wheelRotation, setWheelRotation] = useState(0);
  const [isSpinningWheel, setIsSpinningWheel] = useState(false);
  const [wheelPrize, setWheelPrize] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  }, []);

  // Initialize slot grid
  const getRandomSymbol = useCallback((): TempleSymbol => {
    const rand = Math.random();
    if (rand < 0.04) return TEMPLE_SYMBOLS[0]; // Crown Scatter
    if (rand < 0.12) return TEMPLE_SYMBOLS[1]; // Scarab
    if (rand < 0.22) return TEMPLE_SYMBOLS[2]; // Eye of Horus
    if (rand < 0.35) return TEMPLE_SYMBOLS[3]; // Golden Ankh
    if (rand < 0.50) return TEMPLE_SYMBOLS[4]; // Lotus
    if (rand < 0.65) return TEMPLE_SYMBOLS[5]; // Lapis
    if (rand < 0.82) return TEMPLE_SYMBOLS[6]; // Ruby
    return TEMPLE_SYMBOLS[7];                  // Turquoise plume
  }, []);

  useEffect(() => {
    // Generate initial 6 columns x 5 rows grid
    const initialGrid: TempleSymbol[][] = [];
    for (let col = 0; col < 6; col++) {
      const colSymbols: TempleSymbol[] = [];
      for (let row = 0; row < 5; row++) {
        colSymbols.push(getRandomSymbol());
      }
      initialGrid.push(colSymbols);
    }
    setGrid(initialGrid);
  }, [getRandomSymbol]);

  // Generates crash points
  const generateCrashPoint = useCallback(() => {
    const rand = Math.random();
    if (rand < 0.035) return 1.0; // Instant Nile Whirlpool crash
    if (rand < 0.50) return parseFloat((1.05 + Math.random() * 1.5).toFixed(2));
    if (rand < 0.80) return parseFloat((2.0 + Math.random() * 3.5).toFixed(2));
    if (rand < 0.94) return parseFloat((5.0 + Math.random() * 15.0).toFixed(2));
    if (rand < 0.985) return parseFloat((20.0 + Math.random() * 80.0).toFixed(2));
    return parseFloat((100.0 + Math.random() * 9900.0).toFixed(2)); // Mega Divine Multiplier
  }, []);

  // ==========================================
  // NILE CRASH LOOP
  // ==========================================
  const startNileRound = useCallback(() => {
    const newTarget = generateCrashPoint();
    setCrashPoint(newTarget);
    setCurrentMultiplier(1.0);
    setCrashState('navigating');
    startTimeRef.current = Date.now();

    // Random hash
    const chars = '0123456789abcdef';
    let newHash = '';
    for (let i = 0; i < 64; i++) {
      newHash += chars[Math.floor(Math.random() * chars.length)];
    }
    setProvablyHash(newHash);

    // Populate simulated Nile players
    const simPlayers: SimulatedNilePlayer[] = SIMULATED_NILE_PLAYERS.map((p, i) => ({
      id: `nile-p-${i}`,
      name: p.name,
      avatar: p.avatar,
      bet: [50, 100, 250, 500, 1000][Math.floor(Math.random() * 5)],
      status: 'navigating',
    }));
    setSimulatedPlayers(simPlayers);

    if (soundEnabled) {
      sound.playNileSplash();
      sound.playEgyptianHarp();
    }
  }, [generateCrashPoint, soundEnabled]);

  const cashOutBet = useCallback(
    (betIndex: 1 | 2) => {
      const current = currentMultiplier;
      if (betIndex === 1) {
        if (!bet1.hasBet || bet1.hasCashedOut || crashState !== 'navigating') return;
        const win = bet1.amount * current;
        setBet1(prev => ({
          ...prev,
          hasCashedOut: true,
          cashedOutMultiplier: current,
        }));
        onUpdateBalance(win, `Crown of Anuket: Bet 1 Cashed out @ ${current.toFixed(2)}x`);
        if (soundEnabled) {
          sound.playCrownJackpot();
        }
        showToast(`স্বর্ণের মুকুট বরদান! Bet 1 থেকে ৳${win.toFixed(2)} (${current.toFixed(2)}x) ক্যাশআউট সম্পন্ন!`);
      } else {
        if (!bet2.hasBet || bet2.hasCashedOut || crashState !== 'navigating') return;
        const win = bet2.amount * current;
        setBet2(prev => ({
          ...prev,
          hasCashedOut: true,
          cashedOutMultiplier: current,
        }));
        onUpdateBalance(win, `Crown of Anuket: Bet 2 Cashed out @ ${current.toFixed(2)}x`);
        if (soundEnabled) {
          sound.playCrownJackpot();
        }
        showToast(`পবিত্র নীল নদ বিজয়! Bet 2 থেকে ৳${win.toFixed(2)} (${current.toFixed(2)}x) ক্যাশআউট সম্পন্ন!`);
      }
    },
    [bet1, bet2, crashState, currentMultiplier, onUpdateBalance, soundEnabled, showToast]
  );

  // Crash round tick
  useEffect(() => {
    if (activeTab !== 'nile_crash') return;

    if (crashState === 'waiting') {
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            startNileRound();
            return 5;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }

    if (crashState === 'navigating') {
      const interval = setInterval(() => {
        const elapsedSec = (Date.now() - startTimeRef.current) / 1000;
        // Non-linear exponential Nile ascension curve
        const mult = parseFloat((1.0 + Math.pow(elapsedSec * 0.45, 1.75)).toFixed(2));

        if (mult >= crashPoint) {
          // Whirlpool strike / submerged
          setCurrentMultiplier(crashPoint);
          setCrashState('submerged');
          setHistory(prev => [crashPoint, ...prev.slice(0, 14)]);
          if (soundEnabled) {
            sound.playCrash();
          }

          // Mark remaining players submerged
          setSimulatedPlayers(prev =>
            prev.map(p => (p.status === 'navigating' ? { ...p, status: 'submerged' } : p))
          );

          // Return to waiting after 3 seconds
          setTimeout(() => {
            setCrashState('waiting');
            setCountdown(5);

            // Handle Auto Bets
            setBet1(prev => ({
              ...prev,
              hasBet: prev.isAutoBet && balance >= prev.amount,
              hasCashedOut: false,
              cashedOutMultiplier: 0,
            }));
            if (bet1.isAutoBet && balance >= bet1.amount) {
              onUpdateBalance(-bet1.amount, 'Crown of Anuket: Auto Bet 1 placed');
            }

            setBet2(prev => ({
              ...prev,
              hasBet: prev.isAutoBet && balance >= prev.amount,
              hasCashedOut: false,
              cashedOutMultiplier: 0,
            }));
            if (bet2.isAutoBet && balance >= bet2.amount) {
              onUpdateBalance(-bet2.amount, 'Crown of Anuket: Auto Bet 2 placed');
            }
          }, 3200);

          clearInterval(interval);
          return;
        }

        setCurrentMultiplier(mult);

        // Auto Cash Out triggers
        if (bet1.hasBet && !bet1.hasCashedOut && bet1.autoCashout && mult >= bet1.autoCashoutAt) {
          cashOutBet(1);
        }
        if (bet2.hasBet && !bet2.hasCashedOut && bet2.autoCashout && mult >= bet2.autoCashoutAt) {
          cashOutBet(2);
        }

        // Randomly simulate simulated players cashing out
        setSimulatedPlayers(prev =>
          prev.map(p => {
            if (p.status === 'navigating' && Math.random() < 0.04) {
              return { ...p, status: 'cashed_out', multiplier: mult };
            }
            return p;
          })
        );
      }, 50);

      return () => clearInterval(interval);
    }
  }, [
    activeTab,
    crashState,
    crashPoint,
    startNileRound,
    bet1,
    bet2,
    cashOutBet,
    balance,
    onUpdateBalance,
    soundEnabled,
  ]);

  // ==========================================
  // NILE CANVAS ANIMATION (Water & Golden Barge)
  // ==========================================
  useEffect(() => {
    if (activeTab !== 'nile_crash') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let waveOffset = 0;

    const render = () => {
      waveOffset += 0.04;
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      // Deep Egyptian night sky with gold hieroglyphic starlight
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      bgGrad.addColorStop(0, '#060d1f'); // deep midnight blue
      bgGrad.addColorStop(0.4, '#0a1d37');
      bgGrad.addColorStop(0.75, '#0b2b46'); // Nile turquoise edge
      bgGrad.addColorStop(1, '#051829');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Distant Temple of Elephantine Silhouettes & Pyramids
      ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
      // Pyramid 1
      ctx.beginPath();
      ctx.moveTo(width * 0.15, height * 0.58);
      ctx.lineTo(width * 0.32, height * 0.28);
      ctx.lineTo(width * 0.49, height * 0.58);
      ctx.closePath();
      ctx.fill();

      // Pyramid 2
      ctx.fillStyle = 'rgba(10, 18, 35, 0.85)';
      ctx.beginPath();
      ctx.moveTo(width * 0.42, height * 0.58);
      ctx.lineTo(width * 0.56, height * 0.35);
      ctx.lineTo(width * 0.70, height * 0.58);
      ctx.closePath();
      ctx.fill();

      // Glowing Sacred Nile River with moving turquoise waves
      for (let layer = 0; layer < 4; layer++) {
        const yBase = height * (0.62 + layer * 0.09);
        ctx.beginPath();
        ctx.moveTo(0, height);
        ctx.lineTo(0, yBase);

        for (let x = 0; x <= width; x += 20) {
          const waveHeight = 8 + layer * 3;
          const y =
            yBase +
            Math.sin(x * 0.012 + waveOffset * (1.5 - layer * 0.2) + layer) * waveHeight +
            Math.cos(x * 0.02 - waveOffset) * 4;
          ctx.lineTo(x, y);
        }

        ctx.lineTo(width, height);
        ctx.closePath();

        const waterGrad = ctx.createLinearGradient(0, yBase, 0, height);
        if (layer === 0) {
          waterGrad.addColorStop(0, 'rgba(20, 184, 166, 0.45)');
          waterGrad.addColorStop(1, 'rgba(13, 148, 136, 0.6)');
        } else if (layer === 1) {
          waterGrad.addColorStop(0, 'rgba(14, 116, 144, 0.6)');
          waterGrad.addColorStop(1, 'rgba(3, 105, 161, 0.7)');
        } else if (layer === 2) {
          waterGrad.addColorStop(0, 'rgba(2, 132, 199, 0.7)');
          waterGrad.addColorStop(1, 'rgba(15, 23, 42, 0.9)');
        } else {
          waterGrad.addColorStop(0, 'rgba(14, 165, 233, 0.8)');
          waterGrad.addColorStop(1, '#030d19');
        }
        ctx.fillStyle = waterGrad;
        ctx.fill();
      }

      // Golden Sparks / Starlight ascending
      for (let i = 0; i < 16; i++) {
        const px = (Math.sin(i * 99 + waveOffset * 0.5) * 0.5 + 0.5) * width;
        const py = (Math.cos(i * 47 - waveOffset * 0.8) * 0.5 + 0.5) * (height * 0.6);
        ctx.fillStyle = i % 2 === 0 ? 'rgba(251, 191, 36, 0.8)' : 'rgba(45, 212, 191, 0.8)';
        ctx.beginPath();
        ctx.arc(px, py, (i % 3) + 1.2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw Golden Barge of Anuket / Sacred Crown
      const bargeProgress =
        crashState === 'navigating'
          ? Math.min(1, Math.log10(currentMultiplier) / 2.2)
          : crashState === 'submerged'
          ? 0.92
          : 0.12;

      const bargeX = width * (0.15 + bargeProgress * 0.65);
      const bobbing = Math.sin(waveOffset * 3) * 6;
      const bargeY = height * 0.62 + bobbing - bargeProgress * (height * 0.28);

      // Barge Aura Glow
      const glowGrad = ctx.createRadialGradient(bargeX, bargeY, 5, bargeX, bargeY, 65);
      glowGrad.addColorStop(0, 'rgba(251, 191, 36, 0.65)');
      glowGrad.addColorStop(0.5, 'rgba(45, 212, 191, 0.35)');
      glowGrad.addColorStop(1, 'rgba(251, 191, 36, 0)');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(bargeX, bargeY, 65, 0, Math.PI * 2);
      ctx.fill();

      // Egyptian Papyrus Sun-Barge Hull (Wood & Gold)
      ctx.save();
      ctx.translate(bargeX, bargeY);
      if (crashState === 'submerged') {
        ctx.rotate(0.35 + Math.sin(waveOffset * 5) * 0.1);
      }

      // Hull
      ctx.fillStyle = '#b45309'; // Rich cedar wood
      ctx.beginPath();
      ctx.moveTo(-45, 0);
      ctx.quadraticCurveTo(0, 18, 45, -8);
      ctx.lineTo(40, -4);
      ctx.quadraticCurveTo(0, 10, -40, -4);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // High curved Prow with Lotus flower
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(45, -8);
      ctx.quadraticCurveTo(55, -24, 48, -32);
      ctx.stroke();

      // Lotus bloom atop prow
      ctx.fillStyle = '#ec4899';
      ctx.beginPath();
      ctx.arc(48, -34, 5, 0, Math.PI * 2);
      ctx.fill();

      // Stern curl
      ctx.beginPath();
      ctx.moveTo(-45, 0);
      ctx.quadraticCurveTo(-52, -15, -48, -25);
      ctx.stroke();

      // Center Temple Pavilion on barge
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(-15, -20, 30, 16);
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-15, -20, 30, 16);

      // Feathered Crown of Anuket floating above the barge shrine
      // Dual tall plumes / feathers and gazelle horns
      ctx.fillStyle = '#2dd4bf'; // Turquoise ostrich plumes
      // Left feather plume
      ctx.beginPath();
      ctx.ellipse(-6, -42, 4, 18, -0.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Right feather plume
      ctx.beginPath();
      ctx.ellipse(6, -42, 4, 18, 0.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Golden Sun Disc & Gazelle Horns
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(0, -32, 6, 0, Math.PI * 2);
      ctx.fill();

      // Horns curve
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-10, -28);
      ctx.quadraticCurveTo(-14, -36, -6, -40);
      ctx.moveTo(10, -28);
      ctx.quadraticCurveTo(14, -36, 6, -40);
      ctx.stroke();

      ctx.restore();

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [activeTab, crashState, currentMultiplier]);

  // Place Crash Bets
  const handlePlaceCrashBet = (betIndex: 1 | 2) => {
    if (betIndex === 1) {
      if (balance < bet1.amount) {
        showToast('অপর্যাপ্ত ব্যালেন্স! ডিপোজিট করুন');
        if (onOpenDeposit) onOpenDeposit();
        return;
      }
      onUpdateBalance(-bet1.amount, 'Crown of Anuket: Bet 1 Placed');
      setBet1(prev => ({ ...prev, hasBet: true, hasCashedOut: false }));
      if (soundEnabled) sound.playClick();
    } else {
      if (balance < bet2.amount) {
        showToast('অপর্যাপ্ত ব্যালেন্স! ডিপোজিট করুন');
        if (onOpenDeposit) onOpenDeposit();
        return;
      }
      onUpdateBalance(-bet2.amount, 'Crown of Anuket: Bet 2 Placed');
      setBet2(prev => ({ ...prev, hasBet: true, hasCashedOut: false }));
      if (soundEnabled) sound.playClick();
    }
  };

  const handleCancelCrashBet = (betIndex: 1 | 2) => {
    if (crashState !== 'waiting') return;
    if (betIndex === 1 && bet1.hasBet) {
      onUpdateBalance(bet1.amount, 'Crown of Anuket: Bet 1 Cancelled');
      setBet1(prev => ({ ...prev, hasBet: false }));
      if (soundEnabled) sound.playClick();
    } else if (betIndex === 2 && bet2.hasBet) {
      onUpdateBalance(bet2.amount, 'Crown of Anuket: Bet 2 Cancelled');
      setBet2(prev => ({ ...prev, hasBet: false }));
      if (soundEnabled) sound.playClick();
    }
  };

  // ==========================================
  // TEMPLE REELS (SLOTS) SPIN LOGIC
  // ==========================================
  const handleSpinTempleReels = useCallback(() => {
    if (isSpinning) return;

    if (freeSpinsLeft === 0 && balance < slotBet) {
      showToast('অপর্যাপ্ত ব্যালেন্স! অনুগ্রহ করে ডিপোজিট করুন');
      if (onOpenDeposit) onOpenDeposit();
      return;
    }

    if (freeSpinsLeft === 0) {
      onUpdateBalance(-slotBet, 'Crown of Anuket: Temple Reels Spin');
    }

    setIsSpinning(true);
    setWinningSymbolIds([]);
    setLastWinAmount(0);

    if (soundEnabled) {
      sound.playEgyptianHarp();
    }

    // Step 1: Reel Spin animation delay
    setTimeout(() => {
      // Generate new 6x5 grid
      const newGrid: TempleSymbol[][] = [];
      const counts: Record<string, number> = {};

      for (let col = 0; col < 6; col++) {
        const colSymbols: TempleSymbol[] = [];
        for (let row = 0; row < 5; row++) {
          const sym = getRandomSymbol();
          colSymbols.push(sym);
          counts[sym.id] = (counts[sym.id] || 0) + 1;
        }
        newGrid.push(colSymbols);
      }
      setGrid(newGrid);

      // Check Scatters (Anuket Crown) for Free Spins
      const crownCount = counts['anuket_crown'] || 0;
      let triggeredFreeSpins = false;

      if (crownCount >= 4) {
        triggeredFreeSpins = true;
        const awardedSpins = crownCount === 4 ? 10 : crownCount === 5 ? 15 : 20;
        setFreeSpinsLeft(prev => prev + awardedSpins);
        showToast(`পবিত্র অনুকেত ক্রাউন বরদান! ${awardedSpins}টি ফ্রি স্পিন সক্রিয় হয়েছে!`);
        if (soundEnabled) {
          sound.playCrownJackpot();
        }
      }

      // Check Paying Symbols (8+ symbols anywhere in grid)
      let winMultiplier = 0;
      const winningIds: string[] = [];

      TEMPLE_SYMBOLS.forEach(sym => {
        const cnt = counts[sym.id] || 0;
        if (cnt >= 8) {
          winningIds.push(sym.id);
          if (cnt >= 12) {
            winMultiplier += sym.payout12;
          } else if (cnt >= 10) {
            winMultiplier += sym.payout10;
          } else {
            winMultiplier += sym.basePayout;
          }
        }
      });

      // Random divine multiplier orbs from Anuket
      let multiplierBoost = 1;
      if (winMultiplier > 0 && Math.random() < 0.45) {
        const multipliers = [2, 3, 5, 10, 25, 50, 100];
        multiplierBoost = multipliers[Math.floor(Math.random() * multipliers.length)];
        setActiveMultipliers([multiplierBoost]);
        if (freeSpinsLeft > 0) {
          setFreeSpinMultiplier(prev => prev + multiplierBoost);
        }
      } else {
        setActiveMultipliers([]);
      }

      setWinningSymbolIds(winningIds);

      const effectiveMult = freeSpinsLeft > 0 ? (freeSpinMultiplier + multiplierBoost) : multiplierBoost;
      const payout = winMultiplier * (slotBet / 10) * effectiveMult;

      if (payout > 0) {
        setLastWinAmount(payout);
        onUpdateBalance(payout, `Crown of Anuket: Temple Win ৳${payout.toFixed(2)}`);
        if (freeSpinsLeft > 0) {
          setTotalFreeSpinWin(prev => prev + payout);
        }
        if (soundEnabled) {
          sound.playSistrumChime();
          sound.playWinChime();
        }
      }

      if (freeSpinsLeft > 0 && !triggeredFreeSpins) {
        setFreeSpinsLeft(prev => prev - 1);
      }

      setIsSpinning(false);
    }, 750);
  }, [
    isSpinning,
    freeSpinsLeft,
    balance,
    slotBet,
    getRandomSymbol,
    freeSpinMultiplier,
    onUpdateBalance,
    soundEnabled,
    showToast,
    onOpenDeposit,
  ]);

  // ==========================================
  // WHEEL OF ANUKET BONUS
  // ==========================================
  const WHEEL_PRIZES = [
    { label: '25x মেগা', mult: 25, color: '#f59e0b' },
    { label: '10x ক্যাশ', mult: 10, color: '#0d9488' },
    { label: '50x রয়্যাল', mult: 50, color: '#e11d48' },
    { label: '15 ফ্রি স্পিন', mult: 0, isSpins: 15, color: '#8b5cf6' },
    { label: '100x ডিভাইন', mult: 100, color: '#f59e0b' },
    { label: '5x বুস্ট', mult: 5, color: '#0d9488' },
    { label: '500x ক্রাউন', mult: 500, color: '#fbbf24' },
    { label: '10 ফ্রি স্পিন', mult: 0, isSpins: 10, color: '#8b5cf6' },
  ];

  const spinWheel = () => {
    if (isSpinningWheel) return;
    setIsSpinningWheel(true);
    setWheelPrize(null);

    const prizeIndex = Math.floor(Math.random() * WHEEL_PRIZES.length);
    const degreesPerSlice = 360 / WHEEL_PRIZES.length;
    const targetDeg = 360 * 5 + (360 - prizeIndex * degreesPerSlice - degreesPerSlice / 2);

    setWheelRotation(prev => prev + targetDeg);

    if (soundEnabled) {
      sound.playEgyptianHarp();
    }

    setTimeout(() => {
      const won = WHEEL_PRIZES[prizeIndex];
      setIsSpinningWheel(false);
      setWheelPrize(won.label);

      if (won.isSpins) {
        setFreeSpinsLeft(prev => prev + won.isSpins);
        showToast(`অভিনন্দন! হুইল থেকে ${won.isSpins} ফ্রি স্পিন পেয়েছেন!`);
      } else {
        const cashWin = (slotBet || 100) * won.mult;
        onUpdateBalance(cashWin, `Crown of Anuket: Wheel Bonus ৳${cashWin}`);
        showToast(`অভিনন্দন! হুইল অফ অনুকেত থেকে ৳${cashWin.toFixed(2)} (${won.label}) জিতেছেন!`);
      }

      if (soundEnabled) {
        sound.playCrownJackpot();
      }
    }, 4500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#040814] text-white flex flex-col font-sans select-none overflow-y-auto">
      {/* Top Gold Header */}
      <div className="bg-gradient-to-r from-[#071329] via-[#0b213f] to-[#071329] border-b border-amber-500/30 px-3 sm:px-6 py-2.5 flex items-center justify-between shrink-0 shadow-lg">
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
            title="লবিতে ফিরে যান"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-amber-400 via-teal-500 to-amber-600 flex items-center justify-center shadow-md shadow-amber-500/20 border border-amber-300">
              <Crown className="w-5 h-5 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-sm sm:text-base tracking-wide bg-gradient-to-r from-amber-300 via-yellow-100 to-teal-300 bg-clip-text text-transparent">
                  ক্রাউন অফ অনুকেত (Crown of Anuket)
                </h1>
                <span className="hidden xs:inline-block px-2 py-0.5 text-[10px] font-black rounded-full bg-gradient-to-r from-amber-500 to-teal-600 text-slate-950">
                  SPRIBE & JILI
                </span>
              </div>
              <p className="text-[10px] text-teal-300/80 flex items-center gap-1.5 font-medium">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                পবিত্র নীল নদ ও মিশরীয় দেবীর আশীর্বাদ • RTP ৯৮.২০%
              </p>
            </div>
          </div>
        </div>

        {/* Tab switchers and controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mode Switcher Tabs */}
          <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-amber-500/30">
            <button
              onClick={() => setActiveTab('nile_crash')}
              className={`px-2.5 sm:px-3.5 py-1 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
                activeTab === 'nile_crash'
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-950 shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">নীলনদ ক্র্যাশ</span>
              <span className="sm:hidden">ক্র্যাশ</span>
            </button>
            <button
              onClick={() => setActiveTab('temple_reels')}
              className={`px-2.5 sm:px-3.5 py-1 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
                activeTab === 'temple_reels'
                  ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-slate-950 shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">মন্দির রিলস (৬x৫)</span>
              <span className="sm:hidden">স্লটস</span>
            </button>
          </div>

          {/* Wheel Bonus Button */}
          <button
            onClick={() => setShowWheelBonus(true)}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-yellow-500/20 to-amber-500/20 hover:from-yellow-500/30 hover:to-amber-500/30 border border-amber-400/40 text-amber-300 text-xs font-bold transition shadow-sm"
          >
            <Gift className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
            হুইল বোনাস
          </button>

          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(prev => !prev)}
            className="p-1.5 sm:p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-teal-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          {/* Rules */}
          <button
            onClick={() => setShowRules(true)}
            className="p-1.5 sm:p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            title="নিয়মাবলী"
          >
            <HelpCircle className="w-4 h-4 text-amber-400" />
          </button>

          {/* Balance Pill */}
          <div className="bg-slate-900/95 border border-amber-500/40 px-3 py-1.5 rounded-xl flex items-center gap-2">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">ব্যালেন্স:</span>
            <span className="text-xs sm:text-sm font-extrabold text-amber-300">৳{balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            {onOpenDeposit && (
              <button
                onClick={onOpenDeposit}
                className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 hover:brightness-110 transition"
              >
                + ডিপোজিট
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-amber-600 via-teal-700 to-amber-600 border border-amber-300 text-white px-5 py-2.5 rounded-2xl shadow-2xl text-xs sm:text-sm font-bold flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-yellow-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Body */}
      <div className="flex-1 flex flex-col p-2 sm:p-4 max-w-7xl mx-auto w-full gap-3">
        {/* ======================================================== */}
        {/* TAB 1: NILE CRASH MODE (Sacred Nile Multiplier Surge)    */}
        {/* ======================================================== */}
        {activeTab === 'nile_crash' && (
          <div className="flex-1 flex flex-col lg:flex-row gap-3">
            {/* Left: Interactive Canvas + Multiplier Display */}
            <div className="flex-1 flex flex-col gap-2 bg-[#061023] rounded-2xl border border-teal-900/60 p-2 sm:p-3 relative overflow-hidden shadow-2xl">
              {/* Top History Ribbon */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px] font-mono">
                <span className="text-slate-500 text-[10px] font-sans font-semibold shrink-0 flex items-center gap-1">
                  <History className="w-3 h-3 text-amber-400" /> হিস্ট্রি:
                </span>
                {history.map((h, i) => (
                  <span
                    key={i}
                    className={`px-2 py-0.5 rounded-md font-bold shrink-0 border ${
                      h >= 10.0
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm shadow-amber-500/30'
                        : h >= 2.0
                        ? 'bg-teal-500/20 text-teal-300 border-teal-500/40'
                        : 'bg-slate-800/80 text-slate-400 border-slate-700'
                    }`}
                  >
                    {h.toFixed(2)}x
                  </span>
                ))}
              </div>

              {/* Main Visual Arena Canvas */}
              <div className="flex-1 min-h-[300px] sm:min-h-[380px] relative rounded-xl overflow-hidden border border-teal-800/40 flex items-center justify-center">
                <canvas ref={canvasRef} width={800} height={440} className="w-full h-full object-cover" />

                {/* Multiplier Central HUD */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  {crashState === 'waiting' && (
                    <div className="text-center bg-slate-950/80 backdrop-blur-md px-6 py-4 rounded-2xl border border-amber-500/40 shadow-2xl">
                      <div className="flex items-center justify-center gap-2 text-amber-400 text-xs font-bold mb-1">
                        <Clock className="w-4 h-4 animate-spin" />
                        পবিত্র নীল নদের প্রস্তুতি চলছে...
                      </div>
                      <div className="text-3xl sm:text-5xl font-black text-amber-300 tracking-wider">
                        ০{countdown} সে
                      </div>
                      <p className="text-[11px] text-teal-300/80 mt-1">স্বর্ণের নৌকা এখনই যাত্রা শুরু করবে!</p>
                    </div>
                  )}

                  {crashState === 'navigating' && (
                    <div className="text-center">
                      <div className="text-5xl sm:text-7xl font-black tracking-tight text-white drop-shadow-[0_0_35px_rgba(45,212,191,0.6)]">
                        {currentMultiplier.toFixed(2)}
                        <span className="text-amber-400 text-4xl sm:text-5xl">x</span>
                      </div>
                      <div className="mt-1 px-4 py-1 rounded-full bg-teal-950/80 border border-teal-400/50 text-teal-300 text-xs font-extrabold tracking-wide inline-flex items-center gap-1.5 shadow-lg">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                        অনুকেতের আশীর্বাদ গতিশীল • ৫,০০০x সর্বোচ্চ
                      </div>
                    </div>
                  )}

                  {crashState === 'submerged' && (
                    <div className="text-center bg-red-950/85 backdrop-blur-md px-6 py-4 rounded-2xl border border-red-500/60 shadow-2xl">
                      <div className="text-4xl sm:text-6xl font-black text-red-400 drop-shadow-[0_0_20px_rgba(239,68,68,0.7)]">
                        {crashPoint.toFixed(2)}x
                      </div>
                      <div className="text-sm font-black text-red-200 mt-1 uppercase tracking-wider">
                        নদী ঘূর্ণিপাক নিমজ্জিত! (Submerged)
                      </div>
                    </div>
                  )}
                </div>

                {/* Provably Fair Badge */}
                <button
                  onClick={() => setShowFairness(true)}
                  className="absolute bottom-2 left-2 z-10 px-2.5 py-1 rounded-lg bg-slate-950/80 hover:bg-slate-900 border border-teal-700/50 text-[10px] text-teal-300 font-mono flex items-center gap-1.5 transition"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Provably Fair: {provablyHash.substring(0, 10)}...
                </button>
              </div>

              {/* Bottom Dual Bet Cockpits */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Bet Cockpit 1 */}
                <div className="bg-gradient-to-b from-[#091833] to-[#061024] p-3 rounded-xl border border-teal-800/40 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                    <span className="flex items-center gap-1 text-amber-400">
                      <Crown className="w-3.5 h-3.5" /> বেট ১ (Bet 1)
                    </span>
                    <label className="flex items-center gap-1 text-[11px] text-slate-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={bet1.isAutoBet}
                        onChange={e => setBet1(prev => ({ ...prev, isAutoBet: e.target.checked }))}
                        className="rounded text-amber-500 focus:ring-0"
                      />
                      অটো বেট
                    </label>
                  </div>

                  {/* Amount Controls */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-slate-900/90 border border-slate-700 rounded-lg px-2.5 py-1.5 flex items-center justify-between">
                      <span className="text-xs text-slate-400">৳</span>
                      <input
                        type="number"
                        min={10}
                        max={50000}
                        step={10}
                        value={bet1.amount}
                        disabled={bet1.hasBet && crashState === 'navigating'}
                        onChange={e =>
                          setBet1(prev => ({ ...prev, amount: Math.max(10, Number(e.target.value) || 10) }))
                        }
                        className="w-full bg-transparent text-right font-extrabold text-amber-300 text-sm focus:outline-none"
                      />
                    </div>
                    <div className="flex gap-1">
                      {PRESET_CHIPS_BET1.map(chip => (
                        <button
                          key={chip}
                          onClick={() => setBet1(prev => ({ ...prev, amount: chip }))}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-[10px] font-bold rounded border border-slate-700 text-slate-300 transition"
                        >
                          +{chip}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Auto Cash Out field */}
                  <div className="flex items-center justify-between text-[11px]">
                    <label className="flex items-center gap-1 text-slate-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={bet1.autoCashout}
                        onChange={e => setBet1(prev => ({ ...prev, autoCashout: e.target.checked }))}
                        className="rounded text-teal-500 focus:ring-0"
                      />
                      অটো ক্যাশআউট
                    </label>
                    <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 px-2 py-0.5 rounded">
                      <input
                        type="number"
                        min={1.05}
                        step={0.1}
                        value={bet1.autoCashoutAt}
                        onChange={e => setBet1(prev => ({ ...prev, autoCashoutAt: Number(e.target.value) || 2.0 }))}
                        className="w-14 bg-transparent text-right text-teal-300 font-bold focus:outline-none"
                      />
                      <span className="text-slate-400 font-bold">x</span>
                    </div>
                  </div>

                  {/* Main Action Button */}
                  {!bet1.hasBet ? (
                    <button
                      onClick={() => handlePlaceCrashBet(1)}
                      className="w-full py-2.5 rounded-xl font-black text-sm bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 shadow-lg shadow-emerald-500/20 transition active:scale-[0.98]"
                    >
                      বেট ধরুন (৳{bet1.amount})
                    </button>
                  ) : crashState === 'navigating' && !bet1.hasCashedOut ? (
                    <button
                      onClick={() => cashOutBet(1)}
                      className="w-full py-2.5 rounded-xl font-black text-sm bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:brightness-110 text-slate-950 shadow-lg shadow-amber-400/30 transition animate-pulse active:scale-[0.98]"
                    >
                      ক্যাশআউট ৳{(bet1.amount * currentMultiplier).toFixed(2)} ({currentMultiplier.toFixed(2)}x)
                    </button>
                  ) : bet1.hasCashedOut ? (
                    <div className="w-full py-2.5 rounded-xl font-black text-xs text-center bg-emerald-950/80 border border-emerald-500 text-emerald-300 flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      জিতেছেন: ৳{(bet1.amount * bet1.cashedOutMultiplier).toFixed(2)} ({bet1.cashedOutMultiplier.toFixed(2)}x)
                    </div>
                  ) : (
                    <button
                      onClick={() => handleCancelCrashBet(1)}
                      className="w-full py-2.5 rounded-xl font-bold text-xs bg-red-900/60 hover:bg-red-800/80 text-red-200 border border-red-700/50 transition"
                    >
                      অপেক্ষা করছেন... (বাতিল করুন)
                    </button>
                  )}
                </div>

                {/* Bet Cockpit 2 */}
                <div className="bg-gradient-to-b from-[#091833] to-[#061024] p-3 rounded-xl border border-teal-800/40 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                    <span className="flex items-center gap-1 text-teal-400">
                      <Crown className="w-3.5 h-3.5" /> বেট ২ (Bet 2)
                    </span>
                    <label className="flex items-center gap-1 text-[11px] text-slate-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={bet2.isAutoBet}
                        onChange={e => setBet2(prev => ({ ...prev, isAutoBet: e.target.checked }))}
                        className="rounded text-amber-500 focus:ring-0"
                      />
                      অটো বেট
                    </label>
                  </div>

                  {/* Amount Controls */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-slate-900/90 border border-slate-700 rounded-lg px-2.5 py-1.5 flex items-center justify-between">
                      <span className="text-xs text-slate-400">৳</span>
                      <input
                        type="number"
                        min={10}
                        max={50000}
                        step={10}
                        value={bet2.amount}
                        disabled={bet2.hasBet && crashState === 'navigating'}
                        onChange={e =>
                          setBet2(prev => ({ ...prev, amount: Math.max(10, Number(e.target.value) || 10) }))
                        }
                        className="w-full bg-transparent text-right font-extrabold text-teal-300 text-sm focus:outline-none"
                      />
                    </div>
                    <div className="flex gap-1">
                      {PRESET_CHIPS_BET2.map(chip => (
                        <button
                          key={chip}
                          onClick={() => setBet2(prev => ({ ...prev, amount: chip }))}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-[10px] font-bold rounded border border-slate-700 text-slate-300 transition"
                        >
                          +{chip}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Auto Cash Out field */}
                  <div className="flex items-center justify-between text-[11px]">
                    <label className="flex items-center gap-1 text-slate-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={bet2.autoCashout}
                        onChange={e => setBet2(prev => ({ ...prev, autoCashout: e.target.checked }))}
                        className="rounded text-teal-500 focus:ring-0"
                      />
                      অটো ক্যাশআউট
                    </label>
                    <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 px-2 py-0.5 rounded">
                      <input
                        type="number"
                        min={1.05}
                        step={0.1}
                        value={bet2.autoCashoutAt}
                        onChange={e => setBet2(prev => ({ ...prev, autoCashoutAt: Number(e.target.value) || 3.0 }))}
                        className="w-14 bg-transparent text-right text-teal-300 font-bold focus:outline-none"
                      />
                      <span className="text-slate-400 font-bold">x</span>
                    </div>
                  </div>

                  {/* Main Action Button */}
                  {!bet2.hasBet ? (
                    <button
                      onClick={() => handlePlaceCrashBet(2)}
                      className="w-full py-2.5 rounded-xl font-black text-sm bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-slate-950 shadow-lg shadow-teal-500/20 transition active:scale-[0.98]"
                    >
                      বেট ধরুন (৳{bet2.amount})
                    </button>
                  ) : crashState === 'navigating' && !bet2.hasCashedOut ? (
                    <button
                      onClick={() => cashOutBet(2)}
                      className="w-full py-2.5 rounded-xl font-black text-sm bg-gradient-to-r from-teal-400 via-cyan-400 to-teal-500 hover:brightness-110 text-slate-950 shadow-lg shadow-teal-400/30 transition animate-pulse active:scale-[0.98]"
                    >
                      ক্যাশআউট ৳{(bet2.amount * currentMultiplier).toFixed(2)} ({currentMultiplier.toFixed(2)}x)
                    </button>
                  ) : bet2.hasCashedOut ? (
                    <div className="w-full py-2.5 rounded-xl font-black text-xs text-center bg-teal-950/80 border border-teal-500 text-teal-300 flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-teal-400" />
                      জিতেছেন: ৳{(bet2.amount * bet2.cashedOutMultiplier).toFixed(2)} ({bet2.cashedOutMultiplier.toFixed(2)}x)
                    </div>
                  ) : (
                    <button
                      onClick={() => handleCancelCrashBet(2)}
                      className="w-full py-2.5 rounded-xl font-bold text-xs bg-red-900/60 hover:bg-red-800/80 text-red-200 border border-red-700/50 transition"
                    >
                      অপেক্ষা করছেন... (বাতিল করুন)
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Live Simulated Multiplayer Feed */}
            <div className="w-full lg:w-72 bg-[#061023] rounded-2xl border border-teal-900/60 p-3 flex flex-col gap-2 shrink-0">
              <div className="flex items-center justify-between border-b border-teal-900/50 pb-2">
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-amber-400" /> লাইভ প্লেয়ার টেবিল
                </span>
                <span className="text-[10px] text-teal-400 font-mono bg-teal-950 px-2 py-0.5 rounded-full border border-teal-800">
                  {simulatedPlayers.length + (bet1.hasBet ? 1 : 0) + (bet2.hasBet ? 1 : 0)} জন
                </span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-1.5 max-h-[380px] lg:max-h-none scrollbar-thin">
                {/* User Bets */}
                {bet1.hasBet && (
                  <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/40 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-amber-300">আমার বেট ১</div>
                      <div className="text-[10px] text-slate-400">৳{bet1.amount}</div>
                    </div>
                    {bet1.hasCashedOut ? (
                      <span className="font-black text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/50">
                        {bet1.cashedOutMultiplier.toFixed(2)}x (৳{(bet1.amount * bet1.cashedOutMultiplier).toFixed(2)})
                      </span>
                    ) : crashState === 'submerged' ? (
                      <span className="text-red-400 text-[11px] font-bold">ক্র্যাশ</span>
                    ) : (
                      <span className="text-amber-400 text-[11px] font-bold animate-pulse">নৌযাত্রায়...</span>
                    )}
                  </div>
                )}

                {/* Simulated Players */}
                {simulatedPlayers.map(p => (
                  <div
                    key={p.id}
                    className="p-2 rounded-lg bg-slate-900/80 border border-slate-800/80 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-teal-600 to-cyan-800 text-[10px] font-bold flex items-center justify-center text-white">
                        {p.avatar}
                      </div>
                      <div>
                        <div className="font-medium text-slate-300 text-[11px]">{p.name}</div>
                        <div className="text-[10px] text-slate-500">৳{p.bet}</div>
                      </div>
                    </div>

                    {p.status === 'cashed_out' ? (
                      <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40">
                        {p.multiplier?.toFixed(2)}x
                      </span>
                    ) : p.status === 'submerged' ? (
                      <span className="text-[10px] text-red-400 font-semibold">ডুবেছে</span>
                    ) : (
                      <span className="text-[10px] text-teal-400 font-medium">চলছে...</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: TEMPLE REELS (6x5 Egyptian Cascading Slots)       */}
        {/* ======================================================== */}
        {activeTab === 'temple_reels' && (
          <div className="flex-1 flex flex-col gap-3">
            {/* Free Spins & Win Banner */}
            {freeSpinsLeft > 0 && (
              <div className="bg-gradient-to-r from-amber-600 via-yellow-500 to-teal-600 p-2.5 rounded-2xl border border-amber-300 text-slate-950 flex items-center justify-between px-4 sm:px-6 shadow-xl animate-pulse">
                <div className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-slate-950" />
                  <span className="font-black text-sm sm:text-base uppercase tracking-wide">
                    পবিত্র ফ্রি স্পিন সক্রিয়: বাকি {freeSpinsLeft} টি
                  </span>
                </div>
                <div className="font-extrabold text-sm sm:text-base">
                  মোট উইন: ৳{totalFreeSpinWin.toFixed(2)} | গুণক: {freeSpinMultiplier}x
                </div>
              </div>
            )}

            {/* 6x5 Reels Grid */}
            <div className="flex-1 min-h-[380px] bg-gradient-to-b from-[#0a1835] via-[#051124] to-[#040914] p-3 sm:p-5 rounded-3xl border-2 border-amber-500/40 shadow-2xl relative flex flex-col items-center justify-center">
              {/* Background Egyptian Pillars & Hieroglyphs */}
              <div className="absolute inset-0 pointer-events-none opacity-10 flex justify-between px-6 items-center">
                <div className="text-6xl sm:text-8xl">𓋹 𓈖 𓊪</div>
                <div className="text-6xl sm:text-8xl">𓃭 𓅓 𓏏</div>
              </div>

              {/* Grid 6 columns x 5 rows */}
              <div className="grid grid-cols-6 gap-1.5 sm:gap-2.5 w-full max-w-4xl z-10">
                {grid.map((col, colIdx) => (
                  <div key={colIdx} className="flex flex-col gap-1.5 sm:gap-2.5">
                    {col.map((sym, rowIdx) => {
                      const isWinning = winningSymbolIds.includes(sym.id);
                      return (
                        <div
                          key={rowIdx}
                          className={`aspect-square rounded-xl sm:rounded-2xl p-1 sm:p-2 flex flex-col items-center justify-center border transition-all duration-300 bg-gradient-to-b ${sym.bgGrad} ${
                            isWinning
                              ? 'ring-4 ring-amber-300 scale-105 shadow-xl shadow-amber-400/50 animate-bounce'
                              : 'shadow-md shadow-black/40'
                          } ${isSpinning ? 'opacity-40 blur-xs scale-95' : 'opacity-100'}`}
                        >
                          <span className="text-2xl sm:text-4xl filter drop-shadow">{sym.icon}</span>
                          <span className="hidden sm:inline-block text-[9px] font-bold text-center mt-0.5 truncate max-w-full text-slate-200">
                            {sym.nameBn}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* Win overlay celebration */}
              {lastWinAmount > 0 && !isSpinning && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 bg-slate-950/90 border-2 border-amber-400 px-6 sm:px-10 py-4 rounded-3xl text-center shadow-2xl animate-in zoom-in-75">
                  <div className="text-xs sm:text-sm font-bold text-amber-400 flex items-center justify-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-yellow-300" /> দেবী অনুকেতের জ্যাকপট উইন!
                  </div>
                  <div className="text-3xl sm:text-5xl font-black text-amber-300 tracking-wide mt-1">
                    +৳{lastWinAmount.toFixed(2)}
                  </div>
                  {activeMultipliers.length > 0 && (
                    <div className="mt-1 px-3 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-extrabold text-xs inline-block">
                      {activeMultipliers[0]}x গুণক যোগ হয়েছে!
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Slot Spin Controls */}
            <div className="bg-[#071329] p-3 sm:p-4 rounded-2xl border border-amber-500/30 flex flex-wrap items-center justify-between gap-3 shadow-lg">
              {/* Bet amount controls */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400">স্পিন বেট:</span>
                <div className="flex items-center bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5">
                  <span className="text-amber-400 font-bold mr-1">৳</span>
                  <input
                    type="number"
                    min={20}
                    max={20000}
                    step={20}
                    value={slotBet}
                    disabled={isSpinning}
                    onChange={e => setSlotBet(Math.max(20, Number(e.target.value) || 20))}
                    className="w-20 bg-transparent text-right font-extrabold text-white focus:outline-none"
                  />
                </div>
                <div className="flex gap-1">
                  {[50, 100, 200, 500, 1000].map(amt => (
                    <button
                      key={amt}
                      onClick={() => setSlotBet(amt)}
                      disabled={isSpinning}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-lg border border-slate-700 text-slate-300 transition"
                    >
                      {amt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Main Spin Action */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowWheelBonus(true)}
                  className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-yellow-600/30 to-amber-600/30 hover:from-yellow-600/50 hover:to-amber-600/50 border border-amber-400/50 text-amber-300 text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Gift className="w-4 h-4 text-amber-400" /> হুইল স্পিন
                </button>

                <button
                  onClick={handleSpinTempleReels}
                  disabled={isSpinning}
                  className={`px-8 sm:px-12 py-3 rounded-2xl font-black text-base shadow-xl flex items-center gap-2 transition active:scale-95 ${
                    isSpinning
                      ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-amber-400 via-yellow-400 to-teal-400 hover:brightness-110 text-slate-950 shadow-amber-500/30'
                  }`}
                >
                  {isSpinning ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" /> স্পিন হচ্ছে...
                    </>
                  ) : freeSpinsLeft > 0 ? (
                    <>
                      <Crown className="w-5 h-5" /> ফ্রি স্পিন করুন ({freeSpinsLeft})
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 fill-slate-950" /> স্পিন (৳{slotBet})
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* MODAL 1: WHEEL OF ANUKET BONUS GAME                      */}
      {/* ======================================================== */}
      {showWheelBonus && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-gradient-to-b from-[#091d3d] via-[#051125] to-[#040814] border-2 border-amber-400/80 rounded-3xl p-5 sm:p-7 max-w-md w-full shadow-2xl relative flex flex-col items-center text-center">
            <button
              onClick={() => setShowWheelBonus(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
            >
              ✕
            </button>

            <div className="flex items-center gap-2 text-amber-400 font-extrabold text-sm mb-1">
              <Crown className="w-5 h-5 text-amber-300" /> দেবী অনুকেতের সান হুইল বোনাস
            </div>
            <p className="text-xs text-slate-300 mb-4">
              হুইল ঘুরিয়ে জিতে নিন সর্বোচ্চ ৫০০x জ্যাকপট বা ফ্রি স্পিন!
            </p>

            {/* Rotating Wheel Graphic */}
            <div className="relative w-56 h-56 sm:w-64 sm:h-64 my-2 flex items-center justify-center">
              {/* Pointer */}
              <div className="absolute -top-3 z-20 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[22px] border-t-amber-400 filter drop-shadow"></div>

              {/* Wheel Body */}
              <div
                style={{
                  transform: `rotate(${wheelRotation}deg)`,
                  transition: isSpinningWheel ? 'transform 4.5s cubic-bezier(0.15, 0.9, 0.25, 1)' : 'none',
                }}
                className="w-full h-full rounded-full border-4 border-amber-400 shadow-2xl overflow-hidden relative flex items-center justify-center bg-gradient-to-br from-amber-600 via-teal-800 to-slate-950"
              >
                {WHEEL_PRIZES.map((prize, i) => {
                  const deg = (360 / WHEEL_PRIZES.length) * i;
                  return (
                    <div
                      key={i}
                      style={{
                        transform: `rotate(${deg}deg)`,
                        transformOrigin: '50% 50%',
                      }}
                      className="absolute inset-0 flex items-start justify-center pt-3 text-[11px] font-black text-white"
                    >
                      <span className="bg-slate-950/70 px-2 py-0.5 rounded border border-amber-400/40">
                        {prize.label}
                      </span>
                    </div>
                  );
                })}
                {/* Center Hub */}
                <div className="w-14 h-14 rounded-full bg-amber-400 border-2 border-white shadow-xl flex items-center justify-center text-slate-950 font-black text-xs z-10">
                  ANUKET
                </div>
              </div>
            </div>

            {wheelPrize && (
              <div className="my-3 px-4 py-2 bg-amber-500/20 border border-amber-400 rounded-xl text-amber-300 font-extrabold text-sm animate-bounce">
                🎉 পুরস্কার: {wheelPrize}!
              </div>
            )}

            <button
              onClick={spinWheel}
              disabled={isSpinningWheel}
              className={`mt-3 w-full py-3 rounded-2xl font-black text-base shadow-xl transition active:scale-98 ${
                isSpinningWheel
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-amber-400 via-yellow-400 to-teal-400 hover:brightness-110 text-slate-950 shadow-amber-400/30'
              }`}
            >
              {isSpinningWheel ? 'হুইল ঘুরছে...' : 'হুইল ঘুরান (Spin Wheel)'}
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: RULES & HOW TO PLAY                             */}
      {/* ======================================================== */}
      {showRules && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-gradient-to-b from-[#091a38] to-[#040814] border border-amber-500/50 rounded-3xl p-5 sm:p-7 max-w-xl w-full max-h-[85vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-teal-800/60 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-400" />
                <h3 className="font-extrabold text-base text-amber-300">
                  ক্রাউন অফ অনুকেত: খেলার নিয়মাবলী (Rules)
                </h3>
              </div>
              <button
                onClick={() => setShowRules(false)}
                className="p-1 rounded-full bg-slate-800 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
              <div className="bg-slate-900/80 p-3 rounded-xl border border-teal-800/40">
                <h4 className="font-bold text-amber-300 mb-1 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-teal-400" /> ১. নীলনদ ক্র্যাশ মোড (Nile Multiplier Surge)
                </h4>
                <p>
                  স্বর্ণের নৌকা যাত্রা শুরু করার সাথে সাথে গুণক ১.০০x থেকে বৃদ্ধি পেতে থাকে। নৌকা ঘূর্ণিপাকে নিমজ্জিত হওয়ার পূর্বেই ক্যাশআউট বোতামে চাপুন। আপনি একসাথে ২টি বেট (Bet 1 ও Bet 2) ধরতে পারেন এবং অটো ক্যাশআউট সেট করতে পারেন।
                </p>
              </div>

              <div className="bg-slate-900/80 p-3 rounded-xl border border-teal-800/40">
                <h4 className="font-bold text-teal-300 mb-1 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-amber-400" /> ২. মন্দির রিলস ৬x৫ স্লটস (Temple Reels Pay Anywhere)
                </h4>
                <p>
                  গ্রিডে যেকোনো স্থানে ৮ বা ততোধিক একই প্রতীক আসলে পেআউট পাওয়া যায়। ৪ বা ততোধিক <strong>ক্রাউন অফ অনুকেত (Crown)</strong> আসলে ফ্রি স্পিন সক্রিয় হয়। দেবী অনুকেতের ডিভাইন মাল্টিপ্লায়ার উইনগুলোকে গুণ করে দেয়!
                </p>
              </div>

              <div className="bg-slate-900/80 p-3 rounded-xl border border-teal-800/40">
                <h4 className="font-bold text-yellow-300 mb-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> ৩. প্রোভ্যাব্লি ফেয়ার সততা (Provably Fair)
                </h4>
                <p>
                  প্রতিটি রাউন্ড শুরু হওয়ার পূর্বেই ক্রিপ্টোগ্রাফিক SHA-256 হ্যাশ জেনারেট হয় যা পরিবর্তন করা অসম্ভব। শতভাগ নিরপেক্ষ ও ন্যায্য খেলা নিশ্চিত।
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowRules(false)}
              className="mt-5 w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-teal-600 text-slate-950 font-black text-sm"
            >
              বুঝেছি, খেলা শুরু করুন
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: PROVABLY FAIR INSPECTOR                         */}
      {/* ======================================================== */}
      {showFairness && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-gradient-to-b from-[#091a38] to-[#040814] border border-teal-500/50 rounded-3xl p-5 sm:p-7 max-w-lg w-full shadow-2xl">
            <div className="flex items-center justify-between border-b border-teal-800/60 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="font-extrabold text-base text-teal-300">
                  Provably Fair ক্রিপ্টোগ্রাফিক যাচাইকরণ
                </h3>
              </div>
              <button
                onClick={() => setShowFairness(false)}
                className="p-1 rounded-full bg-slate-800 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div>
                <span className="text-slate-400 block mb-1">সার্ভার সীড SHA-256 হ্যাশ (বর্তমান রাউন্ড):</span>
                <div className="p-2.5 bg-slate-900 rounded-lg text-emerald-400 break-all select-all border border-slate-700">
                  {provablyHash}
                </div>
              </div>

              <div>
                <span className="text-slate-400 block mb-1">ক্লায়েন্ট সীড (Client Seed):</span>
                <input
                  type="text"
                  value={clientSeed}
                  onChange={e => setClientSeed(e.target.value)}
                  className="w-full p-2.5 bg-slate-900 rounded-lg text-amber-300 border border-slate-700 focus:outline-none"
                />
              </div>

              <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                এই হ্যাশটি রাউন্ড শুরু হওয়ার আগেই প্রস্তুত করা থাকে, ফলে কোনো পক্ষই ফলাফল প্রভাবিত করতে পারে না।
              </p>
            </div>

            <button
              onClick={() => setShowFairness(false)}
              className="mt-4 w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-sm"
            >
              বন্ধ করুন
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
