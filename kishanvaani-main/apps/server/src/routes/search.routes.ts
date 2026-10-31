import { Router } from "express";
import prisma from "../prisma.js";
import { optionalAuth, AuthRequest } from "../middleware/auth.middleware.js";
import AgriNewsService from "../services/agri-news.service.js";
import LiveMandiService from "../services/live-mandi.service.js";

const router = Router();

// Multi-resource unified search
router.get("/", optionalAuth, async (req: AuthRequest, res) => {
  try {
    const { q, category, language, type } = req.query;

    if (!q || typeof q !== "string" || q.trim() === "") {
      // If no query, return top trending/popular audio content respecting category & language filters
      const contentWhere: any = {
        status: "PUBLISHED",
        ...(category && category !== "ALL" && { category: String(category) }),
        ...(language && language !== "ALL" && { language: String(language) }),
        ...(type && type !== "ALL" && { type: String(type) }),
      };

      const [popular, news] = await Promise.all([
        prisma.content.findMany({
          where: contentWhere,
          include: { audio: true },
          orderBy: { viewsCount: "desc" },
          take: 12,
        }),
        AgriNewsService.getTrendingNews(),
      ]);

      const formattedContent = popular.map((p) => ({
        ...p,
        audioUrl: p.audio?.fileUrl || "",
        durationSec: p.audio?.durationSec || 180,
        narrator: p.audio?.narrator || p.authorName || "KishanVaani",
      }));

      res.json({
        query: "",
        content: formattedContent,
        stories: [],
        expertQAs: [],
        mandiMatches: [],
        news: news.slice(0, 6),
        total: formattedContent.length + Math.min(news.length, 6),
      });
      return;
    }

    const query = q.trim();
    const tokens = query.split(/\s+/).filter(Boolean).slice(0, 6);
    const anyField = (fields: string[]) => ({
      AND: tokens.map((tok) => ({ OR: fields.map((f) => ({ [f]: { contains: tok } })) })),
    });

    const contentWhere: any = {
      status: "PUBLISHED",
      ...(category && category !== "ALL" && { category: String(category) }),
      ...(language && language !== "ALL" && { language: String(language) }),
      ...(type && type !== "ALL" && { type: String(type) }),
      ...anyField(["title", "description", "tags", "body", "authorName"]),
    };

    const storiesWhere: any = {
      status: "PUBLISHED",
      ...anyField(["title", "body", "farmerName", "location"]),
    };

    const expertWhere: any = {
      status: "ANSWERED",
      ...anyField(["question", "answer", "crop", "category"]),
    };

    const mandiWhere: any = {
      ...anyField(["commodity", "market", "district", "state", "variety"]),
    };

    const [contents, stories, expertQAs, mandiMatches, liveMandi] = await Promise.all([
      prisma.content.findMany({
        where: contentWhere,
        include: { audio: true },
        take: 20,
      }),
      prisma.communityStory.findMany({
        where: storiesWhere,
        take: 8,
      }),
      prisma.expertQuestion.findMany({
        where: expertWhere,
        take: 8,
      }),
      prisma.mandiPrice.findMany({
        where: mandiWhere,
        take: 8,
      }),
      LiveMandiService.getLiveMandiPrices({ limit: 500 }).catch(() => ({ records: [] })),
    ]);

    // Token-match live mandi records: either all tokens match text, or commodity matches a significant token
    const liveMandiFiltered = (liveMandi.records || [])
      .filter((r) => {
        const fullText = `${r.commodity} ${r.market} ${r.district} ${r.state} ${r.variety}`.toLowerCase();
        if (tokens.every((tok) => fullText.includes(tok.toLowerCase()))) return true;
        return tokens.some((tok) => tok.length > 2 && r.commodity.toLowerCase().includes(tok.toLowerCase()));
      })
      .slice(0, 8);

    // Merge mandi matches, preferring live records if available, with DB fallback
    const mergedMandi = liveMandiFiltered.length > 0 ? liveMandiFiltered : mandiMatches;

    const formattedContent = contents.map((c) => ({
      ...c,
      audioUrl: c.audio?.fileUrl || "",
      durationSec: c.audio?.durationSec || 180,
      narrator: c.audio?.narrator || c.authorName || "KishanVaani",
    }));

    const formattedMandi = mergedMandi.map((m: any, idx: number) => {
      const isSample = m.isSample ?? (m.source === "SAMPLE" || m.tradeStatus === "BENCHMARK_SAMPLE");
      const rawDate = m.arrivalDate || m.priceDate;
      const dateStr = rawDate ? new Date(rawDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "";
      const sourceLabel = m.sourceLabel || (isSample
        ? "Sample data"
        : `Live from ${m.source === "ENAM" ? "e-NAM" : "Agmarknet"}${dateStr ? `, ${dateStr}` : ""}`);

      return {
        id: m.id || `mandi-${m.state}-${m.market}-${m.commodity}-${idx}`,
        state: m.state,
        district: m.district,
        market: m.market,
        commodity: m.commodity,
        variety: m.variety,
        arrivals: m.arrivals != null ? m.arrivals : null,
        minPrice: m.minPrice != null ? m.minPrice : null,
        maxPrice: m.maxPrice != null ? m.maxPrice : null,
        modalPrice: m.modalPrice != null ? m.modalPrice : null,
        sourceLabel,
        isSample,
      };
    });

    // Token-based search in AgriNews
    const newsResult = await AgriNewsService.getNewsList({ search: query, limit: 8 });

    res.json({
      query,
      content: formattedContent,
      stories,
      expertQAs,
      mandiMatches: formattedMandi,
      news: newsResult.items,
      total:
        formattedContent.length +
        stories.length +
        expertQAs.length +
        formattedMandi.length +
        newsResult.items.length,
    });
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ error: "Failed to perform search" });
  }
});

export default router;
