import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Crop, Check, X } from 'lucide-react';

interface ImageCropperProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  onCrop: (croppedImage: File) => void;
}

export function ImageCropper({ isOpen, onClose, imageUrl, onCrop }: ImageCropperProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [cropArea, setCropArea] = useState({ x: 0, y: 0, width: 200, height: 200 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if clicking on resize handle (bottom-right corner)
    if (x >= cropArea.x + cropArea.width - 10 && x <= cropArea.x + cropArea.width + 10 &&
        y >= cropArea.y + cropArea.height - 10 && y <= cropArea.y + cropArea.height + 10) {
      setIsResizing(true);
    } else if (x >= cropArea.x && x <= cropArea.x + cropArea.width &&
               y >= cropArea.y && y <= cropArea.y + cropArea.height) {
      setIsDragging(true);
      setDragStart({ x: x - cropArea.x, y: y - cropArea.y });
    }
  }, [cropArea]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect || (!isDragging && !isResizing)) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (isDragging) {
      const newX = Math.max(0, Math.min(x - dragStart.x, rect.width - cropArea.width));
      const newY = Math.max(0, Math.min(y - dragStart.y, rect.height - cropArea.height));
      setCropArea(prev => ({ ...prev, x: newX, y: newY }));
    } else if (isResizing) {
      const size = Math.min(
        Math.max(50, x - cropArea.x),
        Math.max(50, y - cropArea.y),
        rect.width - cropArea.x,
        rect.height - cropArea.y
      );
      setCropArea(prev => ({ ...prev, width: size, height: size }));
    }
  }, [isDragging, isResizing, dragStart, cropArea]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
  }, []);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw image
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    // Draw overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Clear crop area
    ctx.clearRect(cropArea.x, cropArea.y, cropArea.width, cropArea.height);
    ctx.drawImage(image, 
      cropArea.x * (image.naturalWidth / canvas.width),
      cropArea.y * (image.naturalHeight / canvas.height),
      cropArea.width * (image.naturalWidth / canvas.width),
      cropArea.height * (image.naturalHeight / canvas.height),
      cropArea.x, cropArea.y, cropArea.width, cropArea.height
    );

    // Draw crop border
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(cropArea.x, cropArea.y, cropArea.width, cropArea.height);

    // Draw resize handle
    ctx.fillStyle = '#fff';
    ctx.fillRect(cropArea.x + cropArea.width - 8, cropArea.y + cropArea.height - 8, 8, 8);
  }, [cropArea]);

  const handleImageLoad = useCallback(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image) return;

    // Set canvas size to match container
    const container = canvas.parentElement;
    if (container) {
      const aspectRatio = image.naturalWidth / image.naturalHeight;
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;
      
      let canvasWidth = containerWidth;
      let canvasHeight = containerWidth / aspectRatio;
      
      if (canvasHeight > containerHeight) {
        canvasHeight = containerHeight;
        canvasWidth = containerHeight * aspectRatio;
      }
      
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      
      // Center crop area
      const size = Math.min(canvasWidth, canvasHeight) * 0.6;
      setCropArea({
        x: (canvasWidth - size) / 2,
        y: (canvasHeight - size) / 2,
        width: size,
        height: size
      });
    }
  }, []);

  React.useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  const handleCrop = useCallback(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image) return;

    // Create a new canvas for the cropped image
    const cropCanvas = document.createElement('canvas');
    const cropCtx = cropCanvas.getContext('2d');
    if (!cropCtx) return;

    cropCanvas.width = cropArea.width;
    cropCanvas.height = cropArea.height;

    // Calculate source coordinates
    const scaleX = image.naturalWidth / canvas.width;
    const scaleY = image.naturalHeight / canvas.height;
    const sourceX = cropArea.x * scaleX;
    const sourceY = cropArea.y * scaleY;
    const sourceWidth = cropArea.width * scaleX;
    const sourceHeight = cropArea.height * scaleY;

    // Draw cropped image
    cropCtx.drawImage(
      image,
      sourceX, sourceY, sourceWidth, sourceHeight,
      0, 0, cropArea.width, cropArea.height
    );

    // Convert to blob and create file
    cropCanvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'cropped-image.png', { type: 'image/png' });
        onCrop(file);
      }
    }, 'image/png');
  }, [cropArea, onCrop]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crop className="h-5 w-5" />
            Crop Image for Editing
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden">
          <div className="relative w-full h-96 bg-muted rounded-lg overflow-hidden">
            <img
              ref={imageRef}
              src={imageUrl}
              alt="Image to crop"
              className="hidden"
              onLoad={handleImageLoad}
            />
            <canvas
              ref={canvasRef}
              className="cursor-crosshair"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            />
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Drag to move the crop area, resize using the handle in the bottom-right corner
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleCrop}>
            <Check className="h-4 w-4 mr-2" />
            Crop & Edit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}