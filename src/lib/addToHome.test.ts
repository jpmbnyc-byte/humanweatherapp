import { describe, expect, it } from 'vitest';
import { addToHomeInstructions } from './addToHome';

describe('addToHomeInstructions', () => {
  it('returns three iOS steps', () => {
    const steps = addToHomeInstructions('ios');
    expect(steps).toHaveLength(3);
    expect(steps[0]).toMatch(/Share/i);
    expect(steps[1]).toMatch(/Add to Home Screen/i);
  });

  it('returns three Android steps', () => {
    const steps = addToHomeInstructions('android');
    expect(steps).toHaveLength(3);
    expect(steps[1]).toMatch(/Install app|Add to Home screen/i);
  });
});
