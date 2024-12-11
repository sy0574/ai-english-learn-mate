import EventBus from '../domain/EventBus';
import { TTSEvent } from '../domain/types';

export interface PerformanceMetrics {
  loadTime: number;
  playbackLatency: number;
  memoryUsage: number;
  cacheHitRate: number;
  errorRate: number;
}

class TTSMonitor {
  private static instance: TTSMonitor;
  private metrics: {
    loadTimes: number[];
    playbackLatencies: number[];
    cacheHits: number;
    cacheMisses: number;
    errors: number;
    totalRequests: number;
  };

  private constructor() {
    this.metrics = {
      loadTimes: [],
      playbackLatencies: [],
      cacheHits: 0,
      cacheMisses: 0,
      errors: 0,
      totalRequests: 0,
    };

    this.setupEventListeners();
  }

  public static getInstance(): TTSMonitor {
    if (!TTSMonitor.instance) {
      TTSMonitor.instance = new TTSMonitor();
    }
    return TTSMonitor.instance;
  }

  private setupEventListeners(): void {
    const eventBus = EventBus.getInstance();

    // 监听播放开始事件
    eventBus.subscribe(TTSEvent.PlaybackStarted, (payload: { loadTime?: number }) => {
      if (payload.loadTime) {
        this.metrics.loadTimes.push(payload.loadTime);
      }
      this.metrics.totalRequests++;
    });

    // 监听缓存更新事件
    eventBus.subscribe(TTSEvent.CacheUpdated, (payload: { hit: boolean }) => {
      if (payload.hit) {
        this.metrics.cacheHits++;
      } else {
        this.metrics.cacheMisses++;
      }
    });

    // 监听错误事件
    eventBus.subscribe(TTSEvent.PlaybackError, () => {
      this.metrics.errors++;
    });
  }

  public recordPlaybackLatency(latency: number): void {
    this.metrics.playbackLatencies.push(latency);
  }

  public getMetrics(): PerformanceMetrics {
    const avgLoadTime = this.metrics.loadTimes.length > 0
      ? this.metrics.loadTimes.reduce((a, b) => a + b, 0) / this.metrics.loadTimes.length
      : 0;

    const avgPlaybackLatency = this.metrics.playbackLatencies.length > 0
      ? this.metrics.playbackLatencies.reduce((a, b) => a + b, 0) / this.metrics.playbackLatencies.length
      : 0;

    const cacheHitRate = this.metrics.totalRequests > 0
      ? this.metrics.cacheHits / this.metrics.totalRequests
      : 0;

    const errorRate = this.metrics.totalRequests > 0
      ? this.metrics.errors / this.metrics.totalRequests
      : 0;

    return {
      loadTime: avgLoadTime,
      playbackLatency: avgPlaybackLatency,
      memoryUsage: this.getMemoryUsage(),
      cacheHitRate,
      errorRate,
    };
  }

  private getMemoryUsage(): number {
    // 在浏览器环境中，我们可以使用 performance.memory
    // 但这个API并不是标准的，所以需要做一些兼容处理
    const performance = window.performance as any;
    if (performance && performance.memory) {
      return performance.memory.usedJSHeapSize;
    }
    return 0;
  }

  public reset(): void {
    this.metrics = {
      loadTimes: [],
      playbackLatencies: [],
      cacheHits: 0,
      cacheMisses: 0,
      errors: 0,
      totalRequests: 0,
    };
  }
}

export default TTSMonitor;
