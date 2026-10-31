import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import express from "express";
import jwt from "jsonwebtoken";
import prisma from "../src/prisma.js";
import expertRoutes from "../src/routes/expert.routes.js";
import notificationRoutes from "../src/routes/notification.routes.js";

const app = express();
app.use(express.json());
app.use("/api/v1/expert", expertRoutes);
app.use("/api/v1/notifications", notificationRoutes);

const JWT_SECRET = process.env.JWT_SECRET || "kishanvaani-dev-secret-key-12345";

describe("Expert Audio Answers & Notification Suite", () => {
  let farmerToken: string;
  let farmerUser: any;
  let expertToken: string;
  let expertUser: any;
  let questionId: string;
  let notificationId: string;

  beforeAll(async () => {
    // Create test farmer user
    farmerUser = await prisma.user.create({
      data: {
        email: `farmer_${Date.now()}@test.com`,
        name: "Ramesh Kumar (Farmer)",
        role: "USER",
        district: "Ludhiana",
        state: "Punjab",
      },
    });

    farmerToken = jwt.sign(
      { id: farmerUser.id, email: farmerUser.email, role: farmerUser.role, name: farmerUser.name },
      JWT_SECRET
    );

    // Create test expert user
    expertUser = await prisma.user.create({
      data: {
        email: `expert_${Date.now()}@kvk.gov.in`,
        name: "Dr. H. S. Dhaliwal (Agronomist)",
        role: "EXPERT",
        district: "Ludhiana",
        state: "Punjab",
      },
    });

    expertToken = jwt.sign(
      { id: expertUser.id, email: expertUser.email, role: expertUser.role, name: expertUser.name },
      JWT_SECRET
    );
  });

  it("Farmer submits an agricultural question", async () => {
    const res = await request(app)
      .post("/api/v1/expert/questions")
      .set("Authorization", `Bearer ${farmerToken}`)
      .send({
        question: "My wheat leaves have yellow spots and drying tips. What spray is recommended?",
        crop: "Wheat",
        category: "Disease Control",
      });

    expect(res.status).toBe(201);
    expect(res.body.question).toBeDefined();
    expect(res.body.question.status).toBe("PENDING");
    questionId = res.body.question.id;
  });

  it("Expert answers the question with audio answer URL and triggers farmer notification", async () => {
    const res = await request(app)
      .post(`/api/v1/expert/questions/${questionId}/answer`)
      .set("Authorization", `Bearer ${expertToken}`)
      .send({
        answer: "This appears to be yellow rust (पीला रतुआ). Spray Propiconazole 25% EC @ 200 ml in 200 litres of water per acre immediately.",
        answeredBy: "Dr. H. S. Dhaliwal (PAU Agronomy Specialist)",
        audioAnswerUrl: "/audio/expert-answers/wheat-yellow-rust-dhaliwal.mp3",
      });

    expect(res.status).toBe(200);
    expect(res.body.question.status).toBe("ANSWERED");
    expect(res.body.question.audioAnswerUrl).toBe("/audio/expert-answers/wheat-yellow-rust-dhaliwal.mp3");
    expect(res.body.message).toContain("farmer notified");
  });

  it("Farmer receives the notification with link to answer and audio advice", async () => {
    const res = await request(app)
      .get("/api/v1/notifications")
      .set("Authorization", `Bearer ${farmerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.unreadCount).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(res.body.notifications)).toBe(true);

    const notif = res.body.notifications.find((n: any) => n.linkUrl.includes(questionId));
    expect(notif).toBeDefined();
    expect(notif.read).toBe(false);
    expect(notif.type).toBe("QUESTION_ANSWERED");
    expect(notif.message).toContain("Audio advice is ready to play");
    notificationId = notif.id;
  });

  it("Farmer marks the notification as read", async () => {
    const res = await request(app)
      .patch(`/api/v1/notifications/${notificationId}/read`)
      .set("Authorization", `Bearer ${farmerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.notification.read).toBe(true);
  });

  it("Farmer can mark all notifications as read", async () => {
    const res = await request(app)
      .patch("/api/v1/notifications/read-all")
      .set("Authorization", `Bearer ${farmerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.unreadCount).toBe(0);
  });
});
