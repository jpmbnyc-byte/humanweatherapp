import type { FormingStage } from './types';

export function getFormingStatusMessage(
  stage: FormingStage,
  opts?: { hasTouch?: boolean; todaySaved?: boolean },
): string {
  if (opts?.todaySaved) {
    return 'Today\u2019s mark is kept on this device.';
  }

  switch (stage) {
    case 'idle':
      return opts?.hasTouch ? 'Reading your touch on the field\u2026' : '';
    case 'gathering':
      return 'Reading your touch on the field\u2026';
    case 'breathing':
      return 'Coalescing your climate mark\u2026';
    case 'capturing':
      return 'The field answers your climate\u2026';
    case 'mounting':
      return 'Recording your mark\u2026';
    case 'stillness':
      return 'Mark held \u2014 saving to this device\u2026';
    case 'complete':
      return 'Mark kept \u2014 see Marked days below';
    default:
      return '';
  }
}
