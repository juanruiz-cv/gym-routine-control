import { Injectable, signal } from '@angular/core';
import { DataService } from './data.service';
import { startOfWeek, subWeeks, format } from 'date-fns';
import type { PersonalRecord } from '@shared/models';

export interface DashboardStats {
  completedWorkouts: number;
  totalRoutines: number;
  exercisesCompleted: number;
  totalVolume: number;
  totalTimeMinutes: number;
  currentStreak: number;
  weeklyWorkouts: number;
}

export interface VolumeDataPoint {
  date: string;
  volume: number;
}

export interface MuscleDistribution {
  muscle: string;
  count: number;
  percentage: number;
}

export interface WeeklyActivity {
  week: string;
  sessions: number;
  volume: number;
}

interface RawSession {
  completed_at: string | null;
  duration: number | null;
  sets: { is_completed: boolean; weight: number | null; reps: number | null }[] | null;
}

@Injectable({ providedIn: 'root' })
export class MetricsService extends DataService {
  private readonly _stats = signal<DashboardStats | null>(null);
  private readonly _loading = signal(false);

  readonly stats = this._stats.asReadonly();
  readonly loading = this._loading.asReadonly();

  async getDashboardStats(): Promise<DashboardStats> {
    this._loading.set(true);
    const userId = await this.checkUserId();

    const { data: sessions } = await this.client
      .from('workout_sessions')
      .select('*, sets:workout_sets(*)')
      .eq('user_id', userId)
      .eq('status', 'completed');

    const { count: routinesCount } = await this.client
      .from('routines')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .is('deleted_at', null);

    const rawSessions = (sessions ?? []) as unknown as RawSession[];
    const completedWorkouts = rawSessions.length;
    const exercisesCompleted = rawSessions.reduce<number>((sum, s) =>
      sum + (s.sets?.filter(s2 => s2.is_completed).length ?? 0), 0);
    const totalVolume = rawSessions.reduce<number>((sum, s) =>
      sum + (s.sets?.reduce<number>((s2, set) => s2 + ((set.weight ?? 0) * (set.reps ?? 0)), 0) ?? 0), 0);
    const totalTimeMinutes = rawSessions.reduce<number>((sum, s) => sum + ((s.duration ?? 0) / 60), 0);

    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weeklyWorkouts = rawSessions.filter(s => s.completed_at && new Date(s.completed_at) >= weekStart).length;

    const currentStreak = this._calculateStreak(rawSessions);

    const stats: DashboardStats = {
      completedWorkouts,
      totalRoutines: routinesCount ?? 0,
      exercisesCompleted,
      totalVolume: Math.round(totalVolume),
      totalTimeMinutes: Math.round(totalTimeMinutes),
      currentStreak,
      weeklyWorkouts,
    };

    this._stats.set(stats);
    this._loading.set(false);
    return stats;
  }

  async getVolumeHistory(weeks = 12): Promise<VolumeDataPoint[]> {
    const userId = await this.checkUserId();
    const since = subWeeks(new Date(), weeks).toISOString();

    const { data } = await this.client
      .from('workout_sessions')
      .select('*, sets:workout_sets(*)')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .gte('completed_at', since)
      .order('completed_at');

    const raw = (data ?? []) as unknown as RawSession[];
    const volumeByDate = new Map<string, number>();

    for (const session of raw) {
      const date = format(new Date(session.completed_at!), 'yyyy-MM-dd');
      const vol = session.sets?.reduce<number>((s, set) => s + ((set.weight ?? 0) * (set.reps ?? 0)), 0) ?? 0;
      volumeByDate.set(date, (volumeByDate.get(date) ?? 0) + vol);
    }

    return Array.from(volumeByDate.entries()).map(([date, volume]) => ({ date, volume }));
  }

  async getMuscleDistribution(): Promise<MuscleDistribution[]> {
    const userId = await this.checkUserId();

    const { data } = await this.client
      .from('workout_sessions')
      .select('*, sets:workout_sets(routine_exercises(exercise:exercises(muscle_group)))')
      .eq('user_id', userId)
      .eq('status', 'completed');

    if (!data) return [];

    const count = new Map<string, number>();
    let total = 0;

    // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
    type RawSet = { routine_exercises?: { exercise?: { muscle_group: string } } };
    for (const session of data as unknown as { sets: RawSet[] | null }[]) {
      for (const set of (session.sets ?? []) as RawSet[]) {
        const mg = set.routine_exercises?.exercise?.muscle_group;
        if (mg) {
          count.set(mg, (count.get(mg) ?? 0) + 1);
          total++;
        }
      }
    }

    return Array.from(count.entries())
      .map(([muscle, cnt]) => ({
        muscle,
        count: cnt,
        percentage: total > 0 ? Math.round((cnt / total) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }

  async getWeeklyActivity(weeks = 12): Promise<WeeklyActivity[]> {
    const userId = await this.checkUserId();
    const since = subWeeks(new Date(), weeks).toISOString();

    const { data } = await this.client
      .from('workout_sessions')
      .select('*, sets:workout_sets(*)')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .gte('completed_at', since)
      .order('completed_at');

    const raw = (data ?? []) as unknown as RawSession[];
    const byWeek = new Map<string, { sessions: number; volume: number }>();

    for (const session of raw) {
      const week = format(startOfWeek(new Date(session.completed_at!), { weekStartsOn: 1 }), 'MMM d');
      const vol = session.sets?.reduce<number>((s, set) => s + ((set.weight ?? 0) * (set.reps ?? 0)), 0) ?? 0;
      const existing = byWeek.get(week) ?? { sessions: 0, volume: 0 };
      byWeek.set(week, { sessions: existing.sessions + 1, volume: existing.volume + vol });
    }

    return Array.from(byWeek.entries()).map(([week, d]) => ({ week, ...d }));
  }

  async getPersonalRecords(): Promise<PersonalRecord[]> {
    const userId = await this.checkUserId();
    const { data } = await this.client
      .from('personal_records')
      .select('*, exercise:exercises(*)')
      .eq('user_id', userId)
      .order('achieved_at', { ascending: false })
      .limit(20);

    return data ?? [];
  }

  private _calculateStreak(sessions: RawSession[]): number {
    if (!sessions.length) return 0;

    const dateSet = new Set<string>();
    for (const s of sessions) {
      if (s.completed_at) {
        dateSet.add(format(new Date(s.completed_at), 'yyyy-MM-dd'));
      }
    }

    const dates = Array.from(dateSet).sort().reverse();
    if (!dates.length) return 0;

    let streak = 1;
    const today = format(new Date(), 'yyyy-MM-dd');
    const yesterday = format(subWeeks(new Date(), 0), 'yyyy-MM-dd');

    if (dates[0] !== today && dates[0] !== yesterday) return 0;

    for (let i = 1; i < dates.length; i++) {
      const prev = new Date(dates[i - 1]);
      const curr = new Date(dates[i]);
      const diff = (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24);
      if (diff === 1) streak++;
      else break;
    }

    return streak;
  }

  clear(): void {
    this._stats.set(null);
    this._loading.set(false);
  }
}
