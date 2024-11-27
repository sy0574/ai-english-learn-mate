import React from 'react';
import { Card } from '@/components/ui/card';
import type { AIAnalysisResult } from '@/lib/api/types';

interface BackgroundKnowledgeProps {
  analysis: AIAnalysisResult;
}

export default function BackgroundKnowledge({ analysis }: BackgroundKnowledgeProps) {
  const { backgroundKnowledge } = analysis;

  if (!backgroundKnowledge) return null;

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-2">Cultural Context</h3>
        <p className="text-sm text-muted-foreground">{backgroundKnowledge.culturalContext}</p>
      </Card>

      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-2">Related Topics</h3>
        <ul className="list-disc list-inside space-y-2">
          {backgroundKnowledge.relatedTopics.map((topic, index) => (
            <li key={index} className="text-sm text-muted-foreground">
              <span className="font-medium">{topic.name}</span>: {topic.description}
            </li>
          ))}
        </ul>
      </Card>

      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-2">Further Reading</h3>
        <ul className="list-disc list-inside space-y-2">
          {backgroundKnowledge.furtherReading.map((resource, index) => (
            <li key={index} className="text-sm text-muted-foreground">
              <a
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {resource.title}
              </a>
              <p className="mt-1">{resource.description}</p>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
