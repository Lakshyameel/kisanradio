import { Router } from "express";
import LiveMandiService from "../services/live-mandi.service.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";

const router = Router();

// GET /api/v1/live-mandi/prices
router.get("/prices", async (req, res) => {
  try {
    const { state, district, commodity, search, limit = "100", offset = "0" } = req.query;

    const result = await LiveMandiService.getLiveMandiPrices({
      state: state ? String(state) : undefined,
      district: district ? String(district) : undefined,
      commodity: commodity ? String(commodity) : undefined,
      search: search ? String(search) : undefined,
      limit: Number(limit) || 100,
      offset: Number(offset) || 0,
    });

    res.json(result);
  } catch (error) {
    console.error("Live mandi prices error:", error);
    res.status(500).json({ error: "Failed to fetch live mandi prices" });
  }
});

// GET /api/v1/live-mandi/states
router.get("/states", async (_req, res) => {
  try {
    const result = await LiveMandiService.getStateWiseSummary();
    res.json(result);
  } catch (error) {
    console.error("Live mandi states error:", error);
    res.status(500).json({ error: "Failed to fetch state-wise live mandi summary" });
  }
});

// GET /api/v1/live-mandi/stats
router.get("/stats", async (_req, res) => {
  try {
    const result = await LiveMandiService.getLiveStats();
    res.json(result);
  } catch (error) {
    console.error("Live mandi stats error:", error);
    res.status(500).json({ error: "Failed to fetch live mandi stats" });
  }
});

// GET /api/v1/live-mandi/commodity/:commodity
router.get("/commodity/:commodity", async (req, res) => {
  try {
    const { commodity } = req.params;
    const result = await LiveMandiService.getCommodityPriceMap(commodity);
    res.json(result);
  } catch (error) {
    console.error("Live mandi commodity error:", error);
    res.status(500).json({ error: "Failed to fetch live commodity price map" });
  }
});

// POST /api/v1/live-mandi/refresh (Admin only)
router.post("/refresh", requireAuth, requireRole(["ADMIN"]), async (_req, res) => {
  try {
    const result = await LiveMandiService.refreshCache();
    res.json(result);
  } catch (error) {
    console.error("Live mandi refresh error:", error);
    res.status(500).json({ error: "Failed to refresh live mandi cache" });
  }
});

export default router;
