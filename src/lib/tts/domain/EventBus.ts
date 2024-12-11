import { TTSEvent } from './types';

type EventCallback = (payload: any) => void;

export class EventBus {
  private static instance: EventBus;
  private subscribers: Map<TTSEvent, EventCallback[]>;

  private constructor() {
    this.subscribers = new Map();
  }

  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  public subscribe(event: TTSEvent, callback: EventCallback): () => void {
    const callbacks = this.subscribers.get(event) || [];
    callbacks.push(callback);
    this.subscribers.set(event, callbacks);

    // 返回取消订阅函数
    return () => {
      const callbacks = this.subscribers.get(event) || [];
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
        this.subscribers.set(event, callbacks);
      }
    };
  }

  public emit(event: TTSEvent, payload?: any): void {
    const callbacks = this.subscribers.get(event) || [];
    callbacks.forEach(callback => {
      try {
        callback(payload);
      } catch (error) {
        console.error(`Error in event handler for ${event}:`, error);
      }
    });
  }

  public clear(): void {
    this.subscribers.clear();
  }
}

export default EventBus;
