import prisma from "../prisma.js";
import { logAudit } from "./audit.service.js";
import { z } from "zod";

export const BulkContentItemSchema = z.object({
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
  status: z.enum(["PUBLISHED", "DRAFT", "SCHEDULED"]).default("PUBLISHED"),
});

export const BulkMandiItemSchema = z.object({
  state: z.string().min(2),
  district: z.string().min(2),
  market: z.string().min(2),
  commodity: z.string().min(2),
  variety: z.string().optional().default("Common"),
  minPrice: z.number().positive(),
  maxPrice: z.number().positive(),
  modalPrice: z.number().positive(),
  arrivals: z.number().optional().default(100),
  source: z.string().optional().default("AGMARKNET"),
  tradeStatus: z.string().optional().default("AUCTION_SETTLED"),
  priceDate: z.string().optional(),
  trend: z.enum(["UP", "DOWN", "STABLE"]).optional().default("STABLE"),
});

export async function bulkUploadContent(items: any[], userId: string, userName?: string) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Items array must be non-empty");
  }

  const validatedItems: z.infer<typeof BulkContentItemSchema>[] = [];
  const errors: { index: number; error: string }[] = [];

  items.forEach((item, idx) => {
    const res = BulkContentItemSchema.safeParse(item);
    if (res.success) {
      validatedItems.push(res.data);
    } else {
      errors.push({ index: idx, error: res.error.issues[0]?.message || "Validation failed" });
    }
  });

  if (validatedItems.length === 0) {
    throw new Error(`All ${items.length} items failed validation: ${errors[0]?.error}`);
  }

  const createdIds: string[] = [];
  const now = new Date();

  for (const item of validatedItems) {
    const slugBase = item.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const slug = `${slugBase}-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 1000)}`;

    const created = await prisma.content.create({
      data: {
        title: item.title,
        slug,
        description: item.description,
        body: item.body,
        type: item.type,
        category: item.category,
        language: item.language,
        authorName: item.authorName || userName || "KishanVaani Desk",
        thumbnailUrl: item.thumbnailUrl,
        status: item.status,
        publishedAt: item.status === "PUBLISHED" ? now : null,
        authorId: userId,
        audio: item.audioUrl
          ? {
              create: {
                fileUrl: item.audioUrl,
                durationSec: item.durationSec || 180,
                transcript: item.transcript,
                narrator: item.authorName || userName || "KishanVaani Desk",
              },
            }
          : undefined,
      },
    });

    createdIds.push(created.id);
  }

  await logAudit({
    userId,
    userName,
    action: "BULK_UPLOAD",
    targetType: "CONTENT",
    details: {
      count: createdIds.length,
      failedCount: errors.length,
      sampleTitles: validatedItems.slice(0, 3).map((v) => v.title),
    },
  });

  return {
    success: true,
    totalReceived: items.length,
    successCount: createdIds.length,
    failedCount: errors.length,
    errors: errors.slice(0, 5),
    createdIds,
  };
}

export async function bulkUploadMandiPrices(items: any[], userId: string, userName?: string) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Items array must be non-empty");
  }

  const validatedItems: z.infer<typeof BulkMandiItemSchema>[] = [];
  const errors: { index: number; error: string }[] = [];

  items.forEach((item, idx) => {
    const res = BulkMandiItemSchema.safeParse(item);
    if (res.success) {
      validatedItems.push(res.data);
    } else {
      errors.push({ index: idx, error: res.error.issues[0]?.message || "Validation failed" });
    }
  });

  if (validatedItems.length === 0) {
    throw new Error(`All ${items.length} items failed validation: ${errors[0]?.error}`);
  }

  const recordsToInsert = validatedItems.map((item) => ({
    state: item.state,
    district: item.district,
    market: item.market,
    commodity: item.commodity,
    variety: item.variety || "Common",
    minPrice: item.minPrice,
    maxPrice: item.maxPrice,
    modalPrice: item.modalPrice,
    arrivals: item.arrivals || 100,
    source: item.source || "AGMARKNET",
    tradeStatus: item.tradeStatus || "AUCTION_SETTLED",
    priceDate: item.priceDate ? new Date(item.priceDate) : new Date(),
    trend: item.trend || "STABLE",
  }));

  const inserted = await prisma.mandiPrice.createMany({
    data: recordsToInsert,
  });

  await logAudit({
    userId,
    userName,
    action: "BULK_UPLOAD",
    targetType: "MANDI_PRICE",
    details: {
      count: inserted.count,
      failedCount: errors.length,
      sampleCommodities: Array.from(new Set(validatedItems.map((v) => v.commodity))).slice(0, 5),
    },
  });

  return {
    success: true,
    totalReceived: items.length,
    successCount: inserted.count,
    failedCount: errors.length,
    errors: errors.slice(0, 5),
  };
}

export default {
  bulkUploadContent,
  bulkUploadMandiPrices,
};
