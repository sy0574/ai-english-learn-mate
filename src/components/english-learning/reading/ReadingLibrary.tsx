import { useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Filter, BookOpen, Loader2, Trash2 } from 'lucide-react';
import { useArticles } from '@/lib/articles';
import type { Article } from '@/types/article';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ReadingLibraryProps {
  onSelectReading: (article: Article) => void;
}

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=800&auto=format&fit=crop';

function validateImageUrl(url: string | undefined): boolean {
  if (!url) return false;
  
  try {
    const parsedUrl = new URL(url);
    return (
      (parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:') &&
      /\.(jpg|jpeg|png|webp|avif|gif|svg)(\?.*)?$/i.test(parsedUrl.pathname)
    );
  } catch {
    return false;
  }
}

function getImageUrl(imageUrl: string | undefined): string {
  try {
    return validateImageUrl(imageUrl) ? imageUrl : FALLBACK_IMAGE;
  } catch {
    return FALLBACK_IMAGE;
  }
}

export default function ReadingLibrary({ onSelectReading }: ReadingLibraryProps) {
  const { articles, loading, error, deleteArticle } = useArticles();

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleDeleteArticle = async (articleId: string) => {
    const success = await deleteArticle(articleId);
    if (success) {
      toast.success('文章已删除');
    } else {
      toast.error('删除文章失败');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[200px]">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input 
            placeholder="搜索阅读材料..." 
            className="pl-10"
          />
        </div>
        <Button variant="outline" size="icon">
          <Filter className="w-4 h-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.map((article) => (
          <Card 
            key={article.id}
            className="overflow-hidden hover:shadow-md transition-shadow"
          >
            <div className="relative w-full h-40">
              <img 
                src={getImageUrl(article.imageUrl)}
                alt={article.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (target.src !== FALLBACK_IMAGE) {
                    target.src = FALLBACK_IMAGE;
                  }
                }}
              />
            </div>
            <div className="p-4 space-y-4">
              <div>
                <h3 className="font-semibold">{article.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {new Date(article.createdAt).toLocaleDateString()}
                </p>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {article.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-secondary text-secondary-foreground rounded-full text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>难度: {
                  article.difficulty === 'beginner' ? '初级' :
                  article.difficulty === 'intermediate' ? '中级' : '高级'
                }</span>
                <span>{article.readingTime} mins</span>
              </div>

              <div className="flex gap-2">
                <Button 
                  className="flex-1"
                  onClick={() => onSelectReading(article)}
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  开始阅读
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="icon">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>确认删除</AlertDialogTitle>
                      <AlertDialogDescription>
                        确定要删除文章 "{article.title}" 吗？此操作无法撤销。
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>取消</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDeleteArticle(article.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        删除
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}