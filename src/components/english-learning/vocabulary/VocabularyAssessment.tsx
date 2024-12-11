import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowRight, CheckCircle2, XCircle, HelpCircle, Loader2, Brain } from 'lucide-react';
import { VocabularyAssessor, MASTERY_LEVELS } from '@/lib/vocabularyAssessment';
import { useWordBank } from '@/lib/wordBank';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { WordBankEntry } from '@/lib/wordBank';

const ASSESSMENT_SIZE = 50; // 每轮测试的单词数量

interface AssessmentWord {
  word: string;
  translation: string;
  response?: {
    isCorrect: boolean;
    confidence: number;
    responseTime: number;
    confusedWith?: string;
  };
}

interface VocabularyAssessmentProps {
  onComplete: (results: Array<{
    word: string;
    mastery: string;
    level: string;
    responseTime: number;
  }>) => void;
}

export default function VocabularyAssessment({ onComplete }: VocabularyAssessmentProps) {
  const { wordBank, loading, error } = useWordBank();
  const [assessor, setAssessor] = useState<VocabularyAssessor | null>(null);
  const [step, setStep] = useState<'intro' | 'assessment' | 'result'>('intro');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [assessmentWords, setAssessmentWords] = useState<AssessmentWord[]>([]);
  const [startTime, setStartTime] = useState<number>(0);
  const [showTranslation, setShowTranslation] = useState(false);

  useEffect(() => {
    if (wordBank?.length) {
      const newAssessor = new VocabularyAssessor(wordBank);
      setAssessor(newAssessor);
      initializeAssessmentWords(wordBank);
    } else if (!loading && !error) {
      toast.error('词库为空，请确保数据正确加载');
    }
  }, [wordBank, loading, error]);

  const initializeAssessmentWords = (bank: WordBankEntry[]) => {
    if (!bank?.length) {
      console.error('Cannot initialize assessment: word bank is empty');
      toast.error('词库数据不可用');
      return;
    }
    
    // 从不同难度级别选择单词
    const words: AssessmentWord[] = [];
    const levels = ['junior', 'senior', 'cet4', 'cet6', 'advanced'] as const;
    const wordsPerLevel = Math.floor(ASSESSMENT_SIZE / levels.length);
    
    console.log('Initializing assessment words:', {
      totalNeeded: ASSESSMENT_SIZE,
      wordsPerLevel,
      levels,
      bankSize: bank.length
    });

    // 统计每个级别的可用单词数
    const availableByLevel = levels.reduce((acc, level) => {
      acc[level] = bank.filter(entry => entry.level === level).length;
      return acc;
    }, {} as Record<string, number>);

    console.log('Available words by level:', availableByLevel);

    // 动态调整每个级别的单词数量
    let remainingWords = ASSESSMENT_SIZE;
    const targetWordsByLevel = new Map<string, number>();

    // 第一轮：按比例分配
    for (const level of levels) {
      const available = availableByLevel[level];
      const target = Math.min(wordsPerLevel, available, remainingWords);
      targetWordsByLevel.set(level, target);
      remainingWords -= target;
    }

    // 第二轮：分配剩余单词
    if (remainingWords > 0) {
      console.log(`Redistributing ${remainingWords} remaining words`);
      for (const level of levels) {
        const available = availableByLevel[level] - (targetWordsByLevel.get(level) || 0);
        if (available > 0) {
          const additional = Math.min(remainingWords, available);
          targetWordsByLevel.set(level, (targetWordsByLevel.get(level) || 0) + additional);
          remainingWords -= additional;
        }
      }
    }

    console.log('Target words by level:', Object.fromEntries(targetWordsByLevel));

    // 收集每个级别的单词
    for (const level of levels) {
      const targetCount = targetWordsByLevel.get(level) || 0;
      if (targetCount === 0) continue;

      const levelWords = bank
        .filter(entry => entry.level === level)
        .sort(() => Math.random() - 0.5)
        .slice(0, targetCount)
        .map(entry => ({
          word: entry.word,
          translation: entry.translation
        }));
      
      console.log(`Level ${level}:`, {
        targetCount,
        collected: levelWords.length,
        sampleWords: levelWords.slice(0, 3).map(w => w.word)
      });
      
      words.push(...levelWords);
    }

    if (words.length === 0) {
      console.error('No words available for assessment');
      toast.error('无法获取足够的测试单词');
      return;
    }

    if (words.length < ASSESSMENT_SIZE) {
      console.warn(`Only collected ${words.length}/${ASSESSMENT_SIZE} words`);
      toast.warning(`当前仅收集到 ${words.length} 个测试单词，建议先添加更多词汇`);
    }

    // 随机打乱顺序
    const shuffledWords = words.sort(() => Math.random() - 0.5);
    console.log('Final assessment words:', {
      total: shuffledWords.length,
      sample: shuffledWords.slice(0, 3).map(w => w.word)
    });

    setAssessmentWords(shuffledWords);
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
    setStartTime(Date.now());
  };

  const handleResponse = (response: AssessmentWord['response']) => {
    if (!assessor || !response) return;

    setAssessmentWords(prev => {
      const updated = [...prev];
      if (updated[currentIndex]) {
        updated[currentIndex] = { 
          ...updated[currentIndex], 
          response 
        };
      }
      return updated;
    });

    if (currentIndex < ASSESSMENT_SIZE - 1) {
      setCurrentIndex(prev => prev + 1);
      setStartTime(Date.now());
      setShowTranslation(false);
    } else {
      // 评估完成，处理结果
      const results = assessmentWords.map(word => {
        const bankEntry = wordBank.find(entry => entry.word === word.word);
        const response = word.response;
        
        // 如果没有响应，默认为未知
        if (!response) {
          return {
            word: word.word,
            mastery: 'UNKNOWN',
            level: bankEntry?.level || 'unknown',
            responseTime: 0
          };
        }

        // 根据响应计算掌握程度
        let mastery: string;
        if (response.isCorrect) {
          if (response.confidence > 0.8) {
            mastery = 'FAMILIAR';
          } else if (response.confidence > 0.5) {
            mastery = 'CONFIDENT';
          } else {
            mastery = 'RECOGNIZED';
          }
        } else {
          mastery = response.confidence > 0.3 ? 'SEEN' : 'UNKNOWN';
        }

        return {
          word: word.word,
          mastery,
          level: bankEntry?.level || 'unknown',
          responseTime: response.responseTime
        };
      });

      // 更新评估器
      results.forEach(result => {
        assessor.assessWord(result.word, '', {
          isCorrect: result.mastery !== 'UNKNOWN',
          confidence: result.mastery === 'FAMILIAR' ? 1 :
                     result.mastery === 'CONFIDENT' ? 0.8 :
                     result.mastery === 'RECOGNIZED' ? 0.5 :
                     result.mastery === 'SEEN' ? 0.3 : 0,
          responseTime: result.responseTime
        });
      });

      onComplete(results);
    }
  };

  const handleConfidenceResponse = (masteryLevel: keyof typeof MASTERY_LEVELS) => {
    const responseTime = Date.now() - startTime;
    const confidenceMap = {
      FAMILIAR: 1,
      CONFIDENT: 0.8,
      RECOGNIZED: 0.6,
      SEEN: 0.3,
      UNKNOWN: 0
    };
    
    handleResponse({
      isCorrect: masteryLevel !== 'UNKNOWN',
      confidence: confidenceMap[masteryLevel],
      responseTime
    });
  };

  if (step === 'intro') {
    return (
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">词汇量评估</h2>
        <p className="text-muted-foreground mb-6">
          通过科学的评估方法帮助我们了解您的词汇水平。评估包含 {ASSESSMENT_SIZE} 个来自不同难度级别的单词，
          预计用时 10-15 分钟。系统会根据您的反应时间和确信度进行综合评估。
        </p>
        <div className="space-y-4">
          {Object.entries(MASTERY_LEVELS).map(([key, level]) => (
            <div key={key} className="flex items-center gap-4 p-4 bg-secondary rounded-lg">
              <Brain className={cn(
                "w-5 h-5",
                key === 'FAMILIAR' && "text-green-500",
                key === 'CONFIDENT' && "text-blue-500",
                key === 'RECOGNIZED' && "text-yellow-500",
                key === 'SEEN' && "text-orange-500",
                key === 'UNKNOWN' && "text-red-500"
              )} />
              <div>
                <p className="font-medium">{level.description}</p>
                <p className="text-sm text-muted-foreground">
                  {level.criteria}
                </p>
              </div>
            </div>
          ))}
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
          {showTranslation && (
            <p className="text-lg text-muted-foreground mb-4">
              {currentWord.translation}
            </p>
          )}
          <p className="text-muted-foreground">
            您对这个单词的掌握程度如何？
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 mb-4">
          <Button
            variant="outline"
            className="flex items-center justify-center p-6 hover:bg-green-50 hover:text-green-600 hover:border-green-200"
            onClick={() => handleConfidenceResponse('FAMILIAR')}
          >
            <CheckCircle2 className="w-6 h-6 mr-2 text-green-500" />
            熟练掌握（能准确理解和运用，可以解释和造句）
          </Button>
          <Button
            variant="outline"
            className="flex items-center justify-center p-6 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
            onClick={() => handleConfidenceResponse('CONFIDENT')}
          >
            <CheckCircle2 className="w-6 h-6 mr-2 text-blue-500" />
            较好掌握（认识词义，能在大多数场合正确使用）
          </Button>
          <Button
            variant="outline"
            className="flex items-center justify-center p-6 hover:bg-yellow-50 hover:text-yellow-600 hover:border-yellow-200"
            onClick={() => handleConfidenceResponse('RECOGNIZED')}
          >
            <CheckCircle2 className="w-6 h-6 mr-2 text-yellow-500" />
            基本认识（知道基本含义，但可能在使用���不够准确）
          </Button>
          <Button
            variant="outline"
            className="flex items-center justify-center p-6 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200"
            onClick={() => handleConfidenceResponse('SEEN')}
          >
            <HelpCircle className="w-6 h-6 mr-2 text-orange-500" />
            见过但不确定（见过这个词，但不确定具体含义）
          </Button>
          <Button
            variant="outline"
            className="flex items-center justify-center p-6 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
            onClick={() => handleConfidenceResponse('UNKNOWN')}
          >
            <XCircle className="w-6 h-6 mr-2 text-red-500" />
            完全陌生（从未见过或完全不认识）
          </Button>
          <Button
            variant="outline"
            className="flex items-center justify-center p-4 hover:bg-gray-50"
            onClick={() => setShowTranslation(true)}
          >
            <HelpCircle className="w-5 h-5 mr-2 text-gray-500" />
            查看含义
          </Button>
        </div>

        <p className="text-sm text-muted-foreground text-center">
          提示：系统会根据您的选择和反应时间综合评估掌握程度
        </p>
      </Card>
    );
  }

  return null;
}