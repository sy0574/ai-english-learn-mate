import { AIModelManager } from './aiModelManager';
import type { SentenceAnalysisResult } from './types';
import { APIError } from '@/lib/utils/errorHandler';
import { UsageLimitsManager } from './usageLimitsManager';
import { supabase } from '@/lib/supabase';

const STORAGE_KEY = 'sentence-analyses';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1秒

// 添加延迟函数
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// 安全的编码函数
function safeEncode(str: string): string {
  // 先将字符串转换为 UTF-8 编码的字节数组
  const utf8Bytes = new TextEncoder().encode(str);
  // 将字节数组转换为 Base64
  return btoa(String.fromCharCode.apply(null, [...utf8Bytes]));
}

// 安全的解码函数（预留给将来可能的解码需求）
function _safeDecode(str: string): string {
  // 将 Base64 转换为字节数组
  const binaryStr = atob(str);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  // 将字节数组转换为 UTF-8 字符串
  return new TextDecoder().decode(bytes);
}

export async function analyzeSentenceStructure(sentence: string): Promise<SentenceAnalysisResult> {
  const modelManager = AIModelManager.getInstance();
  const usageLimitsManager = UsageLimitsManager.getInstance();

  if (!sentence?.trim()) {
    throw new Error('请提供要分析的句子');
  }

  // 获取当前用户
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new APIError('请先登录');
  }

  // 检查使用限制
  const canProceed = await usageLimitsManager.checkAndIncrementUsage(user.id);
  if (!canProceed) {
    throw new APIError('已达到今日免费使用次数限制，请升级到专业版继续使用');
  }

  let lastError: Error | null = null;
  let retries = 0;

  while (retries < MAX_RETRIES) {
    try {
      console.log('Sending analysis request for sentence:', sentence);
      
      // 构建分析提示
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

      const result = await modelManager.makeRequest('sentenceStructure', prompt);
      console.log('Raw API response:', result);
      
      try {
        // Clean and preprocess the response
        const cleanedResult = result.trim();
        let jsonStr = cleanedResult;

        // If the response is wrapped in a code block, extract just the JSON
        if (cleanedResult.startsWith('```json')) {
          const match = cleanedResult.match(/```json\s*([\s\S]*?)\s*```/);
          if (match && match[1]) {
            jsonStr = match[1].trim();
          }
        }

        // Parse the JSON
        let parsedResult: SentenceAnalysisResult;
        try {
          parsedResult = JSON.parse(jsonStr);
          console.log('Parsed result:', parsedResult);
        } catch (e) {
          console.error('JSON parse error:', e);
          throw new APIError('JSON解析失败，响应格式不正确');
        }

        // Validate the result structure
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

        // Save the analysis result
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
    
    // 使用安全的编码函数
    const key = safeEncode(sentence).slice(0, 32);
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
    
    // 使用安全的编码函数
    const key = safeEncode(sentence).slice(0, 32);
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