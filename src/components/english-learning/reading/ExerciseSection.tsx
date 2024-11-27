import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Brain, Target, Lightbulb, Clock, Sparkles } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface Question {
  id: number;
  text: string;
  options: { key: string; value: string }[];
  correctAnswer: string;
  skillType: '细节理解' | '推理能力' | '词义理解' | '逻辑顺序' | '预测推理';
  analysis: string;
}

const questions: Question[] = [
  {
    id: 1,
    text: "In Mum's opinion, Mr Hewitt never smiles because ________.",
    options: [
      { key: 'A', value: 'he is easy to get angry' },
      { key: 'B', value: 'he has nothing to smile about' },
      { key: 'C', value: 'he refuses to spend time on silly laughter' },
      { key: 'D', value: 'he has to be serious and strict in order to manage the class well' }
    ],
    correctAnswer: 'D',
    skillType: '推理能力',
    analysis: '需要理解Mrs Kent的话语暗示，特别是"with thirty kids like you in class who talk all the time"表明了管理课堂的需求。'
  },
  {
    id: 2,
    text: 'The underlined word "sigh" in Paragraph 7 shows Sarah felt _______ at that time.',
    options: [
      { key: 'A', value: 'angry' },
      { key: 'B', value: 'helpless' },
      { key: 'C', value: 'afraid' },
      { key: 'D', value: 'tired' }
    ],
    correctAnswer: 'B',
    skillType: '词义理解',
    analysis: '考察"sigh"这个动作所反映的情感，需要结合上下文分析人物的心理状态。'
  },
  {
    id: 3,
    text: "What happened in Sarah's and Ben's dreams?",
    options: [
      { key: 'A', value: 'They dreamt of different people.' },
      { key: 'B', value: 'They dreamt of a lovely man with two big bright eyes.' },
      { key: 'C', value: 'The Lord of Tears would make the world full of tears.' },
      { key: 'D', value: 'The man in their dreams was the master of the world and controlled everything.' }
    ],
    correctAnswer: 'C',
    skillType: '细节理解',
    analysis: '测试对故事重要转折点（梦境内容）的理解，需要准确提取和归纳关键信息。'
  },
  {
    id: 4,
    text: 'Which is the correct order of what happened in the story?',
    options: [
      { key: 'A', value: 'd-e-b-c-a' },
      { key: 'B', value: 'd-e-b-a-c' },
      { key: 'C', value: 'e-b-d-c-a' },
      { key: 'D', value: 'e-d-b-a-c' }
    ],
    correctAnswer: 'B',
    skillType: '逻辑顺序',
    analysis: '考察对文章时间线索的把握，要求重构事件发生的先后顺序。'
  },
  {
    id: 5,
    text: 'According to the story, what did Sarah and Ben probably do next?',
    options: [
      { key: 'A', value: 'They went to school together.' },
      { key: 'B', value: "They didn't believe the dream." },
      { key: 'C', value: 'They broke the Mirror of Smiles.' },
      { key: 'D', value: 'They went to find the Lord of Tears together.' }
    ],
    correctAnswer: 'D',
    skillType: '预测推理',
    analysis: '根据已有信息推测故事的后续发展，考察逻辑思维能力。'
  }
];

const skillIcons = {
  '细节理解': Brain,
  '推理能力': Lightbulb,
  '词义理解': Sparkles,
  '逻辑顺序': Clock,
  '预测推理': Target
};

export default function ExerciseSection() {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [showAnalysis, setShowAnalysis] = useState<Record<number, boolean>>({});

  const handleAnswerSelect = (questionId: number, answer: string) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const toggleAnalysis = (questionId: number) => {
    setShowAnalysis(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };

  return (
    <ScrollArea className="h-[calc(100vh-16rem)]">
      <div className="space-y-6 p-1">
        {questions.map((question) => {
          const Icon = skillIcons[question.skillType];
          const isAnswered = selectedAnswers[question.id] !== undefined;
          const isCorrect = selectedAnswers[question.id] === question.correctAnswer;

          return (
            <Card key={question.id} className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2 text-sm text-[#86868B]">
                  <Icon className="w-4 h-4" />
                  <span>{question.skillType}</span>
                </div>
                <CardTitle className="text-base font-medium mt-2">
                  {question.id}. {question.text}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={selectedAnswers[question.id]}
                  onValueChange={(value) => handleAnswerSelect(question.id, value)}
                  className="space-y-2"
                >
                  {question.options.map((option) => (
                    <div key={option.key} className="flex items-center space-x-2">
                      <RadioGroupItem
                        value={option.key}
                        id={`q${question.id}-${option.key}`}
                        className="border-[#D2D2D7]"
                      />
                      <Label
                        htmlFor={`q${question.id}-${option.key}`}
                        className="text-sm"
                      >
                        {option.key}. {option.value}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>

                {isAnswered && (
                  <div className="mt-4">
                    <div className={`text-sm ${isCorrect ? 'text-[#2E7D32]' : 'text-[#C62828]'}`}>
                      {isCorrect ? '✓ 回答正确' : `✗ 正确答案是 ${question.correctAnswer}`}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleAnalysis(question.id)}
                      className="mt-2 text-[#007AFF]"
                    >
                      {showAnalysis[question.id] ? '隐藏解析' : '查看解析'}
                    </Button>
                    {showAnalysis[question.id] && (
                      <div className="mt-2 text-sm text-[#86868B] bg-[#F5F5F7] p-3 rounded-lg">
                        {question.analysis}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </ScrollArea>
  );
}