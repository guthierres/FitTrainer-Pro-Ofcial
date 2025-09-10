/*
  # Fix Super Admin Permissions

  1. Security Updates
    - Create proper RLS policies for super admin access
    - Grant necessary permissions for personal_trainers table
    - Fix auth.users table access permissions
    - Remove duplicate stats cards

  2. Changes
    - Enable RLS on personal_trainers table
    - Create super admin policy for personal_trainers
    - Create super admin policy for auth.users (if needed)
    - Grant proper permissions to authenticated users
*/

-- First, ensure RLS is enabled on personal_trainers
ALTER TABLE personal_trainers ENABLE ROW LEVEL SECURITY;

-- Drop existing conflicting policies to avoid duplicates
DROP POLICY IF EXISTS "trainers_own_data" ON personal_trainers;
DROP POLICY IF EXISTS "trainers_super_admin" ON personal_trainers;
DROP POLICY IF EXISTS "Super admin can view all personal trainers" ON personal_trainers;

-- Create comprehensive super admin policy for personal_trainers
CREATE POLICY "super_admin_full_access" ON personal_trainers
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.email = 'guthierresc@hotmail.com'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.email = 'guthierresc@hotmail.com'
  )
);

-- Create policy for trainers to access their own data
CREATE POLICY "trainers_own_data_access" ON personal_trainers
FOR ALL
TO authenticated
USING (auth_user_id = auth.uid())
WITH CHECK (auth_user_id = auth.uid());

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON personal_trainers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON students TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON workout_plans TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON diet_plans TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON workout_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON workout_exercises TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON meals TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON meal_foods TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON exercises TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON exercise_categories TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON exercise_completions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON meal_completions TO authenticated;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Ensure the super admin can access the trainer_stats view
GRANT SELECT ON trainer_stats TO authenticated;