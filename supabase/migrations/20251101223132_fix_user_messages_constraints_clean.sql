/*
  # Fix user_messages table constraints with cleanup
  
  1. Changes
    - Clean orphaned messages (from deleted users)
    - Add foreign key constraints for from_user_id and to_user_id
    - Add performance indexes
  
  2. Security
    - Maintains existing RLS policies
*/

-- First, delete orphaned messages where users no longer exist
DELETE FROM user_messages
WHERE from_user_id NOT IN (SELECT id FROM auth.users)
   OR to_user_id NOT IN (SELECT id FROM auth.users);

-- Add foreign key constraint for from_user_id if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_messages_from_user_id_fkey'
  ) THEN
    ALTER TABLE user_messages
      ADD CONSTRAINT user_messages_from_user_id_fkey
      FOREIGN KEY (from_user_id)
      REFERENCES auth.users(id)
      ON DELETE CASCADE;
  END IF;

  -- Add foreign key constraint for to_user_id if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_messages_to_user_id_fkey'
  ) THEN
    ALTER TABLE user_messages
      ADD CONSTRAINT user_messages_to_user_id_fkey
      FOREIGN KEY (to_user_id)
      REFERENCES auth.users(id)
      ON DELETE CASCADE;
  END IF;
END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_messages_from_user ON user_messages(from_user_id);
CREATE INDEX IF NOT EXISTS idx_user_messages_to_user ON user_messages(to_user_id);
CREATE INDEX IF NOT EXISTS idx_user_messages_created_at ON user_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_messages_conversation ON user_messages(from_user_id, to_user_id, created_at);
