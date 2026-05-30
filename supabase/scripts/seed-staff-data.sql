-- ================================================================
-- Seed: standard exercises + routines for staff@a.com
-- Run after roles are assigned
-- ================================================================

do $$
declare
  staff_id uuid;
  e_press_banca uuid;
  e_sentadilla uuid;
  e_peso_muerto uuid;
  e_press_militar uuid;
  e_remo_barra uuid;
  e_dominadas uuid;
  e_press_inclinado uuid;
  e_jalon uuid;
  e_curl_biceps uuid;
  e_tricipes uuid;
  e_elevaciones uuid;
  e_femoral uuid;
  e_prensa uuid;
  e_pantorrillas uuid;
  e_face_pull uuid;
  r_push uuid;
  r_pull uuid;
  r_piernas uuid;
begin
  -- Get staff user
  select id into staff_id from auth.users where email = 'staff@a.com';
  if staff_id is null then
    raise exception 'staff@a.com not found. Assign roles first.';
  end if;

  -- ================================================================
  -- EXERCISES (is_global = true)
  -- ================================================================

  insert into public.exercises (user_id, name, description, muscle_group, category, is_global, created_by, updated_by)
  values (staff_id, 'Press banca', 'Press de pecho con barra', 'Pecho', 'Fuerza', true, staff_id, staff_id)
  returning id into e_press_banca;

  insert into public.exercises (user_id, name, description, muscle_group, category, is_global, created_by, updated_by)
  values (staff_id, 'Sentadilla', 'Sentadilla con barra', 'Cuadriceps', 'Fuerza', true, staff_id, staff_id)
  returning id into e_sentadilla;

  insert into public.exercises (user_id, name, description, muscle_group, category, is_global, created_by, updated_by)
  values (staff_id, 'Peso muerto', 'Peso muerto convencional', 'Espalda baja', 'Fuerza', true, staff_id, staff_id)
  returning id into e_peso_muerto;

  insert into public.exercises (user_id, name, description, muscle_group, category, is_global, created_by, updated_by)
  values (staff_id, 'Press militar', 'Press militar con barra', 'Hombros', 'Fuerza', true, staff_id, staff_id)
  returning id into e_press_militar;

  insert into public.exercises (user_id, name, description, muscle_group, category, is_global, created_by, updated_by)
  values (staff_id, 'Remo barra', 'Remo con barra', 'Espalda', 'Fuerza', true, staff_id, staff_id)
  returning id into e_remo_barra;

  insert into public.exercises (user_id, name, description, muscle_group, category, is_global, created_by, updated_by)
  values (staff_id, 'Dominadas', 'Dominadas con peso corporal', 'Espalda', 'Fuerza', true, staff_id, staff_id)
  returning id into e_dominadas;

  insert into public.exercises (user_id, name, description, muscle_group, category, is_global, created_by, updated_by)
  values (staff_id, 'Press inclinado', 'Press de pecho inclinado con barra', 'Pecho', 'Fuerza', true, staff_id, staff_id)
  returning id into e_press_inclinado;

  insert into public.exercises (user_id, name, description, muscle_group, category, is_global, created_by, updated_by)
  values (staff_id, 'Jalón al pecho', 'Jalón al pecho en polea', 'Espalda', 'Fuerza', true, staff_id, staff_id)
  returning id into e_jalon;

  insert into public.exercises (user_id, name, description, muscle_group, category, is_global, created_by, updated_by)
  values (staff_id, 'Curl bíceps barra', 'Curl de bíceps con barra', 'Bíceps', 'Fuerza', true, staff_id, staff_id)
  returning id into e_curl_biceps;

  insert into public.exercises (user_id, name, description, muscle_group, category, is_global, created_by, updated_by)
  values (staff_id, 'Extensiones tríceps', 'Extensiones de tríceps en polea', 'Tríceps', 'Fuerza', true, staff_id, staff_id)
  returning id into e_tricipes;

  insert into public.exercises (user_id, name, description, muscle_group, category, is_global, created_by, updated_by)
  values (staff_id, 'Elevaciones laterales', 'Elevaciones laterales con mancuernas', 'Hombros', 'Fuerza', true, staff_id, staff_id)
  returning id into e_elevaciones;

  insert into public.exercises (user_id, name, description, muscle_group, category, is_global, created_by, updated_by)
  values (staff_id, 'Femoral acostado', 'Curl femoral acostado en máquina', 'Isquiotibiales', 'Fuerza', true, staff_id, staff_id)
  returning id into e_femoral;

  insert into public.exercises (user_id, name, description, muscle_group, category, is_global, created_by, updated_by)
  values (staff_id, 'Prensa piernas', 'Prensa de piernas inclinada', 'Cuádriceps', 'Fuerza', true, staff_id, staff_id)
  returning id into e_prensa;

  insert into public.exercises (user_id, name, description, muscle_group, category, is_global, created_by, updated_by)
  values (staff_id, 'Pantorrillas sentado', 'Elevación de pantorrillas sentado', 'Pantorrillas', 'Fuerza', true, staff_id, staff_id)
  returning id into e_pantorrillas;

  insert into public.exercises (user_id, name, description, muscle_group, category, is_global, created_by, updated_by)
  values (staff_id, 'Face pull', 'Face pull en polea para deltoides posterior', 'Hombros', 'Fuerza', true, staff_id, staff_id)
  returning id into e_face_pull;

  -- ================================================================
  -- ROUTINES (is_template = true)
  -- ================================================================

  -- PUSH
  insert into public.routines (user_id, name, description, is_template)
  values (staff_id, 'Push', 'Pecho, hombros y triceps', true)
  returning id into r_push;

  insert into public.routine_exercises (routine_id, exercise_id, sets, reps, rest_time, sort_order)
  values
    (r_push, e_press_banca, 4, 8, 120, 1),
    (r_push, e_press_inclinado, 3, 10, 90, 2),
    (r_push, e_press_militar, 3, 10, 90, 3),
    (r_push, e_elevaciones, 3, 12, 60, 4),
    (r_push, e_tricipes, 3, 12, 60, 5),
    (r_push, e_face_pull, 3, 12, 60, 6);

  -- PULL
  insert into public.routines (user_id, name, description, is_template)
  values (staff_id, 'Pull', 'Espalda y biceps', true)
  returning id into r_pull;

  insert into public.routine_exercises (routine_id, exercise_id, sets, reps, rest_time, sort_order)
  values
    (r_pull, e_peso_muerto, 3, 5, 150, 1),
    (r_pull, e_remo_barra, 4, 8, 120, 2),
    (r_pull, e_dominadas, 3, 8, 90, 3),
    (r_pull, e_jalon, 3, 10, 90, 4),
    (r_pull, e_curl_biceps, 3, 10, 60, 5);

  -- PIERNAS
  insert into public.routines (user_id, name, description, is_template)
  values (staff_id, 'Piernas', 'Cuadriceps, isquiotibiales y pantorrillas', true)
  returning id into r_piernas;

  insert into public.routine_exercises (routine_id, exercise_id, sets, reps, rest_time, sort_order)
  values
    (r_piernas, e_sentadilla, 4, 8, 150, 1),
    (r_piernas, e_prensa, 3, 10, 120, 2),
    (r_piernas, e_femoral, 3, 10, 90, 3),
    (r_piernas, e_pantorrillas, 4, 12, 60, 4),
    (r_piernas, e_peso_muerto, 3, 8, 120, 5);

  raise notice 'Seed complete: 15 exercises, 3 routines created for staff@a.com';
end $$;
