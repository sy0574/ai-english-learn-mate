import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Brain, BookText, MessageSquare } from 'lucide-react';
import ThematicAnalysis from './analysis/ThematicAnalysis';
import SentenceAnalysis from './analysis/SentenceAnalysis';
import BackgroundKnowledge from './analysis/BackgroundKnowledge';
import type { AIAnalysisResult } from '@/lib/api/types';

interface AIAnalysisDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  analysis: AIAnalysisResult | null;
}

export default function AIAnalysisDialog({
  open,
  onOpenChange,
  analysis
}: AIAnalysisDialogProps) {
  if (!analysis) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh]">
        <DialogHeader>
          <DialogTitle>AI 辅助分析</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-full mt-4">
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
                thematicWords={analysis.thematicWords}
                keyWords={analysis.keyWords}
              />
            </TabsContent>

            <TabsContent value="sentences">
              <SentenceAnalysis keySentences={analysis.keySentences} />
            </TabsContent>

            <TabsContent value="background">
              <BackgroundKnowledge backgroundKnowledge={analysis.backgroundKnowledge} />
            </TabsContent>
          </Tabs>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}