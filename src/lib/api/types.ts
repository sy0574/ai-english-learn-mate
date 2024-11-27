export interface AIAnalysisResult {
  thematicWords: string[];
  keyWords: Array<{
    word: string;
    importance: number;
    reason: string;
  }>;
  keySentences: Array<{
    sentence: string;
    importance: number;
    reason: string;
  }>;
  backgroundKnowledge: Array<{
    topic: string;
    description: string;
    relevance: string;
  }>;
}

export interface SentenceAnalysisResult {
  components: Array<{
    text: string;
    type: GrammaticalType;
    explanation: string;
    subComponents?: Array<{
      text: string;
      type: GrammaticalType;
      explanation: string;
    }>;
  }>;
  structure: {
    level: 'simple' | 'compound' | 'complex';
    patterns: string[];
    explanation: string;
  };
  rules: Array<{
    type: GrammaticalType;
    description: string;
    examples: string[];
  }>;
}

export type GrammaticalType = 
  | 'subject' 
  | 'predicate'
  | 'object'
  | 'complement'
  | 'modifier'
  | 'conjunction'
  | 'preposition'
  | 'clause'
  | 'phrase';

// Analysis Task Types
export type AnalysisTask = 
  | 'sentenceStructure'
  | 'thematicAnalysis'
  | 'vocabularyAnalysis'
  | 'backgroundKnowledge';

export const TASK_LABELS: Record<AnalysisTask, string> = {
  sentenceStructure: '句子结构分析',
  thematicAnalysis: '主题分析',
  vocabularyAnalysis: '词汇分析',
  backgroundKnowledge: '背景知识'
};