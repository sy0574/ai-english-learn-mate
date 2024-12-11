import { PlayMode } from '@/types';

// 使用统一的 PlayMode 类型
export { PlayMode };

// TTS 配置相关
export interface TTSConfig {
  voice: string;
  rate: number;
  volume: number;
  fontSizeScale: number;
  highlightColor: string;
}

// 播放状态相关
export interface PlaybackState {
  isPlaying: boolean;
  isLoading: boolean;
  progress: number;
  currentTime?: number;
  duration?: number;
  error: Error | null;
}

// 播放队列相关
export interface QueueItem {
  text: string;
  id: string;
  config: TTSConfig;
  element?: HTMLElement;
}

export interface PlaybackQueue {
  items: QueueItem[];
  currentIndex: number;
  mode: PlayMode;
}

// 事件相关
export enum TTSEvent {
  PlaybackStarted = 'playback_started',
  PlaybackPaused = 'playback_paused',
  PlaybackResumed = 'playback_resumed',
  PlaybackStopped = 'playback_stopped',
  PlaybackComplete = 'playback_complete',
  PlaybackError = 'playback_error',
  PlaybackProgress = 'playback_progress',
  ConfigChanged = 'config_changed',
  QueueChanged = 'queue_changed',
  ItemComplete = 'item_complete'
}

// Store 相关
export interface TTSState {
  config: TTSConfig;
  queue: PlaybackQueue;
  playback: PlaybackState;
  currentPlayingId: string | null;
}

export type TTSAction = 
  | { type: 'SET_CONFIG'; payload: Partial<TTSConfig> }
  | { type: 'SET_QUEUE'; payload: Partial<Omit<PlaybackQueue, 'mode'>> & { mode?: PlayMode } }
  | { type: 'SET_PLAYBACK_STATE'; payload: Partial<PlaybackState> }
  | { type: 'SET_CURRENT_PLAYING'; payload: string | null }
  | { type: 'RESET' };

// 服务接口
export interface IAudioService {
  getAudio(text: string, config: TTSConfig): Promise<string>;
  preloadAudio(text: string, config: TTSConfig): Promise<void>;
  cleanup(): void;
}

export interface IEventEmitter {
  emit<T = any>(event: TTSEvent, data?: T): void;
  subscribe<T = any>(event: TTSEvent, callback: (data?: T) => void): () => void;
}

export interface IStateManager {
  getState(): TTSState;
  dispatch(action: TTSAction): void;
  subscribe(callback: (state: TTSState) => void): () => void;
}

export interface IPlaybackController {
  play(queue: PlaybackQueue): Promise<void>;
  pause(): void;
  resume(): void;
  stop(): void;
  setConfig(config: Partial<TTSConfig>): void;
}

// 错误相关
export class TTSError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'TTSError';
  }
}
