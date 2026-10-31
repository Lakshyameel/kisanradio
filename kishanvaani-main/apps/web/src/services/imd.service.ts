import api from "../lib/api";

export type RegionName = "North" | "South" | "East" | "West" | "Central" | "North-East" | "Islands";

export interface ImdForecastDay {
  date: string;
  day: string;
  maxTemp: number;
  minTemp: number;
  morningHumidity: number; // RH-I at 08:30 IST (%)
  eveningHumidity: number; // RH-II at 17:30 IST (%)
  windSpeed: number; // km/h
  windDirection: string;
  rainfallMm: number;
  rainProb: string;
  cloudCover: string;
  condition: string;
  icon: string;
}

export interface CropAgrometItem {
  crop: string;
  stage: string;
  recommendation: string;
  pestDiseaseRisk: string;
  controlMeasure?: string;
}

export interface ImdAgrometBulletin {
  bulletinNumber: string;
  issuedDate: string;
  issuingAgency: string;
  district: string;
  state: string;
  generalAdvisory: string;
  sprayWindow: {
    safeToSpray: boolean;
    recommendedHours: string;
    windSpeedKmh: number;
    rainThreat: string;
    message: string;
  };
  irrigationAdvisory: {
    status: "ADEQUATE" | "DEFICIT" | "SURPLUS";
    message: string;
    nextIrrigationWindow: string;
  };
  cropAdvisories: CropAgrometItem[];
  livestockAdvisory: string;
}

export interface ImdWarningAlert {
  alertLevel: "GREEN" | "YELLOW" | "ORANGE" | "RED";
  levelName: string;
  phenomenon: string;
  severity: "NONE" | "MODERATE" | "SEVERE" | "EXTREME";
  validUntil: string;
  impactOnFarming: string;
  farmerAction: string;
}

export interface ImdNowcast {
  station: string;
  radarStation: string;
  status: "CLEAR" | "CONVECTIVE_CELLS" | "THUNDERSTORM_WATCH";
  headline: string;
  validForHours: number;
  gustSpeedKmh: number;
  rainfallExpected3hMm: number;
  satelliteObservation: string;
  issuedAt: string;
}

export interface ImdForecastResponse {
  district: string;
  state: string;
  region?: RegionName;
  agroZone: string;
  elevationMeters: number;
  agency: string;
  generatedAt: string;
  currentObservation: {
    temperature: number;
    feelsLike: number;
    minTemp: number;
    maxTemp: number;
    condition: string;
    humidity: number;
    windSpeed: number;
    windDirection: string;
    pressureHpa: number;
    uvIndex: number;
    rainfall24hMm: number;
  };
  warning: ImdWarningAlert;
  nowcast: ImdNowcast;
  forecast: ImdForecastDay[];
}

export interface PanIndiaDistrictSummary {
  id: string;
  district: string;
  state: string;
  region: RegionName;
  agroZone: string;
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  rainProb: string;
  alertLevel: "GREEN" | "YELLOW" | "ORANGE" | "RED";
  primaryCrops: string[];
}

export interface PanIndiaRegionGroup {
  region: RegionName;
  totalDistricts: number;
  avgTemperature: number;
  tempRange: { min: number; max: number };
  activeAlerts: { green: number; yellow: number; orange: number; red: number };
  districts: PanIndiaDistrictSummary[];
}

export interface PanIndiaOverviewResponse {
  totalDistrictsReporting: number;
  totalStatesAndUTs: number;
  nationalWeatherStatus: string;
  regions: PanIndiaRegionGroup[];
}

export interface ImdStatesResponse {
  count: number;
  states: Array<{
    state: string;
    region?: RegionName;
    districts: string[];
    agroZone: string;
    primaryCrops: string[];
  }>;
}

export interface ImdNationalSummary {
  agency: string;
  date: string;
  totalDistrictsReporting?: number;
  monsoonStatus: string;
  activeSystems: string[];
  allIndiaRainfallStatus: string;
  agroHighlights: string[];
  alertCounts: {
    green: number;
    yellow: number;
    orange: number;
    red: number;
  };
}

export interface LocatedDistrictResponse {
  success: boolean;
  district: string;
  state: string;
  region: RegionName;
  agroZone: string;
  distanceKm: number;
  stationCoords: { lat: number; lon: number };
  userCoords: { lat: number; lon: number };
  elevationMeters?: number;
  primaryCrops: string[];
  current: {
    temperature: number;
    feelsLike?: number;
    condition: string;
    humidity: number;
    windSpeed: number;
    windDirection?: string;
  };
  warning?: ImdWarningAlert;
  nowcast?: ImdNowcast;
}

export async function locateNearestDistrict(lat: number, lon: number): Promise<LocatedDistrictResponse> {
  const res = await api.get<LocatedDistrictResponse>("/imd/locate", {
    params: { lat, lon },
  });
  return res.data;
}

export async function fetchImdForecast(
  district?: string,
  state?: string,
  days = 7,
  search?: string,
  lat?: number,
  lon?: number
): Promise<ImdForecastResponse> {
  const res = await api.get<ImdForecastResponse>("/imd/forecast", {
    params: { district, state, days, search, lat, lon },
  });
  return res.data;
}

export async function fetchImdAgrometAdvisory(
  district?: string,
  state?: string,
  search?: string,
  lat?: number,
  lon?: number
): Promise<ImdAgrometBulletin> {
  const res = await api.get<ImdAgrometBulletin>("/imd/advisory", {
    params: { district, state, search, lat, lon },
  });
  return res.data;
}

export async function fetchImdWarnings(district?: string, state?: string): Promise<{
  district: string;
  state: string;
  warning: ImdWarningAlert;
  allRegionalAlerts: Array<{ district: string; state: string; region?: RegionName; alertLevel: string; phenomenon: string }>;
}> {
  const res = await api.get("/imd/warnings", {
    params: { district, state },
  });
  return res.data;
}

export async function fetchImdNowcast(district?: string, state?: string): Promise<{
  district: string;
  state: string;
  nowcast: ImdNowcast;
}> {
  const res = await api.get("/imd/nowcast", {
    params: { district, state },
  });
  return res.data;
}

export async function fetchImdStates(): Promise<ImdStatesResponse> {
  const res = await api.get<ImdStatesResponse>("/imd/states");
  return res.data;
}

export async function fetchImdNationalSummary(): Promise<ImdNationalSummary> {
  const res = await api.get<ImdNationalSummary>("/imd/summary");
  return res.data;
}

export async function fetchPanIndiaOverview(region?: string): Promise<PanIndiaOverviewResponse> {
  const res = await api.get<PanIndiaOverviewResponse>("/imd/pan-india", {
    params: { region },
  });
  return res.data;
}

export async function searchImdLocations(query: string): Promise<{
  results: Array<{
    id: string;
    district: string;
    state: string;
    region: RegionName;
    agroZone: string;
    temperature: number;
    condition: string;
    primaryCrops: string[];
  }>;
  count: number;
}> {
  const res = await api.get("/imd/search", {
    params: { q: query },
  });
  return res.data;
}
