/**
 * QR Code Dialog Component
 * 
 * Shows QR code for sharing own ID and provides scanning capability
 */

import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { QRCodeSVG } from "qrcode.react";
import { QrCode, Camera, Copy, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { isValidCmixxId } from "../types";

interface QRCodeDialogProps {
  myId: string;
  onScan: (scannedId: string) => void;
}

export function QRCodeDialog({ myId, onScan }: QRCodeDialogProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState<"show" | "scan">("show");
  const [copied, setCopied] = useState(false);
  const [manualId, setManualId] = useState("");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(myId);
      setCopied(true);
      toast.success(t("copiedToClipboard", "Copied to clipboard"));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t("copyFailed", "Failed to copy"));
    }
  };

  const handleManualSubmit = () => {
    const trimmed = manualId.trim();
    if (!trimmed) return;
    
    if (!isValidCmixxId(trimmed)) {
      toast.error(t("invalidRecipientId", "Invalid recipient ID format"));
      return;
    }

    onScan(trimmed);
    setManualId("");
    setIsOpen(false);
    toast.success(t("recipientAdded", "Recipient added"));
  };

  // Start camera for scanning
  const startCamera = async () => {
    setCameraError(null);
    setIsScanning(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setCameraError(t("cameraAccessDenied", "Camera access denied or unavailable"));
      setIsScanning(false);
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  // Cleanup on dialog close
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setTab("show");
      setManualId("");
      setCameraError(null);
    }
  }, [isOpen]);

  // Note: Full QR scanning requires additional library (jsQR or similar)
  // For now, we provide manual input as fallback

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-primary/60 hover:text-primary"
          title={t("qrCode", "QR Code")}
        >
          <QrCode className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("qrCodeTitle", "QR Code")}</DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as "show" | "scan")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="show">{t("myQrCode", "My QR Code")}</TabsTrigger>
            <TabsTrigger value="scan">{t("addRecipient", "Add Recipient")}</TabsTrigger>
          </TabsList>

          <TabsContent value="show" className="space-y-4">
            <div className="flex flex-col items-center p-4">
              <div className="bg-white p-4 rounded-lg">
                <QRCodeSVG
                  value={myId}
                  size={200}
                  level="M"
                  includeMargin={false}
                />
              </div>
              <p className="mt-4 text-sm text-muted-foreground text-center">
                {t("shareQrHint", "Share this QR code so others can message you")}
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                {t("yourRecipientId", "Your Recipient ID")}
              </Label>
              <div className="flex gap-2">
                <Input
                  value={myId}
                  readOnly
                  className="font-mono text-xs"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="scan" className="space-y-4">
            {/* Camera scanning (placeholder for future jsQR integration) */}
            <div className="relative aspect-square bg-muted rounded-lg overflow-hidden">
              {isScanning ? (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-48 h-48 border-2 border-primary/60 rounded-lg" />
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="absolute bottom-4 left-1/2 -translate-x-1/2"
                    onClick={stopCamera}
                  >
                    <X className="h-4 w-4 mr-1" />
                    {t("stopCamera", "Stop")}
                  </Button>
                </>
              ) : cameraError ? (
                <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-4">{cameraError}</p>
                  <Button type="button" variant="outline" onClick={startCamera}>
                    {t("retryCamera", "Retry")}
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full">
                  <Camera className="h-12 w-12 text-muted-foreground/40 mb-4" />
                  <Button type="button" onClick={startCamera}>
                    <Camera className="h-4 w-4 mr-2" />
                    {t("startCamera", "Start Camera")}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    {t("orEnterManually", "or enter ID manually below")}
                  </p>
                </div>
              )}
            </div>

            {/* Manual ID input */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                {t("pasteRecipientId", "Paste Recipient ID")}
              </Label>
              <div className="flex gap-2">
                <Input
                  value={manualId}
                  onChange={(e) => setManualId(e.target.value)}
                  placeholder={t("recipientIdPlaceholder", "Paste cMixx ID here...")}
                  className="font-mono text-xs"
                />
                <Button
                  type="button"
                  onClick={handleManualSubmit}
                  disabled={!manualId.trim()}
                >
                  {t("add", "Add")}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
