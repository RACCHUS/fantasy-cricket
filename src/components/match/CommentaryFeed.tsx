'use client';

import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import type { BallEvent } from '@/hooks/useLiveMatch';

interface CommentaryFeedProps {
  events: BallEvent[];
  className?: string;
  maxItems?: number;
}

/**
 * Ball-by-ball commentary feed with animations
 */
export function CommentaryFeed({ events, className, maxItems = 20 }: CommentaryFeedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [newEventId, setNewEventId] = useState<string | null>(null);

  // Auto-scroll and animate new events
  useEffect(() => {
    if (events.length > 0) {
      const latestEvent = events[0];
      setNewEventId(latestEvent.ballNumber.toString());
      
      // Reset animation after a short delay
      const timer = setTimeout(() => setNewEventId(null), 1000);
      return () => clearTimeout(timer);
    }
  }, [events]);

  return (
    <div className={cn('rounded-xl border bg-card overflow-hidden', className)}>
      <div className="px-4 py-3 border-b bg-secondary/30">
        <h3 className="font-semibold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          Live Commentary
        </h3>
      </div>
      
      <div
        ref={containerRef}
        className="p-4 space-y-3 max-h-[400px] overflow-y-auto"
      >
        {events.slice(0, maxItems).map((event) => (
          <CommentaryItem
            key={`${event.over}.${event.ballNumber}`}
            event={event}
            isNew={newEventId === event.ballNumber.toString()}
          />
        ))}
        
        {events.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>Waiting for match to start...</p>
          </div>
        )}
      </div>
    </div>
  );
}

interface CommentaryItemProps {
  event: BallEvent;
  isNew?: boolean;
}

function CommentaryItem({ event, isNew }: CommentaryItemProps) {
  const { over, ballNumber, batsmanName, bowlerName, runs, isWicket, commentary, extras } = event;

  // Determine the event type for styling
  const getEventType = () => {
    if (isWicket) return 'wicket';
    if (runs === 6) return 'six';
    if (runs === 4) return 'four';
    if (extras) return 'extras';
    if (runs === 0) return 'dot';
    return 'runs';
  };

  const eventType = getEventType();

  const eventStyles = {
    wicket: 'border-l-red-500 bg-red-500/5',
    six: 'border-l-green-500 bg-green-500/5',
    four: 'border-l-blue-500 bg-blue-500/5',
    extras: 'border-l-yellow-500 bg-yellow-500/5',
    dot: 'border-l-gray-400',
    runs: 'border-l-gray-500',
  };

  const eventBadges = {
    wicket: <span className="text-xs bg-red-500 text-white px-1.5 py-0.5 rounded font-bold">WICKET!</span>,
    six: <span className="text-xs bg-green-500 text-white px-1.5 py-0.5 rounded font-bold">SIX!</span>,
    four: <span className="text-xs bg-blue-500 text-white px-1.5 py-0.5 rounded font-bold">FOUR!</span>,
    extras: <span className="text-xs bg-yellow-500/20 text-yellow-600 px-1.5 py-0.5 rounded">{extras?.type?.toUpperCase()}</span>,
    dot: null,
    runs: runs > 0 ? <span className="text-xs bg-secondary px-1.5 py-0.5 rounded">{runs} run{runs > 1 ? 's' : ''}</span> : null,
  };

  return (
    <div
      className={cn(
        'p-3 rounded-lg border-l-4 transition-all duration-300',
        eventStyles[eventType],
        isNew && 'ring-2 ring-primary/50 scale-[1.02]'
      )}
    >
      {/* Over and ball info */}
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-muted-foreground font-mono">
          {over}.{ballNumber}
        </span>
        {eventBadges[eventType]}
      </div>

      {/* Main commentary */}
      <p className="text-sm">
        <span className="font-medium">{bowlerName}</span>
        <span className="text-muted-foreground"> to </span>
        <span className="font-medium">{batsmanName}</span>
        {commentary && <span className="text-muted-foreground">, {commentary}</span>}
      </p>

      {/* Fantasy points impact */}
      {event.fantasyPoints && Object.keys(event.fantasyPoints).length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {Object.entries(event.fantasyPoints).map(([playerId, points]) => (
            <span
              key={playerId}
              className={cn(
                'text-xs px-1.5 py-0.5 rounded',
                points > 0 && 'bg-green-500/20 text-green-500',
                points < 0 && 'bg-red-500/20 text-red-500'
              )}
            >
              {points > 0 ? '+' : ''}{points} pts
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

interface CompactCommentaryProps {
  latestEvent?: BallEvent;
  className?: string;
}

/**
 * Single-line compact commentary for headers
 */
export function CompactCommentary({ latestEvent, className }: CompactCommentaryProps) {
  if (!latestEvent) {
    return (
      <div className={cn('text-sm text-muted-foreground', className)}>
        Waiting for play to resume...
      </div>
    );
  }

  const { over, ballNumber, batsmanName, bowlerName, runs, isWicket, extras } = latestEvent;

  return (
    <div className={cn('text-sm', className)}>
      <span className="text-muted-foreground font-mono mr-2">
        {over}.{ballNumber}
      </span>
      <span className="font-medium">{bowlerName}</span>
      <span className="text-muted-foreground"> to </span>
      <span className="font-medium">{batsmanName}</span>
      <span className="mx-2">—</span>
      {isWicket && <span className="text-red-500 font-bold">OUT!</span>}
      {!isWicket && runs === 6 && <span className="text-green-500 font-bold">SIX!</span>}
      {!isWicket && runs === 4 && <span className="text-blue-500 font-bold">FOUR!</span>}
      {!isWicket && runs === 0 && !extras && <span className="text-muted-foreground">no run</span>}
      {!isWicket && runs > 0 && runs < 4 && <span>{runs} run{runs > 1 ? 's' : ''}</span>}
      {extras && <span className="text-yellow-500">{extras.type}</span>}
    </div>
  );
}
