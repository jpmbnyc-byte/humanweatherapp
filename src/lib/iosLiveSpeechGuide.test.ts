import { describe, expect, it, vi } from 'vitest';
import { IOS_LIVE_SPEECH_STEPS, copyTextForLiveSpeech } from './iosLiveSpeechGuide';

describe('iosLiveSpeechGuide', () => {
  it('lists Live Speech handoff steps', () => {
    expect(IOS_LIVE_SPEECH_STEPS.length).toBe(4);
    expect(IOS_LIVE_SPEECH_STEPS[2]).toMatch(/triple-click/i);
  });

  it('copies prose for Live Speech paste', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });

    const ok = await copyTextForLiveSpeech('  Morning note text.  ');
    expect(ok).toBe(true);
    expect(writeText).toHaveBeenCalledWith('Morning note text.');

    vi.unstubAllGlobals();
  });
});
