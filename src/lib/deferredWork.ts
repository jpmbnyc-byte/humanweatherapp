/** Run after first paint — avoids competing with hydration on slow mobile links. */
export function runWhenIdle(fn: () => void, timeoutMs = 2500): void {
  if (typeof window === 'undefined') return;
  if ('requestIdleCallback' in window) {
    requestIdleCallback(fn, { timeout: timeoutMs });
  } else {
    setTimeout(fn, 400);
  }
}
