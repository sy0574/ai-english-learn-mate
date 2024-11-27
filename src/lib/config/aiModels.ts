import type { ModelConfig, ModelId, ModelAssignments, AnalysisTask } from '@/lib/types/aiModels';

// Available AI models configuration
export const AI_MODELS: Record<ModelId, ModelConfig> = {
  'step/step-2-16k': {
    name: 'Step-2-16k',
    provider: 'Step',
    contextWindow: 16000,
    costPer1kTokens: 0.001,
    strengthAreas: ['multilingual', 'fast responses', 'secure processing'],
  },
  'openai/gpt-4o-mini': {
    name: 'GPT-4 Mini',
    provider: 'OpenAI',
    contextWindow: 8000,
    costPer1kTokens: 0.002,
    strengthAreas: ['general knowledge', 'code analysis'],
  },
  'google/gemini-flash-1.5': {
    name: 'Gemini Flash',
    provider: 'Google',
    contextWindow: 12000,
    costPer1kTokens: 0.0015,
    strengthAreas: ['fast inference', 'cost effective'],
  },
  'anthropic/claude-3.5-sonnet': {
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    contextWindow: 200000,
    costPer1kTokens: 0.003,
    strengthAreas: ['long context', 'detailed analysis'],
  },
  'anthropic/claude-3-haiku': {
    name: 'Claude 3 Haiku',
    provider: 'Anthropic',
    contextWindow: 100000,
    costPer1kTokens: 0.0025,
    strengthAreas: ['quick responses', 'basic analysis'],
  }
};

// Default model assignments for different analysis tasks
export type AnalysisTask = 
  | 'sentenceStructure'
  | 'thematicAnalysis'
  | 'vocabularyAnalysis'
  | 'backgroundKnowledge';

// Default model assignments
export const DEFAULT_MODEL_ASSIGNMENTS: ModelAssignments = {
  sentenceStructure: 'google/gemini-flash-1.5',
  thematicAnalysis: 'anthropic/claude-3.5-sonnet',
  vocabularyAnalysis: 'step/step-2-16k',
  backgroundKnowledge: 'openai/gpt-4o-mini'
};

export type ModelId = keyof typeof AI_MODELS;