import { useState, useEffect } from "react";
import { Download, X, WifiOff, Sparkles } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

export default function InstallPromptBanner() {
  const { t, language } = useLanguage();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    // Monitor online/offline state
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Capture PWA install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);

      // Check if dismissed recently (past 3 days)
      const dismissedAt = localStorage.getItem("kv_pwa_prompt_dismissed");
      if (dismissedAt) {
        const diffDays = (Date.now() - Number(dismissedAt)) / (1000 * 60 * 60 * 24);
        if (diffDays < 3) return;
      }
      setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem("kv_pwa_prompt_dismissed", String(Date.now()));
  };

  return (
    <>
      {/* Offline Status Ribbon */}
      {isOffline && (
        <div className="bg-amber-600 text-white text-xs font-bold py-1.5 px-4 flex items-center justify-center gap-2 shadow-sm animate-pulse">
          <WifiOff className="w-4 h-4 flex-shrink-0" />
          <span>
            {language === "hi"
              ? "आप ऑफ़लाइन हैं — सहेजे गए समाचार, मंडी भाव और मौसम रिपोर्ट दिख रहे हैं"
              : "You are offline — viewing cached news, mandi prices & weather reports"}
          </span>
        </div>
      )}

      {/* PWA Install Prompt Banner */}
      {showBanner && (
        <aside
          aria-label="Install KishanVaani App"
          className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white px-4 py-3 shadow-lg border-b border-emerald-700/50 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-50 animate-fadeIn"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-emerald-950 flex items-center justify-center font-black shadow-md flex-shrink-0">
              <Sparkles className="w-5 h-5 text-emerald-900" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold tracking-tight">
                {language === "hi"
                  ? "किसानवाणी ऐप अपने फोन पर जोड़ें"
                  : "Add KishanVaani to Home Screen"}
              </p>
              <p className="text-[11px] text-emerald-200">
                {language === "hi"
                  ? "1-टैप में सीधे खोलें और बिना इंटरनेट भी मौसम व भाव देखें"
                  : "1-Tap fast access & browse mandi rates even without internet"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={handleInstallClick}
              className="flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-emerald-950 font-bold px-3.5 py-1.5 rounded-xl text-xs shadow transition-transform active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{language === "hi" ? "ऐप इंस्टॉल करें" : "Install App"}</span>
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Dismiss install prompt"
              className="p-1.5 text-emerald-300 hover:text-white rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </aside>
      )}
    </>
  );
}
