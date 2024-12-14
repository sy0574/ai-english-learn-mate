import { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { PlayCircle, PauseCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ArticleTTS from './ArticleTTS';
import { useTTS } from '@/contexts/TTSContext';
import type { TTSControllerRef } from '@/components/common/tts/TTSController';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { TTSEventEmitter } from '@/lib/tts/events/TTSEventEmitter';
import { TTSEvent } from '@/lib/tts/domain/types';

interface SentenceHighlighterProps {
  text: string;
  onWordClick?: (word: string) => void;
  onSentenceClick?: (sentence: string) => void;
  selectedSentence?: string;
  className?: string;
  enableTTS?: boolean;
}

// 常见的缩写列表
const COMMON_ABBREVIATIONS = [
  'Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Prof.',
  'Sr.', 'Jr.', 'Bros.', 'etc.', 'vs.',
  'i.e.', 'e.g.', 'a.m.', 'p.m.',
];

function extractSentences(text: string): string[] {
  // 预处理：临时替换常见缩写中的点号
  let processedText = text;
  const replacements: [string, string][] = [];
  
  COMMON_ABBREVIATIONS.forEach((abbr, index) => {
    const placeholder = `__ABR${index}__`;
    if (processedText.includes(abbr)) {
      processedText = processedText.replace(new RegExp(abbr.replace('.', '\\.'), 'g'), placeholder);
      replacements.push([placeholder, abbr]);
    }
  });

  // 分割句子
  const sentenceRegex = /[^.!?]+[.!?]+(?=\s+|$)|[^.!?]+$/g;
  const sentences = processedText.match(sentenceRegex) || [processedText];

  // 后处理：恢复缩写中的点号
  return sentences.map(sentence => {
    let processedSentence = sentence.trim();
    replacements.forEach(([placeholder, original]) => {
      processedSentence = processedSentence.replace(new RegExp(placeholder, 'g'), original);
    });
    return processedSentence;
  }).filter(Boolean);
}

function parseTextContent(text: string): Array<{ type: 'word' | 'punctuation' | 'space'; content: string }> {
  // Enhanced regex to better handle contractions and hyphenated words
  const regex = /([a-zA-Z]+(?:[''-][a-zA-Z]+)*)|([^a-zA-Z\s]+)|(\s+)/g;
  const parts: Array<{ type: 'word' | 'punctuation' | 'space'; content: string }> = [];
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match[1]) { // Word (including contractions and hyphens)
      parts.push({ type: 'word', content: match[1] });
    } else if (match[2]) { // Punctuation
      parts.push({ type: 'punctuation', content: match[2] });
    } else if (match[3]) { // Space
      parts.push({ type: 'space', content: match[3] });
    }
  }

  return parts;
}

export default function SentenceHighlighter({
  text,
  onWordClick,
  onSentenceClick,
  selectedSentence,
  className = '',
  enableTTS = false
}: SentenceHighlighterProps) {
  const [hoveredSentenceIndex, setHoveredSentenceIndex] = useState<number | null>(null);
  const [playingSentenceIndex, setPlayingSentenceIndex] = useState<number | null>(null);
  const [playingWord, setPlayingWord] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;
  const sentences = useMemo(() => extractSentences(text), [text]);
  const ttsRef = useRef<TTSControllerRef>(null);
  const sentenceRefs = useRef<(HTMLDivElement | null)[]>([]);
  const { fontSizeScale, playText, stopPlaying, isPlaying } = useTTS();
  const { toast } = useToast();

  // 添加播放进度监听
  useEffect(() => {
    if (!enableTTS) return;

    const eventEmitter = TTSEventEmitter.getInstance();
    let lastWordIndex = -1;
    
    const unsubscribeProgress = eventEmitter.subscribe(TTSEvent.PlaybackProgress, (state: any) => {
      if (playingSentenceIndex !== null && state.currentTime !== undefined && state.duration !== undefined) {
        const { currentWordIndex } = state;
        
        if (currentWordIndex !== undefined && currentWordIndex !== lastWordIndex) {
          const currentSentence = sentences[playingSentenceIndex];
          const words = parseTextContent(currentSentence)
            .filter(part => part.type === 'word')
            .map(part => part.content);

          if (currentWordIndex >= 0 && currentWordIndex < words.length) {
            lastWordIndex = currentWordIndex;
            setPlayingWord(words[currentWordIndex]);
          } else {
            setPlayingWord(null);
          }
        }
      }
    });

    const unsubscribeComplete = eventEmitter.subscribe(TTSEvent.ItemComplete, () => {
      setPlayingWord(null);
      lastWordIndex = -1;
    });

    return () => {
      unsubscribeProgress();
      unsubscribeComplete();
    };
  }, [playingSentenceIndex, sentences, enableTTS]);

  // 重置状态
  const resetState = useCallback(() => {
    stopPlaying();
    setPlayingSentenceIndex(null);
    setPlayingWord(null);
    setIsLoading(false);
    setRetryCount(0);
  }, [stopPlaying]);

  // 处理播放错误
  const handlePlaybackError = useCallback((error: any) => {
    console.error('TTS playback error:', error);
    
    // 检查是否是网络错误
    if (error.message?.includes('500')) {
      toast({
        variant: "destructive",
        title: "服务暂时不可用",
        description: "语音服务出现问题，请稍后重试",
      });
    } else if (error.message?.includes('network') || !navigator.onLine) {
      toast({
        variant: "destructive",
        title: "网络连接失败",
        description: "请检查您的网络连接后重试",
      });
    } else {
      toast({
        variant: "destructive",
        title: "播放失败",
        description: "出现未知错误，请稍后重试",
      });
    }
    
    resetState();
  }, [toast, resetState]);

  // 自动重试机制
  const playWithRetry = useCallback(async (index: number) => {
    try {
      setIsLoading(true);
      await ttsRef.current?.play(index);
      setPlayingSentenceIndex(index);
      setRetryCount(0); // 成功重置重试计数
    } catch (error) {
      if (retryCount < maxRetries) {
        setRetryCount(prev => prev + 1);
        // 指数退避重试
        const delay = Math.min(1000 * Math.pow(2, retryCount), 5000);
        toast({
          title: "正在重试",
          description: `播放失败，${delay/1000}秒后自动重试...`,
        });
        setTimeout(() => playWithRetry(index), delay);
      } else {
        handlePlaybackError(error);
      }
    } finally {
      if (retryCount >= maxRetries) {
        setIsLoading(false);
      }
    }
  }, [retryCount, handlePlaybackError]);

  // Initialize sentence refs array
  useEffect(() => {
    sentenceRefs.current = sentences.map(() => null);
  }, [sentences]);

  // Auto-scroll when playing sentence changes
  useEffect(() => {
    if (playingSentenceIndex !== null && sentenceRefs.current[playingSentenceIndex]) {
      sentenceRefs.current[playingSentenceIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [playingSentenceIndex]);

  const handleWordClick = (e: React.MouseEvent, word: string) => {
    e.stopPropagation();
    onWordClick?.(word);
  };

  const handleWordDoubleClick = async (e: React.MouseEvent, word: string) => {
    e.stopPropagation();
    
    // Stop any currently playing sentence
    if (playingSentenceIndex !== null) {
      stopPlaying();
      setPlayingSentenceIndex(null);
    }
    
    // If the same word is playing, stop it
    if (playingWord === word && isPlaying) {
      stopPlaying();
      setPlayingWord(null);
    } else {
      // Play the new word
      setPlayingWord(word);
      try {
        await playText([word], 0, (text) => {
          if (text !== word) {
            setPlayingWord(null);
          }
        });
      } catch (error) {
        console.error('Failed to play word:', error);
      }
      setPlayingWord(null);
    }
  };

  const handleSentenceClick = (sentence: string, _index: number) => {
    onSentenceClick?.(sentence);
  };

  const handleSentencePlay = async (e: React.MouseEvent, sentence: string, index: number) => {
    e.stopPropagation();
    handleSentenceClick(sentence, index);
    
    // 停止当前播放的单词
    if (playingWord) {
      resetState();
      return;
    }

    // 如果点击当前正在播放的句子，则停止播放
    if (playingSentenceIndex === index) {
      resetState();
      return;
    }

    // 始播放新句子
    playWithRetry(index);
  };

  // 监听网络状态变化
  useEffect(() => {
    const handleOnline = () => {
      if (playingSentenceIndex !== null && !isPlaying) {
        playWithRetry(playingSentenceIndex);
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [playingSentenceIndex, isPlaying, playWithRetry]);

  // 渲染单词部分的代码
  const renderWord = useCallback((part: { type: string; content: string }, partIndex: number, isPlaying: boolean) => {
    if (part.type === 'word') {
      const isCurrentWord = isPlaying && part.content === playingWord;
      return (
        <span
          key={partIndex}
          data-word={part.content}
          className={cn(
            "inline-block cursor-pointer mx-[1px]",
            !isPlaying && "hover:text-primary/70",
            isCurrentWord ? [
              "text-primary font-medium",
              "bg-primary/5 px-1 py-0.5 rounded-md",
              "border-b-2 border-primary"
            ] : "text-inherit"
          )}
          onClick={(e) => handleWordClick(e, part.content)}
          onDoubleClick={(e) => handleWordDoubleClick(e, part.content)}
        >
          {part.content}
        </span>
      );
    }
    return (
      <span 
        key={partIndex}
        className="inline-block mx-[1px]"
      >
        {part.content}
      </span>
    );
  }, [playingWord, handleWordClick, handleWordDoubleClick]);

  return (
    <div className={`space-y-2 ${className}`}>
      {sentences.map((sentence, index) => {
        const parts = parseTextContent(sentence);
        const isSelected = sentence === selectedSentence;
        const isPlaying = playingSentenceIndex === index;
        
        return (
          <div
            key={index}
            ref={(el: HTMLDivElement | null) => {
              if (sentenceRefs.current) {
                sentenceRefs.current[index] = el;
              }
            }}
            className={cn(
              "relative group cursor-pointer p-2",
              "transition-colors duration-200",
              !isPlaying && !isSelected && "hover:bg-accent/5",
              isSelected && [
                "bg-primary/5",
                "rounded-lg"
              ],
              isPlaying && [
                "bg-primary/5",
                "rounded-lg"
              ]
            )}
            style={{
              fontSize: isSelected ? `${fontSizeScale * 100}%` : undefined
            }}
            onClick={() => handleSentenceClick(sentence, index)}
            onMouseEnter={() => setHoveredSentenceIndex(index)}
            onMouseLeave={() => setHoveredSentenceIndex(null)}
          >
            <div className="relative">
              <div className="inline-block">
                {parts.map((part, partIndex) => renderWord(part, partIndex, isPlaying))}
              </div>

              {enableTTS && (hoveredSentenceIndex === index || isPlaying) && (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isLoading}
                  className={cn(
                    "absolute -right-1 top-1/2 -translate-y-1/2",
                    "opacity-0 group-hover:opacity-100",
                    "transition-opacity duration-200",
                    isPlaying && "opacity-100"
                  )}
                  onClick={(e) => handleSentencePlay(e, sentence, index)}
                >
                  {isLoading ? (
                    <div className="animate-spin h-4 w-4 border-2 border-primary/20 border-t-primary rounded-full" />
                  ) : isPlaying ? (
                    <PauseCircle className="h-4 w-4" />
                  ) : (
                    <PlayCircle className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
          </div>
        );
      })}
      
      {enableTTS && (
        <ArticleTTS 
          ref={ttsRef}
          sentences={sentences}
          onSentenceHighlight={(sentence) => {
            onSentenceClick?.(sentence);
            const index = sentences.indexOf(sentence);
            if (index !== -1) {
              setPlayingSentenceIndex(index);
            }
          }}
        />
      )}
    </div>
  );
}