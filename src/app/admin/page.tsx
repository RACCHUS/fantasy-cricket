import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AdminDashboardContent from './AdminDashboardContent';

export const metadata: Metadata = {
  title: 'Admin Dashboard | Fantasy Cricket',
  description: 'System administration and analytics',
};

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/admin');
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    redirect('/dashboard');
  }

  // Fetch initial stats
  const [
    { count: userCount },
    { count: teamCount },
    { count: contestCount },
    { count: matchCount },
  ] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('fantasy_teams').select('*', { count: 'exact', head: true }),
    supabase.from('contests').select('*', { count: 'exact', head: true }),
    supabase.from('matches').select('*', { count: 'exact', head: true }),
  ]);

  return (
    <AdminDashboardContent
      initialStats={{
        users: userCount || 0,
        teams: teamCount || 0,
        contests: contestCount || 0,
        matches: matchCount || 0,
      }}
    />
  );
}
