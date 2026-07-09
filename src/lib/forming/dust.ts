import type { GesturePoint } from './types';

export type DustParticle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  mass: number;
  age: number;
};

export class DustField {
  particles: DustParticle[] = [];
  gestureLog: GesturePoint[] = [];

  addContact(normX: number, normY: number, dwellMs: number, pressure = 0.6): void {
    const t = Date.now();
    this.gestureLog.push({
      x: normX,
      y: normY,
      t,
      pressure,
      dwell: dwellMs,
    });
    if (this.gestureLog.length > 200) this.gestureLog.shift();

    const count = 1 + Math.floor(dwellMs / 80);
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: normX + (Math.random() - 0.5) * 0.04,
        y: normY + (Math.random() - 0.5) * 0.04,
        vx: 0,
        vy: 0,
        mass: 0.4 + pressure * 0.6 + Math.min(dwellMs / 500, 0.5),
        age: 0,
      });
    }
    if (this.particles.length > 400) {
      this.particles.splice(0, this.particles.length - 400);
    }
  }

  update(
    dt: number,
    target: { x: number; y: number } | null,
    lag = 0.12,
    lift = 0,
    tighten = 0,
  ): void {
    for (const p of this.particles) {
      p.age += dt;
      if (target) {
        p.vx += (target.x - p.x) * lag * dt * 60;
        p.vy += (target.y - p.y) * lag * dt * 60;
      }
      p.vy -= lift * dt * 0.02;
      p.vx *= 1 - tighten * 0.08;
      p.vy *= 1 - tighten * 0.08;
      p.vx *= 0.92;
      p.vy *= 0.92;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
  }

  render(ctx: CanvasRenderingContext2D, w: number, h: number, alpha = 1): void {
    for (const p of this.particles) {
      const px = p.x * w;
      const py = p.y * h;
      const r = 1.2 + p.mass * 2.2;
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(196, 160, 68, ${0.25 * alpha * p.mass})`;
      ctx.fill();
    }
  }

  get count(): number {
    return this.particles.length;
  }

  clear(): void {
    this.particles = [];
    this.gestureLog = [];
  }
}
