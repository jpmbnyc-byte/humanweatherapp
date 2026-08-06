/** Run after first paint — short idle timeout so optional work does not block for seconds. */
export function runWhenIdle(fn: () => void, timeoutMs = 800): void {
  if (typeof window === 'undefined') return;
  if ('requestIdleCallback' in window) {
    requestIdleCallback(fn, { timeout: timeoutMs });
  } else {
    setTimeout(fn, Math.min(timeoutMs, 300));
  }
}

/** Run after the next paint without waiting for idle (critical path). */
export function runAfterFirstPaint(fn: () => void): void {
  if (typeof window === 'undefined') return;
  requestAnimationFrame(() => {
    requestAnimationFrame(() => void fn());
  });
}
