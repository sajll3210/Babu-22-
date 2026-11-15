import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Volume2,
  VolumeX,
  ArrowLeft,
  Users,
  ShieldCheck,
  History,
  TrendingUp,
  Clock,
  Sparkles,
  HelpCircle,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Award,
  Zap,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { sound } from '../../utils/audio';

interface RodeoCrashGameProps {
  balance: number;
  onUpdateBalance: (amount: number, reason: string) => void;
  onClose: () => void;
  onOpenDeposit?: () => void;
}

interface BetControl {
  amount: number;
  hasBet: boolean;
  hasCashedOut: boolean;
  cashedOutMultiplier: number;
  autoCashout: boolean;
  autoCashoutAt: number;
  isAutoBet: boolean;
}

interface SimulatedPlayer {
  id: string;
  name: string;
  avatar: string;
  bet: number;
  multiplier?: number;
  status: 'riding' | 'cashed_out' | 'bucked_off';
}

// Preset quick bet chips
const PRESET_CHIPS_BET1 = [50, 100, 200, 500];
const PRESET_CHIPS_BET2 = [100, 200, 500, 1000];

// Bangladeshi authentic simulated players
const SIMULATED_RIDERS = [
  { name: 'রোডিও_সাকিব', avatar: 'S' },
  { name: 'তানভীর_ঢাকা', avatar: 'T' },
  { name: 'রাকিব_চিটাগাং', avatar: 'R' },
  { name: 'বুল_মাস্টার_২২', avatar: 'B' },
  { name: 'মেহেদী_সিলেট', avatar: 'M' },
  { name: 'আরিফ_খুলনা', avatar: 'A' },
  { name: 'ফারহান_বরিশাল', avatar: 'F' },
  { name: 'সুমন_বগুড়া', avatar: 'S' },
];

export const RodeoCrashGame: React.FC<RodeoCrashGameProps> = ({
  balance,
  onUpdateBalance,
  onClose,
  onOpenDeposit,
}) => {
  // Game lifecycle: COUNTDOWN -> RIDING -> CRASHED
  const [gameState, setGameState] = useState<'COUNTDOWN' | 'RIDING' | 'CRASHED'>('COUNTDOWN');
  const [countdown, setCountdown] = useState<number>(4);
  const [currentMultiplier, setCurrentMultiplier] = useState<number>(1.0);
  const [crashPoint, setCrashPoint] = useState<number>(2.45);
  const [pastRounds, setPastRounds] = useState<number[]>([
    2.14, 1.45, 5.82, 1.08, 14.30, 1.95, 3.20, 1.02, 2.80, 1.15, 8.40, 1.00,
  ]);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Modals & Panels
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);
  const [selectedRoundHistory, setSelectedRoundHistory] = useState<{
    id: string;
    mult: number;
    hash: string;
    seed: string;
  } | null>(null);
  const [activeSidebarTab, setActiveSidebarTab] = useState<'all' | 'my' | 'top'>('all');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  // Dual Betting Consoles
  const [bet1, setBet1] = useState<BetControl>({
    amount: 100,
    hasBet: false,
    hasCashedOut: false,
    cashedOutMultiplier: 0,
    autoCashout: false,
    autoCashoutAt: 2.0,
    isAutoBet: false,
  });

  const [bet2, setBet2] = useState<BetControl>({
    amount: 200,
    hasBet: false,
    hasCashedOut: false,
    cashedOutMultiplier: 0,
    autoCashout: false,
    autoCashoutAt: 3.0,
    isAutoBet: false,
  });

  const [activeBetTab1, setActiveBetTab1] = useState<'manual' | 'auto'>('manual');
  const [activeBetTab2, setActiveBetTab2] = useState<'manual' | 'auto'>('manual');
  const [showSecondBetPanel, setShowSecondBetPanel] = useState<boolean>(true);

  // Live Simulated Riders
  const [liveRiders, setLiveRiders] = useState<SimulatedPlayer[]>(() =>
    SIMULATED_RIDERS.map((r, idx) => ({
      id: idx.toString(),
      name: r.name,
      avatar: r.avatar,
      bet: [100, 200, 250, 500, 1000, 300, 1500, 800][idx % 8],
      status: 'riding',
    }))
  );

  // My Round History
  const [myBetsHistory, setMyBetsHistory] = useState<
    Array<{ id: string; time: string; bet: number; mult: number; win: number; status: 'win' | 'lost' }>
  >([
    { id: '1', time: '10:20', bet: 100, mult: 2.14, win: 214, status: 'win' },
    { id: '2', time: '10:22', bet: 200, mult: 1.45, win: 290, status: 'win' },
    { id: '3', time: '10:25', bet: 150, mult: 1.08, win: 0, status: 'lost' },
  ]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  // Dust particles ref
  const dustParticlesRef = useRef<
    Array<{ x: number; y: number; size: number; alpha: number; vx: number; vy: number; color: string }>
  >([]);

  // Realistic Crash Point Generator with 97% RTP distribution
  const generateRodeoCrashPoint = useCallback((): number => {
    // 4% chance of instant buck off at 1.00x - 1.05x
    const r = Math.random();
    if (r < 0.04) {
      return 1.0;
    }
    if (r < 0.09) {
      return +(1.01 + Math.random() * 0.07).toFixed(2);
    }
    // Standard crash multiplier formula: 97 / (100 - X)
    const raw = 0.97 / (1.0 - Math.random());
    const capped = Math.min(raw, 500.0);
    return Math.max(1.06, +capped.toFixed(2));
  }, []);

  // Cashout Bet 1
  const handleCashoutBet1 = useCallback(() => {
    if (!bet1.hasBet || bet1.hasCashedOut || gameState !== 'RIDING') return;
    const winAmount = Math.floor(bet1.amount * currentMultiplier);
    setBet1(prev => ({
      ...prev,
      hasCashedOut: true,
      cashedOutMultiplier: currentMultiplier,
    }));
    onUpdateBalance(winAmount, `রোডিও ক্র্যাশ ক্যাশআউট (+${currentMultiplier.toFixed(2)}x)`);
    if (soundEnabled) {
      sound.playWinChime();
      sound.playWhip();
    }

    setMyBetsHistory(prev => [
      {
        id: Date.now().toString(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        bet: bet1.amount,
        mult: currentMultiplier,
        win: winAmount,
        status: 'win',
      },
      ...prev.slice(0, 19),
    ]);
  }, [bet1, currentMultiplier, gameState, onUpdateBalance, soundEnabled]);

  // Cashout Bet 2
  const handleCashoutBet2 = useCallback(() => {
    if (!bet2.hasBet || bet2.hasCashedOut || gameState !== 'RIDING') return;
    const winAmount = Math.floor(bet2.amount * currentMultiplier);
    setBet2(prev => ({
      ...prev,
      hasCashedOut: true,
      cashedOutMultiplier: currentMultiplier,
    }));
    onUpdateBalance(winAmount, `রোডিও ক্র্যাশ ক্যাশআউট (+${currentMultiplier.toFixed(2)}x)`);
    if (soundEnabled) {
      sound.playWinChime();
      sound.playWhip();
    }

    setMyBetsHistory(prev => [
      {
        id: (Date.now() + 1).toString(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        bet: bet2.amount,
        mult: currentMultiplier,
        win: winAmount,
        status: 'win',
      },
      ...prev.slice(0, 19),
    ]);
  }, [bet2, currentMultiplier, gameState, onUpdateBalance, soundEnabled]);

  // Auto Cashout watcher
  useEffect(() => {
    if (gameState === 'RIDING') {
      if (
        bet1.hasBet &&
        !bet1.hasCashedOut &&
        bet1.autoCashout &&
        currentMultiplier >= bet1.autoCashoutAt
      ) {
        handleCashoutBet1();
      }
      if (
        bet2.hasBet &&
        !bet2.hasCashedOut &&
        bet2.autoCashout &&
        currentMultiplier >= bet2.autoCashoutAt
      ) {
        handleCashoutBet2();
      }
    }
  }, [currentMultiplier, gameState, bet1, bet2, handleCashoutBet1, handleCashoutBet2]);

  // Toggle Bet 1
  const toggleBet1 = () => {
    if (gameState === 'RIDING') return;
    if (!bet1.hasBet) {
      if (balance < bet1.amount) {
        if (onOpenDeposit) onOpenDeposit();
        return;
      }
      onUpdateBalance(-bet1.amount, 'রোডিও বেট ১');
      setBet1(prev => ({ ...prev, hasBet: true, hasCashedOut: false }));
      if (soundEnabled) sound.playClick();
    } else {
      onUpdateBalance(bet1.amount, 'রোডিও বেট ১ বাতিল');
      setBet1(prev => ({ ...prev, hasBet: false }));
      if (soundEnabled) sound.playClick();
    }
  };

  // Toggle Bet 2
  const toggleBet2 = () => {
    if (gameState === 'RIDING') return;
    if (!bet2.hasBet) {
      if (balance < bet2.amount) {
        if (onOpenDeposit) onOpenDeposit();
        return;
      }
      onUpdateBalance(-bet2.amount, 'রোডিও বেট ২');
      setBet2(prev => ({ ...prev, hasBet: true, hasCashedOut: false }));
      if (soundEnabled) sound.playClick();
    } else {
      onUpdateBalance(bet2.amount, 'রোডিও বেট ২ বাতিল');
      setBet2(prev => ({ ...prev, hasBet: false }));
      if (soundEnabled) sound.playClick();
    }
  };

  // Main Rodeo Engine Loop
  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (gameState === 'COUNTDOWN') {
      if (countdown > 0) {
        timer = setTimeout(() => {
          setCountdown(c => c - 1);
        }, 1000);
      } else {
        // Start ride!
        const point = generateRodeoCrashPoint();
        setCrashPoint(point);
        setCurrentMultiplier(1.0);
        setGameState('RIDING');
        startTimeRef.current = performance.now();
        dustParticlesRef.current = [];

        if (soundEnabled) {
          sound.playRodeoBell();
          sound.playBullRoar();
        }

        // Reset other riders
        setLiveRiders(prev =>
          prev.map((r, idx) => ({
            ...r,
            bet: [100, 250, 300, 500, 1000, 200, 1500, 800][idx % 8],
            status: 'riding',
            multiplier: undefined,
          }))
        );
      }
    } else if (gameState === 'RIDING') {
      // Instant buck off if point is 1.00
      if (crashPoint <= 1.00) {
        setGameState('CRASHED');
        setCurrentMultiplier(1.0);
        if (soundEnabled) sound.playCrash();
        setPastRounds(prev => [1.0, ...prev.slice(0, 17)]);

        // Record losses
        if (bet1.hasBet && !bet1.hasCashedOut) {
          setMyBetsHistory(prev => [
            { id: Date.now().toString(), time: 'এখনই', bet: bet1.amount, mult: 1.0, win: 0, status: 'lost' },
            ...prev.slice(0, 19),
          ]);
        }
        if (bet2.hasBet && !bet2.hasCashedOut) {
          setMyBetsHistory(prev => [
            { id: (Date.now() + 1).toString(), time: 'এখনই', bet: bet2.amount, mult: 1.0, win: 0, status: 'lost' },
            ...prev.slice(0, 19),
          ]);
        }

        setTimeout(() => {
          setBet1(prev => ({ ...prev, hasBet: prev.isAutoBet, hasCashedOut: false }));
          setBet2(prev => ({ ...prev, hasBet: prev.isAutoBet, hasCashedOut: false }));
          setCountdown(4);
          setGameState('COUNTDOWN');
        }, 3200);
        return;
      }

      // Dynamic ride speed calculation
      const duration = Math.max(1000, Math.log(crashPoint + 0.1) * 3800);

      const updateFrame = (now: number) => {
        const elapsed = now - startTimeRef.current;
        const progress = Math.min(elapsed / duration, 1);

        // Exponential curve
        const mult = +(1.0 + Math.pow(progress, 1.5) * (crashPoint - 1.0)).toFixed(2);
        setCurrentMultiplier(mult);

        // Random simulated cashouts along the ride
        if (Math.random() < 0.05) {
          setLiveRiders(riders =>
            riders.map(r => {
              if (r.status === 'riding' && Math.random() < 0.3) {
                return { ...r, status: 'cashed_out', multiplier: mult };
              }
              return r;
            })
          );
        }

        if (progress >= 1 || mult >= crashPoint) {
          // Bull bucked the cowboy off!
          setGameState('CRASHED');
          setCurrentMultiplier(crashPoint);
          if (soundEnabled) {
            sound.playCrash();
            sound.playBullRoar();
          }
          setPastRounds(prev => [crashPoint, ...prev.slice(0, 17)]);

          // Mark remaining riders as bucked off
          setLiveRiders(riders =>
            riders.map(r => (r.status === 'riding' ? { ...r, status: 'bucked_off' } : r))
          );

          // Log lost bets
          if (bet1.hasBet && !bet1.hasCashedOut) {
            setMyBetsHistory(prev => [
              { id: Date.now().toString(), time: 'এখনই', bet: bet1.amount, mult: crashPoint, win: 0, status: 'lost' },
              ...prev.slice(0, 19),
            ]);
          }
          if (bet2.hasBet && !bet2.hasCashedOut) {
            setMyBetsHistory(prev => [
              { id: (Date.now() + 1).toString(), time: 'এখনই', bet: bet2.amount, mult: crashPoint, win: 0, status: 'lost' },
              ...prev.slice(0, 19),
            ]);
          }

          // Restart countdown after 3.4 seconds
          setTimeout(() => {
            setBet1(prev => ({ ...prev, hasBet: prev.isAutoBet, hasCashedOut: false }));
            setBet2(prev => ({ ...prev, hasBet: prev.isAutoBet, hasCashedOut: false }));
            setCountdown(4);
            setGameState('COUNTDOWN');
          }, 3400);
          return;
        }

        animFrameRef.current = requestAnimationFrame(updateFrame);
      };

      animFrameRef.current = requestAnimationFrame(updateFrame);
    }

    return () => {
      clearTimeout(timer);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [
    gameState,
    countdown,
    crashPoint,
    generateRodeoCrashPoint,
    soundEnabled,
    bet1.hasBet,
    bet1.hasCashedOut,
    bet1.amount,
    bet2.hasBet,
    bet2.hasCashedOut,
    bet2.amount,
  ]);

  // Rodeo Arena Canvas Animator
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = canvas.parentElement?.clientWidth || 720);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 380);

    const handleResize = () => {
      if (!canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener('resize', handleResize);

    ctx.clearRect(0, 0, width, height);

    // 1. Deep Western Arena Night Gradient
    const arenaSky = ctx.createLinearGradient(0, 0, 0, height);
    arenaSky.addColorStop(0, '#0a0812');
    arenaSky.addColorStop(0.55, '#191124');
    arenaSky.addColorStop(0.65, '#2e1910');
    arenaSky.addColorStop(1, '#1b0e07');
    ctx.fillStyle = arenaSky;
    ctx.fillRect(0, 0, width, height);

    // 2. Stadium Floodlights Beaming Down
    const lightGlow1 = ctx.createRadialGradient(width * 0.15, 0, 10, width * 0.25, height * 0.5, 260);
    lightGlow1.addColorStop(0, 'rgba(251, 191, 36, 0.22)');
    lightGlow1.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = lightGlow1;
    ctx.fillRect(0, 0, width, height);

    const lightGlow2 = ctx.createRadialGradient(width * 0.85, 0, 10, width * 0.75, height * 0.5, 260);
    lightGlow2.addColorStop(0, 'rgba(245, 158, 11, 0.22)');
    lightGlow2.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = lightGlow2;
    ctx.fillRect(0, 0, width, height);

    // 3. Wooden Rodeo Arena Fence (Horizontal rails)
    const fenceY = height * 0.52;
    ctx.strokeStyle = '#452210';
    ctx.lineWidth = 6;
    for (let rail = 0; rail < 3; rail++) {
      ctx.beginPath();
      ctx.moveTo(0, fenceY - rail * 18);
      ctx.lineTo(width, fenceY - rail * 18);
      ctx.stroke();
    }
    // Vertical fence posts
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#5c2d16';
    for (let postX = 20; postX < width; postX += 90) {
      ctx.beginPath();
      ctx.moveTo(postX, fenceY - 45);
      ctx.lineTo(postX, fenceY + 10);
      ctx.stroke();
    }

    // Rodeo Banner on Fence
    ctx.save();
    ctx.fillStyle = 'rgba(217, 119, 6, 0.18)';
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.fillRect(width * 0.35, fenceY - 38, width * 0.3, 24);
    ctx.strokeRect(width * 0.35, fenceY - 38, width * 0.3, 24);
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('★ BABU22 EL TORO RODEO CHAMPIONSHIP ★', width * 0.5, fenceY - 22);
    ctx.restore();

    // 4. Rodeo Sand / Dirt Ground
    const groundY = height * 0.62;
    const dirtGradient = ctx.createLinearGradient(0, groundY, 0, height);
    dirtGradient.addColorStop(0, '#381e0f');
    dirtGradient.addColorStop(0.3, '#2a1409');
    dirtGradient.addColorStop(1, '#160904');
    ctx.fillStyle = dirtGradient;
    ctx.fillRect(0, groundY, width, height - groundY);

    // Subtle arena dirt texture specks
    ctx.fillStyle = 'rgba(245, 158, 11, 0.08)';
    for (let i = 0; i < 40; i++) {
      const sx = (i * 37) % width;
      const sy = groundY + ((i * 19) % (height - groundY));
      ctx.fillRect(sx, sy, 3, 2);
    }

    // 5. Dynamic Time Tick for bucking physics
    const timeSec = performance.now() * 0.006;
    const isRiding = gameState === 'RIDING';
    const isCrashed = gameState === 'CRASHED';

    // Bull coordinates
    const bullBaseX = isRiding ? width * 0.46 : isCrashed ? width * 0.42 : width * 0.38;
    const bullBaseY = groundY + 15;

    // Bucking angles & oscillations
    // Buck angle: tilts forward then kicks rear violently
    const buckCycle = isRiding ? Math.sin(timeSec * 2.8) : 0;
    const buckPitch = isRiding ? buckCycle * 0.28 : isCrashed ? 0.38 : -0.05;
    const bullHopY = isRiding ? -Math.abs(Math.sin(timeSec * 2.8)) * 26 : 0;

    // Emit dust particles while riding
    if (isRiding && Math.random() < 0.8) {
      dustParticlesRef.current.push({
        x: bullBaseX - 35 + (Math.random() - 0.5) * 20,
        y: bullBaseY + bullHopY + 25,
        size: Math.random() * 6 + 3,
        alpha: 0.75,
        vx: -(Math.random() * 3 + 2),
        vy: -(Math.random() * 2 + 0.5),
        color: ['#b45309', '#92400e', '#78350f', '#f59e0b'][Math.floor(Math.random() * 4)],
      });
    }

    // Render dust particles
    dustParticlesRef.current.forEach(p => {
      ctx.save();
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= 0.035;
      p.size *= 0.98;
    });
    dustParticlesRef.current = dustParticlesRef.current.filter(p => p.alpha > 0);

    // 6. Draw The Furious Bull (El Toro)
    ctx.save();
    ctx.translate(bullBaseX, bullBaseY + bullHopY);
    ctx.rotate(buckPitch);

    // Bull Body (Muscular Black/Dark Mahogany Bull)
    const bullBodyGrad = ctx.createRadialGradient(0, -10, 10, 0, 0, 60);
    bullBodyGrad.addColorStop(0, '#2d1810');
    bullBodyGrad.addColorStop(0.7, '#180d09');
    bullBodyGrad.addColorStop(1, '#0c0604');
    ctx.fillStyle = bullBodyGrad;

    // Torso / Hump
    ctx.beginPath();
    ctx.ellipse(0, 0, 52, 28, 0, 0, Math.PI * 2);
    ctx.fill();

    // Massive Muscular Neck Hump
    ctx.beginPath();
    ctx.ellipse(22, -18, 26, 20, -0.2, 0, Math.PI * 2);
    ctx.fill();

    // Powerful Bull Head
    ctx.fillStyle = '#1c0f0a';
    ctx.beginPath();
    ctx.moveTo(35, -28);
    ctx.lineTo(62, -18); // Snout
    ctx.lineTo(58, -4);
    ctx.lineTo(34, 4);
    ctx.closePath();
    ctx.fill();

    // Golden Bull Snout Ring
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(63, -10, 5, 0, Math.PI * 2);
    ctx.stroke();

    // Glowing Menacing Red Eye
    ctx.fillStyle = isRiding ? '#ef4444' : isCrashed ? '#f87171' : '#f59e0b';
    ctx.beginPath();
    ctx.arc(44, -18, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(43, -19, 1.2, 0, Math.PI * 2);
    ctx.fill();

    // Horns (Sharp Curved White Horns with Gold Tips)
    ctx.save();
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(38, -26);
    ctx.quadraticCurveTo(46, -48, 62, -44); // Forward curved horn
    ctx.stroke();

    // Gold tip
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(56, -45);
    ctx.lineTo(62, -44);
    ctx.stroke();
    ctx.restore();

    // Front Legs (Planting or kicking)
    const frontLegAngle = isRiding ? Math.cos(timeSec * 2.8) * 0.35 : 0;
    ctx.strokeStyle = '#180d09';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    // Front Left
    ctx.beginPath();
    ctx.moveTo(26, 15);
    ctx.lineTo(26 + Math.sin(frontLegAngle) * 25, 42);
    ctx.stroke();
    // Front Right (behind)
    ctx.strokeStyle = '#110906';
    ctx.beginPath();
    ctx.moveTo(34, 15);
    ctx.lineTo(34 + Math.sin(-frontLegAngle) * 22, 40);
    ctx.stroke();

    // Rear Legs (Bucking high!)
    const rearLegAngle = isRiding ? -Math.sin(timeSec * 2.8) * 0.55 : isCrashed ? 0.6 : 0;
    ctx.strokeStyle = '#180d09';
    // Rear Left
    ctx.beginPath();
    ctx.moveTo(-32, 12);
    ctx.lineTo(-44 + Math.sin(rearLegAngle) * 28, 36);
    ctx.stroke();
    // Rear Right
    ctx.strokeStyle = '#110906';
    ctx.beginPath();
    ctx.moveTo(-22, 12);
    ctx.lineTo(-32 + Math.sin(-rearLegAngle) * 26, 38);
    ctx.stroke();

    // Golden Hooves
    ctx.fillStyle = '#d97706';
    ctx.fillRect(24 + Math.sin(frontLegAngle) * 25 - 4, 40, 8, 4);
    ctx.fillRect(-44 + Math.sin(rearLegAngle) * 28 - 4, 34, 8, 4);

    // Swishing Tail
    const tailAngle = isRiding ? Math.sin(timeSec * 4.5) * 0.45 : 0;
    ctx.strokeStyle = '#180d09';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(-48, -4);
    ctx.quadraticCurveTo(-65 + tailAngle * 15, -12, -70, 8);
    ctx.stroke();
    // Tail brush
    ctx.fillStyle = '#0c0604';
    ctx.beginPath();
    ctx.arc(-70, 8, 5, 0, Math.PI * 2);
    ctx.fill();

    // Saddle / Bull Rope
    ctx.fillStyle = '#78350f';
    ctx.fillRect(-10, -18, 22, 8);
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2;
    ctx.strokeRect(-10, -18, 22, 8);

    // 7. Cowboy Rider
    if (!isCrashed) {
      // Mounted Cowboy holding rope with one hand, waving hat with other
      ctx.save();
      ctx.translate(2, -22);

      // Jeans / Legs gripping the bull
      ctx.fillStyle = '#1e3a8a';
      ctx.beginPath();
      ctx.ellipse(-2, 10, 8, 14, 0.2, 0, Math.PI * 2);
      ctx.fill();

      // Cowboy Leather Boots
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-6, 20, 10, 6);

      // Torso (Plaid Western Shirt)
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.roundRect(-8, -16, 16, 22, 4);
      ctx.fill();

      // Left Arm holding the bull rope tight
      ctx.strokeStyle = '#b91c1c';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(4, -8);
      ctx.lineTo(14, -2);
      ctx.stroke();

      // Right Arm waving high in the air!
      const armWave = isRiding ? Math.sin(timeSec * 3.5) * 0.35 : 0;
      ctx.beginPath();
      ctx.moveTo(-6, -10);
      ctx.lineTo(-20, -28 + armWave * 10);
      ctx.stroke();

      // Cowboy Head
      ctx.fillStyle = '#fbcfe8';
      ctx.beginPath();
      ctx.arc(0, -22, 7, 0, Math.PI * 2);
      ctx.fill();

      // Stetson Cowboy Hat held high or on head
      ctx.save();
      ctx.translate(-22, -34 + armWave * 10);
      ctx.rotate(-0.25 + armWave * 0.2);
      // Hat brim
      ctx.fillStyle = '#b45309';
      ctx.beginPath();
      ctx.ellipse(0, 0, 14, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      // Hat crown
      ctx.fillStyle = '#92400e';
      ctx.beginPath();
      ctx.roundRect(-6, -8, 12, 8, 2);
      ctx.fill();
      ctx.restore();

      ctx.restore();
    } else {
      // Crashed: Cowboy bucked off into the air!
      ctx.save();
      // Cowboy flying backwards in slow motion tumble
      const flyX = -65;
      const flyY = -48;
      ctx.translate(flyX, flyY);
      ctx.rotate(-0.85);

      // Flailing body
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(-8, -12, 16, 20);
      ctx.fillStyle = '#1e3a8a';
      ctx.fillRect(-10, 6, 8, 18);
      ctx.fillRect(2, 6, 8, 16);

      // Hat flying off separately
      ctx.fillStyle = '#b45309';
      ctx.beginPath();
      ctx.ellipse(-25, -25, 12, 4, -0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();

    // 8. Chute Gate rendering during COUNTDOWN
    if (gameState === 'COUNTDOWN') {
      ctx.save();
      const chuteX = width * 0.22;
      const chuteY = groundY - 60;
      ctx.fillStyle = 'rgba(30, 20, 15, 0.95)';
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 3;
      ctx.fillRect(chuteX, chuteY, 65, 85);
      ctx.strokeRect(chuteX, chuteY, 65, 85);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('CHUTE #7', chuteX + 32, chuteY + 22);

      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 22px monospace';
      ctx.fillText(`${countdown}s`, chuteX + 32, chuteY + 54);
      ctx.restore();
    }

    // 9. Trajectory Multiplier Track (Progress bar at bottom of canvas)
    ctx.save();
    const trackY = height - 14;
    const trackWidth = width - 40;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.roundRect(20, trackY, trackWidth, 6, 3);
    ctx.fill();

    if (isRiding || isCrashed) {
      const progressRatio = Math.min((currentMultiplier - 1.0) / Math.max(crashPoint - 1.0, 0.1), 1.0);
      const fillW = trackWidth * progressRatio;
      const trackGrad = ctx.createLinearGradient(20, trackY, 20 + fillW, trackY);
      trackGrad.addColorStop(0, '#f59e0b');
      trackGrad.addColorStop(0.5, '#ef4444');
      trackGrad.addColorStop(1, '#8b5cf6');
      ctx.fillStyle = trackGrad;
      ctx.roundRect(20, trackY, fillW, 6, 3);
      ctx.fill();
    }
    ctx.restore();
  }, [gameState, countdown, currentMultiplier, crashPoint]);

  // Color styles based on current multiplier level
  const getMultiplierColor = (mult: number) => {
    if (mult < 2.0) return 'text-amber-400';
    if (mult < 10.0) return 'text-purple-400';
    if (mult < 50.0) return 'text-emerald-400';
    return 'text-rose-500 animate-pulse';
  };

  const getChipBadgeColor = (mult: number) => {
    if (mult < 2.0) return 'border-amber-500/30 text-amber-400 bg-amber-500/10';
    if (mult < 10.0) return 'border-purple-500/30 text-purple-300 bg-purple-500/10';
    if (mult < 50.0) return 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10';
    return 'border-rose-500 text-rose-400 bg-rose-500/20 font-bold';
  };

  return (
    <div className="flex-1 flex flex-col bg-[#080509] text-gray-100 overflow-y-auto select-none">
      {/* 1. Header Navigation Bar */}
      <header className="bg-[#120a16] border-b border-amber-900/40 px-3 sm:px-5 py-2.5 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-gray-400 hover:text-white bg-slate-900/80 hover:bg-slate-800 px-3 py-1.5 rounded-xl border border-gray-800 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">লবিতে ফিরুন</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xl">🐂</span>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm sm:text-base font-black text-amber-400 tracking-wide">
                  রোডিও ক্র্যাশ
                </h1>
                <span className="text-[10px] bg-gradient-to-r from-amber-600 to-red-600 text-white font-extrabold px-1.5 py-0.5 rounded uppercase">
                  RODEO
                </span>
                <span className="hidden md:inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  <ShieldCheck className="w-3 h-3" />
                  RTP 97.0%
                </span>
              </div>
              <p className="text-[10px] text-gray-400 hidden sm:block">
                বুল রাইড ধরে রাখুন ও ক্র্যাশের আগে ক্যাশআউট করুন
              </p>
            </div>
          </div>
        </div>

        {/* Right side controls: Balance + Audio + Help */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* User Balance Chip */}
          <div className="flex items-center gap-2 bg-slate-900/90 border border-amber-500/30 rounded-xl px-2.5 sm:px-3 py-1.5">
            <span className="text-xs text-gray-400 hidden sm:inline">ব্যালেন্স:</span>
            <span className="font-mono font-black text-sm text-amber-400">
              ৳ {balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
            {onOpenDeposit && (
              <button
                onClick={onOpenDeposit}
                className="text-[11px] bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-2 py-0.5 rounded-lg transition"
              >
                ডিপোজিট
              </button>
            )}
          </div>

          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-xl bg-slate-900/80 border border-gray-800 hover:text-amber-400 text-gray-400 transition"
            title={soundEnabled ? 'সাউন্ড বন্ধ করুন' : 'সাউন্ড চালু করুন'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Help Modal Toggle */}
          <button
            onClick={() => setShowHelpModal(true)}
            className="p-2 rounded-xl bg-slate-900/80 border border-gray-800 hover:text-amber-400 text-gray-400 transition"
            title="গেম নিয়মাবলী"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. Top Past Rounds History Ribbon */}
      <div className="bg-[#0e0712] border-b border-gray-800 px-3 sm:px-5 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar text-xs">
        <div className="flex items-center gap-1 text-[11px] font-bold text-gray-400 shrink-0">
          <History className="w-3.5 h-3.5 text-amber-500" />
          <span>হিস্টোরি:</span>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {pastRounds.map((round, idx) => (
            <button
              key={idx}
              onClick={() => {
                setSelectedRoundHistory({
                  id: `RD-${Date.now() - idx * 45000}`,
                  mult: round,
                  hash: `sha256-rodeo-${Math.random().toString(36).substring(2, 12)}`,
                  seed: `client-seed-${Math.random().toString(36).substring(2, 8)}`,
                });
                setShowHistoryModal(true);
              }}
              className={`px-2 py-0.5 rounded-md border text-[11px] font-mono font-bold transition hover:scale-105 ${getChipBadgeColor(
                round
              )}`}
            >
              {round.toFixed(2)}x
            </button>
          ))}
        </div>
      </div>

      {/* 3. Main Stage: Arena Canvas & Central Multiplier HUD */}
      <div className="flex-1 max-w-7xl mx-auto w-full p-2 sm:p-4 flex flex-col lg:flex-row gap-3">
        {/* Left / Center: Rodeo Arena Canvas Stage */}
        <div className="flex-1 flex flex-col gap-3">
          <div className="relative w-full h-[260px] sm:h-[340px] md:h-[380px] rounded-2xl overflow-hidden border border-amber-900/40 bg-[#0d0711] shadow-2xl">
            <canvas ref={canvasRef} className="w-full h-full block" />

            {/* Central Floating Multiplier Display */}
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
              {gameState === 'COUNTDOWN' && (
                <div className="bg-slate-950/80 border border-amber-500/40 backdrop-blur-md px-6 py-4 rounded-3xl text-center shadow-2xl flex flex-col items-center animate-pulse">
                  <span className="text-xs uppercase tracking-widest text-amber-400 font-bold mb-1">
                    পরবর্তী রাউন্ড শুরু হচ্ছে
                  </span>
                  <div className="text-3xl sm:text-5xl font-black font-mono text-white flex items-center gap-2">
                    <span>{countdown}</span>
                    <span className="text-lg text-amber-400 font-sans">সেকেন্ড</span>
                  </div>
                  <span className="text-[11px] text-gray-400 mt-1">
                    গেট খোলার আগেই বেট কনফার্ম করুন
                  </span>
                </div>
              )}

              {gameState === 'RIDING' && (
                <div className="text-center drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]">
                  <div
                    className={`text-5xl sm:text-7xl font-black font-mono tracking-tight tabular-nums transition-colors ${getMultiplierColor(
                      currentMultiplier
                    )}`}
                  >
                    {currentMultiplier.toFixed(2)}x
                  </div>
                  <div className="mt-1 flex items-center justify-center gap-1.5 text-xs sm:text-sm font-bold text-amber-300 bg-black/60 px-3 py-1 rounded-full border border-amber-500/30 backdrop-blur-sm">
                    <Flame className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
                    <span>রোডিও চলছে! ক্যাশ আউট করতে ট্যাপ করুন</span>
                  </div>
                </div>
              )}

              {gameState === 'CRASHED' && (
                <div className="bg-rose-950/90 border border-rose-500 backdrop-blur-md px-6 py-4 rounded-3xl text-center shadow-2xl animate-shake">
                  <div className="flex items-center justify-center gap-2 text-rose-400 text-xs sm:text-sm font-black uppercase tracking-wider mb-1">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span>BUCKED OFF! ষাঁড় থেকে পড়ে গেছেন!</span>
                  </div>
                  <div className="text-4xl sm:text-6xl font-black font-mono text-rose-400 tracking-tight">
                    {currentMultiplier.toFixed(2)}x
                  </div>
                  <p className="text-[11px] text-rose-200 mt-1">পরবর্তী রাইডের প্রস্তুতি নিন...</p>
                </div>
              )}
            </div>

            {/* Stadium Status Tag Top-Left */}
            <div className="absolute top-3 left-3 flex items-center gap-2 bg-slate-950/70 border border-gray-800 px-3 py-1 rounded-xl text-xs backdrop-blur-sm">
              <span
                className={`w-2 h-2 rounded-full ${
                  gameState === 'RIDING'
                    ? 'bg-emerald-400 animate-ping'
                    : gameState === 'COUNTDOWN'
                    ? 'bg-amber-400'
                    : 'bg-rose-500'
                }`}
              />
              <span className="font-semibold text-gray-300">
                {gameState === 'RIDING' ? 'লাইভ রোডিও রাইড' : gameState === 'COUNTDOWN' ? 'গেট প্রস্তুতি' : 'রাউন্ড শেষ'}
              </span>
            </div>
          </div>

          {/* 4. Dual Cockpit Betting Panels */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Betting Console 1 */}
            <div className="bg-[#120a16] border border-amber-900/30 rounded-2xl p-3 sm:p-4 flex flex-col justify-between shadow-lg">
              {/* Tabs: Manual / Auto */}
              <div className="flex items-center justify-between mb-3 border-b border-gray-800 pb-2">
                <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl">
                  <button
                    onClick={() => setActiveBetTab1('manual')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                      activeBetTab1 === 'manual'
                        ? 'bg-amber-500 text-slate-950 shadow'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    সাধারণ বেট
                  </button>
                  <button
                    onClick={() => setActiveBetTab1('auto')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                      activeBetTab1 === 'auto'
                        ? 'bg-amber-500 text-slate-950 shadow'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    অটো বেট
                  </button>
                </div>
                <span className="text-[11px] text-amber-400/80 font-mono font-bold">কনসোল #১</span>
              </div>

              {/* Amount Input & Step Controls */}
              <div className="flex items-center gap-2 mb-2">
                <div className="flex-1 flex items-center bg-slate-950 border border-gray-800 rounded-xl px-3 py-2">
                  <span className="text-amber-500 font-bold text-xs mr-2">৳</span>
                  <input
                    type="number"
                    min={10}
                    max={balance || 50000}
                    step={10}
                    value={bet1.amount}
                    onChange={e =>
                      setBet1(prev => ({ ...prev, amount: Math.max(10, Number(e.target.value)) }))
                    }
                    disabled={bet1.hasBet && gameState === 'RIDING'}
                    className="w-full bg-transparent font-mono font-bold text-sm text-white focus:outline-none"
                  />
                </div>
                <button
                  onClick={() => setBet1(prev => ({ ...prev, amount: Math.max(10, prev.amount - 50) }))}
                  disabled={bet1.hasBet && gameState === 'RIDING'}
                  className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-900 border border-gray-800 text-gray-300 hover:bg-slate-800 font-bold text-sm"
                >
                  -
                </button>
                <button
                  onClick={() => setBet1(prev => ({ ...prev, amount: prev.amount + 50 }))}
                  disabled={bet1.hasBet && gameState === 'RIDING'}
                  className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-900 border border-gray-800 text-gray-300 hover:bg-slate-800 font-bold text-sm"
                >
                  +
                </button>
                <button
                  onClick={() => setBet1(prev => ({ ...prev, amount: Math.max(10, Math.floor(prev.amount / 2)) }))}
                  disabled={bet1.hasBet && gameState === 'RIDING'}
                  className="px-2 h-9 flex items-center justify-center rounded-xl bg-slate-900 border border-gray-800 text-[11px] font-bold text-gray-300 hover:bg-slate-800"
                >
                  ½
                </button>
                <button
                  onClick={() => setBet1(prev => ({ ...prev, amount: prev.amount * 2 }))}
                  disabled={bet1.hasBet && gameState === 'RIDING'}
                  className="px-2 h-9 flex items-center justify-center rounded-xl bg-slate-900 border border-gray-800 text-[11px] font-bold text-gray-300 hover:bg-slate-800"
                >
                  2X
                </button>
              </div>

              {/* Quick Chip Presets */}
              <div className="grid grid-cols-4 gap-1.5 mb-3">
                {PRESET_CHIPS_BET1.map(chip => (
                  <button
                    key={chip}
                    onClick={() => setBet1(prev => ({ ...prev, amount: chip }))}
                    disabled={bet1.hasBet && gameState === 'RIDING'}
                    className="py-1 rounded-lg bg-slate-900/90 border border-gray-800 text-[11px] font-mono text-gray-300 hover:border-amber-500/50 hover:text-amber-400 transition"
                  >
                    ৳{chip}
                  </button>
                ))}
              </div>

              {/* Auto Cashout Controls */}
              {activeBetTab1 === 'auto' && (
                <div className="flex items-center justify-between bg-slate-950/80 border border-gray-800 p-2 rounded-xl mb-3">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-300">
                    <input
                      type="checkbox"
                      checked={bet1.autoCashout}
                      onChange={e => setBet1(prev => ({ ...prev, autoCashout: e.target.checked }))}
                      className="rounded accent-amber-500"
                    />
                    <span>অটো ক্যাশ আউট</span>
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step={0.1}
                      min={1.1}
                      value={bet1.autoCashoutAt}
                      onChange={e =>
                        setBet1(prev => ({ ...prev, autoCashoutAt: Math.max(1.1, Number(e.target.value)) }))
                      }
                      className="w-16 bg-slate-900 border border-gray-700 rounded-lg px-2 py-1 text-xs text-amber-400 font-mono font-bold text-center focus:outline-none"
                    />
                    <span className="text-xs text-gray-400 font-mono">x</span>
                  </div>
                </div>
              )}

              {/* Big Ergonomic Action Button */}
              {gameState === 'RIDING' ? (
                bet1.hasBet && !bet1.hasCashedOut ? (
                  <button
                    onClick={handleCashoutBet1}
                    className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-black text-base sm:text-lg rounded-2xl shadow-xl shadow-amber-500/30 hover:scale-[1.02] active:scale-[0.98] transition animate-pulse flex flex-col items-center justify-center leading-tight"
                  >
                    <span>ক্যাশ আউট</span>
                    <span className="text-xs font-mono font-bold">
                      ৳ {Math.floor(bet1.amount * currentMultiplier).toLocaleString('en-US')} (
                      {currentMultiplier.toFixed(2)}x)
                    </span>
                  </button>
                ) : bet1.hasCashedOut ? (
                  <div className="w-full py-3.5 bg-emerald-600/30 border border-emerald-500/50 text-emerald-400 font-black text-sm rounded-2xl flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span>ক্যাশড আউট (+৳{Math.floor(bet1.amount * bet1.cashedOutMultiplier)})</span>
                  </div>
                ) : (
                  <button
                    disabled
                    className="w-full py-3.5 bg-slate-800 text-gray-500 font-bold text-sm rounded-2xl cursor-not-allowed text-center"
                  >
                    রোডিও চলছে (অপেক্ষা করুন)
                  </button>
                )
              ) : (
                <button
                  onClick={toggleBet1}
                  className={`w-full py-3.5 font-black text-base rounded-2xl shadow-xl transition hover:scale-[1.01] active:scale-[0.98] ${
                    bet1.hasBet
                      ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                      : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/30'
                  }`}
                >
                  {bet1.hasBet ? 'বেট বাতিল করুন' : `বেট ধরুন ৳${bet1.amount}`}
                </button>
              )}
            </div>

            {/* Betting Console 2 */}
            <div className="bg-[#120a16] border border-amber-900/30 rounded-2xl p-3 sm:p-4 flex flex-col justify-between shadow-lg">
              {/* Tabs: Manual / Auto */}
              <div className="flex items-center justify-between mb-3 border-b border-gray-800 pb-2">
                <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl">
                  <button
                    onClick={() => setActiveBetTab2('manual')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                      activeBetTab2 === 'manual'
                        ? 'bg-amber-500 text-slate-950 shadow'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    সাধারণ বেট
                  </button>
                  <button
                    onClick={() => setActiveBetTab2('auto')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                      activeBetTab2 === 'auto'
                        ? 'bg-amber-500 text-slate-950 shadow'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    অটো বেট
                  </button>
                </div>
                <span className="text-[11px] text-amber-400/80 font-mono font-bold">কনসোল #২</span>
              </div>

              {/* Amount Input & Step Controls */}
              <div className="flex items-center gap-2 mb-2">
                <div className="flex-1 flex items-center bg-slate-950 border border-gray-800 rounded-xl px-3 py-2">
                  <span className="text-amber-500 font-bold text-xs mr-2">৳</span>
                  <input
                    type="number"
                    min={10}
                    max={balance || 50000}
                    step={10}
                    value={bet2.amount}
                    onChange={e =>
                      setBet2(prev => ({ ...prev, amount: Math.max(10, Number(e.target.value)) }))
                    }
                    disabled={bet2.hasBet && gameState === 'RIDING'}
                    className="w-full bg-transparent font-mono font-bold text-sm text-white focus:outline-none"
                  />
                </div>
                <button
                  onClick={() => setBet2(prev => ({ ...prev, amount: Math.max(10, prev.amount - 50) }))}
                  disabled={bet2.hasBet && gameState === 'RIDING'}
                  className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-900 border border-gray-800 text-gray-300 hover:bg-slate-800 font-bold text-sm"
                >
                  -
                </button>
                <button
                  onClick={() => setBet2(prev => ({ ...prev, amount: prev.amount + 50 }))}
                  disabled={bet2.hasBet && gameState === 'RIDING'}
                  className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-900 border border-gray-800 text-gray-300 hover:bg-slate-800 font-bold text-sm"
                >
                  +
                </button>
                <button
                  onClick={() => setBet2(prev => ({ ...prev, amount: Math.max(10, Math.floor(prev.amount / 2)) }))}
                  disabled={bet2.hasBet && gameState === 'RIDING'}
                  className="px-2 h-9 flex items-center justify-center rounded-xl bg-slate-900 border border-gray-800 text-[11px] font-bold text-gray-300 hover:bg-slate-800"
                >
                  ½
                </button>
                <button
                  onClick={() => setBet2(prev => ({ ...prev, amount: prev.amount * 2 }))}
                  disabled={bet2.hasBet && gameState === 'RIDING'}
                  className="px-2 h-9 flex items-center justify-center rounded-xl bg-slate-900 border border-gray-800 text-[11px] font-bold text-gray-300 hover:bg-slate-800"
                >
                  2X
                </button>
              </div>

              {/* Quick Chip Presets */}
              <div className="grid grid-cols-4 gap-1.5 mb-3">
                {PRESET_CHIPS_BET2.map(chip => (
                  <button
                    key={chip}
                    onClick={() => setBet2(prev => ({ ...prev, amount: chip }))}
                    disabled={bet2.hasBet && gameState === 'RIDING'}
                    className="py-1 rounded-lg bg-slate-900/90 border border-gray-800 text-[11px] font-mono text-gray-300 hover:border-amber-500/50 hover:text-amber-400 transition"
                  >
                    ৳{chip}
                  </button>
                ))}
              </div>

              {/* Auto Cashout Controls */}
              {activeBetTab2 === 'auto' && (
                <div className="flex items-center justify-between bg-slate-950/80 border border-gray-800 p-2 rounded-xl mb-3">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-300">
                    <input
                      type="checkbox"
                      checked={bet2.autoCashout}
                      onChange={e => setBet2(prev => ({ ...prev, autoCashout: e.target.checked }))}
                      className="rounded accent-amber-500"
                    />
                    <span>অটো ক্যাশ আউট</span>
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step={0.1}
                      min={1.1}
                      value={bet2.autoCashoutAt}
                      onChange={e =>
                        setBet2(prev => ({ ...prev, autoCashoutAt: Math.max(1.1, Number(e.target.value)) }))
                      }
                      className="w-16 bg-slate-900 border border-gray-700 rounded-lg px-2 py-1 text-xs text-amber-400 font-mono font-bold text-center focus:outline-none"
                    />
                    <span className="text-xs text-gray-400 font-mono">x</span>
                  </div>
                </div>
              )}

              {/* Big Ergonomic Action Button */}
              {gameState === 'RIDING' ? (
                bet2.hasBet && !bet2.hasCashedOut ? (
                  <button
                    onClick={handleCashoutBet2}
                    className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-black text-base sm:text-lg rounded-2xl shadow-xl shadow-amber-500/30 hover:scale-[1.02] active:scale-[0.98] transition animate-pulse flex flex-col items-center justify-center leading-tight"
                  >
                    <span>ক্যাশ আউট</span>
                    <span className="text-xs font-mono font-bold">
                      ৳ {Math.floor(bet2.amount * currentMultiplier).toLocaleString('en-US')} (
                      {currentMultiplier.toFixed(2)}x)
                    </span>
                  </button>
                ) : bet2.hasCashedOut ? (
                  <div className="w-full py-3.5 bg-emerald-600/30 border border-emerald-500/50 text-emerald-400 font-black text-sm rounded-2xl flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span>ক্যাশড আউট (+৳{Math.floor(bet2.amount * bet2.cashedOutMultiplier)})</span>
                  </div>
                ) : (
                  <button
                    disabled
                    className="w-full py-3.5 bg-slate-800 text-gray-500 font-bold text-sm rounded-2xl cursor-not-allowed text-center"
                  >
                    রোডিও চলছে (অপেক্ষা করুন)
                  </button>
                )
              ) : (
                <button
                  onClick={toggleBet2}
                  className={`w-full py-3.5 font-black text-base rounded-2xl shadow-xl transition hover:scale-[1.01] active:scale-[0.98] ${
                    bet2.hasBet
                      ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                      : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/30'
                  }`}
                >
                  {bet2.hasBet ? 'বেট বাতিল করুন' : `বেট ধরুন ৳${bet2.amount}`}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right: Live Multiplayer Feed & Sidebar */}
        <div className="w-full lg:w-72 bg-[#120a16] border border-amber-900/30 rounded-2xl p-3 flex flex-col shadow-xl">
          {/* Sidebar Tabs */}
          <div className="flex items-center justify-between border-b border-gray-800 pb-2 mb-2">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveSidebarTab('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                  activeSidebarTab === 'all'
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                সব প্লেয়ার
              </button>
              <button
                onClick={() => setActiveSidebarTab('my')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                  activeSidebarTab === 'my'
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                আমার বেট
              </button>
              <button
                onClick={() => setActiveSidebarTab('top')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                  activeSidebarTab === 'top'
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                টপ রাইডার
              </button>
            </div>
          </div>

          {/* List of Simulated Players / My Bets */}
          <div className="flex-1 overflow-y-auto max-h-[380px] space-y-1.5 pr-1">
            {activeSidebarTab === 'all' &&
              liveRiders.map(player => (
                <div
                  key={player.id}
                  className="flex items-center justify-between bg-slate-950/60 border border-gray-800/80 rounded-xl px-2.5 py-1.5 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-[10px]">
                      {player.avatar}
                    </span>
                    <span className="text-gray-300 font-medium truncate max-w-[90px]">{player.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-gray-200">৳{player.bet}</div>
                    {player.status === 'cashed_out' && (
                      <span className="text-[10px] text-emerald-400 font-mono font-bold">
                        {player.multiplier?.toFixed(2)}x (+৳
                        {Math.floor(player.bet * (player.multiplier || 1))})
                      </span>
                    )}
                    {player.status === 'riding' && (
                      <span className="text-[10px] text-amber-400 animate-pulse font-medium">রাইড করছেন</span>
                    )}
                    {player.status === 'bucked_off' && (
                      <span className="text-[10px] text-rose-400 font-medium">পড়ে গেছেন ❌</span>
                    )}
                  </div>
                </div>
              ))}

            {activeSidebarTab === 'my' &&
              (myBetsHistory.length > 0 ? (
                myBetsHistory.map(b => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between bg-slate-950/60 border border-gray-800/80 rounded-xl px-2.5 py-1.5 text-xs"
                  >
                    <div>
                      <span className="text-gray-400 text-[10px]">{b.time}</span>
                      <div className="font-mono text-gray-200">৳{b.bet}</div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`font-mono font-bold text-xs ${
                          b.status === 'win' ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {b.mult.toFixed(2)}x
                      </span>
                      <div className="text-[11px] font-mono text-gray-300">
                        {b.status === 'win' ? `+৳${b.win}` : '৳০'}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500 text-xs">কোনো বেট হিস্টোরি পাওয়া যায়নি</div>
              ))}

            {activeSidebarTab === 'top' && (
              <div className="space-y-1.5">
                {[
                  { name: 'বুল_লেজেন্ড_৭৭', bet: 2000, mult: 84.5, win: 169000 },
                  { name: 'সাকিব_রয়্যাল', bet: 1000, mult: 42.1, win: 42100 },
                  { name: 'ঢাকা_কাউবয়', bet: 500, mult: 35.8, win: 17900 },
                  { name: 'বিআইপি_মেহেদী', bet: 1500, mult: 21.0, win: 31500 },
                ].map((top, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-gradient-to-r from-amber-950/30 to-slate-950 border border-amber-500/20 rounded-xl px-2.5 py-1.5 text-xs"
                  >
                    <div className="flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-gray-200 font-semibold">{top.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-amber-400 font-mono font-bold">{top.mult}x</div>
                      <div className="text-[10px] text-emerald-400 font-mono">+৳{top.win.toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 5. Provably Fair Modal */}
      {showHistoryModal && selectedRoundHistory && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#150d1a] border border-amber-500/40 rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4 border-b border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">প্রুভ্যাবলি ফেয়ার রাউন্ড বিবরণ</h3>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="text-gray-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div className="bg-slate-950 p-3 rounded-xl border border-gray-800">
                <span className="text-gray-400 block mb-1">রাউন্ড ক্র্যাশ গুণক:</span>
                <span className="font-mono text-xl font-black text-amber-400">
                  {selectedRoundHistory.mult.toFixed(2)}x
                </span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-gray-800">
                <span className="text-gray-400 block mb-1">রাউন্ড আইডি:</span>
                <span className="font-mono text-gray-200 break-all">{selectedRoundHistory.id}</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-gray-800">
                <span className="text-gray-400 block mb-1">SHA-256 হ্যাশ:</span>
                <span className="font-mono text-emerald-400 break-all">{selectedRoundHistory.hash}</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-gray-800">
                <span className="text-gray-400 block mb-1">ক্লায়েন্ট সিড:</span>
                <span className="font-mono text-purple-300 break-all">{selectedRoundHistory.seed}</span>
              </div>
            </div>
            <button
              onClick={() => setShowHistoryModal(false)}
              className="mt-5 w-full py-2.5 bg-amber-500 text-slate-950 font-bold rounded-xl hover:bg-amber-400 transition"
            >
              ঠিক আছে
            </button>
          </div>
        </div>
      )}

      {/* 6. Game Help / Rules Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#150d1a] border border-amber-500/40 rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4 border-b border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">রোডিও ক্র্যাশ কিভাবে খেলবেন?</h3>
              </div>
              <button
                onClick={() => setShowHelpModal(false)}
                className="text-gray-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3 text-xs text-gray-300 leading-relaxed">
              <p>
                ১. <strong>বেট ধরুন:</strong> রাউন্ড শুরু হওয়ার আগে বা ৪ সেকেন্ড কাউন্টডাউনের মধ্যে আপনার কাঙ্খিত বেট পরিমাণ নির্ধারণ করুন।
              </p>
              <p>
                ২. <strong>বুল রাইড ও মাল্টিপ্লায়ার:</strong> গেট খোলার সাথে সাথে ক্ষ্যাপাটে ষাঁড় বা বুল লাফাতে শুরু করবে এবং স্ক্রিনে মাল্টিপ্লায়ার ১.০০x থেকে ক্রমান্বয়ে বৃদ্ধি পাবে।
              </p>
              <p>
                ৩. <strong>ক্যাশ আউট করুন:</strong> ষাঁড়টি রাইডারকে ফেলে দেওয়ার (Bucked Off / Crash) পূর্বেই &quot;ক্যাশ আউট&quot; বাটনে ক্লিক করে আপনার মুনাফা তুলে নিন!
              </p>
              <p>
                ৪. <strong>অটো ক্যাশ আউট:</strong> আপনি চাইলে পূর্বেই একটি নির্দিষ্ট মাল্টিপ্লায়ার (যেমন ২.০০x) সেট করে রাখতে পারেন, যেখানে পৌঁছালে সিস্টেম স্বয়ংক্রিয়ভাবে ক্যাশ আউট করে দেবে।
              </p>
            </div>
            <button
              onClick={() => setShowHelpModal(false)}
              className="mt-5 w-full py-2.5 bg-amber-500 text-slate-950 font-bold rounded-xl hover:bg-amber-400 transition"
            >
              বুঝেছি, খেলা শুরু করি
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
