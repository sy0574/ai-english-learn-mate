import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AIModelManager } from '@/lib/api/aiModelManager';
import { AI_MODELS, DEFAULT_MODEL_ASSIGNMENTS, type AnalysisTask, type ModelId } from '@/lib/config/aiModels';
import { toast } from 'sonner';
import { ModelConfigPanel } from './AIModelConfigPanel';

// 任务标签映射
const TASK_LABELS: Record<AnalysisTask, string> = {
  sentenceStructure: '句子结构分析',
  thematicAnalysis: '主题分析',
  vocabularyAnalysis: '词汇分析',
  backgroundKnowledge: '背景知识'
};

export default function AIModelSettings() {
  const modelManager = AIModelManager.getInstance();
  const [assignments, setAssignments] = useState<Record<AnalysisTask, ModelId>>(() => {
    const current: Partial<Record<AnalysisTask, ModelId>> = {};
    (Object.keys(DEFAULT_MODEL_ASSIGNMENTS) as AnalysisTask[]).forEach(task => {
      current[task] = modelManager.getModelForTask(task);
    });
    return current as Record<AnalysisTask, ModelId>;
  });

  const [selectedModelId, setSelectedModelId] = useState<ModelId | null>(null);

  const handleModelChange = (task: AnalysisTask, modelId: ModelId) => {
    try {
      modelManager.setModelForTask(task, modelId);
      setAssignments(prev => ({ ...prev, [task]: modelId }));
      toast.success(`已更新${TASK_LABELS[task]}的模型配置`);
    } catch (error) {
      toast.error('更新模型配置失败');
    }
  };

  const resetToDefaults = () => {
    try {
      Object.entries(DEFAULT_MODEL_ASSIGNMENTS).forEach(([task, modelId]) => {
        modelManager.setModelForTask(task as AnalysisTask, modelId);
      });
      setAssignments(DEFAULT_MODEL_ASSIGNMENTS);
      toast.success('已重置为默认配置');
    } catch (error) {
      toast.error('重置配置失败');
    }
  };

  const handleConfigChange = (modelId: ModelId, newConfig: typeof AI_MODELS[ModelId]) => {
    // 这里添加更新模型配置的逻辑
    console.log('更新模型配置:', modelId, newConfig);
    toast.success('模型配置已更新');
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">AI 模型配置</h3>
          <Button variant="outline" onClick={resetToDefaults}>
            重置为默认
          </Button>
        </div>

        <div className="space-y-6">
          {(Object.entries(TASK_LABELS) as [AnalysisTask, string][]).map(([task, label]) => (
            <div key={task} className="space-y-2">
              <label className="text-sm font-medium">{label}</label>
              <Select
                value={assignments[task]}
                onValueChange={(value: ModelId) => {
                  handleModelChange(task, value);
                  setSelectedModelId(value);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(AI_MODELS).map(([id, model]) => (
                    <SelectItem key={id} value={id}>
                      <div className="flex flex-col">
                        <span>{model.name}</span>
                        <span className="text-xs text-muted-foreground">
                          优势: {model.strengthAreas.join(', ')}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                当前模型: {AI_MODELS[assignments[task]].name} ({AI_MODELS[assignments[task]].provider})
              </p>
            </div>
          ))}
        </div>
      </Card>

      {selectedModelId && (
        <ModelConfigPanel
          modelId={selectedModelId}
          config={AI_MODELS[selectedModelId]}
          onConfigChange={(newConfig) => handleConfigChange(selectedModelId, newConfig)}
        />
      )}
    </div>
  );
}