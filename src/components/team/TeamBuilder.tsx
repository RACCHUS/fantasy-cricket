'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useToast } from '@/components/ui/Toast';
import {
  PlayerList,
  TeamSlots,
  BudgetBar,
  BudgetBadge,
  CaptainSelector,
  TeamPreview,
} from '@/components/team';
import type { Player } from '@/types';

interface TeamBuilderProps {
  matchId: string;
  matchInfo: {
    teamA: { id: string; name: string; shortName: string };
    teamB: { id: string; name: string; shortName: string };
    venue: string;
    date: Date;
    deadline: Date;
  };
  availablePlayers: Player[];
  existingTeam?: {
    id: string;
    name: string;
    players: Player[];
    captainId: string;
    viceCaptainId: string;
  };
}

const MAX_PLAYERS = 11;
const MAX_CREDITS = 100;
const MAX_PER_TEAM = 7;

export function TeamBuilder({
  matchId,
  matchInfo,
  availablePlayers,
  existingTeam,
}: TeamBuilderProps) {
  const router = useRouter();
  const { success, error: showError } = useToast();

  // State
  const [selectedPlayers, setSelectedPlayers] = useState<Player[]>(
    existingTeam?.players || []
  );
  const [captainId, setCaptainId] = useState<string | null>(
    existingTeam?.captainId || null
  );
  const [viceCaptainId, setViceCaptainId] = useState<string | null>(
    existingTeam?.viceCaptainId || null
  );
  const [teamName, setTeamName] = useState(
    existingTeam?.name || `My Team ${new Date().toLocaleDateString()}`
  );
  const [showCaptainSelector, setShowCaptainSelector] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculations
  const usedCredits = useMemo(
    () => selectedPlayers.reduce((sum, p) => sum + p.credits, 0),
    [selectedPlayers]
  );

  const teamCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    selectedPlayers.forEach((p) => {
      if (p.teamId) {
        counts[p.teamId] = (counts[p.teamId] || 0) + 1;
      }
    });
    return counts;
  }, [selectedPlayers]);

  // Time until deadline
  const timeUntilDeadline = useMemo(() => {
    const now = new Date();
    const diff = matchInfo.deadline.getTime() - now.getTime();
    
    if (diff <= 0) return 'DEADLINE PASSED';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h left`;
    }
    return `${hours}h ${mins}m left`;
  }, [matchInfo.deadline]);

  // Handlers
  const handleSelectPlayer = (player: Player) => {
    if (selectedPlayers.length >= MAX_PLAYERS) {
      showError('Team is full! Remove a player first.');
      return;
    }

    if (usedCredits + player.credits > MAX_CREDITS) {
      showError(`Not enough credits! Need ${player.credits}, have ${(MAX_CREDITS - usedCredits).toFixed(1)}`);
      return;
    }

    if (player.teamId && teamCounts[player.teamId] >= MAX_PER_TEAM) {
      showError(`Maximum ${MAX_PER_TEAM} players from one team allowed`);
      return;
    }

    setSelectedPlayers([...selectedPlayers, player]);
  };

  const handleRemovePlayer = (playerId: string) => {
    setSelectedPlayers(selectedPlayers.filter((p) => p.id !== playerId));
    
    // Clear captain/vc if removed
    if (captainId === playerId) setCaptainId(null);
    if (viceCaptainId === playerId) setViceCaptainId(null);
  };

  const handleSetCaptain = (playerId: string) => {
    // If already VC, swap
    if (viceCaptainId === playerId) {
      setViceCaptainId(captainId);
    }
    setCaptainId(playerId);
  };

  const handleSetViceCaptain = (playerId: string) => {
    // If already captain, swap
    if (captainId === playerId) {
      setCaptainId(viceCaptainId);
    }
    setViceCaptainId(playerId);
  };

  const handlePlayerClick = (playerId: string) => {
    // Cycle through: none -> captain -> vice-captain -> none
    if (captainId === playerId) {
      setCaptainId(null);
      setViceCaptainId(playerId);
    } else if (viceCaptainId === playerId) {
      setViceCaptainId(null);
    } else {
      if (!captainId) {
        setCaptainId(playerId);
      } else if (!viceCaptainId) {
        setViceCaptainId(playerId);
      } else {
        // Both set, replace captain
        setViceCaptainId(captainId);
        setCaptainId(playerId);
      }
    }
  };

  const handleContinue = () => {
    if (selectedPlayers.length !== MAX_PLAYERS) {
      showError(`Select exactly ${MAX_PLAYERS} players`);
      return;
    }

    if (!captainId || !viceCaptainId) {
      setShowCaptainSelector(true);
      return;
    }

    setShowPreview(true);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      // TODO: Submit to API
      await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulated delay
      
      success('Team saved!', 'Your fantasy team has been created successfully.');
      setShowPreview(false);
      router.push('/dashboard');
    } catch (err) {
      showError('Failed to save team. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDeadlinePassed = new Date() > matchInfo.deadline;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur">
        <div className="container mx-auto px-4 py-3">
          {/* Match Info */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-foreground-muted hover:text-foreground transition-colors"
            >
              ← Back
            </button>
            <ThemeToggle />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="font-bold">{matchInfo.teamA.shortName}</p>
                <p className="text-xs text-foreground-muted">Home</p>
              </div>
              <span className="text-2xl font-bold text-accent">VS</span>
              <div className="text-center">
                <p className="font-bold">{matchInfo.teamB.shortName}</p>
                <p className="text-xs text-foreground-muted">Away</p>
              </div>
            </div>

            <div className={cn(
              'px-3 py-1 rounded-full text-sm font-bold',
              isDeadlinePassed
                ? 'bg-red-500/20 text-red-400'
                : 'bg-green-500/20 text-green-400'
            )}>
              ⏱ {timeUntilDeadline}
            </div>
          </div>

          {/* Budget & Player Count */}
          <div className="flex items-center justify-between mt-3 gap-4">
            <BudgetBadge total={MAX_CREDITS} used={usedCredits} />
            <div className={cn(
              'px-3 py-1 rounded-full text-sm font-bold',
              selectedPlayers.length === MAX_PLAYERS
                ? 'bg-green-500/20 text-green-400'
                : 'bg-surface-secondary'
            )}>
              👥 {selectedPlayers.length}/{MAX_PLAYERS}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Two Column Layout */}
      <div className="flex-1 container mx-auto px-4 py-4 flex flex-col lg:flex-row gap-4">
        {/* Left: Player Selection */}
        <div className="flex-1 lg:w-2/3 flex flex-col min-h-0">
          <PlayerList
            players={availablePlayers}
            selectedPlayers={selectedPlayers}
            onSelectPlayer={handleSelectPlayer}
            onRemovePlayer={handleRemovePlayer}
            maxPlayers={MAX_PLAYERS}
            maxCredits={MAX_CREDITS}
            usedCredits={usedCredits}
            maxPerTeam={MAX_PER_TEAM}
            teamCounts={teamCounts}
          />
        </div>

        {/* Right: Team Preview */}
        <div className="lg:w-1/3 flex flex-col">
          <div className="sticky top-[180px] space-y-4">
            {/* Budget Bar */}
            <div className="p-4 rounded-xl bg-surface border border-border">
              <BudgetBar total={MAX_CREDITS} used={usedCredits} />
            </div>

            {/* Team Slots */}
            <div className="p-4 rounded-xl bg-surface border border-border max-h-[400px] overflow-y-auto">
              <TeamSlots
                players={selectedPlayers}
                captainId={captainId}
                viceCaptainId={viceCaptainId}
                onRemovePlayer={handleRemovePlayer}
                onPlayerClick={handlePlayerClick}
              />
            </div>

            {/* Action Button */}
            <Button
              onClick={handleContinue}
              disabled={selectedPlayers.length !== MAX_PLAYERS || isDeadlinePassed}
              className="w-full text-lg py-4"
            >
              {isDeadlinePassed
                ? '⏰ Deadline Passed'
                : selectedPlayers.length !== MAX_PLAYERS
                ? `Select ${MAX_PLAYERS - selectedPlayers.length} more player(s)`
                : !captainId || !viceCaptainId
                ? '👑 Choose Captain & VC'
                : '🚀 Preview & Submit'}
            </Button>
          </div>
        </div>
      </div>

      {/* Captain Selector Modal */}
      <CaptainSelector
        players={selectedPlayers}
        captainId={captainId}
        viceCaptainId={viceCaptainId}
        onSetCaptain={handleSetCaptain}
        onSetViceCaptain={handleSetViceCaptain}
        isOpen={showCaptainSelector}
        onClose={() => {
          setShowCaptainSelector(false);
          if (captainId && viceCaptainId) {
            setShowPreview(true);
          }
        }}
      />

      {/* Team Preview Modal */}
      <TeamPreview
        players={selectedPlayers}
        captainId={captainId}
        viceCaptainId={viceCaptainId}
        teamName={teamName}
        matchInfo={{
          teamA: matchInfo.teamA.name,
          teamB: matchInfo.teamB.name,
          date: matchInfo.date,
          venue: matchInfo.venue,
        }}
        totalCredits={MAX_CREDITS}
        usedCredits={usedCredits}
        onSubmit={handleSubmit}
        onBack={() => setShowPreview(false)}
        isSubmitting={isSubmitting}
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
      />
    </div>
  );
}
