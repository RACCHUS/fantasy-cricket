import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { LiveScoreContent } from './LiveScoreContent';

interface LiveScorePageProps {
  params: Promise<{ matchId: string }>;
  searchParams: Promise<{ team?: string }>;
}

export default async function LiveScorePage({ params, searchParams }: LiveScorePageProps) {
  const { matchId } = await params;
  const { team: fantasyTeamId } = await searchParams;
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=/live/${matchId}`);
  }

  return (
    <div className="min-h-screen bg-background">
      <LiveScoreContent 
        matchId={matchId} 
        fantasyTeamId={fantasyTeamId}
        userId={user.id}
      />
    </div>
  );
}
