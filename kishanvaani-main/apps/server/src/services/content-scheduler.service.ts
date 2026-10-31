import prisma from "../prisma.js";
import { logAudit } from "./audit.service.js";

export interface ScheduleContentInput {
  title: string;
  description?: string;
  body?: string;
  type?: string;
  category?: string;
  language?: string;
  authorName?: string;
  thumbnailUrl?: string;
  audioUrl?: string;
  durationSec?: number;
  transcript?: string;
  scheduledPublishAt: string | Date;
}

export async function scheduleContent(input: ScheduleContentInput, userId: string, userName?: string) {
  const scheduledDate = new Date(input.scheduledPublishAt);
  if (isNaN(scheduledDate.getTime())) {
    throw new Error("Invalid scheduled publish date");
  }

  const slugBase = input.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const slug = `${slugBase}-${Date.now().toString().slice(-4)}`;

  const content = await prisma.content.create({
    data: {
      title: input.title,
      slug,
      description: input.description,
      body: input.body,
      type: input.type || "CROP_ADVISORY",
      category: input.category || "Agriculture",
      language: input.language || "Hindi",
      authorName: input.authorName || userName || "KishanVaani Desk",
      thumbnailUrl: input.thumbnailUrl,
      status: "SCHEDULED",
      scheduledPublishAt: scheduledDate,
      publishedAt: null,
      authorId: userId,
      audio: input.audioUrl
        ? {
            create: {
              fileUrl: input.audioUrl,
              durationSec: input.durationSec || 180,
              transcript: input.transcript,
              narrator: input.authorName || userName || "KishanVaani Desk",
            },
          }
        : undefined,
    },
    include: {
      audio: true,
    },
  });

  await logAudit({
    userId,
    userName,
    action: "SCHEDULE_CONTENT",
    targetType: "CONTENT",
    targetId: content.id,
    details: {
      title: content.title,
      scheduledPublishAt: scheduledDate.toISOString(),
      type: content.type,
    },
  });

  return content;
}

export async function publishDueScheduledContent() {
  const now = new Date();
  const dueItems = await prisma.content.findMany({
    where: {
      status: "SCHEDULED",
      scheduledPublishAt: {
        lte: now,
      },
    },
    include: {
      audio: true,
      author: { select: { id: true, name: true } },
    },
  });

  if (dueItems.length === 0) {
    return { count: 0, publishedItems: [] };
  }

  const dueIds = dueItems.map((item) => item.id);

  await prisma.content.updateMany({
    where: { id: { in: dueIds } },
    data: {
      status: "PUBLISHED",
      publishedAt: now,
    },
  });

  // Log audit records
  for (const item of dueItems) {
    await logAudit({
      userId: item.authorId || "system",
      userName: item.author?.name || "System Scheduler",
      action: "AUTO_PUBLISH_SCHEDULED",
      targetType: "CONTENT",
      targetId: item.id,
      details: {
        title: item.title,
        originallyScheduledFor: item.scheduledPublishAt?.toISOString(),
        publishedAt: now.toISOString(),
      },
    });
  }

  return {
    count: dueItems.length,
    publishedItems: dueItems.map((i) => ({ id: i.id, title: i.title })),
  };
}

export async function getScheduledContent() {
  const items = await prisma.content.findMany({
    where: { status: "SCHEDULED" },
    include: {
      audio: true,
      author: { select: { id: true, name: true, email: true } },
    },
    orderBy: { scheduledPublishAt: "asc" },
  });

  return items;
}

export async function publishNow(contentId: string, userId: string, userName?: string) {
  const item = await prisma.content.findUnique({
    where: { id: contentId },
  });

  if (!item) {
    throw new Error("Content not found");
  }

  const updated = await prisma.content.update({
    where: { id: contentId },
    data: {
      status: "PUBLISHED",
      publishedAt: new Date(),
    },
  });

  await logAudit({
    userId,
    userName,
    action: "PUBLISH_CONTENT_NOW",
    targetType: "CONTENT",
    targetId: updated.id,
    details: {
      title: updated.title,
      previousStatus: item.status,
    },
  });

  return updated;
}

export default {
  scheduleContent,
  publishDueScheduledContent,
  getScheduledContent,
  publishNow,
};
