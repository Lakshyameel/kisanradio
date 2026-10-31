import { Router } from "express";
import prisma from "../prisma.js";
import LiveMandiService from "../services/live-mandi.service.js";
import EnamService from "../services/enam.service.js";
import { findNearbyBestMarkets, getMandiPriceTrends } from "../services/mandi-trends.service.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";

const router = Router();

// Get Mandi Prices with filtering (supports both AGMARKNET via LiveMandiService and e-NAM)
router.get("/", async (req, res) => {
  try {
    const { state, district, commodity, source, search, limit = "50" } = req.query;

    if (source === "ENAM") {
      const where: any = { source: "ENAM" };
      if (state && state !== "ALL") where.state = String(state);
      if (district && district !== "ALL") where.district = String(district);
      if (commodity && commodity !== "ALL") where.commodity = String(commodity);
      if (search && typeof search === "string" && search.trim() !== "") {
        const q = search.trim();
        where.OR = [
          { commodity: { contains: q } },
          { market: { contains: q } },
          { district: { contains: q } },
          { state: { contains: q } },
          { variety: { contains: q } },
        ];
      }

      let prices = await prisma.mandiPrice.findMany({
        where,
        orderBy: { modalPrice: "desc" },
        take: Math.min(Number(limit) || 50, 100),
      });

      if (prices.length === 0 && !state && !commodity && !search) {
        await EnamService.syncBenchmarkToDatabase();
        prices = await prisma.mandiPrice.findMany({
          where,
          orderBy: { modalPrice: "desc" },
          take: Math.min(Number(limit) || 50, 100),
        });
      }

      const mappedPrices = prices.map((item) => ({
        ...item,
        arrivals: item.arrivals != null ? item.arrivals : null,
        minPrice: item.minPrice != null ? item.minPrice : null,
        maxPrice: item.maxPrice != null ? item.maxPrice : null,
        modalPrice: item.modalPrice != null ? item.modalPrice : null,
        sourceLabel: `Live from e-NAM`,
        isSample: item.source === "SAMPLE" || item.tradeStatus === "BENCHMARK_SAMPLE",
      }));

      return res.json({
        prices: mappedPrices,
        count: mappedPrices.length,
      });
    }

    // Default & AGMARKNET: use LiveMandiService (the single central mandi service)
    const liveResult = await LiveMandiService.getLiveMandiPrices({
      state: state && state !== "ALL" ? String(state) : undefined,
      district: district && district !== "ALL" ? String(district) : undefined,
      commodity: commodity && commodity !== "ALL" ? String(commodity) : undefined,
      search: search ? String(search) : undefined,
      limit: Math.min(Number(limit) || 50, 100),
    });

    const mappedPrices = liveResult.records.map((item, idx) => ({
      id: `live-${item.state}-${item.market}-${item.commodity}-${idx}`,
      state: item.state,
      district: item.district,
      market: item.market,
      commodity: item.commodity,
      variety: item.variety,
      minPrice: item.minPrice,
      maxPrice: item.maxPrice,
      modalPrice: item.modalPrice,
      arrivals: null,
      source: item.isSample ? "SAMPLE" : "AGMARKNET",
      sourceLabel: item.sourceLabel || (item.isSample ? "Sample data" : "Live from Agmarknet"),
      isSample: item.isSample,
      trend: item.trend,
      priceDate: item.arrivalDate,
    }));

    return res.json({
      prices: mappedPrices,
      count: mappedPrices.length,
      stats: liveResult.stats,
    });
  } catch (error) {
    console.error("Mandi prices error:", error);
    res.status(500).json({ error: "Failed to fetch mandi prices" });
  }
});

// Compare AGMARKNET (Physical APMC) vs e-NAM (National Digital Auction)
router.get("/compare", async (req, res) => {
  try {
    const { commodity = "Wheat", state } = req.query;
    const comm = String(commodity);

    const enamWhere: any = {
      commodity: { contains: comm },
      source: "ENAM",
    };

    if (state && state !== "ALL") {
      enamWhere.state = String(state);
    }

    const [liveAgmarknet, enamItemsResult] = await Promise.all([
      LiveMandiService.getLiveMandiPrices({
        commodity: comm,
        state: state && state !== "ALL" ? String(state) : undefined,
        limit: 10,
      }),
      prisma.mandiPrice.findMany({ where: enamWhere, orderBy: { modalPrice: "desc" }, take: 10 }),
    ]);

    let enamItems = enamItemsResult;
    if (enamItems.length === 0) {
      await EnamService.syncBenchmarkToDatabase();
      enamItems = await prisma.mandiPrice.findMany({ where: enamWhere, orderBy: { modalPrice: "desc" }, take: 10 });
    }

    const agmarknetItems = liveAgmarknet.records.map((r, idx) => ({
      id: `agmarknet-${r.state}-${r.market}-${idx}`,
      state: r.state,
      district: r.district,
      market: r.market,
      commodity: r.commodity,
      variety: r.variety,
      minPrice: r.minPrice,
      maxPrice: r.maxPrice,
      modalPrice: r.modalPrice,
      arrivals: null,
      source: r.isSample ? "SAMPLE" : "AGMARKNET",
      sourceLabel: r.sourceLabel,
      isSample: r.isSample,
      trend: r.trend,
      priceDate: r.arrivalDate,
    }));

    const calcAvg = (items: Array<{ modalPrice: number | null }>) => {
      if (!items.length) return 0;
      const valid = items.filter((i) => i.modalPrice != null && i.modalPrice > 0);
      if (!valid.length) return 0;
      return Math.round(valid.reduce((acc, curr) => acc + (curr.modalPrice || 0), 0) / valid.length);
    };

    const agmarknetAvg = calcAvg(agmarknetItems);
    const enamAvg = calcAvg(enamItems);
    const spread = enamAvg - agmarknetAvg;
    const spreadPercentage = agmarknetAvg > 0 ? Number(((spread / agmarknetAvg) * 100).toFixed(2)) : 0;

    let recommendation = "";
    let betterPlatform: "ENAM" | "AGMARKNET" | "EQUAL" = "EQUAL";

    if (spread > 30) {
      betterPlatform = "ENAM";
      recommendation = `e-NAM electronic auctions are trading at a premium (+₹${spread.toLocaleString("en-IN")}/Qtl or ${spreadPercentage}%) over physical APMC mandi rates. Farmers are advised to create an e-NAM e-lot for maximum price realization.`;
    } else if (spread < -30) {
      betterPlatform = "AGMARKNET";
      recommendation = `Physical APMC spot mandis (AGMARKNET) are offering higher cash realization (+₹${Math.abs(spread).toLocaleString("en-IN")}/Qtl) than digital bidding today. Local mandi dispatch is recommended.`;
    } else {
      betterPlatform = "EQUAL";
      recommendation = "Physical APMC mandi rates and e-NAM digital auctions are in price parity. Check local transportation and weighment charges before choosing dispatch channel.";
    }

    res.json({
      commodity: comm,
      state: state || "All States",
      agmarknet: {
        averageModalPrice: agmarknetAvg,
        topMandis: agmarknetItems.slice(0, 5),
        sampleCount: agmarknetItems.length,
      },
      enam: {
        averageModalPrice: enamAvg,
        topAuctions: enamItems.slice(0, 5),
        sampleCount: enamItems.length,
      },
      comparison: {
        spreadRupees: spread,
        spreadPercentage,
        betterPlatform,
        recommendation,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Mandi compare error:", error);
    res.status(500).json({ error: "Failed to compare mandi prices" });
  }
});

// Get Mandi Metadata (Unique states, commodities, districts, sources)
router.get("/meta", async (_req, res) => {
  try {
    const [all, live] = await Promise.all([
      prisma.mandiPrice.findMany({
        select: { state: true, district: true, commodity: true, source: true },
      }),
      LiveMandiService.getLiveMandiPrices({ limit: 1000 }),
    ]);

    const liveStates = live.records.map((r) => r.state);
    const liveDistricts = live.records.map((r) => r.district);
    const liveCommodities = live.records.map((r) => r.commodity);

    const states = Array.from(new Set<string>([...all.map((item) => item.state), ...liveStates])).sort();
    const commodities = Array.from(new Set<string>([...all.map((item) => item.commodity), ...liveCommodities])).sort();
    const districts = Array.from(new Set<string>([...all.map((item) => item.district), ...liveDistricts])).sort();
    const sources = ["AGMARKNET", "ENAM"];

    res.json({ states, commodities, districts, sources });
  } catch (error) {
    console.error("Mandi meta error:", error);
    res.status(500).json({ error: "Failed to fetch mandi filters" });
  }
});

/**
 * GET /api/v1/mandi/trends
 * Historical 30-day price trends, moving averages, peak/trough, and selling advice
 */
router.get("/trends", (req, res) => {
  try {
    const { commodity = "Wheat", district = "Ludhiana", days = "30" } = req.query;
    const trends = getMandiPriceTrends(
      String(commodity),
      String(district),
      Number(days) || 30
    );

    res.json({
      success: true,
      data: trends,
    });
  } catch (error) {
    console.error("Mandi trends error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch mandi price trends" });
  }
});

/**
 * GET /api/v1/mandi/nearby-best
 * Best market within 100 km comparison with net realization after transport deduction
 */
router.get("/nearby-best", (req, res) => {
  try {
    const {
      commodity = "Wheat",
      district,
      lat,
      lon,
      radiusKm = "100",
      freightPerQtlPerKm = "2.8",
    } = req.query;

    const parsedLat = lat ? parseFloat(String(lat)) : undefined;
    const parsedLon = lon ? parseFloat(String(lon)) : undefined;

    const result = findNearbyBestMarkets({
      commodity: String(commodity),
      district: district ? String(district) : undefined,
      lat: parsedLat,
      lon: parsedLon,
      radiusKm: Number(radiusKm) || 100,
      freightPerQtlPerKm: Number(freightPerQtlPerKm) || 2.8,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Mandi nearby-best error:", error);
    res.status(500).json({ success: false, error: "Failed to calculate best nearby markets" });
  }
});

/**
 * GET /api/v1/mandi/status (Admin-only)
 * Returns Mandi sync status, key configuration flag, latest arrival date, and source without exposing the key
 */
router.get("/status", requireAuth, requireRole(["ADMIN"]), async (_req, res) => {
  try {
    const status = await LiveMandiService.getMandiStatus();
    res.json(status);
  } catch (error) {
    console.error("Mandi status error:", error);
    res.status(500).json({ error: "Failed to fetch mandi status" });
  }
});

export default router;
