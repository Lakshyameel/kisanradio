import { AGRI_NEWS_DATA, KVK_DIRECTORY, AgriNewsItem, KvkCenterInfo } from "../data/agri-news.data.js";
import prisma from "../prisma.js";

// ── In-Memory Cache for Live News ───────────────────────────────────────────
let cachedNewsItems: AgriNewsItem[] = [];
let lastFetchedAt: number = 0;
const NEWS_CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

function parseRssXml(xml: string): Array<{
  title: string;
  link: string;
  guid: string;
  pubDate: string;
  description: string;
}> {
  const items: Array<{
    title: string;
    link: string;
    guid: string;
    pubDate: string;
    description: string;
  }> = [];

  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match: RegExpExecArray | null;

  while ((match = itemRegex.exec(xml)) !== null) {
    const itemBlock = match[1];

    const getTag = (tag: string) => {
      const tagRegex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
      const m = tagRegex.exec(itemBlock);
      if (!m) return "";
      let val = m[1].trim();
      if (val.startsWith("<![CDATA[") && val.endsWith("]]>")) {
        val = val.slice(9, -3).trim();
      }
      return val
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, " ");
    };

    const title = getTag("title");
    const link = getTag("link");
    const guid = getTag("guid") || link;
    const pubDate = getTag("pubDate");
    const description = getTag("description").replace(/<[^>]+>/g, "").trim();

    if (title && title.length > 5) {
      items.push({ title, link, guid, pubDate, description });
    }
  }

  return items;
}

function categorizeArticle(title: string, desc: string): {
  category: "SCHEMES" | "CROP_SCIENCE" | "PEST_ALERT" | "SUBSIDY_MSP" | "TECHNOLOGY" | "ORGANIC_NATURAL";
  categoryLabel: string;
} {
  const text = `${title} ${desc}`.toLowerCase();

  if (/msp|minimum support price|subsidy|bonus|procurement|rate|rupees|crore/.test(text)) {
    return { category: "SUBSIDY_MSP", categoryLabel: "MSP & Subsidies" };
  }
  if (/pest|disease|locust|rust|bollworm|fungus|spray|insect|infestation/.test(text)) {
    return { category: "PEST_ALERT", categoryLabel: "Pest & Disease Alert" };
  }
  if (/scheme|yojana|pm-kisan|kisan credit|fasal bima|pmfby|financial assistance|grant/.test(text)) {
    return { category: "SCHEMES", categoryLabel: "Govt Schemes" };
  }
  if (/organic|natural farming|vermicompost|zero budget|bio-fertilizer|ayush/.test(text)) {
    return { category: "ORGANIC_NATURAL", categoryLabel: "Organic & Natural Farming" };
  }
  if (/drone|drip|sprinkler|irrigation|solar|technology|sensor|ai|machinery|app|portal/.test(text)) {
    return { category: "TECHNOLOGY", categoryLabel: "AgriTech & Modern Tools" };
  }

  return { category: "CROP_SCIENCE", categoryLabel: "Crop Science & Agronomy" };
}

class AgriNewsService {
  /**
   * Fetches real news articles from database (NewsArticle ingested from PIB),
   * falling back to static benchmark data when no live rows exist yet.
   */
  public async ensureFeedData(): Promise<{ articles: AgriNewsItem[]; isLive: boolean; lastFetched: Date | null }> {
    const liveItems: AgriNewsItem[] = [];
    let lastFetched: Date | null = null;

    try {
      // 1. Fetch ingested NewsArticle records
      const [dbArticles, source] = await Promise.all([
        prisma.newsArticle.findMany({
          orderBy: { publishedAt: "desc" },
          include: { source: true },
        }),
        prisma.newsSource.findFirst({
          where: { enabled: true },
          orderBy: { lastFetchedAt: "desc" },
        }),
      ]);

      if (source?.lastFetchedAt) {
        lastFetched = source.lastFetchedAt;
      }

      if (dbArticles.length > 0) {
        for (const art of dbArticles) {
          const item: AgriNewsItem = {
            id: art.id,
            title: art.title,
            slug: `${slugify(art.title)}-${art.externalId}`,
            source: "MINISTRY",
            sourceName: art.ministry || art.source?.name || "Ministry of Agriculture & Farmers Welfare",
            ministryDivision: art.ministry || undefined,
            category: "SCHEMES",
            categoryLabel: art.matchedBy === "MINISTRY" ? "Official MoA&FW Release" : "Agriculture Key News",
            summary: art.title,
            fullBody: art.title,
            publishedAt: art.publishedAt.toISOString(),
            readTimeMin: 2,
            audioDurationSec: 120,
            audioUrl: "",
            narrator: "KishanVaani News Desk",
            language: art.source?.language === "hi" ? "Hindi" : "English",
            state: "All India",
            keyTakeaways: [art.title],
            actionItemsForFarmers: ["Check official advisories on PIB."],
            officialReferenceUrl: art.link,
            link: art.link,
            matchedBy: art.matchedBy,
            isUrgent: false,
            isTrending: true,
            isSample: false,
            isLive: true,
            sourceLabel: "PIB Live Feed",
            tags: ["PIB", "Agriculture", art.matchedBy === "MINISTRY" ? "Ministry Release" : "Keyword Match"],
          };
          liveItems.push(item);
        }
      }
    } catch (err) {
      console.error("[AgriNewsService] Error reading NewsArticle from database:", err);
    }

    const hasLiveNews = liveItems.length > 0;
    const combined: AgriNewsItem[] = [...liveItems];

    // Always include KVK scientific bulletins from benchmark directory for scientific advisory coverage
    const kvkBenchmarks = AGRI_NEWS_DATA.filter((n) => n.source === "KVK" || n.source === "ICAR");
    for (const kvk of kvkBenchmarks) {
      combined.push({
        ...kvk,
        isSample: !hasLiveNews,
        isLive: hasLiveNews,
      });
    }

    // If no live PIB articles are in DB yet, add static fallback ministry articles as samples
    if (!hasLiveNews) {
      const ministryBenchmarks = AGRI_NEWS_DATA.filter((n) => n.source === "MINISTRY" || n.source === "PIB");
      for (const item of ministryBenchmarks) {
        combined.push({
          ...item,
          isSample: true,
          isLive: false,
          sourceLabel: "Archived Sample",
        });
      }
    }

    combined.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    return {
      articles: combined,
      isLive: hasLiveNews,
      lastFetched,
    };
  }

  /**
   * Get filtered agricultural news with pagination and tokenised search on title
   */
  public async getNewsList(params: {
    source?: string;
    category?: string;
    state?: string;
    search?: string;
    dateFilter?: "TODAY" | "7DAYS" | "ALL" | string;
    limit?: number;
    page?: number;
  } = {}): Promise<{
    items: AgriNewsItem[];
    total: number;
    page: number;
    totalPages: number;
    ministryCount: number;
    kvkCount: number;
    fetchedAt: string;
    isLive: boolean;
  }> {
    const { source, category, state, search, dateFilter = "ALL", limit = 20, page = 1 } = params;

    const { articles: allArticles, isLive, lastFetched } = await this.ensureFeedData();
    let filtered = [...allArticles];

    // Filter by Date when user specifically selects TODAY or 7DAYS
    if (dateFilter === "TODAY") {
      const now = new Date();
      // Start of today in local date
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const endOfToday = startOfToday + 24 * 60 * 60 * 1000 - 1;

      filtered = filtered.filter((item) => {
        const itemTime = new Date(item.publishedAt).getTime();
        return itemTime >= startOfToday && itemTime <= endOfToday;
      });
    } else if (dateFilter === "7DAYS") {
      const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
      filtered = filtered.filter((item) => new Date(item.publishedAt).getTime() >= cutoff);
    }

    if (source && source !== "ALL") {
      filtered = filtered.filter((item) => item.source === source);
    }

    if (category && category !== "ALL") {
      filtered = filtered.filter((item) => item.category === category);
    }

    if (state && state !== "ALL") {
      const sLower = state.toLowerCase();
      filtered = filtered.filter(
        (item) => item.state?.toLowerCase().includes(sLower) || item.state === "All India"
      );
    }

    // Tokenised search on the title
    if (search && search.trim()) {
      const tokens = search.trim().toLowerCase().split(/\s+/).filter(Boolean);
      filtered = filtered.filter((item) =>
        tokens.every((tok) => item.title.toLowerCase().includes(tok))
      );
    }

    // Sort by publication date desc (latest first)
    filtered.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    const total = filtered.length;
    const startIndex = (page - 1) * limit;
    const paginatedItems = filtered.slice(startIndex, startIndex + limit);

    const ministryCount = allArticles.filter((i) => i.source === "MINISTRY" || i.source === "PIB").length;
    const kvkCount = allArticles.filter((i) => i.source === "KVK" || i.source === "ICAR").length;

    return {
      items: paginatedItems,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
      ministryCount,
      kvkCount,
      fetchedAt: lastFetched ? lastFetched.toISOString() : new Date().toISOString(),
      isLive,
    };
  }

  /**
   * Get official Ministry of Agriculture & Farmers Welfare news releases
   */
  public async getMinistryNews(params: { category?: string; search?: string; limit?: number } = {}) {
    return this.getNewsList({ ...params, source: "MINISTRY" });
  }

  /**
   * Get Krishi Vigyan Kendra (KVK/ICAR) scientific bulletins & research advisories
   */
  public async getKvkNews(params: { state?: string; category?: string; search?: string; limit?: number } = {}) {
    return this.getNewsList({ ...params, source: "KVK" });
  }

  /**
   * Get news article by ID or slug
   */
  public async getNewsById(idOrSlug: string): Promise<AgriNewsItem | null> {
    const { articles } = await this.ensureFeedData();
    const item = articles.find((n) => n.id === idOrSlug || n.slug === idOrSlug);
    return item || null;
  }

  /**
   * Get trending / urgent announcements
   */
  public async getTrendingNews(): Promise<AgriNewsItem[]> {
    const { articles } = await this.ensureFeedData();
    return articles.filter((n) => n.isTrending || n.isUrgent);
  }

  /**
   * Search KVK Directory across states & districts
   */
  public getKvkDirectory(params: { state?: string; district?: string; search?: string } = {}): {
    centers: KvkCenterInfo[];
    count: number;
    states: string[];
  } {
    const { state, district, search } = params;

    let filtered = [...KVK_DIRECTORY];

    if (state && state !== "ALL") {
      const sLower = state.toLowerCase();
      filtered = filtered.filter((k) => k.state.toLowerCase() === sLower || k.state.toLowerCase().includes(sLower));
    }

    if (district && district !== "ALL") {
      const dLower = district.toLowerCase();
      filtered = filtered.filter((k) => k.district.toLowerCase() === dLower || k.district.toLowerCase().includes(dLower));
    }

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter(
        (k) =>
          k.kvkName.toLowerCase().includes(q) ||
          k.district.toLowerCase().includes(q) ||
          k.state.toLowerCase().includes(q) ||
          k.hostUniversity.toLowerCase().includes(q) ||
          k.programCoordinator.toLowerCase().includes(q) ||
          k.specialtyCrops.some((c) => c.toLowerCase().includes(q))
      );
    }

    const statesSet = new Set<string>();
    KVK_DIRECTORY.forEach((k) => statesSet.add(k.state));

    return {
      centers: filtered,
      count: filtered.length,
      states: Array.from(statesSet).sort(),
    };
  }

  /**
   * National News & KVK Stats summary
   */
  public async getStats() {
    const { articles, isLive, lastFetched } = await this.ensureFeedData();
    return {
      totalNewsBulletins: articles.length,
      ministryBulletins: articles.filter((n) => n.source === "MINISTRY" || n.source === "PIB").length,
      kvkAdvisories: articles.filter((n) => n.source === "KVK" || n.source === "ICAR").length,
      totalKvkCentersCatalogued: KVK_DIRECTORY.length,
      totalNationalKvksOperational: 731,
      isLive,
      lastFetchedAt: lastFetched ? lastFetched.toISOString() : null,
      agencyCredentials: {
        ministry: "Ministry of Agriculture & Farmers Welfare, Govt. of India (MoA&FW)",
        icar: "Indian Council of Agricultural Research (ICAR), DARE",
        portal: "https://agricoop.gov.in | https://kvk.icar.gov.in | https://pib.gov.in",
      },
    };
  }
}

export { AgriNewsService };
export default new AgriNewsService();

