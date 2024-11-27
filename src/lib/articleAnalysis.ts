import { ArticleAnalysis } from '@/types/article';

export function analyzeArticle(content: string): ArticleAnalysis {
  // 这里是示例分析逻辑，实际项目中可以接入 AI 或其他分析服务
  const sentences = content.split(/[.!?]+/).filter(Boolean);
  const words = content.match(/\b\w+\b/g) || [];
  
  return {
    comprehension: {
      mainIdea: sentences[0] || '',
      keyPoints: sentences.slice(1, 4),
      logicalFlow: ['引言', '主要论点', '论据支持', '结论'],
    },
    vocabulary: {
      keywords: words.slice(0, 5).map(word => ({
        word,
        translation: '待翻译',
        definition: '待添加释义',
        examples: [`Example with ${word}`],
        partOfSpeech: 'noun',
      })),
      phrases: [{
        phrase: words.slice(0, 2).join(' '),
        translation: '待翻译',
        usage: '用法说明',
        examples: ['示例句子'],
      }],
    },
    structure: {
      outline: [
        { level: 1, content: '引言', children: ['背景', '主题'] },
        { level: 1, content: '主要内容', children: ['论点一', '论点二'] },
        { level: 1, content: '结论' },
      ],
      mindMap: {
        nodes: [
          { id: '1', label: '主题', type: 'main' },
          { id: '2', label: '要点1', type: 'sub' },
          { id: '3', label: '要点2', type: 'sub' },
        ],
        edges: [
          { source: '1', target: '2' },
          { source: '1', target: '3' },
        ],
      },
    },
    exercises: {
      comprehension: [
        {
          type: 'multiple',
          question: '文章的主要观点是什么？',
          options: ['选项A', '选项B', '选项C', '选项D'],
          correctAnswer: '选项A',
          explanation: '解释说明',
        },
      ],
      vocabulary: [
        {
          type: 'matching',
          question: `请选择 "${words[0]}" 的正确含义`,
          answer: '答案',
          hint: '提示',
        },
      ],
      grammar: [
        {
          type: 'correction',
          question: '请纠正句子中的语法错误',
          answer: '正确答案',
          explanation: '语法说明',
        },
      ],
    },
  };
}