import { Component, inject } from '@angular/core';
import { I18nService, type SupportedLang } from './i18n.service';
import { TranslatePipe } from './translate.pipe';
import { LucideLanguages } from '@lucide/angular';

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [TranslatePipe, LucideLanguages],
  template: `
    <div class="flex items-center gap-3">
      <svg lucideLanguages class="w-5 h-5 text-brand" strokeWidth="1.5" aria-hidden="true"></svg>
      <div class="flex-1">
        <p class="text-sm font-medium">{{ 'settings.language' | translate }}</p>
        <p class="text-xs text-on-surface-muted">{{ 'settings.languageDesc' | translate }}</p>
      </div>
      <div class="flex rounded-xl overflow-hidden border border-white/10">
        @for (opt of options; track opt.value) {
          <button
            (click)="setLang(opt.value)"
            class="px-3 py-1.5 text-sm font-medium transition-colors"
            [class.bg-brand]="i18n.currentLang() === opt.value"
            [class.text-white]="i18n.currentLang() === opt.value"
            [class.text-on-surface-muted]="i18n.currentLang() !== opt.value"
            [class.hover:text-on-surface]="i18n.currentLang() !== opt.value"
          >
            {{ opt.label }}
          </button>
        }
      </div>
    </div>
  `,
})
export class LanguageSwitcherComponent {
  protected readonly i18n = inject(I18nService);

  protected readonly options = [
    { value: 'es' as SupportedLang, label: 'ES' },
    { value: 'en' as SupportedLang, label: 'EN' },
  ];

  protected async setLang(lang: SupportedLang): Promise<void> {
    await this.i18n.setLanguage(lang);
  }
}
