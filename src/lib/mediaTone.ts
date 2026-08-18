/**
 * Builds one continuous stereo WAV for a fixed session and plays it through an
 * HTMLAudioElement. A four-second phase-safe waveform is copied inside one WAV;
 * the browser never crosses a media loop boundary.
 */
export interface TimedToneMedia {
  audio: HTMLAudioElement;
  objectUrl: string;
}

export function createTimedToneMedia(
  leftFrequencies: number[],
  rightFrequencies: number[],
  volume: number,
  durationSeconds: number,
): TimedToneMedia {
  const sampleRate = 3200;
  const safeDuration = Math.max(1, Math.min(4200, Math.round(durationSeconds)));
  const frameCount = sampleRate * safeDuration;
  const channelCount = 2;
  const bytesPerFrame = 4;
  const dataSize = frameCount * bytesPerFrame;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeText = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i += 1) view.setUint8(offset + i, value.charCodeAt(i));
  };

  writeText(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeText(8, 'WAVE');
  writeText(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channelCount, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * bytesPerFrame, true);
  view.setUint16(32, bytesPerFrame, true);
  view.setUint16(34, 16, true);
  writeText(36, 'data');
  view.setUint32(40, dataSize, true);

  const cycleSeconds = 4;
  const cycleFrames = sampleRate * cycleSeconds;
  const cycle = new ArrayBuffer(cycleFrames * bytesPerFrame);
  const cycleView = new DataView(cycle);
  const lockToCycle = (frequency: number) => Math.round(frequency * cycleSeconds) / cycleSeconds;
  const left = leftFrequencies.map(lockToCycle);
  const right = rightFrequencies.map(lockToCycle);
  const level = Math.max(0.04, Math.min(volume, 1)) * 0.72;

  const render = (frequencies: number[], time: number) => {
    if (frequencies.length === 0) return 0;
    return frequencies.reduce((sum, frequency, index) => {
      const weight = 1 / (1 + index * 0.45);
      return sum + Math.sin(2 * Math.PI * frequency * time) * weight;
    }, 0) / frequencies.length;
  };

  for (let frame = 0; frame < cycleFrames; frame += 1) {
    const time = frame / sampleRate;
    const offset = frame * bytesPerFrame;
    const leftSample = Math.max(-1, Math.min(1, render(left, time) * level));
    const rightSample = Math.max(-1, Math.min(1, render(right, time) * level));
    cycleView.setInt16(offset, Math.round(leftSample * 32767), true);
    cycleView.setInt16(offset + 2, Math.round(rightSample * 32767), true);
  }

  const output = new Uint8Array(buffer, 44);
  const cycleBytes = new Uint8Array(cycle);
  for (let offset = 0; offset < output.length; offset += cycleBytes.length) {
    output.set(cycleBytes.subarray(0, Math.min(cycleBytes.length, output.length - offset)), offset);
  }

  const objectUrl = URL.createObjectURL(new Blob([buffer], { type: 'audio/wav' }));
  const audio = new Audio(objectUrl);
  audio.loop = false;
  audio.preload = 'auto';
  audio.setAttribute('playsinline', '');
  return { audio, objectUrl };
}

export function disposeTimedToneMedia(media: TimedToneMedia | null): void {
  if (!media) return;
  media.audio.pause();
  media.audio.removeAttribute('src');
  media.audio.load();
  URL.revokeObjectURL(media.objectUrl);
}
