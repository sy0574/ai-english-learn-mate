import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  BookOpen,
  Settings,
  Crown,
  BarChart,
  MessageSquare,
} from 'lucide-react';
import { EdgeTTS } from '@/components/EdgeTTS';
import { useState } from 'react';

export default function HomePage() {
  const [selectedText, setSelectedText] = useState('');

  // 处理文本选择
  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection) {
      const text = selection.toString().trim();
      if (text) {
        setSelectedText(text);
      }
    }
  };

  return (
    <div className="container mx-auto py-12" onMouseUp={handleTextSelection}>
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">AI Copilot, LearnMate</h1>
        <p className="text-xl text-muted-foreground mb-8">
          更高效、更有趣地持续学习！
        </p>
        <div className="max-w-2xl mx-auto p-6 bg-muted rounded-lg">
          <h3 className="text-lg font-semibold mb-4">我们一起：</h3>
          <p className="text-left mb-4">
            Hi! This is Carl. Welcome to LearnMate, an AI English Learning copilot. In the past, we used to learn to do the work, now, learning is the work.
          </p>
          <p className="text-left">
          嗨！我是Carl老师。欢迎来到LearnMate👫，一个有灵魂的AI学习伙伴。过去，我们学习是为了工作，现在，学习就是工作。
          </p>
        </div>
      </div>

      {selectedText && (
        <div className="fixed bottom-4 right-4 z-50">
          <Card className="p-4">
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                已选择文本：{selectedText.length > 20 ? selectedText.slice(0, 20) + '...' : selectedText}
              </span>
              <EdgeTTS
                text={selectedText}
                onStart={() => console.log('开始播放')}
                onEnd={() => console.log('播放结束')}
              />
            </div>
          </Card>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex flex-col items-center text-center">
            <MessageSquare className="w-12 h-12 text-primary mb-4" />
            <h2 className="text-xl font-semibold mb-2">AI对话练习</h2>
            <p className="text-muted-foreground mb-4">
              与AI进行自然对话，提升口语和写作能力
            </p>
            <Link to="/practice">
              <Button>开始练习</Button>
            </Link>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex flex-col items-center text-center">
            <BarChart className="w-12 h-12 text-primary mb-4" />
            <h2 className="text-xl font-semibold mb-2">学习进度</h2>
            <p className="text-muted-foreground mb-4">
              查看学习数据分析和进度追踪
            </p>
            <Link to="/progress">
              <Button>查看进度</Button>
            </Link>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex flex-col items-center text-center">
            <Crown className="w-12 h-12 text-primary mb-4" />
            <h2 className="text-xl font-semibold mb-2">会员中心</h2>
            <p className="text-muted-foreground mb-4">
              解锁更多高级功能和学习资源
            </p>
            <Link to="/member-center">
              <Button>了解更多</Button>
            </Link>
          </div>
        </Card>
      </div>

      <div className="mt-12 text-center">
        <h2 className="text-2xl font-bold mb-6">快速导航</h2>
        <div className="flex justify-center gap-4">
          <Link to="/settings">
            <Button variant="outline" className="gap-2">
              <Settings className="w-4 h-4" />
              系统设置
            </Button>
          </Link>
          <Link to="/courses">
            <Button variant="outline" className="gap-2">
              <BookOpen className="w-4 h-4" />
              课程中心
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
