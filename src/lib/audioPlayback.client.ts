/** HTMLAudioElement playback — reliable on iOS Safari (unlike speechSynthesis). */

import { registerAudioStop } from './stopAllAudio';

let _audio: HTMLAudioElement | null = null;
let _playToken = 0;
let _unlocked = false;

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof Audio !== 'undefined';
}

function audioEl(): HTMLAudioElement | null {
  if (!isBrowser()) return null;
  if (!_audio) {
    _audio = new Audio();
    _audio.preload = 'auto';
  }
  return _audio;
}

/** Call from a user tap to unlock mobile audio output. */
export function unlockAudioPlayback(): void {
  if (!isBrowser() || _unlocked) return;
  const a = audioEl();
  if (!a) return;
  a.volume = 0.001;
  a.src =
    'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAA=';
  void a.play().then(() => {
    a.pause();
    a.src = '';
    _unlocked = true;
  }).catch(() => {
    _unlocked = true;
  });
}

export function stopAudioPlayback(): void {
  if (!isBrowser()) return;
  _playToken += 1;
  const a = audioEl();
  if (!a) return;
  a.onended = null;
  a.onerror = null;
  a.pause();
  a.removeAttribute('src');
  a.load();
}

export function playBlob(blob: Blob): Promise<void> {
  if (!isBrowser()) return Promise.resolve();

  const token = ++_playToken;
  const url = URL.createObjectURL(blob);
  const a = audioEl();
  if (!a) {
    URL.revokeObjectURL(url);
    return Promise.resolve();
  }

  return new Promise<void>((resolve, reject) => {
    const cleanup = () => {
      URL.revokeObjectURL(url);
      a.onended = null;
      a.onerror = null;
    };

    a.onended = () => {
      cleanup();
      resolve();
    };
    a.onerror = () => {
      cleanup();
      reject(new Error('Audio playback failed'));
    };

    a.src = url;
    a.volume = 1;

    if (token !== _playToken) {
      cleanup();
      resolve();
      return;
    }

    const playPromise = a.play();
    if (playPromise) {
      playPromise.catch(err => {
        cleanup();
        reject(err);
      });
    }
  });
}

registerAudioStop(stopAudioPlayback);
