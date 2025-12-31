# Fantasy Cricket App - Software Design Document

**Version:** 1.0  
**Date:** December 28, 2025  
**Status:** Planning Phase

---

## 1. Executive Summary

A free, cross-platform fantasy cricket application supporting multiple cricket leagues and tournaments. The app will run on web browsers (desktop), as a Progressive Web App (mobile), and potentially native apps in the future. Users can create fantasy teams, compete in public contests, and track live match data.

---

## 2. Project Goals

| Goal | Description |
|------|-------------|
| **Cross-Platform** | Single codebase serving Windows, macOS, Android, iOS via web + PWA |
| **Zero Cost** | Free for users, minimal/zero hosting costs for developer |
| **Extensible** | Easy to add new leagues and tournaments |
| **Scalable** | Support up to 1,000 users initially |
| **Future-Ready** | Architecture allows monetization (ads, premium) later |

---

## 3. Supported Leagues & Tournaments

### Phase 1 (Launch)
- **IPL** - Indian Premier League
- **International Tournaments** - World Cup, Champions Trophy, bilateral series

### Phase 2
- **CPL** - Caribbean Premier League
- **Custom/Backyard Leagues** - User-defined local tournaments

### Extensibility Requirement
- League configuration should be data-driven (JSON/database)
- Adding a new league should NOT require code changes
- Each league can have custom scoring rules

---

## 4. Target Platforms

| Platform | Solution | Priority |
|----------|----------|----------|
| Desktop Web (Windows/Mac) | React Web App | P0 |
| Mobile Web (Android/iOS) | PWA (installable) | P0 |
| Native Android | Capacitor/TWA wrapper (Play Store ready) | P1 (post-MVP) |
| Native iOS | Capacitor wrapper | P2 (future) |

### Recommended Approach: **Progressive Web App (PWA)**

**Rationale:**
- Single codebase (React/Next.js)
- Installable on all platforms
- Works offline (with service workers)
- No app store fees or approval process
- Push notifications supported
- Zero distribution cost

### Why PWA Over Native App Store (Initially)?

| PWA Advantage | Native App Store |
|---------------|------------------|
| ✅ Free to distribute | ✅ Google Play account ready ($25 paid) |
| ✅ Instant updates | ⚠️ 1-3 day review process |
| ✅ One codebase | ✅ Same code via Capacitor |
| ✅ Same install experience on Android | ✅ Store discovery |

**Play Store Plan:** After MVP is stable, wrap the PWA using **Capacitor** or **TWA (Trusted Web Activity)** and publish to Google Play. Same codebase, minimal extra work. Build this last after web/PWA is polished.

---

## 5. Technology Stack

### Frontend
| Component | Technology | Rationale |
|-----------|------------|-----------|
| Framework | **Next.js 14+** (React) | SSR, API routes, great PWA support |
| UI Library | **Tailwind CSS** + shadcn/ui | Fast development, responsive design |
| State Management | **Zustand** or React Context | Lightweight, simple |
| PWA | **next-pwa** | Service workers, offline support |
| Real-time Updates | **Socket.io** or SSE | Live score updates |

### Backend
| Component | Technology | Rationale |
|-----------|------------|-----------|
| Runtime | **Node.js** | Same language as frontend |
| API Framework | **Next.js API Routes** | Unified deployment |
| Database | **Supabase** (PostgreSQL) | Free tier, auth built-in, realtime |
| Authentication | **Supabase Auth** | Google OAuth + Email/Password |
| Caching | **Upstash Redis** | Free tier, rate limiting |

### Hosting (Free Tier Strategy)
| Service | Provider | Free Limits |
|---------|----------|-------------|
| Frontend + API | **Vercel** | 100GB bandwidth, serverless functions |
| Database | **Supabase** | 500MB database, 50K monthly users |
| Redis Cache | **Upstash** | 10K commands/day |
| File Storage | **Supabase Storage** | 1GB |

**Why Vercel?**
- Created Next.js — zero-config, first-class support
- Global edge network (fast everywhere)
- Generous free tier for hobby projects
- Push to GitHub → auto deploys
- Fast serverless cold starts
- Alternative: Netlify (similar, but Vercel is optimized for Next.js)

### Cricket Data APIs

| Provider | Free Tier | Notes |
|----------|-----------|-------|
| **CricketData.org** | 100 requests/day | Primary - most reliable |
| **Sportmonks Cricket** | Limited free tier | Backup option |
| **RapidAPI Cricbuzz** | Varies | Unofficial, may break |

**Strategy:** Abstract API calls behind a unified service layer to easily swap providers.

---

## 6. Feature Requirements

### 6.1 User Management

| Feature | Priority | Description |
|---------|----------|-------------|
| Google Sign-In | P0 | One-click authentication |
| Email/Password | P0 | Traditional registration |
| User Profile | P1 | Avatar, username, stats |
| Password Reset | P1 | Email-based recovery |

### 6.2 Fantasy Game Modes

#### Phase 1: Tournament-Based Fantasy
| Feature | Description |
|---------|-------------|
| Tournament Selection | Pick active tournaments (IPL 2026, etc.) |
| Team Creation | Select players within budget/constraints |
| Captain/Vice-Captain | Bonus point multipliers |
| Transfers | Limited transfers between matches |
| Leaderboard | Tournament-wide rankings |

#### Phase 2: Additional Modes
| Mode | Description |
|------|-------------|
| Daily Fantasy | New team per match |
| Head-to-Head | 1v1 contests |
| AI Opponents | Play against system-generated teams |
| Season-Long | Full league coverage |

### 6.3 Contests & Competition

| Feature | Priority | Description |
|---------|----------|-------------|
| Public Contests | P0 | Open to all users |
| System Opponents | P1 | AI-generated teams to compete against |
| Multiple AI Difficulty | P2 | Easy/Medium/Hard system opponents |
| Private Leagues | P2 | Future: invite-only contests |

### 6.4 Live Data Features

| Feature | Priority | Description |
|---------|----------|-------------|
| Live Scores | P0 | Match scores, current state |
| Live Player Stats | P0 | Runs, wickets, catches updated |
| Live Points | P0 | Fantasy points calculated in real-time |
| Push Notifications | P1 | Match start, big events, results |

### 6.5 Player & Team Data

| Feature | Description |
|---------|-------------|
| Player Database | All players across supported leagues |
| Player Stats | Career and recent form statistics |
| Player Pricing | Dynamic or fixed pricing per tournament |
| Team Constraints | Budget cap, max players per team, etc. |

---

## 7. System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENTS                                  │
├─────────────────┬─────────────────┬─────────────────────────────┤
│  Desktop Web    │   Mobile PWA    │     Future Native Apps      │
│  (Browser)      │  (Installed)    │    (React Native/Capacitor) │
└────────┬────────┴────────┬────────┴──────────────┬──────────────┘
         │                 │                       │
         └─────────────────┼───────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NEXT.JS APPLICATION                           │
│                      (Vercel Hosted)                             │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐     │
│  │   Frontend   │  │  API Routes  │  │  Background Jobs   │     │
│  │   (React)    │  │  (REST API)  │  │  (Cron/Webhooks)   │     │
│  └──────────────┘  └──────────────┘  └────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
         ▼                 ▼                 ▼
┌─────────────┐   ┌─────────────┐   ┌─────────────────────┐
│  Supabase   │   │   Upstash   │   │   Cricket APIs      │
│  (Database  │   │   (Redis    │   │   - CricketData.org │
│   + Auth)   │   │    Cache)   │   │   - Sportmonks      │
└─────────────┘   └─────────────┘   │   - RapidAPI        │
                                    └─────────────────────┘
```

---

## 8. Data Models (Core Entities)

### Users
```
- id (UUID)
- email
- username
- avatar_url
- auth_provider (google/email)
- created_at
- total_points
- contests_joined
```

### Leagues
```
- id
- name (IPL, CPL, etc.)
- type (franchise/international/custom)
- scoring_rules (JSON)
- is_active
- config (JSON - extensible settings)
```

### Tournaments
```
- id
- league_id
- name (IPL 2026, World Cup 2026)
- start_date
- end_date
- status (upcoming/active/completed)
```

### Players
```
- id
- name
- country
- role (batsman/bowler/all-rounder/wicket-keeper)
- team
- price
- stats (JSON)
```

### Matches
```
- id
- tournament_id
- team_home
- team_away
- start_time
- status (upcoming/live/completed)
- result (JSON)
```

### Fantasy Teams
```
- id
- user_id
- tournament_id
- players (array of player_ids)
- captain_id
- vice_captain_id
- total_points
```

### Contests
```
- id
- tournament_id
- match_id (optional, for daily)
- type (tournament/daily/h2h)
- entry_fee (0 for free)
- prize_pool
- max_entries
```

---

## 9. Scoring System (Default - Configurable per League)

### Batting
| Action | Points |
|--------|--------|
| Run scored | 1 |
| Boundary (4) | +1 bonus |
| Six | +2 bonus |
| Half-century (50) | +10 |
| Century (100) | +25 |
| Duck (0) | -5 |
| Strike rate bonus (>150) | +5 |

### Bowling
| Action | Points |
|--------|--------|
| Wicket | 25 |
| Maiden over | 10 |
| 3-wicket haul | +10 bonus |
| 5-wicket haul | +25 bonus |
| Economy rate bonus (<5) | +10 |

### Fielding
| Action | Points |
|--------|--------|
| Catch | 10 |
| Stumping | 15 |
| Run out (direct) | 15 |
| Run out (assist) | 10 |

### Multipliers
- Captain: 2x points
- Vice-Captain: 1.5x points

---

## 10. API Rate Limiting Strategy

Given free tier constraints (~100 requests/day on most APIs):

| Strategy | Description |
|----------|-------------|
| Aggressive Caching | Cache player/team data for 24 hours |
| Match-Day Polling | Only poll live data during active matches |
| Smart Intervals | Poll every 1-2 minutes during live matches |
| Fallback Chain | Primary API → Secondary → Cached data |
| User-Triggered Refresh | Manual refresh button with cooldown |

---

## 11. Monetization Hooks (Future)

Build these as disabled/hidden features:

| Feature | Implementation |
|---------|----------------|
| Ad Placements | Reserved div slots, easy to enable |
| Premium Contests | Entry fee field exists, set to 0 |
| Pro Subscription | User tier field in database |
| Remove Ads | Premium flag toggle |

---

## 12. Development Phases

### Phase 1: MVP (8-10 weeks)
- [ ] Project setup (Next.js, Supabase, Vercel)
- [ ] Authentication (Google + Email)
- [ ] Basic UI (responsive, mobile-first)
- [ ] League/Tournament data structure
- [ ] Player database (IPL initially)
- [ ] Team creation interface
- [ ] Basic scoring engine
- [ ] Public leaderboard
- [ ] PWA configuration

### Phase 2: Live Features (4-6 weeks)
- [ ] Live score integration
- [ ] Real-time points calculation
- [ ] Match schedule display
- [ ] Push notifications
- [ ] Player stats pages

### Phase 3: Enhanced Gameplay (4-6 weeks)
- [ ] AI/System opponents
- [ ] Daily fantasy mode
- [ ] Head-to-head contests
- [ ] Additional leagues (CPL, International)

### Phase 4: Polish & Scale (Ongoing)
- [ ] Custom/Backyard league support
- [ ] Performance optimization
- [ ] Private leagues
- [ ] Monetization features (if needed)

---

## 13. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| API rate limits exceeded | No live data | Multiple API fallbacks, aggressive caching |
| API provider shuts down | App breaks | Abstracted API layer, easy to swap |
| Free hosting limits hit | Site down | Monitor usage, upgrade if needed ($5-20/mo) |
| Data accuracy issues | Poor UX | Multiple source validation |
| Scope creep | Never ships | Strict MVP focus |

---

## 14. Design System

### Theme: Dark Mode Default

| Element | Value | Purpose |
|---------|-------|---------|
| Background (primary) | `#0a0a0f` | Deep dark, easy on eyes |
| Background (secondary) | `#111118` | Cards, elevated surfaces |
| Background (tertiary) | `#1a1a24` | Hover states, borders |
| Text (primary) | `#f4f4f5` | High contrast readable |
| Text (secondary) | `#a1a1aa` | Subdued, secondary info |

### Accent Colors (Exciting, Sports-Inspired)

| Color | Hex | Usage |
|-------|-----|-------|
| Electric Blue | `#3b82f6` | Primary actions, links |
| Neon Green | `#22c55e` | Success, points gained, winning |
| Gold | `#fbbf24` | Premium, captain badge, highlights |
| Hot Pink | `#ec4899` | Live indicator, urgent alerts |
| Red | `#ef4444` | Errors, points lost, warnings |

### Performance-First Approach

| Principle | Implementation |
|-----------|----------------|
| Minimal CSS | Tailwind CSS (purged, <10KB) |
| No heavy libs | CSS transitions only, no Framer Motion |
| Fast fonts | System font stack or single variable font |
| Lazy loading | Images and non-critical components |
| Skeleton loaders | Perceived performance while loading |

### Design Inspiration
- **Dream11** — Sports energy, card-based layouts
- **Discord** — Dark theme done right
- **ESPN/Cricbuzz** — Information density for sports
- **Linear** — Clean, modern, fast feel

### UX Philosophy: Intuitive for Everyone

**Goal:** Anyone can use the app, even without reading — through visual design, icons, and universal patterns.

#### Icon-First Design
| Action | Icon | Text (Secondary) |
|--------|------|------------------|
| Add player | ➕ (green) | "Add" |
| Remove player | ✖️ (red) | "Remove" |
| Captain | ©️ / Crown 👑 | "Captain" |
| Vice-Captain | VC badge / Star ⭐ | "Vice Captain" |
| Batsman | 🏏 bat icon | "BAT" |
| Bowler | 🎯 ball icon | "BOWL" |
| All-rounder | 🏏+🎯 combined | "AR" |
| Wicket-keeper | 🧤 gloves icon | "WK" |
| Points up | ▲ green arrow | "+10" |
| Points down | ▼ red arrow | "-5" |
| Live match | 🔴 pulsing dot | "LIVE" |
| Completed | ✅ checkmark | "Finished" |

#### Color as Language
| Color | Meaning (Universal) |
|-------|---------------------|
| 🟢 Green | Good, positive, selected, go |
| 🔴 Red | Bad, negative, remove, stop |
| 🟡 Gold/Yellow | Special, premium, captain |
| 🔵 Blue | Interactive, clickable, info |
| ⚪ White/Gray | Neutral, disabled, secondary |

#### Visual Feedback (Fun & Responsive)
| Interaction | Feedback |
|-------------|----------|
| Tap/Click player | Card bounces slightly, color highlight |
| Add to team | Swoosh animation, player slides to "Your Team" |
| Captain selected | Crown drops onto player, sparkle effect ✨ |
| Points scored | Numbers pop up and float, green glow |
| Wicket taken | Ball explosion animation 💥 |
| Win contest | Confetti burst 🎉 |
| Error/Invalid | Shake animation, red flash |

#### Layout Principles
| Principle | Implementation |
|-----------|----------------|
| **Big touch targets** | Buttons min 48x48px, cards easy to tap |
| **Visual hierarchy** | Most important info largest, top of screen |
| **Consistent positions** | Nav always bottom, actions always same spot |
| **Progress indicators** | Visual bars showing team completion (7/11 players) |
| **Avatars & photos** | Player faces > names for recognition |
| **Team logos** | Always show team badges, instantly recognizable |
| **Numbers prominent** | Points, prices, stats — large and bold |

#### Onboarding (No Reading Required)
| Step | Visual Guide |
|------|--------------|
| 1. Pick tournament | Show logos (IPL, WC) — tap the one you recognize |
| 2. Build team | Drag players into slots, visual budget bar fills |
| 3. Pick captain | Tap crown icon on any player |
| 4. Submit | Big green button with ✓ checkmark |

#### Sound & Haptics (Optional, Enhances Fun)
| Event | Feedback |
|-------|----------|
| Player added | Soft "pop" sound, light vibration |
| Captain selected | Triumphant chime |
| Points scored | Cash register "cha-ching" |
| Match won | Victory fanfare |

*All sounds off by default, toggle in settings*

---

## 15. Domain & Branding

### Production Domain
- **`fantasycricket.app`** ✅ (Selected)

### Development
- `fantasy-cricket.vercel.app` (auto-assigned, free)

### Branding Notes
- App name: **Fantasy Cricket** (or stylized: **FantasyCricket**)
- Consider logo: Cricket ball + fantasy stars/sparkles motif

---

## 16. Open Questions

- [x] ~~Specific backyard cricket league rules/format?~~ → Defer, infrastructure will support it
- [x] ~~Preferred domain name?~~ → **fantasycricket.app**
- [x] ~~Any specific UI/design preferences?~~ → Dark mode, exciting colors, performance-first
- [x] ~~Timeline expectations?~~ → Hobby pace, no deadline
- [x] ~~App store plans?~~ → Google Play after MVP (account ready), iOS later

---

## 17. Next Steps

1. **Set up development environment**
   - Initialize Next.js project
   - Configure Supabase
   - Set up Vercel deployment

2. **Create database schema**
   - Run migrations for core tables

3. **Build authentication**
   - Google OAuth
   - Email/password

4. **Start with IPL data**
   - Import player database
   - Set up API integration

---

*Document maintained at: `/SDD.md`*
