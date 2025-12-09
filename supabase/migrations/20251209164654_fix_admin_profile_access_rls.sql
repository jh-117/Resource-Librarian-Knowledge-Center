/*
  # Fix Admin Profile Access RLS

  This migration fixes the RLS policy to allow admins to access their profiles
  regardless of is_active status. Only seekers should be subject to the is_active check.

  1. Changes
    - Update "Users can read own profile" policy to exclude admins from is_active check
    - Admins can always read their own profile
    - Seekers can only read their profile if is_active = true

  2. Important Notes
    - Admins are not subject to account deactivation
    - Only seeker accounts can be deactivated
*/

-- Drop and recreate the policy for users to read their own profile
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;

CREATE POLICY "Users can read own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id 
    AND (
      role = 'admin' 
      OR (role = 'seeker' AND is_active = true)
    )
  );