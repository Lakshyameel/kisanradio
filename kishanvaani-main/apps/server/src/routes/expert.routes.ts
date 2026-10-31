import { Router, Response } from "express";
import { z } from "zod";
import prisma from "../prisma.js";
import { requireAuth, requireRole, optionalAuth, AuthRequest } from "../middleware/auth.middleware.js";
import { logAudit } from "../services/audit.service.js";

const router = Router();

// List expert questions (PII masked for public/unauthorized viewers)
router.get("/questions", optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { crop, category, status } = req.query;

    const where: any = {
      ...(status && status !== "ALL" ? { status: String(status) } : {}),
      ...(crop && crop !== "ALL" ? { crop: String(crop) } : {}),
      ...(category && category !== "ALL" ? { category: String(category) } : {}),
    };

    const questions = await prisma.expertQuestion.findMany({
      where,
      include: {
        user: {
          select: { name: true, state: true, district: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const isStaff = req.user?.role === "ADMIN" || req.user?.role === "EXPERT";
    const currentUserId = req.user?.id;

    const sanitized = questions.map((q) => {
      const isOwner = Boolean(currentUserId && currentUserId === q.userId);
      if (isStaff || isOwner) {
        return q;
      }
      // Mask / omit the asker's personal identifying information for public requests
      const { user, ...rest } = q;
      return rest;
    });

    res.json({ questions: sanitized });
  } catch (error) {
    console.error("Expert questions error:", error);
    res.status(500).json({ error: "Failed to fetch questions" });
  }
});

const QuestionSubmitSchema = z.object({
  question: z.string().min(10),
  crop: z.string().optional(),
  category: z.string().optional(),
});

// Ask an Expert (Farmer user)
router.post("/questions", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const parsed = QuestionSubmitSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0].message });
      return;
    }

    const { question, crop, category } = parsed.data;

    const newQuestion = await prisma.expertQuestion.create({
      data: {
        userId: req.user!.id,
        question,
        crop: crop || "General Agriculture",
        category: category || "Crop Guidance",
        status: "PENDING",
      },
    });

    res.status(201).json({
      question: newQuestion,
      message: "Your question has been sent to our agricultural agronomists and veterinary specialists.",
    });
  } catch (error) {
    console.error("Ask expert error:", error);
    res.status(500).json({ error: "Failed to submit question" });
  }
});

// Get My Questions
router.get("/my-questions", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const questions = await prisma.expertQuestion.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: "desc" },
    });
    res.json({ questions });
  } catch (error) {
    console.error("My questions error:", error);
    res.status(500).json({ error: "Failed to fetch user questions" });
  }
});

const AnswerSchema = z.object({
  answer: z.string().min(5),
  audioAnswerUrl: z.string().optional(),
  answeredBy: z.string().optional(),
});

// Answer a question (Expert / Admin)
router.post("/questions/:id/answer", requireAuth, requireRole(["EXPERT", "ADMIN"]), async (req: AuthRequest, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const parsed = AnswerSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0].message });
      return;
    }

    const { answer, audioAnswerUrl, answeredBy } = parsed.data;

    const existing = await prisma.expertQuestion.findUnique({
      where: { id },
    });

    if (!existing) {
      res.status(404).json({ error: "Question not found" });
      return;
    }

    const updated = await prisma.expertQuestion.update({
      where: { id },
      data: {
        answer,
        answeredBy: answeredBy || req.user!.name,
        audioAnswerUrl: audioAnswerUrl || null,
        status: "ANSWERED",
      },
    });

    // Notify asking user that their question has been answered
    try {
      await prisma.notification.create({
        data: {
          userId: existing.userId,
          title: "Expert Answer Received (विशेषज्ञ का उत्तर प्राप्त हुआ)",
          message: `${updated.answeredBy || "An agricultural specialist"} answered your question about ${updated.crop || "your crop"}: "${updated.question.slice(0, 75)}...". ${updated.audioAnswerUrl ? "Audio advice is ready to play." : ""}`,
          type: "QUESTION_ANSWERED",
          linkUrl: `/community/ask-expert?questionId=${updated.id}`,
        },
      });

      await logAudit({
        userId: req.user!.id,
        userName: req.user!.name,
        action: "ANSWER_QUESTION",
        targetType: "EXPERT_QUESTION",
        targetId: updated.id,
        details: {
          crop: updated.crop,
          hasAudio: Boolean(updated.audioAnswerUrl),
          questionSnippet: updated.question.slice(0, 60),
        },
      });
    } catch (notifErr) {
      console.error("Failed to create question answer notification / audit log:", notifErr);
    }

    res.json({ question: updated, message: "Answer published and farmer notified successfully" });
  } catch (error) {
    console.error("Answer question error:", error);
    res.status(500).json({ error: "Failed to answer question" });
  }
});

export default router;
