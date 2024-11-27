import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { VOICES } from '@/lib/config/ttsConfig';

interface TTSContextType {
  voice: string;
  setVoice: (voice: string) => void;
  rate: number;
  setRate: (rate: number) => void;
  isPlaying: boolean;
  playText: (text: string) => Promise<void>;
  stopPlaying: () => void;
  selectedText: string;
  setSelectedText: (text: string) => void;
}

const TTSContext = createContext<TTSContextType | undefined>(undefined);

export function TTSProvider({ children }: { children: React.ReactNode }) {
  const [voice, setVoice] = useState(VOICES[0].value);
  const [rate, setRate] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stopPlaying = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const playText = useCallback(async (text: string) => {
    try {
      stopPlaying();
      
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          voice,
          rate,
        }),
      });

      if (!response.ok) {
        throw new Error('TTS request failed');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };

      setIsPlaying(true);
      await audio.play();
    } catch (error) {
      console.error('Error playing TTS:', error);
      setIsPlaying(false);
    }
  }, [voice, rate, stopPlaying]);

  const value = {
    voice,
    setVoice,
    rate,
    setRate,
    isPlaying,
    playText,
    stopPlaying,
    selectedText,
    setSelectedText,
  };

  return <TTSContext.Provider value={value}>{children}</TTSContext.Provider>;
}

export function useTTS() {
  const context = useContext(TTSContext);
  if (context === undefined) {
    throw new Error('useTTS must be used within a TTSProvider');
  }
  return context;
}
