import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  X, 
  Plus, 
  Dumbbell, 
  Save, 
  Edit,
  Trash2,
  Calendar
} from "lucide-react";
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
  id?: string;
  exercise_id: string;
  exercise_name: string;
  sets: number;
  reps_min: number;
  reps_max: number;
  rest_minutes: number;
  order_index: number;
}

interface WorkoutSession {
  id?: string;
  name: string;
  day_of_week: number;
  exercises: WorkoutExercise[];
  isNew?: boolean;
}

interface WorkoutPlan {
  id: string;
  name: string;
  description?: string;
  frequency_per_week: number;
  duration_weeks: number;
  sessions: WorkoutSession[];
}

interface WorkoutPlanEditorProps {
  workoutPlan: any;
  studentId: string;
  trainerId: string;
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

const WorkoutPlanEditor = ({ 
  workoutPlan, 
  studentId, 
  trainerId, 
  isOpen, 
  onClose, 
  onSuccess 
}: WorkoutPlanEditorProps) => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [categories, setCategories] = useState<ExerciseCategory[]>([]);
  const [planData, setPlanData] = useState<WorkoutPlan>({
    id: workoutPlan?.id || "",
    name: workoutPlan?.name || "",
    description: workoutPlan?.description || "",
    frequency_per_week: workoutPlan?.frequency_per_week || 3,
    duration_weeks: workoutPlan?.duration_weeks || 4,
    sessions: []
  });
  const [activeTab, setActiveTab] = useState("plan");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedDaysToAdd, setSelectedDaysToAdd] = useState<number[]>([]);
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
      loadWorkoutSessions();
    }
  }, [isOpen, workoutPlan?.id]);

  const loadData = async () => {
    try {
      const [exercisesResponse, categoriesResponse] = await Promise.all([
        supabase.from("exercises").select("id, name, category_id, youtube_video_url").order("name"),
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

  const loadWorkoutSessions = async () => {
    if (!workoutPlan?.id) return;

    try {
      const { data, error } = await supabase
        .from("workout_sessions")
        .select(`
          id,
          name,
          day_of_week,
          workout_exercises(
            id,
            exercise_id,
            sets,
            reps_min,
            reps_max,
            rest_seconds,
            order_index,
            exercises(name)
          )
        `)
        .eq("workout_plan_id", workoutPlan.id)
        .order("day_of_week");

      if (error) throw error;

      const sessions: WorkoutSession[] = (data || []).map(session => ({
        id: session.id,
        name: session.name,
        day_of_week: session.day_of_week,
        exercises: (session.workout_exercises || []).map((ex: any) => ({
          id: ex.id,
          exercise_id: ex.exercise_id,
          exercise_name: ex.exercises?.name || "",
          sets: ex.sets,
          reps_min: ex.reps_min || 8,
          reps_max: ex.reps_max || 12,
          rest_minutes: Math.round((ex.rest_seconds || 60) / 60),
          order_index: ex.order_index,
        })).sort((a: any, b: any) => a.order_index - b.order_index)
      }));

      setPlanData(prev => ({ ...prev, sessions }));
    } catch (error) {
      console.error("Error loading workout sessions:", error);
    }
  };

  const addNewDay = () => {
    // Find the next available day
    const usedDays = planData.sessions.map(s => s.day_of_week);
    const availableDay = DAYS_OF_WEEK.find(day => !usedDays.includes(day.value));
    
    if (!availableDay) {
      toast({
        title: "Limite atingido",
        description: "Todos os dias da semana já foram utilizados.",
        variant: "destructive",
      });
      return;
    }

    const newSession: WorkoutSession = {
      name: `Treino ${availableDay.label}`,
      day_of_week: availableDay.value,
      exercises: [],
      isNew: true
    };

    setPlanData(prev => ({
      ...prev,
      sessions: [...prev.sessions, newSession].sort((a, b) => a.day_of_week - b.day_of_week)
    }));
    
    setActiveTab(`session-${availableDay.value}`);
  };

  const addMultipleDays = () => {
    if (selectedDaysToAdd.length === 0) {
      toast({
        title: "Selecione dias",
        description: "Selecione pelo menos um dia para adicionar.",
        variant: "destructive",
      });
      return;
    }

    const usedDays = planData.sessions.map(s => s.day_of_week);
    const validDays = selectedDaysToAdd.filter(day => !usedDays.includes(day));

    if (validDays.length === 0) {
      toast({
        title: "Dias já existem",
        description: "Todos os dias selecionados já foram adicionados ao plano.",
        variant: "destructive",
      });
      return;
    }

    const newSessions: WorkoutSession[] = validDays.map(dayValue => {
      const dayLabel = DAYS_OF_WEEK.find(d => d.value === dayValue)?.label || "Treino";
      return {
        name: `Treino ${dayLabel}`,
        day_of_week: dayValue,
        exercises: [],
        isNew: true
      };
    });

    setPlanData(prev => ({
      ...prev,
      sessions: [...prev.sessions, ...newSessions].sort((a, b) => a.day_of_week - b.day_of_week)
    }));

    setSelectedDaysToAdd([]);
    
    // Switch to the first added day
    if (validDays.length > 0) {
      setActiveTab(`session-${validDays[0]}`);
    }

    toast({
      title: "Dias adicionados!",
      description: `${validDays.length} dia(s) de treino adicionado(s) com sucesso.`,
    });
  };

  const toggleDaySelection = (dayValue: number) => {
    setSelectedDaysToAdd(prev => 
      prev.includes(dayValue) 
        ? prev.filter(d => d !== dayValue)
        : [...prev, dayValue]
    );
  };

  const getAvailableDays = () => {
    const usedDays = planData.sessions.map(s => s.day_of_week);
    return DAYS_OF_WEEK.filter(day => !usedDays.includes(day.value));
  };

  const updateSession = (dayOfWeek: number, updates: Partial<WorkoutSession>) => {
    setPlanData(prev => ({
      ...prev,
      sessions: prev.sessions.map(session =>
        session.day_of_week === dayOfWeek ? { ...session, ...updates } : session
      )
    }));
  };

  const removeSession = (dayOfWeek: number) => {
    setPlanData(prev => ({
      ...prev,
      sessions: prev.sessions.filter(session => session.day_of_week !== dayOfWeek)
    }));
    setActiveTab("plan");
  };

  const addExerciseToSession = (dayOfWeek: number, exerciseId: string) => {
    const exercise = exercises.find(e => e.id === exerciseId);
    if (!exercise) return;

    const session = planData.sessions.find(s => s.day_of_week === dayOfWeek);
    if (!session) return;

    const newExercise: WorkoutExercise = {
      exercise_id: exerciseId,
      exercise_name: exercise.name,
      sets: 3,
      reps_min: 8,
      reps_max: 12,
      rest_minutes: 1,
      order_index: session.exercises.length,
    };

    updateSession(dayOfWeek, {
      exercises: [...session.exercises, newExercise].map((ex, idx) => ({ ...ex, order_index: idx }))
    });
  };

  const updateExercise = (dayOfWeek: number, exerciseIndex: number, field: string, value: number) => {
    const session = planData.sessions.find(s => s.day_of_week === dayOfWeek);
    if (!session) return;

    const updatedExercises = session.exercises.map((ex, idx) => 
      idx === exerciseIndex ? { ...ex, [field]: value } : ex
    );

    updateSession(dayOfWeek, { exercises: updatedExercises });
  };

  const removeExercise = (dayOfWeek: number, exerciseIndex: number) => {
    const session = planData.sessions.find(s => s.day_of_week === dayOfWeek);
    if (!session) return;

    const updatedExercises = session.exercises
      .filter((_, idx) => idx !== exerciseIndex)
      .map((ex, idx) => ({ ...ex, order_index: idx }));

    updateSession(dayOfWeek, { exercises: updatedExercises });
  };

  const handleSave = async () => {
    if (!planData.name.trim()) {
      toast({
        title: "Erro",
        description: "Nome do plano é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    if (planData.sessions.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos um dia de treino.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Update workout plan
      const { error: planError } = await supabase
        .from("workout_plans")
        .update({
          name: planData.name,
          description: planData.description,
          frequency_per_week: planData.frequency_per_week,
          duration_weeks: planData.duration_weeks,
        })
        .eq("id", planData.id);

      if (planError) throw planError;

      // Delete existing sessions that are not in current plan
      const currentSessionIds = planData.sessions.filter(s => s.id).map(s => s.id);
      
      if (currentSessionIds.length > 0) {
        const { error: deleteError } = await supabase
          .from("workout_sessions")
          .delete()
          .eq("workout_plan_id", planData.id)
          .not("id", "in", `(${currentSessionIds.join(",")})`);

        if (deleteError) throw deleteError;
      } else {
        // Delete all sessions if no existing ones
        const { error: deleteAllError } = await supabase
          .from("workout_sessions")
          .delete()
          .eq("workout_plan_id", planData.id);

        if (deleteAllError) throw deleteAllError;
      }

      // Insert or update sessions
      for (const session of planData.sessions) {
        let sessionId = session.id;

        if (session.isNew || !session.id) {
          // Insert new session
          const { data: sessionData, error: sessionError } = await supabase
            .from("workout_sessions")
            .insert({
              workout_plan_id: planData.id,
              name: session.name,
              day_of_week: session.day_of_week,
            })
            .select("id")
            .single();

          if (sessionError) throw sessionError;
          sessionId = sessionData.id;
        } else {
          // Update existing session
          const { error: sessionUpdateError } = await supabase
            .from("workout_sessions")
            .update({
              name: session.name,
              day_of_week: session.day_of_week,
            })
            .eq("id", session.id);

          if (sessionUpdateError) throw sessionUpdateError;
        }

        // Delete existing exercises for this session
        const { error: deleteExercisesError } = await supabase
          .from("workout_exercises")
          .delete()
          .eq("workout_session_id", sessionId);

        if (deleteExercisesError) throw deleteExercisesError;

        // Insert exercises
        if (session.exercises.length > 0) {
          const exercisesToInsert = session.exercises.map(ex => ({
            workout_session_id: sessionId,
            exercise_id: ex.exercise_id,
            sets: ex.sets,
            reps_min: ex.reps_min,
            reps_max: ex.reps_max,
            rest_seconds: ex.rest_minutes * 60,
            order_index: ex.order_index,
          }));

          const { error: insertExercisesError } = await supabase
            .from("workout_exercises")
            .insert(exercisesToInsert);

          if (insertExercisesError) throw insertExercisesError;
        }
      }

      toast({
        title: "Sucesso!",
        description: "Plano de treino atualizado com sucesso!",
      });

      onSuccess();
    } catch (error) {
      console.error("Error saving workout plan:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o plano de treino. Tente novamente.",
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 md:p-4">
      <Card className="w-full max-w-[95vw] h-[98vh] overflow-hidden shadow-2xl">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-full">
                <Dumbbell className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg sm:text-xl">Editar Plano de Treino</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Modifique os exercícios e configurações do plano
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button 
                variant="outline" 
                onClick={onClose}
                className="flex-1 sm:flex-none"
              >
                <X className="h-4 w-4 mr-2" />
                Fechar
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={isLoading}
                className="flex-1 sm:flex-none"
              >
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="overflow-y-auto h-[calc(98vh-140px)] p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="w-full mb-6">
              <div className="flex flex-wrap items-center gap-2 p-4 bg-muted/30 rounded-lg border">
                <Button
                  variant={activeTab === "plan" ? "default" : "outline"}
                  size="default"
                  onClick={() => setActiveTab("plan")}
                  className="flex items-center gap-2 min-w-fit px-4 py-2 h-10"
                >
                  <Calendar className="h-4 w-4" />
                  <span className="font-medium">Plano Geral</span>
                </Button>
                
                {planData.sessions.map(session => (
                  <Button
                    key={session.day_of_week}
                    variant={activeTab === `session-${session.day_of_week}` ? "default" : "outline"}
                    size="default"
                    onClick={() => setActiveTab(`session-${session.day_of_week}`)}
                    className="flex items-center gap-2 min-w-fit px-4 py-2 h-10 relative"
                  >
                    <Dumbbell className="h-4 w-4" />
                    <span className="font-medium">
                      {DAYS_OF_WEEK.find(d => d.value === session.day_of_week)?.label}
                    </span>
                    {session.exercises.length > 0 && (
                      <Badge variant="secondary" className="ml-1 text-xs px-1 py-0 h-5">
                        {session.exercises.length}
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeSession(session.day_of_week);
                      }}
                      className="ml-2 h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Button>
                ))}
                
                <Button
                  variant={activeTab === "add-days" ? "default" : "outline"}
                  size="default"
                  onClick={() => setActiveTab("add-days")}
                  className="flex items-center gap-2 min-w-fit px-4 py-2 h-10 border-dashed border-2 hover:border-primary"
                >
                  <Plus className="h-4 w-4" />
                  <span className="font-medium">Adicionar Dia</span>
                </Button>
              </div>
            </div>

            <TabsContent value="plan" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Plano</Label>
                  <Input
                    id="name"
                    value={planData.name}
                    onChange={(e) => setPlanData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Treino Hipertrofia Iniciante"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="frequency">Frequência Semanal</Label>
                  <Input
                    id="frequency"
                    type="number"
                    min="1"
                    max="7"
                    value={planData.frequency_per_week}
                    onChange={(e) => setPlanData(prev => ({ ...prev, frequency_per_week: parseInt(e.target.value) || 1 }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Duração (semanas)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="1"
                    value={planData.duration_weeks}
                    onChange={(e) => setPlanData(prev => ({ ...prev, duration_weeks: parseInt(e.target.value) || 1 }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição (opcional)</Label>
                <Input
                  id="description"
                  value={planData.description || ""}
                  onChange={(e) => setPlanData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descrição do plano..."
                />
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Dias de Treino ({planData.sessions.length})</h3>
                {planData.sessions.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="text-center py-8">
                      <Dumbbell className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                      <p className="text-muted-foreground">Nenhum dia de treino adicionado</p>
                      <Button onClick={addNewDay} className="mt-4">
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Primeiro Dia
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-2">
                    {planData.sessions.map(session => (
                      <div key={session.day_of_week} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div>
                          <p className="font-medium">{session.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {DAYS_OF_WEEK.find(d => d.value === session.day_of_week)?.label} • {session.exercises.length} exercícios
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setActiveTab(`session-${session.day_of_week}`)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeSession(session.day_of_week)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="add-days" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Adicionar Novos Dias de Treino</h3>
                <div className="text-sm text-muted-foreground">
                  {getAvailableDays().length} dias disponíveis
                </div>
              </div>

              {getAvailableDays().length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="text-center py-8">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground">Todos os dias da semana já foram adicionados</p>
                    <p className="text-sm text-muted-foreground">
                      Você já tem treinos para todos os 7 dias da semana
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Selecionar Dias</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Escolha os dias da semana que você deseja adicionar ao plano de treino
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {getAvailableDays().map(day => (
                          <div
                            key={day.value}
                            className={`
                              flex items-center space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-all
                              ${selectedDaysToAdd.includes(day.value) 
                                ? 'border-primary bg-primary/10' 
                                : 'border-border hover:border-primary/50'
                              }
                            `}
                            onClick={() => toggleDaySelection(day.value)}
                          >
                            <Checkbox
                              id={`day-${day.value}`}
                              checked={selectedDaysToAdd.includes(day.value)}
                              onChange={() => toggleDaySelection(day.value)}
                            />
                            <Label 
                              htmlFor={`day-${day.value}`} 
                              className="flex-1 cursor-pointer font-medium"
                            >
                              {day.label}
                            </Label>
                          </div>
                        ))}
                      </div>

                      {selectedDaysToAdd.length > 0 && (
                        <div className="mt-4 p-3 bg-muted rounded-lg">
                          <p className="text-sm font-medium mb-2">
                            Dias selecionados ({selectedDaysToAdd.length}):
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {selectedDaysToAdd.map(dayValue => (
                              <Badge key={dayValue} variant="secondary">
                                {DAYS_OF_WEEK.find(d => d.value === dayValue)?.label}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                        <div className="flex flex-col sm:flex-row gap-2 mt-4">
                          <Button
                            variant="outline"
                            onClick={() => setSelectedDaysToAdd(getAvailableDays().map(d => d.value))}
                            disabled={getAvailableDays().length === 0}
                            className="w-full sm:w-auto"
                          >
                            Selecionar Todos
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setSelectedDaysToAdd([])}
                            disabled={selectedDaysToAdd.length === 0}
                            className="w-full sm:w-auto"
                          >
                            Limpar Seleção
                          </Button>
                          <Button
                            onClick={addMultipleDays}
                            disabled={selectedDaysToAdd.length === 0}
                            className="w-full sm:flex-1 sm:ml-auto"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Adicionar {selectedDaysToAdd.length} Dia(s)
                          </Button>
                        </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            {planData.sessions.map(session => (
              <TabsContent key={session.day_of_week} value={`session-${session.day_of_week}`} className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">
                      {DAYS_OF_WEEK.find(d => d.value === session.day_of_week)?.label}
                    </h3>
                    <p className="text-sm text-muted-foreground">{session.exercises.length} exercícios</p>
                  </div>
                  <Input
                    value={session.name}
                    onChange={(e) => updateSession(session.day_of_week, { name: e.target.value })}
                    className="w-auto"
                  />
                </div>

                {/* Add Exercise Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Adicionar Exercício</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4">
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
                          <Select onValueChange={(value) => addExerciseToSession(session.day_of_week, value)}>
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
                {session.exercises.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Exercícios ({session.exercises.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {session.exercises.map((exercise, idx) => (
                          <div key={idx} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 lg:gap-3 items-end p-3 bg-muted rounded-lg">
                            <div className="col-span-1 sm:col-span-2 lg:col-span-1">
                              <Label className="text-xs font-medium">{exercise.exercise_name}</Label>
                            </div>
                            <div>
                              <Label className="text-xs">Séries</Label>
                              <Input
                                type="number"
                                value={exercise.sets}
                                onChange={(e) => updateExercise(session.day_of_week, idx, 'sets', parseInt(e.target.value) || 0)}
                                min="1"
                                max="10"
                                className="h-9"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Repetições</Label>
                              <div className="flex gap-1">
                                <Input
                                  type="number"
                                  value={exercise.reps_min}
                                  onChange={(e) => updateExercise(session.day_of_week, idx, 'reps_min', parseInt(e.target.value) || 0)}
                                  min="1"
                                  placeholder="Min"
                                  className="h-9"
                                />
                                <Input
                                  type="number"
                                  value={exercise.reps_max}
                                  onChange={(e) => updateExercise(session.day_of_week, idx, 'reps_max', parseInt(e.target.value) || 0)}
                                  min="1"
                                  placeholder="Max"
                                  className="h-9"
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
                                onChange={(e) => updateExercise(session.day_of_week, idx, 'rest_minutes', parseFloat(e.target.value) || 0)}
                                min="0"
                                className="h-9"
                              />
                            </div>
                            <div className="flex justify-end sm:justify-start">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeExercise(session.day_of_week, idx)}
                                className="w-full sm:w-auto"
                              >
                                <X className="h-4 w-4" />
                                <span className="ml-2 sm:hidden">Remover</span>
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            ))}
          </Tabs>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-6 mt-6 border-t bg-muted/20 p-4 rounded-lg sticky bottom-0 bg-background/95 backdrop-blur-sm shadow-lg">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose} 
              className="flex-1 h-12 text-base font-medium border-2"
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar e Fechar
            </Button>
            <Button 
              onClick={handleSave} 
              className="flex-1 h-12 text-base font-medium bg-primary hover:bg-primary/90" 
              disabled={isLoading || !planData.name.trim() || planData.sessions.length === 0}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Salvando Alterações...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Plano de Treino
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Video Modal */}
      <VideoModal
        isOpen={videoModal.isOpen}
        onClose={closeVideoModal}
        exerciseName={videoModal.exerciseName}
        youtubeUrl={videoModal.youtubeUrl}
      />
    </div>
  );
};

export default WorkoutPlanEditor;