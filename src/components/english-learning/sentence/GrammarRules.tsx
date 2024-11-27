interface GrammarRulesProps {
  type: string;
  rules: string[];
}

import { Info } from 'lucide-react';

export default function GrammarRules({ _type, rules }: GrammarRulesProps) {
  return (
    <div className="p-4 bg-secondary rounded-lg space-y-3">
      <h4 className="font-medium flex items-center gap-2">
        <Info className="w-4 h-4" />
        语法规则说明
      </h4>
      <ul className="list-disc list-inside space-y-2">
        {rules.map((rule, index) => (
          <li key={index} className="text-sm text-muted-foreground">
            {rule}
          </li>
        ))}
      </ul>
    </div>
  );
}