import type { ModelConfig, ModelId } from '@/lib/types/aiModels';

// Available AI models configuration
export const AI_MODELS = {
  'qwen/qwq-32b-preview': {
    name: 'QWQ-32B',
    provider: 'Qwen',
    contextWindow: 32000,
    costPer1kTokens: 0.002,
    strengthAreas: ['multilingual', 'complex reasoning', 'detailed analysis'] as const,
  },
  'step/step-2-16k': {
    name: 'Step-2-16k',
    provider: 'Step',
    contextWindow: 16000,
    costPer1kTokens: 0.001,
    strengthAreas: ['multilingual', 'fast responses', 'secure processing'] as const,
  },
  'openai/gpt-4o-mini': {
    name: 'GPT-4 Mini',
    provider: 'OpenAI',
    contextWindow: 8000,
    costPer1kTokens: 0.002,
    strengthAreas: ['general knowledge', 'code analysis'] as const,
  },
  'google/gemini-flash-1.5': {
    name: 'Gemini Flash',
    provider: 'Google',
    contextWindow: 12000,
    costPer1kTokens: 0.0015,
    strengthAreas: ['fast inference', 'cost effective'] as const,
  },
  'anthropic/claude-3.5-sonnet': {
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    contextWindow: 200000,
    costPer1kTokens: 0.003,
    strengthAreas: ['long context', 'detailed analysis'] as const,
  },
  'anthropic/claude-3-haiku': {
    name: 'Claude 3 Haiku',
    provider: 'Anthropic',
    contextWindow: 100000,
    costPer1kTokens: 0.0025,
    strengthAreas: ['quick responses', 'basic analysis'] as const,
  }
} as const satisfies Record<string, ModelConfig>;

// Analysis task types
export type AnalysisTask = 
  | 'sentenceStructure'
  | 'thematicAnalysis'
  | 'vocabularyAnalysis'
  | 'backgroundKnowledge';

export type ModelId = keyof typeof AI_MODELS;

// Model assignments interface
export interface ModelAssignments {
  sentenceStructure: ModelId;
  thematicAnalysis: ModelId;
  vocabularyAnalysis: ModelId;
  backgroundKnowledge: ModelId;
}

// Default model assignments
export const DEFAULT_MODEL_ASSIGNMENTS: ModelAssignments = {
  sentenceStructure: 'google/gemini-flash-1.5',
  thematicAnalysis: 'anthropic/claude-3.5-sonnet',
  vocabularyAnalysis: 'step/step-2-16k',
  backgroundKnowledge: 'openai/gpt-4o-mini'
};

// Model configuration type
export interface ModelConfig {
  name: string;
  provider: string;
  contextWindow: number;
  costPer1kTokens: number;
  strengthAreas: string[];
}