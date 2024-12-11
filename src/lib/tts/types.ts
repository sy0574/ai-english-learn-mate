export interface TTSConfig {
  engine: 'browser' | 'azure' | 'google';
  voice?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  language?: string;
  loopCount?: number;  // 循环次数，undefined或-1表示无限循环
}

export interface TTSService {
  speak(text: string, config?: Partial<TTSConfig>): Promise<void>;
  pause(): void;
  resume(): void;
  stop(): void;
  isSpeaking(): boolean;
}

export interface TTSEngine {
  initialize(): Promise<void>;
  speak(text: string, config: TTSConfig): Promise<void>;
  pause(): void;
  resume(): void;
  stop(): void;
  isSpeaking(): boolean;
}
