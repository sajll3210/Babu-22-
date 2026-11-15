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
} from 'lucide-react';
import { sound } from '../../utils/audio';

interface CowboyCrashGameProps {
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
  status: 'riding' | 'cashed_out' | 'crashed';
}

const PRESET_CHIPS_BET1 = [50, 100, 200, 500];
const PRESET_CHIPS_BET2 = [100, 200, 500, 1000];

// Bangladeshi authentic simulated cowboy players
const SIMULATED_COWBOYS = [
  { name: 'কাউবয়_সাকিব', avatar: 'S' },
  { name: 'টেক্সাস_তানভীর', avatar: 'T' },
  { name: 'রাকিব_ওয়েস্টার্ন', avatar: 'R' },
  { name: 'মুস্তাং_২২', avatar: 'M' },
  { name: 'আরিফ_রয়্যাল', avatar: 'A' },
  { name: 'মেহেদী_চিটাগাং', avatar: 'M' },
  { name: 'ফারহান_সিলেট', avatar: 'F' },
  { name: 'সুমন_রাজশাহী', avatar: 'S' },
];

export const CowboyCrashGame: React.FC<CowboyCrashGameProps> = ({
  balance,
  onUpdateBalance,
  onClose,
  onOpenDeposit,
}) => {
  // Game lifecycle: COUNTDOWN -> GALLOPING -> CRASHED
  const [gameState, setGameState] = useState<'COUNTDOWN' | 'GALLOPING' | 'CRASHED'>('COUNTDOWN');
  const [countdown, setCountdown] = useState<number>(4);
  const [currentMultiplier, setCurrentMultiplier] = useState<number>(1.0);
  const [crashPoint, setCrashPoint] = useState<number>(2.25);
  const [pastRounds, setPastRounds] = useState<number[]>([
    1.85, 3.42, 1.09, 12.80, 2.10, 1.45, 6.75, 1.00, 2.50, 1.12, 18.20, 1.05,
  ]);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Modals & History
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);
  const [selectedRoundHistory, setSelectedRoundHistory] = useState<{
    id: string;
    mult: number;
    hash: string;
    seed: string;
  } | null>(null);
  const [activeSidebarTab, setActiveSidebarTab] = useState<'all' | 'my' | 'top'>('all');

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

  // Simulated Live Riders Feed
  const [livePlayers, setLivePlayers] = useState<SimulatedPlayer[]>(() =>
    SIMULATED_COWBOYS.map((c, idx) => ({
      id: idx.toString(),
      name: c.name,
      avatar: c.avatar,
      bet: [100, 200, 250, 500, 1000, 300, 1500, 800][idx % 8],
      status: 'riding',
    }))
  );

  // My Round History
  const [myBetsHistory, setMyBetsHistory] = useState<
    Array<{ id: string; time: string; bet: number; mult: number; win: number; status: 'win' | 'lost' }>
  >([
    { id: '1', time: '11:05', bet: 100, mult: 1.85, win: 185, status: 'win' },
    { id: '2', time: '11:07', bet: 200, mult: 3.42, win: 684, status: 'win' },
    { id: '3', time: '11:10', bet: 150, mult: 1.09, win: 0, status: 'lost' },
  ]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  // Dust particles ref
  const dustParticlesRef = useRef<
    Array<{ x: number; y: number; size: number; alpha: number; vx: number; vy: number; color: string }>
  >([]);

  // Realistic Crash distribution with 97% RTP
  const generateCowboyCrashPoint = useCallback((): number => {
    const r = Math.random();
    if (r < 0.04) return 1.0;
    if (r < 0.09) return +(1.02 + Math.random() * 0.08).toFixed(2);
    const raw = 0.97 / (1.0 - Math.random());
    const capped = Math.min(raw, 500.0);
    return Math.max(1.05, +capped.toFixed(2));
  }, []);

  // Cashout Bet 1
  const handleCashoutBet1 = useCallback(() => {
    if (!bet1.hasBet || bet1.hasCashedOut || gameState !== 'GALLOPING') return;
    const winAmount = Math.floor(bet1.amount * currentMultiplier);
    setBet1(prev => ({
      ...prev,
      hasCashedOut: true,
      cashedOutMultiplier: currentMultiplier,
    }));
    onUpdateBalance(winAmount, `কাউবয় ক্র্যাশ ক্যাশআউট (+${currentMultiplier.toFixed(2)}x)`);
    if (soundEnabled) {
      sound.playWinChime();
      sound.playLassoWhoosh();
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
    if (!bet2.hasBet || bet2.hasCashedOut || gameState !== 'GALLOPING') return;
    const winAmount = Math.floor(bet2.amount * currentMultiplier);
    setBet2(prev => ({
      ...prev,
      hasCashedOut: true,
      cashedOutMultiplier: currentMultiplier,
    }));
    onUpdateBalance(winAmount, `কাউবয় ক্র্যাশ ক্যাশআউট (+${currentMultiplier.toFixed(2)}x)`);
    if (soundEnabled) {
      sound.playWinChime();
      sound.playLassoWhoosh();
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

  // Auto cashout listener
  useEffect(() => {
    if (gameState === 'GALLOPING') {
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
    if (gameState === 'GALLOPING') return;
    if (!bet1.hasBet) {
      if (balance < bet1.amount) {
        if (onOpenDeposit) onOpenDeposit();
        return;
      }
      onUpdateBalance(-bet1.amount, 'কাউবয় ক্র্যাশ বেট ১');
      setBet1(prev => ({ ...prev, hasBet: true, hasCashedOut: false }));
      if (soundEnabled) sound.playClick();
    } else {
      onUpdateBalance(bet1.amount, 'কাউবয় ক্র্যাশ বেট ১ বাতিল');
      setBet1(prev => ({ ...prev, hasBet: false }));
      if (soundEnabled) sound.playClick();
    }
  };

  // Toggle Bet 2
  const toggleBet2 = () => {
    if (gameState === 'GALLOPING') return;
    if (!bet2.hasBet) {
      if (balance < bet2.amount) {
        if (onOpenDeposit) onOpenDeposit();
        return;
      }
      onUpdateBalance(-bet2.amount, 'কাউবয় ক্র্যাশ বেট ২');
      setBet2(prev => ({ ...prev, hasBet: true, hasCashedOut: false }));
      if (soundEnabled) sound.playClick();
    } else {
      onUpdateBalance(bet2.amount, 'কাউবয় ক্র্যাশ বেট ২ বাতিল');
      setBet2(prev => ({ ...prev, hasBet: false }));
      if (soundEnabled) sound.playClick();
    }
  };

  // Main Galloping Engine Loop
  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (gameState === 'COUNTDOWN') {
      if (countdown > 0) {
        timer = setTimeout(() => {
          setCountdown(c => c - 1);
        }, 1000);
      } else {
        // Start Gallop!
        const point = generateCowboyCrashPoint();
        setCrashPoint(point);
        setCurrentMultiplier(1.0);
        setGameState('GALLOPING');
        startTimeRef.current = performance.now();
        dustParticlesRef.current = [];

        if (soundEnabled) {
          sound.playHorseNeigh();
          sound.playGallop();
        }

        // Reset players
        setLivePlayers(prev =>
          prev.map((p, idx) => ({
            ...p,
            bet: [100, 250, 300, 500, 1000, 200, 1500, 800][idx % 8],
            status: 'riding',
            multiplier: undefined,
          }))
        );
      }
    } else if (gameState === 'GALLOPING') {
      // Instant crash handling if point is 1.00
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

      // Dynamic duration curve
      const duration = Math.max(1000, Math.log(crashPoint + 0.1) * 4000);

      const updateFrame = (now: number) => {
        const elapsed = now - startTimeRef.current;
        const progress = Math.min(elapsed / duration, 1);

        const mult = +(1.0 + Math.pow(progress, 1.5) * (crashPoint - 1.0)).toFixed(2);
        setCurrentMultiplier(mult);

        // Random simulated player cashouts
        if (Math.random() < 0.05) {
          setLivePlayers(players =>
            players.map(p => {
              if (p.status === 'riding' && Math.random() < 0.3) {
                return { ...p, status: 'cashed_out', multiplier: mult };
              }
              return p;
            })
          );
        }

        if (progress >= 1 || mult >= crashPoint) {
          // Horse Rears up / Crash!
          setGameState('CRASHED');
          setCurrentMultiplier(crashPoint);
          if (soundEnabled) {
            sound.playCrash();
            sound.playHorseNeigh();
          }
          setPastRounds(prev => [crashPoint, ...prev.slice(0, 17)]);

          setLivePlayers(players =>
            players.map(p => (p.status === 'riding' ? { ...p, status: 'crashed' } : p))
          );

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
    generateCowboyCrashPoint,
    soundEnabled,
    bet1.hasBet,
    bet1.hasCashedOut,
    bet1.amount,
    bet2.hasBet,
    bet2.hasCashedOut,
    bet2.amount,
  ]);

  // Western Prairie Canvas Loop
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

    // 1. Blazing Desert Sunset Gradient Sky
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
    skyGrad.addColorStop(0, '#1c0a00');
    skyGrad.addColorStop(0.35, '#5c1d06');
    skyGrad.addColorStop(0.55, '#c2410c');
    skyGrad.addColorStop(0.7, '#ea580c');
    skyGrad.addColorStop(0.78, '#f59e0b');
    skyGrad.addColorStop(1, '#78350f');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height);

    // Giant Glowing Sunset Sun on Horizon
    const sunGrad = ctx.createRadialGradient(
      width * 0.75,
      height * 0.48,
      10,
      width * 0.75,
      height * 0.48,
      120
    );
    sunGrad.addColorStop(0, 'rgba(254, 240, 138, 0.9)');
    sunGrad.addColorStop(0.4, 'rgba(251, 146, 60, 0.6)');
    sunGrad.addColorStop(1, 'rgba(234, 88, 12, 0)');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(width * 0.75, height * 0.48, 120, 0, Math.PI * 2);
    ctx.fill();

    // 2. Distant Red Mesa Cliffs (Monument Valley Silhouettes)
    ctx.fillStyle = '#3a1306';
    ctx.beginPath();
    ctx.moveTo(0, height * 0.55);
    ctx.lineTo(width * 0.12, height * 0.48);
    ctx.lineTo(width * 0.22, height * 0.48);
    ctx.lineTo(width * 0.28, height * 0.55);
    ctx.lineTo(width * 0.45, height * 0.55);
    ctx.lineTo(width * 0.52, height * 0.42);
    ctx.lineTo(width * 0.64, height * 0.42);
    ctx.lineTo(width * 0.7, height * 0.55);
    ctx.lineTo(width, height * 0.55);
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fill();

    // 3. Desert Prairie Sand Floor
    const groundY = height * 0.64;
    const sandGrad = ctx.createLinearGradient(0, groundY, 0, height);
    sandGrad.addColorStop(0, '#59220c');
    sandGrad.addColorStop(0.25, '#3b1405');
    sandGrad.addColorStop(1, '#1b0902');
    ctx.fillStyle = sandGrad;
    ctx.fillRect(0, groundY, width, height - groundY);

    // Saguaro Cacti Silhouettes
    ctx.fillStyle = '#260b03';
    // Cactus 1
    const c1X = width * 0.15;
    const c1Y = groundY - 30;
    ctx.fillRect(c1X, c1Y, 6, 32);
    ctx.fillRect(c1X - 8, c1Y + 8, 8, 4);
    ctx.fillRect(c1X - 8, c1Y + 2, 4, 10);
    ctx.fillRect(c1X + 6, c1Y + 12, 8, 4);
    ctx.fillRect(c1X + 10, c1Y + 6, 4, 10);

    // Cactus 2
    const c2X = width * 0.88;
    const c2Y = groundY - 25;
    ctx.fillRect(c2X, c2Y, 5, 27);
    ctx.fillRect(c2X - 6, c2Y + 8, 6, 3);
    ctx.fillRect(c2X - 6, c2Y + 4, 3, 7);

    // 4. Galloping Mustang Horse & Cowboy Physics
    const timeSec = performance.now() * 0.007;
    const isGalloping = gameState === 'GALLOPING';
    const isCrashed = gameState === 'CRASHED';

    const horseBaseX = isGalloping ? width * 0.48 : isCrashed ? width * 0.44 : width * 0.36;
    const horseBaseY = groundY + 10;

    // Gallop 4-beat oscillation
    const gallopHop = isGalloping ? -Math.abs(Math.sin(timeSec * 3.5)) * 18 : 0;
    const horsePitch = isGalloping ? Math.sin(timeSec * 3.5) * 0.18 : isCrashed ? -0.45 : 0;

    // Dust particles kicked up behind hooves
    if (isGalloping && Math.random() < 0.85) {
      dustParticlesRef.current.push({
        x: horseBaseX - 45 + (Math.random() - 0.5) * 20,
        y: horseBaseY + gallopHop + 22,
        size: Math.random() * 7 + 3,
        alpha: 0.8,
        vx: -(Math.random() * 4 + 2),
        vy: -(Math.random() * 2 + 0.5),
        color: ['#ea580c', '#c2410c', '#9a3412', '#78350f'][Math.floor(Math.random() * 4)],
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

    // 5. Draw Mustang Horse & Cowboy
    ctx.save();
    ctx.translate(horseBaseX, horseBaseY + gallopHop);
    ctx.rotate(horsePitch);

    // Horse Body (Chestnut Mustang Stallion)
    ctx.fillStyle = '#7c2d12';
    // Torso
    ctx.beginPath();
    ctx.ellipse(0, 0, 48, 22, 0, 0, Math.PI * 2);
    ctx.fill();

    // Muscular Neck reaching forward
    ctx.beginPath();
    ctx.moveTo(24, -8);
    ctx.lineTo(46, -32);
    ctx.lineTo(36, -36);
    ctx.lineTo(12, -14);
    ctx.closePath();
    ctx.fill();

    // Horse Head
    ctx.beginPath();
    ctx.ellipse(48, -34, 16, 9, 0.45, 0, Math.PI * 2);
    ctx.fill();
    // Snout
    ctx.fillStyle = '#431407';
    ctx.beginPath();
    ctx.arc(60, -38, 5, 0, Math.PI * 2);
    ctx.fill();

    // Pointed Horse Ears
    ctx.fillStyle = '#7c2d12';
    ctx.beginPath();
    ctx.moveTo(40, -42);
    ctx.lineTo(43, -52);
    ctx.lineTo(47, -42);
    ctx.closePath();
    ctx.fill();

    // Flowing Black Mane
    ctx.fillStyle = '#1c1917';
    ctx.beginPath();
    ctx.moveTo(34, -40);
    ctx.quadraticCurveTo(24, -36, 18, -20);
    ctx.lineTo(26, -18);
    ctx.closePath();
    ctx.fill();

    // 4 Galloping Legs
    ctx.strokeStyle = '#5f200c';
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';

    const legCycle = timeSec * 3.5;
    const frontLegAngle = isGalloping ? Math.sin(legCycle) * 0.5 : 0;
    const rearLegAngle = isGalloping ? -Math.cos(legCycle) * 0.6 : 0;

    // Front Left Leg
    ctx.beginPath();
    ctx.moveTo(26, 12);
    ctx.lineTo(38 + Math.sin(frontLegAngle) * 26, 38);
    ctx.stroke();

    // Front Right Leg
    ctx.strokeStyle = '#431407';
    ctx.beginPath();
    ctx.moveTo(32, 12);
    ctx.lineTo(44 + Math.sin(-frontLegAngle) * 24, 36);
    ctx.stroke();

    // Rear Left Leg
    ctx.strokeStyle = '#5f200c';
    ctx.beginPath();
    ctx.moveTo(-28, 10);
    ctx.lineTo(-42 + Math.sin(rearLegAngle) * 28, 38);
    ctx.stroke();

    // Rear Right Leg
    ctx.strokeStyle = '#431407';
    ctx.beginPath();
    ctx.moveTo(-20, 10);
    ctx.lineTo(-30 + Math.sin(-rearLegAngle) * 26, 36);
    ctx.stroke();

    // Dark Hooves
    ctx.fillStyle = '#18181b';
    ctx.fillRect(38 + Math.sin(frontLegAngle) * 26 - 4, 38, 8, 4);
    ctx.fillRect(-42 + Math.sin(rearLegAngle) * 28 - 4, 38, 8, 4);

    // Flowing Tail
    ctx.fillStyle = '#1c1917';
    ctx.beginPath();
    ctx.moveTo(-44, -4);
    ctx.quadraticCurveTo(-65, -16, -72, 4);
    ctx.quadraticCurveTo(-58, 8, -44, 4);
    ctx.closePath();
    ctx.fill();

    // Saddle & Blanket
    ctx.fillStyle = '#d97706';
    ctx.fillRect(-12, -18, 24, 8);
    ctx.fillStyle = '#92400e';
    ctx.fillRect(-8, -20, 16, 6);

    // Cowboy Mounted on Saddle
    ctx.save();
    ctx.translate(0, -22);

    // Blue Denim Jeans
    ctx.fillStyle = '#1d4ed8';
    ctx.beginPath();
    ctx.ellipse(-2, 10, 7, 12, 0.25, 0, Math.PI * 2);
    ctx.fill();

    // Cowboy Leather Boots
    ctx.fillStyle = '#451a03';
    ctx.fillRect(-4, 20, 10, 5);

    // Red Western Flannel Shirt / Duster
    ctx.fillStyle = '#b91c1c';
    ctx.beginPath();
    ctx.roundRect(-8, -14, 16, 18, 4);
    ctx.fill();

    // Cowboy Head
    ctx.fillStyle = '#fed7aa';
    ctx.beginPath();
    ctx.arc(0, -20, 6.5, 0, Math.PI * 2);
    ctx.fill();

    // Stetson Hat
    ctx.fillStyle = '#78350f';
    // Brim
    ctx.beginPath();
    ctx.ellipse(0, -24, 14, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    // Crown
    ctx.fillStyle = '#5f200c';
    ctx.beginPath();
    ctx.roundRect(-6, -32, 12, 9, 2);
    ctx.fill();

    // Swirling Lasso in Hand (Right arm waving high with spinning lasso!)
    const armWave = isGalloping ? Math.sin(timeSec * 4.0) * 0.3 : 0;
    ctx.strokeStyle = '#991b1b';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-4, -10);
    ctx.lineTo(-14, -28 + armWave * 8);
    ctx.stroke();

    // 3D Spinning Lasso Loop
    ctx.save();
    ctx.translate(-14, -38 + armWave * 8);
    const lassoAngle = timeSec * 6.0;
    ctx.rotate(lassoAngle);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(0, 0, 18, 7, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    ctx.restore();

    ctx.restore();

    // 6. Bottom Multiplier Progress Track
    ctx.save();
    const trackY = height - 12;
    const trackWidth = width - 40;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.roundRect(20, trackY, trackWidth, 6, 3);
    ctx.fill();

    if (isGalloping || isCrashed) {
      const progressRatio = Math.min((currentMultiplier - 1.0) / Math.max(crashPoint - 1.0, 0.1), 1.0);
      const fillW = trackWidth * progressRatio;
      const trackGrad = ctx.createLinearGradient(20, trackY, 20 + fillW, trackY);
      trackGrad.addColorStop(0, '#f97316');
      trackGrad.addColorStop(0.5, '#ea580c');
      trackGrad.addColorStop(1, '#a855f7');
      ctx.fillStyle = trackGrad;
      ctx.roundRect(20, trackY, fillW, 6, 3);
      ctx.fill();
    }
    ctx.restore();
  }, [gameState, countdown, currentMultiplier, crashPoint]);

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
    <div className="flex-1 flex flex-col bg-[#0b0603] text-gray-100 overflow-y-auto select-none">
      {/* 1. Header Bar */}
      <header className="bg-[#140803] border-b border-orange-950/60 px-3 sm:px-5 py-2.5 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-gray-400 hover:text-white bg-slate-900/80 hover:bg-slate-800 px-3 py-1.5 rounded-xl border border-gray-800 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">লবিতে ফিরুন</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xl">🤠</span>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm sm:text-base font-black text-amber-400 tracking-wide">
                  কাউবয় ক্র্যাশ বেটিং
                </h1>
                <span className="text-[10px] bg-gradient-to-r from-orange-600 to-amber-600 text-white font-extrabold px-1.5 py-0.5 rounded uppercase">
                  COWBOY
                </span>
                <span className="hidden md:inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  <ShieldCheck className="w-3 h-3" />
                  RTP 97.0%
                </span>
              </div>
              <p className="text-[10px] text-gray-400 hidden sm:block">
                ঘোড়া থামার পূর্বে ক্যাশআউট করুন ও সর্বোচ্চ ৫,০০০x পর্যন্ত মেগা উইন জিতুন
              </p>
            </div>
          </div>
        </div>

        {/* Right side controls: Balance + Audio + Help */}
        <div className="flex items-center gap-2 sm:gap-3">
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

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-xl bg-slate-900/80 border border-gray-800 hover:text-amber-400 text-gray-400 transition"
            title={soundEnabled ? 'সাউন্ড বন্ধ করুন' : 'সাউন্ড চালু করুন'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setShowHelpModal(true)}
            className="p-2 rounded-xl bg-slate-900/80 border border-gray-800 hover:text-amber-400 text-gray-400 transition"
            title="গেম নিয়মাবলী"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. Top Past Multipliers Ribbon */}
      <div className="bg-[#110602] border-b border-gray-800/80 px-3 sm:px-5 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar text-xs">
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
                  id: `CW-${Date.now() - idx * 45000}`,
                  mult: round,
                  hash: `sha256-cowboy-${Math.random().toString(36).substring(2, 12)}`,
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

      {/* 3. Main Stage: Western Prairie Canvas & Central Multiplier */}
      <div className="flex-1 max-w-7xl mx-auto w-full p-2 sm:p-4 flex flex-col lg:flex-row gap-3">
        {/* Left / Center: Western Canvas */}
        <div className="flex-1 flex flex-col gap-3">
          <div className="relative w-full h-[260px] sm:h-[340px] md:h-[380px] rounded-2xl overflow-hidden border border-orange-950/50 bg-[#0e0602] shadow-2xl">
            <canvas ref={canvasRef} className="w-full h-full block" />

            {/* Central Floating Multiplier Display */}
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
              {gameState === 'COUNTDOWN' && (
                <div className="bg-slate-950/80 border border-orange-500/40 backdrop-blur-md px-6 py-4 rounded-3xl text-center shadow-2xl flex flex-col items-center animate-pulse">
                  <span className="text-xs uppercase tracking-widest text-amber-400 font-bold mb-1">
                    কাউবয় রাইড শুরু হচ্ছে
                  </span>
                  <div className="text-3xl sm:text-5xl font-black font-mono text-white flex items-center gap-2">
                    <span>{countdown}</span>
                    <span className="text-lg text-amber-400 font-sans">সেকেন্ড</span>
                  </div>
                  <span className="text-[11px] text-gray-400 mt-1">
                    ঘোড়া ছুটতে শুরু করার আগেই বেট নিশ্চিত করুন
                  </span>
                </div>
              )}

              {gameState === 'GALLOPING' && (
                <div className="text-center drop-shadow-[0_10px_20px_rgba(0,0,0,0.85)]">
                  <div
                    className={`text-5xl sm:text-7xl font-black font-mono tracking-tight tabular-nums transition-colors ${getMultiplierColor(
                      currentMultiplier
                    )}`}
                  >
                    {currentMultiplier.toFixed(2)}x
                  </div>
                  <div className="mt-1 flex items-center justify-center gap-1.5 text-xs sm:text-sm font-bold text-amber-300 bg-black/60 px-3 py-1 rounded-full border border-orange-500/40 backdrop-blur-sm">
                    <Flame className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
                    <span>কাউবয় ছুটছে! ক্যাশ আউট করতে ট্যাপ করুন</span>
                  </div>
                </div>
              )}

              {gameState === 'CRASHED' && (
                <div className="bg-rose-950/90 border border-rose-500 backdrop-blur-md px-6 py-4 rounded-3xl text-center shadow-2xl animate-shake">
                  <div className="flex items-center justify-center gap-2 text-rose-400 text-xs sm:text-sm font-black uppercase tracking-wider mb-1">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span>OUTLAW AMBUSH! ঘোড়া থেমে গেছে!</span>
                  </div>
                  <div className="text-4xl sm:text-6xl font-black font-mono text-rose-400 tracking-tight">
                    {currentMultiplier.toFixed(2)}x
                  </div>
                  <p className="text-[11px] text-rose-200 mt-1">পরবর্তী কাউবয় রাইডের প্রস্তুতি নিন...</p>
                </div>
              )}
            </div>

            {/* Status Tag Top-Left */}
            <div className="absolute top-3 left-3 flex items-center gap-2 bg-slate-950/70 border border-gray-800 px-3 py-1 rounded-xl text-xs backdrop-blur-sm">
              <span
                className={`w-2 h-2 rounded-full ${
                  gameState === 'GALLOPING'
                    ? 'bg-emerald-400 animate-ping'
                    : gameState === 'COUNTDOWN'
                    ? 'bg-amber-400'
                    : 'bg-rose-500'
                }`}
              />
              <span className="font-semibold text-gray-300">
                {gameState === 'GALLOPING' ? 'লাইভ গ্যালপ' : gameState === 'COUNTDOWN' ? 'কাউন্টডাউন' : 'ক্র্যাশড'}
              </span>
            </div>
          </div>

          {/* 4. Dual Cockpit Betting Panels */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Bet Console 1 */}
            <div className="bg-[#140803] border border-orange-950/50 rounded-2xl p-3 sm:p-4 flex flex-col justify-between shadow-lg">
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

              {/* Amount Input */}
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
                    disabled={bet1.hasBet && gameState === 'GALLOPING'}
                    className="w-full bg-transparent font-mono font-bold text-sm text-white focus:outline-none"
                  />
                </div>
                <button
                  onClick={() => setBet1(prev => ({ ...prev, amount: Math.max(10, prev.amount - 50) }))}
                  disabled={bet1.hasBet && gameState === 'GALLOPING'}
                  className="w-9 h-9 rounded-xl bg-slate-900 border border-gray-800 text-gray-300 hover:bg-slate-800 font-bold text-sm"
                >
                  -
                </button>
                <button
                  onClick={() => setBet1(prev => ({ ...prev, amount: prev.amount + 50 }))}
                  disabled={bet1.hasBet && gameState === 'GALLOPING'}
                  className="w-9 h-9 rounded-xl bg-slate-900 border border-gray-800 text-gray-300 hover:bg-slate-800 font-bold text-sm"
                >
                  +
                </button>
                <button
                  onClick={() => setBet1(prev => ({ ...prev, amount: Math.max(10, Math.floor(prev.amount / 2)) }))}
                  disabled={bet1.hasBet && gameState === 'GALLOPING'}
                  className="px-2 h-9 rounded-xl bg-slate-900 border border-gray-800 text-[11px] font-bold text-gray-300 hover:bg-slate-800"
                >
                  ½
                </button>
                <button
                  onClick={() => setBet1(prev => ({ ...prev, amount: prev.amount * 2 }))}
                  disabled={bet1.hasBet && gameState === 'GALLOPING'}
                  className="px-2 h-9 rounded-xl bg-slate-900 border border-gray-800 text-[11px] font-bold text-gray-300 hover:bg-slate-800"
                >
                  2X
                </button>
              </div>

              {/* Quick Presets */}
              <div className="grid grid-cols-4 gap-1.5 mb-3">
                {PRESET_CHIPS_BET1.map(chip => (
                  <button
                    key={chip}
                    onClick={() => setBet1(prev => ({ ...prev, amount: chip }))}
                    disabled={bet1.hasBet && gameState === 'GALLOPING'}
                    className="py-1 rounded-lg bg-slate-900/90 border border-gray-800 text-[11px] font-mono text-gray-300 hover:border-amber-500/50 hover:text-amber-400 transition"
                  >
                    ৳{chip}
                  </button>
                ))}
              </div>

              {/* Auto Cashout */}
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

              {/* Main Action Button */}
              {gameState === 'GALLOPING' ? (
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
                    কাউবয় ছুটছে (অপেক্ষা করুন)
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

            {/* Bet Console 2 */}
            <div className="bg-[#140803] border border-orange-950/50 rounded-2xl p-3 sm:p-4 flex flex-col justify-between shadow-lg">
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

              {/* Amount Input */}
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
                    disabled={bet2.hasBet && gameState === 'GALLOPING'}
                    className="w-full bg-transparent font-mono font-bold text-sm text-white focus:outline-none"
                  />
                </div>
                <button
                  onClick={() => setBet2(prev => ({ ...prev, amount: Math.max(10, prev.amount - 50) }))}
                  disabled={bet2.hasBet && gameState === 'GALLOPING'}
                  className="w-9 h-9 rounded-xl bg-slate-900 border border-gray-800 text-gray-300 hover:bg-slate-800 font-bold text-sm"
                >
                  -
                </button>
                <button
                  onClick={() => setBet2(prev => ({ ...prev, amount: prev.amount + 50 }))}
                  disabled={bet2.hasBet && gameState === 'GALLOPING'}
                  className="w-9 h-9 rounded-xl bg-slate-900 border border-gray-800 text-gray-300 hover:bg-slate-800 font-bold text-sm"
                >
                  +
                </button>
                <button
                  onClick={() => setBet2(prev => ({ ...prev, amount: Math.max(10, Math.floor(prev.amount / 2)) }))}
                  disabled={bet2.hasBet && gameState === 'GALLOPING'}
                  className="px-2 h-9 rounded-xl bg-slate-900 border border-gray-800 text-[11px] font-bold text-gray-300 hover:bg-slate-800"
                >
                  ½
                </button>
                <button
                  onClick={() => setBet2(prev => ({ ...prev, amount: prev.amount * 2 }))}
                  disabled={bet2.hasBet && gameState === 'GALLOPING'}
                  className="px-2 h-9 rounded-xl bg-slate-900 border border-gray-800 text-[11px] font-bold text-gray-300 hover:bg-slate-800"
                >
                  2X
                </button>
              </div>

              {/* Quick Presets */}
              <div className="grid grid-cols-4 gap-1.5 mb-3">
                {PRESET_CHIPS_BET2.map(chip => (
                  <button
                    key={chip}
                    onClick={() => setBet2(prev => ({ ...prev, amount: chip }))}
                    disabled={bet2.hasBet && gameState === 'GALLOPING'}
                    className="py-1 rounded-lg bg-slate-900/90 border border-gray-800 text-[11px] font-mono text-gray-300 hover:border-amber-500/50 hover:text-amber-400 transition"
                  >
                    ৳{chip}
                  </button>
                ))}
              </div>

              {/* Auto Cashout */}
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

              {/* Main Action Button */}
              {gameState === 'GALLOPING' ? (
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
                    কাউবয় ছুটছে (অপেক্ষা করুন)
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

        {/* Right: Live Multiplayer Feed */}
        <div className="w-full lg:w-72 bg-[#140803] border border-orange-950/50 rounded-2xl p-3 flex flex-col shadow-xl">
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
                সব রাইডার
              </button>
              <button
                onClick={() => setActiveSidebarTab('my')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                  activeSidebarTab === 'my'
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                আমার রাইড
              </button>
              <button
                onClick={() => setActiveSidebarTab('top')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                  activeSidebarTab === 'top'
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                টপ কাউবয়
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[380px] space-y-1.5 pr-1">
            {activeSidebarTab === 'all' &&
              livePlayers.map(player => (
                <div
                  key={player.id}
                  className="flex items-center justify-between bg-slate-950/60 border border-gray-800/80 rounded-xl px-2.5 py-1.5 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-400 font-bold flex items-center justify-center text-[10px]">
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
                      <span className="text-[10px] text-amber-400 animate-pulse font-medium">ছুটছেন</span>
                    )}
                    {player.status === 'crashed' && (
                      <span className="text-[10px] text-rose-400 font-medium">ক্র্যাশড ❌</span>
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
                  { name: 'টেক্সাস_কিং_৯৯', bet: 2500, mult: 74.2, win: 185500 },
                  { name: 'সাকিব_কাউবয়', bet: 1200, mult: 48.0, win: 57600 },
                  { name: 'ঢাকা_মুস্তাং', bet: 800, mult: 32.5, win: 26000 },
                  { name: 'আরিফ_ওয়েস্টার্ন', bet: 1500, mult: 19.5, win: 29250 },
                ].map((top, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-gradient-to-r from-orange-950/30 to-slate-950 border border-orange-500/20 rounded-xl px-2.5 py-1.5 text-xs"
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
          <div className="bg-[#190a03] border border-orange-500/40 rounded-3xl max-w-md w-full p-6 shadow-2xl">
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

      {/* 6. Game Rules Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#190a03] border border-orange-500/40 rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4 border-b border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">কাউবয় ক্র্যাশ কিভাবে খেলবেন?</h3>
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
                ১. <strong>বেট ধরুন:</strong> কাউন্টডাউন শেষ হওয়ার পূর্বেই আপনার কাঙ্খিত বেট পরিমাণ নির্ধারণ করুন। আপনি কনসোল ১ এবং কনসোল ২ ব্যবহার করে একসাথে দুটি বেট ধরতে পারবেন।
              </p>
              <p>
                ২. <strong>কাউবয় গ্যালপ:</strong> রাউন্ড শুরু হলে কাউবয় মুস্তাং ঘোড়া নিয়ে ক্যানিয়নের মধ্য দিয়ে ছুটবে এবং মাল্টিপ্লায়ার ১.০০x থেকে বৃদ্ধি পেতে থাকবে।
              </p>
              <p>
                ৩. <strong>ক্যাশ আউট:</strong> ঘোড়া থেমে যাওয়ার বা ক্র্যাশ (Outlaw Ambush) হওয়ার পূর্বেই &quot;ক্যাশ আউট&quot; বাটনে ক্লিক করে আপনার মুনাফা তুলে নিন!
              </p>
              <p>
                ৪. <strong>অটো ক্যাশ আউট:</strong> নির্দিষ্ট মাল্টিপ্লায়ার (যেমন ২.০০x) সেট করে রাখলে সেই লক্ষ্যে পৌঁছানোর সাথে সাথে স্বয়ংক্রিয়ভাবে মুনাফা যোগ হয়ে যাবে।
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
