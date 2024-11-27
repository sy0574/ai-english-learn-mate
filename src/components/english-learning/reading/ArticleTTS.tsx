import { useState, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import { PauseCircle, PlayCircle, Settings } from 'lucide-react';
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
  const [rate, setRate] = useState(1.0);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const handleMouseEnter = () => {
    setIsSettingsOpen(true);
  };

  const handleMouseLeave = () => {
    setIsSettingsOpen(false);
  };

  const handlePlayPause = useCallback(async () => {
    if (isPlaying) {
      setIsPlaying(false);
      setCurrentIndex(-1);
      if (onSentenceHighlight) {
        onSentenceHighlight('');
      }
    } else {
      setIsPlaying(true);
      setCurrentIndex(0);
      if (sentences.length > 0 && onSentenceHighlight) {
        onSentenceHighlight(sentences[0]);
      }
    }
  }, [isPlaying, sentences, onSentenceHighlight]);

  useImperativeHandle(ref, () => ({
    play: () => {
      if (!isPlaying) {
        handlePlayPause();
      }
    },
    stop: () => {
      if (isPlaying) {
        handlePlayPause();
      }
    },
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
          </div>
        </div>
      )}

      <div className="flex gap-2 items-center bg-background border rounded-lg p-2 shadow-lg">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsSettingsOpen(!isSettingsOpen)}
        >
          <Settings className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={handlePlayPause}
        >
          {isPlaying ? (
            <PauseCircle className="h-4 w-4" />
          ) : (
            <PlayCircle className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
});

ArticleTTS.displayName = 'ArticleTTS';

export default ArticleTTS;
