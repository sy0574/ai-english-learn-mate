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

// 添加新的渲染函数在 parseTextContent 函数后
function renderSentence(
  sentence: string,
  isSelected: boolean,
  isPlaying: boolean,
  playingWord: string | null,
  fontSizeScale: number,
  handleWordClick: (e: React.MouseEvent<HTMLSpanElement>, word: string) => void,
  handleWordDoubleClick: (e: React.MouseEvent<HTMLSpanElement>, word: string) => void,
  showPlayButton: boolean,
  onPlayClick: (e: React.MouseEvent<HTMLButtonElement>) => void,
  isLoading: boolean
) {
  const parts = parseTextContent(sentence);
  
  return (
    <div
      className={cn(
        "text-base relative group w-full",
        "transition-all duration-300 ease-in-out",
        "hover:pr-12",
        "flex flex-wrap items-start",
        isSelected && "bg-primary/5 rounded-lg p-2",
        isPlaying && "bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 dark:from-primary/10 dark:via-primary/15 dark:to-primary/10"
      )}
      style={{
        lineHeight: '1.5',      // 句内行间距
        marginBottom: '0.7em', // 句间行间距
        minWidth: 0,
        width: '100%',
        fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        textAlign: 'left',
        hyphens: 'none',
        WebkitHyphens: 'none',
        msHyphens: 'none',
        fontFeatureSettings: '"kern"',
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
        fontSize: isPlaying ? `${fontSizeScale}rem` : 'inherit',
        borderLeft: isPlaying ? '3px solid var(--primary)' : '3px solid transparent',
        paddingLeft: isPlaying ? '1rem' : '1.15rem'
      }}
    >
      <div className="flex-1 min-w-0 break-words">
        {parts.map((part, index) => {
          if (part.type === 'word') {
            const isCurrentWord = isPlaying && part.content === playingWord;
            return (
              <span
                key={index}
                data-word={part.content}
                className={cn(
                  "inline-block relative cursor-pointer select-text",
                  "transition-all duration-200 ease-in-out",
                  {
                    'text-primary font-medium': isCurrentWord,
                    'hover:text-primary/70': !isCurrentWord
                  }
                )}
                style={{
                  padding: '0 0.01em', // 控制单词的间距
                  margin: '0',
                  transform: isCurrentWord ? 'scale(1.02)' : 'scale(1)',
                  transformOrigin: 'center',
                  borderBottom: isCurrentWord ? '1.5px solid currentColor' : 'none',
                  letterSpacing: 'normal'
                }}
                onClick={(e) => handleWordClick(e, part.content)}
                onDoubleClick={(e) => handleWordDoubleClick(e, part.content)}
              >
                {part.content}
              </span>
            );
          }
          
          return (
            <span
              key={index}
              className={cn(
                "inline-block select-text",
                part.type === 'punctuation' && "text-gray-800 dark:text-gray-200"
              )}
              style={{
                whiteSpace: part.type === 'space' ? 'pre' : 'normal',
                margin: '0',
                fontSize: 'inherit',
                verticalAlign: 'baseline'
              }}
            >
              {part.content}
            </span>
          );
        })}
      </div>

      {showPlayButton && (
        <div 
          className={cn(
            "absolute right-2 top-1/2 -translate-y-1/2",
            "opacity-0 group-hover:opacity-100",
            "transition-all duration-200 ease-in-out",
            "transform group-hover:translate-x-0 translate-x-4"
          )}
        >
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-7 w-7 rounded-full",
              "hover:bg-primary/10",
              "focus:outline-none focus:ring-2 focus:ring-primary/30",
              "transition-all duration-200",
              "backdrop-blur-sm",
              isPlaying ? "bg-primary/10" : "bg-white/50 dark:bg-gray-800/50"
            )}
            onClick={onPlayClick}
            disabled={isLoading && !isPlaying}
          >
            {isLoading && !isPlaying ? (
              <div className="animate-pulse">
                <div className="w-3.5 h-3.5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              </div>
            ) : isPlaying ? (
              <PauseCircle className="h-3.5 w-3.5 text-primary" />
            ) : (
              <PlayCircle className="h-3.5 w-3.5 text-primary/80" />
            )}
          </Button>
        </div>
      )}
    </div>
  );
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

  const handleWordClick = useCallback((e: React.MouseEvent<HTMLSpanElement>, word: string): void => {
    e.stopPropagation();
    onWordClick?.(word);
  }, [onWordClick]);

  const handleWordDoubleClick = useCallback(async (e: React.MouseEvent<HTMLSpanElement>, word: string): Promise<void> => {
    e.preventDefault();
    e.stopPropagation();
    
    // 防止双击选中整个句子
    const selection = window.getSelection();
    const target = e.currentTarget;
    
    if (selection && target) {
      selection.removeAllRanges();
      const range = document.createRange();
      range.selectNodeContents(target);
      selection.addRange(range);
      
      // 阻止选择扩散
      document.addEventListener('selectionchange', () => {
        const newSelection = window.getSelection();
        if (newSelection?.rangeCount && newSelection.rangeCount > 0) {
          const currentRange = newSelection.getRangeAt(0);
          if (currentRange && !target.contains(currentRange.commonAncestorContainer)) {
            newSelection.removeAllRanges();
            newSelection.addRange(range);
          }
        }
      }, { once: true });
    }
    
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
        setPlayingWord(null);
      }
    }
  }, [playingWord, isPlaying, playingSentenceIndex, stopPlaying, playText]);

  const handleSentenceClick = useCallback((sentence: string, _index: number): void => {
    onSentenceClick?.(sentence);
  }, [onSentenceClick]);

  const handleSentencePlay = useCallback(async (e: React.MouseEvent<HTMLButtonElement>, sentence: string, index: number): Promise<void> => {
    e.stopPropagation();
    handleSentenceClick(sentence, index);
    
    // 如果正在播放，则停止播放
    if (playingSentenceIndex === index) {
      resetState();
      return;
    }

    // 开始播放新句子
    setIsLoading(true);
    try {
      await playWithRetry(index);
    } finally {
      setIsLoading(false);
    }
  }, [playingSentenceIndex, resetState, playWithRetry, handleSentenceClick]);

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

  // 修改 ref 回调函数
  const setRef = useCallback((index: number) => (el: HTMLDivElement | null) => {
    sentenceRefs.current[index] = el;
  }, []);

  // 更新组件的渲染返回
  return (
    <div 
      className={cn(
        "prose w-full",
        "px-4 sm:px-6 md:px-8",
        "text-[16px]",
        "relative",
        "font-normal leading-relaxed",
        "flex flex-col",
        className
      )}
      style={{
        letterSpacing: 'normal',
        wordSpacing: 'normal',
        fontFeatureSettings: '"kern"',
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
        minWidth: 0,
        flex: '1 1 auto'
      }}
    >
      {sentences.map((sentence, index) => (
        <div
          key={index}
          ref={setRef(index)}
          className={cn(
            "group relative w-full",
            "flex flex-col",
            "min-w-0"
          )}
          onClick={() => handleSentenceClick(sentence, index)}
          onMouseEnter={() => setHoveredSentenceIndex(index)}
          onMouseLeave={() => setHoveredSentenceIndex(null)}
        >
          {renderSentence(
            sentence,
            selectedSentence === sentence,
            playingSentenceIndex === index,
            playingWord,
            fontSizeScale || 1,
            handleWordClick,
            handleWordDoubleClick,
            enableTTS && hoveredSentenceIndex === index,
            (e) => handleSentencePlay(e, sentence, index),
            isLoading && playingSentenceIndex === index
          )}
        </div>
      ))}
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
          onComplete={() => {
            setPlayingSentenceIndex(null);
            setPlayingWord(null);
          }}
        />
      )}
    </div>
  );
}