import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ContestDetailContent } from './ContestDetailContent';

interface ContestDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ContestDetailPage({ params }: ContestDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=/contests/${id}`);
  }

  // Check if user has joined this contest
  const { data: entry } = await supabase
    .from('contest_entries')
    .select('id, fantasy_team_id')
    .eq('contest_id', id)
    .eq('user_id', user.id)
    .single();

  // Get user's fantasy teams for this contest's tournament
  const { data: contest } = await supabase
    .from('contests')
    .select('tournament_id, match_id')
    .eq('id', id)
    .single();

  let userTeams: { id: string; name: string }[] = [];
  if (contest) {
    const { data: teams } = await supabase
      .from('fantasy_teams')
      .select('id, name')
      .eq('user_id', user.id)
      .eq('tournament_id', contest.tournament_id);
    userTeams = teams || [];
  }

  return (
    <div className="min-h-screen bg-background">
      <ContestDetailContent
        contestId={id}
        userId={user.id}
        isJoined={!!entry}
        currentEntryId={entry?.id}
        currentTeamId={entry?.fantasy_team_id}
        userTeams={userTeams}
        matchId={contest?.match_id}
      />
    </div>
  );
}
