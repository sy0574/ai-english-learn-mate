import { WordBankEntry } from './wordBank';

// 单词类型定义
export interface ParsedWord {
  original: string;      // 原始单词
  normalized: string;    // 标准化形式
  startIndex: number;    // 在原文中的起始位置
  endIndex: number;      // 在原文中的结束位置
  isWord: boolean;       // 是否为有效单词
  sentences: string[];   // 包含该单词的句子
}

// 标点符号和特殊字符的正则表达式
const PUNCTUATION_REGEX = /[!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~]/g;

// 常见的缩写和特殊情况
const COMMON_CONTRACTIONS = new Set([
  "i'm", "i'll", "i'd", "i've",
  "you're", "you'll", "you'd", "you've",
  "he's", "he'll", "he'd",
  "she's", "she'll", "she'd",
  "it's", "it'll", "it'd",
  "we're", "we'll", "we'd", "we've",
  "they're", "they'll", "they'd", "they've",
  "that's", "that'll", "that'd",
  "who's", "who'll", "who'd",
  "what's", "what'll", "what'd",
  "where's", "where'll", "where'd",
  "when's", "when'll", "when'd",
  "why's", "why'll", "why'd",
  "how's", "how'll", "how'd",
  "ain't", "aren't", "can't", "couldn't",
  "didn't", "doesn't", "don't", "hadn't",
  "hasn't", "haven't", "isn't", "mightn't",
  "mustn't", "needn't", "shouldn't", "wasn't",
  "weren't", "won't", "wouldn't"
]);

// 检查是否为有效的英文单词
export function isValidWord(word: string): boolean {
  // 基本检查
  if (!word || word.length < 2) return false;
  
  // 检查是否包含数字
  if (/\d/.test(word)) return false;
  
  // 检查是否为纯标点符号
  if (/^[!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~]+$/.test(word)) return false;
  
  // 检查是否为常见缩写
  if (COMMON_CONTRACTIONS.has(word.toLowerCase())) return true;
  
  // 检查是否为纯字母（允许连字符和撇号）
  return /^[a-zA-Z]+(?:[''-][a-zA-Z]+)*$/.test(word);
}

// 标准化单词
export function normalizeWord(word: string): string {
  // 转换为小写
  let normalized = word.toLowerCase();
  
  // 处理缩写
  if (COMMON_CONTRACTIONS.has(normalized)) {
    return normalized;
  }
  
  // 移除标点符号（保留连字符和撇号）
  normalized = normalized.replace(/[!"#$%&()*+,./:;<=>?@[\]^_`{|}~]/g, '');
  
  // 处理连字符和撇号的特殊情况
  normalized = normalized.replace(/^[''-]+|[''-]+$/g, '');
  
  return normalized;
}

// 提取句子
export function extractSentences(text: string): string[] {
  return text
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(Boolean);
}

// 查找单词在句子中的所有实例
export function findWordInstances(word: string, sentence: string): number[] {
  const indices: number[] = [];
  const regex = new RegExp(`\\b${word}\\b`, 'gi');
  let match;
  
  while ((match = regex.exec(sentence)) !== null) {
    indices.push(match.index);
  }
  
  return indices;
}

// 解析文本中的单词
export function parseWords(text: string): ParsedWord[] {
  const words: ParsedWord[] = [];
  const sentences = extractSentences(text);
  
  // 使用正则表达式匹配所有可能的单词
  const wordRegex = /[\w''-]+/g;
  let match;
  
  while ((match = wordRegex.exec(text)) !== null) {
    const original = match[0];
    const normalized = normalizeWord(original);
    
    if (isValidWord(original)) {
      // 找到包含该单词的所有句子
      const wordSentences = sentences.filter(sentence =>
        sentence.toLowerCase().includes(original.toLowerCase())
      );
      
      words.push({
        original,
        normalized,
        startIndex: match.index,
        endIndex: match.index + original.length,
        isWord: true,
        sentences: wordSentences
      });
    }
  }
  
  return words;
}

// 检查单词是否在词库中（考虑变体）
export function findWordInBank(word: string, bankEntries: WordBankEntry[]): WordBankEntry | undefined {
  const normalized = normalizeWord(word);
  
  // 直接匹配
  const directMatch = bankEntries.find(entry => 
    normalizeWord(entry.word) === normalized ||
    entry.variations?.some(v => normalizeWord(v) === normalized)
  );
  
  if (directMatch) return directMatch;
  
  // 检查词形变化
  return bankEntries.find(entry => {
    // 检查词根
    if (normalized.startsWith(normalizeWord(entry.word))) {
      const suffix = normalized.slice(entry.word.length);
      return COMMON_AFFIXES.has(suffix);
    }
    return false;
  });
}

// 分析单词难度
export function analyzeWordDifficulty(
  word: string,
  bankEntries: WordBankEntry[]
): 'easy' | 'medium' | 'hard' {
  const normalized = normalizeWord(word);
  const bankEntry = findWordInBank(normalized, bankEntries);
  
  if (!bankEntry) {
    // 根据单词长度和结构判断难度
    if (normalized.length <= 4) return 'easy';
    if (normalized.length <= 7) return 'medium';
    return 'hard';
  }
  
  // 根据词库中的级别判断难度
  switch (bankEntry.level) {
    case 'junior':
      return 'easy';
    case 'senior':
    case 'cet4':
      return 'medium';
    case 'cet6':
    case 'advanced':
      return 'hard';
    default:
      return 'medium';
  }
}

// 常见的词缀
const COMMON_AFFIXES = new Set([
  // 前缀
  'un', 'in', 'im', 'il', 'ir', 'dis', 're', 'pre', 'pro', 'anti',
  // 后缀
  'ing', 'ed', 'er', 'est', 'ly', 'ity', 'ment', 'ness', 'tion', 'sion'
]);