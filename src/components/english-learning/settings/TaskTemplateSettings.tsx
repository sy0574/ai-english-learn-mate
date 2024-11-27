import { useState } from 'react';
import { Plus, Pencil, Trash2, Clock, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { TaskTemplate, TaskTemplateInput, TaskPriority } from '@/lib/types/taskTemplate';
import { TaskTemplateManager } from '@/lib/api/taskTemplateManager';
import { AI_MODELS, ModelId } from '@/lib/config/aiModels';

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: '低',
  medium: '中',
  high: '高'
};

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: 'bg-blue-100 text-blue-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-red-100 text-red-800'
};

export default function TaskTemplateSettings() {
  const [templates, setTemplates] = useState<TaskTemplate[]>(() => {
    return TaskTemplateManager.getInstance().getAllTemplates();
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TaskTemplate | null>(null);

  const handleCreateTemplate = (input: TaskTemplateInput) => {
    try {
      TaskTemplateManager.getInstance().createTemplate(input);
      setTemplates(TaskTemplateManager.getInstance().getAllTemplates());
      toast.success('模板创建成功');
      return true;
    } catch (error) {
      toast.error('模板创建失败');
      return false;
    }
  };

  const handleUpdateTemplate = (id: string, updates: Partial<TaskTemplateInput>) => {
    try {
      TaskTemplateManager.getInstance().updateTemplate(id, updates);
      setTemplates(TaskTemplateManager.getInstance().getAllTemplates());
      toast.success('模板更新成功');
      return true;
    } catch (error) {
      toast.error('模板更新失败');
      return false;
    }
  };

  const handleDeleteTemplate = (id: string) => {
    try {
      if (TaskTemplateManager.getInstance().deleteTemplate(id)) {
        setTemplates(TaskTemplateManager.getInstance().getAllTemplates());
        toast.success('模板删除成功');
      }
    } catch (error) {
      toast.error('模板删除失败');
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">任务模板配置</h3>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              新建模板
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {isEditing ? '编辑任务模板' : '新建任务模板'}
              </DialogTitle>
            </DialogHeader>
            <TemplateForm
              initialData={editingTemplate}
              onSubmit={(data) => {
                const success = editingTemplate
                  ? handleUpdateTemplate(editingTemplate.id, data)
                  : handleCreateTemplate(data);
                if (success) {
                  setIsEditing(false);
                  setEditingTemplate(null);
                }
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {templates.map((template) => (
          <Card key={template.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">{template.name}</h4>
                  <Badge variant="secondary" className={PRIORITY_COLORS[template.priority]}>
                    {PRIORITY_LABELS[template.priority]}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{template.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setIsEditing(true);
                    setEditingTemplate(template);
                  }}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive"
                  onClick={() => handleDeleteTemplate(template.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {template.timeoutMs / 1000}秒
              </div>
              <div className="flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" />
                {AI_MODELS[template.modelId].name}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </Card>
  );
}

interface TemplateFormProps {
  initialData?: TaskTemplate | null;
  onSubmit: (data: TaskTemplateInput) => void;
}

function TemplateForm({ initialData, onSubmit }: TemplateFormProps) {
  const [formData, setFormData] = useState<TaskTemplateInput>(() => {
    if (initialData) {
      return {
        name: initialData.name,
        description: initialData.description,
        priority: initialData.priority,
        timeoutMs: initialData.timeoutMs,
        modelId: initialData.modelId,
        systemPrompt: initialData.systemPrompt,
        userPromptTemplate: initialData.userPromptTemplate,
        responseFormat: initialData.responseFormat,
      };
    }
    return {
      name: '',
      description: '',
      priority: 'medium',
      timeoutMs: 30000,
      modelId: Object.keys(AI_MODELS)[0] as ModelId,
      systemPrompt: '',
      userPromptTemplate: '',
      responseFormat: {
        type: 'json'
      },
    };
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>模板名称</Label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="输入模板名称"
          required
        />
      </div>

      <div className="space-y-2">
        <Label>描述</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="输入模板描述"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>优先级</Label>
          <Select
            value={formData.priority}
            onValueChange={(value: TaskPriority) =>
              setFormData({ ...formData, priority: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>超时时间（毫秒）</Label>
          <Input
            type="number"
            min="1000"
            step="1000"
            value={formData.timeoutMs}
            onChange={(e) =>
              setFormData({ ...formData, timeoutMs: parseInt(e.target.value) })
            }
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>AI 模型</Label>
        <Select
          value={formData.modelId}
          onValueChange={(value: ModelId) =>
            setFormData({ ...formData, modelId: value })
          }
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
      </div>

      <div className="space-y-2">
        <Label>系统提示词</Label>
        <Textarea
          value={formData.systemPrompt}
          onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
          placeholder="输入系统提示词"
          required
        />
      </div>

      <div className="space-y-2">
        <Label>用户提示词模板</Label>
        <Textarea
          value={formData.userPromptTemplate}
          onChange={(e) =>
            setFormData({ ...formData, userPromptTemplate: e.target.value })
          }
          placeholder="输入用户提示词模板，使用 {{变量名}} 表示变量"
          required
        />
      </div>

      <div className="space-y-2">
        <Label>响应格式</Label>
        <Select
          value={formData.responseFormat.type}
          onValueChange={(value: 'json' | 'text' | 'markdown') =>
            setFormData({
              ...formData,
              responseFormat: { ...formData.responseFormat, type: value },
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

      <div className="flex justify-end gap-2">
        <Button type="submit">
          {initialData ? '更新模板' : '创建模板'}
        </Button>
      </div>
    </form>
  );
}
