import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { useAudioPlayer, AudioTrack } from "../../context/AudioPlayerContext";
import {
  fetchCommunityStories,
  submitCommunityStory,
  likeStory,
  CommunityStoryItem,
} from "../../services/community.service";
import {
  fetchExpertQuestions,
  askExpert,
  answerQuestion,
  ExpertQuestionItem,
} from "../../services/expert.service";
import TapToHearButton from "../../components/common/TapToHearButton";
import {
  Users,
  Trophy,
  AlertTriangle,
  Lightbulb,
  HelpCircle,
  PlusCircle,
  Play,
  Heart,
  MapPin,
  CheckCircle2,
  Clock,
  Sparkles,
  X,
  Volume2,
  Headphones,
  Send,
  MessageSquareCheck,
} from "lucide-react";

type CommunityTab = "all" | "success-stories" | "learning-from-failure" | "farmer-experiences" | "ask-an-expert";

export default function CommunityPage() {
  const { "*": tabParam } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, translateContent } = useLanguage();
  const { playTrack } = useAudioPlayer();

  const activeTab: CommunityTab = (tabParam as CommunityTab) || "all";

  const [stories, setStories] = useState<CommunityStoryItem[]>([]);
  const [questions, setQuestions] = useState<ExpertQuestionItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Story Submission Modal State
  const [storyModalOpen, setStoryModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [newCategory, setNewCategory] = useState("SUCCESS_STORY");
  const [newFarmerName, setNewFarmerName] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [submittingStory, setSubmittingStory] = useState(false);
  const [storySuccessMsg, setStorySuccessMsg] = useState("");

  // Ask Expert Form State
  const [searchParams] = useSearchParams();
  const targetQuestionId = searchParams.get("questionId");
  const [questionText, setQuestionText] = useState("");
  const [cropTag, setCropTag] = useState("Wheat");
  const [questionCategory, setQuestionCategory] = useState("Pest & Disease Control");
  const [submittingQuestion, setSubmittingQuestion] = useState(false);
  const [questionSuccessMsg, setQuestionSuccessMsg] = useState("");

  // Expert Answer Form State (for EXPERT or ADMIN users)
  const [answeringQuestionId, setAnsweringQuestionId] = useState<string | null>(null);
  const [expertAnswerText, setExpertAnswerText] = useState("");
  const [expertAudioUrl, setExpertAudioUrl] = useState("");
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [answerSuccessMsg, setAnswerSuccessMsg] = useState("");

  useEffect(() => {
    async function loadCommunityData() {
      setLoading(true);
      try {
        let categoryFilter: string | undefined;
        if (activeTab === "success-stories") categoryFilter = "SUCCESS_STORY";
        else if (activeTab === "learning-from-failure") categoryFilter = "FAILURE_STORY";
        else if (activeTab === "farmer-experiences") categoryFilter = "FARMER_EXPERIENCE";

        const [storiesRes, questionsRes] = await Promise.all([
          fetchCommunityStories(categoryFilter).catch(() => ({ stories: [] })),
          fetchExpertQuestions().catch(() => ({ questions: [] })),
        ]);

        setStories(storiesRes.stories);
        setQuestions(questionsRes.questions);
      } catch (err) {
        console.error("Community data fetch error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadCommunityData();
  }, [activeTab]);

  const handleLikeStory = async (id: string) => {
    try {
      const res = await likeStory(id);
      setStories((prev) =>
        prev.map((s) => (s.id === id ? { ...s, likesCount: res.likesCount } : s))
      );
    } catch {
      // Ignore
    }
  };

  const handlePlayAudio = async (title: string, audioUrl: string, narrator?: string) => {
    const track: AudioTrack = {
      id: `comm_${Date.now()}`,
      title,
      audioUrl: audioUrl || "",
      category: "Community",
      narrator: narrator || "Farmer Audio Voice Note",
    };
    await playTrack(track);
  };

  const handleStorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate("/login");
      return;
    }

    try {
      setSubmittingStory(true);
      const res = await submitCommunityStory({
        title: newTitle,
        body: newBody,
        category: newCategory,
        farmerName: newFarmerName || user.name,
        location: newLocation || `${user.district || ""}, ${user.state || ""}`.trim() || "India",
        audioUrl: undefined,
      });

      setStories([res.story, ...stories]);
      setStorySuccessMsg(t("uploadSuccessTitle", "Your farmer experience has been published to the community!"));
      setTimeout(() => {
        setStorySuccessMsg("");
        setStoryModalOpen(false);
        setNewTitle("");
        setNewBody("");
      }, 2000);
    } catch (err) {
      console.error("Submit story error:", err);
    } finally {
      setSubmittingStory(false);
    }
  };

  const handleQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate("/login");
      return;
    }

    try {
      setSubmittingQuestion(true);
      const res = await askExpert({
        question: questionText,
        crop: cropTag,
        category: questionCategory,
      });

      setQuestions([res.question, ...questions]);
      setQuestionSuccessMsg(res.message);
      setQuestionText("");
      setTimeout(() => setQuestionSuccessMsg(""), 4000);
    } catch (err) {
      console.error("Submit question error:", err);
    } finally {
      setSubmittingQuestion(false);
    }
  };

  const handleAnswerSubmit = async (questionId: string) => {
    if (!expertAnswerText.trim()) return;
    setSubmittingAnswer(true);
    setAnswerSuccessMsg("");
    try {
      const res = await answerQuestion(questionId, {
        answer: expertAnswerText.trim(),
        audioAnswerUrl: expertAudioUrl.trim() || undefined,
        answeredBy: user?.name,
      });

      setQuestions((prev) =>
        prev.map((q) => (q.id === questionId ? res.question : q))
      );
      setAnswerSuccessMsg("Answer published and asking farmer notified!");
      setAnsweringQuestionId(null);
      setExpertAnswerText("");
      setExpertAudioUrl("");
      setTimeout(() => setAnswerSuccessMsg(""), 4000);
    } catch (err) {
      console.error("Failed to answer question:", err);
    } finally {
      setSubmittingAnswer(false);
    }
  };

  // Auto-scroll to target question if opened from notification link
  useEffect(() => {
    if (targetQuestionId && questions.length > 0) {
      const el = document.getElementById(`question-${targetQuestionId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [targetQuestionId, questions]);

  const tabs: { id: CommunityTab; label: string; icon: any; path: string }[] = [
    { id: "all", label: t("allCommunity", "All Community"), icon: Users, path: "/community" },
    { id: "success-stories", label: t("successStoriesTab", "Success Stories"), icon: Trophy, path: "/community/success-stories" },
    { id: "learning-from-failure", label: t("learningFromFailureTab", "Learning from Failure"), icon: AlertTriangle, path: "/community/learning-from-failure" },
    { id: "farmer-experiences", label: t("farmerExperiencesTab", "Farmer Experiences"), icon: Lightbulb, path: "/community/farmer-experiences" },
    { id: "ask-an-expert", label: t("askAnExpertTab", "Ask an Expert"), icon: HelpCircle, path: "/community/ask-an-expert" },
  ];

  return (
    <div className="space-y-8 pb-16">
      {/* Community Banner */}
      <div className="bg-gradient-to-br from-emerald-900 to-green-950 text-white p-6 sm:p-8 rounded-3xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <span className="text-emerald-300 text-xs font-bold uppercase tracking-wider">
            {t("communityBannerTag", "Farmer-to-Farmer Knowledge & Advice")}
          </span>
          <h1 className="text-2xl sm:text-4xl font-extrabold">{t("communityHubTitle", "Community Hub")}</h1>
          <p className="text-emerald-100 text-xs sm:text-sm max-w-xl">
            {t(
              "communityHubDesc",
              "Learn from practical farmer triumphs, post-harvest lessons, everyday farm innovations, and consult dedicated agronomists."
            )}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (!user) navigate("/login");
            else setStoryModalOpen(true);
          }}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-gray-950 font-bold text-xs sm:text-sm shadow-md transition-transform active:scale-95 flex-shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          {t("shareYourStoryBtn", "Share Your Story")}
        </button>
      </div>

      {/* Navigation Tabs */}
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

      {/* Share Story Modal */}
      {storyModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 space-y-4 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-700" /> {t("shareExpModalTitle", "Share Your Farmer Experience")}
              </h3>
              <button
                type="button"
                onClick={() => setStoryModalOpen(false)}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {storySuccessMsg ? (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-700 flex-shrink-0" />
                {storySuccessMsg}
              </div>
            ) : (
              <form onSubmit={handleStorySubmit} className="space-y-4 text-xs sm:text-sm">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">{t("storyCategoryLabel", "Story Category")}</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 outline-none"
                  >
                    <option value="SUCCESS_STORY">{t("successStoriesTab", "Success Story (Breakthrough)")}</option>
                    <option value="FAILURE_STORY">{t("learningFromFailureTab", "Learning from Failure (Mistake & Solution)")}</option>
                    <option value="FARMER_EXPERIENCE">{t("farmerExperiencesTab", "Everyday Farmer Experience (Tips & Hacks)")}</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">{t("storyTitleLabel", "Story Title")}</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. How I Doubled My Tomato Yield with Mulching"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-200 text-gray-800 outline-none focus:border-emerald-700"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">{t("farmerNameLabel", "Your Name")}</label>
                    <input
                      type="text"
                      placeholder={user?.name || "Farmer Name"}
                      value={newFarmerName}
                      onChange={(e) => setNewFarmerName(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-gray-200 text-gray-800 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">{t("locationLabel", "Village / District")}</label>
                    <input
                      type="text"
                      placeholder="e.g. Sangrur, Punjab"
                      value={newLocation}
                      onChange={(e) => setNewLocation(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-gray-200 text-gray-800 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">{t("yourStoryLessonsLabel", "Detailed Story / Experience")}</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Share what techniques you used, what costs were involved, and what lessons other farmers can learn..."
                    value={newBody}
                    onChange={(e) => setNewBody(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-200 text-gray-800 outline-none focus:border-emerald-700 leading-relaxed"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingStory}
                  className="w-full py-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold transition-colors"
                >
                  {submittingStory ? t("publishingStory", "Publishing...") : t("publishStoryBtn", "Publish Experience")}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ASK AN EXPERT SECTION */}
      {activeTab === "ask-an-expert" ? (
        <div className="space-y-8">
          {/* Ask Question Card */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-emerald-700" />
                {t("askAgronomistTitle", "Ask a Verified Agronomist")}
              </h2>
              <p className="text-xs text-gray-500">
                {t(
                  "askAgronomistDesc",
                  "Submit questions regarding crop diseases, soil nutrients, pest management, or dairy livestock health."
                )}
              </p>
            </div>

            {questionSuccessMsg && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-700 flex-shrink-0" />
                {questionSuccessMsg}
              </div>
            )}

            <form onSubmit={handleQuestionSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">{t("selectCropLabel", "Crop / Animal Type")}</label>
                  <select
                    value={cropTag}
                    onChange={(e) => setCropTag(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-200 bg-gray-50 text-xs font-semibold text-gray-800"
                  >
                    <option value="Wheat">Wheat (गेहूं / గోధుమ / கோதுமை)</option>
                    <option value="Paddy/Rice">Paddy / Rice (धान / వరి / நெல்)</option>
                    <option value="Cotton">Cotton (कपास / పత్తి / பருத்தி)</option>
                    <option value="Mustard">Mustard (सरसों / ఆవాలు / கடுகு)</option>
                    <option value="Dairy Livestock">Dairy Cattle / Buffalo (पशुपालन / పాడి)</option>
                    <option value="Vegetables/Horticulture">Vegetables & Fruits (सब्जी / తోటలు)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">{t("problemTypeLabel", "Category")}</label>
                  <select
                    value={questionCategory}
                    onChange={(e) => setQuestionCategory(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-200 bg-gray-50 text-xs font-semibold text-gray-800"
                  >
                    <option value="Pest & Disease Control">Pest & Disease Control</option>
                    <option value="Nutrient Management">Nutrient / Fertilizer Management</option>
                    <option value="Irrigation & Soil">Irrigation & Soil Health</option>
                    <option value="Animal Healthcare">Animal Healthcare & Milk Yield</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">{t("describeProblemLabel", "Describe your question")}</label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. My wheat crop has yellow stripes on lower leaves. Sowing was done 40 days ago..."
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  className="w-full p-3 rounded-2xl border border-gray-200 text-xs sm:text-sm text-gray-800 outline-none focus:border-emerald-700"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submittingQuestion}
                  className="px-6 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs sm:text-sm transition-colors"
                >
                  {submittingQuestion ? t("submittingQuestion", "Sending...") : t("submitToExpertsBtn", "Submit Question to Expert")}
                </button>
              </div>
            </form>
          </div>

          {/* List of Verified Q&As */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900">{t("verifiedExpertReply", "Recent Agronomist & Vet Answers")}</h3>
              {answerSuccessMsg && (
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1.5 animate-pulse">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {answerSuccessMsg}
                </span>
              )}
            </div>

            <div className="space-y-4">
              {questions.map((q) => {
                const isTarget = targetQuestionId === q.id;
                const isAnswering = answeringQuestionId === q.id;
                const isStaff = user?.role === "EXPERT" || user?.role === "ADMIN";

                return (
                  <div
                    key={q.id}
                    id={`question-${q.id}`}
                    className={`p-5 rounded-3xl bg-white border shadow-sm space-y-3 transition-all ${
                      isTarget
                        ? "border-emerald-500 ring-4 ring-emerald-200 bg-emerald-50/20 shadow-md"
                        : "border-gray-100"
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md">
                          {q.crop} • {q.category}
                        </span>
                        {isTarget && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-600 text-white animate-pulse">
                            VIEWING FROM NOTIFICATION
                          </span>
                        )}
                      </div>

                      <span className="flex items-center gap-1 text-gray-400">
                        <Clock className="w-3.5 h-3.5" />
                        {q.status === "ANSWERED" ? "Resolved" : "Awaiting Review"}
                      </span>
                    </div>

                    <h4 className="font-bold text-gray-900 text-sm sm:text-base">{translateContent(q.question)}</h4>

                    {q.answer ? (
                      <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                            {q.answeredBy || "Dr. S. K. Sharma (Agronomist)"}
                          </span>

                          <div className="flex items-center gap-2">
                            {q.audioAnswerUrl && (
                              <button
                                type="button"
                                onClick={() =>
                                  handlePlayAudio(
                                    `Expert Answer: ${q.crop}`,
                                    q.audioAnswerUrl!,
                                    q.answeredBy
                                  )
                                }
                                className="flex items-center gap-1.5 text-xs font-bold text-white bg-emerald-700 px-3 py-1 rounded-full shadow-sm hover:bg-emerald-800 transition-colors"
                              >
                                <Headphones className="w-3.5 h-3.5" />
                                <span>Play Voice Answer</span>
                              </button>
                            )}

                            <TapToHearButton
                              text={`Expert advice by ${q.answeredBy || "Specialist"}. ${q.answer}`}
                              label="Speak Answer"
                              className="text-xs py-1 px-2.5"
                            />
                          </div>
                        </div>

                        <p className="text-xs sm:text-sm text-emerald-950 leading-relaxed font-medium">
                          {translateContent(q.answer)}
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-amber-50/70 p-3.5 rounded-2xl border border-amber-200/50">
                        <p className="text-amber-800 font-medium">
                          {t("awaitingExpertReply", "This question is currently under review by our specialist agronomists.")}
                        </p>

                        {isStaff && (
                          <button
                            type="button"
                            onClick={() => {
                              setAnsweringQuestionId(isAnswering ? null : q.id);
                              setExpertAnswerText("");
                              setExpertAudioUrl("");
                            }}
                            className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition-colors shrink-0 flex items-center gap-1.5"
                          >
                            <MessageSquareCheck className="w-3.5 h-3.5" />
                            <span>Reply as Expert</span>
                          </button>
                        )}
                      </div>
                    )}

                    {/* Inline Expert Answer Form for EXPERT / ADMIN roles */}
                    {isStaff && isAnswering && (
                      <div className="p-4 rounded-2xl bg-gray-50 border border-emerald-200 space-y-3 mt-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                            Verified Agronomist Response
                          </span>
                          <button
                            type="button"
                            onClick={() => setAnsweringQuestionId(null)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <textarea
                          rows={3}
                          placeholder="Provide specific chemical dosages, cultural measures, or veterinary guidance..."
                          value={expertAnswerText}
                          onChange={(e) => setExpertAnswerText(e.target.value)}
                          className="w-full p-2.5 rounded-xl border border-gray-200 bg-white text-xs text-gray-800 outline-none focus:ring-2 focus:ring-emerald-500"
                        />

                        <div>
                          <label className="block text-[11px] font-bold text-gray-600 mb-1">
                            Audio Voice Note URL (Optional MP3/AAC file or cloud audio link)
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. /audio/expert-answers/wheat-rust-remedy.mp3"
                            value={expertAudioUrl}
                            onChange={(e) => setExpertAudioUrl(e.target.value)}
                            className="w-full p-2 rounded-xl border border-gray-200 bg-white text-xs text-gray-800 outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>

                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setAnsweringQuestionId(null)}
                            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-200"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            disabled={submittingAnswer || !expertAnswerText.trim()}
                            onClick={() => handleAnswerSubmit(q.id)}
                            className="px-4 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 disabled:opacity-50"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>{submittingAnswer ? "Publishing..." : "Publish & Notify Farmer"}</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* STORIES GRID (Success Stories, Failure Lessons, Farmer Experiences) */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {stories.map((story) => (
            <article
              key={story.id}
              className="p-6 rounded-3xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span
                    className={`font-bold px-2 py-0.5 rounded-md text-[10px] ${
                      story.category === "SUCCESS_STORY"
                        ? "text-emerald-800 bg-emerald-50"
                        : story.category === "FAILURE_STORY"
                          ? "text-rose-800 bg-rose-50"
                          : "text-blue-800 bg-blue-50"
                    }`}
                  >
                    {story.category.replace(/_/g, " ")}
                  </span>
                  {story.location && (
                    <span className="flex items-center gap-1 text-gray-400">
                      <MapPin className="w-3 h-3" /> {story.location}
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-gray-900 text-base leading-snug">{translateContent(story.title)}</h3>

                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                  {translateContent(story.body)}
                </p>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-gray-700 font-semibold">
                  <div className="w-6 h-6 rounded-full bg-emerald-700 text-white flex items-center justify-center text-[10px]">
                    {(story.farmerName || "Farmer").charAt(0)}
                  </div>
                  <span>{story.farmerName || "Farmer"}</span>
                </div>

                <div className="flex items-center gap-2">
                  {story.audioUrl && (
                    <button
                      type="button"
                      onClick={() => handlePlayAudio(story.title, story.audioUrl!, story.farmerName)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-semibold hover:bg-emerald-100"
                    >
                      <Play className="w-3 h-3 fill-current" /> {t("farmerVoiceNote", "Audio Note")}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleLikeStory(story.id)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-gray-500 hover:text-rose-600 hover:bg-rose-50"
                  >
                    <Heart className="w-3.5 h-3.5" /> {story.likesCount}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
