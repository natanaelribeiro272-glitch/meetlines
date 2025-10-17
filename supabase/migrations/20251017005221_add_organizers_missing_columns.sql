/*
  # Add Missing Organizers Columns
  
  1. Changes
    - Add avatar_url column to organizers
    - Add category column to organizers
    
  2. Notes
    - These columns are used in the onboarding flow
*/

-- Add avatar_url column to organizers
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'organizers' AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE public.organizers ADD COLUMN avatar_url TEXT;
  END IF;

  -- Add category column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'organizers' AND column_name = 'category'
  ) THEN
    ALTER TABLE public.organizers ADD COLUMN category TEXT;
  END IF;
END $$;