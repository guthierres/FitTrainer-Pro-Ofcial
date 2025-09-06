import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const TermsOfService = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Termos de Uso</CardTitle>
            <p className="text-sm text-muted-foreground">
              Última atualização: {new Date().toLocaleDateString('pt-BR')}
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            <section>
              <h2 className="text-lg font-semibold mb-3">1. Aceitação dos Termos</h2>
              <div className="text-sm space-y-2">
                <p>Ao acessar e usar a plataforma FitTrainer-Pro, você concorda em cumprir e ficar vinculado a estes Termos de Uso. Se você não concordar com qualquer parte destes termos, não deve usar nossos serviços.</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">2. Descrição do Serviço</h2>
              <div className="text-sm space-y-2">
                <p>FitTrainer-Pro é uma plataforma digital que permite aos personal trainers:</p>
                <ul className="list-disc ml-6 space-y-1">
                  <li>Gerenciar informações de alunos</li>
                  <li>Criar e acompanhar planos de treino</li>
                  <li>Desenvolver planos alimentares</li>
                  <li>Monitorar progresso dos alunos</li>
                  <li>Gerar relatórios de desempenho</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">3. Registro e Conta</h2>
              <div className="text-sm space-y-2">
                <p>Para usar nossos serviços, você deve:</p>
                <ul className="list-disc ml-6 space-y-1">
                  <li>Ser um personal trainer registrado e qualificado</li>
                  <li>Fornecer informações precisas e atualizadas</li>
                  <li>Manter a confidencialidade de sua conta</li>
                  <li>Ser responsável por todas as atividades em sua conta</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">4. Responsabilidades do Usuário</h2>
              <div className="text-sm space-y-2">
                <p>Você concorda em:</p>
                <ul className="list-disc ml-6 space-y-1">
                  <li>Usar a plataforma apenas para fins legítimos e profissionais</li>
                  <li>Respeitar a privacidade e confidencialidade dos dados dos alunos</li>
                  <li>Não compartilhar suas credenciais de acesso</li>
                  <li>Manter atualizadas suas qualificações profissionais</li>
                  <li>Cumprir todas as leis e regulamentações aplicáveis</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">5. Proteção de Dados</h2>
              <div className="text-sm space-y-2">
                <p>Você se compromete a:</p>
                <ul className="list-disc ml-6 space-y-1">
                  <li>Obter consentimento adequado dos alunos para coleta de dados</li>
                  <li>Usar os dados apenas para fins profissionais</li>
                  <li>Implementar medidas de segurança adequadas</li>
                  <li>Notificar imediatamente sobre qualquer violação de dados</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">6. Propriedade Intelectual</h2>
              <div className="text-sm space-y-2">
                <p>A plataforma FitTrainer-Pro e todo seu conteúdo são protegidos por direitos autorais. Você não pode:</p>
                <ul className="list-disc ml-6 space-y-1">
                  <li>Copiar, modificar ou distribuir nosso software</li>
                  <li>Fazer engenharia reversa da plataforma</li>
                  <li>Remover marcas de propriedade intelectual</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">7. Limitações de Responsabilidade</h2>
              <div className="text-sm space-y-2">
                <p>O FitTrainer-Pro não se responsabiliza por:</p>
                <ul className="list-disc ml-6 space-y-1">
                  <li>Resultados obtidos pelos alunos</li>
                  <li>Decisões médicas ou nutricionais tomadas com base nos dados</li>
                  <li>Danos indiretos ou consequenciais</li>
                  <li>Interrupções temporárias do serviço</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">8. Modificações dos Termos</h2>
              <div className="text-sm">
                <p>Reservamo-nos o direito de modificar estes termos a qualquer momento. As alterações entram em vigor imediatamente após a publicação na plataforma.</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">9. Encerramento</h2>
              <div className="text-sm">
                <p>Podemos encerrar ou suspender sua conta imediatamente, sem aviso prévio, por violação destes termos ou por qualquer motivo legítimo.</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">10. Lei Aplicável</h2>
              <div className="text-sm">
                <p>Estes termos são regidos pelas leis brasileiras. Qualquer disputa será resolvida nos tribunais competentes do Brasil.</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">11. Contato</h2>
              <div className="text-sm">
                <p>Para questões sobre estes termos, entre em contato conosco através do email: suporte@fittrainerpro.com</p>
              </div>
            </section>

            <div className="pt-6 border-t">
              <Button 
                variant="outline" 
                onClick={() => navigate(-1)}
                className="w-full sm:w-auto"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TermsOfService;