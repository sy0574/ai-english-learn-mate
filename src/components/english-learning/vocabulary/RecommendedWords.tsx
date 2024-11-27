import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RefreshCw, Volume2, Plus } from 'lucide-react';
import { VocabularyAssessor } from '@/lib/vocabularyAssessment';
import { useWordBank } from '@/lib/wordBank';
import type { WordBankEntry } from '@/lib/wordBank';

export default function RecommendedWords() {
  const { wordBank } = useWordBank();
  const [assessor] = useState(() => new VocabularyAssessor(wordBank));
  const [recommendedWords, setRecommendedWords] = useState<WordBankEntry[]>([]);

  useEffect(() => {
    refreshRecommendations();
  }, []);

  const refreshRecommendations = () => {
    setRecommendedWords(assessor.getRecommendedWords(10));
  };

  const playPronunciation = (word: string) => {
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium">推荐学习</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={refreshRecommendations}
          className="gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          换一批
        </Button>
      </div>

      <ScrollArea className="h-[400px]">
        <div className="space-y-4">
          {recommendedWords.map((word) => (
            <div
              key={word.word}
              className="p-4 bg-card rounded-lg border hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{word.word}</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => playPronunciation(word.word)}
                      className="h-6 w-6 p-0"
                    >
                      <Volume2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {word.translation}
                  </p>
                </div>
                <Button variant="outline" size="sm" className="gap-2">
                  <Plus className="w-4 h-4" />
                  添加
                </Button>
              </div>

              <div className="mt-3 space-y-2">
                <div className="flex flex-wrap gap-2">
                  {word.partOfSpeech.map((pos, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-secondary text-secondary-foreground rounded-full text-xs"
                    >
                      {pos}
                    </span>
                  ))}
                </div>

                {word.examples.length > 0 && (
                  <div className="text-sm text-muted-foreground italic">
                    例句: {word.examples[0]}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
}