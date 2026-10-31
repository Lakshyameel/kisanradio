import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import express from "express";
import cropCalendarRoutes from "../src/routes/crop-calendar.routes.js";

const app = express();
app.use(express.json());
app.use("/api/v1/crop-calendar", cropCalendarRoutes);

describe("Crop Calendar API Suite", () => {
  it("GET /api/v1/crop-calendar/crops should return available crops with stages and seasons", async () => {
    const res = await request(app).get("/api/v1/crop-calendar/crops");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(4);

    const wheat = res.body.data.find((c: any) => c.name === "Wheat");
    expect(wheat).toBeDefined();
    expect(wheat.season).toBe("Rabi");
    expect(wheat.stagesCount).toBeGreaterThan(0);
  });

  it("GET /api/v1/crop-calendar/districts should return supported agro-climatic districts", async () => {
    const res = await request(app).get("/api/v1/crop-calendar/districts");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.count).toBeGreaterThanOrEqual(20);
    expect(res.body.data[0]).toHaveProperty("district");
    expect(res.body.data[0]).toHaveProperty("state");
    expect(res.body.data[0]).toHaveProperty("zone");
  });

  it("GET /api/v1/crop-calendar/schedule should calculate personalized schedule and urgent reminders", async () => {
    const res = await request(app)
      .get("/api/v1/crop-calendar/schedule")
      .query({ crop: "Wheat", district: "Ludhiana" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("crop");
    expect(res.body.data).toHaveProperty("district");
    expect(res.body.data).toHaveProperty("daysElapsed");
    expect(res.body.data).toHaveProperty("progressPercent");
    expect(res.body.data).toHaveProperty("currentStage");
    expect(res.body.data).toHaveProperty("urgentReminders");
    expect(res.body.data).toHaveProperty("weatherSprayAdvisory");
    expect(res.body.data.weatherSprayAdvisory).toHaveProperty("safeToSpray");
  });

  it("GET /api/v1/crop-calendar/spray-window should return real-time spray suitability", async () => {
    const res = await request(app)
      .get("/api/v1/crop-calendar/spray-window")
      .query({ district: "Ludhiana" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("sprayWindow");
    expect(res.body.data.sprayWindow).toHaveProperty("safeToSpray");
    expect(res.body.data.sprayWindow).toHaveProperty("recommendedHours");
  });

  it("POST /api/v1/crop-calendar/reminders/subscribe should register farmer alert subscription", async () => {
    const res = await request(app)
      .post("/api/v1/crop-calendar/reminders/subscribe")
      .send({
        phone: "9876543210",
        channel: "WHATSAPP",
        crop: "Wheat",
        district: "Ludhiana",
        sowingDate: "2026-10-01",
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.phone).toContain("******");
    expect(res.body.data.channel).toBe("WHATSAPP");
  });

  it("POST /api/v1/crop-calendar/reminders/subscribe should reject short/invalid phone numbers", async () => {
    const res = await request(app)
      .post("/api/v1/crop-calendar/reminders/subscribe")
      .send({
        phone: "123",
        crop: "Wheat",
        district: "Ludhiana",
        sowingDate: "2026-10-01",
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
