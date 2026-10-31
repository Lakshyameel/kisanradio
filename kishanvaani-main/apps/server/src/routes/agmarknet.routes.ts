import { Router } from "express";
import AgmarknetService from "../services/agmarknet.service.js";

const router = Router();

// GET /api/v1/agmarknet/prices
router.get("/prices", async (req, res) => {
  try {
    const { state, district, commodity, market, search, limit = "50", offset = "0" } = req.query;

    const result = await AgmarknetService.getPrices({
      state: state ? String(state) : undefined,
      district: district ? String(district) : undefined,
      commodity: commodity ? String(commodity) : undefined,
      market: market ? String(market) : undefined,
      search: search ? String(search) : undefined,
      limit: Number(limit) || 50,
      offset: Number(offset) || 0,
    });

    res.json(result);
  } catch (error) {
    console.error("AGMARKNET prices error:", error);
    res.status(500).json({ error: "Failed to fetch AGMARKNET prices" });
  }
});

// GET /api/v1/agmarknet/commodities
router.get("/commodities", async (_req, res) => {
  try {
    const commodities = await AgmarknetService.getCommodities();
    res.json({ commodities, count: commodities.length });
  } catch (error) {
    console.error("AGMARKNET commodities error:", error);
    res.status(500).json({ error: "Failed to fetch AGMARKNET commodities" });
  }
});

// GET /api/v1/agmarknet/states
router.get("/states", async (_req, res) => {
  try {
    const data = await AgmarknetService.getStatesAndDistricts();
    res.json(data);
  } catch (error) {
    console.error("AGMARKNET states error:", error);
    res.status(500).json({ error: "Failed to fetch AGMARKNET states" });
  }
});

// GET /api/v1/agmarknet/summary
router.get("/summary", async (_req, res) => {
  try {
    const summary = await AgmarknetService.getSummary();
    res.json(summary);
  } catch (error) {
    console.error("AGMARKNET summary error:", error);
    res.status(500).json({ error: "Failed to fetch AGMARKNET market summary" });
  }
});

// POST /api/v1/agmarknet/sync
router.post("/sync", async (_req, res) => {
  try {
    await AgmarknetService.syncBenchmarkToDatabase();
    res.json({ success: true, message: "AGMARKNET market benchmark data synchronized successfully" });
  } catch (error) {
    console.error("AGMARKNET sync error:", error);
    res.status(500).json({ error: "Failed to sync AGMARKNET data" });
  }
});

export default router;
