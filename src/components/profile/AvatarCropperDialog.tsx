/**
 * Avatar Cropper Dialog
 * 
 * Allows users to crop, position, and apply filters to their avatar before uploading.
 */

import { useState, useRef, useCallback, useEffect } from "react";
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { useTranslation } from "react-i18next";
import { Loader2, ZoomIn, ZoomOut, RotateCw, Sun, Contrast } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AvatarCropperDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageFile: File | null;
  onCropComplete: (croppedBlob: Blob) => void;
}

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number
): Crop {
  return centerCrop(
    makeAspectCrop(
      {
        unit: "%",
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

export function AvatarCropperDialog({
  open,
  onOpenChange,
  imageFile,
  onCropComplete,
}: AvatarCropperDialogProps) {
  const { t } = useTranslation();
  const imgRef = useRef<HTMLImageElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [imageSrc, setImageSrc] = useState<string>("");
  const [scale, setScale] = useState(1);
  const [rotate, setRotate] = useState(0);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [isProcessing, setIsProcessing] = useState(false);

  // Load image when file changes
  useEffect(() => {
    if (imageFile) {
      const reader = new FileReader();
      reader.onload = () => {
        setImageSrc(reader.result as string);
        setScale(1);
        setRotate(0);
        setBrightness(100);
        setContrast(100);
      };
      reader.readAsDataURL(imageFile);
    } else {
      setImageSrc("");
    }
  }, [imageFile]);

  // Reset state when dialog opens with new file
  const handleImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, 1));
    setScale(1);
    setRotate(0);
  }, []);

  // Update preview canvas when crop changes
  useEffect(() => {
    if (!imgRef.current || !completedCrop || !previewCanvasRef.current) return;

    const image = imgRef.current;
    const canvas = previewCanvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    const previewSize = 80;
    canvas.width = previewSize;
    canvas.height = previewSize;

    // Calculate the crop dimensions
    const cropX = completedCrop.x * scaleX;
    const cropY = completedCrop.y * scaleY;
    const cropWidth = completedCrop.width * scaleX;
    const cropHeight = completedCrop.height * scaleY;

    // Apply filters
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;

    // Draw cropped area
    ctx.drawImage(
      image,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      previewSize,
      previewSize
    );
  }, [completedCrop, brightness, contrast]);

  const getCroppedImage = useCallback(async (): Promise<Blob | null> => {
    if (!imgRef.current || !completedCrop) return null;

    const image = imgRef.current;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) return null;

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    // Set canvas size to desired output (256x256 for avatar)
    const outputSize = 256;
    canvas.width = outputSize;
    canvas.height = outputSize;

    // Calculate the crop dimensions at natural image scale
    const cropX = completedCrop.x * scaleX;
    const cropY = completedCrop.y * scaleY;
    const cropWidth = completedCrop.width * scaleX;
    const cropHeight = completedCrop.height * scaleY;

    // Create an offscreen canvas for rotation and scaling
    const offscreen = document.createElement("canvas");
    const offCtx = offscreen.getContext("2d");
    if (!offCtx) return null;

    // Calculate rotated image dimensions
    const rotateRad = (rotate * Math.PI) / 180;
    const cos = Math.abs(Math.cos(rotateRad));
    const sin = Math.abs(Math.sin(rotateRad));
    const rotatedWidth = image.naturalWidth * cos + image.naturalHeight * sin;
    const rotatedHeight = image.naturalWidth * sin + image.naturalHeight * cos;

    offscreen.width = rotatedWidth;
    offscreen.height = rotatedHeight;

    // Apply transformations
    offCtx.translate(rotatedWidth / 2, rotatedHeight / 2);
    offCtx.rotate(rotateRad);
    offCtx.scale(scale, scale);
    offCtx.translate(-image.naturalWidth / 2, -image.naturalHeight / 2);
    offCtx.drawImage(image, 0, 0);

    // Adjust crop coordinates for rotation
    const offsetX = (rotatedWidth - image.naturalWidth) / 2;
    const offsetY = (rotatedHeight - image.naturalHeight) / 2;

    // Apply filters to final canvas
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;

    // Draw cropped area to final canvas
    ctx.drawImage(
      offscreen,
      cropX * scale + offsetX,
      cropY * scale + offsetY,
      cropWidth * scale,
      cropHeight * scale,
      0,
      0,
      outputSize,
      outputSize
    );

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => resolve(blob),
        "image/png",
        1.0
      );
    });
  }, [completedCrop, scale, rotate, brightness, contrast]);

  const handleSave = async () => {
    setIsProcessing(true);
    try {
      const croppedBlob = await getCroppedImage();
      if (croppedBlob) {
        onCropComplete(croppedBlob);
        onOpenChange(false);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleZoomIn = () => setScale((s) => Math.min(s + 0.1, 3));
  const handleZoomOut = () => setScale((s) => Math.max(s - 0.1, 0.5));
  const handleRotate = () => setRotate((r) => (r + 90) % 360);
  const handleResetFilters = () => {
    setBrightness(100);
    setContrast(100);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("cropAvatar", "Crop Avatar")}</DialogTitle>
          <DialogDescription>
            {t("cropAvatarDescription", "Drag to reposition, resize the selection to crop your avatar.")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-4">
          {/* Main cropper area */}
          <div className="flex-1 flex flex-col items-center gap-4">
            {/* Image Cropper */}
            <div className="relative max-h-[250px] overflow-hidden rounded-lg bg-muted/50">
              {imageSrc && (
                <ReactCrop
                  crop={crop}
                  onChange={(_, percentCrop) => setCrop(percentCrop)}
                  onComplete={(c) => setCompletedCrop(c)}
                  aspect={1}
                  circularCrop
                  className="max-h-[250px]"
                >
                  <img
                    ref={imgRef}
                    src={imageSrc}
                    alt="Crop preview"
                    onLoad={handleImageLoad}
                    className="max-h-[250px] max-w-full object-contain"
                    style={{
                      transform: `scale(${scale}) rotate(${rotate}deg)`,
                      filter: `brightness(${brightness}%) contrast(${contrast}%)`,
                    }}
                  />
                </ReactCrop>
              )}
            </div>
          </div>

          {/* Preview panel */}
          <div className="flex flex-col items-center gap-2">
            <Label className="text-xs text-muted-foreground">
              {t("preview", "Preview")}
            </Label>
            <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-primary/20 bg-muted/50">
              <canvas
                ref={previewCanvasRef}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        <Tabs defaultValue="transform" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="transform">{t("transform", "Transform")}</TabsTrigger>
            <TabsTrigger value="filters">{t("filters", "Filters")}</TabsTrigger>
          </TabsList>
          
          <TabsContent value="transform" className="space-y-4 mt-4">
            {/* Zoom Controls */}
            <div className="flex w-full items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={handleZoomOut}
                disabled={scale <= 0.5}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              
              <Slider
                value={[scale]}
                onValueChange={([value]) => setScale(value)}
                min={0.5}
                max={3}
                step={0.1}
                className="flex-1"
              />
              
              <Button
                variant="outline"
                size="icon"
                onClick={handleZoomIn}
                disabled={scale >= 3}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={handleRotate}
              >
                <RotateCw className="h-4 w-4" />
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="filters" className="space-y-4 mt-4">
            {/* Brightness */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2 text-sm">
                  <Sun className="h-4 w-4" />
                  {t("brightness", "Brightness")}
                </Label>
                <span className="text-xs text-muted-foreground">{brightness}%</span>
              </div>
              <Slider
                value={[brightness]}
                onValueChange={([value]) => setBrightness(value)}
                min={50}
                max={150}
                step={5}
              />
            </div>

            {/* Contrast */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2 text-sm">
                  <Contrast className="h-4 w-4" />
                  {t("contrast", "Contrast")}
                </Label>
                <span className="text-xs text-muted-foreground">{contrast}%</span>
              </div>
              <Slider
                value={[contrast]}
                onValueChange={([value]) => setContrast(value)}
                min={50}
                max={150}
                step={5}
              />
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="w-full"
            >
              {t("resetFilters", "Reset Filters")}
            </Button>
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
          >
            {t("cancel", "Cancel")}
          </Button>
          <Button onClick={handleSave} disabled={isProcessing || !completedCrop}>
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                {t("processing", "Processing...")}
              </>
            ) : (
              t("saveAvatar", "Save Avatar")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
