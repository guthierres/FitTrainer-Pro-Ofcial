import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Trash2, User, Dumbbell, Apple, Share2, Eye } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface Student {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  weight: number | null;
  height: number | null;
  goals: string[] | null;
  student_number: string;
  unique_link_token: string;
  active: boolean;
  created_at: string;
}

interface StudentListProps {
  personalTrainerId: string;
  onStudentSelect: (student: Student) => void;
  onCreateWorkout: (student: Student) => void;
  onCreateDiet: (student: Student) => void;
  onCreateStudent: () => void;
}

export function StudentList({ personalTrainerId, onStudentSelect, onCreateWorkout, onCreateDiet, onCreateStudent }: StudentListProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (personalTrainerId && personalTrainerId !== 'undefined') {
      fetchStudents();
    }
  }, [personalTrainerId]);

  const fetchStudents = async () => {
    if (!personalTrainerId || personalTrainerId === 'undefined') {
      console.error('Invalid personalTrainerId:', personalTrainerId);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('students')
        .select('*, student_number')
        .eq('personal_trainer_id', personalTrainerId)
        .eq('active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar alunos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    try {
      const { error } = await supabase
        .from('students')
        .update({ active: false })
        .eq('id', studentId);

      if (error) throw error;

      setStudents(students.filter(s => s.id !== studentId));
      toast({
        title: "Sucesso",
        description: "Aluno removido com sucesso",
      });
    } catch (error) {
      console.error('Error deleting student:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover aluno",
        variant: "destructive",
      });
    }
  };

  const handleShareStudent = async (studentNumber: string, studentName: string) => {
    const studentUrl = `${window.location.origin}/student/${studentNumber}`;
    
    if (navigator.share && /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      try {
        await navigator.share({
          title: `Plano de ${studentName}`,
          text: `Acesse seu plano de treino e dieta personalizado`,
          url: studentUrl,
        });
      } catch (error) {
        // Fallback to clipboard if share fails
        await navigator.clipboard.writeText(studentUrl);
        toast({
          title: "Link copiado!",
          description: "Link do aluno copiado para área de transferência",
        });
      }
    } else {
      try {
        await navigator.clipboard.writeText(studentUrl);
        toast({
          title: "Link copiado!",
          description: "Link do aluno copiado para área de transferência",
        });
      } catch (error) {
        toast({
          title: "Erro",
          description: "Não foi possível copiar o link",
          variant: "destructive",
        });
      }
    }
  };

  if (loading) {
    return <div className="text-center py-8">Carregando alunos...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Meus Alunos</h2>
      </div>

      {students.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">Nenhum aluno cadastrado ainda.</p>
            <Button onClick={onCreateStudent} className="mt-4">
              Cadastrar Primeiro Aluno
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {students.map((student) => (
            <Card key={student.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{student.name}</CardTitle>
                  <Badge variant="secondary">Ativo</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>🔢 Nº {student.student_number}</p>
                  {student.email && <p>📧 {student.email}</p>}
                  {student.phone && <p>📱 {student.phone}</p>}
                  {student.weight && <p>⚖️ {student.weight}kg</p>}
                  {student.height && <p>📏 {student.height}m</p>}
                </div>

                {student.goals && student.goals.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {student.goals.map((goal, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {goal}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(`/student/${student.student_number}`, '_blank')}
                    className="flex-1"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Link
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onStudentSelect(student)}
                    className="flex-1"
                  >
                    <User className="w-4 h-4 mr-1" />
                    Perfil
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onCreateWorkout(student)}
                    className="flex-1"
                  >
                    <Dumbbell className="w-4 h-4 mr-1" />
                    Treino
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onCreateDiet(student)}
                    className="flex-1"
                  >
                    <Apple className="w-4 h-4 mr-1" />
                    Dieta
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleShareStudent(student.student_number, student.name)}
                    className="flex-1"
                  >
                    <Share2 className="w-4 h-4 mr-1" />
                    Enviar
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja remover o aluno {student.name}? 
                          Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteStudent(student.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
