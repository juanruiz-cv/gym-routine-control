import { Pipe, type PipeTransform } from '@angular/core';
import type { Difficulty } from '@shared/models';

@Pipe({
  name: 'difficulty',
  standalone: true,
})
export class DifficultyPipe implements PipeTransform {
  transform(value: Difficulty | null | undefined): string {
    if (!value) return '—';
    const labels: Record<Difficulty, string> = {
      beginner: 'Beginner',
      intermediate: 'Intermediate',
      advanced: 'Advanced',
    };
    return labels[value] ?? value;
  }
}
