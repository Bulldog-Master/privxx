/**
 * useConnectionQualityMonitor Hook
 * 
 * Monitors connection quality and triggers alerts when
 * quality degrades. Integrates with the existing alert system.
 */

import { useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/useToast";
import { useAlertSound } from "@/hooks/useAlertSound";
import { getConnectionQuality, type ConnectionQuality } from "../utils/connectionQuality";
import { calculateConnectionHealth } from "../utils/connectionHealth";
import type { ConnectionHistoryEntry } from "./useConnectionHistory";

export interface QualityAlertConfig {
  /** Enable quality monitoring */
  enabled: boolean;
  /** Play sound on quality degradation */
  soundEnabled: boolean;
  /** Sound type for alerts */
  soundType: "subtle" | "chime" | "alert";
  /** Latency threshold for warning (ms) */
  latencyWarning: number;
  /** Latency threshold for critical (ms) */
  latencyCritical: number;
  /** Minimum health score before warning */
  healthWarning: number;
  /** Cooldown between alerts (ms) */
  alertCooldown: number;
}

const DEFAULT_CONFIG: QualityAlertConfig = {
  enabled: true,
  soundEnabled: true,
  soundType: "chime",
  latencyWarning: 1500,
  latencyCritical: 3000,
  healthWarning: 50,
  alertCooldown: 30000,
};

interface UseConnectionQualityMonitorOptions {
  /** Current latency in ms */
  latency?: number;
  /** Connection history for health calculation */
  history: ConnectionHistoryEntry[];
  /** Whether currently connected */
  isConnected: boolean;
  /** Custom configuration */
  config?: Partial<QualityAlertConfig>;
}

interface UseConnectionQualityMonitorReturn {
  /** Current quality grade */
  quality: ConnectionQuality;
  /** Current health score */
  healthScore: number;
  /** Whether quality is degraded */
  isDegraded: boolean;
  /** Whether quality is critical */
  isCritical: boolean;
}

export function useConnectionQualityMonitor({
  latency,
  history,
  isConnected,
  config: customConfig,
}: UseConnectionQualityMonitorOptions): UseConnectionQualityMonitorReturn {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { playSound } = useAlertSound();
  
  const config = { ...DEFAULT_CONFIG, ...customConfig };
  const lastAlertRef = useRef<number>(0);
  const previousQualityRef = useRef<ConnectionQuality>("unknown");
  const previousHealthRef = useRef<number>(100);
  
  const quality = getConnectionQuality(latency);
  const health = calculateConnectionHealth(latency, history);
  
  const isDegraded = quality === "fair" || quality === "poor";
  const isCritical = quality === "poor" || health.score < 30;
  
  const triggerAlert = useCallback((
    title: string,
    description: string,
    variant: "default" | "destructive"
  ) => {
    const now = Date.now();
    if (now - lastAlertRef.current < config.alertCooldown) {
      return; // Still in cooldown
    }
    
    lastAlertRef.current = now;
    
    // Play sound if enabled
    if (config.soundEnabled) {
      playSound(variant === "destructive");
    }
    
    // Show toast
    toast({
      title,
      description,
      variant,
    });
  }, [config.alertCooldown, config.soundEnabled, playSound, toast]);
  
  // Monitor quality changes
  useEffect(() => {
    if (!config.enabled || !isConnected) return;
    
    const previousQuality = previousQualityRef.current;
    const previousHealth = previousHealthRef.current;
    
    // Check for quality degradation
    if (latency !== undefined) {
      // Critical latency
      if (latency >= config.latencyCritical && previousQualityRef.current !== "poor") {
        triggerAlert(
          t("alerts.latencyCritical.title", "Connection Very Slow"),
          t("alerts.latencyCritical.description", "Latency is critically high ({{latency}}ms).", { latency }),
          "destructive"
        );
      }
      // Warning latency
      else if (
        latency >= config.latencyWarning && 
        latency < config.latencyCritical &&
        previousQuality !== "fair" && 
        previousQuality !== "poor"
      ) {
        triggerAlert(
          t("alerts.latencyWarning.title", "High Latency Detected"),
          t("alerts.latencyWarning.description", "Connection latency is elevated ({{latency}}ms).", { latency }),
          "default"
        );
      }
      // Recovery
      else if (
        (quality === "excellent" || quality === "good") &&
        (previousQuality === "poor" || previousQuality === "fair")
      ) {
        triggerAlert(
          t("alerts.latencyRecovered.title", "Connection Improved"),
          t("alerts.latencyRecovered.description", "Latency has returned to normal levels."),
          "default"
        );
      }
    }
    
    // Check for health score degradation
    if (health.score < config.healthWarning && previousHealth >= config.healthWarning) {
      triggerAlert(
        t("alerts.connectionDegraded.title", "Connection Degraded"),
        t("alerts.connectionDegraded.description", "Connection health has dropped below {{threshold}}%.", { 
          threshold: config.healthWarning 
        }),
        "destructive"
      );
    }
    
    previousQualityRef.current = quality;
    previousHealthRef.current = health.score;
  }, [
    latency, 
    quality, 
    health.score, 
    isConnected, 
    config, 
    triggerAlert, 
    t
  ]);
  
  return {
    quality,
    healthScore: health.score,
    isDegraded,
    isCritical,
  };
}
