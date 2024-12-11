import { WordBankEntry } from './wordBank';

// 词汇水平定义
export const VOCABULARY_LEVELS = {
  JUNIOR: { name: '初中', minWords: 0, maxWords: 1500 },
  SENIOR: { name: '高中', minWords: 1501, maxWords: 3500 },
  CET4: { name: '大学四级', minWords: 3501, maxWords: 4500 },
  CET6: { name: '大学六级', minWords: 4501, maxWords: 6000 },
  ADVANCED: { name: '高级', minWords: 6001, maxWords: Infinity }
} as const;

// 词汇掌握程度
export const MASTERY_LEVELS = {
  FAMILIAR: { score: 4, description: '熟练掌握', criteria: '能准确理解和运用，可以解释和造句' },
  CONFIDENT: { score: 3, description: '较好掌握', criteria: '认识词义，能在大多数场合正确使用' },
  RECOGNIZED: { score: 2, description: '基本认识', criteria: '知道基本含义，但可能在使用时不够准确' },
  SEEN: { score: 1, description: '见过但不确定', criteria: '见过这个词，但不确定具体含义' },
  UNKNOWN: { score: 0, description: '完全陌生', criteria: '从未见过或完全不认识' }
} as const;

interface VocabularyProfile {
  totalWords: number;
  activeVocabulary: number;
  passiveVocabulary: number;
  levelDistribution: Record<string, number>;
  topicStrengths: Array<{
    topic: string;
    score: number;
    total: number;
  }>;
  recentProgress: Array<{
    date: string;
    newWords: number;
    reviewedWords: number;
    masteryImprovement: number;
  }>;
}

interface WordAssessment {
  word: string;
  mastery: keyof typeof MASTERY_LEVELS;
  lastSeen: Date;
  contexts: string[];
  mistakes: number;
  assessmentHistory: Array<{
    date: Date;
    mastery: keyof typeof MASTERY_LEVELS;
    context?: string;
  }>;
  confusedWith: string[];
}

export class VocabularyAssessor {
  private userVocabulary: Map<string, WordAssessment>;
  private wordBank: WordBankEntry[];
  private lastAssessmentDate?: Date;
  private assessmentResults: Array<{
    date: Date;
    score: number;
    level: string;
    wordsAssessed: number;
  }> = [];

  constructor(wordBank: WordBankEntry[]) {
    this.userVocabulary = new Map();
    this.wordBank = wordBank;
  }

  // 获取初始掌握程度
  private getInitialMastery(response: {
    isCorrect: boolean;
    confidence: number;
    responseTime: number;
  }): keyof typeof MASTERY_LEVELS {
    if (response.isCorrect && response.confidence > 0.8 && response.responseTime < 2000) {
      return 'FAMILIAR';
    }
    if (response.isCorrect && response.confidence > 0.5) {
      return 'CONFIDENT';
    }
    if (response.isCorrect) {
      return 'RECOGNIZED';
    }
    return 'UNKNOWN';
  }

  // 评估单个单词的掌握程度
  assessWord(
    word: string, 
    context: string, 
    response: {
      isCorrect: boolean;
      confidence: number;
      responseTime: number;
      confusedWith?: string;
    }
  ): void {
    const existing = this.userVocabulary.get(word);
    const now = new Date();

    if (existing) {
      // 更新已有单词的评估
      const newMastery = this.calculateNewMastery(
        existing.mastery,
        response,
        existing.mistakes
      );

      const updatedAssessment: WordAssessment = {
        ...existing,
        mastery: newMastery,
        lastSeen: now,
        contexts: [...existing.contexts, context].slice(-5),
        mistakes: response.isCorrect ? existing.mistakes : existing.mistakes + 1,
        assessmentHistory: [
          ...existing.assessmentHistory,
          { date: now, mastery: newMastery, context }
        ],
        confusedWith: response.confusedWith 
          ? [...existing.confusedWith, response.confusedWith] 
          : existing.confusedWith
      };

      this.userVocabulary.set(word, updatedAssessment);
    } else {
      // 添加新单词
      const newAssessment: WordAssessment = {
        word,
        mastery: this.getInitialMastery(response),
        lastSeen: now,
        contexts: [context],
        mistakes: response.isCorrect ? 0 : 1,
        assessmentHistory: [{
          date: now,
          mastery: this.getInitialMastery(response),
          context
        }],
        confusedWith: response.confusedWith ? [response.confusedWith] : []
      };

      this.userVocabulary.set(word, newAssessment);
    }
  }

  // 计算新的掌握程度
  private calculateNewMastery(
    currentMastery: keyof typeof MASTERY_LEVELS,
    response: {
      isCorrect: boolean;
      confidence: number;
      responseTime: number;
    },
    mistakes: number
  ): keyof typeof MASTERY_LEVELS {
    const masteryLevels: Array<keyof typeof MASTERY_LEVELS> = [
      'UNKNOWN', 'SEEN', 'RECOGNIZED', 'CONFIDENT', 'FAMILIAR'
    ];
    const currentIndex = masteryLevels.indexOf(currentMastery);

    if (!response.isCorrect && mistakes >= 3) return 'UNKNOWN';
    if (response.isCorrect && response.confidence > 0.9 && response.responseTime < 1500) {
      return masteryLevels[Math.min(currentIndex + 1, masteryLevels.length - 1)];
    }
    if (!response.isCorrect || response.confidence < 0.3) {
      return masteryLevels[Math.max(currentIndex - 1, 0)];
    }
    return currentMastery;
  }

  // 生成用户词汇画像
  generateProfile(): VocabularyProfile {
    const now = new Date();
    const activeWords = Array.from(this.userVocabulary.values())
      .filter(assessment => 
        assessment.mastery === 'FAMILIAR' ||
        (assessment.mastery === 'RECOGNIZED' && 
         now.getTime() - assessment.lastSeen.getTime() < 30 * 24 * 60 * 60 * 1000)
      );

    const passiveWords = Array.from(this.userVocabulary.values())
      .filter(assessment => 
        assessment.mastery === 'SEEN' ||
        (assessment.mastery === 'RECOGNIZED' &&
         now.getTime() - assessment.lastSeen.getTime() >= 30 * 24 * 60 * 60 * 1000)
      );

    // 计算各级别词汇分布
    const levelDistribution = this.calculateLevelDistribution(activeWords);

    // 计算主题强度
    const topicStrengths = this.calculateTopicStrengths(activeWords);

    // 生成近期进度
    const recentProgress = this.generateRecentProgress();

    return {
      totalWords: this.userVocabulary.size,
      activeVocabulary: activeWords.length,
      passiveVocabulary: passiveWords.length,
      levelDistribution,
      topicStrengths,
      recentProgress
    };
  }

  // 计算词汇量分布
  private calculateLevelDistribution(activeWords: WordAssessment[]): Record<string, number> {
    const distribution: Record<string, number> = {
      JUNIOR: 0,
      SENIOR: 0,
      CET4: 0,
      CET6: 0,
      ADVANCED: 0
    };

    activeWords.forEach(assessment => {
      const bankEntry = this.wordBank.find(entry => entry.word === assessment.word);
      if (bankEntry) {
        distribution[bankEntry.level.toUpperCase()]++;
      }
    });

    return distribution;
  }

  // 计算主题强度
  private calculateTopicStrengths(activeWords: WordAssessment[]): Array<{topic: string; score: number; total: number}> {
    const topicScores = new Map<string, {score: number; total: number}>();

    activeWords.forEach(assessment => {
      const bankEntry = this.wordBank.find(entry => entry.word === assessment.word);
      if (bankEntry) {
        bankEntry.tags.forEach(topic => {
          const current = topicScores.get(topic) || {score: 0, total: 0};
          const masteryScore = MASTERY_LEVELS[assessment.mastery].score;
          
          topicScores.set(topic, {
            score: current.score + masteryScore,
            total: current.total + MASTERY_LEVELS.FAMILIAR.score
          });
        });
      }
    });

    return Array.from(topicScores.entries())
      .map(([topic, {score, total}]) => ({
        topic,
        score,
        total
      }))
      .sort((a, b) => (b.score / b.total) - (a.score / a.total));
  }

  // 生成近期进度
  private generateRecentProgress(): Array<{date: string; newWords: number; reviewedWords: number; masteryImprovement: number}> {
    const last7Days = Array.from({length: 7}, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    return last7Days.map(date => ({
      date,
      newWords: Math.floor(Math.random() * 10), // 示例数据，实际应从用户历史记录中获取
      reviewedWords: Math.floor(Math.random() * 20),
      masteryImprovement: Math.floor(Math.random() * 5) // 掌握度提升百分比
    }));
  }

  // 获取推荐学习的单词
  getRecommendedWords(count: number = 10): WordBankEntry[] {
    const knownWords = new Set(this.userVocabulary.keys());
    const userLevel = this.determineUserLevel();
    
    return this.wordBank
      .filter(word => 
        !knownWords.has(word.word) && 
        this.isAppropriateLevel(word.level, userLevel)
      )
      .sort(() => Math.random() - 0.5)
      .slice(0, count);
  }

  // 确定用户当前水平
  private determineUserLevel(): string {
    const profile = this.generateProfile();
    const totalActive = profile.activeVocabulary;

    if (totalActive <= VOCABULARY_LEVELS.JUNIOR.maxWords) return 'junior';
    if (totalActive <= VOCABULARY_LEVELS.SENIOR.maxWords) return 'senior';
    if (totalActive <= VOCABULARY_LEVELS.CET4.maxWords) return 'cet4';
    if (totalActive <= VOCABULARY_LEVELS.CET6.maxWords) return 'cet6';
    return 'advanced';
  }

  // 判断单词是否适合用户当前水平
  private isAppropriateLevel(wordLevel: string, userLevel: string): boolean {
    const levels = ['junior', 'senior', 'cet4', 'cet6', 'advanced'];
    const wordLevelIndex = levels.indexOf(wordLevel);
    const userLevelIndex = levels.indexOf(userLevel);
    
    // 允许学习当前级别和下一级别的单词
    return wordLevelIndex <= userLevelIndex + 1;
  }
}