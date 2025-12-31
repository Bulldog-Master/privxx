/**
 * Push Notifications Hook
 * 
 * Manages browser push notification permissions and sending.
 * Privacy-first: no external push servers, uses native Notification API.
 */

import { useState, useCallback, useEffect } from 'react';

type NotificationPermission = 'default' | 'granted' | 'denied';

interface PushNotificationState {
  permission: NotificationPermission;
  isSupported: boolean;
  isEnabled: boolean;
}

const STORAGE_KEY = 'privxx_push_enabled';

export function usePushNotifications() {
  const [state, setState] = useState<PushNotificationState>(() => {
    const isSupported = typeof window !== 'undefined' && 'Notification' in window;
    const permission = isSupported ? Notification.permission : 'denied';
    
    let isEnabled = false;
    try {
      isEnabled = localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      // Ignore storage errors
    }
    
    return {
      permission,
      isSupported,
      isEnabled: isEnabled && permission === 'granted',
    };
  });

  // Update permission state when it changes
  useEffect(() => {
    if (!state.isSupported) return;
    
    const checkPermission = () => {
      const permission = Notification.permission;
      setState(prev => ({
        ...prev,
        permission,
        isEnabled: prev.isEnabled && permission === 'granted',
      }));
    };
    
    // Check periodically in case permission changes externally
    const interval = setInterval(checkPermission, 5000);
    return () => clearInterval(interval);
  }, [state.isSupported]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported) return false;
    
    try {
      const permission = await Notification.requestPermission();
      const granted = permission === 'granted';
      
      setState(prev => ({
        ...prev,
        permission,
        isEnabled: granted,
      }));
      
      if (granted) {
        try {
          localStorage.setItem(STORAGE_KEY, 'true');
        } catch {
          // Ignore storage errors
        }
      }
      
      return granted;
    } catch {
      return false;
    }
  }, [state.isSupported]);

  const setEnabled = useCallback((enabled: boolean) => {
    setState(prev => ({
      ...prev,
      isEnabled: enabled && prev.permission === 'granted',
    }));
    
    try {
      localStorage.setItem(STORAGE_KEY, enabled ? 'true' : 'false');
    } catch {
      // Ignore storage errors
    }
  }, []);

  const showNotification = useCallback((
    title: string,
    options?: NotificationOptions
  ): boolean => {
    if (!state.isSupported || !state.isEnabled || state.permission !== 'granted') {
      return false;
    }
    
    try {
      const notification = new Notification(title, {
        icon: '/icons/pwa-192x192.png',
        badge: '/icons/pwa-192x192.png',
        tag: 'privxx-alert',
        ...options,
      });
      
      // Auto-close after 10 seconds
      setTimeout(() => notification.close(), 10000);
      
      return true;
    } catch {
      return false;
    }
  }, [state.isSupported, state.isEnabled, state.permission]);

  return {
    ...state,
    requestPermission,
    setEnabled,
    showNotification,
  };
}
