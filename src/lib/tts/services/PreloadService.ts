import { AudioDomain } from '../domain/AudioDomain';
import { TTSConfig } from '../domain/types';

class PreloadService {
  private static instance: PreloadService;
  private preloadQueue: string[] = [];
  private isPreloading = false;
  private maxPreloadItems = 3;

  private constructor() {}

  public static getInstance(): PreloadService {
    if (!PreloadService.instance) {
      PreloadService.instance = new PreloadService();
    }
    return PreloadService.instance;
  }

  public predictNextItems(currentText: string, texts: string[]): string[] {
    const currentIndex = texts.indexOf(currentText);
    if (currentIndex === -1) return [];

    // 预测接下来可能播放的文本
    const predictions: string[] = [];
    
    // 1. 添加下一个文本
    if (currentIndex + 1 < texts.length) {
      predictions.push(texts[currentIndex + 1]);
    }

    // 2. 如果快到末尾了，可能会循环到开头
    if (currentIndex + 1 >= texts.length - 1) {
      predictions.push(texts[0]);
    }

    // 3. 如果在开头，也预加载最后一个（以防向后播放）
    if (currentIndex === 0) {
      predictions.push(texts[texts.length - 1]);
    }

    return predictions.slice(0, this.maxPreloadItems);
  }

  public async preloadTexts(texts: string[], config: TTSConfig): Promise<void> {
    // 更新预加载队列
    this.preloadQueue = texts;

    // 如果已经在预加载，不需要重新开始
    if (this.isPreloading) return;

    this.isPreloading = true;
    const audioDomain = AudioDomain.getInstance();

    try {
      // 并行预加载，但限制并发数
      const chunks = this.chunkArray(this.preloadQueue, 2);
      for (const chunk of chunks) {
        await Promise.all(
          chunk.map(text => audioDomain.getAudio(text, config))
        );
      }
    } catch (error) {
      console.warn('Preload error:', error);
    } finally {
      this.isPreloading = false;
      this.preloadQueue = [];
    }
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  public cancelPreload(): void {
    this.preloadQueue = [];
    this.isPreloading = false;
  }
}

export default PreloadService;
