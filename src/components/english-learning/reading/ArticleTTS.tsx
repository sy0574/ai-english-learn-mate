import React, { useState, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Volume2, PauseCircle, PlayCircle, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';

interface ArticleTTSProps {
  sentences: string[];
  onSentenceHighlight?: (sentence: string) => void;
}

const VOICES = [
  // 美式英语
  { value: 'en-US-ChristopherNeural', label: 'US English (Male - Mature)' },
  { value: 'en-US-JennyNeural', label: 'US English (Female - Natural)' },
  { value: 'en-US-GuyNeural', label: 'US English (Male - Casual)' },
  { value: 'en-US-AriaNeural', label: 'US English (Female - Casual)' },
  // 英式英语
  { value: 'en-GB-RyanNeural', label: 'British English (Male - Mature)' },
  { value: 'en-GB-SoniaNeural', label: 'British English (Female - Natural)' },
];

const ArticleTTS = forwardRef<any, ArticleTTSProps>(({
  sentences,
  onSentenceHighlight,
}: ArticleTTSProps, ref) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [voice, setVoice] = useState(VOICES[0].value);
  const [rate, setRate] = useState(1);
  const [loopMode, setLoopMode] = useState<'none' | 'sentence' | 'selection'>('none');
  const [loopCount, setLoopCount] = useState<number>(1);
  const [currentLoopCount, setCurrentLoopCount] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAnyDropdownOpen, setIsAnyDropdownOpen] = useState(false);
  const settingsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = useCallback(() => {
    if (settingsTimeoutRef.current) {
      clearTimeout(settingsTimeoutRef.current);
    }
    setIsSettingsOpen(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (!isAnyDropdownOpen) {
      settingsTimeoutRef.current = setTimeout(() => {
        setIsSettingsOpen(false);
      }, 300);
    }
  }, [isAnyDropdownOpen]);

  const handleDropdownOpenChange = useCallback((open: boolean) => {
    setIsAnyDropdownOpen(open);
    if (open) {
      setIsSettingsOpen(true);
      if (settingsTimeoutRef.current) {
        clearTimeout(settingsTimeoutRef.current);
      }
    }
  }, []);

  const playAudio = useCallback(async (text: string) => {
    try {
      const response = await fetch('http://localhost:3001/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, voice, rate, loopMode, loopCount }),
      });

      if (!response.ok) {
        throw new Error('TTS request failed');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      if (audioRef.current) {
        audioRef.current.src = url;
        await audioRef.current.play();
      }

      return url;
    } catch (error) {
      console.error('TTS error:', error);
      toast({
        variant: 'destructive',
        title: '播放失败',
        description: '无法生成语音，请重试',
      });
      throw error;
    }
  }, [voice, rate, loopMode, loopCount, toast]);

  const playNext = useCallback(async () => {
    if (currentIndex >= sentences.length - 1) {
      setIsPlaying(false);
      setCurrentIndex(-1);
      return;
    }

    const nextIndex = currentIndex + 1;
    setCurrentIndex(nextIndex);
    onSentenceHighlight?.(sentences[nextIndex]);

    try {
      await playAudio(sentences[nextIndex]);
    } catch {
      setIsPlaying(false);
    }
  }, [currentIndex, sentences, playAudio, onSentenceHighlight]);

  const handleAudioEnd = useCallback(() => {
    if (!isPlaying) return;

    if (loopMode === 'sentence') {
      setCurrentLoopCount(prev => {
        const newCount = prev + 1;
        if (loopCount === -1 || newCount < loopCount) {
          playAudio(sentences[currentIndex]);
          return newCount;
        } else {
          setIsPlaying(false);
          setCurrentIndex(-1);
          setCurrentLoopCount(0);
          return 0;
        }
      });
    } else if (loopMode === 'selection') {
      setCurrentLoopCount(prev => {
        const newCount = prev + 1;
        if (loopCount === -1 || newCount < loopCount) {
          playAudio(sentences[currentIndex]);
          return newCount;
        } else {
          setIsPlaying(false);
          setCurrentIndex(-1);
          setCurrentLoopCount(0);
          return 0;
        }
      });
    } else {
      playNext();
    }
  }, [isPlaying, loopMode, loopCount, currentIndex, sentences, playAudio, playNext]);

  const handlePlay = useCallback(async () => {
    if (isPlaying) {
      setIsPlaying(false);
      setCurrentLoopCount(0);
      if (audioRef.current) {
        audioRef.current.pause();
      }
    } else {
      setIsPlaying(true);
      setCurrentLoopCount(0);
      if (currentIndex === -1) {
        setCurrentIndex(0);
        onSentenceHighlight?.(sentences[0]);
        await playAudio(sentences[0]);
      } else {
        onSentenceHighlight?.(sentences[currentIndex]);
        await playAudio(sentences[currentIndex]);
      }
    }
  }, [isPlaying, currentIndex, sentences, playAudio, onSentenceHighlight]);

  const handleSentencePlay = useCallback(async (sentence: string, index: number) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    
    setCurrentIndex(index);
    setCurrentLoopCount(0);
    setIsPlaying(true);  
    onSentenceHighlight?.(sentence);
    
    try {
      await playAudio(sentence);
    } catch {
      setCurrentIndex(-1);
      setIsPlaying(false);
    }
  }, [playAudio, onSentenceHighlight]);

  useImperativeHandle(ref, () => ({
    handleSentencePlay: async (sentence: string, index: number) => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setCurrentIndex(index);
      setCurrentLoopCount(0);
      setIsPlaying(true);
      onSentenceHighlight?.(sentence);
      try {
        await playAudio(sentence);
      } catch {
        setCurrentIndex(-1);
        setIsPlaying(false);
      }
    }
  }));

  return (
    <div 
      ref={containerRef}
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {isSettingsOpen && (
        <div className="bg-background border rounded-lg shadow-lg p-4 mb-2 min-w-[280px]">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium mb-2 block">Voice</label>
              <RadioGroup
                value={voice}
                onValueChange={setVoice}
                className="grid grid-cols-1 gap-2"
              >
                {VOICES.map((v) => (
                  <div key={v.value} className="flex items-center space-x-2 rounded-md border p-2 cursor-pointer hover:bg-accent">
                    <RadioGroupItem value={v.value} id={v.value} />
                    <Label htmlFor={v.value} className="flex-grow cursor-pointer">
                      {v.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Speed</label>
              <div className="flex items-center gap-2">
                <Slider
                  value={[rate]}
                  min={0.5}
                  max={2}
                  step={0.1}
                  onValueChange={([value]) => setRate(value)}
                  className="flex-1"
                />
                <span className="text-sm w-12">{rate}x</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Loop Mode</label>
              <RadioGroup
                value={loopMode}
                onValueChange={(value: 'none' | 'sentence' | 'selection') => setLoopMode(value)}
                className="grid grid-cols-1 gap-2"
              >
                <div className="flex items-center space-x-2 rounded-md border p-2 cursor-pointer hover:bg-accent">
                  <RadioGroupItem value="none" id="loop-none" />
                  <Label htmlFor="loop-none" className="flex-grow cursor-pointer">
                    No Loop
                  </Label>
                </div>
                <div className="flex items-center space-x-2 rounded-md border p-2 cursor-pointer hover:bg-accent">
                  <RadioGroupItem value="sentence" id="loop-sentence" />
                  <Label htmlFor="loop-sentence" className="flex-grow cursor-pointer">
                    Single Sentence Loop
                  </Label>
                </div>
                <div className="flex items-center space-x-2 rounded-md border p-2 cursor-pointer hover:bg-accent">
                  <RadioGroupItem value="selection" id="loop-selection" />
                  <Label htmlFor="loop-selection" className="flex-grow cursor-pointer">
                    Selection Loop
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {loopMode !== 'none' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Loop Count</label>
                <RadioGroup
                  value={loopCount.toString()}
                  onValueChange={(value) => setLoopCount(value === '-1' ? -1 : parseInt(value))}
                  className="grid grid-cols-2 gap-2"
                >
                  {[1, 2, 3, 5, -1].map((count) => (
                    <div key={count} className="flex items-center space-x-2 rounded-md border p-2 cursor-pointer hover:bg-accent">
                      <RadioGroupItem value={count.toString()} id={`loop-count-${count}`} />
                      <Label htmlFor={`loop-count-${count}`} className="flex-grow cursor-pointer">
                        {count === -1 ? "Infinite" : `${count} time${count > 1 ? 's' : ''}`}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 bg-background border rounded-lg p-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={handlePlay}
          className="hover:bg-accent"
        >
          {isPlaying ? (
            <PauseCircle className="h-6 w-6" />
          ) : (
            <PlayCircle className="h-6 w-6" />
          )}
        </Button>
        <span className="text-sm">
          {isPlaying ? '正在播放' : '点击播放全文'}
        </span>
      </div>

      <audio
        ref={audioRef}
        onEnded={handleAudioEnd}
        className="hidden"
      />
    </div>
  );
});

export default ArticleTTS;
