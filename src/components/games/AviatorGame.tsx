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
  ChevronDown,
  ChevronUp,
  Zap,
  Award,
  Flame,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { sound } from '../../utils/audio';

interface AviatorGameProps {
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
  status: 'playing' | 'cashed_out' | 'crashed';
}

// User requested exact crash points pool
export const USER_CRASH_TARGETS: number[] = [
  1.20, 1.06, 2.00, 1.08, 1.34, 2.56, 3.12, 1.00, 1.06, 2.00, 1.09, 1.02,
];

// Initial seeded past rounds reflecting real multiplier spectrum
const PAST_ROUNDS_INITIAL = [
  1.08, 2.00, 1.34, 1.06, 2.56, 1.20, 3.12, 1.02, 1.06, 1.09, 2.00, 1.00,
];

// Pre-set bet quick chip values
const PRESET_CHIPS_BET1 = [50, 100, 200, 500];
const PRESET_CHIPS_BET2 = [100, 200, 500, 1000];

// Simulated player names with Bangladeshi authentic avatars
const SIMULATED_NAMES = [
  { name: 'তানভীর_ঢাকা', avatar: 'T' },
  { name: 'রাকিব_চিটাগাং', avatar: 'R' },
  { name: 'সাকিব_৭৫', avatar: 'S' },
  { name: 'বাবু_ভিআইপি', avatar: 'B' },
  { name: 'রিয়া_সিলেট', avatar: 'R' },
  { name: 'মেহেদী_২২', avatar: 'M' },
  { name: 'আরিফ_খুলনা', avatar: 'A' },
  { name: 'সুমন_বগুড়া', avatar: 'S' },
  { name: 'ফারহান_বরিশাল', avatar: 'F' },
  { name: 'রাজ_রাজশাহী', avatar: 'R' },
];

export const AviatorGame: React.FC<AviatorGameProps> = ({
  balance,
  onUpdateBalance,
  onClose,
  onOpenDeposit,
}) => {
  // Game lifecycle: COUNTDOWN -> FLYING -> CRASHED
  const [gameState, setGameState] = useState<'COUNTDOWN' | 'FLYING' | 'CRASHED'>('COUNTDOWN');
  const [countdown, setCountdown] = useState<number>(4);
  const [currentMultiplier, setCurrentMultiplier] = useState<number>(1.0);
  const [crashPoint, setCrashPoint] = useState<number>(1.34);
  const [pastRounds, setPastRounds] = useState<number[]>(PAST_ROUNDS_INITIAL);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Stats / History drawer toggle
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [activeSidebarTab, setActiveSidebarTab] = useState<'all' | 'my' | 'top'>('all');

  // Bet Panels 1 & 2 (Spribe Dual Cockpit)
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
    amount: 50,
    hasBet: false,
    hasCashedOut: false,
    cashedOutMultiplier: 0,
    autoCashout: true,
    autoCashoutAt: 1.5,
    isAutoBet: false,
  });

  // Tab switch within bet panel: 'bet' or 'auto'
  const [bet1Tab, setBet1Tab] = useState<'bet' | 'auto'>('bet');
  const [bet2Tab, setBet2Tab] = useState<'bet' | 'auto'>('bet');

  // Live Multiplayer Player Feed
  const [livePlayers, setLivePlayers] = useState<SimulatedPlayer[]>(() =>
    SIMULATED_NAMES.slice(0, 8).map((p, idx) => ({
      id: idx.toString(),
      name: p.name,
      avatar: p.avatar,
      bet: [100, 200, 250, 500, 1000, 1500, 300][idx % 7],
      status: 'playing',
    }))
  );

  // My Round Bet History
  const [myBetsHistory, setMyBetsHistory] = useState<
    Array<{ id: string; time: string; bet: number; mult: number; win: number; status: 'win' | 'lost' }>
  >([
    { id: '1', time: '15:20', bet: 100, mult: 1.34, win: 134, status: 'win' },
    { id: '2', time: '15:22', bet: 200, mult: 2.00, win: 400, status: 'win' },
    { id: '3', time: '15:25', bet: 150, mult: 1.06, win: 0, status: 'lost' },
  ]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  // Particle smoke trail behind plane
  const particlesRef = useRef<
    Array<{ x: number; y: number; size: number; alpha: number; vx: number; vy: number }>
  >([]);

  // Function to pick a crash point strictly randomly from USER_CRASH_TARGETS
  const generateCrashPoint = useCallback((): number => {
    const randomIndex = Math.floor(Math.random() * USER_CRASH_TARGETS.length);
    return USER_CRASH_TARGETS[randomIndex];
  }, []);

  // Handle Cashout for Bet 1
  const handleCashoutBet1 = useCallback(() => {
    if (!bet1.hasBet || bet1.hasCashedOut || gameState !== 'FLYING') return;
    const winAmount = Math.floor(bet1.amount * currentMultiplier);
    setBet1(prev => ({
      ...prev,
      hasCashedOut: true,
      cashedOutMultiplier: currentMultiplier,
    }));
    onUpdateBalance(winAmount, `এভিয়েটর ক্যাশআউট (+${currentMultiplier.toFixed(2)}x)`);
    if (soundEnabled) sound.playWinChime();

    // Log to My Bets
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

  // Handle Cashout for Bet 2
  const handleCashoutBet2 = useCallback(() => {
    if (!bet2.hasBet || bet2.hasCashedOut || gameState !== 'FLYING') return;
    const winAmount = Math.floor(bet2.amount * currentMultiplier);
    setBet2(prev => ({
      ...prev,
      hasCashedOut: true,
      cashedOutMultiplier: currentMultiplier,
    }));
    onUpdateBalance(winAmount, `এভিয়েটর ক্যাশআউট (+${currentMultiplier.toFixed(2)}x)`);
    if (soundEnabled) sound.playWinChime();

    // Log to My Bets
    setMyBetsHistory(prev => [
      {
        id: Date.now().toString(),
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
    if (gameState === 'FLYING') {
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

  // Place or Cancel Bet 1
  const toggleBet1 = () => {
    if (gameState === 'FLYING') return;
    if (!bet1.hasBet) {
      if (balance < bet1.amount) {
        if (onOpenDeposit) onOpenDeposit();
        return;
      }
      onUpdateBalance(-bet1.amount, 'এভিয়েটর বেট ১');
      setBet1(prev => ({ ...prev, hasBet: true, hasCashedOut: false }));
      if (soundEnabled) sound.playClick();
    } else {
      onUpdateBalance(bet1.amount, 'এভিয়েটর বেট ১ বাতিল');
      setBet1(prev => ({ ...prev, hasBet: false }));
      if (soundEnabled) sound.playClick();
    }
  };

  // Place or Cancel Bet 2
  const toggleBet2 = () => {
    if (gameState === 'FLYING') return;
    if (!bet2.hasBet) {
      if (balance < bet2.amount) {
        if (onOpenDeposit) onOpenDeposit();
        return;
      }
      onUpdateBalance(-bet2.amount, 'এভিয়েটর বেট ২');
      setBet2(prev => ({ ...prev, hasBet: true, hasCashedOut: false }));
      if (soundEnabled) sound.playClick();
    } else {
      onUpdateBalance(bet2.amount, 'এভিয়েটর বেট ২ বাতিল');
      setBet2(prev => ({ ...prev, hasBet: false }));
      if (soundEnabled) sound.playClick();
    }
  };

  // Main Game Loop Engine
  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (gameState === 'COUNTDOWN') {
      if (countdown > 0) {
        timer = setTimeout(() => {
          setCountdown(c => c - 1);
        }, 1000);
      } else {
        // Start flight! Pick target strictly from user crash target array
        const point = generateCrashPoint();
        setCrashPoint(point);
        setCurrentMultiplier(1.0);
        setGameState('FLYING');
        startTimeRef.current = performance.now();
        particlesRef.current = [];

        // Reset other simulated players
        setLivePlayers(prev =>
          prev.map((p, idx) => ({
            ...p,
            bet: [100, 250, 300, 500, 1000, 200, 1500, 800][idx % 8],
            status: 'playing',
            multiplier: undefined,
          }))
        );
      }
    } else if (gameState === 'FLYING') {
      // Instant crash handling if crash point is 1.00
      if (crashPoint <= 1.00) {
        setGameState('CRASHED');
        setCurrentMultiplier(1.00);
        if (soundEnabled) sound.playCrash();
        setPastRounds(prev => [1.00, ...prev.slice(0, 17)]);

        // Log losses
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
          setBet1(prev => ({
            ...prev,
            hasBet: prev.isAutoBet,
            hasCashedOut: false,
          }));
          setBet2(prev => ({
            ...prev,
            hasBet: prev.isAutoBet,
            hasCashedOut: false,
          }));
          setCountdown(4);
          setGameState('COUNTDOWN');
        }, 3000);
        return;
      }

      // Smooth flight duration calculation: climbs progressively
      // e.g. from 1.00 to 1.06 takes ~800ms, to 2.00 takes ~3500ms, to 3.12 takes ~5200ms
      const duration = Math.max(800, (crashPoint - 1.0) * 2800);

      const updateFrame = (now: number) => {
        const elapsed = now - startTimeRef.current;
        const progress = Math.min(elapsed / duration, 1);

        // Exponential flight multiplier curve
        const mult = +(1.0 + Math.pow(progress, 1.45) * (crashPoint - 1.0)).toFixed(2);
        setCurrentMultiplier(mult);

        // Simulate random player cashouts along the way
        if (Math.random() < 0.05) {
          setLivePlayers(players =>
            players.map(p => {
              if (p.status === 'playing' && Math.random() < 0.25) {
                return { ...p, status: 'cashed_out', multiplier: mult };
              }
              return p;
            })
          );
        }

        if (progress >= 1 || mult >= crashPoint) {
          // Crash explosion!
          setGameState('CRASHED');
          setCurrentMultiplier(crashPoint);
          if (soundEnabled) sound.playCrash();
          setPastRounds(prev => [crashPoint, ...prev.slice(0, 17)]);

          // Mark active non-cashed out players as crashed
          setLivePlayers(players =>
            players.map(p => (p.status === 'playing' ? { ...p, status: 'crashed' } : p))
          );

          // Record lost bets
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

          // Restart after 3.2 seconds
          setTimeout(() => {
            setBet1(prev => ({
              ...prev,
              hasBet: prev.isAutoBet,
              hasCashedOut: false,
            }));
            setBet2(prev => ({
              ...prev,
              hasBet: prev.isAutoBet,
              hasCashedOut: false,
            }));
            setCountdown(4);
            setGameState('COUNTDOWN');
          }, 3200);
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
  }, [gameState, countdown, crashPoint, generateCrashPoint, soundEnabled, bet1.hasBet, bet1.hasCashedOut, bet1.amount, bet2.hasBet, bet2.hasCashedOut, bet2.amount]);

  // Professional Flight Canvas Renderer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = canvas.parentElement?.clientWidth || 700);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 360);

    const handleResize = () => {
      if (!canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener('resize', handleResize);

    ctx.clearRect(0, 0, width, height);

    // Deep cockpit grid background
    ctx.fillStyle = '#0a0d18';
    ctx.fillRect(0, 0, width, height);

    // Subtle radial cockpit radar glow
    const radialBg = ctx.createRadialGradient(
      width * 0.45,
      height * 0.55,
      10,
      width * 0.5,
      height * 0.5,
      Math.max(width, height) * 0.8
    );
    radialBg.addColorStop(0, 'rgba(225, 29, 72, 0.05)');
    radialBg.addColorStop(1, 'rgba(10, 13, 24, 0.0)');
    ctx.fillStyle = radialBg;
    ctx.fillRect(0, 0, width, height);

    // Coordinate grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;

    // Vertical time lines
    for (let x = 60; x < width; x += 70) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height - 25);
      ctx.stroke();
    }
    // Horizontal altitude lines
    for (let y = height - 50; y > 20; y -= 55) {
      ctx.beginPath();
      ctx.moveTo(35, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Axes labels
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.font = '10px monospace';
    ctx.fillText('0s', 35, height - 8);
    ctx.fillText('2s', 140, height - 8);
    ctx.fillText('4s', 245, height - 8);
    ctx.fillText('6s', 350, height - 8);
    ctx.fillText('8s', 455, height - 8);

    ctx.fillText('1.0x', 8, height - 35);
    ctx.fillText('2.0x', 8, height - 90);
    ctx.fillText('3.0x', 8, height - 145);
    ctx.fillText('4.0x', 8, height - 200);

    const paddingLeft = 40;
    const paddingBottom = 30;
    const startX = paddingLeft;
    const startY = height - paddingBottom;
    const maxDistX = width - paddingLeft - 50;
    const maxDistY = height - paddingBottom - 40;

    if (gameState === 'FLYING' || gameState === 'CRASHED') {
      // Progress ratio (0 to 1)
      const ratio = Math.min(
        (currentMultiplier - 1.0) / Math.max(crashPoint - 1.0, 0.05),
        1
      );

      // Trajectory end point
      const curX = startX + ratio * maxDistX * 0.92;
      const curY = startY - Math.pow(ratio, 0.85) * maxDistY * 0.88;

      // Tangent angle calculation for plane pitch
      const prevX = curX - 5;
      const prevRatio = Math.max(0, ratio - 0.05);
      const prevY = startY - Math.pow(prevRatio, 0.85) * maxDistY * 0.88;
      const angle = Math.atan2(curY - prevY, curX - prevX);

      // 1. Draw glowing parabolic flight trajectory line
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.quadraticCurveTo(startX + (curX - startX) * 0.55, startY, curX, curY);

      const isCrashed = gameState === 'CRASHED';
      ctx.strokeStyle = isCrashed ? '#ef4444' : '#e11d48';
      ctx.lineWidth = 4;
      ctx.shadowColor = isCrashed ? 'rgba(239, 68, 68, 0.8)' : 'rgba(225, 29, 72, 0.8)';
      ctx.shadowBlur = 12;
      ctx.stroke();
      ctx.restore();

      // 2. Draw red gradient shadow fill under the curve (Spribe signature fill)
      ctx.save();
      const fillGradient = ctx.createLinearGradient(0, curY, 0, startY);
      fillGradient.addColorStop(
        0,
        isCrashed ? 'rgba(239, 68, 68, 0.28)' : 'rgba(225, 29, 72, 0.32)'
      );
      fillGradient.addColorStop(
        0.7,
        isCrashed ? 'rgba(239, 68, 68, 0.08)' : 'rgba(225, 29, 72, 0.10)'
      );
      fillGradient.addColorStop(1, 'rgba(225, 29, 72, 0.0)');

      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.quadraticCurveTo(startX + (curX - startX) * 0.55, startY, curX, curY);
      ctx.lineTo(curX, startY);
      ctx.lineTo(startX, startY);
      ctx.fillStyle = fillGradient;
      ctx.fill();
      ctx.restore();

      // 3. Smoke / Flame particles from engine
      if (gameState === 'FLYING') {
        if (Math.random() < 0.7) {
          particlesRef.current.push({
            x: curX - Math.cos(angle) * 22,
            y: curY - Math.sin(angle) * 22,
            size: Math.random() * 4 + 2,
            alpha: 0.8,
            vx: -Math.cos(angle) * (Math.random() * 2 + 1) + (Math.random() - 0.5),
            vy: -Math.sin(angle) * (Math.random() * 2 + 1) + (Math.random() - 0.5),
          });
        }
      }

      // Draw & update smoke particles
      particlesRef.current.forEach((p, idx) => {
        ctx.save();
        ctx.fillStyle = `rgba(244, 63, 94, ${p.alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.025;
        p.size *= 0.96;
      });
      particlesRef.current = particlesRef.current.filter(p => p.alpha > 0);

      // 4. Draw Spribe Red Propeller Aerobatic Plane
      if (gameState === 'FLYING') {
        ctx.save();
        ctx.translate(curX, curY);
        ctx.rotate(angle);

        // Plane Fuselage (Aerodynamic Red Body)
        ctx.fillStyle = '#e11d48';
        ctx.beginPath();
        ctx.moveTo(24, 0); // Nose cone
        ctx.quadraticCurveTo(12, -7, -18, -6); // Upper fuselage
        ctx.lineTo(-24, -2); // Tail base
        ctx.lineTo(-24, 2);
        ctx.lineTo(-18, 6); // Lower fuselage
        ctx.quadraticCurveTo(12, 7, 24, 0);
        ctx.closePath();
        ctx.fill();

        // White racing stripe along fuselage
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(14, -1);
        ctx.lineTo(-16, -1);
        ctx.lineTo(-16, 1);
        ctx.lineTo(14, 1);
        ctx.closePath();
        ctx.fill();

        // Cockpit canopy bubble (tinted cyan/white glass)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.beginPath();
        ctx.ellipse(4, -3, 6, 3, -0.15, 0, Math.PI * 2);
        ctx.fill();

        // Main Wings (Red with dark shadow)
        ctx.fillStyle = '#be123c';
        ctx.beginPath();
        ctx.moveTo(-2, -18); // Left wing tip
        ctx.lineTo(8, -2);
        ctx.lineTo(-8, -2);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(-2, 18); // Right wing tip
        ctx.lineTo(8, 2);
        ctx.lineTo(-8, 2);
        ctx.closePath();
        ctx.fill();

        // Wingtip Navigation Lights (Green right, Red left)
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.arc(-2, 18, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(-2, -18, 2, 0, Math.PI * 2);
        ctx.fill();

        // Tail vertical fin / rudder
        ctx.fillStyle = '#9f1239';
        ctx.beginPath();
        ctx.moveTo(-22, -2);
        ctx.lineTo(-30, -12);
        ctx.lineTo(-26, -2);
        ctx.closePath();
        ctx.fill();

        // Front Propeller Rotor Spinner (Nose)
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(24, 0, 3.5, 0, Math.PI * 2);
        ctx.fill();

        // Spinning Propeller Motion Blur Disc
        ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
        ctx.beginPath();
        ctx.ellipse(26, 0, 2, 14, 0, 0, Math.PI * 2);
        ctx.fill();

        // Jet engine fire exhaust behind plane
        const fireLen = 14 + Math.random() * 10;
        const fireGrad = ctx.createLinearGradient(-24, 0, -24 - fireLen, 0);
        fireGrad.addColorStop(0, '#fef08a');
        fireGrad.addColorStop(0.4, '#f97316');
        fireGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
        ctx.fillStyle = fireGrad;
        ctx.beginPath();
        ctx.moveTo(-24, -3);
        ctx.lineTo(-24 - fireLen, 0);
        ctx.lineTo(-24, 3);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
      }
    }

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [gameState, currentMultiplier, crashPoint]);

  // Multiplier pill color mapper
  const getPillStyle = (mult: number) => {
    if (mult >= 10.0) {
      return 'bg-[#480c42] text-[#ff4fe8] border-[#911f86] shadow-sm shadow-[#ff4fe8]/20';
    }
    if (mult >= 2.0) {
      return 'bg-[#20113c] text-[#b377ff] border-[#532b9b] shadow-sm shadow-[#b377ff]/20';
    }
    return 'bg-[#0c1e36] text-[#3cb5ff] border-[#1f4877]';
  };

  return (
    <div className="flex flex-col h-full bg-[#080b14] text-white select-none font-sans overflow-hidden">
      {/* 1. TOP SPRIBE AVIATOR HEADER BAR */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#0e1220] border-b border-gray-800/90 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-gray-300 bg-slate-800/90 hover:bg-slate-700 hover:text-white rounded-lg transition-colors border border-gray-700 active:scale-95"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="font-semibold hidden sm:inline">লবিতে ফিরুন</span>
          </button>

          {/* Official Aviator Branding */}
          <div className="flex items-center gap-1.5">
            <span className="font-black text-base sm:text-lg tracking-wider text-rose-500 font-sans italic drop-shadow-[0_0_10px_rgba(244,63,94,0.5)]">
              Aviator
            </span>
            <span className="text-[9px] font-bold text-gray-400 bg-gray-800 px-1.5 py-0.5 rounded border border-gray-700">
              SPRIBE
            </span>
            <span className="hidden md:inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.5 rounded-full ml-1">
              <ShieldCheck className="w-3 h-3" />
              <span>Provably Fair</span>
            </span>
          </div>
        </div>

        {/* Live Multiplayer Counter & History Trigger */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden lg:flex items-center gap-1.5 text-xs text-gray-400 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-gray-800">
            <Users className="w-3.5 h-3.5 text-rose-400" />
            <span className="font-mono text-gray-200 font-bold">৮,৪২০</span>
            <span>অনলাইন</span>
          </div>

          {/* Balance display */}
          <div className="flex items-center gap-2 bg-emerald-950/50 border border-emerald-500/40 px-2.5 py-1 rounded-xl shadow-sm">
            <div className="text-right leading-tight">
              <span className="text-[9px] text-gray-400 uppercase tracking-wider block">ব্যালেন্স</span>
              <span className="text-xs sm:text-sm font-black text-emerald-400 font-mono tabular-nums">
                ৳ {balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            {onOpenDeposit && (
              <button
                onClick={() => {
                  sound.playClick();
                  onOpenDeposit();
                }}
                className="px-2 py-1 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-[11px] rounded-lg shadow active:scale-95 transition-all"
                title="ডিপোজিট করুন"
              >
                + ডিপোজিট
              </button>
            )}
          </div>

          {/* Sound Toggle */}
          <button
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              sound.enabled = !soundEnabled;
            }}
            className="p-1.5 text-gray-400 hover:text-white bg-slate-800 rounded-lg border border-gray-700 transition-colors"
            title="সাউন্ড নিয়ন্ত্রণ"
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-gray-500" />
            )}
          </button>
        </div>
      </div>

      {/* 2. SPRIBE COLOR MULTIPLIER HISTORY BAR */}
      <div className="px-3 py-1.5 bg-[#0a0d18] border-b border-gray-800/80 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar shrink-0">
        <div className="flex items-center gap-1.5 shrink-0">
          <History className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-[11px] font-bold text-gray-400 hidden sm:inline">পূর্ববর্তী রাউন্ড:</span>
        </div>

        {/* Multiplier Pills with authentic Spribe colors */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-1 px-1">
          {pastRounds.map((mult, idx) => (
            <span
              key={idx}
              className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full border tabular-nums transition-transform hover:scale-105 shrink-0 ${getPillStyle(
                mult
              )}`}
            >
              {mult.toFixed(2)}x
            </span>
          ))}
        </div>

        {/* History detail modal button */}
        <button
          onClick={() => {
            sound.playClick();
            setShowHistoryModal(!showHistoryModal);
          }}
          className="text-[11px] text-gray-400 hover:text-amber-400 flex items-center gap-1 bg-slate-900/80 px-2 py-0.5 rounded border border-gray-800 shrink-0 font-medium transition-colors"
        >
          <span>বিস্তারিত</span>
          {showHistoryModal ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {/* Optional Detailed History Dropdown */}
      {showHistoryModal && (
        <div className="bg-[#0f1424] border-b border-amber-500/30 p-3 text-xs animate-fade-in shrink-0">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-4 text-gray-300">
              <span className="font-bold text-white flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                ক্র্যাশ প্যাটার্ন হিস্ট্রি:
              </span>
              <span className="text-gray-400">
                লক্ষ্য রেঞ্জ:{' '}
                <strong className="text-amber-400 font-mono">
                  {USER_CRASH_TARGETS.join(', ')}
                </strong>
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-gray-400 font-mono">
              <span className="px-1.5 py-0.5 rounded bg-[#0c1e36] text-[#3cb5ff]">&lt; ২.০০x নীল</span>
              <span className="px-1.5 py-0.5 rounded bg-[#20113c] text-[#b377ff]">২-১০x বেগুনি</span>
              <span className="px-1.5 py-0.5 rounded bg-[#480c42] text-[#ff4fe8]">১০x+ ম্যাজেন্টা</span>
            </div>
          </div>
        </div>
      )}

      {/* 3. MAIN COCKPIT & ARENA */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
        {/* Left Side: Live Multiplayer Feed & Tabs */}
        <div className="hidden lg:flex flex-col w-64 bg-[#0a0e1c] border-r border-gray-800/80 shrink-0">
          {/* Feed Tabs: All Bets / My Bets / Top */}
          <div className="grid grid-cols-3 p-1.5 bg-slate-900/80 border-b border-gray-800 gap-1 text-[11px] font-bold">
            <button
              onClick={() => setActiveSidebarTab('all')}
              className={`py-1 rounded-lg transition-all ${
                activeSidebarTab === 'all'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              সকল বাজি
            </button>
            <button
              onClick={() => setActiveSidebarTab('my')}
              className={`py-1 rounded-lg transition-all ${
                activeSidebarTab === 'my'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              আমার বাজি
            </button>
            <button
              onClick={() => setActiveSidebarTab('top')}
              className={`py-1 rounded-lg transition-all ${
                activeSidebarTab === 'top'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              টপ উইন
            </button>
          </div>

          {/* Tab 1: All Bets List */}
          {activeSidebarTab === 'all' && (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="px-3 py-1.5 flex items-center justify-between text-[10px] text-gray-500 font-semibold border-b border-gray-800/50">
                <span>খেলোয়াড়</span>
                <span>বাজি / ক্যাশআউট</span>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1.5 no-scrollbar">
                {livePlayers.map(p => (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between p-1.5 rounded-lg border text-xs transition-colors ${
                      p.status === 'cashed_out'
                        ? 'bg-emerald-950/30 border-emerald-500/30'
                        : p.status === 'crashed'
                        ? 'bg-rose-950/20 border-rose-500/20 opacity-60'
                        : 'bg-slate-900/50 border-gray-800'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-rose-600 to-rose-400 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                        {p.avatar}
                      </div>
                      <span className="truncate text-gray-300 text-[11px] font-medium">{p.name}</span>
                    </div>

                    <div className="text-right">
                      <div className="font-mono text-gray-300 font-bold text-[11px] tabular-nums">
                        ৳{p.bet}
                      </div>
                      {p.status === 'cashed_out' && (
                        <div className="text-[10px] font-black text-emerald-400 font-mono">
                          {p.multiplier?.toFixed(2)}x (+৳{Math.floor(p.bet * (p.multiplier || 1))})
                        </div>
                      )}
                      {p.status === 'crashed' && (
                        <div className="text-[9px] text-rose-500 font-semibold">ক্র্যাশড</div>
                      )}
                      {p.status === 'playing' && (
                        <div className="text-[9px] text-amber-400 font-semibold animate-pulse">ফ্লাইং...</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 2: My Bets History */}
          {activeSidebarTab === 'my' && (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="px-3 py-1.5 flex items-center justify-between text-[10px] text-gray-500 font-semibold border-b border-gray-800/50">
                <span>সময় / বাজি</span>
                <span>ফলাফল</span>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1.5 no-scrollbar">
                {myBetsHistory.length === 0 ? (
                  <div className="text-center py-8 text-xs text-gray-500">এখনও কোনো বাজি ধরা হয়নি</div>
                ) : (
                  myBetsHistory.map(b => (
                    <div
                      key={b.id}
                      className="p-2 rounded-lg bg-slate-900/60 border border-gray-800 text-xs flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-gray-200">৳{b.bet}</div>
                        <div className="text-[10px] text-gray-500 font-mono">{b.time}</div>
                      </div>
                      <div className="text-right font-mono">
                        <div
                          className={`font-black ${
                            b.status === 'win' ? 'text-emerald-400' : 'text-rose-500'
                          }`}
                        >
                          {b.status === 'win' ? `+৳${b.win}` : `-৳${b.bet}`}
                        </div>
                        <div className="text-[10px] text-gray-400">{b.mult.toFixed(2)}x</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Tab 3: Top Winners */}
          {activeSidebarTab === 'top' && (
            <div className="flex-1 overflow-y-auto p-2 space-y-2 no-scrollbar">
              {[
                { name: 'বাবু_কিং', mult: '3.12x', bet: 5000, win: 15600 },
                { name: 'সাকিব_৭৫', mult: '2.56x', bet: 2500, win: 6400 },
                { name: 'তানভীর_ঢাকা', mult: '2.00x', bet: 4000, win: 8000 },
                { name: 'রিয়া_সিলেট', mult: '2.00x', bet: 1500, win: 3000 },
              ].map((top, idx) => (
                <div
                  key={idx}
                  className="p-2 rounded-xl bg-gradient-to-r from-amber-950/30 to-slate-900 border border-amber-500/30 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <div>
                      <div className="font-bold text-amber-300">{top.name}</div>
                      <div className="text-[10px] text-gray-400 font-mono">বাজি: ৳{top.bet}</div>
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <div className="text-emerald-400 font-black">৳{top.win.toLocaleString()}</div>
                    <div className="text-[10px] text-amber-400">{top.mult}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Center: Flight Canvas + Floating Multiplier + Dual Controls */}
        <div className="flex-1 flex flex-col p-2 sm:p-3 overflow-hidden">
          {/* Flight Canvas Arena */}
          <div className="relative flex-1 bg-[#070a14] rounded-2xl border border-gray-800/90 overflow-hidden flex items-center justify-center min-h-[220px] shadow-2xl">
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

            {/* Countdown Overlay: Waiting for next flight */}
            {gameState === 'COUNTDOWN' && (
              <div className="z-20 text-center animate-fade-in p-4 bg-slate-950/70 backdrop-blur-sm rounded-2xl border border-rose-500/20 shadow-xl max-w-xs w-full">
                {/* Propeller animation */}
                <div className="w-12 h-12 mx-auto mb-2 relative flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full border-2 border-rose-500/40 border-t-rose-500 animate-spin" />
                  <Zap className="w-4 h-4 text-amber-400 absolute" />
                </div>

                <div className="text-xs font-bold text-gray-300 mb-1 tracking-wide">
                  পরবর্তী রাউন্ড শুরু হচ্ছে...
                </div>
                <div className="text-4xl sm:text-5xl font-black text-amber-400 font-mono tracking-tight tabular-nums drop-shadow-[0_0_15px_rgba(251,191,36,0.4)]">
                  {countdown} সেকেন্ড
                </div>

                {/* Linear progress bar */}
                <div className="mt-3 w-full h-2 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
                  <div
                    className="h-full bg-gradient-to-r from-rose-600 via-amber-500 to-rose-500 transition-all duration-1000 ease-linear shadow-sm"
                    style={{ width: `${(countdown / 4) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* In-Flight Multiplier Display */}
            {gameState === 'FLYING' && (
              <div className="z-10 text-center pointer-events-none select-none">
                <div className="text-6xl sm:text-8xl font-black font-mono tracking-tight text-white drop-shadow-[0_0_25px_rgba(244,63,94,0.6)] transform scale-100 transition-transform">
                  {currentMultiplier.toFixed(2)}
                  <span className="text-4xl sm:text-6xl text-rose-500 ml-1">x</span>
                </div>
                <div className="text-[11px] font-bold text-gray-300 mt-1 uppercase tracking-widest flex items-center justify-center gap-1.5 drop-shadow">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                  <span>প্লেন আকাশে উড়ছে</span>
                </div>
              </div>
            )}

            {/* Crashed Banner (FLEW AWAY) */}
            {gameState === 'CRASHED' && (
              <div className="z-20 text-center animate-bounce select-none p-4 bg-black/60 backdrop-blur-md rounded-2xl border border-red-500/50 shadow-2xl">
                <div className="text-xs sm:text-sm font-black text-rose-400 uppercase tracking-widest mb-1 flex items-center justify-center gap-1.5">
                  <Flame className="w-4 h-4 text-rose-500" />
                  <span>প্লেন উড়ে গেছে! (FLEW AWAY)</span>
                </div>
                <div className="text-6xl sm:text-7xl font-black text-rose-500 font-mono drop-shadow-[0_0_20px_rgba(239,68,68,0.8)]">
                  {crashPoint.toFixed(2)}x
                </div>
              </div>
            )}
          </div>

          {/* 4. DUAL BETTING COCKPIT (PANEL 1 & PANEL 2) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3 mt-2 shrink-0">
            {/* COCKPIT PANEL 1 */}
            <div className="bg-[#0f1424] p-3 rounded-2xl border border-gray-800 shadow-md flex flex-col justify-between">
              {/* Header: Bet / Auto Tab Switcher + Auto Cashout Config */}
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-800 text-xs">
                <div className="flex items-center bg-slate-900 rounded-lg p-0.5 border border-gray-700">
                  <button
                    onClick={() => setBet1Tab('bet')}
                    className={`px-3 py-1 rounded font-bold text-xs transition-all ${
                      bet1Tab === 'bet'
                        ? 'bg-rose-600 text-white shadow'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    বেট ১
                  </button>
                  <button
                    onClick={() => setBet1Tab('auto')}
                    className={`px-3 py-1 rounded font-bold text-xs transition-all ${
                      bet1Tab === 'auto'
                        ? 'bg-rose-600 text-white shadow'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    অটো
                  </button>
                </div>

                {/* Auto Cashout Stepper */}
                <label className="flex items-center gap-1.5 text-xs text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bet1.autoCashout}
                    onChange={e => setBet1({ ...bet1, autoCashout: e.target.checked })}
                    className="rounded bg-gray-800 text-rose-500 focus:ring-0 w-3.5 h-3.5"
                  />
                  <span>অটো ক্যাশ:</span>
                  <div className="flex items-center bg-slate-900 rounded-lg border border-gray-700 px-1 py-0.5">
                    <input
                      type="number"
                      step="0.05"
                      min="1.05"
                      max="100"
                      value={bet1.autoCashoutAt}
                      onChange={e =>
                        setBet1({ ...bet1, autoCashoutAt: parseFloat(e.target.value) || 1.1 })
                      }
                      className="w-12 bg-transparent text-center text-amber-400 font-mono font-bold text-xs focus:outline-none"
                    />
                    <span className="text-[10px] text-gray-400">x</span>
                  </div>
                </label>
              </div>

              {/* Amount Controls + Big Action Button */}
              <div className="grid grid-cols-12 gap-2 items-center">
                {/* Left: Amount stepper & chips */}
                <div className="col-span-7 flex flex-col gap-1.5">
                  <div className="flex items-center bg-slate-950 rounded-xl border border-gray-700 px-2 py-1.5 shadow-inner">
                    <button
                      onClick={() => setBet1(p => ({ ...p, amount: Math.max(10, p.amount - 50) }))}
                      disabled={gameState === 'FLYING'}
                      className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center text-base active:scale-95 transition-all disabled:opacity-40"
                    >
                      -
                    </button>
                    <div className="flex-1 text-center font-mono font-black text-sm sm:text-base text-white">
                      <span className="text-gray-400 text-xs mr-1">৳</span>
                      <input
                        type="number"
                        value={bet1.amount}
                        onChange={e =>
                          setBet1(p => ({
                            ...p,
                            amount: Math.max(10, parseInt(e.target.value) || 10),
                          }))
                        }
                        disabled={gameState === 'FLYING'}
                        className="w-16 bg-transparent text-center font-mono font-bold text-white focus:outline-none"
                      />
                    </div>
                    <button
                      onClick={() => setBet1(p => ({ ...p, amount: p.amount + 50 }))}
                      disabled={gameState === 'FLYING'}
                      className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center text-base active:scale-95 transition-all disabled:opacity-40"
                    >
                      +
                    </button>
                  </div>

                  {/* Preset Quick Chips */}
                  <div className="grid grid-cols-4 gap-1">
                    {PRESET_CHIPS_BET1.map(val => (
                      <button
                        key={val}
                        onClick={() => {
                          sound.playClick();
                          setBet1(p => ({ ...p, amount: val }));
                        }}
                        disabled={gameState === 'FLYING'}
                        className={`text-[10px] font-mono py-1 rounded-lg border transition-all ${
                          bet1.amount === val
                            ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold'
                            : 'bg-slate-900 border-gray-800 text-gray-400 hover:border-gray-700 hover:text-white'
                        }`}
                      >
                        +{val}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Right: Big Primary Action Button */}
                <div className="col-span-5 h-full flex min-h-[64px]">
                  {gameState === 'FLYING' && bet1.hasBet && !bet1.hasCashedOut ? (
                    /* CASH OUT BUTTON: Glowing Orange/Green */
                    <button
                      onClick={handleCashoutBet1}
                      className="w-full h-full rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black flex flex-col items-center justify-center p-1 shadow-lg shadow-amber-500/30 active:scale-95 transition-all cursor-pointer animate-pulse"
                    >
                      <span className="text-[11px] uppercase tracking-wider">ক্যাশআউট</span>
                      <span className="text-base font-mono tabular-nums leading-none my-0.5">
                        ৳{Math.floor(bet1.amount * currentMultiplier)}
                      </span>
                      <span className="text-[10px] font-mono opacity-90">
                        ({currentMultiplier.toFixed(2)}x)
                      </span>
                    </button>
                  ) : bet1.hasCashedOut ? (
                    /* CASHED OUT SUCCESS */
                    <div className="w-full h-full rounded-xl bg-emerald-950/80 border border-emerald-500/60 flex flex-col items-center justify-center text-emerald-300 p-1 text-center shadow">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                        ক্যাশআউট সফল!
                      </span>
                      <span className="text-sm font-mono font-black text-white">
                        ৳{Math.floor(bet1.amount * bet1.cashedOutMultiplier)}
                      </span>
                      <span className="text-[9px] text-emerald-400 font-mono">
                        +{bet1.cashedOutMultiplier.toFixed(2)}x
                      </span>
                    </div>
                  ) : (
                    /* BET / CANCEL BUTTON */
                    <button
                      onClick={toggleBet1}
                      disabled={gameState === 'FLYING'}
                      className={`w-full h-full rounded-xl font-black flex flex-col items-center justify-center p-1.5 transition-all shadow-lg ${
                        bet1.hasBet
                          ? 'bg-rose-700 hover:bg-rose-600 text-white border border-rose-500/50 shadow-rose-900/40'
                          : 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-emerald-900/40'
                      } ${gameState === 'FLYING' ? 'opacity-40 cursor-not-allowed' : 'active:scale-95 cursor-pointer'}`}
                    >
                      <span className="text-xs uppercase tracking-wide">
                        {bet1.hasBet ? 'বাতিল করুন' : 'বেট ধরুন'}
                      </span>
                      <span className="text-sm font-mono tabular-nums mt-0.5">
                        ৳ {bet1.amount}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* COCKPIT PANEL 2 */}
            <div className="bg-[#0f1424] p-3 rounded-2xl border border-gray-800 shadow-md flex flex-col justify-between">
              {/* Header: Bet / Auto Tab Switcher + Auto Cashout Config */}
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-800 text-xs">
                <div className="flex items-center bg-slate-900 rounded-lg p-0.5 border border-gray-700">
                  <button
                    onClick={() => setBet2Tab('bet')}
                    className={`px-3 py-1 rounded font-bold text-xs transition-all ${
                      bet2Tab === 'bet'
                        ? 'bg-rose-600 text-white shadow'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    বেট ২
                  </button>
                  <button
                    onClick={() => setBet2Tab('auto')}
                    className={`px-3 py-1 rounded font-bold text-xs transition-all ${
                      bet2Tab === 'auto'
                        ? 'bg-rose-600 text-white shadow'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    অটো
                  </button>
                </div>

                {/* Auto Cashout Stepper */}
                <label className="flex items-center gap-1.5 text-xs text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bet2.autoCashout}
                    onChange={e => setBet2({ ...bet2, autoCashout: e.target.checked })}
                    className="rounded bg-gray-800 text-rose-500 focus:ring-0 w-3.5 h-3.5"
                  />
                  <span>অটো ক্যাশ:</span>
                  <div className="flex items-center bg-slate-900 rounded-lg border border-gray-700 px-1 py-0.5">
                    <input
                      type="number"
                      step="0.05"
                      min="1.05"
                      max="100"
                      value={bet2.autoCashoutAt}
                      onChange={e =>
                        setBet2({ ...bet2, autoCashoutAt: parseFloat(e.target.value) || 1.1 })
                      }
                      className="w-12 bg-transparent text-center text-amber-400 font-mono font-bold text-xs focus:outline-none"
                    />
                    <span className="text-[10px] text-gray-400">x</span>
                  </div>
                </label>
              </div>

              {/* Amount Controls + Big Action Button */}
              <div className="grid grid-cols-12 gap-2 items-center">
                {/* Left: Amount stepper & chips */}
                <div className="col-span-7 flex flex-col gap-1.5">
                  <div className="flex items-center bg-slate-950 rounded-xl border border-gray-700 px-2 py-1.5 shadow-inner">
                    <button
                      onClick={() => setBet2(p => ({ ...p, amount: Math.max(10, p.amount - 50) }))}
                      disabled={gameState === 'FLYING'}
                      className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center text-base active:scale-95 transition-all disabled:opacity-40"
                    >
                      -
                    </button>
                    <div className="flex-1 text-center font-mono font-black text-sm sm:text-base text-white">
                      <span className="text-gray-400 text-xs mr-1">৳</span>
                      <input
                        type="number"
                        value={bet2.amount}
                        onChange={e =>
                          setBet2(p => ({
                            ...p,
                            amount: Math.max(10, parseInt(e.target.value) || 10),
                          }))
                        }
                        disabled={gameState === 'FLYING'}
                        className="w-16 bg-transparent text-center font-mono font-bold text-white focus:outline-none"
                      />
                    </div>
                    <button
                      onClick={() => setBet2(p => ({ ...p, amount: p.amount + 50 }))}
                      disabled={gameState === 'FLYING'}
                      className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center text-base active:scale-95 transition-all disabled:opacity-40"
                    >
                      +
                    </button>
                  </div>

                  {/* Preset Quick Chips */}
                  <div className="grid grid-cols-4 gap-1">
                    {PRESET_CHIPS_BET2.map(val => (
                      <button
                        key={val}
                        onClick={() => {
                          sound.playClick();
                          setBet2(p => ({ ...p, amount: val }));
                        }}
                        disabled={gameState === 'FLYING'}
                        className={`text-[10px] font-mono py-1 rounded-lg border transition-all ${
                          bet2.amount === val
                            ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold'
                            : 'bg-slate-900 border-gray-800 text-gray-400 hover:border-gray-700 hover:text-white'
                        }`}
                      >
                        +{val}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Right: Big Primary Action Button */}
                <div className="col-span-5 h-full flex min-h-[64px]">
                  {gameState === 'FLYING' && bet2.hasBet && !bet2.hasCashedOut ? (
                    /* CASH OUT BUTTON: Glowing Orange/Green */
                    <button
                      onClick={handleCashoutBet2}
                      className="w-full h-full rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black flex flex-col items-center justify-center p-1 shadow-lg shadow-amber-500/30 active:scale-95 transition-all cursor-pointer animate-pulse"
                    >
                      <span className="text-[11px] uppercase tracking-wider">ক্যাশআউট</span>
                      <span className="text-base font-mono tabular-nums leading-none my-0.5">
                        ৳{Math.floor(bet2.amount * currentMultiplier)}
                      </span>
                      <span className="text-[10px] font-mono opacity-90">
                        ({currentMultiplier.toFixed(2)}x)
                      </span>
                    </button>
                  ) : bet2.hasCashedOut ? (
                    /* CASHED OUT SUCCESS */
                    <div className="w-full h-full rounded-xl bg-emerald-950/80 border border-emerald-500/60 flex flex-col items-center justify-center text-emerald-300 p-1 text-center shadow">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                        ক্যাশআউট সফল!
                      </span>
                      <span className="text-sm font-mono font-black text-white">
                        ৳{Math.floor(bet2.amount * bet2.cashedOutMultiplier)}
                      </span>
                      <span className="text-[9px] text-emerald-400 font-mono">
                        +{bet2.cashedOutMultiplier.toFixed(2)}x
                      </span>
                    </div>
                  ) : (
                    /* BET / CANCEL BUTTON */
                    <button
                      onClick={toggleBet2}
                      disabled={gameState === 'FLYING'}
                      className={`w-full h-full rounded-xl font-black flex flex-col items-center justify-center p-1.5 transition-all shadow-lg ${
                        bet2.hasBet
                          ? 'bg-rose-700 hover:bg-rose-600 text-white border border-rose-500/50 shadow-rose-900/40'
                          : 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-emerald-900/40'
                      } ${gameState === 'FLYING' ? 'opacity-40 cursor-not-allowed' : 'active:scale-95 cursor-pointer'}`}
                    >
                      <span className="text-xs uppercase tracking-wide">
                        {bet2.hasBet ? 'বাতিল করুন' : 'বেট ধরুন'}
                      </span>
                      <span className="text-sm font-mono tabular-nums mt-0.5">
                        ৳ {bet2.amount}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
