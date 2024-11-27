import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Book, GitFork, Lightbulb } from 'lucide-react';
import ComponentBreakdown from './ComponentBreakdown';
import GrammarExplanation from './GrammarExplanation';
import StructurePattern from './StructurePattern';
import type { GrammaticalType } from '@/lib/api/types';

// 共享颜色常量，确保所有组件使用相同的颜色方案
export const COMPONENT_COLORS = {
  subject: 'bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-200',
  predicate: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200',
  object: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200',
  complement: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200',
  modifier: 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-200',
  conjunction: 'bg-violet-100 text-violet-800 dark:bg-violet-900/50 dark:text-violet-200',
  preposition: 'bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900/50 dark:text-fuchsia-200',
  clause: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-200',
  phrase: 'bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-200'
} as const;

interface SentenceStructureAnalysisProps {
  sentence: string;
  components: Array<{
    text: string;
    type: GrammaticalType;
    explanation: string;
    clauseType?: 'main' | 'coordinate' | 'subordinate';
  }>;
  structure: {
    level: 'simple' | 'compound' | 'complex';
    patterns: string[];
    explanation: string;
  };
}

export default function SentenceStructureAnalysis({
  sentence,
  components,
  structure
}: SentenceStructureAnalysisProps) {
  const [selectedComponent, setSelectedComponent] = useState<GrammaticalType | null>(null);

  return (
    <Card className="p-4">
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-lg font-medium">
          <Book className="w-5 h-5 text-primary" />
          句子结构分析
        </div>

        <div className="space-y-6">
          {/* Original Sentence */}
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm font-medium">原句：</p>
            <p className="mt-1 text-muted-foreground">{sentence}</p>
          </div>

          {/* Component Breakdown */}
          <section className="space-y-2">
            <div className="flex items-center gap-2 font-medium">
              <GitFork className="w-4 h-4" />
              成分分析
            </div>
            <ComponentBreakdown
              components={components}
              selectedComponent={selectedComponent}
              onComponentSelect={setSelectedComponent}
            />
          </section>

          {/* Structure Pattern */}
          <section className="space-y-2">
            <div className="flex items-center gap-2 font-medium">
              <Lightbulb className="w-4 h-4" />
              句型结构
            </div>
            <StructurePattern structure={structure} />
          </section>

          {/* Grammar Rules */}
          <ScrollArea className="h-[200px]">
            <GrammarExplanation
              selectedComponent={selectedComponent}
              components={components}
            />
          </ScrollArea>
        </div>
      </div>
    </Card>
  );
}