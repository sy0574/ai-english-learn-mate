import React, { useRef, useEffect } from 'react';
import { Volume2, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useTTS } from '@/contexts/TTSContext';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { TTS_VOICES } from '@/lib/config/ttsConfig';

export function GlobalTTSController() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { 
    isPlaying,
    currentText,
    voice,
    rate,
    volume,
    pitch,
    loopMode,
    setVoice,
    setRate,
    setVolume,
    setPitch,
    setLoopMode,
    togglePlayback,
    stopPlayback
  } = useTTS();

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === ' ' && containerRef.current?.contains(document.activeElement)) {
        e.preventDefault();
        togglePlayback();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [togglePlayback]);

  const handleVoiceChange = (v: string) => {
    setVoice(v);
  };

  return (
    <div ref={containerRef} className="flex items-center space-x-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={togglePlayback}
        disabled={!currentText}
      >
        <Volume2 className={isPlaying ? 'animate-pulse' : ''} />
      </Button>
      
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon">
            <Settings />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="grid gap-4">
            <div className="space-y-2">
              <h4 className="font-medium leading-none">Voice Settings</h4>
              <p className="text-sm text-muted-foreground">
                Adjust the voice parameters for text-to-speech.
              </p>
            </div>
            <div className="grid gap-2">
              <div className="grid grid-cols-3 items-center gap-4">
                <label htmlFor="voice">Voice</label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="col-span-2">
                      {voice}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {Object.entries(TTS_VOICES).map(([region, voices]) =>
                      Object.entries(voices).map(([style, voiceId]) => (
                        <DropdownMenuItem
                          key={voiceId}
                          onSelect={() => handleVoiceChange(voiceId)}
                        >
                          {`${region} ${style}`}
                        </DropdownMenuItem>
                      ))
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              <div className="grid grid-cols-3 items-center gap-4">
                <label htmlFor="rate">Speed</label>
                <Slider
                  id="rate"
                  min={0.5}
                  max={2}
                  step={0.1}
                  value={[rate]}
                  onValueChange={([value]) => setRate(value)}
                  className="col-span-2"
                />
              </div>
              
              <div className="grid grid-cols-3 items-center gap-4">
                <label htmlFor="volume">Volume</label>
                <Slider
                  id="volume"
                  min={0}
                  max={1}
                  step={0.1}
                  value={[volume]}
                  onValueChange={([value]) => setVolume(value)}
                  className="col-span-2"
                />
              </div>
              
              <div className="grid grid-cols-3 items-center gap-4">
                <label htmlFor="pitch">Pitch</label>
                <Slider
                  id="pitch"
                  min={0.5}
                  max={2}
                  step={0.1}
                  value={[pitch]}
                  onValueChange={([value]) => setPitch(value)}
                  className="col-span-2"
                />
              </div>
              
              <div className="grid grid-cols-3 items-center gap-4">
                <label htmlFor="loop">Loop Mode</label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="col-span-2">
                      {loopMode}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onSelect={() => setLoopMode('none')}>
                      None
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setLoopMode('sentence')}>
                      Sentence
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setLoopMode('all')}>
                      All
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
