import { describe, it, expect } from "vitest";
import request from "supertest";
import express from "express";
import mandiRoutes from "../src/routes/mandi.routes.js";

const app = express();
app.use(express.json());
app.use("/api/v1/mandi", mandiRoutes);

describe("Mandi Price Trends & Best Nearby Market (within 100 km) Suite", () => {
  it("GET /api/v1/mandi/trends should return 30-day historical points, peak, trough, and advisory", async () => {
    const res = await request(app)
      .get("/api/v1/mandi/trends")
      .query({ commodity: "Wheat", district: "Ludhiana", days: 30 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const data = res.body.data;
    expect(data.commodity).toBe("Wheat");
    expect(data.district).toBe("Ludhiana");
    expect(data.currentModalPrice).toBeGreaterThan(0);
    expect(data.history.length).toBe(30);
    expect(data.history[0]).toHaveProperty("modalPrice");
    expect(data.history[0]).toHaveProperty("movingAvg7");
    expect(data.history[0]).toHaveProperty("arrivalsQtl");
    expect(data).toHaveProperty("momentum");
    expect(["BULLISH", "BEARISH", "STABLE"]).toContain(data.momentum);
    expect(data.advisory).toBeTruthy();
    expect(data.advisoryHi).toBeTruthy();
  });

  it("GET /api/v1/mandi/nearby-best should rank mandis within radius and deduct transport freight", async () => {
    const res = await request(app)
      .get("/api/v1/mandi/nearby-best")
      .query({
        commodity: "Wheat",
        district: "Ludhiana",
        radiusKm: 100,
        freightPerQtlPerKm: 2.8,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const data = res.body.data;
    expect(data.origin.district).toBe("Ludhiana");
    expect(data.commodity).toBe("Wheat");
    expect(Array.isArray(data.markets)).toBe(true);
    expect(data.markets.length).toBeGreaterThan(0);

    const best = data.bestMarket;
    expect(best).toBeDefined();
    expect(best.rank).toBe(1);
    expect(best.isBestMarket).toBe(true);
    expect(best.transportCostPerQtl).toBeGreaterThan(0);
    expect(best.netRealizablePricePerQtl).toBe(best.modalPrice - best.transportCostPerQtl);
    expect(data.recommendation).toBeTruthy();
  });

  it("GET /api/v1/mandi/nearby-best should work accurately with GPS coordinates", async () => {
    // Coordinates near Ludhiana / Khanna
    const res = await request(app)
      .get("/api/v1/mandi/nearby-best")
      .query({
        commodity: "Wheat",
        lat: 30.7028,
        lon: 76.2206,
        radiusKm: 75,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.markets.length).toBeGreaterThan(0);
    expect(res.body.data.origin.lat).toBe(30.7028);
    expect(res.body.data.origin.lon).toBe(76.2206);
  });
});
