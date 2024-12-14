import { AudioResource, TTSConfig, TTSEvent } from './types';
import EventBus from './EventBus';

export class AudioDomain {
  private static instance: AudioDomain;
  private cache: Map<string, AudioResource>;
  private maxCacheSize: number = 50; // 最大缓存数量
  private maxAge: number = 30 * 60 * 1000; // 缓存过期时间：30分钟

  private constructor() {
    this.cache = new Map();
  }

  public static getInstance(): AudioDomain {
    if (!AudioDomain.instance) {
      AudioDomain.instance = new AudioDomain();
    }
    return AudioDomain.instance;
  }

  private getCacheKey(text: string, config: TTSConfig): string {
    return `${text}_${config.voice}_${config.rate}`;
  }

  public async getAudio(text: string, config: TTSConfig): Promise<string> {
    const key = this.getCacheKey(text, config);
    const cached = this.cache.get(key);

    if (cached && Date.now() - cached.lastAccessed <= this.maxAge) {
      cached.lastAccessed = Date.now();
      EventBus.getInstance().emit(TTSEvent.CacheUpdated, { hit: true });
      return cached.url;
    }

    EventBus.getInstance().emit(TTSEvent.CacheUpdated, { hit: false });

    try {
      const startTime = Date.now();
      const response = await fetch('https://ai-english-learn-mate-tts.bolone.cn/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          voice: config.voice,
          rate: config.rate,
        }),
      });

      if (!response.ok) {
        throw new Error('TTS request failed');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      // 缓存新的音频资源
      this.cache.set(key, {
        url,
        blob,
        lastAccessed: Date.now(),
      });

      // 检查缓存大小并清理
      this.cleanupCache();

      const loadTime = Date.now() - startTime;
      EventBus.getInstance().emit(TTSEvent.PlaybackStarted, { loadTime });
      
      return url;
    } catch (error) {
      EventBus.getInstance().emit(TTSEvent.PlaybackError, error);
      throw error;
    }
  }

  private cleanupCache(): void {
    if (this.cache.size <= this.maxCacheSize) return;

    const entries = Array.from(this.cache.entries());
    // 按最后访问时间排序
    entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);

    // 删除最旧的条目直到缓存大小符合要求
    while (this.cache.size > this.maxCacheSize) {
      const [key, resource] = entries.shift()!;
      URL.revokeObjectURL(resource.url);
      this.cache.delete(key);
    }
  }

  public cleanup(): void {
    for (const [, resource] of this.cache.entries()) {
      URL.revokeObjectURL(resource.url);
    }
    this.cache.clear();
  }
}

export default AudioDomain;
