-- Create super_admins table for system administrators
CREATE TABLE public.super_admins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT 'Super Admin',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.super_admins ENABLE ROW LEVEL SECURITY;

-- Create policy for super admin access
CREATE POLICY "Super admins can manage their own data" 
ON public.super_admins 
FOR ALL 
USING (true);

-- Insert the specific super admin user
INSERT INTO public.super_admins (email, password_hash, name) 
VALUES ('guthierresc@hotmail.com', crypt('Gutim@2028', gen_salt('bf')), 'Guthierre Super Admin');

-- Add active column to personal_trainers for admin management
ALTER TABLE public.personal_trainers ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true;

-- Create trigger for updated_at
CREATE TRIGGER update_super_admins_updated_at
BEFORE UPDATE ON public.super_admins
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();