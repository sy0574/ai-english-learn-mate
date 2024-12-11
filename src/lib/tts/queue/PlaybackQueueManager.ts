import { QueueItem, PlayMode, TTSEvent } from '../domain/types';
import { TTSEventEmitter } from '../events/TTSEventEmitter';
import { TTSStore } from '../store/TTSStore';
import { v4 as uuidv4 } from 'uuid';
import { AudioService } from '../services/AudioService';

export class PlaybackQueueManager {
  private static instance: PlaybackQueueManager;
  private store: TTSStore;
  private eventEmitter: TTSEventEmitter;
  private audioService: AudioService;
  private readonly PRELOAD_COUNT = 2; // 预加载接下来的2句

  private constructor() {
    this.store = TTSStore.getInstance();
    this.eventEmitter = TTSEventEmitter.getInstance();
    this.audioService = AudioService.getInstance();
  }

  public static getInstance(): PlaybackQueueManager {
    if (!PlaybackQueueManager.instance) {
      PlaybackQueueManager.instance = new PlaybackQueueManager();
    }
    return PlaybackQueueManager.instance;
  }

  public initializeQueue(items: QueueItem[], startIndex: number = 0, mode: PlayMode): void {
    // 为每个队列项添加唯一id
    const itemsWithIds = items.map(item => ({
      ...item,
      id: item.id || uuidv4()
    }));

    this.store.dispatch({
      type: 'SET_QUEUE',
      payload: {
        items: itemsWithIds,
        currentIndex: startIndex,
        mode
      }
    });

    this.eventEmitter.emit(TTSEvent.QueueChanged, this.store.getState().queue);
    this.preloadNextItems(); // 初始化时预加载
  }

  public getItems(): QueueItem[] {
    return this.store.getState().queue.items;
  }

  public getCurrentIndex(): number {
    return this.store.getState().queue.currentIndex;
  }

  public getCurrentItem(): QueueItem | null {
    const { queue } = this.store.getState();
    const { items, currentIndex } = queue;
    return currentIndex >= 0 && currentIndex < items.length ? items[currentIndex] : null;
  }

  public hasNext(): boolean {
    const { queue } = this.store.getState();
    const { items, currentIndex, mode } = queue;

    if (mode === PlayMode.LOOP) return items.length > 0;
    return currentIndex < items.length - 1;
  }

  public async moveNext(): Promise<QueueItem | null> {
    const { queue } = this.store.getState();
    const { items, currentIndex, mode } = queue;

    // 在单次播放模式下，直接返回 null，不移动到下一项
    if (mode === PlayMode.SINGLE) {
      return null;
    }

    // 在单句循环模式下，继续播放当前句子
    if (mode === PlayMode.SINGLE_LOOP) {
      return items[currentIndex];
    }

    if (currentIndex >= items.length - 1) {
      if (mode === PlayMode.LOOP) {
        // 循环模式下回到开始
        this.store.dispatch({
          type: 'SET_QUEUE',
          payload: { ...queue, currentIndex: 0 }
        });
        return items[0];
      }
      return null;
    }

    // 移动到下一项
    this.store.dispatch({
      type: 'SET_QUEUE',
      payload: { ...queue, currentIndex: currentIndex + 1 }
    });

    const nextItem = items[currentIndex + 1];
    if (nextItem) {
      this.preloadNextItems(); // 移动到下一项时预加载
    }

    return nextItem;
  }

  public setMode(mode: PlayMode): void {
    this.store.dispatch({
      type: 'SET_QUEUE',
      payload: { mode }
    });
  }

  public clear(): void {
    this.store.dispatch({
      type: 'SET_QUEUE',
      payload: {
        items: [],
        currentIndex: -1,
        mode: PlayMode.SINGLE
      }
    });
  }

  private async preloadNextItems(): Promise<void> {
    const { queue } = this.store.getState();
    const startIdx = queue.currentIndex + 1;
    const endIdx = Math.min(startIdx + this.PRELOAD_COUNT, queue.items.length);

    // 并行预加载接下来的几句
    const preloadPromises = [];
    for (let i = startIdx; i < endIdx; i++) {
      const item = queue.items[i];
      if (item) {
        preloadPromises.push(
          this.audioService.preloadAudio(item.text, item.config)
            .catch(err => console.warn(`Preload failed for item ${i}:`, err))
        );
      }
    }

    // 等待所有预加载完成
    await Promise.all(preloadPromises);
  }
}
