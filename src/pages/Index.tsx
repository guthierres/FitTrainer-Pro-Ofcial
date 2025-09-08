import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Dumbbell, 
  Users, 
  BarChart3, 
  Shield,
  Smartphone,
  Globe,
  ArrowRight,
  Star,
  CheckCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Footer from "@/components/Footer";

const Index = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Users,
      title: "Gestão de Alunos",
      description: "Cadastre e gerencie seus alunos com facilidade"
    },
    {
      icon: Dumbbell,
      title: "Planos de Treino",
      description: "Crie treinos personalizados com biblioteca de exercícios"
    },
    {
      icon: BarChart3,
      title: "Relatórios Detalhados",
      description: "Acompanhe o progresso com relatórios profissionais"
    },
    {
      icon: Smartphone,
      title: "PWA Mobile",
      description: "Funciona perfeitamente em dispositivos móveis"
    },
    {
      icon: Globe,
      title: "Acesso Online",
      description: "Links únicos para seus alunos acessarem treinos"
    },
    {
      icon: Shield,
      title: "Totalmente Seguro",
      description: "Dados protegidos com criptografia avançada"
    }
  ];

  const benefits = [
    "Interface intuitiva e moderna",
    "Biblioteca completa de exercícios",
    "Exportação de relatórios profissionais",
    "Gerenciamento de dietas personalizadas",
    "Acompanhamento de progresso em tempo real",
    "Sistema PWA - instale como app",
    "Acesso seguro para alunos via link único"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center space-y-6">
          <div className="flex justify-center mb-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <Dumbbell className="h-12 w-12 sm:h-16 sm:w-16 text-primary" />
              <div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-primary">FitTrainer-Pro</h1>
                <p className="text-lg sm:text-xl text-muted-foreground">Sistema Completo de Gestão</p>
              </div>
            </div>
          </div>
          
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground max-w-4xl mx-auto">
            A plataforma definitiva para 
            <span className="text-primary"> Personal Trainers</span> gerenciarem seus alunos
          </h2>
          
          <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto">
            Gerencie alunos, crie treinos personalizados, acompanhe progressos e gere relatórios profissionais. 
            Tudo em uma única plataforma moderna e segura.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mt-8">
            <Button 
              size="lg" 
              onClick={() => navigate("/login")}
              className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6"
            >
              Acessar como Personal Trainer
              <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            
            <Button 
              variant="outline" 
              size="lg" 
              onClick={() => navigate("/super-admin")}
              className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6"
            >
              <Shield className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              Acesso Administrativo
            </Button>
          </div>

          <div className="flex flex-wrap justify-center gap-3 sm:gap-8 mt-8 sm:mt-12">
            <Badge variant="secondary" className="text-sm sm:text-lg px-3 sm:px-4 py-2">
              <Star className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              100% Gratuito
            </Badge>
            <Badge variant="secondary" className="text-sm sm:text-lg px-3 sm:px-4 py-2">
              <Smartphone className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              PWA Mobile
            </Badge>
            <Badge variant="secondary" className="text-sm sm:text-lg px-3 sm:px-4 py-2">
              <Shield className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              Dados Seguros
            </Badge>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold mb-4">Funcionalidades Principais</h3>
          <p className="text-xl text-muted-foreground">
            Tudo que você precisa para gerenciar sua carreira como Personal Trainer
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-12 lg:mb-16">
          {features.map((feature, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <feature.icon className="h-8 w-8 text-primary" />
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Benefits List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div>
            <h4 className="text-2xl font-bold mb-6">Por que escolher o FitTrainer-Pro?</h4>
            <div className="space-y-3">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          <Card className="p-8 bg-gradient-to-br from-primary/10 to-secondary/10">
            <CardContent className="text-center space-y-4">
              <Dumbbell className="h-16 w-16 text-primary mx-auto" />
              <h5 className="text-2xl font-bold">Comece Agora!</h5>
              <p className="text-muted-foreground">
                Transforme sua gestão de alunos e eleve sua carreira para o próximo nível.
              </p>
              <Button 
                size="lg" 
                onClick={() => navigate("/login")}
                className="w-full"
              >
                Fazer Login
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Demo Section */}
      <section className="container mx-auto px-4 py-16">
        <Card className="bg-gradient-to-r from-primary to-secondary text-white">
          <CardContent className="p-12 text-center">
            <h4 className="text-3xl font-bold mb-4">Experimente o Sistema Demo</h4>
            <p className="text-xl mb-8 opacity-90">
              Acesse nossa demonstração com dados de exemplo e veja como funciona na prática.
            </p>
            <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto text-left">
              <div className="bg-white/10 p-4 rounded-lg">
                <h5 className="font-semibold mb-2">👨‍💼 Personal Trainer Demo</h5>
                <p className="text-sm opacity-90">
                  <strong>Email:</strong> demo@fittrainer.com<br/>
                  <strong>Senha:</strong> temp123456
                </p>
              </div>
              <div className="bg-white/10 p-4 rounded-lg">
                <h5 className="font-semibold mb-2">🔗 Link de Aluno Demo</h5>
                <p className="text-sm opacity-90">
                  Teste o acesso do aluno com<br/>
                  número de estudante: 100001
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <Footer />
    </div>
  );
};

export default Index;