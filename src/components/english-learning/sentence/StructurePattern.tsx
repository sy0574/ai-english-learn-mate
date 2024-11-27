interface StructurePatternProps {
  structure: {
    level: 'simple' | 'compound' | 'complex';
    patterns: string[];
    explanation: string;
  };
}

const LEVEL_LABELS = {
  simple: '简单句',
  compound: '并列句',
  complex: '复合句'
} as const;

export default function StructurePattern({ structure }: StructurePatternProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <span className="px-2 py-1 bg-primary/10 text-primary rounded-full text-sm">
          {LEVEL_LABELS[structure.level]}
        </span>
        {structure.patterns.map((pattern, index) => (
          <span
            key={index}
            className="px-2 py-1 bg-secondary text-secondary-foreground rounded-full text-sm"
          >
            {pattern}
          </span>
        ))}
      </div>

      <div className="p-3 bg-muted rounded-lg">
        <p className="text-sm text-muted-foreground">
          {structure.explanation}
        </p>
      </div>
    </div>
  );
}