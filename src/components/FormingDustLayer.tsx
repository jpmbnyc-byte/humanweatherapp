import React, { useEffect, useRef } from 'react';
import { useFormingOptional } from '../lib/forming/FormingContext';

export default function FormingDustLayer() {
  const forming = useFormingOptional();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !forming) return;

    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      const phase = forming.breathPhase;
      const lift = phase === 'Inhale' ? 0.6 : 0;
      const tighten = phase === 'Exhale' ? 0.7 : 0;
      forming.dust.update(dt, null, forming.reduceMotion ? 0.25 : 0.12, lift, tighten);

      const ctx = canvas.getContext('2d');
      if (ctx) {
        const dpr = window.devicePixelRatio || 1;
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;
        if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
          canvas.width = w * dpr;
          canvas.height = h * dpr;
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }
        ctx.clearRect(0, 0, w, h);

        if (forming.stage === 'gathering' || forming.stage === 'breathing') {
          forming.dust.render(ctx, w, h, forming.stage === 'breathing' ? 0.85 : 1);
        } else if (forming.dust.count > 0) {
          forming.dust.render(ctx, w, h, 0.5);
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [forming]);

  if (!forming) return null;

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-20 pointer-events-none rounded-2xl"
      aria-hidden
    />
  );
}
