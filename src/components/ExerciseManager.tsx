import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Dumbbell,
  Globe,
  User,
  Search,
  Filter
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Exercise {
  id: string;
  name: string;
  description?: string;
  instructions?: string;
  category_id: string;
  muscle_groups?: string[];
  equipment?: string[];
  personal_trainer_id?: string;
  category?: {
    name: string;
    emoji?: string;
  };
}

interface ExerciseCategory {
  id: string;
  name: string;
  emoji?: string;
}

const ExerciseManager = ({ trainerId }: { trainerId: string }) => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [categories, setCategories] = useState<ExerciseCategory[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("global");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    instructions: "",
    category_id: "",
    youtube_video_url: "",
    muscle_groups: [] as string[],
    equipment: [] as string[]
  });
  const { toast } = useToast();

  useEffect(() => {
    loadExercises();
    loadCategories();
  }, [trainerId, activeTab]);

  const loadExercises = async () => {
    try {
      let query = supabase
        .from("exercises")
        .select(`
          *,
          exercise_categories(name, emoji)
        `)
        .order("name");

      if (activeTab === "global") {
        query = query.is("personal_trainer_id", null);
      } else {
        query = query.eq("personal_trainer_id", trainerId);
      }

      const { data, error } = await query;

      if (!error && data) {
        setExercises(data.map(ex => ({
          ...ex,
          category: ex.exercise_categories
        })));
      }
    } catch (error) {
      console.error("Error loading exercises:", error);
    }
  };

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("exercise_categories")
        .select("*")
        .order("name");

      if (!error && data) {
        setCategories(data);
      }
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const exerciseData = {
        ...formData,
        personal_trainer_id: trainerId, // Always assign to trainer for custom exercises
        muscle_groups: formData.muscle_groups.length > 0 ? formData.muscle_groups : null,
        equipment: formData.equipment.length > 0 ? formData.equipment : null
      };

      if (selectedExercise) {
        const { error } = await supabase
          .from("exercises")
          .update(exerciseData)
          .eq("id", selectedExercise.id);

        if (!error) {
          toast({
            title: "Exercício atualizado",
            description: "Exercício atualizado com sucesso.",
          });
        }
      } else {
        const { error } = await supabase
          .from("exercises")
          .insert([exerciseData]);

        if (!error) {
          toast({
            title: "Exercício criado",
            description: "Novo exercício criado com sucesso.",
          });
        }
      }

      setIsDialogOpen(false);
      resetForm();
      loadExercises();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar exercício.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setFormData({
      name: exercise.name,
      description: exercise.description || "",
      instructions: exercise.instructions || "",
      category_id: exercise.category_id,
      youtube_video_url: exercise.youtube_video_url || "",
      muscle_groups: exercise.muscle_groups || [],
      equipment: exercise.equipment || []
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (exerciseId: string) => {
    if (confirm("Tem certeza que deseja excluir este exercício?")) {
      try {
        const { error } = await supabase
          .from("exercises")
          .delete()
          .eq("id", exerciseId);

        if (!error) {
          toast({
            title: "Exercício excluído",
            description: "Exercício excluído com sucesso.",
          });
          loadExercises();
        }
      } catch (error) {
        toast({
          title: "Erro",
          description: "Erro ao excluir exercício.",
          variant: "destructive",
        });
      }
    }
  };

  const resetForm = () => {
    setSelectedExercise(null);
    setFormData({
      name: "",
      description: "",
      instructions: "",
      category_id: "",
      youtube_video_url: "",
      muscle_groups: [],
      equipment: []
    });
  };

  const addMuscleGroup = (muscle: string) => {
    if (muscle && !formData.muscle_groups.includes(muscle)) {
      setFormData({
        ...formData,
        muscle_groups: [...formData.muscle_groups, muscle]
      });
    }
  };

  const removeMuscleGroup = (index: number) => {
    setFormData({
      ...formData,
      muscle_groups: formData.muscle_groups.filter((_, i) => i !== index)
    });
  };

  const addEquipment = (equipment: string) => {
    if (equipment && !formData.equipment.includes(equipment)) {
      setFormData({
        ...formData,
        equipment: [...formData.equipment, equipment]
      });
    }
  };

  const removeEquipment = (index: number) => {
    setFormData({
      ...formData,
      equipment: formData.equipment.filter((_, i) => i !== index)
    });
  };

  const filteredExercises = exercises.filter(exercise => {
    const matchesSearch = exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         exercise.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || exercise.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Gerenciar Exercícios</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Exercício
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedExercise ? "Editar Exercício" : "Criar Novo Exercício"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Exercício</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Supino inclinado com halteres"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category_id">Categoria</Label>
                  <Select
                    value={formData.category_id}
                    onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.emoji} {category.name}
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
                  placeholder="Breve descrição do exercício..."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="instructions">Instruções de Execução</Label>
                <Textarea
                  id="instructions"
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                  placeholder="Como executar o exercício corretamente..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="youtube_video_url">Vídeo Demonstrativo (YouTube)</Label>
                <Input
                  id="youtube_video_url"
                  type="url"
                  value={formData.youtube_video_url}
                  onChange={(e) => setFormData({ ...formData, youtube_video_url: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=..."
                />
                <p className="text-xs text-muted-foreground">
                  Cole o link do YouTube do vídeo que demonstra como executar o exercício
                </p>
              </div>

              <div className="space-y-2">
                <Label>Grupos Musculares</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    placeholder="Digite um grupo muscular"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addMuscleGroup(e.currentTarget.value);
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.muscle_groups.map((muscle, index) => (
                    <Badge key={index} variant="secondary" className="cursor-pointer">
                      {muscle}
                      <button
                        type="button"
                        onClick={() => removeMuscleGroup(index)}
                        className="ml-1 text-xs"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Equipamentos</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    placeholder="Digite um equipamento"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addEquipment(e.currentTarget.value);
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.equipment.map((equip, index) => (
                    <Badge key={index} variant="outline" className="cursor-pointer">
                      {equip}
                      <button
                        type="button"
                        onClick={() => removeEquipment(index)}
                        className="ml-1 text-xs"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {selectedExercise ? "Atualizar" : "Criar"} Exercício
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros */}
      <div className="flex gap-4 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar exercícios..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.emoji} {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 w-full max-w-md">
          <TabsTrigger value="global" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Exercícios Globais
          </TabsTrigger>
          <TabsTrigger value="custom" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Meus Exercícios
          </TabsTrigger>
        </TabsList>

        <TabsContent value="global" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Biblioteca Global de Exercícios ({filteredExercises.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredExercises.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Nenhum exercício encontrado.
                </p>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredExercises.map((exercise) => (
                    <Card key={exercise.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold">{exercise.name}</h4>
                          <Badge variant="outline">
                            {exercise.category?.emoji} {exercise.category?.name}
                          </Badge>
                        </div>
                        
                        {exercise.description && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {exercise.description}
                          </p>
                        )}

                        {exercise.muscle_groups && exercise.muscle_groups.length > 0 && (
                          <div className="mb-2">
                            <p className="text-xs font-medium text-muted-foreground mb-1">
                              Músculos:
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {exercise.muscle_groups.slice(0, 3).map((muscle, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {muscle}
                                </Badge>
                              ))}
                              {exercise.muscle_groups.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{exercise.muscle_groups.length - 3}
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}

                        {exercise.equipment && exercise.equipment.length > 0 && (
                          <div className="mb-2">
                            <p className="text-xs font-medium text-muted-foreground mb-1">
                              Equipamentos:
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {exercise.equipment.slice(0, 2).join(', ')}
                              {exercise.equipment.length > 2 && ` +${exercise.equipment.length - 2}`}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="custom" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Meus Exercícios Personalizados ({filteredExercises.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredExercises.length === 0 ? (
                <div className="text-center py-8">
                  <Dumbbell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Você ainda não criou exercícios personalizados.
                  </p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredExercises.map((exercise) => (
                    <Card key={exercise.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold">{exercise.name}</h4>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(exercise)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(exercise.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <Badge variant="outline" className="mb-2">
                          {exercise.category?.emoji} {exercise.category?.name}
                        </Badge>
                        
                        {exercise.description && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {exercise.description}
                          </p>
                        )}

                        {exercise.muscle_groups && exercise.muscle_groups.length > 0 && (
                          <div className="mb-2">
                            <p className="text-xs font-medium text-muted-foreground mb-1">
                              Músculos:
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {exercise.muscle_groups.map((muscle, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {muscle}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ExerciseManager;
