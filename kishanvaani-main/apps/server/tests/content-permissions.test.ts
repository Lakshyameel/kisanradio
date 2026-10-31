import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../src/server.js";
import prisma from "../src/prisma.js";
import { generateToken } from "../src/middleware/auth.middleware.js";

describe("Content Permissions & Role-Based Access Control", () => {
  let adminToken: string;
  let expertToken: string;
  let userAToken: string;
  let userBToken: string;

  let adminUser: any;
  let expertUser: any;
  let userA: any;
  let userB: any;

  let draftContentId: string;
  let publishedContentId: string;
  let pendingStoryId: string;
  let literatureAId: string;
  let literatureBId: string;

  beforeAll(async () => {
    // 1. Setup Admin user
    adminUser = await prisma.user.upsert({
      where: { email: "admin_test_perm@kishanvaani.in" },
      update: { role: "ADMIN" },
      create: {
        email: "admin_test_perm@kishanvaani.in",
        name: "Admin Perm",
        role: "ADMIN",
        password: "hash",
      },
    });
    adminToken = generateToken({
      id: adminUser.id,
      email: adminUser.email,
      role: adminUser.role,
      name: adminUser.name,
    });

    // 2. Setup Expert user
    expertUser = await prisma.user.upsert({
      where: { email: "expert_test_perm@kishanvaani.in" },
      update: { role: "EXPERT" },
      create: {
        email: "expert_test_perm@kishanvaani.in",
        name: "Dr. Expert Perm",
        role: "EXPERT",
        password: "hash",
      },
    });
    expertToken = generateToken({
      id: expertUser.id,
      email: expertUser.email,
      role: expertUser.role,
      name: expertUser.name,
    });

    // 3. Setup User A & User B with identical names ("Ramesh Patel")
    userA = await prisma.user.upsert({
      where: { email: "user_a_perm@kishanvaani.in" },
      update: { name: "Ramesh Patel", role: "USER" },
      create: {
        email: "user_a_perm@kishanvaani.in",
        name: "Ramesh Patel",
        role: "USER",
        password: "hash",
      },
    });
    userAToken = generateToken({
      id: userA.id,
      email: userA.email,
      role: userA.role,
      name: userA.name,
    });

    userB = await prisma.user.upsert({
      where: { email: "user_b_perm@kishanvaani.in" },
      update: { name: "Ramesh Patel", role: "USER" },
      create: {
        email: "user_b_perm@kishanvaani.in",
        name: "Ramesh Patel",
        role: "USER",
        password: "hash",
      },
    });
    userBToken = generateToken({
      id: userB.id,
      email: userB.email,
      role: userB.role,
      name: userB.name,
    });

    // Seed test content: DRAFT and PUBLISHED
    const draft = await prisma.content.create({
      data: {
        title: "Confidential Draft Guide",
        slug: `draft-guide-${Date.now()}`,
        type: "ARTICLE",
        category: "Agriculture",
        body: "Draft content body",
        status: "DRAFT",
        authorName: "Admin Perm",
        authorId: adminUser.id,
      },
    });
    draftContentId = draft.id;

    const published = await prisma.content.create({
      data: {
        title: "Public Harvesting Guide",
        slug: `public-guide-${Date.now()}`,
        type: "ARTICLE",
        category: "Agriculture",
        body: "Published content body",
        status: "PUBLISHED",
        authorName: "Admin Perm",
        authorId: adminUser.id,
      },
    });
    publishedContentId = published.id;

    // Seed literature for User A & User B
    const litA = await prisma.content.create({
      data: {
        title: "User A Literature",
        slug: `lit-a-${Date.now()}`,
        type: "LITERATURE",
        category: "Literature",
        body: "Organic story by User A",
        status: "PUBLISHED",
        authorName: userA.name,
        authorId: userA.id,
      },
    });
    literatureAId = litA.id;

    const litB = await prisma.content.create({
      data: {
        title: "User B Literature",
        slug: `lit-b-${Date.now()}`,
        type: "LITERATURE",
        category: "Literature",
        body: "Dairy farming by User B",
        status: "PUBLISHED",
        authorName: userB.name,
        authorId: userB.id,
      },
    });
    literatureBId = litB.id;
  });

  afterAll(async () => {
    // Cleanup created records
    await prisma.content.deleteMany({
      where: {
        id: { in: [draftContentId, publishedContentId, literatureAId, literatureBId] },
      },
    });
    if (pendingStoryId) {
      await prisma.communityStory.deleteMany({ where: { id: pendingStoryId } });
    }
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            "admin_test_perm@kishanvaani.in",
            "expert_test_perm@kishanvaani.in",
            "user_a_perm@kishanvaani.in",
            "user_b_perm@kishanvaani.in",
          ],
        },
      },
    });
    await prisma.$disconnect();
  });

  describe("Issue 5: Draft Content Access Restrictions", () => {
    it("should never return DRAFT content to unauthenticated or regular users", async () => {
      const res = await request(app)
        .get("/api/v1/content?status=DRAFT");

      expect(res.status).toBe(200);
      const items: any[] = res.body.items || [];
      const hasDraft = items.some((item) => item.id === draftContentId || item.status === "DRAFT");
      expect(hasDraft).toBe(false);
    });

    it("should allow ADMIN users to view DRAFT content when requested", async () => {
      const res = await request(app)
        .get("/api/v1/content?status=DRAFT")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const items: any[] = res.body.items || [];
      const hasDraft = items.some((item) => item.id === draftContentId);
      expect(hasDraft).toBe(true);
    });
  });

  describe("Issue 6: Community Story Moderation Queue & Status Validation", () => {
    it("should create community stories with PENDING_REVIEW status", async () => {
      const res = await request(app)
        .post("/api/v1/community/stories")
        .set("Authorization", `Bearer ${userAToken}`)
        .send({
          title: "My Wheat Harvest Experiment",
          body: "We tried direct seeding of wheat and reduced water consumption by 25%.",
          category: "SUCCESS_STORY",
          location: "Ludhiana",
        });

      expect(res.status).toBe(201);
      expect(res.body.story.status).toBe("PENDING_REVIEW");
      pendingStoryId = res.body.story.id;
    });

    it("should block non-admin users from viewing the pending stories queue", async () => {
      const res = await request(app)
        .get("/api/v1/admin/stories/pending")
        .set("Authorization", `Bearer ${userAToken}`);

      expect(res.status).toBe(403);
    });

    it("should reject invalid status strings when admin updates story status", async () => {
      const res = await request(app)
        .put(`/api/v1/admin/stories/${pendingStoryId}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ status: "HACKED_BY_ATTACKER" });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/PUBLISHED|REJECTED|Invalid/);
    });

    it("should allow ADMIN to approve pending story with PUBLISHED status", async () => {
      const res = await request(app)
        .put(`/api/v1/admin/stories/${pendingStoryId}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ status: "PUBLISHED" });

      expect(res.status).toBe(200);
      expect(res.body.story.status).toBe("PUBLISHED");
    });
  });

  describe("Issue 11: Literature Isolation by authorId", () => {
    it("User A should only see User A's literature in /my-literature", async () => {
      const res = await request(app)
        .get("/api/v1/content/my-literature")
        .set("Authorization", `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      const items: any[] = res.body.items || [];
      expect(items.length).toBe(1);
      expect(items[0].id).toBe(literatureAId);
      expect(items.some((i) => i.id === literatureBId)).toBe(false);
    });

    it("User B should only see User B's literature in /my-literature", async () => {
      const res = await request(app)
        .get("/api/v1/content/my-literature")
        .set("Authorization", `Bearer ${userBToken}`);

      expect(res.status).toBe(200);
      const items: any[] = res.body.items || [];
      expect(items.length).toBe(1);
      expect(items[0].id).toBe(literatureBId);
      expect(items.some((i) => i.id === literatureAId)).toBe(false);
    });
  });

  describe("Issue 11: Admin vs Expert Role Boundaries", () => {
    it("EXPERT cannot view /admin/stats (403)", async () => {
      const res = await request(app)
        .get("/api/v1/admin/stats")
        .set("Authorization", `Bearer ${expertToken}`);

      expect(res.status).toBe(403);
    });

    it("ADMIN can view /admin/stats (200)", async () => {
      const res = await request(app)
        .get("/api/v1/admin/stats")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("stats");
    });

    it("EXPERT can access /admin/questions/pending (200)", async () => {
      const res = await request(app)
        .get("/api/v1/admin/questions/pending")
        .set("Authorization", `Bearer ${expertToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("questions");
    });
  });

  describe("Issue 11: Expert Q&A Asker PII Masking", () => {
    let questionId: string;

    beforeAll(async () => {
      const q = await prisma.expertQuestion.create({
        data: {
          userId: userA.id,
          question: "How to treat yellow stem borer in paddy crop?",
          crop: "Paddy",
          category: "Pest Management",
          status: "PENDING",
        },
      });
      questionId = q.id;
    });

    afterAll(async () => {
      if (questionId) {
        await prisma.expertQuestion.deleteMany({ where: { id: questionId } });
      }
    });

    it("Public unauthenticated request to /expert/questions strips farmer PII (name & district)", async () => {
      const res = await request(app)
        .get("/api/v1/expert/questions");

      expect(res.status).toBe(200);
      const questions: any[] = res.body.questions || [];
      const testQ = questions.find((q) => q.id === questionId);
      expect(testQ).toBeDefined();
      expect(testQ.user).toBeUndefined();
    });

    it("Owner of question can see their own info", async () => {
      const res = await request(app)
        .get("/api/v1/expert/questions")
        .set("Authorization", `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      const questions: any[] = res.body.questions || [];
      const testQ = questions.find((q) => q.id === questionId);
      expect(testQ).toBeDefined();
      expect(testQ.user).toBeDefined();
      expect(testQ.user.name).toBe("Ramesh Patel");
    });
  });
});
