import { 
  users, 
  players, 
  matches,
  type User, 
  type InsertUser,
  type Player,
  type InsertPlayer,
  type Match,
  type InsertMatch
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getPlayer(id: string): Promise<Player | undefined>;
  getPlayerBySummonerName(summonerName: string): Promise<Player | undefined>;
  getAllPlayers(): Promise<Player[]>;
  createPlayer(player: InsertPlayer & { puuid: string }): Promise<Player>;
  updatePlayer(id: string, updates: Partial<Player>): Promise<Player | undefined>;
  deletePlayer(id: string): Promise<void>;
  
  getMatchesByPlayerId(playerId: string, limit?: number): Promise<Match[]>;
  createMatch(match: InsertMatch): Promise<Match>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getPlayer(id: string): Promise<Player | undefined> {
    const [player] = await db.select().from(players).where(eq(players.id, id));
    return player || undefined;
  }

  async getPlayerBySummonerName(summonerName: string): Promise<Player | undefined> {
    const [player] = await db.select().from(players).where(eq(players.summonerName, summonerName));
    return player || undefined;
  }

  async getAllPlayers(): Promise<Player[]> {
    return db.select().from(players);
  }

  async createPlayer(player: InsertPlayer & { puuid: string }): Promise<Player> {
    const [newPlayer] = await db
      .insert(players)
      .values({
        ...player,
        status: 'idle',
        losingStreak: 0,
      })
      .returning();
    return newPlayer;
  }

  async updatePlayer(id: string, updates: Partial<Player>): Promise<Player | undefined> {
    const [updated] = await db
      .update(players)
      .set({ ...updates, lastChecked: new Date() })
      .where(eq(players.id, id))
      .returning();
    return updated || undefined;
  }

  async deletePlayer(id: string): Promise<void> {
    await db.delete(players).where(eq(players.id, id));
  }

  async getMatchesByPlayerId(playerId: string, limit: number = 10): Promise<Match[]> {
    return db
      .select()
      .from(matches)
      .where(eq(matches.playerId, playerId))
      .orderBy(desc(matches.completedAt))
      .limit(limit);
  }

  async createMatch(match: InsertMatch): Promise<Match> {
    const [newMatch] = await db
      .insert(matches)
      .values(match)
      .returning();
    return newMatch;
  }
}

export const storage = new DatabaseStorage();
