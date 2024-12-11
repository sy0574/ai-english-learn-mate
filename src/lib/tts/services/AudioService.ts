import { IAudioService, TTSConfig, TTSError } from '../domain/types';
import { API_CONFIG } from '@/lib/config/apiConfig';

export class AudioService implements IAudioService {
  private static instance: AudioService;
  private cache: Map<string, { url: string; timestamp: number }>;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private constructor() {
    this.cache = new Map();
  }

  public static getInstance(): AudioService {
    if (!AudioService.instance) {
      AudioService.instance = new AudioService();
    }
    return AudioService.instance;
  }

  private getCacheKey(text: string, config: TTSConfig): string {
    return `${text}_${config.voice}_${config.rate}`;
  }

  public async getAudio(text: string, config: TTSConfig): Promise<string> {
    try {
      const cacheKey = this.getCacheKey(text, config);
      const cached = this.cache.get(cacheKey);

      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
        console.log('Cache hit for:', text);
        return cached.url;
      }

      console.log('Fetching audio for:', text);
      const url = await this.fetchAudioUrl(text, config);
      this.cache.set(cacheKey, { url, timestamp: Date.now() });
      return url;
    } catch (error) {
      console.error('AudioService error:', error);
      throw new TTSError(
        error instanceof Error ? error.message : 'Failed to get audio',
        'AUDIO_SERVICE_ERROR'
      );
    }
  }

  public async preloadAudio(text: string, config: TTSConfig): Promise<void> {
    try {
      await this.getAudio(text, config);
    } catch (error) {
      console.warn('Preload failed:', error);
    }
  }

  private async fetchAudioUrl(text: string, config: TTSConfig): Promise<string> {
    try {
      console.log('Making TTS API request:', {
        text,
        voice: config.voice,
        rate: config.rate
      });

      const response = await fetch(API_CONFIG.TTS_ENDPOINT, {
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
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // 检查响应的 Content-Type
      const contentType = response.headers.get('Content-Type');
      
      if (contentType?.includes('application/json')) {
        // 如果是 JSON 响应
        const data = await response.json();
        if (!data.audioUrl) {
          throw new Error('No audio URL in response');
        }
        console.log('Received audio URL:', data.audioUrl);
        return data.audioUrl;
      } else {
        // 如果是二进制数据（音频文件）
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        console.log('Created blob URL:', url);
        return url;
      }
    } catch (error) {
      console.error('Failed to fetch audio:', error);
      throw error;
    }
  }

  public cleanup(): void {
    const now = Date.now();
    let count = 0;
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.CACHE_DURATION) {
        // 释放 Blob URL
        if (value.url.startsWith('blob:')) {
          URL.revokeObjectURL(value.url);
        }
        this.cache.delete(key);
        count++;
      }
    }
    if (count > 0) {
      console.log(`Cleaned up ${count} cached items`);
    }
  }
}
