/*
  # Create Event Statistics Functions

  1. Functions
    - `get_event_likes_count`: Get likes count for multiple events
    - `get_event_comments_count`: Get comments count for multiple events
    - `get_event_registrations_stats`: Get registration statistics for multiple events

  2. Performance
    - These functions use aggregations to reduce database queries
    - Returns data in a format optimized for the frontend
*/

-- Function to get likes count for multiple events
CREATE OR REPLACE FUNCTION get_event_likes_count(event_ids uuid[])
RETURNS TABLE (event_id uuid, count bigint)
LANGUAGE sql
STABLE
AS $$
  SELECT event_id, COUNT(*) as count
  FROM event_likes
  WHERE event_id = ANY(event_ids)
  GROUP BY event_id;
$$;

-- Function to get comments count for multiple events
CREATE OR REPLACE FUNCTION get_event_comments_count(event_ids uuid[])
RETURNS TABLE (event_id uuid, count bigint)
LANGUAGE sql
STABLE
AS $$
  SELECT event_id, COUNT(*) as count
  FROM event_comments
  WHERE event_id = ANY(event_ids)
  GROUP BY event_id;
$$;

-- Function to get registration statistics for multiple events
CREATE OR REPLACE FUNCTION get_event_registrations_stats(event_ids uuid[])
RETURNS TABLE (
  event_id uuid,
  total bigint,
  confirmed bigint,
  unique_users bigint
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    event_id,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE attendance_confirmed = true) as confirmed,
    COUNT(DISTINCT user_id) as unique_users
  FROM event_registrations
  WHERE event_id = ANY(event_ids)
  GROUP BY event_id;
$$;