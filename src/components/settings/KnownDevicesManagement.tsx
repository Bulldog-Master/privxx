/**
 * Known Devices Management Component
 * 
 * Displays and manages registered devices for new device login alerts.
 */

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Smartphone, Laptop, Monitor, Trash2, Clock, CheckCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { getKnownDevices, KnownDevice, getCurrentDeviceFingerprint, clearKnownDevices } from "@/lib/deviceFingerprint";
import { toast } from "@/hooks/useToast";
import { formatDistanceToNow } from "date-fns";

function getDeviceIcon(name: string) {
  if (/iPhone|Android/.test(name)) return Smartphone;
  if (/iPad|Tablet/.test(name)) return Monitor;
  return Laptop;
}

export function KnownDevicesManagement() {
  const { t } = useTranslation("ui");
  const [devices, setDevices] = useState<KnownDevice[]>([]);
  const [currentFingerprint, setCurrentFingerprint] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setDevices(getKnownDevices());
    setCurrentFingerprint(getCurrentDeviceFingerprint());
    setIsLoading(false);
  }, []);

  const handleRemoveDevice = (fingerprint: string) => {
    const updatedDevices = devices.filter(d => d.fingerprint !== fingerprint);
    localStorage.setItem("privxx_known_devices", JSON.stringify(updatedDevices));
    setDevices(updatedDevices);
    toast({
      title: t("deviceRemoved", "Device removed"),
      description: t("deviceRemovedDesc", "You'll be notified if this device signs in again."),
    });
  };

  const handleClearAllDevices = () => {
    clearKnownDevices();
    setDevices([]);
    toast({
      title: t("allDevicesCleared", "All devices cleared"),
      description: t("allDevicesClearedDesc", "You'll be notified on your next sign-in."),
    });
  };

  if (isLoading) {
    return (
      <Card className="bg-card/90 backdrop-blur-sm border-border/50">
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-60" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/90 backdrop-blur-sm border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Laptop className="h-5 w-5" />
              {t("knownDevices", "Known Devices")}
            </CardTitle>
            <CardDescription className="text-primary/70">
              {t("knownDevicesDesc", "Devices that won't trigger new login alerts")}
            </CardDescription>
          </div>
          {devices.length > 1 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                  {t("clearAll", "Clear all")}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("clearAllDevices", "Clear all devices?")}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t("clearAllDevicesDesc", "This will remove all known devices. You'll receive new device alerts when signing in from any device, including this one.")}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t("cancel", "Cancel")}</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearAllDevices} className="bg-destructive hover:bg-destructive/90">
                    {t("clearAll", "Clear all")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {devices.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Smartphone className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">{t("noKnownDevices", "No known devices registered")}</p>
            <p className="text-xs mt-1">{t("noKnownDevicesHint", "Devices are registered automatically on sign-in")}</p>
          </div>
        ) : (
          <ScrollArea className="h-[200px]">
            <div className="space-y-2">
              {devices.map((device) => {
                const DeviceIcon = getDeviceIcon(device.name);
                const isCurrentDevice = device.fingerprint === currentFingerprint;
                
                return (
                  <div
                    key={device.fingerprint}
                    className="flex items-center gap-3 p-3 rounded-lg bg-background/50 border border-border/30"
                  >
                    <div className="shrink-0">
                      <DeviceIcon className="h-5 w-5 text-primary/70" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-primary truncate">
                          {device.name}
                        </p>
                        {isCurrentDevice && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 text-green-600 border-green-500/30 bg-green-500/10">
                            <CheckCircle className="h-2.5 w-2.5 mr-0.5" />
                            {t("thisDevice", "This device")}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {t("firstSeen", "First")}: {formatDistanceToNow(new Date(device.firstSeen), { addSuffix: true })}
                        </span>
                        <span>
                          {t("lastSeen", "Last")}: {formatDistanceToNow(new Date(device.lastSeen), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                    {!isCurrentDevice && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t("removeDevice", "Remove device?")}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {t("removeDeviceDesc", "Removing \"{{device}}\" will trigger a new device alert if it signs in again.", { device: device.name })}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t("cancel", "Cancel")}</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleRemoveDevice(device.fingerprint)}
                              className="bg-destructive hover:bg-destructive/90"
                            >
                              {t("remove", "Remove")}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
