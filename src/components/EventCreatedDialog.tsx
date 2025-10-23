import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Share2, Copy, Eye, X } from "lucide-react";
import { toast } from "sonner";

interface EventCreatedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  eventTitle: string;
  shareUrl: string;
  onViewEvent: () => void;
}

export default function EventCreatedDialog({
  open,
  onOpenChange,
  eventId,
  eventTitle,
  shareUrl,
  onViewEvent
}: EventCreatedDialogProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copiado!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Erro ao copiar link");
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: eventTitle,
          text: `Confira este evento: ${eventTitle}`,
          url: shareUrl,
        });
      } catch (error) {
        console.log("Compartilhamento cancelado");
      }
    } else {
      handleCopyLink();
      toast.info("Use o botão 'Copiar Link' para compartilhar");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm mx-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">
            🎉 Evento Criado com Sucesso!
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-center text-muted-foreground">
            Seu evento está pronto! Compartilhe com seus participantes.
          </p>

          <div className="space-y-3">
            <Button
              onClick={handleCopyLink}
              variant="outline"
              className="w-full justify-start gap-2"
            >
              <Copy className="h-4 w-4" />
              {copied ? "Link Copiado!" : "Copiar Link"}
            </Button>

            <Button
              onClick={handleShare}
              variant="outline"
              className="w-full justify-start gap-2"
            >
              <Share2 className="h-4 w-4" />
              Compartilhar Evento
            </Button>

            <Button
              onClick={onViewEvent}
              className="w-full justify-start gap-2 btn-glow"
            >
              <Eye className="h-4 w-4" />
              Ver Evento
            </Button>
          </div>

          <Button
            onClick={() => onOpenChange(false)}
            variant="ghost"
            className="w-full"
          >
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
