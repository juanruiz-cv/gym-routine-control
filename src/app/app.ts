import { Component, signal, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SwUpdate } from '@angular/service-worker';
import { SeoService } from '@core/services/seo.service';
import { UiButton } from '@shared/ui/button';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, UiButton],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('Gym Routine Control');
  protected readonly updateAvailable = signal(false);
  private _sw = inject(SwUpdate, { optional: true });
  private _seo = inject(SeoService);

  constructor() {
    this._seo.updateMetaTags({
      title: 'Welcome',
      description: 'Track your workouts, manage routines, and achieve your fitness goals with Gym Routine Control.',
    });

    if (this._sw?.isEnabled) {
      this._sw.versionUpdates.subscribe(evt => {
        if (evt.type === 'VERSION_READY') {
          this.updateAvailable.set(true);
        }
      });
    }
  }

  protected activateUpdate(): void {
    this._sw?.activateUpdate().then(() => document.location.reload());
  }
}
