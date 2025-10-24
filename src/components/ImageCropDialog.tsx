import { useState, useRef, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { ZoomIn, RotateCw } from 'lucide-react';

interface ImageCropDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageSrc: string;
  onCropComplete: (croppedImage: File) => void;
  aspectRatio?: number;
}

export function ImageCropDialog({
  open,
  onOpenChange,
  imageSrc,
  onCropComplete,
  aspectRatio = 1
}: ImageCropDialogProps) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (imageSrc && open) {
      const img = new Image();
      img.src = imageSrc;
      img.onload = () => {
        imageRef.current = img;
        setZoom(1);
        setRotation(0);
        setPosition({ x: 0, y: 0 });
        drawCanvas();
      };
    }
  }, [imageSrc, open]);

  useEffect(() => {
    drawCanvas();
  }, [zoom, rotation, position]);

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 400;
    canvas.width = size;
    canvas.height = size;

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, size, size);

    ctx.save();
    ctx.translate(size / 2, size / 2);
    ctx.rotate((rotation * Math.PI) / 180);

    const imgAspect = image.width / image.height;
    let drawWidth, drawHeight;

    if (imgAspect > 1) {
      drawHeight = size;
      drawWidth = size * imgAspect;
    } else {
      drawWidth = size;
      drawHeight = size / imgAspect;
    }

    drawWidth *= zoom;
    drawHeight *= zoom;

    ctx.drawImage(
      image,
      position.x - drawWidth / 2,
      position.y - drawHeight / 2,
      drawWidth,
      drawHeight
    );

    ctx.restore();

    const cropSize = size * 0.85;
    const cropX = (size - cropSize) / 2;
    const cropY = (size - cropSize) / 2;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, size, cropY);
    ctx.fillRect(0, cropY + cropSize, size, size - cropY - cropSize);
    ctx.fillRect(0, cropY, cropX, cropSize);
    ctx.fillRect(cropX + cropSize, cropY, size - cropX - cropSize, cropSize);

    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.strokeRect(cropX, cropY, cropSize, cropSize);

    ctx.beginPath();
    ctx.arc(size / 2, size / 2, cropSize / 2, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.stroke();
    ctx.setLineDash([]);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({ x: touch.clientX - position.x, y: touch.clientY - position.y });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    setPosition({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y
    });
  };

  const getCroppedImage = useCallback(async () => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image) return null;

    const outputSize = 800;
    const cropCanvas = document.createElement('canvas');
    cropCanvas.width = outputSize;
    cropCanvas.height = outputSize;

    const ctx = cropCanvas.getContext('2d');
    if (!ctx) return null;

    const size = 400;
    const scale = outputSize / size;

    ctx.save();
    ctx.translate(outputSize / 2, outputSize / 2);
    ctx.rotate((rotation * Math.PI) / 180);

    const imgAspect = image.width / image.height;
    let drawWidth, drawHeight;

    if (imgAspect > 1) {
      drawHeight = size;
      drawWidth = size * imgAspect;
    } else {
      drawWidth = size;
      drawHeight = size / imgAspect;
    }

    drawWidth *= zoom * scale;
    drawHeight *= zoom * scale;

    ctx.drawImage(
      image,
      (position.x * scale) - drawWidth / 2,
      (position.y * scale) - drawHeight / 2,
      drawWidth,
      drawHeight
    );

    ctx.restore();

    const cropSize = size * 0.85 * scale;
    const cropX = (outputSize - cropSize) / 2;

    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = outputSize;
    finalCanvas.height = outputSize;
    const finalCtx = finalCanvas.getContext('2d');
    if (!finalCtx) return null;

    finalCtx.drawImage(
      cropCanvas,
      cropX, cropX, cropSize, cropSize,
      0, 0, outputSize, outputSize
    );

    return new Promise<File>((resolve) => {
      finalCanvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
          resolve(file);
        }
      }, 'image/jpeg', 0.95);
    });
  }, [zoom, rotation, position]);

  const handleSave = async () => {
    const croppedImage = await getCroppedImage();
    if (croppedImage) {
      onCropComplete(croppedImage);
    }
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle>Ajustar Foto de Perfil</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Arraste para posicionar e use o zoom para ajustar
          </p>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-6">
          <div
            ref={containerRef}
            className="relative w-full h-[400px] bg-black rounded-lg overflow-hidden cursor-move select-none touch-none"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleMouseUp}
          >
            <canvas ref={canvasRef} className="w-full h-full" />
          </div>

          <div className="space-y-4 bg-muted/30 p-4 rounded-lg">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium flex items-center gap-2">
                  <ZoomIn className="h-4 w-4" />
                  Zoom
                </label>
                <span className="text-sm font-medium tabular-nums">
                  {Math.round(zoom * 100)}%
                </span>
              </div>
              <Slider
                value={[zoom]}
                onValueChange={([value]) => setZoom(value)}
                min={0.5}
                max={3}
                step={0.05}
                className="w-full"
              />
            </div>

            <div className="flex justify-center">
              <Button variant="outline" onClick={handleRotate} className="gap-2">
                <RotateCw className="h-4 w-4" />
                Girar 90°
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 pb-6 pt-0 gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            Cancelar
          </Button>
          <Button onClick={handleSave} className="flex-1">
            Salvar Foto
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
