import { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  Droplets,
  Wind,
  AlertTriangle,
  CheckCircle2,
  Bell,
  Sparkles,
  ChevronRight,
  Info,
  Send,
  Loader2,
  CalendarCheck,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import cropCalendarService, {
  CropSummary,
  DistrictSummary,
  CropScheduleResponse,
} from "../../services/crop-calendar.service";
import TapToHearButton from "../../components/common/TapToHearButton";

export default function CropCalendarTab() {
  const [crops, setCrops] = useState<CropSummary[]>([]);
  const [districts, setDistricts] = useState<DistrictSummary[]>([]);
  const [selectedCrop, setSelectedCrop] = useState<string>("Wheat");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("Ludhiana");

  // Default sowing date to 25 days ago
  const defaultSowingDate = () => {
    const d = new Date();
    d.setDate(d.getDate() - 25);
    return d.toISOString().split("T")[0];
  };

  const [sowingDate, setSowingDate] = useState<string>(defaultSowingDate());
  const [scheduleData, setScheduleData] = useState<CropScheduleResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [expandedStageId, setExpandedStageId] = useState<string | null>(null);

  // Reminder Subscription modal/state
  const [phone, setPhone] = useState<string>("");
  const [channel, setChannel] = useState<"WHATSAPP" | "SMS">("WHATSAPP");
  const [subscribing, setSubscribing] = useState<boolean>(false);
  const [subscribedMessage, setSubscribedMessage] = useState<string | null>(null);

  // Fetch initial crops and districts
  useEffect(() => {
    async function loadMeta() {
      try {
        const [cList, dList] = await Promise.all([
          cropCalendarService.getCrops(),
          cropCalendarService.getDistricts(),
        ]);
        setCrops(cList);
        setDistricts(dList);
      } catch (err) {
        console.error("Failed to load crop calendar metadata:", err);
      }
    }
    loadMeta();
  }, []);

  // Fetch schedule whenever crop, district, or sowing date changes
  useEffect(() => {
    async function fetchSchedule() {
      setLoading(true);
      try {
        const data = await cropCalendarService.getSchedule({
          crop: selectedCrop,
          district: selectedDistrict,
          sowingDate,
        });
        setScheduleData(data);
        if (data.currentStage) {
          setExpandedStageId(data.currentStage.id);
        }
      } catch (err) {
        console.error("Failed to fetch crop schedule:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchSchedule();
  }, [selectedCrop, selectedDistrict, sowingDate]);

  const handlePresetDate = (daysAgo: number) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    setSowingDate(d.toISOString().split("T")[0]);
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 10) return;
    setSubscribing(true);
    setSubscribedMessage(null);
    try {
      const res = await cropCalendarService.subscribeReminders({
        phone,
        channel,
        crop: selectedCrop,
        district: selectedDistrict,
        sowingDate,
      });
      setSubscribedMessage(res.message);
      setPhone("");
    } catch {
      setSubscribedMessage("Failed to register alert subscription. Please try again.");
    } finally {
      setSubscribing(false);
    }
  };

  const currentCropObj = crops.find((c) => c.name === selectedCrop);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white p-6 sm:p-8 rounded-3xl shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-6">
          <Calendar className="w-64 h-64 text-white" />
        </div>
        <div className="relative z-10 space-y-3 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-700/60 backdrop-blur-sm rounded-full text-xs font-semibold text-emerald-200 border border-emerald-500/30">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>AI Agronomic Engine • ICAR & IMD Aligned</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            Personalised Crop Calendar & Spray Reminders
          </h2>
          <p className="text-emerald-100/90 text-sm sm:text-base leading-relaxed">
            Tailored stage-by-stage agronomic timetable, fertilizer dosages, and weather-synchronized pesticide spray windows for your exact district and sowing date.
          </p>
        </div>
      </div>

      {/* Control Panel: District, Crop & Sowing Date */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* District Selector */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Select District (जिला)
            </label>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {districts.map((d) => (
                <option key={`${d.state}-${d.district}`} value={d.district}>
                  {d.district}, {d.state} ({d.zone})
                </option>
              ))}
            </select>
          </div>

          {/* Crop Selector */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Select Crop (फसल)
            </label>
            <select
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {crops.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name} ({c.nameHi}) - {c.season}
                </option>
              ))}
            </select>
          </div>

          {/* Sowing Date Picker */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Sowing Date (बुवाई की तारीख)
            </label>
            <input
              type="date"
              value={sowingDate}
              onChange={(e) => setSowingDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Quick Date Shortcuts */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100">
          <span className="text-xs font-bold text-gray-500 mr-2">Quick Shortcuts:</span>
          {[
            { label: "Sown Today (आज)", days: 0 },
            { label: "15 Days Ago (15 दिन पहले)", days: 15 },
            { label: "25 Days Ago (25 दिन पहले)", days: 25 },
            { label: "45 Days Ago (45 दिन पहले)", days: 45 },
            { label: "60 Days Ago (60 दिन पहले)", days: 60 },
          ].map((preset) => (
            <button
              key={preset.days}
              type="button"
              onClick={() => handlePresetDate(preset.days)}
              className="px-3 py-1 text-xs font-medium rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-colors"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 space-y-4">
          <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
          <p className="text-sm font-semibold text-gray-600">Calculating agronomic schedule & IMD weather...</p>
        </div>
      ) : scheduleData ? (
        <div className="space-y-6">
          {/* Crop Overview & Progress Bar Card */}
          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-gray-100 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl sm:text-2xl font-black text-gray-900">
                    {scheduleData.crop.name} ({scheduleData.crop.nameHi})
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900">
                    {scheduleData.crop.season} Season
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Agro-Zone: <strong className="text-gray-700">{scheduleData.district.zone}</strong> • Soil:{" "}
                  <strong className="text-gray-700">{scheduleData.district.soilType}</strong>
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="bg-emerald-50 px-4 py-2.5 rounded-2xl border border-emerald-200 text-right">
                  <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Growth Status</div>
                  <div className="text-lg font-black text-emerald-950">
                    Day {scheduleData.daysElapsed}{" "}
                    <span className="text-xs font-normal text-emerald-700">/ {scheduleData.crop.durationDays} DAS</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-gray-700">
                <span>Crop Progress ({scheduleData.progressPercent}%)</span>
                <span>Active: {scheduleData.currentStage.stageName}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 h-3 rounded-full transition-all duration-700"
                  style={{ width: `${scheduleData.progressPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-gray-400">
                <span>Sowing: {scheduleData.sowingDate}</span>
                <span>Expected Harvest: ~{scheduleData.crop.durationDays} DAS</span>
              </div>
            </div>
          </div>

          {/* Live Spray Window Safety Banner */}
          {scheduleData.weatherSprayAdvisory && (
            <div
              className={`p-6 rounded-3xl border transition-all ${
                scheduleData.weatherSprayAdvisory.safeToSpray
                  ? "bg-emerald-50/70 border-emerald-300 text-emerald-950"
                  : "bg-rose-50/70 border-rose-300 text-rose-950"
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div
                    className={`p-3 rounded-2xl ${
                      scheduleData.weatherSprayAdvisory.safeToSpray
                        ? "bg-emerald-600 text-white"
                        : "bg-rose-600 text-white"
                    }`}
                  >
                    {scheduleData.weatherSprayAdvisory.safeToSpray ? (
                      <ShieldCheck className="w-6 h-6" />
                    ) : (
                      <ShieldAlert className="w-6 h-6" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider">
                        Live IMD Weather & Spray Window Status
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-md font-black ${
                          scheduleData.weatherSprayAdvisory.safeToSpray
                            ? "bg-emerald-200 text-emerald-900"
                            : "bg-rose-200 text-rose-900"
                        }`}
                      >
                        {scheduleData.weatherSprayAdvisory.safeToSpray ? "SAFE TO SPRAY TODAY" : "SPRAYING UNSAFE TODAY"}
                      </span>
                    </div>
                    <p className="text-sm font-semibold">{scheduleData.weatherSprayAdvisory.message}</p>
                    <p className="text-xs opacity-80">
                      Recommended Hours: <strong>{scheduleData.weatherSprayAdvisory.recommendedHours}</strong> • Wind:{" "}
                      <strong>{scheduleData.weatherSprayAdvisory.windSpeedKmh} km/h</strong> • Rain:{" "}
                      <strong>{scheduleData.weatherSprayAdvisory.rainThreat}</strong>
                    </p>
                  </div>
                </div>

                <TapToHearButton
                  text={`Spray window update for ${scheduleData.district.district}. ${
                    scheduleData.weatherSprayAdvisory.safeToSpray
                      ? "It is safe to spray today between " +
                        scheduleData.weatherSprayAdvisory.recommendedHours +
                        ". " +
                        scheduleData.weatherSprayAdvisory.message
                      : "Warning: It is unsafe to spray today. " + scheduleData.weatherSprayAdvisory.message
                  }`}
                  label="Hear Spray Advice"
                  className="self-start md:self-auto bg-white/80 border-gray-200"
                />
              </div>
            </div>
          )}

          {/* Urgent Reminders Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-amber-500" />
                <h3 className="text-lg font-black text-gray-900">Urgent Reminders (तत्काल आवश्यक कार्य)</h3>
              </div>
              <span className="text-xs font-semibold text-gray-500">
                {scheduleData.urgentReminders.length} actionable items
              </span>
            </div>

            {scheduleData.urgentReminders.length === 0 ? (
              <div className="p-6 bg-white rounded-3xl border border-gray-100 text-center text-sm text-gray-500">
                No critical spray or fertilizer interventions due in the next 7 days. Normal monitoring recommended.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {scheduleData.urgentReminders.map((reminder) => (
                  <div
                    key={reminder.stageId}
                    className={`bg-white p-5 rounded-3xl border shadow-sm space-y-3 flex flex-col justify-between ${
                      reminder.status === "ACTIVE_NOW" ? "border-amber-300 ring-2 ring-amber-100" : "border-gray-200"
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                            reminder.category === "SPRAY"
                              ? "bg-purple-100 text-purple-900"
                              : reminder.category === "FERTILIZER"
                              ? "bg-emerald-100 text-emerald-900"
                              : reminder.category === "IRRIGATION"
                              ? "bg-blue-100 text-blue-900"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {reminder.category}
                        </span>
                        <span
                          className={`text-xs font-bold ${
                            reminder.status === "ACTIVE_NOW" ? "text-amber-600" : "text-gray-500"
                          }`}
                        >
                          {reminder.status === "ACTIVE_NOW" ? "⚡ Active Right Now" : `Due in ${reminder.dueInDays} days`}
                        </span>
                      </div>

                      <h4 className="text-base font-bold text-gray-900">{reminder.title}</h4>
                      <p className="text-xs font-medium text-emerald-800">{reminder.titleHi}</p>
                      <p className="text-xs text-gray-600 leading-relaxed">{reminder.description}</p>

                      {reminder.dosage && (
                        <div className="p-2.5 bg-amber-50 rounded-2xl border border-amber-200/60 text-xs">
                          <strong className="text-amber-950">Recommended Dose: </strong>
                          <span className="text-amber-900">{reminder.dosage}</span>
                        </div>
                      )}

                      {reminder.weatherPrecaution && (
                        <div className="flex items-start gap-1.5 text-[11px] text-gray-500">
                          <Info className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                          <span>{reminder.weatherPrecaution}</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-gray-100 flex items-center justify-end">
                      <TapToHearButton
                        text={`${reminder.title}. ${reminder.description}. ${
                          reminder.dosage ? "Dosage: " + reminder.dosage : ""
                        }`}
                        label="Hear Reminder"
                        className="text-xs py-1 px-2.5"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Full Agronomic Stage-by-Stage Timeline */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-emerald-700" />
                <h3 className="text-lg font-black text-gray-900">Complete Crop Growth Timeline (फसल जीवन चक्र)</h3>
              </div>
              <span className="text-xs text-gray-400">Total {scheduleData.allStages.length} growth stages</span>
            </div>

            <div className="space-y-3 pt-2">
              {scheduleData.allStages.map((stage, idx) => {
                const isExpanded = expandedStageId === stage.id;
                return (
                  <div
                    key={stage.id}
                    className={`rounded-2xl border transition-all ${
                      stage.isCurrent
                        ? "border-emerald-500 bg-emerald-50/30 ring-2 ring-emerald-100"
                        : stage.isCompleted
                        ? "border-gray-200 bg-gray-50/50"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    {/* Stage Header Row */}
                    <div
                      onClick={() => setExpandedStageId(isExpanded ? null : stage.id)}
                      className="p-4 flex items-center justify-between cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                            stage.isCompleted
                              ? "bg-emerald-600 text-white"
                              : stage.isCurrent
                              ? "bg-emerald-500 text-white animate-pulse"
                              : "bg-gray-200 text-gray-600"
                          }`}
                        >
                          {stage.isCompleted ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-gray-900">{stage.stageName}</span>
                            <span className="text-xs text-gray-500">({stage.stageNameHi})</span>
                            {stage.isCurrent && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-600 text-white">
                                CURRENT
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">
                            Days {stage.startDay} - {stage.endDay} DAS • {stage.category}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <TapToHearButton
                          text={`${stage.stageName}. ${stage.title}. ${stage.description}. ${
                            stage.dosage ? "Dosage: " + stage.dosage : ""
                          }`}
                          label="Hear Stage"
                          className="text-xs py-1 px-2"
                        />
                        <ChevronRight
                          className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                        />
                      </div>
                    </div>

                    {/* Stage Details (Accordion Body) */}
                    {isExpanded && (
                      <div className="p-4 pt-0 border-t border-gray-100 space-y-3 text-xs">
                        <div className="font-bold text-gray-800 text-sm mt-2">{stage.title}</div>
                        <p className="text-gray-600 leading-relaxed">{stage.description}</p>
                        <p className="text-emerald-800 italic leading-relaxed">{stage.descriptionHi}</p>

                        {stage.dosage && (
                          <div className="p-3 bg-white rounded-xl border border-emerald-200">
                            <span className="font-bold text-emerald-950">Application / Dosage: </span>
                            <span className="text-gray-800">{stage.dosage}</span>
                            {stage.dosageHi && (
                              <div className="text-emerald-800 mt-1">{stage.dosageHi}</div>
                            )}
                          </div>
                        )}

                        {stage.weatherPrecaution && (
                          <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200 text-amber-900">
                            <span className="font-bold">Weather Precaution: </span>
                            <span>{stage.weatherPrecaution}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* WhatsApp / SMS Delivery Section */}
          <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white p-6 sm:p-7 rounded-3xl shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <Send className="w-5 h-5 text-emerald-300" />
              <h3 className="text-lg font-black">Get Daily Briefs & Spray Alerts on WhatsApp / SMS</h3>
            </div>
            <p className="text-xs sm:text-sm text-emerald-100 max-w-2xl leading-relaxed">
              Never miss an urgent pesticide spray or fertilizer top-dressing. Enter your mobile number to receive timely reminders matched to your crop stage.
            </p>

            <form onSubmit={handleSubscribe} className="space-y-3 pt-1">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="tel"
                  placeholder="Enter 10-digit mobile number (e.g. 9876543210)"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-emerald-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />

                <select
                  value={channel}
                  onChange={(e) => setChannel(e.target.value as "WHATSAPP" | "SMS")}
                  className="px-4 py-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-400"
                >
                  <option value="WHATSAPP" className="text-gray-900">WhatsApp Alert</option>
                  <option value="SMS" className="text-gray-900">SMS Alert</option>
                </select>

                <button
                  type="submit"
                  disabled={subscribing || !phone}
                  className="px-6 py-2.5 rounded-2xl bg-emerald-400 hover:bg-emerald-300 text-emerald-950 font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {subscribing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
                  <span>Subscribe Alerts</span>
                </button>
              </div>

              {subscribedMessage && (
                <div className="p-3 bg-emerald-700/60 rounded-2xl text-xs font-semibold text-emerald-100 border border-emerald-500/40">
                  {subscribedMessage}
                </div>
              )}
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
