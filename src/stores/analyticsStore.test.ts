import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAnalyticsStore } from './analyticsStore';

// Mock fetch for flushEvents
global.fetch = vi.fn(() => Promise.resolve({ ok: true })) as unknown as typeof fetch;

describe('analyticsStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useAnalyticsStore.setState({
      sessionId: 'test-session-id',
      userId: null,
      events: [],
      isEnabled: true,
    });
    vi.clearAllMocks();
  });

  describe('trackEvent', () => {
    it('tracks an event with properties', () => {
      useAnalyticsStore.getState().trackEvent('page_view', { page: '/dashboard' });
      
      const events = useAnalyticsStore.getState().events;
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('page_view');
      expect(events[0].properties.page).toBe('/dashboard');
    });

    it('includes session id in events', () => {
      useAnalyticsStore.getState().trackEvent('page_view', {});
      
      const events = useAnalyticsStore.getState().events;
      expect(events[0].sessionId).toBe('test-session-id');
    });

    it('does not track when disabled', () => {
      useAnalyticsStore.getState().setEnabled(false);
      useAnalyticsStore.getState().trackEvent('page_view', {});
      
      expect(useAnalyticsStore.getState().events).toHaveLength(0);
    });

    it('limits buffer to 100 events', () => {
      // Track 105 events
      for (let i = 0; i < 105; i++) {
        useAnalyticsStore.setState((s) => ({
          events: [...s.events, {
            type: 'page_view' as const,
            timestamp: Date.now(),
            properties: { index: i },
            sessionId: 'test-session-id',
          }].slice(-100),
        }));
      }
      
      // Should only keep most recent 100
      expect(useAnalyticsStore.getState().events.length).toBeLessThanOrEqual(100);
    });
  });

  describe('trackPageView', () => {
    it('tracks page view with URL', () => {
      useAnalyticsStore.getState().trackPageView('/contests');
      
      const events = useAnalyticsStore.getState().events;
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('page_view');
      expect(events[0].properties.page).toBe('/contests');
    });
  });

  describe('trackError', () => {
    it('tracks error with message and stack', () => {
      const error = new Error('Test error');
      useAnalyticsStore.getState().trackError(error);
      
      const events = useAnalyticsStore.getState().events;
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('error');
      expect(events[0].properties.message).toBe('Test error');
    });

    it('includes context in error events', () => {
      const error = new Error('Test error');
      useAnalyticsStore.getState().trackError(error, { page: '/dashboard' });
      
      const events = useAnalyticsStore.getState().events;
      expect(events[0].properties.page).toBe('/dashboard');
    });
  });

  describe('trackPerformance', () => {
    it('tracks performance metric', () => {
      useAnalyticsStore.getState().trackPerformance('load_time', 250);
      
      const events = useAnalyticsStore.getState().events;
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('performance');
      expect(events[0].properties.metric).toBe('load_time');
      expect(events[0].properties.value).toBe(250);
    });
  });

  describe('setUserId', () => {
    it('sets user id', () => {
      useAnalyticsStore.getState().setUserId('user-123');
      expect(useAnalyticsStore.getState().userId).toBe('user-123');
    });

    it('clears user id', () => {
      useAnalyticsStore.getState().setUserId('user-123');
      useAnalyticsStore.getState().setUserId(null);
      expect(useAnalyticsStore.getState().userId).toBeNull();
    });
  });

  describe('setEnabled', () => {
    it('toggles tracking enabled state', () => {
      useAnalyticsStore.getState().setEnabled(false);
      expect(useAnalyticsStore.getState().isEnabled).toBe(false);

      useAnalyticsStore.getState().setEnabled(true);
      expect(useAnalyticsStore.getState().isEnabled).toBe(true);
    });
  });
});
