-- Create fitness theme colors and complete FitTrainer-Pro schema

-- Create personal trainers table
CREATE TABLE public.personal_trainers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cpf VARCHAR(14) NOT NULL UNIQUE, -- Format: 000.000.000-00
  birth_date DATE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  specializations TEXT[],
  cref TEXT, -- Professional registration
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create exercise categories and exercises
CREATE TABLE public.exercise_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  emoji TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.exercises (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES public.exercise_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  instructions TEXT,
  muscle_groups TEXT[],
  equipment TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create students table
CREATE TABLE public.students (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  personal_trainer_id UUID NOT NULL REFERENCES public.personal_trainers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  birth_date DATE,
  weight DECIMAL(5,2),
  height DECIMAL(3,2),
  goals TEXT[],
  medical_restrictions TEXT,
  unique_link_token TEXT NOT NULL UNIQUE, -- For accessing without login
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create workout plans
CREATE TABLE public.workout_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  personal_trainer_id UUID NOT NULL REFERENCES public.personal_trainers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  frequency_per_week INTEGER NOT NULL DEFAULT 3,
  duration_weeks INTEGER NOT NULL DEFAULT 4,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create workout sessions (individual training days)
CREATE TABLE public.workout_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workout_plan_id UUID NOT NULL REFERENCES public.workout_plans(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL, -- 0-6 (Sunday-Saturday)
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create workout exercises (exercises within a session)
CREATE TABLE public.workout_exercises (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workout_session_id UUID NOT NULL REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  sets INTEGER NOT NULL DEFAULT 3,
  reps_min INTEGER,
  reps_max INTEGER,
  weight_kg DECIMAL(5,2),
  rest_seconds INTEGER DEFAULT 60,
  order_index INTEGER NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create exercise completions (student marks as done)
CREATE TABLE public.exercise_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workout_exercise_id UUID NOT NULL REFERENCES public.workout_exercises(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  sets_completed INTEGER,
  reps_completed INTEGER[],
  weight_used DECIMAL(5,2),
  notes TEXT
);

-- Create diet plans
CREATE TABLE public.diet_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  personal_trainer_id UUID NOT NULL REFERENCES public.personal_trainers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  daily_calories INTEGER,
  daily_protein DECIMAL(5,2),
  daily_carbs DECIMAL(5,2),
  daily_fat DECIMAL(5,2),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create meals
CREATE TABLE public.meals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  diet_plan_id UUID NOT NULL REFERENCES public.diet_plans(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- Breakfast, Lunch, Dinner, Snack, etc
  time_of_day TIME,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create meal foods
CREATE TABLE public.meal_foods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meal_id UUID NOT NULL REFERENCES public.meals(id) ON DELETE CASCADE,
  food_name TEXT NOT NULL,
  quantity DECIMAL(8,2) NOT NULL,
  unit TEXT NOT NULL, -- grams, ml, cups, etc
  calories DECIMAL(6,2),
  protein DECIMAL(5,2),
  carbs DECIMAL(5,2),
  fat DECIMAL(5,2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create meal completions
CREATE TABLE public.meal_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meal_id UUID NOT NULL REFERENCES public.meals(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT
);

-- Enable Row Level Security
ALTER TABLE public.personal_trainers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diet_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_completions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for personal trainers (they manage their own data)
CREATE POLICY "Personal trainers can view their own data" 
ON public.personal_trainers 
FOR ALL 
USING (true); -- Will implement proper auth later

CREATE POLICY "Anyone can view exercise categories and exercises" 
ON public.exercise_categories 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can view exercises" 
ON public.exercises 
FOR SELECT 
USING (true);

-- Students policies (accessible by their personal trainer and via unique link)
CREATE POLICY "Students accessible by their trainer or via link" 
ON public.students 
FOR ALL 
USING (true); -- Will implement proper auth later

CREATE POLICY "Workout plans accessible by trainer and student" 
ON public.workout_plans 
FOR ALL 
USING (true);

CREATE POLICY "Workout sessions accessible by trainer and student" 
ON public.workout_sessions 
FOR ALL 
USING (true);

CREATE POLICY "Workout exercises accessible by trainer and student" 
ON public.workout_exercises 
FOR ALL 
USING (true);

CREATE POLICY "Exercise completions accessible by student and trainer" 
ON public.exercise_completions 
FOR ALL 
USING (true);

CREATE POLICY "Diet plans accessible by trainer and student" 
ON public.diet_plans 
FOR ALL 
USING (true);

CREATE POLICY "Meals accessible by trainer and student" 
ON public.meals 
FOR ALL 
USING (true);

CREATE POLICY "Meal foods accessible by trainer and student" 
ON public.meal_foods 
FOR ALL 
USING (true);

CREATE POLICY "Meal completions accessible by student and trainer" 
ON public.meal_completions 
FOR ALL 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_personal_trainers_updated_at
    BEFORE UPDATE ON public.personal_trainers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_students_updated_at
    BEFORE UPDATE ON public.students
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workout_plans_updated_at
    BEFORE UPDATE ON public.workout_plans
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_diet_plans_updated_at
    BEFORE UPDATE ON public.diet_plans
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Insert exercise categories
INSERT INTO public.exercise_categories (name, emoji) VALUES
('Peito', '🏋️‍♂️'),
('Costas', '💪'),
('Pernas', '🦵'),
('Ombros', '🦾'),
('Braços', '🦾'),
('Abdômen', '🏃‍♂️');

-- Insert exercises for each category
INSERT INTO public.exercises (category_id, name, muscle_groups, equipment) VALUES
-- Peito
((SELECT id FROM public.exercise_categories WHERE name = 'Peito'), 'Supino reto', ARRAY['Peitoral maior', 'Tríceps', 'Deltóide anterior'], ARRAY['Barra', 'Banco']),
((SELECT id FROM public.exercise_categories WHERE name = 'Peito'), 'Supino inclinado', ARRAY['Peitoral maior', 'Tríceps', 'Deltóide anterior'], ARRAY['Barra', 'Banco inclinado']),
((SELECT id FROM public.exercise_categories WHERE name = 'Peito'), 'Supino declinado', ARRAY['Peitoral maior', 'Tríceps'], ARRAY['Barra', 'Banco declinado']),
((SELECT id FROM public.exercise_categories WHERE name = 'Peito'), 'Crucifixo (máquina, halteres ou cross)', ARRAY['Peitoral maior'], ARRAY['Halteres', 'Máquina', 'Cross']),
((SELECT id FROM public.exercise_categories WHERE name = 'Peito'), 'Peck deck', ARRAY['Peitoral maior'], ARRAY['Máquina peck deck']),

-- Costas
((SELECT id FROM public.exercise_categories WHERE name = 'Costas'), 'Puxada frente (pulldown)', ARRAY['Latíssimo do dorso', 'Bíceps'], ARRAY['Polia alta']),
((SELECT id FROM public.exercise_categories WHERE name = 'Costas'), 'Puxada atrás', ARRAY['Latíssimo do dorso', 'Bíceps'], ARRAY['Polia alta']),
((SELECT id FROM public.exercise_categories WHERE name = 'Costas'), 'Remada curvada', ARRAY['Latíssimo do dorso', 'Romboides'], ARRAY['Barra', 'Halteres']),
((SELECT id FROM public.exercise_categories WHERE name = 'Costas'), 'Remada baixa (máquina ou polia)', ARRAY['Latíssimo do dorso', 'Romboides'], ARRAY['Máquina', 'Polia baixa']),
((SELECT id FROM public.exercise_categories WHERE name = 'Costas'), 'Remada unilateral com halter', ARRAY['Latíssimo do dorso', 'Romboides'], ARRAY['Halter', 'Banco']),
((SELECT id FROM public.exercise_categories WHERE name = 'Costas'), 'Barra fixa', ARRAY['Latíssimo do dorso', 'Bíceps'], ARRAY['Barra fixa']),

-- Pernas
((SELECT id FROM public.exercise_categories WHERE name = 'Pernas'), 'Agachamento livre', ARRAY['Quadríceps', 'Glúteos'], ARRAY['Barra', 'Rack']),
((SELECT id FROM public.exercise_categories WHERE name = 'Pernas'), 'Agachamento no smith', ARRAY['Quadríceps', 'Glúteos'], ARRAY['Smith machine']),
((SELECT id FROM public.exercise_categories WHERE name = 'Pernas'), 'Leg press', ARRAY['Quadríceps', 'Glúteos'], ARRAY['Leg press']),
((SELECT id FROM public.exercise_categories WHERE name = 'Pernas'), 'Cadeira extensora', ARRAY['Quadríceps'], ARRAY['Cadeira extensora']),
((SELECT id FROM public.exercise_categories WHERE name = 'Pernas'), 'Cadeira flexora', ARRAY['Isquiotibiais'], ARRAY['Cadeira flexora']),
((SELECT id FROM public.exercise_categories WHERE name = 'Pernas'), 'Stiff (levantamento terra romeno)', ARRAY['Isquiotibiais', 'Glúteos'], ARRAY['Barra', 'Halteres']),
((SELECT id FROM public.exercise_categories WHERE name = 'Pernas'), 'Afundo / Passada', ARRAY['Quadríceps', 'Glúteos'], ARRAY['Halteres']),
((SELECT id FROM public.exercise_categories WHERE name = 'Pernas'), 'Panturrilha em pé', ARRAY['Panturrilha'], ARRAY['Máquina panturrilha']),
((SELECT id FROM public.exercise_categories WHERE name = 'Pernas'), 'Panturrilha sentado', ARRAY['Panturrilha'], ARRAY['Máquina panturrilha sentado']),

-- Ombros
((SELECT id FROM public.exercise_categories WHERE name = 'Ombros'), 'Desenvolvimento (halteres ou máquina)', ARRAY['Deltóide'], ARRAY['Halteres', 'Máquina']),
((SELECT id FROM public.exercise_categories WHERE name = 'Ombros'), 'Elevação lateral', ARRAY['Deltóide médio'], ARRAY['Halteres']),
((SELECT id FROM public.exercise_categories WHERE name = 'Ombros'), 'Elevação frontal', ARRAY['Deltóide anterior'], ARRAY['Halteres']),
((SELECT id FROM public.exercise_categories WHERE name = 'Ombros'), 'Remada alta', ARRAY['Deltóide', 'Trapézio'], ARRAY['Barra', 'Halteres']),
((SELECT id FROM public.exercise_categories WHERE name = 'Ombros'), 'Crucifixo inverso (posterior de ombro)', ARRAY['Deltóide posterior'], ARRAY['Halteres', 'Máquina']),

-- Braços
((SELECT id FROM public.exercise_categories WHERE name = 'Braços'), 'Rosca direta', ARRAY['Bíceps'], ARRAY['Barra']),
((SELECT id FROM public.exercise_categories WHERE name = 'Braços'), 'Rosca alternada', ARRAY['Bíceps'], ARRAY['Halteres']),
((SELECT id FROM public.exercise_categories WHERE name = 'Braços'), 'Rosca concentrada', ARRAY['Bíceps'], ARRAY['Halter', 'Banco']),
((SELECT id FROM public.exercise_categories WHERE name = 'Braços'), 'Rosca martelo', ARRAY['Bíceps', 'Antebraço'], ARRAY['Halteres']),
((SELECT id FROM public.exercise_categories WHERE name = 'Braços'), 'Rosca scott', ARRAY['Bíceps'], ARRAY['Barra', 'Banco scott']),
((SELECT id FROM public.exercise_categories WHERE name = 'Braços'), 'Tríceps pulley (barra ou corda)', ARRAY['Tríceps'], ARRAY['Polia alta']),
((SELECT id FROM public.exercise_categories WHERE name = 'Braços'), 'Tríceps testa', ARRAY['Tríceps'], ARRAY['Barra', 'Banco']),
((SELECT id FROM public.exercise_categories WHERE name = 'Braços'), 'Tríceps francês', ARRAY['Tríceps'], ARRAY['Halter']),
((SELECT id FROM public.exercise_categories WHERE name = 'Braços'), 'Mergulho entre bancos', ARRAY['Tríceps', 'Peitoral'], ARRAY['Bancos']),

-- Abdômen
((SELECT id FROM public.exercise_categories WHERE name = 'Abdômen'), 'Prancha', ARRAY['Core', 'Abdômen'], ARRAY['Corpo']),
((SELECT id FROM public.exercise_categories WHERE name = 'Abdômen'), 'Abdominal crunch', ARRAY['Abdômen'], ARRAY['Corpo']),
((SELECT id FROM public.exercise_categories WHERE name = 'Abdômen'), 'Abdominal infra', ARRAY['Abdômen inferior'], ARRAY['Corpo']),
((SELECT id FROM public.exercise_categories WHERE name = 'Abdômen'), 'Abdominal oblíquo', ARRAY['Oblíquos'], ARRAY['Corpo']),
((SELECT id FROM public.exercise_categories WHERE name = 'Abdômen'), 'Elevação de pernas na barra fixa', ARRAY['Abdômen', 'Hip flexor'], ARRAY['Barra fixa']),
((SELECT id FROM public.exercise_categories WHERE name = 'Abdômen'), 'Abdominal máquina', ARRAY['Abdômen'], ARRAY['Máquina abdominal']);

-- Function to generate unique link token
CREATE OR REPLACE FUNCTION generate_student_link_token()
RETURNS TEXT AS $$
BEGIN
    RETURN encode(gen_random_bytes(16), 'base64url');
END;
$$ LANGUAGE plpgsql;