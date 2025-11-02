import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { riotAPI } from "./riot-api";
import { insertPlayerSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  const notifications: Array<{ type: string; summonerName: string; losingStreak?: number; timestamp: number }> = [];

  // Listen for game finished events
  riotAPI.on('game_finished', async ({ player, matchId }: any) => {
    notifications.push({
      type: 'game_finished',
      summonerName: player.summonerName,
      timestamp: Date.now(),
    });
    console.log(`📢 Notification: ${player.summonerName} finished a game (${matchId})`);
  });

  // Listen for losing streak events
  riotAPI.on('losing_streak', async ({ player, streak }: any) => {
    notifications.push({
      type: 'losing_streak',
      summonerName: player.summonerName,
      losingStreak: streak,
      timestamp: Date.now(),
    });
    console.log(`📢 Notification: ${player.summonerName} is on a ${streak}-game losing streak`);
  });

  // Get all tracked players
  app.get("/api/players", async (req, res) => {
    try {
      const players = await storage.getAllPlayers();
      res.json(players);
    } catch (error) {
      console.error("Error fetching players:", error);
      res.status(500).json({ error: "Failed to fetch players" });
    }
  });

  // Add a new player
  app.post("/api/players", async (req, res) => {
    try {
      const validatedData = insertPlayerSchema.parse(req.body);
      
      // Check if player already exists
      const existing = await storage.getPlayerBySummonerName(validatedData.summonerName);
      if (existing) {
        return res.status(400).json({ error: "Player already tracked" });
      }

      // Fetch summoner from Riot API
      const summoner = await riotAPI.getSummonerByName(
        validatedData.summonerName,
        validatedData.region || 'na1'
      );

      if (!summoner) {
        return res.status(404).json({ error: "Summoner not found" });
      }

      // Create player in database
      const player = await storage.createPlayer({
        summonerName: summoner.name,
        puuid: summoner.puuid,
        region: validatedData.region || 'na1',
      });

      res.json(player);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error adding player:", error);
      res.status(500).json({ error: "Failed to add player" });
    }
  });

  // Remove a player
  app.delete("/api/players/:id", async (req, res) => {
    try {
      await storage.deletePlayer(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing player:", error);
      res.status(500).json({ error: "Failed to remove player" });
    }
  });

  // Get player match history
  app.get("/api/players/:id/matches", async (req, res) => {
    try {
      const matches = await storage.getMatchesByPlayerId(req.params.id, 10);
      res.json(matches);
    } catch (error) {
      console.error("Error fetching matches:", error);
      res.status(500).json({ error: "Failed to fetch matches" });
    }
  });

  // Get recent notifications
  app.get("/api/notifications", async (req, res) => {
    try {
      const since = parseInt(req.query.since as string) || 0;
      const recent = notifications.filter(n => n.timestamp > since);
      res.json(recent);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  // Get polling status
  app.get("/api/status", async (req, res) => {
    try {
      const status = riotAPI.getPollingStatus();
      res.json(status);
    } catch (error) {
      console.error("Error fetching status:", error);
      res.status(500).json({ error: "Failed to fetch status" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
