import { useState, useRef, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { ZoomIn, ZoomOut, RotateCw } from 'lucide-react';

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

    const containerWidth = containerRef.current?.clientWidth || 400;
    const containerHeight = containerRef.current?.clientHeight || 400;

    canvas.width = containerWidth;
    canvas.height = containerHeight;

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    ctx.translate(centerX + position.x, centerY + position.y);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(zoom, zoom);

    const imgWidth = image.width;
    const imgHeight = image.height;
    const scale = Math.max(canvas.width / imgWidth, canvas.height / imgHeight);

    const scaledWidth = imgWidth * scale;
    const scaledHeight = imgHeight * scale;

    ctx.drawImage(
      image,
      -scaledWidth / 2,
      -scaledHeight / 2,
      scaledWidth,
      scaledHeight
    );

    ctx.restore();

    const cropSize = Math.min(canvas.width, canvas.height) * 0.8;
    const cropX = (canvas.width - cropSize) / 2;
    const cropY = (canvas.height - cropSize) / 2;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);

    if (aspectRatio === 1) {
      ctx.strokeRect(cropX, cropY, cropSize, cropSize);
    } else {
      const cropWidth = cropSize;
      const cropHeight = cropSize / aspectRatio;
      const adjustedCropY = (canvas.height - cropHeight) / 2;
      ctx.strokeRect(cropX, adjustedCropY, cropWidth, cropHeight);
    }

    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, cropY);
    ctx.fillRect(0, cropY + cropSize, canvas.width, canvas.height - cropY - cropSize);
    ctx.fillRect(0, cropY, cropX, cropSize);
    ctx.fillRect(cropX + cropSize, cropY, canvas.width - cropX - cropSize, cropSize);
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

    const cropCanvas = document.createElement('canvas');
    const ctx = cropCanvas.getContext('2d');
    if (!ctx) return null;

    const outputSize = 400;
    cropCanvas.width = outputSize;
    cropCanvas.height = aspectRatio === 1 ? outputSize : outputSize / aspectRatio;

    const containerWidth = canvas.width;
    const containerHeight = canvas.height;
    const cropSize = Math.min(containerWidth, containerHeight) * 0.8;

    ctx.save();
    ctx.translate(cropCanvas.width / 2, cropCanvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(zoom, zoom);

    const imgWidth = image.width;
    const imgHeight = image.height;
    const scale = Math.max(containerWidth / imgWidth, containerHeight / imgHeight);

    const scaledWidth = imgWidth * scale;
    const scaledHeight = imgHeight * scale;

    const sourceX = (scaledWidth / 2) - (cropSize / 2) * (scaledWidth / containerWidth) - (position.x * scaledWidth / containerWidth);
    const sourceY = (scaledHeight / 2) - (cropSize / 2) * (scaledHeight / containerHeight) - (position.y * scaledHeight / containerHeight);
    const sourceWidth = cropSize * (scaledWidth / containerWidth);
    const sourceHeight = cropSize * (scaledHeight / containerHeight);

    ctx.drawImage(
      image,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      -cropCanvas.width / 2,
      -cropCanvas.height / 2,
      cropCanvas.width,
      cropCanvas.height
    );

    ctx.restore();

    return new Promise<File>((resolve) => {
      cropCanvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'cropped-image.jpg', { type: 'image/jpeg' });
          resolve(file);
        }
      }, 'image/jpeg', 0.95);
    });
  }, [zoom, rotation, position, aspectRatio]);

  const handleSave = async () => {
    const croppedImage = await getCroppedImage();
    if (croppedImage) {
      onCropComplete(croppedImage);
      onOpenChange(false);
    }
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Ajustar Foto</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div
            ref={containerRef}
            className="relative w-full h-[400px] bg-black rounded-lg overflow-hidden cursor-move select-none"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleMouseUp}
          >
            <canvas
              ref={canvasRef}
              className="w-full h-full"
            />
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium flex items-center gap-2">
                  <ZoomIn className="h-4 w-4" />
                  Zoom
                </label>
                <span className="text-sm text-muted-foreground">{Math.round(zoom * 100)}%</span>
              </div>
              <Slider
                value={[zoom]}
                onValueChange={([value]) => setZoom(value)}
                min={0.5}
                max={3}
                step={0.1}
                className="w-full"
              />
            </div>

            <div className="flex items-center justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRotate}
                className="gap-2"
              >
                <RotateCw className="h-4 w-4" />
                Girar 90°
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            Salvar Foto
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
