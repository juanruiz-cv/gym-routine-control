import { Component, input, output, signal, computed, inject, OnInit, OnDestroy } from '@angular/core';
import { UiButton } from './button';
import { TranslatePipe } from '@shared/i18n/translate.pipe';
import { NotificationService } from '@core/services/notification.service';
import { LucidePlay, LucidePause, LucideRotateCcw, LucideStopCircle, LucideSkipForward } from '@lucide/angular';

type TimerMode = 'countdown' | 'countup';

@Component({
  selector: 'app-ui-timer',
  standalone: true,
  imports: [UiButton, TranslatePipe, LucidePlay, LucidePause, LucideRotateCcw, LucideStopCircle, LucideSkipForward],
  template: `
    <div class="flex flex-col items-center gap-4">
      @if (mode() === 'countdown') {
        <div class="relative w-40 h-40 sm:w-48 sm:h-48">
          <svg class="w-full h-full -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
            <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="6" />
            <circle
              cx="50" cy="50" r="44" fill="none"
              [attr.stroke]="timerColor()" stroke-width="6" stroke-linecap="round"
              [attr.stroke-dasharray]="circumference" [attr.stroke-dashoffset]="dashOffset()"
              class="transition-[stroke-dashoffset] duration-300 ease-linear"
            />
          </svg>
          <div class="absolute inset-0 flex flex-col items-center justify-center">
            <span class="text-4xl sm:text-5xl font-bold tabular-nums text-on-surface" aria-live="polite" aria-atomic="true">{{ displayTime() }}</span>
            <span class="text-xs text-on-surface-muted mt-1">
              @if (state() === 'idle') { {{ 'timer.ready' | translate }} }
              @else if (state() === 'running') { {{ 'timer.resting' | translate }} }
              @else if (state() === 'paused') { {{ 'timer.paused' | translate }} }
              @else { {{ 'timer.done' | translate }} }
            </span>
          </div>
        </div>
      } @else {
        <div class="flex flex-col items-center gap-1">
          <span class="text-5xl sm:text-6xl font-bold tabular-nums text-on-surface" aria-live="polite" aria-atomic="true">{{ displayTime() }}</span>
          <span class="text-xs text-on-surface-muted">
            @if (state() === 'running') { {{ 'timer.elapsed' | translate }} }
            @else if (state() === 'paused') { {{ 'timer.paused' | translate }} }
            @else { {{ 'timer.elapsed' | translate }} }
          </span>
        </div>
      }

      <div class="flex items-center gap-3 flex-wrap justify-center">
        @if (state() === 'running') {
          <button ui-button variant="secondary" size="md" (clicked)="pause()">
            <svg lucidePause class="w-[18px] h-[18px]" strokeWidth="2" aria-hidden="true"></svg> {{ 'timer.pause' | translate }}
          </button>
          <button ui-button variant="ghost" size="md" (clicked)="reset()">
            <svg lucideRotateCcw class="w-[18px] h-[18px]" strokeWidth="2" aria-hidden="true"></svg> {{ 'timer.reset' | translate }}
          </button>
          @if (allowStop()) {
            <button ui-button variant="ghost" size="md" (clicked)="stop()">
              <svg lucideStopCircle class="w-[18px] h-[18px]" strokeWidth="2" aria-hidden="true"></svg> {{ stopLabel() | translate }}
            </button>
          }
        } @else if (state() === 'paused') {
          <button ui-button variant="primary" size="md" (clicked)="resume()">
            <svg lucidePlay class="w-[18px] h-[18px]" strokeWidth="2" aria-hidden="true"></svg> {{ 'timer.resume' | translate }}
          </button>
          <button ui-button variant="ghost" size="md" (clicked)="reset()">
            <svg lucideRotateCcw class="w-[18px] h-[18px]" strokeWidth="2" aria-hidden="true"></svg> {{ 'timer.reset' | translate }}
          </button>
        } @else if (state() === 'idle') {
          <button ui-button variant="primary" size="md" (clicked)="start()">
            <svg lucidePlay class="w-[18px] h-[18px]" strokeWidth="2" aria-hidden="true"></svg> {{ 'timer.start' | translate }}
          </button>
          @if (allowStop()) {
            <button ui-button variant="ghost" size="md" (clicked)="stop()">
              <svg lucideStopCircle class="w-[18px] h-[18px]" strokeWidth="2" aria-hidden="true"></svg> {{ stopLabel() | translate }}
            </button>
          }
        } @else {
          <button ui-button variant="primary" size="md" (clicked)="reset()">
            <svg lucideRotateCcw class="w-[18px] h-[18px]" strokeWidth="2" aria-hidden="true"></svg> {{ 'timer.reset' | translate }}
          </button>
          @if (allowSkip()) {
            <button ui-button variant="secondary" size="md" (clicked)="stop()">
              <svg lucideSkipForward class="w-[18px] h-[18px]" strokeWidth="2" aria-hidden="true"></svg> {{ skipLabel() | translate }}
            </button>
          }
        }
      </div>
    </div>
  `,
})
export class UiTimer implements OnInit, OnDestroy {
  private readonly _notification = inject(NotificationService);
  readonly duration = input(90);
  readonly autoStart = input(false);
  readonly mode = input<TimerMode>('countdown');
  readonly allowStop = input(false);
  readonly allowSkip = input(false);
  readonly stopLabel = input('timer.stop');
  readonly skipLabel = input('timer.skip');

  protected readonly timerStarted = output<void>();
  protected readonly timerCompleted = output<void>();
  protected readonly timerStopped = output<void>();
  protected readonly timerTick = output<number>();

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

  protected readonly dashOffset = computed(() =>
    this.mode() === 'countdown'
      ? this.circumference * (1 - this._remaining() / this.duration())
      : this.circumference
  );

  protected readonly timerColor = computed(() => {
    const ratio = this._remaining() / this.duration();
    if (ratio > 0.5) return '#22c55e';
    if (ratio > 0.25) return '#f59e0b';
    return '#ef4444';
  });

  ngOnInit(): void {
    this._remaining.set(this.mode() === 'countdown' ? this.duration() : 0);
    if (this.autoStart()) {
      this.start();
    }
  }

  ngOnDestroy(): void {
    this._clearInterval();
  }

  start(): void {
    if (this.mode() === 'countdown') {
      this._remaining.set(this.duration());
    } else {
      this._remaining.set(0);
    }
    this._state.set('running');
    this._startInterval();
    this.timerStarted.emit();
  }

  pause(): void {
    if (this._state() === 'running') {
      this._state.set('paused');
      this._clearInterval();
    }
  }

  resume(): void {
    if (this._state() === 'paused') {
      const canResume = this.mode() === 'countdown' ? this._remaining() > 0 : true;
      if (canResume) {
        this._state.set('running');
        this._startInterval();
      }
    }
  }

  reset(): void {
    this._clearInterval();
    this._remaining.set(this.mode() === 'countdown' ? this.duration() : 0);
    this._state.set('idle');
  }

  stop(): void {
    this._clearInterval();
    this._state.set('idle');
    this.timerStopped.emit();
  }

  private _startInterval(): void {
    this._clearInterval();
    this._intervalId = setInterval(() => {
      this._remaining.update(v => {
        if (this.mode() === 'countdown') {
          if (v <= 1) {
            this._clearInterval();
            this._state.set('completed');
            this._notification.playTimerEnd();
            this._notification.vibrate([200, 100, 200]);
            this.timerCompleted.emit();
            this.timerTick.emit(0);
            return 0;
          }
          const next = v - 1;
          this.timerTick.emit(next);
          return next;
        } else {
          const next = v + 1;
          this.timerTick.emit(next);
          return next;
        }
      });
    }, 1000);
  }

  private _clearInterval(): void {
    if (this._intervalId !== null) {
      clearInterval(this._intervalId);
      this._intervalId = null;
    }
  }
}
