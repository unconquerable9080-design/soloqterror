var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  insertMatchSchema: () => insertMatchSchema,
  insertPlayerSchema: () => insertPlayerSchema,
  insertUserSchema: () => insertUserSchema,
  matches: () => matches,
  players: () => players,
  users: () => users
});
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull()
});
var insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true
});
var players = pgTable("players", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  summonerName: text("summoner_name").notNull(),
  puuid: text("puuid").notNull(),
  region: text("region").notNull().default("na1"),
  lastMatchId: text("last_match_id"),
  status: text("status").notNull().default("idle"),
  losingStreak: integer("losing_streak").notNull().default(0),
  lastChecked: timestamp("last_checked"),
  addedAt: timestamp("added_at").notNull().default(sql`now()`)
});
var insertPlayerSchema = createInsertSchema(players).pick({
  summonerName: true,
  region: true
});
var matches = pgTable("matches", {
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
  completedAt: timestamp("completed_at").notNull().default(sql`now()`)
});
var insertMatchSchema = createInsertSchema(matches).omit({
  id: true,
  completedAt: true
});

// server/db.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
neonConfig.webSocketConstructor = ws;
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
var db = drizzle({ client: pool, schema: schema_exports });

// server/storage.ts
import { eq, desc } from "drizzle-orm";
var DatabaseStorage = class {
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || void 0;
  }
  async getUserByUsername(username) {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || void 0;
  }
  async createUser(insertUser) {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  async getPlayer(id) {
    const [player] = await db.select().from(players).where(eq(players.id, id));
    return player || void 0;
  }
  async getPlayerBySummonerName(summonerName) {
    const [player] = await db.select().from(players).where(eq(players.summonerName, summonerName));
    return player || void 0;
  }
  async getAllPlayers() {
    return db.select().from(players);
  }
  async createPlayer(player) {
    const [newPlayer] = await db.insert(players).values({
      ...player,
      status: "idle",
      losingStreak: 0
    }).returning();
    return newPlayer;
  }
  async updatePlayer(id, updates) {
    const [updated] = await db.update(players).set({ ...updates, lastChecked: /* @__PURE__ */ new Date() }).where(eq(players.id, id)).returning();
    return updated || void 0;
  }
  async deletePlayer(id) {
    await db.delete(players).where(eq(players.id, id));
  }
  async getMatchesByPlayerId(playerId, limit = 10) {
    return db.select().from(matches).where(eq(matches.playerId, playerId)).orderBy(desc(matches.completedAt)).limit(limit);
  }
  async createMatch(match) {
    const [newMatch] = await db.insert(matches).values(match).returning();
    return newMatch;
  }
};
var storage = new DatabaseStorage();

// server/riot-api.ts
var RIOT_API_KEY = process.env.RIOT_API_KEY || "RGAPI-YOUR-KEY-HERE";
var REGIONS = {
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
  jp1: "asia"
};
var RiotAPIService = class {
  pollingQueue = [];
  isPolling = false;
  eventCallbacks = /* @__PURE__ */ new Map();
  constructor() {
    this.startPolling();
  }
  on(event, callback) {
    if (!this.eventCallbacks.has(event)) {
      this.eventCallbacks.set(event, []);
    }
    this.eventCallbacks.get(event).push(callback);
  }
  emit(event, data) {
    const callbacks = this.eventCallbacks.get(event) || [];
    callbacks.forEach((cb) => cb(data));
  }
  async getSummonerByName(summonerName, region) {
    try {
      const response = await fetch(
        `https://${region}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${encodeURIComponent(summonerName)}`,
        {
          headers: {
            "X-Riot-Token": RIOT_API_KEY
          }
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
  async getMatchList(puuid, region, count = 5) {
    try {
      const regionalEndpoint = REGIONS[region] || "americas";
      const response = await fetch(
        `https://${regionalEndpoint}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=${count}`,
        {
          headers: {
            "X-Riot-Token": RIOT_API_KEY
          }
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
  async getMatchDetails(matchId, region) {
    try {
      const regionalEndpoint = REGIONS[region] || "americas";
      const response = await fetch(
        `https://${regionalEndpoint}.api.riotgames.com/lol/match/v5/matches/${matchId}`,
        {
          headers: {
            "X-Riot-Token": RIOT_API_KEY
          }
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
  async checkPlayerMatches(player) {
    const matchIds = await this.getMatchList(player.puuid, player.region, 1);
    if (matchIds.length === 0) {
      await storage.updatePlayer(player.id, {});
      return;
    }
    const latestMatchId = matchIds[0];
    if (player.lastMatchId && latestMatchId !== player.lastMatchId) {
      console.log(`\u{1F3AE} Game finished for ${player.summonerName}!`);
      await storage.updatePlayer(player.id, {
        lastMatchId: latestMatchId,
        status: "just_finished"
      });
      this.emit("game_finished", { player, matchId: latestMatchId });
      this.analyzeMatch(player, latestMatchId);
    } else if (!player.lastMatchId) {
      await storage.updatePlayer(player.id, {
        lastMatchId: latestMatchId,
        status: "idle"
      });
    } else {
      await storage.updatePlayer(player.id, {});
    }
  }
  async analyzeMatch(player, matchId) {
    try {
      const recentMatchIds = await this.getMatchList(player.puuid, player.region, 10);
      let consecutiveLosses = 0;
      for (const id of recentMatchIds) {
        const matchDetails = await this.getMatchDetails(id, player.region);
        if (!matchDetails) break;
        const participant = matchDetails.info.participants.find((p) => p.puuid === player.puuid);
        if (!participant) break;
        if (participant.win) {
          break;
        }
        consecutiveLosses++;
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
      const latestMatch = await this.getMatchDetails(matchId, player.region);
      if (latestMatch) {
        const participant = latestMatch.info.participants.find((p) => p.puuid === player.puuid);
        if (participant) {
          await storage.createMatch({
            playerId: player.id,
            matchId,
            champion: participant.championName,
            result: participant.win ? "win" : "loss",
            kills: participant.kills,
            deaths: participant.deaths,
            assists: participant.assists,
            wardsPlaced: (participant.challenges?.wardTakedowns || 0) + (participant.challenges?.controlWardsPlaced || 0),
            creepScore: participant.totalMinionsKilled + participant.neutralMinionsKilled,
            goldEarned: participant.goldEarned,
            gameDuration: latestMatch.info.gameDuration
          });
        }
      }
      if (consecutiveLosses >= 3) {
        await storage.updatePlayer(player.id, {
          status: "losing_streak",
          losingStreak: consecutiveLosses
        });
        this.emit("losing_streak", { player, streak: consecutiveLosses });
      } else {
        await storage.updatePlayer(player.id, {
          status: "idle",
          losingStreak: consecutiveLosses
        });
      }
    } catch (error) {
      console.error("Error analyzing match:", error);
    }
  }
  async pollNextPlayer() {
    if (this.pollingQueue.length === 0) {
      this.pollingQueue = await storage.getAllPlayers();
    }
    if (this.pollingQueue.length === 0) {
      return;
    }
    const player = this.pollingQueue.shift();
    try {
      await this.checkPlayerMatches(player);
    } catch (error) {
      console.error(`Error checking player ${player.summonerName}:`, error);
    }
  }
  async pollLoop() {
    while (this.isPolling) {
      await this.pollNextPlayer();
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
  }
  startPolling() {
    if (this.isPolling) return;
    this.isPolling = true;
    console.log("\u{1F504} Started smart polling queue (1.5s delay between checks)");
    this.pollLoop().catch((error) => {
      console.error("Polling loop error:", error);
      this.isPolling = false;
    });
  }
  stopPolling() {
    this.isPolling = false;
    console.log("\u23F8\uFE0F  Stopped polling queue");
  }
  getPollingStatus() {
    return {
      isActive: this.isPolling,
      queueLength: this.pollingQueue.length
    };
  }
};
var riotAPI = new RiotAPIService();

// server/routes.ts
import { z } from "zod";
async function registerRoutes(app2) {
  const notifications = [];
  riotAPI.on("game_finished", async ({ player, matchId }) => {
    notifications.push({
      type: "game_finished",
      summonerName: player.summonerName,
      timestamp: Date.now()
    });
    console.log(`\u{1F4E2} Notification: ${player.summonerName} finished a game (${matchId})`);
  });
  riotAPI.on("losing_streak", async ({ player, streak }) => {
    notifications.push({
      type: "losing_streak",
      summonerName: player.summonerName,
      losingStreak: streak,
      timestamp: Date.now()
    });
    console.log(`\u{1F4E2} Notification: ${player.summonerName} is on a ${streak}-game losing streak`);
  });
  app2.get("/api/players", async (req, res) => {
    try {
      const players2 = await storage.getAllPlayers();
      res.json(players2);
    } catch (error) {
      console.error("Error fetching players:", error);
      res.status(500).json({ error: "Failed to fetch players" });
    }
  });
  app2.post("/api/players", async (req, res) => {
    try {
      const validatedData = insertPlayerSchema.parse(req.body);
      const existing = await storage.getPlayerBySummonerName(validatedData.summonerName);
      if (existing) {
        return res.status(400).json({ error: "Player already tracked" });
      }
      const summoner = await riotAPI.getSummonerByName(
        validatedData.summonerName,
        validatedData.region || "na1"
      );
      if (!summoner) {
        return res.status(404).json({ error: "Summoner not found" });
      }
      const player = await storage.createPlayer({
        summonerName: summoner.name,
        puuid: summoner.puuid,
        region: validatedData.region || "na1"
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
  app2.delete("/api/players/:id", async (req, res) => {
    try {
      await storage.deletePlayer(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing player:", error);
      res.status(500).json({ error: "Failed to remove player" });
    }
  });
  app2.get("/api/players/:id/matches", async (req, res) => {
    try {
      const matches2 = await storage.getMatchesByPlayerId(req.params.id, 10);
      res.json(matches2);
    } catch (error) {
      console.error("Error fetching matches:", error);
      res.status(500).json({ error: "Failed to fetch matches" });
    }
  });
  app2.get("/api/notifications", async (req, res) => {
    try {
      const since = parseInt(req.query.since) || 0;
      const recent = notifications.filter((n) => n.timestamp > since);
      res.json(recent);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });
  app2.get("/api/status", async (req, res) => {
    try {
      const status = riotAPI.getPollingStatus();
      res.json(status);
    } catch (error) {
      console.error("Error fetching status:", error);
      res.status(500).json({ error: "Failed to fetch status" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      ),
      await import("@replit/vite-plugin-dev-banner").then(
        (m) => m.devBanner()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
