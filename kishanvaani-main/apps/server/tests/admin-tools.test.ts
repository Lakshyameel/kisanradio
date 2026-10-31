import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import app from "../src/server.js";

describe("Admin Tools Suite (Feature 5: Scheduling, Audit Logs, Bulk Upload, Analytics)", () => {
  let adminToken: string;
  let expertToken: string;
  let userToken: string;
  let testStoryId: string;
  let testQuestionId: string;

  beforeAll(async () => {
    // 1. Get tokens for Admin, Expert, and Farmer User
    const adminRes = await request(app)
      .post("/api/v1/auth/demo-login")
      .send({ role: "ADMIN" });
    adminToken = adminRes.body.token;

    const expertRes = await request(app)
      .post("/api/v1/auth/demo-login")
      .send({ role: "EXPERT" });
    expertToken = expertRes.body.token;

    const userRes = await request(app)
      .post("/api/v1/auth/demo-login")
      .send({ role: "USER" });
    userToken = userRes.body.token;

    // 2. Submit a test community story to moderate
    const storyRes = await request(app)
      .post("/api/v1/community/stories")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        title: "Drip Irrigation Yield Test",
        body: "Using drip irrigation reduced water usage by 40% and improved our wheat harvest in Ludhiana.",
        category: "SUCCESS_STORY",
      });
    testStoryId = storyRes.body.story.id;

    // 3. Submit a test expert question to answer
    const qRes = await request(app)
      .post("/api/v1/expert/questions")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        question: "How do I control yellow rust on HD-2967 wheat in humid conditions?",
        crop: "Wheat",
        category: "Crop Guidance",
      });
    testQuestionId = qRes.body.question.id;
  });

  describe("Access Control & Analytics", () => {
    it("should reject unauthenticated or regular user access to admin endpoints", async () => {
      const unauth = await request(app).get("/api/v1/admin/analytics");
      expect(unauth.status).toBe(401);

      const forbidden = await request(app)
        .get("/api/v1/admin/analytics")
        .set("Authorization", `Bearer ${userToken}`);
      expect(forbidden.status).toBe(403);
    });

    it("should return comprehensive analytics for admin (plays, completion rate, top districts)", async () => {
      const res = await request(app)
        .get("/api/v1/admin/analytics")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.metrics).toHaveProperty("totalAudioPlays");
      expect(res.body.metrics).toHaveProperty("completionRate");
      expect(typeof res.body.metrics.completionRate).toBe("number");
      expect(Array.isArray(res.body.topDistricts)).toBe(true);
      expect(res.body.topDistricts.length).toBeGreaterThan(0);
      expect(Array.isArray(res.body.activityTrend)).toBe(true);
      expect(res.body.activityTrend.length).toBe(7);
    });
  });

  describe("Content Scheduling", () => {
    let scheduledContentId: string;

    it("should allow admin or expert to schedule agricultural audio broadcast for the future", async () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      const res = await request(app)
        .post("/api/v1/admin/content/schedule")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          title: "Upcoming Frost Warning & Potato Foliar Spray",
          description: "Crucial instructions to protect potato tubers against sudden night temperature drop.",
          body: "Spraying potassium nitrate 1% provides winter resistance to sensitive solanaceous crops.",
          category: "Agriculture",
          type: "CROP_ADVISORY",
          language: "Hindi",
          scheduledPublishAt: futureDate,
          audioUrl: "https://cdn.kishanvaani.in/audio/advisory-frost-spray.opus",
          durationSec: 150,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.content.status).toBe("SCHEDULED");
      expect(res.body.content.scheduledPublishAt).toBeDefined();
      scheduledContentId = res.body.content.id;
    });

    it("should list scheduled content in GET /api/v1/admin/content/scheduled", async () => {
      const res = await request(app)
        .get("/api/v1/admin/content/scheduled")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.scheduled)).toBe(true);
      const found = res.body.scheduled.find((item: any) => item.id === scheduledContentId);
      expect(found).toBeDefined();
      expect(found.status).toBe("SCHEDULED");
    });

    it("should allow admin to publish scheduled content immediately ahead of time", async () => {
      const res = await request(app)
        .post(`/api/v1/admin/content/${scheduledContentId}/publish-now`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.content.status).toBe("PUBLISHED");
      expect(res.body.content.publishedAt).toBeDefined();
    });

    it("should check and auto-publish past due content via /publish-due", async () => {
      // Schedule an item in the past
      const pastDate = new Date(Date.now() - 5000).toISOString();
      const pastSchedRes = await request(app)
        .post("/api/v1/admin/content/schedule")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          title: "Immediate Due Advisory for Paddy Borer",
          description: "Timed advisory for stem borer management in Basmati.",
          category: "Agriculture",
          scheduledPublishAt: pastDate,
        });
      expect(pastSchedRes.status).toBe(201);

      const pubDueRes = await request(app)
        .post("/api/v1/admin/content/publish-due")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(pubDueRes.status).toBe(200);
      expect(pubDueRes.body.count).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Audit Logs System", () => {
    it("should automatically log audit event when an admin approves a story", async () => {
      const res = await request(app)
        .put(`/api/v1/admin/stories/${testStoryId}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ status: "PUBLISHED" });

      expect(res.status).toBe(200);
      expect(res.body.story.status).toBe("PUBLISHED");
    });

    it("should automatically log audit event when an expert answers a question", async () => {
      const res = await request(app)
        .post(`/api/v1/expert/questions/${testQuestionId}/answer`)
        .set("Authorization", `Bearer ${expertToken}`)
        .send({
          answer: "Apply Propiconazole 25% EC @ 1ml per litre of water at first symptom of stripe rust.",
          audioAnswerUrl: "https://cdn.kishanvaani.in/audio/answers/wheat-rust-spray.opus",
          answeredBy: "Dr. S.K. Sharma",
        });

      expect(res.status).toBe(200);
    });

    it("should return the immutable audit trail in GET /api/v1/admin/audit-logs", async () => {
      const res = await request(app)
        .get("/api/v1/admin/audit-logs")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.logs)).toBe(true);
      expect(res.body.logs.length).toBeGreaterThanOrEqual(2);

      const actions = res.body.logs.map((l: any) => l.action);
      expect(actions).toContain("APPROVE_STORY");
      expect(actions).toContain("ANSWER_QUESTION");

      const approveLog = res.body.logs.find((l: any) => l.action === "APPROVE_STORY");
      expect(approveLog.targetType).toBe("STORY");
      expect(approveLog.user).toBeDefined();
    });
  });

  describe("Bulk Upload System", () => {
    it("should allow admin to bulk upload agricultural articles & audio advisories", async () => {
      const res = await request(app)
        .post("/api/v1/admin/bulk-upload")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          type: "CONTENT",
          items: [
            {
              title: "Bulk Mustard Aphid Control Strategy",
              description: "Integrated pest management for cruciferous oilseed crops.",
              category: "Agriculture",
              type: "CROP_ADVISORY",
              language: "Hindi",
              audioUrl: "https://cdn.kishanvaani.in/audio/mustard-aphids.opus",
              durationSec: 140,
            },
            {
              title: "PM-Kisan 19th Installment Beneficiary Status Guide",
              description: "Complete procedure to check eKYC and Aadhaar seeding status.",
              category: "Schemes",
              type: "GOVERNMENT_SCHEME",
              language: "Hindi",
              audioUrl: "https://cdn.kishanvaani.in/audio/pm-kisan-guide.opus",
              durationSec: 210,
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.successCount).toBe(2);
      expect(res.body.failedCount).toBe(0);
    });

    it("should allow admin to bulk upload mandi market prices with verification", async () => {
      const res = await request(app)
        .post("/api/v1/admin/bulk-upload")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          type: "MANDI_PRICE",
          items: [
            {
              state: "Punjab",
              district: "Ludhiana",
              market: "Khanna",
              commodity: "Wheat",
              variety: "Sharbati",
              minPrice: 2320,
              maxPrice: 2540,
              modalPrice: 2460,
              arrivals: 450,
              source: "AGMARKNET",
            },
            {
              state: "Haryana",
              district: "Karnal",
              market: "Taraori",
              commodity: "Paddy",
              variety: "Basmati 1121",
              minPrice: 3800,
              maxPrice: 4250,
              modalPrice: 4120,
              arrivals: 600,
              source: "AGMARKNET",
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.successCount).toBe(2);
    });

    it("should reject bulk upload if regular farmer attempts it", async () => {
      const res = await request(app)
        .post("/api/v1/admin/bulk-upload")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          type: "CONTENT",
          items: [{ title: "Hacked Item" }],
        });

      expect(res.status).toBe(403);
    });
  });
});
