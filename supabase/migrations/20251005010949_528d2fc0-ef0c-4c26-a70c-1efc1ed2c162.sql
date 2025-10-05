-- Add preferred_theme column to organizers table
ALTER TABLE organizers 
ADD COLUMN IF NOT EXISTS preferred_theme TEXT DEFAULT 'dark' CHECK (preferred_theme IN ('dark', 'light'));