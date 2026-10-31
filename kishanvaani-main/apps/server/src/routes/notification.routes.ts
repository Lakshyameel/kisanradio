import { Router, Response } from "express";
import prisma from "../prisma.js";
import { requireAuth, AuthRequest } from "../middleware/auth.middleware.js";

const router = Router();

/**
 * GET /api/v1/notifications
 * Get authenticated user's notifications and unread badge count
 */
router.get("/", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 30,
      }),
      prisma.notification.count({
        where: { userId, read: false },
      }),
    ]);

    res.json({
      success: true,
      unreadCount,
      notifications,
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch notifications" });
  }
});

/**
 * PATCH /api/v1/notifications/:id/read
 * Mark a single notification as read
 */
router.patch("/:id/read", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const userId = req.user!.id;

    const notification = await prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      return res.status(404).json({ success: false, error: "Notification not found" });
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { read: true },
    });

    const unreadCount = await prisma.notification.count({
      where: { userId, read: false },
    });

    res.json({
      success: true,
      notification: updated,
      unreadCount,
    });
  } catch (error) {
    console.error("Mark notification read error:", error);
    res.status(500).json({ success: false, error: "Failed to update notification" });
  }
});

/**
 * PATCH /api/v1/notifications/read-all
 * Mark all notifications as read for current user
 */
router.patch("/read-all", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });

    res.json({
      success: true,
      message: "All notifications marked as read",
      unreadCount: 0,
    });
  } catch (error) {
    console.error("Mark all read error:", error);
    res.status(500).json({ success: false, error: "Failed to mark notifications as read" });
  }
});

/**
 * DELETE /api/v1/notifications/:id
 * Delete a notification
 */
router.delete("/:id", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const userId = req.user!.id;

    await prisma.notification.deleteMany({
      where: { id, userId },
    });

    res.json({ success: true, message: "Notification deleted" });
  } catch (error) {
    console.error("Delete notification error:", error);
    res.status(500).json({ success: false, error: "Failed to delete notification" });
  }
});

export default router;
