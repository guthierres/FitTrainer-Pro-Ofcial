import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { X, Check, Edit2 } from "lucide-react";
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
}

interface EditPersonalTrainerProps {
  trainer: PersonalTrainer;
  onClose: () => void;
  onSuccess: () => void;
}

const EditPersonalTrainer = ({ trainer, onClose, onSuccess }: EditPersonalTrainerProps) => {
  const [formData, setFormData] = useState({
    name: trainer.name,
    cpf: trainer.cpf,
    email: trainer.email || "",
    phone: trainer.phone || "",
    birth_date: trainer.birth_date || "",
    cref: trainer.cref || "",
    specializations: trainer.specializations || []
  });
  const [currentSpecialization, setCurrentSpecialization] = useState("");
  const [isLoading, setIsLoading] = useState(false);
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

  const removeSpecialization = (index: number) => {
    setFormData(prev => ({
      ...prev,
      specializations: prev.specializations.filter((_, i) => i !== index)
    }));
  };

  const formatCPF = (cpf: string) => {
    const cleanCPF = cpf.replace(/\D/g, '');
    if (cleanCPF.length <= 11) {
      return cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return cpf;
  };

  const handleCPFChange = (value: string) => {
    const formatted = formatCPF(value);
    if (formatted.replace(/\D/g, '').length <= 11) {
      handleInputChange('cpf', formatted);
    }
  };

  const formatPhone = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length <= 11) {
      if (cleanPhone.length <= 10) {
        return cleanPhone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
      } else {
        return cleanPhone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
      }
    }
    return phone;
  };

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhone(value);
    if (formatted.replace(/\D/g, '').length <= 11) {
      handleInputChange('phone', formatted);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const updateData = {
        name: formData.name,
        cpf: formData.cpf,
        email: formData.email || null,
        phone: formData.phone || null,
        birth_date: formData.birth_date || null,
        cref: formData.cref || null,
        specializations: formData.specializations.length > 0 ? formData.specializations : null,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from("personal_trainers")
        .update(updateData)
        .eq("id", trainer.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Personal trainer atualizado!",
        description: `${formData.name} foi atualizado com sucesso.`,
      });

      onSuccess();
    } catch (error: any) {
      console.error("Error updating personal trainer:", error);
      toast({
        title: "Erro ao atualizar",
        description: error.message || "Ocorreu um erro ao atualizar o personal trainer.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Edit2 className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">Editar Personal Trainer</h2>
            <p className="text-muted-foreground">
              Atualize as informações do personal trainer
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome Completo *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Digite o nome completo"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cpf">CPF *</Label>
            <Input
              id="cpf"
              value={formData.cpf}
              onChange={(e) => handleCPFChange(e.target.value)}
              placeholder="000.000.000-00"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="email@exemplo.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              placeholder="(00) 00000-0000"
            />
          </div>

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
              value={formData.cref}
              onChange={(e) => handleInputChange('cref', e.target.value)}
              placeholder="000000-G/UF"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Especializações</Label>
          <div className="flex gap-2">
            <Input
              value={currentSpecialization}
              onChange={(e) => setCurrentSpecialization(e.target.value)}
              placeholder="Digite uma especialização"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addSpecialization();
                }
              }}
            />
            <Button type="button" onClick={addSpecialization} variant="outline">
              <Check className="h-4 w-4" />
            </Button>
          </div>
          
          {formData.specializations.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.specializations.map((spec, index) => (
                <Badge key={index} variant="secondary" className="gap-1">
                  {spec}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => removeSpecialization(index)}
                  />
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading || !formData.name || !formData.cpf}>
            {isLoading ? "Atualizando..." : "Atualizar Personal Trainer"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EditPersonalTrainer;