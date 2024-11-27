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
