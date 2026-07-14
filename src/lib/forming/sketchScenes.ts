import type { FormSeed } from './types';
import { mulberry32 } from './seed';

export type SceneKind = 'sunrise' | 'bee' | 'flower' | 'rabbit_meadow' | 'meadow' | 'bud';

export type SceneAnswer = {
  kind: SceneKind;
  /** Short Leonardo-voice response to internal climate — bliss-enhancing only */
  voice: string;
  ink: [number, number, number];
  searchPasses: number;
};

const SCENE_BY_WEATHER: Record<string, SceneAnswer> = {
  sympathetic_heat_dome: {
    kind: 'sunrise',
    voice: 'A sunrise — warm light gathers on the hill.',
    ink: [68, 42, 28],
    searchPasses: 5,
  },
  scattered_atmospheric_drift: {
    kind: 'bee',
    voice: 'A bee among flowers — the drift finds pollen and purpose.',
    ink: [54, 48, 38],
    searchPasses: 6,
  },
  high_resonant_thermal_coherence: {
    kind: 'flower',
    voice: 'A flower open — coherence in full bloom.',
    ink: [62, 48, 34],
    searchPasses: 4,
  },
  dewpoint_restorative_slumber: {
    kind: 'rabbit_meadow',
    voice: 'A rabbit in the meadow — rest without hurry.',
    ink: [48, 46, 56],
    searchPasses: 5,
  },
  vaporous_resonance_drift: {
    kind: 'meadow',
    voice: 'A quiet meadow — room to breathe and choose.',
    ink: [52, 50, 44],
    searchPasses: 5,
  },
  autonomic_stillness: {
    kind: 'bud',
    voice: 'A closed bud — stillness before the first true mark.',
    ink: [76, 70, 62],
    searchPasses: 3,
  },
};

const DEFAULT_SCENE = SCENE_BY_WEATHER.vaporous_resonance_drift;

export function getSceneAnswer(weatherId: string): SceneAnswer {
  return SCENE_BY_WEATHER[weatherId] ?? DEFAULT_SCENE;
}

type DrawCtx = {
  ctx: CanvasRenderingContext2D;
  ink: [number, number, number];
  alpha: number;
  scale: number;
  ox: number;
  oy: number;
  rng: () => number;
};

function stroke(d: DrawCtx, lineWidth: number, fn: () => void): void {
  const { ctx, ink, alpha, ox, oy } = d;
  ctx.save();
  ctx.translate(ox, oy);
  ctx.strokeStyle = `rgba(${ink[0]}, ${ink[1]}, ${ink[2]}, ${alpha})`;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  fn();
  ctx.restore();
}

function drawSunrise(d: DrawCtx): void {
  const s = d.scale;
  stroke(d, 0.7 * s, () => {
    const { ctx, rng } = d;
    ctx.beginPath();
    ctx.moveTo(-28 * s, 8 * s);
    ctx.quadraticCurveTo(-8 * s + (rng() - 0.5), -2 * s, 12 * s, 6 * s);
    ctx.quadraticCurveTo(22 * s, 10 * s, 32 * s, 7 * s);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(4 * s, 6 * s, 9 * s, Math.PI * 1.05, Math.PI * 2.05);
    ctx.stroke();
    for (let i = 0; i < 5; i++) {
      const ang = Math.PI * 1.15 + (i / 4) * Math.PI * 0.75;
      ctx.beginPath();
      ctx.moveTo(4 * s + Math.cos(ang) * 10 * s, 6 * s + Math.sin(ang) * 10 * s);
      ctx.lineTo(4 * s + Math.cos(ang) * 14 * s, 6 * s + Math.sin(ang) * 14 * s);
      ctx.stroke();
    }
  });
}

function drawFlower(d: DrawCtx): void {
  const s = d.scale;
  stroke(d, 0.65 * s, () => {
    const { ctx, rng } = d;
    ctx.beginPath();
    ctx.moveTo(0, 14 * s);
    ctx.lineTo(0, -6 * s);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(-6 * s, 2 * s, 4 * s, 2 * s, -0.5, 0, Math.PI * 2);
    ctx.stroke();
    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2 + (rng() - 0.5) * 0.15;
      ctx.beginPath();
      ctx.ellipse(
        Math.cos(ang) * 5 * s,
        -8 * s + Math.sin(ang) * 3 * s,
        5 * s,
        3 * s,
        ang,
        0,
        Math.PI * 2,
      );
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(0, -8 * s, 2.5 * s, 0, Math.PI * 2);
    ctx.stroke();
  });
}

function drawBee(d: DrawCtx): void {
  drawFlower({ ...d, scale: d.scale * 0.85, oy: d.oy + 2 * d.scale });
  const s = d.scale;
  stroke(d, 0.55 * s, () => {
    const { ctx } = d;
    const bx = 14 * s;
    const by = -10 * s;
    ctx.beginPath();
    ctx.ellipse(bx, by, 4 * s, 2.5 * s, 0.3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(bx - 2 * s, by - 1 * s);
    ctx.lineTo(bx - 2 * s, by + 1 * s);
    ctx.moveTo(bx + 1 * s, by - 1 * s);
    ctx.lineTo(bx + 1 * s, by + 1 * s);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(bx - 3 * s, by - 4 * s, 5 * s, 2 * s, -0.4, 0, Math.PI * 2);
    ctx.ellipse(bx + 2 * s, by - 4 * s, 5 * s, 2 * s, 0.4, 0, Math.PI * 2);
    ctx.stroke();
  });
}

function drawRabbitMeadow(d: DrawCtx): void {
  const s = d.scale;
  stroke(d, 0.5 * s, () => {
    const { ctx, rng } = d;
    for (let i = 0; i < 7; i++) {
      const gx = -24 * s + i * 7 * s + (rng() - 0.5) * 2;
      ctx.beginPath();
      ctx.moveTo(gx, 12 * s);
      ctx.quadraticCurveTo(gx + (rng() - 0.5) * 2, 4 * s, gx + 1, 2 * s);
      ctx.stroke();
    }
  });
  stroke(d, 0.75 * s, () => {
    const { ctx } = d;
    const rx = -4 * s;
    const ry = 8 * s;
    ctx.beginPath();
    ctx.ellipse(rx, ry, 7 * s, 5 * s, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(rx - 3 * s, ry - 4 * s);
    ctx.quadraticCurveTo(rx - 4 * s, ry - 14 * s, rx - 2 * s, ry - 12 * s);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(rx + 3 * s, ry - 4 * s);
    ctx.quadraticCurveTo(rx + 4 * s, ry - 14 * s, rx + 2 * s, ry - 12 * s);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(rx + 5 * s, ry - 1 * s, 0.8 * s, 0, Math.PI * 2);
    ctx.stroke();
  });
}

function drawMeadow(d: DrawCtx): void {
  const s = d.scale;
  stroke(d, 0.55 * s, () => {
    const { ctx, rng } = d;
    ctx.beginPath();
    ctx.moveTo(-30 * s, 10 * s);
    ctx.quadraticCurveTo(-10 * s, 2 * s, 8 * s, 8 * s);
    ctx.quadraticCurveTo(20 * s, 12 * s, 30 * s, 6 * s);
    ctx.stroke();
    for (let i = 0; i < 5; i++) {
      const fx = -18 * s + i * 9 * s;
      ctx.beginPath();
      ctx.moveTo(fx, 8 * s);
      ctx.lineTo(fx, 3 * s);
      ctx.arc(fx, 2 * s, 1.5 * s, 0, Math.PI * 2);
      ctx.stroke();
    }
    for (let i = 0; i < 6; i++) {
      const gx = -22 * s + i * 8 * s + (rng() - 0.5);
      ctx.beginPath();
      ctx.moveTo(gx, 12 * s);
      ctx.lineTo(gx + (rng() - 0.5), 6 * s);
      ctx.stroke();
    }
  });
}

function drawBud(d: DrawCtx): void {
  const s = d.scale;
  stroke(d, 0.6 * s, () => {
    const { ctx } = d;
    ctx.beginPath();
    ctx.moveTo(0, 16 * s);
    ctx.lineTo(0, -2 * s);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, -2 * s);
    ctx.quadraticCurveTo(-5 * s, -10 * s, 0, -14 * s);
    ctx.quadraticCurveTo(5 * s, -10 * s, 0, -2 * s);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(-5 * s, 4 * s, 3 * s, 1.5 * s, -0.4, 0, Math.PI * 2);
    ctx.stroke();
  });
}

function drawSceneKind(d: DrawCtx, kind: SceneKind): void {
  switch (kind) {
    case 'sunrise':
      drawSunrise(d);
      break;
    case 'bee':
      drawBee(d);
      break;
    case 'flower':
      drawFlower(d);
      break;
    case 'rabbit_meadow':
      drawRabbitMeadow(d);
      break;
    case 'meadow':
      drawMeadow(d);
      break;
    case 'bud':
      drawBud(d);
      break;
  }
}

export type SceneDrawOptions = {
  coalesce: number;
  renderSeed: number;
  /** Grid centroid 0–1 — where the answer anchors on the page */
  anchorX: number;
  anchorY: number;
  pathSpread: number;
};

/**
 * Leonardo-voice answer: a discernible bliss-enhancing scene tied to internal climate.
 * Pentimenti passes then committed line — placement from grid centroid.
 */
export function drawLeonardoAnswer(
  ctx: CanvasRenderingContext2D,
  form: FormSeed,
  canvasW: number,
  canvasH: number,
  opts: SceneDrawOptions,
): void {
  const answer = getSceneAnswer(form.weatherId);
  const { coalesce, renderSeed, anchorX, anchorY, pathSpread } = opts;

  const margin = Math.min(canvasW, canvasH) * 0.12;
  const drawW = canvasW - margin * 2;
  const drawH = canvasH - margin * 2;
  const ox = margin + anchorX * drawW;
  const oy = margin + anchorY * drawH * 0.92;
  const scale = (0.55 + coalesce * 0.45) * (0.85 + pathSpread * 0.35);
  const rot = ((renderSeed % 360) / 360) * 0.28 - 0.14;

  ctx.save();
  ctx.translate(ox, oy);
  ctx.rotate(rot);
  ctx.translate(-ox, -oy);

  for (let pass = 0; pass < answer.searchPasses; pass++) {
    const passRng = mulberry32(renderSeed + pass * 6271);
    const isFinal = pass === answer.searchPasses - 1;
    const d: DrawCtx = {
      ctx,
      ink: answer.ink,
      alpha: isFinal ? 0.32 + coalesce * 0.55 : 0.05 + passRng() * 0.06,
      scale: scale * (isFinal ? 1 : 0.92 + passRng() * 0.08),
      ox: ox + Math.cos(passRng() * Math.PI * 2) * (isFinal ? 0 : 2 + pass),
      oy: oy + Math.sin(passRng() * Math.PI * 2) * (isFinal ? 0 : 2 + pass),
      rng: passRng,
    };
    if (!isFinal && passRng() > coalesce * 0.85 + 0.1) continue;
    drawSceneKind(d, answer.kind);
  }

  ctx.restore();
}
