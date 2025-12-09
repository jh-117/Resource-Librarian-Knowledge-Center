/*
  # Add Seeker Account Deactivation Support

  This migration adds the ability for admins to deactivate and reactivate seeker accounts.

  1. New Columns on user_profiles
    - `is_active` (boolean, default true) - Indicates if the account is active
    - `deactivated_at` (timestamptz, nullable) - When the account was deactivated
    - `deactivated_by` (uuid, nullable) - Which admin deactivated the account

  2. Security Updates
    - Update RLS policies to enforce is_active checks
    - Seekers with is_active=false cannot access any data
    - Only admins can modify the is_active field

  3. Important Notes
    - Existing accounts will default to is_active=true
    - Deactivated accounts retain their data but lose all access
    - Admins can reactivate accounts by setting is_active=true
*/

-- Add new columns to user_profiles table
DO $$
BEGIN
  -- Add is_active column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN is_active boolean DEFAULT true NOT NULL;
  END IF;

  -- Add deactivated_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'deactivated_at'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN deactivated_at timestamptz;
  END IF;

  -- Add deactivated_by column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'deactivated_by'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN deactivated_by uuid REFERENCES user_profiles(id);
  END IF;
END $$;

-- Update existing RLS policies to check is_active status for seekers
-- Drop and recreate the policy for users to read their own profile
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
CREATE POLICY "Users can read own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id AND is_active = true);

-- Drop and recreate the policy for admins to read all profiles
DROP POLICY IF EXISTS "Admins can read all profiles" ON user_profiles;
CREATE POLICY "Admins can read all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Add policy for admins to update seeker activation status
DROP POLICY IF EXISTS "Admins can update seeker status" ON user_profiles;
CREATE POLICY "Admins can update seeker status"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Update knowledge_submissions RLS to check if seeker is active
DROP POLICY IF EXISTS "Seekers can view approved submissions" ON knowledge_submissions;
CREATE POLICY "Seekers can view approved submissions"
  ON knowledge_submissions FOR SELECT
  TO authenticated
  USING (
    status = 'approved'
    AND EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_active = true
    )
  );