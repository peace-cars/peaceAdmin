import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { api } from './api';

/**
 * Register push notification listeners and request permissions on Capacitor native platforms
 */
export async function initializePushNotifications(userId: string) {
  if (!Capacitor.isNativePlatform()) {
    console.log('[Push] Standard desktop/browser environment detected. Skipping Capacitor native push listeners.');
    return;
  }

  try {
    // 1. Check/Request Permissions
    let permStatus = await PushNotifications.checkPermissions();
    
    if (permStatus.receive === 'prompt') {
      permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive !== 'granted') {
      console.warn('[Push] User denied notification permission request.');
      return;
    }

    // 2. Register with FCM/APNS gateway
    await PushNotifications.register();

    // 3. Handle Registration Success Token
    PushNotifications.addListener('registration', async (token) => {
      console.log('[Push] Native device registered with token:', token.value);
      try {
        await api.post('/notifications/register-fcm', {
          userId,
          token: token.value
        });
        console.log('[Push] Registered token successfully with backend');
      } catch (err) {
        console.error('[Push] Failed to post device token to backend:', err);
      }
    });

    // 4. Handle Registration Failures
    PushNotifications.addListener('registrationError', (error) => {
      console.error('[Push] Device registration error:', error.error);
    });

    // 5. Handle Received Notifications (Foreground)
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('[Push] Foreground notification received:', notification);
    });

    // 6. Handle Tap Actions on Notifications
    PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      console.log('[Push] User tapped notification action:', action);
    });

  } catch (err) {
    console.error('[Push] High-level Capacitor push notification setup failure:', err);
  }
}
