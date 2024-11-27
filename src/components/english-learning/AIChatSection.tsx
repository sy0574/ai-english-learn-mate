import { useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface Message {
  role: 'assistant' | 'user';
  content: string;
}

export default function AIChatSection() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hi there! I\'m Cari, your English teacher. How can I help you with your English learning today?'
    }
  ]);
  const [userInput, setUserInput] = useState('');

  const handleSendMessage = () => {
    if (userInput.trim()) {
      setMessages([...messages, { role: 'user', content: userInput }]);
      setUserInput('');
      setTimeout(() => {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: 'Thank you for your message. How else can I assist you with your English learning?' 
        }]);
      }, 1000);
    }
  };

  return (
    <Card className="apple-card h-[calc(100vh-8rem)] flex flex-col">
      <CardContent className="flex-grow flex flex-col p-0">
        <div className="p-4 border-b border-[#D2D2D7]">
          <h3 className="text-xl font-semibold text-[#1D1D1F] mb-1">AI 学习助手</h3>
          <p className="text-[#86868B] text-[15px]">
            随时为您解答语言学习问题
          </p>
        </div>
        <ScrollArea className="flex-grow px-4 py-6">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`
                mb-4 p-3 rounded-2xl max-w-[85%] text-[15px]
                ${message.role === 'assistant' 
                  ? 'bg-[#F5F5F7] text-[#1D1D1F] mr-auto' 
                  : 'bg-[#007AFF] text-white ml-auto'
                }
              `}
            >
              {message.content}
            </div>
          ))}
        </ScrollArea>
        <Separator className="bg-[#D2D2D7]" />
        <div className="p-4">
          <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex gap-2">
            <Input
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="输入您的问题..."
              className="apple-input flex-grow text-[15px]"
            />
            <Button 
              type="submit" 
              size="icon"
              className="apple-button-primary !p-2.5"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}