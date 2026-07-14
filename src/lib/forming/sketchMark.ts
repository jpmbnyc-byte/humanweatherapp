import type { FormSeed, GesturePoint } from './types';
import { mulberry32 } from './seed';
import { drawLeonardoAnswer, resolveSceneAnswer } from './sketchScenes';

export type SketchMarkTone = 'notebook' | 'postcard';

export type SketchMarkOptions = {
  coalesce: number;
  coherence?: number;
  breathCycles?: number;
  pathProgress?: number;
  /** notebook = thumbnail look; postcard = legacy sand export */
  tone?: SketchMarkTone;
  /** Legacy postcard enlargement within frame */
  contentScale?: number;
  /** Scales stroke/scene size vs thumbnail reference (auto from canvas if omitted) */
  pixelScale?: number;
  /** Export: punch up ink opacity for crisp PNG detail */
  detailBoost?: number;
};

/** Thumbnail min dimension — export pixelScale = min(w,h) / this */
export const THUMB_REF_MIN = 110;

function boostAlpha(alpha: number, boost: number): number {
  return Math.min(1, alpha * boost);
}

export function markDrawOptions(
  seed: FormSeed,
  overrides: Partial<SketchMarkOptions> = {},
): SketchMarkOptions {
  return {
    coalesce: 1,
    coherence: parseCoherenceFromSummary(seed.conditionsSummary),
    breathCycles: 3,
    pathProgress: 1,
    tone: 'notebook',
    ...overrides,
  };
}

export function exportMarkDrawOptions(
  seed: FormSeed,
  width: number,
  height: number,
): SketchMarkOptions {
  return markDrawOptions(seed, {
    pixelScale: Math.min(width, height) / THUMB_REF_MIN,
    detailBoost: 1.32,
  });
}

type PathSample = { x: number; y: number; w: number };

export function parseCoherenceFromSummary(summary: string): number {
  const m = summary.match(/HRV\s+(\d+)%/);
  if (m) return Math.min(100, Math.max(0, parseInt(m[1], 10)));
  return 55;
}

/** Deterministic per mark — same session reproduces; no two sessions collide. */
export function markRenderSeed(form: FormSeed): number {
  let h = form.gestureHash;
  for (let i = 0; i < form.date.length; i++) {
    h = Math.imul(h ^ form.date.charCodeAt(i), 16777619);
  }
  for (let i = 0; i < form.weatherId.length; i++) {
    h = Math.imul(h ^ form.weatherId.charCodeAt(i), 16777619);
  }
  h ^= Math.floor(form.pathSpread * 1e4);
  h ^= form.particleCount * 997;
  return h >>> 0;
}

/** Charcoal black — used for postcard PNG export only */
const POSTCARD_INK: [number, number, number] = [36, 34, 32];

function paperGrain(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  seed: number,
  sand = false,
): void {
  const rng = mulberry32(seed);
  ctx.save();
  for (let i = 0; i < Math.floor(w * h * 0.04); i++) {
    if (sand) {
      ctx.fillStyle = `rgba(${168 + rng() * 24}, ${148 + rng() * 20}, ${118 + rng() * 18}, ${0.018 + rng() * 0.028})`;
    } else {
      ctx.fillStyle = `rgba(${88 + rng() * 28}, ${78 + rng() * 18}, ${58 + rng() * 14}, ${0.012 + rng() * 0.025})`;
    }
    ctx.fillRect(rng() * w, rng() * h, 1, 1);
  }
  ctx.restore();
}

function fillPaper(ctx: CanvasRenderingContext2D, w: number, h: number, seed: number): void {
  const grad = ctx.createLinearGradient(0, 0, w * 0.3, h);
  grad.addColorStop(0, '#f8f2e4');
  grad.addColorStop(0.55, '#f2e9d4');
  grad.addColorStop(1, '#e9dfca');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  paperGrain(ctx, w, h, seed, false);
}

function fillPostcardSand(ctx: CanvasRenderingContext2D, w: number, h: number, seed: number): void {
  const grad = ctx.createLinearGradient(0, 0, w * 0.25, h);
  grad.addColorStop(0, '#ede4d2');
  grad.addColorStop(0.45, '#e4d6bc');
  grad.addColorStop(1, '#d8c8a8');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  paperGrain(ctx, w, h, seed ^ 0x5a3c, true);
}

function sortByTime(points: GesturePoint[]): GesturePoint[] {
  return [...points].sort((a, b) => a.t - b.t);
}

function sliceByProgress(points: GesturePoint[], progress: number): GesturePoint[] {
  const sorted = sortByTime(points);
  if (sorted.length <= 1) return sorted;
  const t0 = sorted[0].t;
  const t1 = sorted[sorted.length - 1].t;
  const cutoff = t0 + (t1 - t0) * Math.min(1, Math.max(0, progress));
  const kept = sorted.filter(p => p.t <= cutoff);
  return kept.length >= 1 ? kept : sorted.slice(0, 1);
}

function mapPath(
  points: GesturePoint[],
  padX: number,
  padY: number,
  drawW: number,
  drawH: number,
): PathSample[] {
  return points.map(p => ({
    x: padX + p.x * drawW,
    y: padY + p.y * drawH,
    w: 0.5 + Math.min(p.dwell / 400, 1) + p.pressure * 0.25,
  }));
}

function drawArchedFrame(
  ctx: CanvasRenderingContext2D,
  padX: number,
  padY: number,
  drawW: number,
  drawH: number,
  ink: [number, number, number],
  coalesce: number,
  rng: () => number,
  pixelScale: number,
  detailBoost: number,
): void {
  ctx.save();
  ctx.strokeStyle = `rgba(${ink[0]}, ${ink[1]}, ${ink[2]}, ${boostAlpha(0.07 + coalesce * 0.1, detailBoost)})`;
  ctx.lineWidth = 0.55 * pixelScale;
  const left = padX + drawW * 0.1;
  const right = padX + drawW * 0.9;
  const base = padY + drawH * 0.9;
  ctx.beginPath();
  ctx.moveTo(left, base);
  ctx.quadraticCurveTo(padX + drawW * 0.5, padY + drawH * 0.08, right, base);
  ctx.stroke();
  ctx.restore();
}

/** Faint grid path — the hand that asked; scene is the answer. */
function drawGestureToAnswer(
  ctx: CanvasRenderingContext2D,
  samples: PathSample[],
  anchorX: number,
  anchorY: number,
  ink: [number, number, number],
  coalesce: number,
  rng: () => number,
  pixelScale: number,
  detailBoost: number,
): void {
  if (samples.length < 2) return;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (let pass = 0; pass < 3; pass++) {
    ctx.strokeStyle = `rgba(${ink[0]}, ${ink[1]}, ${ink[2]}, ${boostAlpha((0.04 + pass * 0.02) * coalesce, detailBoost)})`;
    ctx.beginPath();
    ctx.moveTo(samples[0].x + (rng() - 0.5), samples[0].y + (rng() - 0.5));
    const end = Math.max(2, Math.floor(samples.length * (0.4 + coalesce * 0.5)));
    for (let i = 1; i < end; i++) {
      ctx.lineWidth = samples[i].w * 0.45 * pixelScale;
      ctx.lineTo(samples[i].x + (rng() - 0.5) * 1.5, samples[i].y + (rng() - 0.5) * 1.5);
    }
    ctx.lineTo(anchorX + (rng() - 0.5), anchorY + (rng() - 0.5));
    ctx.stroke();
  }
  ctx.restore();
}

function drawMarginTicks(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  count: number,
  ink: [number, number, number],
  coalesce: number,
  pixelScale: number,
  detailBoost: number,
): void {
  ctx.save();
  ctx.strokeStyle = `rgba(${ink[0]}, ${ink[1]}, ${ink[2]}, ${boostAlpha(0.35 + coalesce * 0.35, detailBoost)})`;
  ctx.lineWidth = 0.65 * pixelScale;
  for (let i = 0; i < 3; i++) {
    const filled = i < count;
    const ty = y + i * 5 * pixelScale;
    ctx.beginPath();
    ctx.moveTo(x, ty);
    ctx.lineTo(x + (filled ? 5 : 3) * pixelScale, ty);
    ctx.stroke();
  }
  ctx.restore();
}

/** Notebook page: grid gesture + Leonardo answer scene for internal climate. */
export function drawSketchMark(
  ctx: CanvasRenderingContext2D,
  seed: FormSeed,
  width: number,
  height: number,
  options: SketchMarkOptions,
): void {
  const { coalesce, pathProgress = 1, tone = 'notebook', contentScale = 1 } = options;
  const detailBoost = options.detailBoost ?? 1;
  const pixelScale = options.pixelScale ?? Math.min(width, height) / THUMB_REF_MIN;
  const breathCycles = options.breathCycles ?? (coalesce >= 1 ? 3 : Math.floor(coalesce * 3));
  const renderSeed = markRenderSeed(seed);
  const answer = resolveSceneAnswer(seed.weatherId, renderSeed);
  const ink = tone === 'postcard' ? POSTCARD_INK : answer.ink;
  const rng = mulberry32(renderSeed);

  if (tone === 'postcard') fillPostcardSand(ctx, width, height, renderSeed);
  else fillPaper(ctx, width, height, renderSeed);

  const marginBase = tone === 'postcard' ? 0.055 : 0.1;
  const margin = (Math.min(width, height) * marginBase) / contentScale;
  const drawW = width - margin * 2;
  const drawH = height - margin * 2.1;
  const padX = margin;
  const padY = margin * 1.08;

  const [gcx, gcy] = seed.gridCentroid;
  const anchorX = padX + gcx * drawW;
  const anchorY = padY + gcy * drawH * 0.75;

  drawArchedFrame(ctx, padX, padY, drawW, drawH, ink, coalesce, rng, pixelScale, detailBoost);

  const rawPoints = seed.gesturePoints.length
    ? seed.gesturePoints
    : [{ x: gcx, y: gcy, t: 0, pressure: 0.5, dwell: 80 }];
  const sliced = sliceByProgress(rawPoints, pathProgress);
  const samples = mapPath(sliced, padX, padY, drawW, drawH);

  if (coalesce > 0.12) {
    drawGestureToAnswer(
      ctx,
      samples,
      anchorX,
      anchorY,
      ink,
      coalesce,
      mulberry32(renderSeed ^ 0x7001),
      pixelScale,
      detailBoost,
    );
  }

  if (coalesce > 0.2) {
    drawLeonardoAnswer(ctx, seed, width, height, {
      coalesce,
      renderSeed,
      anchorX: gcx,
      anchorY: gcy * 0.82,
      pathSpread: seed.pathSpread,
      ink,
      pixelScale,
      detailBoost,
    });
  }

  drawMarginTicks(
    ctx,
    padX + drawW + 2 * pixelScale,
    padY + drawH * 0.7,
    breathCycles,
    ink,
    coalesce,
    pixelScale,
    detailBoost,
  );
}

export function drawSketchMarkToCanvas(
  canvas: HTMLCanvasElement,
  seed: FormSeed,
  options: SketchMarkOptions,
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const w = canvas.clientWidth || canvas.width / dpr || canvas.width;
  const h = canvas.clientHeight || canvas.height / dpr || canvas.height;
  if (w <= 0 || h <= 0) return;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  drawSketchMark(ctx, seed, w, h, options);
}

export { resolveSceneAnswer } from './sketchScenes';
