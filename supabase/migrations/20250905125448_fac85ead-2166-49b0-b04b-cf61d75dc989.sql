-- Modify exercises table to allow personal trainers to create custom exercises
-- Add personal_trainer_id column to exercises table (nullable for global exercises)
ALTER TABLE public.exercises 
ADD COLUMN personal_trainer_id UUID REFERENCES public.personal_trainers(id) ON DELETE CASCADE DEFAULT NULL;

-- Update RLS policies for exercises to allow trainers to create and manage their own
DROP POLICY IF EXISTS "Anyone can view exercises" ON public.exercises;

-- New policies for exercises
CREATE POLICY "Global exercises are viewable by everyone"
ON public.exercises
FOR SELECT
USING (personal_trainer_id IS NULL);

CREATE POLICY "Trainers can view and manage their own exercises"
ON public.exercises
FOR ALL
USING (personal_trainer_id IS NULL OR personal_trainer_id = auth.uid())
WITH CHECK (personal_trainer_id IS NULL OR personal_trainer_id = auth.uid());

-- Allow trainers to create custom exercises
CREATE POLICY "Trainers can create custom exercises"
ON public.exercises
FOR INSERT
WITH CHECK (personal_trainer_id IS NOT NULL);

-- Insert the comprehensive exercise list as global exercises (no personal_trainer_id)
INSERT INTO public.exercises (name, description, instructions, category_id, muscle_groups, equipment, personal_trainer_id) VALUES

-- Peito exercises
('Supino reto', 'Exercício básico para desenvolvimento do peitoral maior', 'Deite no banco, segure a barra com pegada média, abaixe controladamente até o peito e empurre para cima', (SELECT id FROM exercise_categories WHERE name = 'Peito'), ARRAY['Peitoral maior', 'Tríceps', 'Deltoides anterior'], ARRAY['Barra', 'Banco'], NULL),

('Supino inclinado', 'Variação do supino focando na porção superior do peitoral', 'Ajuste o banco em 30-45°, execute o movimento similar ao supino reto', (SELECT id FROM exercise_categories WHERE name = 'Peito'), ARRAY['Peitoral maior superior', 'Deltoides anterior'], ARRAY['Barra', 'Banco inclinado'], NULL),

('Supino declinado', 'Variação focando na porção inferior do peitoral', 'Banco declinado, movimento controlado do peito até extensão completa', (SELECT id FROM exercise_categories WHERE name = 'Peito'), ARRAY['Peitoral maior inferior'], ARRAY['Barra', 'Banco declinado'], NULL),

('Crucifixo', 'Exercício de isolamento para peitoral', 'Movimento de abertura e fechamento dos braços, mantendo leve flexão nos cotovelos', (SELECT id FROM exercise_categories WHERE name = 'Peito'), ARRAY['Peitoral maior'], ARRAY['Halteres', 'Máquina', 'Cross over'], NULL),

('Peck deck', 'Exercício de isolamento em máquina para peitoral', 'Sente na máquina, ajuste altura, execute movimento de fechamento dos braços', (SELECT id FROM exercise_categories WHERE name = 'Peito'), ARRAY['Peitoral maior'], ARRAY['Máquina peck deck'], NULL),

-- Costas exercises  
('Puxada frente', 'Exercício básico para desenvolvimento das costas', 'Puxe a barra até o peito, controlando o movimento na descida', (SELECT id FROM exercise_categories WHERE name = 'Costas'), ARRAY['Latíssimo do dorso', 'Bíceps'], ARRAY['Polia alta', 'Barra'], NULL),

('Puxada atrás', 'Variação da puxada para ângulo diferente', 'Puxe a barra atrás da nuca com cuidado, movimento controlado', (SELECT id FROM exercise_categories WHERE name = 'Costas'), ARRAY['Latíssimo do dorso', 'Trapézio'], ARRAY['Polia alta', 'Barra'], NULL),

('Remada curvada', 'Exercício composto fundamental para costas', 'Incline o tronco, puxe a barra/halteres até o abdômen', (SELECT id FROM exercise_categories WHERE name = 'Costas'), ARRAY['Latíssimo do dorso', 'Romboides', 'Trapézio'], ARRAY['Barra', 'Halteres'], NULL),

('Remada baixa', 'Exercício de puxada horizontal', 'Sentado, puxe o cabo até o abdômen mantendo postura ereta', (SELECT id FROM exercise_categories WHERE name = 'Costas'), ARRAY['Latíssimo do dorso', 'Romboides'], ARRAY['Polia baixa', 'Máquina'], NULL),

('Remada unilateral com halter', 'Exercício unilateral para correção de assimetrias', 'Apoie joelho e mão no banco, puxe halter até a costela', (SELECT id FROM exercise_categories WHERE name = 'Costas'), ARRAY['Latíssimo do dorso', 'Romboides'], ARRAY['Halter', 'Banco'], NULL),

('Barra fixa', 'Exercício funcional utilizando peso corporal', 'Suspenda-se na barra, puxe até queixo ultrapassar a barra', (SELECT id FROM exercise_categories WHERE name = 'Costas'), ARRAY['Latíssimo do dorso', 'Bíceps'], ARRAY['Barra fixa'], NULL),

-- Pernas exercises
('Agachamento livre', 'Rei dos exercícios para membros inferiores', 'Barra nos ombros, desça até coxas paralelas ao chão, suba controladamente', (SELECT id FROM exercise_categories WHERE name = 'Pernas'), ARRAY['Quadríceps', 'Glúteos', 'Posteriores'], ARRAY['Barra', 'Rack'], NULL),

('Agachamento no smith', 'Versão mais segura do agachamento', 'Mesmo movimento do agachamento livre, porém com barra guiada', (SELECT id FROM exercise_categories WHERE name = 'Pernas'), ARRAY['Quadríceps', 'Glúteos'], ARRAY['Smith machine'], NULL),

('Leg press', 'Exercício de empurrar com pernas', 'Sentado na máquina, empurre a plataforma com os pés', (SELECT id FROM exercise_categories WHERE name = 'Pernas'), ARRAY['Quadríceps', 'Glúteos'], ARRAY['Leg press'], NULL),

('Cadeira extensora', 'Isolamento do quadríceps', 'Sentado, estenda as pernas contra a resistência', (SELECT id FROM exercise_categories WHERE name = 'Pernas'), ARRAY['Quadríceps'], ARRAY['Cadeira extensora'], NULL),

('Cadeira flexora', 'Isolamento dos músculos posteriores da coxa', 'Deitado ou sentado, flexione pernas contra resistência', (SELECT id FROM exercise_categories WHERE name = 'Pernas'), ARRAY['Bíceps femoral', 'Semitendinoso'], ARRAY['Cadeira flexora'], NULL),

('Stiff', 'Levantamento terra romeno para posteriores', 'Halteres ou barra, desça flexionando quadril, mantenha pernas semi-rígidas', (SELECT id FROM exercise_categories WHERE name = 'Pernas'), ARRAY['Posteriores de coxa', 'Glúteos'], ARRAY['Halteres', 'Barra'], NULL),

('Afundo', 'Exercício unilateral funcional', 'Passo à frente, desça até formar 90° nos joelhos', (SELECT id FROM exercise_categories WHERE name = 'Pernas'), ARRAY['Quadríceps', 'Glúteos'], ARRAY['Peso corporal', 'Halteres'], NULL),

('Panturrilha em pé', 'Desenvolvimento da panturrilha', 'Em pé, eleve-se na ponta dos pés contra resistência', (SELECT id FROM exercise_categories WHERE name = 'Pernas'), ARRAY['Gastrocnêmio'], ARRAY['Máquina', 'Halteres'], NULL),

('Panturrilha sentado', 'Variação sentada para panturrilha', 'Sentado, eleve pés na ponta contra resistência', (SELECT id FROM exercise_categories WHERE name = 'Pernas'), ARRAY['Sóleo'], ARRAY['Máquina panturrilha sentado'], NULL),

-- Ombros exercises
('Desenvolvimento', 'Exercício básico para ombros', 'Sentado ou em pé, empurre peso acima da cabeça', (SELECT id FROM exercise_categories WHERE name = 'Ombros'), ARRAY['Deltoides', 'Tríceps'], ARRAY['Halteres', 'Máquina', 'Barra'], NULL),

('Elevação lateral', 'Isolamento do deltoide lateral', 'Braços ao lado do corpo, eleve halteres lateralmente', (SELECT id FROM exercise_categories WHERE name = 'Ombros'), ARRAY['Deltoide lateral'], ARRAY['Halteres', 'Cabos'], NULL),

('Elevação frontal', 'Isolamento do deltoide anterior', 'Braços à frente, eleve peso até altura dos ombros', (SELECT id FROM exercise_categories WHERE name = 'Ombros'), ARRAY['Deltoide anterior'], ARRAY['Halteres', 'Barra'], NULL),

('Remada alta', 'Exercício composto para ombros e trapézio', 'Puxe barra ou cabo até próximo ao queixo', (SELECT id FROM exercise_categories WHERE name = 'Ombros'), ARRAY['Deltoide lateral', 'Trapézio'], ARRAY['Barra', 'Cabos'], NULL),

('Crucifixo inverso', 'Desenvolvimento do deltoide posterior', 'Inclinado, abra braços para trás como crucifixo', (SELECT id FROM exercise_categories WHERE name = 'Ombros'), ARRAY['Deltoide posterior'], ARRAY['Halteres', 'Máquina'], NULL),

-- Bíceps exercises
('Rosca direta', 'Exercício básico para bíceps', 'Em pé, flexione antebraços elevando peso', (SELECT id FROM exercise_categories WHERE name = 'Braços'), ARRAY['Bíceps braquial'], ARRAY['Barra', 'Halteres'], NULL),

('Rosca alternada', 'Variação unilateral da rosca', 'Alterne flexão dos braços com halteres', (SELECT id FROM exercise_categories WHERE name = 'Braços'), ARRAY['Bíceps braquial'], ARRAY['Halteres'], NULL),

('Rosca concentrada', 'Isolamento máximo do bíceps', 'Sentado, cotovelo apoiado na coxa, flexione antebraço', (SELECT id FROM exercise_categories WHERE name = 'Braços'), ARRAY['Bíceps braquial'], ARRAY['Halter'], NULL),

('Rosca martelo', 'Desenvolvimento do braquial e bíceps', 'Pegada neutra, flexione antebraços', (SELECT id FROM exercise_categories WHERE name = 'Braços'), ARRAY['Bíceps', 'Braquial'], ARRAY['Halteres'], NULL),

('Rosca scott', 'Isolamento com apoio do antebraço', 'No banco scott, flexione antebraços controladamente', (SELECT id FROM exercise_categories WHERE name = 'Braços'), ARRAY['Bíceps braquial'], ARRAY['Banco scott', 'Barra'], NULL),

-- Tríceps exercises
('Tríceps pulley', 'Exercício básico para tríceps', 'Empurre barra ou corda para baixo estendendo antebraços', (SELECT id FROM exercise_categories WHERE name = 'Braços'), ARRAY['Tríceps braquial'], ARRAY['Polia alta', 'Barra', 'Corda'], NULL),

('Tríceps testa', 'Isolamento do tríceps deitado', 'Deitado, flexione antebraços em direção à testa', (SELECT id FROM exercise_categories WHERE name = 'Braços'), ARRAY['Tríceps braquial'], ARRAY['Barra', 'Halteres'], NULL),

('Tríceps francês', 'Exercício de isolamento sentado/em pé', 'Atrás da cabeça, estenda antebraços para cima', (SELECT id FROM exercise_categories WHERE name = 'Braços'), ARRAY['Tríceps braquial'], ARRAY['Halter', 'Barra'], NULL),

('Mergulho entre bancos', 'Exercício com peso corporal', 'Entre dois bancos, desça e suba o corpo flexionando braços', (SELECT id FROM exercise_categories WHERE name = 'Braços'), ARRAY['Tríceps', 'Peitoral'], ARRAY['Bancos'], NULL),

-- Abdômen exercises
('Prancha', 'Exercício isométrico para core', 'Mantenha posição de prancha, corpo reto e estável', (SELECT id FROM exercise_categories WHERE name = 'Abdômen'), ARRAY['Reto abdominal', 'Transverso'], ARRAY['Peso corporal'], NULL),

('Abdominal crunch', 'Exercício básico para abdômen', 'Deitado, flexione tronco em direção aos joelhos', (SELECT id FROM exercise_categories WHERE name = 'Abdômen'), ARRAY['Reto abdominal'], ARRAY['Peso corporal'], NULL),

('Abdominal infra', 'Foco na porção inferior do abdômen', 'Eleve pernas flexionando quadril', (SELECT id FROM exercise_categories WHERE name = 'Abdômen'), ARRAY['Reto abdominal inferior'], ARRAY['Peso corporal'], NULL),

('Abdominal oblíquo', 'Desenvolvimento dos oblíquos', 'Movimento lateral do tronco ou rotação', (SELECT id FROM exercise_categories WHERE name = 'Abdômen'), ARRAY['Oblíquos externos'], ARRAY['Peso corporal'], NULL),

('Elevação de pernas na barra', 'Exercício avançado para abdômen', 'Pendurado na barra, eleve pernas até 90°', (SELECT id FROM exercise_categories WHERE name = 'Abdômen'), ARRAY['Reto abdominal', 'Hip flexors'], ARRAY['Barra fixa'], NULL),

('Abdominal máquina', 'Exercício assistido por máquina', 'Sentado na máquina, flexione tronco contra resistência', (SELECT id FROM exercise_categories WHERE name = 'Abdômen'), ARRAY['Reto abdominal'], ARRAY['Máquina abdominal'], NULL);