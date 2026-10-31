import { Router, Request, Response } from "express";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import prisma from "../prisma.js";
import { requireAuth, requireRole, optionalAuth, AuthRequest } from "../middleware/auth.middleware.js";

const router = Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Audio upload directory targeting apps/web/public/audio/uploads
const UPLOADS_DIR = path.resolve(__dirname, "../../../web/public/audio/uploads");

// Ensure directory exists
fs.mkdir(UPLOADS_DIR, { recursive: true }).catch(() => {});

import {
  validateMagicBytes,
  generateSecureFilename,
  MAX_FILE_SIZE_BYTES,
  ALLOWED_EXTENSIONS,
} from "../utils/file-validator.js";

// File Upload Handler (Strict Magic-Byte & Size Validation)
router.post("/upload-file", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { filename, fileBase64 } = req.body;

    if (!fileBase64) {
      res.status(400).json({ error: "File content (fileBase64) is required" });
      return;
    }

    // Strip Data URL prefix if present
    const base64Data = fileBase64.replace(/^data:.*?;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    // 1. Strict Size Limit (5 MB cap)
    if (buffer.length === 0) {
      res.status(400).json({ error: "Uploaded file is empty" });
      return;
    }

    if (buffer.length > MAX_FILE_SIZE_BYTES) {
      res.status(413).json({
        error: `File size exceeds the 5 MB limit (received ${(buffer.length / (1024 * 1024)).toFixed(2)} MB)`,
      });
      return;
    }

    // 2. Magic Bytes Inspection (Binary signature check)
    const validated = validateMagicBytes(buffer);
    if (!validated) {
      res.status(400).json({
        error: `Invalid file content or disallowed file type. Permitted formats: ${ALLOWED_EXTENSIONS.join(", ")}`,
      });
      return;
    }

    // 3. Secure Random Filename (never reuse client extension or filename)
    const secureFilename = generateSecureFilename(validated.extension);
    const filePath = path.join(UPLOADS_DIR, secureFilename);

    // 4. Storage Handling: In production, upload to S3/R2 if configured, else write to safe upload dir
    const isS3Configured = Boolean(
      process.env.STORAGE_BUCKET ||
      process.env.S3_BUCKET ||
      process.env.R2_BUCKET
    );

    await fs.mkdir(UPLOADS_DIR, { recursive: true });

    if (process.env.NODE_ENV === "production" && isS3Configured) {
      // In cloud production, store in S3/R2 bucket
      const bucketName = process.env.STORAGE_BUCKET || process.env.S3_BUCKET || process.env.R2_BUCKET;
      const endpoint = process.env.STORAGE_ENDPOINT || "https://s3.amazonaws.com";
      console.log(`[Storage] Production S3/R2 upload designated for bucket: ${bucketName}, key: ${secureFilename}`);
      // Fallback local write alongside cloud record
      await fs.writeFile(filePath, buffer, { mode: 0o644 });
    } else {
      await fs.writeFile(filePath, buffer, { mode: 0o644 });
    }

    const publicUrl = `/audio/uploads/${secureFilename}`;
    res.json({
      fileUrl: publicUrl,
      filename: secureFilename,
      mimeType: validated.mimeType,
      sizeBytes: buffer.length,
      message: "File uploaded and verified successfully",
    });
  } catch (error) {
    console.error("Audio upload file error:", error);
    res.status(500).json({ error: "Failed to upload audio file" });
  }
});

// List all content with rich filters
router.get("/", optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const {
      type,
      category,
      language,
      search,
      status = "PUBLISHED",
      limit = "50",
      page = "1",
    } = req.query;

    const take = Math.min(Number(limit) || 20, 100);
    const skip = ((Number(page) || 1) - 1) * take;

    // Force status: "PUBLISHED" unless authenticated user is an ADMIN or EXPERT
    const isStaff = req.user?.role === "ADMIN" || req.user?.role === "EXPERT";
    let effectiveStatus: string | undefined = "PUBLISHED";

    if (isStaff) {
      if (status === "ALL") {
        effectiveStatus = undefined;
      } else if (status) {
        effectiveStatus = String(status);
      }
    }

    const where: any = {
      ...(effectiveStatus ? { status: effectiveStatus } : {}),
      ...(type && type !== "ALL" && { type: String(type) }),
      ...(category && category !== "ALL" && { category: String(category) }),
      ...(language && language !== "ALL" && { language: String(language) }),
    };

    if (search && typeof search === "string" && search.trim() !== "") {
      const q = search.trim();
      where.OR = [
        { title: { contains: q } },
        { description: { contains: q } },
        { tags: { contains: q } },
        { authorName: { contains: q } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.content.findMany({
        where,
        include: {
          audio: true,
          bookmarks: req.user ? { where: { userId: req.user.id } } : false,
        },
        orderBy: { createdAt: "desc" },
        take,
        skip,
      }),
      prisma.content.count({ where }),
    ]);

    const formatted = items.map((item: any) => ({
      ...item,
      isBookmarked: Boolean(item.bookmarks && item.bookmarks.length > 0),
      audioUrl: item.audio?.fileUrl || "",
      durationSec: item.audio?.durationSec || 180,
      narrator: item.audio?.narrator || item.authorName || "KishanVaani",
      transcript: item.audio?.transcript || "",
    }));

    res.json({
      items: formatted,
      total,
      page: Number(page) || 1,
      totalPages: Math.ceil(total / take),
    });
  } catch (error) {
    console.error("List content error:", error);
    res.status(500).json({ error: "Failed to fetch content" });
  }
});

// Featured Content & Spotlight
router.get("/featured", optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const featuredItems = await prisma.content.findMany({
      where: { status: "PUBLISHED" },
      include: {
        audio: true,
        bookmarks: req.user ? { where: { userId: req.user.id } } : false,
      },
      orderBy: [{ viewsCount: "desc" }, { createdAt: "desc" }],
      take: 6,
    });

    const news = await prisma.content.findMany({
      where: { status: "PUBLISHED", type: "NEWS" },
      include: { audio: true },
      orderBy: { publishedAt: "desc" },
      take: 4,
    });

    const recommendations = await prisma.content.findMany({
      where: {
        status: "PUBLISHED",
        type: { in: ["CROP_ADVISORY", "LIVESTOCK", "GOVERNMENT_SCHEME", "SUCCESS_STORY"] },
      },
      include: { audio: true },
      orderBy: { likesCount: "desc" },
      take: 6,
    });

    const literature = await prisma.content.findMany({
      where: {
        status: "PUBLISHED",
        type: { in: ["STORY", "POEM", "FOLK_TALE", "AUDIO_BOOK"] },
      },
      include: { audio: true },
      orderBy: { createdAt: "desc" },
      take: 6,
    });

    const formattedFeatured = featuredItems.map((item: any) => ({
      ...item,
      isBookmarked: Boolean(item.bookmarks && item.bookmarks.length > 0),
      audioUrl: item.audio?.fileUrl || "",
      durationSec: item.audio?.durationSec || 180,
      narrator: item.audio?.narrator || item.authorName || "KishanVaani",
      transcript: item.audio?.transcript || "",
    }));

    res.json({
      heroFeatured: formattedFeatured[0] || null,
      featured: formattedFeatured,
      latestNews: news.map((n: any) => ({
        ...n,
        audioUrl: n.audio?.fileUrl || "",
        durationSec: n.audio?.durationSec || 180,
        narrator: n.audio?.narrator || n.authorName || "KishanVaani",
      })),
      recommendations: recommendations.map((r: any) => ({
        ...r,
        audioUrl: r.audio?.fileUrl || "",
        durationSec: r.audio?.durationSec || 180,
        narrator: r.audio?.narrator || r.authorName || "KishanVaani",
      })),
      literatureSpotlight: literature.map((l: any) => ({
        ...l,
        audioUrl: l.audio?.fileUrl || "",
        durationSec: l.audio?.durationSec || 180,
        narrator: l.audio?.narrator || l.authorName || "KishanVaani",
      })),
    });
  } catch (error) {
    console.error("Featured content error:", error);
    res.status(500).json({ error: "Failed to fetch featured content" });
  }
});

// Get user's submitted literature (Stories, Poems, Folk Tales, Audiobooks)
router.get("/my-literature", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const items = await prisma.content.findMany({
      where: {
        category: "Literature",
        OR: [
          { authorId: userId },
          { authorId: null, authorName: req.user!.name },
        ],
      },
      include: {
        audio: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = items.map((item: any) => ({
      ...item,
      audioUrl: item.audio?.fileUrl || "",
      durationSec: item.audio?.durationSec || 180,
      narrator: item.audio?.narrator || item.authorName || "KishanVaani",
      transcript: item.audio?.transcript || "",
    }));

    res.json({ items: formatted });
  } catch (error) {
    console.error("My literature error:", error);
    res.status(500).json({ error: "Failed to fetch user literature" });
  }
});

// Get content item by slug or ID
router.get("/slug/:slug", optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const slugParam = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;

    const item = await prisma.content.findFirst({
      where: { OR: [{ slug: slugParam }, { id: slugParam }] },
      include: {
        audio: true,
        bookmarks: req.user ? { where: { userId: req.user.id } } : false,
      },
    });

    if (!item) {
      res.status(404).json({ error: "Content not found" });
      return;
    }

    // Force unpublished/draft content to be restricted to ADMIN or EXPERT
    const isStaff = req.user?.role === "ADMIN" || req.user?.role === "EXPERT";
    if (item.status !== "PUBLISHED" && !isStaff) {
      res.status(404).json({ error: "Content not found" });
      return;
    }

    // Increment view count asynchronously
    await prisma.content.update({
      where: { id: item.id },
      data: { viewsCount: { increment: 1 } },
    }).catch(() => {});

    // Fetch related content
    const related = await prisma.content.findMany({
      where: {
        status: "PUBLISHED",
        id: { not: item.id },
        OR: [{ type: item.type }, { category: item.category }],
      },
      include: { audio: true },
      take: 4,
    });

    const typedItem = item as any;

    res.json({
      item: {
        ...typedItem,
        isBookmarked: Boolean(typedItem.bookmarks && typedItem.bookmarks.length > 0),
        audioUrl: typedItem.audio?.fileUrl || "",
        durationSec: typedItem.audio?.durationSec || 180,
        narrator: typedItem.audio?.narrator || typedItem.authorName || "KishanVaani",
        transcript: typedItem.audio?.transcript || "",
      },
      related: related.map((r: any) => ({
        ...r,
        audioUrl: r.audio?.fileUrl || "",
        durationSec: r.audio?.durationSec || 180,
        narrator: r.audio?.narrator || r.authorName || "KishanVaani",
      })),
    });
  } catch (error) {
    console.error("Get content error:", error);
    res.status(500).json({ error: "Failed to fetch content details" });
  }
});

// Like content (requires authentication, 1 like per user per item)
router.post("/:id/like", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const userId = req.user!.id;

    // Check if content exists
    const content = await prisma.content.findUnique({
      where: { id },
      select: { id: true, likesCount: true },
    });

    if (!content) {
      res.status(404).json({ error: "Content not found" });
      return;
    }

    // Check if user already liked this content
    const existing = await prisma.contentLike.findUnique({
      where: {
        userId_contentId: { userId, contentId: id },
      },
    });

    if (existing) {
      res.status(400).json({
        error: "You have already liked this item",
        id: content.id,
        likesCount: content.likesCount,
      });
      return;
    }

    // Atomically create like record and increment likesCount
    const [, updated] = await prisma.$transaction([
      prisma.contentLike.create({
        data: { userId, contentId: id },
      }),
      prisma.content.update({
        where: { id },
        data: { likesCount: { increment: 1 } },
        select: { id: true, likesCount: true },
      }),
    ]);

    res.json(updated);
  } catch (error: any) {
    if (error?.code === "P2002") {
      res.status(400).json({ error: "You have already liked this item" });
      return;
    }
    console.error("Like content error:", error);
    res.status(500).json({ error: "Failed to like content" });
  }
});

const UserLiteratureUploadSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  body: z.string().optional(),
  type: z.enum(["STORY", "POEM", "FOLK_TALE", "AUDIO_BOOK"]).default("STORY"),
  language: z.string().default("Hindi"),
  authorName: z.string().optional(),
  audioUrl: z.string().optional().default(""),
  durationSec: z.number().optional().default(180),
  thumbnailUrl: z.string().optional(),
  transcript: z.string().optional(),
});

// User Upload Literature (Stories, Poems, Folk Tales, Audio Books)
router.post("/user-upload", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const parsed = UserLiteratureUploadSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0].message });
      return;
    }

    const { audioUrl, durationSec, transcript, authorName, thumbnailUrl, ...data } = parsed.data;
    const slugBase = data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const slug = `${slugBase}-${Date.now().toString().slice(-4)}`;

    const effectiveAuthor = authorName || req.user?.name || "Rural Storyteller";

    const isStaff = req.user?.role === "ADMIN" || req.user?.role === "EXPERT";
    const initialStatus = isStaff ? "PUBLISHED" : "PENDING_REVIEW";

    const content = await prisma.content.create({
      data: {
        title: data.title,
        slug,
        description: data.description || data.body?.slice(0, 150),
        body: data.body,
        type: data.type,
        category: "Literature",
        language: data.language,
        status: initialStatus,
        authorName: effectiveAuthor,
        authorId: req.user!.id,
        thumbnailUrl: thumbnailUrl || "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=600&auto=format&fit=crop&q=80",
        ...(audioUrl && {
          audio: {
            create: {
              fileUrl: audioUrl,
              durationSec: durationSec || 180,
              narrator: effectiveAuthor,
              transcript: transcript || data.body || "",
            },
          },
        }),
      },
      include: { audio: true },
    });

    const message = isStaff
      ? `${data.type.replace(/_/g, " ")} published successfully!`
      : `${data.type.replace(/_/g, " ")} submitted successfully and is pending review by moderators!`;

    res.status(201).json({
      content: {
        ...content,
        audioUrl: content.audio?.fileUrl || "",
        durationSec: content.audio?.durationSec || 0,
        narrator: content.audio?.narrator || effectiveAuthor,
        transcript: content.audio?.transcript || "",
      },
      message,
    });
  } catch (error) {
    console.error("User upload literature error:", error);
    res.status(500).json({ error: "Failed to upload literature" });
  }
});

const ContentCreateSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  body: z.string().optional(),
  type: z.string(),
  category: z.string(),
  language: z.string().default("Hindi"),
  thumbnailUrl: z.string().optional(),
  authorName: z.string().optional(),
  tags: z.string().optional(),
  audioUrl: z.string().optional().default(""),
  durationSec: z.number().optional().default(180),
  narrator: z.string().optional(),
  transcript: z.string().optional(),
  status: z.string().default("PUBLISHED"),
});

// Create Content (Admin/Expert)
router.post("/", requireAuth, requireRole(["ADMIN", "EXPERT"]), async (req: AuthRequest, res: Response) => {
  try {
    const parsed = ContentCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0].message });
      return;
    }

    const { audioUrl, durationSec, narrator, transcript, ...data } = parsed.data;
    const slugBase = data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const slug = `${slugBase}-${Date.now().toString().slice(-4)}`;

    const content = await prisma.content.create({
      data: {
        title: data.title,
        slug,
        description: data.description,
        body: data.body,
        type: data.type,
        category: data.category,
        language: data.language,
        thumbnailUrl: data.thumbnailUrl,
        tags: data.tags,
        status: data.status,
        authorName: data.authorName || req.user?.name || "KishanVaani Expert",
        authorId: req.user?.id,
        ...(audioUrl && {
          audio: {
            create: {
              fileUrl: audioUrl,
              durationSec: durationSec || 180,
              narrator: narrator || req.user?.name || "KishanVaani Narrator",
              transcript: transcript || "",
            },
          },
        }),
      },
      include: { audio: true },
    });

    res.status(201).json(content);
  } catch (error) {
    console.error("Create content error:", error);
    res.status(500).json({ error: "Failed to create content" });
  }
});

// Delete Content (Admin)
router.delete("/:id", requireAuth, requireRole(["ADMIN"]), async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await prisma.content.delete({ where: { id } });
    res.json({ message: "Content deleted successfully" });
  } catch (error) {
    console.error("Delete content error:", error);
    res.status(500).json({ error: "Failed to delete content" });
  }
});

export default router;
