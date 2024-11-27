import { useCallback, useMemo } from 'react';
import { parseWords } from '@/lib/wordParsing';

interface WordHighlighterProps {
  text: string;
  onWordClick?: (word: string) => void;
  className?: string;
}

export default function WordHighlighter({ 
  text,
  onWordClick,
  className = ''
}: WordHighlighterProps) {
  // 解析文本中的单词
  const parsedWords = useMemo(() => parseWords(text), [text]);
  
  // 构建带有高亮的文本内容
  const renderContent = useCallback(() => {
    if (!text) return null;
    
    const result: JSX.Element[] = [];
    let lastIndex = 0;
    
    parsedWords.forEach((word, index) => {
      // 添加单词前的文本
      if (word.startIndex > lastIndex) {
        result.push(
          <span key={`text-${index}`}>
            {text.slice(lastIndex, word.startIndex)}
          </span>
        );
      }
      
      // 添加可点击的单词
      result.push(
        <span
          key={`word-${index}`}
          onClick={() => onWordClick?.(word.normalized)}
          className="cursor-pointer hover:text-primary hover:underline"
          title="点击查看详情"
        >
          {word.original}
        </span>
      );
      
      lastIndex = word.endIndex;
    });
    
    // 添加剩余的文本
    if (lastIndex < text.length) {
      result.push(
        <span key="text-end">
          {text.slice(lastIndex)}
        </span>
      );
    }
    
    return result;
  }, [text, parsedWords, onWordClick]);

  return (
    <div className={`whitespace-pre-wrap ${className}`}>
      {renderContent()}
    </div>
  );
}