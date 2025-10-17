/*
  # Add Missing Profile Columns
  
  1. Changes
    - Add username column (unique identifier for users)
    - Add display_name column (user's display name)
    - Add user_id column (reference to auth.users)
    - Add instagram_url column (social media link)
    - Add interests column (array of user interests)
    - Add notes column (additional user notes)
    
  2. Security
    - Maintain existing RLS policies
    - Add unique constraint on username
*/

-- Add missing columns to profiles table
DO $$ 
BEGIN
  -- Add user_id if not exists (should reference the id column)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    -- Copy id to user_id for existing records
    UPDATE public.profiles SET user_id = id WHERE user_id IS NULL;
  END IF;

  -- Add username column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'username'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN username TEXT UNIQUE;
  END IF;

  -- Add display_name column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'display_name'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN display_name TEXT;
  END IF;

  -- Add instagram_url column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'instagram_url'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN instagram_url TEXT;
  END IF;

  -- Add interests column (array of text)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'interests'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN interests TEXT[] DEFAULT ARRAY[]::TEXT[];
  END IF;

  -- Add notes column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'notes'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN notes TEXT;
  END IF;
END $$;

-- Create index on username for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);