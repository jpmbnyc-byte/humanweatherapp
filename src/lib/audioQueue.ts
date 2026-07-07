/** Gapless narration playback via Web Audio — no pauses between chunks. */
export class NarrationQueue {
  private ctx: AudioContext;
  private nextStart = 0;
  private startedAt = 0;
  private rafId = 0;
  private stopped = false;
  private segments: { start: number; end: number; wordOffset: number; wordCount: number }[] = [];
  private onWordIndex: ((index: number) => void) | null = null;

  constructor(onWordIndex?: (index: number) => void) {
    this.ctx = new AudioContext();
    this.onWordIndex = onWordIndex ?? null;
  }

  async resume() {
    if (this.ctx.state === 'suspended') await this.ctx.resume();
  }

  /** Schedule a WAV blob immediately after the previous chunk — zero gap. */
  async enqueue(blob: Blob, wordOffset: number, wordCount: number): Promise<void> {
    if (this.stopped) return;
    await this.resume();

    const buffer = await this.ctx.decodeAudioData(await blob.arrayBuffer());
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(this.ctx.destination);

    const now = this.ctx.currentTime;
    const start = Math.max(now + 0.02, this.nextStart);
    if (this.segments.length === 0) this.startedAt = start;

    const end = start + buffer.duration;
    this.segments.push({ start, end, wordOffset, wordCount });
    this.nextStart = end;

    source.start(start);
    this.startTick();
  }

  private tick = () => {
    if (this.stopped || !this.onWordIndex) return;
    const t = this.ctx.currentTime;
    for (const seg of this.segments) {
      if (t >= seg.start && t < seg.end) {
        const ratio = (t - seg.start) / (seg.end - seg.start);
        const local = Math.min(Math.floor(ratio * seg.wordCount), seg.wordCount - 1);
        this.onWordIndex(seg.wordOffset + local);
        break;
      }
    }
    if (t < this.nextStart) {
      this.rafId = requestAnimationFrame(this.tick);
    }
  };

  private startTick() {
    if (this.rafId) return;
    this.rafId = requestAnimationFrame(this.tick);
  }

  /** Wait until all scheduled audio finishes. */
  waitUntilDone(): Promise<void> {
    if (this.stopped) return Promise.resolve();
    return new Promise(resolve => {
      const check = () => {
        if (this.stopped || this.ctx.currentTime >= this.nextStart - 0.05) {
          resolve();
          return;
        }
        requestAnimationFrame(check);
      };
      check();
    });
  }

  pause() {
    void this.ctx.suspend();
  }

  async play() {
    await this.ctx.resume();
  }

  stop() {
    this.stopped = true;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    void this.ctx.close().catch(() => {});
  }
}
