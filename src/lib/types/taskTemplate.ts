import { ModelId } from '../config/aiModels';

export interface TaskTemplate {
  id: string;
  name: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  timeoutMs: number;
  modelId: ModelId;
  systemPrompt: string;
  userPromptTemplate: string;
  responseFormat: {
    type: 'json' | 'text' | 'markdown';
    schema?: Record<string, any>;
  };
  created: string;
  updated: string;
}

export interface TaskTemplateInput extends Omit<TaskTemplate, 'id' | 'created' | 'updated'> {}

export type TaskPriority = TaskTemplate['priority'];
