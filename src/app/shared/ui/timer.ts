import { Component, input, output, signal, computed, inject } from '@angular/core';
import { UiButton } from './button';
import { NotificationService } from '@core/services/notification.service';
import { LucidePlay, LucidePause, LucideRotateCcw } from '@lucide/angular';

@Component({
  selector: 'app-ui-timer',
  standalone: true,
  imports: [UiButton, LucidePlay, LucidePause, LucideRotateCcw],
  template: `
    <div class="flex flex-col items-center gap-4">
      <div class="relative w-40 h-40 sm:w-48 sm:h-48">
        <svg class="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="6" />
          <circle
            cx="50" cy="50" r="44" fill="none"
            [attr.stroke]="timerColor()" stroke-width="6" stroke-linecap="round"
            [attr.stroke-dasharray]="circumference" [attr.stroke-dashoffset]="dashOffset()"
            class="transition-[stroke-dashoffset] duration-300 ease-linear"
          />
        </svg>
        <div class="absolute inset-0 flex flex-col items-center justify-center">
          <span class="text-4xl sm:text-5xl font-bold tabular-nums text-on-surface">{{ displayTime() }}</span>
          <span class="text-xs text-on-surface-muted mt-1">
            @if (state() === 'idle') { Ready }
            @else if (state() === 'running') { Resting }
            @else if (state() === 'paused') { Paused }
            @else { Done! }
          </span>
        </div>
      </div>

      <div class="flex items-center gap-3">
        @if (state() === 'running') {
          <button ui-button variant="secondary" size="md" (clicked)="pause()">
            <svg lucidePause class="w-[18px] h-[18px]" strokeWidth="2"></svg> Pause
          </button>
          <button ui-button variant="ghost" size="md" (clicked)="reset()">
            <svg lucideRotateCcw class="w-[18px] h-[18px]" strokeWidth="2"></svg> Reset
          </button>
        } @else if (state() === 'paused') {
          <button ui-button variant="primary" size="md" (clicked)="resume()">
            <svg lucidePlay class="w-[18px] h-[18px]" strokeWidth="2"></svg> Resume
          </button>
          <button ui-button variant="ghost" size="md" (clicked)="reset()">
            <svg lucideRotateCcw class="w-[18px] h-[18px]" strokeWidth="2"></svg> Reset
          </button>
        } @else if (state() === 'idle') {
          <button ui-button variant="primary" size="md" (clicked)="start()">
            <svg lucidePlay class="w-[18px] h-[18px]" strokeWidth="2"></svg> Start Timer
          </button>
        } @else {
          <button ui-button variant="primary" size="md" (clicked)="reset()">
            <svg lucideRotateCcw class="w-[18px] h-[18px]" strokeWidth="2"></svg> Reset
          </button>
        }
      </div>
    </div>
  `,
})
export class UiTimer {
  private readonly _notification = inject(NotificationService);
  readonly duration = input(90);
  readonly autoStart = input(false);
  protected readonly timerStarted = output<void>();
  protected readonly timerCompleted = output<void>();
  protected readonly circumference = 2 * Math.PI * 44;
  private _remaining = signal(0);
  private _state = signal<'idle' | 'running' | 'paused' | 'completed'>('idle');
  private _intervalId: ReturnType<typeof setInterval> | null = null;
  protected readonly state = this._state.asReadonly();
  protected readonly displayTime = computed(() => {
    const total = this._remaining();
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  });
  protected readonly dashOffset = computed(() => this.circumference * (1 - this._remaining() / this.duration()));
  protected readonly timerColor = computed(() => {
    const ratio = this._remaining() / this.duration();
    if (ratio > 0.5) return '#22c55e';
    if (ratio > 0.25) return '#f59e0b';
    return '#ef4444';
  });

  constructor() { this.reset(); }

  start(): void {
    this._remaining.set(this.duration());
    this._state.set('running');
    this._startInterval();
    this.timerStarted.emit();
  }

  pause(): void { if (this._state() === 'running') { this._state.set('paused'); this._clearInterval(); } }
  resume(): void { if (this._state() === 'paused' && this._remaining() > 0) { this._state.set('running'); this._startInterval(); } }

  reset(): void {
    this._clearInterval();
    this._remaining.set(this.duration());
    this._state.set('idle');
  }

  private _startInterval(): void {
    this._clearInterval();
    this._intervalId = setInterval(() => {
      this._remaining.update(v => {
        if (v <= 1) {
          this._clearInterval();
          this._state.set('completed');
          this._notification.playTimerEnd();
          this._notification.vibrate([200, 100, 200]);
          this.timerCompleted.emit();
          return 0;
        }
        return v - 1;
      });
    }, 1000);
  }

  private _clearInterval(): void { if (this._intervalId !== null) { clearInterval(this._intervalId); this._intervalId = null; } }
}
