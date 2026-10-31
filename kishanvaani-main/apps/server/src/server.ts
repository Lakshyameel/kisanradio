import "dotenv/config";

// Fatal crash on startup if JWT_SECRET is unset
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.trim() === "") {
  console.error("FATAL: JWT_SECRET environment variable is unset. Server startup halted.");
  process.exit(1);
}

import express from "express";
import cors from "cors";
import helmet from "helmet";

import authRoutes from "./routes/auth.routes.js";
import contentRoutes from "./routes/content.routes.js";
import weatherRoutes from "./routes/weather.routes.js";
import mandiRoutes from "./routes/mandi.routes.js";
import bookmarksRoutes from "./routes/bookmarks.routes.js";
import historyRoutes from "./routes/history.routes.js";
import communityRoutes from "./routes/community.routes.js";
import expertRoutes from "./routes/expert.routes.js";
import searchRoutes from "./routes/search.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import agmarknetRoutes from "./routes/agmarknet.routes.js";
import enamRoutes from "./routes/enam.routes.js";
import liveMandiRoutes from "./routes/live-mandi.routes.js";
import imdRoutes from "./routes/imd.routes.js";
import agriNewsRoutes from "./routes/agri-news.routes.js";
import cropCalendarRoutes from "./routes/crop-calendar.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import ivrRoutes from "./routes/ivr.routes.js";
import whatsappBotRoutes from "./routes/whatsapp-bot.routes.js";
import seoRoutes from "./routes/seo.routes.js";
import { getMetaForRoute, injectMetaIntoHtml } from "./services/seo.service.js";
import LiveMandiService from "./services/live-mandi.service.js";
import AgriNewsService from "./services/agri-news.service.js";
import newsIngestService from "./services/news-ingest.service.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import prisma from "./prisma.js";
import { getDataGovKey, hasDataGovKey } from "./config/env.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webPublicAudio = path.resolve(__dirname, "../../web/public/audio");
const webDistPath = path.resolve(__dirname, "../../web/dist");
const webIndexHtmlPath = path.join(webDistPath, "index.html");

import { authLimiter, generalLimiter, searchLimiter } from "./middleware/rate-limit.middleware.js";

const app = express();
app.set("trust proxy", 1);
const port = Number(process.env.PORT ?? 4000);

app.use(helmet({ crossOriginResourcePolicy: false }));

// Strict CORS configuration tied to FRONTEND_URL
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
const allowedOrigins = Array.from(
  new Set([
    frontendUrl,
    ...(process.env.NODE_ENV !== "production"
      ? [
          "http://localhost:5173",
          "http://localhost:5174",
          "http://localhost:5175",
          "http://127.0.0.1:5173",
          "http://127.0.0.1:5174",
          "http://127.0.0.1:5175",
        ]
      : []),
  ])
);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, server-to-server) or matching allowed origins
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
  })
);

// Static audio and uploads serving with strict anti-sniff and CSP headers (served before rate limiting)
app.use(
  "/audio",
  express.static(webPublicAudio, {
    setHeaders: (res) => {
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("Content-Security-Policy", "default-src 'none'");
    },
  })
);

// Apply looser general rate limiter across all endpoints
app.use(generalLimiter);

// Apply strict rate limiter on authentication endpoints
// Larger payload limit for audio upload to accommodate base64 encoding overhead
app.use("/api/v1/content/upload-file", express.json({ limit: "8mb" }));
app.use(express.json({ limit: "1mb" }));

// Root health check with Prisma SQLite diagnostics
app.get("/api/v1/health", async (_req, res) => {
  let dbStatus = "connected";
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    dbStatus = "disconnected";
  }

  res.json({
    status: dbStatus === "connected" ? "ok" : "degraded",
    service: "kishanvaani-api",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    database: {
      provider: "sqlite",
      status: dbStatus,
    },
  });
});

// Dedicated Database Health Endpoint
app.get("/api/v1/health/db", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      database: "sqlite",
      provider: "prisma",
      status: "connected",
    });
  } catch (error: any) {
    res.status(503).json({
      database: "sqlite",
      provider: "prisma",
      status: "disconnected",
      error: error?.message || "Database unreachable",
    });
  }
});

// Upstream APIs Health & Data Freshness Diagnostics
app.get("/api/v1/health/upstream", async (_req, res) => {
  const timeoutMs = 3500;
  const probeFetch = async (url: string, headers: Record<string, string> = {}) => {
    const start = Date.now();
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), timeoutMs);
      const resp = await fetch(url, { headers, signal: ctrl.signal });
      clearTimeout(timer);
      const latency = Date.now() - start;
      return { status: resp.ok ? "healthy" : "degraded", httpStatus: resp.status, latencyMs: latency };
    } catch (err: any) {
      return { status: "failing", error: err?.name === "AbortError" ? "timeout (3.5s)" : err?.message || "unreachable", latencyMs: Date.now() - start };
    }
  };

  // 1. Database
  const dbStart = Date.now();
  let dbProbe: any = { status: "healthy", latencyMs: 0 };
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbProbe.latencyMs = Date.now() - dbStart;
  } catch (err: any) {
    dbProbe = { status: "failing", error: err?.message, latencyMs: Date.now() - dbStart };
  }

  // 2. Weather: Open-Meteo
  const weatherProbePromise = probeFetch("https://api.open-meteo.com/v1/forecast?latitude=28.61&longitude=77.20&current=temperature_2m");

  // 3. Geocoding: OpenStreetMap Nominatim
  const nominatimProbePromise = probeFetch("https://nominatim.openstreetmap.org/search?format=json&q=Delhi&limit=1", {
    "User-Agent": "KishanVaani-AgriApp/1.0 (agri-health-check)",
  });

  // 4. Mandi: data.gov.in
  const mandiKey = getDataGovKey();
  const mandiProbePromise = mandiKey
    ? probeFetch(`https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=${mandiKey}&format=json&limit=1`)
    : Promise.resolve({
        status: "unconfigured",
        message: "DATA_GOV_IN_API_KEY is not set. Serving benchmark fallback data.",
        latencyMs: 0,
      });

  // 5. News: PIB MoA&FW RSS
  const newsRssProbePromise = probeFetch("https://pib.gov.in/RssMain.aspx?ModId=6&Lang=1");

  const [weatherProbe, nominatimProbe, mandiProbe, newsProbe] = await Promise.all([
    weatherProbePromise,
    nominatimProbePromise,
    mandiProbePromise,
    newsRssProbePromise,
  ]);

  const mandiStats = await LiveMandiService.getLiveStats().catch(() => null);
  const newsStats = await AgriNewsService.getStats().catch(() => null);

  const isDegraded = [weatherProbe, nominatimProbe, newsProbe].some((p) => p.status === "failing");
  const overallStatus = dbProbe.status === "failing" ? "failing" : isDegraded ? "degraded" : "healthy";

  res.status(overallStatus === "failing" ? 503 : 200).json({
    status: overallStatus,
    timestamp: new Date().toISOString(),
    upstreams: {
      database: dbProbe,
      openMeteoWeather: weatherProbe,
      nominatimGeocode: nominatimProbe,
      dataGovInMandi: mandiProbe,
      pibNewsRss: newsProbe,
    },
    dataFreshness: {
      mandi: {
        dataSource: mandiStats?.dataSource || "BENCHMARK_FALLBACK",
        lastRefreshed: mandiStats?.lastRefreshed || null,
        totalRecords: mandiStats?.totalRecords || 0,
      },
      news: {
        totalBulletins: newsStats?.totalNewsBulletins || 0,
        ministryCount: newsStats?.ministryBulletins || 0,
        kvkCount: newsStats?.kvkAdvisories || 0,
      },
    },
  });
});

// Mount modular sub-routers
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/content", contentRoutes);
app.use("/api/v1/weather", weatherRoutes);
app.use("/api/v1/imd", imdRoutes);
app.use("/api/v1/mandi", mandiRoutes);
app.use("/api/v1/agmarknet", agmarknetRoutes);
app.use("/api/v1/enam", enamRoutes);
app.use("/api/v1/live-mandi", liveMandiRoutes);
app.use("/api/v1/agriculture-news", agriNewsRoutes);
app.use("/api/v1/agri-news", agriNewsRoutes);
app.use("/api/v1/bookmarks", bookmarksRoutes);
app.use("/api/v1/history", historyRoutes);
app.use("/api/v1/community", communityRoutes);
app.use("/api/v1/expert", expertRoutes);
app.use("/api/v1/search", searchLimiter, searchRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/crop-calendar", cropCalendarRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/ivr", ivrRoutes);
app.use("/api/v1/whatsapp", whatsappBotRoutes);

// Mount SEO Routes (sitemap.xml, robots.txt, /api/v1/seo/meta, /share/:slug)
app.use(seoRoutes);

// Dynamic Open Graph & HTML Pre-renderer for Web App & Social Crawlers
if (fs.existsSync(webDistPath)) {
  // Serve static assets (js, css, images) with caching
  app.use(
    express.static(webDistPath, {
      index: false,
      maxAge: "1d",
    })
  );

  // Dynamic Open Graph HTML injection for public routes
  app.use(async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    // Only intercept GET requests that are not API calls and not static file assets
    if (req.method !== "GET" || req.path.startsWith("/api/") || req.path.includes(".")) {
      return next();
    }

    try {
      if (fs.existsSync(webIndexHtmlPath)) {
        const rawHtml = await fs.promises.readFile(webIndexHtmlPath, "utf-8");
        const meta = await getMetaForRoute(req.path);
        const dynamicHtml = injectMetaIntoHtml(rawHtml, meta);

        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.setHeader("Cache-Control", "public, max-age=300"); // 5 minutes cache
        res.send(dynamicHtml);
      } else {
        next();
      }
    } catch (e) {
      next(e);
    }
  });
}

// Global Error Handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err.type === "entity.too.large" || err.status === 413) {
    res.status(413).json({ error: "File size exceeds the 5 MB limit" });
    return;
  }
  console.error("Server Error:", err);
  res.status(500).json({ error: "Internal server error" });
});

if (process.env.NODE_ENV !== "test") {
  const server = app.listen(port, "0.0.0.0", () => {
    console.log(`🌾 KishanVaani API active on http://0.0.0.0:${port} (accessible on all network interfaces)`);
    if (hasDataGovKey()) {
      console.log("Data.gov.in key: configured");
    } else {
      console.log("Data.gov.in key: MISSING - mandi prices will not be live");
    }
  });

  // Non-blocking news ingest on server start, then every 15 minutes
  newsIngestService.ingestFromAllSources().catch((err) => {
    console.error("Startup news ingestion error:", err);
  });

  const newsIngestInterval = setInterval(() => {
    newsIngestService.ingestFromAllSources().catch((err) => {
      console.error("Scheduled news ingestion error:", err);
    });
  }, 15 * 60 * 1000);
  newsIngestInterval.unref();

  const shutdown = async () => {
    console.log("\n🛑 Shutting down KishanVaani API server...");
    clearInterval(newsIngestInterval);
    await prisma.$disconnect();
    server.close(() => {
      console.log("👋 HTTP server closed");
      process.exit(0);
    });
  };


  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

export default app;
