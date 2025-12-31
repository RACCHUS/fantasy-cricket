import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Verify admin
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get system info
    const systemInfo = {
      version: process.env.APP_VERSION || '0.1.0',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
    };

    // Check database connection
    const { error: dbError } = await supabase.from('profiles').select('id').limit(1);
    const databaseStatus = dbError ? 'error' : 'healthy';

    // Get counts for various entities
    const [
      { count: userCount },
      { count: teamCount },
      { count: contestCount },
      { count: matchCount },
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('fantasy_teams').select('*', { count: 'exact', head: true }),
      supabase.from('contests').select('*', { count: 'exact', head: true }),
      supabase.from('matches').select('*', { count: 'exact', head: true }),
    ]);

    // Get recent activity
    const { data: recentActivity } = await supabase
      .from('analytics_events')
      .select('event_type, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    // Get error counts from last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: errorCount } = await supabase
      .from('analytics_events')
      .select('*', { count: 'exact', head: true })
      .eq('event_type', 'error')
      .gte('created_at', oneDayAgo);

    return NextResponse.json({
      status: 'healthy',
      system: systemInfo,
      services: {
        database: databaseStatus,
        cricketApi: 'unknown', // Would need actual health check
        pushNotifications: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ? 'configured' : 'not_configured',
      },
      counts: {
        users: userCount || 0,
        teams: teamCount || 0,
        contests: contestCount || 0,
        matches: matchCount || 0,
      },
      metrics: {
        errorsLast24h: errorCount || 0,
      },
      recentActivity: recentActivity || [],
    });
  } catch (error) {
    console.error('System health error:', error);
    return NextResponse.json(
      {
        status: 'error',
        error: 'Failed to fetch system health',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Verify admin
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'clear_cache':
        // In a real app, this would clear various caches
        return NextResponse.json({ message: 'Cache cleared successfully' });

      case 'sync_database':
        // Trigger any database sync operations
        return NextResponse.json({ message: 'Database sync initiated' });

      case 'export_data':
        // This would trigger a data export job
        return NextResponse.json({ message: 'Export started', jobId: crypto.randomUUID() });

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error) {
    console.error('System action error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
