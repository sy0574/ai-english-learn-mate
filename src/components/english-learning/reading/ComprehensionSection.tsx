import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { analyzeArticleWithAI, AIResponseError, AIValidationError, AINetworkError } from '@/lib/api/aiAnalysis';
import type { AIAnalysisResult } from '@/lib/api/types';
import AIAnalysisDialog from './AIAnalysisDialog';
import { Alert, AlertCircle, AlertTitle, AlertDescription } from '@/components/ui/alert';

interface ComprehensionSectionProps {
  mainIdea: string;
  keyPoints: string[];
  logicalFlow: string[];
  content: string;
}

export default function ComprehensionSection({
  mainIdea,
  keyPoints,
  logicalFlow,
  content
}: ComprehensionSectionProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAIAnalysis = async () => {
    if (!content?.trim()) {
      toast.error('请先选择或上传文章');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const result = await analyzeArticleWithAI(content);
      setAiAnalysis(result);
      setShowAnalysis(true);
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
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={handleAIAnalysis}
          disabled={isAnalyzing}
        >
          <Sparkles className="w-4 h-4" />
          {isAnalyzing ? 'AI 分析中...' : 'AI 辅助分析'}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>分析失败</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        <section className="space-y-2">
          <h4 className="font-medium">主旨大意</h4>
          <p className="text-muted-foreground text-sm">{mainIdea}</p>
        </section>

        <section className="space-y-2">
          <h4 className="font-medium">关键细节</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {keyPoints.map((point, index) => (
              <li key={index}>• {point}</li>
            ))}
          </ul>
        </section>

        <section className="space-y-2">
          <h4 className="font-medium">逻辑关系</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {logicalFlow.map((flow, index) => (
              <li key={index}>{index + 1}. {flow}</li>
            ))}
          </ul>
        </section>
      </div>

      {aiAnalysis && (
        <AIAnalysisDialog
          open={showAnalysis}
          onOpenChange={setShowAnalysis}
          analysis={aiAnalysis}
        />
      )}
    </div>
  );
}