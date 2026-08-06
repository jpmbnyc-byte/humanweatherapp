/** Load display fonts after first paint — keeps iPhone first load on system fallbacks. */
export function scheduleDeferredFonts(): void {
  if (typeof window === 'undefined') return;
  if (document.querySelector('link[data-hw-fonts="true"]')) return;

  const load = () => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href =
      'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Red+Hat+Display:wght@400;500;600&display=swap';
    link.media = 'print';
    link.dataset.hwFonts = 'true';
    link.onload = () => {
      link.media = 'all';
      document.documentElement.classList.add('fonts-loaded');
    };
    document.head.appendChild(link);
  };

  if ('requestIdleCallback' in window) {
    requestIdleCallback(load, { timeout: 2000 });
  } else {
    setTimeout(load, 600);
  }
}
