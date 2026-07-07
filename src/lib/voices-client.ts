import type { TenderVoiceProfile, TtsApiResult, TtsEngine } from './voices';
import { chunkText } from './voices';

/** Client-only TTS fetch — dynamically imported so it never touches initial page load. */
export async function fetchNarrationAudio(
  text: string,
  profile: TenderVoiceProfile,
  onProgress?: (message: string) => void,
  signal?: AbortSignal,
): Promise<TtsApiResult> {
  const chunks = chunkText(text);
  const blobs: Blob[] = [];
  let engine: TtsEngine = 'kokoro';

  for (let i = 0; i < chunks.length; i++) {
    if (signal?.aborted) {
      return { ok: false, error: 'Cancelled.' };
    }

    if (chunks.length > 1) {
      onProgress?.(`Generating part ${i + 1} of ${chunks.length}…`);
    } else {
      onProgress?.('Generating human voice on the server…');
    }

    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: chunks[i],
        voice: profile.kokoroVoice,
        openAiVoice: profile.openAiVoice,
        speed: profile.speed,
      }),
      signal,
    });

    if (!res.ok) {
      let message = 'Voice service unavailable.';
      try {
        const json = await res.json();
        message = json.error ?? json.message ?? message;
      } catch {
        message = (await res.text().catch(() => '')) || message;
      }
      return { ok: false, error: message };
    }

    engine = (res.headers.get('X-TTS-Engine') as TtsEngine | null) ?? 'kokoro';
    blobs.push(await res.blob());

    if (i === 0) {
      onProgress?.(
        engine === 'kokoro'
          ? 'Human Kokoro voice ready — starting playback…'
          : 'Studio voice ready — starting playback…',
      );
    }
  }

  const blob = blobs.length === 1
    ? blobs[0]
    : new Blob(blobs, { type: blobs[0]?.type || 'audio/mpeg' });

  return { ok: true, engine, blob };
}
