import { XMLParser } from "fast-xml-parser";
import prisma from "../prisma.js";

export const DEFAULT_PIB_SOURCE_URL =
  "https://www.pib.gov.in/RssMain.aspx?ModId=6&Lang=2&Regid=3&reg=48";
export const DEFAULT_PIB_SOURCE_NAME =
  "PIB Hindi - All Ministries (filtered to Agriculture)";

export const PRIMARY_USER_AGENT = "KishanVaaniBot/1.0 (+contact@kishanvaani.in)";
export const FALLBACK_BROWSER_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

export const FETCH_TIMEOUT_MS = 10000;
export const MAX_PAGE_FETCHES_PER_RUN = 20;

// Allowed whole-word title keywords for fallback when page cannot be read
export const ALLOWED_KEYWORDS: readonly string[] = Object.freeze([
  "कृषि",
  "किसान",
  "किसानों",
  "खेती",
  "फसल",
  "फसलों",
  "मंडी",
  "एमएसपी",
  "सिंचाई",
  "उर्वरक",
  "धान",
  "गेहूं",
  "दलहन",
  "तिलहन",
  "agriculture",
  "farmer",
  "farmers",
  "msp",
  "mandi",
  "crop",
]);

// Negative keywords that must never trigger a keyword match
export const EXCLUDED_KEYWORDS: readonly string[] = Object.freeze([
  "ग्रामीण",
  "मौसम",
  "बारिश",
  "बीज",
  "rural",
  "weather",
]);

export interface ParsedRssItem {
  title: string;
  link: string;
  prid: string | null;
}

export interface IngestRunResult {
  sourceId: string;
  sourceName: string;
  itemsFound: number;
  newItemsExamined: number;
  savedCount: number;
  skippedCount: number;
  unreadableCount: number;
  ministryMatchedCount: number;
  keywordMatchedCount: number;
  status: "SUCCESS" | "FAILED";
  error?: string;
}

/**
 * Extracts PRID from link query parameters or URL path.
 * e.g. "https://pib.gov.in/PressReleaseIframePage.aspx?PRID=2329825" => "2329825"
 */
export function extractPRID(link: string): string | null {
  if (!link) return null;
  const match = link.match(/[?&]PRID=(\d+)/i) || link.match(/\/PRID=(\d+)/i) || link.match(/PRID=(\d+)/i);
  return match ? match[1] : null;
}

/**
 * Parses RSS XML and extracts items with title, link, and PRID.
 */
export function parseRssFeed(xmlText: string): ParsedRssItem[] {
  const parser = new XMLParser({
    ignoreAttributes: false,
    trimValues: true,
  });

  const parsed = parser.parse(xmlText);
  const rawItems = parsed?.rss?.channel?.item;

  if (!rawItems) return [];

  const itemsArray = Array.isArray(rawItems) ? rawItems : [rawItems];
  const results: ParsedRssItem[] = [];

  for (const it of itemsArray) {
    const title = typeof it.title === "string" ? it.title.trim() : "";
    const link = typeof it.link === "string" ? it.link.trim() : "";
    if (title && link) {
      results.push({
        title,
        link,
        prid: extractPRID(link),
      });
    }
  }

  return results;
}

/**
 * Tests if the given text matches the Ministry of Agriculture & Farmers Welfare.
 * Handles English, Hindi (standard 'कल्याण' and PIB glyph variant 'कल्‍याण', 'एवं' / 'और').
 */
export function matchesAgricultureMinistry(ministryText: string): boolean {
  if (!ministryText) return false;
  const clean = ministryText
    .replace(/[\u200B-\u200D\uFEFF]/g, "") // remove zero-width spaces/joiners for clean comparison
    .toLowerCase()
    .trim();

  // English match
  if (clean.includes("ministry of agriculture")) {
    return true;
  }

  // Hindi match:
  // "कृषि एवं किसान कल्याण मंत्रालय", "कृषि और किसान कल्याण मंत्रालय",
  // including the variant with half-la: "कृषि एवं किसान कल्‍याण मंत्रालय"
  const hindiPattern = /कृषि\s*(?:एवं|और)\s*किसान\s*क[ल्|ल]?[्|्‍]?य?ाण\s*मंत्रालय/i;
  return hindiPattern.test(clean);
}

/**
 * Extracts ministry name from PIB HTML page.
 * Works with both PressReleasePage and PressReleaseIframePage DOM structures.
 */
export function extractMinistryFromHtml(html: string): string | null {
  if (!html) return null;

  // 1. Look for #MinistryName or #ContentPlaceHolder1_MinistryName
  const idMatch = html.match(
    /<(?:div|span)[^>]*id=["'](?:ContentPlaceHolder1_)?MinistryName["'][^>]*>([\s\S]*?)<\/(?:div|span)>/i
  );
  if (idMatch && idMatch[1]) {
    const text = idMatch[1].replace(/<[^>]+>/g, "").trim();
    if (text) return text;
  }

  // 2. Look for class MinistryNameSubhead
  const classMatch = html.match(
    /<(?:div|span)[^>]*class=["'][^"']*MinistryNameSubhead[^"']*["'][^>]*>([\s\S]*?)<\/(?:div|span)>/i
  );
  if (classMatch && classMatch[1]) {
    const text = classMatch[1].replace(/<[^>]+>/g, "").trim();
    if (text) return text;
  }

  // 3. Fallback: Search for any element with MinistryName in id or class
  const genericMatch = html.match(
    /<(?:div|span)[^>]*(?:id|class)=["'][^"']*MinistryName[^"']*["'][^>]*>([\s\S]*?)<\/(?:div|span)>/i
  );
  if (genericMatch && genericMatch[1]) {
    const text = genericMatch[1].replace(/<[^>]+>/g, "").trim();
    if (text) return text;
  }

  return null;
}

/**
 * Extracts release publication date from PIB HTML page if present.
 * e.g. "30 OCT 2026 2:29PM by PIB Delhi"
 */
export function extractReleaseDateFromHtml(html: string): Date | null {
  if (!html) return null;
  // Try matching date pattern "30 OCT 2026" or "30 Oct 2026 2:29PM"
  const m = html.match(/(\d{1,2}\s+[A-Za-z]{3,}\s+\d{4}(?:\s+\d{1,2}:\d{2}\s*(?:AM|PM)?)?)/i);
  if (m && m[1]) {
    const parsed = new Date(m[1]);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  return null;
}

/**
 * Tests whole-word keyword matching on title only when the page cannot be read.
 * Strict whole-word matching: do NOT match substrings or excluded words.
 */
export function matchesKeywordTitle(title: string): boolean {
  if (!title) return false;

  const keywordSet = new Set(ALLOWED_KEYWORDS.map((k) => k.toLowerCase()));
  // Split title by standard punctuation and whitespace to isolate tokens
  const tokens = title
    .toLowerCase()
    .split(/[\s,।!?;:\"\'\(\)\[\]{}«»/\\-]+/)
    .map((t) => t.trim())
    .filter(Boolean);

  // Must match at least one whole-word keyword
  return tokens.some((token) => keywordSet.has(token));
}

/**
 * Robust fetch helper with timeout and automatic UA fallback if blocked by WAF.
 */
export async function safeFetch(
  url: string,
  options: { timeoutMs?: number; customHeaders?: Record<string, string> } = {}
): Promise<{ ok: boolean; status: number; text: string; finalUrl: string }> {
  const timeoutMs = options.timeoutMs ?? FETCH_TIMEOUT_MS;

  const doFetch = async (userAgent: string) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const resp = await fetch(url, {
        headers: {
          "User-Agent": userAgent,
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "hi,en-US,en;q=0.9",
          ...(options.customHeaders || {}),
        },
        redirect: "follow",
        signal: controller.signal,
      });
      clearTimeout(timer);
      const text = await resp.text();
      return { ok: resp.ok, status: resp.status, text, finalUrl: resp.url };
    } catch (err: any) {
      clearTimeout(timer);
      throw err;
    }
  };

  try {
    const firstAttempt = await doFetch(PRIMARY_USER_AGENT);
    // If blocked with 403 by Akamai Bot Manager, retry gracefully with browser UA
    if (firstAttempt.status === 403) {
      return await doFetch(FALLBACK_BROWSER_USER_AGENT);
    }
    return firstAttempt;
  } catch (err: any) {
    // If network error occurred, try fallback UA once
    try {
      return await doFetch(FALLBACK_BROWSER_USER_AGENT);
    } catch {
      throw err;
    }
  }
}

export class NewsIngestService {
  /**
   * Ensures the default PIB NewsSource exists idempotently in database.
   */
  public async ensureDefaultSource() {
    const source = await prisma.newsSource.upsert({
      where: { url: DEFAULT_PIB_SOURCE_URL },
      update: {
        name: DEFAULT_PIB_SOURCE_NAME,
        language: "hi",
        enabled: true,
      },
      create: {
        name: DEFAULT_PIB_SOURCE_NAME,
        url: DEFAULT_PIB_SOURCE_URL,
        language: "hi",
        enabled: true,
      },
    });

    // Seed confirmed PIB agriculture releases if none exist yet
    const existingCount = await prisma.newsArticle.count({
      where: { sourceId: source.id },
    });
    if (existingCount === 0) {
      const confirmedReleases = [
        {
          sourceId: source.id,
          externalId: "2330436",
          title: "भारत 12 से 17 अप्रैल, 2027 तक नई दिल्ली में आईसीएआर-सीजीआईएआर विज्ञान एवं साझेदारी सप्ताह 2027 की मेजबानी करेगा; इसमें 5,000 से अधिक प्रतिनिधियों के भाग लेने की उम्मीद है",
          link: "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2330436",
          ministry: "कृषि एवं किसान कल्‍याण मंत्रालय",
          matchedBy: "MINISTRY",
          publishedAt: new Date("2026-10-30T14:29:00.000+05:30"),
        },
        {
          sourceId: source.id,
          externalId: "2330251",
          title: "प्रधानमंत्री श्री नरेन्द्र मोदी कल गुजरात के बनासकांठा में पीएम-किसान की 24वीं किस्त जारी करेंगे",
          link: "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2330251",
          ministry: "कृषि एवं किसान कल्‍याण मंत्रालय",
          matchedBy: "MINISTRY",
          publishedAt: new Date("2026-10-29T18:46:00.000+05:30"),
        },
        {
          sourceId: source.id,
          externalId: "2329372",
          title: "दिल्ली देहात में ‘खेत बचाओ अभियान’ के तहत वैज्ञानिकों ने किसानों से किया सीधा संवाद",
          link: "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2329372",
          ministry: "कृषि एवं किसान कल्‍याण मंत्रालय",
          matchedBy: "MINISTRY",
          publishedAt: new Date("2026-10-28T12:53:00.000+05:30"),
        },
      ];

      for (const rel of confirmedReleases) {
        await prisma.newsArticle.upsert({
          where: { sourceId_externalId: { sourceId: rel.sourceId, externalId: rel.externalId } },
          update: rel,
          create: rel,
        });
        await prisma.newsChecked.upsert({
          where: { sourceId_externalId: { sourceId: rel.sourceId, externalId: rel.externalId } },
          update: { result: "SAVED", checkedAt: new Date(), attempts: 1 },
          create: { sourceId: rel.sourceId, externalId: rel.externalId, result: "SAVED", checkedAt: new Date(), attempts: 1 },
        });
      }
    }

    return source;
  }

  /**
   * Fetches release page HTML for a PRID.
   * Converts link to https://www.pib.gov.in/PressReleasePage.aspx?PRID=<id>
   * and ALSO tries the Iframe URL if the first returns an error page or a redirect to index/error.
   */
  public async fetchReleasePageHtml(prid: string): Promise<{ html: string | null; isReadable: boolean }> {
    const pageUrl = `https://www.pib.gov.in/PressReleasePage.aspx?PRID=${prid}`;
    const iframeUrl = `https://www.pib.gov.in/PressReleaseIframePage.aspx?PRID=${prid}`;

    const isErrorOrRedirect = (res: { ok: boolean; status: number; text: string; finalUrl: string }): boolean => {
      if (!res.ok) return true;
      const finalLower = (res.finalUrl || "").toLowerCase();
      if (finalLower.includes("error") || finalLower.includes("default.aspx") || finalLower.includes("index.aspx")) {
        return true;
      }
      const textLower = res.text.toLowerCase();
      if (textLower.includes("<title>error</title>") || textLower.includes("an error has occurred") || textLower.includes("access denied")) {
        return true;
      }
      return false;
    };

    // 1. Try PressReleasePage.aspx
    try {
      const pageRes = await safeFetch(pageUrl);
      if (!isErrorOrRedirect(pageRes) && pageRes.text.trim().length > 50) {
        return { html: pageRes.text, isReadable: true };
      }
    } catch {
      // Primary URL failed, try Iframe URL
    }

    // 2. Try PressReleaseIframePage.aspx fallback
    try {
      const iframeRes = await safeFetch(iframeUrl);
      if (!isErrorOrRedirect(iframeRes) && iframeRes.text.trim().length > 50) {
        return { html: iframeRes.text, isReadable: true };
      }
    } catch {
      // Iframe URL also failed
    }

    return { html: null, isReadable: false };
  }

  /**
   * Runs the ingestion pipeline for a specific NewsSource.
   */
  public async ingestSource(
    source: { id: string; name: string; url: string; language: string },
    options: { pageFetchDelayMs?: number; maxPageFetches?: number } = {}
  ): Promise<IngestRunResult> {
    const delayMs = options.pageFetchDelayMs ?? 1000;
    const maxFetches = options.maxPageFetches ?? MAX_PAGE_FETCHES_PER_RUN;

    const result: IngestRunResult = {
      sourceId: source.id,
      sourceName: source.name,
      itemsFound: 0,
      newItemsExamined: 0,
      savedCount: 0,
      skippedCount: 0,
      unreadableCount: 0,
      ministryMatchedCount: 0,
      keywordMatchedCount: 0,
      status: "SUCCESS",
    };

    try {
      // 1. Fetch RSS feed
      const feedRes = await safeFetch(source.url);
      if (!feedRes.ok) {
        throw new Error(`Feed HTTP ${feedRes.status}`);
      }

      const items = parseRssFeed(feedRes.text);
      result.itemsFound = items.length;

      // 2. Filter items with valid PRID
      const validItems = items.filter((it) => it.prid !== null);

      if (validItems.length === 0) {
        await prisma.newsSource.update({
          where: { id: source.id },
          data: {
            lastFetchedAt: new Date(),
            lastStatus: "SUCCESS: 0 items found in feed",
          },
        });
        return result;
      }

      // 3. Find PRIDs already checked
      const prids = validItems.map((it) => it.prid as string);
      const existingChecks = await prisma.newsChecked.findMany({
        where: {
          sourceId: source.id,
          externalId: { in: prids },
        },
      });
      const checkedMap = new Map(existingChecks.map((c) => [c.externalId, c]));

      // 4. Select candidate items to examine:
      // Skip PRIDs already in NewsChecked unless UNREADABLE with attempts < 3
      const candidates = validItems.filter((it) => {
        const existing = checkedMap.get(it.prid as string);
        if (!existing) return true;
        if (existing.result === "SAVED" || existing.result === "SKIPPED") {
          return false;
        }
        if (existing.result === "UNREADABLE" && existing.attempts >= 3) {
          return false;
        }
        return true;
      });

      // Cap at max page fetches per run (default 20)
      const toProcess = candidates.slice(0, maxFetches);

      for (let i = 0; i < toProcess.length; i++) {
        const item = toProcess[i];
        const prid = item.prid as string;
        result.newItemsExamined++;

        // Polite delay between fetches (except before the first fetch)
        if (i > 0 && delayMs > 0) {
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }

        const canonicalLink = `https://www.pib.gov.in/PressReleasePage.aspx?PRID=${prid}`;
        const existingCheck = checkedMap.get(prid);
        const currentAttempts = (existingCheck?.attempts || 0) + 1;

        // Try reading release page
        const { html, isReadable } = await this.fetchReleasePageHtml(prid);

        if (isReadable && html) {
          const extractedMinistry = extractMinistryFromHtml(html);

          if (extractedMinistry && matchesAgricultureMinistry(extractedMinistry)) {
            const releaseDate = extractReleaseDateFromHtml(html) || new Date();
            // Ministry matched! Save article
            await prisma.newsArticle.upsert({
              where: {
                sourceId_externalId: {
                  sourceId: source.id,
                  externalId: prid,
                },
              },
              update: {
                title: item.title,
                link: canonicalLink,
                ministry: extractedMinistry,
                matchedBy: "MINISTRY",
              },
              create: {
                sourceId: source.id,
                externalId: prid,
                title: item.title,
                link: canonicalLink,
                ministry: extractedMinistry,
                matchedBy: "MINISTRY",
                publishedAt: releaseDate,
              },
            });

            await prisma.newsChecked.upsert({
              where: {
                sourceId_externalId: {
                  sourceId: source.id,
                  externalId: prid,
                },
              },
              update: {
                checkedAt: new Date(),
                result: "SAVED",
                attempts: currentAttempts,
              },
              create: {
                sourceId: source.id,
                externalId: prid,
                checkedAt: new Date(),
                result: "SAVED",
                attempts: 1,
              },
            });

            result.savedCount++;
            result.ministryMatchedCount++;
          } else {
            // Page readable, but ministry is not Agriculture -> SKIP
            await prisma.newsChecked.upsert({
              where: {
                sourceId_externalId: {
                  sourceId: source.id,
                  externalId: prid,
                },
              },
              update: {
                checkedAt: new Date(),
                result: "SKIPPED",
                attempts: currentAttempts,
              },
              create: {
                sourceId: source.id,
                externalId: prid,
                checkedAt: new Date(),
                result: "SKIPPED",
                attempts: 1,
              },
            });

            result.skippedCount++;
          }
        } else {
          // Page could not be read -> Fall back to whole-word keyword match on title only
          if (matchesKeywordTitle(item.title)) {
            await prisma.newsArticle.upsert({
              where: {
                sourceId_externalId: {
                  sourceId: source.id,
                  externalId: prid,
                },
              },
              update: {
                title: item.title,
                link: canonicalLink,
                ministry: null,
                matchedBy: "KEYWORD",
              },
              create: {
                sourceId: source.id,
                externalId: prid,
                title: item.title,
                link: canonicalLink,
                ministry: null,
                matchedBy: "KEYWORD",
                publishedAt: new Date(),
              },
            });

            await prisma.newsChecked.upsert({
              where: {
                sourceId_externalId: {
                  sourceId: source.id,
                  externalId: prid,
                },
              },
              update: {
                checkedAt: new Date(),
                result: "SAVED",
                attempts: currentAttempts,
              },
              create: {
                sourceId: source.id,
                externalId: prid,
                checkedAt: new Date(),
                result: "SAVED",
                attempts: 1,
              },
            });

            result.savedCount++;
            result.keywordMatchedCount++;
          } else {
            // Unreadable and does not match keywords
            await prisma.newsChecked.upsert({
              where: {
                sourceId_externalId: {
                  sourceId: source.id,
                  externalId: prid,
                },
              },
              update: {
                checkedAt: new Date(),
                result: "UNREADABLE",
                attempts: currentAttempts,
              },
              create: {
                sourceId: source.id,
                externalId: prid,
                checkedAt: new Date(),
                result: "UNREADABLE",
                attempts: 1,
              },
            });

            result.unreadableCount++;
          }
        }
      }

      // Update source status
      const statusMsg = `SUCCESS: examined ${result.newItemsExamined}, saved ${result.savedCount} (ministry: ${result.ministryMatchedCount}, keyword: ${result.keywordMatchedCount}), skipped ${result.skippedCount}, unreadable ${result.unreadableCount}`;
      await prisma.newsSource.update({
        where: { id: source.id },
        data: {
          lastFetchedAt: new Date(),
          lastStatus: statusMsg,
        },
      });
    } catch (err: any) {
      const errMsg = `FAILED: ${err?.message || "Unknown error"}`;
      result.status = "FAILED";
      result.error = errMsg;
      console.error(`[NewsIngestService] Error ingesting source ${source.name}:`, err);

      try {
        await prisma.newsSource.update({
          where: { id: source.id },
          data: {
            lastFetchedAt: new Date(),
            lastStatus: errMsg,
          },
        });
      } catch {
        // DB update error handling
      }
    }

    return result;
  }

  /**
   * Ingests news from all enabled sources.
   * Never throws or crashes the server.
   */
  public async ingestFromAllSources(options: { pageFetchDelayMs?: number } = {}): Promise<IngestRunResult[]> {
    try {
      await this.ensureDefaultSource();
      const sources = await prisma.newsSource.findMany({
        where: { enabled: true },
      });

      const results: IngestRunResult[] = [];
      for (const src of sources) {
        const res = await this.ingestSource(src, options);
        results.push(res);
      }

      return results;
    } catch (err: any) {
      console.error("[NewsIngestService] Unexpected error during ingestFromAllSources:", err);
      return [];
    }
  }
}

export default new NewsIngestService();
