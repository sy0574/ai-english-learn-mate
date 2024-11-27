import React, { useState } from 'react';
import { Volume2, PauseCircle, PlayCircle, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Slider } from '@/components/ui/slider';
import { useTTS } from '@/contexts/TTSContext';
import { VOICES } from '@/lib/config/ttsConfig';

export function GlobalTTSController() {
  const { voice, setVoice, rate, setRate, isPlaying, playText, stopPlaying, selectedText } = useTTS();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleMouseEnter = () => {
    setIsSettingsOpen(true);
  };

  const handleMouseLeave = () => {
    setIsSettingsOpen(false);
  };

  const handlePlayPause = async () => {
    if (isPlaying) {
      stopPlaying();
    } else if (selectedText) {
      await playText(selectedText);
    }
  };

  if (!selectedText && !isPlaying) {
    return null;
  }

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
}
