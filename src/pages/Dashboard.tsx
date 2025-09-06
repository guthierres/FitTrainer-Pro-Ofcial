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
  Settings
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import StudentList from "@/components/StudentList";
import CreateStudent from "@/components/CreateStudent";
import StudentTestCreator from "@/components/StudentTestCreator";
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

const Dashboard = () => {
  const [trainer, setTrainer] = useState<PersonalTrainer | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    activeWorkouts: 0,
    activeDiets: 0,
    completedExercisesToday: 0
  });
  const [showCreateStudent, setShowCreateStudent] = useState(false);
  const [showTestCreator, setShowTestCreator] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
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
    loadStatsWithRetry(parsedTrainer.id);
  }, [navigate]);

  const loadStatsWithRetry = async (trainerId: string, retries = 3) => {
    for (let i = 0; i < retries; i++) {
      try {
        await loadStats(trainerId);
        break;
      } catch (error) {
        console.error(`Stats loading attempt ${i + 1} failed:`, error);
        if (i === retries - 1) {
          toast({
            title: "Aviso",
            description: "Não foi possível carregar algumas estatísticas.",
            variant: "destructive",
          });
        } else {
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
  };

  const loadStats = async (trainerId: string) => {
    try {
      // Get total students
      const { data: students, error: studentsError } = await supabase
        .from("students")
        .select("id")
        .eq("personal_trainer_id", trainerId)
        .eq("active", true);

      if (studentsError) {
        console.error("Students error:", studentsError);
        throw studentsError;
      }

      // Get active workout plans
      const { data: workouts, error: workoutsError } = await supabase
        .from("workout_plans")
        .select("id")
        .eq("personal_trainer_id", trainerId)
        .eq("active", true);

      if (workoutsError) {
        console.error("Workouts error:", workoutsError);
        throw workoutsError;
      }

      // Get active diet plans
      const { data: diets, error: dietsError } = await supabase
        .from("diet_plans")
        .select("id")
        .eq("personal_trainer_id", trainerId)
        .eq("active", true);

      if (dietsError) {
        console.error("Diets error:", dietsError);
        throw dietsError;
      }

      // Get today's completed exercises
      const today = new Date().toISOString().split('T')[0];
      const { data: completions, error: completionsError } = await supabase
        .from("exercise_completions")
        .select("id, student_id")
        .in("student_id", students?.map(s => s.id) || [])
        .gte("completed_at", `${today}T00:00:00`)
        .lt("completed_at", `${today}T23:59:59`);

      if (completionsError) {
        console.error("Completions error:", completionsError);
        // Don't throw for completions error, just log it
      }

      const newStats = {
        totalStudents: students?.length || 0,
        activeWorkouts: workouts?.length || 0,
        activeDiets: diets?.length || 0,
        completedExercisesToday: completions?.length || 0
      };

      console.log("Stats loaded successfully:", newStats);
      setStats(newStats);

    } catch (error) {
      console.error("Error loading stats:", error);
      throw error;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("trainer");
    toast({
      title: "Logout realizado",
      description: "Você foi desconectado com sucesso.",
    });
    navigate("/login");
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
                  <p className="text-lg sm:text-xl lg:text-3xl font-bold text-primary">{stats.totalStudents}</p>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Alunos Ativos</p>
                </div>
                <div className="bg-primary/10 p-2 sm:p-3 rounded-xl flex-shrink-0">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover-scale transition-all duration-300 border-0 bg-gradient-to-br from-secondary/5 to-secondary/10 hover:shadow-lg">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg sm:text-xl lg:text-3xl font-bold text-secondary">{stats.activeWorkouts}</p>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Treinos Ativos</p>
                </div>
                <div className="bg-secondary/10 p-2 sm:p-3 rounded-xl flex-shrink-0">
                  <Dumbbell className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-secondary" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover-scale transition-all duration-300 border-0 bg-gradient-to-br from-success/5 to-success/10 hover:shadow-lg">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg sm:text-xl lg:text-3xl font-bold text-success">{stats.activeDiets}</p>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Dietas Ativas</p>
                </div>
                <div className="bg-success/10 p-2 sm:p-3 rounded-xl flex-shrink-0">
                  <Target className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover-scale transition-all duration-300 border-0 bg-gradient-to-br from-warning/5 to-warning/10 hover:shadow-lg">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg sm:text-xl lg:text-3xl font-bold text-warning">{stats.completedExercisesToday}</p>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Exercícios Hoje</p>
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
                  <TabsTrigger value="students" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-3 px-2">
                    <Users className="h-4 w-4 mr-1 sm:mr-2" />
                    <span>Alunos</span>
                  </TabsTrigger>
                  <TabsTrigger value="exercises" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-3 px-2">
                    <Activity className="h-4 w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Exercícios</span>
                    <span className="sm:hidden">Exerc</span>
                  </TabsTrigger>
                  <TabsTrigger value="workouts" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-3 px-2 hidden lg:flex">
                    <Dumbbell className="h-4 w-4 mr-1 sm:mr-2" />
                    <span>Treinos</span>
                  </TabsTrigger>
                  <TabsTrigger value="diets" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-3 px-2 hidden lg:flex">
                    <Target className="h-4 w-4 mr-1 sm:mr-2" />
                    <span>Dietas</span>
                  </TabsTrigger>
                  <TabsTrigger value="reports" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-3 px-2 hidden lg:flex">
                    <TrendingUp className="h-4 w-4 mr-1 sm:mr-2" />
                    <span>Relatórios</span>
                  </TabsTrigger>
                </TabsList>
                
                {/* Mobile secondary tabs */}
                <div className="lg:hidden">
                  <TabsList className="grid grid-cols-3 w-full bg-muted/50 h-auto mb-4">
                    <TabsTrigger value="workouts" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-3 px-2">
                      <Dumbbell className="h-4 w-4 mr-1 sm:mr-2" />
                      Treinos
                    </TabsTrigger>
                    <TabsTrigger value="diets" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-3 px-2">
                      <Target className="h-4 w-4 mr-1 sm:mr-2" />
                      Dietas
                    </TabsTrigger>
                    <TabsTrigger value="reports" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-3 px-2">
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
                      <p className="text-muted-foreground">Cadastre e acompanhe seus alunos</p>
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
                          loadStats(trainer.id);
                        }}
                      />
                    ) : showTestCreator ? (
                      <StudentTestCreator
                        trainerId={trainer.id}
                        onClose={() => setShowTestCreator(false)}
                        onSuccess={() => {
                          setShowTestCreator(false);
                          loadStats(trainer.id);
                        }}
                      />
                    ) : (
                      <StudentList trainerId={trainer.id} />
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50 animate-fade-in">
          <div className="max-w-2xl w-full max-h-[95vh] overflow-y-auto animate-scale-in mobile-scroll">
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

      <Footer />
    </div>
  );
};

export default Dashboard;