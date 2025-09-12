import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, Plus, Dumbbell, Settings, Play, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import WorkoutPlanEditor from "./WorkoutPlanEditor";
import VideoModal from "./VideoModal";

interface Exercise {
  id: string;
  name: string;
  category_id: string;
  instructions?: string;
  muscle_groups?: string[];
  equipment?: string[];
  youtube_video_url?: string;
}

interface ExistingWorkoutPlan {
  id: string;
  name: string;
  description?: string;
  active: boolean;
  frequency_per_week: number;
  duration_weeks: number;
  workout_sessions: {
    id: string;
    name: string;
    day_of_week: number;
    workout_exercises: {
      id: string;
      exercise: {
        name: string;
      };
    }[];
  }[];
}

interface ExerciseCategory {
  id: string;
  name: string;
  emoji: string;
}

interface WorkoutExercise {
  exercise_id: string;
  exercise_name: string;
  sets: number;
  reps_min: number;
  reps_max: number;
  rest_minutes: number;
  order_index: number;
}

interface WorkoutSession {
  day: number;
  name: string;
  category_id: string;
  category_name: string;
  exercises: WorkoutExercise[];
}

interface QuickWorkoutCreatorProps {
  studentId: string;
  studentName: string;
  trainerId: string;
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

const QuickWorkoutCreator = ({ studentId, studentName, trainerId, onClose, onSuccess }: QuickWorkoutCreatorProps) => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [existingWorkouts, setExistingWorkouts] = useState<ExistingWorkoutPlan[]>([]);
  const [editingWorkout, setEditingWorkout] = useState<ExistingWorkoutPlan | null>(null);
  const [activeTab, setActiveTab] = useState("existing");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    frequency_per_week: 3,
    duration_weeks: 4,
  });
  
  const [categories, setCategories] = useState<ExerciseCategory[]>([]);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
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
    loadCategories();
    loadExercises();
    loadExistingWorkouts();
  }, [studentId]);

  const loadExistingWorkouts = async () => {
    try {
      const { data, error } = await supabase
        .from("workout_plans")
        .select(`
          id,
          name,
          description,
          active,
          frequency_per_week,
          duration_weeks,
          workout_sessions(
            id,
            name,
            day_of_week,
            workout_exercises(
              id,
              exercise:exercises(name)
            )
          )
        `)
        .eq("student_id", studentId)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setExistingWorkouts(data);
      }
    } catch (error) {
      console.error("Error loading existing workouts:", error);
    }
  };

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("exercise_categories")
        .select("id, name, emoji")
        .order("name");

      if (!error && data) {
        setCategories(data);
      }
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

  const loadExercises = async () => {
    try {
      const { data, error } = await supabase
        .from("exercises")
        .select("*")
        .order("name");

      if (!error && data) {
        setExercises(data);
      }
    } catch (error) {
      console.error("Error loading exercises:", error);
    }
  };

  const toggleWorkoutStatus = async (workoutId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("workout_plans")
        .update({ active: !currentStatus })
        .eq("id", workoutId);

      if (!error) {
        toast({
          title: "Status atualizado",
          description: `Treino ${!currentStatus ? 'ativado' : 'desativado'} com sucesso.`,
        });
        loadExistingWorkouts();
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar status do treino.",
        variant: "destructive",
      });
    }
  };

  const deleteWorkout = async (workoutId: string) => {
    if (!confirm("Tem certeza que deseja excluir este treino?")) return;

    try {
      const { error } = await supabase
        .from("workout_plans")
        .delete()
        .eq("id", workoutId);

      if (!error) {
        toast({
          title: "Treino excluído",
          description: "Treino excluído com sucesso.",
        });
        loadExistingWorkouts();
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao excluir treino.",
        variant: "destructive",
      });
    }
  };

  const addTrainingDay = (selectedDay: number) => {
    const dayInfo = DAYS_OF_WEEK.find(d => d.value === selectedDay);
    if (!dayInfo) return;
    
    const newSession: WorkoutSession = {
      day: selectedDay,
      name: `Treino ${dayInfo.label}`,
      category_id: "",
      category_name: "",
      exercises: []
    };
    setSessions(prev => [...prev, newSession]);
    setFormData(prev => ({ ...prev, frequency_per_week: sessions.length + 1 }));
  };

  const removeTrainingDay = (dayToRemove: number) => {
    setSessions(prev => prev.filter(session => session.day !== dayToRemove));
    setFormData(prev => ({ ...prev, frequency_per_week: Math.max(1, sessions.length - 1) }));
  };

  const updateSessionCategory = (sessionIndex: number, categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;

    setSessions(prev => prev.map((session, idx) => 
      idx === sessionIndex 
        ? { 
            ...session, 
            category_id: categoryId, 
            category_name: category.name,
            exercises: [] // Clear exercises when category changes
          }
        : session
    ));
  };

  const addExerciseToSession = (sessionIndex: number, exercise: Exercise) => {
    // Check if exercise is already in the session
    const session = sessions[sessionIndex];
    const exerciseExists = session.exercises.some(ex => ex.exercise_id === exercise.id);
    
    if (exerciseExists) {
      toast({
        title: "Exercício já adicionado",
        description: `${exercise.name} já está neste treino.`,
        variant: "destructive",
      });
      return;
    }

    const newExercise: WorkoutExercise = {
      exercise_id: exercise.id,
      exercise_name: exercise.name,
      sets: 3,
      reps_min: 8,
      reps_max: 12,
      rest_minutes: 1,
      order_index: sessions[sessionIndex].exercises.length,
    };

    setSessions(prev => prev.map((session, idx) => 
      idx === sessionIndex 
        ? { ...session, exercises: [...session.exercises, newExercise] }
        : session
    ));

    toast({
      title: "Exercício adicionado!",
      description: `${exercise.name} foi adicionado ao treino.`,
    });
    
    // Não fecha o diálogo para permitir adicionar múltiplos exercícios
  };

  const removeExerciseFromSession = (sessionIndex: number, exerciseIndex: number) => {
    setSessions(prev => prev.map((session, idx) => 
      idx === sessionIndex 
        ? { 
            ...session, 
            exercises: session.exercises
              .filter((_, exIdx) => exIdx !== exerciseIndex)
              .map((ex, newIdx) => ({ ...ex, order_index: newIdx }))
          }
        : session
    ));
  };

  const updateExerciseInSession = (sessionIndex: number, exerciseIndex: number, field: string, value: number) => {
    setSessions(prev => prev.map((session, idx) => 
      idx === sessionIndex 
        ? {
            ...session,
            exercises: session.exercises.map((ex, exIdx) => 
              exIdx === exerciseIndex ? { ...ex, [field]: value } : ex
            )
          }
        : session
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sessions.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione pelo menos um dia da semana para o treino.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.name.trim()) {
      toast({
        title: "Erro",
        description: "Digite um nome para o treino.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Create workout plan
      const { data: workoutPlan, error: planError } = await supabase
        .from("workout_plans")
        .insert({
          name: formData.name,
          description: formData.description,
          student_id: studentId,
          personal_trainer_id: trainerId,
          frequency_per_week: formData.frequency_per_week,
          duration_weeks: formData.duration_weeks,
          active: true,
        })
        .select()
        .single();

      if (planError) throw planError;
      
      console.log("Workout plan created:", workoutPlan);

      // Create sessions and exercises
      for (const session of sessions) {
        if (session.exercises.length === 0) continue;

        const { data: workoutSession, error: sessionError } = await supabase
          .from("workout_sessions")
          .insert({
            workout_plan_id: workoutPlan.id,
            name: session.name,
            day_of_week: session.day,
            description: `Treino para ${DAYS_OF_WEEK.find(d => d.value === session.day)?.label}`,
          })
          .select()
          .single();

        if (sessionError) throw sessionError;
        
        console.log("Workout session created:", workoutSession);

        // Insert exercises for this session
        const exerciseInserts = session.exercises.map(ex => ({
          workout_session_id: workoutSession.id,
          exercise_id: ex.exercise_id,
          sets: ex.sets,
          reps_min: ex.reps_min,
          reps_max: ex.reps_max,
          rest_seconds: ex.rest_minutes * 60,
          order_index: ex.order_index,
        }));

        console.log("Inserting exercises:", exerciseInserts);

        const { error: exerciseError } = await supabase
          .from("workout_exercises")
          .insert(exerciseInserts);

        if (exerciseError) throw exerciseError;
        
        console.log("Exercises inserted successfully");
      }

      toast({
        title: "Sucesso!",
        description: `Treino criado para ${studentName}!`,
      });

      onSuccess();
    } catch (error) {
      console.error("Error creating workout:", error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o treino. Tente novamente.",
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

  const getExercisesByCategory = (categoryId: string) => {
    return exercises.filter(ex => ex.category_id === categoryId);
  };

  const getDayName = (dayIndex: number) => {
    const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    return days[dayIndex] || "?";
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="existing" className="flex items-center gap-2">
            <Dumbbell className="h-4 w-4" />
            Treinos Existentes
          </TabsTrigger>
          <TabsTrigger value="create" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Criar Novo Treino
          </TabsTrigger>
        </TabsList>

        <TabsContent value="existing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Dumbbell className="h-5 w-5" />
                Treinos de {studentName} ({existingWorkouts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {existingWorkouts.length === 0 ? (
                <div className="text-center py-8">
                  <Dumbbell className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">
                    Nenhum treino encontrado para este aluno.
                  </p>
                  <Button 
                    onClick={() => setActiveTab("create")} 
                    className="mt-4"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeiro Treino
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {existingWorkouts.map((workout) => (
                    <Card key={workout.id} className="border-2">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-lg">{workout.name}</h3>
                              <Badge variant={workout.active ? "default" : "secondary"}>
                                {workout.active ? "Ativo" : "Inativo"}
                              </Badge>
                            </div>
                            
                            {workout.description && (
                              <p className="text-sm text-muted-foreground">
                                {workout.description}
                              </p>
                            )}
                            
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">Frequência:</span>
                                <span className="ml-2 font-medium">{workout.frequency_per_week}x/semana</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Duração:</span>
                                <span className="ml-2 font-medium">{workout.duration_weeks} semanas</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Sessões:</span>
                                <span className="ml-2 font-medium">{workout.workout_sessions.length} dias</span>
                              </div>
                            </div>

                            {workout.workout_sessions.length > 0 && (
                              <div className="space-y-2">
                                <p className="text-sm font-medium">Dias de treino:</p>
                                <div className="flex flex-wrap gap-1">
                                  {workout.workout_sessions.map((session) => (
                                    <Badge key={session.id} variant="outline" className="text-xs">
                                      {getDayName(session.day_of_week)} ({session.workout_exercises.length} exerc.)
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex flex-col gap-2 ml-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingWorkout(workout)}
                            >
                              <Settings className="h-4 w-4 mr-2" />
                              Editar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleWorkoutStatus(workout.id, workout.active)}
                            >
                              {workout.active ? "Desativar" : "Ativar"}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteWorkout(workout.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="create" className="space-y-4">
          <Card className="max-w-5xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Criar Novo Treino para {studentName}
              </CardTitle>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome do Treino *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Ex: Treino de Hipertrofia"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="duration">Duração (semanas)</Label>
                    <Input
                      id="duration"
                      type="number"
                      min="1"
                      max="52"
                      value={formData.duration_weeks}
                      onChange={(e) => setFormData(prev => ({ ...prev, duration_weeks: parseInt(e.target.value) || 4 }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descreva os objetivos e características deste treino..."
                    rows={3}
                  />
                </div>

                {/* Training Days Management */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Dias de Treino ({sessions.length} dia{sessions.length !== 1 ? 's' : ''})</Label>
                    <Select onValueChange={(day) => addTrainingDay(parseInt(day))}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="+ Adicionar dia" />
                      </SelectTrigger>
                      <SelectContent>
                        {DAYS_OF_WEEK.filter(day => 
                          !sessions.some(session => session.day === day.value)
                        ).map(day => (
                          <SelectItem key={day.value} value={day.value.toString()}>
                            {day.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {sessions.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {sessions.map((session, idx) => (
                        <Badge key={session.day} variant="default" className="flex items-center gap-2">
                          {DAYS_OF_WEEK.find(d => d.value === session.day)?.label}
                          <X 
                            className="h-3 w-3 cursor-pointer" 
                            onClick={() => removeTrainingDay(session.day)}
                          />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Training Sessions */}
                {sessions.map((session, sessionIndex) => {        
                  return (
                    <Card key={session.day} className="border-2 border-primary/20">
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-medium">
                              {sessionIndex + 1}
                            </div>
                            {DAYS_OF_WEEK.find(d => d.value === session.day)?.label}
                          </CardTitle>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeTrainingDay(session.day)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Category Selection */}
                        <div className="space-y-2">
                          <Label>Categoria do Treino</Label>
                          <Select
                            value={session.category_id}
                            onValueChange={(categoryId) => updateSessionCategory(sessionIndex, categoryId)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a categoria (ex: Peito, Pernas...)">
                                {session.category_name && (
                                  <span className="flex items-center gap-2">
                                    {categories.find(c => c.id === session.category_id)?.emoji} {session.category_name}
                                  </span>
                                )}
                              </SelectValue>
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

                        {/* Exercise Selection */}
                        {session.category_id && (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <Label>Exercícios ({session.exercises.length})</Label>
                              <Badge variant="outline">
                                {categories.find(c => c.id === session.category_id)?.emoji} {session.category_name}
                              </Badge>
                            </div>

                            {/* Exercise List for Selection */}
                            <Card className="border-dashed">
                              <CardHeader>
                                <CardTitle className="text-base">Adicionar Exercícios</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <ScrollArea className="h-64">
                                  <div className="grid gap-2">
                                    {getExercisesByCategory(session.category_id).map(exercise => {
                                      const isSelected = session.exercises.some(ex => ex.exercise_id === exercise.id);
                                      return (
                                        <div
                                          key={exercise.id}
                                          className={`flex items-center justify-between p-3 border rounded-lg transition-all cursor-pointer ${
                                            isSelected 
                                              ? 'border-primary bg-primary/10 cursor-not-allowed' 
                                              : 'hover:bg-muted/50 hover:border-primary/50'
                                          }`}
                                          onClick={() => addExerciseToSession(sessionIndex, exercise)}
                                        >
                                          <div className="flex-1">
                                            <h4 className="font-medium text-sm">{exercise.name}</h4>
                                            {Array.isArray(exercise.muscle_groups) && exercise.muscle_groups.length > 0 && (
                                              <div className="flex gap-1 mt-1">
                                                {exercise.muscle_groups.slice(0, 2).map((muscle, index) => (
                                                  <Badge key={`${muscle}-${index}`} variant="secondary" className="text-xs">
                                                    {muscle}
                                                  </Badge>
                                                ))}
                                              </div>
                                            )}
                                            {exercise.youtube_video_url && (
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  openVideoModal(exercise.name, exercise.youtube_video_url);
                                                }}
                                                className="mt-1 h-6 px-2 text-xs"
                                              >
                                                <Play className="h-3 w-3 mr-1" />
                                                Ver vídeo
                                              </Button>
                                            )}
                                          </div>
                                          <Button
                                            type="button"
                                            size="sm"
                                            variant={isSelected ? "default" : "ghost"}
                                            className="h-8 w-8 p-0"
                                            disabled={isSelected}
                                          >
                                            {isSelected ? (
                                              <span className="text-xs">✓</span>
                                            ) : (
                                              <Plus className="h-4 w-4" />
                                            )}
                                          </Button>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </ScrollArea>
                              </CardContent>
                            </Card>

                            {/* Selected Exercises */}
                            {session.exercises.length > 0 && (
                              <Card>
                                <CardHeader>
                                  <CardTitle className="text-base">Exercícios Selecionados ({session.exercises.length})</CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="space-y-3">
                                    {session.exercises.map((exercise, exerciseIndex) => (
                                      <div key={exerciseIndex} className="border rounded-lg p-4 space-y-3">
                                        <div className="flex items-center justify-between">
                                          <h4 className="font-medium">{exercise.exercise_name}</h4>
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeExerciseFromSession(sessionIndex, exerciseIndex)}
                                          >
                                            <X className="h-4 w-4" />
                                          </Button>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                          <div className="space-y-1">
                                            <Label className="text-xs">Séries</Label>
                                            <Input
                                              type="number"
                                              min="1"
                                              max="10"
                                              value={exercise.sets}
                                              onChange={(e) => updateExerciseInSession(sessionIndex, exerciseIndex, 'sets', parseInt(e.target.value) || 1)}
                                              className="h-8"
                                            />
                                          </div>
                                          <div className="space-y-1">
                                            <Label className="text-xs">Reps Min</Label>
                                            <Input
                                              type="number"
                                              min="1"
                                              value={exercise.reps_min}
                                              onChange={(e) => updateExerciseInSession(sessionIndex, exerciseIndex, 'reps_min', parseInt(e.target.value) || 1)}
                                              className="h-8"
                                            />
                                          </div>
                                          <div className="space-y-1">
                                            <Label className="text-xs">Reps Max</Label>
                                            <Input
                                              type="number"
                                              min="1"
                                              value={exercise.reps_max}
                                              onChange={(e) => updateExerciseInSession(sessionIndex, exerciseIndex, 'reps_max', parseInt(e.target.value) || 1)}
                                              className="h-8"
                                            />
                                          </div>
                                          <div className="space-y-1">
                                            <Label className="text-xs">Descanso (min)</Label>
                                            <Input
                                              type="number"
                                              step="0.5"
                                              min="0"
                                              placeholder="1"
                                              value={exercise.rest_minutes}
                                              onChange={(e) => updateExerciseInSession(sessionIndex, exerciseIndex, 'rest_minutes', parseFloat(e.target.value) || 0)}
                                              className="h-8"
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </CardContent>
                              </Card>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}

                {sessions.length === 0 && (
                  <Card className="border-dashed">
                    <CardContent className="text-center py-8">
                      <Dumbbell className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                      <p className="text-muted-foreground">
                        Nenhum dia de treino selecionado
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Use o seletor acima para adicionar dias de treino
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Submit Buttons */}
                <div className="flex gap-2 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1" 
                    disabled={isLoading || !formData.name || sessions.length === 0}
                  >
                    {isLoading ? "Criando..." : "Criar Treino"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Workout Modal */}
      {editingWorkout && (
        <WorkoutPlanEditor
          workoutPlan={editingWorkout}
          studentId={studentId}
          trainerId={trainerId}
          isOpen={!!editingWorkout}
          onClose={() => setEditingWorkout(null)}
          onSuccess={() => {
            setEditingWorkout(null);
            loadExistingWorkouts();
            onSuccess();
          }}
        />
      )}

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

export default QuickWorkoutCreator;