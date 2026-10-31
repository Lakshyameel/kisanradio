import { Router, Response } from "express";
import prisma from "../prisma.js";
import { requireAuth, AuthRequest } from "../middleware/auth.middleware.js";

const router = Router();

// Get all bookmarks for logged-in user
router.get("/", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const bookmarks = await prisma.bookmark.findMany({
      where: { userId },
      include: {
        content: {
          include: {
            audio: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = bookmarks.map((b: any) => ({
      bookmarkId: b.id,
      bookmarkedAt: b.createdAt,
      ...b.content,
      isBookmarked: true,
      audioUrl: b.content.audio?.fileUrl || "",
      durationSec: b.content.audio?.durationSec || 180,
      narrator: b.content.audio?.narrator || b.content.authorName || "KishanVaani",
      transcript: b.content.audio?.transcript || "",
    }));

    res.json({ bookmarks: formatted });
  } catch (error) {
    console.error("Get bookmarks error:", error);
    res.status(500).json({ error: "Failed to fetch bookmarks" });
  }
});

// Toggle bookmark
router.post("/toggle", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { contentId } = req.body;

    if (!contentId) {
      res.status(400).json({ error: "contentId is required" });
      return;
    }

    const existing = await prisma.bookmark.findUnique({
      where: {
        userId_contentId: {
          userId,
          contentId,
        },
      },
    });

    if (existing) {
      await prisma.bookmark.delete({
        where: { id: existing.id },
      });
      res.json({ isBookmarked: false, message: "Bookmark removed" });
    } else {
      await prisma.bookmark.create({
        data: {
          userId,
          contentId,
        },
      });
      res.json({ isBookmarked: true, message: "Bookmark saved" });
    }
  } catch (error) {
    console.error("Toggle bookmark error:", error);
    res.status(500).json({ error: "Failed to toggle bookmark" });
  }
});

// Check if content is bookmarked
router.get("/check/:contentId", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const contentId = Array.isArray(req.params.contentId) ? req.params.contentId[0] : req.params.contentId;

    const existing = await prisma.bookmark.findUnique({
      where: {
        userId_contentId: {
          userId,
          contentId,
        },
      },
    });

    res.json({ isBookmarked: Boolean(existing) });
  } catch (error) {
    console.error("Check bookmark error:", error);
    res.status(500).json({ error: "Failed to check bookmark" });
  }
});

export default router;
