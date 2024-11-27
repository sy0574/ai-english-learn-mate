import { TTSConfig, TTSService, TTSEngine } from './types';
import { BrowserTTSEngine } from './browserTTS';

export class TTSManager implements TTSService {
  private static instance: TTSManager;
  private engine: TTSEngine;
  private defaultConfig: TTSConfig = {
    engine: 'browser',
    language: 'en-US',
    rate: 1.0,
    pitch: 1.0,
    volume: 1.0
  };

  private constructor() {
    // 默认使用浏览器TTS引擎
    this.engine = new BrowserTTSEngine();
  }

  public static getInstance(): TTSManager {
    if (!TTSManager.instance) {
      TTSManager.instance = new TTSManager();
    }
    return TTSManager.instance;
  }

  async initialize(): Promise<void> {
    await this.engine.initialize();
  }

  async speak(text: string, config?: Partial<TTSConfig>): Promise<void> {
    const finalConfig = { ...this.defaultConfig, ...config };
    return this.engine.speak(text, finalConfig);
  }

  pause(): void {
    this.engine.pause();
  }

  resume(): void {
    this.engine.resume();
  }

  stop(): void {
    this.engine.stop();
  }

  isSpeaking(): boolean {
    return this.engine.isSpeaking();
  }

  // 便捷方法：朗读文章
  async speakArticle(article: string, config?: Partial<TTSConfig>): Promise<void> {
    return this.speak(article, config);
  }

  // 便捷方法：朗读句子
  async speakSentence(sentence: string, config?: Partial<TTSConfig>): Promise<void> {
    return this.speak(sentence, config);
  }

  // 便捷方法：朗读单词
  async speakWord(word: string, config?: Partial<TTSConfig>): Promise<void> {
    return this.speak(word, { ...config, rate: 0.8 }); // 单词朗读稍微放慢速度
  }
}
