import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useLanguage, supportedLanguages, LanguageCode } from "../../context/LanguageContext";
import { useAudioPlayer, AudioTrack } from "../../context/AudioPlayerContext";
import { fetchBookmarks, toggleBookmark, BookmarkResponseItem } from "../../services/bookmarks.service";
import { fetchHistory, clearHistory } from "../../services/history.service";
import { fetchMyQuestions, ExpertQuestionItem } from "../../services/expert.service";
import { fetchMyStories, CommunityStoryItem } from "../../services/community.service";
import { fetchMyLiterature, ContentItem } from "../../services/content.service";
import {
  Bookmark,
  History as HistoryIcon,
  HelpCircle,
  Sparkles,
  BookOpen,
  Settings as SettingsIcon,
  Play,
  Trash2,
  CheckCircle2,
  Clock,
  ShieldCheck,
  LogOut,
  MapPin,
  Save,
} from "lucide-react";

type ProfileTab = "bookmarks" | "history" | "literature" | "questions" | "stories" | "settings";

export default function ProfilePage() {
  const { user, logout, updateProfile } = useAuth();
  const { language, setLanguage, t, translateContent } = useLanguage();
  const { playTrack } = useAudioPlayer();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<ProfileTab>("bookmarks");

  const [bookmarks, setBookmarks] = useState<BookmarkResponseItem[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [myLiterature, setMyLiterature] = useState<ContentItem[]>([]);
  const [myQuestions, setMyQuestions] = useState<ExpertQuestionItem[]>([]);
  const [myStories, setMyStories] = useState<CommunityStoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Settings form
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [stateVal, setStateVal] = useState(user?.state || "Punjab");
  const [districtVal, setDistrictVal] = useState(user?.district || "Ludhiana");
  const [savedSettingsMsg, setSavedSettingsMsg] = useState("");

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    setName(user.name);
    setPhone(user.phone || "");
    setStateVal(user.state || "Punjab");
    setDistrictVal(user.district || "Ludhiana");

    async function loadUserData() {
      setLoading(true);
      try {
        const [bookmarksRes, historyRes, literatureRes, questionsRes, storiesRes] = await Promise.all([
          fetchBookmarks().catch(() => ({ bookmarks: [] })),
          fetchHistory().catch(() => ({ history: [] })),
          fetchMyLiterature().catch(() => ({ items: [] })),
          fetchMyQuestions().catch(() => ({ questions: [] })),
          fetchMyStories().catch(() => ({ stories: [] })),
        ]);

        setBookmarks(bookmarksRes.bookmarks);
        setHistory(historyRes.history);
        setMyLiterature(literatureRes.items);
        setMyQuestions(questionsRes.questions);
        setMyStories(storiesRes.stories);
      } catch (err) {
        console.error("Profile load error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadUserData();
  }, [user, navigate]);

  const handlePlay = async (item: any) => {
    const track: AudioTrack = {
      id: item.id || item.contentId,
      title: item.title,
      description: item.description,
      audioUrl: item.audioUrl || "",
      category: item.category,
      narrator: item.narrator || item.authorName,
      duration: item.durationSec || 180,
    };
    await playTrack(track);
  };

  const handleRemoveBookmark = async (contentId: string) => {
    try {
      await toggleBookmark(contentId);
      setBookmarks((prev) => prev.filter((b) => b.id !== contentId));
    } catch {
      // Ignore
    }
  };

  const handleClearHistory = async () => {
    try {
      await clearHistory();
      setHistory([]);
    } catch {
      // Ignore
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile({
        name,
        phone,
        state: stateVal,
        district: districtVal,
      });
      setSavedSettingsMsg(t("saveProfileBtn", "Profile settings updated successfully!"));
      setTimeout(() => setSavedSettingsMsg(""), 3000);
    } catch {
      // Ignore
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-8 pb-16">
      {/* Profile Overview Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-600 shadow-md"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-emerald-800 text-white font-bold text-2xl flex items-center justify-center shadow-md">
              {user.name.charAt(0)}
            </div>
          )}

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{user.name}</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-emerald-100 text-emerald-800">
                {user.role}
              </span>
            </div>
            <p className="text-xs text-gray-500">{user.email}</p>
            <p className="text-xs text-emerald-800 font-medium flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" /> {user.district || "Ludhiana"}, {user.state || "Punjab"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {user.role === "ADMIN" && (
            <Link
              to="/admin"
              className="px-4 py-2.5 rounded-xl bg-emerald-50 text-emerald-800 font-bold text-xs hover:bg-emerald-100 transition-colors flex items-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4" /> {t("adminPanel", "Admin Panel")}
            </Link>
          )}

          <button
            type="button"
            onClick={() => {
              logout();
              navigate("/");
            }}
            className="px-4 py-2.5 rounded-xl border border-rose-200 text-rose-600 font-bold text-xs hover:bg-rose-50 transition-colors flex items-center gap-1.5"
          >
            <LogOut className="w-4 h-4" /> {t("logoutBtn", "Logout")}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-gray-200">
        {[
          { id: "bookmarks", label: `${t("bookmarksTab", "Saved Bookmarks")} (${bookmarks.length})`, icon: Bookmark },
          { id: "history", label: `${t("historyTab", "Listening History")} (${history.length})`, icon: HistoryIcon },
          { id: "literature", label: `${t("myUploadsTab", "My Literature")} (${myLiterature.length})`, icon: BookOpen },
          { id: "questions", label: `${t("myQuestionsTab", "My Questions")} (${myQuestions.length})`, icon: HelpCircle },
          { id: "stories", label: `${t("myStoriesTab", "My Stories")} (${myStories.length})`, icon: Sparkles },
          { id: "settings", label: t("settingsTab", "Settings"), icon: SettingsIcon },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as ProfileTab)}
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

      {/* TAB 1: BOOKMARKS */}
      {activeTab === "bookmarks" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bookmarks.map((item) => (
              <div
                key={item.id}
                className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs font-bold mb-2">
                    <span className="text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md text-[10px]">
                      {item.type.replace(/_/g, " ")}
                    </span>
                    <span className="text-gray-400 font-normal">{item.language}</span>
                  </div>
                  <h3 className="font-bold text-gray-900 text-sm sm:text-base line-clamp-2">
                    {translateContent(item.title)}
                  </h3>
                  <p className="text-xs text-gray-600 mt-2 line-clamp-2">{translateContent(item.description)}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => handlePlay(item)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold"
                  >
                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" /> {t("listenAudio", "Play Audio")}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRemoveBookmark(item.id)}
                    className="p-2 text-gray-400 hover:text-rose-600 transition-colors"
                    title="Remove Bookmark"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {bookmarks.length === 0 && (
            <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 p-8 space-y-2">
              <Bookmark className="w-8 h-8 text-gray-300 mx-auto" />
              <h4 className="font-bold text-gray-800 text-sm">{t("noBookmarksYet", "No saved audio tracks yet")}</h4>
              <p className="text-xs text-gray-500">
                Tap the bookmark icon on any audio player or story card to save it for quick offline playback.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: HISTORY */}
      {activeTab === "history" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500 font-medium">Recent tracks listened by you</span>
            {history.length > 0 && (
              <button
                type="button"
                onClick={handleClearHistory}
                className="text-xs text-rose-600 hover:underline font-bold"
              >
                {t("clearHistoryBtn", "Clear History")}
              </button>
            )}
          </div>

          <div className="space-y-3">
            {history.map((h) => (
              <div
                key={h.id}
                className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase">{h.category}</span>
                  <h4 className="font-bold text-gray-900 text-sm">{translateContent(h.title)}</h4>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Played {Math.floor(h.progressSeconds / 60)}m ({h.progressPercent}%)
                    </span>
                    <span>•</span>
                    <span>{new Date(h.lastPlayedAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handlePlay(h)}
                  className="px-4 py-2 rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-bold text-xs flex items-center gap-1.5 flex-shrink-0"
                >
                  <Play className="w-3.5 h-3.5 fill-current" /> {t("resumeAudio", "Resume")}
                </button>
              </div>
            ))}
          </div>

          {history.length === 0 && (
            <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 p-8 space-y-2">
              <HistoryIcon className="w-8 h-8 text-gray-300 mx-auto" />
              <h4 className="font-bold text-gray-800 text-sm">{t("noHistoryYet", "No listening history yet")}</h4>
              <p className="text-xs text-gray-500">
                Tracks you listen to will automatically appear here with exact resume positions.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: MY LITERATURE */}
      {activeTab === "literature" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myLiterature.map((item) => (
              <div
                key={item.id}
                className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs font-bold mb-2">
                    <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md text-[10px]">
                      {item.type.replace(/_/g, " ")}
                    </span>
                    <span className="text-gray-400 font-normal">{item.language}</span>
                  </div>
                  <h3 className="font-bold text-gray-900 text-sm sm:text-base line-clamp-2">
                    {translateContent(item.title)}
                  </h3>
                  <p className="text-xs text-gray-600 mt-2 line-clamp-2">{translateContent(item.description)}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => handlePlay(item)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-xs font-semibold"
                  >
                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" /> {t("listenAudio", "Play Audio")}
                  </button>
                  <span className="text-xs text-gray-400">{Math.floor(item.durationSec / 60)} {t("minAudio", "min")}</span>
                </div>
              </div>
            ))}
          </div>

          {myLiterature.length === 0 && (
            <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 p-8 space-y-2">
              <BookOpen className="w-8 h-8 text-gray-300 mx-auto" />
              <h4 className="font-bold text-gray-800 text-sm">{t("noUploadsYet", "You haven't uploaded any literature yet")}</h4>
              <p className="text-xs text-gray-500">
                Publish poems, folk stories or audiobooks to reach fellow farmers across India.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: MY QUESTIONS */}
      {activeTab === "questions" && (
        <div className="space-y-4">
          <div className="space-y-3">
            {myQuestions.map((q) => (
              <div key={q.id} className="p-5 rounded-3xl bg-white border border-gray-100 shadow-sm space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
                    {q.crop} • {q.category}
                  </span>
                  <span className="text-xs text-gray-400">
                    {q.status === "ANSWERED" ? "Resolved" : "Under Expert Review"}
                  </span>
                </div>
                <h4 className="font-bold text-gray-900 text-sm">{translateContent(q.question)}</h4>
                {q.answer && (
                  <div className="p-3 bg-emerald-50/60 rounded-xl text-xs text-emerald-950 space-y-1">
                    <strong className="block text-emerald-900">Answer by {q.answeredBy || "Dr. S. K. Sharma"}:</strong>
                    <p>{translateContent(q.answer)}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {myQuestions.length === 0 && (
            <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 p-8 space-y-2">
              <HelpCircle className="w-8 h-8 text-gray-300 mx-auto" />
              <h4 className="font-bold text-gray-800 text-sm">No questions asked yet</h4>
              <p className="text-xs text-gray-500">
                Ask our agricultural specialists in Community Hub regarding crop diseases or livestock health.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: MY STORIES */}
      {activeTab === "stories" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myStories.map((story) => (
              <div key={story.id} className="p-5 rounded-3xl bg-white border border-gray-100 shadow-sm space-y-3">
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                  {story.category.replace(/_/g, " ")}
                </span>
                <h4 className="font-bold text-gray-900 text-sm sm:text-base">{translateContent(story.title)}</h4>
                <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed">{translateContent(story.body)}</p>
                <div className="pt-2 border-t border-gray-50 flex items-center justify-between text-xs text-gray-400">
                  <span>Status: {story.status}</span>
                  <span>Likes: {story.likesCount}</span>
                </div>
              </div>
            ))}
          </div>

          {myStories.length === 0 && (
            <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 p-8 space-y-2">
              <Sparkles className="w-8 h-8 text-gray-300 mx-auto" />
              <h4 className="font-bold text-gray-800 text-sm">No stories shared yet</h4>
              <p className="text-xs text-gray-500">
                Share your farm experience in Community Hub to inspire other farmers.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 6: SETTINGS */}
      {activeTab === "settings" && (
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm max-w-xl space-y-5">
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <SettingsIcon className="w-4 h-4 text-emerald-700" /> {t("personalDetails", "Account Preferences")}
          </h3>

          {savedSettingsMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" /> {savedSettingsMsg}
            </div>
          )}

          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs sm:text-sm">
            <div>
              <label className="block font-bold text-gray-700 mb-1">{t("fullNameLabel", "Full Name")}</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-gray-200 text-gray-800 outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">{t("phoneLabel", "Phone Number")}</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-gray-200 text-gray-800 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-gray-700 mb-1">{t("stateLabel", "State")}</label>
                <input
                  type="text"
                  value={stateVal}
                  onChange={(e) => setStateVal(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-gray-200 text-gray-800 outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">{t("districtLabel", "District")}</label>
                <input
                  type="text"
                  value={districtVal}
                  onChange={(e) => setDistrictVal(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-gray-200 text-gray-800 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">{t("languageSelectLabel", "Default Content Language")}</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as LanguageCode)}
                className="w-full p-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 outline-none"
              >
                {supportedLanguages.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.nativeName} ({l.name})
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs sm:text-sm shadow-sm transition-colors"
            >
              <Save className="w-4 h-4" /> {t("saveProfileBtn", "Save Profile Preferences")}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
