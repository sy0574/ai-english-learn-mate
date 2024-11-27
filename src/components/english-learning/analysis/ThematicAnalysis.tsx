import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface ThematicAnalysisProps {
  thematicWords?: string[];
  keyWords?: Array<{
    word: string;
    importance: number;
    reason: string;
  }>;
}

export default function ThematicAnalysis({
  thematicWords = [],
  keyWords = []
}: ThematicAnalysisProps) {
  const keyWordsData = keyWords.map(item => ({
    word: item.word,
    importance: item.importance,
  }));

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <h4 className="font-medium mb-3">主题词</h4>
        <div className="flex flex-wrap gap-2">
          {thematicWords.map((word, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
            >
              {word}
            </span>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <h4 className="font-medium mb-3">关键词重要性分析</h4>
        {keyWordsData.length > 0 ? (
          <>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={keyWordsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="word" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="importance" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <ScrollArea className="h-[200px] mt-4">
              <div className="space-y-3">
                {keyWords.map((item, index) => (
                  <div key={index} className="p-3 bg-secondary rounded-lg">
                    <div className="font-medium mb-1">{item.word}</div>
                    <p className="text-sm text-muted-foreground">{item.reason}</p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </>
        ) : (
          <div className="text-center text-muted-foreground py-8">
            暂无关键词分析数据
          </div>
        )}
      </Card>
    </div>
  );
}