import { Router, Response } from "express";
import { z } from "zod";
import prisma from "../prisma.js";
import { requireAuth, requireRole, AuthRequest } from "../middleware/auth.middleware.js";
import { logAudit, getAuditLogs } from "../services/audit.service.js";
import {
  scheduleContent,
  publishDueScheduledContent,
  getScheduledContent,
  publishNow,
} from "../services/content-scheduler.service.js";
import { bulkUploadContent, bulkUploadMandiPrices } from "../services/bulk-upload.service.js";
import { getAdminAnalytics } from "../services/analytics.service.js";

const router = Router();

// Protect all admin routes with authentication
router.use(requireAuth);

// 1. Dashboard Core Metrics (Admin only)
router.get("/stats", requireRole(["ADMIN"]), async (_req: AuthRequest, res: Response) => {
  try {
    const [
      totalUsers,
      totalContent,
      totalAudio,
      pendingStories,
      pendingQuestions,
      mandiCount,
      totalPlays,
      scheduledContentCount,
      auditLogsCount,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.content.count({ where: { status: "PUBLISHED" } }),
      prisma.audio.count(),
      prisma.communityStory.count({ where: { status: "PENDING_REVIEW" } }),
      prisma.expertQuestion.count({ where: { status: "PENDING" } }),
      prisma.mandiPrice.count(),
      prisma.listeningHistory.count(),
      prisma.content.count({ where: { status: "SCHEDULED" } }),
      prisma.auditLog.count(),
    ]);

    const contentByType = await prisma.content.groupBy({
      by: ["type"],
      _count: { id: true },
    });

    const recentUsers = await prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, email: true, role: true, state: true, createdAt: true },
    });

    res.json({
      stats: {
        totalUsers,
        totalContent,
        totalAudio,
        pendingStories,
        pendingQuestions,
        mandiCount,
        totalPlays,
        scheduledContentCount,
        auditLogsCount,
      },
      contentByType,
      recentUsers,
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    res.status(500).json({ error: "Failed to fetch admin stats" });
  }
});

// 2. Comprehensive Analytics (Plays, Completion Rate, Top Districts) (Admin only)
router.get("/analytics", requireRole(["ADMIN"]), async (_req: AuthRequest, res: Response) => {
  try {
    const analytics = await getAdminAnalytics();
    res.json(analytics);
  } catch (error) {
    console.error("Admin analytics error:", error);
    res.status(500).json({ error: "Failed to fetch admin analytics" });
  }
});

// 3. Audit Logs Trail (Admin only)
router.get("/audit-logs", requireRole(["ADMIN"]), async (req: AuthRequest, res: Response) => {
  try {
    const page = req.query.page ? parseInt(String(req.query.page), 10) : 1;
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 25;
    const action = req.query.action ? String(req.query.action) : undefined;
    const targetType = req.query.targetType ? String(req.query.targetType) : undefined;

    const result = await getAuditLogs({ page, limit, action, targetType });
    res.json(result);
  } catch (error) {
    console.error("Audit logs fetch error:", error);
    res.status(500).json({ error: "Failed to fetch audit logs" });
  }
});

// 4. Pending Stories for moderation (Admin only)
router.get("/stories/pending", requireRole(["ADMIN"]), async (_req: AuthRequest, res: Response) => {
  try {
    const stories = await prisma.communityStory.findMany({
      where: { status: "PENDING_REVIEW" },
      include: {
        user: {
          select: { name: true, email: true, state: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });
    res.json({ stories });
  } catch (error) {
    console.error("Pending stories error:", error);
    res.status(500).json({ error: "Failed to fetch pending stories" });
  }
});

const UpdateStoryStatusSchema = z.object({
  status: z.enum(["PUBLISHED", "REJECTED"]),
});

// Update story status (Approve / Reject) + Audit Log (Admin only)
router.put("/stories/:id/status", requireRole(["ADMIN"]), async (req: AuthRequest, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const parsed = UpdateStoryStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: parsed.error.issues[0]?.message || "Invalid status. Status must be either 'PUBLISHED' or 'REJECTED'",
      });
      return;
    }

    const { status } = parsed.data;

    const updated = await prisma.communityStory.update({
      where: { id },
      data: { status },
      include: { user: { select: { name: true, email: true } } },
    });

    // Record audit log
    await logAudit({
      userId: req.user!.id,
      userName: req.user!.name,
      action: status === "PUBLISHED" ? "APPROVE_STORY" : "REJECT_STORY",
      targetType: "STORY",
      targetId: updated.id,
      details: {
        title: updated.title,
        farmerName: updated.farmerName || updated.user?.name,
        newStatus: status,
      },
    });

    res.json({ story: updated, message: `Story ${status.toLowerCase()} successfully` });
  } catch (error) {
    console.error("Update story status error:", error);
    res.status(500).json({ error: "Failed to update story status" });
  }
});

// 5. Pending questions for Agronomist / Expert (Admin & Expert)
router.get("/questions/pending", requireRole(["ADMIN", "EXPERT"]), async (_req: AuthRequest, res: Response) => {
  try {
    const questions = await prisma.expertQuestion.findMany({
      where: { status: "PENDING" },
      include: {
        user: {
          select: { name: true, state: true, district: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });
    res.json({ questions });
  } catch (error) {
    console.error("Pending questions error:", error);
    res.status(500).json({ error: "Failed to fetch pending questions" });
  }
});

// 6. Content Scheduling Routes (Admin & Expert)
const ScheduleContentSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  body: z.string().optional(),
  type: z.string().default("CROP_ADVISORY"),
  category: z.string().default("Agriculture"),
  language: z.string().default("Hindi"),
  authorName: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  audioUrl: z.string().optional(),
  durationSec: z.number().optional().default(180),
  transcript: z.string().optional(),
  scheduledPublishAt: z.string(),
});

// Schedule new content item
router.post("/content/schedule", requireRole(["ADMIN", "EXPERT"]), async (req: AuthRequest, res: Response) => {
  try {
    const parsed = ScheduleContentSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || "Validation failed" });
      return;
    }

    const content = await scheduleContent(parsed.data, req.user!.id, req.user!.name);
    res.status(201).json({
      success: true,
      content,
      message: `Broadcast scheduled for release at ${new Date(parsed.data.scheduledPublishAt).toLocaleString()}`,
    });
  } catch (error: any) {
    console.error("Schedule content error:", error);
    res.status(400).json({ error: error.message || "Failed to schedule content" });
  }
});

// List scheduled content
router.get("/content/scheduled", requireRole(["ADMIN", "EXPERT"]), async (_req: AuthRequest, res: Response) => {
  try {
    const items = await getScheduledContent();
    res.json({ scheduled: items });
  } catch (error) {
    console.error("Get scheduled content error:", error);
    res.status(500).json({ error: "Failed to fetch scheduled content" });
  }
});

// Check and publish due scheduled content (called by worker or admin page load)
router.post("/content/publish-due", requireRole(["ADMIN", "EXPERT"]), async (_req: AuthRequest, res: Response) => {
  try {
    const result = await publishDueScheduledContent();
    res.json({
      success: true,
      message: `Published ${result.count} due content items`,
      ...result,
    });
  } catch (error) {
    console.error("Publish due content error:", error);
    res.status(500).json({ error: "Failed to publish due content" });
  }
});

// Immediately publish a scheduled item ahead of time
router.post("/content/:id/publish-now", requireRole(["ADMIN", "EXPERT"]), async (req: AuthRequest, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const updated = await publishNow(id, req.user!.id, req.user!.name);
    res.json({
      success: true,
      content: updated,
      message: "Broadcast published immediately to farmers",
    });
  } catch (error: any) {
    console.error("Publish now error:", error);
    res.status(400).json({ error: error.message || "Failed to publish content now" });
  }
});

// 7. Bulk Upload Route (Admin only)
const BulkUploadSchema = z.object({
  type: z.enum(["CONTENT", "MANDI_PRICE"]),
  items: z.array(z.record(z.string(), z.any())).min(1),
});

router.post("/bulk-upload", requireRole(["ADMIN"]), async (req: AuthRequest, res: Response) => {
  try {
    const parsed = BulkUploadSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || "Invalid bulk upload payload" });
      return;
    }

    const { type, items } = parsed.data;

    if (type === "CONTENT") {
      const result = await bulkUploadContent(items, req.user!.id, req.user!.name);
      res.status(201).json(result);
    } else if (type === "MANDI_PRICE") {
      const result = await bulkUploadMandiPrices(items, req.user!.id, req.user!.name);
      res.status(201).json(result);
    } else {
      res.status(400).json({ error: "Unsupported bulk upload type" });
    }
  } catch (error: any) {
    console.error("Bulk upload error:", error);
    res.status(400).json({ error: error.message || "Bulk upload failed" });
  }
});

export default router;
