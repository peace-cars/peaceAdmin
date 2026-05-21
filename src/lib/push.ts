import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { api } from './api';
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyBpJraL1_zBlFHhhfDUZi9CHvtKyFPqNgw",
  projectId: "peace-cars",
  storageBucket: "peace-cars.firebasestorage.app",
  messagingSenderId: "1013978501823",
  appId: "1:1013978501823:android:a6c9a04b5dc57cb75fec0a"
};

/**
 * Register push notification listeners and request permissions on Capacitor native platforms
 */
export async function initializePushNotifications(userId: string, userGesture = false) {
  if (Capacitor.isNativePlatform()) {
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
      PushNotifications.addListener('registration', async (pushToken) => {
        console.log('[Push] Native device registered with token:', pushToken.value);
        try {
          const platform = typeof Capacitor.getPlatform === 'function' ? Capacitor.getPlatform() : 'web';
          const deviceInfo = {
            platform,
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
            appVersion: platform,
          };
          await api.post('/notifications/register-fcm', {
            token: pushToken.value,
            device: deviceInfo
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
  } else {
    // Web implementation via Firebase Cloud Messaging
    try {
      console.log('[Push] Initializing Firebase Web Push...');
      if (!('Notification' in window)) {
        console.warn('[Push] This browser does not support desktop notification');
        return;
      }

      const currentPermission = Notification.permission;
      if (currentPermission === 'default' && !userGesture) {
        console.log('[Push] Web Push permission request deferred until user gesture.');
        return;
      }

      const permission = currentPermission === 'default'
        ? await Notification.requestPermission()
        : currentPermission;

      if (permission !== 'granted') {
        console.warn('[Push] Web Push permission denied.');
        return;
      }

      // Initialize Firebase App
      const app = initializeApp(firebaseConfig);
      const messaging = getMessaging(app);

      // Register FCM Web Push token
      const currentToken = await getToken(messaging);
      
      if (currentToken) {
        console.log('[Push] Web Push registered successfully');
        const deviceInfo = {
          platform: 'web',
          userAgent: navigator.userAgent,
          appVersion: 'web',
        };
        await api.post('/notifications/register-fcm', {
          token: currentToken,
          device: deviceInfo
        });
      } else {
        console.warn('[Push] No registration token available. Request permission to generate one.');
      }

      // Handle foreground messages
      onMessage(messaging, (payload) => {
        console.log('[Push] Foreground Message received.', payload);
      });

    } catch (err) {
      console.error('[Push] Firebase Web Push setup failure:', err);
    }
  }
}
