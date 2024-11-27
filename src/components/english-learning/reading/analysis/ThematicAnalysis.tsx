import React from 'react';
import { Card } from '@/components/ui/card';
import type { AIAnalysisResult } from '@/lib/api/types';

interface ThematicAnalysisProps {
  analysis: AIAnalysisResult;
}

export default function ThematicAnalysis({ analysis }: ThematicAnalysisProps) {
  const { thematicAnalysis } = analysis;

  if (!thematicAnalysis) return null;

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-2">Main Theme</h3>
        <p className="text-sm text-muted-foreground">{thematicAnalysis.mainTheme}</p>
      </Card>

      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-2">Key Points</h3>
        <ul className="list-disc list-inside space-y-2">
          {thematicAnalysis.keyPoints.map((point, index) => (
            <li key={index} className="text-sm text-muted-foreground">{point}</li>
          ))}
        </ul>
      </Card>

      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-2">Analysis</h3>
        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{thematicAnalysis.analysis}</p>
      </Card>
    </div>
  );
}
