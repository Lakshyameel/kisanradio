import React, { useState, useEffect } from "react";
import { Volume2, VolumeX, Loader2 } from "lucide-react";
import { speakText, stopSpeaking, isSpeechSynthesisSupported } from "../../utils/speech";
import { useLanguage } from "../../context/LanguageContext";

interface TapToHearButtonProps {
  text: string;
  label?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  iconOnly?: boolean;
}

export default function TapToHearButton({
  text,
  label,
  size = "md",
  className = "",
  iconOnly = false,
}: TapToHearButtonProps) {
  const { language } = useLanguage();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const supported = isSpeechSynthesisSupported();

  useEffect(() => {
    return () => {
      // Stop speech when component unmounts
      if (isSpeaking) {
        stopSpeaking();
      }
    };
  }, [isSpeaking]);

  if (!supported) return null;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering parent card clicks

    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      speakText(
        text,
        language,
        () => setIsSpeaking(true),
        () => setIsSpeaking(false)
      );
    }
  };

  const defaultLabel = isSpeaking
    ? language === "hi"
      ? "रुकें"
      : "Stop"
    : label || (language === "hi" ? "बोलकर सुनें" : "Listen");

  const sizeClasses = {
    sm: "px-2 py-1 text-[11px] gap-1 rounded-lg",
    md: "px-3 py-1.5 text-xs gap-1.5 rounded-xl",
    lg: "px-4 py-2.5 text-sm gap-2 rounded-2xl font-bold",
  }[size];

  const iconSizes = {
    sm: "w-3.5 h-3.5",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  }[size];

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={isSpeaking ? "Stop audio speech" : "Tap to listen to this information out loud"}
      aria-pressed={isSpeaking}
      title={isSpeaking ? "रुकें / Stop" : "बोलकर सुनें / Listen"}
      className={`inline-flex items-center justify-center font-bold transition-all shadow-sm active:scale-95 border ${
        isSpeaking
          ? "bg-amber-500 hover:bg-amber-600 border-amber-600 text-white animate-pulse"
          : "bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-800"
      } ${sizeClasses} ${className}`}
    >
      {isSpeaking ? (
        <VolumeX className={`${iconSizes} flex-shrink-0 animate-bounce`} />
      ) : (
        <Volume2 className={`${iconSizes} flex-shrink-0 text-emerald-700`} />
      )}
      {!iconOnly && <span>{defaultLabel}</span>}
    </button>
  );
}
