import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { CreateContestForm } from './CreateContestForm';

export default async function CreateContestPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/contests/create');
  }

  // Get available tournaments
  const { data: tournaments } = await supabase
    .from('tournaments')
    .select('id, name, league:leagues(name)')
    .eq('status', 'active')
    .order('start_date', { ascending: false });

  // Get upcoming matches
  const { data: matches } = await supabase
    .from('matches')
    .select(`
      id,
      start_time,
      tournament_id,
      team_home:teams!matches_team_home_id_fkey(name),
      team_away:teams!matches_team_away_id_fkey(name)
    `)
    .eq('status', 'upcoming')
    .order('start_time', { ascending: true })
    .limit(20);

  return (
    <div className="min-h-screen bg-background">
      <CreateContestForm
        tournaments={tournaments || []}
        matches={matches || []}
      />
    </div>
  );
}
