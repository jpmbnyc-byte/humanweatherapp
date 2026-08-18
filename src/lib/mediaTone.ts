/**
 * Builds a short looping stereo WAV and starts it through an HTMLAudioElement.
 * iOS routes media elements through its music playback session, unlike Web Audio
 * oscillators which can be silenced by the Ring/Silent switch in Safari/PWAs.
 */
export interface LoopingToneMedia {
  audio: HTMLAudioElement;
  objectUrl: string;
}

export function createLoopingToneMedia(
  leftFrequencies: number[],
  rightFrequencies: number[],
  volume: number,
): LoopingToneMedia {
  const sampleRate = 22050;
  const durationSeconds = 4;
  const frameCount = sampleRate * durationSeconds;
  const channelCount = 2;
  const bytesPerSample = 2;
  const dataSize = frameCount * channelCount * bytesPerSample;
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
  view.setUint32(28, sampleRate * channelCount * bytesPerSample, true);
  view.setUint16(32, channelCount * bytesPerSample, true);
  view.setUint16(34, 16, true);
  writeText(36, 'data');
  view.setUint32(40, dataSize, true);

  // Quantize each frequency to a whole number of cycles in this buffer.
  // The maximum pitch adjustment is 0.125 Hz, but the first and last sample
  // phases now meet exactly, so the media element has a truly seamless loop.
  const lockToLoop = (frequency: number) =>
    Math.round(frequency * durationSeconds) / durationSeconds;
  const lockedLeft = leftFrequencies.map(lockToLoop);
  const lockedRight = rightFrequencies.map(lockToLoop);

  const renderChannel = (frequencies: number[], time: number) => {
    if (frequencies.length === 0) return 0;
    return frequencies.reduce((sum, frequency, index) => {
      const weight = 1 / (1 + index * 0.45);
      return sum + Math.sin(2 * Math.PI * frequency * time) * weight;
    }, 0) / frequencies.length;
  };

  const level = Math.max(0.04, Math.min(volume, 1)) * 0.72;
  let offset = 44;
  for (let frame = 0; frame < frameCount; frame += 1) {
    const time = frame / sampleRate;
    const left = Math.max(-1, Math.min(1, renderChannel(lockedLeft, time) * level));
    const right = Math.max(-1, Math.min(1, renderChannel(lockedRight, time) * level));
    view.setInt16(offset, Math.round(left * 32767), true);
    view.setInt16(offset + 2, Math.round(right * 32767), true);
    offset += 4;
  }

  const objectUrl = URL.createObjectURL(new Blob([buffer], { type: 'audio/wav' }));
  const audio = new Audio(objectUrl);
  audio.loop = true;
  audio.preload = 'auto';
  audio.setAttribute('playsinline', '');
  return { audio, objectUrl };
}

export function disposeLoopingToneMedia(media: LoopingToneMedia | null): void {
  if (!media) return;
  media.audio.pause();
  media.audio.removeAttribute('src');
  media.audio.load();
  URL.revokeObjectURL(media.objectUrl);
}
