import { Injectable, signal, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class NetworkStatusService {
  private readonly _platformId = inject(PLATFORM_ID);
  private readonly _online = signal(true);

  readonly isOnline = this._online.asReadonly();

  constructor() {
    if (isPlatformBrowser(this._platformId)) {
      this._online.set(navigator.onLine);
      window.addEventListener('online', () => this._online.set(true));
      window.addEventListener('offline', () => this._online.set(false));
    }
  }
}
