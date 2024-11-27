import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface SentenceAnalysisProps {
  keySentences?: Array<{
    sentence: string;
    importance: number;
    reason: string;
  }>;
}

export default function SentenceAnalysis({ keySentences = [] }: SentenceAnalysisProps) {
  const chartData = keySentences.map((item, index) => ({
    id: index + 1,
    importance: item.importance,
  }));

  return (
    <Card className="p-4">
      <h4 className="font-medium mb-3">关键句分析</h4>
      {keySentences.length > 0 ? (
        <>
          <div className="h-[200px] mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="id" label={{ value: '句子序号', position: 'bottom' }} />
                <YAxis label={{ value: '重要性', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="importance"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--primary))" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <ScrollArea className="h-[300px]">
            <div className="space-y-3">
              {keySentences.map((item, index) => (
                <div key={index} className="p-3 bg-secondary rounded-lg">
                  <div className="font-medium mb-2 text-sm">{item.sentence}</div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{item.reason}</span>
                    <span className="text-primary font-medium">
                      重要性: {item.importance}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </>
      ) : (
        <div className="text-center text-muted-foreground py-8">
          暂无关键句分析数据
        </div>
      )}
    </Card>
  );
}