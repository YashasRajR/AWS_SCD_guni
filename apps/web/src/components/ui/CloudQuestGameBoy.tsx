import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';

/**
 * CloudQuestGameBoy — Expanded, Highly Playable Handheld Console
 * 
 * Major Features:
 * 1. BIG, prominent 340×210 game screen with seamless parallax scrolling campus.
 * 2. Superpower Hardware Buttons:
 *    - [ DEPLOY ]: Launches retro pixel AWS Rocket with screen rumble and smoke!
 *    - [ INVOKE ]: Strikes lightning on Lambda and rains golden coin shower!
 * 3. Secret Cyberpunk Synthwave Night Mode (click LED or Konami code):
 *    - Jetpack flight mode with animated flame particles!
 *    - Glowing neon purple/cyan sky and illuminated buildings.
 * 4. Stompable 8-Bit "500 Error" Bug Monster across the rooftop (+500 XP).
 * 5. Actionable Victory State with "Claim Student Ticket" and "Play Again".
 */

function playChiptune(type: 'jump' | 'coin' | 'powerup' | 'victory' | 'rocket' | 'zap' | 'stomp' | 'cyber') {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const t = ctx.currentTime;

    if (type === 'jump') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(160, t);
      osc.frequency.exponentialRampToValueAtTime(620, t + 0.12);
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.12);
    } else if (type === 'coin') {
      // Classic 2-tone coin ping (B5 -> E6)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      osc1.type = 'square';
      osc2.type = 'square';
      osc1.frequency.setValueAtTime(987.77, t);
      osc2.frequency.setValueAtTime(1318.51, t + 0.08);
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      osc1.start(t);
      osc1.stop(t + 0.08);
      osc2.start(t + 0.08);
      osc2.stop(t + 0.22);
    } else if (type === 'powerup') {
      // Rapid ascending arpeggio
      [330, 440, 550, 660, 880].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        const start = t + idx * 0.04;
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.1, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.08);
      });
    } else if (type === 'victory') {
      // Fanfare: C5 -> E5 -> G5 -> C6
      const freqs = [523.25, 659.25, 783.99, 1046.5];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        const start = t + idx * 0.09;
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.15, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.26);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.26);
      });
    } else if (type === 'rocket') {
      // Rocket thruster sweep with low frequency rumble
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(90, t);
      osc.frequency.exponentialRampToValueAtTime(340, t + 0.45);
      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.5);
    } else if (type === 'zap') {
      // Electric lightning zap
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(1200, t);
      osc.frequency.exponentialRampToValueAtTime(140, t + 0.18);
      gain.gain.setValueAtTime(0.16, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.18);
    } else if (type === 'stomp') {
      // Crunch stomp
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, t);
      osc.frequency.exponentialRampToValueAtTime(70, t + 0.14);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.14);
    } else if (type === 'cyber') {
      // Synthwave arpeggio
      [440, 523.25, 659.25, 783.99, 880].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        const start = t + idx * 0.05;
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.12, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.14);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.14);
      });
    }
  } catch {
    // Audio silently ignored if not permitted
  }
}

interface FloatingScore {
  id: number;
  text: string;
  x: number;
  y: number;
  color: string;
  opacity: number;
  vy: number;
}

interface Sparkle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
}

interface FloatingCoin {
  x: number;
  y: number;
  baseY: number;
  collected: boolean;
}

export function CloudQuestGameBoy() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Game stats
  const [score, setScore] = useState(300);
  const [coinsCollected, setCoinsCollected] = useState(3);
  const [unlockedServices, setUnlockedServices] = useState<Set<string>>(new Set(['lambda']));
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [victoryCelebration, setVictoryCelebration] = useState(false);
  const [confettiBlown, setConfettiBlown] = useState(false);
  const [pressedBtn, setPressedBtn] = useState<string | null>(null);
  const [cyberMode, setCyberMode] = useState(false);
  const [copiedCoupon, setCopiedCoupon] = useState(false);
  const screenShake = useRef(0);
  const konamiSeq = useRef<string[]>([]);
  const hasMovedRef = useRef(false);

  // Key controls
  const keys = useRef({ left: false, right: false, jump: false });

  // Player physics
  const player = useRef({
    x: 40,
    y: 135,
    w: 22,
    h: 30,
    vx: 0,
    vy: 0,
    isGrounded: true,
    facingRight: true,
    runFrame: 0,
  });

  // 4 AWS Service Blocks
  const blocks = useRef([
    { id: 'lambda', name: 'λ', label: 'Lambda', x: 60, y: 55, w: 38, h: 36, color: '#FF9900', bg: '#FFF7ED', bounce: 0 },
    { id: 's3', name: 'S3', label: 'S3', x: 120, y: 55, w: 38, h: 36, color: '#2563EB', bg: '#EFF6FF', bounce: 0 },
    { id: 'ec2', name: 'EC2', label: 'EC2', x: 180, y: 55, w: 38, h: 36, color: '#F59E0B', bg: '#FEF3C7', bounce: 0 },
    { id: 'dynamo', name: 'DB', label: 'Dynamo', x: 240, y: 55, w: 38, h: 36, color: '#7C3AED', bg: '#F5F3FF', bounce: 0 },
  ]);

  // Floating Coins in the air
  const airCoins = useRef<FloatingCoin[]>([
    { x: 30, y: 90, baseY: 90, collected: false },
    { x: 104, y: 95, baseY: 95, collected: false },
    { x: 164, y: 95, baseY: 95, collected: false },
    { x: 224, y: 95, baseY: 95, collected: false },
    { x: 295, y: 88, baseY: 88, collected: false },
  ]);

  // Rocket for DEPLOY
  const rocket = useRef<{
    active: boolean;
    x: number;
    y: number;
    vy: number;
    smoke: Array<{ x: number; y: number; r: number; alpha: number; vx: number }>;
  }>({
    active: false,
    x: 170,
    y: 155,
    vy: 0,
    smoke: [],
  });

  // Lightning & Rain Coins for INVOKE
  const lightningStrike = useRef<{ active: boolean; frame: number; x: number; y: number }>({
    active: false,
    frame: 0,
    x: 79,
    y: 55,
  });
  const rainCoins = useRef<Array<{ x: number; y: number; vy: number; spin: number; collected: boolean }>>([]);

  // 8-Bit 500 Bug Monster
  const bug = useRef<{
    active: boolean;
    x: number;
    y: number;
    vx: number;
    squished: boolean;
    squishTimer: number;
    legsFrame: number;
  }>({
    active: false,
    x: 350,
    y: 153,
    vx: -1.05,
    squished: false,
    squishTimer: 0,
    legsFrame: 0,
  });

  const floatingScores = useRef<FloatingScore[]>([]);
  const sparkles = useRef<Sparkle[]>([]);

  // Action: Jump
  const handleJump = useCallback(() => {
    hasMovedRef.current = true;
    const p = player.current;
    if (p.isGrounded) {
      p.vy = -8.2;
      p.isGrounded = false;
      if (soundEnabled) playChiptune('jump');
    } else if (cyberMode) {
      // Jetpack thrust in Cyberpunk Mode!
      p.vy = Math.max(-6.2, p.vy - 4.5);
      if (soundEnabled) playChiptune('rocket');
      for (let i = 0; i < 4; i++) {
        sparkles.current.push({
          id: Math.random(),
          x: p.x + (p.facingRight ? 4 : 18),
          y: p.y + 24,
          vx: (Math.random() - 0.5) * 2,
          vy: Math.random() * 3 + 2,
          size: Math.random() * 3 + 2,
          color: ['#38BDF8', '#F97316', '#FBBF24'][Math.floor(Math.random() * 3)] || '#38BDF8',
          life: 0.8,
        });
      }
    }
  }, [soundEnabled, cyberMode]);

  // Action: Invoke Lambda / Lightning & Coin Shower
  const handleInvoke = useCallback(() => {
    hasMovedRef.current = true;
    if (soundEnabled) playChiptune('zap');
    setScore((s) => s + 250);

    const lambda = blocks.current.find((b) => b.id === 'lambda');
    if (lambda) lambda.bounce = 12;

    lightningStrike.current = { active: true, frame: 12, x: 79, y: 55 };
    screenShake.current = 6;

    // Rain golden coins from the sky!
    for (let i = 0; i < 7; i++) {
      rainCoins.current.push({
        x: 40 + Math.random() * 260,
        y: -10 - Math.random() * 50,
        vy: 1.8 + Math.random() * 1.6,
        spin: Math.random() * Math.PI,
        collected: false,
      });
    }

    floatingScores.current.push({
      id: Math.random(),
      text: '⚡ LAMBDA INVOCATION: +250 XP',
      x: 40,
      y: 75,
      color: '#EA580C',
      opacity: 1,
      vy: -1.3,
    });
  }, [soundEnabled]);

  // Action: Deploy Rocket & Screen Shake
  const handleDeploy = useCallback(() => {
    hasMovedRef.current = true;
    setConfettiBlown(true);
    setVictoryCelebration(true);
    if (soundEnabled) playChiptune('rocket');
    setScore((s) => s + 500);

    // Blast off the AWS Rocket!
    rocket.current.active = true;
    rocket.current.x = 170;
    rocket.current.y = 155;
    rocket.current.vy = -3.2;
    rocket.current.smoke = [];
    screenShake.current = 14;

    floatingScores.current.push({
      id: Math.random(),
      text: '🚀 ROCKET DEPLOYED! +500 XP',
      x: 75,
      y: 90,
      color: '#16A34A',
      opacity: 1,
      vy: -1.4,
    });

    window.setTimeout(() => setConfettiBlown(false), 2400);
    window.setTimeout(() => setVictoryCelebration(false), 4500);
  }, [soundEnabled]);

  // Action: Replay Game
  const resetGame = useCallback(() => {
    setUnlockedServices(new Set());
    setVictoryCelebration(false);
    setScore(0);
    setCoinsCollected(0);
    airCoins.current.forEach((c) => { c.collected = false; });
    floatingScores.current.push({
      id: Math.random(),
      text: '↻ NEW RUN STARTED!',
      x: 100,
      y: 90,
      color: '#2563EB',
      opacity: 1,
      vy: -1.2,
    });
    if (soundEnabled) playChiptune('powerup');
  }, [soundEnabled]);

  // Action: Copy Surprise Coupon "AWS-SCD-P2026"
  const handleCopyCoupon = useCallback(() => {
    navigator.clipboard.writeText('AWS-SCD-P2026').catch(() => {});
    try {
      localStorage.setItem('scd_saved_coupon', 'AWS-SCD-P2026');
    } catch {}
    setCopiedCoupon(true);
    if (soundEnabled) playChiptune('powerup');
    floatingScores.current.push({
      id: Math.random(),
      text: '📋 AWS-SCD-P2026 COPIED! PASTE AT CHECKOUT',
      x: 18,
      y: 90,
      color: '#16A34A',
      opacity: 1,
      vy: -1.2,
    });
    setTimeout(() => setCopiedCoupon(false), 4000);
  }, [soundEnabled]);

  // Keyboard controls
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      hasMovedRef.current = true;

      // Konami code check (↑ ↑ ↓ ↓ ← → ← → B A)
      konamiSeq.current.push(e.code);
      if (konamiSeq.current.length > 10) konamiSeq.current.shift();
      const codeStr = konamiSeq.current.join(',');
      const KONAMI = 'ArrowUp,ArrowUp,ArrowDown,ArrowDown,ArrowLeft,ArrowRight,ArrowLeft,ArrowRight,KeyB,KeyA';
      if (codeStr === KONAMI) {
        setCyberMode((prev) => !prev);
        if (soundEnabled) playChiptune('cyber');
      }

      if (['ArrowLeft', 'KeyA'].includes(e.code)) {
        keys.current.left = true;
        setPressedBtn('left');
      } else if (['ArrowRight', 'KeyD'].includes(e.code)) {
        keys.current.right = true;
        setPressedBtn('right');
      } else if (['ArrowUp', 'KeyW', 'Space', 'KeyZ'].includes(e.code)) {
        e.preventDefault();
        keys.current.jump = true;
        setPressedBtn('a');
        handleJump();
      } else if (['KeyX'].includes(e.code)) {
        setPressedBtn('b');
        handleInvoke();
      } else if (['Enter'].includes(e.code)) {
        setPressedBtn('deploy');
        handleDeploy();
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'KeyA'].includes(e.code)) keys.current.left = false;
      if (['ArrowRight', 'KeyD'].includes(e.code)) keys.current.right = false;
      if (['ArrowUp', 'KeyW', 'Space', 'KeyZ'].includes(e.code)) keys.current.jump = false;
      setPressedBtn(null);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [handleJump, handleInvoke, handleDeploy, soundEnabled]);

  // Main 60 FPS Canvas Game Engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let tick = 0;
    let buildingScrollX = 0;
    const groundY = 135;

    const gameLoop = () => {
      tick++;
      const p = player.current;

      // Parallax Building Movement (Smooth continuous motion + reactive to player)
      let buildingSpeed = 0.65;
      if (keys.current.right) {
        buildingSpeed = 1.65;
      } else if (keys.current.left) {
        buildingSpeed = -0.35;
      }
      buildingScrollX = (buildingScrollX + buildingSpeed + 536) % 536;

      // 1. Physics & Movement
      if (keys.current.left) {
        p.vx = -3.2;
        p.facingRight = false;
        if (tick % 5 === 0) p.runFrame = (p.runFrame + 1) % 4;
      } else if (keys.current.right) {
        p.vx = 3.2;
        p.facingRight = true;
        if (tick % 5 === 0) p.runFrame = (p.runFrame + 1) % 4;
      } else {
        p.vx *= 0.72;
        if (Math.abs(p.vx) < 0.1) p.vx = 0;
      }

      p.x += p.vx;
      if (p.x < 10) p.x = 10;
      if (p.x > 310) p.x = 310;

      p.vy += 0.45;
      p.y += p.vy;
      if (p.y >= groundY) {
        p.y = groundY;
        p.vy = 0;
        p.isGrounded = true;
      }

      // 2. Air Coin Collection
      airCoins.current.forEach((coin) => {
        coin.y = coin.baseY + Math.sin(tick * 0.08 + coin.x) * 3;
        if (!coin.collected) {
          // Check player overlap
          if (
            p.x + p.w > coin.x - 7 &&
            p.x < coin.x + 7 &&
            p.y + p.h > coin.y - 7 &&
            p.y < coin.y + 7
          ) {
            coin.collected = true;
            if (soundEnabled) playChiptune('coin');
            setScore((s) => s + 50);
            setCoinsCollected((c) => c + 1);

            floatingScores.current.push({
              id: Math.random(),
              text: '+50',
              x: coin.x - 6,
              y: coin.y - 8,
              color: '#F59E0B',
              opacity: 1,
              vy: -1.2,
            });

            // Respawn after 8 seconds
            setTimeout(() => {
              coin.collected = false;
            }, 8000);
          }
        }
      });

      // 3. AWS Service Block Collisions (Hitting from bottom)
      blocks.current.forEach((blk) => {
        if (blk.bounce > 0) blk.bounce = Math.max(0, blk.bounce - 0.8);

        if (
          p.vy < 0 &&
          p.x + p.w > blk.x &&
          p.x < blk.x + blk.w &&
          p.y <= blk.y + blk.h + 4 &&
          p.y >= blk.y + blk.h - 10
        ) {
          // Bump block!
          p.vy = 2.4;
          blk.bounce = 10;
          if (soundEnabled) playChiptune('coin');

          setScore((s) => s + 100);
          setUnlockedServices((prev) => {
            const next = new Set(prev);
            next.add(blk.id);
            if (next.size === 4 && !victoryCelebration) {
              setVictoryCelebration(true);
              setConfettiBlown(true);
              if (soundEnabled) playChiptune('victory');
            }
            return next;
          });

          floatingScores.current.push({
            id: Math.random(),
            text: `+100 ${blk.label}!`,
            x: blk.x - 4,
            y: blk.y - 8,
            color: blk.color,
            opacity: 1,
            vy: -1.4,
          });

          // Spawn particle sparks
          for (let i = 0; i < 7; i++) {
            sparkles.current.push({
              id: Math.random(),
              x: blk.x + blk.w / 2,
              y: blk.y,
              vx: (Math.random() - 0.5) * 5,
              vy: -Math.random() * 4 - 1.5,
              size: Math.random() * 3.5 + 2,
              color: ['#FF9900', '#FBBF24', '#38BDF8', '#4ADE80', '#A855F7'][Math.floor(Math.random() * 5)] || '#FF9900',
              life: 1,
            });
          }
        }
      });

      // =========================================================
      // RENDER GAME CANVAS (340px × 210px)
      // =========================================================
      ctx.save();

      // Screen Shake (Rocket launch / Bug stomp)
      if (screenShake.current > 0) {
        const sx = (Math.random() - 0.5) * screenShake.current;
        const sy = (Math.random() - 0.5) * screenShake.current;
        ctx.translate(sx, sy);
        screenShake.current = Math.max(0, screenShake.current - 0.7);
      }

      // Clear Canvas: Day Paper vs Cyberpunk Dark Synthwave
      ctx.fillStyle = cyberMode ? '#0B0F19' : '#FFFFFF';
      ctx.fillRect(0, 0, 340, 210);

      // Blueprint / Synthwave Grid
      ctx.strokeStyle = cyberMode ? 'rgba(99, 102, 241, 0.18)' : '#F1F5F9';
      ctx.lineWidth = 1;
      for (let x = 0; x < 340; x += 17) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 210);
        ctx.stroke();
      }
      for (let y = 0; y < 210; y += 17) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(340, y);
        ctx.stroke();
      }

      // --- 1. TOP HUD STATUS BAR ---
      ctx.fillStyle = cyberMode ? '#38BDF8' : '#1E293B';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`SCORE: ${String(score).padStart(5, '0')}`, 12, 16);

      ctx.fillStyle = cyberMode ? '#FBBF24' : '#D97706';
      ctx.fillText(`🪙 x${coinsCollected}`, 115, 16);

      if (cyberMode) {
        ctx.fillStyle = '#A855F7';
        ctx.font = 'bold 8.5px monospace';
        ctx.fillText('⚡CYBER', 165, 16);
      }

      ctx.textAlign = 'right';
      ctx.fillStyle = unlockedServices.size === 4 ? '#10B981' : (cyberMode ? '#C084FC' : '#7C3AED');
      ctx.font = 'bold 10px monospace';
      ctx.fillText(`AWS_CERT: ${unlockedServices.size}/4 🎓`, 328, 16);

      // --- 2. FLOATING AWS CLOUDS IN BACKGROUND ---
      ctx.save();
      const cloudOffset = (tick * 0.4) % 400;
      const drawCloud = (cx: number, cy: number, scale: number, label?: string) => {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(scale, scale);
        ctx.fillStyle = cyberMode ? 'rgba(30, 27, 75, 0.85)' : '#EDE9FE';
        ctx.strokeStyle = cyberMode ? '#818CF8' : '#8B5CF6';
        ctx.lineWidth = 1.75;
        ctx.beginPath();
        ctx.arc(-20, 0, 16, 0, Math.PI * 2);
        ctx.arc(0, -8, 20, 0, Math.PI * 2);
        ctx.arc(22, 0, 16, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        if (label) {
          ctx.fillStyle = cyberMode ? '#38BDF8' : '#5B21B6';
          ctx.font = 'bold 8px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(label, 2, 3);
          // AWS smile arc
          ctx.strokeStyle = '#FF9900';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(2, 4, 12, 0.2 * Math.PI, 0.8 * Math.PI);
          ctx.stroke();
        }
        ctx.restore();
      };

      drawCloud(340 - cloudOffset, 65, 0.85);
      drawCloud(540 - cloudOffset, 55, 1.1, 'AWS CLOUD');
      ctx.restore();

      // --- 3. CAMPUS ROOFTOP BUILDINGS (Smooth infinite parallax scrolling) ---
      const campusBuildings = [
        {
          w: 80,
          y: 145,
          label: 'CAMPUS',
          windowRows: 2,
          windowCols: 3,
          roofFeature: 'antenna' as const,
        },
        {
          w: 82,
          y: 122,
          label: 'GUNI TECH',
          windowRows: 3,
          windowCols: 3,
          roofFeature: 'satellite' as const,
        },
        {
          w: 120,
          y: 148,
          label: 'AWS CLOUD LAB',
          windowRows: 1,
          windowCols: 5,
          roofFeature: 'beacon' as const,
        },
        {
          w: 86,
          y: 134,
          label: 'LIBRARY',
          windowRows: 2,
          windowCols: 3,
          roofFeature: 'ac' as const,
        },
        {
          w: 92,
          y: 138,
          label: 'SCD 2026',
          windowRows: 2,
          windowCols: 4,
          roofFeature: 'flag' as const,
        },
      ];
      const buildingGap = 16;
      const totalSkylineWidth = campusBuildings.reduce((acc, b) => acc + b.w + buildingGap, 0); // 536px

      let startX = -(buildingScrollX % totalSkylineWidth);
      while (startX < 340 + 120) {
        let curX = startX;
        for (const b of campusBuildings) {
          if (curX + b.w > -30 && curX < 340 + 30) {
            // Draw building body (Dark synthwave in Cyber mode)
            ctx.fillStyle = cyberMode ? '#1E293B' : '#E6DECE';
            ctx.strokeStyle = cyberMode ? '#38BDF8' : '#232F3E';
            ctx.lineWidth = 2;
            ctx.fillRect(curX, b.y, b.w, 210 - b.y);
            ctx.strokeRect(curX, b.y, b.w, 210 - b.y);

            // Roof Features (Antenna, Satellite dish, Blinking Beacon, AC unit, Flag)
            if (b.roofFeature === 'antenna') {
              ctx.strokeStyle = cyberMode ? '#38BDF8' : '#232F3E';
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              ctx.moveTo(curX + b.w / 2, b.y);
              ctx.lineTo(curX + b.w / 2, b.y - 12);
              ctx.moveTo(curX + b.w / 2 - 4, b.y - 8);
              ctx.lineTo(curX + b.w / 2 + 4, b.y - 8);
              ctx.stroke();
              // Red beacon dot
              ctx.fillStyle = tick % 40 < 20 ? '#EF4444' : '#991B1B';
              ctx.beginPath();
              ctx.arc(curX + b.w / 2, b.y - 13, 2, 0, Math.PI * 2);
              ctx.fill();
            } else if (b.roofFeature === 'satellite') {
              ctx.strokeStyle = cyberMode ? '#A855F7' : '#232F3E';
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              ctx.arc(curX + 22, b.y - 6, 6, 1.2 * Math.PI, 1.9 * Math.PI);
              ctx.lineTo(curX + 22, b.y);
              ctx.stroke();
            } else if (b.roofFeature === 'beacon') {
              // AWS Orange beacon
              ctx.fillStyle = tick % 30 < 15 ? '#FF9900' : '#D97706';
              ctx.fillRect(curX + 16, b.y - 6, 6, 6);
              ctx.strokeRect(curX + 16, b.y - 6, 6, 6);
            } else if (b.roofFeature === 'flag') {
              // AWS SCD flag
              ctx.strokeStyle = cyberMode ? '#38BDF8' : '#232F3E';
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              ctx.moveTo(curX + 14, b.y);
              ctx.lineTo(curX + 14, b.y - 14);
              ctx.stroke();
              ctx.fillStyle = '#FF9900';
              ctx.beginPath();
              ctx.moveTo(curX + 14, b.y - 14);
              ctx.lineTo(curX + 24, b.y - 10);
              ctx.lineTo(curX + 14, b.y - 6);
              ctx.closePath();
              ctx.fill();
            }

            // Windows
            const marginX = (b.w - b.windowCols * 18) / 2;
            ctx.fillStyle = cyberMode ? '#38BDF8' : '#FEF08A';
            for (let r = 0; r < b.windowRows; r++) {
              for (let c = 0; c < b.windowCols; c++) {
                const wx = curX + marginX + c * 18;
                const wy = b.y + 10 + r * 16;
                if (wy + 10 < 205) {
                  ctx.fillRect(wx, wy, 12, 10);
                  ctx.strokeStyle = cyberMode ? '#0F172A' : '#232F3E';
                  ctx.lineWidth = 1.2;
                  ctx.strokeRect(wx, wy, 12, 10);
                  // Window cross
                  ctx.beginPath();
                  ctx.moveTo(wx + 6, wy);
                  ctx.lineTo(wx + 6, wy + 10);
                  ctx.stroke();
                }
              }
            }

            // Building Label at bottom
            if (b.label) {
              ctx.fillStyle = cyberMode ? '#94A3B8' : '#232F3E';
              ctx.font = 'bold 8px monospace';
              ctx.textAlign = 'left';
              ctx.fillText(b.label, curX + 6, 198);
            }
          }
          curX += b.w + buildingGap;
        }
        startX += totalSkylineWidth;
      }

      // Solid Rooftop Walking Platform
      ctx.strokeStyle = cyberMode ? '#38BDF8' : '#232F3E';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, 165);
      ctx.lineTo(340, 165);
      ctx.stroke();

      // Rooftop warning hash marks
      ctx.strokeStyle = '#FF9900';
      ctx.lineWidth = 2;
      const hashOffset = buildingScrollX % 24;
      for (let i = -hashOffset; i < 340 + 24; i += 24) {
        ctx.beginPath();
        ctx.moveTo(i, 165);
        ctx.lineTo(i + 8, 172);
        ctx.stroke();
      }

      // --- 4. FLOATING AIR COINS (Spinning AWS Smile Coins) ---
      airCoins.current.forEach((coin) => {
        if (!coin.collected) {
          ctx.save();
          const squish = Math.abs(Math.sin(tick * 0.1 + coin.x));
          ctx.translate(coin.x, coin.y);
          ctx.scale(squish > 0.2 ? squish : 0.2, 1);
          ctx.fillStyle = '#F59E0B';
          ctx.strokeStyle = '#B45309';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(0, 0, 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#FEF08A';
          ctx.beginPath();
          ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      });

      // --- 4B. RAIN BONUS COINS (Invoked by [ INVOKE ]) ---
      rainCoins.current.forEach((coin) => {
        coin.y += coin.vy;
        coin.spin += 0.12;

        // Player collection
        if (
          !coin.collected &&
          p.x + p.w > coin.x - 8 &&
          p.x < coin.x + 8 &&
          p.y + p.h > coin.y - 8 &&
          p.y < coin.y + 8
        ) {
          coin.collected = true;
          setScore((s) => s + 50);
          setCoinsCollected((c) => c + 1);
          if (soundEnabled) playChiptune('coin');
          floatingScores.current.push({
            id: Math.random(),
            text: '+50 XP',
            x: coin.x,
            y: coin.y,
            color: '#F59E0B',
            opacity: 1,
            vy: -1.2,
          });
        }

        if (!coin.collected) {
          ctx.save();
          const squish = Math.abs(Math.sin(coin.spin));
          ctx.translate(coin.x, coin.y);
          ctx.scale(squish > 0.2 ? squish : 0.2, 1);
          ctx.fillStyle = '#F59E0B';
          ctx.strokeStyle = '#B45309';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(0, 0, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        }
      });
      rainCoins.current = rainCoins.current.filter((c) => !c.collected && c.y < 210);

      // --- 5. 4 FLOATING AWS SERVICE CARDS ---
      blocks.current.forEach((blk) => {
        const by = blk.y - blk.bounce;
        // Block drop shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
        ctx.fillRect(blk.x + 2, by + 3, blk.w, blk.h);

        // Block Face
        ctx.fillStyle = cyberMode ? '#0F172A' : blk.bg;
        ctx.fillRect(blk.x, by, blk.w, blk.h);
        ctx.strokeStyle = blk.color;
        ctx.lineWidth = 2.2;
        ctx.strokeRect(blk.x, by, blk.w, blk.h);

        // Service Symbol / Icon
        ctx.fillStyle = blk.color;
        ctx.font = 'bold 15px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(blk.name, blk.x + blk.w / 2, by + 19);

        // Text label underneath
        ctx.fillStyle = cyberMode ? '#94A3B8' : '#334155';
        ctx.font = 'bold 7.5px monospace';
        ctx.fillText(blk.label, blk.x + blk.w / 2, by + 30);

        // Unlocked Checkmark Badge
        if (unlockedServices.has(blk.id)) {
          ctx.fillStyle = '#16A34A';
          ctx.beginPath();
          ctx.arc(blk.x + blk.w - 4, by + 5, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // --- 5B. LIGHTNING BOLT ON LAMBDA BLOCK (Invoked) ---
      if (lightningStrike.current.active) {
        lightningStrike.current.frame--;
        if (lightningStrike.current.frame <= 0) {
          lightningStrike.current.active = false;
        } else {
          ctx.save();
          ctx.strokeStyle = tick % 2 === 0 ? '#38BDF8' : '#FBBF24';
          ctx.lineWidth = 3;
          ctx.shadowColor = '#38BDF8';
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.moveTo(80, 0);
          ctx.lineTo(84, 18);
          ctx.lineTo(76, 30);
          ctx.lineTo(82, 42);
          ctx.lineTo(79, 56);
          ctx.stroke();
          ctx.restore();
        }
      }

      // --- 5C. 8-BIT "500 ERROR" BUG MONSTER ---
      // Spawn bug periodically
      if (!bug.current.active && tick % 700 === 240) {
        bug.current.active = true;
        bug.current.x = 345;
        bug.current.y = 153;
        bug.current.squished = false;
        bug.current.squishTimer = 0;
      }

      if (bug.current.active) {
        if (!bug.current.squished) {
          bug.current.x += bug.current.vx;
          bug.current.legsFrame = (bug.current.legsFrame + 1) % 16;

          // Player jump-stomp check
          if (
            p.vy > 0 &&
            p.x + p.w >= bug.current.x &&
            p.x <= bug.current.x + 18 &&
            p.y + p.h >= bug.current.y &&
            p.y + p.h <= bug.current.y + 14
          ) {
            bug.current.squished = true;
            bug.current.squishTimer = 35;
            p.vy = -7.2; // Bounce player high!
            setScore((s) => s + 500);
            if (soundEnabled) playChiptune('stomp');

            floatingScores.current.push({
              id: Math.random(),
              text: '🐛 BUG RESOLVED! +500 XP',
              x: bug.current.x - 20,
              y: bug.current.y - 12,
              color: '#10B981',
              opacity: 1,
              vy: -1.3,
            });

            for (let i = 0; i < 8; i++) {
              sparkles.current.push({
                id: Math.random(),
                x: bug.current.x + 9,
                y: bug.current.y + 6,
                vx: (Math.random() - 0.5) * 6,
                vy: -Math.random() * 4 - 1,
                size: Math.random() * 3 + 2,
                color: ['#EF4444', '#10B981', '#FBBF24'][Math.floor(Math.random() * 3)] || '#EF4444',
                life: 1,
              });
            }
          }

          if (bug.current.x < -30) {
            bug.current.active = false;
          }
        } else {
          bug.current.squishTimer--;
          if (bug.current.squishTimer <= 0) {
            bug.current.active = false;
          }
        }

        // Draw Bug
        ctx.save();
        const bx = Math.floor(bug.current.x);
        const by = Math.floor(bug.current.y);
        if (bug.current.squished) {
          ctx.fillStyle = '#10B981';
          ctx.fillRect(bx, by + 7, 18, 4);
          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 7px monospace';
          ctx.fillText('FIXED', bx + 1, by + 5);
        } else {
          ctx.fillStyle = '#EF4444';
          ctx.fillRect(bx + 2, by + 2, 14, 8);
          ctx.strokeStyle = '#232F3E';
          ctx.lineWidth = 1.2;
          ctx.strokeRect(bx + 2, by + 2, 14, 8);

          // Head & Antennae
          ctx.fillStyle = '#991B1B';
          ctx.fillRect(bx, by + 4, 3, 5);
          ctx.beginPath();
          ctx.moveTo(bx + 2, by + 2);
          ctx.lineTo(bx - 2, by - 2);
          ctx.moveTo(bx + 5, by + 2);
          ctx.lineTo(bx + 4, by - 2);
          ctx.stroke();

          // Crawling Legs
          const legWiggle = bug.current.legsFrame > 8 ? 2 : -2;
          ctx.beginPath();
          ctx.moveTo(bx + 4, by + 10);
          ctx.lineTo(bx + 3 + legWiggle, by + 13);
          ctx.moveTo(bx + 9, by + 10);
          ctx.lineTo(bx + 9 - legWiggle, by + 13);
          ctx.moveTo(bx + 14, by + 10);
          ctx.lineTo(bx + 15 + legWiggle, by + 13);
          ctx.stroke();

          // Badge 500
          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 6.5px monospace';
          ctx.fillText('500', bx + 4, by + 8.5);
        }
        ctx.restore();
      }

      // --- 5D. ROCKET LAUNCH & SMOKE (Deployed by [ DEPLOY ]) ---
      if (rocket.current.active) {
        rocket.current.vy -= 0.18;
        rocket.current.y += rocket.current.vy;

        // Smoke puff emitter
        for (let i = 0; i < 2; i++) {
          rocket.current.smoke.push({
            x: rocket.current.x + (Math.random() - 0.5) * 8,
            y: rocket.current.y + 24,
            r: 3 + Math.random() * 3,
            alpha: 0.8,
            vx: (Math.random() - 0.5) * 1.5,
          });
        }

        ctx.save();
        const rx = rocket.current.x;
        const ry = rocket.current.y;
        // Exhaust Flame
        ctx.fillStyle = tick % 2 === 0 ? '#FF9900' : '#EF4444';
        ctx.beginPath();
        ctx.moveTo(rx - 5, ry + 22);
        ctx.lineTo(rx + 5, ry + 22);
        ctx.lineTo(rx, ry + 34 + Math.random() * 6);
        ctx.closePath();
        ctx.fill();

        // Saturn-V Style Rocket Body
        ctx.fillStyle = '#FAFAFC';
        ctx.strokeStyle = '#232F3E';
        ctx.lineWidth = 1.5;
        ctx.fillRect(rx - 6, ry, 12, 22);
        ctx.strokeRect(rx - 6, ry, 12, 22);

        // Nosecone
        ctx.fillStyle = '#EF4444';
        ctx.beginPath();
        ctx.moveTo(rx - 6, ry);
        ctx.lineTo(rx + 6, ry);
        ctx.lineTo(rx, ry - 10);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Boosters
        ctx.fillStyle = '#FF9900';
        ctx.fillRect(rx - 9, ry + 15, 3, 7);
        ctx.fillRect(rx + 6, ry + 15, 3, 7);

        // AWS Sign
        ctx.fillStyle = '#FF9900';
        ctx.font = 'bold 5px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('AWS', rx, ry + 13);
        ctx.restore();

        if (rocket.current.y < -60) {
          rocket.current.active = false;
        }
      }

      // Render Rocket Smoke
      rocket.current.smoke.forEach((smk) => {
        smk.x += smk.vx;
        smk.y += 0.6;
        smk.r += 0.25;
        smk.alpha -= 0.02;
        ctx.save();
        ctx.fillStyle = `rgba(203, 213, 225, ${Math.max(0, smk.alpha)})`;
        ctx.beginPath();
        ctx.arc(smk.x, smk.y, smk.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
      rocket.current.smoke = rocket.current.smoke.filter((s) => s.alpha > 0);

      // --- 6. 8-BIT STUDENT BUILDER (With Cyber Jetpack in Cyber Mode!) ---
      const px = Math.floor(p.x);
      const py = Math.floor(p.y);

      // Character Ground Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
      ctx.beginPath();
      ctx.ellipse(px + 11, groundY + 30, 12, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Cyber Jetpack on character's back
      if (cyberMode) {
        ctx.fillStyle = '#475569';
        ctx.fillRect(p.facingRight ? px + 1 : px + 17, py + 14, 5, 12);
        ctx.fillStyle = '#38BDF8';
        ctx.fillRect(p.facingRight ? px + 2 : px + 18, py + 16, 3, 4);

        // Animated Thruster Flame when jumping or flying
        if (!p.isGrounded) {
          ctx.fillStyle = tick % 2 === 0 ? '#38BDF8' : '#F97316';
          ctx.beginPath();
          const jx = p.facingRight ? px + 3 : px + 19;
          ctx.moveTo(jx - 3, py + 26);
          ctx.lineTo(jx + 3, py + 26);
          ctx.lineTo(jx, py + 36 + Math.random() * 4);
          ctx.closePath();
          ctx.fill();
        }
      }

      // Hair (Brown #78350F)
      ctx.fillStyle = '#78350F';
      ctx.fillRect(px + 5, py, 13, 8);
      ctx.fillRect(p.facingRight ? px + 12 : px + 3, py + 3, 6, 6);

      // Face (#FDE68A)
      ctx.fillStyle = '#FDE68A';
      ctx.fillRect(px + 6, py + 7, 11, 8);
      // Eye
      ctx.fillStyle = '#1E293B';
      ctx.fillRect(p.facingRight ? px + 13 : px + 7, py + 10, 2.5, 3);

      // Jacket (Navy Slate #334155 / Cyber Cyan #0284C7)
      ctx.fillStyle = cyberMode ? '#0284C7' : '#334155';
      ctx.fillRect(px + 5, py + 15, 13, 9);
      // AWS Orange Shirt inside
      ctx.fillStyle = '#FF9900';
      ctx.fillRect(px + 10, py + 15, 4, 5);

      // Jeans (#1D4ED8)
      ctx.fillStyle = '#1D4ED8';
      if (p.isGrounded) {
        if (Math.abs(p.vx) > 0.4) {
          // Running cycle
          if (p.runFrame % 2 === 0) {
            ctx.fillRect(px + 4, py + 24, 5, 5);
            ctx.fillRect(px + 13, py + 23, 5, 5);
          } else {
            ctx.fillRect(px + 6, py + 23, 5, 5);
            ctx.fillRect(px + 14, py + 24, 5, 5);
          }
        } else {
          // Standing idle
          ctx.fillRect(px + 6, py + 24, 5, 5);
          ctx.fillRect(px + 12, py + 24, 5, 5);
        }
      } else {
        // Dynamic mid-air jump pose!
        ctx.fillRect(px + 3, py + 22, 6, 6);
        ctx.fillRect(px + 14, py + 21, 6, 6);
      }

      // Sneakers (#FFFFFF)
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(px + 4, py + 28, 5, 2.5);
      ctx.fillRect(px + 13, py + 28, 5, 2.5);

      // --- 7. FLOATING SCORES & SPARKLES ---
      floatingScores.current.forEach((fs) => {
        fs.y += fs.vy;
        fs.opacity -= 0.02;
        ctx.save();
        ctx.fillStyle = fs.color;
        ctx.globalAlpha = Math.max(0, fs.opacity);
        ctx.font = "bold 11px 'Caveat', cursive, monospace";
        ctx.textAlign = 'left';
        ctx.fillText(fs.text, fs.x, fs.y);
        ctx.restore();
      });
      floatingScores.current = floatingScores.current.filter((fs) => fs.opacity > 0);

      sparkles.current.forEach((spk) => {
        spk.x += spk.vx;
        spk.y += spk.vy;
        spk.vy += 0.16;
        spk.life -= 0.022;
        ctx.save();
        ctx.fillStyle = spk.color;
        ctx.globalAlpha = Math.max(0, spk.life);
        ctx.fillRect(spk.x, spk.y, spk.size, spk.size);
        ctx.restore();
      });
      sparkles.current = sparkles.current.filter((spk) => spk.life > 0);

      // --- 8. FIRST-TIME ONBOARDING HINT ---
      if (!hasMovedRef.current && tick % 60 < 45) {
        ctx.save();
        ctx.fillStyle = 'rgba(35, 47, 62, 0.85)';
        ctx.fillRect(45, 102, 250, 22);
        ctx.strokeStyle = '#FF9900';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(45, 102, 250, 22);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 8.5px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('► TAP SCREEN OR USE SPACE / ARROWS TO PLAY ◄', 170, 116);
        ctx.restore();
      }

      ctx.restore(); // Restore screen shake

      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animId);
  }, [score, coinsCollected, unlockedServices, soundEnabled, victoryCelebration, cyberMode]);

  return (
    <div
      className="gameboy-presentation-wrapper"
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        userSelect: 'none',
      }}
    >
      {/* =========================================================================
          HANDHELD CONSOLE CASING (Responsive 380px, optimized for single-screen view)
          ========================================================================= */}
      <div
        className="gameboy-body-card"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '380px',
          background: '#FAFAFC',
          border: '3px solid #232F3E',
          borderRadius: '18px 18px 44px 18px',
          boxShadow: '6px 8px 0 rgba(35, 47, 62, 0.16)',
          padding: '10px 14px 14px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '6px',
          boxSizing: 'border-box',
        }}
      >
        {/* --- TOP-RIGHT EXPLOSIVE CONFETTI BURST --- */}
        <div
          className={`top-confetti-burst ${confettiBlown ? 'is-exploding' : ''}`}
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: '-32px',
            right: '-16px',
            width: '110px',
            height: '100px',
            pointerEvents: 'none',
            zIndex: 20,
          }}
        >
          <svg viewBox="0 0 110 100" width="100%" height="100%" fill="none">
            <path d="M 15,95 Q 35,55 70,35 Q 85,20 105,5" stroke="#FF9900" strokeWidth="3" strokeLinecap="round" />
            <path d="M 30,98 Q 50,70 60,45 Q 65,20 85,10" stroke="#06B6D4" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M 40,95 Q 70,75 85,55 Q 98,35 105,25" stroke="#8C52FF" strokeWidth="3" strokeLinecap="round" />
            <polygon points="60,18 64,28 75,28 66,35 70,45 60,38 50,45 54,35 45,28 56,28" fill="#FBBF24" stroke="#232F3E" strokeWidth="1.2" />
            <polygon points="90,36 93,42 100,42 94,47 96,54 90,50 84,54 87,47 81,42 88,42" fill="#EF4444" stroke="#232F3E" strokeWidth="1.2" />
            <circle cx="32" cy="50" r="3.5" fill="#10B981" />
            <circle cx="80" cy="65" r="3" fill="#FF9900" />
          </svg>
        </div>

        {/* Top Cartridge Notch Header */}
        <div
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '2px solid #232F3E',
            paddingBottom: '4px',
          }}
        >
          <button
            onClick={() => {
              const next = !cyberMode;
              setCyberMode(next);
              if (soundEnabled) playChiptune('cyber');
            }}
            style={{
              display: 'flex',
              gap: '6px',
              alignItems: 'center',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '2px 4px',
              borderRadius: '4px',
              outline: 'none',
            }}
            title={cyberMode ? 'Click to disable Cyberpunk Mode' : 'Click to activate Cyberpunk Synthwave Jetpack Mode (or use Konami Code!)'}
          >
            <span
              style={{
                width: '9px',
                height: '9px',
                borderRadius: '50%',
                background: cyberMode ? '#00F0FF' : '#EF4444',
                border: '1px solid #232F3E',
                boxShadow: cyberMode ? '0 0 8px #00F0FF, 0 0 2px #38BDF8' : '0 0 4px rgba(239, 68, 68, 0.6)',
                transition: 'all 0.2s ease',
              }}
            />
            <span
              style={{
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '0.62rem',
                fontWeight: 800,
                color: cyberMode ? '#0284C7' : '#64748B',
                letterSpacing: '0.04em',
              }}
            >
              {cyberMode ? '⚡ CYBER ON' : 'POWER ON'}
            </span>
          </button>

          <span
            style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: '0.62rem',
              fontWeight: 800,
              letterSpacing: '0.1em',
              color: '#232F3E',
              textTransform: 'uppercase',
            }}
          >
            AWS SBG × GUNI HANDHELD
          </span>

          {/* Audio toggle button */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            style={{
              background: soundEnabled ? '#F1F5F9' : '#E2E8F0',
              border: '1.5px solid #232F3E',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.7rem',
              padding: '2px 5px',
            }}
            title={soundEnabled ? 'Mute 8-bit sound' : 'Enable 8-bit sound'}
          >
            {soundEnabled ? '🔊 ON' : '🔇 OFF'}
          </button>
        </div>

        {/* =========================================================================
            SCREEN HOUSING BEZEL (Big 340×210 game display)
            ========================================================================= */}
        <div
          className="gameboy-screen-bezel"
          style={{
            width: '100%',
            background: '#E2E8F0',
            border: '2.5px solid #232F3E',
            borderRadius: '10px 10px 24px 10px',
            padding: '5px 8px 7px',
            boxShadow: 'inset 2px 2px 0 rgba(0,0,0,0.08)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            boxSizing: 'border-box',
          }}
        >
          {/* Bezel Title Header */}
          <div
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <div style={{ height: '2px', background: '#232F3E', flex: 1 }} />
            <span
              style={{
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '0.64rem',
                fontWeight: 800,
                letterSpacing: '0.1em',
                color: '#232F3E',
                textTransform: 'uppercase',
              }}
            >
              CLOUD QUEST: STUDENT EDITION
            </span>
            <div style={{ height: '2px', background: '#232F3E', flex: 1 }} />
          </div>

          {/* THE BIG 340×210 PLAYABLE CANVAS SCREEN */}
          <div
            style={{
              width: '100%',
              height: '185px',
              border: '2.5px solid #232F3E',
              borderRadius: '5px',
              overflow: 'hidden',
              cursor: 'pointer',
              background: '#FFFFFF',
              boxShadow: 'inset 0 0 6px rgba(0,0,0,0.12)',
            }}
            onClick={handleJump}
            title="Click screen to Jump!"
          >
            <canvas
              ref={canvasRef}
              width={340}
              height={210}
              style={{
                width: '100%',
                height: '100%',
                display: 'block',
              }}
            />
          </div>
        </div>

        {/* Branding under screen */}
        <div style={{ textAlign: 'center', margin: '0' }}>
          <span
            style={{
              fontFamily: 'var(--font-display, Anton, sans-serif)',
              fontSize: '1.02rem',
              letterSpacing: '0.06em',
              color: '#232F3E',
              fontWeight: 800,
            }}
          >
            CLOUD QUEST: STUDENT EDITION
          </span>
        </div>

        {/* Simple & Clean Victory Coupon Bar */}
        {unlockedServices.size === 4 && (
          <div
            style={{
              display: 'flex',
              gap: '8px',
              justifyContent: 'center',
              alignItems: 'center',
              marginTop: '4px',
              marginBottom: '2px',
            }}
          >
            <button
              type="button"
              onClick={handleCopyCoupon}
              style={{
                background: copiedCoupon ? '#16A34A' : '#FF9900',
                color: copiedCoupon ? '#FFFFFF' : '#232F3E',
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '0.8rem',
                fontWeight: 800,
                letterSpacing: '0.04em',
                padding: '6px 14px',
                borderRadius: '6px',
                border: '2px solid #232F3E',
                boxShadow: '2px 2px 0 #232F3E',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                outline: 'none',
                transition: 'background 0.15s ease',
              }}
              title="Copy coupon code AWS-SCD-P2026"
            >
              {copiedCoupon ? '✓ COPIED!' : '📋 COPY "AWS-SCD-P2026"'}
            </button>

            <Link
              to="/register?coupon=AWS-SCD-P2026"
              onClick={handleCopyCoupon}
              style={{
                background: '#FFFFFF',
                color: '#232F3E',
                fontFamily: 'var(--font-display, Anton, sans-serif)',
                fontSize: '0.8rem',
                fontWeight: 800,
                letterSpacing: '0.04em',
                padding: '6px 12px',
                borderRadius: '6px',
                border: '2px solid #232F3E',
                boxShadow: '2px 2px 0 #232F3E',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                cursor: 'pointer',
              }}
              title="Go to checkout to paste coupon"
            >
              CHECKOUT →
            </Link>

            <button
              type="button"
              onClick={resetGame}
              style={{
                background: '#FFFFFF',
                color: '#232F3E',
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '0.72rem',
                fontWeight: 800,
                padding: '6px 9px',
                borderRadius: '6px',
                border: '2px solid #232F3E',
                boxShadow: '2px 2px 0 #232F3E',
                cursor: 'pointer',
              }}
              title="Replay game run"
            >
              ↻
            </button>
          </div>
        )}

        {/* =========================================================================
            TACTILE CONTROLS SECTION (Chunky D-Pad + A/B Action Buttons)
            ========================================================================= */}
        <div
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '4px 10px',
          }}
        >
          {/* CHUNKY CROSS D-PAD */}
          <div
            className="gameboy-dpad-container"
            style={{
              position: 'relative',
              width: '90px',
              height: '90px',
            }}
          >
            {/* Center block */}
            <div
              style={{
                position: 'absolute',
                top: '30px',
                left: '30px',
                width: '30px',
                height: '30px',
                background: '#334155',
                border: '2px solid #232F3E',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  width: '14px',
                  height: '14px',
                  borderRadius: '50%',
                  background: '#1E293B',
                  opacity: 0.6,
                }}
              />
            </div>

            {/* D-PAD UP */}
            <button
              onClick={handleJump}
              style={{
                position: 'absolute',
                top: '0',
                left: '30px',
                width: '30px',
                height: '30px',
                background: pressedBtn === 'up' ? '#0F172A' : '#334155',
                border: '2px solid #232F3E',
                borderBottom: 'none',
                borderRadius: '5px 5px 0 0',
                cursor: 'pointer',
                color: '#94A3B8',
                fontSize: '11px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                outline: 'none',
              }}
              aria-label="D-Pad Up (Jump)"
            >
              ▲
            </button>

            {/* D-PAD DOWN */}
            <button
              style={{
                position: 'absolute',
                bottom: '0',
                left: '30px',
                width: '30px',
                height: '30px',
                background: pressedBtn === 'down' ? '#0F172A' : '#334155',
                border: '2px solid #232F3E',
                borderTop: 'none',
                borderRadius: '0 0 5px 5px',
                cursor: 'pointer',
                color: '#94A3B8',
                fontSize: '11px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                outline: 'none',
              }}
              aria-label="D-Pad Down"
            >
              ▼
            </button>

            {/* D-PAD LEFT */}
            <button
              onMouseDown={() => { keys.current.left = true; setPressedBtn('left'); }}
              onMouseUp={() => { keys.current.left = false; setPressedBtn(null); }}
              onTouchStart={(e) => { e.preventDefault(); keys.current.left = true; setPressedBtn('left'); }}
              onTouchEnd={() => { keys.current.left = false; setPressedBtn(null); }}
              style={{
                position: 'absolute',
                top: '30px',
                left: '0',
                width: '30px',
                height: '30px',
                background: pressedBtn === 'left' ? '#0F172A' : '#334155',
                border: '2px solid #232F3E',
                borderRight: 'none',
                borderRadius: '5px 0 0 5px',
                cursor: 'pointer',
                color: '#94A3B8',
                fontSize: '11px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                outline: 'none',
              }}
              aria-label="D-Pad Left"
            >
              ◄
            </button>

            {/* D-PAD RIGHT */}
            <button
              onMouseDown={() => { keys.current.right = true; setPressedBtn('right'); }}
              onMouseUp={() => { keys.current.right = false; setPressedBtn(null); }}
              onTouchStart={(e) => { e.preventDefault(); keys.current.right = true; setPressedBtn('right'); }}
              onTouchEnd={() => { keys.current.right = false; setPressedBtn(null); }}
              style={{
                position: 'absolute',
                top: '30px',
                right: '0',
                width: '30px',
                height: '30px',
                background: pressedBtn === 'right' ? '#0F172A' : '#334155',
                border: '2px solid #232F3E',
                borderLeft: 'none',
                borderRadius: '0 5px 5px 0',
                cursor: 'pointer',
                color: '#94A3B8',
                fontSize: '11px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                outline: 'none',
              }}
              aria-label="D-Pad Right"
            >
              ►
            </button>
          </div>

          {/* LARGE A & B BUTTONS IN TILTED TRAY */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              transform: 'rotate(-25deg)',
              background: '#E2E8F0',
              border: '2px solid #232F3E',
              borderRadius: '26px',
              padding: '5px 10px',
              boxShadow: 'inset 1.5px 1.5px 0 rgba(0,0,0,0.06)',
            }}
          >
            {/* Button B (Invoke / Dash) */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
              <button
                onClick={handleInvoke}
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: pressedBtn === 'b' ? '#334155' : '#475569',
                  border: '2px solid #232F3E',
                  boxShadow: pressedBtn === 'b' ? 'inset 1px 1px 2px #1E293B' : '2.5px 2.5px 0 #232F3E',
                  cursor: 'pointer',
                  outline: 'none',
                }}
                aria-label="Button B"
              />
              <span
                style={{
                  fontFamily: 'var(--font-display, sans-serif)',
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  color: '#232F3E',
                  transform: 'rotate(25deg)',
                }}
              >
                B
              </span>
            </div>

            {/* Button A (Jump) */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
              <button
                onClick={handleJump}
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: pressedBtn === 'a' ? '#334155' : '#475569',
                  border: '2px solid #232F3E',
                  boxShadow: pressedBtn === 'a' ? 'inset 1px 1px 2px #1E293B' : '2.5px 2.5px 0 #232F3E',
                  cursor: 'pointer',
                  outline: 'none',
                }}
                aria-label="Button A (Jump)"
              />
              <span
                style={{
                  fontFamily: 'var(--font-display, sans-serif)',
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  color: '#232F3E',
                  transform: 'rotate(25deg)',
                }}
              >
                A
              </span>
            </div>
          </div>
        </div>

        {/* =========================================================================
            BOTTOM FUNCTIONS (DEPLOY / INVOKE PILLS + 6 SPEAKER SLITS)
            ========================================================================= */}
        <div
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1px 12px 0',
          }}
        >
          {/* FUNCTION PILLS: DEPLOY & INVOKE */}
          <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
            {/* DEPLOY */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', transform: 'rotate(-25deg)' }}>
              <button
                onClick={handleDeploy}
                style={{
                  width: '38px',
                  height: '11px',
                  borderRadius: '6px',
                  background: pressedBtn === 'deploy' ? '#1E293B' : '#475569',
                  border: '1.5px solid #232F3E',
                  boxShadow: '1px 1px 0 #232F3E',
                  cursor: 'pointer',
                  padding: 0,
                  outline: 'none',
                }}
                aria-label="Deploy Button"
              />
              <span
                style={{
                  fontFamily: 'var(--font-display, sans-serif)',
                  fontSize: '0.64rem',
                  fontWeight: 800,
                  color: '#232F3E',
                  letterSpacing: '0.04em',
                }}
              >
                DEPLOY
              </span>
            </div>

            {/* INVOKE */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', transform: 'rotate(-25deg)' }}>
              <button
                onClick={handleInvoke}
                style={{
                  width: '38px',
                  height: '11px',
                  borderRadius: '6px',
                  background: pressedBtn === 'invoke' ? '#1E293B' : '#475569',
                  border: '1.5px solid #232F3E',
                  boxShadow: '1px 1px 0 #232F3E',
                  cursor: 'pointer',
                  padding: 0,
                  outline: 'none',
                }}
                aria-label="Invoke Button"
              />
              <span
                style={{
                  fontFamily: 'var(--font-display, sans-serif)',
                  fontSize: '0.64rem',
                  fontWeight: 800,
                  color: '#232F3E',
                  letterSpacing: '0.04em',
                }}
              >
                INVOKE
              </span>
            </div>
          </div>

          {/* 6 SLANTED SPEAKER SLITS */}
          <div
            style={{
              display: 'flex',
              gap: '4px',
              transform: 'rotate(-25deg)',
            }}
            aria-hidden="true"
          >
            {[14, 18, 22, 22, 18, 14].map((h, i) => (
              <div
                key={i}
                style={{
                  width: '4px',
                  height: `${h}px`,
                  background: '#334155',
                  borderRadius: '2px',
                  border: '1px solid #232F3E',
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* =========================================================================
          CALLOUT TEXT UNDERNEATH (Neatly bounded within console width)
          ========================================================================= */}
      <div
        style={{
          marginTop: '6px',
          textAlign: 'center',
          maxWidth: '380px',
          width: '100%',
        }}
      >
        <p
          style={{
            fontFamily: 'var(--font-display, Anton, sans-serif)',
            fontSize: '0.98rem',
            letterSpacing: '0.04em',
            color: '#232F3E',
            fontWeight: 800,
            textTransform: 'uppercase',
            margin: 0,
          }}
        >
          TAP TO PLAY CLOUD QUEST!
        </p>
        <span
          style={{
            fontFamily: "'Caveat', cursive",
            fontSize: '0.88rem',
            color: '#C2702C',
            fontWeight: 700,
            display: 'block',
          }}
        >
          (Arrow Keys / Space to Jump &amp; Bump AWS Blocks!)
        </span>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: '3px 8px',
            marginTop: '4px',
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: '0.62rem',
            fontWeight: 700,
            color: '#64748B',
            textAlign: 'left',
          }}
        >
          <span>🚀 Press <b>DEPLOY</b>: Rocket</span>
          <span>⚡ Press <b>INVOKE</b>: Coins</span>
          <span>👾 Stomp the <b>500 Bug</b></span>
          <span>✨ Tap <b>POWER ON</b>: Jetpack</span>
        </div>
      </div>
    </div>
  );
}
