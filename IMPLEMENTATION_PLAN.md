# Fantasy Cricket - Implementation Plan

**Reference:** [SDD.md](SDD.md)  
**Domain:** fantasycricket.app  
**Stack:** Next.js 16 + Supabase + Tailwind + Vercel

**Last Updated:** December 28, 2025

---

## Phase 0: Project Setup ✅ COMPLETE

### 0.1 Initialize Next.js Project ✅
```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

### 0.2 Project Structure
```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth routes (login, register)
│   │   ├── login/
│   │   └── register/
│   ├── (main)/            # Protected routes
│   │   ├── dashboard/
│   │   ├── tournaments/
│   │   ├── team/
│   │   ├── contests/
│   │   └── leaderboard/
│   ├── api/               # API routes
│   │   ├── auth/
│   │   ├── cricket/       # External API wrapper
│   │   ├── teams/
│   │   └── contests/
│   ├── layout.tsx
│   ├── page.tsx           # Landing page
│   └── globals.css
├── components/
│   ├── ui/                # Base components (buttons, cards, inputs)
│   ├── icons/             # Custom cricket icons
│   ├── players/           # Player cards, lists
│   ├── team/              # Team builder components
│   ├── matches/           # Match cards, live scores
│   └── layout/            # Nav, header, footer
├── lib/
│   ├── supabase/          # Supabase client & helpers
│   ├── cricket-api/       # External API integration
│   ├── scoring/           # Points calculation
│   └── utils/             # Helpers
├── hooks/                 # Custom React hooks
├── types/                 # TypeScript types
├── constants/             # Scoring rules, config
├── stores/                # Zustand stores
├── __tests__/             # Test utilities & setup
└── tests/
    └── e2e/               # Playwright E2E tests
```

### 0.3 Install Dependencies
```bash
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs zustand
npm install lucide-react clsx tailwind-merge
npm install -D @tailwindcss/forms

# Testing
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
npm install -D @playwright/test
```

### 0.4 Environment Setup
```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
CRICKET_API_KEY=your_cricketdata_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 0.5 Tailwind Dark Theme Config
```js
// tailwind.config.js - colors (supports dark + light mode)
module.exports = {
  darkMode: 'class',  // Toggle via class on <html>
  theme: {
    extend: {
      colors: {
        // Use CSS variables for theme switching
        background: 'var(--background)',
        'background-secondary': 'var(--background-secondary)',
        foreground: 'var(--foreground)',
        'foreground-muted': 'var(--foreground-muted)',
        border: 'var(--border)',
        // Accent colors (same for both themes)
        primary: { DEFAULT: '#3b82f6', hover: '#2563eb' },
        success: { DEFAULT: '#22c55e', hover: '#16a34a' },
        warning: { DEFAULT: '#fbbf24', hover: '#f59e0b' },
        danger: { DEFAULT: '#ef4444', hover: '#dc2626' },
        accent: { DEFAULT: '#ec4899', hover: '#db2777' },
      },
    },
  },
};

// globals.css - CSS variables for themes
:root {
  --background: #ffffff;
  --background-secondary: #f4f4f5;
  --foreground: #09090b;
  --foreground-muted: #71717a;
  --border: #e4e4e7;
}

.dark {
  --background: #0a0a0f;
  --background-secondary: #111118;
  --foreground: #f4f4f5;
  --foreground-muted: #a1a1aa;
  --border: #27272a;
}
```

### 0.6 PWA Setup
```bash
npm install next-pwa
```
Configure in `next.config.js` + create `manifest.json`

---

## Phase 1: Authentication ✅ COMPLETE

### Completed Items:
- ✅ Supabase client setup (client.ts + server.ts)
- ✅ LoginForm with email/password + Google OAuth
- ✅ RegisterForm with email confirmation
- ✅ Auth callback route for OAuth code exchange
- ✅ Middleware for protected routes + session refresh
- ✅ useUser hook for client-side auth state
- ✅ Dashboard page (protected) with user stats

### Files Created:
- `src/components/auth/LoginForm.tsx`
- `src/components/auth/RegisterForm.tsx`
- `src/app/auth/callback/route.ts`
- `src/middleware.ts`
- `src/hooks/useUser.ts`
- `src/app/dashboard/page.tsx`
- `src/app/dashboard/DashboardContent.tsx`

### 1.1 Supabase Project Setup
1. Create project at supabase.com
2. Enable Google OAuth in Auth > Providers
3. Enable Email/Password auth
4. Get API keys → `.env.local`

### 1.2 Database Schema (Run in Supabase SQL Editor)
```sql
-- Users (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  avatar_url TEXT,
  total_points INTEGER DEFAULT 0,
  contests_played INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public profiles viewable" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar_url)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'avatar_url');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 1.3 Auth Components
| Component | Purpose |
|-----------|---------|
| `LoginForm` | Email/password + Google button |
| `RegisterForm` | Email/password signup |
| `AuthProvider` | Context wrapper with session |
| `ProtectedRoute` | Redirect if not logged in |

### 1.4 Auth Pages
- `/login` — Login form with Google OAuth
- `/register` — Sign up form
- `/` — Landing page (public)

---

## Phase 2: Core Database Schema ✅ COMPLETE

### Completed Items:
- ✅ Full database schema in `supabase/schema.sql`
- ✅ All tables with RLS policies enabled
- ✅ Triggers for auto-creating profiles on signup
- ✅ Updated_at triggers for all relevant tables
- ✅ Seed data for default leagues (IPL, International, CPL, Backyard)

### Tables Created:
- `profiles` - User profiles with stats
- `leagues` - IPL, International, CPL, custom leagues
- `tournaments` - Seasonal tournaments
- `teams` - Cricket teams
- `players` - Player data with roles and credits
- `matches` - Match schedules and results
- `player_stats` - Per-match player statistics
- `contests` - Public/private contests
- `fantasy_teams` - User's fantasy team selections
- `fantasy_team_players` - Junction table for team players
- `contest_entries` - User entries into contests

### 2.1 Leagues & Tournaments
```sql
CREATE TABLE leagues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                    -- "IPL", "World Cup"
  short_name TEXT,                       -- "IPL", "WC"
  type TEXT CHECK (type IN ('franchise', 'international', 'custom')),
  logo_url TEXT,
  scoring_rules JSONB DEFAULT '{}',      -- Configurable per league
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID REFERENCES leagues(id),
  name TEXT NOT NULL,                    -- "IPL 2026"
  season TEXT,                           -- "2026"
  start_date DATE,
  end_date DATE,
  status TEXT CHECK (status IN ('upcoming', 'active', 'completed')) DEFAULT 'upcoming',
  config JSONB DEFAULT '{}',             -- Budget, max players, etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.2 Teams & Players
```sql
CREATE TABLE cricket_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                    -- "Mumbai Indians"
  short_name TEXT,                       -- "MI"
  logo_url TEXT,
  country TEXT,
  league_id UUID REFERENCES leagues(id)
);

CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  photo_url TEXT,
  country TEXT,
  role TEXT CHECK (role IN ('batsman', 'bowler', 'all-rounder', 'wicket-keeper')),
  batting_style TEXT,
  bowling_style TEXT,
  team_id UUID REFERENCES cricket_teams(id),
  stats JSONB DEFAULT '{}',              -- Career stats
  is_active BOOLEAN DEFAULT true
);

CREATE TABLE tournament_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id),
  player_id UUID REFERENCES players(id),
  price INTEGER NOT NULL,                -- In credits (e.g., 10.5 = 105)
  form_rating DECIMAL(3,1),              -- 0-10 scale
  UNIQUE(tournament_id, player_id)
);
```

### 2.3 Matches
```sql
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id),
  external_id TEXT,                      -- From cricket API
  team_home_id UUID REFERENCES cricket_teams(id),
  team_away_id UUID REFERENCES cricket_teams(id),
  venue TEXT,
  start_time TIMESTAMPTZ,
  status TEXT CHECK (status IN ('upcoming', 'live', 'completed')) DEFAULT 'upcoming',
  result JSONB,                          -- Winner, scores, etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE player_match_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES matches(id),
  player_id UUID REFERENCES players(id),
  runs_scored INTEGER DEFAULT 0,
  balls_faced INTEGER DEFAULT 0,
  fours INTEGER DEFAULT 0,
  sixes INTEGER DEFAULT 0,
  wickets INTEGER DEFAULT 0,
  overs_bowled DECIMAL(4,1) DEFAULT 0,
  runs_conceded INTEGER DEFAULT 0,
  maidens INTEGER DEFAULT 0,
  catches INTEGER DEFAULT 0,
  stumpings INTEGER DEFAULT 0,
  run_outs INTEGER DEFAULT 0,
  fantasy_points INTEGER DEFAULT 0,
  UNIQUE(match_id, player_id)
);
```

### 2.4 Fantasy Teams & Contests
```sql
CREATE TABLE fantasy_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  tournament_id UUID REFERENCES tournaments(id),
  name TEXT,
  players UUID[] NOT NULL,               -- Array of player IDs (11)
  captain_id UUID REFERENCES players(id),
  vice_captain_id UUID REFERENCES players(id),
  total_points INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE contests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id),
  match_id UUID REFERENCES matches(id), -- NULL for tournament-wide
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('tournament', 'match', 'h2h')) DEFAULT 'tournament',
  max_entries INTEGER,
  entry_fee INTEGER DEFAULT 0,           -- 0 = free
  is_system_contest BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE contest_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id UUID REFERENCES contests(id),
  fantasy_team_id UUID REFERENCES fantasy_teams(id),
  user_id UUID REFERENCES profiles(id),
  rank INTEGER,
  points INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(contest_id, user_id)
);

-- Indexes for performance
CREATE INDEX idx_matches_tournament ON matches(tournament_id);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_fantasy_teams_user ON fantasy_teams(user_id);
CREATE INDEX idx_contest_entries_contest ON contest_entries(contest_id);
```

### 2.5 Enable RLS on All Tables
```sql
ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
-- ... (continue for all tables)

-- Read policies (public)
CREATE POLICY "Leagues viewable" ON leagues FOR SELECT USING (true);
CREATE POLICY "Tournaments viewable" ON tournaments FOR SELECT USING (true);
-- ... etc

-- Write policies (authenticated)
CREATE POLICY "Users can create fantasy teams" ON fantasy_teams 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own teams" ON fantasy_teams 
  FOR UPDATE USING (auth.uid() = user_id);
```

---

## Phase 3: Cricket API Integration ✅ COMPLETE

### Completed Items:
- ✅ Complete API types (types.ts) for matches, players, teams, tournaments, live scores
- ✅ Abstract CricketAPIProvider interface for swappable providers
- ✅ CricketDataProvider implementation for CricketData.org API
- ✅ MockCricketProvider for development/testing without real API
- ✅ In-memory cache with configurable TTL per endpoint type
- ✅ API routes: matches, matches/[id], matches/[id]/live, players, players/[id], teams, tournaments
- ✅ Data sync service to sync external API data to Supabase

### Files Created:
- `src/lib/cricket-api/types.ts` - All API response types
- `src/lib/cricket-api/provider.ts` - Abstract provider interface
- `src/lib/cricket-api/cricketdata.ts` - CricketData.org implementation
- `src/lib/cricket-api/mock.ts` - Mock provider with sample IPL data
- `src/lib/cricket-api/cache.ts` - In-memory cache with TTL
- `src/lib/cricket-api/sync.ts` - Database sync service
- `src/lib/cricket-api/index.ts` - Main export with lazy initialization
- `src/app/api/cricket/matches/route.ts`
- `src/app/api/cricket/matches/[id]/route.ts`
- `src/app/api/cricket/matches/[id]/live/route.ts`
- `src/app/api/cricket/players/route.ts`
- `src/app/api/cricket/players/[id]/route.ts`
- `src/app/api/cricket/teams/route.ts`
- `src/app/api/cricket/tournaments/route.ts`

### 3.1 API Service Layer
```typescript
// src/lib/cricket-api/types.ts
interface CricketMatch {
  id: string;
  teamHome: string;
  teamAway: string;
  startTime: Date;
  status: 'upcoming' | 'live' | 'completed';
  score?: { home: string; away: string };
}

interface PlayerStats {
  playerId: string;
  runs: number;
  wickets: number;
  catches: number;
  // ...
}
```

### 3.2 API Abstraction (Easy to Swap Providers)
```typescript
// src/lib/cricket-api/provider.ts
interface CricketAPIProvider {
  getMatches(tournamentId: string): Promise<CricketMatch[]>;
  getLiveScore(matchId: string): Promise<MatchScore>;
  getPlayerStats(matchId: string): Promise<PlayerStats[]>;
}

// src/lib/cricket-api/cricketdata.ts
class CricketDataProvider implements CricketAPIProvider {
  // Implementation for CricketData.org
}

// src/lib/cricket-api/index.ts
export const cricketAPI: CricketAPIProvider = new CricketDataProvider();
```

### 3.3 Caching Strategy
```typescript
// src/lib/cricket-api/cache.ts
const CACHE_TTL = {
  PLAYER_LIST: 24 * 60 * 60,    // 24 hours
  MATCH_LIST: 60 * 60,          // 1 hour
  LIVE_SCORE: 60,               // 1 minute
  PLAYER_STATS: 5 * 60,         // 5 minutes during match
};
```

### 3.4 API Routes
| Route | Purpose | Cache |
|-------|---------|-------|
| `GET /api/cricket/matches` | List matches for tournament | 1 hour |
| `GET /api/cricket/matches/[id]/live` | Live score | 1 min |
| `GET /api/cricket/players` | Player list | 24 hours |
| `GET /api/cricket/players/[id]/stats` | Player stats | 5 min |

---

## Phase 4: Team Builder UI ✅ COMPLETE

### Completed Items:
- ✅ PlayerCard component with full/compact/mini variants, role icons, animations
- ✅ RoleFilter with icon buttons (🏏 🎯 ⚡ 🧤) and selection counts
- ✅ BudgetBar with animated progress and color-coded remaining credits
- ✅ PlayerList with search, role filter, sorting options
- ✅ TeamSlots showing formation layout with role requirements
- ✅ CaptainSelector modal for choosing Captain (2x) and Vice-Captain (1.5x)
- ✅ TeamPreview modal with validation and submission
- ✅ Full TeamBuilder page combining all components

### Files Created:
- `src/components/team/PlayerCard.tsx` - Card, Mini, Compact variants
- `src/components/team/RoleFilter.tsx` - Filter + Compact versions
- `src/components/team/BudgetBar.tsx` - Bar + Badge components
- `src/components/team/PlayerList.tsx` - Full + Compact versions
- `src/components/team/TeamSlots.tsx` - Formation + Compact views
- `src/components/team/CaptainSelector.tsx` - Modal + Inline selectors
- `src/components/team/TeamPreview.tsx` - Preview with validation
- `src/components/team/TeamBuilder.tsx` - Main orchestrator component
- `src/components/team/index.ts` - All exports
- `src/app/team/[matchId]/page.tsx` - Team builder route
- `src/app/team/[matchId]/TeamBuilderContent.tsx` - Client component with mock data

### 4.1 Components to Build
| Component | Description |
|-----------|-------------|
| `PlayerCard` | Photo, name, role icon, price, points |
| `PlayerList` | Filterable/sortable grid of players |
| `TeamSlots` | Visual 11 slots showing selected players |
| `RoleFilter` | Icon buttons: 🏏 🎯 🏏🎯 🧤 |
| `BudgetBar` | Visual progress bar (spent/remaining) |
| `CaptainSelector` | Tap to assign 👑 or ⭐ |
| `TeamPreview` | Summary before submission |

### 4.2 Team Builder State (Zustand)
```typescript
// src/stores/teamStore.ts
interface TeamStore {
  players: Player[];           // Selected players (max 11)
  captain: Player | null;
  viceCaptain: Player | null;
  budget: number;
  budgetUsed: number;
  
  addPlayer: (player: Player) => void;
  removePlayer: (playerId: string) => void;
  setCaptain: (playerId: string) => void;
  setViceCaptain: (playerId: string) => void;
  reset: () => void;
}
```

### 4.3 Team Validation Rules
```typescript
// src/lib/validation/team.ts
const TEAM_RULES = {
  totalPlayers: 11,
  maxPerTeam: 7,              // Max from one cricket team
  minPerRole: {
    batsman: 1,
    bowler: 1,
    'all-rounder': 1,
    'wicket-keeper': 1,
  },
  maxPerRole: {
    batsman: 5,
    bowler: 5,
    'all-rounder': 4,
    'wicket-keeper': 2,
  },
  budget: 1000,               // 100.0 credits
};
```

### 4.4 Team Builder Page Flow
```
/team/create?tournament=xxx

1. [Role Filter Bar] - 🏏 BAT | 🎯 BOWL | 🏏🎯 AR | 🧤 WK | ALL
2. [Budget Bar] - ████████░░ 750/1000
3. [Player List] - Scrollable grid of PlayerCards
4. [Team Slots] - Fixed bottom panel showing 11 slots
5. [Captain Modal] - After 11 selected, pick C/VC
6. [Submit Button] - Big green ✓ when valid
```

---

## Phase 5: Scoring Engine ✅ COMPLETE

### Completed Items:
- ✅ calculatePlayerPoints() with batting, bowling, fielding points + bonuses
- ✅ calculateTeamPoints() with captain (2×) and vice-captain (1.5×) multipliers
- ✅ DEFAULT_SCORING rules in constants/scoring.ts
- ✅ 16 comprehensive tests for scoring calculations
- ✅ Live scoring API route `/api/scoring/live`
- ✅ useLivePoints hook with polling support
- ✅ LivePointsBadge, PointsBreakdown, LiveScoreCard, TeamPointsSummary components
- ✅ LiveMatchScoreboard and MatchLeaderboard components
- ✅ Live score page at `/live/[matchId]`

### Files Created:
- `src/lib/scoring/calculator.ts` - Core scoring logic
- `src/lib/scoring/calculator.test.ts` - 16 tests
- `src/lib/scoring/index.ts` - Exports
- `src/constants/scoring.ts` - DEFAULT_SCORING rules
- `src/app/api/scoring/live/route.ts` - Live points API
- `src/hooks/useLivePoints.ts` - React hook for live updates
- `src/components/scoring/LivePointsDisplay.tsx` - Badge, breakdown, card, summary
- `src/components/scoring/LiveMatchScoreboard.tsx` - Full scoreboard + leaderboard
- `src/components/scoring/index.ts` - Component exports
- `src/app/live/[matchId]/page.tsx` - Live score page
- `src/app/live/[matchId]/LiveScoreContent.tsx` - Page client component

### 5.1 Scoring Configuration
```typescript
// src/constants/scoring.ts
export const DEFAULT_SCORING = {
  batting: {
    run: 1,
    four: 1,           // Bonus per boundary
    six: 2,            // Bonus per six
    halfCentury: 10,
    century: 25,
    duck: -5,
    strikeRateBonus: { threshold: 150, points: 5 },
    strikeRatePenalty: { threshold: 70, points: -5 },
  },
  bowling: {
    wicket: 25,
    maiden: 10,
    threeWickets: 10,  // Bonus
    fiveWickets: 25,   // Bonus
    economyBonus: { threshold: 5, points: 10 },
    economyPenalty: { threshold: 10, points: -5 },
  },
  fielding: {
    catch: 10,
    stumping: 15,
    runOutDirect: 15,
    runOutAssist: 10,
  },
  multipliers: {
    captain: 2,
    viceCaptain: 1.5,
  },
};
```

### 5.2 Points Calculator
```typescript
// src/lib/scoring/calculator.ts
function calculatePlayerPoints(
  stats: PlayerMatchStats, 
  rules: ScoringRules
): number {
  let points = 0;
  
  // Batting
  points += stats.runs * rules.batting.run;
  points += stats.fours * rules.batting.four;
  points += stats.sixes * rules.batting.six;
  if (stats.runs >= 100) points += rules.batting.century;
  else if (stats.runs >= 50) points += rules.batting.halfCentury;
  if (stats.runs === 0 && stats.ballsFaced > 0) points += rules.batting.duck;
  
  // Bowling
  points += stats.wickets * rules.bowling.wicket;
  points += stats.maidens * rules.bowling.maiden;
  if (stats.wickets >= 5) points += rules.bowling.fiveWickets;
  else if (stats.wickets >= 3) points += rules.bowling.threeWickets;
  
  // Fielding
  points += stats.catches * rules.fielding.catch;
  points += stats.stumpings * rules.fielding.stumping;
  points += stats.runOuts * rules.fielding.runOutDirect;
  
  return points;
}

function calculateTeamPoints(
  team: FantasyTeam,
  matchStats: PlayerMatchStats[],
  rules: ScoringRules
): number {
  let total = 0;
  
  for (const playerId of team.players) {
    const stats = matchStats.find(s => s.playerId === playerId);
    if (!stats) continue;
    
    let points = calculatePlayerPoints(stats, rules);
    
    // Apply multipliers
    if (playerId === team.captainId) {
      points *= rules.multipliers.captain;
    } else if (playerId === team.viceCaptainId) {
      points *= rules.multipliers.viceCaptain;
    }
    
    total += points;
  }
  
  return total;
}
```

---

## Phase 6: Contests & Leaderboard ✅ COMPLETE

### Completed Items:
- ✅ Extended Contest types with status, currentEntries, LeaderboardEntry
- ✅ Zustand contest store with filtering utilities
- ✅ Full contest API routes (list, create, detail, join, leave, leaderboard)
- ✅ ContestCard and ContestCardCompact components
- ✅ ContestList with type/status filters
- ✅ Leaderboard component with rank change animations (▲▼)
- ✅ Contest list page at `/contests`
- ✅ Contest detail page with leaderboard at `/contests/[id]`
- ✅ Create contest form at `/contests/create`
- ✅ AI team generator with 3 difficulty levels (easy/medium/hard)

### Files Created:
- `src/types/index.ts` - Extended with ContestStatus, LeaderboardEntry
- `src/stores/contestStore.ts` - Zustand store for contests
- `src/app/api/contests/route.ts` - List and create contests
- `src/app/api/contests/[id]/route.ts` - Get and delete contest
- `src/app/api/contests/[id]/join/route.ts` - Join and leave contest
- `src/app/api/contests/[id]/leaderboard/route.ts` - Get and update leaderboard
- `src/components/contest/ContestCard.tsx` - Full and compact cards
- `src/components/contest/ContestList.tsx` - Filterable list
- `src/components/contest/Leaderboard.tsx` - Real-time ranked list
- `src/components/contest/index.ts` - Exports
- `src/app/contests/page.tsx` - Contests list page
- `src/app/contests/ContestsPageContent.tsx` - Client component
- `src/app/contests/[id]/page.tsx` - Contest detail page
- `src/app/contests/[id]/ContestDetailContent.tsx` - Detail client component
- `src/app/contests/create/page.tsx` - Create contest page
- `src/app/contests/create/CreateContestForm.tsx` - Create form
- `src/lib/ai/team-generator.ts` - AI team generation
- `src/lib/ai/index.ts` - AI exports

### 6.1 Contest Types
| Type | Description |
|------|-------------|
| `tournament` | Full tournament, cumulative points |
| `match` | Single match (daily fantasy) |
| `h2h` | 1v1 against another user |
| `system` | Play against AI teams |

### 6.2 Contest Pages
| Page | Route |
|------|-------|
| Contest List | `/contests` |
| Contest Detail | `/contests/[id]` |
| Join Contest | `/contests/[id]/join` |
| Leaderboard | `/contests/[id]/leaderboard` |

### 6.3 Leaderboard Component
```typescript
// Display: Rank | Avatar | Username | Points
// Highlight current user row
// Show rank change arrows (▲▼)
// Paginate or virtual scroll for large lists
```

### 6.4 AI/System Teams (Phase 2)
```typescript
// src/lib/ai/team-generator.ts
function generateAITeam(
  players: Player[],
  difficulty: 'easy' | 'medium' | 'hard'
): FantasyTeam {
  // Easy: Random valid team
  // Medium: Weighted by recent form
  // Hard: Optimized picks + smart captain
}
```

---

## Phase 7: Live Updates (Days 16-18)

### 7.1 Real-time Options
| Option | Pros | Cons |
|--------|------|------|
| Polling (chosen) | Simple, works everywhere | Slightly delayed |
| Supabase Realtime | Built-in, easy | Limited to DB changes |
| Socket.io | Full control | Extra server needed |

### 7.2 Polling Implementation
```typescript
// src/hooks/useLiveMatch.ts
function useLiveMatch(matchId: string) {
  const [score, setScore] = useState<MatchScore | null>(null);
  
  useEffect(() => {
    if (!matchId) return;
    
    const poll = async () => {
      const data = await fetch(`/api/cricket/matches/${matchId}/live`);
      setScore(await data.json());
    };
    
    poll(); // Initial fetch
    const interval = setInterval(poll, 60000); // Every 60s
    
    return () => clearInterval(interval);
  }, [matchId]);
  
  return score;
}
```

### 7.3 Live Score UI
```
┌─────────────────────────────────────┐
│ 🔴 LIVE                             │
│                                     │
│   [MI Logo]  vs  [CSK Logo]         │
│   Mumbai        Chennai             │
│                                     │
│   185/4         ←  Batting          │
│   (18.2 overs)                      │
│                                     │
│   Target: 172                       │
│   Need 14 runs from 10 balls        │
└─────────────────────────────────────┘
```

---

## Phase 8: PWA & Polish (Days 19-21)

### 8.1 PWA Configuration
```javascript
// next.config.js
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
});

module.exports = withPWA({
  // ... other config
});
```

### 8.2 Manifest
```json
// public/manifest.json
{
  "name": "Fantasy Cricket",
  "short_name": "FantasyCric",
  "description": "Live fantasy cricket",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0a0a0f",
  "theme_color": "#3b82f6",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

### 8.3 Animations (CSS Only)
```css
/* Bounce on tap */
.card-tap { transition: transform 0.1s; }
.card-tap:active { transform: scale(0.97); }

/* Points pop */
@keyframes pointsPop {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.3); }
  100% { transform: translateY(-20px); opacity: 0; }
}

/* Pulse for live indicator */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
.live-dot { animation: pulse 2s infinite; }
```

### 8.4 Loading States
- Skeleton loaders for player cards
- Shimmer effect on loading
- Instant optimistic UI updates

---

## Phase 9: Deployment (Day 22)

### 9.1 Vercel Setup
1. Connect GitHub repo to Vercel
2. Add environment variables
3. Deploy

### 9.2 Custom Domain
1. Purchase `fantasycricket.app`
2. Add to Vercel project
3. Configure DNS (Vercel provides instructions)

### 9.3 Monitoring
- Vercel Analytics (free tier)
- Supabase dashboard for DB metrics
- Error tracking: Sentry (free tier)

---

## Phase 10: Play Store (Post-MVP)

### 10.1 Capacitor Setup
```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init "Fantasy Cricket" "app.fantasycricket"
npx cap add android
```

### 10.2 Build APK
```bash
npm run build
npx cap sync android
# Open in Android Studio, generate signed APK
```

### 10.3 Play Store Listing
- Screenshots (phone + tablet)
- Feature graphic
- Description
- Privacy policy URL

---

## Quick Reference: Key Files

| File | Purpose |
|------|---------|
| `src/app/layout.tsx` | Root layout, providers, nav |
| `src/app/(main)/dashboard/page.tsx` | Home after login |
| `src/app/(main)/team/create/page.tsx` | Team builder |
| `src/lib/supabase/client.ts` | Supabase browser client |
| `src/lib/supabase/server.ts` | Supabase server client |
| `src/lib/cricket-api/index.ts` | Cricket API abstraction |
| `src/lib/scoring/calculator.ts` | Points calculation |
| `src/stores/teamStore.ts` | Team builder state |
| `src/constants/scoring.ts` | Scoring rules |
| `src/components/ui/` | Reusable UI components |

---

## Code Quality Standards

### File Size Limits
| Guideline | Rule |
|-----------|------|
| **Components** | Max ~150 lines per file |
| **Pages** | Max ~100 lines (compose from components) |
| **Utilities** | Max ~100 lines per file |
| **If too large** | Split into smaller, focused files |

### File Organization Principles
```
✅ DO:
- One component per file
- Extract hooks into /hooks when reused
- Extract logic into /lib when complex
- Group related components in folders
- Use index.ts for clean exports

❌ DON'T:
- Multiple components in one file
- Business logic in components
- API calls directly in components
- Duplicate code across files
```

### Component Structure
```typescript
// src/components/players/PlayerCard.tsx (~80 lines max)
// 1. Imports
// 2. Types (or import from /types)
// 3. Component
// 4. Export

// If component grows > 150 lines, split:
// - PlayerCard.tsx (main)
// - PlayerCardStats.tsx (stats section)
// - PlayerCardActions.tsx (buttons)
// - index.ts (exports all)
```

---

## Error Handling Strategy

### API Error Handling
```typescript
// src/lib/api/errors.ts
export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code: string
  ) {
    super(message);
  }
}

// Usage in API routes
export async function GET(request: Request) {
  try {
    const data = await cricketAPI.getMatches();
    return Response.json(data);
  } catch (error) {
    console.error('Match fetch failed:', error);
    
    if (error instanceof APIError) {
      return Response.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }
    
    return Response.json(
      { error: 'Something went wrong', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
```

### Client-Side Error Handling
```typescript
// src/components/ui/ErrorBoundary.tsx
// Catches React errors, shows friendly message

// src/components/ui/ErrorState.tsx
// Reusable error display with retry button
<ErrorState 
  icon={<AlertIcon />}
  title="Couldn't load players"
  message="Check your connection and try again"
  onRetry={() => refetch()}
/>
```

### Error Types & User Messages
| Error Type | User Message | Action |
|------------|--------------|--------|
| Network | "No internet connection" | Show offline indicator |
| API rate limit | "Too many requests, wait a moment" | Auto-retry with backoff |
| Auth expired | "Session expired" | Redirect to login |
| Not found | "This doesn't exist" | Back button |
| Server error | "Something went wrong" | Retry button |
| Validation | "Please fix the errors below" | Highlight fields |

### Toast Notifications
```typescript
// src/components/ui/Toast.tsx
// Non-blocking notifications for:
// ✅ Success: "Team saved!"
// ⚠️ Warning: "Captain not selected"
// ❌ Error: "Couldn't join contest"
// ℹ️ Info: "Match starting soon"
```

### Loading States
| State | UI |
|-------|-----|
| Initial load | Skeleton shimmer |
| Refetching | Subtle spinner, keep old data |
| Error | Error state with retry |
| Empty | Empty state with illustration |

---

## Theme System (Dark + Light Mode)

### Theme Configuration
```typescript
// src/lib/theme/colors.ts
export const themes = {
  dark: {
    background: { DEFAULT: '#0a0a0f', secondary: '#111118', tertiary: '#1a1a24' },
    foreground: { DEFAULT: '#f4f4f5', muted: '#a1a1aa' },
    border: '#27272a',
    card: '#111118',
  },
  light: {
    background: { DEFAULT: '#ffffff', secondary: '#f4f4f5', tertiary: '#e4e4e7' },
    foreground: { DEFAULT: '#09090b', muted: '#71717a' },
    border: '#e4e4e7',
    card: '#ffffff',
  },
  // Accent colors same for both themes
  accent: {
    primary: '#3b82f6',      // Electric blue
    success: '#22c55e',      // Green
    warning: '#fbbf24',      // Gold
    danger: '#ef4444',       // Red
    live: '#ec4899',         // Pink
  },
};
```

### Tailwind Config
```javascript
// tailwind.config.js
module.exports = {
  darkMode: 'class', // Toggle via class on <html>
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        // ... CSS variables for theming
      },
    },
  },
};
```

### Theme Provider
```typescript
// src/components/providers/ThemeProvider.tsx
'use client';
import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light' | 'system';

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState<Theme>('dark'); // Default dark
  
  useEffect(() => {
    const saved = localStorage.getItem('theme') as Theme;
    if (saved) setTheme(saved);
  }, []);
  
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches 
        ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
    
    localStorage.setItem('theme', theme);
  }, [theme]);
  
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
```

### Theme Toggle Component
```typescript
// src/components/ui/ThemeToggle.tsx
// Icons: ☀️ Light | 🌙 Dark | 💻 System
// Location: Settings page + header dropdown
```

### CSS Variables Approach
```css
/* src/app/globals.css */
:root {
  --background: #ffffff;
  --foreground: #09090b;
  /* light mode defaults */
}

.dark {
  --background: #0a0a0f;
  --foreground: #f4f4f5;
  /* dark mode overrides */
}
```

---

## Testing Strategy

### Test Stack
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom
npm install -D @playwright/test  # E2E
```

### Test Structure
```
src/
├── __tests__/              # Unit tests next to source
├── components/
│   └── players/
│       ├── PlayerCard.tsx
│       └── PlayerCard.test.tsx  # Component test
├── lib/
│   └── scoring/
│       ├── calculator.ts
│       └── calculator.test.ts   # Unit test
tests/
└── e2e/                    # End-to-end tests
    ├── auth.spec.ts
    ├── team-builder.spec.ts
    └── contest.spec.ts
```

### What to Test (Priority Order)

#### 1. Unit Tests (High Priority)
```typescript
// src/lib/scoring/calculator.test.ts
import { calculatePlayerPoints } from './calculator';

describe('calculatePlayerPoints', () => {
  it('calculates runs correctly', () => {
    const stats = { runs: 50, ballsFaced: 30, fours: 5, sixes: 2 };
    const points = calculatePlayerPoints(stats, DEFAULT_SCORING);
    expect(points).toBe(50 + 5 + 4 + 10); // runs + 4s + 6s + half-century
  });

  it('applies duck penalty', () => {
    const stats = { runs: 0, ballsFaced: 5 };
    const points = calculatePlayerPoints(stats, DEFAULT_SCORING);
    expect(points).toBe(-5);
  });

  it('applies captain multiplier', () => {
    // ...
  });
});
```

#### 2. Component Tests (Medium Priority)
```typescript
// src/components/players/PlayerCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { PlayerCard } from './PlayerCard';

describe('PlayerCard', () => {
  const player = { id: '1', name: 'Virat Kohli', role: 'batsman', price: 105 };

  it('displays player name and price', () => {
    render(<PlayerCard player={player} />);
    expect(screen.getByText('Virat Kohli')).toBeInTheDocument();
    expect(screen.getByText('10.5')).toBeInTheDocument();
  });

  it('calls onSelect when clicked', () => {
    const onSelect = vi.fn();
    render(<PlayerCard player={player} onSelect={onSelect} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onSelect).toHaveBeenCalledWith(player);
  });

  it('shows selected state', () => {
    render(<PlayerCard player={player} selected />);
    expect(screen.getByRole('button')).toHaveClass('border-primary');
  });
});
```

#### 3. Integration Tests (Medium Priority)
```typescript
// src/lib/cricket-api/cricketdata.test.ts
// Test API client with mocked responses
```

#### 4. E2E Tests (Lower Priority, Post-MVP)
```typescript
// tests/e2e/team-builder.spec.ts
import { test, expect } from '@playwright/test';

test('user can create a fantasy team', async ({ page }) => {
  await page.goto('/team/create?tournament=ipl-2026');
  
  // Select 11 players
  for (let i = 0; i < 11; i++) {
    await page.click('.player-card >> nth=' + i);
  }
  
  // Verify team count
  await expect(page.locator('.team-count')).toHaveText('11/11');
  
  // Select captain
  await page.click('[data-testid="captain-selector"]');
  await page.click('.player-card >> nth=0');
  
  // Submit
  await page.click('[data-testid="submit-team"]');
  await expect(page).toHaveURL(/\/team\/\w+/);
});
```

### Test Coverage Goals
| Area | Coverage Target |
|------|-----------------|
| Scoring engine | 100% |
| Team validation | 100% |
| API utilities | 80% |
| Components | 60% |
| E2E critical paths | 5-10 tests |

### Running Tests
```bash
# Unit + Component tests
npm run test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# E2E tests
npm run test:e2e
```

### Package.json Scripts
```json
{
  "scripts": {
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:coverage": "vitest --coverage",
    "test:e2e": "playwright test"
  }
}
```

---

## Milestones Checklist

### MVP (Phases 0-8)
- [x] Project scaffolded with Next.js + Tailwind
- [ ] Supabase connected, schema deployed
- [ ] Auth working (Google + Email)
- [ ] Can browse tournaments and players
- [ ] Can create a fantasy team
- [ ] Can join a contest
- [ ] Points calculated after match
- [ ] Leaderboard shows rankings
- [ ] PWA installable on mobile
- [ ] Deployed to Vercel

### Post-MVP
- [ ] Daily fantasy mode
- [ ] AI opponent teams
- [ ] Push notifications
- [ ] Play Store release
- [ ] Additional leagues (CPL, International)
- [ ] Custom/Backyard league support

---

## Phase 0 Completion Summary

**Completed:** December 28, 2025

### Files Created
| Category | Files |
|----------|-------|
| App | `layout.tsx`, `page.tsx`, `globals.css` |
| Components | `Button`, `Card`, `Input`, `Toast`, `ErrorState`, `Skeleton`, `ThemeToggle` |
| Providers | `ThemeProvider` (dark/light/system) |
| Lib | `utils.ts`, `errors.ts`, `scoring/calculator.ts`, `supabase/client.ts`, `supabase/server.ts` |
| State | `stores/teamStore.ts` (Zustand) |
| Types | `types/index.ts` (all TypeScript types) |
| Constants | `scoring.ts`, `config.ts` |
| Hooks | `useDebounce`, `usePolling`, `useLocalStorage`, `useClickOutside` |
| Config | `.env.example`, `vitest.config.ts`, `manifest.json` |
| Tests | `utils.test.ts`, `calculator.test.ts`, `setup.ts` |

### Test Results
- **26 tests passing** (utils + scoring calculator)
- Test coverage for critical scoring logic

### Verified Working
- ✅ Dev server runs (`npm run dev`)
- ✅ Production build passes (`npm run build`)
- ✅ All tests pass (`npm test`)
- ✅ Dark/light theme toggle
- ✅ Landing page renders correctly

---

*Start with Phase 0 → Deploy after each phase → Iterate*
