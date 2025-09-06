-- Insert sample personal trainer for testing (if doesn't exist)
INSERT INTO public.personal_trainers (cpf, birth_date, name, email, phone, cref, specializations) 
SELECT '123.456.789-00', '1990-05-15', 'João Silva Personal', 'joao@fittrainer.com', '(11) 99999-9999', 'CREF 123456-G/SP', ARRAY['Musculação', 'Funcional', 'Crosstraining']
WHERE NOT EXISTS (SELECT 1 FROM public.personal_trainers WHERE cpf = '123.456.789-00');

-- Insert sample student with unique token (if doesn't exist)
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
WHERE pt.cpf = '123.456.789-00' 
AND NOT EXISTS (SELECT 1 FROM public.students WHERE unique_link_token = 'student-demo-link-123');

-- Create sample workout plan (if doesn't exist)
INSERT INTO public.workout_plans (student_id, personal_trainer_id, name, description, frequency_per_week, duration_weeks)
SELECT 
  s.id,
  s.personal_trainer_id,
  'Treino Iniciante - Perda de Peso',
  'Programa focado em queima de gordura e condicionamento físico para iniciantes.',
  3,
  8
FROM public.students s 
WHERE s.unique_link_token = 'student-demo-link-123'
AND NOT EXISTS (
  SELECT 1 FROM public.workout_plans wp 
  WHERE wp.student_id = s.id AND wp.name = 'Treino Iniciante - Perda de Peso'
);