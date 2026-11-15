import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Volume2,
  VolumeX,
  ArrowLeft,
  ShieldCheck,
  Target,
  Sparkles,
  HelpCircle,
  Award,
  Zap,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Crosshair,
  Lock,
  ChevronRight,
  TrendingUp,
  History,
} from 'lucide-react';
import { sound } from '../../utils/audio';

interface GunsmithGameProps {
  balance: number;
  onUpdateBalance: (amount: number, reason: string) => void;
  onClose: () => void;
  onOpenDeposit?: () => void;
}

interface WeaponConfig {
  id: string;
  nameBn: string;
  nameEn: string;
  type: string;
  caliber: string;
  firepower: number; // 1-100
  accuracy: number; // 1-100
  maxMultiplier: string;
  icon: string;
  color: string;
}

const WEAPONS: WeaponConfig[] = [
  {
    id: 'desert-eagle',
    nameBn: 'ডেজার্ট ইগল .৫০ গোল্ড',
    nameEn: 'Desert Eagle .50',
    type: 'পিস্তল',
    caliber: '.50 Action Express',
    firepower: 85,
    accuracy: 92,
    maxMultiplier: '500x',
    icon: '🔫',
    color: 'from-amber-500 to-yellow-600',
  },
  {
    id: 'ak-47',
    nameBn: 'AK-47 ট্যাকটিকাল ভালকান',
    nameEn: 'AK-47 Tactical',
    type: 'অ্যাসল্ট রাইফেল',
    caliber: '7.62x39mm',
    firepower: 90,
    accuracy: 88,
    maxMultiplier: '1,000x',
    icon: '⚡',
    color: 'from-rose-600 to-red-700',
  },
  {
    id: 'm4a1',
    nameBn: 'M4A1 স্পেক-অপস লেজার',
    nameEn: 'M4A1 Spec-Ops',
    type: 'কারবাইন',
    caliber: '5.56x45mm NATO',
    firepower: 88,
    accuracy: 95,
    maxMultiplier: '1,500x',
    icon: '🎯',
    color: 'from-cyan-500 to-blue-600',
  },
  {
    id: 'barrett-50',
    nameBn: 'ব্যারেট .৫০ স্নাইপার AWP',
    nameEn: 'Barrett .50 Sniper',
    type: 'স্নাইপার',
    caliber: '.50 BMG Anti-Materiel',
    firepower: 98,
    accuracy: 97,
    maxMultiplier: '2,500x',
    icon: '🔭',
    color: 'from-purple-500 to-indigo-600',
  },
  {
    id: 'minigun',
    nameBn: 'গোল্ডেন ভলকান মিনিগান VIP',
    nameEn: 'Golden Vulcan Minigun',
    type: 'হেভি মেশিনগান',
    caliber: '7.62mm 6-Barrel Gatling',
    firepower: 100,
    accuracy: 90,
    maxMultiplier: '5,000x',
    icon: '👑',
    color: 'from-amber-400 to-yellow-500',
  },
];

interface RangeTarget {
  id: number;
  nameBn: string;
  distance: string;
  multiplier: number;
  hitChance: number; // Probability of hit (RTP aligned ~97%)
  icon: string;
}

const TARGETS: RangeTarget[] = [
  { id: 0, nameBn: 'স্টিল পপার টার্গেট', distance: '১৫ মি.', multiplier: 1.35, hitChance: 0.88, icon: '🎯' },
  { id: 1, nameBn: 'ট্যাকটিকাল সিলুয়েট', distance: '৩০ মি.', multiplier: 1.95, hitChance: 0.82, icon: '🛡️' },
  { id: 2, nameBn: 'মুভিং মেটাল প্লেট', distance: '৬০ মি.', multiplier: 2.90, hitChance: 0.78, icon: '⚙️' },
  { id: 3, nameBn: 'রেড থ্রেট সেন্টিনেল', distance: '১০০ মি.', multiplier: 4.80, hitChance: 0.72, icon: '💥' },
  { id: 4, nameBn: 'আর্মর্ড মিলিশিয়া ডামি', distance: '২০০ মি.', multiplier: 9.50, hitChance: 0.65, icon: '🤖' },
  { id: 5, nameBn: 'ট্যাকটিকাল কমব্যাট ড্রোন', distance: '৩৫০ মি.', multiplier: 22.00, hitChance: 0.55, icon: '🛸' },
  { id: 6, nameBn: 'এক্সপ্লোসিভ C4 ব্যারেল', distance: '৫০০ মি.', multiplier: 75.00, hitChance: 0.42, icon: '🛢️' },
  { id: 7, nameBn: 'গোল্ডেন আর্মারি ভল্ট (জ্যাকপট)', distance: '১০০০ মি.', multiplier: 500.00, hitChance: 0.28, icon: '🏆' },
];

const PRESET_CHIPS = [50, 100, 200, 500, 1000, 2000];

// Simulated Bangladeshi marksmen
const SQUAD_MARKSMEN = [
  { name: 'স্নাইপার_সাকিব', weapon: 'Barrett .50', bet: 500, target: 'ট্যাকটিকাল ড্রোন', mult: 22.0, win: 11000 },
  { name: 'কমান্ডো_তানভীর', weapon: 'AK-47 Vulcan', bet: 200, target: 'C4 ব্যারেল', mult: 75.0, win: 15000 },
  { name: 'আরিফ_ঢাকা', weapon: 'Desert Eagle', bet: 1000, target: 'আর্মর্ড ডামি', mult: 9.5, win: 9500 },
  { name: 'রাকিব_চিটাগাং', weapon: 'M4A1 Spec-Ops', bet: 250, target: 'মুভিং প্লেট', mult: 2.9, win: 725 },
  { name: 'বুল_হিটার_২২', weapon: 'Golden Minigun', bet: 1500, target: 'গোল্ডেন ভল্ট', mult: 500.0, win: 750000 },
];

export const GunsmithGame: React.FC<GunsmithGameProps> = ({
  balance,
  onUpdateBalance,
  onClose,
  onOpenDeposit,
}) => {
  // Weapon Selection
  const [selectedWeapon, setSelectedWeapon] = useState<WeaponConfig>(WEAPONS[0]);
  const [betAmount, setBetAmount] = useState<number>(100);

  // Game Progress State
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTargetIndex, setCurrentTargetIndex] = useState<number>(0);
  const [bankedMultiplier, setBankedMultiplier] = useState<number>(1.0);
  const [lastShotResult, setLastShotResult] = useState<'hit' | 'miss' | null>(null);
  const [isFiring, setIsFiring] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Modals
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);
  const [showFairModal, setShowFairModal] = useState<boolean>(false);
  const [selectedRoundFair, setSelectedRoundFair] = useState<{
    id: string;
    hash: string;
    seed: string;
  } | null>(null);

  // Stats / History
  const [roundHistory, setRoundHistory] = useState<
    Array<{ id: string; time: string; target: string; mult: number; win: number; status: 'win' | 'miss' }>
  >([
    { id: '1', time: '11:02', target: 'মুভিং প্লেট', mult: 2.9, win: 290, status: 'win' },
    { id: '2', time: '11:04', target: 'রেড থ্রেট', mult: 4.8, win: 480, status: 'win' },
    { id: '3', time: '11:06', target: 'আর্মর্ড ডামি', mult: 9.5, win: 0, status: 'miss' },
  ]);

  // Canvas Ref for Tactical Range Animation
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const crosshairRef = useRef<{ x: number; y: number; targetX: number; targetY: number }>({
    x: 350,
    y: 180,
    targetX: 350,
    targetY: 180,
  });
  const sparksRef = useRef<Array<{ x: number; y: number; vx: number; vy: number; alpha: number; size: number }>>([]);
  const muzzleFlashRef = useRef<number>(0);

  // Start new round
  const handleStartRound = () => {
    if (isPlaying) return;
    if (balance < betAmount) {
      if (onOpenDeposit) onOpenDeposit();
      return;
    }

    onUpdateBalance(-betAmount, `গানস্মিথ বেট (${selectedWeapon.nameBn})`);
    if (soundEnabled) {
      sound.playReload();
      sound.playClick();
    }

    setIsPlaying(true);
    setCurrentTargetIndex(0);
    setBankedMultiplier(1.0);
    setLastShotResult(null);
  };

  // Fire at current target
  const handleFireShot = () => {
    if (!isPlaying || isFiring) return;
    setIsFiring(true);

    if (soundEnabled) {
      sound.playGunshot();
    }
    muzzleFlashRef.current = 1.0;

    const currentTarget = TARGETS[currentTargetIndex];

    // Simulate flight time to target
    setTimeout(() => {
      // Weapon accuracy bonus
      const accuracyBonus = (selectedWeapon.accuracy - 85) * 0.003;
      const effectiveHitChance = Math.min(0.92, currentTarget.hitChance + accuracyBonus);
      const isHit = Math.random() < effectiveHitChance;

      if (isHit) {
        // Successful target hit!
        setLastShotResult('hit');
        setBankedMultiplier(currentTarget.multiplier);

        if (soundEnabled) {
          if (currentTargetIndex >= 6) {
            sound.playExplosion();
          } else {
            sound.playSteelDing();
          }
        }

        // Spawn ricochet sparks on canvas
        const canvas = canvasRef.current;
        if (canvas) {
          const cx = canvas.width * 0.5;
          const cy = canvas.height * 0.45;
          for (let i = 0; i < 24; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 5 + 2;
            sparksRef.current.push({
              x: cx,
              y: cy,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              alpha: 1.0,
              size: Math.random() * 3 + 1.5,
            });
          }
        }

        // Check if final jackpot target hit
        if (currentTargetIndex === TARGETS.length - 1) {
          // Completed all targets! Auto Cash Out Jackpot!
          const winAmount = Math.floor(betAmount * currentTarget.multiplier);
          onUpdateBalance(winAmount, `গানস্মিথ জ্যাকপট ভল্ট জয় (+${currentTarget.multiplier}x)`);
          if (soundEnabled) sound.playJackpot();

          setRoundHistory(prev => [
            {
              id: Date.now().toString(),
              time: 'এখনই',
              target: currentTarget.nameBn,
              mult: currentTarget.multiplier,
              win: winAmount,
              status: 'win',
            },
            ...prev.slice(0, 19),
          ]);

          setIsPlaying(false);
          setIsFiring(false);
          return;
        }

        // Advance to next target readiness
        setCurrentTargetIndex(prev => prev + 1);
        setIsFiring(false);
      } else {
        // Target Missed / Jammed!
        setLastShotResult('miss');
        if (soundEnabled) sound.playCrash();

        setRoundHistory(prev => [
          {
            id: Date.now().toString(),
            time: 'এখনই',
            target: currentTarget.nameBn,
            mult: currentTarget.multiplier,
            win: 0,
            status: 'miss',
          },
          ...prev.slice(0, 19),
        ]);

        setIsPlaying(false);
        setIsFiring(false);
      }
    }, 450);
  };

  // Cash out current banked winnings
  const handleCashout = () => {
    if (!isPlaying || bankedMultiplier <= 1.0 || isFiring) return;
    const winAmount = Math.floor(betAmount * bankedMultiplier);
    onUpdateBalance(winAmount, `গানস্মিথ ক্যাশআউট (+${bankedMultiplier.toFixed(2)}x)`);
    if (soundEnabled) {
      sound.playWinChime();
    }

    const currentTarget = TARGETS[Math.max(0, currentTargetIndex - 1)];
    setRoundHistory(prev => [
      {
        id: Date.now().toString(),
        time: 'এখনই',
        target: currentTarget.nameBn,
        mult: bankedMultiplier,
        win: winAmount,
        status: 'win',
      },
      ...prev.slice(0, 19),
    ]);

    setIsPlaying(false);
    setBankedMultiplier(1.0);
    setLastShotResult(null);
  };

  // Canvas Firing Range Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = canvas.parentElement?.clientWidth || 740);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 380);

    const handleResize = () => {
      if (!canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener('resize', handleResize);

    let animId: number;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Underground Range Dark Concrete Wall & Grid
      const wallGrad = ctx.createLinearGradient(0, 0, 0, height);
      wallGrad.addColorStop(0, '#0a0d14');
      wallGrad.addColorStop(0.65, '#121824');
      wallGrad.addColorStop(1, '#070a10');
      ctx.fillStyle = wallGrad;
      ctx.fillRect(0, 0, width, height);

      // Target Range Lane Lines (Perspective lines meeting at center horizon)
      const horizonY = height * 0.45;
      const horizonX = width * 0.5;

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      for (let x = 0; x <= width; x += 80) {
        ctx.beginPath();
        ctx.moveTo(x, height);
        ctx.lineTo(horizonX + (x - horizonX) * 0.15, horizonY);
        ctx.stroke();
      }

      // 2. Concrete Bunkers & Sandbags at Bottom Left / Right
      ctx.fillStyle = '#1e2430';
      ctx.fillRect(0, height - 35, width, 35);
      ctx.fillStyle = '#d97706';
      ctx.fillRect(0, height - 37, width, 2);

      // Sandbag texture
      ctx.fillStyle = '#2d3748';
      for (let bx = 10; bx < width; bx += 55) {
        ctx.beginPath();
        ctx.roundRect(bx, height - 28, 50, 18, 5);
        ctx.fill();
      }

      // 3. Draw The Active Tactical Target at horizon
      const targetObj = TARGETS[Math.min(currentTargetIndex, TARGETS.length - 1)];
      const targetScale = Math.max(0.6, 1.2 - currentTargetIndex * 0.08);

      ctx.save();
      ctx.translate(horizonX, horizonY);
      ctx.scale(targetScale, targetScale);

      // Target Stand Post
      ctx.fillStyle = '#334155';
      ctx.fillRect(-4, 0, 8, 80);

      // Steel Silhouette Target Plate
      const isC4Barrel = currentTargetIndex === 6;
      const isVault = currentTargetIndex === 7;

      if (isC4Barrel) {
        // Red Explosive Barrel
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.roundRect(-28, -50, 56, 75, 8);
        ctx.fill();
        ctx.fillStyle = '#fef08a';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('C4 EXPLOSIVE', 0, -20);
        ctx.fillStyle = '#111827';
        ctx.fillRect(-28, -8, 56, 6);
        ctx.fillRect(-28, 8, 56, 6);
      } else if (isVault) {
        // Golden Armory Vault Tank
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.roundRect(-38, -60, 76, 85, 12);
        ctx.fill();
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.fillStyle = '#78350f';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('★ 500X VAULT ★', 0, -25);
      } else {
        // Standard Steel Torso / Bullseye Plate
        ctx.fillStyle = isPlaying ? '#3b82f6' : '#475569';
        ctx.beginPath();
        ctx.roundRect(-30, -55, 60, 70, 10);
        ctx.fill();

        // Target Head
        ctx.beginPath();
        ctx.arc(0, -68, 16, 0, Math.PI * 2);
        ctx.fill();

        // Concentric Bullseye Rings
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, -22, 18, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, -22, 9, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(0, -22, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Distance & Multiplier Label above Target
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${targetObj.nameBn} (${targetObj.distance})`, 0, -96);
      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 15px monospace';
      ctx.fillText(`${targetObj.multiplier.toFixed(2)}x`, 0, -80);

      ctx.restore();

      // 4. Tactical HUD Crosshair with Breath Sway
      const t = performance.now() * 0.003;
      const swayX = Math.sin(t * 1.5) * 6;
      const swayY = Math.cos(t * 2.0) * 4;

      const crossX = horizonX + swayX;
      const crossY = horizonY - 22 + swayY;

      ctx.save();
      ctx.strokeStyle = isFiring ? '#ef4444' : '#22c55e';
      ctx.lineWidth = 1.5;

      // Outer Crosshair Ring
      ctx.beginPath();
      ctx.arc(crossX, crossY, 26, 0, Math.PI * 2);
      ctx.stroke();

      // Crosshair Hash Marks
      ctx.beginPath();
      ctx.moveTo(crossX - 35, crossY);
      ctx.lineTo(crossX - 10, crossY);
      ctx.moveTo(crossX + 10, crossY);
      ctx.lineTo(crossX + 35, crossY);

      ctx.moveTo(crossX, crossY - 35);
      ctx.lineTo(crossX, crossY - 10);
      ctx.moveTo(crossX, crossY + 10);
      ctx.lineTo(crossX, crossY + 35);
      ctx.stroke();

      // Center Laser Red Dot
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(crossX, crossY, 2.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // 5. Muzzle Flash on Gunshot
      if (muzzleFlashRef.current > 0) {
        ctx.save();
        const flashGrad = ctx.createRadialGradient(
          width * 0.5,
          height - 40,
          10,
          width * 0.5,
          height - 40,
          160
        );
        flashGrad.addColorStop(0, `rgba(255, 230, 150, ${muzzleFlashRef.current})`);
        flashGrad.addColorStop(0.4, `rgba(245, 158, 11, ${muzzleFlashRef.current * 0.8})`);
        flashGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = flashGrad;
        ctx.fillRect(0, 0, width, height);

        muzzleFlashRef.current -= 0.12;
        ctx.restore();
      }

      // 6. Draw Sparks from impact
      sparksRef.current.forEach(s => {
        ctx.save();
        ctx.fillStyle = `rgba(251, 191, 36, ${s.alpha})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        s.x += s.vx;
        s.y += s.vy;
        s.alpha -= 0.04;
      });
      sparksRef.current = sparksRef.current.filter(s => s.alpha > 0);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => cancelAnimationFrame(animId);
  }, [currentTargetIndex, isPlaying, isFiring]);

  return (
    <div className="flex-1 flex flex-col bg-[#080b12] text-gray-100 overflow-y-auto select-none">
      {/* 1. Header Bar */}
      <header className="bg-[#0f1422] border-b border-gray-800 px-3 sm:px-5 py-2.5 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-gray-400 hover:text-white bg-slate-900/80 hover:bg-slate-800 px-3 py-1.5 rounded-xl border border-gray-800 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">লবিতে ফিরুন</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xl">🎯</span>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm sm:text-base font-black text-amber-400 tracking-wide">
                  গানস্মিথ আর্মারি বেটিং
                </h1>
                <span className="text-[10px] bg-gradient-to-r from-red-600 to-amber-600 text-white font-extrabold px-1.5 py-0.5 rounded uppercase">
                  GUNSMITH
                </span>
                <span className="hidden md:inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  <ShieldCheck className="w-3 h-3" />
                  RTP 97.2%
                </span>
              </div>
              <p className="text-[10px] text-gray-400 hidden sm:block">
                হ্যান্ডগান থেকে হেভি স্নাইপার রাইফেল নিয়ে টার্গেট শুট করুন ও ৫০০x পর্যন্ত ক্যাশআউট করুন
              </p>
            </div>
          </div>
        </div>

        {/* Right side controls: Balance + Audio + Help */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* User Balance */}
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

          {/* Help Toggle */}
          <button
            onClick={() => setShowHelpModal(true)}
            className="p-2 rounded-xl bg-slate-900/80 border border-gray-800 hover:text-amber-400 text-gray-400 transition"
            title="গেম নিয়মাবলী"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. Weapon Arsenal Selector Ribbon */}
      <div className="bg-[#0b101a] border-b border-gray-800/80 px-3 sm:px-5 py-2.5 flex items-center gap-2 overflow-x-auto no-scrollbar">
        <span className="text-[11px] font-bold text-gray-400 shrink-0 uppercase tracking-wider mr-1">
          অস্ত্রাগার (ARMORY):
        </span>
        {WEAPONS.map(weapon => {
          const isSelected = selectedWeapon.id === weapon.id;
          return (
            <button
              key={weapon.id}
              onClick={() => {
                if (isPlaying) return;
                setSelectedWeapon(weapon);
                if (soundEnabled) sound.playReload();
              }}
              disabled={isPlaying}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold shrink-0 transition ${
                isSelected
                  ? 'bg-gradient-to-r from-amber-500/20 to-red-500/20 border-amber-500 text-white shadow-lg shadow-amber-500/10'
                  : 'bg-slate-900/80 border-gray-800 text-gray-400 hover:text-gray-200 hover:border-gray-700'
              } ${isPlaying ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              <span className="text-sm">{weapon.icon}</span>
              <div>
                <div className="font-bold leading-none">{weapon.nameBn}</div>
                <div className="text-[9px] text-gray-500 font-mono mt-0.5">
                  ম্যাক্স: <span className="text-amber-400 font-bold">{weapon.maxMultiplier}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* 3. Main Stage: Tactical Firing Range Canvas + Multiplier Ladder */}
      <div className="flex-1 max-w-7xl mx-auto w-full p-2 sm:p-4 flex flex-col lg:flex-row gap-3">
        {/* Left: Tactical Canvas & Control Console */}
        <div className="flex-1 flex flex-col gap-3">
          {/* Canvas Range View */}
          <div className="relative w-full h-[260px] sm:h-[320px] md:h-[360px] rounded-2xl overflow-hidden border border-gray-800 bg-[#090d16] shadow-2xl">
            <canvas ref={canvasRef} className="w-full h-full block" />

            {/* Target Distance & Multiplier HUD overlay */}
            <div className="absolute top-3 left-3 bg-slate-950/80 border border-gray-800 rounded-xl px-3 py-1.5 flex items-center gap-2 backdrop-blur-sm text-xs">
              <Crosshair className="w-4 h-4 text-emerald-400 animate-spin" />
              <div>
                <span className="text-gray-400 text-[10px] block">টার্গেট জোন:</span>
                <span className="font-bold text-white">
                  {TARGETS[Math.min(currentTargetIndex, TARGETS.length - 1)].nameBn} (
                  {TARGETS[Math.min(currentTargetIndex, TARGETS.length - 1)].distance})
                </span>
              </div>
            </div>

            {/* Live Banked Multiplier Center/Top */}
            {isPlaying && bankedMultiplier > 1.0 && (
              <div className="absolute top-3 right-3 bg-slate-950/80 border border-amber-500/50 rounded-xl px-4 py-1.5 backdrop-blur-sm text-right animate-pulse">
                <span className="text-[10px] text-amber-400 font-bold block uppercase">সফল হিট গুণক:</span>
                <span className="font-mono font-black text-xl text-emerald-400">
                  {bankedMultiplier.toFixed(2)}x (৳{Math.floor(betAmount * bankedMultiplier)})
                </span>
              </div>
            )}

            {/* Shot Result Notifications */}
            {lastShotResult === 'hit' && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="bg-emerald-950/85 border border-emerald-500 backdrop-blur-md px-6 py-3 rounded-2xl text-center shadow-2xl animate-bounce">
                  <div className="flex items-center justify-center gap-2 text-emerald-400 font-black text-lg">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span>TARGET HIT! নিখুঁত নিশানা!</span>
                  </div>
                  <div className="text-xs text-emerald-200 mt-0.5">
                    মুনাফা তুলে নিতে ক্যাশ আউট করুন অথবা পরবর্তী টার্গেটে ফায়ার করুন
                  </div>
                </div>
              </div>
            )}

            {lastShotResult === 'miss' && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="bg-rose-950/90 border border-rose-500 backdrop-blur-md px-6 py-3 rounded-2xl text-center shadow-2xl animate-shake">
                  <div className="flex items-center justify-center gap-2 text-rose-400 font-black text-lg">
                    <AlertTriangle className="w-5 h-5 text-rose-400" />
                    <span>MISFIRE / TARGET MISSED! লক্ষ্যভ্রষ্ট!</span>
                  </div>
                  <div className="text-xs text-rose-200 mt-0.5">পরবর্তী রাউন্ডে আবার চেষ্টা করুন</div>
                </div>
              </div>
            )}
          </div>

          {/* Target Multiplier Ladder Ribbon */}
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
            {TARGETS.map((t, idx) => {
              const isCurrent = isPlaying && idx === currentTargetIndex;
              const isPassed = isPlaying && idx < currentTargetIndex;
              return (
                <div
                  key={t.id}
                  className={`p-2 rounded-xl border text-center transition flex flex-col justify-between ${
                    isPassed
                      ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                      : isCurrent
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 ring-2 ring-amber-500/30 animate-pulse'
                      : 'bg-slate-900/60 border-gray-800 text-gray-500'
                  }`}
                >
                  <div className="text-xs">{t.icon}</div>
                  <div className="text-[10px] font-bold truncate mt-1">{t.distance}</div>
                  <div className="font-mono font-black text-xs text-amber-400 mt-0.5">
                    {t.multiplier}x
                  </div>
                </div>
              );
            })}
          </div>

          {/* Betting Console & Fire / Cashout Actions */}
          <div className="bg-[#0f1422] border border-gray-800 rounded-2xl p-3 sm:p-4 shadow-xl">
            {/* Bet Amount Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-3">
              <div className="w-full sm:w-auto flex items-center gap-2">
                <span className="text-xs text-gray-400">বেট পরিমাণ:</span>
                <div className="flex items-center bg-slate-950 border border-gray-800 rounded-xl px-3 py-1.5">
                  <span className="text-amber-500 font-bold text-xs mr-2">৳</span>
                  <input
                    type="number"
                    min={10}
                    max={balance || 50000}
                    step={10}
                    value={betAmount}
                    onChange={e => setBetAmount(Math.max(10, Number(e.target.value)))}
                    disabled={isPlaying}
                    className="w-24 bg-transparent font-mono font-bold text-sm text-white focus:outline-none"
                  />
                </div>
                <button
                  onClick={() => setBetAmount(prev => Math.max(10, prev - 50))}
                  disabled={isPlaying}
                  className="w-8 h-8 rounded-lg bg-slate-900 border border-gray-800 text-gray-300 hover:bg-slate-800 font-bold text-sm"
                >
                  -
                </button>
                <button
                  onClick={() => setBetAmount(prev => prev + 50)}
                  disabled={isPlaying}
                  className="w-8 h-8 rounded-lg bg-slate-900 border border-gray-800 text-gray-300 hover:bg-slate-800 font-bold text-sm"
                >
                  +
                </button>
                <button
                  onClick={() => setBetAmount(prev => Math.max(10, Math.floor(prev / 2)))}
                  disabled={isPlaying}
                  className="px-2 h-8 rounded-lg bg-slate-900 border border-gray-800 text-[11px] font-bold text-gray-300 hover:bg-slate-800"
                >
                  ½
                </button>
                <button
                  onClick={() => setBetAmount(prev => prev * 2)}
                  disabled={isPlaying}
                  className="px-2 h-8 rounded-lg bg-slate-900 border border-gray-800 text-[11px] font-bold text-gray-300 hover:bg-slate-800"
                >
                  2X
                </button>
              </div>

              {/* Quick Chip Presets */}
              <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto">
                {PRESET_CHIPS.map(chip => (
                  <button
                    key={chip}
                    onClick={() => setBetAmount(chip)}
                    disabled={isPlaying}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 border border-gray-800 text-[11px] font-mono text-gray-300 hover:border-amber-500/50 hover:text-amber-400 transition"
                  >
                    ৳{chip}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons: START or (FIRE NEXT + CASH OUT) */}
            {!isPlaying ? (
              <button
                onClick={handleStartRound}
                className="w-full py-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-lg rounded-2xl shadow-xl shadow-emerald-600/30 transition hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
              >
                <Target className="w-5 h-5 text-amber-300" />
                <span>শুটিং রেঞ্জ শুরু করুন (বেট ৳{betAmount})</span>
              </button>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Fire Shot Button */}
                <button
                  onClick={handleFireShot}
                  disabled={isFiring}
                  className={`py-3.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-base sm:text-lg rounded-2xl shadow-xl shadow-red-600/30 transition hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 ${
                    isFiring ? 'opacity-50 cursor-not-allowed' : 'animate-pulse'
                  }`}
                >
                  <Crosshair className="w-5 h-5" />
                  <span>
                    ফায়ার করুন ({TARGETS[currentTargetIndex]?.distance || 'পরবর্তী'})
                  </span>
                </button>

                {/* Cash Out Button */}
                <button
                  onClick={handleCashout}
                  disabled={bankedMultiplier <= 1.0 || isFiring}
                  className={`py-3.5 rounded-2xl font-black text-base sm:text-lg transition flex flex-col items-center justify-center leading-tight shadow-xl ${
                    bankedMultiplier > 1.0 && !isFiring
                      ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 shadow-amber-500/30 hover:scale-[1.02] active:scale-[0.98]'
                      : 'bg-slate-800 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <span>ক্যাশ আউট</span>
                  {bankedMultiplier > 1.0 ? (
                    <span className="text-xs font-mono font-bold">
                      ৳ {Math.floor(betAmount * bankedMultiplier).toLocaleString('en-US')} (
                      {bankedMultiplier.toFixed(2)}x)
                    </span>
                  ) : (
                    <span className="text-[11px] font-normal text-gray-400">
                      কমপক্ষে ১টি হিট প্রয়োজন
                    </span>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right: Squad Marksmen Live Leaderboard & Round History */}
        <div className="w-full lg:w-72 bg-[#0f1422] border border-gray-800 rounded-2xl p-3 flex flex-col shadow-xl">
          <div className="flex items-center justify-between border-b border-gray-800 pb-2 mb-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
              <Award className="w-4 h-4 text-amber-400" />
              <span>লাইভ স্কোয়াড মার্কসম্যান</span>
            </div>
          </div>

          <div className="space-y-2 overflow-y-auto max-h-[380px] pr-1">
            {SQUAD_MARKSMEN.map((squad, idx) => (
              <div
                key={idx}
                className="bg-slate-950/70 border border-gray-800/80 rounded-xl p-2.5 text-xs flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-gray-200">{squad.name}</div>
                  <div className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                    <span>{squad.weapon}</span>
                    <span>•</span>
                    <span className="text-amber-400">{squad.target}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-emerald-400">
                    +{squad.mult}x
                  </div>
                  <div className="text-[10px] text-gray-300 font-mono">
                    ৳{squad.win.toLocaleString()}
                  </div>
                </div>
              </div>
            ))}

            {/* My Past Shots History */}
            <div className="pt-2 border-t border-gray-800">
              <span className="text-[11px] text-gray-400 font-bold block mb-1.5">
                আমার সাম্প্রতিক শট:
              </span>
              {roundHistory.map((h, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-1 border-b border-gray-900 text-[11px]"
                >
                  <span className="text-gray-400">{h.target}</span>
                  <span
                    className={`font-mono font-bold ${
                      h.status === 'win' ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {h.status === 'win' ? `+৳${h.win} (${h.mult}x)` : 'মিসড ❌'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Game Rules Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121826] border border-amber-500/40 rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4 border-b border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">গানস্মিথ গেম কিভাবে খেলবেন?</h3>
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
                ১. <strong>অস্ত্র নির্বাচন করুন:</strong> উপরে আর্মারি থেকে আপনার পছন্দের অস্ত্র (হ্যান্ডগান, অ্যাসল্ট রাইফেল, স্নাইপার, ইত্যাদি) বেছে নিন।
              </p>
              <p>
                ২. <strong>বেট ও রেঞ্জ শুরু:</strong> আপনার কাঙ্খিত বেট নির্ধারণ করে &quot;শুটিং রেঞ্জ শুরু করুন&quot; বাটনে ক্লিক করুন।
              </p>
              <p>
                ৩. <strong>টার্গেট হিট ও গুণক:</strong> প্রতিটি টার্গেটে ফায়ার করে নিশানা লাগালে আপনার মাল্টিপ্লায়ার ১.৩৫x থেকে শুরু করে ক্রমান্বয়ে বৃদ্ধি পাবে।
              </p>
              <p>
                ৪. <strong>ক্যাশ আউট:</strong> যেকোনো সফল হিটের পর যেকোনো মুহূর্তে &quot;ক্যাশ আউট&quot; বাটনে ক্লিক করে সম্পূর্ণ মুনাফা আপনার অ্যাকাউন্টে তুলে নিতে পারেন!
              </p>
              <p>
                ৫. <strong>জ্যাকপট ভল্ট:</strong> সর্বোচ্চ ৮টি টার্গেটে একটানা নির্ভুল ফায়ার করলে ৫০০x মেগা জ্যাকপট আর্মারি ভল্ট আনলক হবে!
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
