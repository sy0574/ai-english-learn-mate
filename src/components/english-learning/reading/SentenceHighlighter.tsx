import { useMemo, useState, useRef } from 'react';
import { PlayCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ArticleTTS from './ArticleTTS';

interface SentenceHighlighterProps {
  text: string;
  onWordClick?: (word: string) => void;
  onSentenceClick?: (sentence: string) => void;
  selectedSentence?: string;
  className?: string;
  enableTTS?: boolean;
}

function extractSentences(text: string): string[] {
  // Preserve punctuation and handle multiple sentence endings
  const sentenceRegex = /[^.!?]+[.!?]+|\s*$/g;
  const matches = text.match(sentenceRegex);
  return matches ? matches.map(s => s.trim()).filter(Boolean) : [text];
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
  const sentences = useMemo(() => extractSentences(text), [text]);
  const ttsRef = useRef<any>(null);

  const handleWordClick = (e: React.MouseEvent, word: string) => {
    e.stopPropagation();
    onWordClick?.(word);
  };

  const handleSentencePlay = (e: React.MouseEvent, sentence: string, index: number) => {
    e.stopPropagation();
    onSentenceClick?.(sentence);
    if (ttsRef.current) {
      ttsRef.current.handleSentencePlay(sentence, index);
    }
  };

  return (
    <div className={`space-y-2 p-6 ${className}`}>
      {sentences.map((sentence, index) => {
        const parts = parseTextContent(sentence);
        const isSelected = sentence === selectedSentence;
        
        return (
          <div
            key={index}
            className={`relative group cursor-pointer rounded px-2 -mx-2 ${
              isSelected ? 'bg-accent' : 'hover:bg-accent/50'
            }`}
            onClick={() => onSentenceClick?.(sentence)}
            onMouseEnter={() => setHoveredSentenceIndex(index)}
            onMouseLeave={() => setHoveredSentenceIndex(null)}
          >
            <span className="relative">
              {parts.map((part, partIndex) => {
                if (part.type === 'word') {
                  return (
                    <span
                      key={partIndex}
                      className="cursor-pointer hover:text-primary hover:underline"
                      onClick={(e) => handleWordClick(e, part.content)}
                    >
                      {part.content}
                    </span>
                  );
                }
                return <span key={partIndex}>{part.content}</span>;
              })}
            </span>
            
            {/* 悬浮播放按钮 */}
            {hoveredSentenceIndex === index && (
              <Button
                size="icon"
                variant="ghost"
                className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => handleSentencePlay(e, sentence, index)}
              >
                <PlayCircle className="h-4 w-4" />
              </Button>
            )}
          </div>
        );
      })}
      {enableTTS && (
        <ArticleTTS
          ref={ttsRef}
          sentences={sentences}
          onSentenceHighlight={onSentenceClick}
        />
      )}
    </div>
  );
}