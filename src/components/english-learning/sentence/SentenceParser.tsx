import { useState, useEffect, useCallback } from 'react';
import { analyzeSentenceStructure, saveSentenceAnalysis } from '@/lib/api/sentenceAnalysis';
import { Button } from '@/components/ui/button';
import { Book, Play, Pause, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useCourseStore } from '@/stores/courseStore';
import SentenceStructureAnalysis from './SentenceStructureAnalysis';
import { throttle } from 'lodash';
import type { SentenceAnalysisResult } from '@/lib/api/types';

interface SentenceParserProps {
  sentence: string;
}

export default function SentenceParser({ sentence }: SentenceParserProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [errorCount, setErrorCount] = useState(0);
  const MAX_ERRORS = 3;
  const ERROR_COOLDOWN = 60000; // 1分钟冷却时间
  const [lastErrorTime, setLastErrorTime] = useState<Date | null>(null);
  
  const { 
    aiGeneratedContent,
    setAiGeneratedContent,
  } = useCourseStore();

  // 添加类型检查和验证
  const analysis = sentence ? 
    (aiGeneratedContent[sentence] as SentenceAnalysisResult | undefined) : null;

  const validateAnalysisResult = (result: any): result is SentenceAnalysisResult => {
    return result 
      && Array.isArray(result.components)
      && typeof result.structure === 'object'
      && Array.isArray(result.rules);
  };

  const handleAnalyze = useCallback(async () => {
    if (!sentence?.trim()) {
      toast.error('请先选择句子');
      return;
    }

    // 检查错误冷却期
    if (lastErrorTime && errorCount >= MAX_ERRORS) {
      const timeSinceLastError = Date.now() - lastErrorTime.getTime();
      if (timeSinceLastError < ERROR_COOLDOWN) {
        toast.error('请等待一分钟后再试');
        return;
      } else {
        // 重置错误计数
        setErrorCount(0);
        setLastErrorTime(null);
      }
    }

    setLoading(true);
    
    try {
      const result = await analyzeSentenceStructure(sentence);
      
      if (!validateAnalysisResult(result)) {
        throw new Error('API返回的数据格式无效');
      }
      
      setAiGeneratedContent(sentence, result);
      setHasChanges(false);
      setErrorCount(0);
      setLastErrorTime(null);
      toast.success('句子分析完成');
    } catch (error) {
      const message = error instanceof Error ? error.message : '分析失败，请重试';
      toast.error(message);
      console.error('Sentence analysis error:', error);
      
      // 更新错误状态
      setErrorCount(prev => prev + 1);
      setLastErrorTime(new Date());
    } finally {
      setLoading(false);
    }
  }, [sentence, errorCount, lastErrorTime, setAiGeneratedContent, setErrorCount, setLastErrorTime]);

  // 使用useCallback包装throttledAnalyze
  const throttledAnalyze = useCallback(
    throttle(handleAnalyze, 5000, { leading: true, trailing: false }),
    [handleAnalyze]
  );

  useEffect(() => {
    if (sentence && !analysis && !loading) {
      throttledAnalyze();
    }
    
    return () => {
      throttledAnalyze.cancel();
    };
  }, [sentence, analysis, loading, throttledAnalyze]);

  const handleSaveAnalysis = async () => {
    if (!sentence || !analysis) return;

    try {
      await saveSentenceAnalysis(sentence, analysis);
      setHasChanges(false);
      toast.success('分析结果已保存');
    } catch (error) {
      const message = error instanceof Error ? error.message : '保存失败，请重试';
      toast.error(message);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">正在分析句子结构...</p>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="text-center py-12">
        <Book className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground mb-4">点击分析按钮开始句型分析</p>
        <Button onClick={throttledAnalyze}>开始分析</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPlaying(!isPlaying)}
            className="gap-2"
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4" />
                停止动画
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                启动动画
              </>
            )}
          </Button>
        </div>
        {hasChanges && (
          <Button
            size="sm"
            onClick={handleSaveAnalysis}
            className="gap-2"
          >
            <Save className="w-4 h-4" />
            保存更改
          </Button>
        )}
      </div>

      <SentenceStructureAnalysis
        sentence={sentence}
        components={analysis.components}
        structure={analysis.structure}
      />
    </div>
  );
}