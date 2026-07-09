import type { FormSeed, GesturePoint } from './types';
import type { WeatherState } from '../../types';
import { localDateKey } from '../dailyMarks';

export function hashGesture(points: GesturePoint[]): number {
  let h = 2166136261;
  for (const p of points) {
    h ^= Math.floor(p.x * 997) | 0;
    h = Math.imul(h, 16777619);
    h ^= Math.floor(p.y * 991) | 0;
    h = Math.imul(h, 16777619);
    h ^= Math.floor(p.dwell * 100) | 0;
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function mulberry32(seed: number): () => number {
  let s = seed;
  return () => {
    s += 0x6d2b79f5;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function buildFormSeed(
  gesturePoints: GesturePoint[],
  particleCount: number,
  weather: WeatherState,
  conditionsSummary: string,
  now: Date = new Date(),
): FormSeed {
  const xs = gesturePoints.map(p => p.x);
  const ys = gesturePoints.map(p => p.y);
  const cx = xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0.5;
  const cy = ys.length ? ys.reduce((a, b) => a + b, 0) / ys.length : 0.5;
  const spread =
    gesturePoints.length < 2
      ? 0.1
      : Math.sqrt(
          gesturePoints.reduce((s, p) => s + (p.x - cx) ** 2 + (p.y - cy) ** 2, 0) /
            gesturePoints.length,
        );

  return {
    gestureHash: hashGesture(gesturePoints),
    weatherId: weather.id,
    weatherName: weather.title,
    date: localDateKey(now),
    gridCentroid: [cx, cy],
    pathSpread: spread,
    particleCount,
    conditionsSummary,
    gesturePoints: gesturePoints.slice(-120),
  };
}

export type DrawFormOptions = {
  coalesce: number;
  breathPhase: 'inhale' | 'exhale' | 'hold';
  breathScatter: number;
  size?: number;
};

/** Deterministic abstract form — warm-dark, stone-like. */
export function drawForm(
  ctx: CanvasRenderingContext2D,
  seed: FormSeed,
  opts: DrawFormOptions,
): void {
  const { coalesce, breathPhase, breathScatter, size = 120 } = opts;
  const rng = mulberry32(seed.gestureHash);
  const cx = size / 2;
  const cy = size / 2;
  const scatter =
    breathPhase === 'inhale'
      ? breathScatter * (1 - coalesce * 0.35)
      : breathScatter * (1 - coalesce);

  ctx.save();
  ctx.translate(cx, cy);

  const layers = 5 + Math.floor(rng() * 3);
  for (let i = 0; i < layers; i++) {
    const angle = rng() * Math.PI * 2 + seed.pathSpread * 2;
    const rx = (18 + rng() * 28) * (0.55 + coalesce * 0.45) + scatter * 6;
    const ry = (12 + rng() * 22) * (0.55 + coalesce * 0.45) + scatter * 4;
    const ox = (rng() - 0.5) * 30 * (1 - coalesce * 0.6) + scatter * (rng() - 0.5) * 12;
    const oy = (rng() - 0.5) * 36 * (1 - coalesce * 0.6) + scatter * (rng() - 0.5) * 10;
    const warm = 28 + rng() * 18;
    const alpha = 0.12 + coalesce * 0.22 + i * 0.04;

    ctx.beginPath();
    ctx.ellipse(ox, oy, rx, ry, angle, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${48 + warm}, ${38 + warm * 0.6}, ${32 + warm * 0.3}, ${alpha})`;
    ctx.fill();
  }

  // Cycladic hint — tapered vertical mass
  ctx.beginPath();
  ctx.moveTo(-8 * coalesce, -42 * coalesce - scatter * 4);
  ctx.quadraticCurveTo(22 * coalesce, -10, 14 * coalesce, 38 * coalesce);
  ctx.quadraticCurveTo(0, 48 * coalesce, -14 * coalesce, 38 * coalesce);
  ctx.quadraticCurveTo(-22 * coalesce, -10, -8 * coalesce, -42 * coalesce - scatter * 4);
  ctx.closePath();
  ctx.fillStyle = `rgba(62, 48, 40, ${0.35 + coalesce * 0.4})`;
  ctx.fill();

  ctx.restore();
}
