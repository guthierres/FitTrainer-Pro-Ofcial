import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-card border-t mt-auto">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 text-xs">
          <Link 
            to="/privacy-policy" 
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            Política de Privacidade
          </Link>
          <span className="hidden sm:inline text-muted-foreground">|</span>
          <Link 
            to="/terms-of-service" 
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            Termos de Uso
          </Link>
        </div>
        <div className="text-center mt-2">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} FitTrainer-Pro. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;