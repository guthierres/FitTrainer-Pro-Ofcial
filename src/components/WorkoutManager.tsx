import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Dumbbell,
  Clock,
  Target,
  User,
  Settings
} from "lucide-react";
import EditWorkoutSession from "./EditWorkoutSession";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface WorkoutPlan {
  id: string;
  name: string;
  description?: string;
  student_id: string;
  duration_weeks: number;
  frequency_per_week: number;
  active: boolean;
  student?: {
    name: string;
  };
  workout_sessions?: WorkoutSession[];
}

interface WorkoutSession {
  id: string;
  name: string;
  description?: string;
  day_of_week: number;
  workout_exercises?: WorkoutExercise[];
}

interface WorkoutExercise {
  id: string;
  exercise_id: string;
  sets: number;
  reps_min?: number;
  reps_max?: number;
  weight_kg?: number;
  rest_seconds?: number;
  notes?: string;
  order_index: number;
  exercise?: {
    name: string;
    instructions?: string;
  };
}

interface Student {
  id: string;
  name: string;
}

interface Exercise {
  id: string;
  name: string;
  description?: string;
  instructions?: string;
  youtube_video_url?: string;
}

const WorkoutManager = ({ trainerId }: { trainerId: string }) => {
  const [workouts, setWorkouts] = useState<WorkoutPlan[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutPlan | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    student_id: "",
    duration_weeks: 4,
    frequency_per_week: 3
  });
  const { toast } = useToast();

  useEffect(() => {
    loadWorkouts();
    loadStudents();
    loadExercises();
  }, [trainerId]);

  const loadWorkouts = async () => {
    try {
      console.log("Loading workouts for trainer:", trainerId);
      
      const { data, error } = await supabase
        .from("workout_plans")
        .select(`
          *,
          students(name),
          workout_sessions(
            *,
            workout_exercises(
              *,
              exercises(name, instructions)
            )
          )
        `)
        .eq("personal_trainer_id", trainerId)
        .order("created_at", { ascending: false });

      if (!error && data) {
        console.log("Workouts loaded:", data.length);
        // Transform the data to include rest_minutes for display
        const transformedData = data.map(workout => ({
          ...workout,
        }));
        setWorkouts(transformedData);
      } else {
        console.error("Error loading workouts:", error);
        setWorkouts([]);
      }
    } catch (error) {
      console.error("Error loading workouts:", error);
      setWorkouts([]);
    }
  };

  const loadStudents = async () => {
    try {
      const { data, error } = await supabase
        .from("students")
        .select("id, name")
        .eq("personal_trainer_id", trainerId)
        .eq("active", true);

      if (!error && data) {
        setStudents(data);
      }
    } catch (error) {
      console.error("Error loading students:", error);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

   if (!formData.student_id) {
     toast({
       title: "Erro",
       description: "Selecione um aluno para o treino.",
       variant: "destructive",
     });
     return;
   }
    try {
      const workoutData = {
        ...formData,
        personal_trainer_id: trainerId,
        active: true
      };

      if (selectedWorkout) {
        const { error } = await supabase
          .from("workout_plans")
          .update(workoutData)
          .eq("id", selectedWorkout.id);

        if (!error) {
          toast({
            title: "Treino atualizado",
            description: "Plano de treino atualizado com sucesso.",
          });
        }
      } else {
        const { error } = await supabase
          .from("workout_plans")
          .insert([workoutData]);

        if (!error) {
          toast({
            title: "Treino criado",
            description: "Novo plano de treino criado com sucesso.",
          });
        }
      }

      setIsDialogOpen(false);
      resetForm();
      loadWorkouts();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar plano de treino.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (workout: WorkoutPlan) => {
    setSelectedWorkout(workout);
    setFormData({
      name: workout.name,
      description: workout.description || "",
      student_id: workout.student_id,
      duration_weeks: workout.duration_weeks,
      frequency_per_week: workout.frequency_per_week
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (workoutId: string) => {
    if (confirm("Tem certeza que deseja excluir este plano de treino?")) {
      try {
        const { error } = await supabase
          .from("workout_plans")
          .delete()
          .eq("id", workoutId);

        if (!error) {
          toast({
            title: "Treino excluído",
            description: "Plano de treino excluído com sucesso.",
          });
          loadWorkouts();
        }
      } catch (error) {
        toast({
          title: "Erro",
          description: "Erro ao excluir plano de treino.",
          variant: "destructive",
        });
      }
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
        loadWorkouts();
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar status do treino.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setSelectedWorkout(null);
    setFormData({
      name: "",
      description: "",
      student_id: "",
      duration_weeks: 4,
      frequency_per_week: 3
    });
  };

  const getDayName = (dayIndex: number) => {
    const days = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
    return days[dayIndex] || "Desconhecido";
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Gerenciar Treinos</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Treino
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {selectedWorkout ? "Editar Treino" : "Criar Novo Treino"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Treino</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Treino Full Body"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="student_id">Aluno</Label>
                  <Select
                    value={formData.student_id}
                    onValueChange={(value) => setFormData({ ...formData, student_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um aluno" />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map((student) => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                 required
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição do plano de treino..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration_weeks">Duração (semanas)</Label>
                  <Input
                    id="duration_weeks"
                    type="number"
                    min="1"
                    value={formData.duration_weeks}
                    onChange={(e) => setFormData({ ...formData, duration_weeks: parseInt(e.target.value) })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="frequency_per_week">Frequência por semana</Label>
                  <Input
                    id="frequency_per_week"
                    type="number"
                    min="1"
                    max="7"
                    value={formData.frequency_per_week}
                    onChange={(e) => setFormData({ ...formData, frequency_per_week: parseInt(e.target.value) })}
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {selectedWorkout ? "Atualizar" : "Criar"} Treino
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {workouts.map((workout) => (
          <Card key={workout.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Dumbbell className="h-5 w-5" />
                    {workout.name}
                    <Badge variant={workout.active ? "default" : "secondary"}>
                      {workout.active ? "Ativo" : "Inativo"}
                    </Badge>
                  </CardTitle>
                  {workout.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {workout.description}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleWorkoutStatus(workout.id, workout.active)}
                  >
                    {workout.active ? "Desativar" : "Ativar"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleEdit(workout)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(workout.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <strong>Aluno:</strong> {workout.student?.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <strong>Duração:</strong> {workout.duration_weeks} semanas
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <strong>Frequência:</strong> {workout.frequency_per_week}x por semana
                  </span>
                </div>
              </div>

              {workout.workout_sessions && workout.workout_sessions.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-semibold mb-2">Sessões de Treino:</h4>
                  <div className="grid gap-2">
                    {workout.workout_sessions.map((session) => (
                      <div key={session.id} className="border rounded p-3">
                        <div className="flex justify-between items-center mb-2">
                          <h5 className="font-medium">{session.name}</h5>
                          <Badge variant="outline">
                            {getDayName(session.day_of_week)}
                          </Badge>
                        </div>
                        {session.description && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {session.description}
                          </p>
                        )}
                        <div className="flex items-center justify-between">
                          {session.workout_exercises && session.workout_exercises.length > 0 && (
                            <div className="text-sm flex-1">
                              <strong>Exercícios ({session.workout_exercises.length}):</strong>
                              <ul className="list-disc list-inside ml-2">
                                {session.workout_exercises.slice(0, 3).map((exercise) => (
                                  <li key={exercise.id}>
                                    {exercise.exercise?.name} - {exercise.sets} séries
                                  </li>
                                ))}
                                {session.workout_exercises.length > 3 && (
                                  <li className="text-muted-foreground">
                                    ... e mais {session.workout_exercises.length - 3} exercícios
                                  </li>
                                )}
                              </ul>
                            </div>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingSession({
                              id: session.id,
                              name: session.name,
                              day_of_week: session.day_of_week,
                              workout_plan_id: workout.id,
                              exercises: []
                            })}
                          >
                            <Settings className="h-4 w-4 mr-1" />
                            Editar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {workouts.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Dumbbell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Nenhum plano de treino encontrado. Crie o primeiro treino para seus alunos.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Edit Session Dialog */}
      {editingSession && (
        <EditWorkoutSession
          session={editingSession}
          isOpen={!!editingSession}
          onClose={() => setEditingSession(null)}
          onSuccess={() => {
            setEditingSession(null);
            loadWorkouts();
          }}
        />
      )}
    </div>
  );
};

export default WorkoutManager;