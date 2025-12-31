'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Notification types
export type NotificationType = 
  | 'match_start'
  | 'team_deadline'
  | 'contest_start'
  | 'contest_result'
  | 'points_update'
  | 'live_wicket'
  | 'live_milestone'
  | 'general';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  url?: string;
  read: boolean;
  createdAt: string;
  data?: Record<string, unknown>;
}

export interface NotificationPreferences {
  enabled: boolean;
  matchStart: boolean;
  teamDeadline: boolean;
  contestAlerts: boolean;
  liveUpdates: boolean;
  pointsMilestones: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string; // HH:mm format
  quietHoursEnd: string;   // HH:mm format
}

interface NotificationState {
  // Permission state
  permission: NotificationPermission;
  vapidPublicKey: string | null;
  subscription: PushSubscription | null;
  
  // Notifications
  notifications: Notification[];
  unreadCount: number;
  
  // Preferences
  preferences: NotificationPreferences;
  
  // Actions
  setPermission: (permission: NotificationPermission) => void;
  setSubscription: (subscription: PushSubscription | null) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  updatePreferences: (prefs: Partial<NotificationPreferences>) => void;
  
  // Push subscription
  requestPermission: () => Promise<boolean>;
  subscribeToPush: () => Promise<boolean>;
  unsubscribeFromPush: () => Promise<void>;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  enabled: true,
  matchStart: true,
  teamDeadline: true,
  contestAlerts: true,
  liveUpdates: false,
  pointsMilestones: true,
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '08:00',
};

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      permission: 'default',
      vapidPublicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || null,
      subscription: null,
      notifications: [],
      unreadCount: 0,
      preferences: DEFAULT_PREFERENCES,

      setPermission: (permission) => set({ permission }),
      
      setSubscription: (subscription) => set({ subscription }),

      addNotification: (notification) => {
        const id = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newNotification: Notification = {
          ...notification,
          id,
          read: false,
          createdAt: new Date().toISOString(),
        };
        
        set((state) => ({
          notifications: [newNotification, ...state.notifications].slice(0, 100),
          unreadCount: state.unreadCount + 1,
        }));
      },

      markAsRead: (id) => {
        set((state) => {
          const notification = state.notifications.find((n) => n.id === id);
          if (!notification || notification.read) return state;
          
          return {
            notifications: state.notifications.map((n) =>
              n.id === id ? { ...n, read: true } : n
            ),
            unreadCount: Math.max(0, state.unreadCount - 1),
          };
        });
      },

      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
          unreadCount: 0,
        }));
      },

      removeNotification: (id) => {
        set((state) => {
          const notification = state.notifications.find((n) => n.id === id);
          return {
            notifications: state.notifications.filter((n) => n.id !== id),
            unreadCount: notification && !notification.read 
              ? Math.max(0, state.unreadCount - 1) 
              : state.unreadCount,
          };
        });
      },

      clearNotifications: () => {
        set({ notifications: [], unreadCount: 0 });
      },

      updatePreferences: (prefs) => {
        set((state) => ({
          preferences: { ...state.preferences, ...prefs },
        }));
      },

      requestPermission: async () => {
        if (!('Notification' in window)) {
          console.warn('Notifications not supported');
          return false;
        }

        const permission = await Notification.requestPermission();
        set({ permission });
        
        if (permission === 'granted') {
          await get().subscribeToPush();
          return true;
        }
        
        return false;
      },

      subscribeToPush: async () => {
        const { vapidPublicKey } = get();
        
        if (!vapidPublicKey) {
          console.warn('VAPID public key not configured');
          return false;
        }

        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
          console.warn('Push notifications not supported');
          return false;
        }

        try {
          const registration = await navigator.serviceWorker.ready;
          
          // Check for existing subscription
          let subscription = await registration.pushManager.getSubscription();
          
          if (!subscription) {
            // Create new subscription
            const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
            subscription = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: applicationServerKey.buffer as ArrayBuffer,
            });
          }

          set({ subscription });

          // Send subscription to server
          await fetch('/api/notifications/subscribe', {
            method: 'POST',
            body: JSON.stringify(subscription),
            headers: { 'Content-Type': 'application/json' },
          });

          return true;
        } catch (error) {
          console.error('Failed to subscribe to push:', error);
          return false;
        }
      },

      unsubscribeFromPush: async () => {
        const { subscription } = get();
        
        if (subscription) {
          try {
            await subscription.unsubscribe();
            
            // Notify server
            await fetch('/api/notifications/unsubscribe', {
              method: 'POST',
              body: JSON.stringify({ endpoint: subscription.endpoint }),
              headers: { 'Content-Type': 'application/json' },
            });
          } catch (error) {
            console.error('Failed to unsubscribe:', error);
          }
        }
        
        set({ subscription: null });
      },
    }),
    {
      name: 'notification-store',
      partialize: (state) => ({
        notifications: state.notifications.slice(0, 50),
        unreadCount: state.unreadCount,
        preferences: state.preferences,
      }),
    }
  )
);

// Helper to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  
  return outputArray;
}

// Check if in quiet hours
export function isInQuietHours(preferences: NotificationPreferences): boolean {
  if (!preferences.quietHoursEnabled) return false;

  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  
  const [startHour, startMin] = preferences.quietHoursStart.split(':').map(Number);
  const [endHour, endMin] = preferences.quietHoursEnd.split(':').map(Number);
  
  const startTime = startHour * 60 + startMin;
  const endTime = endHour * 60 + endMin;

  // Handle overnight quiet hours (e.g., 22:00 to 08:00)
  if (startTime > endTime) {
    return currentTime >= startTime || currentTime < endTime;
  }
  
  return currentTime >= startTime && currentTime < endTime;
}

// Show local notification
export async function showLocalNotification(
  title: string,
  options: NotificationOptions & { type?: NotificationType } = {}
): Promise<void> {
  const state = useNotificationStore.getState();
  
  // Check if notifications are enabled
  if (!state.preferences.enabled) return;
  
  // Check quiet hours
  if (isInQuietHours(state.preferences)) return;
  
  // Check type-specific preferences
  const { type } = options;
  if (type === 'match_start' && !state.preferences.matchStart) return;
  if (type === 'team_deadline' && !state.preferences.teamDeadline) return;
  if (type === 'contest_start' && !state.preferences.contestAlerts) return;
  if (type === 'contest_result' && !state.preferences.contestAlerts) return;
  if ((type === 'points_update' || type === 'live_milestone') && !state.preferences.pointsMilestones) return;
  if ((type === 'live_wicket') && !state.preferences.liveUpdates) return;

  // Add to in-app notifications
  state.addNotification({
    type: type || 'general',
    title,
    body: options.body || '',
    url: options.data?.url as string,
    data: options.data as Record<string, unknown>,
  });

  // Show system notification if permitted
  if (state.permission === 'granted' && 'Notification' in window) {
    new Notification(title, {
      icon: '/icons/icon-192.png',
      badge: '/icons/badge-72.png',
      ...options,
    });
  }
}
