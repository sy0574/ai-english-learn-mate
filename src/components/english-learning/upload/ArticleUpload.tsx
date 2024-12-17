import { useState, useEffect } from 'react';
import { Upload, FileText, X, ImagePlus, Loader2, Mic, MicOff } from 'lucide-react';
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
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

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
  const [selectedLanguage, setSelectedLanguage] = useState<string>('zh-CN');
  const [isAppendMode, setIsAppendMode] = useState(false);
  const [tempTranscript, setTempTranscript] = useState('');

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();

  const languages = [
    { code: 'zh-CN', name: '中文' },
    { code: 'en-US', name: 'English' },
    { code: 'ja-JP', name: '日本語' },
    { code: 'ko-KR', name: '한국어' },
  ];

  useEffect(() => {
    if (transcript) {
      setTempTranscript(transcript);
      if (isAppendMode) {
        setContent(prev => prev + (prev ? '\n' : '') + transcript);
      } else {
        setContent(transcript);
      }
    }
  }, [transcript, isAppendMode]);

  const startListening = () => {
    if (!browserSupportsSpeechRecognition) {
      toast.error('您的浏览器不支持语音识别功能');
      return;
    }
    resetTranscript();
    setTempTranscript('');
    SpeechRecognition.startListening({ 
      continuous: true,
      language: selectedLanguage
    });
  };

  const stopListening = () => {
    SpeechRecognition.stopListening();
  };

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
      <Button 
        onClick={() => setOpen(true)} 
        className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 px-6"
      >
        <Upload className="w-4 h-4" />
        上传要学的内容
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
                placeholder="文字输入/粘贴输入"
                required
              />
              <div className="flex justify-end items-center gap-3">
                <div className="flex items-center gap-2 p-2 rounded-lg border border-input bg-background/50 shadow-sm">
                  <select
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    className="h-8 rounded-md bg-transparent px-2 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    {languages.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.name}
                      </option>
                    ))}
                  </select>

                  <div className="w-[1px] h-6 bg-border/50" />

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsAppendMode(!isAppendMode)}
                    className={`transition-all duration-200 ${isAppendMode ? 'bg-primary/15 text-primary hover:bg-primary/20' : 'hover:bg-secondary/50'}`}
                  >
                    {isAppendMode ? '追加模式' : '覆盖模式'}
                  </Button>

                  <div className="w-[1px] h-6 bg-border/50" />

                  <Button
                    type="button"
                    variant={listening ? "destructive" : "ghost"}
                    size="icon"
                    className={`transition-all duration-300 ${
                      listening 
                        ? 'animate-pulse shadow-md shadow-red-200' 
                        : 'hover:bg-secondary/50'
                    }`}
                    onClick={listening ? stopListening : startListening}
                  >
                    {listening ? (
                      <MicOff className="h-4 w-4" />
                    ) : (
                      <Mic className="h-4 w-4" />
                    )}
                  </Button>
                </div>

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
                  className={`cursor-pointer inline-flex items-center justify-center gap-2 text-sm font-medium transition-all duration-200 rounded-md px-3 h-9
                    ${isProcessingImage 
                      ? 'bg-primary/10 text-primary border-primary/20' 
                      : 'border border-input bg-background hover:bg-secondary/50'}`}
                >
                  {isProcessingImage ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      识别中...
                    </>
                  ) : (
                    <>
                      <ImagePlus className="h-4 w-4" />
                      拍照输入
                    </>
                  )}
                </Label>
              </div>
              {listening && (
                <div className="mt-2 space-y-2 animate-fadeIn">
                  <div className="flex items-center gap-2 text-sm text-primary">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    正在录音...
                  </div>
                  {tempTranscript && (
                    <div className="text-sm p-3 bg-secondary/30 rounded-lg border border-secondary transition-all duration-300 hover:border-primary/30">
                      当前识别: {tempTranscript}
                    </div>
                  )}
                </div>
              )}
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