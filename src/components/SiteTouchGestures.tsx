import React, { ReactNode, useEffect, useRef, useState } from "react";

const RELOAD_DISTANCE = 110;

/** Global mobile gestures. Page zoom remains native; installed PWAs receive pull-to-reload. */
export default function SiteTouchGestures({ children }: { children: ReactNode }) {
  const [pull, setPull] = useState(0);
  const pullRef = useRef(0);
  const startRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const reset = () => {
      startRef.current = null;
      pullRef.current = 0;
      setPull(0);
    };

    const onStart = (event: TouchEvent) => {
      if (event.touches.length !== 1 || window.scrollY > 0) return reset();
      const target = event.target as Element | null;
      if (target?.closest('[role="dialog"], input, textarea, select, [contenteditable="true"], [data-no-site-gesture]')) return reset();
      const touch = event.touches[0];
      startRef.current = { x: touch.clientX, y: touch.clientY };
    };

    const onMove = (event: TouchEvent) => {
      const start = startRef.current;
      if (!start || event.touches.length !== 1 || window.scrollY > 0) return;
      const touch = event.touches[0];
      const dy = touch.clientY - start.y;
      const dx = Math.abs(touch.clientX - start.x);
      if (dy <= 6 || dx > dy) return;
      event.preventDefault();
      const resisted = Math.min(92, Math.sqrt(dy) * 7.3);
      pullRef.current = dy;
      setPull(resisted);
    };

    const onEnd = () => {
      const shouldReload = pullRef.current >= RELOAD_DISTANCE;
      reset();
      if (shouldReload) window.location.reload();
    };

    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onEnd, { passive: true });
    window.addEventListener("touchcancel", reset, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
      window.removeEventListener("touchcancel", reset);
    };
  }, []);

  const ready = pullRef.current >= RELOAD_DISTANCE;
  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none fixed left-1/2 top-0 z-[120] -translate-x-1/2 rounded-b-full border border-current/10 bg-background/90 px-5 py-2 font-mono text-[10px] uppercase tracking-[0.16em] shadow-sm backdrop-blur-md transition-opacity"
        style={{
          opacity: pull > 8 ? 1 : 0,
          transform: `translate(-50%, ${pull - 48}px)`,
        }}
      >
        <span className="mr-2 inline-block" style={{ transform: `rotate(${Math.min(180, pull * 2)}deg)` }}>↓</span>
        {ready ? "Release to reload" : "Pull to reload"}
      </div>
      {children}
    </>
  );
}
