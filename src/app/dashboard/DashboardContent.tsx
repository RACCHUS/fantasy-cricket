'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AppHeader } from '@/components/layout/AppHeader';
import { FeaturedTournaments } from '@/components/home/FeaturedTournaments';
import { LiveTournaments } from '@/components/home/LiveTournaments';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

interface Profile {
  id: string;
  email: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  total_points: number;
  total_wins: number;
  total_contests: number;
}

interface Contest {
  id: string;
  name: string;
  status: string;
  entry_fee: number;
  prize_pool: number;
  max_entries: number;
  current_entries: number;
  match_id: string;
}

interface DashboardContentProps {
  user: User;
  profile: Profile | null;
}

export function DashboardContent({ user, profile }: DashboardContentProps) {
  const [myContests, setMyContests] = useState<Contest[]>([]);
  const [loadingContests, setLoadingContests] = useState(true);

  useEffect(() => {
    async function fetchMyContests() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('contest_entries')
          .select(`
            contest_id,
            contests (
              id,
              name,
              status,
              entry_fee,
              prize_pool,
              max_entries,
              current_entries,
              match_id
            )
          `)
          .eq('user_id', user.id)
          .limit(5);
        
        if (!error && data) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const contests = data
            .map((entry: any) => entry.contests)
            .flat()
            .filter((c: Contest | null): c is Contest => c !== null);
          setMyContests(contests);
        }
      } catch (error) {
        console.error('Failed to fetch contests:', error);
      } finally {
        setLoadingContests(false);
      }
    }

    fetchMyContests();
  }, [user.id]);

  const displayName = profile?.display_name || profile?.username || user.email?.split('@')[0] || 'Player';

  return (
    <div className="min-h-screen bg-background">
      {/* Shared Auth-Aware Header */}
      <AppHeader />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {displayName}! 👋
          </h1>
          <p className="text-foreground-muted">
            Ready to build your winning team?
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="p-6 text-center">
            <div className="text-4xl mb-2">🏆</div>
            <div className="text-3xl font-bold text-accent">
              {profile?.total_points || 0}
            </div>
            <div className="text-foreground-muted text-sm">Total Points</div>
          </Card>

          <Card className="p-6 text-center">
            <div className="text-4xl mb-2">⭐</div>
            <div className="text-3xl font-bold text-accent">
              {profile?.total_wins || 0}
            </div>
            <div className="text-foreground-muted text-sm">Contests Won</div>
          </Card>

          <Card className="p-6 text-center">
            <div className="text-4xl mb-2">🎯</div>
            <div className="text-3xl font-bold text-accent">
              {profile?.total_contests || 0}
            </div>
            <div className="text-foreground-muted text-sm">Contests Played</div>
          </Card>
        </div>

        {/* Quick Actions */}
        <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Link href="/tournaments">
            <Card className="p-6 text-center cursor-pointer hover:border-accent transition-colors">
              <div className="text-4xl mb-3">🏏</div>
              <div className="font-semibold">Browse Tournaments</div>
              <div className="text-foreground-muted text-sm">Find matches to play</div>
            </Card>
          </Link>

          <Link href="/contests">
            <Card className="p-6 text-center cursor-pointer hover:border-accent transition-colors">
              <div className="text-4xl mb-3">🎮</div>
              <div className="font-semibold">My Contests</div>
              <div className="text-foreground-muted text-sm">Track your entries</div>
            </Card>
          </Link>

          <Link href="/teams">
            <Card className="p-6 text-center cursor-pointer hover:border-accent transition-colors">
              <div className="text-4xl mb-3">👥</div>
              <div className="font-semibold">My Teams</div>
              <div className="text-foreground-muted text-sm">Manage your squads</div>
            </Card>
          </Link>

          <Link href="/">
            <Card className="p-6 text-center cursor-pointer hover:border-accent transition-colors">
              <div className="text-4xl mb-3">🏠</div>
              <div className="font-semibold">Home</div>
              <div className="text-foreground-muted text-sm">Back to homepage</div>
            </Card>
          </Link>
        </div>

        {/* My Contests Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">My Contests 🎯</h2>
            <Link href="/contests" className="text-accent text-sm hover:underline">
              View all →
            </Link>
          </div>
          
          {loadingContests ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <Card key={i} className="p-4 animate-pulse">
                  <div className="h-4 bg-surface-alt rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-surface-alt rounded w-1/3"></div>
                </Card>
              ))}
            </div>
          ) : myContests.length > 0 ? (
            <div className="space-y-3">
              {myContests.map((contest) => (
                <Link key={contest.id} href={`/contests/${contest.id}`}>
                  <Card className="p-4 hover:border-accent transition-colors cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{contest.name}</h3>
                        <p className="text-foreground-muted text-sm">
                          {contest.current_entries}/{contest.max_entries} entries • 
                          Prize: ₹{contest.prize_pool.toLocaleString()}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        contest.status === 'live' 
                          ? 'bg-red-500/20 text-red-400' 
                          : contest.status === 'upcoming'
                          ? 'bg-accent/20 text-accent'
                          : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {contest.status}
                      </span>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center text-foreground-muted">
              <div className="text-5xl mb-4">🎮</div>
              <p>You haven&apos;t joined any contests yet</p>
              <Link href="/tournaments">
                <Button className="mt-4">Browse Tournaments</Button>
              </Link>
            </Card>
          )}
        </div>
      </main>

      {/* Featured Tournaments - Same as Homepage */}
      <FeaturedTournaments />

      {/* Live & Upcoming Tournaments - Same as Homepage */}
      <LiveTournaments />
    </div>
  );
}
