import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CreateStudentProps {
  trainerId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateStudent = ({ trainerId, onClose, onSuccess }: CreateStudentProps) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    birth_date: "",
    weight: "",
    height: "",
    medical_restrictions: "",
  });
  
  const [goals, setGoals] = useState<string[]>([]);
  const [newGoal, setNewGoal] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log("Creating student for trainer:", trainerId);
      
      // Convert DD/MM/YYYY to YYYY-MM-DD if birth_date is provided
      let dbBirthDate = null;
      if (formData.birth_date) {
        // Check if it's already in YYYY-MM-DD format (from date input)
        if (formData.birth_date.includes('-')) {
          dbBirthDate = formData.birth_date;
        } else if (formData.birth_date.includes('/')) {
          // Convert DD/MM/YYYY to YYYY-MM-DD
          const [day, month, year] = formData.birth_date.split("/");
          if (day && month && year) {
            dbBirthDate = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
          }
        }
      }

      // Generate a more robust unique token
      const generateUniqueToken = () => {
        const timestamp = Date.now().toString(36);
        const randomStr = Math.random().toString(36).substring(2);
        return `${timestamp}-${randomStr}`;
      };

      const studentData = {
        personal_trainer_id: trainerId,
        name: formData.name.trim(),
        email: formData.email ? formData.email.trim() : null,
        phone: formData.phone ? formData.phone.trim() : null,
        birth_date: dbBirthDate,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        height: formData.height ? parseFloat(formData.height) : null,
        goals: goals.length > 0 ? goals : null,
        medical_restrictions: formData.medical_restrictions ? formData.medical_restrictions.trim() : null,
        unique_link_token: generateUniqueToken(),
        active: true,
      };

      console.log("Attempting to create student with data:", studentData);

      // Test connection first
      const { data: testData, error: testError } = await supabase
        .from("personal_trainers")
        .select("id, name")
        .eq("id", trainerId)
        .single();

      if (testError) {
        console.error("Trainer verification failed:", testError);
        toast({
          title: "Erro",
          description: "Personal trainer não encontrado. Faça login novamente.",
          variant: "destructive",
        });
        return;
      }

      console.log("Trainer verified:", testData);

      const { data, error } = await supabase
        .from("students")
        .insert(studentData)
        .select();

      if (error) {
        console.error("Database error details:", {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        
        toast({
          title: "Erro",
          description: `Erro ${error.code}: ${error.message}`,
          variant: "destructive",
        });
        return;
      }

      console.log("Student created successfully:", data);

      toast({
        title: "Sucesso!",
        description: `Aluno ${formData.name} cadastrado com sucesso!`,
      });

      onSuccess();
    } catch (error) {
      console.error("Error creating student:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg sm:text-xl">Cadastrar Novo Aluno</CardTitle>
          <Button variant="outline" size="sm" onClick={onClose} className="touch-target">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className="touch-target"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className="touch-target"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", formatPhone(e.target.value))}
                maxLength={15}
                placeholder="(11) 99999-9999"
                className="touch-target"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="birth_date">Data de Nascimento</Label>
              <Input
                id="birth_date"
                type="date"
                value={formData.birth_date}
                onChange={(e) => handleInputChange("birth_date", e.target.value)}
                max={new Date().toISOString().split('T')[0]} // Prevent future dates
                className="touch-target"
              />
            </div>
          </div>

          {/* Physical Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="weight">Peso (kg)</Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                min="1"
                max="300"
                value={formData.weight}
                onChange={(e) => handleInputChange("weight", e.target.value)}
                placeholder="70.5"
                className="touch-target"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="height">Altura (m)</Label>
              <Input
                id="height"
                type="number"
                step="0.01"
                min="0.5"
                max="2.5"
                value={formData.height}
                onChange={(e) => handleInputChange("height", e.target.value)}
                placeholder="1.75"
                className="touch-target"
              />
            </div>
          </div>

          {/* Goals */}
          <div className="space-y-2">
            <Label>Objetivos</Label>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                value={newGoal}
                onChange={(e) => setNewGoal(e.target.value)}
                placeholder="Ex: Perda de peso, Ganho de massa muscular"
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addGoal())}
                className="touch-target flex-1"
              />
              <Button type="button" onClick={addGoal} size="default" className="touch-target w-full sm:w-auto">
                <Plus className="h-4 w-4" />
                <span className="ml-2 sm:hidden">Adicionar</span>
              </Button>
            </div>
            
            {goals.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
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
            )}
          </div>

          {/* Medical Restrictions */}
          <div className="space-y-2">
            <Label htmlFor="medical_restrictions">Restrições Médicas</Label>
            <Textarea
              id="medical_restrictions"
              value={formData.medical_restrictions}
              onChange={(e) => handleInputChange("medical_restrictions", e.target.value)}
              placeholder="Descreva qualquer restrição médica, lesão ou cuidado especial..."
                className="touch-target"
              rows={3}
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-6">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 touch-target h-12">
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="flex-1 touch-target h-12" 
              disabled={isLoading || !formData.name}
            >
              {isLoading ? "Cadastrando..." : "Cadastrar Aluno"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default CreateStudent;