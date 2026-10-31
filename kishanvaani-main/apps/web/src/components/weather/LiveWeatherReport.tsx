import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  MapPin,
  Search,
  RefreshCw,
  Sun,
  Moon,
  CloudSun,
  CloudRain,
  CloudLightning,
  CloudSnow,
  Wind,
  Droplets,
  Eye,
  Compass,
  Sunrise,
  Sunset,
  AlertTriangle,
  Flame,
  Snowflake,
  ShieldAlert,
  Loader2,
  Calendar,
  Clock,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  X
} from "lucide-react";

// ============================================================================
// STATE & DISTRICT DEFINITIONS
// ============================================================================
export const STATE_NAME = "Maharashtra";

export interface DistrictCoord {
  name: string;
  lat: number;
  lon: number;
}

export const MAHARASHTRA_DISTRICTS: DistrictCoord[] = [
  { name: "Mumbai City", lat: 18.9388, lon: 72.8354 },
  { name: "Mumbai Suburban", lat: 19.1136, lon: 72.8697 },
  { name: "Pune", lat: 18.5204, lon: 73.8567 },
  { name: "Nagpur", lat: 21.1458, lon: 79.0882 },
  { name: "Nashik", lat: 19.9975, lon: 73.7898 },
  { name: "Chhatrapati Sambhajinagar", lat: 19.8762, lon: 75.3433 },
  { name: "Thane", lat: 19.2183, lon: 72.9781 },
  { name: "Solapur", lat: 17.6599, lon: 75.9064 },
  { name: "Amravati", lat: 20.9374, lon: 77.7796 },
  { name: "Kolhapur", lat: 16.7050, lon: 74.2433 },
  { name: "Nanded", lat: 19.1383, lon: 77.3210 },
  { name: "Sangli", lat: 16.8524, lon: 74.5815 },
  { name: "Jalgaon", lat: 21.0077, lon: 75.5626 },
  { name: "Akola", lat: 20.7002, lon: 77.0082 },
  { name: "Latur", lat: 18.4088, lon: 76.5604 },
  { name: "Dhule", lat: 20.9042, lon: 74.7749 },
  { name: "Ahilyanagar (Ahmednagar)", lat: 19.0948, lon: 74.7480 },
  { name: "Chandrapur", lat: 19.9615, lon: 79.2961 },
  { name: "Parbhani", lat: 19.2686, lon: 76.7708 },
  { name: "Jalna", lat: 19.8347, lon: 75.8816 },
  { name: "Beed", lat: 18.9891, lon: 75.7601 },
  { name: "Ratnagiri", lat: 16.9902, lon: 73.3120 },
  { name: "Raigad", lat: 18.5158, lon: 73.1822 },
  { name: "Satara", lat: 17.6805, lon: 74.0183 },
  { name: "Wardha", lat: 20.7453, lon: 78.6022 },
  { name: "Yavatmal", lat: 20.3888, lon: 78.1204 },
  { name: "Dharashiv (Osmanabad)", lat: 18.1856, lon: 76.0419 },
  { name: "Nandurbar", lat: 21.3700, lon: 74.2400 },
  { name: "Hingoli", lat: 19.7196, lon: 77.1478 },
  { name: "Washim", lat: 20.1082, lon: 77.1352 },
  { name: "Gondia", lat: 21.4554, lon: 80.1961 },
  { name: "Gadchiroli", lat: 20.1809, lon: 80.0035 },
  { name: "Bhandara", lat: 21.1714, lon: 79.6543 },
  { name: "Palghar", lat: 19.6967, lon: 72.7699 },
  { name: "Sindhudurg", lat: 16.1158, lon: 73.6934 },
  { name: "Buldhana", lat: 20.5284, lon: 76.1837 }
];

// LocalStorage Keys
const LS_LIVE_CACHE = "kishanvaani_weather_live_cache";
const LS_STATE_CACHE = "kishanvaani_weather_state_cache";
const LS_UNIT_KEY = "kishanvaani_weather_unit";

// ============================================================================
// WMO WEATHER CODES INTERPRETER
// ============================================================================
export interface WMOInfo {
  desc: string;
  icon: string;
  theme: "clear" | "cloudy" | "rain" | "storm" | "snow";
  isRain: boolean;
  isSevere: boolean;
  severeReason?: string;
}

export function interpretWMO(code: number | null | undefined, isDay = 1): WMOInfo {
  const c = Number(code ?? 0);
  switch (c) {
    case 0:
      return { desc: "Clear Sky", icon: isDay ? "☀️" : "🌙", theme: "clear", isRain: false, isSevere: false };
    case 1:
      return { desc: "Mainly Clear", icon: isDay ? "🌤️" : "🌑", theme: "clear", isRain: false, isSevere: false };
    case 2:
      return { desc: "Partly Cloudy", icon: isDay ? "⛅" : "☁️", theme: "cloudy", isRain: false, isSevere: false };
    case 3:
      return { desc: "Overcast", icon: "☁️", theme: "cloudy", isRain: false, isSevere: false };
    case 45:
    case 48:
      return { desc: "Foggy", icon: "🌫️", theme: "cloudy", isRain: false, isSevere: false };
    case 51:
    case 53:
    case 55:
      return { desc: "Light Drizzle", icon: "🌦️", theme: "rain", isRain: true, isSevere: false };
    case 56:
    case 57:
      return { desc: "Freezing Drizzle", icon: "🌧️❄️", theme: "rain", isRain: true, isSevere: false };
    case 61:
    case 63:
      return { desc: "Rain", icon: "🌧️", theme: "rain", isRain: true, isSevere: false };
    case 65:
      return { desc: "Heavy Rain", icon: "🌧️⚡", theme: "rain", isRain: true, isSevere: true, severeReason: "Heavy Rain" };
    case 66:
    case 67:
      return { desc: "Freezing Rain", icon: "🌨️", theme: "snow", isRain: true, isSevere: false };
    case 71:
    case 73:
    case 75:
    case 77:
      return { desc: "Snowfall", icon: "❄️", theme: "snow", isRain: false, isSevere: false };
    case 80:
    case 81:
      return { desc: "Rain Showers", icon: "🌦️", theme: "rain", isRain: true, isSevere: false };
    case 82:
      return { desc: "Violent Rain Showers", icon: "⛈️", theme: "storm", isRain: true, isSevere: true, severeReason: "Violent Rain" };
    case 85:
    case 86:
      return { desc: "Snow Showers", icon: "🌨️", theme: "snow", isRain: false, isSevere: false };
    case 95:
      return { desc: "Thunderstorm", icon: "⛈️", theme: "storm", isRain: true, isSevere: true, severeReason: "Thunderstorm" };
    case 96:
    case 99:
      return { desc: "Severe Thunderstorm with Hail", icon: "⛈️⚡", theme: "storm", isRain: true, isSevere: true, severeReason: "Hailstorm" };
    default:
      return { desc: "Moderate Weather", icon: "🌤️", theme: "clear", isRain: false, isSevere: false };
  }
}

// Helpers
function getWindCompass(deg?: number): string {
  if (deg === undefined || deg === null) return "";
  const val = Math.floor(deg / 22.5 + 0.5);
  const arr = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  return arr[val % 16];
}

function getUVLabel(uv = 0): { text: string; color: string } {
  if (uv <= 2) return { text: "Low", color: "text-emerald-400" };
  if (uv <= 5) return { text: "Moderate", color: "text-amber-400" };
  if (uv <= 7) return { text: "High", color: "text-orange-400" };
  if (uv <= 10) return { text: "Very High", color: "text-rose-400" };
  return { text: "Extreme", color: "text-purple-400" };
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function LiveWeatherReport() {
  // Temperature Unit (°C vs °F)
  const [unit, setUnit] = useState<"C" | "F">(() => {
    try {
      return (localStorage.getItem(LS_UNIT_KEY) as "C" | "F") || "C";
    } catch {
      return "C";
    }
  });

  // Live Location Weather State
  const [liveWeather, setLiveWeather] = useState<any | null>(null);
  const [liveLocationName, setLiveLocationName] = useState<string>("Mumbai, Maharashtra");
  const [isLiveLoading, setIsLiveLoading] = useState<boolean>(false);
  const [isDetectingGps, setIsDetectingGps] = useState<boolean>(false);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [isLiveCached, setIsLiveCached] = useState<boolean>(false);
  const [liveCacheTime, setLiveCacheTime] = useState<number | null>(null);

  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchDebounceRef = useRef<any>(null);

  // Statewide State
  const [stateWeather, setStateWeather] = useState<any[]>([]);
  const [isStateLoading, setIsStateLoading] = useState<boolean>(false);
  const [stateLastUpdated, setStateLastUpdated] = useState<number | null>(null);
  const [stateFilter, setStateFilter] = useState<"all" | "rainy" | "hottest" | "coolest" | "severe">("all");
  const [stateSort, setStateSort] = useState<"name" | "temp-desc" | "temp-asc" | "rain-desc">("name");
  const [districtSearch, setDistrictSearch] = useState("");

  const toggleUnit = (newUnit: "C" | "F") => {
    setUnit(newUnit);
    try {
      localStorage.setItem(LS_UNIT_KEY, newUnit);
    } catch (e) {
      console.warn(e);
    }
  };

  const formatTemp = (tempC?: number | null): string => {
    if (tempC === undefined || tempC === null || isNaN(tempC)) return "--°";
    if (unit === "F") {
      const f = Math.round((tempC * 9) / 5 + 32);
      return `${f}°F`;
    }
    return `${Math.round(tempC)}°C`;
  };

  // Reverse Geocoding helper
  const reverseGeocode = async (lat: number, lon: number): Promise<string> => {
    try {
      const res = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
      );
      if (res.ok) {
        const json = await res.json();
        const city = json.locality || json.city || json.principalSubdivisionDistrict || "";
        const district = json.principalSubdivisionDistrict || "";
        const state = json.principalSubdivision || "";
        const parts = [city, district !== city ? district : "", state].filter(Boolean);
        if (parts.length > 0) return parts.join(", ");
      }
    } catch (e) {
      console.warn("BigDataCloud fallback triggered");
    }

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`
      );
      if (res.ok) {
        const json = await res.json();
        const a = json.address || {};
        const city = a.village || a.town || a.city || "";
        const dist = a.county || a.state_district || "";
        const state = a.state || "";
        const parts = [city, dist, state].filter(Boolean);
        if (parts.length > 0) return parts.join(", ");
      }
    } catch (e) {
      console.warn(e);
    }

    return `${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E`;
  };

  // 1. Fetch Live Location Weather
  const fetchLiveWeather = async (lat: number, lon: number, customName?: string) => {
    setIsLiveLoading(true);
    setLiveError(null);

    try {
      const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m,uv_index,visibility&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset,uv_index_max&timezone=auto`;

      const [weatherRes, placeName] = await Promise.all([
        fetch(apiUrl),
        customName ? Promise.resolve(customName) : reverseGeocode(lat, lon)
      ]);

      if (!weatherRes.ok) throw new Error(`Weather service returned ${weatherRes.status}`);

      const data = await weatherRes.json();
      data._placeName = placeName;
      setLiveWeather(data);
      setLiveLocationName(placeName);
      setIsLiveCached(false);

      // Cache locally
      try {
        localStorage.setItem(
          LS_LIVE_CACHE,
          JSON.stringify({ timestamp: Date.now(), data, placeName })
        );
      } catch (err) {
        console.warn(err);
      }
    } catch (err: any) {
      console.error("Live weather error:", err);
      // Offline fallback
      try {
        const cached = localStorage.getItem(LS_LIVE_CACHE);
        if (cached) {
          const parsed = JSON.parse(cached);
          setLiveWeather(parsed.data);
          setLiveLocationName(parsed.placeName || "Saved Location");
          setIsLiveCached(true);
          setLiveCacheTime(parsed.timestamp);
          setLiveError("Showing offline saved forecast. Reconnecting to live feed...");
        } else {
          setLiveError(`Unable to fetch weather: ${err.message}. Please search your district.`);
        }
      } catch (e) {
        setLiveError(`Weather service error: ${err.message}.`);
      }
    } finally {
      setIsLiveLoading(false);
    }
  };

  // GPS Geolocation Handler
  const handleUseMyLocation = () => {
    setLiveError(null);

    const isSecure =
      window.isSecureContext ||
      location.protocol === "https:" ||
      location.hostname === "localhost" ||
      location.hostname === "127.0.0.1";

    if (!isSecure) {
      setLiveError(
        "Geolocation requires HTTPS in modern browsers. Please use the search bar above to look up your district."
      );
      return;
    }

    if (!navigator.geolocation) {
      setLiveError("Geolocation is not supported by your browser. Please search your district name.");
      return;
    }

    setIsDetectingGps(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsDetectingGps(false);
        fetchLiveWeather(pos.coords.latitude, pos.coords.longitude);
      },
      (err) => {
        setIsDetectingGps(false);
        let msg = "Could not establish GPS coordinates.";
        switch (err.code) {
          case err.PERMISSION_DENIED:
            msg = "Location permission denied. Please allow location access or type your city/district.";
            break;
          case err.POSITION_UNAVAILABLE:
            msg = "GPS location signal is unavailable. Please search manually.";
            break;
          case err.TIMEOUT:
            msg = "Location request timed out after 10s. Please search manually.";
            break;
        }
        setLiveError(msg);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  };

  // Search input change with debounce
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    clearTimeout(searchDebounceRef.current);

    if (val.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchDebounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
            val.trim()
          )}&count=6&language=en&format=json`
        );
        const data = await res.json();
        setSearchResults(data.results || []);
      } catch (err) {
        console.error("Geocoding failed:", err);
      } finally {
        setIsSearching(false);
      }
    }, 350);
  };

  // 2. Fetch Statewide Weather (All 36 Districts in 1 API Call)
  const fetchStatewideWeather = async () => {
    setIsStateLoading(true);
    const lats = MAHARASHTRA_DISTRICTS.map((d) => d.lat.toFixed(4)).join(",");
    const lons = MAHARASHTRA_DISTRICTS.map((d) => d.lon.toFixed(4)).join(",");

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,is_day&timezone=auto`;

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      const results = Array.isArray(data) ? data : [data];

      const mapped = MAHARASHTRA_DISTRICTS.map((dist, idx) => {
        const item = results[idx] || {};
        const current = item.current || {};
        const isDay = current.is_day !== undefined ? current.is_day : 1;
        const wmo = interpretWMO(current.weather_code, isDay);
        const temp = current.temperature_2m;
        const apparent = current.apparent_temperature;
        const precip = current.precipitation || 0;

        const isExtremeHeat = (temp !== undefined && temp >= 40) || (apparent !== undefined && apparent >= 42);
        const isSevere = wmo.isSevere || isExtremeHeat || precip >= 10;
        let severeReason = isExtremeHeat
          ? "Extreme Heat"
          : wmo.severeReason || (precip >= 10 ? "Heavy Rain" : undefined);

        return {
          name: dist.name,
          lat: dist.lat,
          lon: dist.lon,
          temp,
          apparent,
          humidity: current.relative_humidity_2m,
          precip,
          windSpeed: current.wind_speed_10m,
          wmo,
          isSevere,
          severeReason
        };
      });

      setStateWeather(mapped);
      const now = Date.now();
      setStateLastUpdated(now);

      try {
        localStorage.setItem(LS_STATE_CACHE, JSON.stringify({ timestamp: now, list: mapped }));
      } catch (err) {
        console.warn(err);
      }
    } catch (err) {
      console.error("Statewide fetch error:", err);
      // Fallback to cache
      try {
        const cached = localStorage.getItem(LS_STATE_CACHE);
        if (cached) {
          const parsed = JSON.parse(cached);
          setStateWeather(parsed.list || []);
          setStateLastUpdated(parsed.timestamp);
        }
      } catch (e) {
        console.warn(e);
      }
    } finally {
      setIsStateLoading(false);
    }
  };

  // Filtered and Sorted statewide list
  const filteredDistricts = useMemo(() => {
    let list = [...stateWeather];

    // District search term
    if (districtSearch.trim()) {
      const q = districtSearch.toLowerCase();
      list = list.filter((d) => d.name.toLowerCase().includes(q));
    }

    // Category filter
    if (stateFilter === "rainy") {
      list = list.filter((d) => d.wmo.isRain || d.precip > 0);
    } else if (stateFilter === "hottest") {
      list.sort((a, b) => (b.temp ?? -99) - (a.temp ?? -99));
    } else if (stateFilter === "coolest") {
      list.sort((a, b) => (a.temp ?? 99) - (b.temp ?? 99));
    } else if (stateFilter === "severe") {
      list = list.filter((d) => d.isSevere);
    }

    // Standard sorting if not overridden by hottest/coolest filter
    if (stateFilter !== "hottest" && stateFilter !== "coolest") {
      if (stateSort === "name") {
        list.sort((a, b) => a.name.localeCompare(b.name));
      } else if (stateSort === "temp-desc") {
        list.sort((a, b) => (b.temp ?? -99) - (a.temp ?? -99));
      } else if (stateSort === "temp-asc") {
        list.sort((a, b) => (a.temp ?? 99) - (b.temp ?? 99));
      } else if (stateSort === "rain-desc") {
        list.sort((a, b) => (b.precip ?? 0) - (a.precip ?? 0));
      }
    }

    return list;
  }, [stateWeather, districtSearch, stateFilter, stateSort]);

  // Initial load & 15-minute auto-refresh
  useEffect(() => {
    // Check local cache for initial live weather
    try {
      const cachedLive = localStorage.getItem(LS_LIVE_CACHE);
      if (cachedLive) {
        const parsed = JSON.parse(cachedLive);
        setLiveWeather(parsed.data);
        setLiveLocationName(parsed.placeName || "Saved Location");
        setIsLiveCached(true);
        setLiveCacheTime(parsed.timestamp);
      } else {
        // Default initial to Pune / Mumbai
        fetchLiveWeather(18.5204, 73.8567, "Pune, Maharashtra");
      }
    } catch {
      fetchLiveWeather(18.5204, 73.8567, "Pune, Maharashtra");
    }

    // Fetch Statewide
    fetchStatewideWeather();

    // 15-minute auto refresh interval
    const interval = setInterval(() => {
      fetchStatewideWeather();
      if (liveWeather?.latitude && liveWeather?.longitude) {
        fetchLiveWeather(liveWeather.latitude, liveWeather.longitude, liveLocationName);
      }
    }, 15 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  // Compute live condition details
  const cur = liveWeather?.current;
  const isDay = cur?.is_day !== undefined ? cur.is_day : 1;
  const curWmo = interpretWMO(cur?.weather_code, isDay);
  const isExtremeHeat = (cur?.temperature_2m >= 40) || (cur?.apparent_temperature >= 42);

  return (
    <div className="space-y-6 text-gray-900">
      {/* Top Banner / Actions Bar */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live Open-Meteo Satellite Feed
              </span>
              <span className="text-xs text-gray-300">WMO Synchronized • Local Agromet</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black mt-2 text-white flex items-center gap-2.5">
              <span>🌾</span> Hyperlocal Weather & Statewide Monitor
            </h1>
          </div>

          {/* Controls: °C / °F Switch */}
          <div className="flex items-center gap-3">
            <div className="flex bg-white/10 p-1 rounded-2xl border border-white/20">
              <button
                type="button"
                onClick={() => toggleUnit("C")}
                className={`px-3 py-1 text-xs font-black rounded-xl transition-all ${
                  unit === "C" ? "bg-white text-emerald-950 shadow" : "text-gray-300 hover:text-white"
                }`}
              >
                °C
              </button>
              <button
                type="button"
                onClick={() => toggleUnit("F")}
                className={`px-3 py-1 text-xs font-black rounded-xl transition-all ${
                  unit === "F" ? "bg-white text-emerald-950 shadow" : "text-gray-300 hover:text-white"
                }`}
              >
                °F
              </button>
            </div>
          </div>
        </div>

        {/* Location Detection & Search Controls */}
        <div className="mt-5 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <button
            type="button"
            onClick={handleUseMyLocation}
            disabled={isDetectingGps}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-sm shadow-lg hover:shadow-emerald-500/20 active:scale-95 transition-all disabled:opacity-60"
          >
            {isDetectingGps ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Locating with GPS...</span>
              </>
            ) : (
              <>
                <MapPin className="w-4 h-4" />
                <span>Use My Location</span>
              </>
            )}
          </button>

          {/* Autocomplete Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search any village, city or district (e.g., Pune, Nagpur, Satara, Nashik)..."
              className="w-full pl-11 pr-10 py-3 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-gray-400 text-xs sm:text-sm outline-none focus:border-emerald-400 focus:bg-white/15 transition-all"
            />
            {isSearching && (
              <Loader2 className="w-4 h-4 text-emerald-300 absolute right-3.5 top-1/2 -translate-y-1/2 animate-spin" />
            )}

            {/* Dropdown Results */}
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden z-50 divide-y divide-slate-800">
                {searchResults.map((item, idx) => (
                  <button
                    key={`${item.id}-${idx}`}
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setSearchResults([]);
                      const fullTitle = [item.name, item.admin1, item.country].filter(Boolean).join(", ");
                      fetchLiveWeather(item.latitude, item.longitude, fullTitle);
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-slate-800 flex items-center justify-between text-xs sm:text-sm text-gray-200 hover:text-white transition-colors"
                  >
                    <div>
                      <span className="font-bold text-emerald-400">{item.name}</span>
                      <span className="text-gray-400 ml-2 text-xs">
                        {[item.admin1, item.country].filter(Boolean).join(", ")}
                      </span>
                    </div>
                    <span className="text-[11px] text-gray-500">
                      {item.latitude.toFixed(2)}°, {item.longitude.toFixed(2)}°
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Error / Offline Alert */}
        {liveError && (
          <div className="mt-4 p-3.5 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-200 text-xs flex items-center justify-between gap-3 animate-fadeIn">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>{liveError}</span>
            </div>
            <button
              onClick={() => setLiveError(null)}
              className="text-amber-300 hover:text-white p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* ======================================================================
          LIVE LOCATION HERO CARD
          ====================================================================== */}
      {isLiveLoading ? (
        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm animate-pulse space-y-4">
          <div className="h-6 w-48 bg-gray-200 rounded-lg" />
          <div className="h-16 w-32 bg-gray-200 rounded-2xl" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-gray-100 rounded-2xl" />
            ))}
          </div>
        </div>
      ) : liveWeather?.current ? (
        <div
          className={`rounded-3xl p-6 sm:p-8 border shadow-sm transition-all ${
            curWmo.theme === "storm"
              ? "bg-gradient-to-br from-purple-950 via-slate-900 to-indigo-950 text-white border-purple-800"
              : curWmo.theme === "rain"
              ? "bg-gradient-to-br from-slate-900 via-sky-950 to-slate-900 text-white border-sky-800"
              : isExtremeHeat
              ? "bg-gradient-to-br from-orange-950 via-amber-950 to-stone-900 text-white border-orange-800"
              : "bg-gradient-to-br from-emerald-950 via-teal-950 to-slate-900 text-white border-emerald-800"
          }`}
        >
          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-2xl sm:text-3xl font-black text-white">{liveLocationName}</h2>
                {isLiveCached && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    Offline Cache {liveCacheTime ? `(${new Date(liveCacheTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})` : ""}
                  </span>
                )}
                {(curWmo.isSevere || isExtremeHeat) && (
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-rose-500/25 text-rose-300 border border-rose-400/40 animate-pulse flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    {isExtremeHeat ? "Extreme Heat Warning" : curWmo.severeReason || "Weather Warning"}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-300 mt-1 font-mono">
                Lat: {liveWeather.latitude.toFixed(4)}°, Lon: {liveWeather.longitude.toFixed(4)}° • Timezone: {liveWeather.timezone || "Local"}
              </p>
            </div>

            <button
              onClick={() => fetchLiveWeather(liveWeather.latitude, liveWeather.longitude, liveLocationName)}
              className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-xs font-bold text-gray-200 flex items-center gap-1.5 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>

          {/* Main Temperature & Condition Row */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-6 pb-6 border-b border-white/10">
            <div className="flex items-center gap-5">
              <span className="text-6xl sm:text-7xl leading-none filter drop-shadow">
                {curWmo.icon}
              </span>
              <div>
                <div className="text-5xl sm:text-6xl font-black tracking-tight text-white leading-none">
                  {formatTemp(cur.temperature_2m)}
                </div>
                <div className="text-sm font-semibold text-emerald-300 mt-1 flex items-center gap-2">
                  <span>H: {formatTemp(liveWeather.daily?.temperature_2m_max?.[0])}</span>
                  <span>•</span>
                  <span>L: {formatTemp(liveWeather.daily?.temperature_2m_min?.[0])}</span>
                </div>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <p className="text-xl sm:text-2xl font-black text-white">{curWmo.desc}</p>
              <p className="text-xs sm:text-sm text-gray-300 mt-0.5">
                Feels like <strong className="text-white">{formatTemp(cur.apparent_temperature)}</strong>
              </p>
              <p className="text-xs text-emerald-300 font-semibold mt-1">
                {isDay ? "Daytime Conditions ☀️" : "Nighttime Conditions 🌙"}
              </p>
            </div>
          </div>

          {/* 8-Metric Detailed Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 pt-6">
            {/* Humidity */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/15">
              <div className="flex items-center gap-1.5 text-xs text-gray-300 font-semibold">
                <Droplets className="w-3.5 h-3.5 text-sky-400" />
                <span>Humidity</span>
              </div>
              <div className="text-xl font-black text-white mt-1">
                {cur.relative_humidity_2m ?? "--"}%
              </div>
              <p className="text-[11px] text-gray-400 mt-0.5">
                {cur.relative_humidity_2m > 75 ? "High (Sultry)" : cur.relative_humidity_2m < 35 ? "Dry" : "Ideal Comfort"}
              </p>
            </div>

            {/* Rain Chance */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/15">
              <div className="flex items-center gap-1.5 text-xs text-gray-300 font-semibold">
                <CloudRain className="w-3.5 h-3.5 text-blue-400" />
                <span>Rain Probability</span>
              </div>
              <div className="text-xl font-black text-white mt-1">
                {liveWeather.hourly?.precipitation_probability?.[0] ?? liveWeather.daily?.precipitation_probability_max?.[0] ?? 0}%
              </div>
              <p className="text-[11px] text-gray-400 mt-0.5">
                {cur.precipitation ?? 0} mm current precip
              </p>
            </div>

            {/* Wind Speed & Compass */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/15">
              <div className="flex items-center gap-1.5 text-xs text-gray-300 font-semibold">
                <Wind className="w-3.5 h-3.5 text-teal-400" />
                <span>Wind Speed</span>
              </div>
              <div className="text-xl font-black text-white mt-1">
                {cur.wind_speed_10m ?? "--"} km/h
              </div>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Dir: {cur.wind_direction_10m ?? "--"}° {getWindCompass(cur.wind_direction_10m)}
              </p>
            </div>

            {/* UV Index */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/15">
              <div className="flex items-center gap-1.5 text-xs text-gray-300 font-semibold">
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span>UV Radiation</span>
              </div>
              <div className="text-xl font-black text-white mt-1">
                {cur.uv_index ?? liveWeather.daily?.uv_index_max?.[0] ?? "--"}
              </div>
              <p className={`text-[11px] font-bold mt-0.5 ${getUVLabel(cur.uv_index).color}`}>
                {getUVLabel(cur.uv_index).text} Risk
              </p>
            </div>

            {/* Pressure */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/15">
              <div className="flex items-center gap-1.5 text-xs text-gray-300 font-semibold">
                <Compass className="w-3.5 h-3.5 text-emerald-400" />
                <span>Barometer</span>
              </div>
              <div className="text-xl font-black text-white mt-1">
                {Math.round(cur.surface_pressure ?? 1013)} hPa
              </div>
              <p className="text-[11px] text-gray-400 mt-0.5">Surface pressure</p>
            </div>

            {/* Visibility */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/15">
              <div className="flex items-center gap-1.5 text-xs text-gray-300 font-semibold">
                <Eye className="w-3.5 h-3.5 text-cyan-400" />
                <span>Visibility</span>
              </div>
              <div className="text-xl font-black text-white mt-1">
                {cur.visibility !== undefined ? `${(cur.visibility / 1000).toFixed(1)} km` : "--"}
              </div>
              <p className="text-[11px] text-gray-400 mt-0.5">Clear sightline</p>
            </div>

            {/* Sunrise */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/15">
              <div className="flex items-center gap-1.5 text-xs text-gray-300 font-semibold">
                <Sunrise className="w-3.5 h-3.5 text-amber-300" />
                <span>Sunrise</span>
              </div>
              <div className="text-xl font-black text-white mt-1">
                {liveWeather.daily?.sunrise?.[0]
                  ? new Date(liveWeather.daily.sunrise[0]).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
                  : "--:--"}
              </div>
              <p className="text-[11px] text-gray-400 mt-0.5">Dawn twilight</p>
            </div>

            {/* Sunset */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/15">
              <div className="flex items-center gap-1.5 text-xs text-gray-300 font-semibold">
                <Sunset className="w-3.5 h-3.5 text-rose-300" />
                <span>Sunset</span>
              </div>
              <div className="text-xl font-black text-white mt-1">
                {liveWeather.daily?.sunset?.[0]
                  ? new Date(liveWeather.daily.sunset[0]).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
                  : "--:--"}
              </div>
              <p className="text-[11px] text-gray-400 mt-0.5">Dusk twilight</p>
            </div>
          </div>
        </div>
      ) : null}

      {/* ======================================================================
          24-HOUR HOURLY FORECAST
          ====================================================================== */}
      {liveWeather?.hourly?.time && (
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-emerald-700" />
            <h3 className="text-sm sm:text-base font-extrabold text-gray-900">
              Next 24-Hour Hourly Forecast
            </h3>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
            {liveWeather.hourly.time.slice(0, 24).map((timeStr: string, idx: number) => {
              const dt = new Date(timeStr);
              const hr = dt.getHours();
              const isCardDay = hr >= 6 && hr < 18 ? 1 : 0;
              const wmo = interpretWMO(liveWeather.hourly.weather_code[idx], isCardDay);
              const pop = liveWeather.hourly.precipitation_probability?.[idx] || 0;

              return (
                <div
                  key={timeStr}
                  className={`flex-shrink-0 w-24 p-3 rounded-2xl text-center border transition-all ${
                    idx === 0
                      ? "bg-emerald-50 border-emerald-300 shadow-sm"
                      : "bg-gray-50/70 border-gray-100 hover:bg-gray-100"
                  }`}
                >
                  <span className="text-[11px] font-bold text-gray-500 block">
                    {idx === 0 ? "Now" : dt.toLocaleTimeString([], { hour: "numeric", hour12: true })}
                  </span>
                  <span className="text-2xl my-1.5 block filter drop-shadow-sm">{wmo.icon}</span>
                  <span className="text-sm font-extrabold text-gray-900 block">
                    {formatTemp(liveWeather.hourly.temperature_2m[idx])}
                  </span>
                  {pop > 0 ? (
                    <span className="text-[10px] font-bold text-sky-600 flex items-center justify-center gap-0.5 mt-1">
                      <Droplets className="w-2.5 h-2.5" />
                      {pop}%
                    </span>
                  ) : (
                    <span className="text-[10px] text-gray-400 block mt-1">0%</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================================
          7-DAY DAILY FORECAST
          ====================================================================== */}
      {liveWeather?.daily?.time && (
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-4 h-4 text-emerald-700" />
            <h3 className="text-sm sm:text-base font-extrabold text-gray-900">
              7-Day Extended Agro Outlook
            </h3>
          </div>

          <div className="space-y-2.5">
            {liveWeather.daily.time.slice(0, 7).map((dStr: string, idx: number) => {
              const dt = new Date(`${dStr}T00:00:00`);
              const dayLabel = idx === 0 ? "Today" : dt.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
              const wmo = interpretWMO(liveWeather.daily.weather_code[idx], 1);
              const rainMax = liveWeather.daily.precipitation_probability_max?.[idx] || 0;
              const tMin = liveWeather.daily.temperature_2m_min[idx];
              const tMax = liveWeather.daily.temperature_2m_max[idx];

              return (
                <div
                  key={dStr}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50/80 hover:bg-gray-100 border border-gray-100 transition-all text-xs sm:text-sm"
                >
                  <div className="w-28 sm:w-36 font-extrabold text-gray-900">{dayLabel}</div>

                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-xl">{wmo.icon}</span>
                    <span className="text-gray-700 font-semibold hidden sm:inline">{wmo.desc}</span>
                  </div>

                  <div className="w-16 sm:w-20 text-sky-600 font-bold text-right text-xs">
                    {rainMax > 0 ? `💧 ${rainMax}%` : "Dry"}
                  </div>

                  <div className="w-28 sm:w-36 flex items-center justify-end gap-2 font-bold">
                    <span className="text-gray-400">{formatTemp(tMin)}</span>
                    <div className="w-10 sm:w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-sky-400 via-amber-400 to-rose-400 w-3/4 rounded-full" />
                    </div>
                    <span className="text-gray-900">{formatTemp(tMax)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================================
          STATEWIDE WEATHER MONITOR (36 Districts in 1 API Call)
          ====================================================================== */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 flex items-center gap-2">
              <span>🏛️</span> {STATE_NAME} Statewide Weather Explorer
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Real-time monitoring across all 36 administrative districts • Single batched query
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 font-medium hidden sm:inline">
              {stateLastUpdated
                ? `Updated: ${new Date(stateLastUpdated).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} • Auto-refreshes 15m`
                : "Fetching..."}
            </span>
            <button
              type="button"
              onClick={fetchStatewideWeather}
              disabled={isStateLoading}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 active:scale-95 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isStateLoading ? "animate-spin" : ""}`} />
              <span>Refresh State</span>
            </button>
          </div>
        </div>

        {/* Toolbar: Filters, Search, Sort */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
          {/* Category filter pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setStateFilter("all")}
              className={`px-3 py-1.5 rounded-full text-xs font-extrabold transition-all ${
                stateFilter === "all"
                  ? "bg-emerald-800 text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              All (36)
            </button>
            <button
              type="button"
              onClick={() => setStateFilter("rainy")}
              className={`px-3 py-1.5 rounded-full text-xs font-extrabold transition-all ${
                stateFilter === "rainy"
                  ? "bg-sky-700 text-white shadow-sm"
                  : "bg-sky-50 text-sky-800 hover:bg-sky-100 border border-sky-200/60"
              }`}
            >
              🌧️ Rainy
            </button>
            <button
              type="button"
              onClick={() => setStateFilter("hottest")}
              className={`px-3 py-1.5 rounded-full text-xs font-extrabold transition-all ${
                stateFilter === "hottest"
                  ? "bg-amber-700 text-white shadow-sm"
                  : "bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200/60"
              }`}
            >
              🔥 Hottest
            </button>
            <button
              type="button"
              onClick={() => setStateFilter("coolest")}
              className={`px-3 py-1.5 rounded-full text-xs font-extrabold transition-all ${
                stateFilter === "coolest"
                  ? "bg-indigo-700 text-white shadow-sm"
                  : "bg-indigo-50 text-indigo-900 hover:bg-indigo-100 border border-indigo-200/60"
              }`}
            >
              ❄️ Coolest
            </button>
            <button
              type="button"
              onClick={() => setStateFilter("severe")}
              className={`px-3 py-1.5 rounded-full text-xs font-extrabold transition-all ${
                stateFilter === "severe"
                  ? "bg-rose-700 text-white shadow-sm"
                  : "bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200/60"
              }`}
            >
              ⚠️ Severe Weather
            </button>
          </div>

          {/* District text search & Sort dropdown */}
          <div className="flex items-center gap-2">
            <input
              type="search"
              value={districtSearch}
              onChange={(e) => setDistrictSearch(e.target.value)}
              placeholder="Filter district..."
              className="px-3.5 py-1.5 rounded-xl border border-gray-200 bg-gray-50 text-xs text-gray-800 focus:bg-white focus:border-emerald-600 outline-none w-36 sm:w-44"
            />
            <select
              value={stateSort}
              onChange={(e: any) => setStateSort(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-gray-200 bg-gray-50 text-xs font-semibold text-gray-700 focus:bg-white outline-none cursor-pointer"
            >
              <option value="name">Sort: Name (A-Z)</option>
              <option value="temp-desc">Temp: High to Low</option>
              <option value="temp-asc">Temp: Low to High</option>
              <option value="rain-desc">Precipitation</option>
            </select>
          </div>
        </div>

        {/* 36-District Responsive Grid */}
        {isStateLoading && stateWeather.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filteredDistricts.length === 0 ? (
          <div className="p-8 text-center text-gray-400 font-semibold bg-gray-50 rounded-2xl">
            No districts match the selected filter.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
            {filteredDistricts.map((item) => (
              <div
                key={item.name}
                onClick={() => {
                  fetchLiveWeather(item.lat, item.lon, `${item.name}, ${STATE_NAME}`);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className={`p-4 rounded-2xl border cursor-pointer transition-all hover:scale-[1.02] hover:shadow-md ${
                  item.isSevere
                    ? "bg-rose-50/70 border-rose-300 ring-1 ring-rose-200"
                    : "bg-gray-50/60 hover:bg-emerald-50/40 border-gray-200/80 hover:border-emerald-300"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-extrabold text-sm text-gray-900">{item.name}</h4>
                  {item.isSevere && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-600 text-white animate-pulse">
                      {item.severeReason || "Alert"}
                    </span>
                  )}
                </div>

                <div className="flex items-baseline justify-between mt-2">
                  <div className="text-2xl font-black text-gray-900">
                    {formatTemp(item.temp)}
                  </div>
                  <span className="text-2xl">{item.wmo.icon}</span>
                </div>

                <div className="mt-3 pt-2.5 border-t border-gray-200/60 flex items-center justify-between text-[11px] text-gray-500 font-semibold">
                  <span>💧 {item.humidity ?? "--"}% Hum</span>
                  <span>{item.precip > 0 ? `🌧️ ${item.precip}mm` : item.wmo.desc}</span>
                  <span>💨 {item.windSpeed ?? "--"}km/h</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
