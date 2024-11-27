import { GitFork, Info } from 'lucide-react';

interface SentenceStructureProps {
  level: 'simple' | 'compound' | 'complex';
  patterns: string[];
  explanation: string;
}

export default function SentenceStructure({ level, patterns, explanation }: SentenceStructureProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm">
        <GitFork className="w-4 h-4" />
        <span className="font-medium">句子类型：</span>
        <span className="text-muted-foreground">
          {level === 'simple' ? '简单句' :
           level === 'compound' ? '并列句' : '复合句'}
        </span>
      </div>

      <div className="flex items-start gap-2 text-sm">
        <Info className="w-4 h-4 mt-1" />
        <div>
          <span className="font-medium">句子结构：</span>
          <ul className="list-disc list-inside mt-1 text-muted-foreground">
            {patterns.map((pattern, index) => (
              <li key={index}>{pattern}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="p-3 bg-secondary rounded-lg text-sm">
        <p className="text-muted-foreground">{explanation}</p>
      </div>
    </div>
  );
}