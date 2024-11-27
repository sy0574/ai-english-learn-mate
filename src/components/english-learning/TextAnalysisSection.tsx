import { ZoomIn, Headphones, Book, Mic, Type, LayoutDashboard, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const tabs = [
  { value: 'overview', icon: ZoomIn, label: '概述' },
  { value: 'listening', icon: Headphones, label: '听力' },
  { value: 'reading', icon: Book, label: '阅读' },
  { value: 'speaking', icon: Mic, label: '口语' },
  { value: 'grammar', icon: Type, label: '语法' }
];

const analysisButtons = [
  { icon: Type, label: '显示翻译' },
  { icon: ZoomIn, label: '显示大纲' },
  { icon: LayoutDashboard, label: '思维导图' },
  { icon: RefreshCw, label: '重新生成' }
];

export default function TextAnalysisSection() {
  return (
    <Card className="apple-card overflow-hidden">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full justify-start p-1 bg-[#F5F5F7] border-b border-[#D2D2D7]">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="
                px-4 py-2 rounded-lg text-[15px] font-medium
                data-[state=active]:bg-white 
                data-[state=active]:text-[#007AFF]
                data-[state=active]:shadow-sm
              "
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="overview" className="p-6 space-y-6">
          <div>
            <h3 className="text-xl font-semibold text-[#1D1D1F] mb-2">文本概述</h3>
            <p className="text-[#86868B] text-[15px]">分析您的英文文本，提供详细的语言见解。</p>
          </div>
          <div className="bg-[#F5F5F7] p-4 rounded-lg">
            <h4 className="font-medium mb-2 text-[#1D1D1F]">原文：</h4>
            <p className="text-[#86868B] text-[15px]">尚未提交文本。请输入一些文本并提交。</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {analysisButtons.map((button) => (
              <Button
                key={button.label}
                variant="outline"
                size="sm"
                className="apple-button-secondary"
              >
                <button.icon className="w-4 h-4 mr-2" />
                {button.label}
              </Button>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}