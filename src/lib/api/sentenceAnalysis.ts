import { AIModelManager } from './aiModelManager';
import type { SentenceAnalysisResult } from './types';
import { APIError } from '@/lib/utils/errorHandler';

const STORAGE_KEY = 'sentence-analyses';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1秒

// 添加延迟函数
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function analyzeSentenceStructure(sentence: string): Promise<SentenceAnalysisResult> {
  const modelManager = AIModelManager.getInstance();

  if (!sentence?.trim()) {
    throw new Error('请提供要分析的句子');
  }

  let lastError: Error | null = null;
  let retries = 0;

  while (retries < MAX_RETRIES) {
    try {
      const prompt = `Analyze the following English sentence and provide a detailed structural analysis in JSON format:

"${sentence}"

Required JSON format:
{
  "components": [
    {
      "text": "specific word or phrase from the sentence",
      "type": "part of speech or grammatical role",
      "explanation": "explanation in Chinese"
    }
  ],
  "structure": {
    "level": "sentence complexity level",
    "patterns": ["grammatical pattern used"],
    "explanation": "detailed structure explanation in Chinese"
  },
  "rules": [
    {
      "type": "grammar rule type",
      "description": "rule explanation in Chinese",
      "examples": ["similar example"]
    }
  ]
}`;

      console.log('Sending analysis request for sentence:', sentence);
      const result = await modelManager.makeRequest('sentenceStructure', prompt);
      
      try {
        // 清理和预处理响应
        let cleanedResult = result.trim()
          .replace(/```json\s*|\s*```/g, '')  // 移除所有代码块标记
          .replace(/^[\s\n]*{/, '{')  // 确保JSON从{开始
          .replace(/}[\s\n]*$/, '}')  // 确保JSON以}结束
          .trim();
        
        console.log('Preprocessed response:', cleanedResult);

        // 尝试解析JSON
        let parsedResult: SentenceAnalysisResult;
        try {
          parsedResult = JSON.parse(cleanedResult);
        } catch (e) {
          console.error('JSON parse error:', e);
          throw new APIError('JSON解析失败，响应格式不正确');
        }

        // 验证结果结构
        if (!parsedResult || typeof parsedResult !== 'object') {
          throw new APIError('解析结果不是有效的对象');
        }

        if (!Array.isArray(parsedResult.components) || parsedResult.components.length === 0) {
          throw new APIError('缺少句子组件分析');
        }

        if (!parsedResult.structure || typeof parsedResult.structure !== 'object') {
          throw new APIError('缺少句子结构分析');
        }

        if (!Array.isArray(parsedResult.rules) || parsedResult.rules.length === 0) {
          throw new APIError('缺少语法规则分析');
        }

        // 保存分析结果
        await saveSentenceAnalysis(sentence, parsedResult);
        return parsedResult;
      } catch (error) {
        console.error('Error processing analysis result:', error);
        throw error;
      }
    } catch (error) {
      lastError = error;
      retries++;
      
      if (error instanceof APIError && error.code === 'auth') {
        throw error;
      }
      
      console.error(`句子分析失败，第 ${retries} 次重试:`, error);
      
      if (retries < MAX_RETRIES) {
        await delay(RETRY_DELAY * retries);
        continue;
      }
    }
  }

  throw new APIError(
    `句子分析失败，已重试 ${MAX_RETRIES} 次: ${lastError?.message || '未知错误'}`
  );
}

export async function saveSentenceAnalysis(
  sentence: string,
  analysis: SentenceAnalysisResult
): Promise<void> {
  try {
    const savedAnalyses = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || '{}'
    );
    
    // Use sentence hash as key to handle long sentences
    const key = btoa(sentence).slice(0, 32);
    savedAnalyses[key] = {
      sentence,
      analysis,
      timestamp: new Date().toISOString()
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedAnalyses));
  } catch (error) {
    console.error('Error saving analysis:', error);
    throw new Error('保存失败，请重试');
  }
}

export function getSavedSentenceAnalysis(
  sentence: string
): SentenceAnalysisResult | null {
  try {
    const savedAnalyses = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || '{}'
    );
    
    const key = btoa(sentence).slice(0, 32);
    return savedAnalyses[key]?.analysis || null;
  } catch {
    return null;
  }
}

export function getAllSavedAnalyses(): Array<{
  sentence: string;
  analysis: SentenceAnalysisResult;
  timestamp: string;
}> {
  try {
    const savedAnalyses = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || '{}'
    );
    
    return Object.values(savedAnalyses)
      .sort((a: any, b: any) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
  } catch {
    return [];
  }
}

function preprocessResponse(response: string): string {
  if (!response || typeof response !== 'string') {
    throw new APIError('AI响应为空或格式错误');
  }

  try {
    // 首先尝试直接解析，可能已经是干净的JSON
    JSON.parse(response);
    return response;
  } catch {
    // 如果直接解析失败，尝试清理和提取JSON
    const jsonStart = response.indexOf('{');
    const jsonEnd = response.lastIndexOf('}');
    
    if (jsonStart === -1 || jsonEnd === -1) {
      throw new APIError('响应中未找到有效的JSON结构');
    }
    
    // 提取JSON部分
    const jsonStr = response.slice(jsonStart, jsonEnd + 1);
    
    try {
      // 验证提取的内容是否为有效JSON
      JSON.parse(jsonStr);
      return jsonStr;
    } catch (error) {
      throw new APIError('提取的JSON格式无效');
    }
  }
}