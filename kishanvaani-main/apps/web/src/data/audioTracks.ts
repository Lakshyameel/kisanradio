import type { AudioTrack } from "../context/AudioPlayerContext";

export interface AudioLibraryTrack extends AudioTrack {
  category: string;
  language: string;
  speaker?: string;
}

export const audioTracks: AudioLibraryTrack[] = [];