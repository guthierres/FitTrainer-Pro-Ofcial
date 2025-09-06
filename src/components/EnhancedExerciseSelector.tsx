import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Plus, 
  X, 
  Search, 
  Filter,
  ChevronDown,
  ChevronUp,
  Dumbbell,
  Clock,
  Hash,
  Target
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Exercise {
  id: string;
  name: string;
  category_id: string;
  instructions?: string;
  muscle_groups?: string[];
  equipment?: string[];
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

interface EnhancedExerciseSelectorProps {
  selectedCategory?: string;
  selectedExercises: WorkoutExercise[];
  onExercisesChange: (exercises: WorkoutExercise[]) => void;
  onCategoryChange?: (categoryId: string) => void;
}

const EnhancedExerciseSelector = ({ 
  selectedCategory, 
  selectedExercises, 
  onExercisesChange,
  onCategoryChange 
}: EnhancedExerciseSelectorProps) => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [categories, setCategories] = useState<ExerciseCategory[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedExercises, setExpandedExercises] = useState<Set<number>>(new Set());
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [exercisesResponse, categoriesResponse] = await Promise.all([
        supabase.from("exercises").select("*").order("name"),
        supabase.from("exercise_categories").select("*").order("name")
      ]);

      if (exercisesResponse.data) setExercises(exercisesResponse.data);
      if (categoriesResponse.data) setCategories(categoriesResponse.data);
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  const filteredExercises = exercises.filter(ex => {
    const matchesCategory = selectedCategory ? ex.category_id === selectedCategory : true;
    const matchesSearch = ex.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const addExercise = (exercise: Exercise) => {
    // Check if exercise already exists in session
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
      order_index: selectedExercises.length,
    };

    const updatedExercises = [...selectedExercises, newExercise];
    onExercisesChange(updatedExercises);
   // Não fechar o dialog para permitir adicionar múltiplos exercícios
    setSearchTerm("");
   
   toast({
     title: "Exercício adicionado!",
     description: `${exercise.name} foi adicionado ao treino.`,
   });
  };

  const removeExercise = (index: number) => {
    const updatedExercises = selectedExercises
      .filter((_, idx) => idx !== index)
      .map((ex, idx) => ({ ...ex, order_index: idx }));
    onExercisesChange(updatedExercises);
  };

  const updateExercise = (index: number, field: string, value: number) => {
    const updatedExercises = selectedExercises.map((ex, idx) => 
      idx === index ? { ...ex, [field]: value } : ex
    );
    onExercisesChange(updatedExercises);
  };

  const moveExercise = (fromIndex: number, toIndex: number) => {
    const updatedExercises = [...selectedExercises];
    const [removed] = updatedExercises.splice(fromIndex, 1);
    updatedExercises.splice(toIndex, 0, removed);
    
    const reorderedExercises = updatedExercises.map((ex, idx) => ({ 
      ...ex, 
      order_index: idx 
    }));
    onExercisesChange(reorderedExercises);
  };

  const toggleExpanded = (index: number) => {
    const newExpanded = new Set(expandedExercises);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedExercises(newExpanded);
  };

  const selectedCategoryData = categories.find(c => c.id === selectedCategory);

  return (
    <div className="space-y-4">
      {/* Category Selection */}
      {onCategoryChange && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Categoria do Treino</Label>
          <Select value={selectedCategory} onValueChange={onCategoryChange}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma categoria">
                {selectedCategoryData && (
                  <span className="flex items-center gap-2">
                    {selectedCategoryData.emoji} {selectedCategoryData.name}
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
      )}

      {/* Add Exercise Button */}
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">
          Exercícios ({selectedExercises.length})
          {selectedCategoryData && (
            <Badge variant="outline" className="ml-2">
              {selectedCategoryData.emoji} {selectedCategoryData.name}
            </Badge>
          )}
        </Label>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" disabled={!selectedCategory}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Exercício
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Dumbbell className="h-5 w-5" />
                Escolher Exercícios
                {selectedCategoryData && (
                  <Badge variant="outline">
                    {selectedCategoryData.emoji} {selectedCategoryData.name}
                  </Badge>
                )}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar exercícios..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              <ScrollArea className="h-96">
                <div className="space-y-2">
                  {filteredExercises.map(exercise => (
                    <Card 
                      key={exercise.id} 
                     className="cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-[1.02] border-2 hover:border-primary/30"
                      onClick={() => addExercise(exercise)}
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-medium">{exercise.name}</h4>
                            {exercise.instructions && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {exercise.instructions}
                              </p>
                            )}
                            <div className="flex gap-2 mt-2">
                              {exercise.muscle_groups?.slice(0, 3).map(muscle => (
                                <Badge key={muscle} variant="secondary" className="text-xs">
                                  {muscle}
                                </Badge>
                              ))}
                            </div>
                          </div>
                         <div className="bg-primary/10 p-2 rounded-full">
                           <Plus className="h-4 w-4 text-primary" />
                         </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {filteredExercises.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhum exercício encontrado</p>
                      {searchTerm && (
                        <p className="text-sm">Tente buscar com outros termos</p>
                      )}
                    </div>
                  )}
                </div>
              </ScrollArea>
             
             <div className="flex justify-between items-center pt-4 border-t">
               <p className="text-sm text-muted-foreground">
                 {selectedExercises.length} exercício(s) selecionado(s)
               </p>
               <Button onClick={() => setIsDialogOpen(false)} variant="outline">
                 Concluir Seleção
               </Button>
             </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Selected Exercises */}
      {selectedExercises.length > 0 && (
        <div className="space-y-3">
          {selectedExercises.map((exercise, index) => (
            <Card key={index} className="border-l-4 border-l-primary">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-medium">{exercise.exercise_name}</h4>
                      <div className="text-xs text-muted-foreground">
                        {exercise.sets} × {exercise.reps_min}-{exercise.reps_max} reps • {exercise.rest_minutes} min descanso
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveExercise(index, Math.max(0, index - 1))}
                        disabled={index === 0}
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveExercise(index, Math.min(selectedExercises.length - 1, index + 1))}
                        disabled={index === selectedExercises.length - 1}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpanded(index)}
                    >
                      {expandedExercises.has(index) ? 
                        <ChevronUp className="h-4 w-4" /> : 
                        <ChevronDown className="h-4 w-4" />
                      }
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeExercise(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {expandedExercises.has(index) && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t">
                    <div className="space-y-2">
                      <Label className="text-xs font-medium flex items-center gap-1">
                        <Hash className="h-3 w-3" />
                        Séries
                      </Label>
                      <Input
                        type="number"
                        value={exercise.sets}
                        onChange={(e) => updateExercise(index, 'sets', parseInt(e.target.value) || 1)}
                        min="1"
                        max="10"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-xs font-medium flex items-center gap-1">
                        <Target className="h-3 w-3" />
                        Repetições
                      </Label>
                      <div className="flex gap-1">
                        <Input
                          type="number"
                          value={exercise.reps_min}
                          onChange={(e) => updateExercise(index, 'reps_min', parseInt(e.target.value) || 1)}
                          min="1"
                          placeholder="Min"
                        />
                        <Input
                          type="number"
                          value={exercise.reps_max}
                          onChange={(e) => updateExercise(index, 'reps_max', parseInt(e.target.value) || 1)}
                          min="1"
                          placeholder="Max"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-xs font-medium flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Descanso (min)
                      </Label>
                      <Input
                        type="number"
                        step="0.5"
                        placeholder="1"
                        value={exercise.rest_minutes}
                        onChange={(e) => updateExercise(index, 'rest_minutes', parseFloat(e.target.value) || 0)}
                        min="0"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedExercises.length === 0 && selectedCategory && (
        <Card className="border-dashed">
          <CardContent className="text-center py-8">
            <Dumbbell className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">
              Nenhum exercício selecionado para {selectedCategoryData?.name}
            </p>
            <p className="text-sm text-muted-foreground">
              Clique em "Adicionar Exercício" para começar
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EnhancedExerciseSelector;