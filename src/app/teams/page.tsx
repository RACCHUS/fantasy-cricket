import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { TeamsContent } from './TeamsContent';

export const metadata: Metadata = {
  title: 'My Teams | Fantasy Cricket',
  description: 'View and manage your fantasy cricket teams',
};

export default async function TeamsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch user's teams
  const { data: teams } = await supabase
    .from('fantasy_teams')
    .select(`
      *,
      matches:match_id (
        id,
        team1_name,
        team2_name,
        match_date,
        status
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return <TeamsContent teams={teams} />;
}
