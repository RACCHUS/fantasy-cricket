import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { TeamBuilderContent } from './TeamBuilderContent';

export const metadata: Metadata = {
  title: 'Create Team | Fantasy Cricket',
  description: 'Build your fantasy cricket team',
};

interface PageProps {
  params: Promise<{ matchId: string }>;
}

export default async function TeamBuilderPage({ params }: PageProps) {
  const { matchId } = await params;
  const supabase = await createClient();
  
  // Check authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  // For now, we'll use mock data
  // In production, fetch from database
  return <TeamBuilderContent matchId={matchId} />;
}
