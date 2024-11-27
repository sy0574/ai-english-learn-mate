import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { PromptManager } from '@/lib/api/promptManager';
import { AnalysisTask, TASK_LABELS } from '@/types';
import { PromptTemplate } from '@/lib/config/promptTemplates';
import { OUTPUT_EXAMPLES } from '@/lib/config/outputExamples';

export default function PromptTemplateSettings() {
  const promptManager = PromptManager.getInstance();
  const [selectedTask, setSelectedTask] = useState<AnalysisTask | null>(null);
  const [template, setTemplate] = useState<PromptTemplate | null>(null);
  const [showExample, setShowExample] = useState(false);

  const handleTaskSelect = (task: AnalysisTask) => {
    setSelectedTask(task);
    setTemplate(promptManager.getPromptTemplate(task));
    setShowExample(false);
  };

  const handleTemplateUpdate = () => {
    if (!selectedTask || !template) return;

    try {
      promptManager.updatePromptTemplate(selectedTask, template);
      toast.success('提示词模板已更新');
    } catch (error) {
      toast.error('更新提示词模板失败');
    }
  };

  const resetToDefaults = () => {
    try {
      promptManager.resetToDefaults();
      if (selectedTask) {
        setTemplate(promptManager.getPromptTemplate(selectedTask));
      }
      toast.success('已重置为默认配置');
    } catch (error) {
      toast.error('重置配置失败');
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">提示词模板配置</h3>
          <Button variant="outline" onClick={resetToDefaults}>
            重置为默认
          </Button>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label>选择任务</Label>
            <Select
              value={selectedTask || ''}
              onValueChange={(value: AnalysisTask) => handleTaskSelect(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择要配置的任务" />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(TASK_LABELS) as [AnalysisTask, string][]).map(([task, label]) => (
                  <SelectItem key={task} value={task}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {template && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>模板名称</Label>
                <Input
                  value={template.name}
                  onChange={(e) => setTemplate({ ...template, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>描述</Label>
                <Textarea
                  value={template.description}
                  onChange={(e) => setTemplate({ ...template, description: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>系统提示词</Label>
                <Textarea
                  value={template.systemPrompt}
                  onChange={(e) => setTemplate({ ...template, systemPrompt: e.target.value })}
                  placeholder="输入系统提示词，用于定义AI助手的角色和行为"
                />
              </div>

              <div className="space-y-2">
                <Label>用户提示词模板</Label>
                <Textarea
                  value={template.userPromptTemplate}
                  onChange={(e) => setTemplate({ ...template, userPromptTemplate: e.target.value })}
                  placeholder="输入用户提示词模板，使用 {{变量名}} 表示变量"
                />
              </div>

              <div className="space-y-2">
                <Label>输出格式</Label>
                <Select
                  value={template.outputFormat.type}
                  onValueChange={(value: 'json' | 'text' | 'markdown') =>
                    setTemplate({
                      ...template,
                      outputFormat: { ...template.outputFormat, type: value }
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="json">JSON</SelectItem>
                    <SelectItem value="text">纯文本</SelectItem>
                    <SelectItem value="markdown">Markdown</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>输出格式案例</Label>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setShowExample(!showExample)}
                  >
                    {showExample ? '隐藏案例' : '查看案例'}
                  </Button>
                </div>
                {showExample && selectedTask && (
                  <Card className="p-4 bg-muted">
                    <pre className="text-sm overflow-auto">
                      {JSON.stringify(OUTPUT_EXAMPLES[selectedTask], null, 2)}
                    </pre>
                  </Card>
                )}
              </div>

              <Button onClick={handleTemplateUpdate}>保存更改</Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
