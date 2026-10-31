import { useState, useEffect, useMemo, useCallback } from "react";
import { useLanguage } from "../../context/LanguageContext";
import {
  fetchLiveMandiPrices,
  fetchLiveMandiStates,
  fetchLiveMandiStats,
  fetchCommodityPriceMap,
  refreshLiveMandiData,
  LiveMandiRecord,
  StateMandiSummary,
  LiveMandiStats,
  CommodityPriceMapResponse,
} from "../../services/live-mandi.service";
import {
  TrendingUp,
  TrendingDown,
  Search,
  RefreshCw,
  MapPin,
  BarChart3,
  Filter,
  ChevronRight,
  ChevronDown,
  ArrowUpDown,
  Loader2,
  Database,
  Wifi,
  WifiOff,
  BadgeCheck,
  Store,
  IndianRupee,
  Wheat,
  X,
  ArrowLeft,
  Globe,
  Layers,
  Activity,
  Clock,
  Compass,
  AlertTriangle,
  AlertCircle,
} from "lucide-react";
import MandiTrendsAndNearbyCompare from "../../components/mandi/MandiTrendsAndNearbyCompare";
import usePageSeo from "../../hooks/usePageSeo";
import { useAuth } from "../../context/AuthContext";

// ────────────────────────────────────────────────────────────────
// State abbreviation + colour map for the interactive grid
// ────────────────────────────────────────────────────────────────
const STATE_COLORS: Record<string, string> = {
  "Punjab": "from-amber-500 to-amber-600",
  "Haryana": "from-emerald-500 to-emerald-600",
  "Uttar Pradesh": "from-orange-500 to-orange-600",
  "Madhya Pradesh": "from-teal-500 to-teal-600",
  "Rajasthan": "from-yellow-500 to-yellow-600",
  "Gujarat": "from-blue-500 to-blue-600",
  "Maharashtra": "from-red-500 to-red-600",
  "Karnataka": "from-purple-500 to-purple-600",
  "Tamil Nadu": "from-pink-500 to-pink-600",
  "Andhra Pradesh": "from-indigo-500 to-indigo-600",
  "Telangana": "from-rose-500 to-rose-600",
  "Kerala": "from-green-500 to-green-600",
  "West Bengal": "from-sky-500 to-sky-600",
  "Bihar": "from-lime-500 to-lime-600",
  "Odisha": "from-cyan-500 to-cyan-600",
  "Jharkhand": "from-stone-500 to-stone-600",
  "Chhattisgarh": "from-emerald-600 to-emerald-700",
  "Assam": "from-green-600 to-green-700",
  "Delhi": "from-violet-500 to-violet-600",
  "Himachal Pradesh": "from-sky-600 to-sky-700",
  "Uttarakhand": "from-teal-600 to-teal-700",
  "Goa": "from-amber-600 to-amber-700",
  "Jammu and Kashmir": "from-blue-600 to-blue-700",
  "Tripura": "from-fuchsia-500 to-fuchsia-600",
  "Meghalaya": "from-green-400 to-green-500",
  "Manipur": "from-orange-400 to-orange-500",
  "Nagaland": "from-red-400 to-red-500",
  "Mizoram": "from-pink-400 to-pink-500",
  "Arunachal Pradesh": "from-indigo-400 to-indigo-500",
  "Sikkim": "from-cyan-400 to-cyan-500",
  "Ladakh": "from-slate-500 to-slate-600",
  "Puducherry": "from-rose-400 to-rose-500",
};

const STATE_ABBR: Record<string, string> = {
  "Punjab": "PB",
  "Haryana": "HR",
  "Uttar Pradesh": "UP",
  "Madhya Pradesh": "MP",
  "Rajasthan": "RJ",
  "Gujarat": "GJ",
  "Maharashtra": "MH",
  "Karnataka": "KA",
  "Tamil Nadu": "TN",
  "Andhra Pradesh": "AP",
  "Telangana": "TS",
  "Kerala": "KL",
  "West Bengal": "WB",
  "Bihar": "BR",
  "Odisha": "OD",
  "Jharkhand": "JH",
  "Chhattisgarh": "CG",
  "Assam": "AS",
  "Delhi": "DL",
  "Himachal Pradesh": "HP",
  "Uttarakhand": "UK",
  "Goa": "GA",
  "Jammu and Kashmir": "JK",
  "Tripura": "TR",
  "Meghalaya": "ML",
  "Manipur": "MN",
  "Nagaland": "NL",
  "Mizoram": "MZ",
  "Arunachal Pradesh": "AR",
  "Sikkim": "SK",
  "Ladakh": "LA",
  "Puducherry": "PY",
};

type SortField = "commodity" | "market" | "modalPrice" | "minPrice" | "maxPrice" | "state";
type SortDir = "asc" | "desc";

// Popular commodities for quick-filter chips
const POPULAR_COMMODITIES = [
  "Wheat", "Rice", "Paddy", "Onion", "Potato", "Tomato", "Soybean",
  "Cotton", "Mustard", "Maize", "Gram", "Groundnut", "Turmeric",
  "Chilli", "Jowar", "Bajra", "Sugarcane", "Banana", "Apple",
];

export default function MandiPricesPage() {
  const { t, translateContent } = useLanguage();
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  // ── Data State ──────────────────────────────────────
  const [records, setRecords] = useState<LiveMandiRecord[]>([]);
  const [stateSummaries, setStateSummaries] = useState<StateMandiSummary[]>([]);
  const [stats, setStats] = useState<LiveMandiStats | null>(null);
  const [commodityMap, setCommodityMap] = useState<CommodityPriceMapResponse | null>(null);

  // ── UI State ────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<"states" | "all" | "commodity" | "nearby-trends">("states");
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectedCommodity, setSelectedCommodity] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("modalPrice");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [currentPage, setCurrentPage] = useState(1);

  usePageSeo({
    title: selectedCommodity
      ? `${selectedCommodity} मंडी भाव व 100 किमी तुलना`
      : selectedState
      ? `${selectedState} मंडी भाव`
      : "लाइव मंडी भाव व 100 किमी नजदीकी बाजार तुलना",
    description: "Agmarknet और eNAM से गेहूं, धान, कपास और सरसों के आज के नवीनतम मंडी भाव। 100 किमी दायरे में सबसे अधिक भाव देने वाली मंडी खोजें।",
    canonicalPath: "/mandi-prices",
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&auto=format&fit=crop&q=80",
  });
  const ITEMS_PER_PAGE = 25;

  // ── Auto-refresh timer ──────────────────────────────
  const [autoRefreshSec, setAutoRefreshSec] = useState(900); // 15 min

  useEffect(() => {
    const timer = setInterval(() => {
      setAutoRefreshSec((prev) => {
        if (prev <= 1) {
          loadData();
          return 900;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // ── Initial data load ───────────────────────────────
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setApiError(null);
    try {
      const [pricesRes, statesRes, statsRes] = await Promise.all([
        fetchLiveMandiPrices({ limit: 500 }),
        fetchLiveMandiStates().catch(() => null),
        fetchLiveMandiStats().catch(() => null),
      ]);

      if (pricesRes) setRecords(pricesRes.records);
      if (statesRes) setStateSummaries(statesRes.states);
      if (statsRes) setStats(statsRes);
    } catch (err: any) {
      console.error("Failed to load live mandi data:", err);
      setApiError("Unable to reach the live mandi prices service. Please check network connection and retry.");
    } finally {
      setLoading(false);
    }
  };

  // ── Fetch state-specific data ───────────────────────
  const loadStateData = useCallback(async (state: string) => {
    setSelectedState(state);
    setActiveView("all");
    setCurrentPage(1);
    setLoading(true);
    setApiError(null);
    try {
      const res = await fetchLiveMandiPrices({ state, limit: 200 });
      setRecords(res.records);
      if (res.stats) setStats(res.stats);
    } catch (err: any) {
      console.error("Failed to load state data:", err);
      setApiError(`Unable to load live mandi prices for ${state}.`);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Fetch commodity across India ────────────────────
  const loadCommodityData = useCallback(async (commodity: string) => {
    setSelectedCommodity(commodity);
    setActiveView("commodity");
    setCurrentPage(1);
    setLoading(true);
    setApiError(null);
    try {
      const res = await fetchCommodityPriceMap(commodity);
      setCommodityMap(res);
    } catch (err: any) {
      console.error("Failed to load commodity data:", err);
      setApiError(`Unable to load live mandi rates for ${commodity}.`);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Refresh ─────────────────────────────────────────
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      if (isAdmin) {
        await refreshLiveMandiData();
      }
      await loadData();
      setAutoRefreshSec(900);
    } catch (err) {
      console.error("Refresh failed:", err);
      await loadData();
    } finally {
      setRefreshing(false);
    }
  };

  // ── Back to states view ─────────────────────────────
  const handleBackToStates = () => {
    setSelectedState(null);
    setSelectedCommodity("");
    setActiveView("states");
    setCurrentPage(1);
    loadData();
  };

  // ── Sort toggle ─────────────────────────────────────
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  // ── Derived: filtered + sorted records ──────────────
  const displayRecords = useMemo(() => {
    let source = activeView === "commodity" ? (commodityMap?.records || []) : records;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      source = source.filter(
        (r) =>
          r.commodity.toLowerCase().includes(q) ||
          r.market.toLowerCase().includes(q) ||
          r.district.toLowerCase().includes(q) ||
          r.state.toLowerCase().includes(q) ||
          (r.variety && r.variety.toLowerCase().includes(q))
      );
    }

    const sorted = [...source].sort((a, b) => {
      const valA = a[sortField] ?? "";
      const valB = b[sortField] ?? "";
      if (typeof valA === "number" && typeof valB === "number") {
        return sortDir === "asc" ? valA - valB : valB - valA;
      }
      return sortDir === "asc"
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });

    return sorted;
  }, [records, commodityMap, searchQuery, sortField, sortDir, activeView]);

  const totalPages = Math.ceil(displayRecords.length / ITEMS_PER_PAGE);
  const paginatedRecords = displayRecords.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // ── Format time remaining ───────────────────────────
  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // ── Trend badge ─────────────────────────────────────
  const TrendBadge = ({ trend }: { trend: string }) => {
    if (trend === "UP")
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-full">
          <TrendingUp className="w-3 h-3" /> UP
        </span>
      );
    if (trend === "DOWN")
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-100 px-1.5 py-0.5 rounded-full">
          <TrendingDown className="w-3 h-3" /> DOWN
        </span>
      );
    return (
      <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">
        STABLE
      </span>
    );
  };

  // ── Sort Header ─────────────────────────────────────
  const SortHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <th
      className="py-3 px-4 font-bold cursor-pointer hover:text-emerald-700 transition-colors select-none"
      onClick={() => handleSort(field)}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        {sortField === field && (
          <ArrowUpDown className={`w-3 h-3 ${sortDir === "desc" ? "rotate-180" : ""}`} />
        )}
      </span>
    </th>
  );

  return (
    <div className="space-y-6 pb-16">
      {/* ────────── Hero Header ────────── */}
      <div className="bg-gradient-to-br from-emerald-950 via-green-950 to-teal-950 text-white p-6 sm:p-8 rounded-3xl shadow-lg relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-500/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4" />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-emerald-400 text-xs font-bold uppercase tracking-wider">
                🇮🇳 {t("realTimeData", "Real-Time Data")}
              </span>
              {stats && (
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    stats.dataSource === "LIVE_API" || stats.dataSource === "CACHED"
                      ? "bg-emerald-500/30 text-emerald-300 border border-emerald-400/40"
                      : "bg-amber-500/30 text-amber-300 border border-amber-400/40"
                  }`}
                >
                  {stats.dataSource === "LIVE_API" || stats.dataSource === "CACHED" ? (
                    <><Wifi className="w-3 h-3" /> LIVE GOVERNMENT DATA</>
                  ) : (
                    <><WifiOff className="w-3 h-3" /> SAMPLE DATA (FALLBACK)</>
                  )}
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold">
              {t("allIndiaMandiPrices", "All India Mandi Prices")}
            </h1>
            <p className="text-emerald-200 text-xs sm:text-sm max-w-xl">
              {t(
                "mandiPricesDesc",
                "Live wholesale market (APMC mandi) prices from across India. Data sourced from data.gov.in – Ministry of Agriculture & Farmers Welfare."
              )}
            </p>
          </div>

          {/* Stats pills */}
          {stats && (
            <div className="flex flex-wrap gap-2">
              <div className="bg-white/10 backdrop-blur-md px-3 py-2 rounded-xl border border-white/10 text-center min-w-[80px]">
                <div className="text-lg font-black">{stats.uniqueStates}</div>
                <div className="text-[10px] text-emerald-300 font-semibold">States</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md px-3 py-2 rounded-xl border border-white/10 text-center min-w-[80px]">
                <div className="text-lg font-black">{stats.uniqueMarkets.toLocaleString("en-IN")}</div>
                <div className="text-[10px] text-emerald-300 font-semibold">Mandis</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md px-3 py-2 rounded-xl border border-white/10 text-center min-w-[80px]">
                <div className="text-lg font-black">{stats.uniqueCommodities}</div>
                <div className="text-[10px] text-emerald-300 font-semibold">Crops</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md px-3 py-2 rounded-xl border border-white/10 text-center min-w-[80px]">
                <div className="text-lg font-black">{stats.totalRecords.toLocaleString("en-IN")}</div>
                <div className="text-[10px] text-emerald-300 font-semibold">Records</div>
              </div>
            </div>
          )}
        </div>

        {/* Refresh bar */}
        <div className="relative z-10 mt-4 flex items-center justify-between text-xs text-emerald-300/80">
          <div className="flex items-center gap-3">
            <BadgeCheck className="w-4 h-4 text-emerald-400" />
            <span>Source: data.gov.in • Ministry of Agriculture & Farmers Welfare, Govt. of India</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Next refresh: {formatTime(autoRefreshSec)}
            </span>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              title={isAdmin ? "Trigger admin server cache refresh" : "Reload latest market data"}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${refreshing ? "animate-spin" : ""}`} />
              {refreshing ? "Refreshing…" : isAdmin ? "Admin Sync Now" : "Refresh Now"}
            </button>
          </div>
        </div>
      </div>

      {/* ────────── API Error Banner ────────── */}
      {apiError && records.length === 0 && (
        <div
          role="alert"
          className="bg-rose-500/10 border-2 border-rose-500/40 text-rose-950 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-rose-500/20 text-rose-800 shrink-0 mt-0.5">
              <AlertCircle className="w-6 h-6 text-rose-700" />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="font-extrabold text-base sm:text-lg text-rose-950">
                  {t("apiErrorTitle", "API Error: Unable to Load Mandi Prices")}
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-200 text-rose-900 px-2 py-0.5 rounded-full">
                  Connection Error
                </span>
              </div>
              <p className="text-xs sm:text-sm text-rose-900/80 leading-relaxed max-w-2xl">
                {apiError}
              </p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            <span>{refreshing ? "Retrying..." : "Retry Connection"}</span>
          </button>
        </div>
      )}

      {/* ────────── Page-level Benchmark Fallback Banner ────────── */}
      {stats?.dataSource === "BENCHMARK_FALLBACK" && (
        <div
          role="alert"
          className="bg-amber-500/10 border-2 border-amber-500/40 text-amber-950 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-800 shrink-0 mt-0.5">
              <AlertTriangle className="w-6 h-6 text-amber-700" />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="font-extrabold text-base sm:text-lg text-amber-950">
                  {t("sampleDataBannerTitle", "Notice: Benchmark Reference Data Active")}
                </h3>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900 border border-amber-300 uppercase tracking-wide">
                  Offline Benchmark Mode
                </span>
              </div>
              <p className="text-xs sm:text-sm text-amber-800/90 leading-relaxed max-w-3xl">
                {t(
                  "sampleDataBannerDesc",
                  "Live feed from data.gov.in (Agmarknet) is currently offline or DATA_GOV_IN_API_KEY is not configured in apps/server/.env. Market rates below are fallback benchmark references. Arrival dates on fallback rows are omitted (null) and not stamped with today's date."
                )}
              </p>
            </div>
          </div>
          <div className="shrink-0 flex items-center gap-2 self-stretch sm:self-auto">
            <div className="text-center sm:text-right bg-amber-100/90 px-4 py-2.5 rounded-2xl border border-amber-300/80 w-full sm:w-auto">
              <div className="text-xs font-bold text-amber-900">Data Source</div>
              <div className="text-[11px] font-semibold text-amber-700">BENCHMARK_FALLBACK</div>
            </div>
          </div>
        </div>
      )}

      {/* ────────── Main View Mode Switcher ────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2.5 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setActiveView("states");
              setSelectedState(null);
              setSelectedCommodity("");
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeView === "states" || activeView === "all" || activeView === "commodity"
                ? "bg-emerald-800 text-white shadow-sm"
                : "bg-gray-50 text-gray-700 hover:bg-gray-100"
            }`}
          >
            <Store className="w-4 h-4" />
            <span>State-Wise APMC Explorer</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveView("nearby-trends")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeView === "nearby-trends"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
            }`}
          >
            <Compass className="w-4 h-4 text-amber-300" />
            <span>🏆 Best Market (100 km) & 30-Day Trends</span>
          </button>
        </div>
      </div>

      {activeView === "nearby-trends" ? (
        <MandiTrendsAndNearbyCompare />
      ) : (
        <>
          {/* ────────── Navigation Breadcrumb ────────── */}
          {(selectedState || selectedCommodity) && (
        <div className="flex items-center gap-2 text-sm">
          <button
            onClick={handleBackToStates}
            className="flex items-center gap-1 text-emerald-700 hover:text-emerald-900 font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            All States
          </button>
          <ChevronRight className="w-4 h-4 text-gray-400" />
          <span className="font-bold text-gray-900">
            {selectedState || selectedCommodity}
          </span>
        </div>
      )}

      {/* ────────── Commodity Quick Filters ────────── */}
      <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <Wheat className="w-4 h-4 text-amber-600" />
          <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
            Quick Commodity Filter
          </span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {POPULAR_COMMODITIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => loadCommodityData(c)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCommodity === c
                  ? "bg-emerald-800 text-white shadow-sm"
                  : "bg-gray-100 text-gray-700 hover:bg-emerald-50 hover:text-emerald-800"
              }`}
            >
              {c}
            </button>
          ))}
          {selectedCommodity && (
            <button
              onClick={handleBackToStates}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 flex items-center gap-1 transition-all"
            >
              <X className="w-3 h-3" /> Clear
            </button>
          )}
        </div>
      </div>

      {/* ────────── Search Bar ────────── */}
      {activeView !== "states" && (
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by commodity, market, district, state…"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* ────────── Loading State ────────── */}
      {loading && (
        <div className="flex items-center justify-center py-20 gap-3 text-emerald-700">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-sm font-semibold">Loading live mandi data…</span>
        </div>
      )}

      {/* ════════════════════════════════════════════
           VIEW 1: ALL STATES GRID
         ════════════════════════════════════════════ */}
      {!loading && activeView === "states" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Globe className="w-5 h-5 text-emerald-700" />
              {t("selectState", "Select a State to View Mandi Prices")}
            </h2>
            <span className="text-xs text-gray-500">
              {stateSummaries.length} States & UTs reporting
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {stateSummaries
              .sort((a, b) => b.totalRecords - a.totalRecords)
              .map((s) => {
                const gradient = STATE_COLORS[s.state] || "from-gray-500 to-gray-600";
                const abbr = STATE_ABBR[s.state] || s.state.substring(0, 2).toUpperCase();

                return (
                  <button
                    key={s.state}
                    onClick={() => loadStateData(s.state)}
                    className="group relative bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-lg hover:border-emerald-200 transition-all text-left overflow-hidden"
                  >
                    {/* State abbreviation badge */}
                    <div
                      className={`absolute top-3 right-3 w-8 h-8 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-[10px] font-black shadow-sm`}
                    >
                      {abbr}
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-sm font-bold text-gray-900 pr-10 group-hover:text-emerald-800 transition-colors">
                        {s.state}
                      </h3>

                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                          <Store className="w-3 h-3" />
                          <span className="font-semibold">{s.totalMarkets}</span> Markets
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                          <Layers className="w-3 h-3" />
                          <span className="font-semibold">{s.totalCommodities}</span> Commodities
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                          <Activity className="w-3 h-3" />
                          <span className="font-semibold">{s.totalRecords}</span> Records
                        </div>
                      </div>

                      {/* Top commodity */}
                      {s.topCommodities && s.topCommodities[0] && (
                        <div className="mt-2 pt-2 border-t border-gray-100">
                          <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Top Crop</div>
                          <div className="text-xs font-bold text-emerald-800 mt-0.5">
                            {s.topCommodities[0].commodity}
                          </div>
                          <div className="text-[11px] text-gray-600 font-semibold">
                            ₹{s.topCommodities[0].avgModalPrice?.toLocaleString("en-IN")} /Qtl avg
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Hover arrow */}
                    <ChevronRight className="absolute bottom-3 right-3 w-4 h-4 text-gray-300 group-hover:text-emerald-500 transition-colors" />
                  </button>
                );
              })}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════
           VIEW 2: COMMODITY PRICE MAP (across India)
         ════════════════════════════════════════════ */}
      {!loading && activeView === "commodity" && commodityMap && (
        <div className="space-y-4">
          {/* Hero Card */}
          <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-yellow-50 p-5 rounded-2xl border border-amber-100 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">
                  Pan-India Price Map
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 mt-1">
                  {commodityMap.commodity}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Prices across {commodityMap.statesReporting} states &bull; {commodityMap.count} market records
                </p>
              </div>

              <div className="flex gap-3">
                <div className="bg-white px-4 py-3 rounded-xl border border-amber-100 text-center">
                  <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Avg Price</div>
                  <div className="text-lg font-black text-amber-900">
                    ₹{commodityMap.avgModalPrice?.toLocaleString("en-IN")}
                  </div>
                  <div className="text-[10px] text-gray-400">per Quintal</div>
                </div>
                <div className="bg-white px-4 py-3 rounded-xl border border-emerald-100 text-center">
                  <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Range</div>
                  <div className="text-sm font-bold text-gray-800">
                    ₹{commodityMap.minPrice?.toLocaleString("en-IN")} – ₹{commodityMap.maxPrice?.toLocaleString("en-IN")}
                  </div>
                  <div className="text-[10px] text-gray-400">Min – Max</div>
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          {renderPriceTable()}
        </div>
      )}

      {/* ════════════════════════════════════════════
           VIEW 3: ALL / STATE-FILTERED RECORDS TABLE
         ════════════════════════════════════════════ */}
      {!loading && activeView === "all" && (
        <div className="space-y-4">
          {selectedState && (
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-4 rounded-2xl border border-emerald-100">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl bg-gradient-to-br ${
                    STATE_COLORS[selectedState] || "from-gray-500 to-gray-600"
                  } flex items-center justify-center text-white text-sm font-black shadow-sm`}
                >
                  {STATE_ABBR[selectedState] || selectedState.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{selectedState}</h2>
                  <p className="text-xs text-gray-500">
                    {displayRecords.length} market records found
                  </p>
                </div>
              </div>
            </div>
          )}

          {renderPriceTable()}
        </div>
      )}
        </>
      )}
    </div>
  );

  // ── Shared price table renderer ─────────────────────
  function renderPriceTable() {
    return (
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Results count */}
        <div className="px-5 pt-4 pb-2 flex items-center justify-between">
          <span className="text-xs text-gray-500 font-medium">
            Showing {paginatedRecords.length} of {displayRecords.length} records
          </span>
          {displayRecords.length > ITEMS_PER_PAGE && (
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                    currentPage === page
                      ? "bg-emerald-800 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {page}
                </button>
              ))}
              {totalPages > 10 && (
                <span className="text-xs text-gray-400 px-1">…{totalPages}</span>
              )}
            </div>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400 uppercase text-[10px] tracking-wider">
                <SortHeader field="commodity">{t("commodity", "Commodity")}</SortHeader>
                <SortHeader field="market">{t("market", "Market / Mandi")}</SortHeader>
                <SortHeader field="state">{t("state", "State")}</SortHeader>
                <th className="py-3 px-4 font-bold">{t("variety", "Variety")}</th>
                <SortHeader field="minPrice">{t("minPrice", "Min ₹")}</SortHeader>
                <SortHeader field="maxPrice">{t("maxPrice", "Max ₹")}</SortHeader>
                <SortHeader field="modalPrice">{t("modalPrice", "Modal ₹/Qtl")}</SortHeader>
                <th className="py-3 px-4 font-bold text-center">{t("trend", "Trend")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginatedRecords.map((r, idx) => (
                <tr
                  key={`${r.state}-${r.market}-${r.commodity}-${idx}`}
                  className="hover:bg-emerald-50/40 transition-colors"
                >
                  <td className="py-3 px-4 font-bold text-gray-900">
                    {translateContent(r.commodity)}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-gray-800">{r.market}</div>
                    <div className="text-[11px] text-gray-500">{r.district}</div>
                    {r.arrivalDate && (
                      <div className="text-[10px] text-gray-400 mt-0.5 font-medium">
                        {t("arrivalDate", "Arrival")}: {r.arrivalDate}
                      </div>
                    )}
                    <span
                      className={`inline-block mt-1 text-[10px] font-semibold px-1.5 py-0.5 rounded border ${
                        r.isSample
                          ? "bg-amber-50 text-amber-800 border-amber-200"
                          : "bg-emerald-50 text-emerald-800 border-emerald-200"
                      }`}
                    >
                      {r.isSample ? "Sample Data" : (r.sourceLabel || "Live Government Data")}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => loadStateData(r.state)}
                      className="text-emerald-700 hover:text-emerald-900 font-semibold underline-offset-2 hover:underline transition-colors"
                    >
                      {r.state}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-gray-500 text-xs">{r.variety || "–"}</td>
                  <td className="py-3 px-4 text-gray-600 tabular-nums font-medium">
                    {r.minPrice != null && r.minPrice > 0 ? `₹${r.minPrice.toLocaleString("en-IN")}` : "—"}
                  </td>
                  <td className="py-3 px-4 text-gray-600 tabular-nums font-medium">
                    {r.maxPrice != null && r.maxPrice > 0 ? `₹${r.maxPrice.toLocaleString("en-IN")}` : "—"}
                  </td>
                  <td className="py-3 px-4 text-right font-extrabold text-emerald-900 text-base tabular-nums">
                    {r.modalPrice != null && r.modalPrice > 0 ? `₹${r.modalPrice.toLocaleString("en-IN")}` : "—"}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <TrendBadge trend={r.trend} />
                  </td>
                </tr>
              ))}

              {paginatedRecords.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <BarChart3 className="w-8 h-8 text-gray-300" />
                      <span className="text-sm font-medium">No mandi records found</span>
                      <span className="text-xs">Try adjusting your search or filters</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom pagination */}
        {displayRecords.length > ITEMS_PER_PAGE && (
          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-40 transition-all"
            >
              ← Previous
            </button>
            <span className="text-xs text-gray-500">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-40 transition-all"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    );
  }
}
