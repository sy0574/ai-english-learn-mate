import { TTSConfig, TTSEngine } from './types';
import edge from 'edge-tts';

export class EdgeTTSEngine implements TTSEngine {
  private voice: string = 'en-US-ChristopherNeural'; // 默认使用Christopher声音
  private isPlaying: boolean = false;
  private currentAudio: HTMLAudioElement | null = null;

  async initialize(): Promise<void> {
    // Edge TTS 不需要特殊初始化
  }

  async speak(text: string, config: TTSConfig): Promise<void> {
    this.stop();
    
    try {
      // 根据配置选择声音
      const voice = config.voice || this.voice;
      
      // 使用Edge TTS生成音频
      const communicator = new edge.Communicator(text, voice);
      const audioData = await communicator.stream();
      
      // 创建Blob URL
      const blob = new Blob([audioData], { type: 'audio/mp3' });
      const url = URL.createObjectURL(blob);
      
      // 播放音频
      return new Promise((resolve, reject) => {
        this.currentAudio = new Audio(url);
        this.currentAudio.playbackRate = config.rate || 1.0;
        this.currentAudio.volume = config.volume || 1.0;
        
        this.currentAudio.onended = () => {
          this.isPlaying = false;
          URL.revokeObjectURL(url);
          resolve();
        };
        
        this.currentAudio.onerror = (error) => {
          this.isPlaying = false;
          URL.revokeObjectURL(url);
          reject(error);
        };
        
        this.isPlaying = true;
        this.currentAudio.play();
      });
    } catch (error) {
      console.error('Edge TTS error:', error);
      throw error;
    }
  }

  pause(): void {
    if (this.currentAudio && this.isPlaying) {
      this.currentAudio.pause();
      this.isPlaying = false;
    }
  }

  resume(): void {
    if (this.currentAudio && !this.isPlaying) {
      this.currentAudio.play();
      this.isPlaying = true;
    }
  }

  stop(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.isPlaying = false;
    }
  }

  isSpeaking(): boolean {
    return this.isPlaying;
  }
  
  // 获取可用的声音列表
  async getVoices(): Promise<string[]> {
    const voices = [
      'en-US-ChristopherNeural',  // 男声
      'en-US-JennyNeural',        // 女声
      'en-GB-RyanNeural',         // 英式男声
      'en-GB-SoniaNeural',        // 英式女声
    ];
    return voices;
  }
}
