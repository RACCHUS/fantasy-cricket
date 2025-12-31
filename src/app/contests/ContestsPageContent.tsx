'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ContestList } from '@/components/contest';
import { cn } from '@/lib/utils';

interface ContestsPageContentProps {
  userId: string;
  joinedContestIds: string[];
}

export function ContestsPageContent({
  userId,
  joinedContestIds: initialJoinedIds,
}: ContestsPageContentProps) {
  const router = useRouter();
  const [joinedContestIds, setJoinedContestIds] = useState(initialJoinedIds);
  const [activeTab, setActiveTab] = useState<'all' | 'my'>('all');
  const [joiningId, setJoiningId] = useState<string | null>(null);

  const handleJoinContest = async (contestId: string) => {
    // For now, redirect to team builder first
    // In production, show team selector modal
    router.push(`/team/new?contest=${contestId}`);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Contests</h1>
          <p className="text-muted-foreground">
            Join contests and compete with others
          </p>
        </div>
        <Link
          href="/contests/create"
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
        >
          <span>+</span>
          <span>Create Contest</span>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-secondary rounded-lg mb-6 w-fit">
        <button
          onClick={() => setActiveTab('all')}
          className={cn(
            'px-4 py-2 rounded-md text-sm font-medium transition-colors',
            activeTab === 'all'
              ? 'bg-background shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          All Contests
        </button>
        <button
          onClick={() => setActiveTab('my')}
          className={cn(
            'px-4 py-2 rounded-md text-sm font-medium transition-colors',
            activeTab === 'my'
              ? 'bg-background shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          My Contests ({joinedContestIds.length})
        </button>
      </div>

      {/* Contest List */}
      {activeTab === 'all' ? (
        <ContestList
          joinedContestIds={joinedContestIds}
          onJoinContest={handleJoinContest}
          showFilters={true}
          variant="cards"
        />
      ) : (
        <MyContestsList
          joinedContestIds={joinedContestIds}
        />
      )}
    </div>
  );
}

function MyContestsList({ joinedContestIds }: { joinedContestIds: string[] }) {
  if (joinedContestIds.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground text-lg mb-2">
          You haven't joined any contests yet
        </p>
        <p className="text-sm text-muted-foreground mb-4">
          Browse available contests and join one to get started!
        </p>
        <Link
          href="/contests"
          className="text-primary hover:underline"
        >
          Browse Contests →
        </Link>
      </div>
    );
  }

  return (
    <ContestList
      joinedContestIds={joinedContestIds}
      showFilters={true}
      variant="cards"
    />
  );
}
