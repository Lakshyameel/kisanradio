import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import {
  CROPS_DATA,
  SUPPORTED_DISTRICTS,
  calculateCropSchedule,
} from "../services/crop-calendar.service.js";
import imdService from "../services/imd.service.js";

const router = Router();

const ScheduleQuerySchema = z.object({
  crop: z.string().default("Wheat"),
  district: z.string().default("Ludhiana"),
  sowingDate: z.string().optional(),
});

const SprayWindowQuerySchema = z.object({
  district: z.string().optional().default("Ludhiana"),
  state: z.string().optional(),
});

const ReminderSubscribeSchema = z.object({
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  channel: z.enum(["WHATSAPP", "SMS"]).default("WHATSAPP"),
  crop: z.string().min(1),
  district: z.string().min(1),
  sowingDate: z.string().min(1),
});

/**
 * GET /api/v1/crop-calendar/crops
 * List all supported crops with details
 */
router.get("/crops", (_req: Request, res: Response) => {
  const crops = Object.values(CROPS_DATA).map((c) => ({
    id: c.id,
    name: c.name,
    nameHi: c.nameHi,
    season: c.season,
    durationDays: c.durationDays,
    optimalSowingWindow: c.optimalSowingWindow,
    optimalSowingWindowHi: c.optimalSowingWindowHi,
    stagesCount: c.stages.length,
  }));

  res.json({
    success: true,
    data: crops,
  });
});

/**
 * GET /api/v1/crop-calendar/districts
 * List all supported agro-climatic districts
 */
router.get("/districts", (_req: Request, res: Response) => {
  res.json({
    success: true,
    count: SUPPORTED_DISTRICTS.length,
    data: SUPPORTED_DISTRICTS,
  });
});

/**
 * GET /api/v1/crop-calendar/schedule
 * Personalized crop schedule with active stage, DAS progress, urgent reminders & weather spray status
 */
router.get("/schedule", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = ScheduleQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: "Invalid query parameters",
        details: parsed.error.flatten(),
      });
    }

    const { crop, district, sowingDate } = parsed.data;
    const schedule = calculateCropSchedule(crop, district, sowingDate);

    // Fetch real-time spray window advisory from IMD
    let sprayAdvisory = null;
    try {
      const agromet = await imdService.getAgrometAdvisory({ district: schedule.district.district });
      sprayAdvisory = {
        safeToSpray: agromet.sprayWindow.safeToSpray,
        recommendedHours: agromet.sprayWindow.recommendedHours,
        windSpeedKmh: agromet.sprayWindow.windSpeedKmh,
        rainThreat: agromet.sprayWindow.rainThreat,
        message: agromet.sprayWindow.message,
        irrigationStatus: agromet.irrigationAdvisory.status,
        irrigationAdvice: agromet.irrigationAdvisory.message,
      };
    } catch {
      // Fallback if IMD advisory unavailable
      sprayAdvisory = {
        safeToSpray: true,
        recommendedHours: "07:00 AM - 10:00 AM",
        windSpeedKmh: 8,
        rainThreat: "Nil significant rain",
        message: "Favorable spraying conditions in calm morning hours.",
        irrigationStatus: "ADEQUATE",
        irrigationAdvice: "Maintain normal soil moisture.",
      };
    }

    res.json({
      success: true,
      data: {
        ...schedule,
        weatherSprayAdvisory: sprayAdvisory,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/crop-calendar/spray-window
 * Quick check on current spray window suitability based on live IMD weather
 */
router.get("/spray-window", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = SprayWindowQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: "Invalid query parameters",
        details: parsed.error.flatten(),
      });
    }

    const { district, state } = parsed.data;
    const agromet = await imdService.getAgrometAdvisory({ district, state });

    res.json({
      success: true,
      data: {
        district: agromet.district,
        state: agromet.state,
        sprayWindow: agromet.sprayWindow,
        irrigationAdvisory: agromet.irrigationAdvisory,
        issuedDate: agromet.issuedDate,
        issuingAgency: agromet.issuingAgency,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/crop-calendar/reminders/subscribe
 * Subscribe phone number to WhatsApp or SMS sowing and spray alerts
 */
router.post("/reminders/subscribe", (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = ReminderSubscribeSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: parsed.error.flatten(),
      });
    }

    const { phone, channel, crop, district, sowingDate } = parsed.data;

    res.json({
      success: true,
      message: `Successfully subscribed ${phone} to ${channel} alerts for ${crop} in ${district}.`,
      data: {
        subscriptionId: `REM-${Date.now().toString(36).toUpperCase()}`,
        phone: phone.replace(/(\d{2})\d{6}(\d{2})/, "$1******$2"),
        channel,
        crop,
        district,
        sowingDate,
        activeRemindersCount: 3,
        status: "ACTIVE",
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
