import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface StudentTestCreatorProps {
  trainerId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const StudentTestCreator = ({ trainerId, onClose, onSuccess }: StudentTestCreatorProps) => {
  const [formData, setFormData] = useState({
    name: "Teste Aluno",
    email: "teste@email.com",
    phone: "(11) 99999-9999",
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>("");
  const { toast } = useToast();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const testBasicInsert = async () => {
    setIsLoading(true);
    setDebugInfo("Iniciando teste de inserção...\n");
    
    try {
      // First, verify trainer exists and is active
      const { data: trainerData, error: trainerError } = await supabase
        .from("personal_trainers")
        .select("id, name, active")
        .eq("id", trainerId)
        .single();

      if (trainerError || !trainerData) {
        setDebugInfo(prev => prev + `Erro: Personal trainer não encontrado\n${trainerError?.message || 'Trainer not found'}\n`);
        return;
      }

      if (!trainerData.active) {
        setDebugInfo(prev => prev + `Erro: Personal trainer está inativo\n`);
        return;
      }

      setDebugInfo(prev => prev + `✓ Personal trainer verificado: ${trainerData.name}\n`);

      // Generate a robust unique token
      const generateToken = () => {
        // Create a more unique and longer token for testing
        const timestamp = Date.now().toString(36);
        const randomStr1 = Math.random().toString(36).substring(2);
        const randomStr2 = Math.random().toString(36).substring(2);
        return `test-${timestamp}-${randomStr1}-${randomStr2}`;
      };

      const testData = {
        personal_trainer_id: trainerId,
        name: formData.name.trim(),
        email: formData.email.trim() || null,
        phone: formData.phone.trim() || null,
        birth_date: null,
        weight: null,
        height: null,
        goals: null,
        medical_restrictions: null,
        unique_link_token: generateToken(),
        active: true,
      };

      setDebugInfo(prev => prev + `\nDados a serem inseridos:\n${JSON.stringify(testData, null, 2)}\n\n`);

      console.log("Test data being inserted:", testData);

      // Try to insert with explicit RLS bypass for testing
      const { data, error } = await supabase
        .from("students")
        .insert(testData)
        .select();

      if (error) {
        console.error("Insert error:", error);
        setDebugInfo(prev => prev + `❌ Erro na inserção:\nCódigo: ${error.code}\nMensagem: ${error.message}\nDetalhes: ${error.details || 'N/A'}\nHint: ${error.hint || 'N/A'}\n`);
        
        toast({
          title: "Erro na inserção",
          description: `${error.message} (${error.code})`,
          variant: "destructive",
        });
        return;
      }

      console.log("Insert successful:", data);
      setDebugInfo(prev => prev + `✅ Sucesso!\nAluno criado:\n${JSON.stringify(data, null, 2)}\n`);

      toast({
        title: "Sucesso!",
        description: "Aluno de teste criado com sucesso!",
      });

      // Wait a moment to show success, then call onSuccess
      setTimeout(() => {
        onSuccess();
      }, 2000);

    } catch (error: any) {
      console.error("Catch error:", error);
      setDebugInfo(prev => prev + `❌ Erro na execução:\n${error.message || error.toString()}\n`);
      
      toast({
        title: "Erro inesperado",
        description: error.message || "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testTrainerExists = async () => {
    try {
      setDebugInfo("Verificando personal trainer...\n");
      
      const { data, error } = await supabase
        .from("personal_trainers")
        .select("id, name, active")
        .eq("id", trainerId)
        .single();

      if (error) {
        setDebugInfo(prev => prev + `❌ Erro ao verificar trainer:\n${error.message}\n`);
        return;
      }

      setDebugInfo(prev => prev + `✅ Personal Trainer encontrado:\nID: ${data.id}\nNome: ${data.name}\nAtivo: ${data.active}\n`);
    } catch (error: any) {
      setDebugInfo(prev => prev + `❌ Erro na verificação:\n${error.message}\n`);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Teste de Cadastro de Aluno
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Este é um componente de teste para diagnosticar problemas de cadastro.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Telefone</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => handleInputChange("phone", e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <Button onClick={testTrainerExists} variant="outline">
            Verificar Trainer
          </Button>
          <Button 
            onClick={testBasicInsert} 
            disabled={isLoading || !formData.name}
          >
            {isLoading ? "Testando..." : "Testar Inserção"}
          </Button>
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>

        {debugInfo && (
          <Card className="bg-muted">
            <CardContent className="p-4">
              <Label className="text-sm font-medium">Debug Info:</Label>
              <pre className="text-xs mt-2 whitespace-pre-wrap font-mono">
                {debugInfo}
              </pre>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
};

export default StudentTestCreator;