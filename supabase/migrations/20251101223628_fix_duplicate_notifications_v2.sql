/*
  # Fix Duplicate Notifications
  
  1. Changes
    - Remove duplicate notifications keeping only the newest one per group
    - Add unique constraint to prevent future duplicates for friend requests
  
  2. Notes
    - Keeps one notification per (user_id, type, message, created_at) combination
    - Prevents duplicate friend requests
*/

-- Remove duplicates, keeping only one notification per group
WITH duplicates AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, type, message, created_at 
      ORDER BY id
    ) as row_num
  FROM notifications
)
DELETE FROM notifications
WHERE id IN (
  SELECT id FROM duplicates WHERE row_num > 1
);

-- Create a partial unique index to prevent duplicate friend requests
-- Only one friend request notification per user from each sender
CREATE UNIQUE INDEX IF NOT EXISTS idx_notifications_unique_friend_request
  ON notifications (user_id, type, from_user_id)
  WHERE type = 'friend_request' AND read = false;
