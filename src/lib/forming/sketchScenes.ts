import type { FormSeed } from './types';
import { mulberry32 } from './seed';

export type SceneKind =
  | 'sunrise_hills'
  | 'sun_on_water'
  | 'dawn_radiance'
  | 'bee_flower'
  | 'butterfly'
  | 'swallow_pair'
  | 'flower_open'
  | 'lily'
  | 'wild_rose'
  | 'rabbit_meadow'
  | 'resting_bird'
  | 'lamb_rest'
  | 'meadow'
  | 'meadow_stream'
  | 'lone_tree'
  | 'bud'
  | 'seedling'
  | 'quiet_horizon';

export type SceneVariant = {
  kind: SceneKind;
  /** Short artistic caption — Leonardo notebook tone, not spoken */
  caption: string;
  /** Psalm-like prose line correlating to this sketch */
  prose: string;
};

type WeatherSceneSet = {
  ink: [number, number, number];
  searchPasses: number;
  variants: [SceneVariant, SceneVariant, SceneVariant];
};

const SCENES_BY_WEATHER: Record<string, WeatherSceneSet> = {
  sympathetic_heat_dome: {
    ink: [68, 42, 28],
    searchPasses: 5,
    variants: [
      {
        kind: 'sunrise_hills',
        caption: 'Sunrise over hills',
        prose: 'Light rises without hurry; the warm field receives what it did not earn.',
      },
      {
        kind: 'sun_on_water',
        caption: 'Sun upon still water',
        prose: 'The same heat that stirs you also glitters — witnessed, it softens into gold.',
      },
      {
        kind: 'dawn_radiance',
        caption: 'Dawn radiance',
        prose: 'Morning does not ask you to be ready. It arrives, and you are invited.',
      },
    ],
  },
  scattered_atmospheric_drift: {
    ink: [54, 48, 38],
    searchPasses: 6,
    variants: [
      {
        kind: 'bee_flower',
        caption: 'Bee among flowers',
        prose: 'Small hungers find small sweetness; the drift may land where it is fed.',
      },
      {
        kind: 'butterfly',
        caption: 'Butterfly over bloom',
        prose: 'What flutters need not settle at once. The air itself can hold you kindly.',
      },
      {
        kind: 'swallow_pair',
        caption: 'Swallows in open air',
        prose: 'Two arcs across the sky — even scattered motion has its grace and return.',
      },
    ],
  },
  high_resonant_thermal_coherence: {
    ink: [62, 48, 34],
    searchPasses: 4,
    variants: [
      {
        kind: 'flower_open',
        caption: 'Flower in full open',
        prose: 'What opened in you today did not need forcing. Rest in the bloom you already are.',
      },
      {
        kind: 'lily',
        caption: 'Single lily',
        prose: 'One stem, one cup of light — coherence is enough when it is true.',
      },
      {
        kind: 'wild_rose',
        caption: 'Wild rose',
        prose: 'Soft edges, open heart; the field answers warmth with gentle abundance.',
      },
    ],
  },
  dewpoint_restorative_slumber: {
    ink: [48, 46, 56],
    searchPasses: 5,
    variants: [
      {
        kind: 'rabbit_meadow',
        caption: 'Rabbit in the meadow',
        prose: 'The low grass holds the small body; rest is allowed beneath the wide sky.',
      },
      {
        kind: 'resting_bird',
        caption: 'Bird at rest on branch',
        prose: 'Wings folded, breath slow — nothing is required of you in this hour.',
      },
      {
        kind: 'lamb_rest',
        caption: 'Lamb at rest',
        prose: 'Lie down where the earth is kind. Tomorrow will find you when it comes.',
      },
    ],
  },
  vaporous_resonance_drift: {
    ink: [52, 50, 44],
    searchPasses: 5,
    variants: [
      {
        kind: 'meadow',
        caption: 'Quiet meadow',
        prose: 'Neither driven nor heavy — room to breathe, room to choose your next step.',
      },
      {
        kind: 'meadow_stream',
        caption: 'Meadow and stream',
        prose: 'Water moves; the bank remains. You may be both the flow and the shore.',
      },
      {
        kind: 'lone_tree',
        caption: 'Tree on the hill',
        prose: 'Rooted and open to the air — equilibrium is not stillness but balance.',
      },
    ],
  },
  autonomic_stillness: {
    ink: [76, 70, 62],
    searchPasses: 3,
    variants: [
      {
        kind: 'bud',
        caption: 'Closed bud',
        prose: 'Before the first true mark, the page is holy in its emptiness.',
      },
      {
        kind: 'seedling',
        caption: 'First seedling',
        prose: 'Two small leaves toward light — potential without pressure to become.',
      },
      {
        kind: 'quiet_horizon',
        caption: 'Quiet horizon',
        prose: 'The line where earth meets sky waits with you, unhurried and undefended.',
      },
    ],
  },
};

const DEFAULT_SET = SCENES_BY_WEATHER.vaporous_resonance_drift;

export type ResolvedSceneAnswer = SceneVariant & {
  ink: [number, number, number];
  searchPasses: number;
  variantIndex: number;
};

function weatherSet(weatherId: string): WeatherSceneSet {
  return SCENES_BY_WEATHER[weatherId] ?? DEFAULT_SET;
}

/** Pick 1 of 3 variant sketches deterministically — same session always same answer. */
export function resolveSceneAnswer(weatherId: string, renderSeed: number): ResolvedSceneAnswer {
  const set = weatherSet(weatherId);
  const variantIndex = renderSeed % 3;
  const variant = set.variants[variantIndex];
  return { ...variant, ink: set.ink, searchPasses: set.searchPasses, variantIndex };
}

/** @deprecated use resolveSceneAnswer */
export function getSceneAnswer(weatherId: string, renderSeed = 0) {
  return resolveSceneAnswer(weatherId, renderSeed);
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

function drawSunriseHills(d: DrawCtx): void {
  const s = d.scale;
  stroke(d, 0.7 * s, () => {
    const { ctx, rng } = d;
    ctx.beginPath();
    ctx.moveTo(-28 * s, 8 * s);
    ctx.quadraticCurveTo(-8 * s, -2 * s, 12 * s, 6 * s);
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
    void rng;
  });
}

function drawSunOnWater(d: DrawCtx): void {
  const s = d.scale;
  stroke(d, 0.65 * s, () => {
    const { ctx } = d;
    ctx.beginPath();
    ctx.moveTo(-32 * s, 10 * s);
    ctx.lineTo(32 * s, 10 * s);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 4 * s, 8 * s, Math.PI * 1.08, Math.PI * 2.02);
    ctx.stroke();
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 8 * s - 4 * s, 12 * s);
      ctx.quadraticCurveTo(i * 8 * s, 14 * s, i * 8 * s + 4 * s, 12 * s);
      ctx.stroke();
    }
  });
}

function drawDawnRadiance(d: DrawCtx): void {
  const s = d.scale;
  stroke(d, 0.6 * s, () => {
    const { ctx } = d;
    ctx.beginPath();
    ctx.arc(0, 0, 11 * s, 0, Math.PI * 2);
    ctx.stroke();
    for (let i = 0; i < 8; i++) {
      const ang = (i / 8) * Math.PI * 2 - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(ang) * 13 * s, Math.sin(ang) * 13 * s);
      ctx.lineTo(Math.cos(ang) * 18 * s, Math.sin(ang) * 18 * s);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(-26 * s, 14 * s);
    ctx.lineTo(26 * s, 14 * s);
    ctx.stroke();
  });
}

function drawFlowerStem(d: DrawCtx, petals: number): void {
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
    for (let i = 0; i < petals; i++) {
      const ang = (i / petals) * Math.PI * 2 + (rng() - 0.5) * 0.12;
      ctx.beginPath();
      ctx.ellipse(Math.cos(ang) * 5 * s, -8 * s + Math.sin(ang) * 3 * s, 5 * s, 3 * s, ang, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(0, -8 * s, 2.5 * s, 0, Math.PI * 2);
    ctx.stroke();
  });
}

function drawBeeFlower(d: DrawCtx): void {
  drawFlowerStem({ ...d, scale: d.scale * 0.85, oy: d.oy + 2 * d.scale }, 6);
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

function drawButterfly(d: DrawCtx): void {
  drawFlowerStem({ ...d, scale: d.scale * 0.75, oy: d.oy + 4 * d.scale }, 5);
  const s = d.scale;
  stroke(d, 0.55 * s, () => {
    const { ctx } = d;
    ctx.beginPath();
    ctx.moveTo(0, -6 * s);
    ctx.lineTo(0, 2 * s);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(-8 * s, -4 * s, 7 * s, 5 * s, -0.3, 0, Math.PI * 2);
    ctx.ellipse(8 * s, -4 * s, 7 * s, 5 * s, 0.3, 0, Math.PI * 2);
    ctx.stroke();
  });
}

function drawSwallowPair(d: DrawCtx): void {
  const s = d.scale;
  stroke(d, 0.55 * s, () => {
    const { ctx } = d;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(side * 4 * s, -2 * s);
      ctx.quadraticCurveTo(side * 18 * s, -14 * s, side * 22 * s, 2 * s);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(side * 8 * s, -6 * s);
      ctx.lineTo(side * 12 * s, -2 * s);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(-20 * s, 10 * s);
    ctx.quadraticCurveTo(0, 4 * s, 20 * s, 10 * s);
    ctx.stroke();
  });
}

function drawLily(d: DrawCtx): void {
  const s = d.scale;
  stroke(d, 0.65 * s, () => {
    const { ctx } = d;
    ctx.beginPath();
    ctx.moveTo(0, 18 * s);
    ctx.lineTo(0, -4 * s);
    ctx.stroke();
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(0, -4 * s);
      ctx.quadraticCurveTo(side * 8 * s, -12 * s, side * 3 * s, -18 * s);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(-2 * s, -16 * s);
    ctx.lineTo(2 * s, -16 * s);
    ctx.stroke();
  });
}

function drawWildRose(d: DrawCtx): void {
  drawFlowerStem(d, 5);
  const s = d.scale;
  stroke(d, 0.45 * s, () => {
    const { ctx } = d;
    ctx.beginPath();
    ctx.moveTo(-10 * s, 0);
    ctx.quadraticCurveTo(-14 * s, -6 * s, -8 * s, -10 * s);
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
      ctx.quadraticCurveTo(gx, 4 * s, gx + 1, 2 * s);
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
    ctx.moveTo(rx + 3 * s, ry - 4 * s);
    ctx.quadraticCurveTo(rx + 4 * s, ry - 14 * s, rx + 2 * s, ry - 12 * s);
    ctx.stroke();
  });
}

function drawRestingBird(d: DrawCtx): void {
  const s = d.scale;
  stroke(d, 0.6 * s, () => {
    const { ctx } = d;
    ctx.beginPath();
    ctx.moveTo(-16 * s, 4 * s);
    ctx.quadraticCurveTo(0, -2 * s, 16 * s, 6 * s);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(2 * s, 2 * s, 5 * s, 4 * s, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(6 * s, 0);
    ctx.lineTo(10 * s, -3 * s);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-2 * s, 4 * s);
    ctx.quadraticCurveTo(-6 * s, 8 * s, -10 * s, 6 * s);
    ctx.stroke();
  });
}

function drawLambRest(d: DrawCtx): void {
  const s = d.scale;
  stroke(d, 0.6 * s, () => {
    const { ctx } = d;
    ctx.beginPath();
    ctx.moveTo(-18 * s, 10 * s);
    ctx.quadraticCurveTo(0, 6 * s, 18 * s, 10 * s);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(0, 8 * s, 10 * s, 5 * s, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(8 * s, 5 * s, 3 * s, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(10 * s, 4 * s);
    ctx.lineTo(13 * s, 2 * s);
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

function drawMeadowStream(d: DrawCtx): void {
  drawMeadow({ ...d, scale: d.scale * 0.95 });
  const s = d.scale;
  stroke(d, 0.5 * s, () => {
    const { ctx } = d;
    ctx.beginPath();
    ctx.moveTo(-20 * s, 14 * s);
    ctx.quadraticCurveTo(-4 * s, 8 * s, 12 * s, 12 * s);
    ctx.quadraticCurveTo(22 * s, 15 * s, 28 * s, 11 * s);
    ctx.stroke();
  });
}

function drawLoneTree(d: DrawCtx): void {
  const s = d.scale;
  stroke(d, 0.6 * s, () => {
    const { ctx } = d;
    ctx.beginPath();
    ctx.moveTo(-24 * s, 14 * s);
    ctx.quadraticCurveTo(0, 8 * s, 24 * s, 14 * s);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, 14 * s);
    ctx.lineTo(0, -2 * s);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, -6 * s, 10 * s, 0, Math.PI * 2);
    ctx.stroke();
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
  });
}

function drawSeedling(d: DrawCtx): void {
  const s = d.scale;
  stroke(d, 0.6 * s, () => {
    const { ctx } = d;
    ctx.beginPath();
    ctx.moveTo(0, 16 * s);
    ctx.lineTo(0, 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-8 * s, -8 * s, -10 * s, -4 * s);
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(8 * s, -8 * s, 10 * s, -4 * s);
    ctx.stroke();
  });
}

function drawQuietHorizon(d: DrawCtx): void {
  const s = d.scale;
  stroke(d, 0.55 * s, () => {
    const { ctx } = d;
    ctx.beginPath();
    ctx.moveTo(-32 * s, 6 * s);
    ctx.lineTo(32 * s, 6 * s);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-8 * s, 6 * s);
    ctx.lineTo(-8 * s, 2 * s);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, -4 * s, 2 * s, 0, Math.PI * 2);
    ctx.stroke();
  });
}

function drawSceneKind(d: DrawCtx, kind: SceneKind): void {
  switch (kind) {
    case 'sunrise_hills':
      drawSunriseHills(d);
      break;
    case 'sun_on_water':
      drawSunOnWater(d);
      break;
    case 'dawn_radiance':
      drawDawnRadiance(d);
      break;
    case 'bee_flower':
      drawBeeFlower(d);
      break;
    case 'butterfly':
      drawButterfly(d);
      break;
    case 'swallow_pair':
      drawSwallowPair(d);
      break;
    case 'flower_open':
      drawFlowerStem(d, 6);
      break;
    case 'lily':
      drawLily(d);
      break;
    case 'wild_rose':
      drawWildRose(d);
      break;
    case 'rabbit_meadow':
      drawRabbitMeadow(d);
      break;
    case 'resting_bird':
      drawRestingBird(d);
      break;
    case 'lamb_rest':
      drawLambRest(d);
      break;
    case 'meadow':
      drawMeadow(d);
      break;
    case 'meadow_stream':
      drawMeadowStream(d);
      break;
    case 'lone_tree':
      drawLoneTree(d);
      break;
    case 'bud':
      drawBud(d);
      break;
    case 'seedling':
      drawSeedling(d);
      break;
    case 'quiet_horizon':
      drawQuietHorizon(d);
      break;
  }
}

export type SceneDrawOptions = {
  coalesce: number;
  renderSeed: number;
  anchorX: number;
  anchorY: number;
  pathSpread: number;
  ink?: [number, number, number];
  contentScale?: number;
  pixelScale?: number;
  detailBoost?: number;
};

export function drawLeonardoAnswer(
  ctx: CanvasRenderingContext2D,
  form: FormSeed,
  canvasW: number,
  canvasH: number,
  opts: SceneDrawOptions,
): void {
  const answer = resolveSceneAnswer(form.weatherId, opts.renderSeed);
  const { coalesce, renderSeed, anchorX, anchorY, pathSpread } = opts;
  const ink = opts.ink ?? answer.ink;
  const pixelScale = opts.pixelScale ?? 1;
  const detailBoost = opts.detailBoost ?? 1;
  const contentScale = opts.contentScale ?? 1;

  const margin = Math.min(canvasW, canvasH) * 0.12 / contentScale;
  const drawW = canvasW - margin * 2;
  const drawH = canvasH - margin * 2;
  const ox = margin + anchorX * drawW;
  const oy = margin + anchorY * drawH * 0.92;
  const scale =
    (0.55 + coalesce * 0.45) * (0.85 + pathSpread * 0.35) * pixelScale * contentScale;
  const rot = ((renderSeed % 360) / 360) * 0.28 - 0.14;

  ctx.save();
  ctx.translate(ox, oy);
  ctx.rotate(rot);
  ctx.translate(-ox, -oy);

  for (let pass = 0; pass < answer.searchPasses; pass++) {
    const passRng = mulberry32(renderSeed + pass * 6271 + answer.variantIndex * 997);
    const isFinal = pass === answer.searchPasses - 1;
    const d: DrawCtx = {
      ctx,
      ink,
      alpha: isFinal
        ? Math.min(1, (0.32 + coalesce * 0.55) * detailBoost)
        : Math.min(1, (0.05 + passRng() * 0.06) * detailBoost),
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
