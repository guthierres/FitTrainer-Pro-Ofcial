import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Apple, 
  CheckCircle,
  Clock,
  Target,
  User,
  Download,
  Utensils,
  ArrowLeft,
  Printer,
  Calendar,
  TrendingUp,
  Dumbbell
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Student {
  id: string;
  name: string;
  unique_link_token: string;
  personal_trainer_id: string;
}

interface MealFood {
  id: string;
  food_name: string;
  quantity: number;
  unit: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  notes?: string;
  isCompleted?: boolean;
}

interface Meal {
  id: string;
  name: string;
  time_of_day?: string;
  order_index: number;
  meal_foods: MealFood[];
  isCompleted?: boolean;
}

interface DietPlan {
  id: string;
  name: string;
  description?: string;
  daily_calories?: number;
  daily_protein?: number;
  daily_carbs?: number;
  daily_fat?: number;
  meals: Meal[];
  personal_trainer: {
    name: string;
    cref?: string;
  };
}

const StudentDiet = () => {
  const { token } = useParams<{ token: string }>();
  const [student, setStudent] = useState<Student | null>(null);
  const [dietPlan, setDietPlan] = useState<DietPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (token) {
      loadStudentData();
    }
  }, [token]);

  const loadStudentData = async () => {
    try {
      setIsLoading(true);

      // Get student by token
      const { data: studentData, error: studentError } = await supabase
        .from("students")
        .select("*")
        .eq("unique_link_token", token)
        .eq("active", true)
        .single();

      if (studentError || !studentData) {
        toast({
          title: "Erro",
          description: "Link inválido ou expirado.",
          variant: "destructive",
        });
        return;
      }

      setStudent(studentData);

      // Get active diet plan with meals and foods
      const { data: dietData, error: dietError } = await supabase
        .from("diet_plans")
        .select(`
          id,
          name,
          description,
          daily_calories,
          daily_protein,
          daily_carbs,
          daily_fat,
          personal_trainer:personal_trainers(name, cref),
          meals(
            id,
            name,
            time_of_day,
            order_index,
            meal_foods(
              id,
              food_name,
              quantity,
              unit,
              calories,
              protein,
              carbs,
              fat,
              notes
            )
          )
        `)
        .eq("student_id", studentData.id)
        .eq("active", true)
        .order("order_index", { foreignTable: "meals" })
        .single();

      if (dietError || !dietData) {
        toast({
          title: "Aviso",
          description: "Nenhuma dieta ativa encontrada.",
        });
        return;
      }

      // Check completed meals for today
      const today = new Date().toISOString().split('T')[0];
      const { data: completions } = await supabase
        .from("meal_completions")
        .select("meal_id")
        .eq("student_id", studentData.id)
        .gte("completed_at", `${today}T00:00:00`)
        .lt("completed_at", `${today}T23:59:59`);

      const completedMealIds = new Set(
        completions?.map(c => c.meal_id) || []
      );

      // Mark meals as completed
      dietData.meals.forEach((meal: any) => {
        meal.isCompleted = completedMealIds.has(meal.id);
        meal.meal_foods.forEach((food: any) => {
          food.isCompleted = meal.isCompleted;
        });
      });

      setDietPlan(dietData as any);

    } catch (error) {
      console.error("Error loading student data:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados da dieta.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const markMealAsCompleted = async (mealId: string) => {
    if (!student) return;

    try {
      const { error } = await supabase
        .from("meal_completions")
        .insert({
          meal_id: mealId,
          student_id: student.id,
        });

      if (error) {
        toast({
          title: "Erro",
          description: "Não foi possível marcar a refeição como consumida.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Parabéns! 🎉",
        description: "Refeição marcada como consumida!",
      });

      // Reload data to update completion status
      loadStudentData();
    } catch (error) {
      console.error("Error marking meal as completed:", error);
    }
  };

  const exportDiet = () => {
    if (!dietPlan || !student) return;

    const totalCalories = dietPlan.meals.reduce((total, meal) => 
      total + meal.meal_foods.reduce((mealTotal, food) => 
        mealTotal + (food.calories || 0), 0), 0);

   // Create HTML content for better formatting
   const htmlContent = `
   <!DOCTYPE html>
   <html>
   <head>
     <meta charset="UTF-8">
     <title>Dieta - ${student.name}</title>
     <style>
       body { 
         font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
         max-width: 800px; 
         margin: 0 auto; 
         padding: 30px;
         line-height: 1.6;
         color: #333;
         background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
       }
       .container {
         background: white;
         border-radius: 15px;
         padding: 30px;
         box-shadow: 0 10px 30px rgba(0,0,0,0.1);
       }
       .header { 
         text-align: center; 
         border-bottom: 3px solid #16a34a; 
         padding-bottom: 25px; 
         margin-bottom: 35px;
         background: linear-gradient(135deg, #16a34a, #22c55e);
         color: white;
         margin: -30px -30px 35px -30px;
         padding: 30px;
         border-radius: 15px 15px 0 0;
       }
       .header h1 {
         margin: 0 0 10px 0;
         font-size: 28px;
         font-weight: bold;
       }
       .header h2 {
         margin: 0 0 15px 0;
         font-size: 22px;
         opacity: 0.9;
       }
       .info-grid {
         display: grid;
         grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
         gap: 15px;
         margin: 20px 0;
       }
       .info-item {
         background: rgba(255,255,255,0.9);
         padding: 10px 15px;
         border-radius: 8px;
         border-left: 4px solid #16a34a;
       }
       .meal { 
         border: 2px solid #e5e7eb; 
         margin: 20px 0; 
         padding: 20px; 
         border-radius: 12px;
         background: linear-gradient(135deg, #f0fdf4, #ecfdf5);
         transition: all 0.3s ease;
       }
       .meal:hover {
         border-color: #16a34a;
         transform: translateY(-2px);
         box-shadow: 0 5px 15px rgba(22, 163, 74, 0.1);
       }
       .meal-header { 
         font-weight: bold; 
         font-size: 20px; 
         color: #16a34a;
         margin-bottom: 15px;
         display: flex;
         justify-content: space-between;
         align-items: center;
       }
       .food-item { 
         background: white; 
         margin: 12px 0; 
         padding: 15px; 
         border-radius: 8px;
         border-left: 3px solid #16a34a;
         box-shadow: 0 2px 4px rgba(0,0,0,0.05);
       }
       .macros { 
         display: grid; 
         grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); 
         gap: 12px;
         margin: 15px 0;
       }
       .macro-item { 
         text-align: center; 
         background: #f0fdf4; 
         padding: 12px; 
         border-radius: 8px;
         border: 1px solid #bbf7d0;
       }
       .macro-label {
         font-size: 12px;
         color: #6b7280;
         font-weight: 600;
         text-transform: uppercase;
         letter-spacing: 0.5px;
       }
       .macro-value {
         font-size: 16px;
         font-weight: bold;
         color: #16a34a;
         margin-top: 2px;
       }
       .status-completed { 
         color: #16a34a; 
         font-weight: bold;
         background: #dcfce7;
         padding: 5px 10px;
         border-radius: 20px;
         font-size: 14px;
       }
       .status-pending { 
         color: #ea580c; 
         font-weight: bold;
         background: #fed7aa;
         padding: 5px 10px;
         border-radius: 20px;
         font-size: 14px;
       }
       .footer { 
         text-align: center; 
         margin-top: 40px; 
         padding-top: 25px; 
         border-top: 2px solid #e5e7eb;
         color: #6b7280;
         background: #f9fafb;
         margin-left: -30px;
         margin-right: -30px;
         margin-bottom: -30px;
         padding: 25px 30px;
         border-radius: 0 0 15px 15px;
       }
       @media print {
         body { 
           margin: 0; 
           padding: 15px; 
           background: white;
         }
         .container {
           box-shadow: none;
           border: 1px solid #ddd;
         }
         .meal { 
           break-inside: avoid; 
           border: 1px solid #ddd;
           background: white;
         }
         .meal:hover {
           transform: none;
           box-shadow: none;
         }
       }
     </style>
   </head>
   <body>
     <div class="container">
       <div class="header">
         <h1>🍎 PLANO ALIMENTAR PERSONALIZADO</h1>
         <h2>${dietPlan.name}</h2>
         <div class="info-grid">
           <div class="info-item">
             <strong>Personal Trainer:</strong> ${dietPlan.personal_trainer.name}
           </div>
           ${dietPlan.personal_trainer.cref ? `
             <div class="info-item">
               <strong>CREF:</strong> ${dietPlan.personal_trainer.cref}
             </div>
           ` : ''}
           <div class="info-item">
             <strong>Aluno:</strong> ${student.name}
           </div>
           <div class="info-item">
             <strong>Data:</strong> ${new Date().toLocaleDateString('pt-BR')}
           </div>
         </div>
       </div>
     
       ${(dietPlan.daily_calories || dietPlan.daily_protein || dietPlan.daily_carbs || dietPlan.daily_fat) ? `
         <div style="background: linear-gradient(135deg, #f0fdf4, #ecfdf5); padding: 25px; border-radius: 12px; margin-bottom: 30px; border: 2px solid #bbf7d0;">
           <h3 style="color: #16a34a; margin-bottom: 20px; font-size: 20px; text-align: center;">🎯 OBJETIVOS NUTRICIONAIS DIÁRIOS</h3>
           <div class="macros">
             ${dietPlan.daily_calories ? `
               <div class="macro-item">
                 <div class="macro-label">Calorias</div>
                 <div class="macro-value">${dietPlan.daily_calories} kcal</div>
               </div>
             ` : ''}
             ${dietPlan.daily_protein ? `
               <div class="macro-item">
                 <div class="macro-label">Proteínas</div>
                 <div class="macro-value">${dietPlan.daily_protein}g</div>
               </div>
             ` : ''}
             ${dietPlan.daily_carbs ? `
               <div class="macro-item">
                 <div class="macro-label">Carboidratos</div>
                 <div class="macro-value">${dietPlan.daily_carbs}g</div>
               </div>
             ` : ''}
             ${dietPlan.daily_fat ? `
               <div class="macro-item">
                 <div class="macro-label">Gorduras</div>
                 <div class="macro-value">${dietPlan.daily_fat}g</div>
               </div>
             ` : ''}
           </div>
         </div>
       ` : ''}
     
       <div class="meals">
         ${dietPlan.meals.map((meal, index) => `
           <div class="meal">
             <div class="meal-header">
               <div>
                 <span style="color: #16a34a; font-size: 24px; margin-right: 10px;">${index + 1}.</span>
                 ${meal.name}
                 ${meal.time_of_day ? `<span style="color: #6b7280; font-size: 16px; margin-left: 10px;">🕐 ${meal.time_of_day}</span>` : ''}
               </div>
               <span class="${meal.isCompleted ? 'status-completed' : 'status-pending'}">
                 ${meal.isCompleted ? '✅ CONSUMIDA' : '⏳ PENDENTE'}
               </span>
             </div>
           
             ${meal.meal_foods.map(food => `
               <div class="food-item">
                 <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                   <strong style="font-size: 16px; color: #1f2937;">${food.food_name}</strong>
                   <span style="background: #dbeafe; color: #1e40af; padding: 4px 8px; border-radius: 12px; font-size: 14px; font-weight: 600;">
                     ${food.quantity}${food.unit}
                   </span>
                 </div>
                 ${(food.calories || food.protein || food.carbs || food.fat) ? `
                   <div class="macros" style="margin-top: 10px;">
                     ${food.calories ? `
                       <div class="macro-item">
                         <div class="macro-label">Calorias</div>
                         <div class="macro-value">${food.calories} kcal</div>
                       </div>
                     ` : ''}
                     ${food.protein ? `
                       <div class="macro-item">
                         <div class="macro-label">Proteína</div>
                         <div class="macro-value">${food.protein}g</div>
                       </div>
                     ` : ''}
                     ${food.carbs ? `
                       <div class="macro-item">
                         <div class="macro-label">Carboidratos</div>
                         <div class="macro-value">${food.carbs}g</div>
                       </div>
                     ` : ''}
                     ${food.fat ? `
                       <div class="macro-item">
                         <div class="macro-label">Gorduras</div>
                         <div class="macro-value">${food.fat}g</div>
                       </div>
                     ` : ''}
                   </div>
                 ` : ''}
                 ${food.notes ? `
                   <div style="margin-top: 12px; padding: 10px; background: #fffbeb; border-radius: 6px; border-left: 4px solid #f59e0b;">
                     <strong>📝 Observações:</strong> ${food.notes}
                   </div>
                 ` : ''}
               </div>
             `).join('')}
           </div>
         `).join('')}
       </div>
     
       <div style="background: linear-gradient(135deg, #16a34a, #22c55e); color: white; padding: 20px; border-radius: 12px; text-align: center; margin: 25px 0; box-shadow: 0 4px 12px rgba(22, 163, 74, 0.3);">
         <div style="font-size: 24px; font-weight: bold;">📊 TOTAL DO DIA: ${totalCalories} kcal</div>
       </div>
     
       <div class="footer">
         <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px;">
           <div><strong>Sistema:</strong> FitTrainer-Pro</div>
           <div><strong>Link da Dieta:</strong> ${window.location.origin}/student/${token}/diet</div>
           <div><strong>Gerado em:</strong> ${new Date().toLocaleString('pt-BR')}</div>
         </div>
         <p style="margin-top: 20px; font-size: 12px; opacity: 0.7;">
           Este documento foi gerado automaticamente pelo sistema FitTrainer-Pro
         </p>
       </div>
     </div>
   </body>
   </html>`;

   const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
   const link = document.createElement('a');
   link.href = url;
   link.download = `dieta-${student.name}-${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.html`;
   document.body.appendChild(link);
   link.click();
   document.body.removeChild(link);
    URL.revokeObjectURL(url);

   toast({
     title: "Dieta exportada!",
     description: "Arquivo HTML gerado com sucesso.",
   });
  };

  const printThermalDiet = () => {
    if (!dietPlan || !student) return;

    const totalCalories = dietPlan.meals.reduce((total, meal) => 
      total + meal.meal_foods.reduce((mealTotal, food) => 
        mealTotal + (food.calories || 0), 0), 0);

    const printContent = `
<html>
<head>
 <meta charset="UTF-8">
 <title>Comprovante Dieta - ${student.name}</title>
  <style>
    @media print {
      @page { 
        margin: 0; 
        size: 80mm auto;
      }
      body { 
        width: 80mm; 
        margin: 0; 
        padding: 2mm;
        font-family: 'Courier New', monospace; 
        font-size: 8px;
        line-height: 1.2;
        color: #000;
      }
      .center { text-align: center; }
      .bold { font-weight: bold; }
      .separator { 
        border-top: 1px dashed #000; 
        margin: 2mm 0; 
      }
      .small { font-size: 6px; }
      .meal { margin: 2mm 0; }
      .food-item { margin: 1mm 0 1mm 3mm; }
      .status-ok { color: #000; }
      .status-pending { color: #666; }
      .qr-section { 
        text-align: center; 
        margin: 3mm 0; 
        padding: 2mm;
        border: 1px solid #000;
      }
    }
  </style>
</head>
<body>
  <div class="center bold">
    ================================<br>
    COMPROVANTE DE DIETA<br>
    ================================
  </div>
  
  <div class="separator"></div>
  
  <div class="bold">Personal Trainer:</div>
  <div>${dietPlan.personal_trainer.name}</div>
  ${dietPlan.personal_trainer.cref ? `<div class="small">CREF: ${dietPlan.personal_trainer.cref}</div>` : ''}
  
  <div class="separator"></div>
  
  <div class="bold">Aluno:</div>
  <div>${student.name}</div>
  <div class="small">Token: ${student.unique_link_token.substring(0, 12)}...</div>
  
  <div class="separator"></div>
  
  <div class="bold">Plano Alimentar:</div>
  <div>${dietPlan.name}</div>
  <div class="small">Data: ${new Date().toLocaleDateString('pt-BR')}</div>
  <div class="small">Hora: ${new Date().toLocaleTimeString('pt-BR')}</div>
  
  <div class="separator"></div>
  
  <div class="bold">OBJETIVOS NUTRICIONAIS:</div>
  ${dietPlan.daily_calories ? `<div>Calorias: ${dietPlan.daily_calories} kcal</div>` : ''}
  ${dietPlan.daily_protein ? `<div>Proteínas: ${dietPlan.daily_protein}g</div>` : ''}
  ${dietPlan.daily_carbs ? `<div>Carboidratos: ${dietPlan.daily_carbs}g</div>` : ''}
  ${dietPlan.daily_fat ? `<div>Gorduras: ${dietPlan.daily_fat}g</div>` : ''}
  
  <div class="separator"></div>
  
  <div class="bold">REFEIÇÕES:</div>
  ${dietPlan.meals.map((meal, index) => `
    <div class="meal">
      <div class="bold">${index + 1}. ${meal.name}</div>
      ${meal.time_of_day ? `<div class="small">Horário: ${meal.time_of_day}</div>` : ''}
      <div class="small ${meal.isCompleted ? 'status-ok' : 'status-pending'}">
        ${meal.isCompleted ? '[X] CONSUMIDA' : '[ ] PENDENTE'}
      </div>
      
      <div style="margin-top: 1mm;">
        ${meal.meal_foods.map(food => `
          <div class="food-item">
            <div class="bold">${food.food_name}</div>
            <div class="small">Qtd: ${food.quantity}${food.unit}</div>
            ${food.calories ? `<div class="small">Cal: ${food.calories} kcal</div>` : ''}
            ${food.protein ? `<div class="small">Prot: ${food.protein}g</div>` : ''}
            ${food.carbs ? `<div class="small">Carb: ${food.carbs}g</div>` : ''}
            ${food.fat ? `<div class="small">Gord: ${food.fat}g</div>` : ''}
            ${food.notes ? `<div class="small">Obs: ${food.notes}</div>` : ''}
          </div>
        `).join('')}
      </div>
    </div>
  `).join('')}
  
  <div class="separator"></div>
  
  <div class="qr-section">
    <div class="bold">LINK DA DIETA:</div>
    <div class="small">${window.location.origin}/student/${token}/diet</div>
    <div class="small">Escaneie o QR Code ou digite o link</div>
  </div>
  
  <div class="bold center">Total do Dia: ${totalCalories} kcal</div>
  
 <div class="separator"></div>
 
 <div class="bold center">ASSINATURA:</div>
 <div class="center">
   <br>_____________________<br>
   <div class="small">Aluno</div>
   <br>_____________________<br>
   <div class="small">Personal Trainer</div>
 </div>
  <div class="separator"></div>
  
  <div class="bold center">ASSINATURAS:</div>
  <div class="separator"></div>
  
    <div class="small">Aluno: ${student.name}</div>
    Sistema: FitTrainer-Pro<br>
    Comprovante válido<br>
    <div class="small">Personal: ${dietPlan.personal_trainer.name}</div>
  </div>
  
  <div class="separator"></div>
    window.onload = function() {
      window.print();
      window.onafterprint = function() {
        window.close();
      }
    }
  </script>
</body>
</html>`;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Apple className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
          <p>Carregando sua dieta...</p>
        </div>
      </div>
    );
  }

  if (!student || !dietPlan) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/30">
        <Card className="max-w-md mx-4 shadow-lg">
          <CardContent className="text-center p-8 space-y-4">
            <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
              <Apple className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Dieta não encontrada</h3>
              <p className="text-muted-foreground text-sm">
                Nenhuma dieta ativa foi encontrada para este link ou o link pode estar inválido.
              </p>
            </div>
            <div className="flex flex-col gap-2 pt-4">
              <Button 
                onClick={() => window.history.back()}
                variant="default"
                className="w-full"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <Button 
                onClick={() => window.location.href = '/'}
                variant="outline"
                className="w-full"
              >
                Ir para Início
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalDayCalories = dietPlan.meals.reduce((total, meal) => 
    total + meal.meal_foods.reduce((mealTotal, food) => 
      mealTotal + (food.calories || 0), 0), 0);

  const completedMeals = dietPlan.meals.filter(meal => meal.isCompleted).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 safe-area-padding">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/10 rounded-full flex-shrink-0">
                <Apple className="h-5 w-5 sm:h-6 sm:w-6 text-success" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-primary">FitTrainer-Pro</h1>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span className="truncate">{student.name} - Plano Alimentar</span>
                  <Calendar className="h-4 w-4 ml-2" />
                  <span className="hidden sm:inline">{new Date().toLocaleDateString('pt-BR')}</span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-2 w-full sm:w-auto">
              <Button 
                onClick={() => window.location.href = `/student/${token}`}
                variant="secondary" 
                size="sm"
                className="text-xs sm:text-sm h-9 sm:h-10 touch-target"
              >
                <Dumbbell className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Treino</span>
                <span className="sm:hidden">Tre</span>
              </Button>
              <Button 
                onClick={exportDiet} 
                variant="outline" 
                size="sm"
                className="text-xs sm:text-sm h-9 sm:h-10 touch-target"
              >
                <Download className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Export</span>
                <span className="sm:hidden">Exp</span>
              </Button>
              <Button 
                onClick={printThermalDiet} 
                variant="default" 
                size="sm"
                className="text-xs sm:text-sm h-9 sm:h-10 bg-primary hover:bg-primary/90 touch-target"
              >
                <Printer className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Print</span>
                <span className="sm:hidden">Prt</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-3 lg:px-4 py-4 lg:py-6">
        {/* Diet Plan Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-success" />
              {dietPlan.name}
            </CardTitle>
            {dietPlan.description && (
              <p className="text-muted-foreground">{dietPlan.description}</p>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Personal Trainer: <strong>{dietPlan.personal_trainer.name}</strong>
              {dietPlan.personal_trainer.cref && (
                <span> - CREF: {dietPlan.personal_trainer.cref}</span>
              )}
            </p>
            
            {/* Nutritional Goals */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {dietPlan.daily_calories && (
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-base sm:text-lg font-bold text-primary">{dietPlan.daily_calories}</p>
                  <p className="text-xs text-muted-foreground">kcal/dia</p>
                </div>
              )}
              {dietPlan.daily_protein && (
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-base sm:text-lg font-bold text-secondary">{dietPlan.daily_protein}g</p>
                  <p className="text-xs text-muted-foreground">Proteínas</p>
                </div>
              )}
              {dietPlan.daily_carbs && (
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-base sm:text-lg font-bold text-warning">{dietPlan.daily_carbs}g</p>
                  <p className="text-xs text-muted-foreground">Carboidratos</p>
                </div>
              )}
              {dietPlan.daily_fat && (
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-base sm:text-lg font-bold text-destructive">{dietPlan.daily_fat}g</p>
                  <p className="text-xs text-muted-foreground">Gorduras</p>
                </div>
              )}
            </div>

            {/* Progress Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-gradient-to-r from-primary/5 to-success/5 rounded-lg border border-primary/10">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <TrendingUp className="h-4 w-4 text-success" />
                  <p className="text-sm text-muted-foreground">Progresso Hoje</p>
                </div>
                <p className="font-bold text-base sm:text-lg text-success">
                  {completedMeals} / {dietPlan.meals.length}
                </p>
                <p className="text-xs text-muted-foreground">refeições consumidas</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Target className="h-4 w-4 text-primary" />
                  <p className="text-sm text-muted-foreground">Calorias do Dia</p>
                </div>
                <p className="font-bold text-base sm:text-lg text-primary">{totalDayCalories}</p>
                <p className="text-xs text-muted-foreground">kcal calculadas</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <CheckCircle className="h-4 w-4 text-secondary" />
                  <p className="text-sm text-muted-foreground">Taxa de Sucesso</p>
                </div>
                <p className="font-bold text-base sm:text-lg text-secondary">
                  {Math.round((completedMeals / dietPlan.meals.length) * 100)}%
                </p>
                <p className="text-xs text-muted-foreground">concluído hoje</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Meals */}
        <div className="space-y-4">
          {dietPlan.meals.map((meal, index) => (
            <Card key={meal.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Utensils className="h-5 w-5 text-secondary" />
                    <CardTitle className="text-lg">{meal.name}</CardTitle>
                    {meal.time_of_day && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {meal.time_of_day}
                      </div>
                    )}
                    {meal.isCompleted && (
                      <Badge className="bg-success text-success-foreground">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Consumida
                      </Badge>
                    )}
                  </div>
                  
                  {!meal.isCompleted && (
                    <Button
                      onClick={() => markMealAsCompleted(meal.id)}
                      size="default" 
                      className="bg-success hover:bg-success/90 text-success-foreground h-10 sm:h-12 text-xs sm:text-sm font-medium touch-target"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Marcar como Consumida</span>
                      <span className="sm:hidden">Feito</span>
                    </Button>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                {meal.meal_foods.map((food, foodIndex) => (
                  <div key={food.id} className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h4 className="font-medium">{food.food_name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Quantidade: <strong>{food.quantity}{food.unit}</strong>
                        </p>
                        
                        {(food.calories || food.protein || food.carbs || food.fat) && (
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                            {food.calories && (
                              <div>
                                <span className="text-muted-foreground">Kcal:</span>
                                <span className="ml-1 font-medium">{food.calories}</span>
                              </div>
                            )}
                            {food.protein && (
                              <div>
                                <span className="text-muted-foreground">Prot:</span>
                                <span className="ml-1 font-medium">{food.protein}g</span>
                              </div>
                            )}
                            {food.carbs && (
                              <div>
                                <span className="text-muted-foreground">Carb:</span>
                                <span className="ml-1 font-medium">{food.carbs}g</span>
                              </div>
                            )}
                            {food.fat && (
                              <div>
                                <span className="text-muted-foreground">Gord:</span>
                                <span className="ml-1 font-medium">{food.fat}g</span>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {food.notes && (
                          <p className="text-sm text-muted-foreground">
                            <strong>Obs:</strong> {food.notes}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {foodIndex < meal.meal_foods.length - 1 && (
                      <Separator className="my-2" />
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StudentDiet;