import { storage } from "./storage";
import type { Player } from "@shared/schema";

// IMPORTANT: Update this API key daily as it expires every 24 hours
const RIOT_API_KEY = process.env.RIOT_API_KEY || "RGAPI-YOUR-KEY-HERE";

const REGIONS: Record<string, string> = {
  na1: "americas",
  euw1: "europe",
  eun1: "europe",
  kr: "asia",
  br1: "americas",
  la1: "americas",
  la2: "americas",
  oc1: "sea",
  ru: "europe",
  tr1: "europe",
  jp1: "asia",
};

interface RiotSummoner {
  puuid: string;
  name: string;
  id: string;
}

interface RiotMatch {
  metadata: {
    matchId: string;
  };
  info: {
    gameDuration: number;
    participants: Array<{
      puuid: string;
      championName: string;
      kills: number;
      deaths: number;
      assists: number;
      win: boolean;
      totalMinionsKilled: number;
      neutralMinionsKilled: number;
      goldEarned: number;
      challenges?: {
        wardTakedowns?: number;
        controlWardsPlaced?: number;
      };
    }>;
  };
}

export class RiotAPIService {
  private pollingQueue: Player[] = [];
  private isPolling = false;
  private eventCallbacks: Map<string, Function[]> = new Map();

  constructor() {
    this.startPolling();
  }

  on(event: string, callback: Function) {
    if (!this.eventCallbacks.has(event)) {
      this.eventCallbacks.set(event, []);
    }
    this.eventCallbacks.get(event)!.push(callback);
  }

  private emit(event: string, data: any) {
    const callbacks = this.eventCallbacks.get(event) || [];
    callbacks.forEach(cb => cb(data));
  }

  async getSummonerByName(summonerName: string, region: string): Promise<RiotSummoner | null> {
    try {
      const response = await fetch(
        `https://${region}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${encodeURIComponent(summonerName)}`,
        {
          headers: {
            "X-Riot-Token": RIOT_API_KEY,
          },
        }
      );

      if (!response.ok) {
        console.error(`Failed to fetch summoner: ${response.status} ${response.statusText}`);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching summoner:", error);
      return null;
    }
  }

  async getMatchList(puuid: string, region: string, count: number = 5): Promise<string[]> {
    try {
      const regionalEndpoint = REGIONS[region] || "americas";
      const response = await fetch(
        `https://${regionalEndpoint}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=${count}`,
        {
          headers: {
            "X-Riot-Token": RIOT_API_KEY,
          },
        }
      );

      if (!response.ok) {
        console.error(`Failed to fetch match list: ${response.status}`);
        return [];
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching match list:", error);
      return [];
    }
  }

  async getMatchDetails(matchId: string, region: string): Promise<RiotMatch | null> {
    try {
      const regionalEndpoint = REGIONS[region] || "americas";
      const response = await fetch(
        `https://${regionalEndpoint}.api.riotgames.com/lol/match/v5/matches/${matchId}`,
        {
          headers: {
            "X-Riot-Token": RIOT_API_KEY,
          },
        }
      );

      if (!response.ok) {
        console.error(`Failed to fetch match details: ${response.status}`);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching match details:", error);
      return null;
    }
  }

  private async checkPlayerMatches(player: Player) {
    const matchIds = await this.getMatchList(player.puuid, player.region, 1);
    
    if (matchIds.length === 0) {
      // No matches found, update lastChecked
      await storage.updatePlayer(player.id, {});
      return;
    }

    const latestMatchId = matchIds[0];

    // Check if this is a new match
    if (player.lastMatchId && latestMatchId !== player.lastMatchId) {
      console.log(`🎮 Game finished for ${player.summonerName}!`);
      
      // Update player with new match ID and status
      await storage.updatePlayer(player.id, {
        lastMatchId: latestMatchId,
        status: 'just_finished',
      });

      // Trigger pattern analysis
      this.emit('game_finished', { player, matchId: latestMatchId });
      
      // Analyze the match (will update status to idle or losing_streak)
      this.analyzeMatch(player, latestMatchId);
    } else if (!player.lastMatchId) {
      // First time checking this player, just store their latest match
      await storage.updatePlayer(player.id, {
        lastMatchId: latestMatchId,
        status: 'idle',
      });
    } else {
      // No new match, just update lastChecked timestamp
      await storage.updatePlayer(player.id, {});
    }
  }

  private async analyzeMatch(player: Player, matchId: string) {
    try {
      // Get recent matches to check for losing streak
      const recentMatchIds = await this.getMatchList(player.puuid, player.region, 10);
      let consecutiveLosses = 0;

      for (const id of recentMatchIds) {
        const matchDetails = await this.getMatchDetails(id, player.region);
        if (!matchDetails) break;

        const participant = matchDetails.info.participants.find(p => p.puuid === player.puuid);
        if (!participant) break;

        if (participant.win) {
          break; // Stop counting at first win
        }
        consecutiveLosses++;

        // Rate limit: small delay between match detail fetches
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      // Get the latest match details for storage
      const latestMatch = await this.getMatchDetails(matchId, player.region);
      if (latestMatch) {
        const participant = latestMatch.info.participants.find(p => p.puuid === player.puuid);
        if (participant) {
          // Save match data
          await storage.createMatch({
            playerId: player.id,
            matchId: matchId,
            champion: participant.championName,
            result: participant.win ? 'win' : 'loss',
            kills: participant.kills,
            deaths: participant.deaths,
            assists: participant.assists,
            wardsPlaced: (participant.challenges?.wardTakedowns || 0) + (participant.challenges?.controlWardsPlaced || 0),
            creepScore: participant.totalMinionsKilled + participant.neutralMinionsKilled,
            goldEarned: participant.goldEarned,
            gameDuration: latestMatch.info.gameDuration,
          });
        }
      }

      // Update losing streak status
      if (consecutiveLosses >= 3) {
        await storage.updatePlayer(player.id, {
          status: 'losing_streak',
          losingStreak: consecutiveLosses,
        });
        this.emit('losing_streak', { player, streak: consecutiveLosses });
      } else {
        // Not on a losing streak, return to idle status
        await storage.updatePlayer(player.id, {
          status: 'idle',
          losingStreak: consecutiveLosses,
        });
      }
    } catch (error) {
      console.error("Error analyzing match:", error);
    }
  }

  private async pollNextPlayer() {
    if (this.pollingQueue.length === 0) {
      // Refresh the queue with all players
      this.pollingQueue = await storage.getAllPlayers();
    }

    if (this.pollingQueue.length === 0) {
      // No players to check, wait before next cycle
      return;
    }

    const player = this.pollingQueue.shift()!;
    
    try {
      await this.checkPlayerMatches(player);
    } catch (error) {
      console.error(`Error checking player ${player.summonerName}:`, error);
    }
  }

  private async pollLoop() {
    while (this.isPolling) {
      await this.pollNextPlayer();
      // Wait 1.5 seconds before next check to respect rate limit
      // 100 requests per 2 minutes = ~1.2 seconds minimum
      // Using 1.5 seconds for safety margin
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
  }

  startPolling() {
    if (this.isPolling) return;

    this.isPolling = true;
    console.log("🔄 Started smart polling queue (1.5s delay between checks)");

    // Start the async polling loop
    this.pollLoop().catch(error => {
      console.error("Polling loop error:", error);
      this.isPolling = false;
    });
  }

  stopPolling() {
    this.isPolling = false;
    console.log("⏸️  Stopped polling queue");
  }

  getPollingStatus() {
    return {
      isActive: this.isPolling,
      queueLength: this.pollingQueue.length,
    };
  }
}

export const riotAPI = new RiotAPIService();
