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
      <div class="flex rounded-xl overflow-hidden border border-border">
        @for (opt of options; track opt.value) {
          <button
            (click)="setLang(opt.value)"
            class="px-3 py-1.5 text-sm font-medium transition-colors flex items-center gap-1"
            [class.bg-brand]="i18n.currentLang() === opt.value"
            [class.text-white]="i18n.currentLang() === opt.value"
            [class.text-on-surface-muted]="i18n.currentLang() !== opt.value"
            [class.hover:text-on-surface]="i18n.currentLang() !== opt.value"
          >
            @if (opt.value === 'es') {
              <svg viewBox="0 0 20 14" class="w-4 h-3 shrink-0" aria-hidden="true">
                <rect width="20" height="3.5" fill="#c60b1e"/>
                <rect y="3.5" width="20" height="7" fill="#ffc400"/>
                <rect y="10.5" width="20" height="3.5" fill="#c60b1e"/>
              </svg>
            } @else {
              <svg viewBox="0 0 20 14" class="w-4 h-3 shrink-0" aria-hidden="true">
                <rect width="20" height="14" fill="#fff"/>
                <rect y="1" width="20" height="1" fill="#b22234"/>
                <rect y="3" width="20" height="1" fill="#b22234"/>
                <rect y="5" width="20" height="1" fill="#b22234"/>
                <rect y="7" width="20" height="1" fill="#b22234"/>
                <rect y="9" width="20" height="1" fill="#b22234"/>
                <rect y="11" width="20" height="1" fill="#b22234"/>
                <rect y="13" width="20" height="1" fill="#b22234"/>
                <rect width="8" height="7" fill="#3c3b6e"/>
              </svg>
            }
            <span>{{ opt.label }}</span>
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
