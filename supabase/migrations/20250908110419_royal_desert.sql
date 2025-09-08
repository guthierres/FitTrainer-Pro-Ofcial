/*
  # Fix exercise completion policies

  1. Security Updates
    - Update RLS policies for exercise_completions table
    - Allow students to insert their own completions via public access
    - Ensure proper access control for student data

  2. Policy Changes
    - Modify public_exercise_completions_access policy to allow INSERT operations
    - Ensure students can mark exercises as completed using their context
*/

-- Drop existing policies for exercise_completions
DROP POLICY IF EXISTS "public_exercise_completions_access" ON exercise_completions;
DROP POLICY IF EXISTS "trainers_view_exercise_completions" ON exercise_completions;

-- Create new policies that allow students to insert completions
CREATE POLICY "students_manage_own_completions"
  ON exercise_completions
  FOR ALL
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM students s
      WHERE s.id = exercise_completions.student_id
      AND (
        s.student_number::text = (current_setting('request.jwt.claims', true)::json ->> 'student_number')
        OR s.unique_link_token = (current_setting('request.jwt.claims', true)::json ->> 'student_token')
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM students s
      WHERE s.id = exercise_completions.student_id
      AND (
        s.student_number::text = (current_setting('request.jwt.claims', true)::json ->> 'student_number')
        OR s.unique_link_token = (current_setting('request.jwt.claims', true)::json ->> 'student_token')
      )
    )
  );

-- Allow trainers to view exercise completions of their students
CREATE POLICY "trainers_view_exercise_completions"
  ON exercise_completions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students s
      JOIN personal_trainers pt ON pt.id = s.personal_trainer_id
      WHERE s.id = exercise_completions.student_id
      AND pt.auth_user_id = auth.uid()
    )
  );

-- Also fix meal completions with the same pattern
DROP POLICY IF EXISTS "public_meal_completions_access" ON meal_completions;
DROP POLICY IF EXISTS "trainers_view_meal_completions" ON meal_completions;

CREATE POLICY "students_manage_own_meal_completions"
  ON meal_completions
  FOR ALL
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM students s
      WHERE s.id = meal_completions.student_id
      AND (
        s.student_number::text = (current_setting('request.jwt.claims', true)::json ->> 'student_number')
        OR s.unique_link_token = (current_setting('request.jwt.claims', true)::json ->> 'student_token')
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM students s
      WHERE s.id = meal_completions.student_id
      AND (
        s.student_number::text = (current_setting('request.jwt.claims', true)::json ->> 'student_number')
        OR s.unique_link_token = (current_setting('request.jwt.claims', true)::json ->> 'student_token')
      )
    )
  );

CREATE POLICY "trainers_view_meal_completions"
  ON meal_completions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students s
      JOIN personal_trainers pt ON pt.id = s.personal_trainer_id
      WHERE s.id = meal_completions.student_id
      AND pt.auth_user_id = auth.uid()
    )
  );