/** Inline boot splash shown while JS chunks load (no Tailwind required). */
export default function BootSplashFallback() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        padding: '1.5rem 0',
      }}
      aria-busy="true"
      aria-live="polite"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div
          style={{
            height: '1rem',
            width: '10rem',
            borderRadius: '0.25rem',
            background: 'rgba(196, 160, 68, 0.12)',
          }}
        />
        <div
          style={{
            height: '2.5rem',
            width: '16rem',
            maxWidth: '100%',
            borderRadius: '0.25rem',
            background: 'rgba(196, 160, 68, 0.12)',
          }}
        />
        <div
          style={{
            height: '1rem',
            width: '13rem',
            borderRadius: '0.25rem',
            background: 'rgba(196, 160, 68, 0.12)',
          }}
        />
      </div>
      <div
        style={{
          height: '18rem',
          width: '100%',
          borderRadius: '1rem',
          background: 'rgba(196, 160, 68, 0.06)',
        }}
      />
      <p
        style={{
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontSize: '0.875rem',
          fontStyle: 'italic',
          opacity: 0.5,
          textAlign: 'center',
          margin: 0,
        }}
      >
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
