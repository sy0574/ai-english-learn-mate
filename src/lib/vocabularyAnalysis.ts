import { WordBankEntry } from './wordBank';

// 基本的词形变化规则
const commonWordForms = {
  // 动词变位规则
  VERB_RULES: [
    { suffix: 'ing', remove: 3, add: '', conditions: [
      { min: 4, double: true }, // running -> run
      { min: 3, double: false } // seeing -> see
    ]},
    { suffix: 'ies', remove: 3, add: 'y' }, // tries -> try
    { suffix: 'es', remove: 2, add: '', conditions: [
      { endings: ['sh', 'ch', 'x', 's', 'z'] }
    ]}, // watches -> watch
    { suffix: 's', remove: 1, add: '' }, // runs -> run
    { suffix: 'ed', remove: 2, add: '', conditions: [
      { min: 4, double: true }, // stopped -> stop
      { min: 3, double: false } // used -> use
    ]},
    { suffix: 'ied', remove: 3, add: 'y' }, // tried -> try
  ],
  
  // 名词复数规则
  NOUN_RULES: [
    { suffix: 'ies', remove: 3, add: 'y' }, // bodies -> body
    { suffix: 'es', remove: 2, add: '', conditions: [
      { endings: ['sh', 'ch', 'x', 's', 'z'] }
    ]}, // boxes -> box
    { suffix: 's', remove: 1, add: '' }, // cats -> cat
  ],
  
  // 形容词变化规则
  ADJ_RULES: [
    { suffix: 'er', remove: 2, add: '' }, // bigger -> big
    { suffix: 'est', remove: 3, add: '' }, // biggest -> big
    { suffix: 'ier', remove: 3, add: 'y' }, // happier -> happy
    { suffix: 'iest', remove: 4, add: 'y' }, // happiest -> happy
  ],

  // 常见不规则动词映射
  IRREGULAR_VERBS: new Map([
    ['am', 'be'], ['is', 'be'], ['are', 'be'], 
    ['was', 'be'], ['were', 'be'], ['been', 'be'],
    ['went', 'go'], ['gone', 'go'],
    ['had', 'have'], ['has', 'have'],
    ['did', 'do'], ['done', 'do'],
  ]),

  // 常见不规则名词复数映射
  IRREGULAR_NOUNS: new Map([
    ['men', 'man'], ['women', 'woman'],
    ['children', 'child'], ['people', 'person'],
    ['teeth', 'tooth'], ['feet', 'foot'],
    ['mice', 'mouse'], ['lives', 'life'],
    ['leaves', 'leaf'], ['knives', 'knife'],
    ['wolves', 'wolf'], ['shelves', 'shelf'],
    ['data', 'datum'], ['criteria', 'criterion'],
    ['phenomena', 'phenomenon'], ['analyses', 'analysis'],
    ['theses', 'thesis'], ['hypotheses', 'hypothesis'],
    ['diagnoses', 'diagnosis'], ['bases', 'basis'],
    ['crises', 'crisis'], ['axes', 'axis'],
    ['muscles', 'muscle'], // 特别添加这个常见的生物学术语
  ]),

  // 常见不规则形容词映射
  IRREGULAR_ADJECTIVES: new Map([
    ['better', 'good'], ['best', 'good'],
    ['worse', 'bad'], ['worst', 'bad'],
    ['more', 'many'], ['most', 'many'],
  ])
};

// 检查是否需要保持原形
const KEEP_ORIGINAL = new Set([
  'analysis', 'basis', 'crisis', 'diagnosis',
  'hypothesis', 'parenthesis', 'synthesis', 'thesis',
  'muscle', 'article', 'exercise', 'practice',
  'structure', 'culture', 'feature', 'creature',
  'literature', 'temperature', 'pressure',
]);

interface WordAnalysis {
  word: string;
  lemma: string;
  occurrences: number;
  context: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  variations?: string[];
}

// 检查是否应该保持原形
function shouldKeepOriginal(word: string): boolean {
  return KEEP_ORIGINAL.has(word.toLowerCase());
}

// 词形还原函数
function lemmatize(word: string): string {
  const lowerWord = word.toLowerCase();
  
  // 检查是否应该保持原形
  if (shouldKeepOriginal(lowerWord)) {
    return lowerWord;
  }

  // 检查不规则形式
  const irregularVerb = commonWordForms.IRREGULAR_VERBS.get(lowerWord);
  if (irregularVerb) return irregularVerb;

  const irregularNoun = commonWordForms.IRREGULAR_NOUNS.get(lowerWord);
  if (irregularNoun) return irregularNoun;

  const irregularAdj = commonWordForms.IRREGULAR_ADJECTIVES.get(lowerWord);
  if (irregularAdj) return irregularAdj;

  // 应用规则进行词形还原
  const allRules = [
    ...commonWordForms.NOUN_RULES,
    ...commonWordForms.VERB_RULES,
    ...commonWordForms.ADJ_RULES
  ];

  for (const rule of allRules) {
    if (lowerWord.endsWith(rule.suffix)) {
      // 检查条件是否满足
      if (rule.conditions) {
        const meetsConditions = rule.conditions.some(condition => {
          if (condition.endings) {
            return condition.endings.some(ending => lowerWord.endsWith(ending + rule.suffix));
          }
          if (condition.min !== undefined) {
            const stem = lowerWord.slice(0, -rule.remove);
            return stem.length >= condition.min;
          }
          return true;
        });
        if (!meetsConditions) continue;
      }

      const stem = lowerWord.slice(0, -rule.remove);
      return stem + rule.add;
    }
  }

  return lowerWord;
}

// 检查单词是否在词库中（考虑词形变化）
function checkWordInBank(word: string, bankEntries: WordBankEntry[]): WordBankEntry | null {
  const lowerWord = word.toLowerCase();
  
  // 直接匹配
  const directMatch = bankEntries.find(entry => 
    entry.word.toLowerCase() === lowerWord ||
    entry.variations?.some(v => v.toLowerCase() === lowerWord)
  );
  if (directMatch) return directMatch;

  // 词形还原后匹配
  const lemmatizedWord = lemmatize(lowerWord);
  return bankEntries.find(entry => 
    entry.word.toLowerCase() === lemmatizedWord ||
    entry.variations?.some(v => v.toLowerCase() === lemmatizedWord)
  );
}

export function analyzeVocabulary(text: string, bankEntries: WordBankEntry[] = []): WordAnalysis[] {
  // 分词，保留完整的单词形式
  const words = text.toLowerCase()
    .replace(/[^\w\s'-]/g, ' ') // 保留撇号和连字符
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(word => word.length > 1); // 过滤掉单字母

  // 用于跟踪词形变化
  const wordVariations = new Map<string, Set<string>>();
  
  // 统计词频和收集上下文
  const wordMap = new Map<string, { 
    count: number; 
    contexts: Set<string>;
    lemma: string;
    originalForms: Set<string>;
  }>();
  
  // 提取句子用于上下文
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  
  words.forEach((word) => {
    // 获取词形还原形式
    const lemma = lemmatize(word);
    
    // 记录原始形式和变体
    if (!wordVariations.has(lemma)) {
      wordVariations.set(lemma, new Set());
    }
    wordVariations.get(lemma)?.add(word);
    
    const entry = wordMap.get(lemma) || { 
      count: 0, 
      contexts: new Set(),
      lemma,
      originalForms: new Set()
    };
    
    entry.count++;
    entry.originalForms.add(word);
    
    // 查找包含该单词的句子作为上下文
    const context = sentences.find(s => 
      s.toLowerCase().includes(word)
    );
    if (context) {
      entry.contexts.add(context.trim());
    }
    
    wordMap.set(lemma, entry);
  });

  // 常用词过滤
  const commonWords = new Set([
    'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
    'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
    'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
    'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what'
  ]);

  // 转换为数组并按频率排序
  return Array.from(wordMap.entries())
    .filter(([lemma]) => !commonWords.has(lemma))
    .map(([lemma, data]) => ({
      word: lemma,
      lemma: data.lemma,
      occurrences: data.count,
      context: Array.from(data.contexts).slice(0, 3),
      difficulty: getWordDifficulty(lemma),
      variations: Array.from(data.originalForms)
    }))
    .sort((a, b) => b.occurrences - a.occurrences);
}

function getWordDifficulty(word: string): 'easy' | 'medium' | 'hard' {
  if (word.length <= 4) return 'easy';
  if (word.length <= 7) return 'medium';
  return 'hard';
}