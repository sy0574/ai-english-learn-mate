import React from 'react';
import { Card } from '@/components/ui/card';
import type { AIAnalysisResult } from '@/lib/api/types';

interface SentenceAnalysisProps {
  analysis: AIAnalysisResult;
}

export default function SentenceAnalysis({ analysis }: SentenceAnalysisProps) {
  const { sentenceAnalysis } = analysis;

  if (!sentenceAnalysis) return null;

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-2">Sentence Structure</h3>
        <p className="text-sm text-muted-foreground">{sentenceAnalysis.structure}</p>
      </Card>

      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-2">Grammar Points</h3>
        <ul className="list-disc list-inside space-y-2">
          {sentenceAnalysis.grammarPoints.map((point, index) => (
            <li key={index} className="text-sm text-muted-foreground">{point}</li>
          ))}
        </ul>
      </Card>

      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-2">Usage Examples</h3>
        <div className="space-y-2">
          {sentenceAnalysis.examples.map((example, index) => (
            <div key={index} className="text-sm">
              <p className="font-medium">{example.sentence}</p>
              <p className="text-muted-foreground">{example.explanation}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
