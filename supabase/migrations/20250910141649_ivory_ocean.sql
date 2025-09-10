/*
  # Fix RLS policy for student insertion

  1. Drop existing student policies
  2. Create new policies that allow trainers to insert students
  3. Ensure proper WITH CHECK clause for INSERT operations

  The issue is that the WITH CHECK clause needs to properly validate
  that the trainer can insert students with their own trainer ID.
*/

-- Drop existing student policies
DROP POLICY IF EXISTS "students_public_read" ON students;
DROP POLICY IF EXISTS "students_trainer_all" ON students;
DROP POLICY IF EXISTS "students_super_admin" ON students;

-- Create new student policies with proper INSERT support
CREATE POLICY "students_public_read" ON students
  FOR SELECT
  TO anon
  USING (
    active = true AND (
      student_number = get_student_context('number') OR
      unique_link_token = get_student_context('token')
    )
  );

-- Separate policies for different operations to be more explicit
CREATE POLICY "students_trainer_select" ON students
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM personal_trainers pt
      WHERE pt.id = students.personal_trainer_id
      AND pt.auth_user_id = auth.uid()
      AND pt.active = true
    )
  );

CREATE POLICY "students_trainer_insert" ON students
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM personal_trainers pt
      WHERE pt.id = personal_trainer_id
      AND pt.auth_user_id = auth.uid()
      AND pt.active = true
    )
  );

CREATE POLICY "students_trainer_update" ON students
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM personal_trainers pt
      WHERE pt.id = students.personal_trainer_id
      AND pt.auth_user_id = auth.uid()
      AND pt.active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM personal_trainers pt
      WHERE pt.id = personal_trainer_id
      AND pt.auth_user_id = auth.uid()
      AND pt.active = true
    )
  );

CREATE POLICY "students_trainer_delete" ON students
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM personal_trainers pt
      WHERE pt.id = students.personal_trainer_id
      AND pt.auth_user_id = auth.uid()
      AND pt.active = true
    )
  );

CREATE POLICY "students_super_admin" ON students
  FOR ALL
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());