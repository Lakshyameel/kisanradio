/**
 * Live Weather Service — Open-Meteo Integration
 * Fetches REAL, LIVE weather data for ANY city/district in India.
 * APIs used:
 *   - Nominatim (OpenStreetMap) — geocode any place name → lat/lon (cached for 7 days)
 *   - Open-Meteo — real weather data by lat/lon (cached for 15 minutes)
 *   - Fallback → static IMD district data if network unavailable
 */

import { ALL_INDIA_DISTRICTS } from "../data/imd-districts.data.js";

// ── In-Memory Caches ─────────────────────────────────────────────────────────

// 1. Geocode Cache (7 days TTL)
interface GeocodeCacheEntry {
  lat: number;
  lon: number;
  displayName: string;
  expiresAt: number;
}
const geocodeCache = new Map<string, GeocodeCacheEntry>();
const GEOCODE_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

// 2. Reverse Geocode Cache (7 days TTL)
interface ReverseGeocodeCacheEntry {
  district: string;
  state: string;
  expiresAt: number;
}
const reverseGeocodeCache = new Map<string, ReverseGeocodeCacheEntry>();
const REVERSE_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

// 3. Live Weather Data Cache (15 minutes TTL keyed by rounded lat/lon)
interface WeatherCacheEntry {
  data: any;
  expiresAt: number;
}
const weatherCache = new Map<string, WeatherCacheEntry>();
const WEATHER_CACHE_TTL_MS = 15 * 60 * 1000;

// ── WMO Weather Code → Human readable condition ─────────────────────────────
function wmoToCondition(code: number): { condition: string; icon: string } {
  if (code === 0) return { condition: "Clear Sky", icon: "sun" };
  if (code === 1) return { condition: "Mainly Clear", icon: "sun" };
  if (code === 2) return { condition: "Partly Cloudy", icon: "cloud-sun" };
  if (code === 3) return { condition: "Overcast", icon: "cloud" };
  if (code === 45 || code === 48) return { condition: "Foggy", icon: "cloud-fog" };
  if (code === 51) return { condition: "Light Drizzle", icon: "cloud-rain" };
  if (code === 53) return { condition: "Moderate Drizzle", icon: "cloud-rain" };
  if (code === 55) return { condition: "Heavy Drizzle", icon: "cloud-rain" };
  if (code === 61) return { condition: "Light Rain", icon: "cloud-rain" };
  if (code === 63) return { condition: "Moderate Rain", icon: "cloud-rain" };
  if (code === 65) return { condition: "Heavy Rain", icon: "cloud-rain" };
  if (code === 71 || code === 73 || code === 75) return { condition: "Snowfall", icon: "cloud" };
  if (code === 77) return { condition: "Snow Grains", icon: "cloud" };
  if (code === 80) return { condition: "Light Rain Showers", icon: "cloud-rain" };
  if (code === 81) return { condition: "Moderate Rain Showers", icon: "cloud-rain" };
  if (code === 82) return { condition: "Violent Rain Showers", icon: "cloud-lightning" };
  if (code === 85 || code === 86) return { condition: "Snow Showers", icon: "cloud" };
  if (code === 95) return { condition: "Thunderstorm", icon: "cloud-lightning" };
  if (code === 96 || code === 99) return { condition: "Thunderstorm with Hail", icon: "cloud-lightning" };
  return { condition: "Variable Clouds", icon: "cloud-sun" };
}

// ── Wind direction from degrees ───────────────────────────────────────────────
function degreesToDirection(deg: number): string {
  const dirs = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  return dirs[Math.round(deg / 22.5) % 16];
}

// ── Alert level computed from full daily forecast (not single hour WMO code) ──
function computeDailyAlertLevel(
  todayWmo: number,
  todayRainMm: number,
  todayWindMaxKmh: number,
  curWmo: number
): "GREEN" | "YELLOW" | "ORANGE" | "RED" {
  // RED: Extreme rainfall (>115.5 mm) or violent storm with hail/squalls (WMO 99) or hurricane-force wind
  if (todayRainMm >= 115.5 || todayWmo === 99 || todayWindMaxKmh >= 70) {
    return "RED";
  }
  // ORANGE: Heavy rainfall (>64.5 mm) or severe thunderstorm (WMO 96) or gale winds (>= 50 km/h)
  if (todayRainMm >= 64.5 || todayWmo === 96 || todayWindMaxKmh >= 50) {
    return "ORANGE";
  }
  // YELLOW: Rather heavy rain (>15 mm) or localized thunderstorm (WMO 95) or gusty winds (>= 30 km/h) or showers
  if (todayRainMm >= 15 || todayWmo === 95 || curWmo === 95 || todayWindMaxKmh >= 30 || todayWmo >= 80) {
    return "YELLOW";
  }
  // GREEN: Normal conditions
  return "GREEN";
}

// ── Day name from date string ─────────────────────────────────────────────────
function dayName(dateStr: string, index: number): string {
  if (index === 0) return "Today";
  if (index === 1) return "Tomorrow";
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days[new Date(dateStr).getDay()];
}

// ── Geocode: place name → { lat, lon, displayName } ──────────────────────────
export async function geocodePlace(query: string): Promise<{ lat: number; lon: number; displayName: string } | null> {
  const qClean = query.trim().toLowerCase();
  if (!qClean) return null;

  // 1. Check local pre-compiled all-India district benchmark (zero network overhead)
  const localDistrict = ALL_INDIA_DISTRICTS.find(
    (d) =>
      d.district.toLowerCase() === qClean ||
      `${d.district} ${d.state}`.toLowerCase() === qClean ||
      qClean.startsWith(d.district.toLowerCase())
  );
  if (localDistrict) {
    return {
      lat: localDistrict.lat,
      lon: localDistrict.lon,
      displayName: `${localDistrict.district}, ${localDistrict.state}, India`,
    };
  }

  // 2. Check in-memory geocode cache
  const cached = geocodeCache.get(qClean);
  if (cached && cached.expiresAt > Date.now()) {
    return {
      lat: cached.lat,
      lon: cached.lon,
      displayName: cached.displayName,
    };
  }

  // 3. Fallback to Nominatim OpenStreetMap
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query + " India")}&format=json&limit=1&countrycodes=in`;
    const res = await fetch(url, {
      headers: { "User-Agent": "KishanVaani/1.0 (agriculture weather app; contact@kishanvaani.in)" },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const data: any[] = await res.json();
    if (!data.length) return null;

    const result = {
      lat: parseFloat(data[0].lat),
      lon: parseFloat(data[0].lon),
      displayName: data[0].display_name || query,
    };

    // Cache result for 7 days
    geocodeCache.set(qClean, {
      ...result,
      expiresAt: Date.now() + GEOCODE_CACHE_TTL_MS,
    });

    return result;
  } catch {
    return null;
  }
}

// ── Reverse geocode: lat/lon → place name ────────────────────────────────────
export async function reverseGeocode(lat: number, lon: number): Promise<{ district: string; state: string } | null> {
  const coordKey = `${lat.toFixed(2)},${lon.toFixed(2)}`;

  // 1. Check in-memory reverse cache
  const cached = reverseGeocodeCache.get(coordKey);
  if (cached && cached.expiresAt > Date.now()) {
    return { district: cached.district, state: cached.state };
  }

  // 2. Check if coordinates match an existing benchmark district within 25 km
  let closestDistrict: (typeof ALL_INDIA_DISTRICTS)[0] | null = null;
  let minDistanceKm = Infinity;
  for (const d of ALL_INDIA_DISTRICTS) {
    const dLat = ((d.lat - lat) * Math.PI) / 180;
    const dLon = ((d.lon - lon) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat * Math.PI) / 180) * Math.cos((d.lat * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const dist = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    if (dist < minDistanceKm) {
      minDistanceKm = dist;
      closestDistrict = d;
    }
  }

  if (closestDistrict && minDistanceKm <= 25) {
    const result = { district: closestDistrict.district, state: closestDistrict.state };
    reverseGeocodeCache.set(coordKey, {
      ...result,
      expiresAt: Date.now() + REVERSE_CACHE_TTL_MS,
    });
    return result;
  }

  // 3. Fallback to Nominatim reverse lookup
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=10&addressdetails=1`;
    const res = await fetch(url, {
      headers: { "User-Agent": "KishanVaani/1.0 (agriculture weather app; contact@kishanvaani.in)" },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const data: any = await res.json();
    const addr = data.address || {};
    const district =
      addr.county || addr.district || addr.city || addr.town || addr.village || addr.state_district || "Unknown";
    const state = addr.state || "India";

    const result = { district, state };
    reverseGeocodeCache.set(coordKey, {
      ...result,
      expiresAt: Date.now() + REVERSE_CACHE_TTL_MS,
    });
    return result;
  } catch {
    return null;
  }
}

// ── Fetch live weather from Open-Meteo ───────────────────────────────────────
export async function fetchLiveWeather(lat: number, lon: number) {
  const url = [
    `https://api.open-meteo.com/v1/forecast`,
    `?latitude=${lat}&longitude=${lon}`,
    `&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure,uv_index`,
    `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,relative_humidity_2m_mean,relative_humidity_2m_max,relative_humidity_2m_min,uv_index_max,weather_code,wind_speed_10m_max,wind_direction_10m_dominant`,
    `&timezone=Asia%2FKolkata`,
    `&forecast_days=7`,
  ].join("");

  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`Open-Meteo error: ${res.status}`);
  return await res.json();
}

// ── Main: Build full weather response from live data ─────────────────────────
export async function getLiveWeatherForLocation(params: {
  lat?: number;
  lon?: number;
  district?: string;
  state?: string;
  search?: string;
}): Promise<{
  source: "LIVE" | "STATIC";
  district: string;
  state: string;
  lat: number;
  lon: number;
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
  warning: {
    alertLevel: "GREEN" | "YELLOW" | "ORANGE" | "RED";
    levelName: string;
    phenomenon: string;
    severity: "NONE" | "MODERATE" | "SEVERE" | "EXTREME";
    validUntil: string;
    impactOnFarming: string;
    farmerAction: string;
    isOfficialImd: boolean;
    advisoryType: string;
  };
  forecast: Array<{
    date: string;
    day: string;
    maxTemp: number;
    minTemp: number;
    morningHumidity: number;
    eveningHumidity: number;
    windSpeed: number;
    windDirection: string;
    rainfallMm: number;
    rainProb: string;
    uvIndex: number;
    condition: string;
    icon: string;
  }>;
}> {
  let lat = params.lat;
  let lon = params.lon;
  let districtName = params.district || params.search || "Unknown";
  let stateName = params.state || "India";

  // Step 1 — Resolve coordinates from place name if not given
  if ((lat === undefined || lon === undefined) && (params.district || params.search)) {
    const query = params.search || `${params.district} ${params.state || "India"}`;
    const geo = await geocodePlace(query);
    if (geo) {
      lat = geo.lat;
      lon = geo.lon;
    }
  }

  // Step 2 — If still no coordinates, throw so caller can check benchmarks or return 404
  if (lat === undefined || lon === undefined) {
    throw new Error("Could not resolve coordinates for the given location");
  }

  // Step 3 — Check 15-minute in-memory cache keyed by rounded lat/lon
  const cacheKey = `${lat.toFixed(2)},${lon.toFixed(2)}`;
  const cachedForecast = weatherCache.get(cacheKey);
  if (cachedForecast && cachedForecast.expiresAt > Date.now()) {
    return cachedForecast.data;
  }

  // Step 4 — Reverse geocode to get proper district/state name
  const place = await reverseGeocode(lat, lon);
  if (place) {
    districtName = place.district;
    stateName = place.state;
  }

  // Step 5 — Fetch live weather from Open-Meteo
  const raw = await fetchLiveWeather(lat, lon);
  const cur = raw.current;
  const daily = raw.daily;

  const wmo = cur.weather_code as number;
  const { condition: curCondition } = wmoToCondition(wmo);

  // Compute alert level from full daily forecast (rain, wind, severe weather codes)
  const todayWmo = (daily.weather_code as number[])?.[0] ?? wmo;
  const todayRain = (daily.precipitation_sum as number[])?.[0] ?? (cur.precipitation || 0);
  const todayWindMax = (daily.wind_speed_10m_max as number[])?.[0] ?? (cur.wind_speed_10m || 0);
  const alertLevel = computeDailyAlertLevel(todayWmo, todayRain, todayWindMax, wmo);

  const alertMeta: Record<
    "GREEN" | "YELLOW" | "ORANGE" | "RED",
    { levelName: string; severity: "NONE" | "MODERATE" | "SEVERE" | "EXTREME"; phenomenon: string; impact: string; action: string }
  > = {
    GREEN: {
      levelName: "Green — Normal (Automated advisory, not an IMD warning)",
      severity: "NONE",
      phenomenon: "Normal weather conditions expected today",
      impact: "No adverse impact on farming activities",
      action: "Normal field operations and irrigation can proceed",
    },
    YELLOW: {
      levelName: "Yellow — Watch (Automated advisory, not an IMD warning)",
      severity: "MODERATE",
      phenomenon: "Moderate rain, gusty winds, or localized thunderstorm likely today",
      impact: "Temporary disruption to spraying, pollination, and open grain drying",
      action: "Avoid pesticide/fertilizer spraying during rain. Secure loose farm equipment",
    },
    ORANGE: {
      levelName: "Orange — Alert (Automated advisory, not an IMD warning)",
      severity: "SEVERE",
      phenomenon: "Heavy rainfall or severe thunderstorm activity expected",
      impact: "Risk of field waterlogging, crop lodging, and fertilizer runoff",
      action: "Suspend chemical spraying. Provide drainage channels in pulse/vegetable fields. Move harvested produce to shelter",
    },
    RED: {
      levelName: "Red — Warning (Automated advisory, not an IMD warning)",
      severity: "EXTREME",
      phenomenon: "Extremely heavy rainfall or violent storms expected today",
      impact: "Severe waterlogging, lodging of tall crops, and livestock risk",
      action: "Stay indoors. Safeguard livestock in covered sheds. Drain waterlogged fields immediately after the storm",
    },
  };

  const alert = alertMeta[alertLevel];
  const now = new Date();
  const validUntilDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const validUntil = `Valid through ${validUntilDate.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}, 08:30 IST`;

  // Build 7-day forecast from real daily data
  const forecast = (daily.time as string[]).map((dateStr: string, i: number) => {
    const dWmo = (daily.weather_code as number[])[i];
    const { condition: dCond, icon: dIcon } = wmoToCondition(dWmo);
    const rain = (daily.precipitation_sum as number[])?.[i] ?? 0;
    
    // Real precipitation probability from Open-Meteo
    const rainProb =
      daily.precipitation_probability_max?.[i] != null
        ? `${Math.round(daily.precipitation_probability_max[i])}%`
        : rain > 15
        ? "80%"
        : rain > 5
        ? "50%"
        : rain > 0
        ? "25%"
        : "5%";

    const windDir = degreesToDirection((daily.wind_direction_10m_dominant as number[])?.[i] || 0);
    const windSpd = Math.round((daily.wind_speed_10m_max as number[])?.[i] || 0);

    // Real morning/evening humidity
    const morningHum =
      daily.relative_humidity_2m_max?.[i] != null
        ? Math.round(daily.relative_humidity_2m_max[i])
        : daily.relative_humidity_2m_mean?.[i] != null
        ? Math.min(98, Math.round(daily.relative_humidity_2m_mean[i] + 8))
        : Math.min(95, Math.max(30, Math.round(cur.relative_humidity_2m + 10)));

    const eveningHum =
      daily.relative_humidity_2m_min?.[i] != null
        ? Math.round(daily.relative_humidity_2m_min[i])
        : daily.relative_humidity_2m_mean?.[i] != null
        ? Math.max(15, Math.round(daily.relative_humidity_2m_mean[i] - 8))
        : Math.min(85, Math.max(20, Math.round(cur.relative_humidity_2m - 8)));

    const dayUv = daily.uv_index_max?.[i] != null ? Math.round(daily.uv_index_max[i] * 10) / 10 : 0;

    return {
      date: dateStr,
      day: dayName(dateStr, i),
      maxTemp: Math.round(((daily.temperature_2m_max as number[])[i] || 30) * 10) / 10,
      minTemp: Math.round(((daily.temperature_2m_min as number[])[i] || 20) * 10) / 10,
      morningHumidity: morningHum,
      eveningHumidity: eveningHum,
      windSpeed: windSpd,
      windDirection: windDir,
      rainfallMm: Math.round(rain * 10) / 10,
      rainProb,
      uvIndex: dayUv,
      condition: dCond,
      icon: dIcon,
    };
  });

  // Real UV index from current or daily max
  const realUvIndex =
    cur.uv_index != null
      ? Math.round(cur.uv_index * 10) / 10
      : daily.uv_index_max?.[0] != null
      ? Math.round(daily.uv_index_max[0] * 10) / 10
      : 0;

  // Real 24h precipitation from today's daily precipitation sum
  const realRainfall24h =
    daily.precipitation_sum?.[0] != null
      ? Math.round(daily.precipitation_sum[0] * 10) / 10
      : Math.round((cur.precipitation || 0) * 10) / 10;

  const result = {
    source: "LIVE" as const,
    district: districtName,
    state: stateName,
    lat,
    lon,
    currentObservation: {
      temperature: Math.round(cur.temperature_2m * 10) / 10,
      feelsLike: Math.round(cur.apparent_temperature * 10) / 10,
      minTemp: Math.round((daily.temperature_2m_min[0] || cur.temperature_2m - 4) * 10) / 10,
      maxTemp: Math.round((daily.temperature_2m_max[0] || cur.temperature_2m + 4) * 10) / 10,
      condition: curCondition,
      humidity: cur.relative_humidity_2m,
      windSpeed: Math.round(cur.wind_speed_10m * 10) / 10,
      windDirection: degreesToDirection(cur.wind_direction_10m || 0),
      pressureHpa: Math.round(cur.surface_pressure || 1013),
      uvIndex: realUvIndex,
      rainfall24hMm: realRainfall24h,
    },
    warning: {
      alertLevel,
      levelName: alert.levelName,
      phenomenon: alert.phenomenon,
      severity: alert.severity,
      validUntil,
      impactOnFarming: alert.impact,
      farmerAction: alert.action,
      isOfficialImd: false,
      advisoryType: "Automated advisory (not an IMD warning)",
    },
    forecast,
  };

  // Cache in memory for 15 minutes
  weatherCache.set(cacheKey, {
    data: result,
    expiresAt: Date.now() + WEATHER_CACHE_TTL_MS,
  });

  return result;
}
