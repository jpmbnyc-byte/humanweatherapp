import type { KokoroVoiceId } from './voices';
import {
  ensureKokoroWorker,
  generateKokoroSpeechInWorker,
  getKokoroLoadState,
  resetKokoroWorker,
  subscribeKokoroLoadProgress,
  type KokoroLoadProgress,
} from './kokoroWorkerClient';

export type { KokoroLoadProgress };
export { subscribeKokoroLoadProgress, getKokoroLoadState };

/** Ensure the off-thread voice worker is loaded and warmed. */
export async function getKokoroTts(
  onProgress?: (progress: KokoroLoadProgress) => void,
): Promise<void> {
  await ensureKokoroWorker(onProgress);
}

export async function generateKokoroSpeech(
  text: string,
  voice: KokoroVoiceId,
  speed: number,
  signal?: AbortSignal,
): Promise<Blob> {
  await ensureKokoroWorker();
  if (signal?.aborted) throw new DOMException('Cancelled.', 'AbortError');
  return generateKokoroSpeechInWorker(text, voice, speed, signal);
}

export function resetKokoroEngine() {
  resetKokoroWorker();
}
