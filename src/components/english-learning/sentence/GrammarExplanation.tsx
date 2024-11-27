import type { GrammaticalType } from '@/lib/api/types';
import { Info } from 'lucide-react';

interface GrammarExplanationProps {
  selectedComponent: GrammaticalType | null;
  components: Array<{
    text: string;
    type: GrammaticalType;
    explanation: string;
  }>;
}

export default function GrammarExplanation({
  selectedComponent,
  components
}: GrammarExplanationProps) {
  if (!selectedComponent) {
    return (
      <div className="text-center text-muted-foreground py-4">
        点击句子成分查看语法说明
      </div>
    );
  }

  const selectedComponents = components.filter(
    component => component.type === selectedComponent
  );

  return (
    <div className="space-y-4">
      {selectedComponents.map((component, index) => (
        <div key={index} className="p-4 bg-muted rounded-lg">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 mt-1 text-primary" />
            <div>
              <p className="font-medium mb-1">
                {component.text}
              </p>
              <p className="text-sm text-muted-foreground">
                {component.explanation}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}