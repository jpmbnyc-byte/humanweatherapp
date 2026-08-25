export const TENDER_STUDIO_WATERMARK = 'Created by Tender Studio | Human Weather';

export type TenderAspect = '9:16' | '4:5' | '1:1' | '16:9';

const ASPECT_SIZES: Record<TenderAspect, { width: number; height: number }> = {
  '9:16': { width: 1080, height: 1920 },
  '4:5': { width: 1080, height: 1350 },
  '1:1': { width: 1080, height: 1080 },
  '16:9': { width: 1920, height: 1080 },
};

export function tenderStudioDimensions(aspect: TenderAspect) {
  return ASPECT_SIZES[aspect];
}

export function tenderStudioFilename(aspect: TenderAspect): string {
  return `tender-studio-${aspect.replace(':', 'x')}-${new Date().toISOString().slice(0, 10)}.png`;
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.replace(/\s+/g, ' ').trim().split(' ');
  const lines: string[] = [];
  let line = '';
  words.forEach(word => {
    const candidate = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(candidate).width > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  });
  if (line) lines.push(line);
  return lines;
}

async function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = url;
  });
}

export async function renderTenderStudioCard(options: {
  text: string;
  aspect: TenderAspect;
  imageUrl?: string | null;
}): Promise<Blob | null> {
  const { width, height } = tenderStudioDimensions(options.aspect);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#15130f');
  gradient.addColorStop(1, '#2b2419');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  if (options.imageUrl) {
    try {
      const image = await loadImage(options.imageUrl);
      const scale = Math.max(width / image.width, height / image.height);
      const drawWidth = image.width * scale;
      const drawHeight = image.height * scale;
      ctx.drawImage(image, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);
      ctx.fillStyle = 'rgba(10, 9, 7, 0.52)';
      ctx.fillRect(0, 0, width, height);
    } catch {
      // The typographic treatment remains a complete export if an image cannot decode.
    }
  }

  const margin = Math.round(width * 0.085);
  const fontSize = Math.round(Math.min(width * 0.068, height * 0.066));
  ctx.fillStyle = '#f6f0e4';
  ctx.font = `italic ${fontSize}px Georgia, serif`;
  ctx.textBaseline = 'top';
  const lines = wrapLines(ctx, options.text, width - margin * 2).slice(0, 11);
  const lineHeight = fontSize * 1.25;
  const blockHeight = lines.length * lineHeight;
  let y = Math.max(margin * 1.4, (height - blockHeight) / 2);
  lines.forEach(line => {
    ctx.fillText(line, margin, y);
    y += lineHeight;
  });

  ctx.strokeStyle = '#f1c14d';
  ctx.lineWidth = Math.max(2, width / 600);
  ctx.beginPath();
  ctx.moveTo(margin, Math.max(margin, (height - blockHeight) / 2 - fontSize * 0.7));
  ctx.lineTo(margin + width * 0.1, Math.max(margin, (height - blockHeight) / 2 - fontSize * 0.7));
  ctx.stroke();

  ctx.font = `${Math.max(18, Math.round(width * 0.018))}px ui-monospace, monospace`;
  ctx.fillStyle = 'rgba(246, 240, 228, 0.72)';
  ctx.textBaseline = 'bottom';
  ctx.textAlign = 'right';
  ctx.fillText(TENDER_STUDIO_WATERMARK, width - margin, height - margin * 0.62);

  return new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
}

export async function saveTenderStudioCard(options: {
  text: string;
  aspect: TenderAspect;
  imageUrl?: string | null;
}): Promise<'shared' | 'downloaded' | 'failed'> {
  const blob = await renderTenderStudioCard(options);
  if (!blob) return 'failed';
  const filename = tenderStudioFilename(options.aspect);
  const file = new File([blob], filename, { type: 'image/png' });

  if (typeof navigator.share === 'function' && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'Tender Studio', text: TENDER_STUDIO_WATERMARK });
      return 'shared';
    } catch (error) {
      if ((error as DOMException).name === 'AbortError') return 'failed';
    }
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
  return 'downloaded';
}
