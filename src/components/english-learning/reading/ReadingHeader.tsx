import { BookOpen } from 'lucide-react';
import ReadingToolbar from './ReadingToolbar';
import type { Article } from '@/types/article';

interface ReadingHeaderProps {
  onArticleUpload: (article: Omit<Article, 'id' | 'createdAt'>) => void;
}

export default function ReadingHeader({ onArticleUpload }: ReadingHeaderProps) {
  return (
    <div className="border-b border-[#E5E5E5] dark:border-[#2C2C2C] p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-goblin-500" />
          <h3 className="text-xl font-semibold apple-text-primary">
            阅读提升
          </h3>
        </div>
        <ReadingToolbar onArticleUpload={onArticleUpload} />
      </div>
      <p className="apple-text-secondary text-sm">
        Expand our horizon every day!
      </p>
    </div>
  );
}