import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Play, ExternalLink } from "lucide-react";

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  exerciseName: string;
  youtubeUrl?: string;
}

const VideoModal = ({ isOpen, onClose, exerciseName, youtubeUrl }: VideoModalProps) => {
  const [isLoading, setIsLoading] = useState(true);

  const getYouTubeEmbedUrl = (url: string) => {
    if (!url) return null;
    
    // Expressão regular para links de vídeo padrão e Shorts
    const regExp = /(?:youtube\.com\/(?:shorts\/|embed\/|v\/|watch\?v=|[^#&?]*?v=)|youtu\.be\/)([^"&?/]{11})/;
    const match = url.match(regExp);
    
    // Verifica se a correspondência existe e o ID tem 11 caracteres (padrão)
    if (match && match[1].length === 11) {
      const videoId = match[1];
      // Retorna a URL de incorporação com parâmetros úteis
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`;
    }
    
    // Retorna nulo se o link não for válido
    return null;
  };

  const embedUrl = youtubeUrl ? getYouTubeEmbedUrl(youtubeUrl) : null;

  const handleVideoLoad = () => {
    setIsLoading(false);
  };

  const openInYouTube = () => {
    if (youtubeUrl) {
      window.open(youtubeUrl, '_blank');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-2">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Play className="h-5 w-5 text-primary" />
              Como executar: {exerciseName}
            </DialogTitle>
            <div className="flex items-center gap-2">
              {youtubeUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openInYouTube}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Abrir no YouTube
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="px-4 pb-4">
          {!youtubeUrl ? (
            <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
              <div className="text-center space-y-2">
                <Play className="h-12 w-12 text-muted-foreground mx-auto opacity-50" />
                <p className="text-muted-foreground">
                  Nenhum vídeo disponível para este exercício
                </p>
                <p className="text-sm text-muted-foreground">
                  Entre em contato com seu personal trainer para adicionar um vídeo demonstrativo
                </p>
              </div>
            </div>
          ) : !embedUrl ? (
            <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
              <div className="text-center space-y-2">
                <Play className="h-12 w-12 text-muted-foreground mx-auto opacity-50" />
                <p className="text-muted-foreground">
                  URL do vídeo inválida
                </p>
                <p className="text-sm text-muted-foreground">
                  Verifique se o link do YouTube está correto
                </p>
                <Button variant="outline" onClick={openInYouTube}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Tentar abrir link original
                </Button>
              </div>
            </div>
          ) : (
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted">
                  <div className="text-center space-y-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="text-sm text-muted-foreground">Carregando vídeo...</p>
                  </div>
                </div>
              )}
              <iframe
                src={embedUrl}
                title={`Vídeo demonstrativo: ${exerciseName}`}
                className="w-full h-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                onLoad={handleVideoLoad}
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VideoModal;
