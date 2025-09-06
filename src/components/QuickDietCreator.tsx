import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, Plus, Utensils, Trash2, Edit, Settings, Apple } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ExistingDietPlan {
  id: string;
  name: string;
  description?: string;
  active: boolean;
  daily_calories?: number;
  daily_protein?: number;
  daily_carbs?: number;
  daily_fat?: number;
  meals: {
    id: string;
    name: string;
    time_of_day?: string;
    meal_foods: {
      id: string;
      food_name: string;
      quantity: number;
      unit: string;
    }[];
  }[];
}

interface MealFood {
  food_name: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  notes?: string;
}

interface Meal {
  name: string;
  time_of_day: string;
  order_index: number;
  foods: MealFood[];
}

interface QuickDietCreatorProps {
  studentId: string;
  studentName: string;
  trainerId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const QuickDietCreator = ({ studentId, studentName, trainerId, onClose, onSuccess }: QuickDietCreatorProps) => {
  const [existingDiets, setExistingDiets] = useState<ExistingDietPlan[]>([]);
  const [activeTab, setActiveTab] = useState("existing");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    daily_calories: "",
    daily_protein: "",
    daily_carbs: "",
    daily_fat: "",
  });
  
  const [meals, setMeals] = useState<Meal[]>([
    { name: "Café da Manhã", time_of_day: "07:00", order_index: 0, foods: [] },
    { name: "Lanche da Manhã", time_of_day: "10:00", order_index: 1, foods: [] },
    { name: "Almoço", time_of_day: "12:00", order_index: 2, foods: [] },
    { name: "Lanche da Tarde", time_of_day: "15:00", order_index: 3, foods: [] },
    { name: "Jantar", time_of_day: "19:00", order_index: 4, foods: [] },
  ]);
  
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadExistingDiets();
  }, [studentId]);

  const loadExistingDiets = async () => {
    try {
      const { data, error } = await supabase
        .from("diet_plans")
        .select(`
          id,
          name,
          description,
          active,
          daily_calories,
          daily_protein,
          daily_carbs,
          daily_fat,
          meals(
            id,
            name,
            time_of_day,
            meal_foods(
              id,
              food_name,
              quantity,
              unit
            )
          )
        `)
        .eq("student_id", studentId)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setExistingDiets(data);
      }
    } catch (error) {
      console.error("Error loading existing diets:", error);
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
        loadExistingDiets();
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar status da dieta.",
        variant: "destructive",
      });
    }
  };

  const deleteDiet = async (dietId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta dieta?")) return;

    try {
      const { error } = await supabase
        .from("diet_plans")
        .delete()
        .eq("id", dietId);

      if (!error) {
        toast({
          title: "Dieta excluída",
          description: "Dieta excluída com sucesso.",
        });
        loadExistingDiets();
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao excluir dieta.",
        variant: "destructive",
      });
    }
  };

  const addFoodToMeal = (mealIndex: number) => {
    const newFood: MealFood = {
      food_name: "",
      quantity: 100,
      unit: "g",
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      notes: "",
    };

    setMeals(prev => prev.map((meal, idx) => 
      idx === mealIndex 
        ? { ...meal, foods: [...meal.foods, newFood] }
        : meal
    ));
  };

  const updateMealFood = (mealIndex: number, foodIndex: number, field: string, value: string | number) => {
    setMeals(prev => prev.map((meal, mIdx) => 
      mIdx === mealIndex 
        ? {
            ...meal,
            foods: meal.foods.map((food, fIdx) => 
              fIdx === foodIndex 
                ? { ...food, [field]: value }
                : food
            )
          }
        : meal
    ));
  };

  const removeFoodFromMeal = (mealIndex: number, foodIndex: number) => {
    setMeals(prev => prev.map((meal, mIdx) => 
      mIdx === mealIndex 
        ? { ...meal, foods: meal.foods.filter((_, fIdx) => fIdx !== foodIndex) }
        : meal
    ));
  };

  const updateMeal = (mealIndex: number, field: string, value: string) => {
    setMeals(prev => prev.map((meal, idx) => 
      idx === mealIndex 
        ? { ...meal, [field]: value }
        : meal
    ));
  };

  const getTotalMacros = () => {
    return meals.reduce((total, meal) => {
      const mealTotals = meal.foods.reduce((mealTotal, food) => ({
        calories: mealTotal.calories + (food.calories || 0),
        protein: mealTotal.protein + (food.protein || 0),
        carbs: mealTotal.carbs + (food.carbs || 0),
        fat: mealTotal.fat + (food.fat || 0),
      }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

      return {
        calories: total.calories + mealTotals.calories,
        protein: total.protein + mealTotals.protein,
        carbs: total.carbs + mealTotals.carbs,
        fat: total.fat + mealTotals.fat,
      };
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Create diet plan
      const { data: dietPlan, error: planError } = await supabase
        .from("diet_plans")
        .insert({
          name: formData.name,
          description: formData.description,
          student_id: studentId,
          personal_trainer_id: trainerId,
          daily_calories: formData.daily_calories ? parseInt(formData.daily_calories) : null,
          daily_protein: formData.daily_protein ? parseFloat(formData.daily_protein) : null,
          daily_carbs: formData.daily_carbs ? parseFloat(formData.daily_carbs) : null,
          daily_fat: formData.daily_fat ? parseFloat(formData.daily_fat) : null,
          active: true,
        })
        .select()
        .single();

      if (planError) throw planError;
      
      console.log("Diet plan created:", dietPlan);

      // Create meals and foods
      for (const meal of meals) {
        if (meal.foods.length === 0) continue;

        const { data: mealData, error: mealError } = await supabase
          .from("meals")
          .insert({
            diet_plan_id: dietPlan.id,
            name: meal.name,
            time_of_day: meal.time_of_day,
            order_index: meal.order_index,
          })
          .select()
          .single();

        if (mealError) throw mealError;
        
        console.log("Meal created:", mealData);

        // Insert foods for this meal
        const foodInserts = meal.foods
          .filter(food => food.food_name.trim() !== "")
          .map(food => ({
            meal_id: mealData.id,
            food_name: food.food_name,
            quantity: food.quantity,
            unit: food.unit,
            calories: food.calories,
            protein: food.protein,
            carbs: food.carbs,
            fat: food.fat,
            notes: food.notes || null,
          }));

        if (foodInserts.length > 0) {
          console.log("Inserting foods for meal:", mealData.id, foodInserts);
          
          const { error: foodError } = await supabase
            .from("meal_foods")
            .insert(foodInserts);

          if (foodError) throw foodError;
          
          console.log("Foods inserted successfully");
        }
      }

      toast({
        title: "Sucesso!",
        description: `Dieta criada para ${studentName}!`,
      });

      onSuccess();
    } catch (error) {
      console.error("Error creating diet:", error);
      toast({
        title: "Erro",
        description: "Não foi possível criar a dieta. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const totalMacros = getTotalMacros();

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="existing" className="flex items-center gap-2">
            <Apple className="h-4 w-4" />
            Dietas Existentes
          </TabsTrigger>
          <TabsTrigger value="create" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Criar Nova Dieta
          </TabsTrigger>
        </TabsList>

        <TabsContent value="existing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Apple className="h-5 w-5" />
                Dietas de {studentName} ({existingDiets.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {existingDiets.length === 0 ? (
                <div className="text-center py-8">
                  <Apple className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">
                    Nenhuma dieta encontrada para este aluno.
                  </p>
                  <Button 
                    onClick={() => setActiveTab("create")} 
                    className="mt-4"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeira Dieta
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {existingDiets.map((diet) => (
                    <Card key={diet.id} className="border-2">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-lg">{diet.name}</h3>
                              <Badge variant={diet.active ? "default" : "secondary"}>
                                {diet.active ? "Ativo" : "Inativo"}
                              </Badge>
                            </div>
                            
                            {diet.description && (
                              <p className="text-sm text-muted-foreground">
                                {diet.description}
                              </p>
                            )}
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              {diet.daily_calories && (
                                <div>
                                  <span className="text-muted-foreground">Calorias:</span>
                                  <span className="ml-2 font-medium">{diet.daily_calories} kcal</span>
                                </div>
                              )}
                              {diet.daily_protein && (
                                <div>
                                  <span className="text-muted-foreground">Proteína:</span>
                                  <span className="ml-2 font-medium">{diet.daily_protein}g</span>
                                </div>
                              )}
                              {diet.daily_carbs && (
                                <div>
                                  <span className="text-muted-foreground">Carboidratos:</span>
                                  <span className="ml-2 font-medium">{diet.daily_carbs}g</span>
                                </div>
                              )}
                              {diet.daily_fat && (
                                <div>
                                  <span className="text-muted-foreground">Gorduras:</span>
                                  <span className="ml-2 font-medium">{diet.daily_fat}g</span>
                                </div>
                              )}
                            </div>

                            {diet.meals.length > 0 && (
                              <div className="space-y-2">
                                <p className="text-sm font-medium">Refeições ({diet.meals.length}):</p>
                                <div className="flex flex-wrap gap-1">
                                  {diet.meals.map((meal) => (
                                    <Badge key={meal.id} variant="outline" className="text-xs">
                                      {meal.name} ({meal.meal_foods.length} alimentos)
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
                              onClick={() => toggleDietStatus(diet.id, diet.active)}
                            >
                              {diet.active ? "Desativar" : "Ativar"}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteDiet(diet.id)}
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
          <Card className="max-w-6xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Criar Nova Dieta para {studentName}
              </CardTitle>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome da Dieta *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Ex: Dieta para Hipertrofia"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="daily_calories">Meta Diária - Calorias</Label>
                    <Input
                      id="daily_calories"
                      type="number"
                      value={formData.daily_calories}
                      onChange={(e) => setFormData(prev => ({ ...prev, daily_calories: e.target.value }))}
                      placeholder="2000"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="daily_protein">Meta - Proteína (g)</Label>
                    <Input
                      id="daily_protein"
                      type="number"
                      step="0.1"
                      value={formData.daily_protein}
                      onChange={(e) => setFormData(prev => ({ ...prev, daily_protein: e.target.value }))}
                      placeholder="120"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="daily_carbs">Meta - Carboidratos (g)</Label>
                    <Input
                      id="daily_carbs"
                      type="number"
                      step="0.1"
                      value={formData.daily_carbs}
                      onChange={(e) => setFormData(prev => ({ ...prev, daily_carbs: e.target.value }))}
                      placeholder="250"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="daily_fat">Meta - Gorduras (g)</Label>
                    <Input
                      id="daily_fat"
                      type="number"
                      step="0.1"
                      value={formData.daily_fat}
                      onChange={(e) => setFormData(prev => ({ ...prev, daily_fat: e.target.value }))}
                      placeholder="70"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descreva os objetivos desta dieta..."
                    rows={3}
                  />
                </div>

                {/* Totals */}
                <Card className="bg-muted">
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-4 gap-4 text-center">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Calorias</p>
                        <p className="text-lg font-semibold">{Math.round(totalMacros.calories)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Proteína</p>
                        <p className="text-lg font-semibold">{Math.round(totalMacros.protein)}g</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Carbs</p>
                        <p className="text-lg font-semibold">{Math.round(totalMacros.carbs)}g</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Gorduras</p>
                        <p className="text-lg font-semibold">{Math.round(totalMacros.fat)}g</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Meals */}
                {meals.map((meal, mealIndex) => (
                  <Card key={mealIndex} className="border-2">
                    <CardHeader className="pb-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Nome da Refeição</Label>
                          <Input
                            value={meal.name}
                            onChange={(e) => updateMeal(mealIndex, 'name', e.target.value)}
                            placeholder="Nome da refeição"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Horário</Label>
                          <Input
                            type="time"
                            value={meal.time_of_day}
                            onChange={(e) => updateMeal(mealIndex, 'time_of_day', e.target.value)}
                          />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addFoodToMeal(mealIndex)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Alimento
                      </Button>

                      {meal.foods.map((food, foodIndex) => (
                        <div key={foodIndex} className="grid grid-cols-8 gap-2 items-end p-3 bg-muted rounded-lg">
                          <div className="col-span-2">
                            <Label className="text-xs">Alimento</Label>
                            <Input
                              value={food.food_name}
                              onChange={(e) => updateMealFood(mealIndex, foodIndex, 'food_name', e.target.value)}
                              placeholder="Ex: Frango grelhado"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Qtd</Label>
                            <Input
                              type="number"
                              value={food.quantity}
                              onChange={(e) => updateMealFood(mealIndex, foodIndex, 'quantity', parseFloat(e.target.value) || 0)}
                              min="0"
                              step="0.1"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Unidade</Label>
                            <Input
                              value={food.unit}
                              onChange={(e) => updateMealFood(mealIndex, foodIndex, 'unit', e.target.value)}
                              placeholder="g"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Calorias</Label>
                            <Input
                              type="number"
                              value={food.calories}
                              onChange={(e) => updateMealFood(mealIndex, foodIndex, 'calories', parseFloat(e.target.value) || 0)}
                              min="0"
                              step="0.1"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Proteína</Label>
                            <Input
                              type="number"
                              value={food.protein}
                              onChange={(e) => updateMealFood(mealIndex, foodIndex, 'protein', parseFloat(e.target.value) || 0)}
                              min="0"
                              step="0.1"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Carbs</Label>
                            <Input
                              type="number"
                              value={food.carbs}
                              onChange={(e) => updateMealFood(mealIndex, foodIndex, 'carbs', parseFloat(e.target.value) || 0)}
                              min="0"
                              step="0.1"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeFoodFromMeal(mealIndex, foodIndex)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ))}

                {/* Submit Buttons */}
                <div className="flex gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1" 
                    disabled={isLoading || !formData.name}
                  >
                    {isLoading ? "Criando..." : "Criar Dieta"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default QuickDietCreator;