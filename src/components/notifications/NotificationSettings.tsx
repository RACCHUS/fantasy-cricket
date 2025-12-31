'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/hooks/useNotifications';

export function NotificationSettings() {
  const { 
    isSupported, 
    permission, 
    preferences, 
    requestPermission, 
    updatePreferences 
  } = useNotifications();
  
  const [isRequesting, setIsRequesting] = useState(false);

  const handleEnableNotifications = async () => {
    setIsRequesting(true);
    try {
      await requestPermission();
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Permission Banner */}
      {permission !== 'granted' && isSupported && (
        <div className="rounded-xl border bg-primary/5 border-primary/20 p-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
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
                className="text-primary"
              >
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Enable Push Notifications</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Get notified about match starts, team deadlines, and live score updates.
              </p>
              <button
                onClick={handleEnableNotifications}
                disabled={isRequesting || permission === 'denied'}
                className={cn(
                  'mt-3 px-4 py-2 rounded-lg font-medium text-sm transition-colors',
                  permission === 'denied'
                    ? 'bg-secondary text-muted-foreground cursor-not-allowed'
                    : 'bg-primary text-primary-foreground hover:bg-primary/90'
                )}
              >
                {isRequesting ? 'Requesting...' : permission === 'denied' ? 'Blocked by Browser' : 'Enable Notifications'}
              </button>
              {permission === 'denied' && (
                <p className="text-xs text-muted-foreground mt-2">
                  Notifications are blocked. Please enable them in your browser settings.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {!isSupported && (
        <div className="rounded-xl border bg-yellow-500/10 border-yellow-500/20 p-4">
          <p className="text-sm text-yellow-600 dark:text-yellow-400">
            Push notifications are not supported in this browser.
          </p>
        </div>
      )}

      {/* Master Toggle */}
      <div className="rounded-xl border bg-card p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Notifications</h3>
            <p className="text-sm text-muted-foreground">
              Enable or disable all notifications
            </p>
          </div>
          <ToggleSwitch
            checked={preferences.enabled}
            onChange={(enabled) => updatePreferences({ enabled })}
          />
        </div>
      </div>

      {/* Notification Types */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Notification Types</h3>
        </div>
        <div className="divide-y">
          <NotificationToggle
            title="Match Start Alerts"
            description="Get notified 30 and 5 minutes before matches start"
            checked={preferences.matchStart}
            onChange={(matchStart) => updatePreferences({ matchStart })}
            disabled={!preferences.enabled}
            icon="🏏"
          />
          <NotificationToggle
            title="Team Deadline Reminders"
            description="Reminder to finalize your team before the deadline"
            checked={preferences.teamDeadline}
            onChange={(teamDeadline) => updatePreferences({ teamDeadline })}
            disabled={!preferences.enabled}
            icon="⏰"
          />
          <NotificationToggle
            title="Contest Alerts"
            description="Updates about contests you've joined"
            checked={preferences.contestAlerts}
            onChange={(contestAlerts) => updatePreferences({ contestAlerts })}
            disabled={!preferences.enabled}
            icon="🏆"
          />
          <NotificationToggle
            title="Live Match Updates"
            description="Wickets, boundaries, and key moments during live matches"
            checked={preferences.liveUpdates}
            onChange={(liveUpdates) => updatePreferences({ liveUpdates })}
            disabled={!preferences.enabled}
            icon="📺"
          />
          <NotificationToggle
            title="Points Milestones"
            description="When your players reach scoring milestones"
            checked={preferences.pointsMilestones}
            onChange={(pointsMilestones) => updatePreferences({ pointsMilestones })}
            disabled={!preferences.enabled}
            icon="📊"
          />
        </div>
      </div>

      {/* Quiet Hours */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Quiet Hours</h3>
              <p className="text-sm text-muted-foreground">
                Pause notifications during specific times
              </p>
            </div>
            <ToggleSwitch
              checked={preferences.quietHoursEnabled}
              onChange={(quietHoursEnabled) => updatePreferences({ quietHoursEnabled })}
              disabled={!preferences.enabled}
            />
          </div>
        </div>
        
        {preferences.quietHoursEnabled && (
          <div className="p-4 flex items-center gap-4">
            <div className="flex-1">
              <label className="text-sm text-muted-foreground block mb-1">From</label>
              <input
                type="time"
                value={preferences.quietHoursStart}
                onChange={(e) => updatePreferences({ quietHoursStart: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border bg-background focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                disabled={!preferences.enabled}
              />
            </div>
            <div className="flex-1">
              <label className="text-sm text-muted-foreground block mb-1">To</label>
              <input
                type="time"
                value={preferences.quietHoursEnd}
                onChange={(e) => updatePreferences({ quietHoursEnd: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border bg-background focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                disabled={!preferences.enabled}
              />
            </div>
          </div>
        )}
      </div>

      {/* Test Notification */}
      {permission === 'granted' && (
        <button
          onClick={() => {
            if ('Notification' in window) {
              new Notification('Test Notification', {
                body: 'Notifications are working correctly!',
                icon: '/icons/icon-192.png',
              });
            }
          }}
          className="w-full py-2 text-sm text-primary hover:underline"
        >
          Send Test Notification
        </button>
      )}
    </div>
  );
}

interface NotificationToggleProps {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  icon: string;
}

function NotificationToggle({
  title,
  description,
  checked,
  onChange,
  disabled,
  icon,
}: NotificationToggleProps) {
  return (
    <div className={cn('p-4 flex items-center gap-4', disabled && 'opacity-50')}>
      <span className="text-2xl">{icon}</span>
      <div className="flex-1">
        <p className="font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <ToggleSwitch checked={checked} onChange={onChange} disabled={disabled} />
    </div>
  );
}

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

function ToggleSwitch({ checked, onChange, disabled }: ToggleSwitchProps) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={cn(
        'relative w-11 h-6 rounded-full transition-colors focus:ring-2 focus:ring-primary focus:ring-offset-2',
        checked ? 'bg-primary' : 'bg-secondary',
        disabled && 'cursor-not-allowed'
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform',
          checked && 'translate-x-5'
        )}
      />
    </button>
  );
}
