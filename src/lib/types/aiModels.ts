import type { AnalysisTask, ModelId } from '@/lib/config/aiModels';

export interface ModelConfig {
  name: string;
  provider: string;
  contextWindow: number;
  costPer1kTokens: number;
  strengthAreas: string[];
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

export type ModelConfigUpdate = Partial<Omit<ModelConfig, 'name' | 'provider'>>;

export type AnalysisTask = 'sentenceStructure' | 'thematicAnalysis' | 'vocabularyAnalysis' | 'backgroundKnowledge';

export type ModelId = 'step/step-2-16k' | 'openai/gpt-4o-mini' | 'google/gemini-flash-1.5' | 'anthropic/claude-3.5-sonnet';

export interface ModelAssignments {
  sentenceStructure: ModelId;
  thematicAnalysis: ModelId;
  vocabularyAnalysis: ModelId;
  backgroundKnowledge: ModelId;
}

export interface ModelPreferences {
  modelAssignments: Record<AnalysisTask, ModelId>;
  modelConfigs: Partial<Record<ModelId, ModelConfigUpdate>>;
}
