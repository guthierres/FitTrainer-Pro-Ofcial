import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dumbbell,
  CheckCircle,
  Clock,
  Target,
  User,
  Download,
  ArrowLeft,
  Printer,
  Calendar,
  Apple,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Student {
  id: string;
  name: string;
  unique_link_token: string;
  personal_trainer_id: string;
}

interface WorkoutExercise {
  id: string;
  exercise: {
    name: string;
    category: {
      name: string;
      emoji: string;
    };
    muscle_groups: string[];
    equipment: string[];
    instructions: string; // Adicionado para exibir as instruções
  };
  sets: number;
  reps_min?: number;
  reps_max?: number;
  weight_kg?: number;
  rest_seconds?: number;
  notes?: string;
  isCompleted?: boolean;
}

interface WorkoutSession {
  id: string;
  name: string;
  description?: string;
  day_of_week: number;
  workout_exercises: WorkoutExercise[];
}

interface WorkoutPlan {
  id: string;
  name: string;
  description?: string;
  workout_sessions: WorkoutSession[];
  personal_trainer: {
    name: string;
    cref?: string;
  };
}

const StudentWorkout = () => {
  const { token } = useParams<{ token: string }>();
  const [student, setStudent] = useState<Student | null>(null);
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlan | null>(null);
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDay());
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const daysOfWeek = [
    "Domingo",
    "Segunda",
    "Terça",
    "Quarta",
    "Quinta",
    "Sexta",
    "Sábado",
  ];

  useEffect(() => {
    if (token) {
      loadStudentData();
    }
  }, [token]);

  const loadStudentData = async () => {
    try {
      setIsLoading(true);
      
      console.log("Loading student data for token:", token);
      
      // Set student context for RLS policies
      if (token) {
        const { error: contextError } = await supabase.rpc('set_student_context', {
          student_token: token
        });
        
        if (contextError) {
          console.warn("Could not set student context:", contextError);
        }
      }

      // Busca o aluno pelo token
      const { data: studentData, error: studentError } = await supabase
        .from("students")
        .select("*")
        .eq("unique_link_token", token)
        .eq("active", true)
        .single();

      console.log("Student query result:", { studentData, studentError });

      if (studentError || !studentData) {
        console.error("Student not found:", studentError);
        toast({
          title: "Erro",
          description: "Link inválido ou expirado.",
          variant: "destructive",
        });
        return;
      }

      console.log("Student found:", studentData);
      setStudent(studentData);

      // Busca o plano de treino ativo com as sessões e exercícios
      const { data: workoutData, error: workoutError } = await supabase
        .from("workout_plans")
        .select(
          `
            id,
            name,
            description,
            personal_trainer:personal_trainers(name, cref),
            workout_sessions(
              id,
              name,
              description,
              day_of_week,
              workout_exercises(
                id,
                sets,
                reps_min,
                reps_max,
                weight_kg,
                rest_seconds,
                notes,
                order_index,
                exercise:exercises(
                  name,
                  muscle_groups,
                  equipment,
                  instructions,
                  category:exercise_categories(name, emoji)
                )
              )
            )
          `
        )
        .eq("student_id", studentData.id)
        .eq("active", true)
        .maybeSingle();

      console.log("Workout query result:", { workoutData, workoutError });

      if (workoutError || !workoutData) {
        console.log("No active workout found for student:", studentData.id, workoutError);
        toast({
          title: "Aviso",
          description: "Nenhum treino ativo encontrado. Entre em contato com seu personal trainer.",
        });
        setWorkoutPlan(null);
        return;
      }

      console.log("Workout plan found:", workoutData);

      // Verifica os exercícios concluídos para hoje
      const today = new Date().toISOString().split("T")[0];
      const { data: completions } = await supabase
        .from("exercise_completions")
        .select("workout_exercise_id")
        .eq("student_id", studentData.id)
        .gte("completed_at", `${today}T00:00:00`)
        .lt("completed_at", `${today}T23:59:59`);

      const completedExerciseIds = new Set(
        completions?.map((c) => c.workout_exercise_id) || []
      );

      // Marca os exercícios como concluídos
      workoutData.workout_sessions.forEach((session: any) => {
        session.workout_exercises.forEach((exercise: any) => {
          exercise.isCompleted = completedExerciseIds.has(exercise.id);
        });
      });

      setWorkoutPlan(workoutData as any);
    } catch (error) {
      console.error("Error loading student data:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do treino.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const markExerciseAsCompleted = async (exerciseId: string) => {
    if (!student) return;

    try {
      const { error } = await supabase.from("exercise_completions").insert({
        workout_exercise_id: exerciseId,
        student_id: student.id,
      });

      if (error) {
        toast({
          title: "Erro",
          description: "Não foi possível marcar o exercício como realizado.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Parabéns! 🎉",
        description: "Exercício marcado como realizado!",
      });

      loadStudentData();
    } catch (error) {
      console.error("Error marking exercise as completed:", error);
    }
  };

  const exportWorkout = () => {
    if (!workoutPlan || !student) return;

    const currentSession = workoutPlan.workout_sessions.find((s) => s.day_of_week === selectedDay);

    if (!currentSession) {
      toast({
        title: "Erro",
        description: "Nenhum treino encontrado para este dia.",
        variant: "destructive",
      });
      return;
    }

    // Cria o conteúdo HTML para o download
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Treino - ${student.name}</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
          .exercise { border: 1px solid #ddd; margin: 15px 0; padding: 15px; border-radius: 8px; background: #f9f9f9; }
          .exercise-header { font-weight: bold; font-size: 18px; color: #333; margin-bottom: 10px; }
          .exercise-details { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin: 10px 0; }
          .detail-item { background: white; padding: 8px; border-radius: 4px; border-left: 3px solid #0ea5e9; }
          .status-completed { color: #16a34a; font-weight: bold; }
          .status-pending { color: #ea580c; font-weight: bold; }
          .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; }
          @media print { body { margin: 0; padding: 15px; } .exercise { break-inside: avoid; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>COMPROVANTE DE TREINO</h1>
          <h2>${workoutPlan.name}</h2>
          <p><strong>Personal Trainer:</strong> ${workoutPlan.personal_trainer.name}</p>
          ${workoutPlan.personal_trainer.cref ? `<p><strong>CREF:</strong> ${workoutPlan.personal_trainer.cref}</p>` : ""}
          <p><strong>Aluno:</strong> ${student.name}</p>
          <p><strong>Treino:</strong> ${currentSession.name} (${daysOfWeek[selectedDay]})</p>
          <p><strong>Data:</strong> ${new Date().toLocaleDateString("pt-BR")}</p>
        </div>
        
        <div class="exercises">
          ${currentSession.workout_exercises
            .map(
              (exercise, index) => `
            <div class="exercise">
              <div class="exercise-header">
                ${index + 1}. ${exercise.exercise.name}
                <span style="float: right;" class="${
                  exercise.isCompleted ? "status-completed" : "status-pending"
                }">
                  ${exercise.isCompleted ? "✅ REALIZADO" : "⏳ PENDENTE"}
                </span>
              </div>
              <p><strong>Categoria:</strong> ${exercise.exercise.category.emoji} ${
                exercise.exercise.category.name
              }</p>
              
              <div class="exercise-details">
                <div class="detail-item">
                  <strong>Séries:</strong> ${exercise.sets}
                </div>
                ${
                  exercise.reps_min && exercise.reps_max
                    ? `
                  <div class="detail-item">
                    <strong>Repetições:</strong> ${exercise.reps_min}-${exercise.reps_max}
                  </div>
                `
                    : exercise.reps_min
                    ? `
                  <div class="detail-item">
                    <strong>Repetições:</strong> ${exercise.reps_min}
                  </div>
                `
                    : ""
                }
                ${
                  exercise.weight_kg
                    ? `
                  <div class="detail-item">
                    <strong>Peso:</strong> ${exercise.weight_kg}kg
                  </div>
                `
                    : ""
                }
                ${
                  exercise.rest_seconds
                    ? `
                  <div class="detail-item">
                    <strong>Descanso:</strong> ${exercise.rest_seconds}s
                  </div>
                `
                    : ""
                }
              </div>
              
              ${exercise.notes ? `<p><strong>Observações:</strong> ${exercise.notes}</p>` : ""}
              ${
                exercise.exercise.muscle_groups?.length > 0
                  ? `
                <p><strong>Músculos:</strong> ${exercise.exercise.muscle_groups.join(", ")}</p>
              `
                  : ""
              }
            </div>
          `
            ).join("")}
        </div>
        
        <div class="footer">
          <p><strong>Sistema:</strong> FitTrainer-Pro</p>
          <p><strong>Link do aluno:</strong> ${window.location.origin}/student/${token}</p>
          <p><strong>Token:</strong> ${student.unique_link_token}</p>
          <p><strong>Gerado em:</strong> ${new Date().toLocaleString("pt-BR")}</p>
        </div>
      </body>
      </html>`;

    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `treino-${student.name}-${new Date().toLocaleDateString("pt-BR").replace(/\//g, "-")}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Treino exportado!",
      description: "Arquivo HTML gerado com sucesso.",
    });
  };

  const printThermalWorkout = () => {
    if (!workoutPlan || !student) return;

    const currentSession = workoutPlan.workout_sessions.find((s) => s.day_of_week === selectedDay);

    if (!currentSession) {
      toast({
        title: "Erro",
        description: "Nenhum treino encontrado para este dia.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Criar conteúdo para impressora térmica (80mm)
      const thermalContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Comprovante Treino Térmico - ${student.name}</title>
  <style>
    @page { 
      size: 80mm auto; 
      margin: 0; 
    }
    
    body { 
      width: 80mm; 
      margin: 0; 
      padding: 3mm; 
      font-family: 'Courier New', monospace; 
      font-size: 9px; 
      line-height: 1.3; 
      color: #000; 
      background: white;
    }
    
    .center { text-align: center; }
    .bold { font-weight: bold; }
    .separator { 
      border-top: 1px dashed #000; 
      margin: 3mm 0; 
      width: 100%;
    }
    .small { font-size: 7px; }
    .exercise { 
      margin: 2mm 0; 
      padding: 1mm 0;
      border-bottom: 1px dotted #ccc;
    }
    .exercise-header { 
      font-weight: bold; 
      font-size: 10px; 
      margin-bottom: 1mm;
    }
    .exercise-details { 
      margin: 1mm 0; 
      padding-left: 2mm;
    }
    .status-ok { font-weight: bold; }
    .status-pending { color: #666; }
    .header-box {
      border: 2px solid #000;
      padding: 2mm;
      margin-bottom: 3mm;
    }
    .footer-box {
      border: 1px solid #000;
      padding: 2mm;
      margin-top: 3mm;
      background: #f5f5f5;
    }
  </style>
</head>
<body>
  <div class="header-box center">
    <div class="bold" style="font-size: 12px;">FITTRAINER-PRO</div>
    <div class="bold" style="font-size: 10px;">COMPROVANTE DE TREINO</div>
    <div class="separator"></div>
    <div class="small">Data: ${new Date().toLocaleDateString("pt-BR")}</div>
    <div class="small">Hora: ${new Date().toLocaleTimeString("pt-BR")}</div>
  </div>
  
  <div class="bold">PERSONAL TRAINER:</div>
  <div>${workoutPlan.personal_trainer.name}</div>
  ${workoutPlan.personal_trainer.cref ? `<div class="small">CREF: ${workoutPlan.personal_trainer.cref}</div>` : ""}
  
  <div class="separator"></div>
  
  <div class="bold">DADOS DO ALUNO:</div>
  <div>Nome: ${student.name}</div>
  <div class="small">ID: ${student.unique_link_token.substring(0, 8)}...</div>
  
  <div class="separator"></div>
  
  <div class="bold">TREINO DO DIA:</div>
  <div>${currentSession.name}</div>
  <div class="small">Dia da semana: ${daysOfWeek[selectedDay]}</div>
  <div class="small">Total de exercícios: ${currentSession.workout_exercises.length}</div>
  
  <div class="separator"></div>
  
  <div class="bold center">EXERCÍCIOS:</div>
  
  ${currentSession.workout_exercises
    .map((exercise, index) => `
    <div class="exercise">
      <div class="exercise-header">
        ${index + 1}. ${exercise.exercise.name}
      </div>
      <div class="small">${exercise.exercise.category.emoji} ${exercise.exercise.category.name}</div>
      
      <div class="exercise-details">
        <div>• Séries: ${exercise.sets}</div>
        ${exercise.reps_min && exercise.reps_max 
          ? `<div>• Repetições: ${exercise.reps_min}-${exercise.reps_max}</div>`
          : exercise.reps_min 
          ? `<div>• Repetições: ${exercise.reps_min}</div>`
          : ""
        }
        ${exercise.weight_kg ? `<div>• Peso: ${exercise.weight_kg}kg</div>` : ""}
        ${exercise.rest_seconds ? `<div>• Descanso: ${Math.round(exercise.rest_seconds/60)}min</div>` : ""}
        
        <div class="small ${exercise.isCompleted ? 'status-ok' : 'status-pending'}">
          Status: ${exercise.isCompleted ? '[✓] REALIZADO' : '[ ] PENDENTE'}
        </div>
        
        ${exercise.notes ? `<div class="small">Obs: ${exercise.notes}</div>` : ""}
        
        ${exercise.exercise.muscle_groups?.length > 0 
          ? `<div class="small">Músculos: ${exercise.exercise.muscle_groups.slice(0, 3).join(", ")}</div>`
          : ""
        }
        
        ${exercise.exercise.instructions 
          ? `<div class="small">Execução: ${exercise.exercise.instructions.substring(0, 80)}...</div>`
          : ""
        }
      </div>
    </div>
  `).join("")}
  
  <div class="separator"></div>
  
  <div class="footer-box">
    <div class="center bold">INFORMAÇÕES DO SISTEMA</div>
    <div class="small">Sistema: FitTrainer-Pro v1.0</div>
    <div class="small">Link: ${window.location.origin}/student/${token}</div>
    <div class="small">Token: ${student.unique_link_token}</div>
    <div class="small">Gerado: ${new Date().toLocaleString("pt-BR")}</div>
  </div>
  
  <div class="center small" style="margin-top: 3mm;">
    ================================<br>
    Assinatura do Personal Trainer<br>
    <br>
    _______________________________<br>
    ${workoutPlan.personal_trainer.name}<br>
    ${workoutPlan.personal_trainer.cref || 'Personal Trainer'}
  </div>
  
  <script>
    window.onload = function() {
      setTimeout(() => {
        window.print();
      }, 500);
    }
    
    window.onafterprint = function() {
      setTimeout(() => {
        window.close();
      }, 1000);
    }
  </script>
</body>
</html>`;

      const printWindow = window.open("", "_blank", "width=400,height=600");
      if (printWindow) {
        printWindow.document.write(thermalContent);
        printWindow.document.close();
        
        toast({
          title: "Imprimindo...",
          description: "Enviando para impressora térmica.",
        });
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível abrir a janela de impressão. Verifique se pop-ups estão permitidos.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error printing:", error);
      toast({
        title: "Erro",
        description: "Erro ao preparar impressão.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Dumbbell className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
          <p>Carregando seu treino...</p>
        </div>
      </div>
    );
  }

  if (!student || !workoutPlan) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/30">
        <Card className="max-w-md mx-4 shadow-lg">
          <CardContent className="text-center p-8 space-y-4">
            <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
              <Dumbbell className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Treino não encontrado</h3>
              <p className="text-muted-foreground text-sm">
                Nenhum treino ativo foi encontrado para este link ou o link pode
                estar inválido.
              </p>
            </div>
            <div className="flex flex-col gap-2 pt-4">
              <Button
                onClick={() => window.history.back()}
                variant="default"
                className="w-full"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <Button
                onClick={() => (window.location.href = "/")}
                variant="outline"
                className="w-full"
              >
                Ir para Início
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentSession = workoutPlan.workout_sessions.find(
    (s) => s.day_of_week === selectedDay
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Button
                onClick={() => window.history.back()}
                variant="ghost"
                size="sm"
                className="flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
              <div className="p-2 bg-primary/10 rounded-full flex-shrink-0">
                <Dumbbell className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-primary">
                  FitTrainer-Pro
                </h1>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span className="truncate">{student.name}</span>
                  <Calendar className="h-4 w-4 ml-2" />
                  <span className="hidden sm:inline">
                    {new Date().toLocaleDateString("pt-BR")}
                  </span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 w-full sm:w-auto">
              <Button
                onClick={() => (window.location.href = `/student/${token}/diet`)}
                variant="secondary"
                size="sm"
                className="text-xs sm:text-sm h-9 sm:h-10"
              >
                <Apple className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Dieta</span>
                <span className="sm:hidden">Diet</span>
              </Button>
              <Button
                onClick={exportWorkout}
                variant="outline"
                size="sm"
                className="text-xs sm:text-sm h-9 sm:h-10"
              >
                <Download className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Export</span>
                <span className="sm:hidden">Exp</span>
              </Button>
              <Button
                onClick={printThermalWorkout}
                variant="default"
                size="sm"
                className="text-xs sm:text-sm h-9 sm:h-10"
              >
                <Printer className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Print</span>
                <span className="sm:hidden">Prt</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-3 lg:px-4 py-4 lg:py-6">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              {workoutPlan.name}
            </CardTitle>
            {workoutPlan.description && (
              <p className="text-muted-foreground">{workoutPlan.description}</p>
            )}
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Personal Trainer:{" "}
              <strong>{workoutPlan.personal_trainer.name}</strong>
              {workoutPlan.personal_trainer.cref && (
                <span> - CREF: {workoutPlan.personal_trainer.cref}</span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">
              Selecionar Dia da Semana
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
              {daysOfWeek.map((day, index) => {
                const hasWorkout = workoutPlan.workout_sessions.some(
                  (s) => s.day_of_week === index
                );
                return (
                  <Button
                    key={index}
                    variant={selectedDay === index ? "default" : "outline"}
                    onClick={() => setSelectedDay(index)}
                    disabled={!hasWorkout}
                    className="h-10 sm:h-12 text-xs sm:text-sm font-medium"
                  >
                    <span className="sm:hidden">{day.slice(0, 3)}</span>
                    <span className="hidden sm:inline lg:hidden">
                      {day.slice(0, 5)}
                    </span>
                    <span className="hidden lg:inline">{day}</span>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {currentSession ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Dumbbell className="h-5 w-5 text-secondary" />
                {currentSession.name}
              </CardTitle>
              {currentSession.description && (
                <p className="text-muted-foreground">
                  {currentSession.description}
                </p>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {currentSession.workout_exercises.map((exercise, index) => (
                <div key={exercise.id} className="space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2 flex-grow">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold">{index + 1}.</span>
                        <h3 className="font-semibold">
                          {exercise.exercise.name}
                        </h3>
                        <Badge variant="secondary">
                          {exercise.exercise.category.emoji}{" "}
                          {exercise.exercise.category.name}
                        </Badge>
                        {exercise.isCompleted && (
                          <Badge className="bg-green-500 text-white hover:bg-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Realizado
                          </Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Séries:</span>
                          <span className="ml-2 font-medium">
                            {exercise.sets}
                          </span>
                        </div>
                        {(exercise.reps_min || exercise.reps_max) && (
                          <div>
                            <span className="text-muted-foreground">Reps:</span>
                            <span className="ml-2 font-medium">
                              {exercise.reps_min && exercise.reps_max
                                ? `${exercise.reps_min}-${exercise.reps_max}`
                                : exercise.reps_min || exercise.reps_max}
                            </span>
                          </div>
                        )}
                        {exercise.weight_kg && (
                          <div>
                            <span className="text-muted-foreground">Peso:</span>
                            <span className="ml-2 font-medium">
                              {exercise.weight_kg}kg
                            </span>
                          </div>
                        )}
                        {exercise.rest_seconds && (
                          <div className="flex items-center">
                            <Clock className="h-3 w-3 text-muted-foreground mr-1" />
                            <span className="text-muted-foreground">
                              Descanso:
                            </span>
                            <span className="ml-2 font-medium">
                              {exercise.rest_seconds}s
                            </span>
                          </div>
                        )}
                      </div>

                      {exercise.exercise.muscle_groups?.length > 0 && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">
                            Músculos:
                          </span>
                          <span className="ml-2">
                            {exercise.exercise.muscle_groups.join(", ")}
                          </span>
                        </div>
                      )}

                      {exercise.notes && (
                        <div className="text-sm pt-1">
                          <span className="text-muted-foreground">
                            Observações:
                          </span>
                          <p className="text-sm ml-2">{exercise.notes}</p>
                        </div>
                      )}

                      {exercise.exercise.instructions && (
                        <div className="text-sm pt-2 border-t">
                          <span className="text-muted-foreground">
                            Como executar:
                          </span>
                          <p className="text-sm ml-2 italic">
                            {exercise.exercise.instructions}
                          </p>
                        </div>
                      )}
                    </div>

                    {!exercise.isCompleted && (
                      <Button
                        onClick={() => markExerciseAsCompleted(exercise.id)}
                        size="sm"
                        className="bg-green-500 hover:bg-green-600 text-white h-9 text-xs sm:text-sm whitespace-nowrap"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">
                          Marcar como Feito
                        </span>
                        <span className="sm:hidden">Feito</span>
                      </Button>
                    )}
                  </div>

                  {index < currentSession.workout_exercises.length - 1 && (
                    <Separator />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-gradient-to-br from-muted/30 to-muted/10 border-dashed">
            <CardContent className="text-center py-12 space-y-4">
              <div className="w-16 h-16 mx-auto bg-muted/50 rounded-full flex items-center justify-center">
                <Dumbbell className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Nenhum treino hoje</h3>
                <p className="text-muted-foreground">
                  Não há treino programado para {daysOfWeek[selectedDay]}.
                </p>
                <p className="text-sm text-muted-foreground">
                  Selecione outro dia da semana ou entre em contato com seu
                  personal trainer.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default StudentWorkout;
