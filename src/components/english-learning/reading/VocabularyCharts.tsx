import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Treemap
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { WordBankEntry } from '@/lib/wordBank';

interface VocabularyChartsProps {
  words: Array<{
    word: string;
    occurrences: number;
    difficulty: string;
  }>;
  bankAnalysis: {
    inBank: WordBankEntry[];
    notInBank: string[];
    coverage: number;
  };
}

// Enhanced color palette for better visualization
const COLORS = [
  '#007AFF', // iOS Blue
  '#34C759', // iOS Green
  '#FF9500', // iOS Orange
  '#FF3B30', // iOS Red
  '#5856D6', // iOS Purple
  '#FF2D55', // iOS Pink
  '#64D2FF', // iOS Light Blue
  '#30B0C7', // iOS Teal
  '#FFD60A', // iOS Yellow
  '#BF5AF2', // iOS Violet
];

const HOVER_OPACITY = 0.8;

export default function VocabularyCharts({ words, bankAnalysis }: VocabularyChartsProps) {
  const frequencyData = useMemo(() => {
    return words
      .sort((a, b) => b.occurrences - a.occurrences)
      .slice(0, 10)
      .map(item => ({
        word: item.word,
        frequency: item.occurrences
      }));
  }, [words]);

  const coverageData = useMemo(() => {
    const _total = bankAnalysis.inBank.length + bankAnalysis.notInBank.length;
    return [
      {
        name: '词库外',
        value: bankAnalysis.inBank.length
      },
      {
        name: '词库内',
        value: bankAnalysis.notInBank.length
      }
    ];
  }, [bankAnalysis]);

  const tagsDistribution = useMemo(() => {
    const tagsCount: Record<string, number> = {};
    let _totalTags = 0;
    
    bankAnalysis.inBank.forEach(word => {
      word.tags.forEach(tag => {
        tagsCount[tag] = (tagsCount[tag] || 0) + 1;
        _totalTags++;
      });
    });

    return Object.entries(tagsCount)
      .map(([name, value]) => ({
        name,
        value,
        percentage: (value / _totalTags * 100).toFixed(1)
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [bankAnalysis]);

  const levelDistribution = useMemo(() => {
    const distribution: Record<string, number> = {
      junior: 0,
      senior: 0,
      cet4: 0,
      cet6: 0,
      advanced: 0
    };

    bankAnalysis.inBank.forEach(word => {
      distribution[word.level]++;
    });

    return Object.entries(distribution).map(([level, count]) => ({
      level: level === 'junior' ? '中考' :
             level === 'senior' ? '高考' :
             level === 'cet4' ? '四级' :
             level === 'cet6' ? '六级' : '高级',
      count
    }));
  }, [bankAnalysis]);

  const renderCustomizedLabel = ({ cx, cy, midAngle, outerRadius, percent, name }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = outerRadius * 1.1;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    const color = name === '词库外' ? COLORS[0] : COLORS[1];
    
    return (
      <text 
        x={x} 
        y={y} 
        fill={color}
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="text-sm font-medium"
      >
        {`${name} ${(Number(percent) * 100).toFixed(1)}%`}
      </text>
    );
  };

  const CustomTreemapContent = ({ root: _root, _depth, x, y, width, height, index, name, value }: any) => {
    const percentage = value / _root.value * 100;
    return (
      <g>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          style={{
            fill: COLORS[index % COLORS.length],
            stroke: '#fff',
            strokeWidth: 2,
            strokeOpacity: 1,
            cursor: 'pointer',
            transition: 'fill-opacity 200ms',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.fillOpacity = HOVER_OPACITY;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.fillOpacity = 1;
          }}
        />
        {width > 40 && height > 40 && (
          <text
            x={x + width / 2}
            y={y + height / 2}
            textAnchor="middle"
            dominantBaseline="central"
            style={{
              fill: '#fff',
              fontSize: '12px',
              fontWeight: 500,
              pointerEvents: 'none',
              textShadow: '0 1px 2px rgba(0,0,0,0.4)',
            }}
          >
            <tspan x={x + width / 2} dy="-0.5em">{name}</tspan>
            <tspan x={x + width / 2} dy="1.2em">{`${percentage.toFixed(1)}%`}</tspan>
          </text>
        )}
      </g>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">词频分布</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={frequencyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="word" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="frequency" fill={COLORS[0]}>
                  {frequencyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">词库覆盖率</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={coverageData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {coverageData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]}
                      style={{ transition: 'fill-opacity 200ms' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.fillOpacity = HOVER_OPACITY;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.fillOpacity = 1;
                      }}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">知识广度</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <Treemap
                data={tagsDistribution}
                dataKey="value"
                aspectRatio={4 / 3}
                stroke="#fff"
                content={CustomTreemapContent}
              >
                <Tooltip
                  content={({ payload }) => {
                    if (!payload?.[0]?.payload) return null;
                    const { name, value, percentage } = payload[0].payload;
                    return (
                      <div className="bg-white/90 backdrop-blur-sm p-2 rounded-lg shadow-lg border text-sm">
                        <div className="font-medium">{name}</div>
                        <div className="text-muted-foreground">
                          数量: {value} ({percentage}%)
                        </div>
                      </div>
                    );
                  }}
                />
              </Treemap>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">各级词汇量</CardTitle>
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
                      fill={COLORS[index % COLORS.length]}
                      style={{ transition: 'fill-opacity 200ms' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.fillOpacity = HOVER_OPACITY;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.fillOpacity = 1;
                      }}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}