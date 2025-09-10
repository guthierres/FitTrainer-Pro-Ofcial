import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Calendar, CreditCard, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PersonalTrainer {
  id: string;
  name: string;
  cpf: string;
  email?: string;
  phone?: string;
  birth_date?: string;
  cref?: string;
  specializations?: string[];
  active: boolean;
  created_at: string;
}

interface PersonalTrainerTestLoginProps {
  onClose: () => void;
}

const PersonalTrainerTestLogin = ({ onClose }: PersonalTrainerTestLoginProps) => {
  const [trainers, setTrainers] = useState<PersonalTrainer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadTrainers();
  }, []);

  const loadTrainers = async () => {
    try {
      console.log("Loading trainers for test login...");
      
      const { data, error } = await supabase
        .from("personal_trainers")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading trainers:", error);
        toast({
          title: "Erro",
          description: "Erro ao carregar personal trainers.",
          variant: "destructive",
        });
        return;
      }
      
      setTrainers(data || []);
      console.log("Trainers loaded successfully:", data?.length || 0);
    } catch (error) {
      console.error("Error loading trainers:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar personal trainers.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatCPF = (cpf: string) => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  };

  const formatBirthDate = (dateString: string | undefined) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR");
  };

  const testLogin = (trainer: PersonalTrainer) => {
    const loginData = {
      email: trainer.email || 'N/A',
      password: 'temp123456'
    };

    toast({
      title: "Dados para teste de login",
      description: `Email: ${loginData.email} | Senha: ${loginData.password}`,
    });

    // Copy login data to clipboard
    const loginText = `Email: ${loginData.email}\nSenha: ${loginData.password}`;
    navigator.clipboard.writeText(loginText);
    
    toast({
      title: "Dados copiados!",
      description: "Os dados de login foram copiados para a área de transferência.",
    });
  };

  if (isLoading) {
    return (
      <Card className="w-full max-w-4xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Personal Trainers Cadastrados - Teste de Login
          </CardTitle>
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Clique em "Testar Login" para copiar os dados de acesso de cada personal trainer.
          </p>
          
          {trainers.length === 0 ? (
            <div className="text-center py-8">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum personal trainer cadastrado.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {trainers.map((trainer) => (
                <Card key={trainer.id} className="border-2">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold">{trainer.name}</h3>
                          <Badge variant={trainer.active ? "default" : "secondary"}>
                            {trainer.active ? "Ativo" : "Inativo"}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span><strong>Email:</strong> {trainer.email || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                            <span><strong>CPF:</strong> {formatCPF(trainer.cpf)}</span>
                          </div>
                        </div>
                        
                        {trainer.cref && (
                          <p className="text-sm"><strong>CREF:</strong> {trainer.cref}</p>
                        )}
                        <div className="text-xs text-muted-foreground">
                          <strong>Senha padrão:</strong> temp123456
                        </div>
                      </div>
                      
                      <Button 
                        onClick={() => testLogin(trainer)}
                        variant="outline"
                        disabled={!trainer.active}
                      >
                        {trainer.active ? "Copiar Dados de Login" : "Trainer Inativo"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PersonalTrainerTestLogin;