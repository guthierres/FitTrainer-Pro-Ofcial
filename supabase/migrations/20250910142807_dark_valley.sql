/*
  # Fix duplicate policy error and disable RLS for student access

  1. Drop existing policies safely
  2. Disable RLS on tables that need public access
  3. Keep RLS only on personal_trainers table
  4. Grant necessary permissions
*/

-- Drop all existing policies safely (IF EXISTS prevents errors)
DROP POLICY IF EXISTS "public_student_access" ON students;
DROP POLICY IF EXISTS "students_public_read" ON students;
DROP POLICY IF EXISTS "students_trainer_select" ON students;
DROP POLICY IF EXISTS "students_trainer_insert" ON students;
DROP POLICY IF EXISTS "students_trainer_update" ON students;
DROP POLICY IF EXISTS "students_trainer_delete" ON students;
DROP POLICY IF EXISTS "students_trainer_all" ON students;
DROP POLICY IF EXISTS "students_super_admin" ON students;

DROP POLICY IF EXISTS "public_workout_plans_access" ON workout_plans;
DROP POLICY IF EXISTS "workout_plans_public_read" ON workout_plans;
DROP POLICY IF EXISTS "workout_plans_trainer_all" ON workout_plans;
DROP POLICY IF EXISTS "workout_plans_super_admin" ON workout_plans;
DROP POLICY IF EXISTS "super_admin_access_workout_plans" ON workout_plans;
DROP POLICY IF EXISTS "trainers_manage_workout_plans" ON workout_plans;

DROP POLICY IF EXISTS "public_workout_sessions_access" ON workout_sessions;
DROP POLICY IF EXISTS "workout_sessions_public_read" ON workout_sessions;
DROP POLICY IF EXISTS "workout_sessions_trainer_all" ON workout_sessions;
DROP POLICY IF EXISTS "trainers_manage_workout_sessions" ON workout_sessions;

DROP POLICY IF EXISTS "public_workout_exercises_access" ON workout_exercises;
DROP POLICY IF EXISTS "workout_exercises_public_read" ON workout_exercises;
DROP POLICY IF EXISTS "workout_exercises_trainer_all" ON workout_exercises;
DROP POLICY IF EXISTS "trainers_manage_workout_exercises" ON workout_exercises;

DROP POLICY IF EXISTS "public_diet_plans_access" ON diet_plans;
DROP POLICY IF EXISTS "diet_plans_public_read" ON diet_plans;
DROP POLICY IF EXISTS "diet_plans_trainer_all" ON diet_plans;
DROP POLICY IF EXISTS "diet_plans_super_admin" ON diet_plans;
DROP POLICY IF EXISTS "super_admin_access_diet_plans" ON diet_plans;
DROP POLICY IF EXISTS "trainers_manage_diet_plans" ON diet_plans;

DROP POLICY IF EXISTS "public_meals_access" ON meals;
DROP POLICY IF EXISTS "meals_public_read" ON meals;
DROP POLICY IF EXISTS "meals_trainer_all" ON meals;
DROP POLICY IF EXISTS "trainers_manage_meals" ON meals;

DROP POLICY IF EXISTS "public_meal_foods_access" ON meal_foods;
DROP POLICY IF EXISTS "meal_foods_public_read" ON meal_foods;
DROP POLICY IF EXISTS "meal_foods_trainer_all" ON meal_foods;
DROP POLICY IF EXISTS "trainers_manage_meal_foods" ON meal_foods;

DROP POLICY IF EXISTS "students_manage_own_exercise_completions" ON exercise_completions;
DROP POLICY IF EXISTS "students_view_own_exercise_completions" ON exercise_completions;
DROP POLICY IF EXISTS "exercise_completions_student_manage" ON exercise_completions;
DROP POLICY IF EXISTS "exercise_completions_trainer_view" ON exercise_completions;
DROP POLICY IF EXISTS "exercise_completions_super_admin" ON exercise_completions;
DROP POLICY IF EXISTS "super_admin_access_exercise_completions" ON exercise_completions;
DROP POLICY IF EXISTS "trainers_view_student_exercise_completions" ON exercise_completions;

DROP POLICY IF EXISTS "students_manage_own_meal_completions" ON meal_completions;
DROP POLICY IF EXISTS "students_view_own_meal_completions" ON meal_completions;
DROP POLICY IF EXISTS "meal_completions_student_manage" ON meal_completions;
DROP POLICY IF EXISTS "meal_completions_trainer_view" ON meal_completions;
DROP POLICY IF EXISTS "meal_completions_super_admin" ON meal_completions;
DROP POLICY IF EXISTS "super_admin_access_meal_completions" ON meal_completions;
DROP POLICY IF EXISTS "trainers_view_student_meal_completions" ON meal_completions;

DROP POLICY IF EXISTS "public_exercises_read" ON exercises;
DROP POLICY IF EXISTS "exercises_public_read" ON exercises;
DROP POLICY IF EXISTS "exercises_trainer_manage" ON exercises;
DROP POLICY IF EXISTS "trainers_manage_exercises" ON exercises;

DROP POLICY IF EXISTS "public_exercise_categories" ON exercise_categories;
DROP POLICY IF EXISTS "exercise_categories_public_read" ON exercise_categories;

DROP POLICY IF EXISTS "super_admin_access_trainers" ON personal_trainers;
DROP POLICY IF EXISTS "trainers_own_data" ON personal_trainers;
DROP POLICY IF EXISTS "trainers_super_admin" ON personal_trainers;

-- Disable RLS on tables that need public access for students
ALTER TABLE students DISABLE ROW LEVEL SECURITY;
ALTER TABLE workout_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE workout_exercises DISABLE ROW LEVEL SECURITY;
ALTER TABLE diet_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE meals DISABLE ROW LEVEL SECURITY;
ALTER TABLE meal_foods DISABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_completions DISABLE ROW LEVEL SECURITY;
ALTER TABLE meal_completions DISABLE ROW LEVEL SECURITY;
ALTER TABLE exercises DISABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_categories DISABLE ROW LEVEL SECURITY;

-- Keep RLS enabled only on personal_trainers for security
ALTER TABLE personal_trainers ENABLE ROW LEVEL SECURITY;

-- Create only essential policies for personal_trainers
CREATE POLICY "trainers_own_data" ON personal_trainers
  FOR ALL
  TO authenticated
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());

CREATE POLICY "trainers_super_admin" ON personal_trainers
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND email = 'guthierresc@hotmail.com'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND email = 'guthierresc@hotmail.com'
    )
  );

-- Grant necessary permissions to anon and authenticated users
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Ensure anon can access all tables except personal_trainers
GRANT SELECT, INSERT, UPDATE, DELETE ON students TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON workout_plans TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON workout_sessions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON workout_exercises TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON diet_plans TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON meals TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON meal_foods TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON exercise_completions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON meal_completions TO anon;
GRANT SELECT ON exercises TO anon;
GRANT SELECT ON exercise_categories TO anon;

-- Only SELECT permission for personal_trainers to anon (RLS will control access)
GRANT SELECT ON personal_trainers TO anon;