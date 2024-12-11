import { PlaybackState, TTSConfig, PlayMode, PlaybackOptions, TTSEvent } from './types';
import AudioDomain from './AudioDomain';
import EventBus from './EventBus';
import TTSMonitor from '../monitoring/TTSMonitor';

export class PlaybackDomain {
  private static instance: PlaybackDomain;
  private audioElement: HTMLAudioElement | null = null;
  private currentState: PlaybackState = {
    isLoading: false,
    isPlaying: false,
    progress: 0
  };
  private config: TTSConfig;
  private playMode: PlayMode = 'single';
  private textQueue: string[] = [];
  private currentIndex: number = 0;
  private startIndex: number = 0;
  private playbackOptions?: PlaybackOptions;

  private constructor() {
    this.config = {
      voice: 'en-US-ChristopherNeural',
      rate: 1.0,
      volume: 1.0
    };
  }

  public static getInstance(): PlaybackDomain {
    if (!PlaybackDomain.instance) {
      PlaybackDomain.instance = new PlaybackDomain();
    }
    return PlaybackDomain.instance;
  }

  public getState(): PlaybackState {
    return { ...this.currentState };
  }

  public getConfig(): TTSConfig {
    return { ...this.config };
  }

  public setConfig(newConfig: Partial<TTSConfig>): void {
    this.config = { ...this.config, ...newConfig };
    EventBus.getInstance().emit(TTSEvent.ConfigChanged, this.config);
  }

  public setPlayMode(mode: PlayMode): void {
    this.playMode = mode;
  }

  private updateState(newState: Partial<PlaybackState>): void {
    this.currentState = { ...this.currentState, ...newState };
    EventBus.getInstance().emit(TTSEvent.PlaybackProgress, this.currentState);
  }

  public async play(text: string | string[], startIndex: number = 0, options?: PlaybackOptions): Promise<void> {
    const monitor = TTSMonitor.getInstance();
    const startTime = Date.now();

    try {
      // 停止当前播放
      this.stop();

      // 保存播放选项
      this.playbackOptions = options;

      // 准备播放队列
      this.textQueue = Array.isArray(text) ? text : [text];
      this.startIndex = startIndex;
      this.currentIndex = startIndex;

      // 检查索引是否有效
      if (this.currentIndex < 0 || this.currentIndex >= this.textQueue.length) {
        throw new Error('Invalid start index');
      }

      await this.playNext();

      // 记录播放延迟
      const latency = Date.now() - startTime;
      monitor.recordPlaybackLatency(latency);
    } catch (error) {
      this.handleError(error);
    }
  }

  private async playNext(): Promise<void> {
    // 检查是否需要重置索引（循环模式）或停止播放
    if (this.currentIndex >= this.textQueue.length) {
      if (this.playMode === 'loop') {
        // 循环模式：重置到开始位置
        this.currentIndex = this.startIndex;
      } else if (this.playMode === 'continuous' || this.playMode === 'single') {
        // 连续模式或单曲模式：播放完成后停止
        this.stop();
        this.playbackOptions?.onComplete?.();
        return;
      }
    }

    const text = this.textQueue[this.currentIndex];
    if (!text) return;

    try {
      this.updateState({ isLoading: true });
      const audioUrl = await AudioDomain.getInstance().getAudio(text, this.config);
      
      // 如果在加载过程中停止了播放，就不继续了
      if (!this.currentState.isLoading) return;

      if (this.audioElement) {
        this.audioElement.pause();
        this.cleanupAudioElement();
      }

      this.audioElement = new Audio(audioUrl);
      this.audioElement.playbackRate = this.config.rate;
      this.audioElement.volume = this.config.volume;

      // 设置事件监听器
      this.setupAudioEventListeners();

      await this.audioElement.play();
      this.updateState({ isLoading: false, isPlaying: true });
      EventBus.getInstance().emit(TTSEvent.PlaybackStarted, { text });
    } catch (error) {
      this.handleError(error);
    }
  }

  private setupAudioEventListeners(): void {
    if (!this.audioElement) return;

    this.audioElement.addEventListener('ended', this.handlePlaybackComplete);
    this.audioElement.addEventListener('timeupdate', this.handleTimeUpdate);
    this.audioElement.addEventListener('error', this.handlePlaybackError);
  }

  private cleanupAudioElement(): void {
    if (!this.audioElement) return;

    this.audioElement.removeEventListener('ended', this.handlePlaybackComplete);
    this.audioElement.removeEventListener('timeupdate', this.handleTimeUpdate);
    this.audioElement.removeEventListener('error', this.handlePlaybackError);
    this.audioElement = null;
  }

  private handlePlaybackComplete = async () => {
    // 根据播放模式决定下一步操作
    switch (this.playMode) {
      case 'single':
        // 单曲模式：播放完当前就停止
        this.stop();
        this.playbackOptions?.onComplete?.();
        break;

      case 'continuous':
        // 连续模式：从当前位置播放到最后
        this.currentIndex++;
        if (this.currentIndex >= this.textQueue.length) {
          // 已经播放到最后，停止并触发完成回调
          this.stop();
          this.playbackOptions?.onComplete?.();
        } else {
          // 继续播放下一个
          await this.playNext();
        }
        break;

      case 'loop':
        // 循环模式：循环播放整个队列
        this.currentIndex++;
        if (this.currentIndex >= this.textQueue.length) {
          this.currentIndex = this.startIndex;
        }
        await this.playNext();
        break;
    }
  };

  private handleTimeUpdate = () => {
    if (this.audioElement) {
      const progress = (this.audioElement.currentTime / this.audioElement.duration) * 100;
      this.updateState({ progress });
      this.playbackOptions?.onProgress?.(progress);
    }
  };

  private handlePlaybackError = (event: Event) => {
    const error = event instanceof ErrorEvent ? event.error : new Error('Playback error');
    this.handleError(error);
  };

  private handleError(error: any) {
    console.error('Playback error:', error);
    this.updateState({ isLoading: false, isPlaying: false });
    EventBus.getInstance().emit(TTSEvent.PlaybackError, error);
    this.playbackOptions?.onError?.(error);
  }

  public pause(): void {
    if (this.audioElement && this.currentState.isPlaying) {
      this.audioElement.pause();
      this.updateState({ isPlaying: false });
      EventBus.getInstance().emit(TTSEvent.PlaybackPaused);
    }
  }

  public resume(): void {
    if (this.audioElement && !this.currentState.isPlaying) {
      this.audioElement.play();
      this.updateState({ isPlaying: true });
      EventBus.getInstance().emit(TTSEvent.PlaybackStarted);
    }
  }

  public stop(): void {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
      this.cleanupAudioElement();
    }
    this.updateState({ isPlaying: false, progress: 0 });
    EventBus.getInstance().emit(TTSEvent.PlaybackStopped);
  }

  public cleanup(): void {
    this.stop();
    this.playbackOptions = undefined;
    this.textQueue = [];
    this.currentIndex = 0;
    this.startIndex = 0;
    AudioDomain.getInstance().cleanup();
  }
}

export default PlaybackDomain;
