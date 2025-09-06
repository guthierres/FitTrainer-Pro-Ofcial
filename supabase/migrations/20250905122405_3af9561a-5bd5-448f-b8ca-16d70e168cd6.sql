-- Insert sample personal trainer for testing
INSERT INTO public.personal_trainers (cpf, birth_date, name, email, phone, cref, specializations) VALUES
('123.456.789-00', '1990-05-15', 'João Silva Personal', 'joao@fittrainer.com', '(11) 99999-9999', 'CREF 123456-G/SP', ARRAY['Musculação', 'Funcional', 'Crosstraining']);

-- Insert sample student with unique token
INSERT INTO public.students (personal_trainer_id, name, email, phone, birth_date, weight, height, goals, unique_link_token) 
SELECT 
  pt.id,
  'Maria Santos',
  'maria@email.com',
  '(11) 88888-8888',
  '1995-03-20',
  65.0,
  1.65,
  ARRAY['Perda de peso', 'Tonificação muscular'],
  'student-demo-link-123'
FROM public.personal_trainers pt 
WHERE pt.cpf = '123.456.789-00';

-- Create sample workout plan
INSERT INTO public.workout_plans (student_id, personal_trainer_id, name, description, frequency_per_week, duration_weeks)
SELECT 
  s.id,
  s.personal_trainer_id,
  'Treino Iniciante - Perda de Peso',
  'Programa focado em queima de gordura e condicionamento físico para iniciantes.',
  3,
  8
FROM public.students s 
WHERE s.unique_link_token = 'student-demo-link-123';

-- Create workout sessions (Monday, Wednesday, Friday)
INSERT INTO public.workout_sessions (workout_plan_id, day_of_week, name, description)
SELECT 
  wp.id,
  1, -- Monday
  'Treino A - Peito e Tríceps',
  'Foco no desenvolvimento do peitoral e tríceps'
FROM public.workout_plans wp 
JOIN public.students s ON wp.student_id = s.id
WHERE s.unique_link_token = 'student-demo-link-123';

INSERT INTO public.workout_sessions (workout_plan_id, day_of_week, name, description)
SELECT 
  wp.id,
  3, -- Wednesday  
  'Treino B - Costas e Bíceps',
  'Desenvolvimento das costas e bíceps'
FROM public.workout_plans wp 
JOIN public.students s ON wp.student_id = s.id
WHERE s.unique_link_token = 'student-demo-link-123';

INSERT INTO public.workout_sessions (workout_plan_id, day_of_week, name, description)
SELECT 
  wp.id,
  5, -- Friday
  'Treino C - Pernas e Ombros',
  'Treino completo para membros inferiores e ombros'
FROM public.workout_plans wp 
JOIN public.students s ON wp.student_id = s.id
WHERE s.unique_link_token = 'student-demo-link-123';

-- Add exercises to Monday workout (Peito e Tríceps)
INSERT INTO public.workout_exercises (workout_session_id, exercise_id, sets, reps_min, reps_max, weight_kg, rest_seconds, order_index, notes)
SELECT 
  ws.id,
  e.id,
  3,
  8,
  12,
  CASE e.name 
    WHEN 'Supino reto' THEN 40.0
    WHEN 'Supino inclinado' THEN 35.0
    WHEN 'Crucifixo (máquina, halteres ou cross)' THEN 15.0
    WHEN 'Tríceps pulley (barra ou corda)' THEN 25.0
    WHEN 'Tríceps testa' THEN 20.0
  END,
  60,
  CASE e.name 
    WHEN 'Supino reto' THEN 1
    WHEN 'Supino inclinado' THEN 2
    WHEN 'Crucifixo (máquina, halteres ou cross)' THEN 3
    WHEN 'Tríceps pulley (barra ou corda)' THEN 4
    WHEN 'Tríceps testa' THEN 5
  END,
  CASE e.name 
    WHEN 'Supino reto' THEN 'Exercício principal - foque na técnica'
    WHEN 'Supino inclinado' THEN 'Mantenha os ombros para trás'
    WHEN 'Crucifixo (máquina, halteres ou cross)' THEN 'Movimento controlado'
    WHEN 'Tríceps pulley (barra ou corda)' THEN 'Cotovelos fixos'
    WHEN 'Tríceps testa' THEN 'Cuidado com a posição do punho'
  END
FROM public.workout_sessions ws
JOIN public.workout_plans wp ON ws.workout_plan_id = wp.id
JOIN public.students s ON wp.student_id = s.id
JOIN public.exercises e ON e.name IN ('Supino reto', 'Supino inclinado', 'Crucifixo (máquina, halteres ou cross)', 'Tríceps pulley (barra ou corda)', 'Tríceps testa')
WHERE s.unique_link_token = 'student-demo-link-123' AND ws.day_of_week = 1;

-- Add exercises to Wednesday workout (Costas e Bíceps)
INSERT INTO public.workout_exercises (workout_session_id, exercise_id, sets, reps_min, reps_max, weight_kg, rest_seconds, order_index, notes)
SELECT 
  ws.id,
  e.id,
  3,
  8,
  12,
  CASE e.name 
    WHEN 'Puxada frente (pulldown)' THEN 45.0
    WHEN 'Remada baixa (máquina ou polia)' THEN 40.0
    WHEN 'Remada curvada' THEN 30.0
    WHEN 'Rosca direta' THEN 15.0
    WHEN 'Rosca alternada' THEN 12.0
  END,
  60,
  CASE e.name 
    WHEN 'Puxada frente (pulldown)' THEN 1
    WHEN 'Remada baixa (máquina ou polia)' THEN 2
    WHEN 'Remada curvada' THEN 3
    WHEN 'Rosca direta' THEN 4
    WHEN 'Rosca alternada' THEN 5
  END,
  CASE e.name 
    WHEN 'Puxada frente (pulldown)' THEN 'Puxe até o peito'
    WHEN 'Remada baixa (máquina ou polia)' THEN 'Aperte as escápulas'
    WHEN 'Remada curvada' THEN 'Mantenha as costas retas'
    WHEN 'Rosca direta' THEN 'Cotovelos fixos ao lado do corpo'
    WHEN 'Rosca alternada' THEN 'Movimento controlado'
  END
FROM public.workout_sessions ws
JOIN public.workout_plans wp ON ws.workout_plan_id = wp.id
JOIN public.students s ON wp.student_id = s.id
JOIN public.exercises e ON e.name IN ('Puxada frente (pulldown)', 'Remada baixa (máquina ou polia)', 'Remada curvada', 'Rosca direta', 'Rosca alternada')
WHERE s.unique_link_token = 'student-demo-link-123' AND ws.day_of_week = 3;

-- Add exercises to Friday workout (Pernas e Ombros)
INSERT INTO public.workout_exercises (workout_session_id, exercise_id, sets, reps_min, reps_max, weight_kg, rest_seconds, order_index, notes)
SELECT 
  ws.id,
  e.id,
  CASE e.name 
    WHEN 'Agachamento livre' THEN 4
    ELSE 3
  END,
  CASE e.name 
    WHEN 'Agachamento livre' THEN 6
    WHEN 'Prancha' THEN NULL
    ELSE 10
  END,
  CASE e.name 
    WHEN 'Agachamento livre' THEN 10
    WHEN 'Prancha' THEN NULL
    ELSE 15
  END,
  CASE e.name 
    WHEN 'Agachamento livre' THEN 50.0
    WHEN 'Leg press' THEN 100.0
    WHEN 'Cadeira extensora' THEN 35.0
    WHEN 'Desenvolvimento (halteres ou máquina)' THEN 10.0
    WHEN 'Elevação lateral' THEN 8.0
    ELSE NULL
  END,
  CASE e.name 
    WHEN 'Agachamento livre' THEN 90
    WHEN 'Prancha' THEN NULL
    ELSE 60
  END,
  CASE e.name 
    WHEN 'Agachamento livre' THEN 1
    WHEN 'Leg press' THEN 2
    WHEN 'Cadeira extensora' THEN 3
    WHEN 'Desenvolvimento (halteres ou máquina)' THEN 4
    WHEN 'Elevação lateral' THEN 5
    WHEN 'Prancha' THEN 6
  END,
  CASE e.name 
    WHEN 'Agachamento livre' THEN 'Desça até 90 graus - exercício principal'
    WHEN 'Leg press' THEN 'Pés na largura dos ombros'
    WHEN 'Cadeira extensora' THEN 'Extensão completa da perna'
    WHEN 'Desenvolvimento (halteres ou máquina)' THEN 'Não trave os cotovelos'
    WHEN 'Elevação lateral' THEN 'Controle a descida'
    WHEN 'Prancha' THEN 'Mantenha 30-45 segundos por série'
  END
FROM public.workout_sessions ws
JOIN public.workout_plans wp ON ws.workout_plan_id = wp.id
JOIN public.students s ON wp.student_id = s.id
JOIN public.exercises e ON e.name IN ('Agachamento livre', 'Leg press', 'Cadeira extensora', 'Desenvolvimento (halteres ou máquina)', 'Elevação lateral', 'Prancha')
WHERE s.unique_link_token = 'student-demo-link-123' AND ws.day_of_week = 5;

-- Create sample diet plan
INSERT INTO public.diet_plans (student_id, personal_trainer_id, name, description, daily_calories, daily_protein, daily_carbs, daily_fat)
SELECT 
  s.id,
  s.personal_trainer_id,
  'Dieta para Perda de Peso',
  'Plano alimentar hipocalórico balanceado para perda de gordura corporal.',
  1500,
  100.0,
  150.0,
  50.0
FROM public.students s 
WHERE s.unique_link_token = 'student-demo-link-123';

-- Create sample meals
INSERT INTO public.meals (diet_plan_id, name, time_of_day, order_index)
SELECT 
  dp.id,
  meal_name,
  meal_time,
  meal_order
FROM public.diet_plans dp
JOIN public.students s ON dp.student_id = s.id
CROSS JOIN (
  VALUES 
    ('Café da Manhã', '07:00:00', 1),
    ('Lanche da Manhã', '10:00:00', 2),
    ('Almoço', '12:30:00', 3),
    ('Lanche da Tarde', '15:30:00', 4),
    ('Jantar', '19:00:00', 5),
    ('Ceia', '21:30:00', 6)
) AS meals(meal_name, meal_time, meal_order)
WHERE s.unique_link_token = 'student-demo-link-123';

-- Add sample foods to meals
INSERT INTO public.meal_foods (meal_id, food_name, quantity, unit, calories, protein, carbs, fat)
SELECT 
  m.id,
  food.food_name,
  food.quantity,
  food.unit,
  food.calories,
  food.protein,
  food.carbs,
  food.fat
FROM public.meals m
JOIN public.diet_plans dp ON m.diet_plan_id = dp.id
JOIN public.students s ON dp.student_id = s.id
CROSS JOIN (
  SELECT 'Café da Manhã' as meal_name, foods.*
  FROM (VALUES
    ('Aveia em flocos', 50.0, 'g', 185.0, 6.5, 32.0, 3.5),
    ('Banana', 1.0, 'unidade', 105.0, 1.3, 27.0, 0.4),
    ('Leite desnatado', 200.0, 'ml', 68.0, 6.8, 9.6, 0.2),
    ('Mel', 10.0, 'g', 30.4, 0.0, 8.2, 0.0)
  ) as foods(food_name, quantity, unit, calories, protein, carbs, fat)
  
  UNION ALL
  
  SELECT 'Lanche da Manhã' as meal_name, foods.*
  FROM (VALUES
    ('Maçã', 1.0, 'unidade', 80.0, 0.4, 21.0, 0.3),
    ('Castanha do Pará', 3.0, 'unidades', 60.0, 1.4, 1.2, 6.1)
  ) as foods(food_name, quantity, unit, calories, protein, carbs, fat)
  
  UNION ALL
  
  SELECT 'Almoço' as meal_name, foods.*
  FROM (VALUES
    ('Peito de frango grelhado', 150.0, 'g', 247.5, 46.2, 0.0, 5.4),
    ('Arroz integral', 100.0, 'g', 124.0, 2.6, 25.8, 1.0),
    ('Feijão preto', 80.0, 'g', 77.6, 4.5, 14.0, 0.4),
    ('Brócolis refogado', 100.0, 'g', 25.0, 3.0, 4.0, 0.4),
    ('Salada de folhas verdes', 100.0, 'g', 15.0, 1.5, 2.9, 0.2)
  ) as foods(food_name, quantity, unit, calories, protein, carbs, fat)
) food ON m.name = food.meal_name
WHERE s.unique_link_token = 'student-demo-link-123';

-- Set trigger to auto-generate unique tokens for new students
CREATE OR REPLACE FUNCTION auto_generate_student_token()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.unique_link_token IS NULL OR NEW.unique_link_token = '' THEN
        NEW.unique_link_token = generate_student_link_token();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_student_token_trigger
    BEFORE INSERT ON public.students
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_student_token();