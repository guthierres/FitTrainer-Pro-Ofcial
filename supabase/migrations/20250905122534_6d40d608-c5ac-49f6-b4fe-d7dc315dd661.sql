-- Fix security warning: Set search_path for all functions
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION generate_student_link_token()
RETURNS TEXT 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN encode(gen_random_bytes(16), 'base64url');
END;
$$;

CREATE OR REPLACE FUNCTION auto_generate_student_token()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.unique_link_token IS NULL OR NEW.unique_link_token = '' THEN
        NEW.unique_link_token = generate_student_link_token();
    END IF;
    RETURN NEW;
END;
$$;