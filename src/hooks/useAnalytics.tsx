'use client';

import React, { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAnalyticsStore, measurePerformance } from '@/stores/analyticsStore';

/**
 * Hook to track page views automatically
 */
export function usePageTracking() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const trackPageView = useAnalyticsStore((s) => s.trackPageView);

  useEffect(() => {
    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
    trackPageView(url);
  }, [pathname, searchParams, trackPageView]);
}

/**
 * Hook to track user interactions
 */
export function useInteractionTracking() {
  const trackEvent = useAnalyticsStore((s) => s.trackEvent);

  return {
    trackTeamCreated: (matchId: string, teamName: string) => {
      trackEvent('team_created', { matchId, teamName });
    },
    trackTeamUpdated: (teamId: string) => {
      trackEvent('team_updated', { teamId });
    },
    trackContestJoined: (contestId: string, entryFee: number) => {
      trackEvent('contest_joined', { contestId, entryFee });
    },
    trackContestLeft: (contestId: string) => {
      trackEvent('contest_left', { contestId });
    },
    trackMatchViewed: (matchId: string) => {
      trackEvent('match_viewed', { matchId });
    },
    trackPlayerSelected: (playerId: string, playerName: string, role: string) => {
      trackEvent('player_selected', { playerId, playerName, role });
    },
    trackPlayerRemoved: (playerId: string) => {
      trackEvent('player_removed', { playerId });
    },
    trackCaptainSelected: (playerId: string, type: 'captain' | 'viceCaptain') => {
      trackEvent('captain_selected', { playerId, type });
    },
  };
}

/**
 * Hook to track component performance
 */
export function useComponentPerformance(componentName: string) {
  useEffect(() => {
    const end = measurePerformance(`${componentName}_mount`);
    return () => {
      end();
    };
  }, [componentName]);
}

/**
 * Provider component for analytics
 */
export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const setUserId = useAnalyticsStore((s) => s.setUserId);
  const flushEvents = useAnalyticsStore((s) => s.flushEvents);

  // Flush events on page unload
  useEffect(() => {
    const handleUnload = () => {
      flushEvents();
    };

    window.addEventListener('beforeunload', handleUnload);
    window.addEventListener('pagehide', handleUnload);

    // Flush periodically
    const interval = setInterval(flushEvents, 30000);

    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      window.removeEventListener('pagehide', handleUnload);
      clearInterval(interval);
    };
  }, [flushEvents]);

  // Track user from auth (would integrate with Supabase auth)
  useEffect(() => {
    // This would be called when user logs in
    // setUserId(user.id);
  }, [setUserId]);

  return <>{children}</>;
}

export { measurePerformance, trackWebVitals } from '@/stores/analyticsStore';
