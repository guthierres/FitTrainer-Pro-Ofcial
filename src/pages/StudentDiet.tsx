import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { setStudentContext } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, Clock, Apple, Dumbbell, User, Printer } from 'lucide-react';
import { X } from 'lucide-react';

interface Student {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  weight: number | null;
  height: number | null;
  goals: string[] | null;
  student_number: string;
  personal_trainer_id: string;
}

interface PersonalTrainer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  cref: string | null;
}

interface DietPlan {
  id: string;
  name: string;
  description: string | null;
  daily_calories: number | null;
  daily_protein: number | null;
  daily_carbs: number | null;
  daily_fat: number | null;
  active: boolean;
}

interface Meal {
  id: string;
  name: string;
  time_of_day: string | null;
  order_index: number;
  meal_foods: MealFood[];
}

interface MealFood {
  id: string;
  food_name: string;
  quantity: number;
  unit: string;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  notes: string | null;
}

interface WorkoutPlan {
  id: string;
  name: string;
  description: string | null;
  frequency_per_week: number;
  duration_weeks: number;
  active: boolean;
  workout_sessions: WorkoutSession[];
}

interface WorkoutSession {
  id: string;
  name: string;
  day_of_week: number;
  description: string | null;
  workout_exercises: WorkoutExercise[];
}

interface WorkoutExercise {
  id: string;
  sets: number;
  reps_min: number | null;
  reps_max: number | null;
  weight_kg: number | null;
  rest_seconds: number | null;
  order_index: number;
  notes: string | null;
  exercises: {
    name: string;
    description: string | null;
    instructions: string | null;
    muscle_groups: string[] | null;
    equipment: string[] | null;
  };
}

export default function StudentDiet() {
  const { studentNumber } = useParams<{ studentNumber: string }>();
  const [student, setStudent] = useState<Student | null>(null);
  const [trainer, setTrainer] = useState<PersonalTrainer | null>(null);
  const [dietPlan, setDietPlan] = useState<DietPlan | null>(null);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [completedMeals, setCompletedMeals] = useState<Set<string>>(new Set());
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    if (studentNumber) {
      fetchStudentData();
    }
  }, [studentNumber]);

  const fetchStudentData = async () => {
    try {
      // Set student context for RLS policies
      await setStudentContext(studentNumber);

      // Fetch student data
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select(`
          *,
          personal_trainers (
            id, name, email, phone, cref
          )
        `)
        .eq('student_number', studentNumber)
        .eq('active', true)
        .single();

      if (studentError) throw studentError;
      if (!studentData) throw new Error('Student not found');

      setStudent(studentData);
      setTrainer(studentData.personal_trainers);

      // Update context with token
      await setStudentContext(studentNumber, studentData.unique_link_token);

      // Fetch diet plan
      const { data: dietData, error: dietError } = await supabase
        .from('diet_plans')
        .select(`
          *,
          meals (
            *,
            meal_foods (*)
          )
        `)
        .eq('student_id', studentData.id)
        .eq('active', true)
        .single();

      if (dietData && !dietError) {
        setDietPlan(dietData);
        setMeals(dietData.meals?.sort((a: Meal, b: Meal) => a.order_index - b.order_index) || []);
      }

      // Fetch workout plan
      const { data: workoutData, error: workoutError } = await supabase
        .from('workout_plans')
        .select(`
          *,
          workout_sessions (
            *,
            workout_exercises (
              *,
              exercises (
                name, description, instructions, muscle_groups, equipment
              )
            )
          )
        `)
        .eq('student_id', studentData.id)
        .eq('active', true)
        .single();

      if (workoutData && !workoutError) {
        setWorkoutPlan(workoutData);
      }

      // Fetch completed meals for today
      const today = new Date().toISOString().split('T')[0];
      const { data: mealCompletions } = await supabase
        .from('meal_completions')
        .select('meal_id')
        .eq('student_id', studentData.id)
        .gte('completed_at', `${today}T00:00:00`)
        .lt('completed_at', `${today}T23:59:59`);

      if (mealCompletions) {
        setCompletedMeals(new Set(mealCompletions.map(c => c.meal_id)));
      }

      // Fetch completed exercises for today
      const { data: exerciseCompletions } = await supabase
        .from('exercise_completions')
        .select('workout_exercise_id')
        .eq('student_id', studentData.id)
        .gte('completed_at', `${today}T00:00:00`)
        .lt('completed_at', `${today}T23:59:59`);

      if (exerciseCompletions) {
        setCompletedExercises(new Set(exerciseCompletions.map(c => c.workout_exercise_id)));
      }

    } catch (error) {
      console.error('Error fetching student data:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do aluno",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMealCompletion = async (mealId: string) => {
    if (!student) return;

    try {
      if (completedMeals.has(mealId)) {
        // Remove completion
        const { error } = await supabase
          .from('meal_completions')
          .delete()
          .eq('meal_id', mealId)
          .eq('student_id', student.id);

        if (error) throw error;

        setCompletedMeals(prev => {
          const newSet = new Set(prev);
          newSet.delete(mealId);
          return newSet;
        });
      } else {
        // Add completion
        const { error } = await supabase
          .from('meal_completions')
          .insert({
            meal_id: mealId,
            student_id: student.id,
          });

        if (error) throw error;

        setCompletedMeals(prev => new Set([...prev, mealId]));
      }
    } catch (error) {
      console.error('Error updating meal completion:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar refeição",
        variant: "destructive",
      });
    }
  };

  const handleExerciseCompletion = async (exerciseId: string) => {
    if (!student) return;

    try {
      if (completedExercises.has(exerciseId)) {
        // Remove completion
        const { error } = await supabase
          .from('exercise_completions')
          .delete()
          .eq('workout_exercise_id', exerciseId)
          .eq('student_id', student.id);

        if (error) throw error;

        setCompletedExercises(prev => {
          const newSet = new Set(prev);
          newSet.delete(exerciseId);
          return newSet;
        });
      } else {
        // Add completion
        const { error } = await supabase
          .from('exercise_completions')
          .insert({
            workout_exercise_id: exerciseId,
            student_id: student.id,
          });

        if (error) throw error;

        setCompletedExercises(prev => new Set([...prev, exerciseId]));
      }
    } catch (error) {
      console.error('Error updating exercise completion:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar exercício",
        variant: "destructive",
      });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }

  if (!student) {
    return <div className="min-h-screen flex items-center justify-center">Aluno não encontrado</div>;
  }

  const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

  return (
    <div className="min-h-screen bg-gray-50 print:bg-white">
      <div className="container mx-auto px-4 py-8 print:py-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6 print:shadow-none print:border">
          <div className="flex justify-between items-start mb-4">
            <Button
              onClick={() => window.history.back()}
              variant="ghost"
              size="sm"
              className="print:hidden"
            >
              <X className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 print:text-2xl">{student.name}</h1>
              <p className="text-gray-600">Plano Personalizado</p>
            </div>
            <Button onClick={handlePrint} className="print:hidden">
              <Printer className="w-4 h-4 mr-2" />
              Imprimir
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">DADOS DO SISTEMA</h3>
              <p><strong>Sistema:</strong> FitPro Manager</p>
              <p><strong>Data:</strong> {new Date().toLocaleDateString('pt-BR')}</p>
              <p><strong>Versão:</strong> 1.0</p>
            </div>
            
            {trainer && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">PERSONAL TRAINER</h3>
                <p><strong>Nome:</strong> {trainer.name}</p>
                {trainer.cref && <p><strong>CREF:</strong> {trainer.cref}</p>}
                {trainer.email && <p><strong>Email:</strong> {trainer.email}</p>}
                {trainer.phone && <p><strong>Telefone:</strong> {trainer.phone}</p>}
              </div>
            )}
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">DADOS DO ALUNO</h3>
              <p><strong>Nome:</strong> {student.name}</p>
              <p><strong>Número:</strong> {student.student_number}</p>
              {student.email && <p><strong>Email:</strong> {student.email}</p>}
              {student.phone && <p><strong>Telefone:</strong> {student.phone}</p>}
              {student.weight && <p><strong>Peso:</strong> {student.weight}kg</p>}
              {student.height && <p><strong>Altura:</strong> {student.height}m</p>}
            </div>
          </div>
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="diet" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 print:hidden">
            <TabsTrigger value="diet" className="flex items-center gap-2">
              <Apple className="w-4 h-4" />
              Dieta
            </TabsTrigger>
            <TabsTrigger value="workout" className="flex items-center gap-2">
              <Dumbbell className="w-4 h-4" />
              Treino
            </TabsTrigger>
          </TabsList>

          {/* Diet Tab */}
          <TabsContent value="diet" className="space-y-6 print:block">
            {dietPlan ? (
              <>
                <Card className="print:shadow-none print:border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Apple className="w-5 h-5" />
                      {dietPlan.name}
                    </CardTitle>
                    {dietPlan.description && (
                      <p className="text-gray-600">{dietPlan.description}</p>
                    )}
                  </CardHeader>
                  <CardContent>
                    {(dietPlan.daily_calories || dietPlan.daily_protein || dietPlan.daily_carbs || dietPlan.daily_fat) && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        {dietPlan.daily_calories && (
                          <div className="text-center p-3 bg-blue-50 rounded-lg">
                            <p className="text-2xl font-bold text-blue-600">{dietPlan.daily_calories}</p>
                            <p className="text-sm text-gray-600">Calorias</p>
                          </div>
                        )}
                        {dietPlan.daily_protein && (
                          <div className="text-center p-3 bg-green-50 rounded-lg">
                            <p className="text-2xl font-bold text-green-600">{dietPlan.daily_protein}g</p>
                            <p className="text-sm text-gray-600">Proteína</p>
                          </div>
                        )}
                        {dietPlan.daily_carbs && (
                          <div className="text-center p-3 bg-yellow-50 rounded-lg">
                            <p className="text-2xl font-bold text-yellow-600">{dietPlan.daily_carbs}g</p>
                            <p className="text-sm text-gray-600">Carboidratos</p>
                          </div>
                        )}
                        {dietPlan.daily_fat && (
                          <div className="text-center p-3 bg-purple-50 rounded-lg">
                            <p className="text-2xl font-bold text-purple-600">{dietPlan.daily_fat}g</p>
                            <p className="text-sm text-gray-600">Gordura</p>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div className="space-y-4">
                  {meals.map((meal) => (
                    <Card key={meal.id} className="print:shadow-none print:border print:break-inside-avoid">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-center">
                          <div>
                            <CardTitle className="text-lg">{meal.name}</CardTitle>
                            {meal.time_of_day && (
                              <p className="text-sm text-gray-600 flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {meal.time_of_day}
                              </p>
                            )}
                          </div>
                          <Button
                            variant={completedMeals.has(meal.id) ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleMealCompletion(meal.id)}
                            className="print:hidden"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            {completedMeals.has(meal.id) ? "Concluído" : "Marcar"}
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {meal.meal_foods.map((food) => (
                            <div key={food.id} className="border-l-4 border-blue-200 pl-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-medium">{food.food_name}</h4>
                                  <p className="text-sm text-gray-600">
                                    {food.quantity} {food.unit}
                                  </p>
                                  {food.notes && (
                                    <p className="text-sm text-gray-500 italic mt-1">{food.notes}</p>
                                  )}
                                </div>
                                <div className="text-right text-sm">
                                  {food.calories && <p>{food.calories} kcal</p>}
                                  <div className="flex gap-2 text-xs text-gray-500">
                                    {food.protein && <span>P: {food.protein}g</span>}
                                    {food.carbs && <span>C: {food.carbs}g</span>}
                                    {food.fat && <span>G: {food.fat}g</span>}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            ) : (
              <Card className="print:shadow-none print:border">
                <CardContent className="text-center py-8">
                  <Apple className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">Nenhum plano de dieta encontrado</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Workout Tab */}
          <TabsContent value="workout" className="space-y-6 print:block">
            {workoutPlan ? (
              <>
                <Card className="print:shadow-none print:border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Dumbbell className="w-5 h-5" />
                      {workoutPlan.name}
                    </CardTitle>
                    {workoutPlan.description && (
                      <p className="text-gray-600">{workoutPlan.description}</p>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <p className="text-2xl font-bold text-blue-600">{workoutPlan.frequency_per_week}</p>
                        <p className="text-sm text-gray-600">Vezes por semana</p>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <p className="text-2xl font-bold text-green-600">{workoutPlan.duration_weeks}</p>
                        <p className="text-sm text-gray-600">Semanas</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-4">
                  {workoutPlan.workout_sessions
                    ?.sort((a, b) => a.day_of_week - b.day_of_week)
                    .map((session) => (
                      <Card key={session.id} className="print:shadow-none print:border print:break-inside-avoid">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg">
                            {dayNames[session.day_of_week]} - {session.name}
                          </CardTitle>
                          {session.description && (
                            <p className="text-sm text-gray-600">{session.description}</p>
                          )}
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {session.workout_exercises
                              ?.sort((a, b) => a.order_index - b.order_index)
                              .map((exercise) => (
                                <div key={exercise.id} className="border-l-4 border-green-200 pl-4">
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                      <h4 className="font-medium">{exercise.exercises.name}</h4>
                                      <div className="flex flex-wrap gap-2 text-sm text-gray-600 mt-1">
                                        <span>{exercise.sets} séries</span>
                                        {exercise.reps_min && exercise.reps_max ? (
                                          <span>{exercise.reps_min}-{exercise.reps_max} reps</span>
                                        ) : exercise.reps_min ? (
                                          <span>{exercise.reps_min} reps</span>
                                        ) : null}
                                        {exercise.weight_kg && <span>{exercise.weight_kg}kg</span>}
                                        <span>{Math.floor((exercise.rest_seconds || 60) / 60)}min descanso</span>
                                      </div>
                                      {exercise.exercises.muscle_groups && exercise.exercises.muscle_groups.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-2">
                                          {exercise.exercises.muscle_groups.map((muscle, index) => (
                                            <Badge key={index} variant="secondary" className="text-xs">
                                              {muscle}
                                            </Badge>
                                          ))}
                                        </div>
                                      )}
                                      {exercise.notes && (
                                        <p className="text-sm text-gray-500 italic mt-2">{exercise.notes}</p>
                                      )}
                                    </div>
                                    <Button
                                      variant={completedExercises.has(exercise.id) ? "default" : "outline"}
                                      size="sm"
                                      onClick={() => handleExerciseCompletion(exercise.id)}
                                      className="print:hidden ml-4"
                                    >
                                      <CheckCircle className="w-4 h-4 mr-1" />
                                      {completedExercises.has(exercise.id) ? "✓" : "○"}
                                    </Button>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </>
            ) : (
              <Card className="print:shadow-none print:border">
                <CardContent className="text-center py-8">
                  <Dumbbell className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">Nenhum plano de treino encontrado</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
