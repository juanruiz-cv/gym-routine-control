import { z } from 'zod';

export const emailSchema = z.string().email('Please enter a valid email address');

export const passwordSchema = z
  .string()
  .min(6, 'Password must be at least 6 characters');

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const routineSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  muscle_groups: z.array(z.string()).min(1, 'Select at least one muscle group'),
  estimated_duration: z.number().min(1).optional(),
});

export const exerciseSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(1000).optional(),
  category: z.string().optional(),
  equipment: z.string().optional(),
  muscle_group: z.string().min(1, 'Muscle group is required'),
  instructions: z.string().max(2000).optional(),
});

export const workoutSetSchema = z.object({
  set_number: z.number().min(1),
  reps: z.number().min(0).optional(),
  weight: z.number().min(0).optional(),
  rpe: z.number().min(1).max(10).optional(),
});
