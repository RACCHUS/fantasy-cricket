import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import webpush from 'web-push';

// Configure VAPID
if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:admin@fantasycricket.app',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
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
    const { title, message, targetUsers, targetAll } = body;

    if (!title || !message) {
      return NextResponse.json({ error: 'Title and message are required' }, { status: 400 });
    }

    // Get push subscriptions
    let query = supabase.from('push_subscriptions').select('subscription');

    if (!targetAll && targetUsers && targetUsers.length > 0) {
      query = query.in('user_id', targetUsers);
    }

    const { data: subscriptions, error } = await query;

    if (error) {
      console.error('Error fetching subscriptions:', error);
      return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 });
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ 
        success: true, 
        sent: 0, 
        message: 'No subscriptions found' 
      });
    }

    // Send notifications
    const payload = JSON.stringify({
      title,
      body: message,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      data: {
        type: 'admin_broadcast',
        timestamp: Date.now(),
      },
    });

    let successCount = 0;
    let failureCount = 0;

    await Promise.all(
      subscriptions.map(async ({ subscription }) => {
        try {
          await webpush.sendNotification(subscription as webpush.PushSubscription, payload);
          successCount++;
        } catch (err) {
          console.error('Failed to send notification:', err);
          failureCount++;
        }
      })
    );

    // Log the broadcast
    await supabase.from('analytics_events').insert({
      event_type: 'admin_notification_broadcast',
      event_data: {
        title,
        targetAll,
        targetUsers: targetUsers?.length || 0,
        successCount,
        failureCount,
      },
      user_id: user.id,
    });

    return NextResponse.json({
      success: true,
      sent: successCount,
      failed: failureCount,
      total: subscriptions.length,
    });
  } catch (error) {
    console.error('Broadcast notification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
