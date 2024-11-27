import { EdgeTTSService } from '../services/edgeTTS';
import { TTSOptions } from '../types/tts';
import { DEFAULT_TTS_CONFIG } from '../config/ttsConfig';

export class TTSHelper {
  private static tts = EdgeTTSService.getInstance();

  /**
   * 朗读文章
   * @param article 文章内容
   * @param options TTS选项
   */
  static async speakArticle(article: string, options?: TTSOptions): Promise<void> {
    const finalOptions = {
      ...DEFAULT_TTS_CONFIG.article,
      ...options
    };
    await this.tts.speak(article, finalOptions);
  }

  /**
   * 朗读句子
   * @param sentence 句子内容
   * @param options TTS选项
   */
  static async speakSentence(sentence: string, options?: TTSOptions): Promise<void> {
    const finalOptions = {
      ...DEFAULT_TTS_CONFIG.sentence,
      ...options
    };
    await this.tts.speak(sentence, finalOptions);
  }

  /**
   * 朗读单词
   * @param word 单词
   * @param options TTS选项
   */
  static async speakWord(word: string, options?: TTSOptions): Promise<void> {
    const finalOptions = {
      ...DEFAULT_TTS_CONFIG.word,
      ...options
    };
    await this.tts.speak(word, finalOptions);
  }

  /**
   * 暂停朗读
   */
  static pause(): void {
    this.tts.pause();
  }

  /**
   * 继续朗读
   */
  static resume(): void {
    this.tts.resume();
  }

  /**
   * 停止朗读
   */
  static stop(): void {
    this.tts.stop();
  }

  /**
   * 获取当前状态
   */
  static getState() {
    return this.tts.getState();
  }

  /**
   * 获取可用的声音列表
   */
  static getVoices() {
    return this.tts.getAvailableVoices();
  }

  /**
   * 设置默认声音
   */
  static setVoice(voice: string) {
    return this.tts.setVoice(voice);
  }
}
