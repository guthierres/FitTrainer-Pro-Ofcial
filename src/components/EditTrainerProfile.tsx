import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { X, Plus, Key } from "lucide-react";
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
}

interface EditTrainerProfileProps {
  trainer: PersonalTrainer;
  onClose: () => void;
  onSuccess: (updatedTrainer: PersonalTrainer) => void;
}

const EditTrainerProfile = ({ trainer, onClose, onSuccess }: EditTrainerProfileProps) => {
  const [formData, setFormData] = useState({
    name: trainer.name || "",
    email: trainer.email || "",
    phone: trainer.phone || "",
    birth_date: trainer.birth_date || "",
    cref: trainer.cref || "",
    specializations: trainer.specializations || []
  });
  const [currentSpecialization, setCurrentSpecialization] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordData, setPasswordData] = useState({
    newPassword: "",
    confirmPassword: ""
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addSpecialization = () => {
    if (currentSpecialization.trim() && !formData.specializations.includes(currentSpecialization.trim())) {
      setFormData(prev => ({
        ...prev,
        specializations: [...prev.specializations, currentSpecialization.trim()]
      }));
      setCurrentSpecialization("");
    }
  };

  const removeSpecialization = (specToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      specializations: prev.specializations.filter(spec => spec !== specToRemove)
    }));
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    return value;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    handleInputChange('phone', formatted);
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem.",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: "Erro",
        description: "A senha deve ter pelo menos 6 caracteres.",
        variant: "destructive",
      });
      return;
    }

    setIsChangingPassword(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) throw error;

      toast({
        title: "Senha alterada!",
        description: "Sua senha foi alterada com sucesso.",
      });

      setShowPasswordDialog(false);
      setPasswordData({ newPassword: "", confirmPassword: "" });
    } catch (error) {
      console.error("Error changing password:", error);
      toast({
        title: "Erro",
        description: "Erro ao alterar senha. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from("personal_trainers")
        .update({
          name: formData.name,
          email: formData.email || null,
          phone: formData.phone || null,
          birth_date: formData.birth_date || null,
          cref: formData.cref || null,
          specializations: formData.specializations.length > 0 ? formData.specializations : null
        })
        .eq("id", trainer.id)
        .select()
        .single();

      if (error) throw error;

      // Update localStorage with new trainer data
      const updatedTrainer = { ...trainer, ...formData };
      localStorage.setItem("trainer", JSON.stringify(updatedTrainer));

      toast({
        title: "Perfil atualizado!",
        description: "Suas informações foram atualizadas com sucesso.",
      });

      onSuccess(updatedTrainer);
    } catch (error) {
      console.error("Error updating trainer:", error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar perfil. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto border-0 shadow-xl bg-card/95 backdrop-blur">
      <CardHeader className="pb-6">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              Editar Meu Perfil
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Atualize suas informações pessoais
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="hover-scale">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Básicas */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Informações Pessoais</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo *</Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cpf">CPF</Label>
                <Input
                  id="cpf"
                  type="text"
                  value={trainer.cpf}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  CPF não pode ser alterado
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  type="text"
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  placeholder="(00) 00000-0000"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="birth_date">Data de Nascimento</Label>
                <Input
                  id="birth_date"
                  type="date"
                  value={formData.birth_date}
                  onChange={(e) => handleInputChange('birth_date', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cref">CREF</Label>
                <Input
                  id="cref"
                  type="text"
                  value={formData.cref}
                  onChange={(e) => handleInputChange('cref', e.target.value)}
                  placeholder="Ex: 123456-G/SP"
                />
              </div>
            </div>
          </div>

          {/* Especializações */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Especializações</h3>
            
            <div className="flex gap-2">
              <Input
                type="text"
                value={currentSpecialization}
                onChange={(e) => setCurrentSpecialization(e.target.value)}
                placeholder="Ex: Musculação, Crossfit..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addSpecialization();
                  }
                }}
              />
              <Button
                type="button"
                onClick={addSpecialization}
                disabled={!currentSpecialization.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {formData.specializations.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.specializations.map((spec, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {spec}
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-destructive"
                      onClick={() => removeSpecialization(spec)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Botões */}
          <div className="flex flex-col sm:flex-row gap-3 pt-8 border-t">
            <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
              <DialogTrigger asChild>
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1 hover-scale"
                >
                  <Key className="h-4 w-4 mr-2" />
                  Alterar Senha
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Alterar Senha</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Nova Senha</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData(prev => ({
                        ...prev,
                        newPassword: e.target.value
                      }))}
                      placeholder="Digite sua nova senha"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData(prev => ({
                        ...prev,
                        confirmPassword: e.target.value
                      }))}
                      placeholder="Confirme sua nova senha"
                    />
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowPasswordDialog(false);
                        setPasswordData({ newPassword: "", confirmPassword: "" });
                      }}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="button"
                      onClick={handlePasswordChange}
                      disabled={isChangingPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                      className="flex-1"
                    >
                      {isChangingPassword ? "Alterando..." : "Alterar Senha"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose} 
              className="flex-1 hover-scale"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading} 
              className="flex-1 hover-scale bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
            >
              {isLoading ? "Atualizando..." : "Atualizar Perfil"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default EditTrainerProfile;