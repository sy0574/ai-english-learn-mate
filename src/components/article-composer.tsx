'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface ArticleComposerProps {
  initialContent: string;
}

export default function ArticleComposer({ initialContent }: ArticleComposerProps) {
  const [content, setContent] = useState(initialContent);
  const [instruction, setInstruction] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleInstructionSubmit = async () => {
    if (!instruction.trim()) {
      toast.error('Please enter an instruction');
      return;
    }
    
    setIsProcessing(true);
    try {
      const response = await fetch('/api/process-instruction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          instruction,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to process instruction');
      }

      const result = await response.json();
      setContent(result.processedContent);
      toast.success('Content updated successfully');
    } catch (error) {
      console.error('Error processing instruction:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to process instruction');
    } finally {
      setIsProcessing(false);
      setInstruction('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleInstructionSubmit();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Article Content */}
      <div className="prose max-w-none">
        <div className="min-h-[200px] p-4 border rounded-lg bg-white shadow relative">
          {isProcessing && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
              <div className="flex items-center space-x-2">
                <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                <span className="text-sm text-gray-600">Processing instruction...</span>
              </div>
            </div>
          )}
          <div className="whitespace-pre-wrap">{content}</div>
        </div>
      </div>

      {/* AI Instruction Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter AI instruction (e.g., translate this text)"
          className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isProcessing}
        />
        <button
          onClick={handleInstructionSubmit}
          disabled={isProcessing}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isProcessing ? 'Processing...' : 'Execute'}
        </button>
      </div>
    </div>
  );
} 