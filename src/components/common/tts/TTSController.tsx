'use client'

import React, { forwardRef, useImperativeHandle, useState, useEffect, useCallback } from 'react';
import { PauseCircle, PlayCircle } from 'lucide-react';
import { 
  ArrowDown, 
  ArrowRight, 
  ArrowLeft, 
  RotateCw, 
  Mic2, 
  FileText, 
  Speech, // User2
  Volume2,
  Headphones,
  Radio,
  ChevronRight, 
  ChevronLeft 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { useTTS } from '@/contexts/TTSContext';
import { TTS_VOICES } from '@/lib/config/ttsConfig';
import { cn } from '@/lib/utils';
import { PlayMode } from '@/types';
import { TTSEventEmitter } from '@/lib/tts/events/TTSEventEmitter';
import { TTSEvent } from '@/lib/tts/domain/types';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

/**
 * 统一的 TTS 控制器组件
 * 
 * @example
 * // 基本用法
 * <TTSController text="要朗读的文本" />
 * 
 * // 带回调的用法
 * <TTSController 
 *   text={["句子1", "句子2"]} 
 *   onTextHighlight={(text) => console.log('当前朗读:', text)}
 * />
 * 
 * // 使用 ref 控制
 * const ttsRef = useRef<TTSControllerRef>(null);
 * // ...
 * ttsRef.current?.play();
 */

export interface TTSControllerProps {
  /** 要朗读的文本，可以是单个字符串或字符串数组 */
  text: string | string[];
  /** 当前朗读文本变化时调用 */
  onTextHighlight?: (text: string) => void;
  /** 播放完成时调用 */
  onComplete?: () => void;
  /** 自定义样式类 */
  className?: string;
  /** 控制器的定位方式 */
  position?: 'fixed' | 'relative';
  /** 是否显示设置面板 */
  showSettings?: boolean;
}

export interface TTSControllerRef {
  /** 开始播放，可选指定从哪个索引开始 */
  play: (index?: number) => Promise<void>;
  /** 停止播放 */
  stop: () => void;
  /** 播放下一个 */
  next: () => Promise<void>;
  /** 播放上一个 */
  previous: () => Promise<void>;
}

const TTSController = forwardRef<TTSControllerRef, TTSControllerProps>(({
  text,
  onTextHighlight,
  onComplete,
  className,
  position = 'fixed',
  showSettings = true,
}, ref) => {
  const { 
    voice, 
    setVoice, 
    rate, 
    setRate, 
    fontSizeScale,
    setFontSizeScale,
    isPlaying,
    playMode,
    setPlayMode,
    playText,
    stopPlaying,
    progress
  } = useTTS();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [showRatePanel, setShowRatePanel] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState("00:00");
  const [duration, setDuration] = useState("00:00");
  const { toast } = useToast();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showCollapseButton, setShowCollapseButton] = useState(false);

  const texts = Array.isArray(text) ? text : [text];

  // 监听音频进度和时间更新
  useEffect(() => {
    const eventEmitter = TTSEventEmitter.getInstance();
    
    const unsubscribeProgress = eventEmitter.subscribe(TTSEvent.PlaybackProgress, (state: any) => {
      if (state.currentTime !== undefined && state.duration !== undefined) {
        // 更新时间显示
        const formatTime = (seconds: number) => {
          const mins = Math.floor(seconds / 60);
          const secs = Math.floor(seconds % 60);
          return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        };
        
        setCurrentTime(formatTime(state.currentTime));
        setDuration(formatTime(state.duration));
      }
    });

    return () => {
      unsubscribeProgress();
    };
  }, []);

  // 监听播放完成事件
  useEffect(() => {
    const eventEmitter = TTSEventEmitter.getInstance();
    
    const unsubscribeComplete = eventEmitter.subscribe(TTSEvent.ItemComplete, () => {
      setCurrentIndex(prev => {
        const nextIndex = prev + 1;
        if (nextIndex >= texts.length) {
          onComplete?.();  // 当所有文本播放完成时调用 onComplete
          return prev;
        }
        return nextIndex;
      });
    });

    return () => {
      unsubscribeComplete();
    };
  }, [texts, onComplete]);

  const handlePlay = useCallback(async (startIndex: number = currentIndex) => {
    try {
      if (isPlaying) {
        console.log('[TTSController] Stopping playback');
        stopPlaying();
      } else {
        console.log('[TTSController] Starting playback from index:', startIndex);
        setCurrentIndex(startIndex);
        await playText(texts, startIndex, onTextHighlight);
      }
    } catch (error) {
      console.error('[TTSController] Error during playback:', error);
      toast({
        variant: "destructive",
        title: "播放失败",
        description: "无法播放音频，请稍后重试",
      });
      stopPlaying();
    }
  }, [currentIndex, isPlaying, stopPlaying, playText, texts, onTextHighlight, toast]);

  const handleNext = useCallback(async () => {
    // 在单句循环模式下不允许切换句子
    if (playMode === PlayMode.SINGLE_LOOP) {
      return;
    }

    const nextIndex = currentIndex + 1;
    if (nextIndex >= texts.length) {
      if (playMode === PlayMode.LOOP) {
        await handlePlay(0);
      } else {
        stopPlaying();
      }
      return;
    }
    await handlePlay(nextIndex);
  }, [currentIndex, texts, playMode, handlePlay, stopPlaying]);

  const handlePrevious = useCallback(async () => {
    // 在单句循环模式下不允许切换句子
    if (playMode === PlayMode.SINGLE_LOOP) {
      return;
    }

    const prevIndex = currentIndex - 1;
    if (prevIndex < 0) {
      if (playMode === PlayMode.LOOP) {
        await handlePlay(texts.length - 1);
      } else {
        stopPlaying();
      }
      return;
    }
    await handlePlay(prevIndex);
  }, [currentIndex, texts, playMode, handlePlay, stopPlaying]);

  // 添加键盘事件监听
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // 如果用户正在输入或处于单句循环模式，不处理键盘事件
      if (event.target instanceof HTMLInputElement || 
          event.target instanceof HTMLTextAreaElement ||
          playMode === PlayMode.SINGLE_LOOP) {
        return;
      }

      switch (event.key) {
        case 'ArrowLeft':
          handlePrevious();
          break;
        case 'ArrowRight':
          handleNext();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrevious, playMode]);

  useImperativeHandle(ref, () => ({
    play: handlePlay,
    stop: stopPlaying,
    next: handleNext,
    previous: handlePrevious,
  }));

  const handlePlayModeChange = () => {
    const modes = [
      PlayMode.SINGLE,
      PlayMode.SEQUENTIAL,
      PlayMode.LOOP,
      PlayMode.SINGLE_LOOP
    ];
    const currentIndex = modes.indexOf(playMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setPlayMode(modes[nextIndex]);
  };

  const playModeIcons: Record<PlayMode, JSX.Element> = {
    [PlayMode.SINGLE]: <ArrowDown className="h-5 w-5" />,
    [PlayMode.SEQUENTIAL]: <ArrowRight className="h-5 w-5" />,
    [PlayMode.LOOP]: <RotateCw className="h-5 w-5" />,
    [PlayMode.SINGLE_LOOP]: <div className="relative">
      <ArrowDown className="h-5 w-5" />
      <RotateCw className="h-3 w-3 absolute -right-1 -bottom-1" />
    </div>
  };

  const playModeTooltips: Record<PlayMode, string> = {
    [PlayMode.SINGLE]: '单次播放',
    [PlayMode.SEQUENTIAL]: '连续播放',
    [PlayMode.LOOP]: '循环播放',
    [PlayMode.SINGLE_LOOP]: '单句循环'
  };

  const controlIcons = {
    rate: <span className="text-xl font-medium">1.0x</span>,
    playMode: playModeIcons[playMode],
    readMode: <FileText className="h-6 w-6" />,
    voice: <Mic2 className="h-6 w-6" />,
    wordList: <FileText className="h-6 w-6" />
  } as const;

  const controlLabels = {
    rate: '倍速',
    playMode: playModeTooltips[playMode],
    readMode: '阅读模式',
    voice: '跟读原文',
    wordList: '单词练习'
  } as const;

  const positionClass = position === 'fixed' 
    ? 'fixed bottom-4 right-4 z-50' 
    : 'relative';

  return (
    <div 
      className={cn(positionClass, className)}
      onMouseEnter={() => setShowCollapseButton(true)}
      onMouseLeave={() => setShowCollapseButton(false)}
    >
      <div className={cn(
        "flex bg-white dark:bg-gray-800 rounded-lg shadow-lg transition-all duration-300 ease-in-out",
        isCollapsed ? "w-[52px] p-2" : "w-auto p-4",
        "relative group"
      )}>
        {/* 折叠按钮 */}
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "absolute -left-2 top-1/2 -translate-y-1/2 h-5 w-5 p-0",
            "rounded-full bg-white/90 dark:bg-gray-800/90 shadow-sm",
            "hover:bg-white dark:hover:bg-gray-800 hover:shadow-md",
            "transition-all duration-200",
            "opacity-0 group-hover:opacity-100",
            showCollapseButton ? "opacity-100" : "opacity-0"
          )}
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? (
            <ChevronRight className="h-3 w-3" />
          ) : (
            <ChevronLeft className="h-3 w-3" />
          )}
        </Button>

        {/* 主内容区 */}
        <div className={cn(
          "flex flex-col gap-4 transition-all duration-300",
          isCollapsed ? "opacity-0 w-0" : "opacity-100 w-auto"
        )}>
          {!isCollapsed && (
            <>
              {/* 顶部控制栏 */}
              <div className="flex items-center justify-between w-full min-w-[280px]">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => setShowRatePanel(!showRatePanel)}
                  >
                    <span className="text-xl font-medium">{rate.toFixed(1)}x</span>
                    <span className="text-sm text-gray-600 dark:text-gray-300">{controlLabels.rate}</span>
                  </Button>
                </div>
                <div className="flex items-center gap-4">
                  {Object.entries(controlIcons).slice(1).map(([key, icon]) => (
                    <div key={key} className="flex flex-col items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={key === 'playMode' ? handlePlayModeChange : undefined}
                      >
                        {icon}
                      </Button>
                      <span className="text-xs text-gray-600 dark:text-gray-300">
                        {controlLabels[key as keyof typeof controlLabels]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 倍速和字体调节面板 */}
              {showRatePanel && (
                <div className="space-y-4 border-t pt-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <label className="text-sm font-medium">语速调节</label>
                      <span className="text-sm text-muted-foreground">{rate}x</span>
                    </div>
                    <Slider
                      value={[rate]}
                      onValueChange={([value]) => setRate(value)}
                      min={0.5}
                      max={3}
                      step={0.1}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <label className="text-sm font-medium">字体缩放</label>
                      <span className="text-sm text-muted-foreground">{fontSizeScale}x</span>
                    </div>
                    <Slider
                      value={[fontSizeScale]}
                      onValueChange={([value]) => setFontSizeScale(value)}
                      min={0.5}
                      max={10}
                      step={0.1}
                      className="w-full"
                    />
                  </div>
                </div>
              )}

              {/* 进度条 */}
              <div className="w-full">
                <Slider
                  value={[progress]}
                  min={0}
                  max={100}
                  step={0.1}
                  className="w-full"
                  disabled={!isPlaying}
                />
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-gray-500">{currentTime}</span>
                  <span className="text-xs text-gray-500">{duration}</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* 播放控制按钮组 */}
        <div className={cn(
          "flex items-center gap-2 transition-all duration-300",
          isCollapsed ? "w-auto" : "ml-4"
        )}>
          {!isCollapsed && (
            <div className="flex items-center">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                      className={cn(
                        "relative",
                        isSettingsOpen && "bg-accent",
                        !isSettingsOpen && "animate-pulse-subtle after:absolute after:content-[''] after:w-2 after:h-2 after:bg-green-500 after:rounded-full after:-top-1 after:-right-1"
                      )}
                    >
                      <Speech className="h-5 w-5" />
                      <span className="sr-only">Change Speake Voicer</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>换朗读者声音</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}

          <div className={cn(
            "flex items-center",
            isCollapsed ? "gap-0" : "gap-2"
          )}>
            {!isCollapsed && (
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={handlePrevious}
                disabled={playMode === PlayMode.SINGLE_LOOP}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "rounded-full hover:bg-gray-100 dark:hover:bg-gray-700",
                isCollapsed ? "h-8 w-8 p-0" : "h-10 w-10"
              )}
              onClick={() => handlePlay()}
            >
              {isPlaying ? (
                <PauseCircle className={cn(isCollapsed ? "h-6 w-6" : "h-8 w-8")} />
              ) : (
                <PlayCircle className={cn(isCollapsed ? "h-6 w-6" : "h-8 w-8")} />
              )}
            </Button>

            {!isCollapsed && (
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={handleNext}
                disabled={playMode === PlayMode.SINGLE_LOOP}
              >
                <ArrowRight className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 语音选择面板 */}
      {showSettings && isSettingsOpen && !isCollapsed && (
        <div className="absolute bottom-full mb-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 w-[300px]">
          {/* 主要语音区域 */}
          <div className="space-y-3">
            {/* 英语区域 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">English Accents</span>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setVoice(TTS_VOICES.US.MALE)}
                    className={cn(
                      "h-6 w-8 p-0",
                      voice === TTS_VOICES.US.MALE && "bg-primary/10"
                    )}
                  >
                    🇺🇸
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setVoice(TTS_VOICES.GB.MALE)}
                    className={cn(
                      "h-6 w-8 p-0",
                      voice === TTS_VOICES.GB.MALE && "bg-primary/10"
                    )}
                  >
                    🇬🇧
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setVoice(TTS_VOICES.AU.MALE)}
                    className={cn(
                      "h-6 w-8 p-0",
                      voice === TTS_VOICES.AU.MALE && "bg-primary/10"
                    )}
                  >
                    🇦🇺
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { value: TTS_VOICES.US.MALE, label: '🇺🇸 Natural', desc: 'US Male' },
                  { value: TTS_VOICES.US.FEMALE, label: '🇺🇸 Clear', desc: 'US Female' },
                  { value: TTS_VOICES.GB.MALE, label: '🇬🇧 Natural', desc: 'UK Male' },
                  { value: TTS_VOICES.GB.FEMALE, label: '🇬🇧 Clear', desc: 'UK Female' },
                  { value: TTS_VOICES.AU.MALE, label: '🇦🇺 Natural', desc: 'AU Male' },
                  { value: TTS_VOICES.AU.FEMALE, label: '🇦🇺 Clear', desc: 'AU Female' },
                ].map(v => (
                  <Button
                    key={v.value}
                    variant={v.value === voice ? "default" : "outline"}
                    className="h-[52px] justify-start flex-col items-start p-2 space-y-0.5"
                    onClick={() => setVoice(v.value)}
                  >
                    <span className="text-sm">{v.label}</span>
                    <span className="text-[10px] opacity-60">{v.desc}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* 其他英语变体 */}
            <div className="space-y-2">
              <span className="text-sm font-medium">More Accents</span>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { value: TTS_VOICES.CA.MALE, label: '🇨🇦 Natural', desc: 'CA Male' },
                  { value: TTS_VOICES.CA.FEMALE, label: '🇨🇦 Clear', desc: 'CA Female' },
                  { value: TTS_VOICES.IN.MALE, label: '🇮🇳 Natural', desc: 'IN Male' },
                  { value: TTS_VOICES.IN.FEMALE, label: '🇮🇳 Clear', desc: 'IN Female' },
                  { value: TTS_VOICES.SG.MALE, label: '🇸🇬 Natural', desc: 'SG Male' },
                  { value: TTS_VOICES.SG.FEMALE, label: '🇸🇬 Clear', desc: 'SG Female' },
                ].map(v => (
                  <Button
                    key={v.value}
                    variant={v.value === voice ? "default" : "outline"}
                    className="h-[52px] justify-start flex-col items-start p-2 space-y-0.5"
                    onClick={() => setVoice(v.value)}
                  >
                    <span className="text-sm">{v.label}</span>
                    <span className="text-[10px] opacity-60">{v.desc}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* 亚洲语言 */}
            <div className="space-y-2">
              <span className="text-sm font-medium">Asian Languages</span>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { value: TTS_VOICES.CN.MALE, label: '🇨🇳 Natural', desc: '云希' },
                  { value: TTS_VOICES.CN.FEMALE, label: '🇨🇳 Clear', desc: '晓晓' },
                  { value: TTS_VOICES.JP.MALE, label: '🇯🇵 Natural', desc: 'Keita' },
                  { value: TTS_VOICES.JP.FEMALE, label: '🇯🇵 Clear', desc: 'Nanami' },
                  { value: TTS_VOICES.KR.MALE, label: '🇰🇷 Natural', desc: 'InJoon' },
                  { value: TTS_VOICES.KR.FEMALE, label: '🇰🇷 Clear', desc: 'SunHi' },
                ].map(v => (
                  <Button
                    key={v.value}
                    variant={v.value === voice ? "default" : "outline"}
                    className="h-[52px] justify-start flex-col items-start p-2 space-y-0.5"
                    onClick={() => setVoice(v.value)}
                  >
                    <span className="text-sm">{v.label}</span>
                    <span className="text-[10px] opacity-60">{v.desc}</span>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

TTSController.displayName = 'TTSController';

export default TTSController; 