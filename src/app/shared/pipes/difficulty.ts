import { Pipe, type PipeTransform, inject } from '@angular/core';
import type { Difficulty } from '@shared/models';
import { I18nService } from '@shared/i18n/i18n.service';

@Pipe({
  name: 'difficulty',
  standalone: true,
  pure: false,
})
export class DifficultyPipe implements PipeTransform {
  private readonly _i18n = inject(I18nService);

  transform(value: Difficulty | null | undefined): string {
    if (!value) return '—';
    const key = `difficulty.${value}` as const;
    const translated = this._i18n.t(key);
    return translated !== key ? translated : value.charAt(0).toUpperCase() + value.slice(1);
  }
}
