const DISMISS_KEY = 'hw-add-to-home-dismissed';

export type InstallPlatform = 'ios' | 'android';

export function isStandaloneDisplay(): boolean {
  if (typeof window === 'undefined') return false;
  const nav = navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: minimal-ui)').matches ||
    nav.standalone === true
  );
}

export function detectInstallPlatform(): InstallPlatform | null {
  if (typeof navigator === 'undefined') return null;
  const ua = navigator.userAgent;
  if (/iphone|ipad|ipod/i.test(ua)) return 'ios';
  if (/android/i.test(ua)) return 'android';
  return null;
}

export function isMobileInstallContext(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(max-width: 768px)').matches ||
    (window.matchMedia('(pointer: coarse)').matches && window.innerWidth < 1024)
  );
}

export function hasDismissedAddToHome(): boolean {
  try {
    return localStorage.getItem(DISMISS_KEY) === '1';
  } catch {
    return false;
  }
}

export function dismissAddToHome(): void {
  try {
    localStorage.setItem(DISMISS_KEY, '1');
  } catch {
    // private mode / storage blocked
  }
}

/** Whether to show install instructions on this visit (first load until dismissed). */
export function shouldOfferAddToHome(): boolean {
  if (typeof window === 'undefined') return false;
  if (isStandaloneDisplay()) return false;
  if (hasDismissedAddToHome()) return false;
  if (!isMobileInstallContext()) return false;
  return detectInstallPlatform() !== null;
}

export function addToHomeInstructions(platform: InstallPlatform): string[] {
  if (platform === 'ios') {
    return [
      'Tap the Share button at the bottom of Safari (square with an arrow pointing up).',
      'Scroll the menu and tap Add to Home Screen.',
      'Tap Add — Human Weather will open like an app from your Home Screen.',
    ];
  }
  return [
    'Tap the menu (⋮) in the top-right corner of Chrome.',
    'Tap Install app or Add to Home screen.',
    'Confirm — Human Weather will open full screen from your Home Screen.',
  ];
}
