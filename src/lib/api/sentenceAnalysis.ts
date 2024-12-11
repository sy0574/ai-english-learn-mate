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
      const prompt = `Please analyze this English sentence and return ONLY a JSON object with no additional text or explanation:

"${sentence}"

Required JSON format:
{
  "components": [
    {
      "text": "word or phrase",
      "type": "grammatical role",
      "explanation": "explanation in Chinese"
    }
  ],
  "structure": {
    "level": "sentence complexity level",
    "patterns": ["grammatical pattern"],
    "explanation": "structure explanation in Chinese"
  },
  "rules": [
    {
      "type": "grammar rule type",
      "description": "rule explanation in Chinese",
      "examples": ["example sentence"]
    }
  ]
}

Remember: Return ONLY the JSON object, no other text.`;

      console.log('Sending analysis request for sentence:', sentence);
      const result = await modelManager.makeRequest('sentenceStructure', prompt);
      console.log('Raw API response:', result);
      
      try {
        // 清理和预处理响应
        const cleanedResult = result.trim();

        // 尝试提取JSON部分
        const jsonMatch = cleanedResult.match(/```json\s*([\s\S]*?)\s*```/) || 
                         cleanedResult.match(/\{[\s\S]*\}/);
        
        if (!jsonMatch) {
          console.error('No JSON found in response');
          throw new APIError('未找到有效的JSON响应');
        }

        const jsonStr = jsonMatch[1] || jsonMatch[0];
        console.log('Extracted JSON:', jsonStr);

        // 尝试解析JSON
        let parsedResult: SentenceAnalysisResult;
        try {
          parsedResult = JSON.parse(jsonStr);
          console.log('Parsed result:', parsedResult);
        } catch (e) {
          console.error('JSON parse error:', e);
          throw new APIError('JSON解析失败，响应格式不正确');
        }

        // 验证结果结构
        if (!parsedResult || typeof parsedResult !== 'object') {
          console.error('Invalid result structure:', parsedResult);
          throw new APIError('解析结果不是有效的对象');
        }

        if (!Array.isArray(parsedResult.components) || parsedResult.components.length === 0) {
          console.error('Missing components:', parsedResult);
          throw new APIError('缺少句子组件分析');
        }

        if (!parsedResult.structure || typeof parsedResult.structure !== 'object') {
          console.error('Missing structure:', parsedResult);
          throw new APIError('缺少句子结构分析');
        }

        if (!Array.isArray(parsedResult.rules) || parsedResult.rules.length === 0) {
          console.error('Missing rules:', parsedResult);
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
      if (error instanceof Error) {
        lastError = error;
      } else {
        lastError = new Error('Unknown error occurred');
      }
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
    ) as Record<string, {
      sentence: string;
      analysis: SentenceAnalysisResult;
      timestamp: string;
    }>;
    
    return Object.values(savedAnalyses)
      .sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
  } catch {
    return [];
  }
}