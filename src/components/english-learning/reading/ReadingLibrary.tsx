import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Filter, BookOpen, Loader2, Trash2, Edit, Trash } from 'lucide-react';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { X } from 'lucide-react';

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
    return validateImageUrl(imageUrl) ? imageUrl! : FALLBACK_IMAGE;
  } catch {
    return FALLBACK_IMAGE;
  }
}

export default function ReadingLibrary({ onSelectReading }: ReadingLibraryProps) {
  const { articles, loading, error, deleteArticle, updateArticle } = useArticles();
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editDifficulty, setEditDifficulty] = useState<Article['difficulty']>('intermediate');
  const [editTags, setEditTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

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

  const handleEditArticle = async (article: Article) => {
    setEditingArticle(article);
    setEditTitle(article.title);
    setEditContent(article.content);
    setEditDifficulty(article.difficulty);
    setEditTags([...article.tags]);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingArticle) return;

    const wordsPerMinute = 200;
    const wordCount = editContent.split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / wordsPerMinute);

    const success = await updateArticle({
      ...editingArticle,
      title: editTitle,
      content: editContent,
      difficulty: editDifficulty,
      tags: editTags,
      readingTime
    });

    if (success) {
      toast.success('文章更新成功');
      setEditDialogOpen(false);
    } else {
      toast.error('更新文章失败');
    }
  };

  const addTag = () => {
    if (currentTag && !editTags.includes(currentTag)) {
      setEditTags([...editTags, currentTag]);
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setEditTags(editTags.filter(tag => tag !== tagToRemove));
  };

  const filteredArticles = articles.filter(article => {
    const searchLower = searchQuery.toLowerCase();
    return (
      article.title.toLowerCase().includes(searchLower) ||
      article.content.toLowerCase().includes(searchLower) ||
      article.tags.some(tag => tag.toLowerCase().includes(searchLower))
    );
  });

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
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline" size="icon">
          <Filter className="w-4 h-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredArticles.map((article) => (
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
              <div className="absolute top-2 right-2 flex gap-2">
                <Button
                  variant="secondary"
                  size="icon"
                  className="w-8 h-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditArticle(article);
                  }}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  className="w-8 h-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteArticle(article.id);
                  }}
                >
                  <Trash className="w-4 h-4" />
                </Button>
              </div>
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

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>编辑文章</DialogTitle>
            <DialogDescription>
              修改文章信息，所有字段都为必填项
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); handleSaveEdit(); }} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="edit-title">文章标题</Label>
              <Input
                id="edit-title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="输入文章标题"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-content">文章内容</Label>
              <Textarea
                id="edit-content"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-[200px]"
                placeholder="粘贴文章内容"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>难度级别</Label>
              <div className="flex gap-2">
                {(['beginner', 'intermediate', 'advanced'] as const).map((level) => (
                  <Button
                    key={level}
                    type="button"
                    variant={editDifficulty === level ? 'default' : 'outline'}
                    onClick={() => setEditDifficulty(level)}
                  >
                    {level === 'beginner' ? '初级' : level === 'intermediate' ? '中级' : '高级'}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>标签</Label>
              <div className="flex gap-2">
                <Input
                  value={currentTag}
                  onChange={(e) => setCurrentTag(e.target.value)}
                  placeholder="添加标签"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={addTag}
                >
                  添加
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {editTags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-secondary text-secondary-foreground rounded-full text-sm flex items-center gap-1"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="text-muted-foreground hover:text-foreground"
                      title={`删除标签 ${tag}`}
                      aria-label={`删除标签 ${tag}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                取消
              </Button>
              <Button type="submit">
                保存
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}