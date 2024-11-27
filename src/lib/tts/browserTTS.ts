import { TTSConfig, TTSEngine } from './types';

export class BrowserTTSEngine implements TTSEngine {
  private synthesis: SpeechSynthesis;
  private utterance: SpeechSynthesisUtterance | null = null;

  constructor() {
    this.synthesis = window.speechSynthesis;
  }

  async initialize(): Promise<void> {
    if (!this.synthesis) {
      throw new Error('Browser TTS not supported');
    }
  }

  async speak(text: string, config: TTSConfig): Promise<void> {
    this.stop();
    
    this.utterance = new SpeechSynthesisUtterance(text);
    if (config.language) this.utterance.lang = config.language;
    if (config.rate) this.utterance.rate = config.rate;
    if (config.pitch) this.utterance.pitch = config.pitch;
    if (config.volume) this.utterance.volume = config.volume;
    
    // 选择声音
    if (config.voice) {
      const voices = this.synthesis.getVoices();
      const selectedVoice = voices.find(v => v.name === config.voice);
      if (selectedVoice) {
        this.utterance.voice = selectedVoice;
      }
    }

    return new Promise((resolve, reject) => {
      if (!this.utterance) return reject(new Error('No utterance created'));
      
      this.utterance.onend = () => resolve();
      this.utterance.onerror = (event) => reject(event);
      
      this.synthesis.speak(this.utterance);
    });
  }

  pause(): void {
    this.synthesis.pause();
  }

  resume(): void {
    this.synthesis.resume();
  }

  stop(): void {
    this.synthesis.cancel();
    this.utterance = null;
  }

  isSpeaking(): boolean {
    return this.synthesis.speaking;
  }
}
