import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Dumbbell,
  LogOut,
  Plus,
  Activity,
  Target,
  Calendar,
  TrendingUp,
  User,
  Settings,
  X, // Importado para o botão de fechar
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { StudentList } from "@/components/StudentList";
import CreateStudent from "@/components/CreateStudent";
import StudentTestCreator from "@/components/StudentTestCreator";
import StudentProfile from "@/components/StudentProfile";
import QuickWorkoutCreator from "@/components/QuickWorkoutCreator";
import QuickDietCreator from "@/components/QuickDietCreator";
import WorkoutManager from "@/components/WorkoutManager";
import DietManager from "@/components/DietManager";
import ReportsManager from "@/components/ReportsManager";
import ExerciseManager from "@/components/ExerciseManager";
import EditTrainerProfile from "@/components/EditTrainerProfile";
import Footer from "@/components/Footer";

interface PersonalTrainer {
  id: string;
  name: string;
  cpf: string;
  email?: string;
  phone?: string;
  cref?: string;
  specializations?: string[];
}

interface DashboardStats {
  totalStudents: number;
  activeWorkouts: number;
  activeDiets: number;
  completedExercisesToday: number;
}

interface Student {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  birth_date?: string;
  weight?: number;
  height?: number;
  goals?: string[];
  unique_link_token: string;
  created_at: string;
  workoutPlans?: any[];
  dietPlans?: any[];
}

const Dashboard = () => {
  const [trainer, setTrainer] = useState<PersonalTrainer | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    activeWorkouts: 0,
    activeDiets: 0,
    completedExercisesToday: 0,
  });
  const [showCreateStudent, setShowCreateStudent] = useState(false);
  const [showTestCreator, setShowTestCreator] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showStudentProfile, setShowStudentProfile] = useState(false);
  const [showQuickWorkout, setShowQuickWorkout] = useState(false);
  const [showQuickDiet, setShowQuickDiet] = useState(false);
  const [workoutStudent, setWorkoutStudent] = useState<Student | null>(null);
  const [dietStudent, setDietStudent] = useState<Student | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const trainerData = localStorage.getItem("trainer");
    if (!trainerData) {
      navigate("/login");
      return;
    }

    const parsedTrainer = JSON.parse(trainerData);
    setTrainer(parsedTrainer);
    loadDataWithRetry(parsedTrainer.id);
  }, [navigate]);

  const loadDataWithRetry = async (trainerId: string, retries = 3) => {
    for (let i = 0; i < retries; i++) {
      try {
        await loadData(trainerId);
        break;
      } catch (error) {
        console.error(`Data loading attempt ${i + 1} failed:`, error);
        if (i === retries - 1) {
          toast({
            title: "Aviso",
            description: "Não foi possível carregar algumas informações.",
            variant: "destructive",
          });
        } else {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    }
  };

  const loadData = async (trainerId: string) => {
    try {
      const { data: studentsData, error: studentsError } = await supabase
        .from("students")
        .select(`
          *,
          workout_plans(
            id,
            name,
            active,
            workout_sessions(id)
          ),
          diet_plans(
            id,
            name,
            active
          )
        `)
        .eq("personal_trainer_id", trainerId)
        .eq("active", true);

      if (studentsError) {
        console.error("Students error:", studentsError);
        throw studentsError;
      }

      const students = studentsData || [];

      const activeWorkouts = students.reduce((count, student) => {
        return count + (student.workout_plans?.filter(p => p.active).length || 0);
      }, 0);
      
      const activeDiets = students.reduce((count, student) => {
        return count + (student.diet_plans?.filter(p => p.active).length || 0);
      }, 0);

      const today = new Date().toISOString().split("T")[0];
      const { data: completionsData, error: completionsError } = await supabase
        .from("exercise_completions")
        .select("id")
        .in("student_id", students.map((s) => s.id))
        .gte("completed_at", `${today}T00:00:00`)
        .lt("completed_at", `${today}T23:59:59`);

      if (completionsError) {
        console.error("Completions error:", completionsError);
      }

      const completions = completionsData || [];

      const newStats = {
        totalStudents: students.length,
        activeWorkouts: activeWorkouts,
        activeDiets: activeDiets,
        completedExercisesToday: completions.length,
      };

      setStudents(students as Student[]);
      setStats(newStats);
      console.log("Data loaded successfully:", { students, stats: newStats });
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados.",
        variant: "destructive",
      });
      setStudents([]);
      setStats({ totalStudents: 0, activeWorkouts: 0, activeDiets: 0, completedExercisesToday: 0 });
    }
  };

  const handleLogout = () => {
    supabase.auth.signOut();
    localStorage.removeItem("trainer");
    toast({
      title: "Logout realizado",
      description: "Você foi desconectado com sucesso.",
    });
    navigate("/login");
  };

  const handleStudentSelect = (student: Student) => {
    setSelectedStudent(student);
    setShowStudentProfile(true);
  };

  const handleCreateWorkout = (student: Student) => {
    setWorkoutStudent(student);
    setShowQuickWorkout(true);
  };

  const handleCreateDiet = (student: Student) => {
    setDietStudent(student);
    setShowQuickDiet(true);
  };

  const closeStudentProfile = () => {
    setSelectedStudent(null);
    setShowStudentProfile(false);
  };

  const closeQuickWorkout = () => {
    setWorkoutStudent(null);
    setShowQuickWorkout(false);
  };

  const closeQuickDiet = () => {
    setDietStudent(null);
    setShowQuickDiet(false);
  };

  const handleWorkoutSuccess = () => {
    closeQuickWorkout();
    loadData(trainer.id);
    toast({
      title: "Sucesso!",
      description: "Treino criado com sucesso!",
    });
  };

  const handleDietSuccess = () => {
    closeQuickDiet();
    loadData(trainer.id);
    toast({
      title: "Sucesso!",
      description: "Dieta criada com sucesso!",
    });
  };

  if (!trainer) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="max-w-screen-2xl mx-auto px-4 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-primary to-primary/80 p-2 rounded-xl">
                <Dumbbell className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                  FitTrainer-Pro
                </h1>
                <p className="text-sm text-muted-foreground">
                  Bem-vindo, {trainer.name}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowEditProfile(true)}
                className="hover-scale"
              >
                <Settings className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Meu Perfil</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="hover-scale"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-screen-2xl mx-auto px-4 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 lg:mb-8">
          <Card className="hover-scale transition-all duration-300 border-0 bg-gradient-to-br from-primary/5 to-primary/10 hover:shadow-lg">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg sm:text-xl lg:text-3xl font-bold text-primary">
                    {stats.totalStudents}
                  </p>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                    Alunos Ativos
                  </p>
                </div>
                <div className="bg-primary/10 p-2 sm:p-3 rounded-xl flex-shrink-0">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-scale transition-all duration-300 border-0 bg-gradient-to-br from-green-600/5 to-green-600/10 hover:shadow-lg">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg sm:text-xl lg:text-3xl font-bold text-green-600">
                    {stats.activeWorkouts}
                  </p>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                    Treinos Ativos
                  </p>
                </div>
                <div className="bg-green-600/10 p-2 sm:p-3 rounded-xl flex-shrink-0">
                  <Dumbbell className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-scale transition-all duration-300 border-0 bg-gradient-to-br from-purple-600/5 to-purple-600/10 hover:shadow-lg">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg sm:text-xl lg:text-3xl font-bold text-purple-600">
                    {stats.activeDiets}
                  </p>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                    Dietas Ativas
                  </p>
                </div>
                <div className="bg-purple-600/10 p-2 sm:p-3 rounded-xl flex-shrink-0">
                  <Target className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-scale transition-all duration-300 border-0 bg-gradient-to-br from-warning/5 to-warning/10 hover:shadow-lg">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg sm:text-xl lg:text-3xl font-bold text-warning">
                    {stats.completedExercisesToday}
                  </p>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                    Exercícios Hoje
                  </p>
                </div>
                <div className="bg-warning/10 p-2 sm:p-3 rounded-xl flex-shrink-0">
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            <Tabs defaultValue="students" className="w-full">
              <div className="border-b px-3 sm:px-4 lg:px-6 pt-3 lg:pt-6">
                <TabsList className="grid grid-cols-2 lg:grid-cols-5 w-full bg-muted/50 h-auto mb-4">
                  <TabsTrigger
                    value="students"
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-3 px-2"
                  >
                    <Users className="h-4 w-4 mr-1 sm:mr-2" />
                    <span>Alunos</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="exercises"
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-3 px-2"
                  >
                    <Activity className="h-4 w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Exercícios</span>
                    <span className="sm:hidden">Exerc</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="workouts"
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-3 px-2 hidden lg:flex"
                  >
                    <Dumbbell className="h-4 w-4 mr-1 sm:mr-2" />
                    <span>Treinos</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="diets"
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-3 px-2 hidden lg:flex"
                  >
                    <Target className="h-4 w-4 mr-1 sm:mr-2" />
                    <span>Dietas</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="reports"
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-3 px-2 hidden lg:flex"
                  >
                    <TrendingUp className="h-4 w-4 mr-1 sm:mr-2" />
                    <span>Relatórios</span>
                  </TabsTrigger>
                </TabsList>

                {/* Mobile secondary tabs */}
                <div className="lg:hidden">
                  <TabsList className="grid grid-cols-3 w-full bg-muted/50 h-auto mb-4">
                    <TabsTrigger
                      value="workouts"
                      className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-3 px-2"
                    >
                      <Dumbbell className="h-4 w-4 mr-1 sm:mr-2" />
                      Treinos
                    </TabsTrigger>
                    <TabsTrigger
                      value="diets"
                      className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-3 px-2"
                    >
                      <Target className="h-4 w-4 mr-1 sm:mr-2" />
                      Dietas
                    </TabsTrigger>
                    <TabsTrigger
                      value="reports"
                      className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-3 px-2"
                    >
                      <TrendingUp className="h-4 w-4 mr-1 sm:mr-2" />
                      Relatórios
                    </TabsTrigger>
                  </TabsList>
                </div>
              </div>

              <div className="p-3 sm:p-4 lg:p-6">
                <TabsContent value="students" className="mt-0 space-y-6">
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div>
                      <h2 className="text-2xl font-bold">Gerenciar Alunos</h2>
                      <p className="text-muted-foreground">
                        Cadastre e acompanhe seus alunos
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                      <Button
                        onClick={() => setShowTestCreator(true)}
                        variant="outline"
                        className="hover-scale w-full sm:w-auto touch-target"
                      >
                        Teste Debug
                      </Button>
                      <Button
                        onClick={() => setShowCreateStudent(true)}
                        className="hover-scale w-full sm:w-auto bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary touch-target"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Novo Aluno
                      </Button>
                    </div>
                  </div>

                  <div className="animate-fade-in">
                    {showCreateStudent ? (
                      <CreateStudent
                        trainerId={trainer.id}
                        onClose={() => setShowCreateStudent(false)}
                        onSuccess={() => {
                          setShowCreateStudent(false);
                          loadData(trainer.id);
                        }}
                      />
                    ) : showTestCreator ? (
                      <StudentTestCreator
                        trainerId={trainer.id}
                        onClose={() => setShowTestCreator(false)}
                        onSuccess={() => {
                          setShowTestCreator(false);
                          loadData(trainer.id);
                        }}
                      />
                    ) : (
                      <StudentList
                        personalTrainerId={trainer.id}
                        students={students}
                        onStudentSelect={handleStudentSelect}
                        onCreateWorkout={handleCreateWorkout}
                        onCreateDiet={handleCreateDiet}
                        onCreateStudent={() => setShowCreateStudent(true)}
                      />
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="exercises" className="mt-0 animate-fade-in">
                  <ExerciseManager trainerId={trainer.id} />
                </TabsContent>

                <TabsContent value="workouts" className="mt-0 animate-fade-in">
                  <WorkoutManager trainerId={trainer.id} />
                </TabsContent>

                <TabsContent value="diets" className="mt-0 animate-fade-in">
                  <DietManager trainerId={trainer.id} />
                </TabsContent>

                <TabsContent value="reports" className="mt-0 animate-fade-in">
                  <ReportsManager trainerId={trainer.id} />
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </main>

      {/* Edit Profile Modal */}
      {showEditProfile && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50 animate-fade-in overflow-y-auto">
          <div className="max-w-2xl w-full max-h-[95vh] overflow-y-auto animate-scale-in mobile-scroll my-auto">
            <EditTrainerProfile
              trainer={trainer}
              onClose={() => setShowEditProfile(false)}
              onSuccess={(updatedTrainer) => {
                setTrainer(updatedTrainer);
                setShowEditProfile(false);
              }}
            />
          </div>
        </div>
      )}

      {/* Student Profile Modal */}
      {showStudentProfile && selectedStudent && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50 animate-fade-in overflow-y-auto">
          <div className="max-w-4xl w-full max-h-[95vh] overflow-y-auto animate-scale-in mobile-scroll my-auto">
            <StudentProfile
              student={selectedStudent}
              trainerId={trainer.id}
              onClose={closeStudentProfile}
            />
          </div>
        </div>
      )}

      {/* Quick Workout Creator Modal */}
      {showQuickWorkout && workoutStudent && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50 animate-fade-in overflow-y-auto">
          <div className="max-w-6xl w-full max-h-[95vh] overflow-y-auto animate-scale-in mobile-scroll my-auto">
            <Card className="shadow-2xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Dumbbell className="h-5 w-5" />
                    Criar Treino para {workoutStudent.name}
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={closeQuickWorkout}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <QuickWorkoutCreator
                  studentId={workoutStudent.id}
                  studentName={workoutStudent.name}
                  trainerId={trainer.id}
                  onClose={closeQuickWorkout}
                  onSuccess={handleWorkoutSuccess}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Quick Diet Creator Modal */}
      {showQuickDiet && dietStudent && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50 animate-fade-in overflow-y-auto">
          <div className="max-w-6xl w-full max-h-[95vh] overflow-y-auto animate-scale-in mobile-scroll my-auto">
            <Card className="shadow-2xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Criar Dieta para {dietStudent.name}
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={closeQuickDiet}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <QuickDietCreator
                  studentId={dietStudent.id}
                  studentName={dietStudent.name}
                  trainerId={trainer.id}
                  onClose={closeQuickDiet}
                  onSuccess={handleDietSuccess}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
};

export default Dashboard;
