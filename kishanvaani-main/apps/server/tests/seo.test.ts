import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import app from "../src/server.js";
import prisma from "../src/prisma.js";

describe("SEO, Open Graph & WhatsApp Sharing Suite (Feature 6)", () => {
  let testContent: any;

  beforeAll(async () => {
    // Seed a published test agricultural advisory for deep-link preview
    const slug = `seo-test-mustard-blight-${Date.now()}`;
    testContent = await prisma.content.create({
      data: {
        title: "Mustard White Rust & Alternaria Blight Advisory",
        slug,
        description: "Vital advisory on controlling white blister disease in late-sown mustard crops.",
        body: "Apply Mancozeb 75 WP @ 2g per liter of water as soon as white pustules appear on leaves.",
        type: "CROP_ADVISORY",
        category: "Agriculture",
        language: "Hindi",
        status: "PUBLISHED",
        thumbnailUrl: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800",
        audio: {
          create: {
            fileUrl: "https://cdn.kishanvaani.in/audio/mustard-blight.opus",
            durationSec: 165,
            narrator: "Dr. S.K. Sharma",
          },
        },
      },
      include: { audio: true },
    });
  });

  it("GET /sitemap.xml should return valid XML sitemap containing static pages and published content", async () => {
    const res = await request(app).get("/sitemap.xml");

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("application/xml");
    expect(res.text).toContain("<?xml version=");
    expect(res.text).toContain("<urlset");
    expect(res.text).toContain("/mandi-prices");
    expect(res.text).toContain("/agriculture");
    expect(res.text).toContain(`/slug/${testContent.slug}`);
  });

  it("GET /robots.txt should declare crawl rules and link to /sitemap.xml", async () => {
    const res = await request(app).get("/robots.txt");

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("text/plain");
    expect(res.text).toContain("User-agent: *");
    expect(res.text).toContain("Sitemap:");
    expect(res.text).toContain("/sitemap.xml");
  });

  it("GET /api/v1/seo/meta should return structured metadata for mandi prices route", async () => {
    const res = await request(app).get("/api/v1/seo/meta?path=/mandi-prices");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.meta.title).toContain("मंडी भाव");
    expect(res.body.meta.description).toContain("Agmarknet");
    expect(res.body.meta.type).toBe("website");
  });

  it("GET /api/v1/seo/meta should return article & audio metadata for content slug", async () => {
    const res = await request(app).get(`/api/v1/seo/meta?path=/slug/${testContent.slug}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.meta.title).toContain("Mustard White Rust");
    expect(res.body.meta.audioUrl).toBe(testContent.audio.fileUrl);
    expect(res.body.meta.jsonLd).toBeDefined();
    expect(res.body.meta.jsonLd["@type"]).toBe("AudioObject");
  });

  it("GET /share/:slug should return pre-rendered Open Graph HTML for WhatsApp crawlers", async () => {
    const res = await request(app)
      .get(`/share/${testContent.slug}`)
      .set("User-Agent", "WhatsApp/2.21.11.17 A");

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("text/html");
    expect(res.text).toContain("og:title");
    expect(res.text).toContain("Mustard White Rust");
    expect(res.text).toContain("og:image");
    expect(res.text).toContain("og:site_name");
    expect(res.text).toContain("twitter:card");
  });

  it("GET /slug/:slug should return dynamic HTML with injected Open Graph tags", async () => {
    const res = await request(app).get(`/slug/${testContent.slug}`);

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("text/html");
    // Verify injected Open Graph meta
    expect(res.text).toContain("Mustard White Rust");
    expect(res.text).toContain("og:title");
    expect(res.text).toContain("og:description");
    expect(res.text).toContain("og:site_name");
  });
});
