import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Brain } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import VocabularyAssessment from '../vocabulary/VocabularyAssessment';
import VocabularyProfile from '../vocabulary/VocabularyProfile';

export default function LearningProgress() {
  const [showAssessment, setShowAssessment] = useState(false);
  const [hasCompletedAssessment, setHasCompletedAssessment] = useState(false);

  const handleAssessmentComplete = () => {
    setHasCompletedAssessment(true);
    setShowAssessment(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">个人学情</h2>
        <Dialog open={showAssessment} onOpenChange={setShowAssessment}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Brain className="w-4 h-4" />
              {hasCompletedAssessment ? '重新评估' : '词汇评估'}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>词汇量评估</DialogTitle>
            </DialogHeader>
            <VocabularyAssessment onComplete={handleAssessmentComplete} />
          </DialogContent>
        </Dialog>
      </div>

      {hasCompletedAssessment ? (
        <VocabularyProfile />
      ) : (
        <div className="text-center py-12 space-y-4">
          <Brain className="w-12 h-12 mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">
            完成词汇评估后，这里将显示您的详细学习数据
          </p>
          <Button
            onClick={() => setShowAssessment(true)}
            variant="outline"
            className="gap-2"
          >
            <Brain className="w-4 h-4" />
            开始评估
          </Button>
        </div>
      )}
    </div>
  );
}