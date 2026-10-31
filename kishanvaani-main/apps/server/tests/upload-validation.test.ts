import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import app from "../src/server.js";
import prisma from "../src/prisma.js";
import { generateToken } from "../src/middleware/auth.middleware.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.resolve(__dirname, "../../web/public/audio/uploads");

describe("File Upload Security & Magic-Byte Validation (Issue 4)", () => {
  let userToken: string;
  let testUser: any;
  const createdFiles: string[] = [];

  beforeAll(async () => {
    testUser = await prisma.user.upsert({
      where: { email: "uploader_test@kishanvaani.in" },
      update: {},
      create: {
        email: "uploader_test@kishanvaani.in",
        name: "Test Uploader",
        role: "USER",
        password: "dummyhash123",
      },
    });

    userToken = generateToken({
      id: testUser.id,
      email: testUser.email,
      role: testUser.role,
      name: testUser.name,
    });
  });

  afterAll(async () => {
    // Clean up created files on disk
    for (const filename of createdFiles) {
      try {
        await fs.unlink(path.join(UPLOADS_DIR, filename));
      } catch {
        // Ignore if already deleted
      }
    }

    await prisma.user.deleteMany({
      where: { email: "uploader_test@kishanvaani.in" },
    });
    await prisma.$disconnect();
  });

  it("should require authentication to upload files", async () => {
    const res = await request(app)
      .post("/api/v1/content/upload-file")
      .send({
        filename: "test.mp3",
        fileBase64: Buffer.from("dummy").toString("base64"),
      });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Authentication required");
  });

  it("should reject upload if fileBase64 is missing", async () => {
    const res = await request(app)
      .post("/api/v1/content/upload-file")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        filename: "empty.mp3",
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("fileBase64");
  });

  it("should reject an empty 0-byte file payload", async () => {
    const res = await request(app)
      .post("/api/v1/content/upload-file")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        filename: "empty.mp3",
        fileBase64: "",
      });

    expect(res.status).toBe(400);
  });

  it("should reject malicious HTML or JavaScript disguised as audio (extension spoofing / stored XSS)", async () => {
    const evilContent = Buffer.from("<html><script>alert('XSS')</script></html>");
    const res = await request(app)
      .post("/api/v1/content/upload-file")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        filename: "evil_audio.mp3",
        fileBase64: evilContent.toString("base64"),
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("Invalid file content or disallowed file type");
  });

  it("should reject SVG files with script injections", async () => {
    const svgContent = Buffer.from("<svg xmlns='http://www.w3.org/2000/svg'><script>alert(1)</script></svg>");
    const res = await request(app)
      .post("/api/v1/content/upload-file")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        filename: "vector_exploit.svg",
        fileBase64: svgContent.toString("base64"),
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("disallowed file type");
  });

  it("should reject files exceeding the 5 MB size limit", async () => {
    // Generate a 5.2 MB buffer
    const largeBuffer = Buffer.alloc(5.2 * 1024 * 1024);
    // Write valid MP3 ID3 header at the start so magic-bytes would pass if size was not checked
    largeBuffer.write("ID3", 0, "ascii");

    const res = await request(app)
      .post("/api/v1/content/upload-file")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        filename: "too_large.mp3",
        fileBase64: largeBuffer.toString("base64"),
      });

    expect(res.status).toBe(413);
    expect(res.body.error).toContain("5 MB limit");
  });

  it("should accept valid MP3 audio and generate a secure random filename", async () => {
    // Valid ID3v2 header
    const validMp3 = Buffer.from([0x49, 0x44, 0x33, 0x03, 0x00, 0x00, 0x00, 0x00, 0x00, 0x20, 0x00, 0x00]);

    const res = await request(app)
      .post("/api/v1/content/upload-file")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        filename: "user_original_name.mp3",
        fileBase64: validMp3.toString("base64"),
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("fileUrl");
    expect(res.body).toHaveProperty("filename");
    expect(res.body.mimeType).toBe("audio/mpeg");
    // Verify client-supplied name was NOT reused directly
    expect(res.body.filename).not.toBe("user_original_name.mp3");
    expect(res.body.filename).toMatch(/\.mp3$/);

    createdFiles.push(res.body.filename);

    // Verify file actually exists on disk in uploads dir
    const diskPath = path.join(UPLOADS_DIR, res.body.filename);
    const stat = await fs.stat(diskPath);
    expect(stat.size).toBe(validMp3.length);
  });

  it("should accept valid PNG images and generate secure random filename", async () => {
    // Valid 8-byte PNG signature
    const validPng = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);

    const res = await request(app)
      .post("/api/v1/content/upload-file")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        filename: "farmer_profile.png",
        fileBase64: validPng.toString("base64"),
      });

    expect(res.status).toBe(200);
    expect(res.body.mimeType).toBe("image/png");
    expect(res.body.filename).toMatch(/\.png$/);

    createdFiles.push(res.body.filename);
  });
});
