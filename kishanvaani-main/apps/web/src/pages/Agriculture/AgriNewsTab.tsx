import { useState, useEffect, useMemo } from "react";
import { useAudioPlayer, AudioTrack } from "../../context/AudioPlayerContext";
import {
  fetchAgriNewsList,
  fetchKvkDirectory,
  fetchAgriNewsStats,
  AgriNewsItem,
  KvkCenterInfo,
  AgriNewsStatsResponse,
} from "../../services/agri-news.service";
import {
  FALLBACK_NEWS,
  FALLBACK_KVK_CENTERS,
  FALLBACK_NEWS_STATS,
} from "../../data/agri-news-fallback.data";
import {
  Newspaper,
  Landmark,
  Microscope,
  Building2,
  Search,
  Filter,
  Volume2,
  Play,
  Pause,
  ExternalLink,
  Calendar,
  AlertTriangle,
  FileText,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  X,
  Radio,
  BookOpen,
  Clock,
  Sparkles,
} from "lucide-react";

import { useLanguage } from "../../context/LanguageContext";

type NewsSubTab = "ALL" | "MINISTRY" | "KVK" | "DIRECTORY";

const CATEGORY_MAP: Record<string, { label: string; bg: string; text: string }> = {
  SCHEMES: { label: "Govt Schemes", bg: "bg-blue-50", text: "text-blue-800" },
  SUBSIDY_MSP: { label: "MSP & Subsidies", bg: "bg-amber-50", text: "text-amber-800" },
  PEST_ALERT: { label: "Pest & Disease Alert", bg: "bg-red-50", text: "text-red-700" },
  CROP_SCIENCE: { label: "Crop Science & Agronomy", bg: "bg-emerald-50", text: "text-emerald-800" },
  ORGANIC_NATURAL: { label: "Organic & Natural", bg: "bg-lime-50", text: "text-lime-800" },
  TECHNOLOGY: { label: "AgriTech & Machinery", bg: "bg-purple-50", text: "text-purple-800" },
};

export default function AgriNewsTab() {
  const { currentTrack, isPlaying, playTrack, togglePlayPause } = useAudioPlayer();
  const { t, translateContent } = useLanguage();

  const [subTab, setSubTab] = useState<NewsSubTab>("ALL");
  // Pre-load fallback data so content is always visible, even without API
  const [newsItems, setNewsItems] = useState<AgriNewsItem[]>(FALLBACK_NEWS as unknown as AgriNewsItem[]);
  const [stats, setStats] = useState<AgriNewsStatsResponse | null>(FALLBACK_NEWS_STATS as AgriNewsStatsResponse);
  const [loading, setLoading] = useState(false);
  const [isLive, setIsLive] = useState<boolean>(false);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [isError, setIsError] = useState<boolean>(false);
  const [reloadCounter, setReloadCounter] = useState(0);

  // Helper for "fetched X ago"
  const formatFetchedAgo = (dateStr: string | null): string => {
    if (!dateStr) return "";
    try {
      const diffMs = Date.now() - new Date(dateStr).getTime();
      if (diffMs < 0) return "just now";
      const mins = Math.floor(diffMs / 60000);
      if (mins < 1) return "just now";
      if (mins === 1) return "1 min ago";
      if (mins < 60) return `${mins} mins ago`;
      const hours = Math.floor(mins / 60);
      if (hours === 1) return "1 hr ago";
      if (hours < 24) return `${hours} hrs ago`;
      const days = Math.floor(hours / 24);
      return `${days}d ago`;
    } catch {
      return "";
    }
  };

  // Filters for News
  const [dateFilter, setDateFilter] = useState<"ALL" | "TODAY" | "7DAYS">("ALL");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedState, setSelectedState] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Directory state — pre-loaded with fallback KVK centers
  const [kvkCenters, setKvkCenters] = useState<KvkCenterInfo[]>(FALLBACK_KVK_CENTERS as unknown as KvkCenterInfo[]);
  const [kvkStates, setKvkStates] = useState<string[]>(["Punjab","Maharashtra","Uttar Pradesh","Tamil Nadu","Rajasthan","Assam","Kerala","Himachal Pradesh"]);
  const [kvkSearchQuery, setKvkSearchQuery] = useState("");
  const [selectedKvkState, setSelectedKvkState] = useState("ALL");
  const [kvkLoading, setKvkLoading] = useState(false);

  // Modal for Reading Full Bulletin
  const [activeBulletin, setActiveBulletin] = useState<AgriNewsItem | null>(null);

  // Load Stats on mount — update from API if available, keep fallback if not
  useEffect(() => {
    fetchAgriNewsStats()
      .then((data) => setStats(data))
      .catch(() => {/* keep fallback stats already set */});
  }, []);

  // Load News Items when filters, subTab, or retry change
  useEffect(() => {
    if (subTab === "DIRECTORY") return;

    setLoading(true);
    setIsError(false);
    const source = subTab === "ALL" ? undefined : subTab;
    const category = selectedCategory === "ALL" ? undefined : selectedCategory;
    const state = selectedState === "ALL" ? undefined : selectedState;
    const search = searchQuery.trim() || undefined;

    fetchAgriNewsList({ source, category, state, search, dateFilter })
      .then((res) => {
        if (!res || !res.items || res.items.length === 0) {
          let filtered = FALLBACK_NEWS as unknown as AgriNewsItem[];
          if (dateFilter === "TODAY") {
            const now = new Date();
            const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
            const todayFallback = filtered.filter((n) => new Date(n.publishedAt).getTime() >= startOfToday);
            if (todayFallback.length > 0) {
              filtered = todayFallback;
            }
          } else if (dateFilter === "7DAYS") {
            const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
            filtered = filtered.filter((n) => new Date(n.publishedAt).getTime() >= cutoff);
          }
          if (source) filtered = filtered.filter((n) => n.source === source);
          if (category) filtered = filtered.filter((n) => n.category === category);
          if (state && state !== "ALL") filtered = filtered.filter((n) => !n.state || n.state.toLowerCase().includes(state.toLowerCase()) || n.state === "All India");
          if (search) filtered = filtered.filter((n) =>
            n.title.toLowerCase().includes(search.toLowerCase()) ||
            n.summary?.toLowerCase().includes(search.toLowerCase())
          );
          setNewsItems(filtered);
          setIsLive(false);
        } else {
          setNewsItems(res.items);
          setIsLive(Boolean(res.isLive));
          if (res.fetchedAt) {
            setFetchedAt(res.fetchedAt);
          }
        }
        setLoading(false);
      })
      .catch((err) => {
        // API error — display error banner and fall back to local offline data
        console.error("Agri news API request failed:", err);
        setIsError(true);
        setIsLive(false);
        let filtered = FALLBACK_NEWS as unknown as AgriNewsItem[];
        if (dateFilter === "TODAY") {
          const now = new Date();
          const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
          const todayFallback = filtered.filter((n) => new Date(n.publishedAt).getTime() >= startOfToday);
          if (todayFallback.length > 0) {
            filtered = todayFallback;
          }
        } else if (dateFilter === "7DAYS") {
          const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
          filtered = filtered.filter((n) => new Date(n.publishedAt).getTime() >= cutoff);
        }
        if (source) filtered = filtered.filter((n) => n.source === source);
        if (category) filtered = filtered.filter((n) => n.category === category);
        if (state && state !== "ALL") filtered = filtered.filter((n) => !n.state || n.state.toLowerCase().includes(state.toLowerCase()) || n.state === "All India");
        if (search) filtered = filtered.filter((n) =>
          n.title.toLowerCase().includes(search.toLowerCase()) ||
          n.summary?.toLowerCase().includes(search.toLowerCase())
        );
        setNewsItems(filtered);
        setLoading(false);
      });
  }, [subTab, dateFilter, selectedCategory, selectedState, searchQuery, reloadCounter]);

  // Load KVK Directory — update from API if available, keep fallback if not
  useEffect(() => {
    if (subTab !== "DIRECTORY" && kvkCenters.length > 0) return;

    setKvkLoading(true);
    const state = selectedKvkState === "ALL" ? undefined : selectedKvkState;
    const search = kvkSearchQuery.trim() || undefined;

    fetchKvkDirectory({ state, search })
      .then((res) => {
        setKvkCenters(res.centers);
        setKvkStates(res.states);
        setKvkLoading(false);
      })
      .catch(() => {
        // API unavailable — filter fallback KVK centers locally
        let filtered = FALLBACK_KVK_CENTERS as unknown as KvkCenterInfo[];
        if (state) filtered = filtered.filter((c) => c.state === state);
        if (search) filtered = filtered.filter((c) =>
          c.kvkName?.toLowerCase().includes(search.toLowerCase()) ||
          c.district?.toLowerCase().includes(search.toLowerCase())
        );
        setKvkCenters(filtered);
        setKvkLoading(false);
      });
  }, [subTab, selectedKvkState, kvkSearchQuery]);

  const availableNewsStates = useMemo(() => {
    return [
      "All India",
      "Punjab",
      "Maharashtra",
      "Uttar Pradesh",
      "Tamil Nadu",
      "Rajasthan",
      "Assam",
      "Kerala",
      "Himachal Pradesh",
    ];
  }, []);

  // Format date helper
  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    } catch {
      return dateStr;
    }
  };

  // Handle Play/Pause Audio
  const handlePlayAudio = async (item: AgriNewsItem) => {
    const track: AudioTrack = {
      id: item.id,
      title: item.title,
      description: item.summary,
      audioUrl: item.audioUrl || "",
      duration: item.audioDurationSec || 180,
      durationSec: item.audioDurationSec || 180,
      category: item.source === "MINISTRY" ? "Ministry Announcement" : "KVK Advisory",
      language: item.language || "Hindi",
      narrator: item.narrator || (item.source === "MINISTRY" ? "MoA&FW Official Radio" : "ICAR-KVK Scientist"),
      transcript: item.fullBody,
      isBookmarked: false,
    };

    if (currentTrack?.id === item.id) {
      await togglePlayPause();
    } else {
      await playTrack(track);
    }
  };

  return (
    <div className="space-y-6">
      {/* Official Government & Scientific Agency Banner */}
      <div className="bg-gradient-to-br from-emerald-900 via-teal-950 to-slate-950 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-400 text-slate-950">
              <Landmark className="w-3.5 h-3.5" />
              MoA&FW Govt. of India
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-400 text-slate-950">
              <Microscope className="w-3.5 h-3.5" />
              ICAR - Krishi Vigyan Kendras (KVKs)
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/10 text-emerald-200 backdrop-blur-md">
              <Radio className="w-3 h-3 animate-pulse text-emerald-400" />
              Live Official Feeds
            </span>
            {fetchedAt && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-500/30">
                <Clock className="w-3 h-3 text-emerald-400" />
                fetched {formatFetchedAgo(fetchedAt)}
              </span>
            )}
          </div>

          <div className="space-y-1">
            <h2 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight">
              {t("agriNewsBannerTitle", "Agriculture News & Krishi Vigyan Kendra Bulletins")}
            </h2>
            <p className="text-xs sm:text-sm text-emerald-200/90 max-w-3xl leading-relaxed">
              {t(
                "agriNewsBannerDesc",
                "Direct policy communiqués, Minimum Support Price (MSP) revisions, PM-KISAN & PMFBY guidelines from the Ministry of Agriculture & Farmers Welfare, integrated with actionable field advisories and pest management protocols from 731+ Krishi Vigyan Kendras (ICAR) across Indian districts."
              )}
            </p>
          </div>

          {/* Quick Stats Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
              <div className="text-xs text-emerald-300 font-medium">{t("nationalKvks", "National KVKs")}</div>
              <div className="text-lg sm:text-xl font-black text-white">
                {stats?.totalNationalKvksOperational || 731} Centers
              </div>
              <div className="text-[10px] text-emerald-300/70">All Indian districts</div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
              <div className="text-xs text-amber-300 font-medium">{t("ministryBulletins", "Ministry Bulletins")}</div>
              <div className="text-lg sm:text-xl font-black text-white">
                {stats?.ministryBulletins || 4} Published
              </div>
              <div className="text-[10px] text-amber-300/70">MoA&FW & Cabinet</div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
              <div className="text-xs text-sky-300 font-medium">{t("kvkAdvisories", "KVK Research Advisories")}</div>
              <div className="text-lg sm:text-xl font-black text-white">
                {stats?.kvkAdvisories || 6} Active
              </div>
              <div className="text-[10px] text-sky-300/70">ICAR field trials</div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
              <div className="text-xs text-purple-300 font-medium">KishanVaani Audio</div>
              <div className="text-lg sm:text-xl font-black text-white">Bilingual</div>
              <div className="text-[10px] text-purple-300/70">Hindi & English voice</div>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Tab Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setSubTab("ALL")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              subTab === "ALL"
                ? "bg-emerald-800 text-white shadow-sm"
                : "bg-gray-50 text-gray-700 hover:bg-gray-100"
            }`}
          >
            <Newspaper className="w-3.5 h-3.5" />
            {t("allAgriNews", "All Agri News")}
          </button>

          <button
            type="button"
            onClick={() => setSubTab("MINISTRY")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              subTab === "MINISTRY"
                ? "bg-amber-600 text-white shadow-sm"
                : "bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200/60"
            }`}
          >
            <Landmark className="w-3.5 h-3.5" />
            {t("ministryTab", "🏛️ Ministry of Agriculture (MoA&FW)")}
          </button>

          <button
            type="button"
            onClick={() => setSubTab("KVK")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              subTab === "KVK"
                ? "bg-emerald-700 text-white shadow-sm"
                : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/60"
            }`}
          >
            <Microscope className="w-3.5 h-3.5" />
            {t("kvkTab", "🔬 Krishi Vigyan Kendra (KVK / ICAR)")}
          </button>

          <button
            type="button"
            onClick={() => setSubTab("DIRECTORY")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              subTab === "DIRECTORY"
                ? "bg-indigo-700 text-white shadow-sm"
                : "bg-indigo-50 text-indigo-800 hover:bg-indigo-100 border border-indigo-200/60"
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            {t("directoryTab", "🏢 KVK Center Directory")}
          </button>
        </div>

        <div className="flex items-center gap-3 text-xs text-gray-500 font-medium">
          <div className="flex items-center gap-1">
            <span>MoA&FW:</span>
            <a
              href="https://agricoop.gov.in"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-700 hover:underline font-bold inline-flex items-center gap-0.5"
            >
              agricoop.gov.in
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <span className="text-gray-300">|</span>
          <div className="flex items-center gap-1">
            <span>ICAR KVK:</span>
            <a
              href="https://kvk.icar.gov.in"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-700 hover:underline font-bold inline-flex items-center gap-0.5"
            >
              kvk.icar.gov.in
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      {/* VIEW 1: NEWS BULLETINS (ALL, MINISTRY, KVK) */}
      {subTab !== "DIRECTORY" && (
        <div className="space-y-5">
          {/* Error Banner when request fails */}
          {isError && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-red-900 shadow-sm animate-in fade-in">
              <div className="flex items-center gap-2 text-xs">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span className="font-semibold">Unable to fetch latest updates from the server. Showing offline news.</span>
              </div>
              <button
                type="button"
                onClick={() => setReloadCounter((prev) => prev + 1)}
                className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
              >
                Retry
              </button>
            </div>
          )}

          {/* Sample news banner only when falling back to static data */}
          {!isLive && (
            <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-amber-900 shadow-sm">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs space-y-0.5">
                <span className="font-bold text-amber-950 block">Sample news (Archived fallback)</span>
                <p className="text-amber-800">
                  Showing curated reference advisories and archived agricultural bulletins. Newly published releases will appear here automatically as soon as PIB updates.
                </p>
              </div>
            </div>
          )}

          {/* Filtering Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            {/* Search Input */}
            <div className="flex items-center gap-2 flex-1 min-w-[220px] max-w-md bg-gray-50 px-3 py-2 rounded-xl border border-gray-200/80">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="search"
                placeholder="Search bulletins, crops (Paddy, Cotton), schemes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs sm:text-sm bg-transparent border-none outline-none text-gray-800 placeholder-gray-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Controls */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Quick Toggle: Today Only News */}
              <button
                type="button"
                onClick={() => setDateFilter((prev) => (prev === "TODAY" ? "ALL" : "TODAY"))}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
                  dateFilter === "TODAY"
                    ? "bg-amber-500 hover:bg-amber-600 text-white ring-2 ring-amber-300 animate-pulse"
                    : "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200"
                }`}
                title="Filter to today's news releases only"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>📅 Today Only News</span>
                {dateFilter === "TODAY" && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-white text-amber-700 font-black">
                    ON
                  </span>
                )}
              </button>

              {/* Date Filter Dropdown */}
              <div className="flex items-center gap-1.5">
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value as "ALL" | "TODAY" | "7DAYS")}
                  className="text-xs font-semibold px-2.5 py-1.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-700 outline-none hover:bg-gray-100 transition-colors"
                >
                  <option value="ALL">All Dates (Default)</option>
                  <option value="TODAY">📅 Today Only</option>
                  <option value="7DAYS">Past 7 Days</option>
                </select>
              </div>

              {/* Category Dropdown */}
              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-gray-400" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="text-xs font-semibold px-2.5 py-1.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-700 outline-none hover:bg-gray-100"
                >
                  <option value="ALL">All Categories</option>
                  <option value="SUBSIDY_MSP">MSP & Subsidies</option>
                  <option value="SCHEMES">Govt Schemes & Direct Benefit</option>
                  <option value="PEST_ALERT">Pest & Disease Alerts</option>
                  <option value="CROP_SCIENCE">Crop Science & Agronomy</option>
                  <option value="ORGANIC_NATURAL">Organic & Soil Health</option>
                  <option value="TECHNOLOGY">AgriTech & Farm Machinery</option>
                </select>
              </div>

              {/* State Dropdown */}
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                <select
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value)}
                  className="text-xs font-semibold px-2.5 py-1.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-700 outline-none hover:bg-gray-100"
                >
                  <option value="ALL">All States / National</option>
                  {availableNewsStates.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Loading Indicator */}
          {loading ? (
            <div className="py-16 text-center text-gray-500 space-y-2">
              <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-semibold">Loading official bulletins & KVK advisories...</p>
            </div>
          ) : newsItems.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center border border-gray-100 space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <Newspaper className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-gray-800">No official bulletins found</h3>
              <p className="text-xs text-gray-500 max-w-md mx-auto">
                No articles matched your current filters. Try resetting the state or category filter to view all national releases.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory("ALL");
                  setSelectedState("ALL");
                  setSearchQuery("");
                }}
                className="text-xs font-bold px-4 py-2 bg-emerald-700 text-white rounded-xl hover:bg-emerald-800"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            /* News Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {newsItems.map((item) => {
                const isThisPlaying = currentTrack?.id === item.id && isPlaying;
                const catMeta = CATEGORY_MAP[item.category] || {
                  label: item.categoryLabel || item.category,
                  bg: "bg-gray-50",
                  text: "text-gray-700",
                };

                return (
                  <article
                    key={item.id}
                    className={`bg-white rounded-3xl p-5 border transition-all flex flex-col justify-between group shadow-sm hover:shadow-md ${
                      item.isUrgent
                        ? "border-red-200 hover:border-red-400 bg-red-50/10"
                        : "border-gray-100 hover:border-emerald-200"
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Top Badges */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {item.source === "MINISTRY" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-900 border border-amber-200">
                              <Landmark className="w-3 h-3 text-amber-700" />
                              MoA&FW Official
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-200">
                              <Microscope className="w-3 h-3 text-emerald-700" />
                              ICAR-KVK Advisory
                            </span>
                          )}

                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${catMeta.bg} ${catMeta.text}`}
                          >
                            {catMeta.label}
                          </span>

                          {item.isSample && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              Sample / Archived
                            </span>
                          )}

                          {item.isUrgent && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-red-100 text-red-700 border border-red-200 animate-pulse">
                              <AlertTriangle className="w-2.5 h-2.5" />
                              URGENT ALERT
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1 text-[11px] font-medium">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          {new Date(item.publishedAt).toDateString() === new Date().toDateString() ? (
                            <span className="px-2 py-0.5 rounded-full font-extrabold text-[10px] bg-emerald-100 text-emerald-900 border border-emerald-300">
                              Today ({formatDate(item.publishedAt)})
                            </span>
                          ) : (
                            <span className="text-gray-400">{formatDate(item.publishedAt)}</span>
                          )}
                        </div>
                      </div>

                      {/* Title */}
                      <h3 className="text-base font-bold text-gray-900 leading-snug group-hover:text-emerald-800 transition-colors">
                        {translateContent(item.title)}
                      </h3>

                      {/* Summary */}
                      <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">
                        {translateContent(item.summary)}
                      </p>

                      {/* Key Takeaways preview pill */}
                      {item.keyTakeaways && item.keyTakeaways.length > 0 && (
                        <div className="bg-gray-50 rounded-2xl p-3 border border-gray-100 text-[11px] space-y-1">
                          <div className="flex items-center gap-1 font-bold text-gray-700 text-[10px] uppercase tracking-wider">
                            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                            <span>{t("keyHighlights", "Key Takeaway")}:</span>
                          </div>
                          <p className="text-gray-600 italic">
                            "{translateContent(item.keyTakeaways[0])}"
                          </p>
                        </div>
                      )}

                      {/* Authority Line */}
                      <div className="flex flex-wrap items-center justify-between text-[11px] text-gray-500 pt-1">
                        <span className="font-semibold text-gray-700 flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-gray-400" />
                          {item.sourceName}
                        </span>
                        {item.state && (
                          <span className="font-medium text-emerald-800 flex items-center gap-0.5">
                            <MapPin className="w-3 h-3 text-emerald-600" />
                            {translateContent(item.state)}
                          </span>
                        )}
                      </div>

                      {/* Tags */}
                      {item.tags && item.tags.length > 0 && (
                        <div className="flex items-center gap-1 pt-1 flex-wrap">
                          {item.tags.slice(0, 4).map((tag) => (
                            <span
                              key={tag}
                              className="px-1.5 py-0.5 rounded-md bg-gray-50 border border-gray-200 text-[10px] text-gray-600 font-medium"
                            >
                              #{translateContent(tag)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-4 mt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                      {/* Audio Briefing Button */}
                      <button
                        type="button"
                        onClick={() => handlePlayAudio(item)}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all ${
                          isThisPlaying
                            ? "bg-amber-500 text-white shadow-md shadow-amber-200"
                            : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                        }`}
                        title="Listen to official audio briefing in KishanVaani player"
                      >
                        {isThisPlaying ? (
                          <>
                            <Pause className="w-3.5 h-3.5" />
                            <span>{t("playingAudio", "Playing Audio")}</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5 fill-emerald-800" />
                            <span>{t("listenAudio", "Listen")} ({Math.round((item.audioDurationSec || 180) / 60)} min)</span>
                          </>
                        )}
                      </button>

                      {/* Read on PIB & Details Buttons */}
                      <div className="flex items-center gap-2">
                        {(item.link || item.officialReferenceUrl) && (
                          <a
                            href={item.link || item.officialReferenceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 transition-colors"
                            title="Read release on official Press Information Bureau (PIB) portal"
                          >
                            <span>Read on PIB</span>
                            <ExternalLink className="w-3.5 h-3.5 text-amber-700" />
                          </a>
                        )}

                        <button
                          type="button"
                          onClick={() => setActiveBulletin(item)}
                          className="flex items-center gap-1 text-xs font-bold text-emerald-800 hover:text-emerald-950 px-3 py-2 rounded-xl bg-gray-50 hover:bg-emerald-50 transition-colors"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          {t("readFullBulletin", "Read Full Bulletin")}
                        </button>
                      </div>

                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: KVK CENTER DIRECTORY */}
      {subTab === "DIRECTORY" && (
        <div className="space-y-5">
          {/* Directory Search & State Filter */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 flex-1 min-w-[220px] max-w-md bg-gray-50 px-3 py-2 rounded-xl border border-gray-200/80">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="search"
                placeholder="Search KVKs by district, university, or crop..."
                value={kvkSearchQuery}
                onChange={(e) => setKvkSearchQuery(e.target.value)}
                className="w-full text-xs sm:text-sm bg-transparent border-none outline-none text-gray-800 placeholder-gray-400"
              />
              {kvkSearchQuery && (
                <button
                  type="button"
                  onClick={() => setKvkSearchQuery("")}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-gray-400" />
              <select
                value={selectedKvkState}
                onChange={(e) => setSelectedKvkState(e.target.value)}
                className="text-xs font-semibold px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-700 outline-none hover:bg-gray-100"
              >
                <option value="ALL">All States</option>
                {kvkStates.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Directory Info Box */}
          <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-4 text-xs text-indigo-950 flex items-start gap-3">
            <Building2 className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Indian Council of Agricultural Research (ICAR) National KVK Network</p>
              <p className="text-indigo-800 text-[11px] mt-0.5">
                Krishi Vigyan Kendras (KVKs) are frontline agricultural extension centers established across all 731+ rural districts of India. Contact your local KVK coordinator for certified seeds, soil health testing, precision machinery demonstrations, and farmer training camps.
              </p>
            </div>
          </div>

          {/* Directory Grid */}
          {kvkLoading ? (
            <div className="py-16 text-center text-gray-500 space-y-2">
              <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-semibold">Loading KVK center directory...</p>
            </div>
          ) : kvkCenters.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center border border-gray-100">
              <p className="text-xs text-gray-500">No KVK centers match your search query.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {kvkCenters.map((kvk) => (
                <div
                  key={kvk.id}
                  className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 mb-1">
                        {kvk.district}, {kvk.state} (Est. {kvk.establishedYear})
                      </span>
                      <h4 className="text-sm font-bold text-gray-900">{kvk.kvkName}</h4>
                      <p className="text-[11px] text-gray-500 font-medium">
                        Host University: {kvk.hostUniversity}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-gray-600 border-t border-b border-gray-50 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-gray-400">{t("coordinator", "Head/Coordinator")}:</span>
                      <span className="font-bold text-gray-800">{kvk.programCoordinator}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <a
                        href={`tel:${kvk.contactNumber}`}
                        className="text-emerald-700 font-bold hover:underline"
                      >
                        {kvk.contactNumber}
                      </a>
                    </div>

                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                      <a
                        href={`mailto:${kvk.email}`}
                        className="text-sky-700 hover:underline font-mono text-[11px]"
                      >
                        {kvk.email}
                      </a>
                    </div>

                    <div className="flex items-start gap-2 pt-1 text-[11px] text-gray-500">
                      <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                      <span>{kvk.address}</span>
                    </div>
                  </div>

                  {/* Specialty Crops & Key Demonstrations */}
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold text-gray-400">{t("cropFocus", "Crop Focus")}:</span>
                      {kvk.specialtyCrops.map((c) => (
                        <span
                          key={c}
                          className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 font-semibold text-[10px]"
                        >
                          {translateContent(c)}
                        </span>
                      ))}
                    </div>

                    {kvk.keyDemonstrations && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-bold text-gray-400">{t("demonstrations", "Demonstrations")}:</span>
                        {kvk.keyDemonstrations.map((f) => (
                          <span
                            key={f}
                            className="px-2 py-0.5 rounded-lg bg-gray-50 text-gray-600 text-[10px] font-medium"
                          >
                            {translateContent(f)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL: FULL BULLETIN DETAIL READER */}
      {activeBulletin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div
            className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-5 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setActiveBulletin(null)}
              className="absolute top-5 right-5 p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Header */}
            <div className="space-y-2 pr-8">
              <div className="flex items-center gap-2 flex-wrap">
                {activeBulletin.source === "MINISTRY" ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-200">
                    <Landmark className="w-3.5 h-3.5" />
                    MoA&FW Govt. of India Release
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-900 border border-emerald-200">
                    <Microscope className="w-3.5 h-3.5" />
                    ICAR-Krishi Vigyan Kendra Advisory
                  </span>
                )}
                {activeBulletin.categoryLabel && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-800">
                    {activeBulletin.categoryLabel}
                  </span>
                )}
                {activeBulletin.isSample && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    Sample / Archived
                  </span>
                )}
              </div>

              <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 leading-snug">
                {translateContent(activeBulletin.title)}
              </h2>

              <div className="flex items-center gap-3 text-xs text-gray-500 pt-1">
                <span>{activeBulletin.sourceName}</span>
                <span>•</span>
                <span>{formatDate(activeBulletin.publishedAt)}</span>
                {activeBulletin.state && (
                  <>
                    <span>•</span>
                    <span className="font-bold text-gray-700">{translateContent(activeBulletin.state)}</span>
                  </>
                )}
              </div>
            </div>

            {/* Audio Action Inside Modal */}
            <div className="bg-emerald-50/80 border border-emerald-100 rounded-2xl p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-700 text-white flex items-center justify-center shrink-0">
                  <Volume2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-emerald-950">{t("dailyAudioBulletin", "Official KishanVaani Audio Briefing")}</div>
                  <div className="text-[11px] text-emerald-700">
                    Voice: {activeBulletin.narrator} ({Math.round((activeBulletin.audioDurationSec || 180) / 60)} min • {activeBulletin.language})
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handlePlayAudio(activeBulletin)}
                className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm"
              >
                {currentTrack?.id === activeBulletin.id && isPlaying ? (
                  <>
                    <Pause className="w-3.5 h-3.5" />
                    <span>{t("pauseBulletin", "Pause")}</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>{t("listenAudio", "Play Audio")}</span>
                  </>
                )}
              </button>
            </div>

            {/* Full Bulletin Body */}
            <div className="space-y-4 text-xs sm:text-sm text-gray-700 leading-relaxed">
              <h4 className="font-bold text-gray-900 text-sm border-b border-gray-100 pb-1">
                {t("officialCommunique", "Official Communiqué & Detailed Advisory")}
              </h4>
              <p className="whitespace-pre-line">{translateContent(activeBulletin.fullBody)}</p>
            </div>

            {/* Key Takeaways */}
            {activeBulletin.keyTakeaways && activeBulletin.keyTakeaways.length > 0 && (
              <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-4 space-y-2">
                <div className="font-bold text-emerald-950 text-xs flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                  {t("keyHighlights", "Key Policy & Scientific Highlights")}
                </div>
                <ul className="space-y-1.5 text-xs text-emerald-900">
                  {activeBulletin.keyTakeaways.map((point, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-emerald-600 font-bold">•</span>
                      <span>{translateContent(point)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Actionable Advice Checklist */}
            {activeBulletin.actionItemsForFarmers && activeBulletin.actionItemsForFarmers.length > 0 && (
              <div className="bg-amber-50/70 border border-amber-200/70 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-black text-amber-950 uppercase tracking-wide">
                  <CheckCircle2 className="w-4 h-4 text-amber-600" />
                  <span>{t("farmerInstructions", "Actionable Instructions for Farmers")}</span>
                </div>
                <ul className="space-y-2">
                  {activeBulletin.actionItemsForFarmers.map((pt, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-amber-900 leading-normal">
                      <span className="w-4 h-4 rounded-full bg-amber-200 text-amber-950 font-bold flex items-center justify-center shrink-0 text-[10px] mt-0.5">
                        {i + 1}
                      </span>
                      <span>{translateContent(pt)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* KVK Host University / Contact Details */}
            {activeBulletin.kvkDetails && (
              <div className="bg-gray-50 rounded-2xl p-4 text-xs space-y-2 border border-gray-100">
                <h5 className="font-bold text-gray-800 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-gray-500" />
                  {t("hostUniversity", "KVK Extension Center & University Details")}
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-gray-600">
                  <div>
                    <span className="font-semibold text-gray-700">Center:</span> {activeBulletin.kvkDetails.kvkName}
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">{t("hostUniversity", "Host")}:</span> {activeBulletin.kvkDetails.hostUniversity}
                  </div>
                  {activeBulletin.kvkDetails.district && (
                    <div>
                      <span className="font-semibold text-gray-700">District:</span> {activeBulletin.kvkDetails.district}, {activeBulletin.kvkDetails.state}
                    </div>
                  )}
                  {activeBulletin.kvkDetails.pinCode && (
                    <div>
                      <span className="font-semibold text-gray-700">PIN:</span> {activeBulletin.kvkDetails.pinCode}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Modal Footer */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-gray-100">
              {(activeBulletin.link || activeBulletin.officialReferenceUrl) ? (
                <a
                  href={activeBulletin.link || activeBulletin.officialReferenceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-amber-900 hover:text-amber-950 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200"
                >
                  <span>Read on PIB</span>
                  <ExternalLink className="w-3.5 h-3.5 text-amber-700" />
                </a>
              ) : <div />}


              <button
                type="button"
                onClick={() => setActiveBulletin(null)}
                className="px-5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold"
              >
                {t("close", "Close")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
