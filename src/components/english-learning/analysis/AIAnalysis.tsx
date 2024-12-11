import { useState } from 'react';
import { analyzeArticleWithAI, AIResponseError, AIValidationError, AINetworkError } from '@/lib/api/aiAnalysis';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, BookText, MessageSquare, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ThematicAnalysis from './ThematicAnalysis';
import SentenceAnalysis from './SentenceAnalysis';
import BackgroundKnowledge from './BackgroundKnowledge';
import { Card } from '@/components/ui/card';
import { Alert, AlertCircle, AlertTitle, AlertDescription } from '@/components/ui/alert';
import type { AIAnalysisResult } from '@/lib/api/types';

interface AIAnalysisProps {
  content: string;
  savedAnalysis: AIAnalysisResult | null;
  onAnalysisComplete: (result: AIAnalysisResult) => void;
}

export default function AIAnalysis({ 
  content, 
  savedAnalysis,
  onAnalysisComplete 
}: AIAnalysisProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const performAnalysis = async () => {
    if (!content) {
      toast.error('请先选择或添加文章');
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      const result = await analyzeArticleWithAI(content);
      onAnalysisComplete(result);
      toast.success('AI 分析完成');
    } catch (error) {
      let errorMessage: string;
      
      if (error instanceof AIValidationError) {
        errorMessage = '分析结果格式有误，请重试';
        console.error('数据验证错误:', error.message);
      } else if (error instanceof AIResponseError) {
        errorMessage = 'AI 响应解析失败，请重试';
        console.error('响应解析错误:', error.message);
      } else if (error instanceof AINetworkError) {
        errorMessage = '网络连接失败，请检查网络后重试';
        console.error('网络错误:', error.message);
      } else {
        errorMessage = error instanceof Error ? error.message : 'AI 分析失败，请稍后重试';
        console.error('未知错误:', error);
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!savedAnalysis && !loading) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>分析失败</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="text-center">
            <p className="text-muted-foreground mb-4">点击下方按钮开始 AI 分析</p>
            <Button
              onClick={performAnalysis}
              disabled={loading}
              className="gap-2"
            >
              <Sparkles className="h-4 w-4" />
              {loading ? 'AI 分析中...' : '开始 AI 分析'}
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="h-4 w-4 animate-pulse" />
            <span>AI 正在分析中...</span>
          </div>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-secondary rounded w-3/4 mx-auto" />
            <div className="h-4 bg-secondary rounded w-1/2 mx-auto" />
            <div className="h-4 bg-secondary rounded w-2/3 mx-auto" />
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Tabs defaultValue="thematic" className="space-y-4">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="thematic" className="gap-2">
          <Brain className="h-4 w-4" />
          主题分析
        </TabsTrigger>
        <TabsTrigger value="sentences" className="gap-2">
          <BookText className="h-4 w-4" />
          句子分析
        </TabsTrigger>
        <TabsTrigger value="background" className="gap-2">
          <MessageSquare className="h-4 w-4" />
          背景知识
        </TabsTrigger>
      </TabsList>

      <TabsContent value="thematic">
        <ThematicAnalysis
          thematicWords={savedAnalysis?.thematicWords}
          keyWords={savedAnalysis?.keyWords}
        />
      </TabsContent>

      <TabsContent value="sentences">
        <SentenceAnalysis keySentences={savedAnalysis?.keySentences} />
      </TabsContent>

      <TabsContent value="background">
        <BackgroundKnowledge backgroundKnowledge={savedAnalysis?.backgroundKnowledge} />
      </TabsContent>
    </Tabs>
  );
}