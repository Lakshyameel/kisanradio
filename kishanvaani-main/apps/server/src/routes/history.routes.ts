import { Router } from "express";
import prisma from "../prisma.js";
import { requireAuth, AuthRequest } from "../middleware/auth.middleware.js";

const router = Router();

// Get listening history for user
router.get("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;

    const history = await prisma.listeningHistory.findMany({
      where: { userId },
      include: {
        audio: {
          include: {
            content: true,
          },
        },
      },
      orderBy: { lastPlayedAt: "desc" },
      take: 50,
    });

    const formatted = history.map((h) => ({
      historyId: h.id,
      progressSeconds: h.progressSeconds,
      completed: h.completed,
      lastPlayedAt: h.lastPlayedAt,
      audioId: h.audioId,
      audioUrl: h.audio.fileUrl,
      durationSec: h.audio.durationSec || 180,
      narrator: h.audio.narrator || h.audio.content.authorName || "KishanVaani",
      transcript: h.audio.transcript || "",
      content: h.audio.content,
    }));

    res.json({ history: formatted });
  } catch (error) {
    console.error("Get history error:", error);
    res.status(500).json({ error: "Failed to fetch listening history" });
  }
});

// Continue Listening endpoint (recent unfinished tracks)
router.get("/continue", requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;

    const continueTracks = await prisma.listeningHistory.findMany({
      where: {
        userId,
        completed: false,
        progressSeconds: { gt: 3 },
      },
      include: {
        audio: {
          include: {
            content: true,
          },
        },
      },
      orderBy: { lastPlayedAt: "desc" },
      take: 6,
    });

    const formatted = continueTracks.map((h) => ({
      id: h.audio.content.id,
      title: h.audio.content.title,
      description: h.audio.content.description,
      slug: h.audio.content.slug,
      type: h.audio.content.type,
      category: h.audio.content.category,
      language: h.audio.content.language,
      thumbnailUrl: h.audio.content.thumbnailUrl,
      audioId: h.audio.id,
      audioUrl: h.audio.fileUrl,
      progressSeconds: h.progressSeconds,
      durationSec: h.audio.durationSec || 180,
      progressPercent: Math.min(
        Math.round((h.progressSeconds / (h.audio.durationSec || 180)) * 100),
        100
      ),
      lastPlayedAt: h.lastPlayedAt,
    }));

    res.json({ continueListening: formatted });
  } catch (error) {
    console.error("Continue listening error:", error);
    res.status(500).json({ error: "Failed to fetch continue listening tracks" });
  }
});

// Sync listening progress
router.post("/sync", requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { audioId, contentId, progressSeconds, completed } = req.body;

    let targetAudioId = audioId;

    if (!targetAudioId && contentId) {
      const audioRecord = await prisma.audio.findUnique({
        where: { contentId },
      });
      if (audioRecord) {
        targetAudioId = audioRecord.id;
      }
    }

    if (!targetAudioId) {
      res.status(400).json({ error: "audioId or valid contentId required" });
      return;
    }

    const updated = await prisma.listeningHistory.upsert({
      where: {
        userId_audioId: {
          userId,
          audioId: targetAudioId,
        },
      },
      update: {
        progressSeconds: Math.floor(progressSeconds || 0),
        completed: Boolean(completed),
        lastPlayedAt: new Date(),
      },
      create: {
        userId,
        audioId: targetAudioId,
        progressSeconds: Math.floor(progressSeconds || 0),
        completed: Boolean(completed),
        lastPlayedAt: new Date(),
      },
    });

    res.json({ success: true, history: updated });
  } catch (error) {
    console.error("Sync history error:", error);
    res.status(500).json({ error: "Failed to sync listening progress" });
  }
});

// Clear history
router.delete("/clear", requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    await prisma.listeningHistory.deleteMany({ where: { userId } });
    res.json({ message: "Listening history cleared" });
  } catch (error) {
    console.error("Clear history error:", error);
    res.status(500).json({ error: "Failed to clear history" });
  }
});

export default router;
