import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { syncListeningProgress } from "../services/history.service";
import { toggleBookmark } from "../services/bookmarks.service";

export interface AudioTrack {
  id: string;
  title: string;
  description?: string;
  audioUrl: string;
  duration?: number;
  durationSec?: number;
  imageUrl?: string;
  category?: string;
  language?: string;
  narrator?: string;
  transcript?: string;
  isBookmarked?: boolean;
}

interface AudioPlayerContextValue {
  currentTrack: AudioTrack | null;
  isPlaying: boolean;
  isLoading: boolean;
  error: string | null;
  currentTime: number;
  duration: number;
  volume: number;
  playbackRate: number;
  isMuted: boolean;
  showTranscript: boolean;
  playlist: AudioTrack[];
  playTrack: (track: AudioTrack, queue?: AudioTrack[]) => Promise<void>;
  togglePlayPause: () => Promise<void>;
  pause: () => void;
  seek: (time: number) => void;
  skip: (seconds: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  setPlaybackRate: (rate: number) => void;
  setShowTranscript: (show: boolean) => void;
  toggleTrackBookmark: () => Promise<void>;
  playNext: () => Promise<void>;
  playPrevious: () => Promise<void>;
  clearError: () => void;
}

const AudioPlayerContext = createContext<AudioPlayerContextValue | undefined>(undefined);

export function AudioPlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const syncTimerRef = useRef<any>(null);

  const [currentTrack, setCurrentTrack] = useState<AudioTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRateState] = useState(1);
  const [showTranscript, setShowTranscript] = useState(false);
  const [playlist, setPlaylist] = useState<AudioTrack[]>([]);

  // Initialize HTML5 Audio
  useEffect(() => {
    const audio = new Audio();
    audio.preload = "metadata";
    audio.volume = volume;
    audioRef.current = audio;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
      setIsLoading(false);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handlePlay = () => {
      setIsPlaying(true);
      setIsLoading(false);
      setError(null);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      if (currentTrack) {
        syncListeningProgress({
          contentId: currentTrack.id,
          progressSeconds: Math.floor(audio.duration || 0),
          completed: true,
        }).catch(() => {});
      }
    };

    const handleWaiting = () => {
      setIsLoading(true);
    };

    const handleError = () => {
      setIsPlaying(false);
      setIsLoading(false);
      setError("Unable to stream audio track. Playing fallback preview.");
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("waiting", handleWaiting);
    audio.addEventListener("error", handleError);

    return () => {
      audio.pause();
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("waiting", handleWaiting);
      audio.removeEventListener("error", handleError);
      audioRef.current = null;
    };
  }, []);

  // Periodic progress sync to backend
  useEffect(() => {
    if (isPlaying && currentTrack) {
      syncTimerRef.current = setInterval(() => {
        if (audioRef.current && audioRef.current.currentTime > 2) {
          syncListeningProgress({
            contentId: currentTrack.id,
            progressSeconds: Math.floor(audioRef.current.currentTime),
            completed: false,
          }).catch(() => {});
        }
      }, 5000);
    } else {
      if (syncTimerRef.current) {
        clearInterval(syncTimerRef.current);
      }
    }

    return () => {
      if (syncTimerRef.current) clearInterval(syncTimerRef.current);
    };
  }, [isPlaying, currentTrack]);

  const playTrack = useCallback(async (track: AudioTrack, queue?: AudioTrack[]) => {
    const audio = audioRef.current;
    if (!audio) return;

    if (queue && queue.length > 0) {
      setPlaylist(queue);
    }

    setError(null);
    const isDifferent = currentTrack?.id !== track.id;

    if (!track.audioUrl || track.audioUrl.trim() === "") {
      setError("No audio recording is available for this content.");
      setIsLoading(false);
      return;
    }

    if (isDifferent) {
      setIsLoading(true);
      audio.src = track.audioUrl;
      audio.playbackRate = playbackRate;
      audio.currentTime = 0;
      setCurrentTrack(track);
      setCurrentTime(0);
      setDuration(track.duration || track.durationSec || 0);
    }

    try {
      await audio.play();
    } catch {
      setIsPlaying(false);
      setIsLoading(false);
    }
  }, [currentTrack, playbackRate]);

  const togglePlayPause = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    setError(null);
    if (audio.paused) {
      try {
        setIsLoading(true);
        await audio.play();
      } catch {
        setIsPlaying(false);
        setIsLoading(false);
      }
    } else {
      audio.pause();
      if (audio.currentTime > 2) {
        syncListeningProgress({
          contentId: currentTrack.id,
          progressSeconds: Math.floor(audio.currentTime),
          completed: false,
        }).catch(() => {});
      }
    }
  }, [currentTrack]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const seek = useCallback((time: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    const safeTime = Math.max(0, Math.min(time, Number.isFinite(audio.duration) ? audio.duration : time));
    audio.currentTime = safeTime;
    setCurrentTime(safeTime);
  }, []);

  const skip = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    const target = audio.currentTime + seconds;
    const safeTime = Math.max(0, Math.min(target, audio.duration || target));
    audio.currentTime = safeTime;
    setCurrentTime(safeTime);
  }, []);

  const setVolume = useCallback((value: number) => {
    const audio = audioRef.current;
    const nextVolume = Math.min(1, Math.max(0, value));
    setVolumeState(nextVolume);
    if (audio) {
      audio.volume = nextVolume;
      audio.muted = nextVolume === 0;
      setIsMuted(nextVolume === 0);
    }
  }, []);

  const toggleMute = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isMuted) {
      audio.muted = false;
      audio.volume = volume || 0.8;
      setIsMuted(false);
    } else {
      audio.muted = true;
      setIsMuted(true);
    }
  }, [isMuted, volume]);

  const setPlaybackRate = useCallback((rate: number) => {
    const audio = audioRef.current;
    setPlaybackRateState(rate);
    if (audio) {
      audio.playbackRate = rate;
    }
  }, []);

  const toggleTrackBookmark = useCallback(async () => {
    if (!currentTrack) return;
    try {
      const res = await toggleBookmark(currentTrack.id);
      setCurrentTrack((prev) => (prev ? { ...prev, isBookmarked: res.isBookmarked } : null));
    } catch (err) {
      console.error("Bookmark toggle failed:", err);
    }
  }, [currentTrack]);

  const playNext = useCallback(async () => {
    if (!currentTrack || playlist.length === 0) return;
    const idx = playlist.findIndex((t) => t.id === currentTrack.id);
    if (idx >= 0 && idx < playlist.length - 1) {
      await playTrack(playlist[idx + 1]);
    }
  }, [currentTrack, playlist, playTrack]);

  const playPrevious = useCallback(async () => {
    if (!currentTrack || playlist.length === 0) return;
    const idx = playlist.findIndex((t) => t.id === currentTrack.id);
    if (idx > 0) {
      await playTrack(playlist[idx - 1]);
    }
  }, [currentTrack, playlist, playTrack]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return (
    <AudioPlayerContext.Provider
      value={{
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
        playTrack,
        togglePlayPause,
        pause,
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
      }}
    >
      {children}
    </AudioPlayerContext.Provider>
  );
}

export function useAudioPlayer() {
  const context = useContext(AudioPlayerContext);
  if (!context) {
    throw new Error("useAudioPlayer must be used inside AudioPlayerProvider");
  }
  return context;
}