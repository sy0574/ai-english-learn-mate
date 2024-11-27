import { PlayCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ArticleUpload from '../upload/ArticleUpload';
import type { Article } from '@/types/article';

interface ReadingToolbarProps {
  onArticleUpload: (article: Omit<Article, 'id' | 'createdAt'>) => void;
}

export default function ReadingToolbar({ onArticleUpload }: ReadingToolbarProps) {
  const toolbarButtons = [
    { icon: PlayCircle, label: '朗读文本' },
    { icon: RefreshCw, label: '重置' }
  ];

  return (
    <div className="flex items-center gap-3">
      <div className="flex gap-2">
        {toolbarButtons.map((button) => (
          <Button
            key={button.label}
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-goblin-500"
          >
            <button.icon className="w-4 h-4" />
          </Button>
        ))}
      </div>
      <ArticleUpload onUpload={onArticleUpload} />
    </div>
  );
}