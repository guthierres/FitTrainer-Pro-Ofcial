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
  Apple,
  Target,
  User,
  Utensils,
  Clock
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DietPlan {
  id: string;
  name: string;
  description?: string;
  student_id: string;
  daily_calories?: number;
  daily_protein?: number;
  daily_carbs?: number;
  daily_fat?: number;
  active: boolean;
  student?: {
    name: string;
  };
  meals?: Meal[];
}

interface Meal {
  id: string;
  name: string;
  time_of_day?: string;
  order_index: number;
  meal_foods?: MealFood[];
}

interface MealFood {
  id: string;
  food_name: string;
  quantity: number;
  unit: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  notes?: string;
}

interface Student {
  id: string;
  name: string;
}

const DietManager = ({ trainerId }: { trainerId: string }) => {
  const [diets, setDiets] = useState<DietPlan[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedDiet, setSelectedDiet] = useState<DietPlan | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    student_id: "",
    daily_calories: "",
    daily_protein: "",
    daily_carbs: "",
    daily_fat: ""
  });
  const { toast } = useToast();

  useEffect(() => {
    loadDiets();
    loadStudents();
  }, [trainerId]);

  const loadDiets = async () => {
    try {
      console.log("Loading diets for trainer:", trainerId);
      
      const { data, error } = await supabase
        .from("diet_plans")
        .select(`
          *,
          students(name),
          meals(
            *,
            meal_foods(*)
          )
        `)
        .eq("personal_trainer_id", trainerId)
        .order("created_at", { ascending: false });

      if (!error && data) {
        console.log("Diets loaded:", data.length);
        setDiets(data);
      } else {
        console.error("Error loading diets:", error);
        setDiets([]);
      }
    } catch (error) {
      console.error("Error loading diets:", error);
      setDiets([]);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const dietData = {
        name: formData.name,
        description: formData.description || null,
        student_id: formData.student_id,
        personal_trainer_id: trainerId,
        daily_calories: formData.daily_calories ? parseInt(formData.daily_calories) : null,
        daily_protein: formData.daily_protein ? parseFloat(formData.daily_protein) : null,
        daily_carbs: formData.daily_carbs ? parseFloat(formData.daily_carbs) : null,
        daily_fat: formData.daily_fat ? parseFloat(formData.daily_fat) : null,
        active: true
      };

      if (selectedDiet) {
        const { error } = await supabase
          .from("diet_plans")
          .update(dietData)
          .eq("id", selectedDiet.id);

        if (!error) {
          toast({
            title: "Dieta atualizada",
            description: "Plano alimentar atualizado com sucesso.",
          });
        }
      } else {
        const { error } = await supabase
          .from("diet_plans")
          .insert([dietData]);

        if (!error) {
          toast({
            title: "Dieta criada",
            description: "Novo plano alimentar criado com sucesso.",
          });
        }
      }

      setIsDialogOpen(false);
      resetForm();
      loadDiets();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar plano alimentar.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (diet: DietPlan) => {
    setSelectedDiet(diet);
    setFormData({
      name: diet.name,
      description: diet.description || "",
      student_id: diet.student_id,
      daily_calories: diet.daily_calories?.toString() || "",
      daily_protein: diet.daily_protein?.toString() || "",
      daily_carbs: diet.daily_carbs?.toString() || "",
      daily_fat: diet.daily_fat?.toString() || ""
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (dietId: string) => {
    if (confirm("Tem certeza que deseja excluir este plano alimentar?")) {
      try {
        const { error } = await supabase
          .from("diet_plans")
          .delete()
          .eq("id", dietId);

        if (!error) {
          toast({
            title: "Dieta excluída",
            description: "Plano alimentar excluído com sucesso.",
          });
          loadDiets();
        }
      } catch (error) {
        toast({
          title: "Erro",
          description: "Erro ao excluir plano alimentar.",
          variant: "destructive",
        });
      }
    }
  };

  const toggleDietStatus = async (dietId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("diet_plans")
        .update({ active: !currentStatus })
        .eq("id", dietId);

      if (!error) {
        toast({
          title: "Status atualizado",
          description: `Dieta ${!currentStatus ? 'ativada' : 'desativada'} com sucesso.`,
        });
        loadDiets();
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar status da dieta.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setSelectedDiet(null);
    setFormData({
      name: "",
      description: "",
      student_id: "",
      daily_calories: "",
      daily_protein: "",
      daily_carbs: "",
      daily_fat: ""
    });
  };

  const getTotalMacros = (meals: Meal[] | undefined) => {
    if (!meals) return { calories: 0, protein: 0, carbs: 0, fat: 0 };

    return meals.reduce(
      (total, meal) => {
        const mealMacros = meal.meal_foods?.reduce(
          (mealTotal, food) => ({
            calories: mealTotal.calories + (food.calories || 0),
            protein: mealTotal.protein + (food.protein || 0),
            carbs: mealTotal.carbs + (food.carbs || 0),
            fat: mealTotal.fat + (food.fat || 0)
          }),
          { calories: 0, protein: 0, carbs: 0, fat: 0 }
        ) || { calories: 0, protein: 0, carbs: 0, fat: 0 };

        return {
          calories: total.calories + mealMacros.calories,
          protein: total.protein + mealMacros.protein,
          carbs: total.carbs + mealMacros.carbs,
          fat: total.fat + mealMacros.fat
        };
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Gerenciar Dietas</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Dieta
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {selectedDiet ? "Editar Dieta" : "Criar Nova Dieta"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da Dieta</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Dieta para Definição"
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
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição do plano alimentar..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="daily_calories">Calorias Diárias</Label>
                  <Input
                    id="daily_calories"
                    type="number"
                    value={formData.daily_calories}
                    onChange={(e) => setFormData({ ...formData, daily_calories: e.target.value })}
                    placeholder="2000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="daily_protein">Proteína Diária (g)</Label>
                  <Input
                    id="daily_protein"
                    type="number"
                    step="0.1"
                    value={formData.daily_protein}
                    onChange={(e) => setFormData({ ...formData, daily_protein: e.target.value })}
                    placeholder="150"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="daily_carbs">Carboidratos Diários (g)</Label>
                  <Input
                    id="daily_carbs"
                    type="number"
                    step="0.1"
                    value={formData.daily_carbs}
                    onChange={(e) => setFormData({ ...formData, daily_carbs: e.target.value })}
                    placeholder="200"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="daily_fat">Gordura Diária (g)</Label>
                  <Input
                    id="daily_fat"
                    type="number"
                    step="0.1"
                    value={formData.daily_fat}
                    onChange={(e) => setFormData({ ...formData, daily_fat: e.target.value })}
                    placeholder="80"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {selectedDiet ? "Atualizar" : "Criar"} Dieta
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {diets.map((diet) => {
          const totalMacros = getTotalMacros(diet.meals);
          
          return (
            <Card key={diet.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Apple className="h-5 w-5" />
                      {diet.name}
                      <Badge variant={diet.active ? "default" : "secondary"}>
                        {diet.active ? "Ativo" : "Inativo"}
                      </Badge>
                    </CardTitle>
                    {diet.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {diet.description}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleDietStatus(diet.id, diet.active)}
                    >
                      {diet.active ? "Desativar" : "Ativar"}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleEdit(diet)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(diet.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      <strong>Aluno:</strong> {diet.student?.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Utensils className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      <strong>Refeições:</strong> {diet.meals?.length || 0}
                    </span>
                  </div>
                </div>

                {/* Macros Planejados vs Reais */}
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div className="border rounded p-3">
                    <h4 className="font-semibold mb-2">Metas Diárias</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Calorias:</span>
                        <div className="font-medium">{diet.daily_calories || "N/A"}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Proteína:</span>
                        <div className="font-medium">{diet.daily_protein ? `${diet.daily_protein}g` : "N/A"}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Carboidratos:</span>
                        <div className="font-medium">{diet.daily_carbs ? `${diet.daily_carbs}g` : "N/A"}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Gordura:</span>
                        <div className="font-medium">{diet.daily_fat ? `${diet.daily_fat}g` : "N/A"}</div>
                      </div>
                    </div>
                  </div>

                  <div className="border rounded p-3">
                    <h4 className="font-semibold mb-2">Total das Refeições</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Calorias:</span>
                        <div className="font-medium">{Math.round(totalMacros.calories)}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Proteína:</span>
                        <div className="font-medium">{Math.round(totalMacros.protein * 10) / 10}g</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Carboidratos:</span>
                        <div className="font-medium">{Math.round(totalMacros.carbs * 10) / 10}g</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Gordura:</span>
                        <div className="font-medium">{Math.round(totalMacros.fat * 10) / 10}g</div>
                      </div>
                    </div>
                  </div>
                </div>

                {diet.meals && diet.meals.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-semibold mb-2">Refeições:</h4>
                    <div className="grid gap-2">
                      {diet.meals
                        .sort((a, b) => a.order_index - b.order_index)
                        .map((meal) => (
                          <div key={meal.id} className="border rounded p-3">
                            <div className="flex justify-between items-center mb-2">
                              <h5 className="font-medium">{meal.name}</h5>
                              {meal.time_of_day && (
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  <span className="text-sm">{meal.time_of_day}</span>
                                </div>
                              )}
                            </div>
                            {meal.meal_foods && meal.meal_foods.length > 0 && (
                              <div className="text-sm">
                                <strong>Alimentos ({meal.meal_foods.length}):</strong>
                                <ul className="list-disc list-inside ml-2">
                                  {meal.meal_foods.slice(0, 3).map((food) => (
                                    <li key={food.id}>
                                      {food.quantity}{food.unit} {food.food_name}
                                      {food.calories && ` - ${food.calories} cal`}
                                    </li>
                                  ))}
                                  {meal.meal_foods.length > 3 && (
                                    <li className="text-muted-foreground">
                                      ... e mais {meal.meal_foods.length - 3} alimentos
                                    </li>
                                  )}
                                </ul>
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {diets.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Apple className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Nenhum plano alimentar encontrado. Crie a primeira dieta para seus alunos.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DietManager;