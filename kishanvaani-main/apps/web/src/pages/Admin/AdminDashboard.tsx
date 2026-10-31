import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import {
  fetchAdminStats,
  fetchAnalytics,
  fetchAuditLogs,
  fetchScheduledContent,
  scheduleContent,
  publishDueContent,
  publishScheduledNow,
  bulkUploadData,
  fetchPendingStories,
  updateStoryStatus,
  fetchPendingQuestions,
  AdminStatsResponse,
  AnalyticsResponse,
  AuditLogItem,
  ScheduledContentItem,
} from "../../services/admin.service";
import { createContent } from "../../services/content.service";
import { answerQuestion } from "../../services/expert.service";
import {
  ShieldCheck,
  Check,
  X,
  PlusCircle,
  HelpCircle,
  Sparkles,
  CheckCircle2,
  BarChart3,
  CalendarClock,
  FileSpreadsheet,
  History,
  TrendingUp,
  Headphones,
  Users,
  MapPin,
  Clock,
  Play,
  RotateCcw,
  Upload,
  AlertCircle,
  Send,
} from "lucide-react";

type AdminTab = "ANALYTICS" | "SCHEDULING" | "AUDIT_LOGS" | "BULK_UPLOAD" | "MODERATION" | "QUICK_PUBLISH";

export default function AdminDashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  // Active Tab
  const [activeTab, setActiveTab] = useState<AdminTab>("ANALYTICS");

  // Core Data States
  const [statsData, setStatsData] = useState<AdminStatsResponse | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsResponse | null>(null);
  const [scheduledItems, setScheduledItems] = useState<ScheduledContentItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [pendingStories, setPendingStories] = useState<any[]>([]);
  const [pendingQuestions, setPendingQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Scheduling Form
  const [schedTitle, setSchedTitle] = useState("");
  const [schedDesc, setSchedDesc] = useState("");
  const [schedBody, setSchedBody] = useState("");
  const [schedType, setSchedType] = useState("CROP_ADVISORY");
  const [schedCategory, setSchedCategory] = useState("Agriculture");
  const [schedLang, setSchedLang] = useState("Hindi");
  const [schedAudioUrl, setSchedAudioUrl] = useState("");
  const [schedDuration, setSchedDuration] = useState(180);
  const [schedPublishDate, setSchedPublishDate] = useState(() => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    return tomorrow.toISOString().slice(0, 16);
  });
  const [schedulingBusy, setSchedulingBusy] = useState(false);
  const [scheduleNotice, setScheduleNotice] = useState<string | null>(null);

  // Bulk Upload Form
  const [bulkType, setBulkType] = useState<"CONTENT" | "MANDI_PRICE">("CONTENT");
  const [bulkJsonInput, setBulkJsonInput] = useState("");
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkResult, setBulkResult] = useState<any | null>(null);

  // Quick Publish Form
  const [quickTitle, setQuickTitle] = useState("");
  const [quickDesc, setQuickDesc] = useState("");
  const [quickType, setQuickType] = useState("NEWS");
  const [quickCategory, setQuickCategory] = useState("Agriculture");
  const [quickLang, setQuickLang] = useState("Hindi");
  const [quickAudioUrl, setQuickAudioUrl] = useState("");
  const [quickDuration, setQuickDuration] = useState(180);
  const [quickAuthor, setQuickAuthor] = useState("KishanVaani Desk");
  const [quickPublishing, setQuickPublishing] = useState(false);
  const [quickSuccess, setQuickSuccess] = useState("");

  // Expert Answer Form
  const [answeringQId, setAnsweringQId] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState("");
  const [answerAudioUrl, setAnswerAudioUrl] = useState("");
  const [submittingAnswer, setSubmittingAnswer] = useState(false);

  // Audit Log Pagination
  const [auditPage, setAuditPage] = useState(1);
  const [auditTotalPages, setAuditTotalPages] = useState(1);

  // Load Dashboard Data
  useEffect(() => {
    if (!user || (user.role !== "ADMIN" && user.role !== "EXPERT")) {
      navigate("/");
      return;
    }

    async function loadData() {
      setLoading(true);
      try {
        const [stats, analytics, scheduled, logs, stories, questions] = await Promise.all([
          fetchAdminStats().catch(() => null),
          fetchAnalytics().catch(() => null),
          fetchScheduledContent().catch(() => ({ scheduled: [] })),
          fetchAuditLogs({ page: 1, limit: 20 }).catch(() => ({ logs: [], pagination: { totalPages: 1 } })),
          fetchPendingStories().catch(() => ({ stories: [] })),
          fetchPendingQuestions().catch(() => ({ questions: [] })),
        ]);

        if (stats) setStatsData(stats);
        if (analytics) setAnalyticsData(analytics);
        setScheduledItems(scheduled.scheduled || []);
        setAuditLogs(logs.logs || []);
        setAuditTotalPages(logs.pagination?.totalPages || 1);
        setPendingStories(stories.stories || []);
        setPendingQuestions(questions.questions || []);
      } catch (err) {
        console.error("Admin dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user, navigate]);

  // Handle Scheduling Submission
  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSchedulingBusy(true);
    setScheduleNotice(null);

    try {
      const res = await scheduleContent({
        title: schedTitle,
        description: schedDesc,
        body: schedBody,
        type: schedType,
        category: schedCategory,
        language: schedLang,
        audioUrl: schedAudioUrl,
        durationSec: Number(schedDuration),
        scheduledPublishAt: new Date(schedPublishDate).toISOString(),
        authorName: user?.name,
      });

      setScheduleNotice(res.message || "Broadcast advisory scheduled successfully!");
      setSchedTitle("");
      setSchedDesc("");
      setSchedBody("");
      setSchedAudioUrl("");

      // Refresh scheduled list
      const updated = await fetchScheduledContent();
      setScheduledItems(updated.scheduled);
    } catch (err: any) {
      setScheduleNotice(err.response?.data?.error || "Failed to schedule broadcast");
    } finally {
      setSchedulingBusy(false);
    }
  };

  // Publish Scheduled Content Now
  const handlePublishNow = async (id: string) => {
    try {
      await publishScheduledNow(id);
      setScheduledItems((prev) => prev.filter((item) => item.id !== id));
      // Refresh stats
      const s = await fetchAdminStats();
      setStatsData(s);
    } catch (err) {
      console.error("Publish now failed:", err);
    }
  };

  // Run Check Due Content
  const handleCheckDue = async () => {
    try {
      const res = await publishDueContent();
      alert(`Auto-publish complete: ${res.count} items published to farmers.`);
      const updated = await fetchScheduledContent();
      setScheduledItems(updated.scheduled);
    } catch (err) {
      console.error("Publish due check failed:", err);
    }
  };

  // Handle Bulk Upload
  const handleBulkUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBulkUploading(true);
    setBulkResult(null);

    try {
      let parsedItems: any[];
      try {
        parsedItems = JSON.parse(bulkJsonInput);
      } catch {
        throw new Error("Invalid JSON format. Please verify JSON array syntax.");
      }

      if (!Array.isArray(parsedItems)) {
        throw new Error("Payload must be a JSON array of records.");
      }

      const res = await bulkUploadData(bulkType, parsedItems);
      setBulkResult(res);
      // Refresh stats and audit logs
      const [s, logs] = await Promise.all([fetchAdminStats(), fetchAuditLogs({ page: 1, limit: 20 })]);
      setStatsData(s);
      setAuditLogs(logs.logs);
    } catch (err: any) {
      setBulkResult({
        success: false,
        error: err.response?.data?.error || err.message || "Bulk upload failed",
      });
    } finally {
      setBulkUploading(false);
    }
  };

  // Load Preset Template for Bulk Upload
  const loadBulkPreset = (preset: "CONTENT" | "MANDI") => {
    if (preset === "CONTENT") {
      setBulkType("CONTENT");
      setBulkJsonInput(
        JSON.stringify(
          [
            {
              title: "Yellow Rust Prevention in Late-Sown Wheat",
              description: "Preventative fungicide schedule and foliar spray window before rainfall.",
              body: "Apply Propiconazole 25% EC @ 1ml/L of water at the first sign of yellow powder on leaves.",
              type: "CROP_ADVISORY",
              category: "Agriculture",
              language: "Hindi",
              audioUrl: "https://cdn.kishanvaani.in/audio/yellow-rust-guide.opus",
              durationSec: 150,
            },
            {
              title: "Solar Water Pump Subsidy under PM-KUSUM 2026",
              description: "State-wise 60% capital subsidy breakdown for standalone solar agriculture pumps.",
              body: "Farmers with agricultural land and tubewell connections can apply online via state renewable agencies.",
              type: "GOVERNMENT_SCHEME",
              category: "Schemes",
              language: "Hindi",
              audioUrl: "https://cdn.kishanvaani.in/audio/pm-kusum-2026.opus",
              durationSec: 190,
            },
          ],
          null,
          2
        )
      );
    } else {
      setBulkType("MANDI_PRICE");
      setBulkJsonInput(
        JSON.stringify(
          [
            {
              state: "Punjab",
              district: "Ludhiana",
              market: "Khanna",
              commodity: "Wheat",
              variety: "PBW-824",
              minPrice: 2350,
              maxPrice: 2580,
              modalPrice: 2475,
              arrivals: 420,
              source: "AGMARKNET",
            },
            {
              state: "Haryana",
              district: "Karnal",
              market: "Taraori",
              commodity: "Paddy",
              variety: "Basmati 1121",
              minPrice: 3850,
              maxPrice: 4200,
              modalPrice: 4100,
              arrivals: 580,
              source: "AGMARKNET",
            },
          ],
          null,
          2
        )
      );
    }
  };

  // Moderate Story
  const handleModerateStory = async (storyId: string, status: "PUBLISHED" | "REJECTED") => {
    try {
      await updateStoryStatus(storyId, status);
      setPendingStories((prev) => prev.filter((s) => s.id !== storyId));
      const logs = await fetchAuditLogs({ page: 1, limit: 20 });
      setAuditLogs(logs.logs);
    } catch (err) {
      console.error("Story status update failed:", err);
    }
  };

  // Submit Answer with Audio
  const handleAnswerSubmit = async (qId: string) => {
    if (!answerText.trim()) return;
    setSubmittingAnswer(true);
    try {
      await answerQuestion(qId, {
        answer: answerText,
        answeredBy: user?.name || "Dr. S.K. Sharma (Agronomist)",
        audioAnswerUrl: answerAudioUrl.trim() || undefined,
      });
      setPendingQuestions((prev) => prev.filter((q) => q.id !== qId));
      setAnsweringQId(null);
      setAnswerText("");
      setAnswerAudioUrl("");
      const logs = await fetchAuditLogs({ page: 1, limit: 20 });
      setAuditLogs(logs.logs);
    } catch (err) {
      console.error("Answer submit failed:", err);
    } finally {
      setSubmittingAnswer(false);
    }
  };

  // Quick Publish
  const handleQuickPublish = async (e: React.FormEvent) => {
    e.preventDefault();
    setQuickPublishing(true);
    try {
      await createContent({
        title: quickTitle,
        description: quickDesc,
        type: quickType,
        category: quickCategory,
        language: quickLang,
        audioUrl: quickAudioUrl,
        durationSec: Number(quickDuration),
        authorName: quickAuthor,
      });
      setQuickSuccess("Broadcast published immediately!");
      setQuickTitle("");
      setQuickDesc("");
      setQuickAudioUrl("");
      setTimeout(() => setQuickSuccess(""), 3500);
    } catch (err) {
      console.error("Quick publish failed:", err);
    } finally {
      setQuickPublishing(false);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6 pb-20">
      {/* Top Banner */}
      <div className="bg-emerald-950 text-white p-6 sm:p-8 rounded-3xl shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-300 uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            {t("adminPanel", "KishanVaani Management Portal")}
          </div>
          <span className="text-xs bg-emerald-800 text-emerald-200 px-3 py-1 rounded-full font-bold">
            {user.role} Access
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold">{t("adminHeading", "Admin & Agronomist Command Center")}</h1>
        <p className="text-emerald-200 text-xs sm:text-sm max-w-2xl">
          Complete toolset: content scheduling, audit trails, bulk data ingestion, agronomist audio answers, and rural listening analytics.
        </p>
      </div>

      {/* Primary KPI Ribbon */}
      {statsData && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm">
            <span className="text-[11px] text-gray-500 font-bold uppercase">Registered Farmers</span>
            <div className="text-2xl font-black text-gray-900 mt-1">{statsData.stats.totalUsers}</div>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm">
            <span className="text-[11px] text-gray-500 font-bold uppercase">Audio Tracks</span>
            <div className="text-2xl font-black text-emerald-800 mt-1">{statsData.stats.totalContent}</div>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm">
            <span className="text-[11px] text-gray-500 font-bold uppercase">Audio Plays</span>
            <div className="text-2xl font-black text-blue-700 mt-1">
              {analyticsData?.metrics.totalAudioPlays || statsData.stats.totalPlays}
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm">
            <span className="text-[11px] text-gray-500 font-bold uppercase">Completion Rate</span>
            <div className="text-2xl font-black text-teal-600 mt-1">
              {analyticsData?.metrics.completionRate || 76.4}%
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm">
            <span className="text-[11px] text-gray-500 font-bold uppercase">Scheduled</span>
            <div className="text-2xl font-black text-amber-700 mt-1">
              {statsData.stats.scheduledContentCount ?? scheduledItems.length}
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm">
            <span className="text-[11px] text-gray-500 font-bold uppercase">Audit Actions</span>
            <div className="text-2xl font-black text-purple-700 mt-1">
              {statsData.stats.auditLogsCount ?? auditLogs.length}
            </div>
          </div>
        </div>
      )}

      {/* Feature Tab Navigation */}
      <div className="flex border-b border-gray-200 overflow-x-auto space-x-1 sm:space-x-2">
        <button
          type="button"
          onClick={() => setActiveTab("ANALYTICS")}
          className={`flex items-center gap-2 py-3 px-4 font-bold text-xs sm:text-sm border-b-2 whitespace-nowrap transition-all ${
            activeTab === "ANALYTICS"
              ? "border-emerald-700 text-emerald-800 bg-emerald-50/50 rounded-t-xl"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Analytics & Plays</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("SCHEDULING")}
          className={`flex items-center gap-2 py-3 px-4 font-bold text-xs sm:text-sm border-b-2 whitespace-nowrap transition-all ${
            activeTab === "SCHEDULING"
              ? "border-emerald-700 text-emerald-800 bg-emerald-50/50 rounded-t-xl"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <CalendarClock className="w-4 h-4" />
          <span>Content Scheduling</span>
          {scheduledItems.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 text-amber-800 font-black">
              {scheduledItems.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("AUDIT_LOGS")}
          className={`flex items-center gap-2 py-3 px-4 font-bold text-xs sm:text-sm border-b-2 whitespace-nowrap transition-all ${
            activeTab === "AUDIT_LOGS"
              ? "border-emerald-700 text-emerald-800 bg-emerald-50/50 rounded-t-xl"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <History className="w-4 h-4" />
          <span>Audit Log Trail</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("BULK_UPLOAD")}
          className={`flex items-center gap-2 py-3 px-4 font-bold text-xs sm:text-sm border-b-2 whitespace-nowrap transition-all ${
            activeTab === "BULK_UPLOAD"
              ? "border-emerald-700 text-emerald-800 bg-emerald-50/50 rounded-t-xl"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Bulk Ingestion</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("MODERATION")}
          className={`flex items-center gap-2 py-3 px-4 font-bold text-xs sm:text-sm border-b-2 whitespace-nowrap transition-all ${
            activeTab === "MODERATION"
              ? "border-emerald-700 text-emerald-800 bg-emerald-50/50 rounded-t-xl"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>Moderation Queue</span>
          {(pendingStories.length > 0 || pendingQuestions.length > 0) && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-100 text-rose-800 font-black">
              {pendingStories.length + pendingQuestions.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("QUICK_PUBLISH")}
          className={`flex items-center gap-2 py-3 px-4 font-bold text-xs sm:text-sm border-b-2 whitespace-nowrap transition-all ${
            activeTab === "QUICK_PUBLISH"
              ? "border-emerald-700 text-emerald-800 bg-emerald-50/50 rounded-t-xl"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          <span>Quick Single Audio</span>
        </button>
      </div>

      {/* TAB 1: ANALYTICS & PERFORMANCE */}
      {activeTab === "ANALYTICS" && analyticsData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* 7-Day Listening Trend Visualizer */}
            <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-gray-900 text-base">7-Day Audio Listening Activity</h3>
                  <p className="text-xs text-gray-500">Total plays vs full audio completion by rural listeners</p>
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl">
                  {analyticsData.metrics.completionRate}% Avg Completion
                </span>
              </div>

              {/* Bar Chart Visualization */}
              <div className="space-y-3 pt-3">
                <div className="grid grid-cols-7 gap-2 h-44 items-end pb-2 border-b border-gray-100">
                  {analyticsData.activityTrend.map((day, idx) => {
                    const maxPlay = Math.max(...analyticsData.activityTrend.map((d) => d.plays), 100);
                    const playHeightPercent = Math.max(15, (day.plays / maxPlay) * 100);
                    const compHeightPercent = Math.max(10, (day.completions / maxPlay) * 100);

                    return (
                      <div key={idx} className="flex flex-col items-center gap-1.5 h-full justify-end group">
                        <div className="text-[10px] font-mono text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                          {day.plays}
                        </div>
                        <div className="w-full max-w-[28px] flex items-end justify-center gap-1 h-32">
                          <div
                            style={{ height: `${playHeightPercent}%` }}
                            className="w-1/2 bg-blue-500 group-hover:bg-blue-600 rounded-t-sm transition-all"
                            title={`Plays: ${day.plays}`}
                          />
                          <div
                            style={{ height: `${compHeightPercent}%` }}
                            className="w-1/2 bg-emerald-600 group-hover:bg-emerald-700 rounded-t-sm transition-all"
                            title={`Completed: ${day.completions}`}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-gray-600 truncate">{day.dayLabel}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center justify-center gap-6 text-xs text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 bg-blue-500 rounded-sm"></span>
                    <span>Total Audio Plays</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 bg-emerald-600 rounded-sm"></span>
                    <span>Completed 100% Listen</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Farming Districts */}
            <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-700" />
                <h3 className="font-extrabold text-gray-900 text-base">Top Active Farming Districts</h3>
              </div>
              <p className="text-xs text-gray-500">Where farmers are listening to advisories & mandi trends</p>

              <div className="space-y-2.5">
                {analyticsData.topDistricts.map((dist, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-gray-50 hover:bg-gray-100/80 border border-gray-100 flex items-center justify-between text-xs transition-colors"
                  >
                    <div>
                      <div className="font-bold text-gray-900">
                        #{idx + 1} {dist.district}, <span className="text-gray-500 font-normal">{dist.state}</span>
                      </div>
                      <div className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                        <span>Crops:</span>
                        <span className="text-gray-600 font-medium">{dist.activeCrops.join(", ")}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-emerald-800 text-sm">{dist.listenersCount}</span>
                      <div className="text-[10px] text-gray-400">Listeners</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top Audio Tracks Table */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <Headphones className="w-5 h-5 text-blue-700" />
              <h3 className="font-extrabold text-gray-900 text-base">Most Listened Agricultural Audio Broadcasts</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 uppercase text-[10px]">
                    <th className="pb-2">Track Title</th>
                    <th className="pb-2">Category</th>
                    <th className="pb-2">Language</th>
                    <th className="pb-2">Duration</th>
                    <th className="pb-2 text-right">Total Plays</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 font-medium">
                  {analyticsData.topListenedAudio.map((track) => (
                    <tr key={track.id} className="hover:bg-gray-50/50">
                      <td className="py-2.5 font-bold text-gray-900">{track.title}</td>
                      <td className="py-2.5 text-gray-600">{track.category}</td>
                      <td className="py-2.5 text-gray-600">{track.language}</td>
                      <td className="py-2.5 text-gray-500">{Math.floor(track.durationSec / 60)}m {track.durationSec % 60}s</td>
                      <td className="py-2.5 text-right font-black text-blue-700">{track.viewsCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CONTENT SCHEDULING */}
      {activeTab === "SCHEDULING" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Schedule Form */}
          <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <CalendarClock className="w-5 h-5 text-emerald-700" />
              <h3 className="font-extrabold text-gray-900 text-base">Schedule New Broadcast Advisory</h3>
            </div>
            <p className="text-xs text-gray-500">
              Prepare content ahead of time. The system will auto-publish at your scheduled date and time.
            </p>

            {scheduleNotice && (
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold">
                {scheduleNotice}
              </div>
            )}

            <form onSubmit={handleScheduleSubmit} className="space-y-3.5 text-xs sm:text-sm">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Broadcast Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Early Blight Advisory for Rabi Tomato"
                  value={schedTitle}
                  onChange={(e) => setSchedTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-emerald-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Target Category</label>
                  <select
                    value={schedCategory}
                    onChange={(e) => setSchedCategory(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-200 bg-gray-50 outline-none"
                  >
                    <option value="Agriculture">Agriculture</option>
                    <option value="Community">Community</option>
                    <option value="Schemes">Schemes</option>
                    <option value="Literature">Literature</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Language</label>
                  <select
                    value={schedLang}
                    onChange={(e) => setSchedLang(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-200 bg-gray-50 outline-none"
                  >
                    <option value="Hindi">Hindi</option>
                    <option value="Punjabi">Punjabi</option>
                    <option value="English">English</option>
                    <option value="Marathi">Marathi</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Scheduled Release Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={schedPublishDate}
                  onChange={(e) => setSchedPublishDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-emerald-700 font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Audio Recording URL (Opus/MP3)</label>
                <input
                  type="url"
                  placeholder="https://cdn.kishanvaani.in/audio/..."
                  value={schedAudioUrl}
                  onChange={(e) => setSchedAudioUrl(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-emerald-700"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Short Description / SMS Alert</label>
                <textarea
                  rows={2}
                  placeholder="Brief note to be sent via SMS / notification..."
                  value={schedDesc}
                  onChange={(e) => setSchedDesc(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-emerald-700"
                />
              </div>

              <button
                type="submit"
                disabled={schedulingBusy || !schedTitle.trim()}
                className="w-full py-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
              >
                <CalendarClock className="w-4 h-4" />
                <span>{schedulingBusy ? "Scheduling..." : "Save Scheduled Broadcast"}</span>
              </button>
            </form>
          </div>

          {/* Scheduled Queue */}
          <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-600" />
                <h3 className="font-extrabold text-gray-900 text-base">Upcoming Scheduled Broadcasts</h3>
              </div>
              <button
                type="button"
                onClick={handleCheckDue}
                className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Check & Publish Due</span>
              </button>
            </div>

            {scheduledItems.length === 0 ? (
              <div className="text-center py-12 text-gray-400 space-y-2">
                <CalendarClock className="w-10 h-10 mx-auto opacity-40 text-emerald-600" />
                <p className="text-xs">No upcoming scheduled broadcasts in queue.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {scheduledItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl border border-gray-100 bg-gray-50/70 hover:bg-white hover:border-gray-200 transition-all space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-100 text-amber-900">
                            Scheduled
                          </span>
                          <span className="text-[11px] text-gray-400">{item.category} • {item.language}</span>
                        </div>
                        <h4 className="font-bold text-gray-900 text-sm mt-1">{item.title}</h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => handlePublishNow(item.id)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-sm flex items-center gap-1 flex-shrink-0"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Publish Now</span>
                      </button>
                    </div>

                    <p className="text-xs text-gray-600">{item.description}</p>

                    <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1 border-t border-gray-100">
                      <span>Scheduled for: <strong className="text-gray-800">{new Date(item.scheduledPublishAt).toLocaleString()}</strong></span>
                      <span>By: {item.author?.name || item.authorName || "Editorial"}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: AUDIT LOGS */}
      {activeTab === "AUDIT_LOGS" && (
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-purple-700" />
              <div>
                <h3 className="font-extrabold text-gray-900 text-base">Administrative Audit Trail</h3>
                <p className="text-xs text-gray-500">Immutable record of who approved, rejected, scheduled, or answered questions</p>
              </div>
            </div>
            <span className="text-xs font-bold text-purple-800 bg-purple-50 px-3 py-1 rounded-full">
              {auditLogs.length} recent actions
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 uppercase text-[10px]">
                  <th className="pb-2">Timestamp</th>
                  <th className="pb-2">Admin / Agronomist</th>
                  <th className="pb-2">Action</th>
                  <th className="pb-2">Target Type</th>
                  <th className="pb-2">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {auditLogs.map((log) => {
                  let badgeColor = "bg-gray-100 text-gray-800";
                  if (log.action.includes("APPROVE")) badgeColor = "bg-emerald-100 text-emerald-800";
                  if (log.action.includes("REJECT")) badgeColor = "bg-rose-100 text-rose-800";
                  if (log.action.includes("SCHEDULE")) badgeColor = "bg-amber-100 text-amber-800";
                  if (log.action.includes("BULK")) badgeColor = "bg-blue-100 text-blue-800";
                  if (log.action.includes("ANSWER")) badgeColor = "bg-teal-100 text-teal-800";

                  return (
                    <tr key={log.id} className="hover:bg-gray-50/50">
                      <td className="py-3 font-mono text-[11px] text-gray-500">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3 font-bold text-gray-900">
                        {log.userName || log.user?.name || "System"}
                        <span className="block text-[10px] text-gray-400 font-normal">
                          {log.user?.role || "SYSTEM"}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${badgeColor}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 font-medium text-gray-700">{log.targetType}</td>
                      <td className="py-3 text-gray-600 max-w-xs truncate" title={log.details || ""}>
                        {log.details || "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: BULK UPLOAD */}
      {activeTab === "BULK_UPLOAD" && (
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-blue-700" />
              <div>
                <h3 className="font-extrabold text-gray-900 text-base">Bulk Data Ingestion Utility</h3>
                <p className="text-xs text-gray-500">Import bulk agricultural advisories or mandi price datasets in seconds</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => loadBulkPreset("CONTENT")}
                className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs"
              >
                Sample Advisories Preset
              </button>
              <button
                type="button"
                onClick={() => loadBulkPreset("MANDI")}
                className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold text-xs"
              >
                Sample Mandi Rates Preset
              </button>
            </div>
          </div>

          {bulkResult && (
            <div
              className={`p-4 rounded-2xl text-xs font-semibold ${
                bulkResult.success
                  ? "bg-emerald-50 border border-emerald-200 text-emerald-900"
                  : "bg-rose-50 border border-rose-200 text-rose-900"
              }`}
            >
              {bulkResult.success ? (
                <div>
                  🎉 Bulk upload successful! Ingested <strong>{bulkResult.successCount}</strong> records.
                  {bulkResult.failedCount > 0 && ` (${bulkResult.failedCount} items rejected)`}
                </div>
              ) : (
                <div>⚠️ {bulkResult.error}</div>
              )}
            </div>
          )}

          <form onSubmit={handleBulkUploadSubmit} className="space-y-4">
            <div className="flex gap-4 items-center">
              <label className="font-bold text-xs text-gray-700">Target Ingestion Type:</label>
              <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer">
                <input
                  type="radio"
                  name="bulkType"
                  value="CONTENT"
                  checked={bulkType === "CONTENT"}
                  onChange={() => setBulkType("CONTENT")}
                />
                <span>Agricultural Content & Audio Tracks</span>
              </label>
              <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer">
                <input
                  type="radio"
                  name="bulkType"
                  value="MANDI_PRICE"
                  checked={bulkType === "MANDI_PRICE"}
                  onChange={() => setBulkType("MANDI_PRICE")}
                />
                <span>Mandi APMC Market Prices</span>
              </label>
            </div>

            <div>
              <label className="block font-bold text-gray-700 text-xs mb-1">JSON Array Payload</label>
              <textarea
                rows={10}
                required
                placeholder="Paste JSON array here, or click the sample presets above..."
                value={bulkJsonInput}
                onChange={(e) => setBulkJsonInput(e.target.value)}
                className="w-full p-3 font-mono text-xs rounded-2xl border border-gray-200 outline-none focus:border-blue-600 bg-gray-50/70"
              />
            </div>

            <button
              type="submit"
              disabled={bulkUploading || !bulkJsonInput.trim()}
              className="px-6 py-3 rounded-2xl bg-blue-700 hover:bg-blue-800 disabled:bg-gray-300 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              <span>{bulkUploading ? "Validating & Ingesting..." : "Run Bulk Ingestion"}</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 5: MODERATION QUEUE */}
      {activeTab === "MODERATION" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Pending Stories Moderation */}
          <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-gray-900 text-base">Community Stories Awaiting Approval</h3>
              <span className="text-xs bg-purple-50 text-purple-800 px-2.5 py-0.5 rounded-full font-bold">
                {pendingStories.length} Pending
              </span>
            </div>

            {pendingStories.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-xs">
                All community farmer stories have been reviewed!
              </div>
            ) : (
              <div className="space-y-3">
                {pendingStories.map((story) => (
                  <div key={story.id} className="p-4 rounded-2xl border border-gray-100 bg-gray-50 space-y-2 text-xs">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-gray-900 text-sm">{story.title}</h4>
                      <span className="text-[10px] text-gray-400">{story.user?.name} ({story.user?.state})</span>
                    </div>
                    <p className="text-gray-600">{story.body}</p>
                    <div className="flex items-center gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => handleModerateStory(story.id, "PUBLISHED")}
                        className="px-3 py-1.5 rounded-xl bg-emerald-800 text-white font-bold text-xs flex items-center gap-1 shadow-sm"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleModerateStory(story.id, "REJECTED")}
                        className="px-3 py-1.5 rounded-xl bg-rose-100 text-rose-800 font-bold text-xs flex items-center gap-1"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pending Questions for Agronomist */}
          <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-gray-900 text-base">Agronomist Q&A Desk</h3>
              <span className="text-xs bg-rose-50 text-rose-800 px-2.5 py-0.5 rounded-full font-bold">
                {pendingQuestions.length} Pending
              </span>
            </div>

            {pendingQuestions.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-xs">
                No unanswered farmer questions at the moment!
              </div>
            ) : (
              <div className="space-y-3">
                {pendingQuestions.map((q) => (
                  <div key={q.id} className="p-4 rounded-2xl border border-gray-100 bg-gray-50 space-y-2 text-xs">
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-emerald-800">{q.crop || "Agriculture"}</span>
                      <span className="text-[10px] text-gray-400">{q.user?.name} • {q.user?.district}</span>
                    </div>
                    <p className="font-semibold text-gray-900">{q.question}</p>

                    {answeringQId === q.id ? (
                      <div className="space-y-2 pt-2">
                        <textarea
                          rows={3}
                          placeholder="Type agronomist scientific answer & dosage..."
                          value={answerText}
                          onChange={(e) => setAnswerText(e.target.value)}
                          className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-emerald-700 bg-white"
                        />
                        <input
                          type="url"
                          placeholder="Optional Audio Advice URL (e.g. https://cdn.kishanvaani.in/...)"
                          value={answerAudioUrl}
                          onChange={(e) => setAnswerAudioUrl(e.target.value)}
                          className="w-full p-2 rounded-xl border border-gray-200 outline-none text-xs bg-white"
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleAnswerSubmit(q.id)}
                            disabled={submittingAnswer || !answerText.trim()}
                            className="px-3 py-1.5 rounded-xl bg-emerald-800 text-white font-bold text-xs flex items-center gap-1 shadow-sm"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>{submittingAnswer ? "Submitting..." : "Send Answer"}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setAnsweringQId(null)}
                            className="px-3 py-1.5 rounded-xl bg-gray-200 text-gray-700 font-bold text-xs"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setAnsweringQId(q.id);
                          setAnswerText("");
                          setAnswerAudioUrl("");
                        }}
                        className="px-3 py-1.5 rounded-xl bg-emerald-800 text-white font-bold text-xs mt-1 shadow-sm"
                      >
                        Answer Question
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 6: QUICK SINGLE AUDIO */}
      {activeTab === "QUICK_PUBLISH" && (
        <div className="max-w-2xl mx-auto bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-emerald-700" />
            <h3 className="font-extrabold text-gray-900 text-base">Instant Audio Release</h3>
          </div>

          {quickSuccess && (
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" /> {quickSuccess}
            </div>
          )}

          <form onSubmit={handleQuickPublish} className="space-y-3.5 text-xs sm:text-sm">
            <div>
              <label className="block font-bold text-gray-700 mb-1">Track Title</label>
              <input
                type="text"
                required
                placeholder="e.g. IMD Heavy Rain Alert for Cotton Tract"
                value={quickTitle}
                onChange={(e) => setQuickTitle(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-emerald-700"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Category</label>
                <select
                  value={quickCategory}
                  onChange={(e) => setQuickCategory(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-gray-200 bg-gray-50 outline-none"
                >
                  <option value="Agriculture">Agriculture</option>
                  <option value="Community">Community</option>
                  <option value="Schemes">Schemes</option>
                  <option value="Literature">Literature</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Language</label>
                <select
                  value={quickLang}
                  onChange={(e) => setQuickLang(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-gray-200 bg-gray-50 outline-none"
                >
                  <option value="Hindi">Hindi</option>
                  <option value="Punjabi">Punjabi</option>
                  <option value="Marathi">Marathi</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">Audio URL</label>
              <input
                type="url"
                placeholder="https://cdn.kishanvaani.in/audio/..."
                value={quickAudioUrl}
                onChange={(e) => setQuickAudioUrl(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-emerald-700"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">Summary</label>
              <textarea
                rows={2}
                value={quickDesc}
                onChange={(e) => setQuickDesc(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-emerald-700"
              />
            </div>

            <button
              type="submit"
              disabled={quickPublishing || !quickTitle.trim()}
              className="w-full py-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold transition-all shadow-md active:scale-95"
            >
              {quickPublishing ? "Publishing..." : "Publish Broadcast Immediately"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
