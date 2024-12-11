import type { AnalysisTask, ModelId } from '@/lib/config/aiModels';

export interface ModelConfig {
  name: string;
  provider: string;
  contextWindow: number;
  costPer1kTokens: number;
  strengthAreas: readonly string[];
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

export type ModelConfigUpdate = Partial<Omit<ModelConfig, 'name' | 'provider'>>;

export interface ModelPreferences {
  modelAssignments: Record<AnalysisTask, ModelId>;
  modelConfigs: Partial<Record<ModelId, ModelConfigUpdate>>;
}
