import { Component, signal, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SwUpdate } from '@angular/service-worker';
import { SeoService } from '@core/services/seo.service';
import { I18nService } from '@shared/i18n/i18n.service';
import { TranslatePipe } from '@shared/i18n/translate.pipe';
import { UiButton } from '@shared/ui/button';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, UiButton, TranslatePipe],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  protected readonly title = signal('Gym Routine Control');
  protected readonly updateAvailable = signal(false);
  private _sw = inject(SwUpdate, { optional: true });
  private _seo = inject(SeoService);
  private _i18n = inject(I18nService);

  constructor() {
    if (this._sw?.isEnabled) {
      this._sw.versionUpdates.subscribe(evt => {
        if (evt.type === 'VERSION_READY') {
          this.updateAvailable.set(true);
        }
      });
    }
  }

  async ngOnInit(): Promise<void> {
    await this._i18n.init();
    await this._i18n.loadFromProfile();
    this._seo.updateMetaTags({
      title: this._i18n.t('app.ogTitle'),
      description: this._i18n.t('app.description'),
    });
  }

  protected activateUpdate(): void {
    this._sw?.activateUpdate().then(() => document.location.reload());
  }
}
