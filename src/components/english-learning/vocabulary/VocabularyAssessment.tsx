import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowRight, CheckCircle2, XCircle, HelpCircle, Loader2 } from 'lucide-react';
import { VocabularyAssessor } from '@/lib/vocabularyAssessment';
import { useWordBank } from '@/lib/wordBank';

const ASSESSMENT_SIZE = 50; // 每轮测试的单词数量

interface AssessmentWord {
  word: string;
  translation: string;
  known?: boolean;
}

interface VocabularyAssessmentProps {
  onComplete: () => void;
}

export default function VocabularyAssessment({ onComplete }: VocabularyAssessmentProps) {
  const { wordBank, loading, error } = useWordBank();
  const [assessor, setAssessor] = useState<VocabularyAssessor | null>(null);
  const [step, setStep] = useState<'intro' | 'assessment' | 'result'>('intro');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [assessmentWords, setAssessmentWords] = useState<AssessmentWord[]>([]);

  useEffect(() => {
    if (wordBank?.length) {
      const newAssessor = new VocabularyAssessor(wordBank);
      setAssessor(newAssessor);
      initializeAssessmentWords(wordBank);
    }
  }, [wordBank]);

  const initializeAssessmentWords = (bank: typeof wordBank) => {
    if (!bank?.length) return;
    
    const words = [...bank]
      .sort(() => Math.random() - 0.5)
      .slice(0, ASSESSMENT_SIZE)
      .map(entry => ({
        word: entry.word,
        translation: entry.translation
      }));
    
    setAssessmentWords(words);
  };
  
  const progress = Math.round((currentIndex / ASSESSMENT_SIZE) * 100);

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">加载词库数据...</p>
        </div>
      </Card>
    );
  }

  if (error || !wordBank?.length) {
    return (
      <Card className="p-6">
        <div className="text-center py-12">
          <p className="text-destructive mb-4">加载词库失败，请刷新页面重试</p>
          <Button onClick={() => window.location.reload()}>
            刷新页面
          </Button>
        </div>
      </Card>
    );
  }

  const handleStart = () => {
    initializeAssessmentWords(wordBank);
    setCurrentIndex(0);
    setStep('assessment');
  };

  const handleResponse = (known: boolean) => {
    if (!assessor) return;

    setAssessmentWords(prev => {
      const updated = [...prev];
      if (updated[currentIndex]) {
        updated[currentIndex] = { ...updated[currentIndex], known };
      }
      return updated;
    });

    if (currentIndex < ASSESSMENT_SIZE - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // 评估完成，处理结果
      assessmentWords.forEach(word => {
        if (word.known !== undefined) {
          assessor.assessWord(word.word, '', word.known);
        }
      });
      onComplete();
    }
  };

  if (step === 'intro') {
    return (
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">词汇量评估</h2>
        <p className="text-muted-foreground mb-6">
          通过快速评估帮助我们了解您的词汇水平。评估过程包含 {ASSESSMENT_SIZE} 个单词，
          预计用时 5-10 分钟。请根据您对每个单词的掌握程度做出选择。
        </p>
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-secondary rounded-lg">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <div>
              <p className="font-medium">认识</p>
              <p className="text-sm text-muted-foreground">
                我知道这个单词的含义并能在适当的场合使用它
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 bg-secondary rounded-lg">
            <HelpCircle className="w-5 h-5 text-yellow-500" />
            <div>
              <p className="font-medium">不确定</p>
              <p className="text-sm text-muted-foreground">
                我可能见过这个单词，但不确定它的具体含义
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 bg-secondary rounded-lg">
            <XCircle className="w-5 h-5 text-red-500" />
            <div>
              <p className="font-medium">不认识</p>
              <p className="text-sm text-muted-foreground">
                这是一个我完全不认识的单词
              </p>
            </div>
          </div>
        </div>
        <Button onClick={handleStart} className="w-full mt-6">
          开始评估
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </Card>
    );
  }

  if (step === 'assessment') {
    const currentWord = assessmentWords[currentIndex];
    
    if (!currentWord) {
      return (
        <Card className="p-6">
          <div className="text-center py-12">
            <p className="text-destructive mb-4">评估数据加载失败，请重新开始</p>
            <Button onClick={handleStart}>重新开始</Button>
          </div>
        </Card>
      );
    }

    return (
      <Card className="p-6">
        <div className="mb-6">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>评估进度</span>
            <span>{currentIndex + 1} / {ASSESSMENT_SIZE}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="text-center mb-8">
          <h3 className="text-3xl font-bold mb-2">{currentWord.word}</h3>
          <p className="text-muted-foreground">
            您对这个单词的掌握程度如何？
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Button
            variant="outline"
            className="flex flex-col items-center p-6 hover:bg-green-50 hover:text-green-600 hover:border-green-200"
            onClick={() => handleResponse(true)}
          >
            <CheckCircle2 className="w-8 h-8 mb-2 text-green-500" />
            认识
          </Button>
          <Button
            variant="outline"
            className="flex flex-col items-center p-6 hover:bg-yellow-50 hover:text-yellow-600 hover:border-yellow-200"
            onClick={() => handleResponse(false)}
          >
            <HelpCircle className="w-8 h-8 mb-2 text-yellow-500" />
            不确定
          </Button>
          <Button
            variant="outline"
            className="flex flex-col items-center p-6 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
            onClick={() => handleResponse(false)}
          >
            <XCircle className="w-8 h-8 mb-2 text-red-500" />
            不认识
          </Button>
        </div>
      </Card>
    );
  }

  return null;
}