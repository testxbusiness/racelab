import type { ReplayClockState } from "./types";

export class ReplayClock {
  private state: ReplayClockState = { playing: false, speed: 1, elapsedMs: 0, lap: null };
  private lastTick = 0;
  private listeners = new Set<(state: ReplayClockState) => void>();

  constructor(private readonly durationMs: number) {}
  getState(): ReplayClockState { return this.state; }
  subscribe(listener: (state: ReplayClockState) => void): () => void { this.listeners.add(listener); return () => this.listeners.delete(listener); }
  play(now = Date.now()): void { this.lastTick = now; this.state = { ...this.state, playing: true }; this.emit(); }
  pause(now = Date.now()): void { this.advance(now); this.state = { ...this.state, playing: false }; this.emit(); }
  restart(): void { this.state = { ...this.state, playing: false, elapsedMs: 0, lap: null }; this.emit(); }
  setSpeed(speed: ReplayClockState["speed"]): void { this.state = { ...this.state, speed }; this.emit(); }
  seek(elapsedMs: number): void { this.state = { ...this.state, elapsedMs: Math.max(0, Math.min(this.durationMs, elapsedMs)) }; this.emit(); }
  tick(now = Date.now()): ReplayClockState { this.advance(now); this.emit(); return this.state; }
  private advance(now: number): void { if (!this.state.playing) { this.lastTick = now; return; } const delta = Math.max(0, now - this.lastTick) * this.state.speed; this.lastTick = now; this.state = { ...this.state, elapsedMs: Math.min(this.durationMs, this.state.elapsedMs + delta), playing: this.state.elapsedMs + delta < this.durationMs }; }
  private emit(): void { for (const listener of this.listeners) listener(this.state); }
}
