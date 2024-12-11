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

export enum PlayMode {
  SINGLE = 'single',    // 单次播放
  SEQUENTIAL = 'sequential',  // 连续播放
  LOOP = 'loop',    // 循环播放
  SINGLE_LOOP = 'single_loop'  // 单句循环
}
