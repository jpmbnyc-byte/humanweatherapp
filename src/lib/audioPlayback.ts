/** HTMLAudioElement playback — reliable on iOS Safari (unlike speechSynthesis). */

let _audio: HTMLAudioElement | null = null;
let _playToken = 0;
let _unlocked = false;

function audioEl(): HTMLAudioElement {
  if (!_audio) {
    _audio = new Audio();
    _audio.preload = 'auto';
  }
  return _audio;
}

/** Call from a user tap to unlock mobile audio output. */
export function unlockAudioPlayback(): void {
  if (_unlocked) return;
  const a = audioEl();
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

export function isAudioPlaybackUnlocked(): boolean {
  return _unlocked;
}

export function stopAudioPlayback(): void {
  _playToken += 1;
  const a = audioEl();
  a.onended = null;
  a.onerror = null;
  a.pause();
  a.removeAttribute('src');
  a.load();
}

export function playBlob(blob: Blob): Promise<void> {
  const token = ++_playToken;
  const url = URL.createObjectURL(blob);

  return new Promise<void>((resolve, reject) => {
    const a = audioEl();

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
