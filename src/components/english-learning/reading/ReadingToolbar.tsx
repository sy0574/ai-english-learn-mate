import { Button } from '@/components/ui/button';
import ArticleUpload from '../upload/ArticleUpload';
import type { Article } from '@/types/article';

interface ReadingToolbarProps {
  onArticleUpload: (article: Omit<Article, 'id' | 'createdAt'>) => void;
}

export default function ReadingToolbar({ onArticleUpload }: ReadingToolbarProps) {
  return (
    <div className="flex items-center">
      <ArticleUpload onUpload={onArticleUpload} />
    </div>
  );
}