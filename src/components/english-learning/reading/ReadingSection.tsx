import { Upload } from 'lucide-react';
import { Card } from '@/components/ui/card';
import type { Article, ArticleAnalysis } from '@/types/article';
import ReadingHeader from './ReadingHeader';
import ReadingContent from './ReadingContent';

interface ReadingSectionProps {
  currentArticle: Article | null;
  onArticleUpload: (article: Omit<Article, 'id' | 'createdAt'>) => void;
  onWordSelect?: (word: string) => void;
  onSentenceSelect?: (sentence: string) => void;
  selectedSentence?: string;
}

export default function ReadingSection({ 
  currentArticle,
  onArticleUpload,
  onWordSelect,
  onSentenceSelect,
  selectedSentence
}: ReadingSectionProps) {
  return (
    <Card className="flex flex-col h-full">
      <ReadingHeader onArticleUpload={onArticleUpload} />
      
      <div className="flex-1 min-h-0">
        {currentArticle ? (
          <ReadingContent 
            article={currentArticle} 
            onWordClick={onWordSelect}
            onSentenceClick={onSentenceSelect}
            selectedSentence={selectedSentence}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-center apple-text-secondary">
            <div>
              <Upload className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>添加文章或从阅读材料库中选择文章开始阅读训练</p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}