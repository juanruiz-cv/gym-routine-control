export function formatWeight(kg: number | null | undefined): string {
  if (kg == null) return '—';
  return `${kg} kg`;
}

export function formatReps(reps: number | null | undefined): string {
  if (reps == null) return '—';
  return `${reps} reps`;
}

export function formatVolume(kg: number, reps: number): number {
  return kg * reps;
}

export function calculateOneRM(weight: number, reps: number): number {
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30));
}

export function formatDateShort(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatDateFull(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

export function getStreakEmoji(streak: number): string {
  if (streak >= 30) return '🔥';
  if (streak >= 14) return '💪';
  if (streak >= 7) return '⭐';
  if (streak >= 3) return '✅';
  return '📅';
}
