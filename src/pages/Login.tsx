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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log("Attempting login for:", email);
      
      // Authenticate with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError || !authData.user) {
        console.error("Auth error:", authError);
        toast({
          title: "Erro no login",
          description: "Email ou senha inválidos.",
          variant: "destructive",
        });
        return;
      }

      console.log("Authentication successful, user ID:", authData.user.id);
      
      // Get trainer data from database
      const { data: trainerData, error: trainerError } = await supabase
        .from("personal_trainers")
        .select("*")
        .eq("auth_user_id", authData.user.id)
        .single();

      if (trainerError || !trainerData) {
        console.error("Trainer data error:", trainerError);
        
        // Try to find trainer by email as fallback
        const { data: trainerByEmail, error: emailError } = await supabase
          .from("personal_trainers")
          .select("*")
          .eq("email", authData.user.email)
          .single();
          
        if (emailError || !trainerByEmail) {
          console.error("Trainer not found by email either:", emailError);
          toast({
            title: "Erro no login",
            description: "Personal trainer não encontrado. Entre em contato com o administrador.",
            variant: "destructive",
          });
          await supabase.auth.signOut();
          return;
        }
        
        // Update trainer with auth_user_id if found by email
        const { error: updateError } = await supabase
          .from("personal_trainers")
          .update({ auth_user_id: authData.user.id })
          .eq("id", trainerByEmail.id);
          
        if (updateError) {
          console.error("Error updating trainer auth_user_id:", updateError);
        }
        
        // Use the trainer found by email
        await setTrainerData(trainerByEmail);
      } else {
        await setTrainerData(trainerData);
      }

      async function setTrainerData(trainer: any) {
        console.log("Trainer found:", trainer.name, "Active:", trainer.active);
        
      // Check if trainer is active
        if (!trainer.active) {
        toast({
          title: "Conta inativa",
          description: "Sua conta está inativa. Entre em contato com o administrador.",
          variant: "destructive",
        });
        await supabase.auth.signOut();
        return;
      }
        
      // Store trainer info in localStorage
        localStorage.setItem("trainer", JSON.stringify(trainer));
      toast({
        title: "Login realizado com sucesso!",
          description: `Bem-vindo, ${trainer.name}!`,
      });
      navigate("/dashboard");
      }
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
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="touch-target"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="touch-target"
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full touch-target h-12"
              disabled={isLoading || !email || !password}
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