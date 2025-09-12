import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { setStudentContext, verifyStudentAccess } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, Clock, Apple, Dumbbell, User, Printer } from 'lucide-react';
import { X } from 'lucide-react';

interface Student {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  weight: number | null;
  height: number | null;
  goals: string[] | null;
  student_number: string;
  personal_trainer_id: string;
}

interface PersonalTrainer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  cref: string | null;
}

interface DietPlan {
  id: string;
  name: string;
  description: string | null;
  daily_calories: number | null;
  daily_protein: number | null;
  daily_carbs: number | null;
  daily_fat: number | null;
  active: boolean;
}

interface Meal {
  id: string;
  name: string;
  time_of_day: string | null;
  order_index: number;
  meal_foods: MealFood[];
}

interface MealFood {
  id: string;
  food_name: string;
  quantity: number;
  unit: string;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  notes: string | null;
}

interface WorkoutPlan {
  id: string;
  name: string;
  description: string | null;
  frequency_per_week: number;
  duration_weeks: number;
  active: boolean;
  workout_sessions: WorkoutSession[];
}

interface WorkoutSession {
  id: string;
  name: string;
  day_of_week: number;
  description: string | null;
  workout_exercises: WorkoutExercise[];
}

interface WorkoutExercise {
  id: string;
  sets: number;
  reps_min: number | null;
  reps_max: number | null;
  weight_kg: number | null;
  rest_seconds: number | null;
  order_index: number;
  notes: string | null;
  exercises: {
    name: string;
    description: string | null;
    instructions: string | null;
    muscle_groups: string[] | null;
    equipment: string[] | null;
  };
}

export default function StudentDiet() {
  const { studentNumber } = useParams<{ studentNumber: string }>();
  const [student, setStudent] = useState<Student | null>(null);
  const [trainer, setTrainer] = useState<PersonalTrainer | null>(null);
  const [dietPlan, setDietPlan] = useState<DietPlan | null>(null);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [completedMeals, setCompletedMeals] = useState<Set<string>>(new Set());
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    if (studentNumber) {
      fetchStudentData();
    }
  }, [studentNumber]);

  const fetchStudentData = async () => {
    try {
      console.log("🔍 Carregando dados do aluno (sem RLS):", studentNumber);
      
      // Verify student access directly
      const verification = await verifyStudentAccess(studentNumber);
      if (!verification.success) {
        console.error("❌ Aluno não encontrado:", verification.error);
        toast({
          title: "Erro",
          description: verification.error || "Número do aluno inválido.",
          variant: "destructive",
        });
        return;
      }

      const studentData = verification.student;
      console.log("✅ Aluno verificado:", studentData);
      
      // Fetch complete student data with trainer info
      const { data: completeStudentData, error: completeError } = await supabase
        .from('students')
        .select(`
          *,
          personal_trainers (
            id, name, email, phone, cref
          )
        `)
        .eq('id', studentData.id)
        .single();

      if (completeError || !completeStudentData) {
        console.error("❌ Erro ao buscar dados completos:", completeError);
        throw completeError || new Error('Dados completos não encontrados');
      }

      setStudent(completeStudentData);
      if (completeStudentData.personal_trainers) {
        setTrainer(completeStudentData.personal_trainers);
      }
      console.log("✅ Dados completos carregados:", completeStudentData);

      // Fetch diet plan
      const { data: dietData, error: dietError } = await supabase
        .from('diet_plans')
        .select(`
          *,
          meals (
            *,
            meal_foods (*)
          )
        `)
        .eq('student_id', completeStudentData.id)
        .eq('active', true)
        .single();

      if (dietData && !dietError) {
        setDietPlan(dietData);
        setMeals(dietData.meals?.sort((a: Meal, b: Meal) => a.order_index - b.order_index) || []);
        console.log("🍎 Plano de dieta carregado");
      }

      // Fetch workout plan
      const { data: workoutData, error: workoutError } = await supabase
        .from('workout_plans')
        .select(`
          *,
          workout_sessions (
            *,
            workout_exercises (
              *,
              exercises (
                name, description, instructions, muscle_groups, equipment
              )
            )
          )
        `)
        .eq('student_id', completeStudentData.id)
        .eq('active', true)
        .single();

      if (workoutData && !workoutError) {
        setWorkoutPlan(workoutData);
        console.log("💪 Plano de treino carregado");
      }

      // Fetch completed meals for today
      const today = new Date().toISOString().split('T')[0];
      const { data: mealCompletions } = await supabase
        .from('meal_completions')
        .select('meal_id')
        .eq('student_id', completeStudentData.id)
        .gte('completed_at', `${today}T00:00:00`)
        .lt('completed_at', `${today}T23:59:59`);

      if (mealCompletions) {
        setCompletedMeals(new Set(mealCompletions.map(c => c.meal_id)));
      }

      // Fetch completed exercises for today
      const { data: exerciseCompletions } = await supabase
        .from('exercise_completions')
        .select('workout_exercise_id')
        .eq('student_id', completeStudentData.id)
        .gte('completed_at', `${today}T00:00:00`)
        .lt('completed_at', `${today}T23:59:59`);

      if (exerciseCompletions) {
        setCompletedExercises(new Set(exerciseCompletions.map(c => c.workout_exercise_id)));
      }

    } catch (error) {
      console.error('❌ Erro geral:', error);
      toast({
        title: "Erro",
        description: "Erro interno. Tente novamente ou entre em contato com seu personal trainer.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMealCompletion = async (mealId: string) => {
    if (!student) return;

    try {
      if (completedMeals.has(mealId)) {
        // Remove completion
        const { error } = await supabase
          .from('meal_completions')
          .delete()
          .eq('meal_id', mealId)
          .eq('student_id', student.id);

        if (error) throw error;

        setCompletedMeals(prev => {
          const newSet = new Set(prev);
          newSet.delete(mealId);
          return newSet;
        });
      } else {
        // Add completion
        const { error } = await supabase
          .from('meal_completions')
          .insert({
            meal_id: mealId,
            student_id: student.id,
          });

        if (error) throw error;

        setCompletedMeals(prev => new Set([...prev, mealId]));
      }
    } catch (error) {
      console.error('Error updating meal completion:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar refeição",
        variant: "destructive",
      });
    }
  };

  const handleExerciseCompletion = async (exerciseId: string) => {
    if (!student) return;

    try {
      if (completedExercises.has(exerciseId)) {
        // Remove completion
        const { error } = await supabase
          .from('exercise_completions')
          .delete()
          .eq('workout_exercise_id', exerciseId)
          .eq('student_id', student.id);

        if (error) throw error;

        setCompletedExercises(prev => {
          const newSet = new Set(prev);
          newSet.delete(exerciseId);
          return newSet;
        });
      } else {
        // Add completion
        const { error } = await supabase
          .from('exercise_completions')
          .insert({
            workout_exercise_id: exerciseId,
            student_id: student.id,
          });

        if (error) throw error;

        setCompletedExercises(prev => new Set([...prev, exerciseId]));
      }
    } catch (error) {
      console.error('Error updating exercise completion:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar exercício",
        variant: "destructive",
      });
    }
  };

  const handlePrint = () => {
    generateThermalDietPDF();
  };

  const generateThermalDietPDF = () => {
    if (!dietPlan || !student) return;

    try {
      import('jspdf').then(({ jsPDF }) => {
        // Thermal printer format (80mm width)
        const doc = new jsPDF({
          unit: 'mm',
          format: [80, 200] // 80mm width, auto height
        });

        // Configure font
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        
        let y = 5;
        const lineHeight = 4;
        const centerX = 40;
        const margin = 3;

        // Header
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("FITTRAINER-PRO", centerX, y, { align: "center" });
        y += lineHeight;
        
        doc.setFontSize(10);
        doc.text("PLANO ALIMENTAR", centerX, y, { align: "center" });
        y += lineHeight;
        
        doc.setFontSize(8);
        doc.text("================================", centerX, y, { align: "center" });
        y += lineHeight * 1.5;

        // Student info
        doc.setFont("helvetica", "bold");
        doc.text("DADOS DO ALUNO", margin, y);
        y += lineHeight;
        
        doc.setFont("helvetica", "normal");
        doc.text(`Nome: ${student.name}`, margin, y);
        y += lineHeight;
        doc.text(`Numero: ${student.student_number}`, margin, y);
        y += lineHeight;
        doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, margin, y);
        y += lineHeight;
        doc.text(`Hora: ${new Date().toLocaleTimeString('pt-BR')}`, margin, y);
        y += lineHeight * 1.5;

        // Trainer info
        if (trainer) {
          doc.setFont("helvetica", "bold");
          doc.text("PERSONAL TRAINER", margin, y);
          y += lineHeight;
          
          doc.setFont("helvetica", "normal");
          doc.text(`Nome: ${trainer.name}`, margin, y);
          y += lineHeight;
          if (trainer.cref) {
            doc.text(`CREF: ${trainer.cref}`, margin, y);
            y += lineHeight;
          }
          if (trainer.phone) {
            doc.text(`Tel: ${trainer.phone}`, margin, y);
            y += lineHeight;
          }
          y += lineHeight;
        }

        // Diet plan info
        doc.text("--------------------------------", centerX, y, { align: "center" });
        y += lineHeight;
        
        doc.setFont("helvetica", "bold");
        doc.text("PLANO ALIMENTAR", margin, y);
        y += lineHeight;
        
        doc.setFont("helvetica", "normal");
        doc.text(`Nome: ${dietPlan.name}`, margin, y);
        y += lineHeight;
        
        if (dietPlan.description) {
          const descLines = doc.splitTextToSize(dietPlan.description, 74);
          doc.text(`Desc: ${descLines[0]}`, margin, y);
          y += lineHeight;
          if (descLines.length > 1) {
            doc.text(`      ${descLines[1]}`, margin, y);
            y += lineHeight;
          }
        }
        y += lineHeight;

        // Daily goals
        if (dietPlan.daily_calories || dietPlan.daily_protein || dietPlan.daily_carbs || dietPlan.daily_fat) {
          doc.setFont("helvetica", "bold");
          doc.text("METAS DIARIAS", margin, y);
          y += lineHeight;
          
          doc.setFont("helvetica", "normal");
          if (dietPlan.daily_calories) {
            doc.text(`Calorias: ${dietPlan.daily_calories} kcal`, margin, y);
            y += lineHeight;
          }
          if (dietPlan.daily_protein) {
            doc.text(`Proteina: ${dietPlan.daily_protein}g`, margin, y);
            y += lineHeight;
          }
          if (dietPlan.daily_carbs) {
            doc.text(`Carboidratos: ${dietPlan.daily_carbs}g`, margin, y);
            y += lineHeight;
          }
          if (dietPlan.daily_fat) {
            doc.text(`Gordura: ${dietPlan.daily_fat}g`, margin, y);
            y += lineHeight;
          }
          y += lineHeight;
        }

        doc.text("================================", centerX, y, { align: "center" });
        y += lineHeight;

        // Meals
        if (meals.length > 0) {
          doc.setFont("helvetica", "bold");
          doc.text("REFEICOES DO DIA", centerX, y, { align: "center" });
          y += lineHeight * 1.5;
          
          meals.forEach((meal, mealIndex) => {
            // Check if we need a new page
            if (y > 280) {
              doc.addPage();
              y = 10;
            }
            
            doc.text("--------------------------------", centerX, y, { align: "center" });
            y += lineHeight;
            
            doc.setFont("helvetica", "bold");
            doc.text(`${mealIndex + 1}. ${meal.name.toUpperCase()}`, margin, y);
            y += lineHeight;
            
            if (meal.time_of_day) {
              doc.setFont("helvetica", "normal");
              doc.text(`Horario: ${meal.time_of_day}`, margin, y);
              y += lineHeight;
            }
            
            doc.text("- - - - - - - - - - - - - - - - -", centerX, y, { align: "center" });
            y += lineHeight;
            
            // Foods
            meal.meal_foods.forEach((food, foodIndex) => {
              doc.setFont("helvetica", "normal");
              
              // Food name and quantity
              const foodLine = `${foodIndex + 1}. ${food.quantity}${food.unit} ${food.food_name}`;
              const foodLines = doc.splitTextToSize(foodLine, 74);
              
              foodLines.forEach((line: string, lineIndex: number) => {
                doc.text(line, margin, y);
                y += lineHeight;
              });
              
              // Calories
              if (food.calories) {
                doc.text(`   Calorias: ${food.calories} kcal`, margin, y);
                y += lineHeight;
              }
              
              // Macros
              if (food.protein || food.carbs || food.fat) {
                let macros = "   Macros: ";
                if (food.protein) macros += `P:${food.protein}g `;
                if (food.carbs) macros += `C:${food.carbs}g `;
                if (food.fat) macros += `G:${food.fat}g`;
                doc.text(macros, margin, y);
                y += lineHeight;
              }
              
              // Notes
              if (food.notes) {
                const noteLines = doc.splitTextToSize(`   Obs: ${food.notes}`, 74);
                noteLines.forEach((line: string) => {
                  doc.text(line, margin, y);
                  y += lineHeight;
                });
              }
              
              y += lineHeight * 0.5;
            });
            
            y += lineHeight;
          });
        }

        // Footer
        y += lineHeight;
        doc.text("================================", centerX, y, { align: "center" });
        y += lineHeight;
        
        doc.setFont("helvetica", "bold");
        doc.text("INFORMACOES DO SISTEMA", centerX, y, { align: "center" });
        y += lineHeight;
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.text(`Sistema: FitTrainer-Pro v1.0`, margin, y);
        y += lineHeight;
        doc.text(`Link: ${window.location.origin}/student/${studentNumber}/diet`, margin, y);
        y += lineHeight;
        doc.text(`Gerado: ${new Date().toLocaleString('pt-BR')}`, margin, y);
        y += lineHeight * 2;
        
        doc.text("================================", centerX, y, { align: "center" });
        y += lineHeight;
        doc.text("Assinatura do Personal Trainer", centerX, y, { align: "center" });
        y += lineHeight * 2;
        doc.text("_______________________________", centerX, y, { align: "center" });
        y += lineHeight;
        doc.text(trainer?.name || 'Personal Trainer', centerX, y, { align: "center" });
        y += lineHeight;
        doc.text(trainer?.cref || 'CREF: N/A', centerX, y, { align: "center" });

        // Save PDF
        const fileName = `FitTrainer-Pro_Dieta_Termica_${student.name.replace(/\s+/g, '_')}_${new Date().toLocaleDateString("pt-BR").replace(/\//g, "-")}.pdf`;
        doc.save(fileName);
        
        toast({
          title: "📄 Dieta exportada!",
          description: "Arquivo PDF térmico gerado com sucesso.",
        });
      }).catch(() => {
        toast({
          title: "Erro",
          description: "Não foi possível gerar o PDF. Tente novamente.",
          variant: "destructive"
        });
      });
    } catch (error) {
      console.error("Error generating thermal PDF:", error);
      toast({
        title: "Erro",
        description: "Erro ao gerar PDF térmico.",
        variant: "destructive"
      });
    }
  };

  const printThermalDiet = () => {
    if (!dietPlan || !student) return;

    try {
      // Criar conteúdo para impressora térmica (80mm)
      const thermalContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Comprovante Dieta - ${student.name}</title>
  <style>
    @page { 
      size: 80mm auto; 
      margin: 0; 
    }
    
    body { 
      width: 80mm; 
      margin: 0; 
      padding: 3mm; 
      font-family: 'Courier New', monospace; 
      font-size: 9px; 
      line-height: 1.3; 
      color: #000; 
      background: white;
    }
    
    .center { text-align: center; }
    .bold { font-weight: bold; }
    .separator { 
      border-top: 1px dashed #000; 
      margin: 3mm 0; 
      width: 100%;
    }
    .small { font-size: 7px; }
    .meal { 
      margin: 2mm 0; 
      padding: 1mm 0;
      border-bottom: 1px dotted #ccc;
    }
    .meal-header { 
      font-weight: bold; 
      font-size: 10px; 
      margin-bottom: 1mm;
    }
    .food-item { 
      margin: 1mm 0; 
      padding-left: 2mm;
    }
    .status-ok { font-weight: bold; }
    .status-pending { color: #666; }
    .header-box {
      border: 2px solid #000;
      padding: 2mm;
      margin-bottom: 3mm;
    }
    .footer-box {
      border: 1px solid #000;
      padding: 2mm;
      margin-top: 3mm;
      background: #f5f5f5;
    }
  </style>
</head>
<body>
  <div class="header-box center">
    <div class="bold" style="font-size: 12px;">FITTRAINER-PRO</div>
    <div class="bold" style="font-size: 10px;">PLANO ALIMENTAR</div>
    <div class="separator"></div>
    <div class="small">Data: ${new Date().toLocaleDateString("pt-BR")}</div>
    <div class="small">Hora: ${new Date().toLocaleTimeString("pt-BR")}</div>
  </div>
  
  <div class="bold">PERSONAL TRAINER:</div>
  <div>${trainer?.name || 'N/A'}</div>
  ${trainer?.cref ? `<div class="small">CREF: ${trainer.cref}</div>` : ""}
  ${trainer?.phone ? `<div class="small">Tel: ${trainer.phone}</div>` : ""}
  
  <div class="separator"></div>
  
  <div class="bold">DADOS DO ALUNO:</div>
  <div>Nome: ${student.name}</div>
  <div class="small">Numero: ${student.student_number}</div>
  ${student.weight ? `<div class="small">Peso: ${student.weight}kg</div>` : ""}
  ${student.height ? `<div class="small">Altura: ${student.height}m</div>` : ""}
  
  <div class="separator"></div>
  
  <div class="bold">PLANO ALIMENTAR:</div>
  <div>${dietPlan.name}</div>
  ${dietPlan.description ? `<div class="small">Desc: ${dietPlan.description}</div>` : ""}
  
  ${(dietPlan.daily_calories || dietPlan.daily_protein || dietPlan.daily_carbs || dietPlan.daily_fat) ? `
  <div class="separator"></div>
  <div class="bold center">METAS DIARIAS</div>
  ${dietPlan.daily_calories ? `<div>Calorias: ${dietPlan.daily_calories} kcal</div>` : ""}
  ${dietPlan.daily_protein ? `<div>Proteina: ${dietPlan.daily_protein}g</div>` : ""}
  ${dietPlan.daily_carbs ? `<div>Carboidratos: ${dietPlan.daily_carbs}g</div>` : ""}
  ${dietPlan.daily_fat ? `<div>Gordura: ${dietPlan.daily_fat}g</div>` : ""}
  ` : ""}
  
  <div class="separator"></div>
  
  <div class="bold center">REFEICOES DO DIA</div>
  
  ${meals.map((meal, mealIndex) => `
    <div class="meal">
      <div class="meal-header">
        ${mealIndex + 1}. ${meal.name.toUpperCase()}
      </div>
      ${meal.time_of_day ? `<div class="small">Horario: ${meal.time_of_day}</div>` : ""}
      
      ${meal.meal_foods.map((food, foodIndex) => `
        <div class="food-item">
          <div>${foodIndex + 1}. ${food.quantity}${food.unit} ${food.food_name}</div>
          ${food.calories ? `<div class="small">   Calorias: ${food.calories} kcal</div>` : ""}
          ${(food.protein || food.carbs || food.fat) ? `
            <div class="small">   Macros: ${food.protein ? `P:${food.protein}g ` : ""}${food.carbs ? `C:${food.carbs}g ` : ""}${food.fat ? `G:${food.fat}g` : ""}</div>
          ` : ""}
          ${food.notes ? `<div class="small">   Obs: ${food.notes}</div>` : ""}
          
          <div class="small ${completedMeals.has(meal.id) ? 'status-ok' : 'status-pending'}">
            Status: ${completedMeals.has(meal.id) ? '[✓] CONSUMIDO' : '[ ] PENDENTE'}
          </div>
        </div>
      `).join("")}
    </div>
  `).join("")}
  
  <div class="separator"></div>
  
  <div class="footer-box">
    <div class="center bold">INFORMACOES DO SISTEMA</div>
    <div class="small">Sistema: FitTrainer-Pro v1.0</div>
    <div class="small">Link: ${window.location.origin}/student/${studentNumber}/diet</div>
    <div class="small">Gerado: ${new Date().toLocaleString("pt-BR")}</div>
  </div>
  
  <div class="center small" style="margin-top: 3mm;">
    ================================<br>
    Assinatura do Personal Trainer<br>
    <br>
    _______________________________<br>
    ${trainer?.name || 'Personal Trainer'}<br>
    ${trainer?.cref || 'CREF: N/A'}
  </div>
  
  <script>
    window.onload = function() {
      setTimeout(() => {
        window.print();
      }, 500);
    }
    
    window.onafterprint = function() {
      setTimeout(() => {
        window.close();
      }, 1000);
    }
  </script>
</body>
</html>`;

      const printWindow = window.open("", "_blank", "width=400,height=600");
      if (printWindow) {
        printWindow.document.write(thermalContent);
        printWindow.document.close();
        
        toast({
          title: "Imprimindo...",
          description: "Enviando dieta para impressora térmica.",
        });
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível abrir a janela de impressão. Verifique se pop-ups estão permitidos.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error printing:", error);
      toast({
        title: "Erro",
        description: "Erro ao preparar impressão.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando dados do aluno...</p>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/30">
        <Card className="max-w-md mx-4 shadow-lg">
          <CardContent className="text-center p-8 space-y-4">
            <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
              <User className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Aluno não encontrado</h3>
              <p className="text-muted-foreground text-sm">
                Não foi possível encontrar os dados deste aluno ou o link pode estar inválido.
              </p>
              <p className="text-sm text-muted-foreground">
                Entre em contato com seu personal trainer para verificar o link.
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
                onClick={() => (window.location.href = "/")}
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

  const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

  return (
    <div className="min-h-screen bg-gray-50 print:bg-white">
      <div className="container mx-auto px-4 py-8 print:py-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6 print:shadow-none print:border">
          <div className="flex justify-between items-start mb-4">
            <Button
              onClick={() => window.history.back()}
              variant="ghost"
              size="sm"
              className="print:hidden"
            >
              <X className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 print:text-2xl">{student.name}</h1>
              <p className="text-gray-600">Plano Personalizado</p>
            </div>
            <Button onClick={handlePrint} className="print:hidden">
              <Printer className="w-4 h-4 mr-2" />
              Exportar PDF
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">DADOS DO SISTEMA</h3>
              <p><strong>Sistema:</strong> FitPro Manager</p>
              <p><strong>Data:</strong> {new Date().toLocaleDateString('pt-BR')}</p>
              <p><strong>Versão:</strong> 1.0</p>
            </div>
            
            {trainer && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">PERSONAL TRAINER</h3>
                <p><strong>Nome:</strong> {trainer.name}</p>
                {trainer.cref && <p><strong>CREF:</strong> {trainer.cref}</p>}
                {trainer.email && <p><strong>Email:</strong> {trainer.email}</p>}
                {trainer.phone && <p><strong>Telefone:</strong> {trainer.phone}</p>}
              </div>
            )}
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">DADOS DO ALUNO</h3>
              <p><strong>Nome:</strong> {student.name}</p>
              <p><strong>Número:</strong> {student.student_number}</p>
              {student.email && <p><strong>Email:</strong> {student.email}</p>}
              {student.phone && <p><strong>Telefone:</strong> {student.phone}</p>}
              {student.weight && <p><strong>Peso:</strong> {student.weight}kg</p>}
              {student.height && <p><strong>Altura:</strong> {student.height}m</p>}
            </div>
          </div>
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="diet" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 print:hidden">
            <TabsTrigger value="diet" className="flex items-center gap-2">
              <Apple className="w-4 h-4" />
              Dieta
            </TabsTrigger>
            <TabsTrigger value="workout" className="flex items-center gap-2">
              <Dumbbell className="w-4 h-4" />
              Treino
            </TabsTrigger>
          </TabsList>

          {/* Diet Tab */}
          <TabsContent value="diet" className="space-y-6 print:block">
            {dietPlan ? (
              <>
                <Card className="print:shadow-none print:border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Apple className="w-5 h-5" />
                      {dietPlan.name}
                    </CardTitle>
                    {dietPlan.description && (
                      <p className="text-gray-600">{dietPlan.description}</p>
                    )}
                  </CardHeader>
                  <CardContent>
                    {(dietPlan.daily_calories || dietPlan.daily_protein || dietPlan.daily_carbs || dietPlan.daily_fat) && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        {dietPlan.daily_calories && (
                          <div className="text-center p-3 bg-blue-50 rounded-lg">
                            <p className="text-2xl font-bold text-blue-600">{dietPlan.daily_calories}</p>
                            <p className="text-sm text-gray-600">Calorias</p>
                          </div>
                        )}
                        {dietPlan.daily_protein && (
                          <div className="text-center p-3 bg-green-50 rounded-lg">
                            <p className="text-2xl font-bold text-green-600">{dietPlan.daily_protein}g</p>
                            <p className="text-sm text-gray-600">Proteína</p>
                          </div>
                        )}
                        {dietPlan.daily_carbs && (
                          <div className="text-center p-3 bg-yellow-50 rounded-lg">
                            <p className="text-2xl font-bold text-yellow-600">{dietPlan.daily_carbs}g</p>
                            <p className="text-sm text-gray-600">Carboidratos</p>
                          </div>
                        )}
                        {dietPlan.daily_fat && (
                          <div className="text-center p-3 bg-purple-50 rounded-lg">
                            <p className="text-2xl font-bold text-purple-600">{dietPlan.daily_fat}g</p>
                            <p className="text-sm text-gray-600">Gordura</p>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div className="space-y-4">
                  {meals.map((meal) => (
                    <Card key={meal.id} className="print:shadow-none print:border print:break-inside-avoid">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-center">
                          <div>
                            <CardTitle className="text-lg">{meal.name}</CardTitle>
                            {meal.time_of_day && (
                              <p className="text-sm text-gray-600 flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {meal.time_of_day}
                              </p>
                            )}
                          </div>
                          <Button
                            variant={completedMeals.has(meal.id) ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleMealCompletion(meal.id)}
                            className="print:hidden"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            {completedMeals.has(meal.id) ? "Concluído" : "Marcar"}
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {meal.meal_foods.map((food) => (
                            <div key={food.id} className="border-l-4 border-blue-200 pl-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-medium">{food.food_name}</h4>
                                  <p className="text-sm text-gray-600">
                                    {food.quantity} {food.unit}
                                  </p>
                                  {food.notes && (
                                    <p className="text-sm text-gray-500 italic mt-1">{food.notes}</p>
                                  )}
                                </div>
                                <div className="text-right text-sm">
                                  {food.calories && <p>{food.calories} kcal</p>}
                                  <div className="flex gap-2 text-xs text-gray-500">
                                    {food.protein && <span>P: {food.protein}g</span>}
                                    {food.carbs && <span>C: {food.carbs}g</span>}
                                    {food.fat && <span>G: {food.fat}g</span>}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            ) : (
              <Card className="print:shadow-none print:border">
                <CardContent className="text-center py-8">
                  <Apple className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">Nenhum plano de dieta encontrado</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Workout Tab */}
          <TabsContent value="workout" className="space-y-6 print:block">
            {workoutPlan ? (
              <>
                <Card className="print:shadow-none print:border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Dumbbell className="w-5 h-5" />
                      {workoutPlan.name}
                    </CardTitle>
                    {workoutPlan.description && (
                      <p className="text-gray-600">{workoutPlan.description}</p>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <p className="text-2xl font-bold text-blue-600">{workoutPlan.frequency_per_week}</p>
                        <p className="text-sm text-gray-600">Vezes por semana</p>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <p className="text-2xl font-bold text-green-600">{workoutPlan.duration_weeks}</p>
                        <p className="text-sm text-gray-600">Semanas</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-4">
                  {workoutPlan.workout_sessions
                    ?.sort((a, b) => a.day_of_week - b.day_of_week)
                    .map((session) => (
                      <Card key={session.id} className="print:shadow-none print:border print:break-inside-avoid">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg">
                            {dayNames[session.day_of_week]} - {session.name}
                          </CardTitle>
                          {session.description && (
                            <p className="text-sm text-gray-600">{session.description}</p>
                          )}
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {session.workout_exercises
                              ?.sort((a, b) => a.order_index - b.order_index)
                              .map((exercise) => (
                                <div key={exercise.id} className="border-l-4 border-green-200 pl-4">
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                      <h4 className="font-medium">{exercise.exercises.name}</h4>
                                      <div className="flex flex-wrap gap-2 text-sm text-gray-600 mt-1">
                                        <span>{exercise.sets} séries</span>
                                        {exercise.reps_min && exercise.reps_max ? (
                                          <span>{exercise.reps_min}-{exercise.reps_max} reps</span>
                                        ) : exercise.reps_min ? (
                                          <span>{exercise.reps_min} reps</span>
                                        ) : null}
                                        {exercise.weight_kg && <span>{exercise.weight_kg}kg</span>}
                                        <span>{Math.floor((exercise.rest_seconds || 60) / 60)}min descanso</span>
                                      </div>
                                      {exercise.exercises.muscle_groups && exercise.exercises.muscle_groups.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-2">
                                          {exercise.exercises.muscle_groups.map((muscle, index) => (
                                            <Badge key={index} variant="secondary" className="text-xs">
                                              {muscle}
                                            </Badge>
                                          ))}
                                        </div>
                                      )}
                                      {exercise.notes && (
                                        <p className="text-sm text-gray-500 italic mt-2">{exercise.notes}</p>
                                      )}
                                    </div>
                                    <Button
                                      variant={completedExercises.has(exercise.id) ? "default" : "outline"}
                                      size="sm"
                                      onClick={() => handleExerciseCompletion(exercise.id)}
                                      className="print:hidden ml-4"
                                    >
                                      <CheckCircle className="w-4 h-4 mr-1" />
                                      {completedExercises.has(exercise.id) ? "✓" : "○"}
                                    </Button>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </>
            ) : (
              <Card className="print:shadow-none print:border">
                <CardContent className="text-center py-8">
                  <Dumbbell className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">Nenhum plano de treino encontrado</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
        
        ${exercise.exercise.youtube_video_url 
          ? `<div class="small">Vídeo: ${exercise.exercise.youtube_video_url}</div>`
          : ""
        }
        
        ${exercise.exercise.youtube_video_url 
          ? `<div class="small">Vídeo: ${exercise.exercise.youtube_video_url}</div>`
          : ""
        }
      </div>
    </div>
  );
}
