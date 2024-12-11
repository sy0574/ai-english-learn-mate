import { TTS_VOICES } from '../config/ttsConfig';

export type PlayMode = 'single' | 'continuous' | 'loop';

export type TTSVoiceType = typeof TTS_VOICES.US[keyof typeof TTS_VOICES.US] | typeof TTS_VOICES.GB[keyof typeof TTS_VOICES.GB];

export interface TTSOptions {
  voice?: TTSVoiceType;
  rate?: number;
  volume?: number;
  pitch?: number;
  language?: string;
  playMode?: PlayMode;
  onComplete?: () => void;
  onError?: (error: Error) => void;
}

export interface TTSPlaybackState {
  isPlaying: boolean;
  isLoading: boolean;
  currentText: string;
  currentVoice: TTSVoiceType;
  progress: number; // 0-100
  rate: number;
  volume: number;
  playMode: PlayMode;
}

export interface TTSService {
  initialize(): Promise<void>;
  speak(text: string, options?: TTSOptions): Promise<void>;
  pause(): void;
  resume(): void;
  stop(): void;
  getState(): TTSPlaybackState;
  setVoice(voice: TTSVoiceType): void;
  getAvailableVoices(): Promise<TTSVoiceType[]>;
}

export class TTSError extends Error {
  constructor(
    message: string,
    public readonly code: keyof typeof import('../config/ttsConfig').TTS_ERRORS,
    public readonly originalError?: unknown
  ) {
    super(message);
    this.name = 'TTSError';
  }
}
