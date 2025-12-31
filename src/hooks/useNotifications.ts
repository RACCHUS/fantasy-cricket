'use client';

import { useEffect, useState } from 'react';
import { 
  useNotificationStore, 
  type NotificationType,
  type NotificationPreferences 
} from '@/stores/notificationStore';

/**
 * Hook to manage notification permissions and state
 */
export function useNotifications() {
  const store = useNotificationStore();
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Check if notifications are supported
    setIsSupported('Notification' in window && 'serviceWorker' in navigator);
    
    // Update permission state
    if ('Notification' in window) {
      store.setPermission(Notification.permission);
    }
  }, [store]);

  return {
    isSupported,
    permission: store.permission,
    notifications: store.notifications,
    unreadCount: store.unreadCount,
    preferences: store.preferences,
    
    // Actions
    requestPermission: store.requestPermission,
    markAsRead: store.markAsRead,
    markAllAsRead: store.markAllAsRead,
    removeNotification: store.removeNotification,
    clearNotifications: store.clearNotifications,
    updatePreferences: store.updatePreferences,
  };
}

/**
 * Hook to schedule notifications for upcoming matches
 */
export function useMatchNotifications(matchId: string, startTime: Date) {
  const { preferences, permission } = useNotificationStore();

  useEffect(() => {
    if (permission !== 'granted' || !preferences.matchStart) return;

    const timeUntilMatch = startTime.getTime() - Date.now();
    
    // Schedule 30 minutes before notification
    const thirtyMinBefore = timeUntilMatch - 30 * 60 * 1000;
    if (thirtyMinBefore > 0) {
      const timer = setTimeout(() => {
        showMatchStartNotification(matchId, '30 minutes');
      }, thirtyMinBefore);
      
      return () => clearTimeout(timer);
    }

    // Schedule 5 minutes before notification
    const fiveMinBefore = timeUntilMatch - 5 * 60 * 1000;
    if (fiveMinBefore > 0) {
      const timer = setTimeout(() => {
        showMatchStartNotification(matchId, '5 minutes');
      }, fiveMinBefore);
      
      return () => clearTimeout(timer);
    }
  }, [matchId, startTime, preferences.matchStart, permission]);
}

async function showMatchStartNotification(matchId: string, timeRemaining: string) {
  if ('Notification' in window && Notification.permission === 'granted') {
    const notification = new Notification('Match Starting Soon!', {
      body: `Your match starts in ${timeRemaining}. Make sure your team is ready!`,
      icon: '/icons/icon-192.png',
      badge: '/icons/badge-72.png',
      tag: `match-start-${matchId}`,
      data: { url: `/match/${matchId}` },
    });

    notification.onclick = () => {
      window.focus();
      window.location.href = `/match/${matchId}`;
    };
  }
}

/**
 * Hook for team deadline reminders
 */
export function useTeamDeadlineNotification(matchId: string, deadline: Date) {
  const { preferences, permission } = useNotificationStore();

  useEffect(() => {
    if (permission !== 'granted' || !preferences.teamDeadline) return;

    const timeUntilDeadline = deadline.getTime() - Date.now();
    
    // 1 hour before deadline
    const oneHourBefore = timeUntilDeadline - 60 * 60 * 1000;
    if (oneHourBefore > 0) {
      const timer = setTimeout(() => {
        showDeadlineNotification(matchId, '1 hour');
      }, oneHourBefore);
      
      return () => clearTimeout(timer);
    }

    // 15 minutes before deadline
    const fifteenMinBefore = timeUntilDeadline - 15 * 60 * 1000;
    if (fifteenMinBefore > 0) {
      const timer = setTimeout(() => {
        showDeadlineNotification(matchId, '15 minutes');
      }, fifteenMinBefore);
      
      return () => clearTimeout(timer);
    }
  }, [matchId, deadline, preferences.teamDeadline, permission]);
}

async function showDeadlineNotification(matchId: string, timeRemaining: string) {
  if ('Notification' in window && Notification.permission === 'granted') {
    const notification = new Notification('Team Deadline Approaching!', {
      body: `Only ${timeRemaining} left to finalize your team!`,
      icon: '/icons/icon-192.png',
      badge: '/icons/badge-72.png',
      tag: `deadline-${matchId}`,
      requireInteraction: true,
      data: { url: `/team/${matchId}` },
    });

    notification.onclick = () => {
      window.focus();
      window.location.href = `/team/${matchId}`;
    };
  }
}

/**
 * Send live match event notifications
 */
export function sendLiveEventNotification(
  type: 'wicket' | 'milestone' | 'points',
  title: string,
  body: string,
  matchId: string
) {
  const store = useNotificationStore.getState();
  
  if (store.permission !== 'granted') return;
  if (!store.preferences.liveUpdates && type !== 'points') return;
  if (!store.preferences.pointsMilestones && type === 'points') return;

  // Add to in-app notifications
  store.addNotification({
    type: type === 'wicket' ? 'live_wicket' : type === 'milestone' ? 'live_milestone' : 'points_update',
    title,
    body,
    url: `/match/${matchId}`,
  });

  // Show system notification
  if ('Notification' in window) {
    new Notification(title, {
      body,
      icon: '/icons/icon-192.png',
      badge: '/icons/badge-72.png',
      tag: `live-${type}-${matchId}`,
      silent: type === 'points', // Don't make sound for points updates
    });
  }
}

export type { NotificationType, NotificationPreferences };
