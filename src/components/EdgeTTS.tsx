import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { PlayCircle, PauseCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTTS } from '@/contexts/TTSContext';
import { TTSEvent } from '@/lib/tts/domain/types';
import { TTSEventEmitter } from '@/lib/tts/events/TTSEventEmitter';

interface EdgeTTSProps {
  text: string;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: any) => void;
  autoPlay?: boolean;
}

const VOICES = [
  { value: 'en-US-ChristopherNeural', label: 'US English (Male)' },
  { value: 'en-US-JennyNeural', label: 'US English (Female)' },
  { value: 'en-GB-RyanNeural', label: 'British English (Male)' },
  { value: 'en-GB-SoniaNeural', label: 'British English (Female)' },
];

export const EdgeTTS: React.FC<EdgeTTSProps> = ({
  text,
  onStart,
  onEnd,
  onError,
  autoPlay = false,
}) => {
  const { toast } = useToast();
  const {
    voice,
    setVoice,
    rate,
    setRate,
    isPlaying,
    isLoading,
    playText,
    stopPlaying
  } = useTTS();

  // 订阅事件
  useEffect(() => {
    const eventEmitter = TTSEventEmitter.getInstance();
    
    const unsubscribeComplete = eventEmitter.subscribe(TTSEvent.QueueComplete, () => {
      onEnd?.();
    });

    const unsubscribeError = eventEmitter.subscribe(TTSEvent.PlaybackError, (error) => {
      console.error('TTS error:', error);
      onError?.(error);
      toast({
        variant: "destructive",
        title: "错误",
        description: "播放失败，请重试"
      });
    });

    return () => {
      unsubscribeComplete();
      unsubscribeError();
    };
  }, [onEnd, onError, toast]);

  // 自动播放
  useEffect(() => {
    if (autoPlay && text) {
      handlePlay();
    }
  }, [autoPlay, text]);

  const handlePlay = async () => {
    try {
      if (isPlaying) {
        stopPlaying();
      } else {
        onStart?.();
        await playText(text);
      }
    } catch (error) {
      console.error('Failed to play:', error);
      onError?.(error);
      toast({
        variant: "destructive",
        title: "错误",
        description: "播放失败，请重试"
      });
    }
  };

  return (
    <div className="flex items-center gap-4 p-4 border rounded-lg">
      <Button
        variant="outline"
        size="icon"
        onClick={handlePlay}
        disabled={isLoading || !text}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isPlaying ? (
          <PauseCircle className="h-4 w-4" />
        ) : (
          <PlayCircle className="h-4 w-4" />
        )}
      </Button>

      <Select value={voice} onValueChange={setVoice}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="选择声音" />
        </SelectTrigger>
        <SelectContent>
          {VOICES.map((v) => (
            <SelectItem key={v.value} value={v.value}>
              {v.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex items-center gap-2">
        <span className="text-sm">速度:</span>
        <Slider
          value={[rate]}
          onValueChange={([value]) => setRate(value)}
          min={0.5}
          max={2}
          step={0.1}
          className="w-[100px]"
          disabled={isPlaying || isLoading}
        />
        <span className="text-sm">{rate}x</span>
      </div>
    </div>
  );
};
