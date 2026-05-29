import { Injectable, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly _window = inject(DOCUMENT).defaultView;

  private _audioCtx: AudioContext | null = null;

  private get audioContext(): AudioContext {
    if (!this._audioCtx) {
      this._audioCtx = new AudioContext();
    }
    return this._audioCtx;
  }

  playTimerEnd(): void {
    try {
      const ctx = this.audioContext;
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.frequency.value = 880;
      oscillator.type = 'sine';
      gain.gain.value = 0.3;
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.5);
    } catch {
      // Audio not supported
    }
  }

  playTick(): void {
    try {
      const ctx = this.audioContext;
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.frequency.value = 600;
      oscillator.type = 'sine';
      gain.gain.value = 0.1;
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.05);
    } catch {
      // Audio not supported
    }
  }

  vibrate(pattern: number | number[] = 200): void {
    try {
      this._window?.navigator?.vibrate?.(pattern);
    } catch {
      // Vibration not supported
    }
  }

  requestWakeLock(): Promise<WakeLockSentinel | null> {
    if ('wakeLock' in navigator) {
      return navigator.wakeLock.request('screen').catch(() => null);
    }
    return Promise.resolve(null);
  }
}
