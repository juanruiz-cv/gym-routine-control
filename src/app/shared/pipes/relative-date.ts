import { Pipe, type PipeTransform } from '@angular/core';
import { formatDistanceToNow, parseISO, isValid } from 'date-fns';

@Pipe({
  name: 'relativeDate',
  standalone: true,
})
export class RelativeDatePipe implements PipeTransform {
  transform(value: string | Date | null | undefined): string {
    if (!value) return '—';
    const date = typeof value === 'string' ? parseISO(value) : value;
    if (!isValid(date)) return '—';
    return formatDistanceToNow(date, { addSuffix: true });
  }
}
