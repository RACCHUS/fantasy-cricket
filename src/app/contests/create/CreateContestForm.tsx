'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { ContestType } from '@/types';

interface Tournament {
  id: string;
  name: string;
  league?: { name: string } | { name: string }[];
}

interface Match {
  id: string;
  start_time: string;
  tournament_id: string;
  team_home?: { name: string } | { name: string }[];
  team_away?: { name: string } | { name: string }[];
}

interface CreateContestFormProps {
  tournaments: Tournament[];
  matches: Match[];
}

export function CreateContestForm({
  tournaments,
  matches,
}: CreateContestFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [type, setType] = useState<ContestType>('match');
  const [tournamentId, setTournamentId] = useState(tournaments[0]?.id || '');
  const [matchId, setMatchId] = useState('');
  const [maxEntries, setMaxEntries] = useState<number | ''>('');
  const [prizeDescription, setPrizeDescription] = useState('');

  // Filter matches by selected tournament
  const filteredMatches = matches.filter(
    (m) => m.tournament_id === tournamentId
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/contests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          type,
          tournamentId,
          matchId: type === 'match' || type === 'h2h' ? matchId : null,
          maxEntries: maxEntries || null,
          prizeDescription: prizeDescription || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create contest');
      }

      const data = await res.json();
      router.push(`/contests/${data.contest.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const contestTypes: { value: ContestType; label: string; icon: string; desc: string }[] = [
    {
      value: 'match',
      label: 'Match Contest',
      icon: '🏏',
      desc: 'Single match, quick results',
    },
    {
      value: 'tournament',
      label: 'Tournament Contest',
      icon: '🏆',
      desc: 'Full tournament, cumulative points',
    },
    {
      value: 'h2h',
      label: 'Head to Head',
      icon: '⚔️',
      desc: '1v1 challenge a friend',
    },
  ];

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/contests"
          className="text-muted-foreground hover:text-foreground"
        >
          ← Back
        </Link>
        <h1 className="text-2xl font-bold">Create Contest</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Contest Type */}
        <div>
          <label className="block text-sm font-medium mb-3">Contest Type</label>
          <div className="grid grid-cols-3 gap-3">
            {contestTypes.map((ct) => (
              <button
                key={ct.value}
                type="button"
                onClick={() => setType(ct.value)}
                className={cn(
                  'p-4 rounded-xl border text-center transition-all',
                  type === ct.value
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:bg-secondary'
                )}
              >
                <span className="text-2xl block mb-1">{ct.icon}</span>
                <span className="text-sm font-medium block">{ct.label}</span>
                <span className="text-xs text-muted-foreground">{ct.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Contest Name */}
        <div>
          <label className="block text-sm font-medium mb-2">Contest Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Weekend Warriors League"
            className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />
        </div>

        {/* Tournament */}
        <div>
          <label className="block text-sm font-medium mb-2">Tournament</label>
          <select
            value={tournamentId}
            onChange={(e) => {
              setTournamentId(e.target.value);
              setMatchId('');
            }}
            className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            required
          >
            <option value="">Select tournament</option>
            {tournaments.map((t) => {
              const leagueObj = Array.isArray(t.league) ? t.league[0] : t.league;
              return (
                <option key={t.id} value={t.id}>
                  {t.name} {leagueObj && `(${leagueObj.name})`}
                </option>
              );
            })}
          </select>
        </div>

        {/* Match (for match and h2h types) */}
        {(type === 'match' || type === 'h2h') && (
          <div>
            <label className="block text-sm font-medium mb-2">Match</label>
            <select
              value={matchId}
              onChange={(e) => setMatchId(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              required
            >
              <option value="">Select match</option>
              {filteredMatches.map((m) => {
                const homeTeam = Array.isArray(m.team_home) ? m.team_home[0] : m.team_home;
                const awayTeam = Array.isArray(m.team_away) ? m.team_away[0] : m.team_away;
                return (
                  <option key={m.id} value={m.id}>
                    {homeTeam?.name || 'TBD'} vs {awayTeam?.name || 'TBD'} -{' '}
                    {new Date(m.start_time).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </option>
                );
              })}
            </select>
            {filteredMatches.length === 0 && tournamentId && (
              <p className="text-sm text-muted-foreground mt-1">
                No upcoming matches for this tournament
              </p>
            )}
          </div>
        )}

        {/* Max Entries */}
        {type !== 'h2h' && (
          <div>
            <label className="block text-sm font-medium mb-2">
              Max Entries (optional)
            </label>
            <input
              type="number"
              value={maxEntries}
              onChange={(e) =>
                setMaxEntries(e.target.value ? parseInt(e.target.value) : '')
              }
              placeholder="Leave blank for unlimited"
              min={2}
              className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        )}

        {/* Prize Description */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Prize/Description (optional)
          </label>
          <input
            type="text"
            value={prizeDescription}
            onChange={(e) => setPrizeDescription(e.target.value)}
            placeholder="e.g., Winner buys pizza 🍕"
            className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Error */}
        {error && (
          <p className="text-red-500 text-sm">{error}</p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting || !name || !tournamentId || ((type === 'match' || type === 'h2h') && !matchId)}
          className="w-full py-3 px-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium disabled:opacity-50"
        >
          {isSubmitting ? 'Creating...' : 'Create Contest'}
        </button>
      </form>
    </div>
  );
}
