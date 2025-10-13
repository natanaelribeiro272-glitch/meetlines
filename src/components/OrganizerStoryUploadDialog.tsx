import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, Image as ImageIcon, X, SwitchCamera, Check } from "lucide-react";
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
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [capturedMedia, setCapturedMedia] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [uploading, setUploading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Connect camera stream to video element
  useEffect(() => {
    if (cameraStream && videoRef.current && showCamera) {
      videoRef.current.srcObject = cameraStream;
      videoRef.current.play().catch(err => {
        console.error('Error playing video:', err);
      });
    }
  }, [cameraStream, showCamera]);

  // Cleanup camera on close
  useEffect(() => {
    if (!open) {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        setCameraStream(null);
      }
      setShowCamera(false);
      setCapturedMedia(null);
    }
  }, [open, cameraStream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
        audio: false
      });
      setCameraStream(stream);
      setShowCamera(true);
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast.error('Erro ao acessar a câmera');
    }
  };

  const switchCamera = async () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
    }
    
    const newFacingMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newFacingMode);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: newFacingMode },
        audio: false
      });
      setCameraStream(stream);
    } catch (error) {
      console.error('Error switching camera:', error);
      toast.error('Erro ao trocar câmera');
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !cameraStream) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setCapturedMedia(imageDataUrl);
      setMediaType('image');
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      toast.error('Por favor, selecione uma imagem ou vídeo');
      return;
    }

    // Validar tamanho (máximo 50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo 50MB');
      return;
    }

    // Preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setCapturedMedia(e.target?.result as string);
      setMediaType(file.type.startsWith('video/') ? 'video' : 'image');
    };
    reader.readAsDataURL(file);
  };

  const postCapturedMedia = async () => {
    if (!capturedMedia) return;

    try {
      setUploading(true);
      
      const response = await fetch(capturedMedia);
      const blob = await response.blob();
      const file = new File(
        [blob], 
        `story-${Date.now()}.${mediaType === 'video' ? 'mp4' : 'jpg'}`, 
        { type: mediaType === 'video' ? 'video/mp4' : 'image/jpeg' }
      );
      
      await onUpload(file);
      handleClose();
    } catch (error) {
      console.error('Error uploading story:', error);
      toast.error('Erro ao publicar story');
    } finally {
      setUploading(false);
    }
  };

  const retakeMedia = () => {
    setCapturedMedia(null);
    if (!showCamera && cameraStream) {
      setShowCamera(true);
    }
  };

  const handleClose = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCamera(false);
    setCapturedMedia(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-full sm:max-w-md w-full h-screen sm:h-[90vh] p-0 bg-black border-none overflow-hidden">
        {showCamera && !capturedMedia ? (
          /* Camera View */
          <div className="relative h-full w-full flex flex-col bg-black">
            {/* Video Preview */}
            <div className="flex-1 relative overflow-hidden bg-black">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>

            {/* Top Controls */}
            <div className="absolute top-safe top-4 left-0 right-0 flex justify-between items-center px-4 z-20">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="bg-black/60 hover:bg-black/80 text-white rounded-full h-10 w-10"
              >
                <X className="h-5 w-5" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={switchCamera}
                className="bg-black/60 hover:bg-black/80 text-white rounded-full h-10 w-10"
              >
                <SwitchCamera className="h-5 w-5" />
              </Button>
            </div>

            {/* Bottom Controls */}
            <div className="absolute bottom-safe bottom-8 sm:bottom-12 left-0 right-0 flex justify-center items-center gap-6 sm:gap-8 px-4 z-20 pb-safe">
              {/* Gallery Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                className="h-12 w-12 sm:h-14 sm:w-14 bg-white/20 hover:bg-white/30 text-white rounded-full flex-shrink-0"
              >
                <ImageIcon className="h-6 w-6" />
              </Button>

              {/* Capture Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={capturePhoto}
                className="h-16 w-16 sm:h-20 sm:w-20 bg-white hover:bg-white/90 rounded-full ring-4 ring-white/50 flex-shrink-0"
              >
                <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-transparent border-4 border-black" />
              </Button>

              {/* Spacer for symmetry */}
              <div className="h-12 w-12 sm:h-14 sm:w-14 flex-shrink-0" />
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>
        ) : capturedMedia ? (
          /* Preview Captured Media */
          <div className="relative h-full w-full flex flex-col bg-black">
            <div className="flex-1 flex items-center justify-center overflow-hidden">
              {mediaType === 'video' ? (
                <video
                  src={capturedMedia}
                  className="max-h-full w-full object-contain"
                  controls
                  autoPlay
                  loop
                  playsInline
                />
              ) : (
                <img
                  src={capturedMedia}
                  alt="Preview"
                  className="max-h-full w-full object-contain"
                />
              )}
            </div>

            {/* Top Controls */}
            <div className="absolute top-safe top-4 left-4 right-4 flex justify-between items-center z-20">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="bg-black/60 hover:bg-black/80 text-white rounded-full h-10 w-10"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Bottom Controls */}
            <div className="absolute bottom-safe bottom-8 sm:bottom-12 left-0 right-0 flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-4 px-4 z-20 pb-safe">
              <Button
                variant="ghost"
                size="lg"
                onClick={retakeMedia}
                disabled={uploading}
                className="bg-white/20 hover:bg-white/30 text-white rounded-full px-6 sm:px-8 h-12 sm:h-14 min-w-[140px]"
              >
                <X className="h-5 w-5 mr-2" />
                Refazer
              </Button>
              
              <Button
                variant="default"
                size="lg"
                onClick={postCapturedMedia}
                disabled={uploading}
                className="bg-primary hover:bg-primary/90 rounded-full px-6 sm:px-8 h-12 sm:h-14 min-w-[140px]"
              >
                <Check className="h-5 w-5 mr-2" />
                {uploading ? 'Publicando...' : 'Publicar'}
              </Button>
            </div>
          </div>
        ) : (
          /* Initial Options */
          <div className="h-full flex flex-col items-center justify-center gap-6 sm:gap-8 p-6 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-bold text-white">Criar Story</h2>
            
            <div className="flex flex-col gap-3 sm:gap-4 w-full max-w-xs">
              <Button
                variant="default"
                size="lg"
                onClick={startCamera}
                className="w-full h-14 sm:h-16 text-base sm:text-lg rounded-xl"
              >
                <Camera className="h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3" />
                Abrir Câmera
              </Button>
              
              <Button
                variant="outline"
                size="lg"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-14 sm:h-16 text-base sm:text-lg rounded-xl bg-surface border-border hover:bg-surface/80"
              >
                <ImageIcon className="h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3" />
                Escolher da Galeria
              </Button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
