import { TTSEvent, IEventEmitter } from '../domain/types';

export class TTSEventEmitter implements IEventEmitter {
  private static instance: TTSEventEmitter;
  private listeners: Map<TTSEvent, Set<(payload?: any) => void>>;

  private constructor() {
    this.listeners = new Map();
  }

  public static getInstance(): TTSEventEmitter {
    if (!TTSEventEmitter.instance) {
      TTSEventEmitter.instance = new TTSEventEmitter();
    }
    return TTSEventEmitter.instance;
  }

  public emit(event: TTSEvent, payload?: any): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(listener => {
        try {
          listener(payload);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  public subscribe(event: TTSEvent, handler: (payload?: any) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    
    const eventListeners = this.listeners.get(event)!;
    eventListeners.add(handler);

    return () => {
      eventListeners.delete(handler);
      if (eventListeners.size === 0) {
        this.listeners.delete(event);
      }
    };
  }

  public clear(): void {
    this.listeners.clear();
  }
}
