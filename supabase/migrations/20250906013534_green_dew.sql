/*
  # Fix RLS policies for better functionality

  1. Security Updates
    - Simplify RLS policies to allow proper functionality
    - Fix student creation and login issues
    - Maintain basic security while allowing operations

  2. Policy Changes
    - Allow trainers to create and manage students
    - Allow students to access their own data via token
    - Fix workout and diet plan access
*/

-- Disable RLS temporarily to fix policies
ALTER TABLE students DISABLE ROW LEVEL SECURITY;

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Students can view their own data via token" ON students;
DROP POLICY IF EXISTS "Trainers can access their own students" ON students;

-- Re-enable RLS
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- Create simplified policies for students
CREATE POLICY "Allow trainers to manage their students"
  ON students
  FOR ALL
  TO public
  USING (
    personal_trainer_id IN (
      SELECT id FROM personal_trainers 
      WHERE cpf = current_setting('request.jwt.claims', true)::json->>'cpf'
      OR id::text = current_setting('request.jwt.claims', true)::json->>'trainer_id'
    )
  )
  WITH CHECK (
    personal_trainer_id IN (
      SELECT id FROM personal_trainers 
      WHERE cpf = current_setting('request.jwt.claims', true)::json->>'cpf'
      OR id::text = current_setting('request.jwt.claims', true)::json->>'trainer_id'
    )
  );

CREATE POLICY "Allow students to view their data via token"
  ON students
  FOR SELECT
  TO public
  USING (
    unique_link_token = current_setting('request.jwt.claims', true)::json->>'student_token'
    OR active = true
  );

-- Fix workout plans policies
DROP POLICY IF EXISTS "Workout plans - trainer access only" ON workout_plans;

CREATE POLICY "Trainers can manage workout plans"
  ON workout_plans
  FOR ALL
  TO public
  USING (
    personal_trainer_id IN (
      SELECT id FROM personal_trainers 
      WHERE cpf = current_setting('request.jwt.claims', true)::json->>'cpf'
      OR id::text = current_setting('request.jwt.claims', true)::json->>'trainer_id'
    )
    OR student_id IN (
      SELECT id FROM students 
      WHERE unique_link_token = current_setting('request.jwt.claims', true)::json->>'student_token'
    )
  );

-- Fix workout sessions policies
DROP POLICY IF EXISTS "Workout sessions - trainer access only" ON workout_sessions;

CREATE POLICY "Allow access to workout sessions"
  ON workout_sessions
  FOR ALL
  TO public
  USING (
    workout_plan_id IN (
      SELECT id FROM workout_plans 
      WHERE personal_trainer_id IN (
        SELECT id FROM personal_trainers 
        WHERE cpf = current_setting('request.jwt.claims', true)::json->>'cpf'
        OR id::text = current_setting('request.jwt.claims', true)::json->>'trainer_id'
      )
      OR student_id IN (
        SELECT id FROM students 
        WHERE unique_link_token = current_setting('request.jwt.claims', true)::json->>'student_token'
      )
    )
  );

-- Fix workout exercises policies
DROP POLICY IF EXISTS "Workout exercises - trainer access only" ON workout_exercises;

CREATE POLICY "Allow access to workout exercises"
  ON workout_exercises
  FOR ALL
  TO public
  USING (
    workout_session_id IN (
      SELECT ws.id FROM workout_sessions ws
      JOIN workout_plans wp ON wp.id = ws.workout_plan_id
      WHERE wp.personal_trainer_id IN (
        SELECT id FROM personal_trainers 
        WHERE cpf = current_setting('request.jwt.claims', true)::json->>'cpf'
        OR id::text = current_setting('request.jwt.claims', true)::json->>'trainer_id'
      )
      OR wp.student_id IN (
        SELECT id FROM students 
        WHERE unique_link_token = current_setting('request.jwt.claims', true)::json->>'student_token'
      )
    )
  );

-- Fix exercise completions policies
DROP POLICY IF EXISTS "Exercise completions - trainer and student access" ON exercise_completions;

CREATE POLICY "Allow exercise completions access"
  ON exercise_completions
  FOR ALL
  TO public
  USING (
    student_id IN (
      SELECT id FROM students 
      WHERE personal_trainer_id IN (
        SELECT id FROM personal_trainers 
        WHERE cpf = current_setting('request.jwt.claims', true)::json->>'cpf'
        OR id::text = current_setting('request.jwt.claims', true)::json->>'trainer_id'
      )
      OR unique_link_token = current_setting('request.jwt.claims', true)::json->>'student_token'
    )
  );

-- Fix diet plans policies
DROP POLICY IF EXISTS "Diet plans - trainer access only" ON diet_plans;

CREATE POLICY "Allow diet plans access"
  ON diet_plans
  FOR ALL
  TO public
  USING (
    personal_trainer_id IN (
      SELECT id FROM personal_trainers 
      WHERE cpf = current_setting('request.jwt.claims', true)::json->>'cpf'
      OR id::text = current_setting('request.jwt.claims', true)::json->>'trainer_id'
    )
    OR student_id IN (
      SELECT id FROM students 
      WHERE unique_link_token = current_setting('request.jwt.claims', true)::json->>'student_token'
    )
  );

-- Fix meals policies
DROP POLICY IF EXISTS "Meals - trainer access only" ON meals;

CREATE POLICY "Allow meals access"
  ON meals
  FOR ALL
  TO public
  USING (
    diet_plan_id IN (
      SELECT dp.id FROM diet_plans dp
      WHERE dp.personal_trainer_id IN (
        SELECT id FROM personal_trainers 
        WHERE cpf = current_setting('request.jwt.claims', true)::json->>'cpf'
        OR id::text = current_setting('request.jwt.claims', true)::json->>'trainer_id'
      )
      OR dp.student_id IN (
        SELECT id FROM students 
        WHERE unique_link_token = current_setting('request.jwt.claims', true)::json->>'student_token'
      )
    )
  );

-- Fix meal foods policies
DROP POLICY IF EXISTS "Meal foods - trainer access only" ON meal_foods;

CREATE POLICY "Allow meal foods access"
  ON meal_foods
  FOR ALL
  TO public
  USING (
    meal_id IN (
      SELECT m.id FROM meals m
      JOIN diet_plans dp ON dp.id = m.diet_plan_id
      WHERE dp.personal_trainer_id IN (
        SELECT id FROM personal_trainers 
        WHERE cpf = current_setting('request.jwt.claims', true)::json->>'cpf'
        OR id::text = current_setting('request.jwt.claims', true)::json->>'trainer_id'
      )
      OR dp.student_id IN (
        SELECT id FROM students 
        WHERE unique_link_token = current_setting('request.jwt.claims', true)::json->>'student_token'
      )
    )
  );

-- Fix meal completions policies
DROP POLICY IF EXISTS "Meal completions - trainer and student access" ON meal_completions;

CREATE POLICY "Allow meal completions access"
  ON meal_completions
  FOR ALL
  TO public
  USING (
    student_id IN (
      SELECT id FROM students 
      WHERE personal_trainer_id IN (
        SELECT id FROM personal_trainers 
        WHERE cpf = current_setting('request.jwt.claims', true)::json->>'cpf'
        OR id::text = current_setting('request.jwt.claims', true)::json->>'trainer_id'
      )
      OR unique_link_token = current_setting('request.jwt.claims', true)::json->>'student_token'
    )
  );