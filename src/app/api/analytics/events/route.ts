import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { AnalyticsEvent } from '@/stores/analyticsStore';

/**
 * POST /api/analytics/events - Store analytics events
 */
export async function POST(request: NextRequest) {
  try {
    const { events } = await request.json() as { events: AnalyticsEvent[] };

    if (!events?.length) {
      return NextResponse.json({ success: true, stored: 0 });
    }

    const supabase = await createClient();

    // Get user if authenticated
    const { data: { user } } = await supabase.auth.getUser();

    // Prepare events for storage
    const eventsToStore = events.map((event) => ({
      type: event.type,
      properties: event.properties,
      session_id: event.sessionId,
      user_id: user?.id || event.userId || null,
      page: event.page,
      created_at: new Date(event.timestamp).toISOString(),
    }));

    // Store in database
    const { error } = await supabase
      .from('analytics_events')
      .insert(eventsToStore);

    if (error) {
      console.error('Failed to store analytics:', error);
      // Don't fail the request, just log
    }

    return NextResponse.json({ success: true, stored: eventsToStore.length });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

/**
 * GET /api/analytics/events - Get analytics summary (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7');
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get event counts by type
    const { data: eventCounts } = await supabase
      .from('analytics_events')
      .select('type')
      .gte('created_at', startDate.toISOString());

    // Get unique users
    const { data: uniqueUsers } = await supabase
      .from('analytics_events')
      .select('user_id')
      .gte('created_at', startDate.toISOString())
      .not('user_id', 'is', null);

    // Get unique sessions
    const { data: uniqueSessions } = await supabase
      .from('analytics_events')
      .select('session_id')
      .gte('created_at', startDate.toISOString());

    // Aggregate counts
    const typeCounts: Record<string, number> = {};
    eventCounts?.forEach((e) => {
      typeCounts[e.type] = (typeCounts[e.type] || 0) + 1;
    });

    const uniqueUserIds = new Set(uniqueUsers?.map((u) => u.user_id));
    const uniqueSessionIds = new Set(uniqueSessions?.map((s) => s.session_id));

    return NextResponse.json({
      period: { days, startDate: startDate.toISOString() },
      totals: {
        events: eventCounts?.length || 0,
        uniqueUsers: uniqueUserIds.size,
        uniqueSessions: uniqueSessionIds.size,
      },
      byType: typeCounts,
    });
  } catch (error) {
    console.error('Analytics query error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
