import { useState, useEffect, useRef } from 'react';
import { useWordBank, analyzeWordsAgainstBank } from '@/lib/wordBank';
import { parseWords, findWordInBank, analyzeWordDifficulty, extractSentences } from '@/lib/wordParsing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, ArrowUpDown, Filter, PieChart, Loader2 } from 'lucide-react';
import VocabularyCharts from './VocabularyCharts';
import WordInstance from './WordInstance';
import { toast } from 'sonner';

interface VocabularySectionProps {
  text: string;
  selectedWord?: string;
}

type SortOption = 'frequency' | 'alphabetical' | 'difficulty';
type DifficultyFilter = 'all' | 'easy' | 'medium' | 'hard';

export default function VocabularySection({ text, selectedWord }: VocabularySectionProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('frequency');
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>('all');
  const [showCharts, setShowCharts] = useState(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  const { wordBank, loading, error } = useWordBank();
  
  // 使用优化后的单词解析
  const parsedWords = parseWords(text);
  const wordFrequency = new Map<string, number>();
  const wordContexts = new Map<string, Set<string>>();
  
  // 提取句子
  const sentences = extractSentences(text);
  
  // 统计词频和上下文
  parsedWords.forEach(word => {
    const normalized = word.normalized;
    wordFrequency.set(normalized, (wordFrequency.get(normalized) || 0) + 1);
    
    // 找到所有包含该单词的句子
    const matchingSentences = sentences.filter(sentence => 
      sentence.toLowerCase().includes(word.original.toLowerCase())
    );
    
    const contexts = wordContexts.get(normalized) || new Set();
    matchingSentences.forEach(sentence => contexts.add(sentence));
    wordContexts.set(normalized, contexts);
  });
  
  // 转换为分析结果
  const words = Array.from(wordFrequency.entries()).map(([word, frequency]) => ({
    word,
    occurrences: frequency,
    context: Array.from(wordContexts.get(word) || []),
    difficulty: analyzeWordDifficulty(word, wordBank)
  }));

  const bankAnalysis = analyzeWordsAgainstBank(words.map(w => w.word), wordBank);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const filteredAndSortedWords = words
    .filter(word => 
      (difficultyFilter === 'all' || word.difficulty === difficultyFilter) &&
      (searchTerm === '' || word.word.includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'frequency':
          return b.occurrences - a.occurrences;
        case 'alphabetical':
          return a.word.localeCompare(b.word);
        case 'difficulty':
          const difficultyOrder = { easy: 0, medium: 1, hard: 2 };
          return difficultyOrder[b.difficulty] - difficultyOrder[a.difficulty];
        default:
          return 0;
      }
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[200px]">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#86868B] w-4 h-4" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜索单词..."
            className="apple-input pl-10"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setSortBy(current => 
            current === 'frequency' ? 'alphabetical' : 'frequency'
          )}
          className="apple-button-secondary gap-2"
        >
          <ArrowUpDown className="w-4 h-4" />
          {sortBy === 'frequency' ? '按频率' : '按字母'}
        </Button>
        <Button
          variant="outline"
          onClick={() => setDifficultyFilter(current => 
            current === 'all' ? 'easy' : 
            current === 'easy' ? 'medium' : 
            current === 'medium' ? 'hard' : 'all'
          )}
          className="apple-button-secondary gap-2"
        >
          <Filter className="w-4 h-4" />
          {difficultyFilter === 'all' ? '全部' : 
           difficultyFilter === 'easy' ? '简单' : 
           difficultyFilter === 'medium' ? '中等' : '困难'}
        </Button>
        <Button
          variant="outline"
          onClick={() => setShowCharts(prev => !prev)}
          className="apple-button-secondary gap-2"
        >
          <PieChart className="w-4 h-4" />
          {showCharts ? '隐藏图表' : '显示图表'}
        </Button>
      </div>

      {showCharts && (
        <VocabularyCharts 
          words={words}
          bankAnalysis={bankAnalysis}
        />
      )}

      <ScrollArea className="h-[calc(100vh-16rem)]" ref={scrollAreaRef}>
        <div className="grid gap-4">
          {filteredAndSortedWords.map((word, index) => {
            const bankEntry = findWordInBank(word.word, wordBank);
            
            return (
              <div
                key={index}
                id={`word-${word.word}`}
                className={`p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-all
                  ${selectedWord === word.word ? 'ring-2 ring-primary' : ''}
                `}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="text-lg font-medium text-[#1D1D1F]">
                      {word.word}
                      {bankEntry?.variations && bankEntry.variations.length > 0 && (
                        <span className="ml-2 text-xs text-[#86868B]">
                          ({bankEntry.variations.join(', ')})
                        </span>
                      )}
                      {bankEntry && (
                        <span className="ml-2 text-xs px-2 py-1 bg-[#E3F2FD] text-[#1976D2] rounded-full">
                          {bankEntry.tags.join(', ')}
                        </span>
                      )}
                    </h4>
                    <div className="flex items-center gap-2 text-sm text-[#86868B]">
                      <span>出现次数: {word.occurrences}</span>
                      {bankEntry && (
                        <>
                          <span>•</span>
                          <span>{bankEntry.translation}</span>
                          <span>•</span>
                          <span>{bankEntry.partOfSpeech.join(', ')}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <span
                    className={`
                      px-2 py-1 rounded-full text-xs
                      ${word.difficulty === 'easy' ? 'bg-[#E8F5E9] text-[#2E7D32]' :
                        word.difficulty === 'medium' ? 'bg-[#FFF3E0] text-[#EF6C00]' :
                        'bg-[#FFEBEE] text-[#C62828]'}
                    `}
                  >
                    {word.difficulty === 'easy' ? '简单' :
                     word.difficulty === 'medium' ? '中等' : '困难'}
                  </span>
                </div>
                <div className="space-y-2">
                  {word.context.map((sentence, i) => (
                    <WordInstance
                      key={i}
                      sentence={sentence}
                      word={word.word}
                      isHighlighted={selectedWord === word.word}
                    />
                  ))}
                  {bankEntry?.examples && (
                    <div className="mt-3 pt-3 border-t border-[#F5F5F7]">
                      <p className="text-sm text-[#86868B] font-medium mb-1">词库示例：</p>
                      {bankEntry.examples.map((example, i) => (
                        <p key={i} className="text-sm text-[#86868B] italic">
                          "{example}"
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}