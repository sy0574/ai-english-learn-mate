import { env } from '@/lib/env';
import { 
  AI_MODELS, 
  DEFAULT_MODEL_ASSIGNMENTS,
  type ModelId,
  type AnalysisTask
} from '@/lib/config/aiModels';
import { APIError, handleAPIError } from '@/lib/utils/errorHandler';
import { PromptManager } from './promptManager';
import type { ModelConfigUpdate, ModelPreferences } from '@/lib/types/aiModels';

const STORAGE_KEY = 'ai-model-preferences';

export class AIModelManager {
  private static instance: AIModelManager;
  private modelAssignments: Record<AnalysisTask, ModelId>;
  private modelConfigs: Partial<Record<ModelId, ModelConfigUpdate>>;
  private promptManager: PromptManager;
  private lastRequestTime: Record<ModelId, number> = {
    'step/step-2-16k': 0,
    'openai/gpt-4o-mini': 0,
    'google/gemini-flash-1.5': 0,
    'anthropic/claude-3.5-sonnet': 0,
    'anthropic/claude-3-haiku': 0
  };
  private static readonly MIN_REQUEST_INTERVAL = 1000; // 最小请求间隔1秒
  private static readonly MAX_RETRIES = 3; // 最大重试次数
  private static readonly RETRY_DELAY = 60000; // 重试延迟1分钟

  private constructor() {
    const preferences = this.loadPreferences();
    this.modelAssignments = preferences.modelAssignments;
    this.modelConfigs = preferences.modelConfigs;
    this.promptManager = PromptManager.getInstance();
  }

  public static getInstance(): AIModelManager {
    if (!AIModelManager.instance) {
      AIModelManager.instance = new AIModelManager();
    }
    return AIModelManager.instance;
  }

  private loadPreferences(): ModelPreferences {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (this.validatePreferences(parsed)) {
          return parsed;
        }
      }
    } catch (error) {
      console.error('Error loading model preferences:', error);
    }
    return {
      modelAssignments: DEFAULT_MODEL_ASSIGNMENTS,
      modelConfigs: {}
    };
  }

  private validatePreferences(prefs: any): prefs is ModelPreferences {
    if (!prefs || typeof prefs !== 'object') return false;
    
    // 验证模型分配
    if (!this.validateModelAssignments(prefs.modelAssignments)) {
      return false;
    }

    // 验证模型配置
    if (prefs.modelConfigs && typeof prefs.modelConfigs === 'object') {
      return Object.entries(prefs.modelConfigs).every(([modelId, config]) => {
        return (
          modelId in AI_MODELS &&
          (!config || this.validateModelConfig(config))
        );
      });
    }

    return true;
  }

  private validateModelAssignments(assignments: any): assignments is Record<AnalysisTask, ModelId> {
    if (!assignments || typeof assignments !== 'object') return false;
    
    return Object.entries(assignments).every(([task, modelId]) => {
      return (
        task in DEFAULT_MODEL_ASSIGNMENTS &&
        typeof modelId === 'string' &&
        modelId in AI_MODELS
      );
    });
  }

  private validateModelConfig(config: any): config is ModelConfigUpdate {
    if (!config || typeof config !== 'object') return false;

    const validKeys = [
      'contextWindow',
      'costPer1kTokens',
      'strengthAreas',
      'temperature',
      'maxTokens',
      'topP',
      'frequencyPenalty',
      'presencePenalty'
    ];

    return Object.keys(config).every(key => {
      if (!validKeys.includes(key)) return false;

      const value = config[key];
      switch (key) {
        case 'contextWindow':
        case 'maxTokens':
          return typeof value === 'number' && value > 0;
        case 'costPer1kTokens':
        case 'temperature':
        case 'topP':
        case 'frequencyPenalty':
        case 'presencePenalty':
          return typeof value === 'number' && value >= 0;
        case 'strengthAreas':
          return Array.isArray(value) && value.every(v => typeof v === 'string');
        default:
          return true;
      }
    });
  }

  public getModelConfig(modelId: ModelId) {
    const baseConfig = AI_MODELS[modelId];
    const customConfig = this.modelConfigs[modelId] || {};
    return { ...baseConfig, ...customConfig };
  }

  public updateModelConfig(modelId: ModelId, config: ModelConfigUpdate): void {
    if (!(modelId in AI_MODELS)) {
      throw new Error(`Invalid model ID: ${modelId}`);
    }

    if (!this.validateModelConfig(config)) {
      throw new Error('Invalid model configuration');
    }

    this.modelConfigs[modelId] = {
      ...this.modelConfigs[modelId],
      ...config
    };

    this.savePreferences();
  }

  private savePreferences(): void {
    try {
      const preferences: ModelPreferences = {
        modelAssignments: this.modelAssignments,
        modelConfigs: this.modelConfigs
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch (error) {
      console.error('Error saving model preferences:', error);
    }
  }

  private async waitForNextRequest(modelId: ModelId): Promise<void> {
    const now = Date.now();
    const lastRequest = this.lastRequestTime[modelId] || 0;
    const timeSinceLastRequest = now - lastRequest;
    
    if (timeSinceLastRequest < AIModelManager.MIN_REQUEST_INTERVAL) {
      const waitTime = AIModelManager.MIN_REQUEST_INTERVAL - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequestTime[modelId] = Date.now();
  }

  async makeRequest(task: AnalysisTask, content: string): Promise<string> {
    const modelId = this.getModelForTask(task);
    const modelConfig = this.getModelConfig(modelId);
    let retryCount = 0;
    let lastError: Error | null = null;

    while (retryCount < AIModelManager.MAX_RETRIES) {
      try {
        await this.waitForNextRequest(modelId);

        // 根据模型ID确定使用哪个API端点和密钥
        const isStepAI = modelId.includes('step-') || modelId.startsWith('step/');
        const apiUrl = isStepAI ? env.STEP_API_URL : env.OPENROUTER_API_URL;
        const apiKey = isStepAI ? env.STEP_API_KEY : env.OPENROUTER_API_KEY;

        if (!apiUrl || !apiKey) {
          throw new APIError('未配置API端点或密钥', undefined, 'config');
        }

        // 处理模型ID格式
        const formattedModelId = isStepAI 
          ? modelId.replace('step/', '') // 移除前缀用于Step AI
          : modelId; // OpenRouter使用完整ID

        console.log('Making API request:', {
          task,
          modelId: formattedModelId,
          apiUrl,
          contentLength: content.length
        });

        const requestBody = {
          model: formattedModelId,
          messages: [
            {
              role: 'system',
              content: 'You are a professional English analysis assistant. Your task is to analyze the given sentence and return a JSON response.'
            },
            {
              role: 'user',
              content: content
            }
          ],
          temperature: modelConfig.temperature ?? 0.7,
          max_tokens: modelConfig.maxTokens ?? 2000,
          top_p: modelConfig.topP ?? 1,
          frequency_penalty: modelConfig.frequencyPenalty ?? 0,
          presence_penalty: modelConfig.presencePenalty ?? 0
        };

        console.log('Request body:', requestBody);

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify(requestBody)
        });

        console.log('API Response Status:', response.status);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('API Error Response:', errorData);
          throw new APIError(`API请求失败: ${response.status} ${response.statusText}`, response.status);
        }

        const data = await response.json();
        console.log('Raw API Response:', data);

        if (!this.validateResponse(data)) {
          console.error('Invalid API response format:', data);
          throw new APIError('API返回格式无效');
        }

        const responseContent = data.choices?.[0]?.message?.content || data.content || '';
        console.log('Extracted content:', responseContent);

        if (!responseContent) {
          throw new APIError('API返回内容为空');
        }

        return responseContent;
      } catch (e) {
        lastError = handleAPIError(e as Error);
        console.error(`API request failed (attempt ${retryCount + 1}):`, lastError);
        
        if (lastError instanceof APIError) {
          if (lastError.code === 'config' || lastError.status === 401 || lastError.status === 403) {
            throw lastError;
          }
        }

        retryCount++;
        if (retryCount < AIModelManager.MAX_RETRIES) {
          console.log(`Retrying in ${AIModelManager.RETRY_DELAY}ms...`);
          await new Promise(resolve => setTimeout(resolve, AIModelManager.RETRY_DELAY));
          continue;
        }
      }
    }

    throw new APIError(`请求失败，已重试${AIModelManager.MAX_RETRIES}次: ${lastError?.message || '未知错误'}`);
  }

  private validateResponse(data: any): boolean {
    if (!data || typeof data !== 'object') return false;
    
    // 支持不同的API响应格式
    if (typeof data.content === 'string') return true;
    if (data.choices && Array.isArray(data.choices) && data.choices.length > 0) {
      const message = data.choices[0].message;
      return message && typeof message.content === 'string';
    }
    
    return false;
  }

  public getModelForTask(task: AnalysisTask): ModelId {
    return this.modelAssignments[task];
  }

  public setModelForTask(task: AnalysisTask, modelId: ModelId): void {
    if (!(modelId in AI_MODELS)) {
      throw new Error(`Invalid model ID: ${modelId}`);
    }
    
    this.modelAssignments[task] = modelId;
    this.savePreferences();
  }
}