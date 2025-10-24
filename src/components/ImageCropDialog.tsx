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

    const cropSize = Math.min(canvas.width, canvas.height) * 0.9;
    const scale = Math.max(cropSize / imgWidth, cropSize / imgHeight) * 1.2;

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

    // Calculate crop area (larger and better positioned)
    const displayCropSize = Math.min(canvas.width, canvas.height) * 0.9;
    let cropX = (canvas.width - displayCropSize) / 2;
    let cropY = (canvas.height - displayCropSize) / 2;
    let cropWidth = displayCropSize;
    let cropHeight = displayCropSize;

    if (aspectRatio !== 1) {
      cropWidth = Math.min(canvas.width * 0.9, canvas.height * 0.9 * aspectRatio);
      cropHeight = cropWidth / aspectRatio;
      cropX = (canvas.width - cropWidth) / 2;
      cropY = (canvas.height - cropHeight) / 2;
    }

    // Draw overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, canvas.width, cropY);
    ctx.fillRect(0, cropY + cropHeight, canvas.width, canvas.height - cropY - cropHeight);
    ctx.fillRect(0, cropY, cropX, cropHeight);
    ctx.fillRect(cropX + cropWidth, cropY, canvas.width - cropX - cropWidth, cropHeight);

    // Draw crop area border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 3;
    ctx.setLineDash([]);
    ctx.strokeRect(cropX, cropY, cropWidth, cropHeight);

    // Draw corner handles
    const handleSize = 20;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillRect(cropX - 2, cropY - 2, handleSize, 4);
    ctx.fillRect(cropX - 2, cropY - 2, 4, handleSize);
    ctx.fillRect(cropX + cropWidth - handleSize + 2, cropY - 2, handleSize, 4);
    ctx.fillRect(cropX + cropWidth - 2, cropY - 2, 4, handleSize);
    ctx.fillRect(cropX - 2, cropY + cropHeight - 2, handleSize, 4);
    ctx.fillRect(cropX - 2, cropY + cropHeight - handleSize + 2, 4, handleSize);
    ctx.fillRect(cropX + cropWidth - handleSize + 2, cropY + cropHeight - 2, handleSize, 4);
    ctx.fillRect(cropX + cropWidth - 2, cropY + cropHeight - handleSize + 2, 4, handleSize);
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

    const outputSize = 800;
    cropCanvas.width = outputSize;
    cropCanvas.height = aspectRatio === 1 ? outputSize : outputSize / aspectRatio;

    const containerWidth = canvas.width;
    const containerHeight = canvas.height;

    let cropSize = Math.min(containerWidth, containerHeight) * 0.9;
    let cropWidth = cropSize;
    let cropHeight = cropSize;

    if (aspectRatio !== 1) {
      cropWidth = Math.min(containerWidth * 0.9, containerHeight * 0.9 * aspectRatio);
      cropHeight = cropWidth / aspectRatio;
    }

    const imgWidth = image.width;
    const imgHeight = image.height;

    const baseScale = Math.max(cropSize / imgWidth, cropSize / imgHeight) * 1.2;

    ctx.save();
    ctx.translate(cropCanvas.width / 2, cropCanvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(zoom, zoom);

    const scaledWidth = imgWidth * baseScale;
    const scaledHeight = imgHeight * baseScale;

    const scaleRatio = outputSize / cropSize;
    const offsetX = -position.x * scaleRatio;
    const offsetY = -position.y * scaleRatio;

    ctx.drawImage(
      image,
      (-scaledWidth / 2 + offsetX) * (cropSize / containerWidth),
      (-scaledHeight / 2 + offsetY) * (cropSize / containerHeight),
      scaledWidth * scaleRatio,
      scaledHeight * scaleRatio
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
      <DialogContent className="max-w-3xl p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 space-y-1">
          <DialogTitle className="text-xl">Ajustar Foto</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Arraste para posicionar, use o zoom e gire a imagem conforme necessário
          </p>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-6">
          <div
            ref={containerRef}
            className="relative w-full h-[500px] bg-black rounded-lg overflow-hidden cursor-move select-none touch-none"
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

          <div className="space-y-6 bg-muted/50 p-4 rounded-lg">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold flex items-center gap-2">
                  <ZoomIn className="h-4 w-4" />
                  Zoom
                </label>
                <span className="text-sm font-medium tabular-nums">{Math.round(zoom * 100)}%</span>
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

            <div className="flex items-center justify-center pt-2">
              <Button
                variant="outline"
                onClick={handleRotate}
                className="gap-2 h-11"
              >
                <RotateCw className="h-5 w-5" />
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
