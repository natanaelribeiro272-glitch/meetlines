/*
  # Fix friendships UPDATE policy
  
  1. Changes
    - Add WITH CHECK clause to UPDATE policy
    - Ensures user can only accept requests where they are the friend
  
  2. Security
    - Properly validates UPDATE operations
    - Prevents unauthorized status changes
*/

-- Drop the existing policy
DROP POLICY IF EXISTS "Users can accept friendship requests" ON friendships;

-- Recreate with both USING and WITH CHECK
CREATE POLICY "Users can accept friendship requests"
  ON friendships
  FOR UPDATE
  TO public
  USING (auth.uid() = friend_id AND status = 'pending')
  WITH CHECK (auth.uid() = friend_id);
