import { useState, useEffect, useMemo, lazy, Suspense } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FALLBACK_MANDI_PRICES,
  FALLBACK_ENAM_TRADES,
  FALLBACK_ENAM_STATS,
  FALLBACK_MANDI_META,
} from "../../data/mandi-fallback.data";
import { useAudioPlayer, AudioTrack } from "../../context/AudioPlayerContext";
import { fetchContentList, ContentItem, likeContent } from "../../services/content.service";
import {
  fetchMandiPrices,
  fetchMandiMeta,
  MandiPriceItem,
  fetchAgmarknetPrices,
  fetchEnamTradeData,
  fetchEnamStats,
  fetchMandiComparison,
  EnamTradeItem,
  EnamStatsResponse,
  MandiComparisonResponse,
} from "../../services/mandi.service";
import { fetchWeather, WeatherResponse } from "../../services/weather.service";
import {
  fetchPanIndiaOverview,
  searchImdLocations,
  locateNearestDistrict,
  PanIndiaOverviewResponse,
  RegionName,
} from "../../services/imd.service";
import { getCurrentCoordinates, formatCoordinates } from "../../utils/geolocation";
import { useLanguage } from "../../context/LanguageContext";
import AgriNewsTab from "./AgriNewsTab";
import CropCalendarTab from "./CropCalendarTab";
import MandiTrendsAndNearbyCompare from "../../components/mandi/MandiTrendsAndNearbyCompare";
import usePageSeo from "../../hooks/usePageSeo";
const LiveWeatherReport = lazy(() => import("../../components/weather/LiveWeatherReport"));
import {
  Sprout,
  Newspaper,
  CloudSun,
  TrendingUp,
  TrendingDown,
  BookOpenCheck,
  Milk,
  Landmark,
  Play,
  Pause,
  Filter,
  Search,
  CheckCircle2,
  Droplets,
  Wind,
  Heart,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Building2,
  Scale,
  ArrowRightLeft,
  Activity,
  BadgeCheck,
  Zap,
  AlertTriangle,
  Radio,
  Sun,
  CloudRain,
  Thermometer,
  MapPin,
  Globe,
  Compass,
  Layers,
  Navigation,
  Loader2,
  Sparkles,
  CalendarCheck,
} from "lucide-react";

type AgriTab = "all" | "crop-calendar" | "news" | "weather" | "mandi-prices" | "crop-advisory" | "livestock" | "government-schemes";
type MandiSubTab = "ALL" | "AGMARKNET" | "ENAM" | "COMPARE" | "OPTIMIZE";

export default function AgriculturePage() {
  const { "*": tabParam } = useParams();
  const navigate = useNavigate();
  const { currentTrack, isPlaying, playTrack, togglePlayPause } = useAudioPlayer();
  const { t, translateContent } = useLanguage();

  const activeTab: AgriTab = (tabParam as AgriTab) || "all";

  usePageSeo({
    title:
      activeTab === "crop-calendar"
        ? "फसल कैलेंडर और स्प्रे गाइड | Crop Calendar"
        : activeTab === "mandi-prices"
        ? "मंडी भाव व 100 किमी नजदीकी बाजार तुलना"
        : activeTab === "weather"
        ? "मौसम रिपोर्ट और कृषि स्प्रे सलाह"
        : "कृषि केंद्र और ऑडियो सलाह | Agriculture Hub",
    description:
      "गेहूं, धान, सरसों और कपास के लिए वैज्ञानिक 7-चरणीय फसल चक्र, खाद की मात्रा, और बारिश से पहले कीटनाशक छिड़काव अलर्ट।",
    canonicalPath: `/agriculture/${activeTab}`,
    image: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=1200&auto=format&fit=crop&q=80",
  });

  const [contentList, setContentList] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("ALL");

  // Mandi States — pre-loaded with fallback data so prices show on any device
  const [mandiSubTab, setMandiSubTab] = useState<MandiSubTab>("ALL");
  const [mandiPrices, setMandiPrices] = useState<MandiPriceItem[]>(FALLBACK_MANDI_PRICES as unknown as MandiPriceItem[]);
  const [enamTrades, setEnamTrades] = useState<EnamTradeItem[]>(FALLBACK_ENAM_TRADES as unknown as EnamTradeItem[]);
  const [enamStats, setEnamStats] = useState<EnamStatsResponse | null>(FALLBACK_ENAM_STATS as unknown as EnamStatsResponse);
  const [compareCommodity, setCompareCommodity] = useState("Wheat");
  const [compareData, setCompareData] = useState<MandiComparisonResponse | null>(null);
  const [mandiMeta, setMandiMeta] = useState<{ states: string[]; commodities: string[]; districts: string[] }>({
    states: FALLBACK_MANDI_META.states,
    commodities: FALLBACK_MANDI_META.commodities,
    districts: [],
  });
  const [mandiState, setMandiState] = useState("ALL");
  const [mandiCommodity, setMandiCommodity] = useState("ALL");

  // Weather States (IMD Mausam & GKMS - Every State & Part of India)
  const [weatherData, setWeatherData] = useState<WeatherResponse | null>(null);
  const [selectedWeatherState, setSelectedWeatherState] = useState("ALL");
  const [selectedDistrict, setSelectedDistrict] = useState("Ludhiana");
  const [weatherSubTab, setWeatherSubTab] = useState<"DISTRICT" | "PAN_INDIA" | "LIVE_STATEWIDE">("DISTRICT");
  const [panIndiaData, setPanIndiaData] = useState<PanIndiaOverviewResponse | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<"ALL" | RegionName>("ALL");
  const [weatherSearchQuery, setWeatherSearchQuery] = useState("");
  const [weatherSearchResults, setWeatherSearchResults] = useState<any[]>([]);

  const availableWeatherStates = useMemo(() => {
    if (!weatherData?.availableLocations) return [];
    const set = new Set<string>();
    weatherData.availableLocations.forEach((loc) => set.add(loc.state));
    return Array.from(set).sort();
  }, [weatherData?.availableLocations]);

  const filteredWeatherDistricts = useMemo(() => {
    if (!weatherData?.availableLocations) return [];
    if (selectedWeatherState === "ALL") return weatherData.availableLocations;
    return weatherData.availableLocations.filter((loc) => loc.state === selectedWeatherState);
  }, [weatherData?.availableLocations, selectedWeatherState]);

  // Load Pan-India Weather Overview
  useEffect(() => {
    if (activeTab === "weather") {
      fetchPanIndiaOverview(selectedRegion === "ALL" ? undefined : selectedRegion)
        .then((res) => setPanIndiaData(res))
        .catch(() => null);
    }
  }, [activeTab, selectedRegion]);

  // Debounced search for ANY district or part of India
  useEffect(() => {
    if (!weatherSearchQuery.trim()) {
      setWeatherSearchResults([]);
      return;
    }
    const timer = setTimeout(() => {
      searchImdLocations(weatherSearchQuery.trim())
        .then((res) => setWeatherSearchResults(res.results))
        .catch(() => null);
    }, 200);
    return () => clearTimeout(timer);
  }, [weatherSearchQuery]);

  const handleSelectSearchResult = (item: any) => {
    setSelectedWeatherState(item.state);
    setSelectedDistrict(item.district);
    setWeatherSearchQuery("");
    setWeatherSearchResults([]);
    setWeatherSubTab("DISTRICT");
  };

  const handleSelectDistrictCard = (district: string, state: string) => {
    setSelectedWeatherState(state);
    setSelectedDistrict(district);
    setWeatherSubTab("DISTRICT");
  };

  // GPS Geolocation States & Detection
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [gpsLocatedInfo, setGpsLocatedInfo] = useState<{
    district: string;
    state: string;
    distanceKm: number;
    lat: number;
    lon: number;
  } | null>(null);

  const handleDetectLocation = async () => {
    setIsLocating(true);
    setLocationError(null);
    try {
      const coords = await getCurrentCoordinates();
      const located = await locateNearestDistrict(coords.latitude, coords.longitude);

      setGpsLocatedInfo({
        district: located.district,
        state: located.state,
        distanceKm: located.distanceKm,
        lat: coords.latitude,
        lon: coords.longitude,
      });

      setSelectedWeatherState(located.state);
      setSelectedDistrict(located.district);
      setWeatherSubTab("DISTRICT");

      // Fetch accurate local weather using coordinates
      const weatherRes = await fetchWeather(
        located.district,
        located.state,
        undefined,
        coords.latitude,
        coords.longitude
      );
      if (weatherRes) setWeatherData(weatherRes);
    } catch (err: any) {
      console.error("GPS location error:", err);
      setLocationError(err?.message || "Could not detect location. Please select manually or search above.");
    } finally {
      setIsLocating(false);
    }
  };

  const handleClearLocation = () => {
    setGpsLocatedInfo(null);
    setLocationError(null);
  };

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        let typeFilter: string | undefined;
        if (activeTab === "news") typeFilter = "NEWS";
        else if (activeTab === "crop-advisory") typeFilter = "CROP_ADVISORY";
        else if (activeTab === "livestock") typeFilter = "LIVESTOCK";
        else if (activeTab === "government-schemes") typeFilter = "GOVERNMENT_SCHEME";

        // Fetch meta once or on filter
        const [contentRes, metaRes, weatherRes] = await Promise.all([
          fetchContentList({
            category: "Agriculture",
            type: typeFilter,
            language: selectedLanguage === "ALL" ? undefined : selectedLanguage,
            search: searchQuery.trim() || undefined,
            limit: 50,
          }).catch(() => ({ items: [], total: 0, page: 1, totalPages: 1 })),
          fetchMandiMeta().catch(() => ({ states: [], commodities: [], districts: [] })),
          fetchWeather(selectedDistrict).catch(() => null),
        ]);

        setContentList(contentRes.items);
        setMandiMeta(metaRes);
        if (weatherRes) setWeatherData(weatherRes);

        // Fetch based on Mandi sub-tab
        if (activeTab === "mandi-prices" || activeTab === "all") {
          if (mandiSubTab === "ENAM") {
            const [tradesRes, statsRes] = await Promise.all([
              fetchEnamTradeData({
                state: mandiState === "ALL" ? undefined : mandiState,
                commodity: mandiCommodity === "ALL" ? undefined : mandiCommodity,
                search: searchQuery.trim() || undefined,
              }).catch(() => ({ trades: [], count: 0, total: 0, source: "e-NAM", portal: "", agency: "" })),
              fetchEnamStats().catch(() => null),
            ]);
            setEnamTrades(tradesRes.trades);
            if (statsRes) setEnamStats(statsRes);
          } else if (mandiSubTab === "AGMARKNET") {
            const agmarkRes = await fetchAgmarknetPrices({
              state: mandiState === "ALL" ? undefined : mandiState,
              commodity: mandiCommodity === "ALL" ? undefined : mandiCommodity,
              search: searchQuery.trim() || undefined,
            }).catch(() => ({ prices: [], count: 0, total: 0, source: "AGMARKNET", agency: "", portal: "" }));
            setMandiPrices(agmarkRes.prices);
          } else if (mandiSubTab === "COMPARE") {
            const compRes = await fetchMandiComparison(compareCommodity, mandiState).catch(() => null);
            setCompareData(compRes);
          } else {
            // ALL Mandis
            const mandiRes = await fetchMandiPrices({
              state: mandiState === "ALL" ? undefined : mandiState,
              commodity: mandiCommodity === "ALL" ? undefined : mandiCommodity,
              search: searchQuery.trim() || undefined,
            }).catch(() => ({ prices: [], count: 0 }));
            setMandiPrices(mandiRes.prices);
          }
        }
      } catch (err) {
        console.error("Agriculture page fetch error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [activeTab, mandiSubTab, selectedLanguage, searchQuery, mandiState, mandiCommodity, compareCommodity, selectedDistrict]);

  const handlePlayContent = async (item: ContentItem) => {
    const track: AudioTrack = {
      id: item.id,
      title: item.title,
      description: item.description,
      audioUrl: item.audioUrl || "",
      duration: item.durationSec,
      durationSec: item.durationSec,
      category: item.category,
      language: item.language,
      narrator: item.narrator,
      transcript: item.transcript,
      isBookmarked: item.isBookmarked,
    };

    if (currentTrack?.id === item.id) {
      await togglePlayPause();
    } else {
      await playTrack(track);
    }
  };

  const tabs: { id: AgriTab; label: string; icon: any; path: string }[] = [
    { id: "all", label: t("overview", "Overview"), icon: Sprout, path: "/agriculture" },
    { id: "crop-calendar", label: t("cropCalendar", "Crop Calendar"), icon: CalendarCheck, path: "/agriculture/crop-calendar" },
    { id: "news", label: t("news", "News"), icon: Newspaper, path: "/agriculture/news" },
    { id: "weather", label: t("weather", "Agro Weather"), icon: CloudSun, path: "/agriculture/weather" },
    { id: "mandi-prices", label: t("mandiPrices", "Mandi Prices"), icon: TrendingUp, path: "/agriculture/mandi-prices" },
    { id: "crop-advisory", label: t("cropAdvisory", "Crop Advisory"), icon: BookOpenCheck, path: "/agriculture/crop-advisory" },
    { id: "livestock", label: t("livestock", "Livestock Care"), icon: Milk, path: "/agriculture/livestock" },
    { id: "government-schemes", label: t("schemes", "Govt Schemes"), icon: Landmark, path: "/agriculture/government-schemes" },
  ];

  return (
    <div className="space-y-8 pb-16">
      {/* Page Header */}
      <div className="bg-emerald-950 text-white p-6 sm:p-8 rounded-3xl shadow-sm space-y-3">
        <span className="text-emerald-400 text-xs font-bold uppercase tracking-wider">
          {t("knowledgeHub", "KishanVaani Knowledge Hub")}
        </span>
        <h1 className="text-2xl sm:text-4xl font-extrabold">{t("agriHubTitle", "Agriculture Hub")}</h1>
        <p className="text-emerald-200 text-xs sm:text-sm max-w-2xl">
          {t("agriHubDesc", "Get real-time mandi prices, weather forecasts, expert crop guidance, livestock management, and government scheme audio briefings.")}
        </p>
      </div>

      {/* Interactive Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-gray-200">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = (tab.id === "all" && !tabParam) || tabParam === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => navigate(tab.path)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                isActive
                  ? "bg-emerald-800 text-white shadow-sm"
                  : "bg-white text-gray-700 hover:bg-emerald-50 border border-gray-100"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: Mandi Prices View */}
      {activeTab === "mandi-prices" && (
        <div className="space-y-6">
          {/* Sub-tab Navigation (All, AGMARKNET, e-NAM, Compare) */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 overflow-x-auto">
              <button
                type="button"
                onClick={() => setMandiSubTab("ALL")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  mandiSubTab === "ALL"
                    ? "bg-emerald-800 text-white shadow-sm"
                    : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                {t("allMandis", "All Mandis")}
              </button>

              <button
                type="button"
                onClick={() => setMandiSubTab("AGMARKNET")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  mandiSubTab === "AGMARKNET"
                    ? "bg-emerald-700 text-white shadow-sm"
                    : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                {t("agmarknetMandi", "AGMARKNET (Physical APMCs)")}
              </button>

              <button
                type="button"
                onClick={() => setMandiSubTab("ENAM")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  mandiSubTab === "ENAM"
                    ? "bg-indigo-700 text-white shadow-sm"
                    : "bg-indigo-50 text-indigo-800 hover:bg-indigo-100"
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-amber-300" />
                {t("enamMandi", "e-NAM (Digital Auctions)")}
              </button>

              <button
                type="button"
                onClick={() => setMandiSubTab("COMPARE")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  mandiSubTab === "COMPARE"
                    ? "bg-amber-600 text-white shadow-sm"
                    : "bg-amber-50 text-amber-800 hover:bg-amber-100"
                }`}
              >
                <Scale className="w-3.5 h-3.5" />
                {t("compareMandis", "⚖️ Compare Spread")}
              </button>

              <button
                type="button"
                onClick={() => setMandiSubTab("OPTIMIZE")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  mandiSubTab === "OPTIMIZE"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                }`}
              >
                <Compass className="w-3.5 h-3.5 text-amber-300" />
                {t("bestMarketCompare", "🏆 Best Market (100 km) & 30-Day Trends")}
              </button>
            </div>

            {/* Source Credentials Tag */}
            <div className="text-[11px] text-gray-500 font-medium flex items-center gap-1.5">
              <BadgeCheck className="w-4 h-4 text-emerald-600" />
              <span>Ministry of Agriculture & Farmers Welfare, GoI</span>
            </div>
          </div>

          {/* e-NAM National Statistics Banner */}
          {mandiSubTab === "ENAM" && enamStats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-gradient-to-br from-indigo-50 to-white p-4 rounded-2xl border border-indigo-100">
                <span className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wide">Connected Mandis</span>
                <div className="text-xl sm:text-2xl font-black text-indigo-900 mt-1">
                  {enamStats.connectedMandisTotal.toLocaleString("en-IN")}+
                </div>
                <p className="text-[10px] text-indigo-500 mt-0.5">Across {enamStats.integratedStatesTotal} States / UTs</p>
              </div>

              <div className="bg-gradient-to-br from-emerald-50 to-white p-4 rounded-2xl border border-emerald-100">
                <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wide">Today's Traded Volume</span>
                <div className="text-xl sm:text-2xl font-black text-emerald-900 mt-1">
                  {enamStats.todayTotalTradedVolumeQuintals.toLocaleString("en-IN")} <span className="text-xs font-medium">Qtl</span>
                </div>
                <p className="text-[10px] text-emerald-500 mt-0.5">Across {enamStats.onboardedCommoditiesTotal} Commodities</p>
              </div>

              <div className="bg-gradient-to-br from-amber-50 to-white p-4 rounded-2xl border border-amber-100">
                <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wide">Today's Trade Value</span>
                <div className="text-xl sm:text-2xl font-black text-amber-900 mt-1">
                  ₹{enamStats.todayTotalTradeValueCrores} <span className="text-xs font-medium">Cr</span>
                </div>
                <p className="text-[10px] text-amber-600 mt-0.5">Direct Online Settlements</p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-white p-4 rounded-2xl border border-purple-100">
                <span className="text-[11px] font-semibold text-purple-600 uppercase tracking-wide">Live Bidding Lots</span>
                <div className="text-xl sm:text-2xl font-black text-purple-900 mt-1 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  {enamStats.activeBiddingCount} Active
                </div>
                <p className="text-[10px] text-purple-500 mt-0.5">{enamStats.completedAuctionsCount} Auctions Settled</p>
              </div>
            </div>
          )}

          {/* BEST MARKET (100 KM) & 30-DAY TRENDS VIEW */}
          {mandiSubTab === "OPTIMIZE" ? (
            <MandiTrendsAndNearbyCompare />
          ) : mandiSubTab === "COMPARE" ? (
            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Scale className="w-5 h-5 text-amber-600" />
                    AGMARKNET vs e-NAM Price Spread Comparator
                  </h2>
                  <p className="text-xs text-gray-500">
                    Compare physical spot APMC rates against digital national auctions to maximize crop sale realization
                  </p>
                </div>

                {/* State Filter */}
                <select
                  value={mandiState}
                  onChange={(e) => setMandiState(e.target.value)}
                  className="text-xs font-semibold px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-700 outline-none"
                >
                  <option value="ALL">All States</option>
                  {mandiMeta.states.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* Commodity Quick Selector */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {["Wheat", "Basmati Rice", "Cotton", "Soybean", "Onion", "Potato", "Mustard", "Tomato", "Turmeric", "Gram (Chana)", "Groundnut"].map((comm) => (
                  <button
                    key={comm}
                    type="button"
                    onClick={() => setCompareCommodity(comm)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                      compareCommodity === comm
                        ? "bg-amber-600 text-white shadow-sm"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {comm}
                  </button>
                ))}
              </div>

              {compareData && (
                <div className="space-y-6">
                  {/* Hero Comparison Card */}
                  <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-indigo-950 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
                    <div className="flex flex-wrap items-center justify-between gap-6">
                      {/* Physical APMC */}
                      <div className="flex-1 min-w-[200px]">
                        <span className="text-[11px] font-semibold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5" />
                          AGMARKNET Physical APMC
                        </span>
                        <div className="text-2xl sm:text-3xl font-black mt-1">
                          ₹{compareData.agmarknet.averageModalPrice.toLocaleString("en-IN")}
                          <span className="text-xs text-emerald-200 font-medium"> / Qtl</span>
                        </div>
                        <p className="text-xs text-gray-300 mt-1">
                          Avg spot price across {compareData.agmarknet.sampleCount} physical yards
                        </p>
                      </div>

                      {/* Spread Indicator */}
                      <div className="bg-white/10 backdrop-blur-md px-5 py-4 rounded-xl border border-white/10 text-center min-w-[170px]">
                        <span className="text-[10px] text-amber-300 uppercase font-bold tracking-wider">Spread Delta</span>
                        <div className="text-xl sm:text-2xl font-black mt-0.5 flex items-center justify-center gap-1">
                          {compareData.comparison.spreadRupees > 0 ? (
                            <span className="text-emerald-400">+₹{compareData.comparison.spreadRupees.toLocaleString("en-IN")}</span>
                          ) : compareData.comparison.spreadRupees < 0 ? (
                            <span className="text-rose-400">-₹{Math.abs(compareData.comparison.spreadRupees).toLocaleString("en-IN")}</span>
                          ) : (
                            <span className="text-gray-300">₹0</span>
                          )}
                          <span className="text-xs font-bold text-gray-300">({compareData.comparison.spreadPercentage}%)</span>
                        </div>
                        <span
                          className={`inline-block mt-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                            compareData.comparison.betterPlatform === "ENAM"
                              ? "bg-emerald-500/30 text-emerald-300 border border-emerald-400/40"
                              : compareData.comparison.betterPlatform === "AGMARKNET"
                              ? "bg-amber-500/30 text-amber-300 border border-amber-400/40"
                              : "bg-gray-500/30 text-gray-300"
                          }`}
                        >
                          {compareData.comparison.betterPlatform === "ENAM"
                            ? "Higher on e-NAM"
                            : compareData.comparison.betterPlatform === "AGMARKNET"
                            ? "Higher on Physical APMC"
                            : "Equal Rates"}
                        </span>
                      </div>

                      {/* Digital e-NAM */}
                      <div className="flex-1 min-w-[200px] text-left sm:text-right">
                        <span className="text-[11px] font-semibold text-indigo-300 uppercase tracking-wider flex items-center sm:justify-end gap-1.5">
                          <Zap className="w-3.5 h-3.5 text-amber-300" />
                          e-NAM Digital Auction
                        </span>
                        <div className="text-2xl sm:text-3xl font-black mt-1">
                          ₹{compareData.enam.averageModalPrice.toLocaleString("en-IN")}
                          <span className="text-xs text-indigo-200 font-medium"> / Qtl</span>
                        </div>
                        <p className="text-xs text-gray-300 mt-1">
                          Avg digital auction across {compareData.enam.sampleCount} e-auctions
                        </p>
                      </div>
                    </div>

                    {/* Farmer Recommendation Banner */}
                    <div className="mt-5 pt-4 border-t border-white/10 flex items-start gap-3 bg-white/5 p-3.5 rounded-xl">
                      <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs font-bold text-amber-300">KishanVaani Farmer Selling Advisory:</div>
                        <p className="text-xs text-gray-200 mt-0.5 leading-relaxed">{compareData.comparison.recommendation}</p>
                      </div>
                    </div>
                  </div>

                  {/* Side-by-Side Top Mandis */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* AGMARKNET Top Mandis */}
                    <div className="border border-emerald-100 rounded-2xl p-4 bg-emerald-50/20">
                      <h3 className="text-sm font-bold text-emerald-950 flex items-center gap-2 mb-3">
                        <Building2 className="w-4 h-4 text-emerald-700" />
                        Top Physical APMCs ({compareCommodity})
                      </h3>
                      <div className="space-y-2">
                        {compareData.agmarknet.topMandis.map((m) => (
                          <div key={m.id} className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-emerald-100/60 text-xs">
                            <div>
                              <div className="font-bold text-gray-900">{m.market}</div>
                              <div className="text-[11px] text-gray-500">{m.district}, {m.state} • {m.variety || "Common"}</div>
                            </div>
                            <div className="text-right font-extrabold text-emerald-900">
                              {m.modalPrice != null ? `₹${m.modalPrice.toLocaleString("en-IN")}` : "—"}
                              {m.modalPrice != null && <span className="text-[10px] text-gray-400 font-normal"> /Qtl</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* e-NAM Top Auctions */}
                    <div className="border border-indigo-100 rounded-2xl p-4 bg-indigo-50/20">
                      <h3 className="text-sm font-bold text-indigo-950 flex items-center gap-2 mb-3">
                        <Zap className="w-4 h-4 text-indigo-700" />
                        Top e-NAM Digital Auctions ({compareCommodity})
                      </h3>
                      <div className="space-y-2">
                        {compareData.enam.topAuctions.map((m) => (
                          <div key={m.id} className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-indigo-100/60 text-xs">
                            <div>
                              <div className="font-bold text-gray-900">{m.market}</div>
                              <div className="text-[11px] text-gray-500">{m.state} • {m.variety || "Grade-A"}</div>
                            </div>
                            <div className="text-right font-extrabold text-indigo-900">
                              {m.modalPrice != null ? `₹${m.modalPrice.toLocaleString("en-IN")}` : "—"}
                              {m.modalPrice != null && <span className="text-[10px] text-gray-400 font-normal"> /Qtl</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : mandiSubTab === "ENAM" ? (
            /* e-NAM DIGITAL TRADING TABLE */
            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-indigo-700" />
                    e-NAM Live Electronic Auction Yard
                  </h2>
                  <p className="text-xs text-gray-500">Real-time online bidding prices across 1,361+ national integrated mandis</p>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3">
                  <select
                    value={mandiState}
                    onChange={(e) => setMandiState(e.target.value)}
                    className="text-xs font-semibold px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-700 outline-none"
                  >
                    <option value="ALL">All States</option>
                    {mandiMeta.states.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>

                  <select
                    value={mandiCommodity}
                    onChange={(e) => setMandiCommodity(e.target.value)}
                    className="text-xs font-semibold px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-700 outline-none"
                  >
                    <option value="ALL">All Commodities</option>
                    {mandiMeta.commodities.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* e-NAM Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-400 uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-4 font-bold">{t("commodity", "Commodity")}</th>
                      <th className="py-3 px-4 font-bold">{t("enamApmcYard", "e-NAM APMC Yard")}</th>
                      <th className="py-3 px-4 font-bold">{t("biddingRange", "Bidding Range (₹)")}</th>
                      <th className="py-3 px-4 font-bold text-right">{t("modalPrice", "Modal Price (₹/Qtl)")}</th>
                      <th className="py-3 px-4 font-bold text-center">{t("tradedVolume", "Traded Volume")}</th>
                      <th className="py-3 px-4 font-bold text-center">{t("auctionStatus", "Auction Status")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {enamTrades.map((tItem) => (
                      <tr key={tItem.id} className="hover:bg-indigo-50/40 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-gray-900">
                          <div className="flex items-center gap-2">
                            <span>{translateContent(tItem.commodity)}</span>
                            {tItem.trend === "UP" ? (
                              <span className="text-[10px] text-emerald-700 bg-emerald-100 px-1 py-0.5 rounded font-bold">
                                ↑ UP
                              </span>
                            ) : tItem.trend === "DOWN" ? (
                              <span className="text-[10px] text-rose-600 bg-rose-100 px-1 py-0.5 rounded font-bold">
                                ↓ DOWN
                              </span>
                            ) : null}
                          </div>
                          <div className="text-[11px] text-gray-500 font-normal">{tItem.variety}</div>
                        </td>
                        <td className="py-3.5 px-4 text-gray-600">
                          <div className="font-semibold text-gray-900">{tItem.apmc}</div>
                          <div className="text-[11px] text-indigo-600 font-medium">{tItem.state}</div>
                        </td>
                        <td className="py-3.5 px-4 text-gray-500 tabular-nums">
                          {tItem.minBidPrice != null && tItem.maxBidPrice != null
                            ? `₹${tItem.minBidPrice.toLocaleString("en-IN")} - ₹${tItem.maxBidPrice.toLocaleString("en-IN")}`
                            : "—"}
                        </td>
                        <td className="py-3.5 px-4 text-right font-black text-indigo-900 text-base tabular-nums">
                          {tItem.modalPrice != null ? `₹${tItem.modalPrice.toLocaleString("en-IN")}` : "—"}
                        </td>
                        <td className="py-3.5 px-4 text-center text-gray-600 font-semibold tabular-nums">
                          {tItem.tradedQuantity != null ? (
                            <>
                              {tItem.tradedQuantity.toLocaleString("en-IN")} <span className="text-[10px] text-gray-400 font-normal">Qtl</span>
                            </>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {tItem.tradeStatus === "ACTIVE_BIDDING" ? (
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                              {t("activeBidding", "Active Bidding")}
                            </span>
                          ) : tItem.tradeStatus === "WEIGHMENT_IN_PROGRESS" ? (
                            <span className="text-[11px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                              {t("weighment", "Weighment")}
                            </span>
                          ) : (
                            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                              {t("auctionSettled", "Auction Settled")}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* ALL / AGMARKNET MANDI TABLE */
            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-emerald-700" />
                    {mandiSubTab === "AGMARKNET" ? "AGMARKNET Physical APMC Price Explorer" : "Live APMC Mandi Price Explorer"}
                  </h2>
                  <p className="text-xs text-gray-500">
                    {mandiSubTab === "AGMARKNET"
                      ? "Official daily market prices & arrival data from Directorate of Marketing & Inspection (DMI)"
                      : "Compare market modal prices across states, APMC mandis and commodities"}
                  </p>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3">
                  <select
                    value={mandiState}
                    onChange={(e) => setMandiState(e.target.value)}
                    className="text-xs font-semibold px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-700 outline-none"
                  >
                    <option value="ALL">All States</option>
                    {mandiMeta.states.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>

                  <select
                    value={mandiCommodity}
                    onChange={(e) => setMandiCommodity(e.target.value)}
                    className="text-xs font-semibold px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-700 outline-none"
                  >
                    <option value="ALL">All Commodities</option>
                    {mandiMeta.commodities.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Price Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-400 uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-4 font-bold">{t("commodity", "Commodity")}</th>
                      <th className="py-3 px-4 font-bold">{t("marketState", "Market / State")}</th>
                      <th className="py-3 px-4 font-bold">{t("variety", "Variety")}</th>
                      <th className="py-3 px-4 font-bold">{t("arrivals", "Daily Arrivals")}</th>
                      <th className="py-3 px-4 font-bold">{t("minMaxPrice", "Min - Max Price")}</th>
                      <th className="py-3 px-4 font-bold text-right">{t("modalPrice", "Modal Price (₹/Qtl)")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {mandiPrices.map((mandi) => (
                      <tr key={mandi.id} className="hover:bg-emerald-50/40 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-gray-900">
                          <div className="flex items-center gap-2">
                            <span>{translateContent(mandi.commodity)}</span>
                            {mandi.sourceLabel ? (
                              <span className="text-[9px] text-gray-700 bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded font-bold">
                                {mandi.sourceLabel}
                              </span>
                            ) : mandi.source === "SAMPLE" ? (
                              <span className="text-[9px] text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded font-bold">
                                Sample data
                              </span>
                            ) : mandi.source === "ENAM" ? (
                              <span className="text-[9px] text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded font-bold">
                                Live from e-NAM
                              </span>
                            ) : (
                              <span className="text-[9px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded font-bold">
                                Live from Agmarknet
                              </span>
                            )}
                            {mandi.trend === "UP" ? (
                              <span className="text-[10px] text-emerald-700 bg-emerald-100 px-1 py-0.5 rounded font-bold">
                                ↑ UP
                              </span>
                            ) : mandi.trend === "DOWN" ? (
                              <span className="text-[10px] text-rose-600 bg-rose-100 px-1 py-0.5 rounded font-bold">
                                ↓ DOWN
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-gray-600">
                          {mandi.market},{" "}
                          <span className="text-gray-400">
                            {mandi.district} ({mandi.state})
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-gray-500">
                          {mandi.variety ? translateContent(mandi.variety) : t("common", "Common")}
                        </td>
                        <td className="py-3.5 px-4 text-gray-600 font-medium tabular-nums">
                          {mandi.arrivals != null ? `${mandi.arrivals.toLocaleString("en-IN")} Qtl` : "—"}
                        </td>
                        <td className="py-3.5 px-4 text-gray-500 tabular-nums">
                          {mandi.minPrice != null && mandi.maxPrice != null
                            ? `₹${mandi.minPrice.toLocaleString("en-IN")} - ₹${mandi.maxPrice.toLocaleString("en-IN")}`
                            : "—"}
                        </td>
                        <td className="py-3.5 px-4 text-right font-extrabold text-emerald-900 text-base tabular-nums">
                          {mandi.modalPrice != null ? `₹${mandi.modalPrice.toLocaleString("en-IN")}` : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Weather View (India Meteorological Department - IMD & GKMS) */}
      {activeTab === "weather" && (
        <div className="space-y-6">
          {/* Official IMD Mausam & GKMS Header */}
          <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-emerald-950 text-white p-6 sm:p-8 rounded-3xl shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-blue-500/20 text-blue-300 border border-blue-400/30 uppercase tracking-wider">
                  <BadgeCheck className="w-4 h-4 text-blue-400" />
                  IMD Mausam • GKMS National Agromet Network
                </span>
                <span className="text-xs text-gray-300 hidden sm:inline">
                  Ministry of Earth Sciences (MoES), Govt. of India
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
                  Live Real-Time Satellite & Agromet Feed
                </span>
                <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-emerald-300 bg-emerald-900/40 border border-emerald-500/30 px-3 py-1 rounded-full">
                  <Globe className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Pan-India Coverage</span>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
                <CloudSun className="w-8 h-8 text-amber-400" />
                Agro-Meteorological Advisory & Weather Forecast
              </h2>
              <p className="text-xs sm:text-sm text-gray-300 mt-1 max-w-3xl">
                Real-time 7-day day-by-day agromet forecasts, Doppler weather radar nowcasts, spray windows, and crop-specific field advisories for every state and corner of India.
              </p>
            </div>

            {/* Universal Search & GPS Auto-Locate Row */}
            <div className="space-y-3 pt-2">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <div className="relative flex-1 flex items-center">
                  <Search className="absolute left-4 w-5 h-5 text-gray-400" />
                  <input
                    type="search"
                    value={weatherSearchQuery}
                    onChange={(e) => setWeatherSearchQuery(e.target.value)}
                    placeholder="Search any district, city, state, or agro-zone in India (e.g. Gorakhpur, Coimbatore, Bikaner, Port Blair, Silchar, Baramati, Leh, Shimla)..."
                    className="w-full pl-12 pr-10 py-3.5 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-gray-400 text-xs sm:text-sm outline-none focus:border-blue-400 focus:bg-white/15 transition-all"
                  />
                  {weatherSearchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setWeatherSearchQuery("");
                        setWeatherSearchResults([]);
                      }}
                      className="absolute right-3.5 text-xs text-gray-400 hover:text-white px-2 py-1 bg-white/10 rounded-lg"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleDetectLocation}
                  disabled={isLocating}
                  className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-emerald-400 hover:bg-emerald-300 text-gray-950 font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 disabled:opacity-80 flex-shrink-0 cursor-pointer"
                  title="Detect your current location via GPS to view accurate local weather"
                >
                  {isLocating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-gray-950" />
                      <span>{t("locatingGps", "Locating GPS...")}</span>
                    </>
                  ) : (
                    <>
                      <Navigation className="w-4 h-4 fill-current text-gray-950" />
                      <span>{t("autoDetectLocationAction", "Auto-Detect My Location")}</span>
                    </>
                  )}
                </button>
              </div>

              {/* GPS Geolocation Active Confirmation Banner */}
              {gpsLocatedInfo && (
                <div className="p-3.5 rounded-2xl bg-emerald-900/80 border border-emerald-500/50 text-emerald-100 flex flex-wrap items-center justify-between gap-3 shadow-md backdrop-blur-xs animate-in fade-in">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-emerald-400 text-gray-950">
                      <Navigation className="w-4 h-4 fill-current" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-black uppercase tracking-wider text-emerald-300">
                          📍 {t("gpsLocked", "GPS Geolocation Locked")}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-800/80 text-emerald-100 font-bold border border-emerald-600/40">
                          ~{gpsLocatedInfo.distanceKm} km away
                        </span>
                      </div>
                      <p className="text-sm font-black text-white">
                        {t("nearestImdStation", "Nearest IMD Station")}: {gpsLocatedInfo.district}, {gpsLocatedInfo.state}
                      </p>
                      <p className="text-[10px] text-emerald-200/80">
                        GPS Coordinates: {formatCoordinates(gpsLocatedInfo.lat, gpsLocatedInfo.lon)} • High Precision Match
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleDetectLocation}
                      disabled={isLocating}
                      className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-xs font-bold text-white border border-white/20 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      {t("reDetectGps", "Re-detect GPS")}
                    </button>
                    <button
                      type="button"
                      onClick={handleClearLocation}
                      className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-semibold border border-rose-500/30 transition-colors cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              )}

              {/* Geolocation Error Notification */}
              {locationError && (
                <div className="p-3.5 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-200 text-xs flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span>{locationError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setLocationError(null)}
                    className="text-amber-300 hover:text-white text-xs px-2.5 py-1 rounded-lg bg-white/10"
                  >
                    Dismiss
                  </button>
                </div>
              )}
            </div>

            {/* Instant Search Results Dropdown Container */}
            <div className="relative">

              {/* Instant Search Results Dropdown */}
              {weatherSearchResults.length > 0 && (
                <div className="absolute z-30 left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden text-gray-900 max-h-96 overflow-y-auto">
                  <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex items-center justify-between text-[11px] font-bold text-gray-500 uppercase">
                    <span>Matching Districts & Agromet Stations ({weatherSearchResults.length})</span>
                    <span>Click to view detailed forecast</span>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {weatherSearchResults.map((res) => (
                      <button
                        key={res.id}
                        type="button"
                        onClick={() => handleSelectSearchResult(res)}
                        className="w-full text-left px-4 py-3 hover:bg-emerald-50/70 transition-colors flex items-center justify-between gap-4"
                      >
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-gray-900 text-sm">{res.district}</span>
                            <span className="text-xs text-gray-500">({res.state})</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                              {res.region} Region
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-500 truncate">
                            Zone: {res.agroZone} • Crops: {res.primaryCrops?.slice(0, 3).join(", ")}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <div className="text-right">
                            <div className="text-base font-black text-gray-900">{res.temperature}°C</div>
                            <div className="text-[11px] text-gray-500">{res.condition}</div>
                          </div>
                          <span
                            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                              res.alertLevel === "RED"
                                ? "bg-rose-100 text-rose-800 border-rose-200"
                                : res.alertLevel === "ORANGE"
                                ? "bg-amber-100 text-amber-900 border-amber-200"
                                : res.alertLevel === "YELLOW"
                                ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                                : "bg-emerald-100 text-emerald-800 border-emerald-200"
                            }`}
                          >
                            {res.alertLevel}
                          </span>
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Jump Shortcuts for Different Parts of India */}
              <div className="flex flex-wrap items-center gap-1.5 pt-2 text-xs">
                <span className="text-gray-400 text-[11px] font-medium mr-1 flex items-center gap-1">
                  <Compass className="w-3.5 h-3.5 text-amber-400" /> Quick Jump:
                </span>
                {[
                  { label: "Ludhiana (PB)", district: "Ludhiana", state: "Punjab" },
                  { label: "Gorakhpur (UP)", district: "Gorakhpur", state: "Uttar Pradesh" },
                  { label: "Coimbatore (TN)", district: "Coimbatore", state: "Tamil Nadu" },
                  { label: "Bikaner (RJ)", district: "Bikaner", state: "Rajasthan" },
                  { label: "Baramati (MH)", district: "Pune", state: "Maharashtra" },
                  { label: "Silchar (AS)", district: "Cachar", state: "Assam" },
                  { label: "Leh (Ladakh)", district: "Leh", state: "Ladakh" },
                  { label: "Shimla (HP)", district: "Shimla", state: "Himachal Pradesh" },
                  { label: "Port Blair (A&N)", district: "South Andaman", state: "Andaman and Nicobar Islands" },
                  { label: "Kavaratti (LD)", district: "Lakshadweep", state: "Lakshadweep" },
                ].map((chip) => (
                  <button
                    key={chip.label}
                    type="button"
                    onClick={() => handleSelectDistrictCard(chip.district, chip.state)}
                    className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-gray-200 hover:text-white border border-white/15 text-[11px] font-medium transition-colors"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Sub-Tab Navigation: District Advisory vs Pan-India Explorer */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setWeatherSubTab("DISTRICT")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  weatherSubTab === "DISTRICT"
                    ? "bg-emerald-800 text-white shadow-sm"
                    : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                }`}
              >
                <CloudSun className="w-4 h-4 text-amber-400" />
                {t("districtAdvisory", "District Advisory")} ({selectedDistrict}, {selectedWeatherState === "ALL" ? "India" : selectedWeatherState})
              </button>

              <button
                type="button"
                onClick={() => setWeatherSubTab("PAN_INDIA")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  weatherSubTab === "PAN_INDIA"
                    ? "bg-blue-800 text-white shadow-sm"
                    : "bg-blue-50 text-blue-800 hover:bg-blue-100"
                }`}
              >
                <Globe className="w-4 h-4 text-blue-500" />
                {t("panIndiaExplorer", "Pan-India Regional Weather Explorer (36 States & UTs)")}
              </button>

              <button
                type="button"
                onClick={() => setWeatherSubTab("LIVE_STATEWIDE")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  weatherSubTab === "LIVE_STATEWIDE"
                    ? "bg-teal-800 text-white shadow-sm"
                    : "bg-teal-50 text-teal-800 hover:bg-teal-100"
                }`}
              >
                <Radio className="w-4 h-4 text-emerald-500" />
                {t("liveStatewideReport", "⚡ Live GPS & Maharashtra Statewide Monitor")}
              </button>
            </div>

            <div className="text-[11px] text-gray-500 font-medium flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-teal-600 animate-pulse" />
              <span>{t("activeStations", "Doppler Radar + Agromet Stations Active")}</span>
            </div>
          </div>

          {/* PAN-INDIA REGIONAL WEATHER EXPLORER VIEW */}
          {weatherSubTab === "PAN_INDIA" && (
            <div className="space-y-6">
              {/* Region Filter Chips */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                {(
                  [
                    { id: "ALL", label: "All India (36 States & UTs)" },
                    { id: "North", label: "North (9 States/UTs)" },
                    { id: "South", label: "South (6 States/UTs)" },
                    { id: "East", label: "East (4 States)" },
                    { id: "West", label: "West (4 States/UTs)" },
                    { id: "Central", label: "Central (2 States)" },
                    { id: "North-East", label: "North-East (8 States)" },
                    { id: "Islands", label: "Islands (2 UTs)" },
                  ] as const
                ).map((rg) => (
                  <button
                    key={rg.id}
                    type="button"
                    onClick={() => setSelectedRegion(rg.id)}
                    className={`whitespace-nowrap px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                      selectedRegion === rg.id
                        ? "bg-slate-900 text-white shadow-sm"
                        : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {rg.label}
                  </button>
                ))}
              </div>

              {/* Pan-India KPI Metrics */}
              {panIndiaData && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      Pan-India Coverage
                    </span>
                    <p className="text-xl sm:text-2xl font-black text-gray-900">
                      {panIndiaData.totalStatesAndUTs} States & UTs
                    </p>
                    <p className="text-xs text-emerald-600 font-semibold">100% National Geographical Coverage</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      Reporting Agromet Districts
                    </span>
                    <p className="text-xl sm:text-2xl font-black text-blue-900">
                      {panIndiaData.totalDistrictsReporting} Benchmark Districts
                    </p>
                    <p className="text-xs text-gray-500 font-medium">Synced with GKMS Agromet Units</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      Pan-India Temp Range
                    </span>
                    <p className="text-xl sm:text-2xl font-black text-amber-700">
                      {panIndiaData.regions.length > 0
                        ? `${Math.min(...panIndiaData.regions.map((r) => r.tempRange.min))}°C — ${Math.max(
                            ...panIndiaData.regions.map((r) => r.tempRange.max)
                          )}°C`
                        : "16°C — 38°C"}
                    </p>
                    <p className="text-xs text-gray-500 font-medium">Himalayan high-altitude to Coastal tropical</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      Active Weather Alerts
                    </span>
                    <p className="text-xl sm:text-2xl font-black text-rose-700">
                      {panIndiaData.regions.reduce(
                        (acc, r) => acc + r.activeAlerts.yellow + r.activeAlerts.orange + r.activeAlerts.red,
                        0
                      )}{" "}
                      Alerts
                    </p>
                    <p className="text-xs text-gray-500 font-medium">
                      {panIndiaData.regions.reduce((acc, r) => acc + r.activeAlerts.orange + r.activeAlerts.red, 0)} Orange/Red Alerts
                    </p>
                  </div>
                </div>
              )}

              {/* Regional Groups & District Cards */}
              {panIndiaData && (
                <div className="space-y-8">
                  {panIndiaData.regions.map((regionGroup) => (
                    <div key={regionGroup.region} className="space-y-4">
                      {/* Region Header Banner */}
                      <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-slate-100 to-gray-50 p-4 rounded-2xl border border-gray-200">
                        <div className="flex items-center gap-2">
                          <Compass className="w-5 h-5 text-emerald-700" />
                          <h3 className="text-base sm:text-lg font-black text-gray-900">
                            {regionGroup.region} India
                          </h3>
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-200 text-gray-700">
                            {regionGroup.totalDistricts} Agromet Stations
                          </span>
                        </div>

                        <div className="flex items-center gap-4 text-xs font-semibold text-gray-600">
                          <span>
                            Avg Temp: <strong>{regionGroup.avgTemperature}°C</strong> ({regionGroup.tempRange.min}°C - {regionGroup.tempRange.max}°C)
                          </span>
                          {regionGroup.activeAlerts.orange + regionGroup.activeAlerts.red > 0 && (
                            <span className="text-rose-700 font-bold bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-lg flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-rose-600" />
                              {regionGroup.activeAlerts.orange + regionGroup.activeAlerts.red} Severe Alerts
                            </span>
                          )}
                        </div>
                      </div>

                      {/* District Cards Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {regionGroup.districts.map((d) => (
                          <div
                            key={d.id}
                            className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all flex flex-col justify-between space-y-3 group"
                          >
                            <div className="space-y-2">
                              {/* District Name & State */}
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <h4 className="font-extrabold text-sm text-gray-900 group-hover:text-emerald-800 transition-colors">
                                    {d.district}
                                  </h4>
                                  <p className="text-xs text-gray-500 font-medium">{d.state}</p>
                                </div>
                                <span
                                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border flex-shrink-0 ${
                                    d.alertLevel === "RED"
                                      ? "bg-rose-100 text-rose-800 border-rose-200"
                                      : d.alertLevel === "ORANGE"
                                      ? "bg-amber-100 text-amber-900 border-amber-200"
                                      : d.alertLevel === "YELLOW"
                                      ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                                      : "bg-emerald-100 text-emerald-800 border-emerald-200"
                                  }`}
                                >
                                  {d.alertLevel === "GREEN" ? "NORMAL" : d.alertLevel}
                                </span>
                              </div>

                              {/* Temperature & Condition */}
                              <div className="flex items-center justify-between py-1 border-y border-gray-100">
                                <div className="flex items-center gap-2">
                                  <CloudSun className="w-6 h-6 text-amber-500" />
                                  <div>
                                    <span className="text-xl font-black text-gray-900">{d.temperature}°C</span>
                                  </div>
                                </div>
                                <span className="text-xs text-gray-600 font-medium truncate max-w-[120px]">
                                  {d.condition}
                                </span>
                              </div>

                              {/* Agro Zone & Metrics */}
                              <p className="text-[11px] text-gray-500 line-clamp-1">
                                <strong className="text-gray-700">Zone:</strong> {d.agroZone}
                              </p>

                              <div className="grid grid-cols-3 gap-1 text-[10px] text-gray-600 bg-gray-50 p-2 rounded-xl">
                                <div>
                                  <span className="text-gray-400 block">Rain</span>
                                  <span className="font-bold text-blue-700">{d.rainProb}</span>
                                </div>
                                <div>
                                  <span className="text-gray-400 block">Humidity</span>
                                  <span className="font-bold text-gray-800">{d.humidity}%</span>
                                </div>
                                <div>
                                  <span className="text-gray-400 block">Wind</span>
                                  <span className="font-bold text-gray-800">{d.windSpeed} km/h</span>
                                </div>
                              </div>

                              {/* Primary Crops */}
                              <div className="flex flex-wrap items-center gap-1 pt-0.5">
                                {d.primaryCrops?.slice(0, 3).map((crop) => (
                                  <span
                                    key={crop}
                                    className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 font-semibold"
                                  >
                                    {crop}
                                  </span>
                                ))}
                              </div>
                            </div>

                            {/* View Detailed Forecast & Advisory CTA */}
                            <button
                              type="button"
                              onClick={() => handleSelectDistrictCard(d.district, d.state)}
                              className="w-full mt-2 py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-700 text-emerald-800 hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-1 group-hover:bg-emerald-700 group-hover:text-white"
                            >
                              <span>7-Day Advisory & Radar</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* LIVE GPS & STATEWIDE WEATHER VIEW */}
          {weatherSubTab === "LIVE_STATEWIDE" && (
            <div className="space-y-6">
              <Suspense fallback={<div className="p-8 text-center text-xs font-semibold text-gray-500">Loading weather dashboard...</div>}>
                <LiveWeatherReport />
              </Suspense>
            </div>
          )}

          {/* DISTRICT AGRO-ADVISORY & DETAILED 7-DAY FORECAST VIEW */}
          {weatherSubTab === "DISTRICT" && weatherData?.current && (
            <div className="space-y-6">
              {/* Location Selector Bar */}
              <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-700" />
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Selected Agromet Station
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <h3 className="text-lg font-black text-gray-900">
                      {weatherData.current.district}, {weatherData.current.state}
                    </h3>
                    {weatherData.source === "STATIC" ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                        Estimated, not live
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        Live feed
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    Agro-Climatic Zone: <strong className="text-gray-800">{weatherData.current.agroZone || "National Agromet Network"}</strong>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-gray-500">State:</span>
                    <select
                      value={selectedWeatherState}
                      onChange={(e) => {
                        const st = e.target.value;
                        setSelectedWeatherState(st);
                        if (st !== "ALL") {
                          const first = weatherData.availableLocations.find((l) => l.state === st);
                          if (first) setSelectedDistrict(first.district);
                        }
                      }}
                      className="text-xs font-semibold px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 outline-none focus:border-emerald-600"
                    >
                      <option value="ALL">All States ({availableWeatherStates.length})</option>
                      {availableWeatherStates.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-gray-500">District:</span>
                    <select
                      value={selectedDistrict}
                      onChange={(e) => setSelectedDistrict(e.target.value)}
                      className="text-xs font-semibold px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 outline-none focus:border-emerald-600"
                    >
                      {filteredWeatherDistricts.map((loc) => (
                        <option key={loc.locationKey} value={loc.district}>
                          {loc.district} ({loc.state}) - {loc.temperature}°C
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={handleDetectLocation}
                    disabled={isLocating}
                    className="text-xs font-bold px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 transition-colors disabled:opacity-75 shadow-xs cursor-pointer"
                    title="Detect your current location via GPS"
                  >
                    {isLocating ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Navigation className="w-3.5 h-3.5 fill-current" />
                    )}
                    <span>{isLocating ? "Locating..." : "Auto-Detect GPS"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setWeatherSubTab("PAN_INDIA")}
                    className="text-xs font-bold px-3 py-2 rounded-xl bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200 flex items-center gap-1 transition-colors"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    Browse All India
                  </button>
                </div>
              </div>

              {/* IMD / Automated Weather Advisory Banner */}
              {weatherData.warning && (
                <div
                  className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                    weatherData.warning.alertLevel === "RED"
                      ? "bg-rose-50 border-rose-200 text-rose-950"
                      : weatherData.warning.alertLevel === "ORANGE"
                      ? "bg-amber-50 border-amber-200 text-amber-950"
                      : weatherData.warning.alertLevel === "YELLOW"
                      ? "bg-yellow-50 border-yellow-200 text-yellow-950"
                      : "bg-emerald-50 border-emerald-200 text-emerald-950"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2 rounded-xl mt-0.5 flex-shrink-0 ${
                        weatherData.warning.alertLevel === "RED"
                          ? "bg-rose-600 text-white"
                          : weatherData.warning.alertLevel === "ORANGE"
                          ? "bg-amber-600 text-white"
                          : weatherData.warning.alertLevel === "YELLOW"
                          ? "bg-yellow-500 text-white"
                          : "bg-emerald-600 text-white"
                      }`}
                    >
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold uppercase tracking-wide">
                          Advisory: {weatherData.warning.levelName}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-white/70">
                          Valid: {weatherData.warning.validUntil}
                        </span>
                      </div>
                      <p className="text-sm font-bold mt-0.5">{weatherData.warning.phenomenon}</p>
                      <p className="text-xs opacity-90 mt-1">
                        <strong>Farming Action: </strong> {weatherData.warning.farmerAction}
                      </p>
                    </div>
                  </div>

                  <div className="text-right text-[11px] opacity-80 whitespace-nowrap self-end sm:self-auto">
                    Impact: {weatherData.warning.impactOnFarming}
                  </div>
                </div>
              )}

              {/* Current Weather & Doppler Radar Nowcast Section */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Current Observation Hero (5 cols) */}
                <div className="lg:col-span-5 p-6 rounded-3xl bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-950 text-white space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        Live Observation (Accurate Real-Time)
                      </span>
                      <h3 className="text-xl font-extrabold text-white mt-1">
                        {weatherData.current.district}, {weatherData.current.state}
                      </h3>
                      <p className="text-xs text-emerald-200/80">
                        {weatherData.nowcast?.station || "District Agromet Unit"}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-5xl font-black">{weatherData.current.temperature}°C</span>
                      <p className="text-xs font-medium text-emerald-200 mt-1">
                        Feels like {weatherData.current.feelsLike || weatherData.current.temperature}°C
                      </p>
                    </div>
                  </div>

                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 text-xs font-semibold">
                    <CloudSun className="w-4 h-4 text-amber-300" />
                    {weatherData.current.condition}
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="p-3 rounded-2xl bg-white/10 space-y-0.5">
                      <span className="text-[10px] text-emerald-300 font-bold uppercase flex items-center gap-1">
                        <Droplets className="w-3 h-3 text-blue-300" /> Relative Humidity
                      </span>
                      <p className="text-base font-extrabold">{weatherData.current.humidity}%</p>
                      <p className="text-[10px] text-emerald-200">Morning RH-I / Evening RH-II</p>
                    </div>

                    <div className="p-3 rounded-2xl bg-white/10 space-y-0.5">
                      <span className="text-[10px] text-emerald-300 font-bold uppercase flex items-center gap-1">
                        <Wind className="w-3 h-3 text-teal-300" /> Wind Velocity
                      </span>
                      <p className="text-base font-extrabold">
                        {weatherData.current.windSpeed} km/h {weatherData.current.windDirection || "NW"}
                      </p>
                      <p className="text-[10px] text-emerald-200">Optimal drift &lt; 15 km/h</p>
                    </div>
                  </div>
                </div>

                {/* 3-Hour Doppler Radar Nowcast & Spray Status (7 cols) */}
                <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* 3-Hour Nowcast Card */}
                  {weatherData.nowcast && (
                    <div className="p-5 rounded-3xl bg-gray-50 border border-gray-100 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-lg border border-teal-200">
                            <Radio className="w-3 h-3 text-teal-600 animate-pulse" />
                            3-Hour Doppler Radar Nowcast
                          </span>
                          <span className="text-[10px] text-gray-500 font-medium">
                            {weatherData.nowcast.issuedAt}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-gray-700 mt-2">
                          Radar: {weatherData.nowcast.radarStation}
                        </h4>
                        <p className="text-xs text-gray-900 font-medium mt-1 leading-relaxed">
                          {weatherData.nowcast.headline}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-gray-200/60 flex items-center justify-between text-[11px]">
                        <span className="text-gray-500">
                          Peak Gusts: <strong>{weatherData.nowcast.gustSpeedKmh} km/h</strong>
                        </span>
                        <span className="text-blue-700 font-bold">
                          Expected Rain: {weatherData.nowcast.rainfallExpected3hMm} mm
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Spray Window Calculator Card */}
                  <div className="p-5 rounded-3xl bg-emerald-50/60 border border-emerald-100 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center justify-between">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg border ${
                            weatherData.sprayAdvisory.safeToSpray
                              ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                              : "bg-rose-100 text-rose-800 border-rose-300"
                          }`}
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          {weatherData.sprayAdvisory.safeToSpray ? "Safe Spray Window Active" : "Spray Window Suspended"}
                        </span>
                        {weatherData.sprayAdvisory.recommendedHours && (
                          <span className="text-[10px] font-bold text-emerald-800 bg-white px-2 py-0.5 rounded shadow-xs">
                            {weatherData.sprayAdvisory.recommendedHours}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-emerald-950 font-medium mt-2 leading-relaxed">
                        {weatherData.sprayAdvisory.message}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-emerald-200/60 text-[11px] text-emerald-800 flex items-center justify-between">
                      <span>Wind: {weatherData.sprayAdvisory.windSpeedKmh || weatherData.current.windSpeed} km/h</span>
                      <span>Rain Threat: {weatherData.current.rainfallForecast}</span>
                    </div>
                  </div>

                  {/* Irrigation Advisory Card */}
                  {weatherData.irrigationAdvisory && (
                    <div className="sm:col-span-2 p-4 rounded-2xl bg-blue-50/50 border border-blue-100 flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-blue-600 text-white flex-shrink-0 mt-0.5">
                        <Droplets className="w-4 h-4" />
                      </div>
                      <div className="text-xs space-y-0.5">
                        <div className="flex items-center gap-2">
                          <strong className="text-blue-950 font-bold uppercase">
                            Irrigation Management Advisory:
                          </strong>
                          <span className="text-[10px] font-extrabold px-2 py-0.2 rounded bg-blue-100 text-blue-800">
                            {weatherData.irrigationAdvisory.status}
                          </span>
                        </div>
                        <p className="text-blue-900 leading-relaxed">
                          {weatherData.irrigationAdvisory.message}
                        </p>
                        {weatherData.irrigationAdvisory.nextIrrigationWindow && (
                          <p className="text-[11px] text-blue-700 font-semibold">
                            Recommended Window: {weatherData.irrigationAdvisory.nextIrrigationWindow}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 7-Day Day-by-Day Extended Agro-Weather Forecast */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <CloudSun className="w-4 h-4 text-emerald-700" />
                    IMD 7-Day Day-by-Day Meteorological Outlook
                  </h3>
                  <span className="text-xs text-gray-500">Updated twice daily by IMD RMC / MC</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                  {weatherData.forecast.map((f, i) => (
                    <div
                      key={i}
                      className={`p-3.5 rounded-2xl border text-center space-y-1.5 transition-all ${
                        i === 0
                          ? "bg-emerald-50/80 border-emerald-200 shadow-xs"
                          : "bg-gray-50/70 border-gray-100 hover:bg-white hover:shadow-xs"
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-extrabold text-gray-800">{f.day}</span>
                        <span className="text-[10px] text-gray-400">{f.date?.slice(5) || ""}</span>
                      </div>

                      <div className="py-1">
                        <p className="text-2xl font-black text-gray-900">
                          {f.maxTemp || f.temp}°
                          <span className="text-xs font-semibold text-gray-500 ml-1">
                            /{f.minTemp || Math.round(f.temp - 6)}°
                          </span>
                        </p>
                        <p className="text-[11px] text-gray-600 font-medium truncate mt-0.5">
                          {f.condition}
                        </p>
                      </div>

                      <div className="pt-1 border-t border-gray-200/50 space-y-1 text-[10px]">
                        <div className="flex items-center justify-between text-blue-700 font-bold bg-blue-50/60 px-1.5 py-0.5 rounded">
                          <span>Rain:</span>
                          <span>{f.rainProb}</span>
                        </div>
                        <div className="flex items-center justify-between text-gray-500">
                          <span>RH:</span>
                          <span>{f.morningHumidity || 60}% / {f.eveningHumidity || 45}%</span>
                        </div>
                        <div className="flex items-center justify-between text-gray-500">
                          <span>Wind:</span>
                          <span>{f.windSpeed || 8} km/h</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* GKMS Crop-Specific Agro-Advisories & Pest Warnings */}
              {weatherData.cropAdvisories && weatherData.cropAdvisories.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <Sprout className="w-4 h-4 text-emerald-700" />
                    ICAR-KVK & GKMS Crop-Specific Field Advisories ({weatherData.current.district})
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {weatherData.cropAdvisories.map((crop, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl bg-white border border-gray-100 shadow-xs space-y-2 hover:border-emerald-200 transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <h4 className="font-extrabold text-sm text-gray-900">{crop.crop}</h4>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-100">
                              Stage: {crop.stage}
                            </span>
                          </div>
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                            Risk: {crop.pestDiseaseRisk}
                          </span>
                        </div>

                        <p className="text-xs text-gray-700 leading-relaxed">{crop.recommendation}</p>

                        {crop.controlMeasure && (
                          <div className="p-2 rounded-xl bg-gray-50 border border-gray-100 text-[11px] text-gray-600">
                            <strong className="text-gray-800">Prescribed Measure: </strong>
                            {crop.controlMeasure}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Livestock & Animal Agromet Care */}
              {weatherData.livestockAdvisory && (
                <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/60 flex items-start gap-3 text-xs text-amber-950">
                  <Milk className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold">Dairy & Livestock Meteorological Care: </strong>
                    <span>{weatherData.livestockAdvisory}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB: Personalised Crop Calendar & Sowing/Spray Reminders */}
      {activeTab === "crop-calendar" && <CropCalendarTab />}

      {/* TAB 3: Agriculture News (Ministry of Agriculture & Farmers Welfare & Krishi Vigyan Kendras) */}
      {activeTab === "news" && <AgriNewsTab />}

      {/* CONTENT LISTING (Articles / Audio Tracks for Selected Tab) */}
      {(activeTab === "all" ||
        activeTab === "crop-advisory" ||
        activeTab === "livestock" ||
        activeTab === "government-schemes") && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 flex-1 max-w-sm">
              <Search className="w-4 h-4 text-gray-400 ml-2" />
              <input
                type="search"
                placeholder={t("searchPlaceholder", "Search topics, crops, diseases, schemes...")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs sm:text-sm bg-transparent border-none outline-none text-gray-800"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-500">{t("languageSelectLabel", "Language")}:</span>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="text-xs font-semibold px-2.5 py-1.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-700 outline-none"
              >
                <option value="ALL">{t("allLanguages", "All Languages")}</option>
                <option value="Hindi">Hindi (हिन्दी)</option>
                <option value="English">English</option>
                <option value="Telugu">Telugu (తెలుగు)</option>
                <option value="Punjabi">Punjabi (ਪੰਜਾਬੀ)</option>
                <option value="Marathi">Marathi (मराठी)</option>
              </select>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {contentList.map((item) => {
              const isThisPlaying = currentTrack?.id === item.id && isPlaying;
              return (
                <article
                  key={item.id}
                  className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs font-bold mb-2">
                      <span className="text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md uppercase text-[10px]">
                        {item.type.replace(/_/g, " ")}
                      </span>
                      <span className="text-gray-400 font-normal">{item.language}</span>
                    </div>

                    <h3 className="font-bold text-gray-900 text-base leading-snug line-clamp-2 group-hover:text-emerald-800">
                      {translateContent(item.title)}
                    </h3>

                    <p className="text-xs text-gray-600 mt-2 line-clamp-3 leading-relaxed">
                      {translateContent(item.description)}
                    </p>

                    {item.authorName && (
                      <p className="text-[11px] text-gray-400 mt-3 font-medium">
                        {t("by", "By")} {item.authorName}
                      </p>
                    )}
                  </div>

                  <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => handlePlayContent(item)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold transition-transform active:scale-95"
                    >
                      {isThisPlaying ? (
                        <Pause className="w-3.5 h-3.5 fill-current" />
                      ) : (
                        <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                      )}
                      <span>{isThisPlaying ? t("playingAudio", "Playing...") : t("listenAudio", "Listen Audio")}</span>
                    </button>

                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span>{Math.floor(item.durationSec / 60)} min</span>
                      <span className="flex items-center gap-1 text-gray-500">
                        <Heart className="w-3 h-3" /> {item.likesCount}
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {contentList.length === 0 && !loading && (
            <div className="text-center py-12 bg-white rounded-3xl border border-gray-100 p-6">
              <p className="text-gray-500 text-sm">{t("noResults", "No agriculture content matching your filters.")}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
