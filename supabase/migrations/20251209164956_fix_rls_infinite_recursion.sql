/*
  # Fix RLS Infinite Recursion Issue

  This migration fixes the infinite recursion error by simplifying the RLS policies.
  Instead of checking role and is_active in the database policies, we let users
  read their own profiles and handle activation checks in the application layer.

  1. Changes
    - Allow all authenticated users to read their own profile
    - Simplify admin policy to avoid recursion
    - Application layer handles is_active enforcement

  2. Security Notes
    - Users can only read their own profile data
    - Admins can read all profiles
    - is_active enforcement happens in App.jsx on the client side
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON user_profiles;

-- Allow users to read their own profile (no recursion)
CREATE POLICY "Users can read own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Create a security definer function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Allow admins to read all profiles using the security definer function
CREATE POLICY "Admins can read all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (is_admin());