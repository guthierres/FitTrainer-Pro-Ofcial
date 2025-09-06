import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PrivacyPolicy = () => {
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
            <CardTitle className="text-2xl">Política de Privacidade</CardTitle>
            <p className="text-sm text-muted-foreground">
              Última atualização: {new Date().toLocaleDateString('pt-BR')}
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            <section>
              <h2 className="text-lg font-semibold mb-3">1. Informações que Coletamos</h2>
              <div className="text-sm space-y-2">
                <p>Coletamos as seguintes informações:</p>
                <ul className="list-disc ml-6 space-y-1">
                  <li>Dados pessoais fornecidos pelos personal trainers (nome, CPF, email, telefone)</li>
                  <li>Informações dos alunos cadastrados pelos personal trainers</li>
                  <li>Dados de treinos e dietas criados no sistema</li>
                  <li>Informações de uso da plataforma para melhorias</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">2. Como Usamos suas Informações</h2>
              <div className="text-sm space-y-2">
                <p>Utilizamos suas informações para:</p>
                <ul className="list-disc ml-6 space-y-1">
                  <li>Fornecer e manter nossos serviços</li>
                  <li>Personalizar sua experiência na plataforma</li>
                  <li>Comunicar-nos com você sobre atualizações e novidades</li>
                  <li>Melhorar nossos serviços e desenvolver novos recursos</li>
                  <li>Garantir a segurança e integridade da plataforma</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">3. Compartilhamento de Informações</h2>
              <div className="text-sm space-y-2">
                <p>Não vendemos, alugamos ou compartilhamos suas informações pessoais com terceiros, exceto:</p>
                <ul className="list-disc ml-6 space-y-1">
                  <li>Quando necessário para cumprir obrigações legais</li>
                  <li>Para proteger nossos direitos e segurança</li>
                  <li>Com seu consentimento explícito</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">4. Segurança dos Dados</h2>
              <div className="text-sm space-y-2">
                <p>Implementamos medidas de segurança técnicas e organizacionais adequadas para proteger suas informações contra:</p>
                <ul className="list-disc ml-6 space-y-1">
                  <li>Acesso não autorizado</li>
                  <li>Alteração, divulgação ou destruição não autorizada</li>
                  <li>Perda acidental</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">5. Seus Direitos</h2>
              <div className="text-sm space-y-2">
                <p>Você tem direito a:</p>
                <ul className="list-disc ml-6 space-y-1">
                  <li>Acessar suas informações pessoais</li>
                  <li>Corrigir dados inexatos ou incompletos</li>
                  <li>Solicitar a exclusão de seus dados</li>
                  <li>Revogar seu consentimento a qualquer momento</li>
                  <li>Receber uma cópia de seus dados em formato estruturado</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">6. Retenção de Dados</h2>
              <div className="text-sm">
                <p>Mantemos suas informações pessoais apenas pelo tempo necessário para os fins descritos nesta política ou conforme exigido por lei.</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">7. Alterações nesta Política</h2>
              <div className="text-sm">
                <p>Podemos atualizar esta política periodicamente. Notificaremos sobre mudanças significativas através da plataforma ou por email.</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">8. Contato</h2>
              <div className="text-sm">
                <p>Para questões sobre esta política de privacidade, entre em contato conosco através do email: suporte@fittrainerpro.com</p>
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

export default PrivacyPolicy;