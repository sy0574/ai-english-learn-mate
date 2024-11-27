import { AIModelManager } from './aiModelManager';
import type { AIAnalysisResult } from './types';
import { withRetry } from '../utils/retry';

// 自定义错误类型
export class AIResponseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AIResponseError';
  }
}

export class AIValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AIValidationError';
  }
}

export class AINetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AINetworkError';
  }
}

// 验证响应数据的结构
function validateAnalysisResponse(data: any, analysisType: string): void {
  if (!data || typeof data !== 'object') {
    throw new AIValidationError(`${analysisType} 分析结果格式无效`);
  }

  switch (analysisType) {
    case 'thematic':
      if (!Array.isArray(data.thematicWords) || !Array.isArray(data.keyWords)) {
        throw new AIValidationError('主题分析结果缺少必要字段');
      }
      break;
    case 'vocabulary':
      if (!Array.isArray(data.keySentences)) {
        throw new AIValidationError('词汇分析结果缺少必要字段');
      }
      break;
    case 'background':
      if (!Array.isArray(data.backgroundKnowledge)) {
        throw new AIValidationError('背景知识分析结果缺少必要字段');
      }
      break;
  }
}

// 安全的 JSON 解析函数
function safeJSONParse(text: string, analysisType: string): any {
  try {
    const data = JSON.parse(text);
    validateAnalysisResponse(data, analysisType);
    return data;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new AIResponseError('AI 返回的数据格式无效');
    }
    throw error;
  }
}

export async function analyzeArticleWithAI(content: string): Promise<AIAnalysisResult> {
  const modelManager = AIModelManager.getInstance();

  if (!content?.trim()) {
    throw new Error('请先输入或选择文章内容');
  }

  const retryOptions = {
    maxAttempts: 3,
    delayMs: 2000,
    backoffFactor: 1.5,
    shouldRetry: (error: any) => {
      // 只在网络错误或服务器错误时重试，不重试验证错误
      return !(error instanceof AIValidationError) && 
             !(error instanceof AIResponseError) &&
             (error instanceof AINetworkError || 
              error?.message?.includes('网络') || 
              error?.message?.includes('timeout'));
    }
  };

  try {
    return await withRetry(async () => {
      // Thematic Analysis
      const thematicPrompt = `Analyze the thematic elements and keywords of this text. Return a JSON object with thematic words and key words analysis.`;
      const thematicResult = await modelManager.makeRequest('thematicAnalysis', thematicPrompt);
      const thematicAnalysis = safeJSONParse(thematicResult, 'thematic');

      // Vocabulary Analysis
      const vocabPrompt = `Analyze the vocabulary usage and patterns in this text. Return a JSON object with vocabulary analysis.`;
      const vocabResult = await modelManager.makeRequest('vocabularyAnalysis', vocabPrompt);
      const vocabAnalysis = safeJSONParse(vocabResult, 'vocabulary');

      // Background Knowledge
      const backgroundPrompt = `Provide relevant background knowledge for understanding this text. Return a JSON object with background information.`;
      const backgroundResult = await modelManager.makeRequest('backgroundKnowledge', backgroundPrompt);
      const backgroundAnalysis = safeJSONParse(backgroundResult, 'background');

      // Combine all analyses
      return {
        thematicWords: thematicAnalysis.thematicWords,
        keyWords: thematicAnalysis.keyWords,
        keySentences: vocabAnalysis.keySentences,
        backgroundKnowledge: backgroundAnalysis.backgroundKnowledge
      };
    }, retryOptions);
  } catch (error) {
    console.error('AI analysis error:', error);
    
    if (error instanceof AIValidationError) {
      throw new Error(`AI 返回数据验证失败: ${error.message}`);
    }
    if (error instanceof AIResponseError) {
      throw new Error(`AI 响应解析失败: ${error.message}`);
    }
    if (error instanceof AINetworkError) {
      throw new Error(`AI 服务请求失败: ${error.message}`);
    }
    
    // 未知错误
    throw new Error(`AI 分析失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}