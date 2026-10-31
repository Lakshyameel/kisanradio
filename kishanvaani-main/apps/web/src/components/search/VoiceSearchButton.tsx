import { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

interface VoiceSearchButtonProps {
  onSearch: (query: string) => void;
  className?: string;
}

// Language to SpeechRecognition locale code
const SPEECH_LANG_MAP: Record<string, string> = {
  hi: "hi-IN",
  te: "te-IN",
  ta: "ta-IN",
  mr: "mr-IN",
  pa: "pa-IN",
  en: "en-IN",
};

export default function VoiceSearchButton({ onSearch, className = "" }: VoiceSearchButtonProps) {
  const { language } = useLanguage();
  const [isListening, setIsListening] = useState(false);
  const [hasSupport, setHasSupport] = useState(true);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setHasSupport(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0]?.[0]?.transcript;
      if (transcript && transcript.trim() !== "") {
        onSearch(transcript.trim());
      }
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      console.warn("Speech recognition error:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.abort();
      } catch {
        // Ignore abort errors on cleanup
      }
    };
  }, [onSearch]);

  const toggleListening = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!hasSupport || !recognitionRef.current) {
      alert(
        language === "hi"
          ? "आपके ब्राउज़र में आवाज़ से खोजने की सुविधा उपलब्ध नहीं है।"
          : "Voice recognition is not supported in your browser."
      );
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        const targetLocale = SPEECH_LANG_MAP[language] || "hi-IN";
        recognitionRef.current.lang = targetLocale;
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.warn("Speech recognition start failed:", err);
        setIsListening(false);
      }
    }
  };

  if (!hasSupport) return null;

  return (
    <>
      <button
        type="button"
        onClick={toggleListening}
        aria-label={isListening ? "Listening, tap to cancel voice search" : "Search with voice"}
        aria-pressed={isListening}
        title={language === "hi" ? "आवाज़ से खोजें" : "Search with voice"}
        className={`p-2.5 rounded-xl flex items-center justify-center transition-all ${
          isListening
            ? "bg-red-500 text-white animate-pulse ring-4 ring-red-200"
            : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 hover:text-emerald-900 border border-emerald-200"
        } ${className}`}
      >
        {isListening ? (
          <Mic className="w-5 h-5 animate-bounce" />
        ) : (
          <Mic className="w-5 h-5" />
        )}
      </button>

      {/* Spoken Query Active Overlay for Farmers */}
      {isListening && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-gray-900/95 text-white px-6 py-4 rounded-3xl shadow-2xl border border-gray-700 flex items-center gap-3 animate-fadeIn backdrop-blur-md"
        >
          <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center text-white animate-pulse">
            <Mic className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-bold">
              {language === "hi" ? "सुन रहे हैं... बोलिए" : "Listening... Speak now"}
            </p>
            <p className="text-xs text-gray-300">
              {language === "hi"
                ? "जैसे: 'गेहूं का मंडी भाव', 'आज का मौसम'"
                : "e.g., 'Wheat mandi price', 'Today weather'"}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
