/*
  # Add birth_date to profiles table

  1. Changes
    - Add `birth_date` column to profiles table (date type)
    - Remove the old `age` column as it will be calculated automatically
    - Create a function to calculate age from birth_date
    - Create a view or computed column for age

  2. Notes
    - birth_date stores the user's date of birth
    - Age is calculated automatically based on birth_date
    - Users only need to input their birth date once
*/

-- Add birth_date column to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'birth_date'
  ) THEN
    ALTER TABLE profiles ADD COLUMN birth_date date;
  END IF;
END $$;

-- Create a function to calculate age from birth_date
CREATE OR REPLACE FUNCTION calculate_age(birth_date date)
RETURNS integer
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF birth_date IS NULL THEN
    RETURN NULL;
  END IF;
  
  RETURN DATE_PART('year', AGE(birth_date));
END;
$$;

-- Add comment to explain the column
COMMENT ON COLUMN profiles.birth_date IS 'User date of birth. Age is automatically calculated from this field.';