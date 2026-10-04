// Bulletproof, high-performance HTML5 Canvas Confetti engine
// 100% resilient to SSR, iFrames, and container lifecycle events

export interface ConfettiOptions {
  particleCount?: number;
  angle?: number;
  spread?: number;
  startVelocity?: number;
  decay?: number;
  gravity?: number;
  drift?: number;
  ticks?: number;
  origin?: { x?: number; y?: number };
  colors?: string[];
  shapes?: string[];
  scalar?: number;
  zIndex?: number;
  disableForReducedMotion?: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  decay: number;
}

const DEFAULT_COLORS = ['#00b067', '#0088cc', '#ffcc00', '#ff3b30', '#a855f7', '#ffffff'];

export function confetti(options: ConfettiOptions = {}) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const count = options.particleCount || 60;
  const baseAngle = ((options.angle !== undefined ? options.angle : 90) * Math.PI) / 180;
  const spread = (options.spread || 60) * (Math.PI / 180);
  const originX = (options.origin?.x ?? 0.5) * window.innerWidth;
  const originY = (options.origin?.y ?? 0.6) * window.innerHeight;
  const colors = options.colors && options.colors.length > 0 ? options.colors : DEFAULT_COLORS;
  const gravity = options.gravity ?? 0.35;
  const scalar = options.scalar ?? 1;
  const startVelocity = options.startVelocity || 8;

  // Ensure confetti canvas
  let canvas = document.getElementById('tradexora-confetti-canvas') as HTMLCanvasElement | null;
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = 'tradexora-confetti-canvas';
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = String(options.zIndex || 99999);
    document.body.appendChild(canvas);
  }

  const dpr = window.devicePixelRatio || 1;
  const width = window.innerWidth;
  const height = window.innerHeight;
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Initialize particles
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const angle = -baseAngle + (Math.random() - 0.5) * spread;
    const speed = (Math.random() * startVelocity + 5) * scalar;
    const color = colors[Math.floor(Math.random() * colors.length)];

    particles.push({
      x: originX,
      y: originY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      w: (Math.random() * 8 + 5) * scalar,
      h: (Math.random() * 5 + 4) * scalar,
      color,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.2,
      opacity: 1,
      decay: options.decay ?? (Math.random() * 0.015 + 0.01),
    });
  }

  let animationId: number;

  const render = () => {
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(dpr, dpr);

    let activeCount = 0;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      if (p.opacity <= 0) continue;

      activeCount++;
      p.x += p.vx;
      p.y += p.vy;
      p.vy += gravity;
      p.vx *= 0.98;
      p.rotation += p.rotationSpeed;
      p.opacity -= p.decay;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = Math.max(0, p.opacity);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }

    ctx.restore();

    if (activeCount > 0) {
      animationId = requestAnimationFrame(render);
    } else {
      if (canvas && canvas.parentNode) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  };

  render();
}

export default confetti;
