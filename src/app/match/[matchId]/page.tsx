import type { Metadata } from 'next';
import MatchDayContent from './MatchDayContent';

interface MatchDayPageProps {
  params: Promise<{ matchId: string }>;
}

export async function generateMetadata({ params }: MatchDayPageProps): Promise<Metadata> {
  const { matchId } = await params;
  return {
    title: `Live Match - ${matchId} | Fantasy Cricket`,
    description: 'Watch live scores and fantasy points as the action unfolds',
  };
}

export default async function MatchDayPage({ params }: MatchDayPageProps) {
  const { matchId } = await params;
  return <MatchDayContent matchId={matchId} />;
}
