import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { Brain, Target, TrendingUp, Book } from 'lucide-react';
import { VocabularyAssessor, VOCABULARY_LEVELS } from '@/lib/vocabularyAssessment';
import { useWordBank } from '@/lib/wordBank';

const LEVEL_COLORS = {
  JUNIOR: '#4CAF50',
  SENIOR: '#2196F3',
  CET4: '#9C27B0',
  CET6: '#FF9800',
  ADVANCED: '#F44336'
};

export default function VocabularyProfile() {
  const { wordBank } = useWordBank();
  const [assessor] = useState(() => new VocabularyAssessor(wordBank));
  const [_profile, setProfile] = useState(assessor.generateProfile());

  // 计算总体掌握进度
  const totalProgress = Math.round(
    (_profile.activeVocabulary / VOCABULARY_LEVELS.CET6.maxWords) * 100
  );

  // 计算各级别达成率
  const levelProgress = Object.entries(_profile.levelDistribution).map(([level, count]) => {
    const levelConfig = VOCABULARY_LEVELS[level as keyof typeof VOCABULARY_LEVELS];
    const progress = Math.round((count / (levelConfig.maxWords - levelConfig.minWords)) * 100);
    return {
      level: levelConfig.name,
      count,
      progress,
      color: LEVEL_COLORS[level as keyof typeof LEVEL_COLORS]
    };
  });

  // 主题强度数据处理
  const topicData = _profile.topicStrengths.map(topic => ({
    name: topic.topic,
    score: Math.round((topic.score / topic.total) * 100)
  }));

  return (
    <div className="space-y-6">
      {/* 总体进度卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Book className="w-4 h-4 text-primary" />
            <h3 className="font-medium">词汇量</h3>
          </div>
          <div className="text-2xl font-bold mb-2">{_profile.activeVocabulary}</div>
          <Progress value={totalProgress} className="h-2" />
          <p className="text-sm text-muted-foreground mt-2">
            活跃词汇量 / 目标词汇量
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="w-4 h-4 text-primary" />
            <h3 className="font-medium">掌握程度</h3>
          </div>
          <div className="text-2xl font-bold mb-2">
            {Math.round((_profile.activeVocabulary / _profile.totalWords) * 100)}%
          </div>
          <Progress 
            value={(_profile.activeVocabulary / _profile.totalWords) * 100} 
            className="h-2" 
          />
          <p className="text-sm text-muted-foreground mt-2">
            活跃词汇 / 总词汇量
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-primary" />
            <h3 className="font-medium">学习目标</h3>
          </div>
          <div className="text-2xl font-bold mb-2">
            {VOCABULARY_LEVELS.CET6.maxWords - _profile.activeVocabulary}
          </div>
          <Progress 
            value={totalProgress} 
            className="h-2" 
          />
          <p className="text-sm text-muted-foreground mt-2">
            距离六级词汇量
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <h3 className="font-medium">近期进度</h3>
          </div>
          <div className="text-2xl font-bold mb-2">
            {_profile.recentProgress[_profile.recentProgress.length - 1].newWords}
          </div>
          <Progress 
            value={_profile.recentProgress[_profile.recentProgress.length - 1].newWords * 10} 
            className="h-2" 
          />
          <p className="text-sm text-muted-foreground mt-2">
            今日新增词汇量
          </p>
        </Card>
      </div>

      {/* 详细分析图表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-4">
          <h3 className="font-medium mb-4">词汇量分布</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={levelProgress}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="level" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count">
                  {levelProgress.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="font-medium mb-4">学习进度</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={_profile.recentProgress}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="newWords" 
                  stroke="#4CAF50" 
                  name="新词"
                />
                <Line 
                  type="monotone" 
                  dataKey="reviewedWords" 
                  stroke="#2196F3" 
                  name="复习"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="font-medium mb-4">主题掌握度</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topicData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="score" fill="#4CAF50" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}