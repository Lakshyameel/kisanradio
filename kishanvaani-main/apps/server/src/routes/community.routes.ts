import { Router } from "express";
import { z } from "zod";
import prisma from "../prisma.js";
import { requireAuth, optionalAuth, AuthRequest } from "../middleware/auth.middleware.js";

const router = Router();

// List community stories
router.get("/stories", optionalAuth, async (req, res) => {
  try {
    const { category, limit = "30" } = req.query;

    const where: any = {
      status: "PUBLISHED",
      ...(category && category !== "ALL" && { category: String(category) }),
    };

    const stories = await prisma.communityStory.findMany({
      where,
      include: {
        user: {
          select: { name: true, avatarUrl: true, state: true, district: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: Math.min(Number(limit) || 30, 50),
    });

    res.json({ stories });
  } catch (error) {
    console.error("Community stories error:", error);
    res.status(500).json({ error: "Failed to fetch community stories" });
  }
});

const StorySubmitSchema = z.object({
  title: z.string().min(5),
  body: z.string().min(20),
  category: z.enum(["SUCCESS_STORY", "FAILURE_STORY", "FARMER_EXPERIENCE"]).default("SUCCESS_STORY"),
  farmerName: z.string().optional(),
  location: z.string().optional(),
  audioUrl: z.string().optional(),
});

// Submit a new farmer community story
router.post("/stories", requireAuth, async (req: AuthRequest, res) => {
  try {
    const parsed = StorySubmitSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0].message });
      return;
    }

    const { title, body, category, farmerName, location, audioUrl } = parsed.data;
    const isStaff = req.user?.role === "ADMIN";
    const initialStatus = isStaff ? "PUBLISHED" : "PENDING_REVIEW";

    const story = await prisma.communityStory.create({
      data: {
        userId: req.user!.id,
        title,
        body,
        category,
        farmerName: farmerName || req.user!.name,
        location: location || "India",
        audioUrl: audioUrl || null,
        status: initialStatus,
      },
    });

    const message = isStaff
      ? "Story shared and published successfully!"
      : "Story submitted successfully and is pending review by moderators!";

    res.status(201).json({ story, message });
  } catch (error) {
    console.error("Submit story error:", error);
    res.status(500).json({ error: "Failed to submit story" });
  }
});

// Like a story (requires authentication, 1 like per user per story)
router.post("/stories/:id/like", requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const userId = req.user!.id;

    const story = await prisma.communityStory.findUnique({
      where: { id },
      select: { id: true, likesCount: true },
    });

    if (!story) {
      res.status(404).json({ error: "Story not found" });
      return;
    }

    const existing = await prisma.storyLike.findUnique({
      where: {
        userId_storyId: { userId, storyId: id },
      },
    });

    if (existing) {
      res.status(400).json({
        error: "You have already liked this story",
        id: story.id,
        likesCount: story.likesCount,
      });
      return;
    }

    const [, updated] = await prisma.$transaction([
      prisma.storyLike.create({
        data: { userId, storyId: id },
      }),
      prisma.communityStory.update({
        where: { id },
        data: { likesCount: { increment: 1 } },
        select: { id: true, likesCount: true },
      }),
    ]);

    res.json(updated);
  } catch (error: any) {
    if (error?.code === "P2002") {
      res.status(400).json({ error: "You have already liked this story" });
      return;
    }
    console.error("Like story error:", error);
    res.status(500).json({ error: "Failed to like story" });
  }
});

// Get stories submitted by the logged in user
router.get("/my-stories", requireAuth, async (req: AuthRequest, res) => {
  try {
    const stories = await prisma.communityStory.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: "desc" },
    });
    res.json({ stories });
  } catch (error) {
    console.error("My stories error:", error);
    res.status(500).json({ error: "Failed to fetch user stories" });
  }
});

export default router;
