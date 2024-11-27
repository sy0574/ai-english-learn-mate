import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MultiSelect } from '@/components/ui/multi-select';
import { ModelConfig, ModelId } from '@/lib/config/aiModels';

interface ModelConfigPanelProps {
  _modelId: ModelId;
  config: ModelConfig;
  onConfigChange: (newConfig: ModelConfig) => void;
}

export function ModelConfigPanel({
  _modelId,
  config,
  onConfigChange
}: ModelConfigPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{config.name}</CardTitle>
        <CardDescription>配置 {config.provider} 模型参数</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label>上下文窗口大小</Label>
            <Input 
              type="number" 
              value={config.contextWindow}
              onChange={(e) => {
                onConfigChange({
                  ...config,
                  contextWindow: parseInt(e.target.value)
                });
              }}
            />
          </div>
          <div>
            <Label>每千字成本</Label>
            <Input 
              type="number"
              step="0.001" 
              value={config.costPer1kTokens}
              onChange={(e) => {
                onConfigChange({
                  ...config,
                  costPer1kTokens: parseFloat(e.target.value)
                });
              }}
            />
          </div>
          <div>
            <Label>特长领域</Label>
            <MultiSelect
              values={config.strengthAreas}
              onChange={(values) => {
                onConfigChange({
                  ...config,
                  strengthAreas: values
                });
              }}
              options={[
                "multilingual",
                "fast responses",
                "secure processing",
                "complex reasoning",
                "nuanced understanding",
                "detailed analysis",
                "academic writing"
              ]}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
