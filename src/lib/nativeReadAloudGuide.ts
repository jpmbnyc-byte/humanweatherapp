import { isAndroidPlatform, isIosPlatform } from './stationSpeech';

export type NativeReadAloudGuide = {
  platform: 'ios' | 'android';
  title: string;
  intro: string;
  steps: readonly string[];
  setupHint: string;
  showCopyButton: boolean;
  copyButtonLabel: string;
};

const IOS_GUIDE: NativeReadAloudGuide = {
  platform: 'ios',
  title: 'Personal Voice via Live Speech',
  intro:
    'iPhone web apps cannot play Personal Voice directly. Highlight your prose here, then hand off to iOS Live Speech.',
  steps: [
    'Tap Select all below (or drag to highlight the passage you want).',
    'Tap Copy for Live Speech.',
    'Triple-click the side button to open Live Speech.',
    'Paste and tap speak — iOS reads with your Personal Voice.',
  ],
  setupHint:
    'One-time setup: Settings → Accessibility → Live Speech (on) → choose your Personal Voice. Assign triple-click side button under Accessibility Shortcut.',
  showCopyButton: true,
  copyButtonLabel: 'Copy for Live Speech',
};

/** Perkins School for the Blind — native selection menu, no TalkBack required. */
const ANDROID_GUIDE: NativeReadAloudGuide = {
  platform: 'android',
  title: 'Read aloud with Android',
  intro:
    'Android can read selected text with your system Google Text-to-Speech voice — no TalkBack needed. Highlight the prose here, then use the native Speak menu.',
  steps: [
    'Tap Select all below (or long-press the passage until the selection bar appears).',
    'On the selection bar, tap Select all if needed.',
    'Tap ⋮ More (or More options), then Speak or Read aloud.',
    'Android reads with your chosen Text-to-Speech voice.',
  ],
  setupHint:
    'One-time setup: Settings → Accessibility → Select to Speak (optional shortcut). Choose voice under Settings → General management → Text-to-speech output.',
  showCopyButton: false,
  copyButtonLabel: 'Copy',
};

export function getNativeReadAloudGuide(): NativeReadAloudGuide | null {
  if (isIosPlatform()) return IOS_GUIDE;
  if (isAndroidPlatform()) return ANDROID_GUIDE;
  return null;
}

export function showNativeReadAloudGuide(): boolean {
  return getNativeReadAloudGuide() !== null;
}

export async function copyProseForReadAloud(text: string): Promise<boolean> {
  const trimmed = text.trim();
  if (!trimmed) return false;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(trimmed);
      return true;
    }
  } catch {
    // fall through to legacy copy
  }
  try {
    const area = document.createElement('textarea');
    area.value = trimmed;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.left = '-9999px';
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(area);
    return ok;
  } catch {
    return false;
  }
}
