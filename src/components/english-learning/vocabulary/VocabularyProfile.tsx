import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

interface VocabularyProfileProps {
  assessmentResults: {
    word: string;
    mastery: string;
    level: string;
    responseTime: number;
  }[];
}

export default function VocabularyProfile({ assessmentResults }: VocabularyProfileProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const levelDistribution = useMemo(() => {
    const distribution = assessmentResults.reduce((acc, result) => {
      acc[result.level] = (acc[result.level] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(distribution).map(([level, count], index) => ({
      level: level === 'junior' ? '初中' :
             level === 'senior' ? '高中' :
             level === 'cet4' ? '四级' :
             level === 'cet6' ? '六级' : '高级',
      count,
      color: COLORS[index % COLORS.length]
    }));
  }, [assessmentResults]);

  const masteryDistribution = useMemo(() => {
    const distribution = assessmentResults.reduce((acc, result) => {
      acc[result.mastery] = (acc[result.mastery] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(distribution).map(([mastery, count], index) => ({
      name: mastery === 'FAMILIAR' ? '熟练掌握' :
            mastery === 'CONFIDENT' ? '较好掌握' :
            mastery === 'RECOGNIZED' ? '基本认识' :
            mastery === 'SEEN' ? '见过但不确定' : '完全陌生',
      value: count,
      color: COLORS[index % COLORS.length]
    }));
  }, [assessmentResults]);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">词汇水平分布</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={levelDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="level" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count">
                  {levelDistribution.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      style={{ transition: 'fill-opacity 200ms' }}
                      onMouseEnter={() => setActiveIndex(index)}
                      onMouseLeave={() => setActiveIndex(null)}
                      fillOpacity={activeIndex === null || activeIndex === index ? 1 : 0.6}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">掌握程度分布</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={masteryDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {masteryDistribution.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      style={{ transition: 'fill-opacity 200ms' }}
                      onMouseEnter={() => setActiveIndex(index)}
                      onMouseLeave={() => setActiveIndex(null)}
                      fillOpacity={activeIndex === null || activeIndex === index ? 1 : 0.6}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}