/**
 * Device Detection Hook
 * 
 * Detects new device logins and triggers notifications.
 */

import { useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotificationPreferences } from './useNotificationPreferences';
import { usePushNotifications } from './usePushNotifications';
import { useSecurityNotify } from './useSecurityNotify';
import { checkAndRegisterDevice, getDeviceName } from '@/lib/deviceFingerprint';
import { useTranslation } from 'react-i18next';
import { toast } from './useToast';

export function useDeviceDetection() {
  const { t } = useTranslation('ui');
  const { user } = useAuth();
  const { preferences } = useNotificationPreferences();
  const { showNotification, isEnabled: pushEnabled } = usePushNotifications();
  const { notify } = useSecurityNotify();
  const hasCheckedRef = useRef(false);

  const checkDevice = useCallback(async () => {
    if (!user || hasCheckedRef.current) return;
    
    hasCheckedRef.current = true;
    
    const { isNew, device } = checkAndRegisterDevice();
    
    if (isNew && preferences?.new_device_login) {
      // Show toast notification
      toast({
        title: t('newDeviceDetected', 'New device detected'),
        description: t('newDeviceDetectedDesc', 'You are now signed in on {{device}}', { device: device.name }),
      });
      
      // Send push notification if enabled
      if (pushEnabled) {
        showNotification(
          t('securityAlert', 'Security Alert'),
          {
            body: t('newDeviceLoginBody', 'New sign-in from {{device}}', { device: device.name }),
            tag: 'new-device-login',
          }
        );
      }
      
      // Send email notification
      await notify('new_device_login', { 
        device_name: device.name,
        login_time: device.firstSeen,
      });
    }
  }, [user, preferences?.new_device_login, pushEnabled, showNotification, notify, t]);

  useEffect(() => {
    checkDevice();
  }, [checkDevice]);

  // Reset check flag when user changes
  useEffect(() => {
    if (!user) {
      hasCheckedRef.current = false;
    }
  }, [user]);

  return {
    checkDevice,
    currentDevice: getDeviceName(),
  };
}
