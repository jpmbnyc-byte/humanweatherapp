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

/** Load engine, then generate and play chunks sequentially with live progress. */
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

  await getKokoroTts(progress => {
    onStatus?.({
      phase: progress.percent >= 99 ? 'generating' : 'loading',
      percent: progress.percent,
      label: progress.status,
    });
  });

  if (signal?.aborted) {
    queue.stop();
    throw new DOMException('Cancelled.', 'AbortError');
  }

  onStatus?.({ phase: 'generating', percent: 99, label: 'Generating speech…' });

  let wordOffset = 0;
  let nextGen: Promise<Blob> | null = null;

  for (let i = 0; i < chunks.length; i++) {
    if (signal?.aborted) {
      queue.stop();
      throw new DOMException('Cancelled.', 'AbortError');
    }

    const blob =
      i === 0
        ? await generateKokoroSpeech(chunks[0], profile.kokoroVoice, profile.speed, signal)
        : await nextGen!;

    if (i === 0) {
      onStart?.(controls);
      onStatus?.({ phase: 'playing', label: '' });
    }

    if (i + 1 < chunks.length) {
      nextGen = generateKokoroSpeech(chunks[i + 1], profile.kokoroVoice, profile.speed, signal);
    }

    const wordCount = chunks[i].split(/\s+/).filter(Boolean).length;
    await queue.enqueue(blob, wordOffset, wordCount);
    wordOffset += wordCount;
  }

  await queue.waitUntilDone();
  queue.stop();
}

export async function resetKokoroEngine() {
  const { resetKokoroEngine: reset } = await import('./kokoro');
  reset();
}
