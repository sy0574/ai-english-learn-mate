import { useNavigate } from 'react-router-dom';
import ReadingLibrary from './reading/ReadingLibrary';
import { useCourseStore } from '@/stores/courseStore';
import type { Article } from '@/types/article';

export default function LibraryPage() {
  const navigate = useNavigate();
  const { setSelectedArticle } = useCourseStore();

  const handleArticleSelect = (article: Article) => {
    setSelectedArticle(article);
    navigate('/courses'); // 选择文章后直接跳转到课程页面
  };

  return (
    <div className="h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8">
      <ReadingLibrary onSelectReading={handleArticleSelect} />
    </div>
  );
} 