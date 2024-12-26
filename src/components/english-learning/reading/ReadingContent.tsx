import { Clock, Download, Loader2 } from 'lucide-react';
import type { Article } from '@/types/article';
import SentenceHighlighter from './SentenceHighlighter';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { TTSStore } from '@/lib/tts/store/TTSStore';
import { useState } from 'react';

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
  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);
  
  if (!article) return null;

  const wordCount = article.content.trim().split(/\s+/).length;

  const handleDownloadAudio = async () => {
    if (isDownloading) return;
    
    try {
      setIsDownloading(true);
      toast({
        title: "正在生成音频...",
        description: "请稍候，正在为您生成文章音频",
      });

      const config = TTSStore.getInstance().getState().config;
      const response = await fetch('https://ai-english-learn-mate-tts.bolone.cn/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: article.content,
          voice: config.voice,
          rate: config.rate,
        }),
      });

      if (!response.ok) {
        throw new Error('生成音频失败');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${article.title}.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "下载成功",
        description: "音频文件已保存到您的下载文件夹",
      });
    } catch (error) {
      console.error('Download audio error:', error);
      toast({
        variant: "destructive",
        title: "下载失败",
        description: "生成音频时出现错误，请稍后重试",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="flex flex-col py-6 px-4">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-4 apple-text-primary">
          {article.title}
        </h2>
        
        <div className="flex flex-wrap items-center gap-3">
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

      <div className="relative bg-card rounded-lg shadow-sm py-6 px-4">
        <SentenceHighlighter
          text={article.content}
          onWordClick={onWordClick}
          onSentenceClick={onSentenceClick}
          selectedSentence={selectedSentence}
          className="leading-relaxed apple-text-primary"
          enableTTS={true}
        />
        
        <div className="sticky bottom-4 flex justify-end">
          <Button
            variant="outline"
            size="icon"
            className="hover:bg-accent"
            onClick={handleDownloadAudio}
            title={isDownloading ? "下载中..." : "下载音频"}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}