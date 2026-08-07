import { isIosPlatform } from './stationSpeech';

export const IOS_LIVE_SPEECH_STEPS = [
  'Tap Select all below (or drag to highlight the passage you want).',
  'Tap Copy for Live Speech.',
  'Triple-click the side button to open Live Speech.',
  'Paste and tap speak — iOS reads with your Personal Voice.',
] as const;

export function showIosLiveSpeechGuide(): boolean {
  return isIosPlatform();
}

export function iosLiveSpeechSetupHint(): string {
  return 'One-time setup: Settings → Accessibility → Live Speech (on) → choose your Personal Voice. Assign triple-click side button under Accessibility Shortcut.';
}

export async function copyTextForLiveSpeech(text: string): Promise<boolean> {
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
