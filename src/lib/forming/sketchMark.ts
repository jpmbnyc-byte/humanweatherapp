import type { FormSeed, GesturePoint } from './types';
import { mulberry32 } from './seed';

export type SketchMarkOptions = {
  /** 0–1: ghost strokes fade, final line darkens, ring closes */
  coalesce: number;
  /** 0–100 HRV coherence; drives ring completeness */
  coherence?: number;
  /** 0–3 breath cycles completed */
  breathCycles?: number;
  /** 0–1 draw only this fraction of the gesture path (live animation) */
  pathProgress?: number;
};

type WeatherSketch = {
  ink: [number, number, number];
  hatch: number;
  ghostPasses: number;
  motif: 'sun' | 'wave' | 'ring' | 'moon' | 'cloud' | 'open';
};

const WEATHER_SKETCH: Record<string, WeatherSketch> = {
  sympathetic_heat_dome: { ink: [72, 48, 32], hatch: 0.85, ghostPasses: 4, motif: 'sun' },
  scattered_atmospheric_drift: { ink: [58, 52, 46], hatch: 0.55, ghostPasses: 5, motif: 'wave' },
  high_resonant_thermal_coherence: { ink: [64, 50, 36], hatch: 0.25, ghostPasses: 2, motif: 'ring' },
  dewpoint_restorative_slumber: { ink: [48, 46, 58], hatch: 0.4, ghostPasses: 3, motif: 'moon' },
  vaporous_resonance_drift: { ink: [56, 54, 50], hatch: 0.45, ghostPasses: 3, motif: 'cloud' },
  autonomic_stillness: { ink: [80, 74, 66], hatch: 0.15, ghostPasses: 2, motif: 'open' },
};

const DEFAULT_SKETCH = WEATHER_SKETCH.vaporous_resonance_drift;

export function parseCoherenceFromSummary(summary: string): number {
  const m = summary.match(/HRV\s+(\d+)%/);
  if (m) return Math.min(100, Math.max(0, parseInt(m[1], 10)));
  return 55;
}

function weatherStyle(weatherId: string): WeatherSketch {
  return WEATHER_SKETCH[weatherId] ?? DEFAULT_SKETCH;
}

function paperGrain(ctx: CanvasRenderingContext2D, w: number, h: number, seed: number): void {
  const rng = mulberry32(seed);
  ctx.save();
  for (let i = 0; i < Math.floor(w * h * 0.04); i++) {
    const x = rng() * w;
    const y = rng() * h;
    const a = 0.015 + rng() * 0.025;
    ctx.fillStyle = `rgba(${90 + rng() * 30}, ${80 + rng() * 20}, ${60 + rng() * 15}, ${a})`;
    ctx.fillRect(x, y, 1, 1);
  }
  ctx.restore();
}

function fillPaper(ctx: CanvasRenderingContext2D, w: number, h: number, seed: number): void {
  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, '#f7f0df');
  grad.addColorStop(0.5, '#f3ead6');
  grad.addColorStop(1, '#ebe2cf');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  paperGrain(ctx, w, h, seed);
}

function drawConstructionGrid(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  alpha: number,
): void {
  ctx.save();
  ctx.strokeStyle = `rgba(120, 100, 72, ${alpha})`;
  ctx.lineWidth = 0.35;
  const step = size / 8;
  for (let i = 0; i <= 8; i++) {
    ctx.beginPath();
    ctx.moveTo(x + i * step, y);
    ctx.lineTo(x + i * step, y + size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y + i * step);
    ctx.lineTo(x + size, y + i * step);
    ctx.stroke();
  }
  ctx.restore();
}

function mapPoints(
  points: GesturePoint[],
  padX: number,
  padY: number,
  drawW: number,
  drawH: number,
): { x: number; y: number; w: number }[] {
  return points.map(p => ({
    x: padX + p.x * drawW,
    y: padY + p.y * drawH,
    w: 0.6 + Math.min(p.dwell / 400, 1.4) + p.pressure * 0.35,
  }));
}

function drawPathStroke(
  ctx: CanvasRenderingContext2D,
  pts: { x: number; y: number; w: number }[],
  ink: [number, number, number],
  alpha: number,
  lineScale: number,
  jitter: number,
  rng: () => number,
): void {
  if (pts.length < 2) {
    if (pts.length === 1) {
      const p = pts[0];
      ctx.beginPath();
      ctx.arc(p.x + (rng() - 0.5) * jitter, p.y + (rng() - 0.5) * jitter, 2 * lineScale, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${ink[0]}, ${ink[1]}, ${ink[2]}, ${alpha})`;
      ctx.fill();
    }
    return;
  }

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = `rgba(${ink[0]}, ${ink[1]}, ${ink[2]}, ${alpha})`;
  ctx.beginPath();
  ctx.moveTo(pts[0].x + (rng() - 0.5) * jitter, pts[0].y + (rng() - 0.5) * jitter);
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i];
    const prev = pts[i - 1];
    const mx = (prev.x + p.x) / 2 + (rng() - 0.5) * jitter * 0.5;
    const my = (prev.y + p.y) / 2 + (rng() - 0.5) * jitter * 0.5;
    ctx.lineWidth = ((prev.w + p.w) / 2) * lineScale;
    ctx.quadraticCurveTo(prev.x + (rng() - 0.5) * jitter, prev.y + (rng() - 0.5) * jitter, mx, my);
  }
  const last = pts[pts.length - 1];
  ctx.lineTo(last.x + (rng() - 0.5) * jitter, last.y + (rng() - 0.5) * jitter);
  ctx.stroke();
  ctx.restore();
}

function drawClimateMotif(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  motif: WeatherSketch['motif'],
  ink: [number, number, number],
  hatch: number,
): void {
  ctx.save();
  ctx.strokeStyle = `rgba(${ink[0]}, ${ink[1]}, ${ink[2]}, 0.55)`;
  ctx.fillStyle = `rgba(${ink[0]}, ${ink[1]}, ${ink[2]}, 0.12)`;
  ctx.lineWidth = 0.8;

  switch (motif) {
    case 'sun':
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.55, 0, Math.PI * 2);
      ctx.stroke();
      for (let a = 0; a < 8; a++) {
        const ang = (a / 8) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(ang) * r * 0.65, cy + Math.sin(ang) * r * 0.65);
        ctx.lineTo(cx + Math.cos(ang) * r, cy + Math.sin(ang) * r);
        ctx.stroke();
      }
      break;
    case 'wave':
      for (let row = 0; row < 3; row++) {
        ctx.beginPath();
        const y0 = cy - r * 0.4 + row * r * 0.35;
        for (let x = -r; x <= r; x += 4) {
          const y = y0 + Math.sin(x * 0.12 + row) * r * 0.15 * hatch;
          if (x === -r) ctx.moveTo(cx + x, y);
          else ctx.lineTo(cx + x, y);
        }
        ctx.stroke();
      }
      break;
    case 'ring':
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.75, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.45, 0, Math.PI * 2);
      ctx.stroke();
      break;
    case 'moon':
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.6, 0.2, Math.PI * 2 - 0.2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx + r * 0.18, cy - r * 0.08, r * 0.48, 0, Math.PI * 2);
      ctx.fillStyle = '#f3ead6';
      ctx.fill();
      break;
    case 'cloud':
      ctx.beginPath();
      ctx.arc(cx - r * 0.3, cy, r * 0.35, 0, Math.PI * 2);
      ctx.arc(cx, cy - r * 0.15, r * 0.4, 0, Math.PI * 2);
      ctx.arc(cx + r * 0.35, cy, r * 0.32, 0, Math.PI * 2);
      ctx.stroke();
      break;
    case 'open':
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.55, 0, Math.PI * 2);
      ctx.stroke();
      break;
  }
  ctx.restore();
}

function drawCoherenceRing(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  coherence: number,
  coalesce: number,
  ink: [number, number, number],
): void {
  const sweep = (coherence / 100) * Math.PI * 2 * coalesce;
  ctx.save();
  ctx.strokeStyle = `rgba(${ink[0]}, ${ink[1]}, ${ink[2]}, ${0.15 + coalesce * 0.35})`;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();
  if (sweep > 0.05) {
    ctx.strokeStyle = `rgba(196, 160, 68, ${0.35 + coalesce * 0.45})`;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, -Math.PI / 2, -Math.PI / 2 + sweep);
    ctx.stroke();
  }
  ctx.restore();
}

function drawBreathDots(
  ctx: CanvasRenderingContext2D,
  cx: number,
  y: number,
  count: number,
  ink: [number, number, number],
  coalesce: number,
): void {
  const spacing = 7;
  const startX = cx - spacing;
  ctx.save();
  for (let i = 0; i < 3; i++) {
    const filled = i < count;
    ctx.beginPath();
    ctx.arc(startX + i * spacing, y, filled ? 2.2 : 1.6, 0, Math.PI * 2);
    if (filled) {
      ctx.fillStyle = `rgba(${ink[0]}, ${ink[1]}, ${ink[2]}, ${0.5 + coalesce * 0.4})`;
      ctx.fill();
    } else {
      ctx.strokeStyle = `rgba(${ink[0]}, ${ink[1]}, ${ink[2]}, 0.25)`;
      ctx.lineWidth = 0.6;
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawBodyLocus(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  centroidY: number,
  ink: [number, number, number],
  coalesce: number,
): void {
  ctx.save();
  ctx.fillStyle = `rgba(${ink[0]}, ${ink[1]}, ${ink[2]}, ${0.35 + coalesce * 0.45})`;
  ctx.strokeStyle = `rgba(${ink[0]}, ${ink[1]}, ${ink[2]}, ${0.6})`;
  ctx.lineWidth = 0.8;
  const s = 3 + coalesce * 2;
  if (centroidY < 0.28) {
    ctx.beginPath();
    ctx.moveTo(x, y - s);
    ctx.lineTo(x + s, y + s * 0.6);
    ctx.lineTo(x - s, y + s * 0.6);
    ctx.closePath();
    ctx.fill();
  } else if (centroidY < 0.52) {
    ctx.beginPath();
    ctx.arc(x, y, s, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, y, s * 1.8, 0, Math.PI * 2);
    ctx.stroke();
  } else if (centroidY < 0.72) {
    ctx.beginPath();
    ctx.arc(x, y, s * 1.1, Math.PI * 0.15, Math.PI * 1.85);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(x - s, y - s * 0.4);
    ctx.lineTo(x + s, y - s * 0.4);
    ctx.lineTo(x, y + s);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function crossHatch(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  ink: [number, number, number],
  density: number,
  coalesce: number,
  seed: number,
): void {
  if (density < 0.2 || coalesce < 0.35) return;
  const rng = mulberry32(seed ^ 0xabc);
  ctx.save();
  ctx.strokeStyle = `rgba(${ink[0]}, ${ink[1]}, ${ink[2]}, ${density * 0.08 * coalesce})`;
  ctx.lineWidth = 0.4;
  const step = 5;
  for (let i = -h; i < w + h; i += step) {
    if (rng() > density) continue;
    ctx.beginPath();
    ctx.moveTo(x + i, y);
    ctx.lineTo(x + i + h, y + h);
    ctx.stroke();
  }
  ctx.restore();
}

/** Notebook pencil mark from grid gesture + internal climate. */
export function drawSketchMark(
  ctx: CanvasRenderingContext2D,
  seed: FormSeed,
  width: number,
  height: number,
  options: SketchMarkOptions,
): void {
  const { coalesce, pathProgress = 1 } = options;
  const coherence = options.coherence ?? parseCoherenceFromSummary(seed.conditionsSummary);
  const breathCycles = options.breathCycles ?? (coalesce >= 1 ? 3 : Math.floor(coalesce * 3));
  const style = weatherStyle(seed.weatherId);
  const rng = mulberry32(seed.gestureHash);

  fillPaper(ctx, width, height, seed.gestureHash);

  const margin = Math.min(width, height) * 0.1;
  const drawW = width - margin * 2;
  const drawH = height - margin * 2.2;
  const padX = margin;
  const padY = margin * 1.15;
  const cx = width / 2;
  const cy = height / 2;

  drawConstructionGrid(ctx, padX, padY, Math.min(drawW, drawH * 0.95), 0.06 + coalesce * 0.04);

  const motifY = padY + 8;
  drawClimateMotif(ctx, cx, motifY, 10 + coalesce * 4, style.motif, style.ink, style.hatch);

  const ringR = Math.min(drawW, drawH) * 0.44;
  drawCoherenceRing(ctx, cx, cy + drawH * 0.02, ringR, coherence, coalesce, style.ink);

  const points = seed.gesturePoints.length ? seed.gesturePoints : [{ x: 0.5, y: 0.5, t: 0, pressure: 0.5, dwell: 80 }];
  const endIdx = Math.max(2, Math.floor(points.length * Math.min(1, pathProgress)));
  const slice = points.slice(0, endIdx);
  const mapped = mapPoints(slice, padX, padY, drawW, drawH);

  const ghostAlpha = 0.12 * (1 - coalesce * 0.5);
  for (let g = 0; g < style.ghostPasses; g++) {
    const j = 2.5 + g * 1.2;
    drawPathStroke(ctx, mapped, style.ink, ghostAlpha, 0.85, j, rng);
  }

  drawPathStroke(ctx, mapped, style.ink, 0.35 + coalesce * 0.5, 1 + coalesce * 0.35, 0.8, rng);

  const [gcx, gcy] = seed.gridCentroid;
  const locusX = padX + gcx * drawW;
  const locusY = padY + gcy * drawH;
  drawBodyLocus(ctx, locusX, locusY, gcy, style.ink, coalesce);

  crossHatch(ctx, padX, padY, drawW, drawH, style.ink, style.hatch, seed.gestureHash);

  drawBreathDots(ctx, cx, padY + drawH + margin * 0.35, breathCycles, style.ink, coalesce);
}

export function drawSketchMarkToCanvas(
  canvas: HTMLCanvasElement,
  seed: FormSeed,
  options: SketchMarkOptions,
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (w <= 0 || h <= 0) return;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  drawSketchMark(ctx, seed, w, h, options);
}
