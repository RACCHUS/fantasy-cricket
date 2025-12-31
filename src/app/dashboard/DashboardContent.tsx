'use client';

import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
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

interface DashboardContentProps {
  user: User;
  profile: Profile | null;
}

export function DashboardContent({ user, profile }: DashboardContentProps) {
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  const displayName = profile?.display_name || profile?.username || user.email?.split('@')[0] || 'Player';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-surface">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏏</span>
            <span className="font-bold text-xl text-accent">Fantasy Cricket</span>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              Sign out
            </Button>
          </div>
        </div>
      </header>

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
          <Card 
            className="p-6 text-center cursor-pointer hover:border-accent transition-colors"
            onClick={() => {/* TODO: Navigate to matches */}}
          >
            <div className="text-4xl mb-3">🏏</div>
            <div className="font-semibold">Upcoming Matches</div>
            <div className="text-foreground-muted text-sm">View & create teams</div>
          </Card>

          <Card 
            className="p-6 text-center cursor-pointer hover:border-accent transition-colors"
            onClick={() => {/* TODO: Navigate to contests */}}
          >
            <div className="text-4xl mb-3">🎮</div>
            <div className="font-semibold">My Contests</div>
            <div className="text-foreground-muted text-sm">Track your entries</div>
          </Card>

          <Card 
            className="p-6 text-center cursor-pointer hover:border-accent transition-colors"
            onClick={() => {/* TODO: Navigate to teams */}}
          >
            <div className="text-4xl mb-3">👥</div>
            <div className="font-semibold">My Teams</div>
            <div className="text-foreground-muted text-sm">Manage your squads</div>
          </Card>

          <Card 
            className="p-6 text-center cursor-pointer hover:border-accent transition-colors"
            onClick={() => {/* TODO: Navigate to leaderboard */}}
          >
            <div className="text-4xl mb-3">📊</div>
            <div className="font-semibold">Leaderboard</div>
            <div className="text-foreground-muted text-sm">See top players</div>
          </Card>
        </div>

        {/* Live Matches Section (Placeholder) */}
        <h2 className="text-xl font-bold mb-4">Live Matches 🔴</h2>
        <Card className="p-8 text-center text-foreground-muted">
          <div className="text-5xl mb-4">📺</div>
          <p>No live matches right now</p>
          <p className="text-sm mt-2">Check back soon for exciting cricket action!</p>
        </Card>
      </main>
    </div>
  );
}
