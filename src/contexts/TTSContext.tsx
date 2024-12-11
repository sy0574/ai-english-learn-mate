import React, { createContext, useContext, useState, useEffect, useRef, useReducer } from 'react';
import { PlaybackState as _PlaybackState, TTSEvent, TTSState, TTSAction } from '@/lib/tts/domain/types';
import { TTSStore } from '@/lib/tts/store/TTSStore';
import { TTSEventEmitter } from '@/lib/tts/events/TTSEventEmitter';
import { PlaybackController } from '@/lib/tts/controllers/PlaybackController';
import { PlayMode } from '@/types';

interface TTSContextType {
  voice: string;
  setVoice: (voice: string) => void;
  rate: number;
  setRate: (rate: number) => void;
  fontSizeScale: number;
  setFontSizeScale: (scale: number) => void;
  isPlaying: boolean;
  isLoading: boolean;
  progress: number;
  playMode: PlayMode;
  setPlayMode: (mode: PlayMode) => void;
  playText: (
    text: string | string[] | Array<{ text: string; id: string }>, 
    startIndex?: number,
    onProgress?: (text: string) => void
  ) => Promise<void>;
  stopPlaying: () => void;
  selectedText: string;
  setSelectedText: (text: string) => void;
}

const TTSContext = createContext<TTSContextType | undefined>(undefined);

// 添加 reducer 函数
function ttsReducer(state: TTSState, action: TTSAction): TTSState {
  const store = TTSStore.getInstance();
  store.dispatch(action);
  return store.getState();
}

export function TTSProvider({ children }: { children: React.ReactNode }) {
  const [selectedText, setSelectedText] = useState('');
  const [state, dispatch] = useReducer(ttsReducer, TTSStore.getInstance().getState());
  const [_currentHighlightedText, setCurrentHighlightedText] = useState<string | null>(null);
  const progressCallbackRef = useRef<((text: string) => void) | null>(null);

  useEffect(() => {
    const store = TTSStore.getInstance();
    const eventEmitter = TTSEventEmitter.getInstance();
    const controller = PlaybackController.getInstance();

    // 订阅状态更新
    const unsubscribeStore = store.subscribe(newState => {
      dispatch(newState);
    });

    // 订阅队列变化事件
    const unsubscribeQueue = eventEmitter.subscribe(TTSEvent.QueueChanged, (queue: any) => {
      if (queue?.items && queue.currentIndex >= 0 && progressCallbackRef.current) {
        const currentItem = queue.items[queue.currentIndex];
        if (currentItem?.text) {
          setCurrentHighlightedText(currentItem.text);
          progressCallbackRef.current(currentItem.text);
        }
      }
    });

    // 订阅项目完成事件
    const unsubscribeComplete = eventEmitter.subscribe(TTSEvent.ItemComplete, (item: any) => {
      if (item?.text && progressCallbackRef.current) {
        progressCallbackRef.current(item.text);
      }
    });

    // 订阅播放完成事件
    const unsubscribeComplete2 = eventEmitter.subscribe(TTSEvent.PlaybackComplete, () => {
      setCurrentHighlightedText(null);
      progressCallbackRef.current = null;
    });

    // 订阅播放停止事件
    const unsubscribeStop = eventEmitter.subscribe(TTSEvent.PlaybackStopped, () => {
      setCurrentHighlightedText(null);
      progressCallbackRef.current = null;
    });

    return () => {
      unsubscribeStore();
      unsubscribeQueue();
      unsubscribeComplete();
      unsubscribeComplete2();
      unsubscribeStop();
      controller.stop();
    };
  }, []);

  const setVoice = async (voice: string) => {
    try {
      console.log('[TTSContext] Setting voice to:', voice);
      const controller = PlaybackController.getInstance();
      const store = TTSStore.getInstance();
      const currentState = store.getState();

      // 更新配置
      controller.setConfig({ voice });

      // 如果正在播放，立即应用新的语音设置
      if (currentState.playback.isPlaying) {
        const { queue } = currentState;
        const remainingItems = queue.items.slice(queue.currentIndex + 1).map(item => ({
          ...item,
          config: { ...item.config, voice }
        }));

        // 更新队列中的剩余项目
        if (remainingItems.length > 0) {
          store.dispatch({
            type: 'SET_QUEUE',
            payload: {
              items: [
                ...queue.items.slice(0, queue.currentIndex + 1),
                ...remainingItems
              ]
            }
          });
        }

        // 发送配置变更事件
        eventEmitter.emit(TTSEvent.ConfigChanged, { voice });
      }
    } catch (error) {
      console.error('[TTSContext] Error setting voice:', error);
    }
  };

  const setRate = (rate: number) => {
    const controller = PlaybackController.getInstance();
    controller.setConfig({ rate });
  };

  const setFontSizeScale = (scale: number) => {
    const controller = PlaybackController.getInstance();
    controller.setConfig({ fontSizeScale: scale });
  };

  const setPlayMode = (mode: PlayMode) => {
    const store = TTSStore.getInstance();
    store.dispatch({
      type: 'SET_QUEUE',
      payload: { mode }
    });
  };

  const playText = async (
    text: string | string[] | Array<{ text: string; id: string }>, 
    startIndex: number = 0,
    onProgress?: (text: string) => void
  ) => {
    try {
      console.log('[TTSContext] Starting playText with:', { text, startIndex });
      const controller = PlaybackController.getInstance();
      const config = TTSStore.getInstance().getState().config;
      
      // 保存回调函数到 ref
      progressCallbackRef.current = onProgress || null;

      let items;
      if (Array.isArray(text)) {
        items = text.map(item => {
          if (typeof item === 'string') {
            return {
              text: item,
              id: crypto.randomUUID(),
              config
            };
          } else {
            return {
              ...item,
              config
            };
          }
        });
      } else {
        items = [{
          text: text as string,
          id: crypto.randomUUID(),
          config
        }];
      }

      console.log('[TTSContext] Prepared items:', items);

      // 立即触发初始高亮
      if (items.length > startIndex && onProgress) {
        console.log('[TTSContext] Triggering initial highlight for:', items[startIndex].text);
        setCurrentHighlightedText(items[startIndex].text);
        onProgress(items[startIndex].text);
      }

      await controller.play({
        items,
        currentIndex: startIndex,
        mode: state.queue.mode
      });
    } catch (error) {
      console.error('[TTSContext] Failed to play text:', error);
      progressCallbackRef.current = null;
    }
  };

  const stopPlaying = () => {
    console.log('[TTSContext] Stopping playback');
    const controller = PlaybackController.getInstance();
    controller.stop();
    progressCallbackRef.current = null;
    setCurrentHighlightedText(null);
  };

  const value: TTSContextType = {
    voice: state.config.voice,
    setVoice,
    rate: state.config.rate,
    setRate,
    fontSizeScale: state.config.fontSizeScale,
    setFontSizeScale,
    isPlaying: state.playback.isPlaying,
    isLoading: state.playback.isLoading,
    progress: state.playback.progress,
    playMode: state.queue.mode,
    setPlayMode,
    playText,
    stopPlaying,
    selectedText,
    setSelectedText
  };

  return (
    <TTSContext.Provider value={value}>
      {children}
    </TTSContext.Provider>
  );
}

export const useTTS = () => {
  const context = useContext(TTSContext);
  if (!context) {
    throw new Error('useTTS must be used within a TTSProvider');
  }
  return context;
};
