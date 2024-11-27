import { AnalysisTask } from '@/types';

export interface PromptTemplate {
  name: string;
  description: string;
  systemPrompt: string;
  userPromptTemplate: string;
  outputFormat: {
    type: 'json' | 'text' | 'markdown';
    schema?: Record<string, any>;
  };
}

export const ANALYSIS_PROMPTS: Record<AnalysisTask, PromptTemplate> = {
  sentenceStructure: {
    name: '句子结构分析',
    description: '分析英语句子的语法结构，包括主谓宾、从句等',
    systemPrompt: `你是一名资深的英语语法教师。你的任务是分析英语句子的语法结构，并以严格的JSON格式返回分析结果。

要求：
1. 返回的必须是合法的JSON格式
2. 不要添加任何额外的解释或说明
3. 确保所有必需字段都存在
4. 字段值必须符合指定的类型和枚举值
5. 如果句子结构复杂，确保详细分析每个成分

错误示例：
- 不要在JSON前后添加反引号或其他标记
- 不要添加"这是分析结果："等说明文字
- 不要使用未定义的字段或类型值`,
    userPromptTemplate: `分析以下英语句子的语法结构：

"{{sentence}}"

必须返回以下格式的JSON（不要添加任何其他内容）：

{
  "components": [
    {
      "text": "string（具体的词或短语）",
      "type": "string（必须是以下之一：subject/predicate/object/complement/modifier/conjunction/preposition/clause/phrase）",
      "explanation": "string（用中文解释语法功能）",
      "subComponents": [
        {
          "text": "string（子成分文本）",
          "type": "string（语法类型）",
          "explanation": "string（解释说明）"
        }
      ]
    }
  ],
  "structure": {
    "level": "string（必须是以下之一：simple/compound/complex）",
    "patterns": ["string（句型模式，如S+V, S+V+O等）"],
    "explanation": "string（详细的句子结构说明）"
  },
  "rules": [
    {
      "type": "string（语法规则类型）",
      "description": "string（规则描述）",
      "examples": ["string（示例1）", "string（示例2）"]
    }
  ]
}`,
    outputFormat: {
      type: 'json',
      schema: {
        type: 'object',
        required: ['components', 'structure', 'rules'],
        properties: {
          components: {
            type: 'array',
            items: {
              type: 'object',
              required: ['text', 'type', 'explanation'],
              properties: {
                text: { type: 'string' },
                type: { 
                  type: 'string',
                  enum: ['subject', 'predicate', 'object', 'complement', 'modifier', 
                        'conjunction', 'preposition', 'clause', 'phrase']
                },
                explanation: { type: 'string' },
                subComponents: {
                  type: 'array',
                  items: {
                    type: 'object',
                    required: ['text', 'type', 'explanation'],
                    properties: {
                      text: { type: 'string' },
                      type: { type: 'string' },
                      explanation: { type: 'string' }
                    }
                  }
                }
              }
            }
          },
          structure: {
            type: 'object',
            required: ['level', 'patterns', 'explanation'],
            properties: {
              level: { 
                type: 'string',
                enum: ['simple', 'compound', 'complex']
              },
              patterns: { 
                type: 'array', 
                items: { type: 'string' }
              },
              explanation: { type: 'string' }
            }
          },
          rules: {
            type: 'array',
            items: {
              type: 'object',
              required: ['type', 'description', 'examples'],
              properties: {
                type: { type: 'string' },
                description: { type: 'string' },
                examples: { 
                  type: 'array',
                  items: { type: 'string' }
                }
              }
            }
          }
        }
      }
    }
  },
  thematicAnalysis: {
    name: '主题分析',
    description: '分析文章的主题、关键词和核心思想',
    systemPrompt: '你是一名专业的文本分析专家。帮助学生理解文章的主题和核心内容。',
    userPromptTemplate: '请分析以下文章的主题和关键内容：\n{{content}}',
    outputFormat: {
      type: 'json',
      schema: {
        theme: 'string',
        keywords: 'array',
        summary: 'string',
        mainIdeas: 'array'
      }
    }
  },
  vocabularyAnalysis: {
    name: '词汇分析',
    description: '分析文章中的重要词汇和短语',
    systemPrompt: '你是一名词汇教学专家。帮助学生掌握文章中的重要词汇和短语用法。',
    userPromptTemplate: '请分析以下文章中的重要词汇和短语：\n{{content}}',
    outputFormat: {
      type: 'json',
      schema: {
        keywords: 'array',
        phrases: 'array',
        difficulty: 'string',
        usage: 'array'
      }
    }
  },
  backgroundKnowledge: {
    name: '背景知识',
    description: '提供相关的背景知识和补充信息',
    systemPrompt: '你是一名知识渊博的教育者。为学生提供理解文章所需的背景知识。',
    userPromptTemplate: '请提供理解以下内容所需的背景知识：\n{{content}}',
    outputFormat: {
      type: 'json',
      schema: {
        historicalContext: 'string',
        culturalReferences: 'array',
        relatedTopics: 'array',
        additionalResources: 'array'
      }
    }
  }
};
