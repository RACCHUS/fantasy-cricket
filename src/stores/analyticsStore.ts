'use client';

import { create } from 'zustand';

// Event types
export type AnalyticsEventType =
  | 'page_view'
  | 'team_created'
  | 'team_updated'
  | 'contest_joined'
  | 'contest_left'
  | 'match_viewed'
  | 'player_selected'
  | 'player_removed'
  | 'captain_selected'
  | 'notification_enabled'
  | 'notification_clicked'
  | 'error'
  | 'performance';

export interface AnalyticsEvent {
  type: AnalyticsEventType;
  timestamp: number;
  properties: Record<string, unknown>;
  sessionId: string;
  userId?: string;
  page?: string;
}

interface AnalyticsState {
  sessionId: string;
  userId: string | null;
  events: AnalyticsEvent[];
  isEnabled: boolean;
  
  // Actions
  setUserId: (userId: string | null) => void;
  trackEvent: (type: AnalyticsEventType, properties?: Record<string, unknown>) => void;
  trackPageView: (page: string, properties?: Record<string, unknown>) => void;
  trackError: (error: Error, context?: Record<string, unknown>) => void;
  trackPerformance: (metric: string, value: number, context?: Record<string, unknown>) => void;
  setEnabled: (enabled: boolean) => void;
  flushEvents: () => Promise<void>;
}

// Generate session ID
function generateSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export const useAnalyticsStore = create<AnalyticsState>((set, get) => ({
  sessionId: generateSessionId(),
  userId: null,
  events: [],
  isEnabled: true,

  setUserId: (userId) => set({ userId }),

  trackEvent: (type, properties = {}) => {
    const state = get();
    if (!state.isEnabled) return;

    const event: AnalyticsEvent = {
      type,
      timestamp: Date.now(),
      properties,
      sessionId: state.sessionId,
      userId: state.userId || undefined,
      page: typeof window !== 'undefined' ? window.location.pathname : undefined,
    };

    set((s) => ({ events: [...s.events, event].slice(-100) }));

    // Auto-flush when buffer is full
    if (get().events.length >= 10) {
      get().flushEvents();
    }
  },

  trackPageView: (page, properties = {}) => {
    get().trackEvent('page_view', { page, ...properties });
  },

  trackError: (error, context = {}) => {
    get().trackEvent('error', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      ...context,
    });
  },

  trackPerformance: (metric, value, context = {}) => {
    get().trackEvent('performance', {
      metric,
      value,
      ...context,
    });
  },

  setEnabled: (enabled) => set({ isEnabled: enabled }),

  flushEvents: async () => {
    const events = get().events;
    if (events.length === 0) return;

    set({ events: [] });

    try {
      await fetch('/api/analytics/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events }),
      });
    } catch (error) {
      // Re-add events on failure
      console.error('Failed to flush analytics:', error);
      set((s) => ({ events: [...events, ...s.events].slice(-100) }));
    }
  },
}));

// Helper hooks
export function useTrackEvent() {
  const trackEvent = useAnalyticsStore((s) => s.trackEvent);
  return trackEvent;
}

export function useTrackPageView() {
  const trackPageView = useAnalyticsStore((s) => s.trackPageView);
  return trackPageView;
}

// Performance tracking utilities
export function measurePerformance(name: string): () => void {
  const start = performance.now();
  return () => {
    const duration = performance.now() - start;
    useAnalyticsStore.getState().trackPerformance(name, duration);
  };
}

// Track Web Vitals
export function trackWebVitals(metric: {
  name: string;
  value: number;
  id: string;
}): void {
  useAnalyticsStore.getState().trackPerformance(metric.name, metric.value, {
    id: metric.id,
  });
}
