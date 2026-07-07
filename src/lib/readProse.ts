import type { TenderVoiceProfile } from './voices';
import { splitIntoSpeakChunks } from './voices';
import { NarrationQueue } from './audioQueue';

export type NarrationControls = {
  pause: () => void;
  resume: () => void;
  stop: () => void;
};

export type ReadProseStatus = {
  phase: 'loading' | 'generating' | 'playing';
  percent?: number;
  label: string;
};

export type ReadProseOptions = {
  text: string;
  profile: TenderVoiceProfile;
  signal?: AbortSignal;
  onStatus?: (status: ReadProseStatus) => void;
  onStart?: (controls: NarrationControls) => void;
  onWordIndex?: (index: number) => void;
};

/**
 * Pipelined gapless narration — generate chunk n+1 while n plays.
 * Reports load/generate progress via onStatus; UI clears when speech starts.
 */
export async function readProse({
  text,
  profile,
  signal,
  onStatus,
  onStart,
  onWordIndex,
}: ReadProseOptions): Promise<void> {
  if (typeof window === 'undefined') throw new Error('Voice runs in browser only.');

  const { generateKokoroSpeech, getKokoroTts } = await import('./kokoro');
  const chunks = splitIntoSpeakChunks(text);
  if (!chunks.length) return;

  const queue = new NarrationQueue(onWordIndex);
  const controls: NarrationControls = {
    pause: () => queue.pause(),
    resume: () => void queue.play(),
    stop: () => queue.stop(),
  };

  onStatus?.({
    phase: 'loading',
    percent: 0,
    label: 'Preparing the voice — one-time download.',
  });

  let sawFullLoad = false;

  const [, firstBlob] = await Promise.all([
    getKokoroTts(progress => {
      onStatus?.({
        phase: progress.percent >= 100 ? 'generating' : 'loading',
        percent: progress.percent,
        label: progress.status,
      });
      if (progress.percent >= 100) sawFullLoad = true;
    }),
    (async () => {
      const blob = await generateKokoroSpeech(chunks[0], profile.kokoroVoice, profile.speed, signal);
      if (!sawFullLoad) {
        onStatus?.({ phase: 'generating', label: 'Voice ready — preparing speech…' });
      }
      return blob;
    })(),
  ]);

  if (signal?.aborted) {
    queue.stop();
    throw new DOMException('Cancelled.', 'AbortError');
  }

  onStart?.(controls);
  onStatus?.({ phase: 'playing', label: '' });

  let wordOffset = 0;
  let nextGen: Promise<Blob> | null = null;

  for (let i = 0; i < chunks.length; i++) {
    if (signal?.aborted) {
      queue.stop();
      throw new DOMException('Cancelled.', 'AbortError');
    }

    const blob = i === 0 ? firstBlob : await nextGen!;

    if (i + 1 < chunks.length) {
      nextGen = generateKokoroSpeech(chunks[i + 1], profile.kokoroVoice, profile.speed, signal);
    }

    const wordCount = chunks[i].split(/\s+/).filter(Boolean).length;
    await queue.enqueue(blob, wordOffset, wordCount);
    wordOffset += wordCount;

    await new Promise<void>(r => setTimeout(r, 0));
  }

  await queue.waitUntilDone();
  queue.stop();
}

export async function resetKokoroEngine() {
  const { resetKokoroEngine: reset } = await import('./kokoro');
  reset();
}
