import { useState } from "react";
import { useAudioPlayer } from "../../../context/AudioPlayerContext";
import { useLanguage } from "../../../context/LanguageContext";
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Bookmark,
  Share2,
  FileText,
  SkipBack,
  SkipForward,
  Check,
  X,
} from "lucide-react";

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return "0:00";
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

export default function GlobalAudioPlayer() {
  const {
    currentTrack,
    isPlaying,
    isLoading,
    error,
    currentTime,
    duration,
    volume,
    playbackRate,
    isMuted,
    showTranscript,
    playlist,
    togglePlayPause,
    seek,
    skip,
    setVolume,
    toggleMute,
    setPlaybackRate,
    setShowTranscript,
    toggleTrackBookmark,
    playNext,
    playPrevious,
    clearError,
  } = useAudioPlayer();

  const { t } = useLanguage();

  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!currentTrack) {
    return null;
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleCopyLink = () => {
    const url = window.location.origin + (currentTrack.description ? `/#audio` : `/#audio`);
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `🎧 Listen to "${currentTrack.title}" on KishanVaani - The Audio Platform for Indian Farmers: ${window.location.href}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  };

  return (
    <>
      {/* Transcript Drawer Modal */}
      {showTranscript && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[80vh] flex flex-col shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-emerald-50/50">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-800" />
                <h3 className="font-bold text-gray-900 text-sm sm:text-base">Audio Transcript</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowTranscript(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              <div>
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wide">
                  {currentTrack.category || "Agriculture"}
                </span>
                <h2 className="text-lg font-bold text-gray-900 mt-1">{currentTrack.title}</h2>
                {currentTrack.narrator && (
                  <p className="text-xs text-gray-500 mt-0.5">Narrator: {currentTrack.narrator}</p>
                )}
              </div>

              <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 text-gray-800 text-sm leading-relaxed whitespace-pre-line font-sans">
                {currentTrack.transcript ||
                  "नमस्कार किसान भाइयों! यह ऑडियो किशनवाणी के माध्यम से आपको त्वरित कृषि जानकारी प्रदान करता है। पूरा लेख पढ़ने के लिए विवरण देखें।"}
              </div>
            </div>

            <div className="p-3 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button
                type="button"
                onClick={() => setShowTranscript(false)}
                className="px-4 py-2 bg-emerald-800 text-white rounded-xl text-xs font-semibold hover:bg-emerald-900"
              >
                Close Transcript
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {shareModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-gray-100 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <Share2 className="w-4 h-4 text-emerald-700" /> Share Audio
              </h3>
              <button
                type="button"
                onClick={() => setShareModalOpen(false)}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-gray-600 font-medium line-clamp-2">
              {currentTrack.title}
            </p>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleWhatsAppShare}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors"
              >
                Share on WhatsApp
              </button>

              <button
                type="button"
                onClick={handleCopyLink}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-800 text-xs font-semibold transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : null}
                {copied ? "Link Copied!" : "Copy Audio Link"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Persistent Bottom Audio Player Dock */}
      <div
        className="audio-player audio-player-active"
        role="region"
        aria-label="KishanVaani Audio Player"
      >
        <div className="audio-player-main flex flex-col md:flex-row items-center gap-3 w-full">
          {/* Track Info */}
          <div className="audio-player-info flex-1 min-w-0 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-900/80 border border-emerald-700/50 flex items-center justify-center flex-shrink-0 text-emerald-400">
              <Play className="w-4 h-4 ml-0.5" />
            </div>
            <div className="min-w-0">
              <strong className="text-white text-sm font-bold truncate block">
                {currentTrack.title}
              </strong>
              <div className="flex items-center gap-2 text-[11px] text-emerald-300/80 truncate">
                {currentTrack.category && (
                  <span className="font-semibold text-emerald-400">
                    {currentTrack.category}
                  </span>
                )}
                {currentTrack.narrator && (
                  <span>• {currentTrack.narrator}</span>
                )}
                {isLoading && <span className="text-amber-300">• Loading...</span>}
              </div>
            </div>
          </div>

          {/* Controls: Skip Back, Play/Pause, Skip Forward */}
          <div className="audio-player-controls flex items-center gap-2">
            {playlist.length > 1 && (
              <button
                type="button"
                onClick={playPrevious}
                className="p-1.5 text-gray-400 hover:text-white"
                title="Previous Track"
              >
                <SkipBack className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={() => skip(-10)}
              disabled={isLoading}
              className="p-2 text-gray-300 hover:text-white transition-colors"
              title="Rewind 10 seconds"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              type="button"
              className="audio-play-button w-11 h-11 rounded-full bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold flex items-center justify-center shadow-lg transition-transform active:scale-95"
              onClick={() => {
                clearError();
                void togglePlayPause();
              }}
              disabled={isLoading}
              aria-label={isPlaying ? "Pause audio" : "Play audio"}
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-gray-950 border-t-transparent rounded-full animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current ml-0.5" />
              )}
            </button>

            <button
              type="button"
              onClick={() => skip(10)}
              disabled={isLoading}
              className="p-2 text-gray-300 hover:text-white transition-colors"
              title="Forward 10 seconds"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            {playlist.length > 1 && (
              <button
                type="button"
                onClick={playNext}
                className="p-1.5 text-gray-400 hover:text-white"
                title="Next Track"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Progress Bar and Timestamps */}
          <div className="audio-progress flex items-center gap-2 flex-1 w-full max-w-md">
            <span className="text-xs text-gray-400 tabular-nums">
              {formatTime(currentTime)}
            </span>
            <input
              type="range"
              min="0"
              max={duration || 0}
              step="0.1"
              value={currentTime}
              onChange={(e) => seek(Number(e.target.value))}
              style={{ "--audio-progress": `${progress}%` } as React.CSSProperties}
              disabled={isLoading}
              className="w-full accent-emerald-500"
              aria-label="Seek track"
            />
            <span className="text-xs text-gray-400 tabular-nums">
              {formatTime(duration)}
            </span>
          </div>

          {/* Speed, Volume, Bookmark, Share, Transcript Actions */}
          <div className="flex items-center gap-2">
            {/* Speed Rate Switcher */}
            <button
              type="button"
              onClick={() => {
                const rates = [1, 1.25, 1.5, 2, 0.75];
                const nextRate = rates[(rates.indexOf(playbackRate) + 1) % rates.length];
                setPlaybackRate(nextRate);
              }}
              className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold tracking-tight"
              title="Change playback speed"
            >
              {playbackRate}x
            </button>

            {/* Volume / Mute */}
            <div className="audio-volume hidden sm:flex items-center gap-1.5">
              <button
                type="button"
                onClick={toggleMute}
                className="p-1 text-gray-400 hover:text-white"
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-16 accent-emerald-500"
                aria-label="Volume control"
              />
            </div>

            {/* Bookmark Action */}
            <button
              type="button"
              onClick={toggleTrackBookmark}
              className={`p-2 rounded-lg transition-colors ${
                currentTrack.isBookmarked
                  ? "text-emerald-400 bg-emerald-950/60"
                  : "text-gray-400 hover:text-white hover:bg-white/10"
              }`}
              title={currentTrack.isBookmarked ? "Remove Bookmark" : "Save Bookmark"}
            >
              <Bookmark className={`w-4 h-4 ${currentTrack.isBookmarked ? "fill-current" : ""}`} />
            </button>

            {/* Transcript Drawer Action */}
            <button
              type="button"
              onClick={() => setShowTranscript(true)}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Read Transcript"
            >
              <FileText className="w-4 h-4" />
            </button>

            {/* Share Action */}
            <button
              type="button"
              onClick={() => setShareModalOpen(true)}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Share Audio"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}