const stopHandlers = new Set<() => void>();

export function registerAudioStop(handler: () => void): () => void {
  stopHandlers.add(handler);
  return () => stopHandlers.delete(handler);
}

export type StopAllAudioOptions = {
  skipHandlers?: boolean;
  skipSpeechCancel?: boolean;
};

/** Stop all speech and registered Web Audio playback. Call before any new audio. */
export function stopAllAudio(options?: StopAllAudioOptions): void {
  if (!options?.skipHandlers) {
    stopHandlers.forEach(handler => {
      try {
        handler();
      } catch {
        /* best-effort */
      }
    });
  }
  if (!options?.skipSpeechCancel && typeof speechSynthesis !== 'undefined') {
    speechSynthesis.cancel();
  }
}
