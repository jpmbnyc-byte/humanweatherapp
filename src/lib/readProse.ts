import type { TenderVoiceProfile } from './voices';
import { splitSentences } from './voices';

export type ReadProseProgress = {
  phase: 'loading' | 'generating' | 'speaking';
  message: string;
  sentenceIndex?: number;
  sentenceTotal?: number;
};

export type ReadProseOptions = {
  text: string;
  profile: TenderVoiceProfile;
  signal?: AbortSignal;
  onProgress?: (progress: ReadProseProgress) => void;
  onSpeaking?: () => void;
  playBlob: (blob: Blob, sentence: string, wordOffset: number) => Promise<void>;
};

/**
 * Sentence-chunked narration — generate sentence n+1 while n plays (HW_HARNESS §6).
 * Kokoro is dynamically imported so this module stays out of the initial bundle.
 */
export async function readProse({
  text,
  profile,
  signal,
  onProgress,
  onSpeaking,
  playBlob,
}: ReadProseOptions): Promise<void> {
  if (typeof window === 'undefined') {
    throw new Error('Voice narration runs in the browser only.');
  }

  const { generateKokoroSpeech, getKokoroTts, resetKokoroEngine } = await import('./kokoro');
  const sentences = splitSentences(text);
  if (!sentences.length) return;

  onProgress?.({
    phase: 'loading',
    message: 'Preparing the voice — one-time download.',
    sentenceTotal: sentences.length,
  });

  await getKokoroTts(progress => {
    onProgress?.({
      phase: 'loading',
      message: progress.status,
      sentenceTotal: sentences.length,
    });
  });

  if (signal?.aborted) throw new DOMException('Cancelled.', 'AbortError');

  let wordOffset = 0;
  let nextBlobPromise: Promise<Blob> | null = generateKokoroSpeech(
    sentences[0],
    profile.kokoroVoice,
    profile.speed,
    signal,
  );

  for (let i = 0; i < sentences.length; i++) {
    if (signal?.aborted) throw new DOMException('Cancelled.', 'AbortError');

    if (i > 0) {
      onProgress?.({
        phase: 'generating',
        message:
          sentences.length > 1
            ? `Preparing sentence ${i + 1} of ${sentences.length}…`
            : 'Preparing speech…',
        sentenceIndex: i,
        sentenceTotal: sentences.length,
      });
    }

    const blob = await nextBlobPromise!;

    if (i + 1 < sentences.length) {
      nextBlobPromise = generateKokoroSpeech(
        sentences[i + 1],
        profile.kokoroVoice,
        profile.speed,
        signal,
      );
    } else {
      nextBlobPromise = null;
    }

    if (i === 0) {
      onSpeaking?.();
      onProgress?.({
        phase: 'speaking',
        message: `${profile.name} is reading aloud.`,
        sentenceIndex: i,
        sentenceTotal: sentences.length,
      });
    }

    const sentenceWords = sentences[i].split(/\s+/).filter(Boolean).length;
    await playBlob(blob, sentences[i], wordOffset);
    wordOffset += sentenceWords;
  }
}

export async function resetKokoroEngine() {
  const { resetKokoroEngine: reset } = await import('./kokoro');
  reset();
}
