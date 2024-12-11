import { TTSState, TTSAction, IStateManager, PlayMode } from '../domain/types';

const initialState: TTSState = {
  config: {
    voice: 'en-GB-SoniaNeural',
    rate: 1,
    volume: 1,
    fontSizeScale: 2.6,
    highlightColor: '#ffd700'
  },
  queue: {
    items: [],
    currentIndex: -1,
    mode: PlayMode.SEQUENTIAL
  },
  playback: {
    isPlaying: false,
    isLoading: false,
    progress: 0,
    error: null
  },
  currentPlayingId: null
};

export class TTSStore implements IStateManager {
  private static instance: TTSStore;
  private state: TTSState;
  private subscribers: ((state: TTSState) => void)[] = [];

  private constructor() {
    this.state = initialState;
  }

  public static getInstance(): TTSStore {
    if (!TTSStore.instance) {
      TTSStore.instance = new TTSStore();
    }
    return TTSStore.instance;
  }

  public getState(): TTSState {
    return this.state;
  }

  public dispatch(action: TTSAction): void {
    console.log('Dispatching action:', action);
    const prevState = this.state;
    this.state = this.reducer(this.state, action);
    
    if (this.state !== prevState) {
      console.log('State updated:', this.state);
      this.notifySubscribers();
    }
  }

  private reducer(state: TTSState, action: TTSAction): TTSState {
    switch (action.type) {
      case 'SET_CONFIG':
        return {
          ...state,
          config: { ...state.config, ...action.payload }
        };
      case 'SET_QUEUE':
        return {
          ...state,
          queue: { 
            ...state.queue, 
            mode: action.payload.mode ? action.payload.mode : state.queue.mode, 
            ...action.payload 
          }
        };
      case 'SET_PLAYBACK_STATE':
        return {
          ...state,
          playback: { ...state.playback, ...action.payload }
        };
      case 'SET_CURRENT_PLAYING':
        return {
          ...state,
          currentPlayingId: action.payload
        };
      case 'RESET':
        return { ...initialState };
      default:
        return state;
    }
  }

  public subscribe(callback: (state: TTSState) => void): () => void {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  private notifySubscribers(): void {
    this.subscribers.forEach(callback => callback(this.state));
  }

  public reset(): void {
    this.dispatch({ type: 'RESET' });
  }
}
