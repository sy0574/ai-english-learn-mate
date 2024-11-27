import { ParsedWord } from './wordParsing';

export interface SentenceComponent {
  text: string;
  type: GrammaticalType;
  subComponents?: SentenceComponent[];
  explanation?: string;
}

export type GrammaticalType = 
  | 'subject' 
  | 'predicate'
  | 'object'
  | 'complement'
  | 'modifier'
  | 'conjunction'
  | 'preposition'
  | 'clause'
  | 'phrase';

export interface ParsedSentence {
  original: string;
  components: SentenceComponent[];
  structure: string;
  level: 'simple' | 'compound' | 'complex';
  patterns: string[];
}

const CLAUSE_MARKERS = new Set([
  'that', 'which', 'who', 'whom', 'whose',
  'when', 'where', 'why', 'how',
  'if', 'unless', 'although', 'though',
  'because', 'since', 'as',
  'while', 'whereas', 'whether'
]);

const PREPOSITIONS = new Set([
  'in', 'on', 'at', 'to', 'for', 'with',
  'by', 'from', 'of', 'about', 'between',
  'among', 'through', 'during', 'before',
  'after', 'into', 'onto', 'upon'
]);

export function parseSentence(sentence: string): ParsedSentence {
  // 基本清理
  sentence = sentence.trim();
  
  // 识别句子类型和结构
  const hasSubordinate = Array.from(CLAUSE_MARKERS).some(marker => 
    sentence.toLowerCase().includes(marker)
  );
  
  const hasCoordinate = /\band\b|\bor\b|\bbut\b/i.test(sentence);
  
  const level = hasSubordinate ? 'complex' : 
                hasCoordinate ? 'compound' : 'simple';

  // 分析主要成分
  const components = analyzeComponents(sentence);

  // 识别句型模式
  const patterns = identifyPatterns(components);

  return {
    original: sentence,
    components,
    structure: generateStructureDescription(components),
    level,
    patterns
  };
}

function analyzeComponents(sentence: string): SentenceComponent[] {
  const components: SentenceComponent[] = [];
  const words = sentence.split(/\s+/);
  let currentComponent: SentenceComponent | null = null;

  words.forEach((word, index) => {
    // 识别主语（一般在句首或从句开始）
    if (index === 0 || CLAUSE_MARKERS.has(word.toLowerCase())) {
      if (currentComponent) {
        components.push(currentComponent);
      }
      currentComponent = {
        text: word,
        type: 'subject'
      };
      return;
    }

    // 识别谓语（一般跟在主语后的动词）
    if (isVerb(word) && components.some(c => c.type === 'subject')) {
      if (currentComponent) {
        components.push(currentComponent);
      }
      currentComponent = {
        text: word,
        type: 'predicate'
      };
      return;
    }

    // 识别介词短语
    if (PREPOSITIONS.has(word.toLowerCase())) {
      if (currentComponent) {
        components.push(currentComponent);
      }
      currentComponent = {
        text: word,
        type: 'preposition'
      };
      return;
    }

    // 将单词添加到当前组件
    if (currentComponent) {
      currentComponent.text += ' ' + word;
    } else {
      currentComponent = {
        text: word,
        type: 'modifier' // 默认作为修饰语
      };
    }
  });

  // 添加最后一个组件
  if (currentComponent) {
    components.push(currentComponent);
  }

  return components;
}

function isVerb(word: string): boolean {
  // 简单的动词识别规则
  const commonVerbs = new Set([
    'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did',
    'can', 'could', 'will', 'would', 'shall', 'should',
    'may', 'might', 'must'
  ]);

  return commonVerbs.has(word.toLowerCase()) || 
         /[a-z]+(s|ed|ing)$/i.test(word);
}

function generateStructureDescription(components: SentenceComponent[]): string {
  const types = components.map(c => c.type);
  
  if (types.includes('clause')) {
    return '复合句结构';
  }
  
  const basic = types.join(' + ');
  return `基本句型：${basic}`;
}

function identifyPatterns(components: SentenceComponent[]): string[] {
  const patterns: string[] = [];
  const types = components.map(c => c.type);

  // 识别五种基本句型
  if (matchPattern(types, ['subject', 'predicate'])) {
    patterns.push('主谓结构 (S+V)');
  }
  
  if (matchPattern(types, ['subject', 'predicate', 'object'])) {
    patterns.push('主谓宾结构 (S+V+O)');
  }
  
  if (matchPattern(types, ['subject', 'predicate', 'complement'])) {
    patterns.push('主系表结构 (S+V+C)');
  }
  
  if (matchPattern(types, ['subject', 'predicate', 'object', 'object'])) {
    patterns.push('主谓双宾结构 (S+V+O+O)');
  }
  
  if (matchPattern(types, ['subject', 'predicate', 'object', 'complement'])) {
    patterns.push('主谓宾补结构 (S+V+O+C)');
  }

  return patterns;
}

function matchPattern(types: GrammaticalType[], pattern: GrammaticalType[]): boolean {
  const typeStr = types.join(',');
  const patternStr = pattern.join(',');
  return typeStr.includes(patternStr);
}