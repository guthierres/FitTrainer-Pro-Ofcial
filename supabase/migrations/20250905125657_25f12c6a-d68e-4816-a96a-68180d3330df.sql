-- Create missing exercise categories and exercises
-- Insert categories first (ignore if they exist)
DO $$
BEGIN
    -- Insert categories if they don't exist
    IF NOT EXISTS (SELECT 1 FROM exercise_categories WHERE name = 'Peito') THEN
        INSERT INTO exercise_categories (name, emoji) VALUES ('Peito', '💪');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM exercise_categories WHERE name = 'Costas') THEN
        INSERT INTO exercise_categories (name, emoji) VALUES ('Costas', '🦻');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM exercise_categories WHERE name = 'Pernas') THEN
        INSERT INTO exercise_categories (name, emoji) VALUES ('Pernas', '🦵');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM exercise_categories WHERE name = 'Ombros') THEN
        INSERT INTO exercise_categories (name, emoji) VALUES ('Ombros', '🦾');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM exercise_categories WHERE name = 'Braços') THEN
        INSERT INTO exercise_categories (name, emoji) VALUES ('Braços', '💪');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM exercise_categories WHERE name = 'Abdômen') THEN
        INSERT INTO exercise_categories (name, emoji) VALUES ('Abdômen', '🏃‍♂️');
    END IF;
END $$;

-- Now insert exercises (with check to avoid duplicates)
DO $$
DECLARE
    peito_id UUID;
    costas_id UUID;
    pernas_id UUID;
    ombros_id UUID;
    bracos_id UUID;
    abdomen_id UUID;
BEGIN
    -- Get category IDs
    SELECT id INTO peito_id FROM exercise_categories WHERE name = 'Peito';
    SELECT id INTO costas_id FROM exercise_categories WHERE name = 'Costas';
    SELECT id INTO pernas_id FROM exercise_categories WHERE name = 'Pernas';
    SELECT id INTO ombros_id FROM exercise_categories WHERE name = 'Ombros';
    SELECT id INTO bracos_id FROM exercise_categories WHERE name = 'Braços';
    SELECT id INTO abdomen_id FROM exercise_categories WHERE name = 'Abdômen';

    -- Insert exercises only if they don't exist
    -- Peito exercises
    IF NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Supino reto') THEN
        INSERT INTO exercises (name, description, instructions, category_id, muscle_groups, equipment, personal_trainer_id) 
        VALUES ('Supino reto', 'Exercício básico para desenvolvimento do peitoral maior', 'Deite no banco, segure a barra com pegada média, abaixe controladamente até o peito e empurre para cima', peito_id, ARRAY['Peitoral maior', 'Tríceps', 'Deltoides anterior'], ARRAY['Barra', 'Banco'], NULL);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Supino inclinado') THEN
        INSERT INTO exercises (name, description, instructions, category_id, muscle_groups, equipment, personal_trainer_id) 
        VALUES ('Supino inclinado', 'Variação do supino focando na porção superior do peitoral', 'Ajuste o banco em 30-45°, execute o movimento similar ao supino reto', peito_id, ARRAY['Peitoral maior superior', 'Deltoides anterior'], ARRAY['Barra', 'Banco inclinado'], NULL);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Crucifixo') THEN
        INSERT INTO exercises (name, description, instructions, category_id, muscle_groups, equipment, personal_trainer_id) 
        VALUES ('Crucifixo', 'Exercício de isolamento para peitoral', 'Movimento de abertura e fechamento dos braços, mantendo leve flexão nos cotovelos', peito_id, ARRAY['Peitoral maior'], ARRAY['Halteres', 'Máquina', 'Cross over'], NULL);
    END IF;

    -- Costas exercises
    IF NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Puxada frente') THEN
        INSERT INTO exercises (name, description, instructions, category_id, muscle_groups, equipment, personal_trainer_id) 
        VALUES ('Puxada frente', 'Exercício básico para desenvolvimento das costas', 'Puxe a barra até o peito, controlando o movimento na descida', costas_id, ARRAY['Latíssimo do dorso', 'Bíceps'], ARRAY['Polia alta', 'Barra'], NULL);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Remada curvada') THEN
        INSERT INTO exercises (name, description, instructions, category_id, muscle_groups, equipment, personal_trainer_id) 
        VALUES ('Remada curvada', 'Exercício composto fundamental para costas', 'Incline o tronco, puxe a barra/halteres até o abdômen', costas_id, ARRAY['Latíssimo do dorso', 'Romboides', 'Trapézio'], ARRAY['Barra', 'Halteres'], NULL);
    END IF;

    -- Pernas exercises
    IF NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Agachamento livre') THEN
        INSERT INTO exercises (name, description, instructions, category_id, muscle_groups, equipment, personal_trainer_id) 
        VALUES ('Agachamento livre', 'Rei dos exercícios para membros inferiores', 'Barra nos ombros, desça até coxas paralelas ao chão, suba controladamente', pernas_id, ARRAY['Quadríceps', 'Glúteos', 'Posteriores'], ARRAY['Barra', 'Rack'], NULL);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Leg press') THEN
        INSERT INTO exercises (name, description, instructions, category_id, muscle_groups, equipment, personal_trainer_id) 
        VALUES ('Leg press', 'Exercício de empurrar com pernas', 'Sentado na máquina, empurre a plataforma com os pés', pernas_id, ARRAY['Quadríceps', 'Glúteos'], ARRAY['Leg press'], NULL);
    END IF;

    -- Ombros exercises
    IF NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Desenvolvimento') THEN
        INSERT INTO exercises (name, description, instructions, category_id, muscle_groups, equipment, personal_trainer_id) 
        VALUES ('Desenvolvimento', 'Exercício básico para ombros', 'Sentado ou em pé, empurre peso acima da cabeça', ombros_id, ARRAY['Deltoides', 'Tríceps'], ARRAY['Halteres', 'Máquina', 'Barra'], NULL);
    END IF;

    -- Braços exercises
    IF NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Rosca direta') THEN
        INSERT INTO exercises (name, description, instructions, category_id, muscle_groups, equipment, personal_trainer_id) 
        VALUES ('Rosca direta', 'Exercício básico para bíceps', 'Em pé, flexione antebraços elevando peso', bracos_id, ARRAY['Bíceps braquial'], ARRAY['Barra', 'Halteres'], NULL);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Tríceps pulley') THEN
        INSERT INTO exercises (name, description, instructions, category_id, muscle_groups, equipment, personal_trainer_id) 
        VALUES ('Tríceps pulley', 'Exercício básico para tríceps', 'Empurre barra ou corda para baixo estendendo antebraços', bracos_id, ARRAY['Tríceps braquial'], ARRAY['Polia alta', 'Barra', 'Corda'], NULL);
    END IF;

    -- Abdômen exercises
    IF NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Prancha') THEN
        INSERT INTO exercises (name, description, instructions, category_id, muscle_groups, equipment, personal_trainer_id) 
        VALUES ('Prancha', 'Exercício isométrico para core', 'Mantenha posição de prancha, corpo reto e estável', abdomen_id, ARRAY['Reto abdominal', 'Transverso'], ARRAY['Peso corporal'], NULL);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Abdominal crunch') THEN
        INSERT INTO exercises (name, description, instructions, category_id, muscle_groups, equipment, personal_trainer_id) 
        VALUES ('Abdominal crunch', 'Exercício básico para abdômen', 'Deitado, flexione tronco em direção aos joelhos', abdomen_id, ARRAY['Reto abdominal'], ARRAY['Peso corporal'], NULL);
    END IF;
END $$;