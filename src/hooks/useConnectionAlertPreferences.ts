import { useState, useCallback, useEffect } from 'react';

export interface ConnectionAlertThresholds {
  latencyWarning: number;   // ms
  latencyCritical: number;  // ms
  degradedDuration: number; // ms
  alertsEnabled: boolean;
  pushEnabled: boolean;     // Push notifications
}

export interface ConnectionAlertHistoryEntry {
  id: string;
  type: 'latency_warning' | 'latency_critical' | 'latency_recovered' | 'connection_lost' | 'connection_degraded' | 'connection_restored';
  timestamp: string;
  latency?: number;
  status?: string;
}

const STORAGE_KEY = 'privxx_connection_alert_prefs';
const HISTORY_KEY = 'privxx_connection_alert_history';
const MAX_HISTORY_ENTRIES = 100;

const DEFAULT_THRESHOLDS: ConnectionAlertThresholds = {
  latencyWarning: 500,
  latencyCritical: 1000,
  degradedDuration: 10000,
  alertsEnabled: true,
  pushEnabled: false,
};

export function useConnectionAlertPreferences() {
  const [thresholds, setThresholds] = useState<ConnectionAlertThresholds>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_THRESHOLDS, ...JSON.parse(stored) };
      }
    } catch {
      // Ignore parse errors
    }
    return DEFAULT_THRESHOLDS;
  });

  const [history, setHistory] = useState<ConnectionAlertHistoryEntry[]>(() => {
    try {
      const stored = localStorage.getItem(HISTORY_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Ignore parse errors
    }
    return [];
  });

  // Persist thresholds
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(thresholds));
    } catch {
      // Ignore storage errors
    }
  }, [thresholds]);

  // Persist history
  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch {
      // Ignore storage errors
    }
  }, [history]);

  const updateThreshold = useCallback(<K extends keyof ConnectionAlertThresholds>(
    key: K,
    value: ConnectionAlertThresholds[K]
  ) => {
    setThresholds(prev => ({ ...prev, [key]: value }));
  }, []);

  const resetThresholds = useCallback(() => {
    setThresholds(DEFAULT_THRESHOLDS);
  }, []);

  const addHistoryEntry = useCallback((
    type: ConnectionAlertHistoryEntry['type'],
    details?: { latency?: number; status?: string }
  ) => {
    const entry: ConnectionAlertHistoryEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      type,
      timestamp: new Date().toISOString(),
      ...details,
    };
    
    setHistory(prev => [entry, ...prev].slice(0, MAX_HISTORY_ENTRIES));
    return entry;
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  const getHistoryForExport = useCallback(() => {
    return {
      exportedAt: new Date().toISOString(),
      appVersion: 'Privxx v0.2.0',
      thresholds,
      history,
    };
  }, [thresholds, history]);

  return {
    thresholds,
    updateThreshold,
    resetThresholds,
    history,
    addHistoryEntry,
    clearHistory,
    getHistoryForExport,
    defaults: DEFAULT_THRESHOLDS,
  };
}
