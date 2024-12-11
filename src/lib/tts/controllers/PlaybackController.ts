import { IPlaybackController, PlaybackQueue, TTSConfig, TTSEvent, TTSError, PlayMode } from '../domain/types';
import { AudioService } from '../services/AudioService';
import { PlaybackQueueManager } from '../queue/PlaybackQueueManager';
import { TTSEventEmitter } from '../events/TTSEventEmitter';
import { TTSStore } from '../store/TTSStore';

export class PlaybackController implements IPlaybackController {
  private static instance: PlaybackController;
  private audioElement: HTMLAudioElement | null = null;
  private store: TTSStore;
  private eventEmitter: TTSEventEmitter;
  private queueManager: PlaybackQueueManager;
  private audioService: AudioService;
  private currentConfig: TTSConfig;

  private constructor() {
    this.store = TTSStore.getInstance();
    this.eventEmitter = TTSEventEmitter.getInstance();
    this.queueManager = PlaybackQueueManager.getInstance();
    this.audioService = AudioService.getInstance();
    this.currentConfig = this.store.getState().config;
    this.setupEventListeners();
  }

  public static getInstance(): PlaybackController {
    if (!PlaybackController.instance) {
      PlaybackController.instance = new PlaybackController();
    }
    return PlaybackController.instance;
  }

  private setupEventListeners(): void {
    // 监听配置变更
    this.eventEmitter.subscribe(TTSEvent.ConfigChanged, (config: Partial<TTSConfig>) => {
      // 更新当前配置
      this.currentConfig = { ...this.currentConfig, ...config };
      
      // 更新当前播放的音频元素设置
      if (this.audioElement) {
        if (config.rate !== undefined) {
          this.audioElement.playbackRate = config.rate;
        }
        if (config.volume !== undefined) {
          this.audioElement.volume = config.volume;
        }
      }

      // 如果��在播放且语音发生变化，更新队列中的剩余项目
      if (config.voice !== undefined && this.store.getState().playback.isPlaying) {
        this.updateRemainingQueueItems(config);
      }
    });
  }

  private async updateRemainingQueueItems(config: Partial<TTSConfig>): Promise<void> {
    const currentState = this.store.getState();
    const { queue } = currentState;
    
    // 更新当前索引之后的所有项目的配置
    const updatedItems = queue.items.map((item, index) => {
      if (index > queue.currentIndex) {
        return {
          ...item,
          config: { ...item.config, ...config }
        };
      }
      return item;
    });

    // 更新队列
    this.queueManager.initializeQueue(
      updatedItems,
      queue.currentIndex,
      queue.mode
    );
  }

  public async play(queue: PlaybackQueue): Promise<void> {
    try {
      console.log('[PlaybackController] Starting playback with queue:', queue);
      
      // 初始化队列，确保每个项目都有最新的配置
      const itemsWithConfig = queue.items.map(item => ({
        ...item,
        id: item.id || crypto.randomUUID(),
        config: { ...this.currentConfig, ...item.config }
      }));

      // 初始化队列
      this.queueManager.initializeQueue(
        itemsWithConfig,
        queue.currentIndex,
        queue.mode
      );

      // 开始播放当前项
      await this.playCurrentItem();
    } catch (error) {
      console.error('[PlaybackController] Error in play:', error);
      this.handleError(error);
    }
  }

  private async playCurrentItem(): Promise<void> {
    try {
      const currentItem = this.queueManager.getCurrentItem();
      if (!currentItem) {
        console.log('[PlaybackController] No current item to play');
        return;
      }

      // 使用最新的配置
      const itemConfig = { ...this.currentConfig, ...currentItem.config };
      
      // 设置播放状态
      this.store.dispatch({
        type: 'SET_PLAYBACK_STATE',
        payload: { isPlaying: true, isLoading: true }
      });

      // 设置当前播放项
      this.store.dispatch({
        type: 'SET_CURRENT_PLAYING',
        payload: currentItem.id
      });

      // 发送队列变更事件
      this.eventEmitter.emit(TTSEvent.QueueChanged, {
        items: this.queueManager.getItems(),
        currentIndex: this.queueManager.getCurrentIndex()
      });

      // 获取音频
      const audioUrl = await this.audioService.getAudio(
        currentItem.text,
        itemConfig
      );

      // 初始化或重用音频元素
      if (!this.audioElement) {
        this.initializeAudioElement();
      }

      // 设置音频源并应用配置
      this.audioElement!.src = audioUrl;
      this.audioElement!.playbackRate = itemConfig.rate || 1;
      this.audioElement!.volume = itemConfig.volume || 1;

      // 播放音频
      await this.audioElement!.play();
      
      // 更新加载状态
      this.store.dispatch({
        type: 'SET_PLAYBACK_STATE',
        payload: { isLoading: false }
      });

      // 设置播放完成的处理
      this.audioElement!.onended = async () => {
        // 发送当前项完成事件
        this.eventEmitter.emit(TTSEvent.ItemComplete, currentItem);

        // 清除当前播放项
        this.store.dispatch({
          type: 'SET_CURRENT_PLAYING',
          payload: null
        });

        const { mode } = this.store.getState().queue;

        // 处理不同的播放模式
        if (mode === PlayMode.SINGLE) {
          this.stop();
          this.eventEmitter.emit(TTSEvent.PlaybackComplete);
          return;
        }

        // 移动到下一项
        const nextItem = await this.queueManager.moveNext();
        if (nextItem) {
          await this.playCurrentItem();
        } else {
          this.eventEmitter.emit(TTSEvent.PlaybackComplete);
        }
      };

    } catch (error) {
      console.error('[PlaybackController] Error in playCurrentItem:', error);
      this.handleError(error);
    }
  }

  private initializeAudioElement(): void {
    this.audioElement = new Audio();
    this.audioElement.playbackRate = this.store.getState().config.rate;
    this.audioElement.volume = this.store.getState().config.volume;
  }

  private setupAudioEventListeners(): void {
    if (!this.audioElement) return;

    this.audioElement.addEventListener('timeupdate', this.handleTimeUpdate);
    this.audioElement.addEventListener('error', this.handlePlaybackError);
  }

  private cleanupAudioElement(): void {
    if (!this.audioElement) return;

    this.audioElement.removeEventListener('timeupdate', this.handleTimeUpdate);
    this.audioElement.removeEventListener('error', this.handlePlaybackError);
    this.audioElement = null;
  }

  private handleTimeUpdate = () => {
    if (this.audioElement) {
      const currentTime = this.audioElement.currentTime;
      const duration = this.audioElement.duration;
      const progress = (currentTime / duration) * 100;

      this.store.dispatch({
        type: 'SET_PLAYBACK_STATE',
        payload: { 
          progress,
          currentTime,
          duration
        }
      });

      this.eventEmitter.emit(TTSEvent.PlaybackProgress, {
        progress,
        currentTime,
        duration
      });
    }
  };

  private handlePlaybackError = (event: Event) => {
    const error = event instanceof ErrorEvent ? event.error : new Error('Playback error');
    this.handleError(error);
  };

  private handleError(error: any): void {
    console.error('Playback error:', error);
    
    this.store.dispatch({
      type: 'SET_PLAYBACK_STATE',
      payload: { isLoading: false, isPlaying: false }
    });

    const ttsError = error instanceof TTSError
      ? error
      : new TTSError(error.message || 'Unknown playback error', 'PLAYBACK_ERROR');

    this.eventEmitter.emit(TTSEvent.PlaybackError, ttsError);
  }

  public pause(): void {
    if (this.audioElement && !this.audioElement.paused) {
      this.audioElement.pause();
      this.store.dispatch({
        type: 'SET_PLAYBACK_STATE',
        payload: { isPlaying: false }
      });
      this.eventEmitter.emit(TTSEvent.PlaybackPaused);
    }
  }

  public resume(): void {
    if (this.audioElement && this.audioElement.paused) {
      this.audioElement.play();
      this.store.dispatch({
        type: 'SET_PLAYBACK_STATE',
        payload: { isPlaying: true }
      });
      this.eventEmitter.emit(TTSEvent.PlaybackStarted);
    }
  }

  public stop(): void {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
      this.cleanupAudioElement();
    }

    this.store.dispatch({
      type: 'SET_PLAYBACK_STATE',
      payload: { isPlaying: false, progress: 0 }
    });

    this.eventEmitter.emit(TTSEvent.PlaybackStopped);
  }

  public setConfig(config: Partial<TTSConfig>): void {
    this.store.dispatch({
      type: 'SET_CONFIG',
      payload: config
    });
    this.eventEmitter.emit(TTSEvent.ConfigChanged, this.store.getState().config);
  }
}
