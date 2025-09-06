import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dumbbell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const [cpf, setCpf] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const formatCPF = (value: string) => {
    const numericValue = value.replace(/\D/g, "");
    if (numericValue.length <= 11) {
      const formatted = numericValue.replace(
        /(\d{3})(\d{3})(\d{3})(\d{2})/,
        "$1.$2.$3-$4"
      );
      return formatted;
    }
    return value;
  };

  const formatBirthDate = (value: string) => {
    const numericValue = value.replace(/\D/g, "");
    if (numericValue.length <= 8) {
      const formatted = numericValue.replace(
        /(\d{2})(\d{2})(\d{4})/,
        "$1/$2/$3"
      );
      return formatted;
    }
    return value;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Remove formatting from CPF for database query (store as numbers only)
      const cleanCPF = cpf.replace(/\D/g, "");
      
      // Convert DD/MM/YYYY to YYYY-MM-DD for database query
      const [day, month, year] = birthDate.split("/");
      const dbBirthDate = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;

      console.log("Attempting login with:", { cleanCPF, dbBirthDate });

      const { data, error } = await supabase
        .from("personal_trainers")
        .select("*")
        .eq("cpf", cleanCPF)
        .eq("birth_date", dbBirthDate)
        .eq("active", true) // Only allow active trainers to login
        .single();

      if (error || !data) {
        console.error("Login error:", error);
        toast({
          title: "Erro no login",
          description: "CPF ou data de nascimento inválidos, ou personal trainer inativo.",
          variant: "destructive",
        });
        return;
      }

      // Store trainer info in localStorage
      localStorage.setItem("trainer", JSON.stringify(data));
      toast({
        title: "Login realizado com sucesso!",
        description: `Bem-vindo, ${data.name}!`,
      });
      navigate("/dashboard");
    } catch (error) {
      console.error("Login exception:", error);
      toast({
        title: "Erro no login",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10 p-4 safe-area-padding">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Dumbbell className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold text-primary">
            FitTrainer-Pro
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Sistema de gestão para personal trainers
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cpf">CPF</Label>
              <Input
                id="cpf"
                type="text"
                placeholder="000.000.000-00"
                value={cpf}
                onChange={(e) => setCpf(formatCPF(e.target.value))}
                maxLength={14}
                className="touch-target"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="birthDate">Data de Nascimento</Label>
              <Input
                id="birthDate"
                type="text"
                placeholder="DD/MM/AAAA"
                value={birthDate}
                onChange={(e) => setBirthDate(formatBirthDate(e.target.value))}
                maxLength={10}
                className="touch-target"
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full touch-target h-12"
              disabled={isLoading || !cpf || !birthDate}
            >
              {isLoading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;