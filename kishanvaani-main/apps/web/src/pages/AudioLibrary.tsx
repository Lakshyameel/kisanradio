import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAudioPlayer, AudioTrack } from "../context/AudioPlayerContext";
import { useLanguage } from "../context/LanguageContext";
import { fetchContentList, ContentItem } from "../services/content.service";
import {
  Headphones,
  Search,
  Play,
  Pause,
  Filter,
  Globe,
  Sparkles,
  Volume2,
  UploadCloud,
} from "lucide-react";

export default function AudioLibrary() {
  const { currentTrack, isPlaying, playTrack, togglePlayPause } = useAudioPlayer();
  const { t, translateContent } = useLanguage();

  const [tracks, setTracks] = useState<ContentItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedLanguage, setSelectedLanguage] = useState("All");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadAudioLibrary() {
      setIsLoading(true);
      try {
        const res = await fetchContentList({
          limit: 100,
        });
        // Filter out sample / demo audio tracks
        const realTracks = (res.items || []).filter(
          (track) =>
            track.audioUrl &&
            !track.audioUrl.includes("kishanvaani-demo") &&
            !track.audioUrl.includes("demo-") &&
            track.audioUrl.trim() !== ""
        );
        setTracks(realTracks);
      } catch (err) {
        console.error("Audio library load error:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadAudioLibrary();
  }, []);

  const categories = useMemo(() => {
    return ["All", "Agriculture", "Community", "Literature", "Schemes"];
  }, []);

  const languages = useMemo(() => {
    return ["All", "Hindi", "English", "Telugu", "Punjabi", "Marathi"];
  }, []);

  const filteredTracks = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return tracks.filter((track) => {
      const matchesSearch =
        !query ||
        [track.title, track.description, track.category, track.language, track.narrator, track.type]
          .filter(Boolean)
          .some((val) => val!.toLowerCase().includes(query));

      const matchesCategory =
        selectedCategory === "All" || track.category === selectedCategory;

      const matchesLanguage =
        selectedLanguage === "All" || track.language === selectedLanguage;

      return matchesSearch && matchesCategory && matchesLanguage;
    });
  }, [tracks, searchQuery, selectedCategory, selectedLanguage]);

  const handlePlay = async (item: ContentItem) => {
    if (!item.audioUrl || item.audioUrl.includes("kishanvaani-demo")) {
      return;
    }

    const track: AudioTrack = {
      id: item.id,
      title: item.title,
      description: item.description,
      audioUrl: item.audioUrl,
      duration: item.durationSec,
      durationSec: item.durationSec,
      category: item.category,
      language: item.language,
      narrator: item.narrator || item.authorName,
      transcript: item.transcript,
      isBookmarked: item.isBookmarked,
    };

    if (currentTrack?.id === item.id) {
      await togglePlayPause();
      return;
    }

    await playTrack(track);
  };

  return (
    <div className="audio-library-page space-y-8 pb-16">
      {/* Header Banner */}
      <section className="bg-emerald-950 text-white p-6 sm:p-8 rounded-3xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-3">
          <span className="text-emerald-400 text-xs font-bold uppercase tracking-wider">
            {t("audioLibrary", "KishanVaani Audio Collection")}
          </span>

          <h1 className="text-2xl sm:text-4xl font-extrabold flex items-center gap-2">
            <Headphones className="w-8 h-8 text-emerald-400" />
            {t("audioDiscoveryTitle", "Audio Discovery Library")}
          </h1>

          <p className="text-emerald-200 text-xs sm:text-sm max-w-2xl">
            {t("audioDiscoveryDesc", "Listen to daily agriculture bulletins, crop guidance, livestock health, farmer experiences, and regional literature while working in fields or travelling.")}
          </p>
        </div>

        <Link
          to="/upload"
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-gray-950 font-bold text-xs sm:text-sm shadow-md transition-transform active:scale-95 flex-shrink-0"
        >
          <UploadCloud className="w-4 h-4 text-gray-950" />
          {t("uploadAudioStory", "+ Upload Audio / Story")}
        </Link>
      </section>

      {/* Filter Bar */}
      <section className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 ml-2" />
          <input
            type="search"
            placeholder={t("searchAudioPlaceholder", "Search all audio tracks, crops, languages...")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs sm:text-sm bg-transparent border-none outline-none text-gray-800"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-emerald-700" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-xs font-semibold px-2.5 py-1.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-700 outline-none"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c === "All" ? t("allCategories", "All Categories") : t(c.toLowerCase(), c)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-emerald-700" />
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="text-xs font-semibold px-2.5 py-1.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-700 outline-none"
            >
              {languages.map((l) => (
                <option key={l} value={l}>
                  {l === "All" ? t("allLanguages", "All Languages") : l}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Grid */}
      {isLoading ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-3 border-emerald-800 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-gray-500 mt-2">{t("loading", "Loading audio library...")}</p>
        </div>
      ) : filteredTracks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTracks.map((item) => {
            const isCurrentTrack = currentTrack?.id === item.id;
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

                  {item.narrator && (
                    <p className="text-[11px] text-gray-400 mt-3 font-medium flex items-center gap-1">
                      <Volume2 className="w-3 h-3 text-emerald-700" /> {t("by", "By")} {item.narrator}
                    </p>
                  )}
                </div>

                <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => void handlePlay(item)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold transition-transform active:scale-95"
                  >
                    {isCurrentTrack && isPlaying ? (
                      <>
                        <Pause className="w-3.5 h-3.5 fill-current" /> {t("pauseBulletin", "Pause")}
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current ml-0.5" /> {t("listenAudio", "Play Audio")}
                      </>
                    )}
                  </button>

                  <span className="text-xs text-gray-400 tabular-nums">
                    {Math.floor(item.durationSec / 60)}:{(item.durationSec % 60).toString().padStart(2, "0")}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 p-8 space-y-3">
          <Headphones className="w-10 h-10 text-gray-300 mx-auto" />
          <h4 className="font-bold text-gray-800 text-base">{t("noAudioFound", "No audio tracks found")}</h4>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            {t("noAudioLibraryItems", "All sample audio tracks have been removed. Upload real audio bulletins, crop guides, or folk stories to build your library.")}
          </p>
          <div className="pt-2">
            <Link
              to="/upload"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold shadow-sm transition-all active:scale-95"
            >
              <UploadCloud className="w-4 h-4" />
              {t("uploadAudioStory", "+ Upload Audio / Story")}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}