import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { X, Plus, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
// Importações necessárias para a correção
import { DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

interface CreatePersonalTrainerProps {
  onClose: () => void;
  onSuccess: () => void;
}

const CreatePersonalTrainer = ({ onClose, onSuccess }: CreatePersonalTrainerProps) => {
  const [formData, setFormData] = useState({
    name: "",
    cpf: "",
    email: "",
    phone: "",
    birth_date: "",
    cref: "",
  });

  const [specializations, setSpecializations] = useState<string[]>([]);
  const [newSpecialization, setNewSpecialization] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addSpecialization = () => {
    if (newSpecialization.trim() && !specializations.includes(newSpecialization.trim())) {
      setSpecializations(prev => [...prev, newSpecialization.trim()]);
      setNewSpecialization("");
    }
  };

  const removeSpecialization = (spec: string) => {
    setSpecializations(prev => prev.filter(s => s !== spec));
  };

  const formatCPF = (value: string) => {
    const numericValue = value.replace(/\D/g, "");
    return numericValue
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
      .slice(0, 14);
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

  const validateCPF = (cpf: string) => {
    const numericCPF = cpf.replace(/\D/g, "");
    return numericCPF.length === 11;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateCPF(formData.cpf)) {
      toast({
        title: "Erro de validação",
        description: "CPF deve ter 11 dígitos.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.email) {
      toast({
        title: "Erro de validação",
        description: "Email é obrigatório para criar conta de acesso.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Get current user session for authorization
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Erro",
          description: "Você precisa estar logado para criar um personal trainer.",
          variant: "destructive",
        });
        return;
      }

      // Prepare data for the edge function
      const requestData = {
        name: formData.name,
        cpf: formData.cpf.replace(/\D/g, ""),
        email: formData.email,
        phone: formData.phone || null,
        birth_date: formData.birth_date,
        cref: formData.cref || null,
        specializations: specializations.length > 0 ? specializations : [],
      };

      // Call the edge function to create the trainer
      const { data, error } = await supabase.functions.invoke('create-trainer', {
        body: requestData,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error("Error creating trainer:", error);
        toast({
          title: "Erro",
          description: error.message || "Não foi possível cadastrar o personal trainer.",
          variant: "destructive",
        });
        return;
      }

      if (!data.success) {
        toast({
          title: "Erro",
          description: data.error || "Não foi possível cadastrar o personal trainer.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Sucesso!",
        description: `Personal trainer ${formData.name} cadastrado com sucesso! Senha temporária: ${data.tempPassword}`,
      });

      onSuccess();
    } catch (error) {
      console.error("Error creating personal trainer:", error);
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
    <>
      {/* CORREÇÃO: Adicionando DialogTitle para acessibilidade. */}
      {/* O VisuallyHidden o esconde da tela, mas o torna disponível para leitores de tela. */}
      <VisuallyHidden asChild>
        <DialogTitle>Formulário de Cadastro de Personal Trainer</DialogTitle>
      </VisuallyHidden>
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Cadastrar Personal Trainer
            </CardTitle>
            <Button variant="outline" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informações Básicas */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Informações Básicas</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Nome completo do personal trainer"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF *</Label>
                  <Input
                    id="cpf"
                    value={formData.cpf}
                    onChange={(e) => handleInputChange("cpf", formatCPF(e.target.value))}
                    placeholder="000.000.000-00"
                    maxLength={14}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="email@exemplo.com"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Este email será usado para criar a conta de acesso
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", formatPhone(e.target.value))}
                    placeholder="(11) 99999-9999"
                    maxLength={15}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="birth_date">Data de Nascimento</Label>
                  <Input
                    id="birth_date"
                    type="date"
                    value={formData.birth_date}
                    onChange={(e) => handleInputChange("birth_date", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cref">Registro CREF</Label>
                  <Input
                    id="cref"
                    value={formData.cref}
                    onChange={(e) => handleInputChange("cref", e.target.value)}
                    placeholder="Ex: 123456-G/SP"
                  />
                </div>
              </div>
            </div>
            {/* Especializações */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Especializações</h3>
              <div className="flex gap-2">
                <Input
                  value={newSpecialization}
                  onChange={(e) => setNewSpecialization(e.target.value)}
                  placeholder="Ex: Musculação, Funcional, Pilates..."
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addSpecialization())}
                />
                <Button type="button" onClick={addSpecialization} size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {specializations.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {specializations.map((spec, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {spec}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => removeSpecialization(spec)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Informações de Acesso</h4>
              <p className="text-sm text-blue-700">
                Uma conta será criada automaticamente com o email fornecido.
                <br />
                <strong>Senha temporária:</strong> temp123456
                <br />
                O personal trainer deve alterar a senha no primeiro acesso.
              </p>
            </div>
            
            {/* Botões de Submissão */}
            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={isLoading || !formData.name || !formData.cpf || !formData.email}
              >
                {isLoading ? "Cadastrando..." : "Cadastrar Personal Trainer"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
};

export default CreatePersonalTrainer;
