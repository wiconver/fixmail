import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import MemoryStore from "memorystore";
import { google } from "googleapis";
import OpenAI from "openai";
import { storage } from "./storage";
import {
  isDemo,
  getMockEmails,
  getMockStats,
  searchMockEmails,
  deleteMockEmails,
  deleteMockPromotionsToday,
  deleteMockBySender,
} from "./mock-emails";

const MemStore = MemoryStore(session);

const GMAIL_SCOPES = [
  "https://mail.google.com/",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
];

const FREEMIUM_LIMIT = 50;
const PRO_CODE = "FIXPRO";
const DEMO_EMAIL = "demo@fixmail.app";
const DEMO_NAME = "Usuario Demo";

function getCurrentMonthYear(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function getOAuth2Client(redirectUri: string) {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri
  );
}

function getRedirectUri(req: Request): string {
  const host = req.get("host") || "localhost:5000";
  const proto = host.includes("replit.app") ? "https" : "http";
  return `${proto}://${host}/api/auth/callback`;
}

declare module "express-session" {
  interface SessionData {
    tokens?: any;
    userEmail?: string;
    userName?: string;
    userPicture?: string;
    isPro?: boolean;
    isDemo?: boolean;
  }
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  app.use(
    session({
      store: new MemStore({ checkPeriod: 86400000 }),
      secret: process.env.SESSION_SECRET || "fixmail-secret",
      resave: false,
      saveUninitialized: false,
      cookie: { secure: false, maxAge: 7 * 24 * 60 * 60 * 1000 },
    })
  );

  // ── DEMO AUTO-LOGIN ─────────────────────────────────────────────────────────
  // Auto-authenticate as demo user when no Google credentials are configured

  app.use((req, res, next) => {
    if (isDemo() && !req.session.userEmail && req.path.startsWith("/api/") && req.path !== "/api/auth/status" && req.path !== "/api/auth/url") {
      req.session.userEmail = DEMO_EMAIL;
      req.session.userName = DEMO_NAME;
      req.session.userPicture = "";
      req.session.isDemo = true;
      req.session.isPro = false;
    }
    next();
  });

  // ── AUTH ────────────────────────────────────────────────────────────────────

  app.get("/api/auth/url", (req: Request, res: Response) => {
    if (isDemo()) {
      return res.json({ demo: true, message: "Demo mode active" });
    }
    const oauth2Client = getOAuth2Client(getRedirectUri(req));
    const url = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: GMAIL_SCOPES,
      prompt: "consent",
    });
    res.json({ url });
  });

  app.get("/api/auth/callback", async (req: Request, res: Response) => {
    try {
      const { code } = req.query;
      if (!code) return res.redirect("/?error=no_code");
      const oauth2Client = getOAuth2Client(getRedirectUri(req));
      const { tokens } = await oauth2Client.getToken(code as string);
      oauth2Client.setCredentials(tokens);

      const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
      const { data: profile } = await oauth2.userinfo.get();

      req.session.tokens = tokens;
      req.session.userEmail = profile.email || "";
      req.session.userName = profile.name || profile.email || "";
      req.session.userPicture = profile.picture || "";
      req.session.isDemo = false;
      req.session.isPro = false;

      res.redirect("/?auth=success");
    } catch (err: any) {
      console.error("Auth callback error:", err);
      res.redirect("/?error=auth_failed");
    }
  });

  app.get("/api/auth/status", (req: Request, res: Response) => {
    if (isDemo()) {
      return res.json({
        authenticated: true,
        userEmail: DEMO_EMAIL,
        userName: DEMO_NAME,
        userPicture: "",
        isPro: req.session.isPro || false,
        isDemo: true,
      });
    }
    if (!req.session.tokens) {
      return res.json({ authenticated: false, hasCredentials: true });
    }
    res.json({
      authenticated: true,
      userEmail: req.session.userEmail,
      userName: req.session.userName,
      userPicture: req.session.userPicture,
      isPro: req.session.isPro || false,
      isDemo: false,
    });
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy(() => {
      res.json({ success: true });
    });
  });

  app.post("/api/auth/promo", (req: Request, res: Response) => {
    const { code } = req.body;
    if (code === PRO_CODE) {
      req.session.isPro = true;
      return res.json({ success: true, message: "Pro unlocked!" });
    }
    res.status(400).json({ success: false, message: "Invalid code" });
  });

  // ── FREEMIUM ────────────────────────────────────────────────────────────────

  app.get("/api/freemium/usage", async (req: Request, res: Response) => {
    const userEmail = req.session.userEmail || (isDemo() ? DEMO_EMAIL : null);
    if (!userEmail) return res.status(401).json({ error: "Not authenticated" });
    try {
      const monthYear = getCurrentMonthYear();
      const usage = await storage.getFreemiumUsage(userEmail, monthYear);
      res.json({
        used: usage?.actionCount || 0,
        limit: FREEMIUM_LIMIT,
        remaining: Math.max(0, FREEMIUM_LIMIT - (usage?.actionCount || 0)),
        isPro: req.session.isPro || false,
      });
    } catch (err) {
      res.status(500).json({ error: "Failed to get usage" });
    }
  });

  // ── ACTION LOGS ─────────────────────────────────────────────────────────────

  app.get("/api/logs", async (req: Request, res: Response) => {
    const userEmail = req.session.userEmail || (isDemo() ? DEMO_EMAIL : null);
    if (!userEmail) return res.status(401).json({ error: "Not authenticated" });
    try {
      const logs = await storage.getActionLogs(userEmail);
      res.json(logs);
    } catch (err) {
      res.status(500).json({ error: "Failed to get logs" });
    }
  });

  // ── HELPERS ──────────────────────────────────────────────────────────────────

  function getAuthenticatedClient(req: Request) {
    if (!req.session.tokens) throw new Error("Not authenticated");
    const oauth2Client = getOAuth2Client(getRedirectUri(req));
    oauth2Client.setCredentials(req.session.tokens);
    return { oauth2Client, gmail: google.gmail({ version: "v1", auth: oauth2Client }) };
  }

  function getUserEmail(req: Request): string {
    return req.session.userEmail || (isDemo() ? DEMO_EMAIL : "");
  }

  async function checkAndIncrementAction(req: Request): Promise<{ allowed: boolean; message?: string }> {
    if (req.session.isPro) return { allowed: true };
    const userEmail = getUserEmail(req);
    const monthYear = getCurrentMonthYear();
    const usage = await storage.getFreemiumUsage(userEmail, monthYear);
    const current = usage?.actionCount || 0;
    if (current >= FREEMIUM_LIMIT) {
      return {
        allowed: false,
        message: `Has alcanzado el límite gratis. Usa código FIXPRO para desbloquear Pro ilimitado este mes`,
      };
    }
    await storage.incrementFreemiumUsage(userEmail, monthYear);
    return { allowed: true };
  }

  async function logAction(req: Request, actionType: string, description: string) {
    const userEmail = getUserEmail(req);
    if (!userEmail) return;
    await storage.addActionLog({ userEmail, actionType, description });
  }

  // ── EMAIL STATS ─────────────────────────────────────────────────────────────

  app.get("/api/emails/stats", async (req: Request, res: Response) => {
    try {
      if (isDemo()) {
        return res.json(getMockStats());
      }
      const { gmail } = getAuthenticatedClient(req);
      const categories = [
        { label: "Primary", query: "category:primary" },
        { label: "Promotions", query: "category:promotions" },
        { label: "Social", query: "category:social" },
        { label: "Updates", query: "category:updates" },
        { label: "Forums", query: "category:forums" },
      ];
      const counts = await Promise.all(
        categories.map(async (cat) => {
          const r = await gmail.users.messages.list({ userId: "me", q: cat.query, maxResults: 1 });
          return { label: cat.label, count: r.data.resultSizeEstimate || 0 };
        })
      );
      const profileRes = await gmail.users.getProfile({ userId: "me" });
      const profile = profileRes.data;
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayQuery = `category:promotions after:${Math.floor(todayStart.getTime() / 1000)}`;
      const todayRes = await gmail.users.messages.list({ userId: "me", q: todayQuery, maxResults: 1 });
      res.json({
        categories: counts,
        totalMessages: profile.messagesTotal || 0,
        storageUsed: profile.historyId || 0,
        promotionsToday: todayRes.data.resultSizeEstimate || 0,
      });
    } catch (err: any) {
      console.error("Stats error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // ── EMAIL SEARCH ─────────────────────────────────────────────────────────────

  app.get("/api/emails/search", async (req: Request, res: Response) => {
    try {
      const { q = "", after, before, maxResults = "30" } = req.query as Record<string, string>;

      if (isDemo()) {
        const results = searchMockEmails({ q, after, before });
        return res.json(results.slice(0, parseInt(maxResults)));
      }

      const { gmail } = getAuthenticatedClient(req);
      let query = q;
      if (after) query += ` after:${after}`;
      if (before) query += ` before:${before}`;

      const listRes = await gmail.users.messages.list({
        userId: "me",
        q: query.trim() || "in:inbox",
        maxResults: Math.min(parseInt(maxResults), 50),
      });

      const messageIds = listRes.data.messages || [];
      if (messageIds.length === 0) return res.json([]);

      const messages = await Promise.all(
        messageIds.slice(0, 30).map(async (msg) => {
          const detail = await gmail.users.messages.get({
            userId: "me",
            id: msg.id!,
            format: "metadata",
            metadataHeaders: ["From", "Subject", "Date"],
          });
          const headers = detail.data.payload?.headers || [];
          const get = (name: string) => headers.find((h) => h.name === name)?.value || "";
          return {
            id: msg.id,
            from: get("From"),
            subject: get("Subject"),
            date: get("Date"),
            snippet: detail.data.snippet || "",
            sizeEstimate: detail.data.sizeEstimate || 0,
            labelIds: detail.data.labelIds || [],
          };
        })
      );

      res.json(messages);
    } catch (err: any) {
      console.error("Search error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // ── AI ANALYSIS ─────────────────────────────────────────────────────────────

  app.post("/api/emails/analyze", async (req: Request, res: Response) => {
    try {
      const check = await checkAndIncrementAction(req);
      if (!check.allowed) return res.status(429).json({ error: check.message });

      let messages: any[] = [];

      if (isDemo()) {
        messages = getMockEmails().slice(0, 30).map((e) => ({
          id: e.id,
          from: e.from,
          subject: e.subject,
          date: e.date,
          snippet: e.snippet,
        }));
      } else {
        const { gmail } = getAuthenticatedClient(req);
        const listRes = await gmail.users.messages.list({ userId: "me", q: "in:inbox", maxResults: 50 });
        const messageIds = listRes.data.messages || [];
        messages = await Promise.all(
          messageIds.slice(0, 30).map(async (msg) => {
            const detail = await gmail.users.messages.get({
              userId: "me", id: msg.id!, format: "metadata",
              metadataHeaders: ["From", "Subject", "Date"],
            });
            const headers = detail.data.payload?.headers || [];
            const get = (name: string) => headers.find((h) => h.name === name)?.value || "";
            return { id: msg.id, from: get("From"), subject: get("Subject"), date: get("Date"), snippet: detail.data.snippet || "" };
          })
        );
      }

      const openai = new OpenAI({
        apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
        baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
      });

      const emailSummary = messages
        .map((m, i) => `${i + 1}. De: ${m.from} | Asunto: ${m.subject} | Fecha: ${new Date(m.date).toLocaleDateString("es-ES")} | Preview: ${(m.snippet || "").substring(0, 80)}`)
        .join("\n");

      const completion = await openai.chat.completions.create({
        model: "gpt-5-mini",
        messages: [
          {
            role: "system",
            content: `Eres un experto limpiador de Gmail. Analiza estos correos resumidos y clasifícalos en: 
   - IMPORTANTE: no borrar nunca
   - SUSCRIPCION_ACTIVA: vale la pena mantener
   - NEWSLETTER_INACTIVA: no se abre desde hace meses
   - PROMOCION_UTIL: ofertas interesantes
   - PROMOCION_SPAM: borrar sin dudar
   Para cada correo da: categoría + razón corta (máx 15 palabras) + score_borrar (0-10)
   
   Responde SOLO con JSON: {"results": [{"index": 1, "categoria": "...", "razon": "...", "score_borrar": 5}]}`,
          },
          { role: "user", content: emailSummary },
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 4000,
      });

      const content = completion.choices[0]?.message?.content || "{}";
      let parsed: any = {};
      try { parsed = JSON.parse(content); } catch {}
      const rawResults = parsed.results || parsed.emails || (Array.isArray(parsed) ? parsed : []);

      const enriched = rawResults
        .map((r: any) => {
          const email = messages[r.index - 1];
          if (!email) return null;
          return { ...email, categoria: r.categoria, razon: r.razon, score_borrar: r.score_borrar };
        })
        .filter(Boolean);

      await logAction(req, "ai_analysis", `Análisis IA de ${enriched.length} correos el ${new Date().toLocaleDateString("es-ES")}`);

      res.json(enriched);
    } catch (err: any) {
      console.error("AI analysis error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // ── BULK DELETE ──────────────────────────────────────────────────────────────

  app.post("/api/emails/delete-bulk", async (req: Request, res: Response) => {
    try {
      const check = await checkAndIncrementAction(req);
      if (!check.allowed) return res.status(429).json({ error: check.message });

      const { ids } = req.body as { ids: string[] };
      if (!ids || ids.length === 0) return res.status(400).json({ error: "No IDs provided" });

      if (isDemo()) {
        const deleted = deleteMockEmails(ids);
        await logAction(req, "bulk_delete", `[Demo] Eliminados ${deleted} correos el ${new Date().toLocaleDateString("es-ES")}`);
        return res.json({ success: true, deleted });
      }

      const { gmail } = getAuthenticatedClient(req);
      await gmail.users.messages.batchDelete({ userId: "me", requestBody: { ids } });
      await logAction(req, "bulk_delete", `Eliminados ${ids.length} correos el ${new Date().toLocaleDateString("es-ES")}`);
      res.json({ success: true, deleted: ids.length });
    } catch (err: any) {
      console.error("Bulk delete error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // ── DELETE PROMOTIONS TODAY ───────────────────────────────────────────────────

  app.post("/api/emails/delete-promotions-today", async (req: Request, res: Response) => {
    try {
      const check = await checkAndIncrementAction(req);
      if (!check.allowed) return res.status(429).json({ error: check.message });

      if (isDemo()) {
        const deleted = deleteMockPromotionsToday();
        await logAction(req, "delete_promotions", `[Demo] Borradas ${deleted} Promotions el ${new Date().toLocaleDateString("es-ES")}`);
        return res.json({ success: true, deleted });
      }

      const { gmail } = getAuthenticatedClient(req);
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const afterTs = Math.floor(todayStart.getTime() / 1000);
      const listRes = await gmail.users.messages.list({ userId: "me", q: `category:promotions after:${afterTs}`, maxResults: 500 });
      const ids = (listRes.data.messages || []).map((m) => m.id!).filter(Boolean);
      if (ids.length === 0) return res.json({ success: true, deleted: 0 });
      for (let i = 0; i < ids.length; i += 1000) {
        await gmail.users.messages.batchDelete({ userId: "me", requestBody: { ids: ids.slice(i, i + 1000) } });
      }
      await logAction(req, "delete_promotions", `Borradas ${ids.length} Promotions el ${new Date().toLocaleDateString("es-ES")}`);
      res.json({ success: true, deleted: ids.length });
    } catch (err: any) {
      console.error("Delete promotions error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // ── DELETE BY SENDER ─────────────────────────────────────────────────────────

  app.post("/api/emails/delete-by-sender", async (req: Request, res: Response) => {
    try {
      const check = await checkAndIncrementAction(req);
      if (!check.allowed) return res.status(429).json({ error: check.message });

      const { sender } = req.body as { sender: string };
      if (!sender) return res.status(400).json({ error: "Sender required" });

      if (isDemo()) {
        const deleted = deleteMockBySender(sender);
        await logAction(req, "delete_by_sender", `[Demo] Borrados ${deleted} correos de ${sender} el ${new Date().toLocaleDateString("es-ES")}`);
        return res.json({ success: true, deleted });
      }

      const { gmail } = getAuthenticatedClient(req);
      const listRes = await gmail.users.messages.list({ userId: "me", q: `from:${sender}`, maxResults: 500 });
      const ids = (listRes.data.messages || []).map((m) => m.id!).filter(Boolean);
      if (ids.length === 0) return res.json({ success: true, deleted: 0 });
      for (let i = 0; i < ids.length; i += 1000) {
        await gmail.users.messages.batchDelete({ userId: "me", requestBody: { ids: ids.slice(i, i + 1000) } });
      }
      await logAction(req, "delete_by_sender", `Borrados ${ids.length} correos de ${sender} el ${new Date().toLocaleDateString("es-ES")}`);
      res.json({ success: true, deleted: ids.length });
    } catch (err: any) {
      console.error("Delete by sender error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // ── EMPTY TRASH ───────────────────────────────────────────────────────────────

  app.post("/api/emails/empty-trash", async (req: Request, res: Response) => {
    try {
      const check = await checkAndIncrementAction(req);
      if (!check.allowed) return res.status(429).json({ error: check.message });

      if (isDemo()) {
        await logAction(req, "empty_trash", `[Demo] Papelera vaciada el ${new Date().toLocaleDateString("es-ES")}`);
        return res.json({ success: true, deleted: 0 });
      }

      const { gmail } = getAuthenticatedClient(req);
      const listRes = await gmail.users.messages.list({ userId: "me", q: "in:trash", maxResults: 500 });
      const ids = (listRes.data.messages || []).map((m) => m.id!).filter(Boolean);
      if (ids.length > 0) {
        for (let i = 0; i < ids.length; i += 1000) {
          await gmail.users.messages.batchDelete({ userId: "me", requestBody: { ids: ids.slice(i, i + 1000) } });
        }
      }
      await logAction(req, "empty_trash", `Papelera vaciada (${ids.length} correos) el ${new Date().toLocaleDateString("es-ES")}`);
      res.json({ success: true, deleted: ids.length });
    } catch (err: any) {
      console.error("Empty trash error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  return httpServer;
}
