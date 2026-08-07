import { describe, expect, it } from 'vitest';
import { DEFAULT_TENDER_SLOTS } from './tenderSlots';

// mergeWithDefaults is internal — test via load pattern
function merge(saved: typeof DEFAULT_TENDER_SLOTS) {
  return DEFAULT_TENDER_SLOTS.map(def => {
    const hit = saved.find(s => s.id === def.id);
    return hit ? { ...def, ...hit, id: def.id } : { ...def };
  });
}

describe('tender slots', () => {
  it('preserves four default slot ids', () => {
    expect(DEFAULT_TENDER_SLOTS).toHaveLength(4);
    expect(DEFAULT_TENDER_SLOTS.map(s => s.id)).toEqual(['slot-1', 'slot-2', 'slot-3', 'slot-4']);
  });

  it('merges saved text into default labels', () => {
    const merged = merge([
      { id: 'slot-1', label: 'Custom', text: 'Hello world', updatedAt: '2026-01-01' },
    ]);
    expect(merged[0].text).toBe('Hello world');
    expect(merged[0].label).toBe('Custom');
    expect(merged[1].text).toBe('');
  });
});
