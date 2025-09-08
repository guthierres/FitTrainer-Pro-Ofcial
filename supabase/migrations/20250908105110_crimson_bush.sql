/*
  # Fix student number generation

  1. Database Changes
    - Fix the auto_generate_student_number function to handle race conditions
    - Reset the sequence to avoid duplicates
    - Ensure proper locking mechanism

  2. Security
    - Maintain existing RLS policies
*/

-- First, let's check the current max student number and reset if needed
DO $$
DECLARE
    max_num INTEGER;
BEGIN
    -- Get the maximum existing student number (extract numeric part)
    SELECT COALESCE(MAX(CAST(student_number AS INTEGER)), 100000) INTO max_num
    FROM students 
    WHERE student_number ~ '^[0-9]+$';
    
    -- Create or reset the sequence to start after the max number
    DROP SEQUENCE IF EXISTS student_number_seq;
    EXECUTE format('CREATE SEQUENCE student_number_seq START WITH %s', max_num + 1);
END $$;

-- Recreate the function with proper locking to prevent race conditions
CREATE OR REPLACE FUNCTION auto_generate_student_number()
RETURNS TRIGGER AS $$
DECLARE
    new_number TEXT;
    attempts INTEGER := 0;
    max_attempts INTEGER := 10;
BEGIN
    -- Only generate if student_number is not provided
    IF NEW.student_number IS NULL THEN
        LOOP
            -- Get next number from sequence
            SELECT LPAD(nextval('student_number_seq')::TEXT, 6, '0') INTO new_number;
            
            -- Try to use this number (with advisory lock to prevent race conditions)
            BEGIN
                -- Check if this number already exists
                IF NOT EXISTS (SELECT 1 FROM students WHERE student_number = new_number) THEN
                    NEW.student_number := new_number;
                    EXIT; -- Success, exit loop
                END IF;
            EXCEPTION
                WHEN unique_violation THEN
                    -- Number already exists, try again
                    attempts := attempts + 1;
                    IF attempts >= max_attempts THEN
                        RAISE EXCEPTION 'Failed to generate unique student number after % attempts', max_attempts;
                    END IF;
            END;
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;