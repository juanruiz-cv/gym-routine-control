export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  preferences: UserPreferences;
  created_at: string;
  updated_at: string;
}

export interface UserPreferences {
  theme: 'dark' | 'light' | 'system';
  rest_timer: number;
  sound_enabled: boolean;
  vibration_enabled: boolean;
  language?: 'es' | 'en';
}

export interface Routine {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  muscle_groups: string[];
  estimated_duration: number | null;
  is_favorite: boolean;
  is_template: boolean;
  exercises?: RoutineExercise[];
  routine_exercises?: RoutineExercise[];
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Exercise {
  id: string;
  user_id: string | null;
  name: string;
  description: string | null;
  category: string | null;
  equipment: string | null;
  muscle_group: string;
  instructions: string | null;
  video_url: string | null;
  image_url: string | null;
  is_global: boolean;
  created_at: string;
  updated_at: string;
}

export interface RoutineExercise {
  id: string;
  routine_id: string;
  exercise_id: string;
  exercise?: Exercise;
  sort_order: number;
  sets: number;
  reps: number | null;
  weight: number | null;
  rest_time: number;
  tempo: string | null;
  rpe: number | null;
  notes: string | null;
}

export interface WorkoutSession {
  id: string;
  user_id: string;
  routine_id: string | null;
  routine?: Routine;
  started_at: string;
  completed_at: string | null;
  duration: number | null;
  status: 'in_progress' | 'completed' | 'cancelled';
  notes: string | null;
  sets?: WorkoutSet[];
}

export interface WorkoutSet {
  id: string;
  session_id: string;
  routine_exercise_id: string;
  routine_exercise?: RoutineExercise;
  set_number: number;
  reps: number | null;
  weight: number | null;
  is_completed: boolean;
  completed_at: string | null;
  rpe: number | null;
  notes: string | null;
}

export interface PersonalRecord {
  id: string;
  user_id: string;
  exercise_id: string;
  exercise?: Exercise;
  weight: number;
  reps: number;
  estimated_one_rm: number | null;
  achieved_at: string;
  session_id: string | null;
}

export type Difficulty = 'beginner' | 'intermediate' | 'advanced';
export type MuscleGroup = string;
export type Equipment = string;
export type ExerciseCategory = string;

export const MUSCLE_GROUPS = [
  'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps',
  'Legs', 'Quadriceps', 'Hamstrings', 'Glutes', 'Calves',
  'Core', 'Abs', 'Obliques', 'Forearms', 'Traps',
  'Full Body', 'Cardio',
] as const;

export const EQUIPMENT_TYPES = [
  'Barbell', 'Dumbbell', 'Kettlebell', 'Machine',
  'Cable', 'Bodyweight', 'Resistance Band', 'Medicine Ball',
  'EZ Bar', 'Smith Machine', 'Other',
] as const;

export const DIFFICULTIES: Difficulty[] = ['beginner', 'intermediate', 'advanced'];
