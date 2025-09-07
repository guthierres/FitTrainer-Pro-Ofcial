import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  User, 
  Edit, 
  Save, 
  X, 
  Plus,
  Calendar,
  Phone,
  Mail,
  Target,
  Activity,
  Dumbbell,
  Apple,
  ExternalLink,
  Copy,
  Trash2,
  Settings
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import WorkoutPlanEditor from "./WorkoutPlanEditor";

interface Student {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  birth_date?: string;
  weight?: number;
  height?: number;
  goals?: string[];
  medical_restrictions?: string;
  student_number: string;
  student_number: string;
  unique_link_token: string;
  created_at: string;
}

interface WorkoutPlan {
  id: string;
  name: string;
  active: boolean;
  workout_sessions: {
    id: string;
    name: string;
    day_of_week: number;
  }[];
}

interface DietPlan {
  id: string;
  name: string;
  active: boolean;
}

interface StudentProfileProps {
  student: Student;
  trainerId: string;
  onClose: () => void;
}

const StudentProfile = ({ student, trainerId, onClose }: StudentProfileProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [workoutPlans, setWorkoutPlans] = useState<WorkoutPlan[]>([]);
  const [dietPlans, setDietPlans] = useState<DietPlan[]>([]);
  const [editingWorkout, setEditingWorkout] = useState<WorkoutPlan | null>(null);
  const [formData, setFormData] = useState({
    name: student.name,
    email: student.email || "",
    phone: student.phone || "",
    birth_date: student.birth_date || "",
    weight: student.weight?.toString() || "",
    height: student.height?.toString() || "",
    medical_restrictions: student.medical_restrictions || "",
  });
  const [goals, setGoals] = useState<string[]>(student.goals || []);
  const [newGoal, setNewGoal] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadStudentPlans();
  }, [student.id]);

  const loadStudentPlans = async () => {
    try {
      console.log("Loading plans for student:", student.id);
      
      // Load workout plans
      const { data: workoutData, error: workoutError } = await supabase
          .from("workout_plans")
          .select(`
            id,
            name,
            active,
            workout_sessions(id, name, day_of_week)
          `)
          .eq("student_id", student.id);

      if (workoutError) {
        console.error("Error loading workout plans:", workoutError);
      }

      // Load diet plans  
      const { data: dietData, error: dietError } = await supabase
          .from("diet_plans")
          .select("id, name, active")
          .eq("student_id", student.id);

      if (dietError) {
        console.error("Error loading diet plans:", dietError);
      }

      setWorkoutPlans(workoutData || []);
      setDietPlans(dietData || []);
      
      console.log("Plans loaded:", {
        workouts: workoutData?.length || 0,
        diets: dietData?.length || 0
      });
    } catch (error) {
      console.error("Error loading student plans:", error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addGoal = () => {
    if (newGoal.trim() && !goals.includes(newGoal.trim())) {
      setGoals(prev => [...prev, newGoal.trim()]);
      setNewGoal("");
    }
  };

  const removeGoal = (goal: string) => {
    setGoals(prev => prev.filter(g => g !== goal));
  };

  const formatPhone = (value: string) => {
    const numericValue = value.replace(/\D/g, "");
    if (numericValue.length <= 11) {
      return numericValue.replace(
        /(\d{2})(\d{5})(\d{4})/,
        "($1) $2-$3"
      ).replace(
        /(\d{2})(\d{4})(\d{4})/,
        "($1) $2-$3"
      );
    }
    return value;
  };

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  const calculateBMI = () => {
    const weight = parseFloat(formData.weight);
    const height = parseFloat(formData.height);
    
    if (weight && height) {
      const bmi = weight / (height * height);
      return bmi.toFixed(1);
    }
    return null;
  };

  const copyStudentLink = () => {
    const studentLink = `${window.location.origin}/student/${student.student_number}`;
    navigator.clipboard.writeText(studentLink);
    toast({
      title: "Link copiado!",
      description: "Link do aluno copiado para a área de transferência.",
    });
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const updateData = {
        name: formData.name,
        email: formData.email || null,
        phone: formData.phone || null,
        birth_date: formData.birth_date || null,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        height: formData.height ? parseFloat(formData.height) : null,
        goals: goals.length > 0 ? goals : null,
        medical_restrictions: formData.medical_restrictions || null,
      };

      const { error } = await supabase
        .from("students")
        .update(updateData)
        .eq("id", student.id);

      if (error) throw error;

      toast({
        title: "Perfil atualizado!",
        description: "As informações do aluno foram atualizadas com sucesso.",
      });

      setIsEditing(false);
    } catch (error) {
      console.error("Error updating student:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o perfil do aluno.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getDayName = (dayIndex: number) => {
    const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    return days[dayIndex] || "?";
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 p-4 sm:p-6 border-b bg-gradient-to-r from-primary/5 to-secondary/5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg">
              {student.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">{student.name}</h1>
              <p className="text-sm text-muted-foreground">
                Cadastrado em {new Date(student.created_at).toLocaleDateString('pt-BR')}
                <br/>Número do Aluno: {student.student_number}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {!isEditing && (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={copyStudentLink}
            className="h-10"
          >
            <Copy className="h-4 w-4 mr-2" />
            Copiar Link
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(`/student/${student.student_number}`, '_blank')}
            className="h-10"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Ver Treino
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(`/student/${student.student_number}/diet`, '_blank')}
            className="h-10"
          >
            <Apple className="h-4 w-4 mr-2" />
            Ver Dieta
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-10 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Excluir
          </Button>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 sm:p-6 space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informações Pessoais
                {isEditing && (
                  <div className="ml-auto flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                      Cancelar
                    </Button>
                    <Button size="sm" onClick={handleSave} disabled={isLoading}>
                      <Save className="h-4 w-4 mr-2" />
                      {isLoading ? "Salvando..." : "Salvar"}
                    </Button>
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome Completo</Label>
                  {isEditing ? (
                    <Input
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                    />
                  ) : (
                    <p className="p-2 bg-muted rounded">{student.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Email</Label>
                  {isEditing ? (
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                    />
                  ) : (
                    <p className="p-2 bg-muted rounded">{student.email || "Não informado"}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Telefone</Label>
                  {isEditing ? (
                    <Input
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", formatPhone(e.target.value))}
                    />
                  ) : (
                    <p className="p-2 bg-muted rounded">{student.phone || "Não informado"}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Data de Nascimento</Label>
                  {isEditing ? (
                    <Input
                      type="date"
                      value={formData.birth_date}
                      onChange={(e) => handleInputChange("birth_date", e.target.value)}
                    />
                  ) : (
                    <p className="p-2 bg-muted rounded">
                      {student.birth_date 
                        ? `${new Date(student.birth_date).toLocaleDateString('pt-BR')} (${calculateAge(student.birth_date)} anos)`
                        : "Não informado"
                      }
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Peso (kg)</Label>
                  {isEditing ? (
                    <Input
                      type="number"
                      step="0.1"
                      value={formData.weight}
                      onChange={(e) => handleInputChange("weight", e.target.value)}
                    />
                  ) : (
                    <p className="p-2 bg-muted rounded">{student.weight ? `${student.weight} kg` : "Não informado"}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Altura (m)</Label>
                  {isEditing ? (
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.height}
                      onChange={(e) => handleInputChange("height", e.target.value)}
                    />
                  ) : (
                    <div className="p-2 bg-muted rounded">
                      {student.height ? `${student.height} m` : "Não informado"}
                      {calculateBMI() && (
                        <span className="ml-2 text-sm text-muted-foreground">
                          (IMC: {calculateBMI()})
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Goals */}
              <div className="space-y-2">
                <Label>Objetivos</Label>
                {isEditing ? (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        value={newGoal}
                        onChange={(e) => setNewGoal(e.target.value)}
                        placeholder="Adicionar objetivo..."
                        onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addGoal())}
                      />
                      <Button type="button" onClick={addGoal} size="sm">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {goals.map((goal, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          {goal}
                          <X
                            className="h-3 w-3 cursor-pointer"
                            onClick={() => removeGoal(goal)}
                          />
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {(student.goals || []).map((goal, index) => (
                      <Badge key={index} variant="secondary">
                        {goal}
                      </Badge>
                    ))}
                    {(!student.goals || student.goals.length === 0) && (
                      <p className="p-2 bg-muted rounded text-muted-foreground">Nenhum objetivo definido</p>
                    )}
                  </div>
                )}
              </div>

              {/* Medical Restrictions */}
              <div className="space-y-2">
                <Label>Restrições Médicas</Label>
                {isEditing ? (
                  <Textarea
                    value={formData.medical_restrictions}
                    onChange={(e) => handleInputChange("medical_restrictions", e.target.value)}
                    placeholder="Descreva restrições médicas, lesões ou cuidados especiais..."
                    rows={3}
                  />
                ) : (
                  <p className="p-2 bg-muted rounded min-h-[60px]">
                    {student.medical_restrictions || "Nenhuma restrição informada"}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Workout Plans */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Dumbbell className="h-5 w-5" />
                Planos de Treino ({workoutPlans.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {workoutPlans.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  Nenhum plano de treino encontrado
                </p>
              ) : (
                <div className="space-y-3">
                  {workoutPlans.map((plan) => (
                    <div key={plan.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{plan.name}</h4>
                        <Badge variant={plan.active ? "default" : "secondary"}>
                          {plan.active ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {plan.workout_sessions.length} sessões de treino
                      </p>
                      {plan.workout_sessions.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {plan.workout_sessions.map((session) => (
                            <Badge key={session.id} variant="outline" className="text-xs">
                              {getDayName(session.day_of_week)}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Diet Plans */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Apple className="h-5 w-5" />
                Planos Alimentares ({dietPlans.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dietPlans.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  Nenhum plano alimentar encontrado
                </p>
              ) : (
                <div className="space-y-3">
                  {dietPlans.map((plan) => (
                    <div key={plan.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{plan.name}</h4>
                        <Badge variant={plan.active ? "default" : "secondary"}>
                          {plan.active ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </ScrollArea>

      {/* Edit Workout Modal */}
      {editingWorkout && (
        <WorkoutPlanEditor
          workoutPlan={editingWorkout}
          studentId={student.id}
          trainerId={trainerId}
          isOpen={!!editingWorkout}
          onClose={() => setEditingWorkout(null)}
          onSuccess={() => {
            setEditingWorkout(null);
            loadStudentPlans();
          }}
        />
      )}
    </div>
  );
};

export default StudentProfile;