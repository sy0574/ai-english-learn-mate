import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AIModelSettings from '../english-learning/settings/AIModelSettings';
import PromptTemplateSettings from '../english-learning/settings/PromptTemplateSettings';
import TaskTemplateSettings from '../english-learning/settings/TaskTemplateSettings';
import AccountSettings from './AccountSettings';

export default function SettingsPage() {
  return (
    <div className="container mx-auto py-6">
      <h2 className="text-2xl font-bold mb-6">系统设置</h2>
      <Tabs defaultValue="account">
        <TabsList>
          <TabsTrigger value="account">账户信息</TabsTrigger>
          <TabsTrigger value="ai-models">AI 模型</TabsTrigger>
          <TabsTrigger value="prompts">提示词模板</TabsTrigger>
          <TabsTrigger value="task-templates">任务模板</TabsTrigger>
        </TabsList>
        <TabsContent value="account">
          <AccountSettings />
        </TabsContent>
        <TabsContent value="ai-models">
          <AIModelSettings />
        </TabsContent>
        <TabsContent value="prompts">
          <PromptTemplateSettings />
        </TabsContent>
        <TabsContent value="task-templates">
          <TaskTemplateSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
