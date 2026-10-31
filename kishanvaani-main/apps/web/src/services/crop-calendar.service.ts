import api from "../lib/api";

export interface CropSummary {
  id: string;
  name: string;
  nameHi: string;
  season: "Rabi" | "Kharif" | "Zaid";
  durationDays: number;
  optimalSowingWindow: string;
  optimalSowingWindowHi: string;
  stagesCount: number;
}

export interface DistrictSummary {
  state: string;
  district: string;
  zone: string;
  soilType: string;
}

export interface UrgentReminder {
  stageId: string;
  category: "FIELD_PREP" | "SOWING" | "FERTILIZER" | "IRRIGATION" | "SPRAY" | "HARVEST";
  title: string;
  titleHi: string;
  description: string;
  descriptionHi: string;
  dosage?: string;
  dosageHi?: string;
  weatherPrecaution?: string;
  weatherPrecautionHi?: string;
  isSprayStage: boolean;
  dueInDays: number;
  status: "ACTIVE_NOW" | "UPCOMING_SOON";
}

export interface CropStageDetail {
  id: string;
  stageName: string;
  stageNameHi: string;
  startDay: number;
  endDay: number;
  category: "FIELD_PREP" | "SOWING" | "FERTILIZER" | "IRRIGATION" | "SPRAY" | "HARVEST";
  title: string;
  titleHi: string;
  description: string;
  descriptionHi: string;
  dosage?: string;
  dosageHi?: string;
  weatherPrecaution?: string;
  weatherPrecautionHi?: string;
  isSprayStage?: boolean;
  isCompleted: boolean;
  isCurrent: boolean;
  isFuture: boolean;
}

export interface WeatherSprayAdvisory {
  safeToSpray: boolean;
  recommendedHours: string;
  windSpeedKmh: number;
  rainThreat: string;
  message: string;
  irrigationStatus: "ADEQUATE" | "DEFICIT" | "SURPLUS";
  irrigationAdvice: string;
}

export interface CropScheduleResponse {
  crop: {
    id: string;
    name: string;
    nameHi: string;
    season: string;
    durationDays: number;
    optimalSowingWindow: string;
    optimalSowingWindowHi: string;
  };
  district: {
    district: string;
    state: string;
    zone: string;
    soilType: string;
  };
  sowingDate: string;
  daysElapsed: number;
  progressPercent: number;
  currentStage: {
    id: string;
    stageName: string;
    stageNameHi: string;
    title: string;
    titleHi: string;
    startDay: number;
    endDay: number;
    category: string;
  };
  urgentReminders: UrgentReminder[];
  allStages: CropStageDetail[];
  weatherSprayAdvisory: WeatherSprayAdvisory;
}

export interface ReminderSubscriptionPayload {
  phone: string;
  channel: "WHATSAPP" | "SMS";
  crop: string;
  district: string;
  sowingDate: string;
}

export const cropCalendarService = {
  async getCrops(): Promise<CropSummary[]> {
    const res = await api.get("/crop-calendar/crops");
    return res.data.data;
  },

  async getDistricts(): Promise<DistrictSummary[]> {
    const res = await api.get("/crop-calendar/districts");
    return res.data.data;
  },

  async getSchedule(params: {
    crop: string;
    district: string;
    sowingDate?: string;
  }): Promise<CropScheduleResponse> {
    const res = await api.get("/crop-calendar/schedule", { params });
    return res.data.data;
  },

  async getSprayWindow(params: { district?: string; state?: string }) {
    const res = await api.get("/crop-calendar/spray-window", { params });
    return res.data.data;
  },

  async subscribeReminders(payload: ReminderSubscriptionPayload) {
    const res = await api.post("/crop-calendar/reminders/subscribe", payload);
    return res.data;
  },
};

export default cropCalendarService;
