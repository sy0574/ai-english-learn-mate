import { useState, useEffect } from 'react';
import type { GrammaticalType } from '@/lib/api/types';
import { Edit2 } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import SentenceAnalysisEditor from './SentenceAnalysisEditor';
import { COMPONENT_COLORS } from './SentenceStructureAnalysis';

interface SentenceComponentProps {
  text: string;
  type: GrammaticalType;
  isSelected: boolean;
  isAnimated: boolean;
  explanation: string;
  clauseLevel: 'main' | 'coordinate' | 'subordinate';
  onClick: (type: GrammaticalType) => void;
  onUpdate?: (updatedComponent: {
    text: string;
    type: GrammaticalType;
    explanation: string;
  }) => void;
}

// 句子层级指示器
const CLAUSE_INDICATORS = {
  main: {
    color: 'border-l-4 border-primary',
  },
  coordinate: {
    color: 'border-l-4 border-blue-400',
  },
  subordinate: {
    color: 'border-l-4 border-purple-400',
  }
} as const;

export default function SentenceComponent({
  text,
  type,
  isSelected,
  isAnimated,
  explanation,
  clauseLevel,
  onClick,
  onUpdate
}: SentenceComponentProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isCore, setIsCore] = useState(false);

  // 确定核心成分
  useEffect(() => {
    if (isAnimated) {
      const isCoreElement = ['subject', 'predicate', 'object', 'complement'].includes(type);
      setIsCore(isCoreElement);
    } else {
      setIsCore(false);
    }
  }, [isAnimated, type]);

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleSave = (updatedComponent: {
    text: string;
    type: GrammaticalType;
    explanation: string;
  }) => {
    onUpdate?.(updatedComponent);
    setIsEditing(false);
  };

  // 获取组件颜色
  const getComponentColor = (componentType: GrammaticalType) => {
    return COMPONENT_COLORS[componentType];
  };

  if (isEditing) {
    return (
      <SentenceAnalysisEditor
        component={{ text, type, explanation }}
        onSave={handleSave}
        onCancel={() => setIsEditing(false)}
      />
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative">
            <button
              onClick={() => onClick(type)}
              className={`
                relative px-3 py-2 rounded-lg
                transition-all duration-300
                ${getComponentColor(type)}
                ${isSelected ? 'ring-2 ring-primary/50' : ''}
                ${isAnimated && isCore ? 'scale-105 shadow-sm' : ''}
                ${isAnimated && !isCore ? 'opacity-75' : ''}
                ${CLAUSE_INDICATORS[clauseLevel].color}
                group hover:shadow-sm
                flex items-center gap-2
              `}
            >
              <span className="text-sm">{text}</span>
              {onUpdate && (
                <button
                  onClick={handleEdit}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full bg-primary/10 hover:bg-primary/20"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
              )}
            </button>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-1">
            <div className="font-medium">{type}</div>
            <p className="text-sm text-muted-foreground">{explanation}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}