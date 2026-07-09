const stopHandlers = new Set<() => void>();

export function registerAudioStop(handler: () => void): () => void {
  stopHandlers.add(handler);
  return () => stopHandlers.delete(handler);
}

/** Stop all speech and registered Web Audio playback. Call before any new audio. */
export function stopAllAudio(): void {
  stopHandlers.forEach(handler => {
    try {
      handler();
    } catch {
      /* best-effort */
    }
  });
  if (typeof speechSynthesis !== 'undefined') {
    speechSynthesis.cancel();
  }
}
