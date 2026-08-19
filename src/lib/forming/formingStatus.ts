import type { FormingStage } from './types';

export function getFormingStatusMessage(
  stage: FormingStage,
  opts?: { hasTouch?: boolean; todaySaved?: boolean },
): string {
  if (opts?.todaySaved) {
    return 'Today\u2019s Daymark is kept on this device.';
  }

  switch (stage) {
    case 'idle':
      return opts?.hasTouch ? 'Reading your touch on the field\u2026' : '';
    case 'gathering':
      return 'Your touch is recorded.';
    case 'breathing':
      return 'Forming today\u2019s Daymark\u2026';
    case 'capturing':
      return 'The field answers your climate\u2026';
    case 'mounting':
      return 'Mounting your Daymark\u2026';
    case 'stillness':
      return 'Daymark held on this device.';
    case 'complete':
      return 'Daymark kept \u2014 find it in History';
    default:
      return '';
  }
}
