import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../src/server.js";
import prisma from "../src/prisma.js";

describe("Authentication & Authorization Endpoints", () => {
  const testUser = {
    email: `test_vitest_${Date.now()}@example.com`,
    password: "StrongPassword123!",
    name: "Vitest Farmer",
    state: "Punjab",
    district: "Ludhiana",
  };

  let authToken: string;

  beforeAll(async () => {
    // Clean up any test users from prior runs
    await prisma.user.deleteMany({
      where: { email: { contains: "test_vitest_" } },
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { contains: "test_vitest_" } },
    });
    await prisma.$disconnect();
  });

  describe("POST /api/v1/auth/register", () => {
    it("should successfully register a new user with valid details and password >= 8 chars", async () => {
      const res = await request(app)
        .post("/api/v1/auth/register")
        .send(testUser);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("token");
      expect(res.body.user).toHaveProperty("id");
      expect(res.body.user.email).toBe(testUser.email);
      expect(res.body.user.role).toBe("USER");
      expect(res.body.user).not.toHaveProperty("password");

      authToken = res.body.token;
    });

    it("should reject registration with passwords shorter than 8 characters", async () => {
      const res = await request(app)
        .post("/api/v1/auth/register")
        .send({
          email: `short_pw_${Date.now()}@example.com`,
          password: "short",
          name: "Short Pw User",
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("Password must be at least 8 characters");
    });

    it("should reject registration when email is already registered", async () => {
      const res = await request(app)
        .post("/api/v1/auth/register")
        .send(testUser);

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("already exists");
    });

    it("should reject registration with invalid email format", async () => {
      const res = await request(app)
        .post("/api/v1/auth/register")
        .send({
          email: "invalid-email-format",
          password: "StrongPassword123!",
          name: "Invalid Email User",
        });

      expect(res.status).toBe(400);
    });
  });

  describe("POST /api/v1/auth/login", () => {
    it("should authenticate with correct credentials and return a token", async () => {
      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("token");
      expect(res.body.user.email).toBe(testUser.email);
    });

    it("should reject login with wrong password", async () => {
      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: testUser.email,
          password: "WrongPassword123!",
        });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe("Invalid email or password");
    });

    it("should reject login for non-existent email", async () => {
      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: "nobody_exists_here@example.com",
          password: "SomePassword123!",
        });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe("Invalid email or password");
    });
  });

  describe("GET /api/v1/auth/me", () => {
    it("should return the current user profile with valid Bearer token", async () => {
      const res = await request(app)
        .get("/api/v1/auth/me")
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe(testUser.email);
      expect(res.body.user.name).toBe(testUser.name);
      expect(res.body.user).toHaveProperty("_count");
    });

    it("should reject request when Authorization header is missing", async () => {
      const res = await request(app).get("/api/v1/auth/me");

      expect(res.status).toBe(401);
      expect(res.body.error).toBe("Authentication required");
    });

    it("should reject request with an invalid token", async () => {
      const res = await request(app)
        .get("/api/v1/auth/me")
        .set("Authorization", "Bearer invalid.jwt.token");

      expect(res.status).toBe(401);
      expect(res.body.error).toBe("Invalid or expired token");
    });
  });

  describe("POST /api/v1/auth/otp/send & verify (Feature 4 Phone OTP Login)", () => {
    const testPhone = "9876543210";

    it("should successfully send OTP to valid 10-digit Indian mobile number", async () => {
      const res = await request(app)
        .post("/api/v1/auth/otp/send")
        .send({ phone: testPhone });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.phone).toBe(testPhone);
      expect(res.body.devOtp).toBe("123456");
      expect(res.body.message).toContain("+91 98******10");
    });

    it("should reject invalid mobile numbers", async () => {
      const res = await request(app)
        .post("/api/v1/auth/otp/send")
        .send({ phone: "12345" });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("Phone number must be at least 10 digits");
    });

    it("should reject incorrect OTP code during verification", async () => {
      const res = await request(app)
        .post("/api/v1/auth/otp/verify")
        .send({
          phone: testPhone,
          otp: "999999",
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("Invalid OTP code");
    });

    it("should verify valid OTP, auto-create farmer account and issue JWT token", async () => {
      const res = await request(app)
        .post("/api/v1/auth/otp/verify")
        .send({
          phone: testPhone,
          otp: "123456",
          name: "Gurdev Singh (Farmer)",
          district: "Bathinda",
          state: "Punjab",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty("token");
      expect(res.body.user).toHaveProperty("phone", testPhone);
      expect(res.body.user.role).toBe("USER");
    });
  });

  describe("POST /api/v1/auth/google (Verified Google Identity)", () => {
    it("should reject request when Google credential is empty or missing", async () => {
      const res = await request(app)
        .post("/api/v1/auth/google")
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBeTruthy();
    });

    it("should verify authentic Google token, provision user, and issue session token", async () => {
      const res = await request(app)
        .post("/api/v1/auth/google")
        .send({
          credential: "mock-google-id-token",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty("token");
      expect(res.body.user.email).toBe("testfarmer@gmail.com");
      expect(res.body.user.name).toBe("Google Verified Farmer");
    });
  });
});
