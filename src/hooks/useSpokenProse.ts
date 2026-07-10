import { useRef, useState, useCallback, useEffect } from 'react';

export type SpokenProseStatus = 'idle' | 'speaking' | 'error';

export type SpeakProseOptions = {
  rate?: number;
  pitch?: number;
};

function synthesis(): SpeechSynthesis | null {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;
  return window.speechSynthesis;
}

function findVoice(voices: SpeechSynthesisVoice[], preferredVoiceName?: string | null): SpeechSynthesisVoice | null {
  if (!preferredVoiceName) return null;
  const exact = voices.find(v => v.name === preferredVoiceName);
  if (exact) return exact;
  const cleaned = preferredVoiceName.replace(/\s*\([^)]*\)/g, '').trim().toLowerCase();
  return (
    voices.find(v => {
      const name = v.name.replace(/\s*\([^)]*\)/g, '').trim().toLowerCase();
      return name === cleaned || v.name === preferredVoiceName;
    }) ?? null
  );
}

export function useSpokenProse() {
  const [status, setStatus] = useState<SpokenProseStatus>('idle');
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  // iOS garbage-collects utterance objects that aren't referenced — hold the ref.
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // iOS loads voices async — capture them whenever they arrive.
  useEffect(() => {
    const syn = synthesis();
    if (!syn) return;
    const load = () => {
      voicesRef.current = syn.getVoices();
    };
    load();
    syn.addEventListener('voiceschanged', load);
    return () => syn.removeEventListener('voiceschanged', load);
  }, []);

  const speak = useCallback((text: string, preferredVoiceName?: string | null, options?: SpeakProseOptions) => {
    const syn = synthesis();
    const trimmed = text.trim();
    if (!syn || !trimmed) return;

    // Clear iOS's wedged queue before every speak.
    syn.cancel();

    const u = new SpeechSynthesisUtterance(trimmed);

    // Validate voice against CURRENT roster at speak time — null = system default.
    const match = findVoice(voicesRef.current, preferredVoiceName);
    u.voice = match ?? null;

    u.rate = options?.rate ?? 0.92;
    u.pitch = options?.pitch ?? 1.0;
    u.volume = 1;

    // UI state comes from the audio layer, not the tap.
    u.onstart = () => setStatus('speaking');
    u.onend = () => setStatus('idle');
    u.onerror = e => {
      console.error('speech error:', e.error);
      setStatus('error');
    };

    utteranceRef.current = u;
    if (syn.paused) syn.resume();
    syn.speak(u);
  }, []);

  const stop = useCallback(() => {
    synthesis()?.cancel();
    utteranceRef.current = null;
    setStatus('idle');
  }, []);

  return { speak, stop, status };
}
