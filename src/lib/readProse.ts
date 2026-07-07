import { KIKI_VOICES, KeeperId, loadKokoro } from './kokoro';

export interface ReadProseOptions {
  keeper?: KeeperId;
  onSentenceStart?: (index: number, sentence: string) => void;
  onSentenceEnd?: (index: number) => void;
  onComplete?: () => void;
  onLoading?: (loading: boolean) => void;
  onError?: (error: Error) => void;
}

let activeAbort: AbortController | null = null;
let audioCtx: AudioContext | null = null;
const activeSources: AudioBufferSourceNode[] = [];

function splitSentences(text: string): string[] {
  return text
    .replace(/\n+/g, ' ')
    .split(/(?<=[.!?;])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

function stopAllSources() {
  activeSources.forEach((src) => {
    try {
      src.stop();
      src.disconnect();
    } catch {
      /* already stopped */
    }
  });
  activeSources.length = 0;
}

export function stopReading() {
  activeAbort?.abort();
  activeAbort = null;
  stopAllSources();
}

export async function readProse(
  text: string,
  options: ReadProseOptions = {},
): Promise<void> {
  const {
    keeper = 'joan',
    onSentenceStart,
    onSentenceEnd,
    onComplete,
    onLoading,
    onError,
  } = options;

  stopReading();
  const abort = new AbortController();
  activeAbort = abort;

  const sentences = splitSentences(text);
  if (sentences.length === 0) {
    onComplete?.();
    return;
  }

  try {
    onLoading?.(true);
    const tts = await loadKokoro();
    if (abort.signal.aborted) return;

    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
    onLoading?.(false);

    const voice = KIKI_VOICES[keeper];
    let playhead = ctx.currentTime + 0.05;

    for (let i = 0; i < sentences.length; i++) {
      if (abort.signal.aborted) return;

      const sentence = sentences[i];
      onSentenceStart?.(i, sentence);

      const nextSentence = sentences[i + 1];
      const generatePromise = nextSentence
        ? tts.generate(nextSentence, { voice: voice.id, speed: voice.speed })
        : null;

      const audio = await tts.generate(sentence, {
        voice: voice.id,
        speed: voice.speed,
      });
      if (abort.signal.aborted) return;

      const buffer = audio.toAudioBuffer(ctx.sampleRate);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      activeSources.push(source);

      const startAt = Math.max(playhead, ctx.currentTime);
      source.start(startAt);
      playhead = startAt + buffer.duration;

      source.onended = () => {
        onSentenceEnd?.(i);
      };

      if (generatePromise) {
        await generatePromise;
      }
    }

    const remaining = playhead - ctx.currentTime;
    if (remaining > 0) {
      await new Promise<void>((resolve) => {
        const timer = setTimeout(resolve, remaining * 1000 + 100);
        abort.signal.addEventListener('abort', () => {
          clearTimeout(timer);
          resolve();
        });
      });
    }

    if (!abort.signal.aborted) {
      onComplete?.();
    }
  } catch (err) {
    if (!abort.signal.aborted) {
      onError?.(err instanceof Error ? err : new Error(String(err)));
    }
  } finally {
    onLoading?.(false);
    if (activeAbort === abort) {
      activeAbort = null;
    }
  }
}
