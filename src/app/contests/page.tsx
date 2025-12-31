import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ContestsPageContent } from './ContestsPageContent';

export default async function ContestsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/contests');
  }

  // Get user's joined contests
  const { data: userEntries } = await supabase
    .from('contest_entries')
    .select('contest_id')
    .eq('user_id', user.id);

  const joinedContestIds = userEntries?.map((e) => e.contest_id) || [];

  return (
    <div className="min-h-screen bg-background">
      <ContestsPageContent 
        userId={user.id} 
        joinedContestIds={joinedContestIds}
      />
    </div>
  );
}
