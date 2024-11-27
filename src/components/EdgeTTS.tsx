import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { PlayCircle, PauseCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [voice, setVoice] = useState(VOICES[0].value);
  const [rate, setRate] = useState(1);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  const playAudio = useCallback(async () => {
    try {
      setIsLoading(true);
      onStart?.();

      const response = await fetch('http://localhost:3001/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, voice, rate }),
      });

      if (!response.ok) {
        throw new Error('TTS request failed');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      if (audio) {
        audio.pause();
        URL.revokeObjectURL(audio.src);
      }

      const newAudio = new Audio(url);
      newAudio.onended = () => {
        setIsPlaying(false);
        onEnd?.();
      };

      setAudio(newAudio);
      await newAudio.play();
      setIsPlaying(true);
    } catch (error) {
      console.error('TTS error:', error);
      onError?.(error);
      toast({
        variant: "destructive",
        title: "错误",
        description: "播放失败，请重试"
      });
    } finally {
      setIsLoading(false);
    }
  }, [text, voice, rate, audio, onStart, onEnd, onError]);

  const togglePlay = useCallback(() => {
    if (isPlaying && audio) {
      audio.pause();
      setIsPlaying(false);
    } else if (!isPlaying) {
      playAudio();
    }
  }, [isPlaying, audio, playAudio]);

  React.useEffect(() => {
    if (autoPlay) {
      playAudio();
    }
    return () => {
      if (audio) {
        audio.pause();
        URL.revokeObjectURL(audio.src);
      }
    };
  }, [autoPlay]);

  return (
    <div className="flex items-center gap-4 p-4 border rounded-lg">
      <Button
        variant="outline"
        size="icon"
        onClick={togglePlay}
        disabled={isLoading}
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
          {VOICES.map(v => (
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
