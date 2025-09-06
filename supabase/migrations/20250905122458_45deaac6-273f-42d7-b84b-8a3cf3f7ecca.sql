-- Insert sample data for testing
INSERT INTO public.personal_trainers (cpf, birth_date, name, email, phone, cref, specializations) 
VALUES ('123.456.789-00', '1990-05-15', 'João Silva Personal', 'joao@fittrainer.com', '(11) 99999-9999', 'CREF 123456-G/SP', ARRAY['Musculação', 'Funcional', 'Crosstraining'])
ON CONFLICT (cpf) DO NOTHING;

-- Get the trainer ID
DO $$
DECLARE
    trainer_id UUID;
    student_id UUID;
    workout_plan_id UUID;
    diet_plan_id UUID;
    session_monday_id UUID;
    session_wednesday_id UUID;
    session_friday_id UUID;
BEGIN
    -- Get trainer ID
    SELECT id INTO trainer_id FROM public.personal_trainers WHERE cpf = '123.456.789-00';
    
    -- Insert student if not exists
    INSERT INTO public.students (personal_trainer_id, name, email, phone, birth_date, weight, height, goals, unique_link_token, active)
    VALUES (trainer_id, 'Maria Santos', 'maria@email.com', '(11) 88888-8888', '1995-03-20', 65.0, 1.65, 
            ARRAY['Perda de peso', 'Tonificação muscular'], 'student-demo-link-123', true)
    ON CONFLICT (unique_link_token) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO student_id;
    
    -- If student already exists, get its ID
    IF student_id IS NULL THEN
        SELECT id INTO student_id FROM public.students WHERE unique_link_token = 'student-demo-link-123';
    END IF;
    
    -- Create workout plan
    INSERT INTO public.workout_plans (student_id, personal_trainer_id, name, description, frequency_per_week, duration_weeks, active)
    VALUES (student_id, trainer_id, 'Treino Iniciante - Perda de Peso', 
            'Programa focado em queima de gordura e condicionamento físico para iniciantes.', 3, 8, true)
    ON CONFLICT DO NOTHING
    RETURNING id INTO workout_plan_id;
    
    -- If plan already exists, get its ID
    IF workout_plan_id IS NULL THEN
        SELECT id INTO workout_plan_id FROM public.workout_plans WHERE student_id = student_id AND active = true LIMIT 1;
    END IF;
    
    -- Create workout sessions
    INSERT INTO public.workout_sessions (workout_plan_id, day_of_week, name, description)
    VALUES 
        (workout_plan_id, 1, 'Treino A - Peito e Tríceps', 'Foco no desenvolvimento do peitoral e tríceps'),
        (workout_plan_id, 3, 'Treino B - Costas e Bíceps', 'Desenvolvimento das costas e bíceps'),
        (workout_plan_id, 5, 'Treino C - Pernas e Ombros', 'Treino completo para membros inferiores e ombros')
    ON CONFLICT DO NOTHING;
    
END $$;