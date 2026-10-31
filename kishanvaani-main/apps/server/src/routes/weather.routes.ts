import { Router } from "express";
import prisma from "../prisma.js";
import ImdWeatherService, { IMD_DISTRICT_BENCHMARKS } from "../services/imd.service.js";
import { getLiveWeatherForLocation } from "../services/live-weather.service.js";

const router = Router();

// GET /api/v1/weather
// Live weather via Open-Meteo for ANY district/city/GPS in India.
// Falls back to static IMD data if network unavailable.
router.get("/", async (req, res) => {
  try {
    const { district, state, search, lat, lon } = req.query;

    const latNum = lat && !isNaN(Number(lat)) ? Number(lat) : undefined;
    const lonNum = lon && !isNaN(Number(lon)) ? Number(lon) : undefined;
    const districtStr = district ? String(district) : undefined;
    const stateStr = state ? String(state) : undefined;
    const searchStr = search ? String(search) : undefined;

    // ── Try LIVE weather first ────────────────────────────────────────────────
    let liveData: Awaited<ReturnType<typeof getLiveWeatherForLocation>> | null = null;
    try {
      liveData = await getLiveWeatherForLocation({
        lat: latNum,
        lon: lonNum,
        district: districtStr,
        state: stateStr,
        search: searchStr,
      });
    } catch {
      // Network unavailable — fall through to static data
    }

    // ── Choose data source ────────────────────────────────────────────────────
    let currentDistrict: string;
    let currentState: string;
    let temperature: number;
    let feelsLike: number;
    let minTemp: number;
    let maxTemp: number;
    let condition: string;
    let humidity: number;
    let windSpeed: number;
    let windDirection: string;
    let rainfall24h: number;
    let warning: any;
    let forecast: any[];
    let dataSource: string;
    let agroZone: string;

    if (liveData) {
      // Use real live data
      currentDistrict = liveData.district;
      currentState = liveData.state;
      temperature = liveData.currentObservation.temperature;
      feelsLike = liveData.currentObservation.feelsLike;
      minTemp = liveData.currentObservation.minTemp;
      maxTemp = liveData.currentObservation.maxTemp;
      condition = liveData.currentObservation.condition;
      humidity = liveData.currentObservation.humidity;
      windSpeed = liveData.currentObservation.windSpeed;
      windDirection = liveData.currentObservation.windDirection;
      rainfall24h = liveData.currentObservation.rainfall24hMm;
      warning = liveData.warning;
      forecast = liveData.forecast;
      dataSource = "LIVE — Open-Meteo Real-Time";
      agroZone = "India Meteorological Department Coverage";
      console.log(`[Weather] Serving LIVE weather for ${currentDistrict}, ${currentState} from Open-Meteo`);
    } else {
      console.warn(`[Weather] Serving STATIC benchmark weather: live provider unreachable or query unresolvable.`);
      try {
        // Use static IMD benchmark data
        const imdData = await ImdWeatherService.getForecast({
          district: districtStr,
          state: stateStr,
          search: searchStr,
          lat: latNum,
          lon: lonNum,
          days: 7,
        });
        currentDistrict = imdData.district;
        currentState = imdData.state;
        temperature = imdData.currentObservation.temperature;
        feelsLike = imdData.currentObservation.feelsLike;
        minTemp = imdData.currentObservation.minTemp;
        maxTemp = imdData.currentObservation.maxTemp;
        condition = imdData.currentObservation.condition;
        humidity = imdData.currentObservation.humidity;
        windSpeed = imdData.currentObservation.windSpeed;
        windDirection = imdData.currentObservation.windDirection;
        rainfall24h = imdData.currentObservation.rainfall24hMm;
        warning = imdData.warning;
        forecast = imdData.forecast;
        dataSource = "STATIC — IMD District Benchmark";
        agroZone = imdData.agroZone;
      } catch (err: any) {
        if (searchStr || districtStr || stateStr) {
          res.status(404).json({
            error: `Location "${searchStr || districtStr || stateStr}" not found. Please check spelling or select from available districts.`,
          });
          return;
        }
        throw err;
      }
    }

    // Agromet advisory (always from static — contains crop-specific advice)
    const agrometData = await ImdWeatherService.getAgrometAdvisory({
      district: districtStr || currentDistrict,
      state: stateStr || currentState,
    }).catch(() => null);

    // Cache to SQLite (non-blocking)
    const locationKey = `${currentState}_${currentDistrict}`.replace(/\s+/g, "_");
    prisma.weatherCache.upsert({
      where: { locationKey },
      update: { temperature, condition, humidity, windSpeed, fetchedAt: new Date() },
      create: {
        locationKey,
        district: currentDistrict,
        state: currentState,
        temperature,
        condition,
        humidity,
        windSpeed,
        rainfallForecast: `${rainfall24h}mm`,
        advisory: agrometData?.generalAdvisory || "",
        fetchedAt: new Date(),
      },
    }).catch(() => null);

    // All available locations list
    const allLocations = IMD_DISTRICT_BENCHMARKS.map((b) => ({
      district: b.district,
      state: b.state,
      region: b.region,
      locationKey: `${b.state}_${b.district}`.replace(/[\s()&'-]+/g, "_"),
      temperature: b.currentObs.temperature,
      condition: b.currentObs.condition,
    })).sort((a, b) => a.state.localeCompare(b.state) || a.district.localeCompare(b.district));

    res.json({
      source: liveData ? "LIVE" : "STATIC",
      dataSource,
      agency: "India Meteorological Department (IMD) + Open-Meteo Real-Time Weather",
      generatedAt: new Date().toISOString(),
      current: {
        locationKey,
        district: currentDistrict,
        state: currentState,
        temperature,
        minTemp,
        maxTemp,
        feelsLike,
        condition,
        humidity,
        windSpeed,
        windDirection,
        rainfallForecast: rainfall24h > 0 ? `${rainfall24h}mm in last 24h` : "Dry weather",
        advisory: agrometData?.generalAdvisory || "Weather data from Open-Meteo live feed.",
        agroZone,
      },
      forecast: forecast.map((f: any) => ({
        day: f.day,
        date: f.date,
        temp: f.maxTemp,
        minTemp: f.minTemp,
        maxTemp: f.maxTemp,
        condition: f.condition,
        rainProb: f.rainProb,
        rainfallMm: f.rainfallMm,
        morningHumidity: f.morningHumidity,
        eveningHumidity: f.eveningHumidity,
        windSpeed: f.windSpeed,
        windDirection: f.windDirection,
        cloudCover: f.cloudCover || "",
        icon: f.icon,
      })),
      sprayAdvisory: {
        safeToSpray: agrometData?.sprayWindow.safeToSpray ?? (windSpeed < 15 && rainfall24h === 0),
        message: agrometData?.sprayWindow.message || (windSpeed < 15 ? "Spray conditions appear favorable" : "High wind — avoid spraying"),
        recommendedHours: "07:00 AM - 10:30 AM",
        windSpeedKmh: windSpeed,
      },
      irrigationAdvisory: agrometData?.irrigationAdvisory || null,
      warning,
      nowcast: null,
      cropAdvisories: agrometData?.cropAdvisories || [],
      livestockAdvisory: agrometData?.livestockAdvisory || "",
      availableLocations: allLocations,
    });
  } catch (error) {
    console.error("Weather error:", error);
    res.status(500).json({ error: "Failed to fetch weather data" });
  }
});

export default router;
