import { Pipe, type PipeTransform, inject } from '@angular/core';
import { formatDistanceToNow, parseISO, isValid } from 'date-fns';
import { es } from 'date-fns/locale/es';
import { enUS } from 'date-fns/locale/en-US';
import type { Locale } from 'date-fns';
import { I18nService } from '@shared/i18n/i18n.service';

const locales: Record<string, Locale> = { es, en: enUS };

@Pipe({
  name: 'relativeDate',
  standalone: true,
  pure: false,
})
export class RelativeDatePipe implements PipeTransform {
  private readonly _i18n = inject(I18nService);

  transform(value: string | Date | null | undefined): string {
    if (!value) return '—';
    const date = typeof value === 'string' ? parseISO(value) : value;
    if (!isValid(date)) return '—';
    const locale = locales[this._i18n.currentLang()] ?? enUS;
    return formatDistanceToNow(date, { addSuffix: true, locale });
  }
}
