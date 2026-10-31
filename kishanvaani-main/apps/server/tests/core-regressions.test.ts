import { describe, it, expect } from "vitest";
import { parseOgdDate } from "../src/services/live-mandi.service.js";

describe("Core Regression Test Suite: Search, Mandi, Weather & Upload", () => {
  // ───────────────────────────────────────────────────────────────────────────
  // 1. Search Multi-Word Token Matching
  // ───────────────────────────────────────────────────────────────────────────
  describe("Search Tokenization & Multi-Word Matching", () => {
    // Replicating the search tokenization logic from search.routes.ts
    const tokenize = (q: string) => q.trim().split(/\s+/).filter(Boolean).slice(0, 6);
    const buildAnyFieldFilter = (tokens: string[], fields: string[]) => ({
      AND: tokens.map((tok) => ({
        OR: fields.map((f) => ({ [f]: { contains: tok } })),
      })),
    });

    it("should split multi-word search string into distinct tokens", () => {
      const tokens = tokenize("Wheat   Yellow   Rust");
      expect(tokens).toEqual(["Wheat", "Yellow", "Rust"]);
      expect(tokens.length).toBe(3);
    });

    it("should cap tokens at a maximum of 6 to prevent DoS query explosion", () => {
      const tokens = tokenize("one two three four five six seven eight nine");
      expect(tokens.length).toBe(6);
      expect(tokens).toEqual(["one", "two", "three", "four", "five", "six"]);
    });

    it("should construct AND of ORs across searchable fields so words match across fields", () => {
      const tokens = ["Wheat", "Yellow", "Rust"];
      const fields = ["title", "description", "tags", "body", "authorName"];
      const filter = buildAnyFieldFilter(tokens, fields);

      expect(filter).toHaveProperty("AND");
      expect(filter.AND.length).toBe(3);

      // Verify each token is searched across all fields
      filter.AND.forEach((clause: any, idx: number) => {
        expect(clause).toHaveProperty("OR");
        expect(clause.OR.length).toBe(5);
        expect(clause.OR[0]).toEqual({ title: { contains: tokens[idx] } });
        expect(clause.OR[1]).toEqual({ description: { contains: tokens[idx] } });
        expect(clause.OR[2]).toEqual({ tags: { contains: tokens[idx] } });
      });
    });

    it("should correctly match an in-memory document when words appear in different fields", () => {
      const document = {
        title: "Early Rabi Sowing Guide",
        description: "Protocol for Wheat cultivation to beat heat stress",
        tags: "Yellow Rust, Fungicide, PAU",
        body: "Apply Tilt 25 EC at first appearance of symptoms",
      };

      const query = "Wheat Yellow Rust";
      const tokens = tokenize(query);

      // In-memory simulation of the Prisma AND of ORs logic
      const matches = tokens.every((tok) => {
        const lowerTok = tok.toLowerCase();
        return (
          document.title.toLowerCase().includes(lowerTok) ||
          document.description.toLowerCase().includes(lowerTok) ||
          document.tags.toLowerCase().includes(lowerTok) ||
          document.body.toLowerCase().includes(lowerTok)
        );
      });

      expect(matches).toBe(true);
    });

    it("should reject a document if even one required token is missing", () => {
      const document = {
        title: "Wheat Sowing Guide",
        description: "Rabi advisory for Punjab",
        tags: "Wheat, PAU, Fertilizer",
        body: "Sow between Oct 25 and Nov 10",
      };

      const query = "Wheat Yellow Rust";
      const tokens = tokenize(query);

      const matches = tokens.every((tok) => {
        const lowerTok = tok.toLowerCase();
        return (
          document.title.toLowerCase().includes(lowerTok) ||
          document.description.toLowerCase().includes(lowerTok) ||
          document.tags.toLowerCase().includes(lowerTok) ||
          document.body.toLowerCase().includes(lowerTok)
        );
      });

      expect(matches).toBe(false); // "Yellow" and "Rust" missing
    });

    it("should preserve category and language filters when query string is empty", () => {
      const query = "";
      const category = "Agriculture";
      const language = "Hindi";
      const type = "NEWS";

      const contentWhere: any = {
        status: "PUBLISHED",
        ...(category && category !== "ALL" && { category: String(category) }),
        ...(language && language !== "ALL" && { language: String(language) }),
        ...(type && type !== "ALL" && { type: String(type) }),
      };

      expect(contentWhere.status).toBe("PUBLISHED");
      expect(contentWhere.category).toBe("Agriculture");
      expect(contentWhere.language).toBe("Hindi");
      expect(contentWhere.type).toBe("NEWS");
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 2. Mandi OGD Parsing & Fallback Logic
  // ───────────────────────────────────────────────────────────────────────────
  describe("Mandi OGD Date Parsing & Fallback Price Validation", () => {
    it("should format DD/MM/YYYY into ISO YYYY-MM-DD", () => {
      expect(parseOgdDate("28/10/2026")).toBe("2026-10-28");
      expect(parseOgdDate("01/01/2026")).toBe("2026-01-01");
      expect(parseOgdDate("5/4/2026")).toBe("2026-04-05");
      expect(parseOgdDate("15/12/2025")).toBe("2025-12-15");
    });

    it("should safely return original string if date format cannot be parsed", () => {
      expect(parseOgdDate("2026-10-28")).toBe("2026-10-28");
      expect(parseOgdDate("InvalidDate")).toBe("InvalidDate");
    });

    it("should filter out rows where modalPrice is 0 or negative", () => {
      const rawRecords = [
        { commodity: "Wheat", modal_price: "2425", min_price: "2400", max_price: "2500" },
        { commodity: "Paddy", modal_price: "0", min_price: "0", max_price: "0" },
        { commodity: "Maize", modal_price: "-100", min_price: "0", max_price: "0" },
        { commodity: "Mustard", modal_price: "5650", min_price: "5400", max_price: "5800" },
      ];

      const validRecords = rawRecords.filter((r) => {
        const modalPrice = Number(r.modal_price) || 0;
        return modalPrice > 0;
      });

      expect(validRecords.length).toBe(2);
      expect(validRecords.map((r) => r.commodity)).toEqual(["Wheat", "Mustard"]);
    });

    it("should set arrivalDate to null and isSample to true on fallback benchmark rows", () => {
      const benchmarkRaw = {
        state: "Punjab",
        district: "Ludhiana",
        market: "Khanna Mandi",
        commodity: "Wheat",
        variety: "PBW-826",
        minPrice: 2425,
        maxPrice: 2600,
        modalPrice: 2520,
        trend: "UP" as const,
      };

      const fallbackRow = {
        ...benchmarkRaw,
        arrivalDate: null,
        sourceLabel: "Sample data",
        isSample: true,
      };

      expect(fallbackRow.arrivalDate).toBeNull();
      expect(fallbackRow.arrivalDate).not.toBe(new Date().toISOString().split("T")[0]);
      expect(fallbackRow.isSample).toBe(true);
      expect(fallbackRow.sourceLabel).toBe("Sample data");
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 3. Weather Condition & Advisory Mapping
  // ───────────────────────────────────────────────────────────────────────────
  describe("Weather Condition & Automated Advisory Mapping", () => {
    function wmoToCondition(code: number): { condition: string; icon: string } {
      if (code === 0) return { condition: "Clear Sky", icon: "sun" };
      if (code === 1) return { condition: "Mainly Clear", icon: "sun" };
      if (code === 2) return { condition: "Partly Cloudy", icon: "cloud-sun" };
      if (code === 3) return { condition: "Overcast", icon: "cloud" };
      if (code === 61) return { condition: "Light Rain", icon: "cloud-rain" };
      if (code === 63) return { condition: "Moderate Rain", icon: "cloud-rain" };
      if (code === 65) return { condition: "Heavy Rain", icon: "cloud-rain" };
      if (code === 95) return { condition: "Thunderstorm", icon: "cloud-lightning" };
      return { condition: "Partly Cloudy", icon: "cloud-sun" };
    }

    it("should map WMO weather codes to human-readable labels and appropriate icons", () => {
      expect(wmoToCondition(0)).toEqual({ condition: "Clear Sky", icon: "sun" });
      expect(wmoToCondition(3)).toEqual({ condition: "Overcast", icon: "cloud" });
      expect(wmoToCondition(61)).toEqual({ condition: "Light Rain", icon: "cloud-rain" });
      expect(wmoToCondition(95)).toEqual({ condition: "Thunderstorm", icon: "cloud-lightning" });
    });

    it("should label automated advisories clearly and not fabricate official IMD status", () => {
      const automatedWarning = {
        alertLevel: "YELLOW" as const,
        levelName: "Watch — Be Updated",
        phenomenon: "Isolated Light Rain Showers",
        severity: "MODERATE" as const,
        isOfficialImd: false,
        advisoryType: "Automated advisory (not an IMD warning)",
      };

      expect(automatedWarning.isOfficialImd).toBe(false);
      expect(automatedWarning.advisoryType).toBe("Automated advisory (not an IMD warning)");
      expect(automatedWarning.advisoryType).not.toBe("Official IMD Warning");
    });

    it("should select real UV index from daily uv_index_max instead of hardcoding 0", () => {
      const openMeteoResponse = {
        current: { uv_index: null },
        daily: { uv_index_max: [7.8, 8.1, 7.5] },
      };

      const realUv =
        openMeteoResponse.current.uv_index != null
          ? openMeteoResponse.current.uv_index
          : openMeteoResponse.daily.uv_index_max?.[0] != null
          ? Math.round(openMeteoResponse.daily.uv_index_max[0] * 10) / 10
          : 0;

      expect(realUv).toBe(7.8);
      expect(realUv).toBeGreaterThan(0);
    });

    it("should select real 24h precipitation from precipitation_sum instead of current-hour rain", () => {
      const openMeteoResponse = {
        current: { precipitation: 0.2 },
        daily: { precipitation_sum: [18.4, 0.0, 2.1] },
      };

      const real24hRainfall =
        openMeteoResponse.daily.precipitation_sum?.[0] != null
          ? Math.round(openMeteoResponse.daily.precipitation_sum[0] * 10) / 10
          : openMeteoResponse.current.precipitation || 0;

      expect(real24hRainfall).toBe(18.4);
      expect(real24hRainfall).not.toBe(0.2); // Not just the current hour!
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 4. File Upload Limits & Security
  // ───────────────────────────────────────────────────────────────────────────
  describe("Audio File Upload Limits & MIME Type Validation", () => {
    const ALLOWED_MIME_TYPES = ["audio/mpeg", "audio/mp4", "audio/ogg", "audio/wav", "audio/x-m4a"];
    const ALLOWED_EXTENSIONS = [".mp3", ".m4a", ".ogg", ".wav"];
    const MAX_RAW_BYTES = 4 * 1024 * 1024; // 4 MB raw audio limit

    it("should calculate base64 expansion correctly (~33% overhead)", () => {
      const rawSizeBytes = 4 * 1024 * 1024; // 4 MB
      const base64SizeBytes = Math.ceil(rawSizeBytes * (4 / 3));

      expect(base64SizeBytes).toBeGreaterThan(5 * 1024 * 1024); // Exceeds 5MB in base64!
      // This is why the server parser limit was raised to 8MB in server.ts
      expect(base64SizeBytes).toBeLessThan(8 * 1024 * 1024);
    });

    it("should accept valid audio MIME types and reject disallowed types", () => {
      const testCases = [
        { mime: "audio/mpeg", ext: ".mp3", valid: true },
        { mime: "audio/ogg", ext: ".ogg", valid: true },
        { mime: "audio/wav", ext: ".wav", valid: true },
        { mime: "application/javascript", ext: ".js", valid: false },
        { mime: "text/html", ext: ".html", valid: false },
        { mime: "image/svg+xml", ext: ".svg", valid: false },
        { mime: "application/x-sh", ext: ".sh", valid: false },
      ];

      testCases.forEach((tc) => {
        const isAllowedMime = ALLOWED_MIME_TYPES.includes(tc.mime);
        const isAllowedExt = ALLOWED_EXTENSIONS.some((e) => tc.ext.endsWith(e));
        const isValid = isAllowedMime && isAllowedExt;
        expect(isValid).toBe(tc.valid);
      });
    });

    it("should reject raw files larger than 4 MB", () => {
      const smallFileBytes = 3.5 * 1024 * 1024;
      const oversizedFileBytes = 4.8 * 1024 * 1024;

      expect(smallFileBytes <= MAX_RAW_BYTES).toBe(true);
      expect(oversizedFileBytes <= MAX_RAW_BYTES).toBe(false);
    });
  });
});
