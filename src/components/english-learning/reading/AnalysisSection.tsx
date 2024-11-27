import { useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Brain,
  GitFork,
  BookText,
  Target,
  Sparkles,
  BookOpen
} from 'lucide-react';
import ArticleMindMap from '../mindmap/ArticleMindMap';
import VocabularySection from './VocabularySection';
import ExerciseSection from './ExerciseSection';
import AIAnalysis from '../analysis/AIAnalysis';
import SentenceParser from '../sentence/SentenceParser';
import type { ArticleAnalysis } from '@/types/article';
import type { AIAnalysisResult } from '@/lib/api/types';

interface AnalysisSectionProps {
  selectedText: string;
  analysis: ArticleAnalysis | null;
  aiAnalysis: AIAnalysisResult | null;
  onAiAnalysisComplete: (result: AIAnalysisResult) => void;
  selectedWord?: string;
  selectedSentence?: string;
  _onSentenceSelect?: (sentence: string) => void;
}

export default function AnalysisSection({ 
  selectedText, 
  analysis,
  aiAnalysis,
  onAiAnalysisComplete,
  selectedWord,
  selectedSentence,
  _onSentenceSelect
}: AnalysisSectionProps) {
  const analysisRef = useRef<HTMLDivElement>(null);

  // 当选中新句子时，确保分析面板可见
  useEffect(() => {
    if (selectedSentence && analysisRef.current) {
      analysisRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedSentence]);

  if (!analysis) {
    return (
      <Card className="flex flex-col h-full">
        <div className="p-6 text-center text-muted-foreground">
          <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>上传文章后查看分析结果</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-full overflow-hidden" ref={analysisRef}>
      <Tabs defaultValue="vocabulary" className="flex flex-col h-full">
        <div className="border-b p-4">
          <h3 className="text-xl font-semibold mb-2">阅读分析</h3>
          <TabsList className="w-full justify-start bg-secondary rounded-lg p-1">
            <TabsTrigger
              value="vocabulary"
              className="flex-1 data-[state=active]:bg-background data-[state=active]:text-primary"
            >
              <BookText className="w-4 h-4 mr-2" />
              词汇
            </TabsTrigger>
            <TabsTrigger
              value="sentence"
              className="flex-1 data-[state=active]:bg-background data-[state=active]:text-primary"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              句型
            </TabsTrigger>
            <TabsTrigger
              value="ai-analysis"
              className="flex-1 data-[state=active]:bg-background data-[state=active]:text-primary"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              AI 分析
            </TabsTrigger>
            <TabsTrigger
              value="structure"
              className="flex-1 data-[state=active]:bg-background data-[state=active]:text-primary"
            >
              <GitFork className="w-4 h-4 mr-2" />
              结构
            </TabsTrigger>
            <TabsTrigger
              value="exercise"
              className="flex-1 data-[state=active]:bg-background data-[state=active]:text-primary"
            >
              <Target className="w-4 h-4 mr-2" />
              练习
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-hidden">
          <TabsContent value="vocabulary" className="h-full p-4">
            <ScrollArea className="h-full">
              <VocabularySection 
                text={selectedText} 
                selectedWord={selectedWord}
              />
            </ScrollArea>
          </TabsContent>

          <TabsContent value="sentence" className="h-full p-4">
            <ScrollArea className="h-full">
              <div className="space-y-4">
                {!selectedSentence ? (
                  <div className="text-center text-muted-foreground py-12">
                    <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>点击文章中的句子进行句型分析</p>
                  </div>
                ) : (
                  <SentenceParser sentence={selectedSentence} />
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="ai-analysis" className="h-full p-4">
            <ScrollArea className="h-full">
              <AIAnalysis 
                content={selectedText} 
                savedAnalysis={aiAnalysis}
                onAnalysisComplete={onAiAnalysisComplete}
              />
            </ScrollArea>
          </TabsContent>

          <TabsContent value="structure" className="h-full p-4">
            <ScrollArea className="h-full">
              <div className="space-y-6">
                <section className="space-y-3">
                  <h4 className="font-medium">文章结构</h4>
                  <div className="space-y-2">
                    {analysis.structure.outline.map((item, index) => (
                      <div
                        key={index}
                        className="pl-4"
                        style={{ marginLeft: `${(item.level - 1) * 1.5}rem` }}
                      >
                        <div className="font-medium">{item.content}</div>
                        {item.children?.map((child, childIndex) => (
                          <div
                            key={childIndex}
                            className="text-sm text-muted-foreground ml-4 mt-1"
                          >
                            • {child}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </section>

                <section className="space-y-3">
                  <h4 className="font-medium">思维导图</h4>
                  <ArticleMindMap analysis={analysis} />
                </section>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="exercise" className="h-full">
            <ScrollArea className="h-full">
              <ExerciseSection />
            </ScrollArea>
          </TabsContent>
        </div>
      </Tabs>
    </Card>
  );
}