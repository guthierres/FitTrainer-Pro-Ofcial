import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BarChart3, 
  Download, 
  TrendingUp,
  Users,
  Activity,
  Target,
  Calendar,
  FileText,
  Printer
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { addDays, format, subDays } from "date-fns";

interface Student {
  id: string;
  name: string;
}

interface ReportData {
  student: {
    name: string;
    email?: string;
    phone?: string;
  };
  trainer: {
    name: string;
    cpf: string;
    cref?: string;
    phone?: string;
  };
  exercisesCompleted: number;
  totalExercises: number;
  mealsCompleted: number;
  totalMeals: number;
  completionRate: number;
  startDate: string;
  endDate: string;
  reportDate: string;
}

const ReportsManager = ({ trainerId }: { trainerId: string }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>("all");
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [reportData, setReportData] = useState<ReportData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadStudents();
  }, [trainerId]);

  const loadStudents = async () => {
    try {
      const { data, error } = await supabase
        .from("students")
        .select("id, name")
        .eq("personal_trainer_id", trainerId)
        .eq("active", true)
        .order("name");

      if (!error && data) {
        setStudents(data);
      }
    } catch (error) {
      console.error("Error loading students:", error);
    }
  };

  const generateReport = async () => {
    if (!dateRange?.from || !dateRange?.to) {
      toast({
        title: "Erro",
        description: "Selecione um período válido para o relatório.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Get trainer info
      const { data: trainerData } = await supabase
        .from("personal_trainers")
        .select("name, cpf, cref, phone")
        .eq("id", trainerId)
        .single();

      // Get students data
      let studentsData;
      if (selectedStudent === "all") {
        const { data } = await supabase
          .from("students")
          .select("*")
          .eq("personal_trainer_id", trainerId)
          .eq("active", true);
        studentsData = data;
      } else {
        const { data } = await supabase
          .from("students")
          .select("*")
          .eq("id", selectedStudent);
        studentsData = data;
      }

      const reports: ReportData[] = [];

      for (const student of studentsData || []) {
        // Get exercise completions
        const { data: exerciseCompletions } = await supabase
          .from("exercise_completions")
          .select(`
            *,
            workout_exercise_id!inner(
              workout_session_id!inner(
                workout_plan_id!inner(
                  personal_trainer_id
                )
              )
            )
          `)
          .eq("student_id", student.id)
          .gte("completed_at", dateRange.from.toISOString())
          .lte("completed_at", dateRange.to.toISOString());

        // Get meal completions
        const { data: mealCompletions } = await supabase
          .from("meal_completions")
          .select(`
            *,
            meal_id!inner(
              diet_plan_id!inner(
                personal_trainer_id
              )
            )
          `)
          .eq("student_id", student.id)
          .gte("completed_at", dateRange.from.toISOString())
          .lte("completed_at", dateRange.to.toISOString());

        // Get total exercises assigned to student
        const { data: totalExercises } = await supabase
          .from("workout_exercises")
          .select(`
            *,
            workout_session_id!inner(
              workout_plan_id!inner(
                personal_trainer_id,
                student_id
              )
            )
          `)
          .eq("workout_session_id.workout_plan_id.student_id", student.id)
          .eq("workout_session_id.workout_plan_id.personal_trainer_id", trainerId);

        const completedExercises = exerciseCompletions?.length || 0;
        const totalExercisesCount = totalExercises?.length || 0;
        const completionRate = totalExercisesCount > 0 ? 
          (completedExercises / totalExercisesCount) * 100 : 0;

        reports.push({
          student: {
            name: student.name,
            email: student.email,
            phone: student.phone,
          },
          trainer: {
            name: trainerData?.name || "",
            cpf: trainerData?.cpf || "",
            cref: trainerData?.cref,
            phone: trainerData?.phone,
          },
          exercisesCompleted: completedExercises,
          totalExercises: totalExercisesCount,
          mealsCompleted: mealCompletions?.length || 0,
          totalMeals: 0, // We could calculate this if needed
          completionRate: Math.round(completionRate * 100) / 100,
          startDate: format(dateRange.from, "dd/MM/yyyy"),
          endDate: format(dateRange.to, "dd/MM/yyyy"),
          reportDate: format(new Date(), "dd/MM/yyyy 'às' HH:mm")
        });
      }

      setReportData(reports);
      
      toast({
        title: "Relatório gerado",
        description: "Relatório de desempenho gerado com sucesso.",
      });

    } catch (error) {
      console.error("Error generating report:", error);
      toast({
        title: "Erro",
        description: "Erro ao gerar relatório.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const exportToPDF = (report: ReportData) => {
    import('jspdf').then(({ jsPDF }) => {
      const doc = new jsPDF({
        unit: 'mm',
        format: [80, 200] // Thermal printer format (80mm width)
      });

      // Configure font
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      
      let y = 10;
      const lineHeight = 4;
      const centerX = 40;

      // Header
      doc.setFontSize(10);
      doc.text("COMPROVANTE DE ACOMPANHAMENTO", centerX, y, { align: "center" });
      y += lineHeight * 2;
      
      doc.setFontSize(8);
      doc.text("================================", centerX, y, { align: "center" });
      y += lineHeight;

      // Trainer info
      doc.text(`Personal: ${report.trainer.name}`, 5, y);
      y += lineHeight;
      if (report.trainer.cref) {
        doc.text(`CREF: ${report.trainer.cref}`, 5, y);
        y += lineHeight;
      }
      doc.text(`CPF: ${report.trainer.cpf}`, 5, y);
      y += lineHeight;
      if (report.trainer.phone) {
        doc.text(`Tel: ${report.trainer.phone}`, 5, y);
        y += lineHeight;
      }
      
      y += lineHeight;
      doc.text("--- DADOS DO ALUNO ---", centerX, y, { align: "center" });
      y += lineHeight;
      doc.text(`Nome: ${report.student.name}`, 5, y);
      y += lineHeight;
      doc.text(`Período: ${report.startDate} a ${report.endDate}`, 5, y);
      y += lineHeight * 2;

      // Performance
      doc.text("--- DESEMPENHO ---", centerX, y, { align: "center" });
      y += lineHeight;
      doc.text(`Treinos: ${report.exercisesCompleted}/${report.totalExercises}`, 5, y);
      y += lineHeight;
      doc.text(`Taxa: ${report.completionRate}%`, 5, y);
      y += lineHeight;
      doc.text(`Refeições: ${report.mealsCompleted}/${report.totalMeals}`, 5, y);
      y += lineHeight * 2;

      // Footer
      doc.text("--- OBSERVAÇÕES ---", centerX, y, { align: "center" });
      y += lineHeight;
      doc.setFontSize(7);
      doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 5, y);
      y += lineHeight * 2;
      
      doc.text("Assinatura:", 5, y);
      y += lineHeight;
      doc.text("_______________________", 5, y);
      y += lineHeight;
      doc.text("Personal Trainer", 5, y);
      y += lineHeight * 2;
      
      doc.text("================================", centerX, y, { align: "center" });

      // Save
      doc.save(`comprovante_${report.student.name}_${report.startDate}_${report.endDate}.pdf`);
    }).catch(() => {
      toast({
        title: "Erro",
        description: "Não foi possível gerar o PDF. Tente novamente.",
        variant: "destructive"
      });
    });
  };

  const exportAllReports = () => {
    const allReportsContent = {
      metadata: {
        generated_at: new Date().toISOString(),
        trainer_id: trainerId,
        period: {
          start: dateRange?.from?.toISOString(),
          end: dateRange?.to?.toISOString()
        },
        total_students: reportData.length
      },
      reports: reportData
    };

    const blob = new Blob([JSON.stringify(allReportsContent, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorio-geral-${format(new Date(), 'yyyy-MM-dd-HHmm')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Relatórios de Desempenho</h2>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Gerar Relatório
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Data Início</label>
              <Input
                type="date"
                value={dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : ""}
                onChange={(e) => {
                  const date = new Date(e.target.value);
                  setDateRange({
                    from: date,
                    to: dateRange?.to || addDays(date, 30)
                  });
                }}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Aluno</label>
              <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar aluno" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os alunos</SelectItem>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={generateReport} disabled={isLoading} className="flex-1">
              {isLoading ? "Gerando..." : "Gerar Relatório"}
            </Button>
            {reportData.length > 0 && (
              <Button variant="outline" onClick={exportAllReports}>
                <Download className="h-4 w-4 mr-2" />
                Exportar Tudo
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Resultados dos Relatórios */}
      {reportData.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              Relatórios Gerados ({reportData.length})
            </h3>
          </div>

          <div className="grid gap-4">
            {reportData.map((report, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Relatório - {report.student.name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Período: {report.startDate} à {report.endDate}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Badge 
                        variant={
                          report.completionRate >= 80 ? "default" :
                          report.completionRate >= 60 ? "secondary" : "destructive"
                        }
                      >
                        {report.completionRate}% Conclusão
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => exportToPDF(report)}
                      >
                        <Printer className="h-4 w-4 mr-2" />
                        Comprovante
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">Treinos</span>
                      </div>
                      <div className="text-lg font-bold">
                        {report.exercisesCompleted}/{report.totalExercises}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Exercícios completados
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-success" />
                        <span className="text-sm font-medium">Dieta</span>
                      </div>
                      <div className="text-lg font-bold">
                        {report.mealsCompleted}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Refeições registradas
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-warning" />
                        <span className="text-sm font-medium">Performance</span>
                      </div>
                      <div className="text-lg font-bold text-primary">
                        {report.completionRate >= 80 ? "Excelente" :
                         report.completionRate >= 60 ? "Bom" : "Atenção"}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Avaliação geral
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-muted/50 rounded">
                    <p className="text-sm">
                      <strong>Dados do Aluno:</strong> {report.student.name}
                      {report.student.email && ` • ${report.student.email}`}
                      {report.student.phone && ` • ${report.student.phone}`}
                      {report.student.student_number && ` • Nº ${report.student.student_number}`}
                    </p>
                    <p className="text-sm">
                      <strong>Personal Trainer:</strong> {report.trainer.name} ({report.trainer.cpf})
                      {report.trainer.cref && ` • CREF: ${report.trainer.cref}`}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Placeholder for no reports */}
      {reportData.length === 0 && !isLoading && (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              Nenhum relatório gerado ainda
            </p>
            <p className="text-sm text-muted-foreground">
              Configure os filtros e clique em "Gerar Relatório" para começar.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ReportsManager;