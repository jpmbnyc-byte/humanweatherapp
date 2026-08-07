import { useCallback, useEffect, useState } from 'react';
import {
  applyPreferredVoiceByName,
  getPaceRate,
  hydrateSavedVoiceCache,
  primeSpeechEngine,
  setPaceRate,
  stationSpeakFromUserGesture,
  stationStop,
  warmSpeechVoicesFromGesture,
} from '../lib/stationSpeech';

export type SpokenProseStatus = 'idle' | 'speaking' | 'error';

export type SpeakProseOptions = {
  rate?: number;
  pitch?: number;
};

/**
 * Spoken prose for Conditions, offices, and Tender.
 * Uses stationSpeech so iOS gets a synchronous speak from the tap handler.
 */
export function useSpokenProse() {
  const [status, setStatus] = useState<SpokenProseStatus>('idle');

  useEffect(() => {
    primeSpeechEngine();
    void hydrateSavedVoiceCache();
  }, []);

  const speak = useCallback(
    (text: string, preferredVoiceName?: string | null, options?: SpeakProseOptions) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      warmSpeechVoicesFromGesture();
      applyPreferredVoiceByName(preferredVoiceName);

      stationStop();

      if (options?.rate != null) {
        void setPaceRate(options.rate);
      }

      setStatus('speaking');
      void stationSpeakFromUserGesture(trimmed)
        .then(() => setStatus('idle'))
        .catch(() => setStatus('error'));
    },
    [],
  );

  const stop = useCallback(() => {
    stationStop();
    setStatus('idle');
  }, []);

  return { speak, stop, status };
}
