import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X, Plus, Dumbbell, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import VideoModal from "./VideoModal";

interface Exercise {
  id: string;
  name: string;
  category_id: string;
  youtube_video_url?: string;
}

interface ExerciseCategory {
  id: string;
  name: string;
  emoji: string;
}

interface WorkoutExercise {
  id: string;
  exercise_id: string;
  exercise_name: string;
  sets: number;
  reps_min: number;
  reps_max: number;
  rest_minutes: number;
  order_index: number;
}

interface WorkoutSession {
  id: string;
  name: string;
  day_of_week: number;
  workout_plan_id: string;
  exercises: WorkoutExercise[];
}

interface EditWorkoutSessionProps {
  session: WorkoutSession;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const DAYS_OF_WEEK = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Segunda-feira" },
  { value: 2, label: "Terça-feira" },
  { value: 3, label: "Quarta-feira" },
  { value: 4, label: "Quinta-feira" },
  { value: 5, label: "Sexta-feira" },
  { value: 6, label: "Sábado" },
];

const EditWorkoutSession = ({ session, isOpen, onClose, onSuccess }: EditWorkoutSessionProps) => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [categories, setCategories] = useState<ExerciseCategory[]>([]);
  const [sessionData, setSessionData] = useState<WorkoutSession>(session);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [videoModal, setVideoModal] = useState<{
    isOpen: boolean;
    exerciseName: string;
    youtubeUrl?: string;
  }>({
    isOpen: false,
    exerciseName: "",
    youtubeUrl: undefined,
  });
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadData();
      loadCurrentExercises();
    }
  }, [isOpen, session.id]);

  const loadData = async () => {
    try {
      const [exercisesResponse, categoriesResponse] = await Promise.all([
        supabase.from("exercises").select("id, name, category_id").order("name"),
        supabase.from("exercise_categories").select("id, name, emoji").order("name")
      ]);

      if (exercisesResponse.error) throw exercisesResponse.error;
      if (categoriesResponse.error) throw categoriesResponse.error;

      setExercises(exercisesResponse.data || []);
      setCategories(categoriesResponse.data || []);
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  const loadCurrentExercises = async () => {
    try {
      const { data, error } = await supabase
        .from("workout_exercises")
        .select(`
          id,
          exercise_id,
          sets,
          reps_min,
          reps_max,
          rest_seconds,
          order_index,
          exercises(name)
        `)
        .eq("workout_session_id", session.id)
        .order("order_index");

      if (error) throw error;

      const workoutExercises: WorkoutExercise[] = (data || []).map(ex => ({
        id: ex.id,
        exercise_id: ex.exercise_id,
        exercise_name: ex.exercises?.name || "",
        sets: ex.sets,
        reps_min: ex.reps_min || 8,
        reps_max: ex.reps_max || 12,
        rest_minutes: Math.round((ex.rest_seconds || 60) / 60), // Convert seconds to minutes
        order_index: ex.order_index,
      }));

      setSessionData(prev => ({ ...prev, exercises: workoutExercises }));
    } catch (error) {
      console.error("Error loading current exercises:", error);
    }
  };

  const addExercise = (exerciseId: string) => {
    const exercise = exercises.find(e => e.id === exerciseId);
    if (!exercise) return;

    const newExercise: WorkoutExercise = {
      id: "", // New exercise, no ID yet
      exercise_id: exerciseId,
      exercise_name: exercise.name,
      sets: 3,
      reps_min: 8,
      reps_max: 12,
     rest_minutes: 1,
      order_index: sessionData.exercises.length,
    };

    setSessionData(prev => ({
      ...prev,
      exercises: [...prev.exercises, newExercise].map((ex, idx) => ({ ...ex, order_index: idx }))
    }));
  };

  const updateExercise = (index: number, field: string, value: number) => {
    setSessionData(prev => ({
      ...prev,
      exercises: prev.exercises.map((ex, idx) => 
        idx === index ? { ...ex, [field]: value } : ex
      )
    }));
  };

  const removeExercise = (index: number) => {
    setSessionData(prev => ({
      ...prev,
      exercises: prev.exercises
        .filter((_, idx) => idx !== index)
        .map((ex, idx) => ({ ...ex, order_index: idx }))
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Delete all existing exercises for this session
      const { error: deleteError } = await supabase
        .from("workout_exercises")
        .delete()
        .eq("workout_session_id", session.id);

      if (deleteError) throw deleteError;

      // Insert updated exercises
      if (sessionData.exercises.length > 0) {
        const exercisesToInsert = sessionData.exercises.map(ex => ({
          workout_session_id: session.id,
          exercise_id: ex.exercise_id,
          sets: ex.sets,
          reps_min: ex.reps_min,
          reps_max: ex.reps_max,
          rest_seconds: ex.rest_minutes * 60, // Convert minutes back to seconds for database
          order_index: ex.order_index,
        }));

        const { error: insertError } = await supabase
          .from("workout_exercises")
          .insert(exercisesToInsert);

        if (insertError) throw insertError;
      }

      toast({
        title: "Sucesso!",
        description: "Treino atualizado com sucesso!",
      });

      onSuccess();
    } catch (error) {
      console.error("Error updating workout:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o treino. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openVideoModal = (exerciseName: string, youtubeUrl?: string) => {
    setVideoModal({
      isOpen: true,
      exerciseName,
      youtubeUrl,
    });
  };

  const closeVideoModal = () => {
    setVideoModal({
      isOpen: false,
      exerciseName: "",
      youtubeUrl: undefined,
    });
  };

  const categoryExercises = exercises.filter(ex => ex.category_id === selectedCategory);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5" />
            Editar Treino - {session.name}
            <span className="text-sm text-muted-foreground">
              ({DAYS_OF_WEEK.find(d => d.value === session.day_of_week)?.label})
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add Exercise Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Adicionar Exercício</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category.id} value={category.id}>
                          <span className="flex items-center gap-2">
                            {category.emoji} {category.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {selectedCategory && (
                  <div className="space-y-2">
                    <Label>Exercício</Label>
                    <Select onValueChange={addExercise}>
                      <SelectTrigger>
                        <SelectValue placeholder="Escolher exercício" />
                      </SelectTrigger>
                      <SelectContent>
                        {categoryExercises.map(exercise => (
                          <SelectItem key={exercise.id} value={exercise.id}>
                            {exercise.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Exercises List */}
          {sessionData.exercises.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Exercícios do Treino ({sessionData.exercises.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {sessionData.exercises.map((exercise, idx) => (
                    <div key={idx} className="grid grid-cols-5 gap-3 items-end p-3 bg-muted rounded-lg">
                      <div>
                        <Label className="text-xs font-medium">{exercise.exercise_name}</Label>
                      </div>
                      <div>
                        <Label className="text-xs">Séries</Label>
                        <Input
                          type="number"
                          value={exercise.sets}
                          onChange={(e) => updateExercise(idx, 'sets', parseInt(e.target.value) || 0)}
                          min="1"
                          max="10"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Repetições</Label>
                        <div className="flex gap-1">
                          <Input
                            type="number"
                            value={exercise.reps_min}
                            onChange={(e) => updateExercise(idx, 'reps_min', parseInt(e.target.value) || 0)}
                            min="1"
                            placeholder="Min"
                          />
                          <Input
                            type="number"
                            value={exercise.reps_max}
                            onChange={(e) => updateExercise(idx, 'reps_max', parseInt(e.target.value) || 0)}
                            min="1"
                            placeholder="Max"
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs">Descanso (min)</Label>
                        <Input
                          type="number"
                          step="0.5"
                         placeholder="1"
                          value={exercise.rest_minutes}
                          onChange={(e) => updateExercise(idx, 'rest_minutes', parseFloat(e.target.value) || 0)}
                          min="0"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeExercise(idx)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button 
              onClick={handleSave} 
              className="flex-1" 
              disabled={isLoading}
            >
              {isLoading ? "Salvando..." : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Treino
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>

      {/* Video Modal */}
      <VideoModal
        isOpen={videoModal.isOpen}
        onClose={closeVideoModal}
        exerciseName={videoModal.exerciseName}
        youtubeUrl={videoModal.youtubeUrl}
      />
    </Dialog>
  );
};

export default EditWorkoutSession;