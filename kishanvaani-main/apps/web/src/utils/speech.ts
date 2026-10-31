import { LanguageCode } from "../context/LanguageContext";

const LANG_VOICE_MAP: Record<LanguageCode, string> = {
  hi: "hi-IN",
  te: "te-IN",
  ta: "ta-IN",
  mr: "mr-IN",
  pa: "pa-IN",
  en: "en-IN",
};

let currentUtterance: SpeechSynthesisUtterance | null = null;

export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/**
 * Preprocess agricultural text for smooth text-to-speech pronunciation
 */
function sanitizeForSpeech(text: string): string {
  return text
    .replace(/<[^>]*>?/gm, "") // Strip HTML tags
    .replace(/[#*_`~]/g, "") // Strip markdown
    .replace(/₹\s*([0-9,]+)/g, "$1 रुपये") // Replace ₹ with rupees
    .replace(/Qtl/gi, "क्विंटल")
    .replace(/APMC/gi, "मंडी")
    .trim();
}

/**
 * Speak text in the specified language using the browser's native speech synthesis
 */
export function speakText(
  text: string,
  lang: LanguageCode = "hi",
  onStart?: () => void,
  onEnd?: () => void
): boolean {
  if (!isSpeechSynthesisSupported()) {
    console.warn("Speech synthesis not supported in this browser");
    return false;
  }

  // Cancel any ongoing speech
  stopSpeaking();

  const cleanText = sanitizeForSpeech(text);
  if (!cleanText) return false;

  const utterance = new SpeechSynthesisUtterance(cleanText);
  const targetLocale = LANG_VOICE_MAP[lang] || "hi-IN";
  utterance.lang = targetLocale;
  utterance.rate = 0.95; // Slightly slower, clear rate suited for rural advisory
  utterance.pitch = 1.0;

  // Try to find a matching voice if voices are loaded
  const voices = window.speechSynthesis.getVoices();
  const matchingVoice = voices.find(
    (v) => v.lang.toLowerCase() === targetLocale.toLowerCase() || v.lang.startsWith(targetLocale.split("-")[0])
  );
  if (matchingVoice) {
    utterance.voice = matchingVoice;
  }

  utterance.onstart = () => {
    onStart?.();
  };

  utterance.onend = () => {
    currentUtterance = null;
    onEnd?.();
  };

  utterance.onerror = () => {
    currentUtterance = null;
    onEnd?.();
  };

  currentUtterance = utterance;
  window.speechSynthesis.speak(utterance);
  return true;
}

export function stopSpeaking(): void {
  if (isSpeechSynthesisSupported()) {
    window.speechSynthesis.cancel();
    currentUtterance = null;
  }
}

export function isCurrentlySpeaking(): boolean {
  if (!isSpeechSynthesisSupported()) return false;
  return window.speechSynthesis.speaking;
}
