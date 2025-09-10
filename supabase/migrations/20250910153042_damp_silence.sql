/*
  # Função para estatísticas do sistema

  Cria uma função RPC para obter estatísticas do sistema de forma eficiente
*/

CREATE OR REPLACE FUNCTION get_system_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'totalTrainers', (SELECT COUNT(*) FROM personal_trainers),
    'activeTrainers', (SELECT COUNT(*) FROM personal_trainers WHERE active = true),
    'totalStudents', (SELECT COUNT(*) FROM students WHERE active = true),
    'totalWorkouts', (SELECT COUNT(*) FROM workout_plans WHERE active = true),
    'totalDiets', (SELECT COUNT(*) FROM diet_plans WHERE active = true)
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Concede acesso à função
GRANT EXECUTE ON FUNCTION get_system_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_system_stats() TO anon;