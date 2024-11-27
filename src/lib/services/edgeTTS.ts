import { TTSService, TTSOptions, TTSPlaybackState, TTSVoiceType, TTSError } from '../types/tts';
import { DEFAULT_TTS_CONFIG, TTS_VOICES, TTS_ERRORS } from '../config/ttsConfig';
import edge from 'edge-tts';

export class EdgeTTSService implements TTSService {
  private currentAudio: HTMLAudioElement | null = null;
  private state: TTSPlaybackState = {
    isPlaying: false,
    currentText: '',
    currentVoice: DEFAULT_TTS_CONFIG.voice,
    progress: 0,
    loopMode: 'none',
    loopCount: 1,
    currentLoopCount: 0
  };

  private constructor() {
    // 私有构造函数，使用getInstance创建实例
  }

  private static instance: EdgeTTSService | null = null;

  public static getInstance(): EdgeTTSService {
    if (!EdgeTTSService.instance) {
      EdgeTTSService.instance = new EdgeTTSService();
    }
    return EdgeTTSService.instance;
  }

  async initialize(): Promise<void> {
    try {
      // 验证环境
      if (typeof window === 'undefined' || !window.Audio) {
        throw new TTSError(TTS_ERRORS.UNSUPPORTED, 'UNSUPPORTED');
      }
    } catch (error) {
      throw new TTSError(
        TTS_ERRORS.INITIALIZATION,
        'INITIALIZATION',
        error
      );
    }
  }

  async speak(text: string, options: TTSOptions = {}): Promise<void> {
    try {
      this.stop();
      
      const voice = options.voice || this.state.currentVoice;
      const loopMode = options.loopMode || 'none';
      const loopCount = options.loopCount || 1;
      
      this.state.currentText = text;
      this.state.currentVoice = voice;
      this.state.loopMode = loopMode;
      this.state.loopCount = loopCount;
      this.state.currentLoopCount = 0;
      
      const communicator = new edge.Communicator(text, voice);
      const audioData = await communicator.stream();
      
      if (this.currentAudio) {
        this.currentAudio.pause();
      }
      
      const blob = new Blob([audioData], { type: 'audio/mp3' });
      const url = URL.createObjectURL(blob);
      
      this.currentAudio = new Audio(url);
      
      if (options.rate) this.currentAudio.playbackRate = options.rate;
      if (options.volume) this.currentAudio.volume = options.volume;
      
      this.currentAudio.ontimeupdate = () => {
        if (this.currentAudio) {
          this.state.progress = (this.currentAudio.currentTime / this.currentAudio.duration) * 100;
        }
      };
      
      // 添加循环播放事件监听
      this.currentAudio.addEventListener('ended', () => {
        this.state.currentLoopCount++;
        if (this.state.loopMode !== 'none' && 
            (this.state.loopCount === -1 || this.state.currentLoopCount < this.state.loopCount)) {
          this.currentAudio?.play();
        } else {
          this.state.isPlaying = false;
          this.state.currentLoopCount = 0;
          URL.revokeObjectURL(url);
        }
      });

      this.currentAudio.onerror = (error) => {
        this.state.isPlaying = false;
        URL.revokeObjectURL(url);
        throw new TTSError(TTS_ERRORS.PLAYBACK, 'PLAYBACK', error);
      };
      
      await this.currentAudio.play();
      this.state.isPlaying = true;
    } catch (error) {
      throw new TTSError(
        TTS_ERRORS.NETWORK,
        'NETWORK',
        error
      );
    }
  }

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
      this.state.currentLoopCount = 0;
    }
  }

  getState(): TTSPlaybackState {
    return { ...this.state };
  }

  setVoice(voice: TTSVoiceType): void {
    if (!Object.values(TTS_VOICES.US).includes(voice as any) && 
        !Object.values(TTS_VOICES.GB).includes(voice as any)) {
      throw new TTSError(TTS_ERRORS.INVALID_VOICE, 'INVALID_VOICE');
    }
    this.state.currentVoice = voice;
  }

  async getAvailableVoices(): Promise<TTSVoiceType[]> {
    return [
      ...Object.values(TTS_VOICES.US),
      ...Object.values(TTS_VOICES.GB)
    ] as TTSVoiceType[];
  }
}
