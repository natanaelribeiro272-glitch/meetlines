import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { Monitor, ExternalLink } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface DesktopOnlyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  pageTitle: string;
  pageUrl: string;
}

export function DesktopOnlyDialog({
  isOpen,
  onClose,
  pageTitle,
  pageUrl
}: DesktopOnlyDialogProps) {
  const handleOpenInBrowser = () => {
    const fullUrl = `${window.location.origin}${pageUrl}`;
    window.open(fullUrl, '_system');
    onClose();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-primary/10 rounded-full">
              <Monitor className="h-12 w-12 text-primary" />
            </div>
          </div>
          <AlertDialogTitle className="text-center text-xl">
            Melhor visualização no computador
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center space-y-3">
            <p>
              A página <strong>{pageTitle}</strong> contém muitas informações e funciona melhor em telas maiores.
            </p>
            <p className="text-sm">
              Recomendamos que você acesse esta área através de um computador ou navegador para uma experiência completa.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            onClick={handleOpenInBrowser}
            className="w-full"
            size="lg"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Abrir no Navegador
          </Button>
          <Button
            onClick={onClose}
            variant="ghost"
            className="w-full"
          >
            Fechar
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function useDesktopOnlyPage(pageTitle: string, pageUrl: string) {
  const [showDialog, setShowDialog] = useState(false);
  const isNativeMobile = Capacitor.isNativePlatform();

  useEffect(() => {
    if (isNativeMobile) {
      setShowDialog(true);
    }
  }, [isNativeMobile]);

  return {
    isNativeMobile,
    showDialog,
    setShowDialog,
    DesktopDialog: () => (
      <DesktopOnlyDialog
        isOpen={showDialog}
        onClose={() => setShowDialog(false)}
        pageTitle={pageTitle}
        pageUrl={pageUrl}
      />
    )
  };
}
