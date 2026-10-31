import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { useAudioPlayer, AudioTrack } from "../../context/AudioPlayerContext";
import {
  fetchContentList,
  uploadUserLiterature,
  ContentItem,
} from "../../services/content.service";
import {
  BookOpen,
  Feather,
  Sparkles,
  Headphones,
  Play,
  Pause,
  FileText,
  Search,
  PlusCircle,
  X,
  CheckCircle2,
  BookMarked,
  UploadCloud,
} from "lucide-react";

type LiteratureTab = "all" | "stories" | "poems" | "folk-tales" | "audio-books";

export default function LiteraturePage() {
  const { "*": tabParam } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, translateContent } = useLanguage();
  const { currentTrack, isPlaying, playTrack, togglePlayPause, setShowTranscript } = useAudioPlayer();

  const activeTab: LiteratureTab = (tabParam as LiteratureTab) || "all";

  const [literatureList, setLiteratureList] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("ALL");

  // Literature Upload Modal State
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadType, setUploadType] = useState<"STORY" | "POEM" | "FOLK_TALE" | "AUDIO_BOOK">("STORY");
  const [title, setTitle] = useState("");
  const [authorName, setAuthorName] = useState(user?.name || "");
  const [language, setLanguage] = useState("Hindi");
  const [durationMinutes, setDurationMinutes] = useState(3);
  const [audioUrl, setAudioUrl] = useState("");
  const [description, setDescription] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    async function loadLiterature() {
      setLoading(true);
      try {
        let typeFilter: string | undefined;
        if (activeTab === "stories") typeFilter = "STORY";
        else if (activeTab === "poems") typeFilter = "POEM";
        else if (activeTab === "folk-tales") typeFilter = "FOLK_TALE";
        else if (activeTab === "audio-books") typeFilter = "AUDIO_BOOK";

        const res = await fetchContentList({
          category: "Literature",
          type: typeFilter,
          language: selectedLanguage === "ALL" ? undefined : selectedLanguage,
          search: searchQuery.trim() || undefined,
          limit: 50,
        });

        setLiteratureList(res.items);
      } catch (err) {
        console.error("Literature fetch error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadLiterature();
  }, [activeTab, selectedLanguage, searchQuery]);

  const handlePlayLit = async (item: ContentItem) => {
    const track: AudioTrack = {
      id: item.id,
      title: item.title,
      description: item.description,
      audioUrl: item.audioUrl || "",
      duration: item.durationSec,
      durationSec: item.durationSec,
      category: item.category,
      language: item.language,
      narrator: item.narrator || item.authorName,
      transcript: item.transcript || item.body,
      isBookmarked: item.isBookmarked,
    };

    if (currentTrack?.id === item.id) {
      togglePlayPause();
    } else {
      await playTrack(track);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate("/login");
      return;
    }

    try {
      setSubmitting(true);
      const res = await uploadUserLiterature({
        title,
        type: uploadType,
        language,
        durationSec: durationMinutes * 60,
        audioUrl,
        description,
        body: bodyText,
        authorName: authorName || user.name,
      });

      setLiteratureList([res.content, ...literatureList]);
      setSuccessMsg(t("uploadSuccessTitle", "Literature published successfully!"));
      setTimeout(() => {
        setSuccessMsg("");
        setUploadModalOpen(false);
        setTitle("");
        setDescription("");
        setBodyText("");
      }, 2000);
    } catch (err) {
      console.error("Upload literature error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const tabs: { id: LiteratureTab; label: string; icon: any; path: string }[] = [
    { id: "all", label: t("allLiterature", "All Literature"), icon: BookOpen, path: "/literature" },
    { id: "stories", label: t("storiesTab", "Stories"), icon: BookOpen, path: "/literature/stories" },
    { id: "poems", label: t("poemsTab", "Poems"), icon: Feather, path: "/literature/poems" },
    { id: "folk-tales", label: t("folkTalesTab", "Folk Tales"), icon: Sparkles, path: "/literature/folk-tales" },
    { id: "audio-books", label: t("audiobooksTab", "Audiobooks"), icon: Headphones, path: "/literature/audio-books" },
  ];

  return (
    <div className="space-y-8 pb-16">
      {/* Banner */}
      <div className="bg-gradient-to-br from-amber-900 via-amber-950 to-stone-900 text-white p-6 sm:p-8 rounded-3xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <span className="text-amber-300 text-xs font-bold uppercase tracking-wider">
            {t("literatureBannerTag", "Rural Culture & Storytelling")}
          </span>
          <h1 className="text-2xl sm:text-4xl font-extrabold">{t("literatureHubTitle", "Literature Hub")}</h1>
          <p className="text-amber-100/90 text-xs sm:text-sm leading-relaxed">
            {t(
              "literatureHubDesc",
              "Immerse yourself in inspirational farming tales, harvest poetry, folklore, and audiobooks—or upload your own creative writing and voice stories."
            )}
          </p>

          {/* Quick upload tags */}
          <div className="flex flex-wrap gap-2 pt-2">
            <Link
              to="/upload?format=STORY"
              className="px-2.5 py-1 rounded-lg bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 border border-amber-400/30 text-[11px] font-semibold flex items-center gap-1"
            >
              <BookOpen className="w-3 h-3" /> {t("addStory", "+ Story")}
            </Link>
            <Link
              to="/upload?format=POEM"
              className="px-2.5 py-1 rounded-lg bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 border border-amber-400/30 text-[11px] font-semibold flex items-center gap-1"
            >
              <Feather className="w-3 h-3" /> {t("addPoem", "+ Poem")}
            </Link>
            <Link
              to="/upload?format=FOLK_TALE"
              className="px-2.5 py-1 rounded-lg bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 border border-amber-400/30 text-[11px] font-semibold flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3" /> {t("addFolkTale", "+ Folk Tale")}
            </Link>
            <Link
              to="/upload?format=AUDIO_BOOK"
              className="px-2.5 py-1 rounded-lg bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 border border-amber-400/30 text-[11px] font-semibold flex items-center gap-1"
            >
              <Headphones className="w-3 h-3" /> {t("addAudiobook", "+ Audiobook")}
            </Link>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0 w-full sm:w-auto">
          <Link
            to="/upload"
            className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-gray-950 font-black text-xs sm:text-sm shadow-xl transition-transform active:scale-95 text-center"
          >
            <UploadCloud className="w-4 h-4 stroke-[2.5]" />
            {t("contributeLiteratureBtn", "+ Contribute Literature")}
          </Link>
        </div>
      </div>

      {/* Upload Literature Modal */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-gray-100 space-y-4 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                <BookMarked className="w-5 h-5 text-amber-700" />
                {t("uploadLiteratureTitle", "Contribute Rural Literature")}
              </h3>
              <button
                type="button"
                onClick={() => setUploadModalOpen(false)}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {successMsg ? (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-700 flex-shrink-0" />
                {successMsg}
              </div>
            ) : (
              <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs sm:text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">{t("literatureFormatLabel", "Literature Format")}</label>
                    <select
                      value={uploadType}
                      onChange={(e) => setUploadType(e.target.value as any)}
                      className="w-full p-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 outline-none"
                    >
                      <option value="STORY">{t("storiesTab", "Story (Rural Tale)")}</option>
                      <option value="POEM">{t("poemsTab", "Poem (Harvest Poetry)")}</option>
                      <option value="FOLK_TALE">{t("folkTalesTab", "Folk Tale (Fable)")}</option>
                      <option value="AUDIO_BOOK">{t("audiobooksTab", "Audio Book (Chapter)")}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">{t("languageSelectLabel", "Language")}</label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 outline-none"
                    >
                      <option value="Hindi">Hindi (हिन्दी)</option>
                      <option value="English">English</option>
                      <option value="Telugu">Telugu (తెలుగు)</option>
                      <option value="Punjabi">Punjabi (ਪੰਜਾਬੀ)</option>
                      <option value="Marathi">Marathi (मराठी)</option>
                      <option value="Tamil">Tamil (தமிழ்)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">{t("audioTrackTitleLabel", "Title")}</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Fasal Ki Khushbu / The River and the Seed"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-200 text-gray-800 outline-none focus:border-amber-700"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">{t("authorOrNarratorLabel", "Author / Poet Name")}</label>
                    <input
                      type="text"
                      placeholder={user?.name || "Your Name / Pen Name"}
                      value={authorName}
                      onChange={(e) => setAuthorName(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-gray-200 text-gray-800 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">{t("durationMinutesLabel", "Estimated Duration (Mins)")}</label>
                    <input
                      type="number"
                      min={1}
                      max={60}
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl border border-gray-200 text-gray-800 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">{t("audioUploadLabel", "Audio MP3 File / Voice URL")}</label>
                  <input
                    type="text"
                    placeholder="Paste MP3 audio link (optional)"
                    value={audioUrl}
                    onChange={(e) => setAudioUrl(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-200 text-gray-800 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">{t("shortDescriptionLabel", "Short Description / Synopsis")}</label>
                  <textarea
                    rows={2}
                    placeholder="Brief 1-2 sentence overview for the cards..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-200 text-gray-800 outline-none focus:border-amber-700"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">{t("textOrLyricsLabel", "Full Written Text / Verses / Transcript")}</label>
                  <textarea
                    rows={5}
                    required
                    placeholder="Write the full poem, story text, or audiobook script here..."
                    value={bodyText}
                    onChange={(e) => setBodyText(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-200 text-gray-800 outline-none focus:border-amber-700 leading-relaxed font-sans"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-xl bg-amber-800 hover:bg-amber-900 text-white font-bold transition-colors shadow-md"
                >
                  {submitting ? t("publishingAudio", "Publishing...") : t("publishAudioBtn", "Publish Literature")}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Tabs */}
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
                  ? "bg-amber-800 text-white shadow-sm"
                  : "bg-white text-gray-700 hover:bg-amber-50 border border-gray-100"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <Search className="w-4 h-4 text-gray-400 ml-2" />
          <input
            type="search"
            placeholder={t("searchLiteraturePlaceholder", "Search literature, poems, authors...")}
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
            <option value="Tamil">Tamil (தமிழ்)</option>
          </select>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {literatureList.map((item) => {
          const isThisPlaying = currentTrack?.id === item.id && isPlaying;
          return (
            <article
              key={item.id}
              className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md hover:border-amber-200 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between text-xs font-bold mb-2">
                  <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md uppercase text-[10px]">
                    {item.type.replace(/_/g, " ")}
                  </span>
                  <span className="text-gray-400 font-normal">{item.language}</span>
                </div>

                <h3 className="font-bold text-gray-900 text-base leading-snug line-clamp-2 group-hover:text-amber-900">
                  {translateContent(item.title)}
                </h3>

                <p className="text-xs text-gray-600 mt-2 line-clamp-3 leading-relaxed">
                  {translateContent(item.description)}
                </p>

                {item.authorName && (
                  <p className="text-[11px] text-amber-900 mt-3 font-semibold">
                    {t("by", "By")} {item.authorName}
                  </p>
                )}
              </div>

              <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handlePlayLit(item)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-xs font-semibold transition-transform active:scale-95"
                >
                  {isThisPlaying ? (
                    <Pause className="w-3.5 h-3.5 fill-current" />
                  ) : (
                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                  )}
                  <span>{isThisPlaying ? t("playingAudio", "Playing...") : t("listenAudio", "Play Audio")}</span>
                </button>

                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span>{Math.floor(item.durationSec / 60)} {t("minAudio", "min")}</span>
                  <button
                    type="button"
                    onClick={() => {
                      handlePlayLit(item);
                      setShowTranscript(true);
                    }}
                    className="p-1 text-gray-400 hover:text-amber-900"
                    title={t("readTextTranscript", "Read Text Transcript")}
                  >
                    <FileText className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {literatureList.length === 0 && !loading && (
        <div className="text-center py-12 bg-white rounded-3xl border border-gray-100 p-6">
          <p className="text-gray-500 text-sm">{t("noSearchResults", "No literature content matching your selection.")}</p>
        </div>
      )}
    </div>
  );
}
