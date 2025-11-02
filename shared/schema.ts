import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const players = pgTable("players", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  summonerName: text("summoner_name").notNull(),
  puuid: text("puuid").notNull(),
  region: text("region").notNull().default('na1'),
  lastMatchId: text("last_match_id"),
  status: text("status").notNull().default('idle'),
  losingStreak: integer("losing_streak").notNull().default(0),
  lastChecked: timestamp("last_checked"),
  addedAt: timestamp("added_at").notNull().default(sql`now()`),
});

export const insertPlayerSchema = createInsertSchema(players).pick({
  summonerName: true,
  region: true,
});

export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type Player = typeof players.$inferSelect;

export const matches = pgTable("matches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  playerId: varchar("player_id").notNull().references(() => players.id),
  matchId: text("match_id").notNull(),
  champion: text("champion"),
  result: text("result"),
  kills: integer("kills"),
  deaths: integer("deaths"),
  assists: integer("assists"),
  wardsPlaced: integer("wards_placed"),
  creepScore: integer("creep_score"),
  goldEarned: integer("gold_earned"),
  gameDuration: integer("game_duration"),
  completedAt: timestamp("completed_at").notNull().default(sql`now()`),
});

export const insertMatchSchema = createInsertSchema(matches).omit({
  id: true,
  completedAt: true,
});

export type InsertMatch = z.infer<typeof insertMatchSchema>;
export type Match = typeof matches.$inferSelect;
