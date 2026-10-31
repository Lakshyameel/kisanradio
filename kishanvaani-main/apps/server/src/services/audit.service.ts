import prisma from "../prisma.js";

export interface LogAuditParams {
  userId: string;
  userName?: string;
  action: string;
  targetType: string;
  targetId?: string;
  details?: string | Record<string, any>;
  ipAddress?: string;
}

export async function logAudit(params: LogAuditParams) {
  try {
    const formattedDetails =
      typeof params.details === "object"
        ? JSON.stringify(params.details)
        : params.details;

    const record = await prisma.auditLog.create({
      data: {
        userId: params.userId,
        userName: params.userName || undefined,
        action: params.action,
        targetType: params.targetType,
        targetId: params.targetId || undefined,
        details: formattedDetails || undefined,
        ipAddress: params.ipAddress || undefined,
      },
    });
    return record;
  } catch (error) {
    // Non-blocking: audit log failure should never crash the main transaction
    console.error("Failed to record audit log:", error);
    return null;
  }
}

export async function getAuditLogs(options?: {
  page?: number;
  limit?: number;
  action?: string;
  targetType?: string;
}) {
  const page = Math.max(1, options?.page || 1);
  const limit = Math.min(100, Math.max(1, options?.limit || 25));
  const skip = (page - 1) * limit;

  const where: any = {};
  if (options?.action) where.action = options.action;
  if (options?.targetType) where.targetType = options.targetType;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    logs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export default {
  logAudit,
  getAuditLogs,
};
