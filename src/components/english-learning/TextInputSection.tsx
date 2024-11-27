import { useState } from 'react';
import { PlayCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

export default function TextInputSection() {
  const [text, setText] = useState('');

  return (
    <Card className="apple-card">
      <CardContent className="p-6">
        <h3 className="text-xl font-semibold mb-4 text-[#1D1D1F]">输入英文文本</h3>
        <Textarea 
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="apple-input min-h-[200px] mb-6 text-[15px]"
          placeholder="在此输入或粘贴您的英文文本..."
        />
        <div className="flex flex-wrap gap-3">
          <Button className="apple-button-primary">
            提交文本
          </Button>
          <Button variant="outline" className="apple-button-secondary gap-2">
            <PlayCircle className="w-4 h-4" />
            朗读
          </Button>
          <Button variant="outline" className="apple-button-secondary gap-2">
            <RefreshCw className="w-4 h-4" />
            重置
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}