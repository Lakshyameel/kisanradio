import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  parseRssFeed,
  extractPRID,
  matchesAgricultureMinistry,
  matchesKeywordTitle,
  extractMinistryFromHtml,
  NewsIngestService,
  DEFAULT_PIB_SOURCE_URL,
  DEFAULT_PIB_SOURCE_NAME,
} from "../src/services/news-ingest.service.js";
import prisma from "../src/prisma.js";

describe("PIB Agriculture News Ingestion Service", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 1. PRID Extraction
  // ───────────────────────────────────────────────────────────────────────────
  describe("PRID Extraction", () => {
    it("should extract PRID from standard PIB query string", () => {
      const link1 = "https://pib.gov.in/PressReleaseIframePage.aspx?PRID=2329825";
      const link2 = "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2329372&reg=48&lang=2";
      expect(extractPRID(link1)).toBe("2329825");
      expect(extractPRID(link2)).toBe("2329372");
    });

    it("should handle links with multiple params or lowercase prid", () => {
      const link = "https://pib.gov.in/view.aspx?foo=bar&prid=9991234&baz=qux";
      expect(extractPRID(link)).toBe("9991234");
    });

    it("should return null when PRID is not present", () => {
      expect(extractPRID("https://pib.gov.in/Index.aspx")).toBeNull();
      expect(extractPRID("")).toBeNull();
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 2. RSS Feed XML Parsing
  // ───────────────────────────────────────────────────────────────────────────
  describe("Feed Parsing", () => {
    it("should parse RSS items into title, link, and prid", () => {
      const sampleXml = `<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0">
  <channel>
    <title>PIB Releases</title>
    <item>
      <title>खेत बचाओ अभियान के तहत वैज्ञानिकों ने किसानों से किया सीधा संवाद</title>
      <link>https://pib.gov.in/PressReleaseIframePage.aspx?PRID=2329372</link>
    </item>
    <item>
      <title>रक्षा मंत्री ने 13वीं आसियान बैठक में भाग लिया</title>
      <link>https://pib.gov.in/PressReleaseIframePage.aspx?PRID=2329828</link>
    </item>
  </channel>
</rss>`;

      const items = parseRssFeed(sampleXml);
      expect(items.length).toBe(2);
      expect(items[0]).toEqual({
        title: "खेत बचाओ अभियान के तहत वैज्ञानिकों ने किसानों से किया सीधा संवाद",
        link: "https://pib.gov.in/PressReleaseIframePage.aspx?PRID=2329372",
        prid: "2329372",
      });
      expect(items[1].prid).toBe("2329828");
    });

    it("should gracefully handle empty or malformed XML", () => {
      expect(parseRssFeed("")).toEqual([]);
      expect(parseRssFeed("<rss><channel></channel></rss>")).toEqual([]);
      expect(parseRssFeed("Invalid XML string")).toEqual([]);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 3. Ministry Matching (Live PIB verified patterns)
  // ───────────────────────────────────────────────────────────────────────────
  describe("Ministry Matcher", () => {
    it("should extract ministry name from PIB HTML release element", () => {
      const htmlWithId = `
        <div class="innner-page-main-about-us-content-right-part">
          <div id="ContentPlaceHolder1_MinistryName" class="MinistryNameSubhead text-center">
            कृषि एवं किसान कल्‍याण मंत्रालय
          </div>
          <h2>दिल्ली देहात में ‘खेत बचाओ अभियान’</h2>
        </div>`;
      expect(extractMinistryFromHtml(htmlWithId)).toBe("कृषि एवं किसान कल्‍याण मंत्रालय");

      const htmlWithClass = `
        <div class="MinistryNameSubhead text-center">
          Ministry of Agriculture & Farmers Welfare
        </div>`;
      expect(extractMinistryFromHtml(htmlWithClass)).toBe("Ministry of Agriculture & Farmers Welfare");
    });

    it("should match Agriculture ministry across known Hindi and English variants", () => {
      // 1. Standard Hindi "एवं"
      expect(matchesAgricultureMinistry("कृषि एवं किसान कल्याण मंत्रालय")).toBe(true);
      // 2. Hindi "और"
      expect(matchesAgricultureMinistry("कृषि और किसान कल्याण मंत्रालय")).toBe(true);
      // 3. Live PIB glyph variant with half-la (कल्‍याण)
      expect(matchesAgricultureMinistry("कृषि एवं किसान कल्‍याण मंत्रालय")).toBe(true);
      expect(matchesAgricultureMinistry("कृषि और किसान कल्‍याण मंत्रालय")).toBe(true);
      // 4. English variants
      expect(matchesAgricultureMinistry("Ministry of Agriculture & Farmers Welfare")).toBe(true);
      expect(matchesAgricultureMinistry("MINISTRY OF AGRICULTURE AND FARMERS WELFARE")).toBe(true);
      expect(matchesAgricultureMinistry("Ministry of Agriculture")).toBe(true);
    });

    it("should NOT match non-agriculture ministries", () => {
      expect(matchesAgricultureMinistry("रक्षा मंत्रालय")).toBe(false);
      expect(matchesAgricultureMinistry("संचार मंत्रालय")).toBe(false);
      expect(matchesAgricultureMinistry("वाणिज्‍य एवं उद्योग मंत्रालय")).toBe(false);
      expect(matchesAgricultureMinistry("शिक्षा मंत्रालय")).toBe(false);
      expect(matchesAgricultureMinistry("नवीन एवं नवीकरणीय ऊर्जा मंत्रालय")).toBe(false);
      expect(matchesAgricultureMinistry("Ministry of Defence")).toBe(false);
      expect(matchesAgricultureMinistry("Ministry of Finance")).toBe(false);
      expect(matchesAgricultureMinistry("Ministry of Railways")).toBe(false);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 4. Whole-Word Keyword Fallback & Negative Fixtures
  // ───────────────────────────────────────────────────────────────────────────
  describe("Keyword Fallback & Negative Fixtures", () => {
    it("should match whole-word agricultural keywords in title when page cannot be read", () => {
      expect(matchesKeywordTitle("देश में गेहूं और धान की फसल की पैदावार में बढ़ोतरी")).toBe(true); // गेहूं, धान, फसल
      expect(matchesKeywordTitle("किसानों के हित में नई एमएसपी दरें लागू")).toBe(true); // किसानों, एमएसपी
      expect(matchesKeywordTitle("मंडी में दलहन और तिलहन की रिकॉर्ड आवक दर्ज")).toBe(true); // मंडी, दलहन, तिलहन
      expect(matchesKeywordTitle("आधुनिक कृषि और सिंचाई तकनीकों पर कार्यशाला")).toBe(true); // कृषि, सिंचाई
      expect(matchesKeywordTitle("खेती में रासायनिक उर्वरक के संतुलित प्रयोग की सलाह")).toBe(true); // खेती, उर्वरक
      expect(matchesKeywordTitle("New digital portal for farmer crop insurance")).toBe(true); // farmer, crop
      expect(matchesKeywordTitle("Union cabinet approves MSP increase")).toBe(true); // MSP
      expect(matchesKeywordTitle("Record procurement in mandi centers")).toBe(true); // mandi
      expect(matchesKeywordTitle("Sustainable agriculture in India")).toBe(true); // agriculture
    });

    it("must NOT save negative fixtures (non-agriculture topics)", () => {
      // Prompt requirement: "Negative fixtures that must NOT be saved:
      // BRICS parliamentary forum, railway station master recruitment, Navy exercise, toll pass"
      const negativeFixtures = [
        "ब्रिक्स संसदीय मंच में भारत का प्रतिनिधित्व (BRICS parliamentary forum)",
        "रेलवे स्टेशन मास्टर भर्ती परीक्षा परिणाम घोषित (railway station master recruitment)",
        "भारतीय नौसेना का संयुक्त द्विपक्षीय युद्धाभ्यास संपन्न (Navy exercise)",
        "राष्ट्रीय राजमार्गों पर नए फास्टैग टोल पास नियम लागू (toll pass)",
      ];

      for (const title of negativeFixtures) {
        expect(matchesKeywordTitle(title)).toBe(false);
      }
    });

    it("must NOT match excluded words (ग्रामीण, मौसम, बारिश, बीज substring, rural, weather)", () => {
      expect(matchesKeywordTitle("ग्रामीण विकास मंत्रालय की नई आवास योजना")).toBe(false);
      expect(matchesKeywordTitle("मौसम विभाग ने भारी बारिश की चेतावनी जारी की")).toBe(false);
      expect(matchesKeywordTitle("ग्रामीण आजीविका मिशन के तहत स्वयं सहायता समूह")).toBe(false);
      expect(matchesKeywordTitle("Heavy weather and rainfall warning for coastal region")).toBe(false);
      expect(matchesKeywordTitle("Rural roads development and highway connectivity")).toBe(false);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 5. Ingestion Pipeline: NewsChecked Prevents Re-fetching & Retries
  // ───────────────────────────────────────────────────────────────────────────
  describe("Ingestion Pipeline & NewsChecked", () => {
    const service = new NewsIngestService();
    const mockSource = {
      id: "source-test-001",
      name: DEFAULT_PIB_SOURCE_NAME,
      url: DEFAULT_PIB_SOURCE_URL,
      language: "hi",
    };

    beforeEach(async () => {
      await prisma.newsArticle.deleteMany();
      await prisma.newsChecked.deleteMany();
      await prisma.newsSource.deleteMany();

      await prisma.newsSource.create({
        data: {
          id: mockSource.id,
          name: mockSource.name,
          url: mockSource.url,
          language: mockSource.language,
          enabled: true,
        },
      });
    });

    it("should save matching Agriculture release and record SAVED in NewsChecked", async () => {
      const mockXml = `<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0">
  <channel>
    <item>
      <title>दिल्ली देहात में खेत बचाओ अभियान का आयोजन</title>
      <link>https://pib.gov.in/PressReleasePage.aspx?PRID=9001</link>
    </item>
  </channel>
</rss>`;

      const mockReleaseHtml = `
        <html><body>
          <div id="ContentPlaceHolder1_MinistryName" class="MinistryNameSubhead">
            कृषि एवं किसान कल्‍याण मंत्रालय
          </div>
          <h2>दिल्ली देहात में खेत बचाओ अभियान</h2>
        </body></html>`;

      globalThis.fetch = vi.fn().mockImplementation(async (url: string) => {
        if (url.includes("RssMain.aspx")) {
          return {
            ok: true,
            status: 200,
            text: async () => mockXml,
            url,
          } as any;
        }
        if (url.includes("PRID=9001")) {
          return {
            ok: true,
            status: 200,
            text: async () => mockReleaseHtml,
            url,
          } as any;
        }
        return { ok: false, status: 404, text: async () => "", url } as any;
      });

      const res = await service.ingestSource(mockSource, { pageFetchDelayMs: 0 });

      expect(res.savedCount).toBe(1);
      expect(res.ministryMatchedCount).toBe(1);

      // Verify NewsArticle created in DB
      const article = await prisma.newsArticle.findFirst({
        where: { externalId: "9001" },
      });
      expect(article).not.toBeNull();
      expect(article?.matchedBy).toBe("MINISTRY");
      expect(article?.ministry).toBe("कृषि एवं किसान कल्‍याण मंत्रालय");

      // Verify NewsChecked recorded as SAVED
      const checked = await prisma.newsChecked.findFirst({
        where: { externalId: "9001" },
      });
      expect(checked?.result).toBe("SAVED");
      expect(checked?.attempts).toBe(1);
    });

    it("should prevent re-fetching when PRID is already in NewsChecked (SAVED or SKIPPED)", async () => {
      // Pre-populate NewsChecked with 9002 (SAVED) and 9003 (SKIPPED)
      await prisma.newsChecked.createMany({
        data: [
          { sourceId: mockSource.id, externalId: "9002", result: "SAVED", attempts: 1 },
          { sourceId: mockSource.id, externalId: "9003", result: "SKIPPED", attempts: 1 },
        ],
      });

      const mockXml = `<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0">
  <channel>
    <item>
      <title>Article Already Saved</title>
      <link>https://pib.gov.in/PressReleasePage.aspx?PRID=9002</link>
    </item>
    <item>
      <title>Article Already Skipped</title>
      <link>https://pib.gov.in/PressReleasePage.aspx?PRID=9003</link>
    </item>
  </channel>
</rss>`;

      const fetchSpy = vi.fn().mockImplementation(async (url: string) => {
        if (url.includes("RssMain.aspx")) {
          return { ok: true, status: 200, text: async () => mockXml, url } as any;
        }
        return { ok: true, status: 200, text: async () => "Should not be called", url } as any;
      });
      globalThis.fetch = fetchSpy;

      const res = await service.ingestSource(mockSource, { pageFetchDelayMs: 0 });

      expect(res.itemsFound).toBe(2);
      expect(res.newItemsExamined).toBe(0); // Both skipped because already in NewsChecked
      expect(res.savedCount).toBe(0);

      // Verify no page fetch was made for 9002 or 9003
      const pageCalls = fetchSpy.mock.calls.filter((c: any) => c[0].includes("PressRelease"));
      expect(pageCalls.length).toBe(0);
    });

    it("should fall back to keyword match when page cannot be read, and save with KEYWORD", async () => {
      const mockXml = `<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0">
  <channel>
    <item>
      <title>किसानों के लिए गेहूं और धान की नई उन्नत किस्में जारी</title>
      <link>https://pib.gov.in/PressReleasePage.aspx?PRID=9004</link>
    </item>
  </channel>
</rss>`;

      globalThis.fetch = vi.fn().mockImplementation(async (url: string) => {
        if (url.includes("RssMain.aspx")) {
          return { ok: true, status: 200, text: async () => mockXml, url } as any;
        }
        // Page fetch fails (500 internal server error)
        return { ok: false, status: 500, text: async () => "Internal Error", url } as any;
      });

      const res = await service.ingestSource(mockSource, { pageFetchDelayMs: 0 });

      expect(res.savedCount).toBe(1);
      expect(res.keywordMatchedCount).toBe(1);

      const article = await prisma.newsArticle.findFirst({
        where: { externalId: "9004" },
      });
      expect(article).not.toBeNull();
      expect(article?.matchedBy).toBe("KEYWORD");
      expect(article?.ministry).toBeNull();

      const checked = await prisma.newsChecked.findFirst({
        where: { externalId: "9004" },
      });
      expect(checked?.result).toBe("SAVED");
    });

    it("should mark unreadable non-keyword items as UNREADABLE and stop after 3 attempts", async () => {
      // 1st run: PRID 9005 fails and title has no agri keywords
      const mockXml = `<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0">
  <channel>
    <item>
      <title>रेलवे स्टेशन मास्टर भर्ती परीक्षा परिणाम घोषित (railway station master recruitment)</title>
      <link>https://pib.gov.in/PressReleasePage.aspx?PRID=9005</link>
    </item>
  </channel>
</rss>`;

      globalThis.fetch = vi.fn().mockImplementation(async (url: string) => {
        if (url.includes("RssMain.aspx")) {
          return { ok: true, status: 200, text: async () => mockXml, url } as any;
        }
        return { ok: false, status: 500, text: async () => "Error", url } as any;
      });

      // Run 1: attempt 1
      await service.ingestSource(mockSource, { pageFetchDelayMs: 0 });
      let checked = await prisma.newsChecked.findFirst({ where: { externalId: "9005" } });
      expect(checked?.result).toBe("UNREADABLE");
      expect(checked?.attempts).toBe(1);

      // Run 2: attempt 2
      await service.ingestSource(mockSource, { pageFetchDelayMs: 0 });
      checked = await prisma.newsChecked.findFirst({ where: { externalId: "9005" } });
      expect(checked?.attempts).toBe(2);

      // Run 3: attempt 3
      await service.ingestSource(mockSource, { pageFetchDelayMs: 0 });
      checked = await prisma.newsChecked.findFirst({ where: { externalId: "9005" } });
      expect(checked?.attempts).toBe(3);

      // Run 4: attempts >= 3 => must be skipped completely
      const res4 = await service.ingestSource(mockSource, { pageFetchDelayMs: 0 });
      expect(res4.newItemsExamined).toBe(0);
      checked = await prisma.newsChecked.findFirst({ where: { externalId: "9005" } });
      expect(checked?.attempts).toBe(3); // untouched
    });

    it("should keep existing rows on failure and update lastStatus without crashing", async () => {
      // Pre-existing article
      await prisma.newsArticle.create({
        data: {
          sourceId: mockSource.id,
          externalId: "9006",
          title: "Pre-existing Agriculture Article",
          link: "https://pib.gov.in/PressReleasePage.aspx?PRID=9006",
          matchedBy: "MINISTRY",
          ministry: "Ministry of Agriculture & Farmers Welfare",
        },
      });

      // Simulate network crash during RSS fetch
      globalThis.fetch = vi.fn().mockRejectedValue(new Error("Connection reset by peer"));

      const res = await service.ingestSource(mockSource, { pageFetchDelayMs: 0 });

      expect(res.status).toBe("FAILED");
      expect(res.error).toContain("Connection reset by peer");

      // Verify existing rows are preserved
      const existing = await prisma.newsArticle.findMany();
      expect(existing.length).toBe(1);
      expect(existing[0].externalId).toBe("9006");

      // Verify source lastStatus is updated
      const updatedSource = await prisma.newsSource.findUnique({
        where: { id: mockSource.id },
      });
      expect(updatedSource?.lastStatus).toContain("FAILED: Connection reset by peer");
      expect(updatedSource?.lastFetchedAt).not.toBeNull();
    });
  });
});
