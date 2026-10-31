import { useState, useRef, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { useAudioPlayer, AudioTrack } from "../../context/AudioPlayerContext";
import { uploadUserLiterature, uploadAudioFile, ContentItem } from "../../services/content.service";
import {
  UploadCloud,
  FileAudio,
  BookOpen,
  Feather,
  Sparkles,
  Headphones,
  CheckCircle2,
  Play,
  Pause,
  ShieldAlert,
  Zap,
} from "lucide-react";

type UploadFormat = "STORY" | "POEM" | "FOLK_TALE" | "AUDIO_BOOK";

export default function UploadPage() {
  const { user, demoLogin } = useAuth();
  const { t, translateContent } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { playTrack } = useAudioPlayer();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Initialize format from query param if available
  const paramFormat = searchParams.get("format")?.toUpperCase();
  const initialFormat: UploadFormat =
    paramFormat === "POEM" || paramFormat === "FOLK_TALE" || paramFormat === "AUDIO_BOOK"
      ? paramFormat
      : "STORY";

  const [format, setFormat] = useState<UploadFormat>(initialFormat);
  const [title, setTitle] = useState("");
  const [authorName, setAuthorName] = useState(user?.name || "");
  const [language, setLanguage] = useState("Hindi");
  const [description, setDescription] = useState("");
  const [bodyText, setBodyText] = useState("");

  // Audio File State
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string>("");
  const [audioDurationSec, setAudioDurationSec] = useState<number>(0);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  // Cover Image
  const [thumbnailUrl, setThumbnailUrl] = useState(
    "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=600&auto=format&fit=crop&q=80"
  );

  const [submitting, setSubmitting] = useState(false);
  const [successItem, setSuccessItem] = useState<ContentItem | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (user && !authorName) {
      setAuthorName(user.name);
    }
  }, [user]);

  useEffect(() => {
    const qFormat = searchParams.get("format")?.toUpperCase();
    if (qFormat === "POEM" || qFormat === "FOLK_TALE" || qFormat === "AUDIO_BOOK" || qFormat === "STORY") {
      setFormat(qFormat as UploadFormat);
    }
  }, [searchParams]);

  const presetCovers = [
    { label: "🌾 Golden Harvest Fields", url: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=600&auto=format&fit=crop&q=80" },
    { label: "🌱 Lush Green Farmland", url: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&auto=format&fit=crop&q=80" },
    { label: "📖 Village Storytelling Chopal", url: "https://images.unsplash.com/photo-1516214104703-d870798883c5?w=600&auto=format&fit=crop&q=80" },
    { label: "🌧️ Monsoon Rain Skies", url: "https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?w=600&auto=format&fit=crop&q=80" },
    { label: "🚜 Rich Organic Soil", url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&auto=format&fit=crop&q=80" },
  ];

  const readAsDataURL = (file: File): Promise<string> => {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      setErrorMsg("Audio must be under 4 MB");
      setAudioFile(null);
      setAudioPreviewUrl("");
      return;
    }

    setErrorMsg(null);
    setAudioFile(file);

    // Create object URL for instant preview
    const objUrl = URL.createObjectURL(file);
    setAudioPreviewUrl(objUrl);

    // Load audio duration
    const tempAudio = new Audio(objUrl);
    tempAudio.addEventListener("loadedmetadata", () => {
      if (tempAudio.duration && !isNaN(tempAudio.duration)) {
        setAudioDurationSec(Math.round(tempAudio.duration));
      }
    });
  };

  const togglePreviewPlay = () => {
    if (!audioPreviewUrl) return;

    if (!previewAudioRef.current) {
      previewAudioRef.current = new Audio(audioPreviewUrl);
      previewAudioRef.current.onended = () => setIsPreviewPlaying(false);
    }

    if (isPreviewPlaying) {
      previewAudioRef.current.pause();
      setIsPreviewPlaying(false);
    } else {
      previewAudioRef.current.play().then(() => setIsPreviewPlaying(true)).catch(() => {});
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);

    try {
      let finalAudioUrl = "";

      // If user provided a real audio file, upload it to the backend
      if (audioFile) {
        if (audioFile.size > 4 * 1024 * 1024) {
          setErrorMsg("Audio must be under 4 MB");
          setSubmitting(false);
          return;
        }
        try {
          const base64 = await readAsDataURL(audioFile);
          const uploadRes = await uploadAudioFile(audioFile.name, base64, audioFile.type);
          finalAudioUrl = uploadRes.fileUrl;
        } catch (e: any) {
          setErrorMsg(e.response?.data?.error || "Audio upload failed. Please try a smaller MP3 or retry.");
          setSubmitting(false);
          return; // do NOT publish without audio
        }
      }

      const res = await uploadUserLiterature({
        title,
        type: format,
        language,
        durationSec: audioDurationSec,
        audioUrl: finalAudioUrl,
        thumbnailUrl,
        description: description || `Original ${format.toLowerCase().replace(/_/g, " ")} shared by ${authorName} on KishanVaani.`,
        body: bodyText || description || title,
        transcript: bodyText,
        authorName: authorName || user?.name || "Rural Creator",
      });

      setSuccessItem(res.content);
    } catch (err: any) {
      console.error("Publish error:", err);
      setErrorMsg(err.response?.data?.error || "Failed to publish literature. Please check your fields and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (successItem) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center space-y-6 animate-in fade-in-50">
        <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto shadow-md">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-extrabold text-emerald-800 bg-emerald-50 px-3.5 py-1.5 rounded-full uppercase tracking-wider">
            🎉 {t("uploadSuccessTitle", "Audio Track Successfully Published!")}
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">{successItem.title}</h1>
          <p className="text-xs text-gray-500">{t("by", "By")} {successItem.authorName || user?.name} • {t("languageSelectLabel", "Language")}: {successItem.language}</p>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-gray-100 shadow-sm max-w-lg mx-auto space-y-4 text-left">
          <img
            src={successItem.thumbnailUrl || thumbnailUrl}
            alt="Cover"
            className="w-full h-44 rounded-2xl object-cover"
          />
          <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed">{successItem.description}</p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <button
              type="button"
              onClick={() =>
                playTrack({
                  id: successItem.id,
                  title: successItem.title,
                  description: successItem.description,
                  audioUrl: successItem.audioUrl,
                  category: "Literature",
                  narrator: successItem.authorName,
                  duration: successItem.durationSec,
                  transcript: successItem.transcript,
                })
              }
              className="px-5 py-3 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-transform active:scale-95"
            >
              <Play className="w-4 h-4 fill-current" /> {t("listenAudio", "Play Audio Now")}
            </button>
            <Link
              to="/literature"
              className="px-5 py-3 rounded-2xl border border-gray-200 text-gray-800 font-bold text-xs sm:text-sm hover:bg-gray-50 text-center"
            >
              {t("exploreLiteratureHub", "Explore Hub")}
            </Link>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setSuccessItem(null);
            setTitle("");
            setDescription("");
            setBodyText("");
            setAudioFile(null);
          }}
          className="text-xs text-emerald-800 font-bold hover:underline"
        >
          {t("uploadAnotherTrack", "+ Upload Another Track")}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-6 sm:py-10 space-y-8 pb-16">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-emerald-950 via-emerald-900 to-green-950 text-white p-6 sm:p-8 rounded-3xl shadow-md space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-300 uppercase tracking-wider">
          <UploadCloud className="w-4 h-4 text-emerald-400" />
          {t("creatorStudioTitle", "Creator Studio — Audio & Literature Publishing")}
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
          {t("uploadTitle", "Upload Stories, Poems, Folk Tales & Audiobooks")}
        </h1>
        <p className="text-emerald-100/90 text-xs sm:text-sm leading-relaxed max-w-xl">
          {t(
            "creatorStudioDesc",
            "Share your voice or agricultural wisdom with millions of farmers across India. Upload audio tracks or written scripts."
          )}
        </p>
      </div>

      {/* Guest / Demo 1-Click Login Helper */}
      {!user && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-amber-700 flex-shrink-0" />
            <div className="text-xs">
              <strong className="block">{t("demoLoginBanner", "1-Click Instant Demo Logins")}</strong>
              <span>{t("demoLoginBannerDesc", "Test any role instantly without typing credentials:")}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => demoLogin("USER")}
              className="px-3 py-1.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs shadow-sm flex items-center gap-1 whitespace-nowrap"
            >
              <Zap className="w-3.5 h-3.5" /> {t("farmerDemoBtn", "🌾 Farmer Account (Demo)")}
            </button>
            <Link
              to="/login"
              className="px-3 py-1.5 rounded-xl border border-amber-300 text-amber-900 font-bold text-xs hover:bg-amber-100/60 whitespace-nowrap"
            >
              {t("signInTab", "Sign In")}
            </Link>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
          {errorMsg}
        </div>
      )}

      {/* Main Upload Form */}
      <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
        {/* Step 1: Select Format */}
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
            1. {t("selectFormatTitle", "Select Literature Type *")}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { id: "STORY", label: t("storiesTab", "Story"), icon: BookOpen, desc: "Rural lifestyle & inspiring tales" },
              { id: "POEM", label: t("poemsTab", "Poem"), icon: Feather, desc: "Harvest verses & village poetry" },
              { id: "FOLK_TALE", label: t("folkTalesTab", "Folk Tale"), icon: Sparkles, desc: "Ancient wisdom & fables" },
              { id: "AUDIO_BOOK", label: t("audiobooksTab", "Audiobook"), icon: Headphones, desc: "Full chapters & spoken books" },
            ].map((item) => {
              const Icon = item.icon;
              const isSelected = format === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setFormat(item.id as UploadFormat)}
                  className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                    isSelected
                      ? "border-emerald-700 bg-emerald-50/70 ring-2 ring-emerald-600/30 shadow-sm"
                      : "border-gray-200 bg-gray-50/70 hover:bg-white"
                  }`}
                >
                  <Icon className={`w-5 h-5 mb-2 ${isSelected ? "text-emerald-800" : "text-gray-500"}`} />
                  <div>
                    <strong className="block text-xs font-bold text-gray-900">{item.label}</strong>
                    <span className="text-[10px] text-gray-500 leading-snug block mt-0.5">{item.desc}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Audio File Upload / Recording */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
            2. {t("audioUploadLabel", "Audio File / Spoken Voice Track (MP3, WAV, M4A, OGG)")}
          </label>

          <div
            onClick={() => fileInputRef.current?.click()}
            className="cursor-pointer border-2 border-dashed border-emerald-300 hover:border-emerald-600 bg-emerald-50/30 hover:bg-emerald-50/60 p-6 rounded-3xl text-center space-y-2 transition-colors"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".mp3,.m4a,.ogg,.wav,audio/mpeg,audio/mp4,audio/ogg,audio/wav"
              className="hidden"
              onChange={handleAudioFileChange}
            />
            <div className="w-12 h-12 rounded-2xl bg-emerald-700 text-white flex items-center justify-center mx-auto shadow-sm">
              <FileAudio className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-gray-900">
                {audioFile ? `Selected: ${audioFile.name}` : t("audioUploadLabel", "Click or drag your audio file here to upload")}
              </p>
              <p className="text-[11px] text-gray-500 mt-0.5">
                {audioFile
                  ? `Size: ${(audioFile.size / 1024 / 1024).toFixed(2)} MB • Duration: ${Math.floor(
                      audioDurationSec / 60
                    )}m ${audioDurationSec % 60}s`
                  : "Supports MP3, M4A, OGG, WAV recorded from phone or mic (Under 4 MB. Default demo track provided if empty)"}
              </p>
            </div>
          </div>

          {/* Audio Preview Player */}
          <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={togglePreviewPlay}
                className="w-8 h-8 rounded-full bg-emerald-800 text-white flex items-center justify-center shadow-sm hover:bg-emerald-900"
              >
                {isPreviewPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
              </button>
              <span className="font-semibold text-gray-800">
                {audioFile?.name || "KishanVaani Regional Master Track"}
              </span>
            </div>
            <span className="text-gray-500 tabular-nums font-mono">
              {Math.floor(audioDurationSec / 60)}:{(audioDurationSec % 60).toString().padStart(2, "0")}
            </span>
          </div>
        </div>

        {/* Step 3: Title & Author */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
          <div>
            <label className="block font-bold text-gray-700 mb-1">{t("audioTrackTitleLabel", "Title of Work *")}</label>
            <input
              type="text"
              required
              placeholder="e.g. Fasal Ki Sugandh / The River and the Seed"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-3 rounded-xl border border-gray-200 text-gray-900 outline-none focus:border-emerald-700"
            />
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">{t("authorOrNarratorLabel", "Author / Poet / Storyteller *")}</label>
            <input
              type="text"
              required
              placeholder={user?.name || "Your Name"}
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              className="w-full p-3 rounded-xl border border-gray-200 text-gray-900 outline-none focus:border-emerald-700"
            />
          </div>
        </div>

        {/* Step 4: Language & Cover Preset */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
          <div>
            <label className="block font-bold text-gray-700 mb-1">{t("languageSelectLabel", "Language *")}</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 outline-none font-medium"
            >
              <option value="Hindi">Hindi (हिन्दी)</option>
              <option value="English">English</option>
              <option value="Telugu">Telugu (తెలుగు)</option>
              <option value="Punjabi">Punjabi (ਪੰਜਾਬੀ)</option>
              <option value="Marathi">Marathi (मराठी)</option>
              <option value="Tamil">Tamil (தமிழ்)</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">{t("coverArtLabel", "Cover Artwork")}</label>
            <select
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
              className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 outline-none font-medium"
            >
              {presetCovers.map((c) => (
                <option key={c.url} value={c.url}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Step 5: Short Summary */}
        <div>
          <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1">
            {t("shortDescriptionLabel", "Short Summary (1-2 sentences for audio listing card)")}
          </label>
          <textarea
            rows={2}
            placeholder="Brief summary to display in audio recommendations..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-3 rounded-xl border border-gray-200 text-xs sm:text-sm text-gray-900 outline-none focus:border-emerald-700"
          />
        </div>

        {/* Step 6: Full Text / Lyrics / Transcript */}
        <div>
          <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1">
            {t("fullTextTranscriptLabel", "Written Story / Poem Verses / Full Audio Transcript *")}
          </label>
          <textarea
            rows={6}
            required
            placeholder="Write your story, poetry verses, or audiobook script here. Readers will be able to read along in the floating audio player transcript drawer while listening..."
            value={bodyText}
            onChange={(e) => setBodyText(e.target.value)}
            className="w-full p-3.5 rounded-2xl border border-gray-200 text-xs sm:text-sm text-gray-900 outline-none focus:border-emerald-700 leading-relaxed font-sans"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-4 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-sm sm:text-base shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2"
        >
          <UploadCloud className="w-5 h-5" />
          {submitting ? t("publishingAudio", "Publishing Work to KishanVaani...") : t("publishAudioBtn", "Publish Audio to KishanVaani")}
        </button>
      </form>
    </div>
  );
}
