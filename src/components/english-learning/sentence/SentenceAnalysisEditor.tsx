import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Save, X } from 'lucide-react';
import type { GrammaticalType } from '@/lib/api/types';

interface SentenceAnalysisEditorProps {
  component: {
    text: string;
    type: GrammaticalType;
    explanation: string;
  };
  onSave: (updatedComponent: {
    text: string;
    type: GrammaticalType;
    explanation: string;
  }) => void;
  onCancel: () => void;
}

export default function SentenceAnalysisEditor({
  component,
  onSave,
  onCancel
}: SentenceAnalysisEditorProps) {
  const [editedText, setEditedText] = useState(component.text);
  const [editedExplanation, setEditedExplanation] = useState(component.explanation);

  const handleSave = () => {
    if (!editedText.trim() || !editedExplanation.trim()) {
      return;
    }

    onSave({
      ...component,
      text: editedText.trim(),
      explanation: editedExplanation.trim()
    });
  };

  return (
    <div className="space-y-4 p-4 bg-muted rounded-lg">
      <div className="space-y-2">
        <label className="text-sm font-medium">文本内容</label>
        <Input
          value={editedText}
          onChange={(e) => setEditedText(e.target.value)}
          placeholder="输入文本内容"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">语法解释</label>
        <Textarea
          value={editedExplanation}
          onChange={(e) => setEditedExplanation(e.target.value)}
          placeholder="输入语法解释"
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onCancel}
          className="gap-2"
        >
          <X className="w-4 h-4" />
          取消
        </Button>
        <Button
          size="sm"
          onClick={handleSave}
          className="gap-2"
        >
          <Save className="w-4 h-4" />
          保存
        </Button>
      </div>
    </div>
  );
}