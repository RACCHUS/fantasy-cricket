'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { LiveMatchScoreboard, MatchLeaderboard } from '@/components/scoring';
import { cn } from '@/lib/utils';

interface LiveScoreContentProps {
  matchId: string;
  fantasyTeamId?: string;
  userId: string;
}

interface FantasyTeam {
  id: string;
  name: string;
  total_points: number;
}

export function LiveScoreContent({
  matchId,
  fantasyTeamId,
  userId,
}: LiveScoreContentProps) {
  const [activeTab, setActiveTab] = useState<'my-team' | 'all-players'>('my-team');
  const [teams, setTeams] = useState<FantasyTeam[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string | undefined>(fantasyTeamId);
  const [matchInfo, setMatchInfo] = useState<{
    homeTeam: string;
    awayTeam: string;
    status: string;
  } | null>(null);

  // Fetch user's fantasy teams for this match
  useEffect(() => {
    async function fetchTeams() {
      try {
        // For now, use mock data - in production, fetch from API
        // const res = await fetch(`/api/fantasy-teams?matchId=${matchId}`);
        // const data = await res.json();
        
        // Mock team data
        setTeams([
          { id: 'mock-team-1', name: 'My IPL Squad', total_points: 0 },
        ]);
        setSelectedTeam('mock-team-1');
        
        // Mock match info
        setMatchInfo({
          homeTeam: 'Mumbai Indians',
          awayTeam: 'Chennai Super Kings',
          status: 'live',
        });
      } catch (error) {
        console.error('Failed to fetch teams:', error);
      }
    }
    fetchTeams();
  }, [matchId]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link 
          href="/dashboard" 
          className="text-muted-foreground hover:text-foreground"
        >
          ← Back
        </Link>
        {matchInfo?.status === 'live' && (
          <span className="flex items-center gap-1.5 text-sm bg-red-500/10 text-red-500 px-3 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            Match Live
          </span>
        )}
      </div>

      {/* Match Info */}
      {matchInfo && (
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold">
            {matchInfo.homeTeam} vs {matchInfo.awayTeam}
          </h1>
        </div>
      )}

      {/* Team Selector (if multiple teams) */}
      {teams.length > 1 && (
        <div className="mb-4">
          <select
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-secondary border border-border"
          >
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-secondary rounded-lg mb-6">
        <button
          onClick={() => setActiveTab('my-team')}
          className={cn(
            'flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors',
            activeTab === 'my-team'
              ? 'bg-background shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          My Team
        </button>
        <button
          onClick={() => setActiveTab('all-players')}
          className={cn(
            'flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors',
            activeTab === 'all-players'
              ? 'bg-background shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          All Players
        </button>
      </div>

      {/* Content */}
      {activeTab === 'my-team' && selectedTeam ? (
        <LiveMatchScoreboard
          matchId={matchId}
          fantasyTeamId={selectedTeam}
          isMatchLive={matchInfo?.status === 'live'}
        />
      ) : (
        <MatchLeaderboard matchId={matchId} />
      )}

      {/* No team selected state */}
      {activeTab === 'my-team' && !selectedTeam && (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            You haven't created a team for this match yet
          </p>
          <Link
            href={`/team/${matchId}`}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            Create Team →
          </Link>
        </div>
      )}
    </div>
  );
}
