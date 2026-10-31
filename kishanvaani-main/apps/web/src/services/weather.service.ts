import api from "../lib/api";
import { getLiveAccurateWeather } from "./live-weather.service";

export interface WeatherData {
  id: string;
  locationKey: string;
  district: string;
  state: string;
  temperature: number;
  minTemp?: number;
  maxTemp?: number;
  feelsLike?: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  windDirection?: string;
  rainfallForecast: string;
  advisory: string;
  agroZone?: string;
}

export interface WeatherForecastItem {
  day: string;
  date?: string;
  temp: number;
  minTemp?: number;
  maxTemp?: number;
  condition: string;
  rainProb: string;
  rainfallMm?: number;
  morningHumidity?: number;
  eveningHumidity?: number;
  windSpeed?: number;
  windDirection?: string;
  cloudCover?: string;
  icon?: string;
}

export interface WeatherResponse {
  source?: "LIVE" | "STATIC";
  dataSource?: string;
  agency?: string;
  current: WeatherData | null;
  forecast: WeatherForecastItem[];
  sprayAdvisory: {
    safeToSpray: boolean;
    message: string;
    recommendedHours?: string;
    windSpeedKmh?: number;
  };
  irrigationAdvisory?: {
    status: "ADEQUATE" | "DEFICIT" | "SURPLUS";
    message: string;
    nextIrrigationWindow?: string;
  };
  warning?: {
    alertLevel: "GREEN" | "YELLOW" | "ORANGE" | "RED";
    levelName: string;
    phenomenon: string;
    severity: string;
    validUntil: string;
    impactOnFarming: string;
    farmerAction: string;
  };
  nowcast?: {
    station: string;
    radarStation: string;
    status: string;
    headline: string;
    validForHours: number;
    gustSpeedKmh: number;
    rainfallExpected3hMm: number;
    satelliteObservation: string;
    issuedAt: string;
  };
  cropAdvisories?: Array<{
    crop: string;
    stage: string;
    recommendation: string;
    pestDiseaseRisk: string;
    controlMeasure?: string;
  }>;
  livestockAdvisory?: string;
  locatedInfo?: {
    isAutoLocated: boolean;
    distanceKm: number;
    stationCoords: { lat: number; lon: number };
    userCoords: { lat: number; lon: number };
  };
  availableLocations: Array<{
    district: string;
    state: string;
    locationKey: string;
    temperature: number;
    condition: string;
  }>;
}

export async function fetchWeather(
  district?: string,
  state?: string,
  search?: string,
  lat?: number,
  lon?: number
): Promise<WeatherResponse> {
  // First attempt real-time live meteorological data from Open-Meteo
  try {
    const liveData = await getLiveAccurateWeather({ district, state, search, lat, lon });
    if (liveData && liveData.current) {
      return liveData;
    }
  } catch (err) {
    console.warn("Live Open-Meteo weather fetch had an issue, falling back to local server:", err);
  }

  // Fallback to local server API
  const params: Record<string, string> = {};
  if (district) params.district = district;
  if (state) params.state = state;
  if (search) params.search = search;
  if (lat !== undefined) params.lat = String(lat);
  if (lon !== undefined) params.lon = String(lon);

  const res = await api.get<WeatherResponse>("/weather", { params });
  return res.data;
}
