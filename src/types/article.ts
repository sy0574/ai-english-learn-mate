export interface Article {
  id: string;
  title: string;
  content: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  createdAt: string;
  readingTime: number;
  imageUrl?: string;
}

export interface ArticleAnalysis {
  comprehension: {
    mainIdea: string;
    keyPoints: string[];
    logicalFlow: string[];
  };
  vocabulary: {
    keywords: Array<{
      word: string;
      translation: string;
      definition: string;
      examples: string[];
      partOfSpeech: string;
    }>;
    phrases: Array<{
      phrase: string;
      translation: string;
      usage: string;
      examples: string[];
    }>;
  };
  structure: {
    outline: Array<{
      level: number;
      content: string;
      children?: string[];
    }>;
    mindMap: {
      nodes: Array<{
        id: string;
        label: string;
        type: 'main' | 'sub' | 'detail';
      }>;
      edges: Array<{
        source: string;
        target: string;
      }>;
    };
  };
  exercises: {
    comprehension: Array<{
      type: 'multiple' | 'truefalse' | 'shortAnswer';
      question: string;
      options?: string[];
      correctAnswer: string;
      explanation: string;
    }>;
    vocabulary: Array<{
      type: 'matching' | 'fillBlank' | 'wordFormation';
      question: string;
      answer: string;
      hint?: string;
    }>;
    grammar: Array<{
      type: 'correction' | 'transformation' | 'completion';
      question: string;
      answer: string;
      explanation: string;
    }>;
  };
}