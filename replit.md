# League of Legends Player Tracker

## Overview
A real-time League of Legends player tracking application that monitors specified players and sends notifications when games finish. Built with React frontend and Express backend, utilizing the Riot Games API with smart rate-limited polling.

## Purpose
- Track multiple League of Legends players across different regions
- Detect when players finish games in real-time
- Analyze losing streaks (3+ consecutive losses)
- Store match statistics and timeline data
- Respect Riot API Development Key rate limits (100 requests per 2 minutes)

## Current State
**Status**: MVP implemented with full functionality

**Features Implemented**:
- ✅ Smart polling queue system (1.5s delays between checks)
- ✅ Backend proxy for all Riot API calls
- ✅ Real-time game finish detection via match ID comparison
- ✅ Automatic losing streak detection and notifications
- ✅ Match timeline data collection and storage
- ✅ Live dashboard with player status cards
- ✅ Player detail modal with match statistics
- ✅ Toast notifications for game events
- ✅ Dark mode support
- ✅ PostgreSQL database persistence
- ✅ Responsive UI with Tailwind CSS

## Recent Changes
*November 1, 2025*
- Created initial frontend prototype with gaming dashboard aesthetic
- Implemented complete backend API with Riot Games integration
- Set up PostgreSQL database with Drizzle ORM
- Built smart polling queue respecting rate limits (1.5s between checks)
- Added real-time notification system for game completions and losing streaks
- Integrated frontend with backend using TanStack Query

## Project Architecture

### Technology Stack
**Frontend**:
- React with TypeScript
- Wouter for routing
- TanStack Query for data fetching
- Tailwind CSS + shadcn/ui components
- Lucide React icons

**Backend**:
- Node.js + Express
- Riot Games API v5 (Summoner, Match, Timeline endpoints)
- PostgreSQL with Drizzle ORM
- In-memory notification queue

**Database Schema**:
- `players`: Summoner info, tracking status, losing streak count
- `matches`: Match statistics and timeline data
- `users`: Authentication (not yet implemented)

### Smart Polling System
The core feature is the rate-limited polling queue:
- Fetches all tracked players from database
- Loops through one player at a time
- 1.5 second delay between each check (stays under 100 req/2min limit)
- Compares latest match ID with stored last known match ID
- Triggers game finish detection when new match appears
- Queues pattern analysis for match details and losing streak detection

### API Endpoints
- `GET /api/players` - Get all tracked players
- `POST /api/players` - Add new player by summoner name
- `DELETE /api/players/:id` - Remove tracked player
- `GET /api/players/:id/matches` - Get player match history
- `GET /api/notifications` - Get recent event notifications
- `GET /api/status` - Get polling queue status

## Configuration

### Environment Variables
- `DATABASE_URL` - PostgreSQL connection string (auto-configured)
- `RIOT_API_KEY` - Riot Games Development API key (expires every 24 hours)

**IMPORTANT**: The Riot API key must be updated daily in `server/riot-api.ts` at the top of the file:
```typescript
const RIOT_API_KEY = process.env.RIOT_API_KEY || "RGAPI-YOUR-KEY-HERE";
```

### Supported Regions
- NA (na1) - North America
- EUW (euw1) - Europe West
- EUNE (eun1) - Europe Nordic & East
- KR (kr) - Korea
- BR (br1) - Brazil
- LAN (la1) - Latin America North
- LAS (la2) - Latin America South
- OCE (oc1) - Oceania
- RU (ru) - Russia
- TR (tr1) - Turkey
- JP (jp1) - Japan

## Key Design Decisions

### Rate Limit Strategy
Using 1.5 second delays between checks allows tracking up to 80 players continuously while staying under the 100 requests per 2 minutes limit. This provides a safety margin and accounts for additional API calls during pattern analysis.

### Game Detection Logic
Rather than continuously polling match endpoints, the system:
1. Stores the most recent match ID for each player
2. Checks only the latest match on each poll cycle
3. Detects new games by ID comparison (very efficient)
4. Triggers detailed analysis only when new games are detected

### Pattern Analysis
After detecting a new game:
- Fetches last 10 matches to check win/loss pattern
- Counts consecutive losses from most recent backward
- Updates losing streak status if 3+ losses detected
- Downloads and stores full match timeline data
- All analysis happens asynchronously to not block polling queue

## User Preferences
- Clean, gaming-inspired dashboard aesthetic
- Information-dense but scannable layout
- Real-time updates without page refresh
- Minimal user interaction required (add player, remove player, view details)
- Dark mode support for extended use sessions

## Development Commands
- `npm run dev` - Start development server (frontend + backend)
- `npm run db:push` - Push database schema changes
- `npm run db:push --force` - Force push schema (use if conflicts occur)

## Future Enhancements (Not Yet Implemented)
- Configurable notification preferences per player
- Historical match data visualization with charts
- Advanced pattern detection (champion performance, role analysis)
- WebSocket for true real-time updates instead of polling
- User authentication and multi-user support
- Timeline data visualization (gold graphs, ward heatmaps)
- Export match data to JSON/CSV
- Customizable polling intervals per player
- Champion mastery and performance tracking
