'use client';

import { useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/hooks/useNotifications';
import type { Notification } from '@/stores/notificationStore';

interface NotificationBellProps {
  className?: string;
}

/**
 * Notification bell icon with badge
 */
export function NotificationBell({ className }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead, removeNotification } = useNotifications();

  return (
    <div className={cn('relative', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-secondary transition-colors"
        aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-hidden rounded-xl border bg-card shadow-lg z-50">
            <div className="flex items-center justify-between p-3 border-b">
              <h3 className="font-semibold">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-primary hover:underline"
                >
                  Mark all as read
                </button>
              )}
            </div>

            <div className="overflow-y-auto max-h-72">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">
                  <p>No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y">
                  {notifications.slice(0, 10).map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onRead={() => markAsRead(notification.id)}
                      onRemove={() => removeNotification(notification.id)}
                      onNavigate={() => setIsOpen(false)}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="p-2 border-t">
              <Link
                href="/settings/notifications"
                className="block w-full text-center text-sm text-primary hover:underline py-2"
                onClick={() => setIsOpen(false)}
              >
                Manage notifications
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

interface NotificationItemProps {
  notification: Notification;
  onRead: () => void;
  onRemove: () => void;
  onNavigate: () => void;
}

function NotificationItem({ notification, onRead, onRemove, onNavigate }: NotificationItemProps) {
  const { type, title, body, url, read, createdAt } = notification;

  const getIcon = () => {
    switch (type) {
      case 'match_start':
        return '🏏';
      case 'team_deadline':
        return '⏰';
      case 'contest_start':
      case 'contest_result':
        return '🏆';
      case 'points_update':
      case 'live_milestone':
        return '📊';
      case 'live_wicket':
        return '🎯';
      default:
        return '📢';
    }
  };

  const timeAgo = getTimeAgo(new Date(createdAt));

  const content = (
    <div
      className={cn(
        'flex gap-3 p-3 hover:bg-secondary/50 transition-colors cursor-pointer',
        !read && 'bg-primary/5'
      )}
      onClick={() => {
        onRead();
        if (url) onNavigate();
      }}
    >
      <span className="text-xl flex-shrink-0">{getIcon()}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={cn('text-sm font-medium truncate', !read && 'text-primary')}>
            {title}
          </p>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="text-muted-foreground hover:text-foreground flex-shrink-0"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2">{body}</p>
        <p className="text-xs text-muted-foreground mt-1">{timeAgo}</p>
      </div>
      {!read && (
        <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
      )}
    </div>
  );

  if (url) {
    return <Link href={url}>{content}</Link>;
  }

  return content;
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  
  return date.toLocaleDateString();
}

interface NotificationToastProps {
  notification: Notification;
  onClose: () => void;
}

/**
 * Toast notification for in-app alerts
 */
export function NotificationToast({ notification, onClose }: NotificationToastProps) {
  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 fade-in duration-300">
      <div className="bg-card border rounded-xl shadow-lg p-4 max-w-sm">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <p className="font-medium">{notification.title}</p>
            <p className="text-sm text-muted-foreground">{notification.body}</p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        {notification.url && (
          <Link
            href={notification.url}
            className="block mt-2 text-sm text-primary hover:underline"
            onClick={onClose}
          >
            View details →
          </Link>
        )}
      </div>
    </div>
  );
}
