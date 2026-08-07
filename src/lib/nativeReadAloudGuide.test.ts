import { afterEach, describe, expect, it, vi } from 'vitest';
import { copyProseForReadAloud, getNativeReadAloudGuide } from './nativeReadAloudGuide';

describe('nativeReadAloudGuide', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns iOS Live Speech steps on iPhone', () => {
    vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)' });
    const guide = getNativeReadAloudGuide();
    expect(guide?.platform).toBe('ios');
    expect(guide?.showCopyButton).toBe(true);
    expect(guide?.steps[2]).toMatch(/triple-click/i);
  });

  it('returns Android speak steps on Android', () => {
    vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8)' });
    const guide = getNativeReadAloudGuide();
    expect(guide?.platform).toBe('android');
    expect(guide?.showCopyButton).toBe(false);
    expect(guide?.steps[2]).toMatch(/Speak|Read aloud/i);
  });

  it('copies prose for iOS Live Speech paste', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });

    const ok = await copyProseForReadAloud('  Morning note text.  ');
    expect(ok).toBe(true);
    expect(writeText).toHaveBeenCalledWith('Morning note text.');
  });
});
