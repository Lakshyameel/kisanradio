import { Router } from "express";
import ImdWeatherService from "../services/imd.service.js";
import {
  getLiveWeatherForLocation,
  geocodePlace,
  reverseGeocode,
} from "../services/live-weather.service.js";

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/imd/pan-india
// Returns comprehensive weather reports across every region of India
// ─────────────────────────────────────────────────────────────────────────────
router.get("/pan-india", async (req, res) => {
  try {
    const { region } = req.query;
    const data = ImdWeatherService.getPanIndiaOverview(region ? String(region) : undefined);
    res.json(data);
  } catch (error) {
    console.error("Pan-India weather overview error:", error);
    res.status(500).json({ error: "Failed to fetch pan-India weather overview" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/imd/search
// Search for ANY city, district, town or state in India — live weather data
// ─────────────────────────────────────────────────────────────────────────────
router.get("/search", async (req, res) => {
  try {
    const { q = "" } = req.query;
    const query = String(q).trim();

    // Try live geocoding first for accurate results
    if (query.length > 0) {
      const geo = await geocodePlace(query);
      if (geo) {
        try {
          const weather = await getLiveWeatherForLocation({ lat: geo.lat, lon: geo.lon });
          const result = {
            id: `live-${query.toLowerCase().replace(/\s+/g, "-")}`,
            district: weather.district,
            state: weather.state,
            region: "India",
            agroZone: "Live Weather Data",
            temperature: weather.currentObservation.temperature,
            condition: weather.currentObservation.condition,
            primaryCrops: [],
            source: "LIVE",
          };
          return res.json({ results: [result], count: 1, source: "LIVE" });
        } catch {
          // Geocoding worked but weather fetch failed — fall through to static
        }
      }
    }

    // Fallback — search static district database
    const results = ImdWeatherService.searchLocations(query);
    res.json({ results, count: results.length, source: "STATIC" });
  } catch (error) {
    console.error("IMD location search error:", error);
    res.status(500).json({ error: "Failed to search locations" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/imd/locate
// GPS Geolocation → LIVE weather for exact lat/lon
// ─────────────────────────────────────────────────────────────────────────────
router.get("/locate", async (req, res) => {
  try {
    const { lat, lon } = req.query;
    if (!lat || !lon || isNaN(Number(lat)) || isNaN(Number(lon))) {
      res.status(400).json({ error: "Valid 'lat' and 'lon' query parameters are required" });
      return;
    }

    const latitude = Number(lat);
    const longitude = Number(lon);

    // Try live weather first
    try {
      const weather = await getLiveWeatherForLocation({ lat: latitude, lon: longitude });
      return res.json({
        success: true,
        source: "LIVE",
        district: weather.district,
        state: weather.state,
        distanceKm: 0,
        userCoords: { lat: latitude, lon: longitude },
        current: weather.currentObservation,
        warning: weather.warning,
        forecast: weather.forecast,
      });
    } catch (liveErr) {
      console.warn("Live weather locate failed, using static fallback:", liveErr);
    }

    // Fallback to static nearest district
    const nearest = ImdWeatherService.findNearestDistrict(latitude, longitude);
    res.json({
      success: true,
      source: "STATIC",
      district: nearest.profile.district,
      state: nearest.profile.state,
      region: nearest.profile.region,
      agroZone: nearest.profile.agroZone,
      distanceKm: nearest.distanceKm,
      stationCoords: { lat: nearest.profile.lat, lon: nearest.profile.lon },
      userCoords: { lat: latitude, lon: longitude },
      elevationMeters: nearest.profile.elevationMeters,
      primaryCrops: nearest.profile.primaryCrops,
      current: {
        temperature: nearest.profile.currentObs.temperature,
        feelsLike: nearest.profile.currentObs.feelsLike,
        condition: nearest.profile.currentObs.condition,
        humidity: nearest.profile.currentObs.humidity,
        windSpeed: nearest.profile.currentObs.windSpeed,
        windDirection: nearest.profile.currentObs.windDirection,
      },
      warning: nearest.profile.warning,
      nowcast: nearest.profile.nowcast,
    });
  } catch (error) {
    console.error("IMD locate error:", error);
    res.status(500).json({ error: "Failed to locate nearest agromet station" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/imd/forecast
// 7-day weather forecast — LIVE for any location, static fallback
// ─────────────────────────────────────────────────────────────────────────────
router.get("/forecast", async (req, res) => {
  try {
    const { state, district, search, lat, lon, days = "7" } = req.query;

    const latitude = lat && !isNaN(Number(lat)) ? Number(lat) : undefined;
    const longitude = lon && !isNaN(Number(lon)) ? Number(lon) : undefined;

    // Try live weather
    try {
      const weather = await getLiveWeatherForLocation({
        lat: latitude,
        lon: longitude,
        district: district ? String(district) : undefined,
        state: state ? String(state) : undefined,
        search: search ? String(search) : undefined,
      });

      return res.json({
        source: "LIVE",
        district: weather.district,
        state: weather.state,
        agency: "Open-Meteo (Real-Time) + India Meteorological Department (IMD)",
        generatedAt: new Date().toISOString(),
        currentObservation: weather.currentObservation,
        warning: weather.warning,
        forecast: weather.forecast.slice(0, Number(days) || 7),
      });
    } catch (liveErr) {
      console.warn("Live forecast failed, using static:", liveErr);
    }

    // Static fallback
    const data = await ImdWeatherService.getForecast({
      state: state ? String(state) : undefined,
      district: district ? String(district) : undefined,
      search: search ? String(search) : undefined,
      lat: latitude,
      lon: longitude,
      days: Number(days) || 7,
    });
    res.json({ ...data, source: "STATIC" });
  } catch (error) {
    console.error("IMD forecast error:", error);
    res.status(500).json({ error: "Failed to fetch weather forecast" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/weather  (used by the weather tab in AgriculturePage)
// District weather — LIVE first, static fallback
// ─────────────────────────────────────────────────────────────────────────────
router.get("/weather", async (req, res) => {
  try {
    const { district, state, lat, lon } = req.query;
    const latitude = lat && !isNaN(Number(lat)) ? Number(lat) : undefined;
    const longitude = lon && !isNaN(Number(lon)) ? Number(lon) : undefined;

    try {
      const weather = await getLiveWeatherForLocation({
        lat: latitude,
        lon: longitude,
        district: district ? String(district) : undefined,
        state: state ? String(state) : undefined,
      });

      return res.json({
        source: "LIVE",
        district: weather.district,
        state: weather.state,
        currentObservation: weather.currentObservation,
        warning: weather.warning,
        forecast: weather.forecast,
        cropAdvisories: [],
        generatedAt: new Date().toISOString(),
      });
    } catch {
      // Fall through to static
    }

    const data = await ImdWeatherService.getForecast({
      district: district ? String(district) : undefined,
      state: state ? String(state) : undefined,
      lat: latitude,
      lon: longitude,
    });
    res.json({ ...data, source: "STATIC" });
  } catch (error) {
    console.error("Weather route error:", error);
    res.status(500).json({ error: "Failed to fetch weather data" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/imd/advisory
// ─────────────────────────────────────────────────────────────────────────────
router.get("/advisory", async (req, res) => {
  try {
    const { state, district, search, lat, lon } = req.query;
    const data = await ImdWeatherService.getAgrometAdvisory({
      state: state ? String(state) : undefined,
      district: district ? String(district) : undefined,
      search: search ? String(search) : undefined,
      lat: lat && !isNaN(Number(lat)) ? Number(lat) : undefined,
      lon: lon && !isNaN(Number(lon)) ? Number(lon) : undefined,
    });
    res.json(data);
  } catch (error) {
    console.error("IMD agromet advisory error:", error);
    res.status(500).json({ error: "Failed to fetch GKMS agromet advisory bulletin" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/imd/warnings
// ─────────────────────────────────────────────────────────────────────────────
router.get("/warnings", async (req, res) => {
  try {
    const { state, district } = req.query;
    const data = await ImdWeatherService.getWarnings({
      state: state ? String(state) : undefined,
      district: district ? String(district) : undefined,
    });
    res.json(data);
  } catch (error) {
    console.error("IMD warnings error:", error);
    res.status(500).json({ error: "Failed to fetch IMD weather warnings" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/imd/nowcast
// ─────────────────────────────────────────────────────────────────────────────
router.get("/nowcast", async (req, res) => {
  try {
    const { state, district } = req.query;
    const data = await ImdWeatherService.getNowcast({
      state: state ? String(state) : undefined,
      district: district ? String(district) : undefined,
    });
    res.json(data);
  } catch (error) {
    console.error("IMD nowcast error:", error);
    res.status(500).json({ error: "Failed to fetch IMD Doppler nowcast" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/imd/states
// ─────────────────────────────────────────────────────────────────────────────
router.get("/states", async (_req, res) => {
  try {
    const data = await ImdWeatherService.getStatesAndDistricts();
    res.json(data);
  } catch (error) {
    console.error("IMD states error:", error);
    res.status(500).json({ error: "Failed to fetch IMD states and districts" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/imd/summary
// ─────────────────────────────────────────────────────────────────────────────
router.get("/summary", async (_req, res) => {
  try {
    const data = await ImdWeatherService.getNationalSummary();
    res.json(data);
  } catch (error) {
    console.error("IMD summary error:", error);
    res.status(500).json({ error: "Failed to fetch IMD national weather summary" });
  }
});

export default router;
