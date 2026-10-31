import { Router, Request, Response } from "express";
import AgriNewsService from "../services/agri-news.service.js";
import newsIngestService from "../services/news-ingest.service.js";
import { requireAuth, requireRole, AuthRequest } from "../middleware/auth.middleware.js";

const router = Router();

// POST /refresh (Admin only)
// Force refresh PIB Agriculture news ingestion
router.post("/refresh", requireAuth, requireRole(["ADMIN"]), async (_req: AuthRequest, res: Response) => {
  try {
    const results = await newsIngestService.ingestFromAllSources();
    res.json({
      success: true,
      message: "PIB Agriculture news feed refreshed successfully",
      timestamp: new Date().toISOString(),
      results,
    });
  } catch (error: any) {
    console.error("News refresh error:", error);
    res.status(500).json({ error: "Failed to refresh agriculture news" });
  }
});

// GET /api/v1/agriculture-news
// Unified Agriculture News Feed (MoA&FW, ICAR-KVK, PIB)
router.get("/", async (req: Request, res: Response) => {
  try {
    const { source, category, state, search, dateFilter, limit = "20", page = "1" } = req.query;

    const data = await AgriNewsService.getNewsList({
      source: source ? String(source) : undefined,
      category: category ? String(category) : undefined,
      state: state ? String(state) : undefined,
      search: search ? String(search) : undefined,
      dateFilter: dateFilter ? String(dateFilter) : undefined,
      limit: Number(limit) || 20,
      page: Number(page) || 1,
    });

    res.json(data);
  } catch (error) {
    console.error("Agriculture news fetch error:", error);
    res.status(500).json({ error: "Failed to fetch agriculture news" });
  }
});

// GET /api/v1/agriculture-news/ministry
// Official Press Releases and Circulars from Ministry of Agriculture & Farmers Welfare
router.get("/ministry", async (req: Request, res: Response) => {
  try {
    const { category, search, limit = "20" } = req.query;

    const data = await AgriNewsService.getMinistryNews({
      category: category ? String(category) : undefined,
      search: search ? String(search) : undefined,
      limit: Number(limit) || 20,
    });

    res.json(data);
  } catch (error) {
    console.error("Ministry news fetch error:", error);
    res.status(500).json({ error: "Failed to fetch Ministry of Agriculture news" });
  }
});

// GET /api/v1/agriculture-news/kvk
// Official Scientific Bulletins from Krishi Vigyan Kendras (KVKs under ICAR)
router.get("/kvk", async (req: Request, res: Response) => {
  try {
    const { state, category, search, limit = "20" } = req.query;

    const data = await AgriNewsService.getKvkNews({
      state: state ? String(state) : undefined,
      category: category ? String(category) : undefined,
      search: search ? String(search) : undefined,
      limit: Number(limit) || 20,
    });

    res.json(data);
  } catch (error) {
    console.error("KVK news fetch error:", error);
    res.status(500).json({ error: "Failed to fetch Krishi Vigyan Kendra advisories" });
  }
});

// GET /api/v1/agriculture-news/kvk/directory
// Directory of 731+ KVKs across all Indian States & Districts
router.get("/kvk/directory", async (req: Request, res: Response) => {
  try {
    const { state, district, search } = req.query;

    const data = AgriNewsService.getKvkDirectory({
      state: state ? String(state) : undefined,
      district: district ? String(district) : undefined,
      search: search ? String(search) : undefined,
    });

    res.json(data);
  } catch (error) {
    console.error("KVK directory fetch error:", error);
    res.status(500).json({ error: "Failed to fetch KVK directory" });
  }
});

// GET /api/v1/agriculture-news/trending
// Urgent alerts, pest warnings, and deadline announcements
router.get("/trending", async (_req: Request, res: Response) => {
  try {
    const data = await AgriNewsService.getTrendingNews();
    res.json({ items: data, count: data.length });
  } catch (error) {
    console.error("Trending news fetch error:", error);
    res.status(500).json({ error: "Failed to fetch trending agriculture alerts" });
  }
});

// GET /api/v1/agriculture-news/stats
// National information stats
router.get("/stats", async (_req: Request, res: Response) => {
  try {
    const data = await AgriNewsService.getStats();
    res.json(data);
  } catch (error) {
    console.error("News stats fetch error:", error);
    res.status(500).json({ error: "Failed to fetch news statistics" });
  }
});

// GET /api/v1/agriculture-news/:id
// Detailed article view with full text, actionable checklist and audio briefing
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const item = await AgriNewsService.getNewsById(String(id));

    if (!item) {
      res.status(404).json({ error: "News bulletin not found" });
      return;
    }

    res.json(item);
  } catch (error) {
    console.error("News article fetch error:", error);
    res.status(500).json({ error: "Failed to fetch news bulletin details" });
  }
});

export default router;
