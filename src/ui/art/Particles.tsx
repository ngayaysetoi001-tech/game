import { useEffect, useRef } from 'react';

interface Mote {
  angle: number;
  dist: number;
  speed: number;
  size: number;
  spin: number;
}

export function prefersReducedMotion(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Linh khí: các hạt sáng xoáy dần vào tâm (người đang tu luyện).
 * `intensity` 0..1 quyết định số hạt và tốc độ (bế quan thì mạnh hơn).
 * Vị trí tâm tính theo tỉ lệ khung (0..1).
 */
export default function Particles({
  color,
  intensity,
  cx = 0.5,
  cy = 0.62,
}: {
  color: string;
  intensity: number;
  cx?: number;
  cy?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const params = useRef({ color, intensity, cx, cy });
  params.current = { color, intensity, cx, cy };

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || prefersReducedMotion()) return;

    const motes: Mote[] = [];
    const spawn = (anywhere: boolean): Mote => ({
      angle: Math.random() * Math.PI * 2,
      dist: anywhere ? 0.15 + Math.random() * 0.85 : 0.85 + Math.random() * 0.25,
      speed: 0.08 + Math.random() * 0.12,
      size: 0.6 + Math.random() * 1.6,
      spin: (Math.random() < 0.5 ? -1 : 1) * (0.3 + Math.random() * 0.5),
    });

    let raf = 0;
    let last = performance.now();
    const frame = (t: number) => {
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }
      const p = params.current;
      const target = Math.round(14 + p.intensity * 46);
      while (motes.length < target) motes.push(spawn(motes.length < target / 2));
      if (motes.length > target) motes.length = target;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';
      const ox = p.cx * w;
      const oy = p.cy * h;
      const radius = Math.max(w, h) * 0.6;
      const speedMult = 0.6 + p.intensity * 1.4;
      for (let i = 0; i < motes.length; i++) {
        const m = motes[i];
        m.dist -= m.speed * speedMult * dt;
        m.angle += m.spin * dt * (1.2 - m.dist);
        if (m.dist <= 0.05) {
          motes[i] = spawn(false);
          continue;
        }
        const x = ox + Math.cos(m.angle) * m.dist * radius;
        const y = oy + Math.sin(m.angle) * m.dist * radius * 0.7;
        const alpha = Math.min(1, (1 - m.dist) * 1.6) * 0.9;
        ctx.globalAlpha = alpha * 0.35;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(x, y, m.size * 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(x, y, m.size, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  return <canvas ref={ref} className="art-particles" aria-hidden="true" />;
}
