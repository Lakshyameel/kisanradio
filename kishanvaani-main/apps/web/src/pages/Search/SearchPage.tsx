import { useState, useEffect } from "react";
import api from "../../lib/api";
import { useLanguage } from "../../context/LanguageContext";
import { useAudioPlayer, AudioTrack } from "../../context/AudioPlayerContext";
import {
  Search as SearchIcon,
  Play,
  TrendingUp,
  HelpCircle,
  Volume2,
  Filter,
  X,
  AlertTriangle,
  Newspaper,
  ExternalLink,
  Loader2,
} from "lucide-react";
import VoiceSearchButton from "../../components/search/VoiceSearchButton";
import TapToHearButton from "../../components/common/TapToHearButton";

export default function SearchPage() {
  const { t, translateContent } = useLanguage();
  const { playTrack } = useAudioPlayer();

  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedLanguage, setSelectedLanguage] = useState("ALL");
  const [results, setResults] = useState<{
    content: any[];
    stories: any[];
    expertQAs: any[];
    mandiMatches: any[];
    news: any[];
    total: number;
  }>({
    content: [],
    stories: [],
    expertQAs: [],
    mandiMatches: [],
    news: [],
    total: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get("/search", {
          params: {
            q: query.trim() || undefined,
            category: selectedCategory === "ALL" ? undefined : selectedCategory,
            language: selectedLanguage === "ALL" ? undefined : selectedLanguage,
          },
          signal: controller.signal,
        });
        setResults({
          ...res.data,
          news: res.data.news || [],
        });
      } catch (err: any) {
        if (err.code === "ERR_CANCELED" || err.name === "CanceledError") {
          return;
        }
        console.error("Search failed:", err);
        setError(
          err.response?.status === 429
            ? "Too many searches, please wait a moment."
            : err.response
            ? "Search failed on the server."
            : "Cannot reach the server. Is the backend running on port 4000?"
        );
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, selectedCategory, selectedLanguage]);

  const handlePlay = async (item: any) => {
    const track: AudioTrack = {
      id: item.id,
      title: item.title,
      description: item.description,
      audioUrl: item.audioUrl || "",
      category: item.category,
      narrator: item.narrator || item.authorName,
      duration: item.durationSec || 180,
    };
    await playTrack(track);
  };

  const quickSearches = [
    "Wheat Yellow Rust",
    "PM-KISAN e-KYC",
    "Cotton Pink Bollworm",
    "Dairy Milk Yield",
    "Solar Pump Subsidy",
    "Drip Irrigation",
    "Mustard Mandi Price",
    "Onion Storage",
  ];

  return (
    <div className="space-y-8 pb-16">
      {/* Header & Big Search Input */}
      <div className="bg-emerald-900 text-white p-6 sm:p-10 rounded-3xl shadow-sm space-y-6">
        <div className="space-y-2">
          <span className="text-emerald-300 text-xs font-bold uppercase tracking-wider">
            {t("searchPageTag", "Universal Agricultural Voice & Search")}
          </span>
          <h1 className="text-2xl sm:text-4xl font-extrabold">{t("searchPageHeading", "Search KishanVaani")}</h1>
        </div>

        <div className="relative max-w-2xl">
          <div className="flex items-center gap-2">
            <div className="relative flex-1 flex items-center">
              <SearchIcon className="absolute left-4 w-5 h-5 text-gray-400" />
              <input
                type="search"
                placeholder={t("searchKishanvaaniInput", "Search across crop advice, mandi rates, schemes, literature...")}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-12 pr-12 py-4 rounded-2xl bg-white text-gray-900 text-sm sm:text-base font-medium shadow-lg outline-none focus:ring-4 focus:ring-emerald-400/30"
                autoFocus
              />
              <div className="absolute right-4 flex items-center gap-1.5">
                {loading && <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />}
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
            <VoiceSearchButton onSearch={(spokenText) => setQuery(spokenText)} />
          </div>
        </div>

        {/* Popular Tags */}
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <span className="text-xs text-emerald-200 font-semibold">{t("popularSearches", "Popular Searches:")}</span>
          {quickSearches.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setQuery(tag)}
              className="px-3 py-1 rounded-full bg-emerald-800/80 hover:bg-emerald-700 text-emerald-100 text-xs font-medium border border-emerald-600/40 transition-colors"
            >
              {translateContent(tag)}
            </button>
          ))}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-gray-700 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-emerald-700" /> {t("problemTypeLabel", "Category:")}:
          </span>
          {[
            { id: "ALL", label: t("allResultsTab", "All") },
            { id: "Agriculture", label: t("agriculture", "Agriculture") },
            { id: "Community", label: t("community", "Community") },
            { id: "Literature", label: t("literature", "Literature") },
            { id: "Schemes", label: t("schemes", "Schemes") },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedCategory === cat.id
                  ? "bg-emerald-800 text-white shadow-sm"
                  : "bg-gray-50 text-gray-700 hover:bg-gray-100"
              }`}
            >
              {cat.label}
            </button>
          ))}
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
            <option value="Tamil">Tamil (தமிழ்)</option>
          </select>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div
          role="alert"
          className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 flex items-center justify-between gap-3 text-sm font-medium shadow-sm"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-xs font-semibold text-red-700 hover:text-red-900 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* SEARCH RESULTS */}
      <div className="space-y-8">
        {/* Mandi Price Matches (If any) */}
        {results.mandiMatches.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-700" /> {t("mandiPrices", "Mandi Price Matches")}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {results.mandiMatches.map((m) => (
                <div key={m.id} className="p-3.5 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">{translateContent(m.commodity)}</h4>
                    <p className="text-[11px] text-gray-500">
                      {m.market} ({m.state}) {m.sourceLabel ? `• ${m.sourceLabel}` : m.source === "SAMPLE" ? "• Sample data" : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-right">
                    <div>
                      <span className="text-base font-extrabold text-emerald-900">
                        {m.modalPrice != null ? `₹${m.modalPrice.toLocaleString("en-IN")}` : "—"}
                      </span>
                    </div>
                    <TapToHearButton
                      size="sm"
                      iconOnly
                      text={`${translateContent(m.commodity)}, ${m.market} मंडी, ${m.state}. भाव: ${m.modalPrice != null ? `₹${m.modalPrice}` : "उपलब्ध नहीं"}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Audio Content Matches */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-emerald-700" /> {t("audioDiscoveryTitle", "Audio Tracks")} ({results.content.length})
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.content.map((item) => (
              <div
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

                  <h4 className="font-bold text-gray-900 text-sm sm:text-base leading-snug line-clamp-2 group-hover:text-emerald-800">
                    {translateContent(item.title)}
                  </h4>

                  <p className="text-xs text-gray-600 mt-2 line-clamp-2 leading-relaxed">
                    {translateContent(item.description)}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handlePlay(item)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold"
                    >
                      <Play className="w-3.5 h-3.5 fill-current ml-0.5" /> {t("listenAudio", "Play Audio")}
                    </button>
                    <TapToHearButton
                      size="sm"
                      text={`${translateContent(item.title)}. ${translateContent(item.description)}`}
                    />
                  </div>

                  <span className="text-xs text-gray-400">
                    {Math.floor(item.durationSec / 60)} {t("minAudio", "min")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Agricultural News Matches (If any) */}
        {results.news && results.news.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Newspaper className="w-4 h-4 text-emerald-700" /> {t("newsArticles", "Agricultural News & Advisories")} ({results.news.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {results.news.map((item: any) => (
                <div
                  key={item.id}
                  className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded text-[10px]">
                        {item.category?.replace(/_/g, " ") || "NEWS"}
                      </span>
                      <span className="text-gray-400 font-normal text-[11px]">{item.source}</span>
                    </div>
                    <h4 className="font-bold text-gray-900 text-sm sm:text-base leading-snug">
                      {translateContent(item.title)}
                    </h4>
                    <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed">
                      {translateContent(item.summary || item.body || "")}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-[11px] text-gray-400">
                      {item.publishedAt ? new Date(item.publishedAt).toLocaleDateString() : ""}
                    </span>
                    <div className="flex items-center gap-2">
                      <TapToHearButton
                        size="sm"
                        text={`${translateContent(item.title)}. ${translateContent(item.summary || "")}`}
                      />
                      {item.sourceUrl && (
                        <a
                          href={item.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs font-semibold text-emerald-800 hover:text-emerald-900"
                        >
                          Source <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Expert Q&A Matches */}
        {results.expertQAs.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-emerald-700" /> {t("verifiedExpertReply", "Expert Agronomist Answers")}
            </h3>
            <div className="space-y-3">
              {results.expertQAs.map((qa) => (
                <div key={qa.id} className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm space-y-2">
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                    {qa.crop}
                  </span>
                  <h4 className="font-bold text-gray-900 text-sm">{translateContent(qa.question)}</h4>
                  <p className="text-xs text-gray-700 leading-relaxed bg-emerald-50/50 p-3 rounded-xl">
                    {translateContent(qa.answer)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!error && !loading && results.total === 0 && (
          <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 p-8 space-y-2">
            <SearchIcon className="w-10 h-10 text-gray-300 mx-auto" />
            <h4 className="font-bold text-gray-800 text-base">{t("noSearchResults", "No results found")}</h4>
            <p className="text-xs text-gray-500">
              {t("noSearchResultsDesc", "Please adjust your search terms or filters and try again.")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
