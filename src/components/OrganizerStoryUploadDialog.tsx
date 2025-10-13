import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, X } from "lucide-react";
import { toast } from "sonner";

interface OrganizerStoryUploadDialogProps {
  open: boolean;
  onClose: () => void;
  onUpload: (file: File) => Promise<void>;
}

export function OrganizerStoryUploadDialog({
  open,
  onClose,
  onUpload,
}: OrganizerStoryUploadDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      toast.error('Por favor, selecione uma imagem ou vídeo');
      return;
    }

    // Validar tamanho (máximo 20MB)
    if (file.size > 20 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo 20MB');
      return;
    }

    setSelectedFile(file);

    // Criar preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setUploading(true);
      await onUpload(selectedFile);
      handleClose();
    } catch (error) {
      console.error('Error uploading story:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreview(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Story</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!preview ? (
            <div>
              <Label htmlFor="story-upload" className="cursor-pointer">
                <div className="border-2 border-dashed border-border rounded-lg p-8 hover:border-primary transition-colors flex flex-col items-center justify-center gap-2">
                  <Upload className="h-12 w-12 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground text-center">
                    Clique para selecionar uma foto ou vídeo vertical
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Máximo 20MB
                  </p>
                </div>
              </Label>
              <input
                id="story-upload"
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>
          ) : (
            <div className="relative">
              <div className="aspect-[9/16] bg-black rounded-lg overflow-hidden">
                {selectedFile?.type.startsWith('video/') ? (
                  <video
                    src={preview}
                    className="w-full h-full object-contain"
                    controls
                  />
                ) : (
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-full h-full object-contain"
                  />
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setSelectedFile(null);
                  setPreview(null);
                }}
                className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {preview && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedFile(null);
                  setPreview(null);
                }}
                className="flex-1"
                disabled={uploading}
              >
                Trocar
              </Button>
              <Button
                onClick={handleUpload}
                className="flex-1"
                disabled={uploading}
              >
                {uploading ? 'Publicando...' : 'Publicar Story'}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
