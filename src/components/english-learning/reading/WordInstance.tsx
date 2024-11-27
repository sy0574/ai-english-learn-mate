import { useEffect, useRef } from 'react';

interface WordInstanceProps {
  sentence: string;
  word: string;
  isHighlighted: boolean;
}

export default function WordInstance({ 
  sentence, 
  word, 
  isHighlighted 
}: WordInstanceProps) {
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (isHighlighted && ref.current) {
      ref.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    }
  }, [isHighlighted]);

  // 使用正则表达式匹配单词，保持原始大小写
  const regex = new RegExp(`(${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = sentence.split(regex);

  return (
    <p 
      ref={ref}
      className={`
        text-sm italic transition-colors duration-200 p-2 rounded-lg
        ${isHighlighted ? 'bg-primary/10' : 'text-muted-foreground'}
      `}
    >
      {parts.map((part, index) => 
        part.toLowerCase() === word.toLowerCase() ? (
          <span key={index} className="font-medium text-primary">
            {part}
          </span>
        ) : (
          <span key={index}>{part}</span>
        )
      )}
    </p>
  );
}