import { drawSketchMark, parseCoherenceFromSummary } from './sketchMark';
import type { FormSeed } from './types';

const EXPORT_WIDTH = 800;
const EXPORT_HEIGHT = 1000;

export type SketchSaveResult = 'shared' | 'downloaded' | 'opened' | 'failed';

export function sketchMarkFilename(seed: FormSeed): string {
  return `human-weather-mark-${seed.date}.png`;
}

export function renderSketchMarkBlob(
  seed: FormSeed,
  size?: { width?: number; height?: number },
): Promise<Blob | null> {
  return new Promise(resolve => {
    const w = size?.width ?? EXPORT_WIDTH;
    const h = size?.height ?? EXPORT_HEIGHT;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      resolve(null);
      return;
    }

    drawSketchMark(ctx, seed, w, h, {
      coalesce: 1,
      coherence: parseCoherenceFromSummary(seed.conditionsSummary),
      breathCycles: 3,
      pathProgress: 1,
    });

    canvas.toBlob(blob => resolve(blob), 'image/png');
  });
}

/** Save notebook sketch as PNG — share sheet on mobile, download on desktop. */
export async function saveSketchMarkToDevice(seed: FormSeed): Promise<SketchSaveResult> {
  const blob = await renderSketchMarkBlob(seed);
  if (!blob) return 'failed';

  const filename = sketchMarkFilename(seed);
  const file = new File([blob], filename, { type: 'image/png' });

  if (typeof navigator.share === 'function' && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: 'Field sketch mark',
        text: 'Human Weather notebook sketch',
      });
      return 'shared';
    } catch (err) {
      if ((err as DOMException).name === 'AbortError') return 'failed';
    }
  }

  const url = URL.createObjectURL(blob);
  try {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 2000);
    return 'downloaded';
  } catch {
    window.open(url, '_blank', 'noopener,noreferrer');
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    return 'opened';
  }
}
