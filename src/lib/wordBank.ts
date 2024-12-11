import { useState, useEffect } from 'react';

export interface WordBankEntry {
  word: string;
  translation: string;
  partOfSpeech: string[];
  level: 'junior' | 'senior' | 'cet4' | 'cet6' | 'advanced';
  tags: string[];
  examples: string[];
  variations: string[];
}

export async function loadWordBank(): Promise<WordBankEntry[]> {
  try {
    const response = await fetch('/data/word-bank.csv');
    const csvText = await response.text();
    return parseCSV(csvText);
  } catch (error) {
    console.error('Error loading word bank:', error);
    return [];
  }
}

function parseCSV(csvText: string): WordBankEntry[] {
  const lines = csvText.split('\n');
  if (lines.length < 2) {
    throw new Error('Word bank CSV must contain header and at least one entry');
  }
  
  const headers = lines[0].split(',');
  console.log('CSV headers:', headers);
  
  const entries = lines.slice(1)
    .filter(line => line.trim())
    .map((line, index) => {
      try {
        const values = line.split(',').map(value => value.trim());
        if (values.length < 4) {
          console.warn(`Skipping invalid line ${index + 2}: insufficient columns`);
          return null;
        }
        
        const level = values[3] as WordBankEntry['level'];
        if (!['junior', 'senior', 'cet4', 'cet6', 'advanced'].includes(level)) {
          console.warn(`Skipping line ${index + 2}: invalid level "${level}"`);
          return null;
        }
        
        const entry: WordBankEntry = {
          word: values[0],
          translation: values[1],
          partOfSpeech: values[2].split('.').filter(Boolean),
          level,
          tags: values[4]?.replace(/"/g, '').split(',').filter(tag => tag.trim()) || [],
          examples: values[5]?.replace(/"/g, '').split('.').filter(Boolean).map(ex => ex.trim()) || [],
          variations: values[6]?.replace(/"/g, '').split(',').filter(v => v.trim()) || []
        };
        
        return entry;
      } catch (error) {
        console.error(`Error parsing line ${index + 2}:`, error);
        return null;
      }
    })
    .filter((entry): entry is WordBankEntry => entry !== null);
  
  return entries;
}

export function useWordBank() {
  const [wordBank, setWordBank] = useState<WordBankEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadWordBank()
      .then(data => {
        setWordBank(data);
        setLoading(false);
      })
      .catch(err => {
        setError('加载词库失败');
        setLoading(false);
        console.error('Error loading word bank:', err);
      });
  }, []);

  return { wordBank, loading, error };
}

// 检查单词是否在词库中（考虑词形变化）
export function checkWordInBank(word: string, wordBank: WordBankEntry[]): WordBankEntry | null {
  // 直接匹配
  const directMatch = wordBank.find(entry => entry.word === word);
  if (directMatch) return directMatch;

  // 检查变体形式
  return wordBank.find(entry => 
    entry.variations?.includes(word.toLowerCase())
  ) || null;
}

// 获取单词的词库级别
export function getWordLevel(word: string, wordBank: WordBankEntry[]): string {
  const entry = checkWordInBank(word, wordBank);
  return entry ? entry.level : 'unknown';
}

// 批量检查单词列表与词库的匹配情况
export function analyzeWordsAgainstBank(words: string[], wordBank: WordBankEntry[] = []): {
  inBank: WordBankEntry[];
  notInBank: string[];
  coverage: number;
} {
  const inBank: WordBankEntry[] = [];
  const notInBank: string[] = [];
  const processedWords = new Set<string>();

  words.forEach(word => {
    if (processedWords.has(word)) return;
    
    const entry = checkWordInBank(word, wordBank);
    if (entry) {
      inBank.push(entry);
    } else {
      notInBank.push(word);
    }
    
    processedWords.add(word);
  });

  return {
    inBank,
    notInBank,
    coverage: (inBank.length / processedWords.size) * 100
  };
}