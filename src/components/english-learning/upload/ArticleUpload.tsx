import { useState } from 'react';
import { Upload, FileText, X, ImagePlus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Article } from '@/types/article';
import { createWorker } from 'tesseract.js';

interface ArticleUploadProps {
  onUpload: (article: Omit<Article, 'id' | 'createdAt'>) => void;
}

export default function ArticleUpload({ onUpload }: ArticleUploadProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [difficulty, setDifficulty] = useState<Article['difficulty']>('intermediate');
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      toast.error('标题和内容不能为空');
      return;
    }

    // Calculate approximate reading time (words per minute)
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / wordsPerMinute);

    onUpload({
      title,
      content,
      difficulty,
      tags,
      readingTime
    });

    // Reset form and close dialog
    setTitle('');
    setContent('');
    setDifficulty('intermediate');
    setTags([]);
    setCurrentTag('');
    setOpen(false);
    
    toast.success('文章上传成功');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      toast.error('请上传图片文件');
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('图片大小不能超过5MB');
      return;
    }

    setIsProcessingImage(true);
    try {
      const worker = await createWorker('eng+chi_sim');
      
      const imageUrl = URL.createObjectURL(file);
      const { data: { text } } = await worker.recognize(imageUrl);
      
      await worker.terminate();
      URL.revokeObjectURL(imageUrl);

      if (text.trim()) {
        setContent(text.trim());
        toast.success('文字识别成功');
      } else {
        toast.error('未能识别出文字，请尝试其他图片');
      }
    } catch (error) {
      console.error('OCR error:', error);
      toast.error('文字识别失败，请重试');
    } finally {
      setIsProcessingImage(false);
    }
  };

  const addTag = () => {
    if (currentTag && !tags.includes(currentTag)) {
      setTags([...tags, currentTag]);
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button onClick={() => setOpen(true)} className="gap-2">
        <Upload className="w-4 h-4" />
        添加新篇
      </Button>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>您正在读|正在写的内容:</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">标题</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="输入标题"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">内容</Label>
            <div className="flex flex-col gap-2">
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[200px]"
                placeholder="粘贴内容"
                required
              />
              <div className="flex justify-end gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                  disabled={isProcessingImage}
                />
                <Label
                  htmlFor="image-upload"
                  className="cursor-pointer inline-flex items-center justify-center gap-2 text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 rounded-md px-3"
                >
                  {isProcessingImage ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      识别中...
                    </>
                  ) : (
                    <>
                      <ImagePlus className="h-4 w-4" />
                      OCR识别
                    </>
                  )}
                </Label>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>难度级别</Label>
            <div className="flex gap-2">
              {(['beginner', 'intermediate', 'advanced'] as const).map((level) => (
                <Button
                  key={level}
                  type="button"
                  variant={difficulty === level ? 'default' : 'outline'}
                  onClick={() => setDifficulty(level)}
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
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-secondary text-secondary-foreground rounded-full text-sm flex items-center gap-1"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              取消
            </Button>
            <Button type="submit">
              <FileText className="w-4 h-4 mr-2" />
              添加
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}