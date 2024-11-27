import type { GrammaticalType } from '@/lib/api/types';
import SentenceComponent from './SentenceComponent';
import { COMPONENT_COLORS } from './SentenceStructureAnalysis';

interface ComponentBreakdownProps {
  components: Array<{
    text: string;
    type: GrammaticalType;
    explanation: string;
    clauseType?: 'main' | 'coordinate' | 'subordinate';
  }>;
  selectedComponent: GrammaticalType | null;
  onComponentSelect: (type: GrammaticalType) => void;
}

export default function ComponentBreakdown({
  components,
  selectedComponent,
  onComponentSelect
}: ComponentBreakdownProps) {
  // Group components by clause type
  const mainClauses = components.filter(c => !c.clauseType || c.clauseType === 'main');
  const coordinateClauses = components.filter(c => c.clauseType === 'coordinate');
  const subordinateClauses = components.filter(c => c.clauseType === 'subordinate');

  return (
    <div className="space-y-6">
      {/* Main Clauses */}
      <div className="space-y-3">
        {mainClauses.map((component, index) => (
          <SentenceComponent
            key={`main-${index}`}
            text={component.text}
            type={component.type}
            explanation={component.explanation}
            isSelected={selectedComponent === component.type}
            isAnimated={false}
            clauseLevel="main"
            onClick={onComponentSelect}
          />
        ))}
      </div>

      {/* Coordinate Clauses */}
      {coordinateClauses.length > 0 && (
        <div className="space-y-3 ml-4 relative before:absolute before:left-0 before:top-0 before:bottom-0 before:w-px before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
          {coordinateClauses.map((component, index) => (
            <SentenceComponent
              key={`coordinate-${index}`}
              text={component.text}
              type={component.type}
              explanation={component.explanation}
              isSelected={selectedComponent === component.type}
              isAnimated={false}
              clauseLevel="coordinate"
              onClick={onComponentSelect}
            />
          ))}
        </div>
      )}

      {/* Subordinate Clauses */}
      {subordinateClauses.length > 0 && (
        <div className="space-y-3 ml-8 relative before:absolute before:left-0 before:top-0 before:bottom-0 before:w-px before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
          {subordinateClauses.map((component, index) => (
            <SentenceComponent
              key={`subordinate-${index}`}
              text={component.text}
              type={component.type}
              explanation={component.explanation}
              isSelected={selectedComponent === component.type}
              isAnimated={false}
              clauseLevel="subordinate"
              onClick={onComponentSelect}
            />
          ))}
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-4 pt-4 border-t border-border">
        <div className="flex items-center gap-6 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 border-l-2 border-primary" />
            <span>主句</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 border-l-2 border-blue-400" />
            <span>并列句</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 border-l-2 border-purple-400" />
            <span>从句</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          {Object.entries(COMPONENT_COLORS).map(([type, color]) => (
            <span key={type} className={`px-2 py-0.5 ${color} rounded`}>
              {type === 'subject' ? '主语' :
               type === 'predicate' ? '谓语' :
               type === 'object' ? '宾语' :
               type === 'complement' ? '补语' :
               type === 'modifier' ? '状语' :
               type === 'conjunction' ? '连词' :
               type === 'preposition' ? '介词' :
               type === 'clause' ? '从句' :
               type === 'phrase' ? '短语' : type}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}