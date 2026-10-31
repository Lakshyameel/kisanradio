import { Router } from "express";
import EnamService from "../services/enam.service.js";

const router = Router();

// GET /api/v1/enam/trade-data
router.get("/trade-data", async (req, res) => {
  try {
    const { state, apmc, commodity, tradeStatus, search, limit = "50", offset = "0" } = req.query;

    const result = await EnamService.getTradeData({
      state: state ? String(state) : undefined,
      apmc: apmc ? String(apmc) : undefined,
      commodity: commodity ? String(commodity) : undefined,
      tradeStatus: tradeStatus ? String(tradeStatus) : undefined,
      search: search ? String(search) : undefined,
      limit: Number(limit) || 50,
      offset: Number(offset) || 0,
    });

    res.json(result);
  } catch (error) {
    console.error("e-NAM trade data error:", error);
    res.status(500).json({ error: "Failed to fetch e-NAM trade data" });
  }
});

// GET /api/v1/enam/commodities
router.get("/commodities", async (_req, res) => {
  try {
    const commodities = await EnamService.getCommodities();
    res.json({ commodities, count: commodities.length });
  } catch (error) {
    console.error("e-NAM commodities error:", error);
    res.status(500).json({ error: "Failed to fetch e-NAM commodities" });
  }
});

// GET /api/v1/enam/mandis
router.get("/mandis", async (_req, res) => {
  try {
    const mandis = await EnamService.getMandis();
    res.json({ mandis, count: mandis.length });
  } catch (error) {
    console.error("e-NAM mandis error:", error);
    res.status(500).json({ error: "Failed to fetch e-NAM mandis" });
  }
});

// GET /api/v1/enam/stats
router.get("/stats", async (_req, res) => {
  try {
    const stats = await EnamService.getNationalStats();
    res.json(stats);
  } catch (error) {
    console.error("e-NAM stats error:", error);
    res.status(500).json({ error: "Failed to fetch e-NAM national stats" });
  }
});

// GET /api/v1/enam/dashboard
router.get("/dashboard", async (_req, res) => {
  try {
    const [stats, tradeData] = await Promise.all([
      EnamService.getNationalStats(),
      EnamService.getTradeData({ limit: 10 }),
    ]);

    res.json({
      stats,
      latestTrades: tradeData.trades,
      portal: "https://enam.gov.in",
    });
  } catch (error) {
    console.error("e-NAM dashboard error:", error);
    res.status(500).json({ error: "Failed to fetch e-NAM dashboard" });
  }
});

export default router;
