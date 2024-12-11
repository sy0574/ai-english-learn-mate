import { TTSService, TTSOptions, TTSPlaybackState } from '../types/tts';
import { DEFAULT_TTS_CONFIG } from '../config/ttsConfig';

export abstract class BaseTTSService implements TTSService {
  protected state: TTSPlaybackState;
  protected currentAudio: HTMLAudioElement | null = null;

  constructor() {
    this.state = {
      isPlaying: false,
      currentText: '',
      currentVoice: DEFAULT_TTS_CONFIG.voice,
      progress: 0,
      rate: 1,
      volume: 1
    };
  }

  abstract speak(text: string, options?: TTSOptions): Promise<void>;
  abstract initialize(): Promise<void>;
  abstract getAvailableVoices(): Promise<string[]>;
  
  pause(): void {
    if (this.currentAudio && this.state.isPlaying) {
      this.currentAudio.pause();
      this.state.isPlaying = false;
    }
  }

  resume(): void {
    if (this.currentAudio && !this.state.isPlaying) {
      this.currentAudio.play();
      this.state.isPlaying = true;
    }
  }

  stop(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.state.isPlaying = false;
      this.state.progress = 0;
    }
  }

  getState(): TTSPlaybackState {
    return { ...this.state };
  }

  protected handleAudioProgress = () => {
    if (this.currentAudio) {
      this.state.progress = (this.currentAudio.currentTime / this.currentAudio.duration) * 100;
    }
  };

  protected cleanup() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.src = '';
      this.currentAudio.load();
      this.currentAudio = null;
    }
  }
}
