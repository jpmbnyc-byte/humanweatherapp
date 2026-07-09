/** Inline boot splash shown while JS chunks load (no Tailwind required). */
export default function BootSplashFallback() {
  return (
    <div
      className="hw-view-enter flex flex-col gap-6 py-6"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="space-y-3 animate-pulse">
        <div className="h-4 w-40 rounded bg-accent/10" />
        <div className="h-10 w-64 max-w-full rounded bg-accent/10" />
        <div className="h-4 w-52 rounded bg-accent/10" />
      </div>
      <div className="h-72 w-full rounded-2xl bg-accent/5 animate-pulse" />
      <p className="font-serif text-sm italic opacity-50 text-center">
        Loading field station…
      </p>
    </div>
  );
}

declare global {
  interface Window {
    __hwBootStatus?: (message: string) => void;
  }
}

export function dismissBootSplash(): void {
  window.__hwBootStatus?.('Ready.');
  window.setTimeout(() => {
    document.getElementById('hw-boot')?.remove();
  }, 80);
}
