/**
 * Production client entry — mounts App directly without TanStack Start (~100KB gzip saved).
 * Loaded from static index.html; dev still uses TanStack via vite dev.
 */
import { StrictMode, lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { scheduleDeferredFonts } from './lib/deferredFonts';
import BootSplashFallback from './components/BootSplashFallback';

const App = lazy(() => import('./App'));

function mount() {
  scheduleDeferredFonts();

  let mountEl = document.getElementById('app-mount');
  if (!mountEl) {
    mountEl = document.createElement('div');
    mountEl.id = 'app-mount';
    document.body.appendChild(mountEl);
  }

  createRoot(mountEl).render(
    <StrictMode>
      <Suspense fallback={<BootSplashFallback />}>
        <App />
      </Suspense>
    </StrictMode>,
  );
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mount, { once: true });
} else {
  mount();
}
