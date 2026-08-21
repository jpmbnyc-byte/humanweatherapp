import { describe, expect, it, vi } from 'vitest';
import {
  tenderStudioDimensions,
  tenderStudioFilename,
  TENDER_STUDIO_WATERMARK,
} from './tenderStudioExport';

describe('Tender Studio export contract', () => {
  it('maps platform aspect ratios to production dimensions', () => {
    expect(tenderStudioDimensions('9:16')).toEqual({ width: 1080, height: 1920 });
    expect(tenderStudioDimensions('4:5')).toEqual({ width: 1080, height: 1350 });
    expect(tenderStudioDimensions('1:1')).toEqual({ width: 1080, height: 1080 });
    expect(tenderStudioDimensions('16:9')).toEqual({ width: 1920, height: 1080 });
  });

  it('keeps the required attribution stable', () => {
    expect(TENDER_STUDIO_WATERMARK).toBe('Created by Tender Studio | Human Weather');
  });

  it('creates a dated, filesystem-safe filename', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-21T12:00:00Z'));
    expect(tenderStudioFilename('9:16')).toBe('tender-studio-9x16-2026-08-21.png');
    vi.useRealTimers();
  });
});
