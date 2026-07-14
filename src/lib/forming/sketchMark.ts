import type { FormSeed, GesturePoint } from './types';
import { mulberry32 } from './seed';

export type SketchMarkOptions = {
  coalesce: number;
  coherence?: number;
  breathCycles?: number;
  pathProgress?: number;
};

type WeatherSketch = {
  ink: [number, number, number];
  hatch: number;
  searchPasses: number;
  swirl: number;
};

type PathSample = {
  x: number;
  y: number;
  t: number;
  dwell: number;
  pressure: number;
  velocity: number;
};

const WEATHER_SKETCH: Record<string, WeatherSketch> = {
  sympathetic_heat_dome: { ink: [68, 42, 28], hatch: 0.9, searchPasses: 7, swirl: 0.85 },
  scattered_atmospheric_drift: { ink: [54, 48, 42], hatch: 0.65, searchPasses: 9, swirl: 1 },
  high_resonant_thermal_coherence: { ink: [62, 48, 34], hatch: 0.2, searchPasses: 4, swirl: 0.35 },
  dewpoint_restorative_slumber: { ink: [46, 44, 56], hatch: 0.45, searchPasses: 5, swirl: 0.55 },
  vaporous_resonance_drift: { ink: [52, 50, 46], hatch: 0.5, searchPasses: 6, swirl: 0.6 },
  autonomic_stillness: { ink: [76, 70, 62], hatch: 0.12, searchPasses: 3, swirl: 0.2 },
};

const DEFAULT_SKETCH = WEATHER_SKETCH.vaporous_resonance_drift;

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

function weatherStyle(weatherId: string): WeatherSketch {
  return WEATHER_SKETCH[weatherId] ?? DEFAULT_SKETCH;
}

function paperGrain(ctx: CanvasRenderingContext2D, w: number, h: number, seed: number): void {
  const rng = mulberry32(seed);
  ctx.save();
  for (let i = 0; i < Math.floor(w * h * 0.045); i++) {
    const x = rng() * w;
    const y = rng() * h;
    ctx.fillStyle = `rgba(${88 + rng() * 28}, ${78 + rng() * 18}, ${58 + rng() * 14}, ${0.012 + rng() * 0.028})`;
    ctx.fillRect(x, y, 1, 1);
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
  paperGrain(ctx, w, h, seed);
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

function buildPathSamples(
  points: GesturePoint[],
  padX: number,
  padY: number,
  drawW: number,
  drawH: number,
): PathSample[] {
  const sorted = sortByTime(points);
  return sorted.map((p, i) => {
    let velocity = 0.45;
    if (i > 0) {
      const prev = sorted[i - 1];
      const dx = p.x - prev.x;
      const dy = p.y - prev.y;
      const dt = Math.max(8, p.t - prev.t);
      velocity = Math.min(2.5, Math.sqrt(dx * dx + dy * dy) / dt * 120);
    }
    return {
      x: padX + p.x * drawW,
      y: padY + p.y * drawH,
      t: p.t,
      dwell: p.dwell,
      pressure: p.pressure,
      velocity,
    };
  });
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
): void {
  ctx.save();
  ctx.strokeStyle = `rgba(${ink[0]}, ${ink[1]}, ${ink[2]}, ${0.08 + coalesce * 0.12})`;
  ctx.lineWidth = 0.6;
  const left = padX + drawW * 0.08;
  const right = padX + drawW * 0.92;
  const base = padY + drawH * 0.92;
  const apex = padY + drawH * 0.06;
  ctx.beginPath();
  ctx.moveTo(left + (rng() - 0.5) * 2, base);
  ctx.quadraticCurveTo(
    padX + drawW * 0.5 + (rng() - 0.5) * 4,
    apex + (rng() - 0.5) * 3,
    right + (rng() - 0.5) * 2,
    base,
  );
  ctx.stroke();
  ctx.restore();
}

function drawConstructionStudy(
  ctx: CanvasRenderingContext2D,
  locusX: number,
  locusY: number,
  spread: number,
  ink: [number, number, number],
  coalesce: number,
  rng: () => number,
): void {
  const r = (0.12 + spread * 0.35) * 48;
  ctx.save();
  ctx.strokeStyle = `rgba(${ink[0]}, ${ink[1]}, ${ink[2]}, ${0.05 + coalesce * 0.07})`;
  ctx.lineWidth = 0.35;
  ctx.beginPath();
  ctx.moveTo(locusX, locusY - r * 1.1);
  ctx.lineTo(locusX + (rng() - 0.5), locusY + r * 1.05);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(locusX + (rng() - 0.5) * 2, locusY + (rng() - 0.5) * 2, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawTaperedSegment(
  ctx: CanvasRenderingContext2D,
  a: PathSample,
  b: PathSample,
  ink: [number, number, number],
  alpha: number,
  lineScale: number,
  ox: number,
  oy: number,
): void {
  const dwellW = 0.55 + Math.min(a.dwell / 350, 1.2) + a.pressure * 0.3;
  const speedW = 1.35 - Math.min(a.velocity, 1.1) * 0.65;
  const w = dwellW * speedW * lineScale;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = `rgba(${ink[0]}, ${ink[1]}, ${ink[2]}, ${alpha})`;
  ctx.lineWidth = Math.max(0.35, w);
  ctx.beginPath();
  ctx.moveTo(a.x + ox, a.y + oy);
  ctx.lineTo(b.x + ox, b.y + oy);
  ctx.stroke();
  ctx.restore();
}

type InkPassOpts = {
  partial: number;
  skipChance: number;
  offset: number;
  angle: number;
  alpha: number;
  lineScale: number;
};

function drawInkPass(
  ctx: CanvasRenderingContext2D,
  samples: PathSample[],
  ink: [number, number, number],
  opts: InkPassOpts,
  rng: () => number,
): void {
  if (samples.length < 2) {
    if (samples.length === 1) {
      const p = samples[0];
      ctx.beginPath();
      ctx.arc(
        p.x + Math.cos(opts.angle) * opts.offset,
        p.y + Math.sin(opts.angle) * opts.offset,
        1.8 * opts.lineScale,
        0,
        Math.PI * 2,
      );
      ctx.fillStyle = `rgba(${ink[0]}, ${ink[1]}, ${ink[2]}, ${opts.alpha})`;
      ctx.fill();
    }
    return;
  }

  const end = Math.max(2, Math.floor(samples.length * opts.partial));
  const ox = Math.cos(opts.angle) * opts.offset;
  const oy = Math.sin(opts.angle) * opts.offset;

  for (let i = 1; i < end; i++) {
    if (rng() < opts.skipChance) continue;
    drawTaperedSegment(ctx, samples[i - 1], samples[i], ink, opts.alpha, opts.lineScale, ox, oy);
  }
}

function drawSearchingArcs(
  ctx: CanvasRenderingContext2D,
  samples: PathSample[],
  ink: [number, number, number],
  count: number,
  coalesce: number,
  rng: () => number,
): void {
  if (samples.length < 3) return;
  ctx.save();
  ctx.strokeStyle = `rgba(${ink[0]}, ${ink[1]}, ${ink[2]}, ${0.06 + coalesce * 0.08})`;
  ctx.lineWidth = 0.45;
  ctx.lineCap = 'round';
  for (let n = 0; n < count; n++) {
    const idx = Math.floor(rng() * (samples.length - 2));
    const p = samples[idx];
    const r = 4 + rng() * 14;
    const a0 = rng() * Math.PI * 2;
    const sweep = (0.4 + rng() * 0.9) * Math.PI;
    ctx.beginPath();
    ctx.arc(p.x + (rng() - 0.5) * 6, p.y + (rng() - 0.5) * 6, r, a0, a0 + sweep);
    ctx.stroke();
  }
  ctx.restore();
}

function drawKineticSwirls(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  spread: number,
  swirlAmt: number,
  coherence: number,
  coalesce: number,
  ink: [number, number, number],
  rng: () => number,
): void {
  const loops = Math.floor((1 - coherence / 100) * 8 * swirlAmt + spread * 12 + 2);
  const density = coalesce * (0.35 + swirlAmt * 0.45);
  if (density < 0.08) return;

  ctx.save();
  ctx.lineCap = 'round';
  for (let i = 0; i < loops; i++) {
    const px = cx + (rng() - 0.5) * 38 * (0.5 + spread);
    const py = cy + (rng() - 0.5) * 28 * (0.5 + spread);
    const turns = 0.6 + rng() * 1.8;
    const r0 = 2 + rng() * 10;
    const steps = 8 + Math.floor(rng() * 10);
    ctx.strokeStyle = `rgba(${ink[0]}, ${ink[1]}, ${ink[2]}, ${(0.04 + rng() * 0.07) * density})`;
    ctx.lineWidth = 0.35 + rng() * 0.55;
    ctx.beginPath();
    for (let s = 0; s <= steps; s++) {
      const u = s / steps;
      const ang = u * turns * Math.PI * 2;
      const r = r0 + u * (6 + rng() * 8);
      const x = px + Math.cos(ang) * r;
      const y = py + Math.sin(ang) * r * 0.85;
      if (s === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.restore();
}

function drawScribbledMass(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  ink: [number, number, number],
  intensity: number,
  coalesce: number,
  rng: () => number,
): void {
  if (intensity < 0.15 || coalesce < 0.25) return;
  ctx.save();
  ctx.lineCap = 'round';
  const strokes = Math.floor(12 + intensity * 28 * coalesce);
  for (let i = 0; i < strokes; i++) {
    const sx = x + rng() * w;
    const sy = y + rng() * h;
    const len = 3 + rng() * 12;
    const ang = rng() * Math.PI * 2;
    ctx.strokeStyle = `rgba(${ink[0]}, ${ink[1]}, ${ink[2]}, ${(0.03 + rng() * 0.06) * intensity * coalesce})`;
    ctx.lineWidth = 0.35 + rng() * 0.5;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + Math.cos(ang) * len, sy + Math.sin(ang) * len);
    ctx.stroke();
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
  rng: () => number,
): void {
  const sweep = (coherence / 100) * Math.PI * 2 * coalesce;
  ctx.save();
  ctx.strokeStyle = `rgba(${ink[0]}, ${ink[1]}, ${ink[2]}, ${0.1 + coalesce * 0.2})`;
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.arc(cx + (rng() - 0.5), cy + (rng() - 0.5), radius, 0, Math.PI * 2);
  ctx.stroke();
  if (sweep > 0.05) {
    ctx.strokeStyle = `rgba(${ink[0]}, ${ink[1]}, ${ink[2]}, ${0.25 + coalesce * 0.35})`;
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, -Math.PI / 2, -Math.PI / 2 + sweep);
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
): void {
  ctx.save();
  ctx.strokeStyle = `rgba(${ink[0]}, ${ink[1]}, ${ink[2]}, ${0.35 + coalesce * 0.35})`;
  ctx.lineWidth = 0.7;
  for (let i = 0; i < 3; i++) {
    const filled = i < count;
    const ty = y + i * 5;
    ctx.beginPath();
    ctx.moveTo(x, ty);
    ctx.lineTo(x + (filled ? 5 : 3), ty + (filled ? 0 : 1));
    ctx.stroke();
  }
  ctx.restore();
}

/** Da Vinci early-sketch logic: searching hand, swirls, tapered ink — unique per session. */
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
  const renderSeed = markRenderSeed(seed);
  const rng = mulberry32(renderSeed);

  fillPaper(ctx, width, height, renderSeed);

  const margin = Math.min(width, height) * 0.09;
  const drawW = width - margin * 2;
  const drawH = height - margin * 2.15;
  const padX = margin;
  const padY = margin * 1.1;
  const cx = width / 2;

  const rawPoints = seed.gesturePoints.length
    ? seed.gesturePoints
    : [{ x: 0.5, y: 0.5, t: 0, pressure: 0.5, dwell: 80 }];
  const sliced = sliceByProgress(rawPoints, pathProgress);
  const samples = buildPathSamples(sliced, padX, padY, drawW, drawH);

  const [gcx, gcy] = seed.gridCentroid;
  const locusX = padX + gcx * drawW;
  const locusY = padY + gcy * drawH;

  drawArchedFrame(ctx, padX, padY, drawW, drawH, style.ink, coalesce, rng);
  drawConstructionStudy(ctx, locusX, locusY, seed.pathSpread, style.ink, coalesce, rng);

  const ringR = Math.min(drawW, drawH) * 0.42;
  drawCoherenceRing(ctx, cx, padY + drawH * 0.48, ringR, coherence, coalesce, style.ink, rng);

  const swirlY = padY + drawH * (0.52 + gcy * 0.28);
  const swirlX = padX + drawW * (0.35 + gcx * 0.3);
  drawKineticSwirls(
    ctx,
    swirlX,
    swirlY,
    seed.pathSpread,
    style.swirl,
    coherence,
    coalesce,
    style.ink,
    mulberry32(renderSeed ^ 0x9001),
  );

  const shadowX = gcx > 0.5 ? padX : padX + drawW * 0.55;
  const shadowY = padY + drawH * 0.55;
  drawScribbledMass(
    ctx,
    shadowX,
    shadowY,
    drawW * 0.38,
    drawH * 0.35,
    style.ink,
    style.hatch * (1 - coherence / 120),
    coalesce,
    mulberry32(renderSeed ^ 0x9002),
  );

  for (let pass = 0; pass < style.searchPasses; pass++) {
    const passRng = mulberry32(renderSeed + pass * 7919 + 104729);
    const angle = passRng() * Math.PI * 2;
    const offset = 1.2 + pass * (0.55 + passRng() * 0.35);
    const partial = 0.55 + passRng() * 0.42;
    const isGhost = pass < style.searchPasses - 1;
    drawInkPass(
      ctx,
      samples,
      style.ink,
      {
        partial,
        skipChance: isGhost ? 0.12 + passRng() * 0.18 : 0.04,
        offset: isGhost ? offset : offset * 0.25,
        angle: isGhost ? angle : angle + 0.08,
        alpha: isGhost ? 0.05 + passRng() * 0.07 : 0.28 + coalesce * 0.45,
        lineScale: isGhost ? 0.75 + passRng() * 0.2 : 1 + coalesce * 0.35,
      },
      passRng,
    );
  }

  drawSearchingArcs(
    ctx,
    samples,
    style.ink,
    Math.floor(3 + style.searchPasses * 0.6),
    coalesce,
    mulberry32(renderSeed ^ 0x9003),
  );

  drawMarginTicks(ctx, padX + drawW + 2, padY + drawH * 0.72, breathCycles, style.ink, coalesce);
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
