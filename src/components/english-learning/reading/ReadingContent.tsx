import { Clock } from 'lucide-react';
import type { Article } from '@/types/article';
import SentenceHighlighter from './SentenceHighlighter';

interface ReadingContentProps {
  article: Article | null;
  onWordClick?: (word: string) => void;
  onSentenceClick?: (sentence: string) => void;
  selectedSentence?: string;
}

export default function ReadingContent({ 
  article, 
  onWordClick,
  onSentenceClick,
  selectedSentence 
}: ReadingContentProps) {
  if (!article) return null;

  const wordCount = article.content.trim().split(/\s+/).length;

  return (
    <div className="h-full flex flex-col">
      <div className="px-6">
        <h2 className="text-2xl font-semibold mb-4 apple-text-primary">
          {article.title}
        </h2>
        
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="flex flex-wrap gap-2">
            {article.tags?.map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 bg-goblin-100 text-goblin-700 dark:bg-goblin-900/30 
                           dark:text-goblin-300 rounded-full text-xs"
              >
                {tag}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            <span>{article.readingTime} mins</span>
            <span className="mx-1">•</span>
            <span>{wordCount} words</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-6">
        <div className="w-full">
          <div className="bg-card rounded-lg shadow-sm overflow-hidden p-6">
            <SentenceHighlighter
              text={article.content}
              onWordClick={onWordClick}
              onSentenceClick={onSentenceClick}
              selectedSentence={selectedSentence}
              className="leading-relaxed apple-text-primary"
              enableTTS={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
}